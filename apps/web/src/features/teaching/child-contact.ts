export type ChildContact =
  | { kind: "idle"; generation: number }
  | { kind: "pointer"; generation: number; id: number; x: number; y: number }
  | {
      kind: "keyboard";
      generation: number;
      key: " " | "Enter";
      x: number;
      y: number;
    };
export type ChildContactEvent =
  | { kind: "retire" }
  | { kind: "begin"; contact: Exclude<ChildContact, { kind: "idle" }> }
  | { kind: "move"; generation: number; id: number; x: number; y: number }
  | { kind: "keyboardMove"; generation: number; x: number; y: number };
export function reduceChildContact(
  state: ChildContact,
  event: ChildContactEvent,
): ChildContact {
  switch (event.kind) {
    case "retire":
      return { kind: "idle", generation: state.generation + 1 };
    case "begin":
      return state.kind === "idle" &&
        event.contact.generation === state.generation
        ? event.contact
        : state;
    case "move":
      if (
        state.kind !== "pointer" ||
        state.id !== event.id ||
        state.generation !== event.generation
      )
        return state;
      return event.x < 0 || event.x > 310 || event.y < -24 || event.y > 80
        ? { kind: "idle", generation: state.generation + 1 }
        : { ...state, x: event.x, y: event.y };
    case "keyboardMove":
      return state.kind === "keyboard" && state.generation === event.generation
        ? { ...state, x: event.x, y: event.y }
        : state;
  }
}
