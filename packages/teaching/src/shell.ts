import { canonical, deepFreeze, parseId } from "./identity.ts";
import {
  decodePublicationSignature,
  parseCanonicalPublicationJson,
  publicationUtf8,
  requireEd25519Spki,
  type PublicationCrypto,
  type PublicationTrustKey,
} from "./publication.ts";
import { validateShellDescriptor } from "./generated-shell-validators.js";
import type { ShellDescriptor, ShellResource } from "./shell-schemas.ts";
export type ShellHash = string & { readonly __brand: "ShellHash" };
export type ShellPolicy = Readonly<{
  mode: "fixture" | "publication";
  applicationVersion: string;
  keys: readonly PublicationTrustKey[];
}>;
export type VerifiedShell = Readonly<{
  kind: "verified-shell";
  hash: ShellHash;
  descriptor: ShellDescriptor;
}>;
export type ShellObservation =
  | Readonly<{ kind: "controlled-verified"; hash: ShellHash }>
  | Readonly<{ kind: "missing"; path: string }>
  | Readonly<{
      kind: "corrupt";
      reason: "descriptor" | "inventory" | "resource" | "controller";
    }>
  | Readonly<{
      kind: "unavailable";
      reason:
        | "cache"
        | "network"
        | "crypto"
        | "cancelled"
        | "uncontrolled"
        | "waiting"
        | "timeout";
    }>;
export const shellLimits = Object.freeze({
  resources: 2048,
  resourceBytes: 67108864,
  totalBytes: 268435456,
});
export const shellDescriptorPath = "_reading/shell-descriptor.json";
export const shellMediaTypes = Object.freeze({
  html: "text/html",
  js: "application/javascript",
  mjs: "application/javascript",
  css: "text/css",
  woff2: "font/woff2",
  woff: "font/woff",
  ttf: "font/ttf",
  wasm: "application/wasm",
  svg: "image/svg+xml",
  png: "image/png",
  webp: "image/webp",
  ico: "image/x-icon",
  json: "application/json",
});
export class ShellError extends Error {
  constructor(
    readonly failure: Exclude<
      ShellObservation,
      { kind: "controlled-verified" }
    >,
  ) {
    super(failure.kind === "missing" ? "missing" : failure.reason);
    this.name = "ShellError";
  }
}
export function shellServiceWorkerPath(
  policy: Pick<ShellPolicy, "mode" | "applicationVersion">,
): string {
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(policy.applicationVersion))
    throw new ShellError({ kind: "corrupt", reason: "descriptor" });
  return `_reading/sw-${policy.mode}-${policy.applicationVersion}.js`;
}
export function shellEntries(shell: VerifiedShell): readonly ShellResource[] {
  const body = shell.descriptor.body;
  return [body.navigation, body.serviceWorker, ...body.resources];
}
export function shellResourceMedia(path: string): string {
  const extension = path.split(".").at(-1);
  if (extension)
    for (const [key, media] of Object.entries(shellMediaTypes))
      if (key === extension) return media;
  throw new ShellError({ kind: "corrupt", reason: "inventory" });
}
function metadata(descriptor: ShellDescriptor, policy: ShellPolicy): void {
  const body = descriptor.body;
  if (
    descriptor.formatVersion !== 1 ||
    body.formatVersion !== 1 ||
    body.bootstrapPolicyVersion !== 1 ||
    body.mode !== policy.mode ||
    body.applicationVersion !== policy.applicationVersion ||
    !/^[a-f0-9]{64}$/.test(descriptor.buildHash)
  )
    throw new ShellError({ kind: "corrupt", reason: "descriptor" });
  if (
    body.navigation.path !== "index.html" ||
    body.serviceWorker.path !== shellServiceWorkerPath(policy)
  )
    throw new ShellError({ kind: "corrupt", reason: "inventory" });
  const entries = [body.navigation, body.serviceWorker, ...body.resources];
  if (
    entries.length > shellLimits.resources ||
    new Set(entries.map((entry) => entry.path)).size !== entries.length
  )
    throw new ShellError({ kind: "corrupt", reason: "inventory" });
  let total = 0;
  for (const entry of entries) {
    if (
      entry.path.length > 1024 ||
      !/^[A-Za-z0-9_-][A-Za-z0-9_./-]*$/.test(entry.path) ||
      entry.path
        .split("/")
        .some((part) => !part || part === "." || part === "..") ||
      entry.path === shellDescriptorPath ||
      entry.path.startsWith("_reading/content/") ||
      entry.path.startsWith("_reading/download/") ||
      entry.path.startsWith("curriculum/") ||
      entry.path.startsWith("preparation/") ||
      !/^[a-f0-9]{64}$/.test(entry.sha256) ||
      entry.mediaType !== shellResourceMedia(entry.path) ||
      entry.byteLength < 1 ||
      entry.byteLength > shellLimits.resourceBytes
    )
      throw new ShellError({ kind: "corrupt", reason: "inventory" });
    total += entry.byteLength;
  }
  if (total > shellLimits.totalBytes)
    throw new ShellError({ kind: "corrupt", reason: "inventory" });
}
const hex = (bytes: Uint8Array) =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
export async function verifyShellDescriptor(
  input: Readonly<{
    raw: Uint8Array;
    policy: ShellPolicy;
    crypto: PublicationCrypto;
  }>,
): Promise<VerifiedShell> {
  let descriptor: ShellDescriptor, signature: Uint8Array, spki: Uint8Array;
  try {
    const value = parseCanonicalPublicationJson(input.raw);
    if (!validateShellDescriptor(value))
      throw new Error("Invalid shell descriptor");
    descriptor = value;
    parseId({ kind: "review", value: descriptor.signingKeyId });
    metadata(descriptor, input.policy);
    if (
      new Set(input.policy.keys.map((key) => key.id)).size !==
      input.policy.keys.length
    )
      throw new Error("Duplicate trusted key");
    const key = input.policy.keys.find(
      (key) => key.id === descriptor.signingKeyId,
    );
    if (!key) throw new Error("Untrusted shell key");
    spki = key.spki.slice();
    requireEd25519Spki(spki);
    signature = decodePublicationSignature(descriptor.signature);
  } catch (error) {
    if (error instanceof ShellError) throw error;
    throw new ShellError({ kind: "corrupt", reason: "descriptor" });
  }
  let digest: Uint8Array, valid: boolean;
  try {
    digest = await input.crypto.sha256(
      publicationUtf8(canonical(descriptor.body)),
    );
    const { signature: omitted, ...unsigned } = descriptor;
    valid = await input.crypto.verifyEd25519({
      spki,
      signature,
      message: publicationUtf8(canonical(unsigned)),
    });
  } catch {
    throw new ShellError({ kind: "unavailable", reason: "crypto" });
  }
  if (digest.length !== 32 || hex(digest) !== descriptor.buildHash || !valid)
    throw new ShellError({ kind: "corrupt", reason: "descriptor" });
  return deepFreeze({
    kind: "verified-shell",
    hash: descriptor.buildHash as ShellHash,
    descriptor,
  });
}
export async function verifyShellResource(
  input: Readonly<{
    shell: VerifiedShell;
    path: string;
    bytes: Uint8Array;
    crypto: PublicationCrypto;
  }>,
): Promise<ShellResource> {
  const entry = shellEntries(input.shell).find(
    (entry) => entry.path === input.path,
  );
  if (!entry || input.bytes.length !== entry.byteLength)
    throw new ShellError({ kind: "corrupt", reason: "resource" });
  let digest: Uint8Array;
  try {
    digest = await input.crypto.sha256(input.bytes);
  } catch {
    throw new ShellError({ kind: "unavailable", reason: "crypto" });
  }
  if (digest.length !== 32 || hex(digest) !== entry.sha256)
    throw new ShellError({ kind: "corrupt", reason: "resource" });
  return entry;
}
