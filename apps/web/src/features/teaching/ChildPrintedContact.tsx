import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import {
  compactPrintedGeometry,
  printedDiagramAsset,
} from "@readatthree/teaching";
import type { PrintedCue } from "@readatthree/teaching";

import { reduceChildContact } from "./child-contact";
import type { ChildContact, ChildContactEvent } from "./child-contact";

export function ChildPrintedContact({
  cue,
  disabled,
  retire,
  diagram = printedDiagramAsset,
  contactSize = compactPrintedGeometry.contactSize,
}: {
  cue: Extract<PrintedCue, { kind: "childUnderSymbol" }>;
  disabled: boolean;
  retire: RefObject<() => void>;
  diagram?: typeof printedDiagramAsset;
  contactSize?: number;
}) {
  const [contact, setContact] = useState<ChildContact>({
    kind: "idle",
    generation: 0,
  });
  const current = useRef<ChildContact>({ kind: "idle", generation: 0 });
  const surface = useRef<HTMLDivElement>(null);
  const target = useRef<HTMLButtonElement>(null);
  function publish(event: ChildContactEvent) {
    const next = reduceChildContact(current.current, event);
    current.current = next;
    setContact(next);
    return next;
  }
  function cancel() {
    const owned = current.current;
    publish({ kind: "retire" });
    if (owned.kind === "pointer" && target.current?.hasPointerCapture(owned.id))
      target.current.releasePointerCapture(owned.id);
  }
  useLayoutEffect(() => {
    retire.current = cancel;
    return () => {
      retire.current = () => {};
    };
  });
  useLayoutEffect(() => {
    if (disabled) cancel();
  }, [disabled]);
  useEffect(() => {
    window.addEventListener("blur", cancel);
    document.addEventListener("visibilitychange", cancel);
    return () => {
      window.removeEventListener("blur", cancel);
      document.removeEventListener("visibilitychange", cancel);
    };
  }, []);
  function point(x: number, y: number) {
    const svg = surface.current?.parentElement?.querySelector("svg");
    const matrix = svg?.getScreenCTM();
    if (!svg || !matrix) return null;
    const p = new DOMPoint(x, y).matrixTransform(matrix.inverse());
    return Number.isFinite(p.x) && Number.isFinite(p.y)
      ? { x: p.x, y: p.y }
      : null;
  }
  const start = cue.pace === "slow" ? diagram.start : diagram.under;
  const marker = cue.pace === "fast" ? diagram.under : contact;
  return (
    <div
      ref={surface}
      className="child-printed-contact"
      data-contact-stage={disabled ? "idle" : contact.kind}
      data-participant={cue.participant}
    >
      {contact.kind !== "idle" && !disabled ? (
        <svg
          className="child-contact-marker"
          viewBox={diagram.viewBox}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <circle
            cx={"x" in marker ? marker.x : start.x}
            cy={"y" in marker ? marker.y : start.y}
            r="11"
          />
        </svg>
      ) : null}
      <button
        ref={target}
        type="button"
        className="printed-board-contact"
        data-origin="added"
        aria-label="Child pointing feedback"
        disabled={disabled}
        style={{
          width: contactSize,
          height: contactSize,
          left: `${(start.x / Number(diagram.viewBox.split(" ")[2])) * 100}%`,
          top: `${(start.y / Number(diagram.viewBox.split(" ")[3])) * 100}%`,
        }}
        onPointerDown={(event) => {
          if (
            disabled ||
            !event.isPrimary ||
            event.button !== 0 ||
            current.current.kind !== "idle"
          )
            return;
          const p = point(event.clientX, event.clientY);
          if (!p) return;
          event.preventDefault();
          event.currentTarget.setPointerCapture(event.pointerId);
          publish({
            kind: "begin",
            contact: {
              kind: "pointer",
              generation: current.current.generation,
              id: event.pointerId,
              ...p,
            },
          });
        }}
        onPointerMove={(event) => {
          if (
            disabled ||
            current.current.kind !== "pointer" ||
            current.current.id !== event.pointerId
          )
            return;
          const p = point(event.clientX, event.clientY);
          if (!p) return;
          const next = publish({
            kind: "move",
            generation: current.current.generation,
            id: event.pointerId,
            ...p,
          });
          if (
            next.kind === "idle" &&
            event.currentTarget.hasPointerCapture(event.pointerId)
          )
            event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onPointerUp={(event) => {
          if (
            current.current.kind === "pointer" &&
            current.current.id === event.pointerId
          )
            cancel();
        }}
        onPointerCancel={(event) => {
          if (
            current.current.kind === "pointer" &&
            current.current.id === event.pointerId
          )
            cancel();
        }}
        onLostPointerCapture={(event) => {
          if (
            current.current.kind === "pointer" &&
            current.current.id === event.pointerId
          )
            cancel();
        }}
        onKeyDown={(event) => {
          if (disabled) return;
          if (event.key === " " || event.key === "Enter") {
            event.preventDefault();
            if (!event.repeat && current.current.kind === "idle")
              publish({
                kind: "begin",
                contact: {
                  kind: "keyboard",
                  generation: current.current.generation,
                  key: event.key,
                  ...start,
                },
              });
          } else if (
            (event.key === "ArrowLeft" || event.key === "ArrowRight") &&
            current.current.kind === "keyboard"
          ) {
            event.preventDefault();
            publish({
              kind: "keyboardMove",
              generation: current.current.generation,
              ...(event.key === "ArrowLeft" ? start : diagram.under),
            });
          }
        }}
        onKeyUp={(event) => {
          if (
            current.current.kind === "keyboard" &&
            current.current.key === event.key
          ) {
            event.preventDefault();
            cancel();
          }
        }}
        onBlur={cancel}
      />
    </div>
  );
}
