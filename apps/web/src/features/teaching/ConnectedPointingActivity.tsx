import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import {
  connectedPointingBoards,
  connectedRenderingProfile,
  currentPrintedGlyphAssets,
} from "@readatthree/teaching";
import type {
  ConnectedPointingPresentation,
  ConnectedPointingRegion,
} from "@readatthree/teaching";
import {
  connectedContactRegion,
  connectedContactRegions,
} from "@/platform/connected-pointing-input";

type Contact =
  | { kind: "idle" }
  | {
      kind: "pointer";
      pointerId: number;
      region: ConnectedPointingRegion | null;
    }
  | { kind: "keyboard"; region: ConnectedPointingRegion };

export function ConnectedPointingActivity({
  presentation,
  disabled,
  retire,
}: {
  presentation: ConnectedPointingPresentation;
  disabled: boolean;
  retire: RefObject<() => void>;
}) {
  const svg = useRef<SVGSVGElement>(null);
  const contact = useRef<Contact>({ kind: "idle" });
  const [pixelsPerUnit, setPixelsPerUnit] = useState(0);
  const [visible, setVisible] = useState<Contact>(contact.current);
  const asset = connectedPointingBoards[presentation.board];
  const geometry = asset.geometry;
  const profile = connectedRenderingProfile(presentation.board);
  const region = disabled || visible.kind === "idle" ? null : visible.region;
  useLayoutEffect(() => {
    const element = svg.current;
    if (!element) return;
    function measure() {
      const matrix = element?.getScreenCTM();
      if (matrix)
        setPixelsPerUnit(
          Math.min(
            Math.hypot(matrix.a, matrix.b),
            Math.hypot(matrix.c, matrix.d),
          ),
        );
    }
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  function update(next: Contact) {
    contact.current = next;
    setVisible(next);
  }
  function clear() {
    const previous = contact.current;
    update({ kind: "idle" });
    if (
      previous.kind === "pointer" &&
      svg.current?.hasPointerCapture(previous.pointerId)
    )
      svg.current.releasePointerCapture(previous.pointerId);
  }
  useEffect(() => {
    retire.current = clear;
    window.addEventListener("blur", clear);
    document.addEventListener("visibilitychange", clear);
    return () => {
      if (retire.current === clear) retire.current = () => {};
      window.removeEventListener("blur", clear);
      document.removeEventListener("visibilitychange", clear);
      const previous = contact.current;
      contact.current = { kind: "idle" };
      if (
        previous.kind === "pointer" &&
        svg.current?.hasPointerCapture(previous.pointerId)
      )
        svg.current.releasePointerCapture(previous.pointerId);
    };
  }, [retire]);
  useEffect(() => {
    if (disabled) clear();
  }, [disabled]);
  function hit(clientX: number, clientY: number) {
    const matrix = svg.current?.getScreenCTM();
    if (!matrix) return null;
    const point = new DOMPoint(clientX, clientY).matrixTransform(
      matrix.inverse(),
    );
    return connectedContactRegion({
      x: point.x,
      y: point.y,
      contactSize: profile.contactSize,
      geometry,
      pixelsPerUnit: Math.min(
        Math.hypot(matrix.a, matrix.b),
        Math.hypot(matrix.c, matrix.d),
      ),
    });
  }
  return (
    <div
      className={`teaching-connected-pointing${profile.childVoiced ? " teaching-connected-child-voiced" : ""}`}
    >
      <svg
        ref={svg}
        style={
          profile.childVoiced
            ? {
                width: profile.width,
                height: profile.height,
                maxHeight: "none",
              }
            : undefined
        }
        className="teaching-connected-board"
        viewBox={geometry.viewBox}
        role="group"
        aria-label={`Connected ${presentation.board.split("").join(" ")} pointing diagram`}
        aria-describedby="connected-pointing-guidance"
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        data-board={presentation.board}
        data-contact={region ?? "idle"}
        onPointerDown={(event) => {
          if (
            disabled ||
            presentation.role === "echo" ||
            !event.isPrimary ||
            event.button !== 0 ||
            contact.current.kind !== "idle" ||
            hit(event.clientX, event.clientY) !== "start"
          )
            return;
          event.preventDefault();
          event.currentTarget.focus({ preventScroll: true });
          event.currentTarget.setPointerCapture(event.pointerId);
          update({
            kind: "pointer",
            pointerId: event.pointerId,
            region: "start",
          });
        }}
        onPointerMove={(event) => {
          const current = contact.current;
          if (
            disabled ||
            presentation.role === "echo" ||
            !event.isPrimary ||
            current.kind !== "pointer" ||
            current.pointerId !== event.pointerId
          )
            return;
          update({ ...current, region: hit(event.clientX, event.clientY) });
        }}
        onPointerUp={(event) => {
          if (
            contact.current.kind === "pointer" &&
            contact.current.pointerId === event.pointerId
          )
            clear();
        }}
        onPointerCancel={(event) => {
          if (
            contact.current.kind === "pointer" &&
            contact.current.pointerId === event.pointerId
          )
            clear();
        }}
        onLostPointerCapture={(event) => {
          if (
            contact.current.kind === "pointer" &&
            contact.current.pointerId === event.pointerId
          )
            clear();
        }}
        onBlur={clear}
        onKeyDown={(event) => {
          if (disabled || presentation.role === "echo") return;
          if (event.key === "Escape") clear();
          if (event.key === " " || event.key === "Enter") {
            event.preventDefault();
            if (!event.repeat && contact.current.kind === "idle")
              update({ kind: "keyboard", region: "start" });
          }
          const current = contact.current;
          if (
            current.kind !== "keyboard" ||
            (event.key !== "ArrowRight" && event.key !== "ArrowLeft")
          )
            return;
          event.preventDefault();
          update({
            kind: "keyboard",
            region:
              event.key === "ArrowRight"
                ? current.region === "start"
                  ? "first"
                  : "second"
                : current.region === "second"
                  ? "first"
                  : "start",
          });
        }}
        onKeyUp={(event) => {
          if (
            (event.key === " " || event.key === "Enter") &&
            contact.current.kind === "keyboard"
          )
            clear();
        }}
      >
        {connectedContactRegions({
          pixelsPerUnit,
          geometry,
          contactSize: profile.contactSize,
        }).map((circle) => (
          <circle
            key={circle.kind}
            data-contact-region={circle.kind}
            cx={circle.x}
            cy={circle.y}
            r={circle.radius}
            fill="transparent"
            pointerEvents="all"
          />
        ))}
        {asset.glyphs.map((key, index) => {
          const glyph = currentPrintedGlyphAssets[key],
            placement = geometry.glyphs[index];
          return placement ? (
            <svg
              key={index}
              {...placement}
              viewBox={profile.glyphViewBox}
              aria-hidden="true"
            >
              <path
                d={glyph.path}
                transform={glyph.transform ?? undefined}
                fillRule={glyph.fillRule}
              />
            </svg>
          ) : null;
        })}
        <path
          d={geometry.shaft}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
        />
        <path d={geometry.tip} />
        {(["start", "first", "second"] as const).map((key) => {
          const circle = geometry[key];
          return (
            <g key={key}>
              {region === key ? (
                <circle
                  className="teaching-connected-contact"
                  cx={circle.x}
                  cy={circle.y}
                  r={circle.radius + 8}
                />
              ) : null}
              <circle
                data-region={key}
                cx={circle.x}
                cy={circle.y}
                r={circle.radius}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
