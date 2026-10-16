// JSON Schema string lengths count Unicode code points, including lone surrogates.
export function unicodeLength(value: string): number {
  let length = 0;
  for (const _character of value) {
    length += 1;
  }
  return length;
}
