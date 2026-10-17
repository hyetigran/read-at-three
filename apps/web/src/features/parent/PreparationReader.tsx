import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { parseId } from "@readatthree/teaching";
import type {
  Copy,
  PackageHash,
  PreparationAvailability,
  VerifiedPreparationDocument,
} from "@readatthree/teaching";
import { Button } from "@/components/ui/button.tsx";
import { AddedText, CopyText } from "../teaching/CopyText.tsx";
import { SoundGlyph } from "../teaching/SoundGlyph.tsx";
import { readFirstTaskPreview } from "./task-preview.ts";
import type { TaskPreviewTicket } from "./task-preview.ts";
import type { ParentVisit } from "./parent-visit.ts";

type Rich = VerifiedPreparationDocument["body"]["title"];
function copyPart(copy: Rich["copy"], text: string): Copy {
  return copy.kind === "added"
    ? { kind: "added", text }
    : {
        kind: copy.kind,
        text,
        sourceRef: parseId({ kind: "source", value: copy.sourceRef }),
      };
}
export function PreparationText({ rich }: { rich: Rich }) {
  const ends = [
    ...new Set([
      0,
      rich.copy.text.length,
      ...rich.marks.flatMap((mark) => [mark.start, mark.start + mark.length]),
    ]),
  ].sort((a, b) => a - b);
  return (
    <>
      {ends.slice(0, -1).map((start, index) => {
        const end = ends[index + 1] ?? rich.copy.text.length;
        const marks = rich.marks.filter(
          (mark) => mark.start <= start && mark.start + mark.length >= end,
        );
        let part: ReactNode = (
          <CopyText
            copy={copyPart(rich.copy, rich.copy.text.slice(start, end))}
          />
        );
        if (marks.some((mark) => mark.kind === "bold"))
          part = <strong>{part}</strong>;
        if (marks.some((mark) => mark.kind === "italic"))
          part = <em>{part}</em>;
        if (marks.some((mark) => mark.kind === "underline"))
          part = <u>{part}</u>;
        return <span key={start}>{part}</span>;
      })}
    </>
  );
}
type DiagramState = Readonly<{
  kind: "loading" | "ready" | "failed";
  attempt: number;
}>;
type DiagramPresentation =
  | Readonly<{ kind: "unavailable" }>
  | Readonly<{
      kind: "document";
      document: VerifiedPreparationDocument;
      diagrams: ReadonlyMap<string, DiagramState>;
    }>;
type DiagramReport = Readonly<{
  document: VerifiedPreparationDocument;
  blockId: string;
  attempt: number;
  kind: DiagramState["kind"];
}>;
function initialDiagrams(
  availability: PreparationAvailability,
): DiagramPresentation {
  if (availability.kind === "unavailable") return { kind: "unavailable" };
  const diagrams = new Map<string, DiagramState>();
  for (const section of availability.document.body.sections) {
    for (const block of section.blocks) {
      if (block.kind === "diagram")
        diagrams.set(block.id, { kind: "loading", attempt: 0 });
    }
  }
  return { kind: "document", document: availability.document, diagrams };
}
function Diagram({
  document,
  blockId,
  assetId,
  alt,
  caption,
  state,
  onStatus,
  onRetry,
}: {
  document: VerifiedPreparationDocument;
  blockId: string;
  assetId: string;
  alt: Rich;
  caption: Rich;
  state: DiagramState;
  onStatus: (report: DiagramReport) => void;
  onRetry: (blockId: string) => void;
}) {
  const [image, setImage] = useState<Readonly<{
    url: string;
    attempt: number;
  }> | null>(null);
  useEffect(() => {
    const descriptor = document.body.assets.find(
      (asset) => asset.id === assetId,
    );
    const payload = document.assets.find(
      (asset) => asset.path === descriptor?.path,
    );
    if (!payload) {
      onStatus({ document, blockId, attempt: state.attempt, kind: "failed" });
      return;
    }
    const url = URL.createObjectURL(
      new Blob([payload.svg], { type: "image/svg+xml" }),
    );
    setImage({ url, attempt: state.attempt });
    return () => URL.revokeObjectURL(url);
  }, [document, blockId, assetId, state.attempt, onStatus]);
  return (
    <figure
      className="preparation-diagram"
      data-preparation-asset={assetId}
      data-diagram-status={state.kind}
    >
      {state.kind === "failed" ? (
        <div role="alert">
          <p>
            <AddedText>
              A preparation diagram could not be displayed. Your saved reading
              and writing are kept.
            </AddedText>
          </p>
          <Button className="course-secondary" onClick={() => onRetry(blockId)}>
            <AddedText>Retry diagram</AddedText>
          </Button>
        </div>
      ) : image && image.attempt === state.attempt ? (
        <img
          key={image.url}
          src={image.url}
          alt={alt.copy.text}
          onLoad={() =>
            onStatus({
              document,
              blockId,
              attempt: image.attempt,
              kind: "ready",
            })
          }
          onError={() =>
            onStatus({
              document,
              blockId,
              attempt: image.attempt,
              kind: "failed",
            })
          }
        />
      ) : (
        <p role="status">
          <AddedText>Opening diagram…</AddedText>
        </p>
      )}
      <figcaption>
        <PreparationText rich={caption} />
      </figcaption>
    </figure>
  );
}
export function PreparationReader({
  availability,
  visit,
  packageHash,
  acknowledged,
  busy,
  onAcknowledge,
  onContinue,
  onReturn,
  connectionTicket,
  isCurrent,
}: {
  availability: PreparationAvailability;
  visit: ParentVisit;
  packageHash: PackageHash;
  acknowledged: boolean;
  busy: boolean;
  onAcknowledge: () => void;
  onContinue: () => void;
  onReturn: () => void;
  connectionTicket: () => number;
  isCurrent: (ticket: TaskPreviewTicket) => boolean;
}) {
  const [diagrams, setDiagrams] = useState(() => initialDiagrams(availability));
  const availableDocument =
    availability.kind === "available" ? availability.document : null;
  useEffect(
    () => setDiagrams(initialDiagrams(availability)),
    [availableDocument],
  );
  const diagramStatus = useCallback((report: DiagramReport) => {
    setDiagrams((current) => {
      if (current.kind !== "document" || current.document !== report.document)
        return current;
      const previous = current.diagrams.get(report.blockId);
      if (
        !previous ||
        previous.attempt !== report.attempt ||
        previous.kind === report.kind
      )
        return current;
      const next = new Map(current.diagrams);
      next.set(report.blockId, { kind: report.kind, attempt: report.attempt });
      return { ...current, diagrams: next };
    });
  }, []);
  function retryDiagram(blockId: string) {
    setDiagrams((current) => {
      if (current.kind !== "document" || current.document !== availableDocument)
        return current;
      const previous = current.diagrams.get(blockId);
      if (!previous || previous.kind !== "failed") return current;
      const next = new Map(current.diagrams);
      next.set(blockId, { kind: "loading", attempt: previous.attempt + 1 });
      return { ...current, diagrams: next };
    });
  }
  const diagramsReady =
    diagrams.kind === "document" &&
    diagrams.document === availableDocument &&
    [...diagrams.diagrams.values()].every((state) => state.kind === "ready");
  const scroll = useRef<HTMLDivElement>(null);
  const bookmark = useRef({ top: 0, focus: "" });
  const [preview, setPreview] = useState(false);
  const ticket: TaskPreviewTicket = {
    lifetime: visit.lifetime,
    routeAttempt: visit.routeAttempt,
    packageHash,
  };
  const result = useQuery({
    queryKey: [
      "preparation-task-preview",
      visit.lifetime.selection,
      visit.lifetime.connectionTicket,
      visit.lifetime.visitId,
      visit.routeAttempt,
      packageHash,
    ],
    queryFn: () =>
      readFirstTaskPreview({ ticket, connectionTicket, isCurrent }),
    enabled: preview,
    networkMode: "always",
    retry: false,
    gcTime: 0,
    refetchOnWindowFocus: false,
  });
  useLayoutEffect(() => {
    if (!preview && scroll.current) {
      scroll.current.scrollTop = bookmark.current.top;
      if (bookmark.current.focus)
        window.document
          .getElementById(bookmark.current.focus)
          ?.focus({ preventScroll: true });
    }
  }, [preview]);
  if (availability.kind === "unavailable")
    return (
      <section className="parent-message" role="alert">
        <h2>
          <AddedText>Preparation is unavailable</AddedText>
        </h2>
        <p>
          <AddedText>
            {availability.reason === "missing"
              ? "The preparation guide is not installed. Your saved reading and writing are kept."
              : "The preparation guide could not be verified. Your saved reading and writing are kept."}
          </AddedText>
        </p>
        <p>
          <AddedText>
            New profile setup needs the verified guide. You can return to your
            saved reading.
          </AddedText>
        </p>
        <Button className="course-secondary" onClick={onReturn}>
          <AddedText>Return</AddedText>
        </Button>
      </section>
    );
  const document = availability.document;
  function reference(
    block: Extract<
      VerifiedPreparationDocument["body"]["sections"][number]["blocks"][number],
      { kind: "reference" }
    >,
  ) {
    if (block.target.kind === "section") {
      const target = window.document.getElementById(
        `preparation-${block.target.sectionId}`,
      );
      target?.scrollIntoView({ block: "start" });
      target?.focus({ preventScroll: true });
    } else {
      bookmark.current = {
        top: scroll.current?.scrollTop ?? 0,
        focus: `preparation-reference-${block.id}`,
      };
      setPreview(true);
    }
  }
  return (
    <>
      <div
        className="parent-reader-scroll"
        ref={scroll}
        data-preparation-scroll
        hidden={preview}
      >
        <h2>
          <PreparationText rich={document.body.title} />
        </h2>
        <nav className="preparation-contents" aria-label="Preparation sections">
          {document.body.sections.map((section) => (
            <button
              key={section.id}
              onClick={() => {
                const heading = window.document.getElementById(
                  `preparation-${section.id}`,
                );
                heading?.scrollIntoView({ block: "start" });
                heading?.focus({ preventScroll: true });
              }}
            >
              <PreparationText rich={section.title} />
            </button>
          ))}
        </nav>
        {document.body.sections.map((section) => (
          <section className="preparation-section" key={section.id}>
            <h3 id={`preparation-${section.id}`} tabIndex={-1}>
              <PreparationText rich={section.title} />
            </h3>
            {section.blocks.map((block) => {
              switch (block.kind) {
                case "paragraph":
                  return (
                    <p
                      key={block.id}
                      className={`preparation-${block.role}`}
                      data-preparation-block={block.id}
                    >
                      {block.role !== "guidance" ? (
                        <span className="preparation-role">
                          <AddedText>
                            {block.role === "speech" ? "Say" : "Do"}
                          </AddedText>
                        </span>
                      ) : null}
                      <PreparationText rich={block.content} />
                    </p>
                  );
                case "list":
                  return block.ordered ? (
                    <ol key={block.id} data-preparation-block={block.id}>
                      {block.items.map((item, index) => (
                        <li key={index}>
                          <PreparationText rich={item} />
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <ul key={block.id} data-preparation-block={block.id}>
                      {block.items.map((item, index) => (
                        <li key={index}>
                          <PreparationText rich={item} />
                        </li>
                      ))}
                    </ul>
                  );
                case "table":
                  return (
                    <div className="preparation-table-scroll" key={block.id}>
                      <table data-preparation-block={block.id}>
                        <caption>
                          <PreparationText rich={block.caption} />
                        </caption>
                        <thead>
                          <tr>
                            {block.headers.map((header, index) => (
                              <th scope="col" key={index}>
                                <PreparationText rich={header} />
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {block.rows.map((row, index) => (
                            <tr key={index}>
                              {row.cells.map((cell, index) => (
                                <td
                                  key={index}
                                  data-preparation-symbol={cell.symbol}
                                >
                                  {cell.lines.map((line, index) => (
                                    <div key={index}>
                                      <PreparationText rich={line} />
                                    </div>
                                  ))}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                case "diagram":
                  return (
                    <Diagram
                      key={block.id}
                      document={document}
                      blockId={block.id}
                      state={
                        diagrams.kind === "document" &&
                        diagrams.document === document
                          ? (diagrams.diagrams.get(block.id) ?? {
                              kind: "loading",
                              attempt: 0,
                            })
                          : { kind: "loading", attempt: 0 }
                      }
                      onStatus={diagramStatus}
                      onRetry={retryDiagram}
                      assetId={block.assetId}
                      alt={block.alt}
                      caption={block.caption}
                    />
                  );
                case "reference":
                  return (
                    <p key={block.id}>
                      <Button
                        id={`preparation-reference-${block.id}`}
                        className="course-secondary"
                        onClick={() => reference(block)}
                      >
                        <PreparationText rich={block.label} />
                      </Button>
                    </p>
                  );
                default: {
                  const exhaustive: never = block;
                  return exhaustive;
                }
              }
            })}
          </section>
        ))}
      </div>
      {preview ? (
        <section
          className="parent-reader-scroll"
          aria-label="Read-only task preview"
        >
          <h2>
            <AddedText>Lesson 1, Task 1 · Read-only preview</AddedText>
          </h2>
          <p>
            <AddedText>
              Reading this preview does not start an activity or record
              progress.
            </AddedText>
          </p>
          {result.data?.kind === "available" ? (
            <>
              <h3>
                <CopyText copy={result.data.task.title} />
              </h3>
              {(
                ["normal", "correction"] satisfies ("normal" | "correction")[]
              ).map((kind) => (
                <section key={kind}>
                  <h4>
                    <AddedText>
                      {kind === "normal"
                        ? "Teaching sequence"
                        : "Source correction"}
                    </AddedText>
                  </h4>
                  {result.data?.kind === "available"
                    ? result.data.task.nodes
                        .filter((node) => node.kind === kind)
                        .map((node) => (
                          <article
                            className="preparation-preview-turn"
                            key={node.id}
                          >
                            {node.guidance.map((span, index) => (
                              <p key={index} data-role={span.kind}>
                                <span className="preparation-role">
                                  <AddedText>
                                    {span.kind === "action"
                                      ? "Do"
                                      : span.kind === "speech"
                                        ? "Say"
                                        : span.kind === "expected"
                                          ? "Listen for"
                                          : "Praise"}
                                  </AddedText>
                                </span>{" "}
                                <CopyText copy={span.copy} />
                              </p>
                            ))}
                            <SoundGlyph glyph={node.glyph} />
                          </article>
                        ))
                    : null}
                </section>
              ))}
            </>
          ) : (
            <p role="status">
              <AddedText>
                {result.isFetching
                  ? "Opening the verified task preview…"
                  : "This task preview is unavailable. Your reading place is unchanged."}
              </AddedText>
            </p>
          )}
          <Button
            className="course-secondary"
            onClick={() => setPreview(false)}
          >
            <AddedText>Return to preparation</AddedText>
          </Button>
        </section>
      ) : (
        <footer className="parent-reader-actions">
          <Button
            className="course-secondary"
            onClick={onReturn}
            disabled={busy}
          >
            <AddedText>Back</AddedText>
          </Button>
          <Button
            className="course-primary"
            onClick={() => {
              if (acknowledged) onContinue();
              else if (diagramsReady) onAcknowledge();
            }}
            disabled={busy || (!acknowledged && !diagramsReady)}
          >
            <AddedText>
              {acknowledged ? "Continue" : "I have read this preparation"}
            </AddedText>
          </Button>
        </footer>
      )}
    </>
  );
}
