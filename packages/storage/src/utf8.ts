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
