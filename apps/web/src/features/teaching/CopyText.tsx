import type { Copy, ParentSpan } from "@readatthree/teaching";
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

export function ParentSpanText({ span }: { span: ParentSpan }) {
  if ("copy" in span) return <CopyText copy={span.copy} />;
  return span.runs.map((run, index) =>
    run.emphasis === "strong" ? (
      <strong key={index}>
        <CopyText copy={run.copy} />
      </strong>
    ) : run.emphasis === "italic" ? (
      <em key={index}>
        <CopyText copy={run.copy} />
      </em>
    ) : (
      <span key={index}>
        <CopyText copy={run.copy} />
      </span>
    ),
  );
}
