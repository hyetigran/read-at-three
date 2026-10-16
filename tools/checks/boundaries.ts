import { readdir, readFile } from "node:fs/promises";
import { dirname, join, resolve, relative } from "node:path";
import { parse } from "@babel/parser";
import traverse from "@babel/traverse";

const root = resolve(import.meta.dirname, "../..");
const errors: string[] = [];
async function files(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const groups = await Promise.all(
    entries.map((entry) =>
      entry.isDirectory()
        ? files(join(directory, entry.name))
        : Promise.resolve([join(directory, entry.name)]),
    ),
  );
  return groups.flat();
}
const forbiddenGlobals = new Set([
  "window",
  "document",
  "navigator",
  "Worker",
  "localStorage",
  "indexedDB",
  "fetch",
  "TextEncoder",
  "TextDecoder",
  "structuredClone",
]);
for (const file of await files(join(root, "packages"))) {
  if (!/\.[jt]s$/.test(file)) continue;
  const source = parse(await readFile(file, "utf8"), {
    sourceType: "module",
    plugins: ["typescript"],
  });
  const owner = relative(join(root, "packages"), file).split("/")[0];
  function dependency(name: unknown) {
    if (typeof name !== "string")
      throw new Error("Shared imports must have literal module names.");
    if (
      /^(node:|react($|\/)|react-dom|react-native|expo($|[-/])|@tanstack\/|vite($|\/))/.test(
        name,
      )
    )
      errors.push(`${relative(root, file)} imports platform code: ${name}`);
    if (name.startsWith(".")) {
      const target = resolve(dirname(file), name);
      const targetOwner = relative(join(root, "packages"), target).split(
        "/",
      )[0];
      if (targetOwner !== owner && !target.endsWith("/src/index.ts"))
        errors.push(
          `${relative(root, file)} reaches another package's internals: ${name}`,
        );
    }
  }
  traverse(source, {
    ImportDeclaration(path) {
      dependency(path.node.source.value);
    },
    ExportNamedDeclaration(path) {
      if (path.node.source) dependency(path.node.source.value);
    },
    ExportAllDeclaration(path) {
      dependency(path.node.source.value);
    },
    ImportExpression(path) {
      if (path.node.source.type !== "StringLiteral")
        throw new Error("Computed imports are forbidden in shared packages.");
      dependency(path.node.source.value);
    },
    ReferencedIdentifier(path) {
      if (
        forbiddenGlobals.has(path.node.name) &&
        !path.scope.hasBinding(path.node.name)
      )
        errors.push(
          `${relative(root, file)} uses a platform global: ${path.node.name}`,
        );
    },
  });
}
for (const path of [
  "package.json",
  "apps/web/package.json",
  "packages/teaching/package.json",
  "packages/storage/package.json",
]) {
  const manifest: unknown = JSON.parse(
    await readFile(join(root, path), "utf8"),
  );
  if (typeof manifest !== "object" || manifest === null)
    throw new Error("Invalid package manifest");
  for (const section of Object.values(manifest))
    if (typeof section === "object" && section !== null)
      for (const name of Object.keys(section))
        if (
          name === "eslint" ||
          name.startsWith("eslint-") ||
          name.startsWith("@eslint/")
        )
          errors.push(`${path} introduces ESLint`);
}
if (errors.length) throw new Error(errors.join("\n"));
process.stdout.write(
  "Portable package boundaries and no-ESLint checks passed.\n",
);
