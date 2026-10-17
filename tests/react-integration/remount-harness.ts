import {
  createElement,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { ReactNode } from "react";
import { ParentScreens } from "../../apps/web/src/features/parent/ParentScreens.tsx";
import type { ParentScreensProps } from "../../apps/web/src/features/parent/ParentScreens.tsx";
import {
  currentVisit,
  sameParentSelection,
} from "../../apps/web/src/features/parent/parent-visit.ts";
import type { ParentVisit } from "../../apps/web/src/features/parent/parent-visit.ts";
import "../../apps/web/src/course.css";
import "../../apps/web/src/features/parent/parent.css";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createCommittedTeaching,
  useCommittedTeaching,
} from "@readatthree/react-integration";
import {
  AddedText,
  CopyText,
} from "../../apps/web/src/features/teaching/CopyText.tsx";
import { TeachingScreen } from "../../apps/web/src/features/teaching/TeachingScreen.tsx";
import { createBrowserTeachingClient } from "../../apps/web/src/platform/teaching-client.ts";
import { createWritingController } from "../../apps/web/src/platform/writing-controller.ts";
import "../../apps/web/src/styles.css";
import "../../apps/web/src/teaching.css";

const queryClient = new QueryClient();
const client = createBrowserTeachingClient();
const controller = createWritingController({
  client,
  createTeaching: (stageRestore) =>
    createCommittedTeaching({ queryClient, repository: client, stageRestore }),
});
void controller.open();
function Consumer() {
  const committed = useCommittedTeaching(controller.committed);
  const state = useSyncExternalStore(controller.subscribe, controller.getState);
  const view = committed.visible.data;
  if (!view) return createElement("p", null, "Opening test store");
  const cached = queryClient
    .getQueryCache()
    .getAll()
    .find(
      (query) => query.queryKey[0] === "teaching" && query.state.data === view,
    )?.state.data;
  const operation = state.operation;
  return createElement(
    "div",
    null,
    createElement(
      "output",
      { id: "selected-query", hidden: true },
      JSON.stringify(cached),
    ),
    view.projection.kind === "entry"
      ? createElement(
          "nav",
          null,
          ...view.projection.actions
            .filter((action) => "taskId" in action.intent)
            .map((action) =>
              createElement(
                "button",
                {
                  key: JSON.stringify(action.intent),
                  onClick: () => controller.act(action),
                },
                createElement(CopyText, { copy: action.label }),
              ),
            ),
        )
      : null,
    createElement(TeachingScreen, {
      projection: view.projection,
      correctionPreview: state.correctionPreview,
      busy:
        operation.kind === "opening" ||
        operation.kind === "pending" ||
        operation.kind === "preparing",
      saveError:
        operation.kind === "failed" ||
        operation.kind === "inkFailed" ||
        operation.kind === "rejected"
          ? operation.message
          : null,
      writingController: controller,
      onAction: controller.act,
      onReview: controller.act,
      onRetry: () => {
        void controller.retry();
      },
      onOpenRetry: () => {
        void controller.reopen();
      },
    }),
  );
}
function InitialSetup({ children }: { children?: ReactNode }) {
  const committed = useCommittedTeaching(controller.committed);
  const state = useSyncExternalStore(controller.subscribe, controller.getState);
  const [visit, setVisitState] = useState<ParentVisit | null>(null);
  const visitRef = useRef<ParentVisit | null>(null);
  const nextVisitId = useRef(0);
  const pending = useRef<{
    visit: ParentVisit;
    after: Parameters<ParentScreensProps["onSubmit"]>[1];
  } | null>(null);
  const view = committed.visible.data;
  const directory = view?.directory;
  const read = view?.application;
  const connectionTicket = client.connectionTicket();
  function setVisit(next: ParentVisit) {
    visitRef.current = next;
    setVisitState(next);
  }
  function initialVisit(): ParentVisit | null {
    if (!directory || !read) return null;
    return {
      lifetime: {
        selection: directory.selection,
        connectionTicket: client.connectionTicket(),
        visitId: ++nextVisitId.current,
      },
      origin: {
        kind: "map",
        entryKey: "query-remount-initial-setup",
        focus: { kind: "none" },
      },
      routeAttempt: 0,
      destination:
        directory.preparation.kind === "acknowledged"
          ? { kind: "initialProfile", preferences: { avatarId: "rabbit" } }
          : { kind: "preparation", continuation: "initialProfile" },
      gate: { kind: "locked" },
    };
  }
  useEffect(() => {
    if (!directory || directory.initialSetup.kind !== "firstLaunch") return;
    const current = visitRef.current;
    if (
      current &&
      currentVisit({
        visit: current,
        selection: directory.selection,
        connectionTicket,
      })
    )
      return;
    const next = initialVisit();
    if (next) setVisit(next);
  }, [directory, connectionTicket]);
  function liveVisit(captured: ParentVisit) {
    const live = controller.committed.getSnapshot().visible.data;
    const current = visitRef.current;
    return (
      !!live &&
      !!current &&
      current.lifetime.visitId === captured.lifetime.visitId &&
      current.routeAttempt === captured.routeAttempt &&
      currentVisit({
        visit: captured,
        selection: live.directory.selection,
        connectionTicket: client.connectionTicket(),
      })
    );
  }
  function finishAdministration() {
    const submission = pending.current;
    const live = controller.committed.getSnapshot().visible.data;
    if (!submission || !live || controller.getState().operation.kind !== "idle")
      return;
    pending.current = null;
    if (!liveVisit(submission.visit)) return;
    if (
      submission.after === "preparation" &&
      live.directory.initialSetup.kind === "firstLaunch" &&
      live.directory.preparation.kind === "acknowledged"
    )
      setVisit({
        ...submission.visit,
        routeAttempt: submission.visit.routeAttempt + 1,
        destination: {
          kind: "initialProfile",
          preferences: { avatarId: "rabbit" },
        },
      });
  }
  if (directory && directory.initialSetup.kind !== "firstLaunch")
    return children;
  if (
    !directory ||
    !read ||
    !visit ||
    !currentVisit({ visit, selection: directory.selection, connectionTicket })
  )
    return createElement(
      "p",
      null,
      createElement(AddedText, null, "Opening test store"),
    );
  const operation = state.operation;
  const error =
    operation.kind === "adminFailed" ||
    operation.kind === "adoptionFailed" ||
    operation.kind === "rejected" ||
    operation.kind === "openingFailed"
      ? operation.message
      : null;
  return createElement(
    "div",
    null,
    createElement(ParentScreens, {
      visit,
      directory,
      preparation: client.readPreparation().availability,
      packageHash: read.witness.activePackageHash,
      busy: operation.kind !== "idle",
      onGrant: () => {
        if (liveVisit(visit))
          setVisit({
            ...visit,
            gate: { kind: "granted" },
            routeAttempt: visit.routeAttempt + 1,
          });
      },
      onNavigate: (destination) => {
        if (liveVisit(visit))
          setVisit({
            ...visit,
            destination,
            routeAttempt: visit.routeAttempt + 1,
          });
      },
      onDraft: (destination) => {
        if (liveVisit(visit)) setVisit({ ...visit, destination });
      },
      onReturn: () => {
        const next = initialVisit();
        if (next && liveVisit(visit)) setVisit(next);
      },
      onSubmit: (intent, after) => {
        if (!liveVisit(visit)) return;
        pending.current = { visit, after };
        void controller.administer(intent).then(finishAdministration);
      },
      connectionTicket: client.connectionTicket,
      isCurrent: (ticket) =>
        liveVisit(visit) &&
        sameParentSelection(
          ticket.lifetime.selection,
          visit.lifetime.selection,
        ) &&
        ticket.lifetime.connectionTicket === visit.lifetime.connectionTicket &&
        ticket.lifetime.visitId === visit.lifetime.visitId &&
        ticket.routeAttempt === visit.routeAttempt &&
        ticket.packageHash ===
          controller.committed.getSnapshot().visible.data?.application?.witness
            .activePackageHash,
    }),
    error
      ? createElement(
          "div",
          { role: "alert" },
          createElement(AddedText, null, error),
          createElement(
            "button",
            {
              onClick: () => {
                void controller.retry().then(finishAdministration);
              },
            },
            createElement(AddedText, null, "Retry save"),
          ),
        )
      : null,
  );
}

function Harness() {
  const [attached, setAttached] = useState(true);
  return createElement(
    QueryClientProvider,
    { client: queryClient },
    createElement(
      InitialSetup,
      null,
      createElement(
        "div",
        { style: { position: "fixed", right: 0, top: 0, zIndex: 999 } },
        createElement(
          "button",
          { onClick: () => setAttached(false) },
          "Detach consumer",
        ),
        createElement(
          "button",
          { onClick: () => setAttached(true) },
          "Attach consumer",
        ),
      ),
      attached
        ? createElement(Consumer)
        : createElement("p", { id: "detached" }, "Consumer detached"),
    ),
  );
}
const root = document.getElementById("root");
if (!root) throw new Error("Test root missing");
createRoot(root).render(createElement(Harness));
