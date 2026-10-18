import { deepFreeze } from "./identity.ts";
import { printedBoardAssetHash } from "./printed-assets.ts";
import type { BoardPresentation, BoardNode, PrintedGlyph } from "./types.ts";
export const printedBoardAssets = {
  "single-a": { layout: "single", targets: ["a"] },
  "vertical-mas": { layout: "verticalThree", targets: ["m", "a", "s"] },
  "two-above-one-mas": { layout: "twoAboveOne", targets: ["m", "a", "s"] },
} as const;
export const reviewedPrintedBoards = deepFreeze({
  "single-a": {
    assetId: "single-a",
    reviewId: "printed-boards-l03-v1",
    assetHash: printedBoardAssetHash,
    ...printedBoardAssets["single-a"],
  },
  "vertical-mas": {
    assetId: "vertical-mas",
    reviewId: "printed-boards-l03-v1",
    assetHash: printedBoardAssetHash,
    ...printedBoardAssets["vertical-mas"],
  },
  "two-above-one-mas": {
    assetId: "two-above-one-mas",
    reviewId: "printed-boards-l03-v1",
    assetHash: printedBoardAssetHash,
    ...printedBoardAssets["two-above-one-mas"],
  },
  "two-above-one-sma": {
    assetId: "two-above-one-sma",
    reviewId: "printed-boards-l04-v1",
    assetHash:
      "fa15255013620b2bbe586d0a0bf4ca15d0aca5d72c9ce1609d19278d10d67132",
    layout: "twoAboveOne",
    targets: ["s", "m", "a"],
  },
} as const);
export function resolvePrintedPresentation(presentation: BoardPresentation) {
  validateBoardPresentation(presentation);
  return presentation;
}
export function validateBoardPresentation(
  presentation: BoardPresentation,
): void {
  if (
    presentation.board.reviewId !==
      reviewedPrintedBoards[presentation.board.assetId].reviewId ||
    presentation.board.assetHash !==
      reviewedPrintedBoards[presentation.board.assetId].assetHash
  )
    throw new Error("Printed asset review changed");
  const targets: readonly PrintedGlyph[] =
    reviewedPrintedBoards[presentation.board.assetId].targets;
  if (!targets.includes(presentation.focus))
    throw new Error("Printed focus is absent from reviewed board");
  if (
    presentation.cue.kind === "endpointSweep" &&
    presentation.cue.preparation === "parentControlledStartHold" &&
    presentation.focus !== "s"
  )
    throw new Error("Start hold requires reviewed s target");
}

export function validateBoardNode(node: BoardNode): void {
  validateBoardPresentation(node.presentation);
  if ((node.kind === "correction") !== (node.presentation.cue.kind === "none"))
    throw new Error("Only correction instructions are cue-free");
}
