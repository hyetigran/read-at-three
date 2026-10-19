import {
  createHash,
  createPrivateKey,
  createPublicKey,
  sign,
  verify,
} from "node:crypto";
import {
  canonical,
  publicationUtf8,
  type ShellBody,
  type ShellPolicy,
  type PublicationCrypto,
} from "@readatthree/teaching";
export const shellFixturePrivateKey = createPrivateKey({
  key: Buffer.from(
    "302e020100300506032b6570042204209d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60",
    "hex",
  ),
  format: "der",
  type: "pkcs8",
});
export const shellFixturePolicy: ShellPolicy = {
  mode: "fixture",
  applicationVersion: "neutral-v1",
  keys: [
    {
      id: "engineering-fixture-only",
      spki: Uint8Array.from(
        createPublicKey(shellFixturePrivateKey).export({
          format: "der",
          type: "spki",
        }),
      ),
    },
  ],
};
export const shellFixtureCrypto: PublicationCrypto = {
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
export const shellFixtureFiles = new Map([
  [
    "index.html",
    Buffer.from('<script type="module" src="/assets/main.js"></script>'),
  ],
  [
    "assets/main.js",
    Buffer.from(
      'import("./lazy.js");new URL("./database.wasm",import.meta.url);',
    ),
  ],
  ["assets/lazy.js", Buffer.from("export const neutral=true;")],
  ["assets/database.wasm", Buffer.from([0, 97, 115, 109, 1, 0, 0, 0])],
  [
    "_reading/sw-fixture-neutral-v1.js",
    Buffer.from('self.addEventListener("fetch",()=>{});'),
  ],
]);
export function shellFixtureBody(): ShellBody {
  const entries = Array.from(shellFixtureFiles, ([path, bytes]) => ({
    path,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    byteLength: bytes.length,
    mediaType: path.endsWith("html")
      ? "text/html"
      : path.endsWith("wasm")
        ? "application/wasm"
        : "application/javascript",
  }));
  const navigation = entries[0],
    serviceWorker = entries.at(-1);
  if (!navigation || !serviceWorker) throw new Error("Incomplete fixture");
  return {
    formatVersion: 1,
    applicationVersion: "neutral-v1",
    bootstrapPolicyVersion: 1,
    mode: "fixture",
    navigation,
    serviceWorker,
    resources: entries.slice(1, -1),
  };
}
export function signedShellFixture(
  body: unknown = shellFixtureBody(),
  extra: Record<string, unknown> = {},
): Uint8Array {
  const unsigned = {
    formatVersion: 1,
    body,
    buildHash: createHash("sha256")
      .update(publicationUtf8(canonical(body)))
      .digest("hex"),
    signingKeyId: "engineering-fixture-only",
    ...extra,
  };
  return publicationUtf8(
    canonical({
      ...unsigned,
      signature: sign(
        null,
        publicationUtf8(canonical(unsigned)),
        shellFixturePrivateKey,
      ).toString("base64url"),
    }),
  );
}
