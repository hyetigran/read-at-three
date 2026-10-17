import { printedGlyphAssets } from "@readatthree/teaching";
import type { PrintedGlyph } from "@readatthree/teaching";
export function SoundGlyph({ glyph }: { glyph: PrintedGlyph }) {
  const asset = printedGlyphAssets[glyph];
  return (
    <svg
      className={`teaching-glyph teaching-glyph-${glyph}`}
      viewBox="0 0 310 250"
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
