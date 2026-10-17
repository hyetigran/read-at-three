export function utf8(text: string): Uint8Array {
  const bytes: number[] = [];
  for (const character of text) {
    const first = character.charCodeAt(0);
    const code =
      character.length === 2
        ? ((first - 0xd800) << 10) + character.charCodeAt(1) - 0xdc00 + 0x10000
        : first;
    if (code >= 0xd800 && code <= 0xdfff)
      throw new Error("Invalid UTF-8 source string");
    if (code < 0x80) bytes.push(code);
    else if (code < 0x800) bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    else if (code < 0x10000)
      bytes.push(
        0xe0 | (code >> 12),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f),
      );
    else
      bytes.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 0x3f),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f),
      );
  }
  return Uint8Array.from(bytes);
}
export function equalBytes(left: Uint8Array, right: Uint8Array): boolean {
  return (
    left.length === right.length &&
    left.every((byte, index) => byte === right[index])
  );
}
export function decodeUtf8(bytes: Uint8Array): string {
  let text = "";
  for (let index = 0; index < bytes.length;) {
    const first = bytes[index++];
    if (first === undefined) throw new Error("Missing UTF-8 byte");
    const width =
      first < 0x80
        ? 1
        : first >= 0xc2 && first <= 0xdf
          ? 2
          : first >= 0xe0 && first <= 0xef
            ? 3
            : first >= 0xf0 && first <= 0xf4
              ? 4
              : 0;
    if (!width) throw new Error("Invalid UTF-8 leading byte");
    let code =
      first &
      (width === 1 ? 0x7f : width === 2 ? 0x1f : width === 3 ? 0x0f : 0x07);
    for (let offset = 1; offset < width; offset++) {
      const next = bytes[index++];
      if (next === undefined || (next & 0xc0) !== 0x80)
        throw new Error("Invalid UTF-8 continuation");
      code = (code << 6) | (next & 0x3f);
    }
    if (
      (width === 2 && code < 0x80) ||
      (width === 3 && code < 0x800) ||
      (width === 4 && code < 0x10000) ||
      code > 0x10ffff ||
      (code >= 0xd800 && code <= 0xdfff)
    )
      throw new Error("Invalid UTF-8 code point");
    text += String.fromCodePoint(code);
  }
  return text;
}
