import { deepFreeze } from "./identity.ts";
import { currentPrintedGlyphAssets } from "./printed-assets.ts";
import type { ConnectedPointingPresentation } from "./types.ts";

import { lessonFiveCompletionAssetHash } from "./generated-lesson-five-completion-asset-hash.ts";
export const connectedPointingRoles = {
  echo: {
    parentRole: "listen",
    voice: "child",
    pointer: "none",
    label: "Child voices · Parent listens",
  },
  childConnect: {
    parentRole: "listen",
    voice: "child",
    pointer: "child",
    label: "Child voices and points · Parent listens",
  },
  togetherGuided: {
    parentRole: "together",
    voice: "both",
    pointer: "parentGuidesChild",
    label: "Parent and child voice · Parent guides child’s finger",
  },
  model: {
    parentRole: "model",
    voice: "parent",
    pointer: "parent",
    label: "Parent voices and points · Child watches",
  },
  follow: {
    parentRole: "listen",
    voice: "parent",
    pointer: "child",
    label: "Parent voices · Child points",
  },
  guided: {
    parentRole: "model",
    voice: "parent",
    pointer: "parentGuidesChild",
    label: "Parent voices and guides child's finger",
  },
} as const;
export const connectedPointingGeometry = {
  viewBox: "0 0 680 300",
  start: { x: 50, y: 240, radius: 16 },
  first: { x: 250, y: 275, radius: 10 },
  second: { x: 480, y: 275, radius: 10 },
  shaft: "M50 240H610",
  tip: "M606 226L644 240 606 254Z",
  glyphs: [
    { x: 95, y: 0, width: 310, height: 235 },
    { x: 325, y: 0, width: 310, height: 235 },
  ],
} as const;
export const connectedPointingBoards = deepFreeze({
  ēm: {
    reviewId: "rhyming-connected-writing-l05-v1",
    assetHash: lessonFiveCompletionAssetHash,
    glyphs: ["ē", "m"],
    geometry: connectedPointingGeometry,
  },
  ēs: {
    reviewId: "rhyming-connected-writing-l05-v1",
    assetHash: lessonFiveCompletionAssetHash,
    glyphs: ["ē", "s"],
    geometry: connectedPointingGeometry,
  },
  ma: {
    reviewId: "connected-pointing-l04-v1",
    assetHash:
      "49bbbf47cb3dc9f6671483146edc219b8f98113698ce9d54bab3f1d9922a17a6",
    glyphs: ["m", "a"],
    geometry: connectedPointingGeometry,
  },
  am: {
    reviewId: "connected-pointing-l03-v1",
    assetHash:
      "b8e9fe9a3e39ebc3802f12931890ba0be4902e794efc79d7b341f4f5d5c305d4",
    glyphs: ["a", "m"],
    geometry: connectedPointingGeometry,
  },
  sa: {
    reviewId: "connected-pointing-l03-v1",
    assetHash:
      "d878304bef9016702b8ff63f425910c9ee99c01eb199a9ec7c1eca2ac7e0c48e",
    glyphs: ["s", "a"],
    geometry: connectedPointingGeometry,
  },
} as const);
export type ConnectedPointingRegion = "start" | "first" | "second";
export function connectedPointingRegion({
  x,
  y,
}: {
  x: number;
  y: number;
}): ConnectedPointingRegion | null {
  for (const region of ["start", "first", "second"] as const) {
    const circle = connectedPointingGeometry[region];
    if ((x - circle.x) ** 2 + (y - circle.y) ** 2 <= circle.radius ** 2)
      return region;
  }
  return null;
}
export function connectedPointingSvg(
  board: ConnectedPointingPresentation["board"],
): string {
  const asset = connectedPointingBoards[board],
    geometry = asset.geometry;
  const glyphs = asset.glyphs
    .map((key, index) => {
      const glyph = currentPrintedGlyphAssets[key],
        placement = geometry.glyphs[index];
      if (!placement) throw new Error("Missing connected glyph placement");
      return `<svg x="${placement.x}" y="${placement.y}" width="${placement.width}" height="${placement.height}" viewBox="0 0 310 250"><path d="${glyph.path}" fill-rule="${glyph.fillRule}"${glyph.transform ? ` transform="${glyph.transform}"` : ""}/></svg>`;
    })
    .join("");
  const circles = (["start", "first", "second"] as const)
    .map((region) => {
      const c = geometry[region];
      return `<circle data-region="${region}" cx="${c.x}" cy="${c.y}" r="${c.radius}"/>`;
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${geometry.viewBox}">${glyphs}<path d="${geometry.shaft}" fill="none" stroke="currentColor" stroke-width="3"/><path d="${geometry.tip}"/>${circles}</svg>`;
}
