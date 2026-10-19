import assert from "node:assert/strict";
import { test } from "node:test";
import { verifyShellDescriptor } from "@readatthree/teaching";
import { selectShellRequest } from "../../apps/web/src/platform/shell-request.ts";
import { shellResponsePolicy } from "../../apps/web/src/platform/shell-response-policy.ts";
import {
  signedShellFixture,
  shellFixtureCrypto,
  shellFixturePolicy,
} from "./fixtures/shell.ts";
test("final URL membership has no client or constructor exemption", async () => {
  const shell = await verifyShellDescriptor({
    raw: signedShellFixture(),
    policy: shellFixturePolicy,
    crypto: shellFixtureCrypto,
  });
  const select = (
    url: string,
    method = "GET",
    destination: RequestDestination = "",
    mode: RequestMode = "cors",
  ) =>
    selectShellRequest({
      shell,
      policy: shellFixturePolicy,
      origin: "https://reading.invalid",
      request: {
        url: new URL(url, "https://reading.invalid").href,
        method,
        destination,
        mode,
      },
    });
  assert.deepEqual(select("/assets/lazy.js", "GET", "worker"), {
    kind: "shell",
    path: "assets/lazy.js",
  });
  assert.deepEqual(select("/parent/nested", "GET", "document", "navigate"), {
    kind: "shell",
    path: "index.html",
  });
  for (const url of [
    "/missing.js",
    "/parent/nested/missing.js",
    "/assets/lazy.js?vfs=opfs",
    "https://foreign.invalid/assets/lazy.js",
  ])
    assert.equal(select(url).kind, "refused");
  assert.equal(select("/assets/lazy.js", "POST").kind, "refused");
  const hash = "a".repeat(64);
  const download = `/_reading/download/fixture/${hash}/curriculum.json`;
  assert.equal(select(download).kind, "download");
  for (const destination of [
    "script",
    "worker",
    "sharedworker",
    "document",
  ] satisfies RequestDestination[])
    assert.equal(select(download, "GET", destination).kind, "refused");
  for (const url of [
    download + "?x=1",
    download.replace("fixture", "publication"),
    download.replace(hash, "bad"),
  ])
    assert.equal(select(url).kind, "refused");
  const content = `/_reading/content/fixture/${hash}/image.svg`;
  assert.equal(select(content, "GET", "image").kind, "publication");
  for (const destination of [
    "script",
    "worker",
    "sharedworker",
    "document",
    "style",
    "font",
  ] satisfies RequestDestination[])
    assert.equal(select(content, "GET", destination).kind, "refused");
});
test("one response policy admits WASM and reviewed UI without JavaScript eval or blob workers", () => {
  const csp = shellResponsePolicy["Content-Security-Policy"];
  assert.match(csp, /script-src 'self' 'wasm-unsafe-eval'/);
  assert.match(csp, /worker-src 'self';/);
  assert.match(csp, /style-src 'self' 'unsafe-inline'/);
  assert.match(csp, /img-src 'self' blob:/);
  assert.doesNotMatch(csp, /(?:^| )'unsafe-eval'/);
});
