import {
  canonical,
  increment,
  parseInkReceipt,
  parseProfileRemovalReceipt,
  parseReceipt,
} from "../../teaching/src/index.ts";
import type {
  CommitReceipt,
  InkReceipt,
  ProfileResetReceipt,
} from "../../teaching/src/index.ts";
import type { commandReceipt } from "./schema.ts";

type ReceiptRow = typeof commandReceipt.$inferSelect;
export function decodePersonalReceipt(
  row: ReceiptRow,
): CommitReceipt | InkReceipt | ProfileResetReceipt {
  const input: unknown = JSON.parse(row.result);
  if (Number(row.resultVersion) === 2) {
    const result = parseProfileRemovalReceipt(input);
    if (
      !("selection" in result) ||
      result.effect.kind !== "reset" ||
      row.scopeKind !== "profile" ||
      row.scopeId !== row.ownerProfileId ||
      row.scopeGeneration !== row.ownerGeneration ||
      result.commandId !== row.commandId ||
      result.payloadHash !== row.payloadHash ||
      result.selection.owner.profileId !== row.ownerProfileId ||
      result.selection.owner.generation !== row.ownerGeneration ||
      result.effect.target.revision !== row.resultingRevision ||
      row.resultingRevision !== increment(row.expectedRevision) ||
      row.result !== canonical(result)
    )
      throw new Error("Saved reset receipt ownership or identity is corrupt");
    return result;
  }
  if (Number(row.resultVersion) !== 1)
    throw new Error("Personal receipt version is unsupported");
  if (row.scopeKind === "document") {
    const result = parseInkReceipt(input);
    if (
      result.commandId !== row.commandId ||
      result.token.profileId !== row.ownerProfileId ||
      result.token.generation !== row.ownerGeneration ||
      result.token.documentId !== row.scopeId ||
      result.token.revision !== row.resultingRevision
    )
      throw new Error("Saved ink receipt identity is corrupt");
    return result;
  }
  const result = parseReceipt(input);
  if (
    result.commandId !== row.commandId ||
    result.owner.profileId !== row.ownerProfileId ||
    result.owner.generation !== row.ownerGeneration ||
    result.revision !== row.resultingRevision ||
    (row.scopeKind === "session" && result.sessionId !== row.scopeId)
  )
    throw new Error("Saved teaching receipt identity is corrupt");
  return result;
}
