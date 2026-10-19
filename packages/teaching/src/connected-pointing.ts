import { lessonFiveCompletionAssetPayload } from "./lesson-five-completion-assets.ts";
import { deepFreeze } from "./identity.ts";
import { currentPrintedGlyphAssets } from "./printed-assets.ts";
import type { ConnectedPointingPresentation } from "./types.ts";

import { lessonFiveCompletionAssetHash } from "./generated-lesson-five-completion-asset-hash.ts";
import {
  connectedPointingRoles,
  connectedPointingGeometry,
} from "./connected-pointing-assets.ts";
export {
  connectedPointingRoles,
  connectedPointingGeometry,
} from "./connected-pointing-assets.ts";
import { lessonSixAssetPayload } from "./lesson-six-assets.ts";
import { lessonSixAssetHash } from "./generated-lesson-six-asset-hash.ts";
export const connectedPointingBoards = deepFreeze({
  mē: {
    reviewId: "complete-lessons-01-06-v1",
    assetHash: lessonSixAssetHash,
    glyphs: lessonSixAssetPayload.connected.boards.mē,
    geometry: connectedPointingGeometry,
  },
  sē: {
    reviewId: "complete-lessons-01-06-v1",
    assetHash: lessonSixAssetHash,
    glyphs: lessonSixAssetPayload.connected.boards.sē,
    geometry: connectedPointingGeometry,
  },
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
    geometry = asset.geometry,
    profile = connectedRenderingProfile(board);
  const glyphs = asset.glyphs
    .map((key, index) => {
      const glyph = currentPrintedGlyphAssets[key],
        placement = geometry.glyphs[index];
      if (!placement) throw new Error("Missing connected glyph placement");
      return `<svg x="${placement.x}" y="${placement.y}" width="${placement.width}" height="${placement.height}" viewBox="${profile.glyphViewBox}"><path d="${glyph.path}" fill-rule="${glyph.fillRule}"${glyph.transform ? ` transform="${glyph.transform}"` : ""}/></svg>`;
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

export function connectedRenderingProfile(
  board: ConnectedPointingPresentation["board"],
) {
  const asset = connectedPointingBoards[board];
  const geometry =
    asset.reviewId === "complete-lessons-01-06-v1"
      ? lessonSixAssetPayload.connected
      : asset.reviewId === "rhyming-connected-writing-l05-v1"
        ? lessonFiveCompletionAssetPayload.connected
        : { width: 680, height: 300, contactSize: 44 };
  return {
    ...geometry,
    glyphViewBox:
      asset.reviewId === "complete-lessons-01-06-v1"
        ? lessonSixAssetPayload.diagram.glyphViewBox
        : "0 0 310 250",
    childVoiced:
      asset.reviewId === "complete-lessons-01-06-v1" ||
      asset.reviewId === "rhyming-connected-writing-l05-v1",
  };
}
