import {
  currentPrintedGlyphAssets,
  compactPrintedGeometry,
} from "@readatthree/teaching";
import type { PrintedGlyph } from "@readatthree/teaching";
export function SoundGlyph({
  glyph,
  compact = false,
}: {
  glyph: PrintedGlyph;
  compact?: boolean;
}) {
  const asset = currentPrintedGlyphAssets[glyph];
  return (
    <svg
      className={`teaching-glyph teaching-glyph-${glyph}`}
      style={
        compact
          ? {
              height: compactPrintedGeometry.glyphHeight,
              width: compactPrintedGeometry.glyphWidth,
              transform:
                glyph === "ē"
                  ? undefined
                  : `scale(${compactPrintedGeometry.existingGlyphScale})`,
            }
          : undefined
      }
      viewBox={
        glyph === "ē"
          ? compactPrintedGeometry.glyphViewBoxes["ē"]
          : compactPrintedGeometry.glyphViewBoxes.historical
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
