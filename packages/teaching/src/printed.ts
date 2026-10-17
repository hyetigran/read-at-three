import { printedBoardAssetHash } from "./printed-assets.ts";
import type { BoardPresentation, BoardNode, PrintedGlyph } from "./types.ts";
export const printedBoardAssets = {
  "single-a": { layout: "single", targets: ["a"] },
  "vertical-mas": { layout: "verticalThree", targets: ["m", "a", "s"] },
  "two-above-one-mas": { layout: "twoAboveOne", targets: ["m", "a", "s"] },
} as const;
export function resolvePrintedPresentation(presentation: BoardPresentation) {
  validateBoardPresentation(presentation);
  return presentation;
}
export function validateBoardPresentation(
  presentation: BoardPresentation,
): void {
  if (
    presentation.board.reviewId !== "printed-boards-l03-v1" ||
    presentation.board.assetHash !== printedBoardAssetHash
  )
    throw new Error("Printed asset review changed");
  const targets: readonly PrintedGlyph[] =
    printedBoardAssets[presentation.board.assetId].targets;
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
