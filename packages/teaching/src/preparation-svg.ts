const numberPattern =
  "[-+]?(?:[0-9]+(?:\\.[0-9]*)?|\\.[0-9]+)(?:[eE][-+]?[0-9]+)?";
const numeric = new RegExp(`^${numberPattern}$`, "u");
function finite(value: string): number {
  if (
    !numeric.test(value) ||
    !Number.isFinite(Number(value)) ||
    Math.abs(Number(value)) > 10000
  )
    throw new Error("Preparation geometry has an invalid coordinate.");
  return Number(value);
}
function numbers(value: string, count: number): number[] {
  const tokens = value.trim().split(/[ ,]+/u);
  if (tokens.length !== count)
    throw new Error("Preparation geometry has invalid dimensions.");
  return tokens.map(finite);
}
function pathData(value: string) {
  if (value.length > 8192) throw new Error("Preparation path is too large.");
  const token = new RegExp(`[MmLlHhVvCcSsQqTtAaZz]|${numberPattern}`, "gyu");
  const arities = new Map([
    ["m", 2],
    ["l", 2],
    ["h", 1],
    ["v", 1],
    ["c", 6],
    ["s", 4],
    ["q", 4],
    ["t", 2],
    ["a", 7],
    ["z", 0],
  ]);
  let position = 0,
    command = "",
    values: number[] = [],
    first = true;
  function finish() {
    const arity = arities.get(command.toLowerCase());
    if (
      arity === undefined ||
      (arity === 0
        ? values.length !== 0
        : values.length === 0 || values.length % arity !== 0)
    )
      throw new Error("Preparation path has invalid command arguments.");
    if (command.toLowerCase() === "a")
      for (let i = 0; i < values.length; i += 7)
        if (
          (values[i + 3] !== 0 && values[i + 3] !== 1) ||
          (values[i + 4] !== 0 && values[i + 4] !== 1)
        )
          throw new Error("Preparation arc flags are invalid.");
  }
  while (position < value.length) {
    const separators = /^[ ,]*/u.exec(value.slice(position))?.[0] ?? "";
    position += separators.length;
    if (position === value.length) break;
    token.lastIndex = position;
    const match = token.exec(value);
    if (!match)
      throw new Error("Preparation path contains unsupported geometry.");
    const part = match[0];
    position = token.lastIndex;
    if (/^[A-Za-z]$/u.test(part)) {
      if (first && part.toLowerCase() !== "m")
        throw new Error("Preparation path must begin with a move.");
      if (!first) finish();
      first = false;
      command = part;
      values = [];
    } else values.push(finite(part));
  }
  if (first) throw new Error("Preparation path is empty.");
  finish();
}

export function validatePreparationSvg(svg: string): void {
  if (svg.length < 1 || svg.length > 16384)
    throw new Error("Preparation SVG size is unsupported.");
  const tag = /<\/?([a-z]+)([^<>]*)>/guy;
  const attribute = /([a-z][a-zA-Z-]*)="([^"<>]*)"/guy;
  const stack: string[] = [];
  let position = 0,
    count = 0,
    roots = 0;
  while (position < svg.length) {
    position += /^\s*/u.exec(svg.slice(position))?.[0].length ?? 0;
    if (position === svg.length) break;
    tag.lastIndex = position;
    const match = tag.exec(svg);
    if (!match || ++count > 128)
      throw new Error("Preparation SVG grammar is unsupported.");
    position = tag.lastIndex;
    const [full, name, raw] = match;
    if (
      !name ||
      raw === undefined ||
      !["svg", "g", "path", "circle"].includes(name)
    )
      throw new Error("Preparation SVG element is unsupported.");
    if (full.startsWith("</")) {
      if (raw.trim() || stack.pop() !== name)
        throw new Error("Preparation SVG nesting is invalid.");
      continue;
    }
    if (
      name === "svg" ? stack.length !== 0 || roots++ !== 0 : stack.length === 0
    )
      throw new Error("Preparation SVG root is invalid.");
    const selfClosing = raw.endsWith("/");
    if ((name === "path" || name === "circle") !== selfClosing)
      throw new Error("Preparation SVG element closure is invalid.");
    const attributes = new Map<string, string>();
    const body = selfClosing ? raw.slice(0, -1) : raw;
    let cursor = 0;
    while (cursor < body.length) {
      const space = /^\s+/u.exec(body.slice(cursor));
      if (!space)
        throw new Error("Preparation SVG attribute spacing is invalid.");
      cursor += space[0].length;
      if (cursor === body.length) break;
      attribute.lastIndex = cursor;
      const pair = attribute.exec(body);
      if (!pair || !pair[1] || pair[2] === undefined || attributes.has(pair[1]))
        throw new Error("Preparation SVG attribute is invalid.");
      attributes.set(pair[1], pair[2]);
      cursor = attribute.lastIndex;
    }
    const allowed =
      name === "svg"
        ? ["xmlns", "viewBox", "aria-hidden", "focusable"]
        : name === "g"
          ? ["fill"]
          : name === "path"
            ? ["d", "transform"]
            : ["cx", "cy", "r"];
    if ([...attributes.keys()].some((key) => !allowed.includes(key)))
      throw new Error("Preparation SVG attribute is unsupported.");
    function required(key: string): string {
      const value = attributes.get(key);
      if (value === undefined)
        throw new Error("Preparation SVG attribute is missing.");
      return value;
    }
    if (name === "svg") {
      if (
        required("xmlns") !== "http://www.w3.org/2000/svg" ||
        required("aria-hidden") !== "true" ||
        required("focusable") !== "false"
      )
        throw new Error("Preparation SVG root attributes are unsupported.");
      const bounds = numbers(required("viewBox"), 4);
      if (!(
        bounds[2] !== undefined &&
        bounds[3] !== undefined &&
        bounds[2] > 0 &&
        bounds[3] > 0
      ))
        throw new Error("Preparation SVG bounds are invalid.");
    } else if (name === "g") {
      if (!/^#[a-fA-F0-9]{6}$/u.test(required("fill")))
        throw new Error("Preparation SVG color is invalid.");
    } else if (name === "circle") {
      finite(required("cx"));
      finite(required("cy"));
      if (finite(required("r")) <= 0)
        throw new Error("Preparation circle radius is invalid.");
    } else {
      pathData(required("d"));
      const transform = attributes.get("transform");
      if (transform !== undefined) {
        const match = /^translate\(([^()]*)\) scale\(([^()]*)\)$/u.exec(
          transform,
        );
        if (!match || !match[1] || !match[2])
          throw new Error("Preparation SVG transform is unsupported.");
        numbers(match[1], 2);
        if (finite(match[2]) <= 0)
          throw new Error("Preparation SVG scale is invalid.");
      }
    }
    if (!selfClosing) stack.push(name);
  }
  if (roots !== 1 || stack.length !== 0)
    throw new Error("Preparation SVG is incomplete.");
}
