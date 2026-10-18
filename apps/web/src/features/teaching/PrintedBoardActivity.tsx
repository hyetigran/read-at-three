import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import type { BoardPresentation } from "@readatthree/teaching";
import {
  reviewedPrintedBoards,
  printedDiagramAsset,
} from "@readatthree/teaching";
import { SoundGlyph } from "./SoundGlyph";

const diagramWidth = Number(printedDiagramAsset.viewBox.split(" ")[2]);
const diagramHeight = Number(printedDiagramAsset.viewBox.split(" ")[3]);

type Contact =
  { kind: "pointer"; id: number } | { kind: "key"; key: " " | "Enter" };
type Stage =
  | "idle"
  | "startTouch"
  | "startHold"
  | "movingUnder"
  | "underHold"
  | "movingEnd"
  | "endpointHeld"
  | "releasedSweep"
  | "endpointFeedback";
type Run =
  | { stage: "idle" }
  | {
      stage: Exclude<Stage, "idle">;
      contact: Contact | null;
      generation: number;
    };
export function PrintedBoardActivity({
  presentation,
  disabled,
  retire,
}: {
  presentation: BoardPresentation;
  disabled: boolean;
  retire: RefObject<() => void>;
}) {
  const [run, setRun] = useState<Run>({ stage: "idle" });
  const current = useRef<Run>({ stage: "idle" });
  const generation = useRef(0);
  const timer = useRef<number | undefined>(undefined);
  const expectedCaptureLoss = useRef<number | null>(null);
  const blocked = useRef(disabled);
  blocked.current = disabled;
  const intent = presentation.cue;
  function publish(next: Run) {
    current.current = next;
    setRun(next);
  }
  function cancel() {
    generation.current++;
    window.clearTimeout(timer.current);
    timer.current = undefined;
    expectedCaptureLoss.current = null;
    publish({ stage: "idle" });
  }
  useLayoutEffect(() => {
    retire.current = cancel;
    return () => {
      if (retire.current === cancel) retire.current = () => {};
    };
  });
  function schedule(
    stage: Exclude<Stage, "idle">,
    contact: Contact | null,
    delay: number,
    token: number,
  ) {
    timer.current = window.setTimeout(() => {
      if (blocked.current || generation.current !== token) return;
      publish({ stage, contact, generation: token });
      if (stage === "movingUnder") schedule("underHold", contact, 150, token);
      else if (stage === "movingEnd")
        schedule("endpointHeld", contact, 150, token);
      else if (stage === "endpointFeedback")
        timer.current = window.setTimeout(() => {
          if (generation.current === token) cancel();
        }, 500);
    }, delay);
  }
  function begin(contact: Contact) {
    if (
      blocked.current ||
      intent.kind === "none" ||
      current.current.stage !== "idle"
    )
      return;
    const token = ++generation.current;
    const stage =
      intent.kind === "endpointSweep" &&
      intent.preparation === "parentControlledStartHold"
        ? "startHold"
        : "startTouch";
    publish({ stage, contact, generation: token });
    if (stage === "startTouch")
      schedule(
        intent.kind === "underSymbolHold" ? "movingUnder" : "movingEnd",
        contact,
        250,
        token,
      );
  }
  function matches(contact: Contact) {
    const owner =
      current.current.stage === "idle" ? null : current.current.contact;
    return (
      owner !== null &&
      owner.kind === contact.kind &&
      (owner.kind === "pointer" && contact.kind === "pointer"
        ? owner.id === contact.id
        : owner.kind === "key" &&
          contact.kind === "key" &&
          owner.key === contact.key)
    );
  }
  function release(contact: Contact) {
    if (!matches(contact)) return;
    const active = current.current;
    if (!blocked.current && active.stage === "startHold") {
      publish({
        stage: "releasedSweep",
        contact: null,
        generation: active.generation,
      });
      schedule("endpointFeedback", null, 150, active.generation);
    } else cancel();
  }
  useEffect(() => {
    if (disabled) cancel();
  }, [disabled]);
  useEffect(() => {
    const end = () => cancel();
    window.addEventListener("blur", end);
    document.addEventListener("visibilitychange", end);
    return () => {
      generation.current++;
      window.clearTimeout(timer.current);
      window.removeEventListener("blur", end);
      document.removeEventListener("visibilitychange", end);
    };
  }, []);
  const board = reviewedPrintedBoards[presentation.board.assetId];
  const stage = disabled ? "idle" : run.stage;
  return (
    <div className="printed-board-activity">
      <div
        className={`printed-board printed-board-${board.layout}`}
        data-board={presentation.board.assetId}
        data-focus={presentation.focus}
        data-cue-stage={stage}
      >
        {board.targets.map((glyph) => (
          <div
            key={glyph}
            className="printed-board-cell"
            data-target={glyph}
            data-focused={glyph === presentation.focus}
          >
            <SoundGlyph glyph={glyph} />
            <div
              className="printed-board-diagram-slot"
              style={{ aspectRatio: `${diagramWidth} / ${diagramHeight}` }}
            >
              <svg
                className="printed-board-diagram"
                viewBox={printedDiagramAsset.viewBox}
                aria-hidden="true"
              >
                <path
                  d={printedDiagramAsset.shaft}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <circle
                  data-anchor="start"
                  cx={printedDiagramAsset.start.x}
                  cy={printedDiagramAsset.start.y}
                  r={printedDiagramAsset.start.radius}
                />
                <circle
                  data-anchor="under"
                  cx={printedDiagramAsset.under.x}
                  cy={printedDiagramAsset.under.y}
                  r={printedDiagramAsset.under.radius}
                />
                <path data-anchor="end" d={printedDiagramAsset.end} />
                {glyph === presentation.focus && stage !== "idle" ? (
                  <circle
                    className="printed-board-marker"
                    data-stage={stage}
                    cy={
                      stage === "underHold" || stage === "movingUnder" ? 43 : 20
                    }
                    cx={
                      stage === "underHold" || stage === "movingUnder"
                        ? 155
                        : [
                              "movingEnd",
                              "endpointHeld",
                              "releasedSweep",
                              "endpointFeedback",
                            ].includes(stage)
                          ? 285
                          : 20
                    }
                    r="11"
                  />
                ) : null}
              </svg>
              {glyph === presentation.focus && intent.kind !== "none" ? (
                <button
                  type="button"
                  className="printed-board-contact"
                  aria-label="Play pointing cue"
                  data-origin="added"
                  style={{
                    left: `${(printedDiagramAsset.start.x / diagramWidth) * 100}%`,
                    top: `${(printedDiagramAsset.start.y / diagramHeight) * 100}%`,
                  }}
                  disabled={disabled}
                  onPointerDown={(event) => {
                    if (!event.isPrimary || event.button !== 0) return;
                    event.preventDefault();
                    if (current.current.stage !== "idle") return;
                    event.currentTarget.setPointerCapture(event.pointerId);
                    begin({ kind: "pointer", id: event.pointerId });
                  }}
                  onPointerUp={(event) => {
                    const contact: Contact = {
                      kind: "pointer",
                      id: event.pointerId,
                    };
                    if (!matches(contact)) return;
                    release(contact);
                    if (
                      event.currentTarget.hasPointerCapture(event.pointerId)
                    ) {
                      expectedCaptureLoss.current = event.pointerId;
                      event.currentTarget.releasePointerCapture(
                        event.pointerId,
                      );
                    }
                  }}
                  onPointerCancel={(event) => {
                    if (matches({ kind: "pointer", id: event.pointerId }))
                      cancel();
                  }}
                  onLostPointerCapture={(event) => {
                    if (expectedCaptureLoss.current === event.pointerId) {
                      expectedCaptureLoss.current = null;
                      return;
                    }
                    if (matches({ kind: "pointer", id: event.pointerId }))
                      cancel();
                  }}
                  onKeyDown={(event) => {
                    if (event.key === " " || event.key === "Enter") {
                      event.preventDefault();
                      if (!event.repeat) begin({ kind: "key", key: event.key });
                    }
                  }}
                  onKeyUp={(event) => {
                    if (event.key === " " || event.key === "Enter") {
                      event.preventDefault();
                      release({ kind: "key", key: event.key });
                    }
                  }}
                  onBlur={cancel}
                />
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
