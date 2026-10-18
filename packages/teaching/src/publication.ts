import { runtimeCapabilityProfiles } from "./generated-runtime-profiles.ts";
import { canonical, deepFreeze, parseId } from "./identity.ts";
import { validatePublicationEnvelope } from "./generated-publication-validators.js";
import type {
  PublicationEnvelope,
  PublicationResource,
} from "./publication-schemas.ts";

export type PublicationHash = string & { readonly __brand: "PublicationHash" };
export type PublicationCrypto = Readonly<{
  sha256(bytes: Uint8Array): Promise<Uint8Array>;
  verifyEd25519(
    input: Readonly<{
      spki: Uint8Array;
      message: Uint8Array;
      signature: Uint8Array;
    }>,
  ): Promise<boolean>;
}>;
export type PublicationTrustKey = Readonly<{ id: string; spki: Uint8Array }>;
export const publicationLimits = Object.freeze({
  envelopeBytes: 1048576,
  depth: 32,
  aggregateText: 786432,
  stringLength: 16384,
  resources: 4096,
  pathLength: 1024,
  curriculumBytes: 67108864,
  assetBytes: 16777216,
  totalBytes: 536870912,
});
export type VerifiedPublication = Readonly<{
  kind: "signed-v1";
  hash: PublicationHash;
  envelope: PublicationEnvelope;
}>;
const hex = (bytes: Uint8Array) =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
const spkiPrefix = [48, 42, 48, 5, 6, 3, 43, 101, 112, 3, 33, 0];

export function publicationUtf8(text: string): Uint8Array {
  const bytes: number[] = [];
  for (let i = 0; i < text.length; i++) {
    let cp = text.charCodeAt(i);
    if (cp >= 0xd800 && cp <= 0xdbff) {
      const low = text.charCodeAt(++i);
      if (!(low >= 0xdc00 && low <= 0xdfff))
        throw new Error("Invalid Unicode scalar");
      cp = 0x10000 + ((cp - 0xd800) << 10) + (low - 0xdc00);
    } else if (cp >= 0xdc00 && cp <= 0xdfff)
      throw new Error("Invalid Unicode scalar");
    if (cp < 128) bytes.push(cp);
    else if (cp < 2048) bytes.push(192 | (cp >> 6), 128 | (cp & 63));
    else if (cp < 65536)
      bytes.push(224 | (cp >> 12), 128 | ((cp >> 6) & 63), 128 | (cp & 63));
    else
      bytes.push(
        240 | (cp >> 18),
        128 | ((cp >> 12) & 63),
        128 | ((cp >> 6) & 63),
        128 | (cp & 63),
      );
  }
  return Uint8Array.from(bytes);
}
export function decodePublicationUtf8(bytes: Uint8Array): string {
  let result = "";
  for (let i = 0; i < bytes.length;) {
    const first = bytes[i++];
    if (first === undefined) throw new Error("Invalid UTF8");
    let cp = first,
      count = 0,
      minimum = 0;
    if (first < 128) {
    } else if (first >= 194 && first <= 223) {
      cp = first & 31;
      count = 1;
      minimum = 128;
    } else if (first >= 224 && first <= 239) {
      cp = first & 15;
      count = 2;
      minimum = 2048;
    } else if (first >= 240 && first <= 244) {
      cp = first & 7;
      count = 3;
      minimum = 65536;
    } else throw new Error("Invalid UTF8");
    for (let n = 0; n < count; n++) {
      const next = bytes[i++];
      if (next === undefined || (next & 192) !== 128)
        throw new Error("Invalid UTF8");
      cp = (cp << 6) | (next & 63);
    }
    if (cp < minimum || cp > 0x10ffff || (cp >= 0xd800 && cp <= 0xdfff))
      throw new Error("Invalid UTF8");
    result += String.fromCodePoint(cp);
  }
  return result;
}
function inspectJson(
  value: unknown,
  depth: number,
  budget: { text: number },
): void {
  if (depth > publicationLimits.depth) throw new Error("JSON depth limit");
  if (typeof value === "string") {
    publicationUtf8(value);
    budget.text += value.length;
    if (
      value.length > publicationLimits.stringLength ||
      budget.text > publicationLimits.aggregateText
    )
      throw new Error("JSON text limit");
  } else if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("Invalid JSON number");
  } else if (Array.isArray(value)) {
    for (const child of value) inspectJson(child, depth + 1, budget);
  } else if (value !== null && typeof value === "object")
    for (const [key, child] of Object.entries(value)) {
      inspectJson(key, depth + 1, budget);
      inspectJson(child, depth + 1, budget);
    }
}
export function parseCanonicalPublicationJson(raw: Uint8Array): unknown {
  if (raw.length === 0 || raw.length > publicationLimits.envelopeBytes)
    throw new Error("Envelope byte limit");
  const text = decodePublicationUtf8(raw);
  let depth = 0,
    quoted = false,
    escaped = false;
  for (const c of text) {
    if (quoted) {
      if (escaped) escaped = false;
      else if (c === "\\") escaped = true;
      else if (c === '"') quoted = false;
    } else if (c === '"') quoted = true;
    else if (c === "{" || c === "[") {
      if (++depth > publicationLimits.depth)
        throw new Error("JSON depth limit");
    } else if (c === "}" || c === "]") depth--;
  }
  const value: unknown = JSON.parse(text);
  inspectJson(value, 0, { text: 0 });
  if (canonical(value) !== text) throw new Error("Noncanonical JSON bytes");
  return value;
}
export function decodePublicationSignature(encoded: string): Uint8Array {
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  if (!/^[A-Za-z0-9_-]{86}$/.test(encoded))
    throw new Error("Invalid signature encoding");
  const output: number[] = [];
  let accumulator = 0,
    bits = 0;
  for (const character of encoded) {
    accumulator = (accumulator << 6) | alphabet.indexOf(character);
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output.push((accumulator >> bits) & 255);
    }
  }
  if (bits !== 4 || (accumulator & 15) !== 0 || output.length !== 64)
    throw new Error("Invalid signature encoding");
  return Uint8Array.from(output);
}
export function requireEd25519Spki(spki: Uint8Array): void {
  if (
    spki.length !== 44 ||
    spkiPrefix.some((byte, index) => spki[index] !== byte)
  )
    throw new Error("Invalid Ed25519 SPKI");
}
export function parsePublicationHash(value: string): PublicationHash {
  requireHash(value);
  return value as PublicationHash;
}
function requireHash(value: string): void {
  if (!/^[a-f0-9]{64}$/.test(value)) throw new Error("Invalid SHA256");
}
function requirePath(path: string): void {
  if (
    path.length > publicationLimits.pathLength ||
    !/^[A-Za-z0-9_-][A-Za-z0-9_./-]*$/.test(path) ||
    path.split("/").some((part) => part === "" || part === "." || part === "..")
  )
    throw new Error("Unsafe resource path");
}
function requireMetadata(envelope: PublicationEnvelope): void {
  if (envelope.formatVersion !== 1)
    throw new Error("Unsupported envelope version");
  const body = envelope.body;
  parseId({ kind: "course", value: body.courseId });
  parseId({ kind: "release", value: body.releaseId });
  parseId({ kind: "review", value: envelope.signingKeyId });
  requireHash(envelope.packageHash);
  requireHash(body.sourceReviewManifestHash);
  if (
    !runtimeCapabilityProfiles.some(
      (profile) =>
        profile.contentSchemaVersion === body.contentSchemaVersion &&
        canonical([...profile.capabilities].sort()) ===
          canonical([...body.requiredEngineCapabilities].sort()),
    )
  )
    throw new Error("Unsupported schema or capabilities");
  if (
    body.lessonIds.length === 0 ||
    body.lessonIds.length > 6 ||
    new Set(body.lessonIds).size !== body.lessonIds.length
  )
    throw new Error("Invalid lesson identities");
  for (const lesson of body.lessonIds)
    parseId({ kind: "lesson", value: lesson });
  if (
    body.compatibilityMappings.length !== 0 ||
    body.progressMappings.length !== 0
  )
    throw new Error("Unsupported migration mappings");
  const resources = [body.curriculum, ...body.assets];
  if (
    resources.length > publicationLimits.resources ||
    new Set(resources.map((entry) => entry.path)).size !== resources.length
  )
    throw new Error("Invalid resource inventory");
  const assetIds = new Set(
    body.assets.map((asset) =>
      parseId({ kind: "asset", value: asset.assetId }),
    ),
  );
  if (assetIds.size !== body.assets.length)
    throw new Error("Duplicate asset identities");
  if (body.curriculum.mediaType !== "application/json")
    throw new Error("Invalid curriculum media");
  let total = 0;
  for (const entry of resources) {
    requirePath(entry.path);
    requireHash(entry.sha256);
    const bound =
      entry === body.curriculum
        ? publicationLimits.curriculumBytes
        : publicationLimits.assetBytes;
    if (entry.byteLength === 0 || entry.byteLength > bound)
      throw new Error("Resource byte limit");
    total += entry.byteLength;
  }
  if (total > publicationLimits.totalBytes)
    throw new Error("Closure byte limit");
}
export async function verifyPublication(
  input: Readonly<{
    raw: Uint8Array;
    keys: readonly PublicationTrustKey[];
    crypto: PublicationCrypto;
  }>,
): Promise<VerifiedPublication> {
  const value = parseCanonicalPublicationJson(input.raw);
  if (!validatePublicationEnvelope(value))
    throw new Error("Invalid publication envelope schema");
  requireMetadata(value);
  const signature = decodePublicationSignature(value.signature);
  if (new Set(input.keys.map((key) => key.id)).size !== input.keys.length)
    throw new Error("Duplicate trusted key");
  const key = input.keys.find((key) => key.id === value.signingKeyId);
  if (!key) throw new Error("Untrusted signing key");
  const spki = key.spki.slice();
  requireEd25519Spki(spki);
  const digest = await input.crypto.sha256(
    publicationUtf8(canonical(value.body)),
  );
  if (digest.length !== 32 || hex(digest) !== value.packageHash)
    throw new Error("Manifest body hash mismatch");
  const { signature: unused, ...unsigned } = value;
  if (
    !(await input.crypto.verifyEd25519({
      spki,
      message: publicationUtf8(canonical(unsigned)),
      signature,
    }))
  )
    throw new Error("Invalid publication signature");
  return deepFreeze({
    kind: "signed-v1",
    hash: value.packageHash as PublicationHash,
    envelope: value,
  });
}
export async function verifyPublicationResource(
  input: Readonly<{
    publication: VerifiedPublication;
    path: string;
    bytes: Uint8Array;
    crypto: PublicationCrypto;
  }>,
): Promise<PublicationResource> {
  const body = input.publication.envelope.body;
  const entry = [body.curriculum, ...body.assets].find(
    (resource) => resource.path === input.path,
  );
  if (!entry) throw new Error("Undeclared resource");
  if (input.bytes.length !== entry.byteLength)
    throw new Error("Resource length mismatch");
  const digest = await input.crypto.sha256(input.bytes);
  if (digest.length !== 32 || hex(digest) !== entry.sha256)
    throw new Error("Resource hash mismatch");
  return entry;
}
