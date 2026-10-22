import {
  createHash,
  createPrivateKey,
  createPublicKey,
  sign,
  verify,
} from "node:crypto";
import {
  readFile,
  mkdir,
  mkdtemp,
  rm,
  writeFile,
  lstat,
} from "node:fs/promises";
import { resolve, join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import { build } from "vite";
import {
  Ajv as AjvJTD,
  type JTDDataType,
  type SomeJTDSchemaType,
} from "ajv/dist/jtd.js";
import {
  canonical,
  parseId,
  parsePublicationHash,
  requireEd25519Spki,
  publicationUtf8,
  shellDescriptorPath,
  shellServiceWorkerPath,
  verifyShellDescriptor,
  type PublicationCrypto,
  type ShellPolicy,
} from "@readatthree/teaching";
import { inventoryShell, closeEmittedViteResolvers } from "./inventory.ts";
import type { BrowserConfiguration } from "../../apps/web/src/platform/browser-configuration.ts";
import {
  shellResponsePolicy,
  shellHostingPolicyPath,
} from "../../apps/web/src/platform/shell-response-policy.ts";
async function inspectCompilerFiles(
  compilation: Awaited<ReturnType<typeof build>>,
  directory: string,
): Promise<void> {
  for (const result of Array.isArray(compilation)
    ? compilation
    : [compilation]) {
    if (!("output" in result))
      throw new Error("Signed shell requires a completed compiler output");
    for (const emitted of result.output) {
      const paths =
        emitted.type === "chunk"
          ? [emitted.fileName, ...emitted.imports, ...emitted.dynamicImports]
          : [emitted.fileName];
      for (const path of paths) {
        if (
          path.startsWith("/") ||
          path.split("/").some((part) => part === "..")
        )
          throw new Error("External compiler dependency");
        const file = await lstat(join(directory, path));
        if (!file.isFile() || file.isSymbolicLink())
          throw new Error(`Missing compiler output ${path}`);
      }
    }
  }
}
const text = { type: "string" } satisfies SomeJTDSchemaType;
const modes: ("fixture" | "publication")[] = ["fixture", "publication"];
const schema = {
  properties: {
    mode: { enum: modes },
    applicationVersion: text,
    signingKeyId: text,
    privateKeyPath: text,
    keys: { elements: { properties: { id: text, spkiHex: text } } },
    installation: {
      properties: {
        courseId: text,
        publicationKeys: {
          elements: { properties: { id: text, spkiHex: text } },
        },
      },
      optionalProperties: {
        initialTarget: {
          properties: { publicationHash: text, releaseId: text },
        },
        offer: { properties: { publicationHash: text, releaseId: text } },
      },
    },
    publicationApprovals: {
      elements: { properties: { path: text, sha256: text } },
    },
  },
} satisfies SomeJTDSchemaType;
type Config = JTDDataType<typeof schema>;
const validate = new AjvJTD().compile<Config>(schema);
export function parseShellBuildConfiguration(raw: unknown) {
  if (!validate(raw))
    throw new Error("Invalid explicit shell build configuration");
  const keys = (entries: Config["keys"]) => {
    if (
      !entries.length ||
      new Set(entries.map((key) => key.id)).size !== entries.length
    )
      throw new Error("Explicit unique trusted Ed25519 keys required");
    return entries.map((key) => {
      parseId({ kind: "review", value: key.id });
      if (!/^[a-f0-9]{88}$/.test(key.spkiHex))
        throw new Error("Explicit trusted Ed25519 keys required");
      const spki = Uint8Array.from(Buffer.from(key.spkiHex, "hex"));
      requireEd25519Spki(spki);
      return { id: key.id, spki };
    });
  };
  const browser: Extract<BrowserConfiguration, { kind: "installed" }> = {
    kind: "installed",
    courseId: parseId({ kind: "course", value: raw.installation.courseId }),
    shell: {
      mode: raw.mode,
      applicationVersion: raw.applicationVersion,
      keys: keys(raw.keys),
    },
    publication: {
      mode: raw.mode,
      keys: keys(raw.installation.publicationKeys),
    },
    initialTarget: raw.installation.initialTarget
      ? {
          publicationHash: parsePublicationHash(
            raw.installation.initialTarget.publicationHash,
          ),
          releaseId: parseId({
            kind: "release",
            value: raw.installation.initialTarget.releaseId,
          }),
        }
      : null,
    ...(raw.installation.offer
      ? {
          offer: {
            publicationHash: parsePublicationHash(
              raw.installation.offer.publicationHash,
            ),
            releaseId: parseId({
              kind: "release",
              value: raw.installation.offer.releaseId,
            }),
          },
        }
      : {}),
  };
  return { config: raw, browser };
}
const root = resolve(import.meta.dirname, "../..");
const crypto: PublicationCrypto = {
  sha256: async (bytes) => createHash("sha256").update(bytes).digest(),
  verifyEd25519: async (input) =>
    verify(
      null,
      input.message,
      createPublicKey({
        key: Buffer.from(input.spki),
        format: "der",
        type: "spki",
      }),
      input.signature,
    ),
};
export async function buildSignedShell(
  input: Readonly<{
    configPath: string;
    outDir: string;
    applicationRoot?: string;
    viteConfig?: string | false;
  }>,
): Promise<Readonly<{ buildHash: string; files: number }>> {
  const { config, browser } = parseShellBuildConfiguration(
    JSON.parse(await readFile(input.configPath, "utf8")),
  );
  if (
    config.keys.length === 0 ||
    config.keys.some((key) => !/^[a-f0-9]{88}$/.test(key.spkiHex))
  )
    throw new Error("Explicit trusted Ed25519 keys required");
  if (config.mode === "fixture" && config.publicationApprovals.length)
    throw new Error("Fixture build cannot claim publication approval");
  if (config.mode === "publication") {
    if (config.publicationApprovals.length === 0)
      throw new Error("Publication requires separate approval records");
    for (const approval of config.publicationApprovals) {
      if (
        !/^[a-f0-9]{64}$/.test(approval.sha256) ||
        createHash("sha256")
          .update(
            await readFile(resolve(dirname(input.configPath), approval.path)),
          )
          .digest("hex") !== approval.sha256
      )
        throw new Error("Publication approval record mismatch");
    }
  }
  const policy: ShellPolicy = {
    mode: config.mode,
    applicationVersion: config.applicationVersion,
    keys: config.keys.map((key) => ({
      id: key.id,
      spki: Uint8Array.from(Buffer.from(key.spkiHex, "hex")),
    })),
  };
  const serviceWorkerPath = shellServiceWorkerPath(policy);
  const privateKey = createPrivateKey(
    await readFile(resolve(dirname(input.configPath), config.privateKeyPath)),
  );
  if (privateKey.asymmetricKeyType !== "ed25519")
    throw new Error("Ed25519 shell signing key required");
  const publicDer = createPublicKey(privateKey).export({
    format: "der",
    type: "spki",
  });
  if (
    !policy.keys.some(
      (key) =>
        key.id === config.signingKeyId &&
        publicDer.equals(Buffer.from(key.spki)),
    )
  )
    throw new Error("Shell signer does not match explicit trust policy");
  const workerDirectory = await mkdtemp(
    join(tmpdir(), "reading-shell-worker-"),
  );
  try {
    const trustedPolicy = {
      ...policy,
      keys: policy.keys.map((key) => ({
        id: key.id,
        spki: Array.from(key.spki),
      })),
    };
    const browserLiteral = JSON.stringify({
      ...browser,
      shell: trustedPolicy,
      publication: {
        ...browser.publication,
        keys: browser.publication.keys.map((key) => ({
          ...key,
          spki: Array.from(key.spki),
        })),
      },
    }).replace(/"spki":\[([^\]]*)\]/g, '"spki":Uint8Array.from([$1])');
    const literal = JSON.stringify(trustedPolicy).replace(
      /"spki":\[([^\]]*)\]/g,
      '"spki":Uint8Array.from([$1])',
    );
    const workerCompilation = await build({
      configFile: false,
      define: {
        __READING_SHELL_POLICY__: literal,
        __READING_BROWSER_CONFIGURATION__: browserLiteral,
      },
      build: {
        outDir: workerDirectory,
        emptyOutDir: true,
        lib: {
          entry: join(root, "apps/web/src/platform/shell-service.worker.ts"),
          formats: ["es"],
          fileName: () => "service-worker.js",
        },
        rollupOptions: { output: { inlineDynamicImports: true, minify: true } },
      },
    });
    await inspectCompilerFiles(workerCompilation, workerDirectory);
    const applicationCompilation = await build({
      mode: "signed-shell",
      configFile: input.viteConfig ?? join(root, "apps/web/vite.config.ts"),
      ...(input.applicationRoot ? { root: input.applicationRoot } : {}),
      define: {
        __READING_SHELL_POLICY__: literal,
        __READING_BROWSER_CONFIGURATION__: browserLiteral,
      },
      build: {
        outDir: resolve(input.outDir),
        emptyOutDir: true,
        assetsInlineLimit: 0,
      },
    });
    await inspectCompilerFiles(applicationCompilation, resolve(input.outDir));
    await mkdir(dirname(join(input.outDir, serviceWorkerPath)), {
      recursive: true,
    });
    await writeFile(
      join(input.outDir, serviceWorkerPath),
      await readFile(join(workerDirectory, "service-worker.js")),
    );
    await writeFile(
      join(input.outDir, shellHostingPolicyPath),
      JSON.stringify({ headers: shellResponsePolicy }),
    );
    await closeEmittedViteResolvers(input.outDir);
    const body = await inventoryShell({ directory: input.outDir, policy });
    const unsigned = {
      formatVersion: 1,
      body,
      buildHash: createHash("sha256")
        .update(publicationUtf8(canonical(body)))
        .digest("hex"),
      signingKeyId: config.signingKeyId,
    };
    const descriptor = {
      ...unsigned,
      signature: sign(
        null,
        publicationUtf8(canonical(unsigned)),
        privateKey,
      ).toString("base64url"),
    };
    const wire = publicationUtf8(canonical(descriptor));
    await verifyShellDescriptor({ raw: wire, policy, crypto });
    await writeFile(join(input.outDir, shellDescriptorPath), wire);
    return { buildHash: unsigned.buildHash, files: body.resources.length + 2 };
  } finally {
    await rm(workerDirectory, { recursive: true, force: true });
  }
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const args = process.argv.slice(2);
  if (
    args.length !== 4 ||
    args[0] !== "--config" ||
    args[2] !== "--out" ||
    !args[1] ||
    !args[3]
  )
    throw new Error(
      "Usage: build.ts --config EXPLICIT_CONFIG.json --out OWNED_OUTPUT",
    );
  const result = await buildSignedShell({
    configPath: resolve(args[1]),
    outDir: resolve(args[3]),
  });
  process.stdout.write(JSON.stringify(result) + "\n");
}
