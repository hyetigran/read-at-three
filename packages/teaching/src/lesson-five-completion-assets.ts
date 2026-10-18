import {
  currentPrintedGlyphAssets,
  printedDiagramAsset,
} from "./printed-assets.ts";
import {
  connectedPointingGeometry,
  connectedPointingRoles,
} from "./connected-pointing.ts";
export const lessonFiveCompletionAssetPayload = {
  glyphs: currentPrintedGlyphAssets,
  roles: connectedPointingRoles,
  single: { width: 310, height: 302, diagram: printedDiagramAsset, glyph: "m" },
  connected: {
    geometry: connectedPointingGeometry,
    width: 680,
    height: 300,
    contactSize: 48,
    boards: { ēm: ["ē", "m"], ēs: ["ē", "s"] },
  },
  rhymeCue: { kind: "rhymeHoldThenSweep", hold: "parentControlled" },
} as const;
export { lessonFiveCompletionAssetHash } from "./generated-lesson-five-completion-asset-hash.ts";
