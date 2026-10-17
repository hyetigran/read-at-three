import { canonical, deepFreeze, parseHash } from "./identity.ts";
import {
  validatePreparationInput,
  validatePreparationPackage,
} from "./generated-preparation-validators.js";
import { validatePreparationSvg } from "./preparation-svg.ts";
import type { HashFunction, PreparationHash } from "./types.ts";
import type { PreparationPolicy } from "./profiles.ts";
import type {
  PreparationBody,
  PreparationRichText,
  RawPreparationInput,
  RawPreparationPackage,
} from "./preparation-schemas.ts";

export type {
  PreparationBody,
  PreparationRichText,
  PreparationBlock,
  RawPreparationInput,
} from "./preparation-schemas.ts";
type Immutable<T> = T extends object
  ? { readonly [K in keyof T]: Immutable<T[K]> }
  : T;
const verified = new WeakSet<object>();
const witness: unique symbol = Symbol("verifiedPreparation");
export type VerifiedPreparationDocument = Immutable<
  Omit<RawPreparationPackage, "preparationHash">
> &
  Readonly<{
    preparationHash: PreparationHash;
    [witness]: true;
  }>;
export type PreparationAvailability =
  | Readonly<{ kind: "unavailable"; reason: "missing" | "invalid" }>
  | Readonly<{ kind: "available"; document: VerifiedPreparationDocument }>;

export function preparationByteLength(text: string): number {
  let size = 0;
  for (const point of text) {
    const code = point.codePointAt(0);
    if (code === undefined || (code >= 0xd800 && code <= 0xdfff))
      throw new Error("Preparation contains invalid Unicode.");
    size += code < 0x80 ? 1 : code < 0x800 ? 2 : code < 0x10000 ? 3 : 4;
  }
  return size;
}
function id(value: string) {
  if (
    !/^[\p{L}\p{N}][\p{L}\p{N}._:-]{0,199}$/u.test(value) ||
    value.includes("..")
  )
    throw new Error("Preparation identity is invalid.");
}
function digest(value: string) {
  parseHash({ kind: "payload", value });
}
function limit(value: number, maximum: number, minimum = 0) {
  if (value < minimum || value > maximum)
    throw new Error("Preparation exceeds its supported bounds.");
}
export function parsePreparationInput(input: unknown): RawPreparationInput {
  if (!validatePreparationInput(input))
    throw new Error("Preparation availability is invalid.");
  return input;
}
export async function parsePreparationPackage(
  input: unknown,
  hash: HashFunction,
): Promise<VerifiedPreparationDocument> {
  limit(preparationByteLength(canonical(input)), 196608, 1);
  if (!validatePreparationPackage(input) || input.formatVersion !== 1)
    throw new Error("Preparation package is unsupported.");
  const snapshot: unknown = JSON.parse(canonical(input));
  if (!validatePreparationPackage(snapshot))
    throw new Error("Preparation package copy is invalid.");
  const value = snapshot;
  const body = value.body;
  const preparationHash = parseHash({
    kind: "preparation",
    value: value.preparationHash,
  });
  if ((await hash(canonical(body))) !== preparationHash)
    throw new Error("Preparation body hash mismatch.");
  id(body.documentId);
  digest(body.reviewHash);
  digest(body.provenance.compositionHash);
  id(body.provenance.reviewId);
  if ((await hash(canonical(body.provenance))) !== body.reviewHash)
    throw new Error("Preparation review identity mismatch.");
  limit(body.sections.length, 12, 1);
  limit(body.provenance.sources.length, 256);
  limit(body.provenance.reviews.length, 16);
  const reviewIds = new Set<string>();
  for (const review of body.provenance.reviews) {
    id(review.id);
    digest(review.sha256);
    if (reviewIds.has(review.id))
      throw new Error("Preparation review identities repeat.");
    reviewIds.add(review.id);
  }
  if (
    body.provenance.kind === "synthetic"
      ? body.provenance.sources.length !== 0 ||
        body.provenance.reviews.length !== 0
      : body.provenance.sources.length === 0 ||
        body.provenance.reviews.length === 0
  )
    throw new Error("Preparation review kind is inconsistent.");
  const sources = new Map<
    string,
    PreparationBody["provenance"]["sources"][number]
  >();
  for (const source of body.provenance.sources) {
    id(source.sourceRef);
    id(source.sourceKey);
    id(source.documentId);
    digest(source.textHash);
    digest(source.parentTextHash);
    limit(source.start, 6000);
    limit(source.length, 6000, 1);
    limit(source.pdfPages.length, 8, 1);
    if (
      source.pdfPages.length !== source.printedPages.length ||
      source.pdfPages.some((page) => page < 1 || page > 1000) ||
      source.printedPages.some(
        (page) => page !== null && (page < 1 || page > 1000),
      ) ||
      sources.has(source.sourceRef)
    )
      throw new Error("Preparation source references are inconsistent.");
    sources.set(source.sourceRef, source);
  }
  const usedSources = new Set<string>();
  async function rich(text: PreparationRichText) {
    limit(text.copy.text.length, 6000, 1);
    preparationByteLength(text.copy.text);
    limit(text.marks.length, 64);
    for (let i = 0; i < text.marks.length; i++) {
      const mark = text.marks[i];
      if (!mark) throw new Error("Preparation mark is missing.");
      limit(mark.length, text.copy.text.length, 1);
      preparationByteLength(text.copy.text.slice(0, mark.start));
      preparationByteLength(text.copy.text.slice(0, mark.start + mark.length));
      if (
        mark.start + mark.length > text.copy.text.length ||
        text.marks
          .slice(0, i)
          .some(
            (previous) =>
              previous.kind === mark.kind &&
              previous.start < mark.start + mark.length &&
              mark.start < previous.start + previous.length,
          )
      )
        throw new Error("Preparation emphasis ranges are invalid.");
    }
    if (text.copy.kind !== "added") {
      const source = sources.get(text.copy.sourceRef);
      if (
        !source ||
        source.length !== text.copy.text.length ||
        (await hash(text.copy.text)) !== source.textHash ||
        usedSources.has(text.copy.sourceRef)
      )
        throw new Error(
          "Preparation source wording does not match its review.",
        );
      usedSources.add(text.copy.sourceRef);
    }
  }
  await rich(body.title);
  const sectionIds = new Set<string>(),
    blockIds = new Set<string>(),
    usedAssets = new Set<string>();
  for (const section of body.sections) {
    id(section.id);
    if (sectionIds.has(section.id))
      throw new Error("Preparation sections repeat.");
    sectionIds.add(section.id);
  }
  let blockCount = 0;
  for (const section of body.sections) {
    await rich(section.title);
    limit(section.blocks.length, 32, 1);
    for (const block of section.blocks) {
      limit(++blockCount, 128);
      id(block.id);
      if (blockIds.has(block.id))
        throw new Error("Preparation block identities repeat.");
      blockIds.add(block.id);
      switch (block.kind) {
        case "paragraph":
          await rich(block.content);
          break;
        case "list":
          limit(block.items.length, 32, 1);
          for (const item of block.items) await rich(item);
          break;
        case "table":
          await rich(block.caption);
          limit(block.headers.length, 6, 1);
          limit(block.rows.length, 32, 1);
          for (const header of block.headers) await rich(header);
          for (const row of block.rows) {
            if (row.cells.length !== block.headers.length)
              throw new Error("Preparation table columns do not agree.");
            for (const cell of row.cells) {
              limit(cell.lines.length, 8, 1);
              for (const line of cell.lines) await rich(line);
              if (
                cell.symbol !== undefined &&
                (cell.lines.length !== 1 ||
                  cell.lines[0]?.copy.text !== cell.symbol)
              )
                throw new Error("Preparation symbol cell is inconsistent.");
            }
          }
          break;
        case "diagram":
          id(block.assetId);
          usedAssets.add(block.assetId);
          await rich(block.caption);
          await rich(block.alt);
          break;
        case "reference":
          await rich(block.label);
          if (
            block.label.copy.kind !== "added" ||
            (block.target.kind === "section"
              ? !sectionIds.has(block.target.sectionId)
              : block.target.lesson !== 1 || block.target.task !== 1)
          )
            throw new Error("Preparation internal destination is invalid.");
          break;
        default: {
          const exhaustive: never = block;
          throw new Error(String(exhaustive));
        }
      }
    }
  }
  if (usedSources.size !== sources.size)
    throw new Error("Preparation has unused source provenance.");
  limit(body.assets.length, 8);
  if (body.assets.length !== value.assets.length)
    throw new Error("Preparation asset closure is incomplete.");
  const assetIds = new Set<string>(),
    paths = new Set<string>();
  for (const asset of body.assets) {
    id(asset.id);
    digest(asset.sha256);
    if (
      assetIds.has(asset.id) ||
      paths.has(asset.path) ||
      asset.path !== `assets/${asset.sha256}.svg` ||
      !usedAssets.has(asset.id)
    )
      throw new Error("Preparation asset descriptor is invalid.");
    assetIds.add(asset.id);
    paths.add(asset.path);
    const payloads = value.assets.filter(
      (payload) => payload.path === asset.path,
    );
    const payload = payloads[0];
    if (
      payloads.length !== 1 ||
      !payload ||
      preparationByteLength(payload.svg) !== asset.byteLength ||
      (await hash(payload.svg)) !== asset.sha256
    )
      throw new Error("Preparation asset hash mismatch.");
    validatePreparationSvg(payload.svg);
  }
  if (usedAssets.size !== assetIds.size)
    throw new Error("Preparation diagram asset is missing.");
  const document: VerifiedPreparationDocument = deepFreeze({
    ...value,
    preparationHash,
    [witness]: true,
  });
  verified.add(document);
  return document;
}
export async function parsePreparationAvailability(
  input: unknown,
  hash: HashFunction,
): Promise<PreparationAvailability> {
  try {
    const wire = parsePreparationInput(input);
    if (wire.kind === "unavailable") return Object.freeze({ ...wire });
    return Object.freeze({
      kind: "available",
      document: await parsePreparationPackage(wire.package, hash),
    });
  } catch {
    return Object.freeze({ kind: "unavailable", reason: "invalid" });
  }
}
export function preparationPolicy(
  value: PreparationAvailability,
): PreparationPolicy {
  if (value.kind === "unavailable") return { kind: "unavailable" };
  if (!verified.has(value.document))
    throw new Error("Preparation policy requires a verified document.");
  return { kind: "reviewed", hash: value.document.preparationHash };
}
