import { generateKeyPairSync } from "node:crypto";
import { createServer } from "node:http";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve, sep } from "node:path";
import { tmpdir } from "node:os";
import { installationFixture } from "../storage/installation-support.ts";
import { buildSignedShell } from "../../tools/shell/build.ts";
import { shellResourceMedia } from "../../packages/teaching/src/index.ts";
import { shellResponsePolicy } from "../../apps/web/src/platform/shell-response-policy.ts";

export async function installedBrowserFixture() {
  const cleanup: (() => Promise<void>)[] = [];
  const dispose = async () => {
    for (const close of cleanup.reverse()) await close();
  };
  try {
    const f = await installationFixture(
      { after: (close) => cleanup.push(close) },
      "completeLessons",
    );
    const update = await f.anotherRelease("fixture.release.browser-cleanup");
    const directory = await mkdtemp(
      join(tmpdir(), "reading-browser-installed-"),
    );
    cleanup.push(() => rm(directory, { recursive: true, force: true }));
    const pair = generateKeyPairSync("ed25519");
    const key = {
      id: "browser-fixture-shell",
      spkiHex: pair.publicKey
        .export({ format: "der", type: "spki" })
        .toString("hex"),
    };
    await writeFile(
      join(directory, "shell.pem"),
      pair.privateKey.export({ format: "pem", type: "pkcs8" }),
    );
    const configPath = join(directory, "config.json");
    await writeFile(
      configPath,
      JSON.stringify({
        mode: "fixture",
        applicationVersion: "browser-cache-cleanup",
        signingKeyId: key.id,
        privateKeyPath: "shell.pem",
        keys: [key],
        publicationApprovals: [],
        installation: {
          courseId: f.content.body.courseId,
          publicationKeys: [
            {
              id: f.publicationKey.id,
              spkiHex: Buffer.from(f.publicationKey.spki).toString("hex"),
            },
          ],
          initialTarget: {
            publicationHash: f.target,
            releaseId: f.content.body.releaseId,
          },
          offer: {
            publicationHash: update.target,
            releaseId: update.releaseId,
          },
        },
      }),
    );
    const outDir = join(directory, "app");
    await buildSignedShell({ configPath, outDir });
    const publications = new Map<string, Uint8Array>();
    for (const hash of [f.target, update.target])
      for (const [path, bytes] of f.publicationFiles(hash))
        publications.set(`/_reading/download/fixture/${hash}/${path}`, bytes);
    const server = createServer((request, response) => {
      void (async () => {
        const pathname = new URL(request.url ?? "/", "http://fixture.invalid")
          .pathname;
        const publication = publications.get(pathname);
        const path =
          pathname === "/"
            ? "index.html"
            : decodeURIComponent(pathname.slice(1));
        const file = resolve(outDir, path);
        if (!file.startsWith(resolve(outDir) + sep))
          throw new Error("Invalid fixture path");
        const bytes = publication ?? (await readFile(file));
        response.writeHead(200, {
          ...shellResponsePolicy,
          "Content-Type": publication
            ? "application/json"
            : shellResourceMedia(path),
          "Content-Length": bytes.length,
          "Cache-Control": "no-store",
        });
        response.end(bytes);
      })().catch(() => {
        response.writeHead(404);
        response.end();
      });
    });
    await new Promise<void>((done, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", done);
    });
    cleanup.push(
      () =>
        new Promise<void>((done, reject) => {
          server.close((error) => (error ? reject(error) : done()));
          server.closeAllConnections();
        }),
    );
    const address = server.address();
    if (!address || typeof address === "string")
      throw new Error("Missing fixture address");
    return {
      origin: `http://127.0.0.1:${address.port}`,
      activeHash: f.target,
      unusedHash: update.target,
      dispose,
    };
  } catch (error) {
    await dispose();
    throw error;
  }
}
