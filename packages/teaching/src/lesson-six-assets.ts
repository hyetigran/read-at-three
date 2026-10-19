import {
  currentPrintedGlyphAssets,
  printedDiagramAsset,
  compactPrintedGeometry,
} from "./printed-assets.ts";
import {
  connectedPointingGeometry,
  connectedPointingRoles,
} from "./connected-pointing-assets.ts";
export const lessonSixAssetPayload = {
  glyphs: currentPrintedGlyphAssets,
  diagram: printedDiagramAsset,
  compact: compactPrintedGeometry,
  roles: connectedPointingRoles,
  layouts: {
    "vertical-esam-l06": {
      layout: "verticalFour",
      targets: ["ē", "s", "a", "m"],
    },
    "vertical-eams-l06": {
      layout: "verticalFour",
      targets: ["ē", "a", "m", "s"],
    },
    "single-m-rhyme-l06": { layout: "single", targets: ["m"] },
    "single-s-rhyme-l06": { layout: "single", targets: ["s"] },
  },
  single: { width: 310, height: 302, contactSize: 48 },
  connected: {
    geometry: connectedPointingGeometry,
    width: 680,
    height: 300,
    contactSize: 48,
    boards: { mē: ["m", "ē"], sē: ["s", "ē"] },
  },
  rhymeCue: { kind: "rhymeHoldThenSweep", hold: "parentControlled" },
} as const;
export { lessonSixAssetHash } from "./generated-lesson-six-asset-hash.ts";
