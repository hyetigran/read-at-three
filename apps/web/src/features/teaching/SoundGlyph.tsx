import {
  currentPrintedGlyphAssets,
  compactPrintedGeometry,
} from "@readatthree/teaching";
import type { PrintedGlyph } from "@readatthree/teaching";
export function SoundGlyph({
  glyph,
  compact = false,
  geometry = compactPrintedGeometry,
}: {
  glyph: PrintedGlyph;
  compact?: boolean;
  geometry?: typeof compactPrintedGeometry;
}) {
  const asset = currentPrintedGlyphAssets[glyph];
  return (
    <svg
      className={`teaching-glyph teaching-glyph-${glyph}`}
      style={
        compact
          ? {
              height: geometry.glyphHeight,
              width: geometry.glyphWidth,
              transform:
                glyph === "ē"
                  ? undefined
                  : `scale(${geometry.existingGlyphScale})`,
            }
          : undefined
      }
      viewBox={
        glyph === "ē"
          ? geometry.glyphViewBoxes["ē"]
          : geometry.glyphViewBoxes.historical
      }
      role="img"
      aria-label={glyph}
    >
      <path
        d={asset.path}
        transform={asset.transform ?? undefined}
        fillRule={asset.fillRule}
      />
    </svg>
  );
}
