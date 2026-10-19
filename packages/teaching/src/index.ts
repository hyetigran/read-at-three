export type * from "./types.ts";
export {
  canonical,
  canonicalContentBody,
  parseDevelopmentPackage,
  parseCommand,
  parseCounter,
  parseId,
  parseHash,
  increment,
  parseTeachingState,
  parseReceipt,
  graphTask,
  compileTask,
  taskDefinition,
  controlTask,
} from "./content.ts";
export {
  evaluate,
  evaluateGraph,
  initialState,
  project,
  validatePosition,
  currentCheckpoint,
  completionProof,
  validateAcceptanceTransition,
  validateAcceptanceState,
} from "./engine.ts";
export {
  createCoordinator,
  dispatchTeachingInTransaction,
  prepareCommand,
  prepareWritingCommand,
  prepareWritingControl,
} from "./coordinator.ts";
export { parseProjection, parseDispatchResult } from "./content.ts";
export type {
  CommittedProjection as Projection,
  CommandResult as DispatchResult,
} from "./types.ts";

export { compileControlTask } from "./control-content.ts";

export {
  compileWritingTask,
  compileWritingPlan,
  writingTask,
  writingState,
  writingPermission,
  layerForPhase,
} from "./writing.ts";

export * from "./ink.ts";

export * from "./ink-history.ts";

export * from "./ink-reservation.ts";

export * from "./course-content.ts";

export * from "./course.ts";

export * from "./profiles.ts";

export * from "./selection.ts";

export * from "./preparation.ts";

export * from "./profile-removal.ts";

export * from "./support.ts";

export { guidanceCopies, requirePlainGuidance } from "./guidance.ts";

export {
  printedBoardAssets,
  reviewedPrintedBoards,
  allReviewedPrintedBoards,
  lessonFiveCompletionBoards,
  resolvePrintedPresentation,
} from "./printed.ts";

export {
  printedGlyphAssets,
  currentPrintedGlyphAssets,
  compactPrintedGeometry,
  lessonFivePrintedAssetPayload,
  printedDiagramAsset,
  printedBoardAssetHash,
} from "./printed-assets.ts";

export * from "./connected-pointing.ts";

export * from "./lesson-five-completion-assets.ts";

export {
  lessonSixAssetPayload,
  lessonSixAssetHash,
} from "./lesson-six-assets.ts";
export { lessonSixPrintedBoards, printedRenderingProfile } from "./printed.ts";
export { connectedRenderingProfile } from "./connected-pointing.ts";
