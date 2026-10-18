import { printedGlyphAssets } from "./printed-assets.ts";
import type { ConnectedPointingPresentation } from "./types.ts";

export const connectedPointingRoles = {
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
export const connectedPointingBoards = {
  am: { glyphs: ["a", "m"], geometry: connectedPointingGeometry },
  sa: { glyphs: ["s", "a"], geometry: connectedPointingGeometry },
} as const;
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
      const glyph = printedGlyphAssets[key],
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
