import { StrictMode, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type {
  AvailableAction,
  GraphNode,
  ControlTurnNode,
  ReviewSelectionAction,
  ReviewChoice,
  Projection,
  TeachingCommand,
} from "@readatthree/teaching";
import { TeachingScreen } from "./features/teaching/TeachingScreen.tsx";
import { AddedText } from "./features/teaching/CopyText.tsx";
import { createBrowserTeachingClient } from "./platform/teaching-client.ts";
import { isTeachingViewport } from "./platform/viewport.ts";
import "./styles.css";
import "./teaching.css";

const client = createBrowserTeachingClient();
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, refetchOnWindowFocus: false },
    mutations: { retry: false },
  },
});
if (import.meta.hot) import.meta.hot.dispose(() => client.close());

function keyFor(view: Projection): readonly string[] {
  if (view.kind === "recovery") return ["teaching", "recovery", view.code];
  return [
    "teaching",
    view.owner.profileId,
    view.owner.generation,
    view.packageHash,
    view.kind === "entry" ? "entry" : view.sessionId,
  ];
}
type PreparedAction = Readonly<{
  command: TeachingCommand;
  origin: Projection;
}>;
type ActionRequest =
  | AvailableAction
  | Readonly<{
      action: ReviewSelectionAction;
      choice: ReviewChoice;
    }>;
function owns(view: Projection, command: TeachingCommand): boolean {
  return (
    view.kind !== "recovery" &&
    view.owner.profileId === command.owner.profileId &&
    view.owner.generation === command.owner.generation
  );
}
type SaveState =
  | { kind: "idle" | "preparing" }
  | { kind: "pending"; prepared: PreparedAction }
  | { kind: "failed"; prepared: PreparedAction; message: string }
  | { kind: "rejected"; message: string };

function ReadyApplication({
  initial,
  onReopen,
}: {
  initial: Projection;
  onReopen: () => void;
}) {
  const cache = useQueryClient();
  const [queryKey, setQueryKey] = useState(() => keyFor(initial));
  const [save, setSave] = useState<SaveState>({ kind: "idle" });
  const [correctionPreview, setCorrectionPreview] = useState<
    GraphNode | ControlTurnNode | null
  >(null);
  const active = useRef(initial);
  const live = useRef(true);
  const operation = useRef<SaveState["kind"]>("idle");
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
    };
  }, []);
  function saveState(next: SaveState) {
    operation.current = next.kind;
    setSave(next);
  }
  function isCurrent(prepared: PreparedAction) {
    return (
      live.current &&
      active.current === prepared.origin &&
      owns(active.current, prepared.command)
    );
  }

  const query = useQuery({
    queryKey,
    queryFn: () => client.read(),
    initialData: initial,
    refetchOnMount: false,
    staleTime: Infinity,
    networkMode: "always",
  });
  const view = query.data;
  active.current = view;
  function publish(next: Projection) {
    setCorrectionPreview(null);
    const nextKey = keyFor(next);
    cache.setQueryData(nextKey, next);
    active.current = next;
    setQueryKey(nextKey);
  }
  const mutation = useMutation({
    mutationFn: (prepared: PreparedAction) => client.dispatch(prepared.command),
    networkMode: "always",
    retry: false,
    async onSuccess(result, prepared) {
      if (!isCurrent(prepared)) return;
      if (result.kind === "rejected") {
        saveState({
          kind: "rejected",
          message:
            "The reading place changed before this action could be accepted. Retry to reload the saved place without advancing.",
        });
        return;
      }
      const next = await client.read();
      if (!isCurrent(prepared)) return;
      if (
        next.kind !== "recovery" &&
        (!owns(next, prepared.command) ||
          next.kind === "entry" ||
          next.sessionId !== result.sessionId ||
          next.runId !== result.runId ||
          next.packageHash !== result.packageHash)
      ) {
        saveState({
          kind: "rejected",
          message:
            "The saved reading place changed. Reload it before continuing.",
        });
        return;
      }
      publish(next);
      saveState({ kind: "idle" });
    },
    onError(_error, prepared) {
      if (isCurrent(prepared))
        saveState({
          kind: "failed",
          prepared,
          message:
            "This save could not be confirmed. Keep this reading window open and retry the same action.",
        });
    },
  });
  async function act(action: ActionRequest) {
    if (
      operation.current !== "idle" ||
      !isTeachingViewport() ||
      document.visibilityState !== "visible"
    )
      return;
    const captured = view;
    setCorrectionPreview(
      "correctionPreview" in action ? action.correctionPreview : null,
    );
    saveState({ kind: "preparing" });
    try {
      const command =
        "intent" in action
          ? await client.prepare(captured, action)
          : await client.prepareReview({ projection: captured, ...action });
      const prepared = { command, origin: captured };
      if (!isCurrent(prepared)) {
        setCorrectionPreview(null);
        saveState({ kind: "idle" });
        return;
      }
      saveState({ kind: "pending", prepared });
      mutation.mutate(prepared);
    } catch {
      if (live.current)
        saveState({
          kind: "rejected",
          message:
            "This action is unavailable. Retry to reload your saved place without advancing.",
        });
    }
  }
  async function retry() {
    if (
      operation.current === "pending" ||
      operation.current === "preparing" ||
      !isTeachingViewport() ||
      document.visibilityState !== "visible"
    )
      return;
    if (save.kind === "failed") {
      saveState({ kind: "pending", prepared: save.prepared });
      mutation.mutate(save.prepared);
    } else if (save.kind === "rejected") {
      saveState({ kind: "preparing" });
      try {
        const next = await client.read();
        if (!live.current) return;
        publish(next);
        saveState({ kind: "idle" });
      } catch {
        if (live.current)
          saveState({
            kind: "rejected",
            message:
              "The saved place is still unavailable. Keep your data and retry.",
          });
      }
    }
  }
  const recovery: Projection = {
    kind: "recovery",
    code: "worker-lost",
    message:
      "The saved reading place could not be read. Your saved data has been kept. Reopen the local store to retry.",
  };
  return (
    <TeachingScreen
      projection={query.isError ? recovery : view}
      correctionPreview={correctionPreview}
      busy={
        mutation.isPending ||
        save.kind === "preparing" ||
        save.kind === "pending"
      }
      saveError={
        save.kind === "failed" || save.kind === "rejected" ? save.message : null
      }
      onAction={(action) => {
        void act(action);
      }}
      onReview={(request) => {
        void act(request);
      }}
      onRetry={() => {
        void retry();
      }}
      onOpenRetry={onReopen}
    />
  );
}

function App() {
  const cache = useQueryClient();
  const [epoch, setEpoch] = useState(0);
  const boot = useQuery({
    queryKey: ["teaching-bootstrap", epoch],
    queryFn: () => client.open(),
    staleTime: Infinity,
    networkMode: "always",
  });
  async function reopen() {
    const next = await client.reopen();
    cache.removeQueries({ queryKey: ["teaching"] });
    cache.setQueryData(["teaching-bootstrap", epoch + 1], next);
    setEpoch(epoch + 1);
  }
  if (boot.isPending)
    return (
      <main className="teaching-screen teaching-centered">
        <section className="teaching-recovery" aria-live="polite">
          <h1>
            <AddedText>Opening your saved place…</AddedText>
          </h1>
        </section>
      </main>
    );
  const recovery: Projection = {
    kind: "recovery",
    code: "storage-unavailable",
    message:
      "The reading store could not open safely. Keep your saved data and retry.",
  };
  return (
    <ReadyApplication
      key={epoch}
      initial={boot.isError ? recovery : boot.data}
      onReopen={() => {
        void reopen();
      }}
    />
  );
}

const root = document.getElementById("root");
if (!root) throw new Error("Application root is missing.");
createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
