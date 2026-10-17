// JSON Schema string lengths count Unicode code points, including lone surrogates.
export function unicodeLength(value: string): number {
  let length = 0;
  for (const _character of value) {
    length += 1;
  }
  return length;
}

export function utf8ByteLength(value: string): number {
  let length = 0;
  for (const character of value) {
    const first = character.charCodeAt(0);
    if (character.length === 2) length += 4;
    else if (first >= 0xd800 && first <= 0xdfff)
      throw new Error("Invalid UTF-8 source string");
    else length += first < 0x80 ? 1 : first < 0x800 ? 2 : 3;
  }
  return length;
}
