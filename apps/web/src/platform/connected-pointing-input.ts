import { connectedPointingGeometry } from "@readatthree/teaching";
import type { ConnectedPointingRegion } from "@readatthree/teaching";

export function connectedContactRegions({
  pixelsPerUnit,
  contactSize = 44,
}: {
  pixelsPerUnit: number;
  contactSize?: number;
}) {
  const minimumRadius = pixelsPerUnit > 0 ? contactSize / 2 / pixelsPerUnit : 0;
  return (["start", "first", "second"] as const).map((kind) => {
    const circle = connectedPointingGeometry[kind];
    return { kind, ...circle, radius: Math.max(circle.radius, minimumRadius) };
  });
}
export function connectedContactRegion({
  x,
  y,
  pixelsPerUnit,
  contactSize = 44,
}: {
  x: number;
  y: number;
  pixelsPerUnit: number;
  contactSize?: number;
}): ConnectedPointingRegion | null {
  if (!Number.isFinite(pixelsPerUnit) || pixelsPerUnit <= 0) return null;
  return (
    connectedContactRegions({ pixelsPerUnit, contactSize }).find(
      (circle) =>
        (x - circle.x) ** 2 + (y - circle.y) ** 2 <= circle.radius ** 2,
    )?.kind ?? null
  );
}
