import { connectedPointingGeometry } from "@readatthree/teaching";
import type { ConnectedPointingRegion } from "@readatthree/teaching";

export function connectedContactRegions({
  pixelsPerUnit,
}: {
  pixelsPerUnit: number;
}) {
  const minimumRadius = pixelsPerUnit > 0 ? 22 / pixelsPerUnit : 0;
  return (["start", "first", "second"] as const).map((kind) => {
    const circle = connectedPointingGeometry[kind];
    return { kind, ...circle, radius: Math.max(circle.radius, minimumRadius) };
  });
}
export function connectedContactRegion({
  x,
  y,
  pixelsPerUnit,
}: {
  x: number;
  y: number;
  pixelsPerUnit: number;
}): ConnectedPointingRegion | null {
  if (!Number.isFinite(pixelsPerUnit) || pixelsPerUnit <= 0) return null;
  return (
    connectedContactRegions({ pixelsPerUnit }).find(
      (circle) =>
        (x - circle.x) ** 2 + (y - circle.y) ** 2 <= circle.radius ** 2,
    )?.kind ?? null
  );
}
