import type { Copy } from "@readatthree/teaching";
import type { ReactNode } from "react";

export function CopyText({ copy }: { copy: Copy }) {
  switch (copy.kind) {
    case "source":
      return (
        <span data-origin="book" data-source={copy.sourceRef}>
          {copy.text}
        </span>
      );
    case "adapted":
      return (
        <span data-origin="adapted" data-source={copy.sourceRef}>
          {copy.text}
        </span>
      );
    case "added":
      return <AddedText>{copy.text}</AddedText>;
    default: {
      const exhaustive: never = copy;
      return exhaustive;
    }
  }
}

export function AddedText({ children }: { children: ReactNode }) {
  return <span data-origin="added">{children}</span>;
}
