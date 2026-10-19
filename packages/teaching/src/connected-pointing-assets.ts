export const connectedPointingRoles = {
  echo: {
    parentRole: "listen",
    voice: "child",
    pointer: "none",
    label: "Child voices · Parent listens",
  },
  childConnect: {
    parentRole: "listen",
    voice: "child",
    pointer: "child",
    label: "Child voices and points · Parent listens",
  },
  togetherGuided: {
    parentRole: "together",
    voice: "both",
    pointer: "parentGuidesChild",
    label: "Parent and child voice · Parent guides child’s finger",
  },
  model: {
    parentRole: "model",
    voice: "parent",
    pointer: "parent",
    label: "Parent voices and points · Child watches",
  },
  follow: {
    parentRole: "listen",
    voice: "parent",
    pointer: "child",
    label: "Parent voices · Child points",
  },
  guided: {
    parentRole: "model",
    voice: "parent",
    pointer: "parentGuidesChild",
    label: "Parent voices and guides child's finger",
  },
} as const;
export const connectedPointingGeometry = {
  viewBox: "0 0 680 300",
  start: { x: 50, y: 240, radius: 16 },
  first: { x: 250, y: 275, radius: 10 },
  second: { x: 480, y: 275, radius: 10 },
  shaft: "M50 240H610",
  tip: "M606 226L644 240 606 254Z",
  glyphs: [
    { x: 95, y: 0, width: 310, height: 235 },
    { x: 325, y: 0, width: 310, height: 235 },
  ],
} as const;
