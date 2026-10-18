import assert from "node:assert/strict";
import { test } from "node:test";
import {
  mkdtemp,
  mkdir,
  writeFile,
  rm,
  symlink,
  realpath,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import { join, dirname } from "node:path";
import {
  canonical,
  verifyShellDescriptor,
  verifyShellResource,
  ShellError,
  shellDescriptorPath,
  type ShellBody,
} from "@readatthree/teaching";
import {
  inventoryShell,
  closeEmittedViteResolvers,
} from "../../tools/shell/inventory.ts";
import {
  shellFixtureFiles,
  shellFixtureBody,
  signedShellFixture,
  shellFixturePolicy,
  shellFixtureCrypto,
} from "./fixtures/shell.ts";
const verify = (raw: Uint8Array = signedShellFixture()) =>
  verifyShellDescriptor({
    raw,
    policy: shellFixturePolicy,
    crypto: shellFixtureCrypto,
  });

test("detached signed shell binds exact HTML, service worker, lazy module and WASM bytes", async () => {
  const shell = await verify();
  assert.equal(
    shell.descriptor.body.serviceWorker.path,
    "_reading/sw-fixture-neutral-v1.js",
  );
  assert.equal(shell.descriptor.body.resources.length, 3);
  assert.equal(Object.isFrozen(shell.descriptor.body.navigation), true);
  for (const [path, bytes] of shellFixtureFiles)
    assert.equal(
      (
        await verifyShellResource({
          shell,
          path,
          bytes,
          crypto: shellFixtureCrypto,
        })
      ).path,
      path,
    );
  await assert.rejects(
    verifyShellResource({
      shell,
      path: shellDescriptorPath,
      bytes: signedShellFixture(),
      crypto: shellFixtureCrypto,
    }),
    (error) => error instanceof ShellError && error.failure.kind === "corrupt",
  );
  await assert.rejects(
    verifyShellResource({
      shell,
      path: "assets/lazy.js",
      bytes: Buffer.from("different bytes"),
      crypto: shellFixtureCrypto,
    }),
    ShellError,
  );
});
test("individually resigned shell schema, closure, path, policy and version violations are refused", async () => {
  const body = shellFixtureBody();
  const changes: unknown[] = [
    { ...body, extra: true },
    { ...body, formatVersion: 2 },
    { ...body, bootstrapPolicyVersion: 2 },
    { ...body, mode: "publication" },
    { ...body, applicationVersion: "other" },
    { ...body, navigation: { ...body.navigation, path: "other.html" } },
    { ...body, serviceWorker: { ...body.serviceWorker, path: "sw.js" } },
    { ...body, resources: [...body.resources, body.navigation] },
    {
      ...body,
      resources: [
        ...body.resources,
        { ...body.navigation, path: shellDescriptorPath },
      ],
    },
    { ...body, resources: [{ ...body.navigation, path: "../x.html" }] },
    {
      ...body,
      resources: [{ ...body.navigation, path: "_reading/download/x.html" }],
    },
    {
      ...body,
      navigation: { ...body.navigation, mediaType: "application/javascript" },
    },
    { ...body, navigation: { ...body.navigation, byteLength: 0 } },
    { ...body, navigation: { ...body.navigation, byteLength: 67108865 } },
  ];
  for (const changed of changes)
    await assert.rejects(verify(signedShellFixture(changed)), ShellError);
  for (const extra of [
    { formatVersion: 2 },
    { buildHash: "a".repeat(64) },
    { signingKeyId: "downloaded-key" },
    { unknown: true },
  ])
    await assert.rejects(verify(signedShellFixture(body, extra)), ShellError);
  await assert.rejects(
    verifyShellDescriptor({
      raw: signedShellFixture(),
      policy: { ...shellFixturePolicy, keys: [] },
      crypto: shellFixtureCrypto,
    }),
    ShellError,
  );
});
test("wire and signature corruption cannot cross shell authentication; crypto failure stays unavailable", async () => {
  await assert.rejects(
    verify(Buffer.from(" " + Buffer.from(signedShellFixture()).toString())),
    ShellError,
  );
  const raw = JSON.parse(Buffer.from(signedShellFixture()).toString());
  raw.signature = "A".repeat(86);
  await assert.rejects(verify(Buffer.from(canonical(raw))), ShellError);
  await assert.rejects(
    verifyShellDescriptor({
      raw: signedShellFixture(),
      policy: shellFixturePolicy,
      crypto: {
        ...shellFixtureCrypto,
        sha256: async () => {
          throw new Error("provider unavailable");
        },
      },
    }),
    (error) =>
      error instanceof ShellError &&
      error.failure.kind === "unavailable" &&
      error.failure.reason === "crypto",
  );
});
async function withOutput(run: (directory: string) => Promise<void>) {
  const directory = await mkdtemp(join(tmpdir(), "reading-shell-inventory-"));
  try {
    for (const [path, bytes] of shellFixtureFiles) {
      await mkdir(dirname(join(directory, path)), { recursive: true });
      await writeFile(join(directory, path), bytes);
    }
    await run(directory);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}
test("inventory derives every emitted file deterministically and checks literal dynamic closure", async () =>
  withOutput(async (directory) => {
    const first = await inventoryShell({
      directory,
      policy: shellFixturePolicy,
    });
    assert.deepEqual(
      first,
      await inventoryShell({ directory, policy: shellFixturePolicy }),
    );
    assert.deepEqual(
      [
        first.navigation.path,
        first.serviceWorker.path,
        ...first.resources.map((entry) => entry.path),
      ].sort(),
      Array.from(shellFixtureFiles.keys()).sort(),
    );
    assert.equal(
      (await verify(signedShellFixture(first))).descriptor.body.resources
        .length,
      3,
    );
    await rm(join(directory, "assets/lazy.js"));
    await assert.rejects(
      inventoryShell({ directory, policy: shellFixturePolicy }),
      /Missing runtime dependency assets\/lazy.js/,
    );
  }));
test("inventory refuses missing CSS/font/helper resources and unknown or symbolic outputs", async () => {
  for (const [path, text, pattern] of [
    [
      "index.html",
      '<link href="/assets/site.css">',
      /Missing runtime dependency/,
    ],
    [
      "assets/main.js",
      'new URL("./helper.js",import.meta.url)',
      /Missing runtime dependency/,
    ],
    ["assets/main.js", "import(x)", /Computed module dependency/],
    [
      "assets/main.js",
      'fetch("https://example.invalid/package.json")',
      /External runtime reference/,
    ],
  ] satisfies [string, string, RegExp][])
    await withOutput(async (directory) => {
      await writeFile(join(directory, path), text);
      await assert.rejects(
        inventoryShell({ directory, policy: shellFixturePolicy }),
        pattern,
      );
    });
  await withOutput(async (directory) => {
    await writeFile(
      join(directory, "assets/site.css"),
      '@font-face{src:url("./missing.woff2")}',
    );
    await assert.rejects(
      inventoryShell({ directory, policy: shellFixturePolicy }),
      /Missing runtime dependency/,
    );
  });
  await withOutput(async (directory) => {
    await writeFile(join(directory, "unknown.exe"), "x");
    await assert.rejects(
      inventoryShell({ directory, policy: shellFixturePolicy }),
      ShellError,
    );
  });
  await withOutput(async (directory) => {
    await symlink(join(directory, "index.html"), join(directory, "alias.html"));
    await assert.rejects(
      inventoryShell({ directory, policy: shellFixturePolicy }),
      /Symlink/,
    );
  });
});
test("descriptor cannot silently omit the signed service worker or exceed count and total budgets", async () => {
  const body = shellFixtureBody();
  const resource = body.resources[0];
  if (!resource) throw new Error("Missing fixture");
  const repeated: ShellBody = {
    ...body,
    resources: Array.from({ length: 2047 }, (_, i) => ({
      ...resource,
      path: `assets/${i}.js`,
    })),
  };
  await assert.rejects(verify(signedShellFixture(repeated)), ShellError);
  const total: ShellBody = {
    ...body,
    resources: Array.from({ length: 5 }, (_, i) => ({
      ...resource,
      path: `assets/${i}.js`,
      byteLength: 67108864,
    })),
  };
  await assert.rejects(verify(signedShellFixture(total)), ShellError);
});

test("inventory recognizes static templates and the exact generated Vite resolver while rejecting other computed URL dependencies", async () => {
  await withOutput(async (directory) => {
    await writeFile(
      join(directory, "assets/main.js"),
      "function resolve(specifier){return import.meta.resolve?new URL(import.meta.resolve(specifier)):new URL(specifier,import.meta.url)};import(`./lazy.js`);new URL(`./database.wasm`,import.meta.url);",
    );
    assert.equal(
      (await inventoryShell({ directory, policy: shellFixturePolicy }))
        .resources.length,
      3,
    );
    await rm(join(directory, "assets/database.wasm"));
    await assert.rejects(
      inventoryShell({ directory, policy: shellFixturePolicy }),
      /Missing runtime dependency/,
    );
  });
  await withOutput(async (directory) => {
    await writeFile(
      join(directory, "assets/main.js"),
      "function unknown(path){return new URL(path,import.meta.url)}",
    );
    await assert.rejects(
      inventoryShell({ directory, policy: shellFixturePolicy }),
      /Computed URL dependency/,
    );
  });
});

test("shell resource hash and exact metadata limits have positive and one-over controls", async () => {
  const shell = await verify();
  const original = shellFixtureFiles.get("assets/lazy.js");
  assert.ok(original);
  const changed = Uint8Array.from(original);
  changed[0] = 0;
  await assert.rejects(
    verifyShellResource({
      shell,
      path: "assets/lazy.js",
      bytes: changed,
      crypto: shellFixtureCrypto,
    }),
    ShellError,
  );
  const body = shellFixtureBody();
  const entry = body.resources[0];
  assert.ok(entry);
  const exactCount: ShellBody = {
    ...body,
    resources: Array.from({ length: 2046 }, (_, i) => ({
      ...entry,
      path: `assets/${i}.js`,
      byteLength: 1,
    })),
  };
  assert.equal(
    (await verify(signedShellFixture(exactCount))).descriptor.body.resources
      .length,
    2046,
  );
  const exactTotal: ShellBody = {
    ...body,
    navigation: { ...body.navigation, byteLength: 1 },
    serviceWorker: { ...body.serviceWorker, byteLength: 1 },
    resources: Array.from({ length: 4 }, (_, i) => ({
      ...entry,
      path: `assets/${i}.js`,
      byteLength: i === 3 ? 67108862 : 67108864,
    })),
  };
  assert.equal(
    (await verify(signedShellFixture(exactTotal))).descriptor.body.resources
      .length,
    4,
  );
  const last = exactTotal.resources[3];
  assert.ok(last);
  last.byteLength++;
  await assert.rejects(verify(signedShellFixture(exactTotal)), ShellError);
});

const resolver =
  "function resolve(specifier){return import.meta.resolve?new URL(import.meta.resolve(specifier)):new URL(specifier,import.meta.url)};";
test("resolver binding calls must be literal, present and unescaped", async () => {
  for (const source of [
    resolver + 'fetch(resolve("./missing.wasm"))',
    resolver + "fetch(resolve(globalThis.runtimePath))",
    resolver + 'const alias=resolve;fetch(alias("./database.wasm"))',
    resolver + "globalThis.resolver=resolve",
    resolver + 'resolve.call(null,"./database.wasm")',
    resolver + "resolve=(x)=>new URL(x,import.meta.url)",
  ])
    await withOutput(async (directory) => {
      await writeFile(join(directory, "assets/main.js"), source);
      await assert.rejects(
        inventoryShell({ directory, policy: shellFixturePolicy }),
        /dependency/,
      );
    });
  await withOutput(async (directory) => {
    await writeFile(
      join(directory, "assets/main.js"),
      resolver + 'fetch(resolve("./database.wasm"))',
    );
    assert.equal(
      (await inventoryShell({ directory, policy: shellFixturePolicy }))
        .resources.length,
      3,
    );
    await rm(join(directory, "assets/database.wasm"));
    await assert.rejects(
      inventoryShell({ directory, policy: shellFixturePolicy }),
      /Missing runtime dependency/,
    );
  });
});
test("emitted Vite resolver has a closed file map and no arbitrary computed URL", async () =>
  withOutput(async (directory) => {
    await writeFile(
      join(directory, "assets/main.js"),
      resolver + "export {resolve};",
    );
    await closeEmittedViteResolvers(directory);
    assert.equal(
      (await inventoryShell({ directory, policy: shellFixturePolicy }))
        .resources.length,
      3,
    );
    const transformed = await import("node:fs/promises").then((fs) =>
      fs.readFile(join(directory, "assets/main.js"), "utf8"),
    );
    assert.match(transformed, /Undeclared shell dependency/);
    assert.doesNotMatch(transformed, /import\.meta\.resolve/);
    const runtime = await import(
      pathToFileURL(join(directory, "assets/main.js")).href
    );
    assert.equal(
      runtime.resolve("/assets/database.wasm").href,
      pathToFileURL(await realpath(join(directory, "assets/database.wasm")))
        .href,
    );
    assert.throws(
      () => runtime.resolve("./missing.wasm"),
      /Undeclared shell dependency/,
    );
    assert.throws(
      () => runtime.resolve("https://example.invalid/arbitrary.js"),
      /Undeclared shell dependency/,
    );
    await rm(join(directory, "assets/database.wasm"));
    await assert.rejects(
      inventoryShell({ directory, policy: shellFixturePolicy }),
      /Missing runtime dependency/,
    );
  }));
test("worker and shared-worker dependencies require declared static entry bytes", async () => {
  for (const source of [
    'new Worker("./missing-worker.js",{type:"module"})',
    'new SharedWorker("./missing-worker.js")',
    "new globalThis.Worker(globalThis.workerPath)",
    'const Entry=Worker;new Entry("./missing-worker.js")',
    'const Entry=globalThis.Worker;new Entry("./missing-worker.js")',
    'new globalThis["Worker"]("./missing-worker.js")',
    "new Worker(new URL(path,import.meta.url))",
    'let entry=new URL("./lazy.js",import.meta.url);entry=globalThis.path;new Worker(entry)',
    'new Worker(new URL("./lazy.js",location.origin))',
  ])
    await withOutput(async (directory) => {
      await writeFile(join(directory, "assets/main.js"), source);
      await assert.rejects(
        inventoryShell({ directory, policy: shellFixturePolicy }),
        /dependency/,
      );
    });
  for (const source of [
    'new Worker(new URL("./lazy.js",import.meta.url),{type:"module"})',
    'new window.Worker(new URL("./lazy.js",import.meta.url))',
    'new globalThis["SharedWorker"](new URL("./lazy.js",import.meta.url))',
    'new SharedWorker(new URL("./lazy.js",import.meta.url))',
    'const entry=new URL("./lazy.js",import.meta.url);new globalThis.Worker(entry)',
  ])
    await withOutput(async (directory) => {
      await writeFile(join(directory, "assets/main.js"), source);
      assert.equal(
        (await inventoryShell({ directory, policy: shellFixturePolicy }))
          .resources.length,
        3,
      );
      await rm(join(directory, "assets/lazy.js"));
      await assert.rejects(
        inventoryShell({ directory, policy: shellFixturePolicy }),
        /Missing runtime dependency/,
      );
    });
});

test("document-relative Worker strings refuse regardless of existing module-relative bytes", async () => {
  for (const constructor of [
    "Worker",
    "SharedWorker",
    "window.Worker",
    'globalThis["SharedWorker"]',
  ]) {
    for (const entry of ['"./lazy.js"', '"/assets/lazy.js"', "`./lazy.js`"]) {
      for (const source of [
        `new ${constructor}(${entry})`,
        `const entry=${entry};new ${constructor}(entry)`,
      ])
        await withOutput(async (directory) => {
          await writeFile(join(directory, "assets/main.js"), source);
          await assert.rejects(
            inventoryShell({ directory, policy: shellFixturePolicy }),
            /worker dependency/,
          );
        });
    }
  }
});
test("Worker URL bindings reject every mutation, alias, method and escape reference", async () => {
  for (const constructor of ["Worker", "SharedWorker"]) {
    for (const use of [
      'entry.pathname="/missing.js";',
      'entry.search="?changed";',
      'entry.href="/missing.js";',
      'entry.searchParams.set("path","missing");',
      "entry.unknown();",
      "const alias=entry;",
      "consume(entry);",
      "globalThis.entry=entry;",
      "const object={entry};",
      'Object.assign(entry,{pathname:"/missing.js"});',
    ])
      await withOutput(async (directory) => {
        await writeFile(
          join(directory, "assets/main.js"),
          `const entry=new URL("./lazy.js",import.meta.url);${use}new ${constructor}(entry)`,
        );
        await assert.rejects(
          inventoryShell({ directory, policy: shellFixturePolicy }),
          /Escaped worker URL dependency/,
        );
      });
    await withOutput(async (directory) => {
      await writeFile(
        join(directory, "assets/main.js"),
        `const entry=new URL("./lazy.js",""+import.meta.url);new ${constructor}(entry);new ${constructor}(entry)`,
      );
      assert.equal(
        (await inventoryShell({ directory, policy: shellFixturePolicy }))
          .resources.length,
        3,
      );
    });
  }
});

test("Worker URL reference census does not trust shadowed constructors or URL factories", async () => {
  for (const source of [
    'const entry=new URL("./lazy.js",import.meta.url);function Worker(url){url.pathname="/missing.js"}new Worker(entry);new globalThis.Worker(entry)',
    'const entry=new URL("./lazy.js",import.meta.url);const window={Worker:function(url){url.pathname="/missing.js"}};new window.Worker(entry);new globalThis.Worker(entry)',
    'function URL(){return {toString(){return "/missing.js"}}}const entry=new URL("./lazy.js",import.meta.url);new Worker(entry)',
  ])
    await withOutput(async (directory) => {
      await writeFile(join(directory, "assets/main.js"), source);
      await assert.rejects(
        inventoryShell({ directory, policy: shellFixturePolicy }),
        /worker.*dependency/,
      );
    });
});
