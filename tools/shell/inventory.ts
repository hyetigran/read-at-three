import { createHash } from "node:crypto";
import { readdir, readFile, lstat, writeFile } from "node:fs/promises";
import { join, posix } from "node:path";
import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import {
  shellDescriptorPath,
  shellServiceWorkerPath,
  shellResourceMedia,
  type ShellPolicy,
  type ShellBody,
  type ShellResource,
} from "@readatthree/teaching";

function literal(value: unknown): string | undefined {
  if (!value || typeof value !== "object" || !("type" in value)) return;
  if (
    value.type === "StringLiteral" &&
    "value" in value &&
    typeof value.value === "string"
  )
    return value.value;
  if (
    value.type === "TemplateLiteral" &&
    "expressions" in value &&
    Array.isArray(value.expressions) &&
    value.expressions.length === 0 &&
    "quasis" in value &&
    Array.isArray(value.quasis) &&
    value.quasis.length === 1
  ) {
    const part: unknown = value.quasis[0];
    if (
      part &&
      typeof part === "object" &&
      "value" in part &&
      part.value &&
      typeof part.value === "object" &&
      "cooked" in part.value &&
      typeof part.value.cooked === "string"
    )
      return part.value.cooked;
  }
}
type ParserStatement = ReturnType<typeof parse>["program"]["body"][number];
type ParserExpression = Extract<
  ParserStatement,
  { type: "ExpressionStatement" }
>["expression"];
type ConstructorArgument =
  | Extract<ParserExpression, { type: "NewExpression" }>["arguments"][number]
  | undefined;
function importMetaBase(value: ConstructorArgument): boolean {
  if (
    value?.type === "BinaryExpression" &&
    value.operator === "+" &&
    literal(value.left) === ""
  )
    return importMetaBase(value.right);
  return (
    value?.type === "MemberExpression" &&
    !value.computed &&
    value.object.type === "MetaProperty" &&
    value.object.meta.name === "import" &&
    value.object.property.name === "meta" &&
    value.property.type === "Identifier" &&
    value.property.name === "url"
  );
}
function workerMember(
  value: Extract<ParserExpression, { type: "MemberExpression" }>,
): boolean {
  const name = value.computed
    ? literal(value.property)
    : value.property.type === "Identifier"
      ? value.property.name
      : undefined;
  return (
    value.object.type === "Identifier" &&
    ["globalThis", "window", "self"].includes(value.object.name) &&
    (name === "Worker" || name === "SharedWorker")
  );
}
function viteResolver(source: string): boolean {
  return /^function[$\w]+\(([$\w]+)\)\{returnimport\.meta\.resolve\?newURL\(import\.meta\.resolve\(\1\)\):newURL\(\1,import\.meta\.url\)\}$/.test(
    source.replace(/\s+/g, ""),
  );
}

export async function closeEmittedViteResolvers(
  directory: string,
): Promise<void> {
  const paths: string[] = [];
  async function walk(prefix: string): Promise<void> {
    for (const entry of await readdir(join(directory, prefix), {
      withFileTypes: true,
    })) {
      const path = prefix + entry.name;
      if (entry.isSymbolicLink())
        throw new Error(`Symlink in shell output ${path}`);
      if (entry.isDirectory()) await walk(path + "/");
      else if (entry.isFile()) paths.push(path);
    }
  }
  await walk("");
  paths.sort();
  for (const path of paths.filter((path) => /\.m?js$/.test(path))) {
    let source = await readFile(join(directory, path), "utf8");
    const edits: { start: number; end: number; code: string }[] = [];
    traverse(parse(source, { sourceType: "module" }), {
      FunctionDeclaration(node) {
        const { start, end, id } = node.node;
        if (
          start == null ||
          end == null ||
          !id ||
          !viteResolver(source.slice(start, end))
        )
          return;
        const cases = paths
          .map((target) => {
            const relative = posix.relative(posix.dirname(path), target);
            const local = relative.startsWith(".") ? relative : "./" + relative;
            return `case ${JSON.stringify("/" + target)}:case ${JSON.stringify(local)}:return new URL(${JSON.stringify(local)},import.meta.url);`;
          })
          .join("");
        edits.push({
          start,
          end,
          code: `function ${id.name}(specifier){switch(specifier){${cases}default:throw new Error("Undeclared shell dependency")}}`,
        });
      },
    });
    for (const edit of edits.sort((a, b) => b.start - a.start))
      source = source.slice(0, edit.start) + edit.code + source.slice(edit.end);
    if (edits.length) await writeFile(join(directory, path), source);
  }
}

export async function inventoryShell(
  input: Readonly<{ directory: string; policy: ShellPolicy }>,
): Promise<ShellBody> {
  const paths: string[] = [];
  async function walk(directory: string, prefix: string): Promise<void> {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      const path = prefix + entry.name;
      if (
        entry.isSymbolicLink() ||
        (await lstat(join(directory, entry.name))).isSymbolicLink()
      )
        throw new Error(`Symlink in shell output ${path}`);
      if (entry.isDirectory())
        await walk(join(directory, entry.name), path + "/");
      else if (entry.isFile()) paths.push(path);
      else throw new Error(`Non-file shell output ${path}`);
    }
  }
  await walk(input.directory, "");
  if (paths.includes(shellDescriptorPath))
    throw new Error(
      "Inventory requires fresh output without a prior descriptor",
    );
  paths.sort();
  function reference(from: string, raw: string): void {
    if (!raw || raw.startsWith("data:") || raw.startsWith("#")) return;
    if (/^[A-Za-z][A-Za-z0-9+.-]*:/.test(raw) || raw.startsWith("//"))
      throw new Error(`External runtime reference in ${from}`);
    const pathname = raw.split(/[?#]/, 1)[0];
    if (!pathname || pathname.includes("%") || pathname.includes("\\"))
      throw new Error(`Noncanonical runtime reference in ${from}`);
    const path = pathname.startsWith("/")
      ? pathname.slice(1)
      : posix.normalize(posix.join(posix.dirname(from), pathname));
    if (!paths.includes(path))
      throw new Error(`Missing runtime dependency ${path} from ${from}`);
  }
  const resources: ShellResource[] = [];
  for (const path of paths) {
    const bytes = await readFile(join(input.directory, path));
    const mediaType = shellResourceMedia(path);
    resources.push({
      path,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      byteLength: bytes.length,
      mediaType,
    });
    if (mediaType === "text/html") {
      const text = bytes.toString("utf8");
      for (const match of text.matchAll(
        /\b(?:src|href)\s*=\s*["']([^"']+)["']/g,
      ))
        if (match[1]) reference(path, match[1]);
    } else if (mediaType === "text/css") {
      for (const match of bytes
        .toString("utf8")
        .matchAll(/(?:url\(\s*["']?([^\s"')]+)|@import\s+["']([^"']+))/g)) {
        const value = match[1] ?? match[2];
        if (value) reference(path, value);
      }
    } else if (mediaType === "application/javascript") {
      const source = bytes.toString("utf8");
      const ast = parse(source, { sourceType: "module" });
      traverse(ast, {
        StringLiteral(node) {
          if (
            /^(?:\.\/|\.\.\/|\/)?assets\/[A-Za-z0-9_./-]+\.(?:js|mjs|css|woff2?|ttf|wasm|png|webp|svg)$/.test(
              node.node.value,
            )
          )
            reference(
              path,
              node.node.value.startsWith("assets/")
                ? "/" + node.node.value
                : node.node.value,
            );
        },
        ImportDeclaration(node) {
          reference(path, node.node.source.value);
        },
        ExportNamedDeclaration(node) {
          if (node.node.source) reference(path, node.node.source.value);
        },
        ExportAllDeclaration(node) {
          reference(path, node.node.source.value);
        },
        ImportExpression(node) {
          const value = literal(node.node.source);
          if (value !== undefined) reference(path, value);
        },
        NewExpression(node) {
          const callee = node.node.callee;
          if (
            (callee.type === "Identifier" &&
              ["Worker", "SharedWorker"].includes(callee.name)) ||
            (callee.type === "MemberExpression" && workerMember(callee))
          ) {
            let entry = node.node.arguments[0];
            if (entry?.type === "Identifier") {
              const binding = node.scope.getBinding(entry.name);
              if (binding?.constant && binding.path.isVariableDeclarator())
                entry = binding.path.node.init ?? undefined;
            }
            const target = literal(entry);
            if (target?.startsWith("/")) reference(path, target);
          }
          if (
            node.node.callee.type === "Identifier" &&
            node.node.callee.name === "URL"
          ) {
            const [value, base] = node.node.arguments;
            if (importMetaBase(base)) {
              const target = literal(value);
              if (target === undefined) {
                const helper = node.findParent((parent) =>
                  parent.isFunctionDeclaration(),
                );
                if (
                  helper?.isFunctionDeclaration() &&
                  helper.node.id &&
                  helper.node.start != null &&
                  helper.node.end != null &&
                  viteResolver(source.slice(helper.node.start, helper.node.end))
                ) {
                  const binding = helper.scope.parent?.getBinding(
                    helper.node.id.name,
                  );
                  if (!binding || !binding.constant)
                    throw new Error(`Escaped resolver dependency ${path}`);
                  for (const use of binding.referencePaths) {
                    const call = use.parentPath;
                    if (
                      !call?.isCallExpression() ||
                      call.node.callee !== use.node ||
                      call.node.arguments.length !== 1
                    )
                      throw new Error(`Escaped resolver dependency ${path}`);
                    const argument = literal(call.node.arguments[0]);
                    if (argument === undefined)
                      throw new Error(`Computed resolver dependency ${path}`);
                    reference(path, argument);
                  }
                  return;
                }
                return;
              }
              reference(path, target);
            }
          }
        },
        CallExpression(node) {
          if (
            node.node.callee.type === "Identifier" &&
            node.node.callee.name === "fetch"
          ) {
            const value = node.node.arguments[0];
            const target = literal(value);
            if (target !== undefined) reference(path, target);
          }
        },
      });
    }
  }
  const navigation = resources.find((entry) => entry.path === "index.html");
  const serviceWorker = resources.find(
    (entry) => entry.path === shellServiceWorkerPath(input.policy),
  );
  if (!navigation || !serviceWorker)
    throw new Error("Shell needs emitted HTML and service worker");
  return {
    formatVersion: 1,
    applicationVersion: input.policy.applicationVersion,
    bootstrapPolicyVersion: 1,
    mode: input.policy.mode,
    navigation,
    serviceWorker,
    resources: resources.filter(
      (entry) => entry !== navigation && entry !== serviceWorker,
    ),
  };
}
