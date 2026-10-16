import { StrictMode, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { Projection, TeachingCommand } from "@readatthree/teaching";
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
function sameOwner(view: Projection, command: TeachingCommand): boolean {
  return (
    view.kind !== "recovery" &&
    view.owner.profileId === command.owner.profileId &&
    view.owner.generation === command.owner.generation &&
    view.packageHash === command.payload.packageHash
  );
}
type SaveState =
  | { kind: "idle" }
  | { kind: "preparing" }
  | { kind: "pending"; command: TeachingCommand }
  | { kind: "failed"; command: TeachingCommand; message: string }
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
  const active = useRef(initial);
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
    const nextKey = keyFor(next);
    cache.setQueryData(nextKey, next);
    setQueryKey(nextKey);
  }
  const mutation = useMutation({
    mutationFn: (command: TeachingCommand) => client.dispatch(command),
    networkMode: "always",
    retry: false,
    async onSuccess(result, command) {
      if (!sameOwner(active.current, command)) return;
      if (result.kind === "rejected") {
        setSave({
          kind: "rejected",
          message:
            "The reading place changed before this action could be accepted. Retry to reload the saved place without advancing.",
        });
        return;
      }
      const next = await client.read();
      if (
        sameOwner(active.current, command) &&
        (next.kind === "recovery" || sameOwner(next, command))
      )
        publish(next);
      setSave({ kind: "idle" });
    },
    onError(_error, command) {
      if (sameOwner(active.current, command))
        setSave({
          kind: "failed",
          command,
          message:
            "This save could not be confirmed. Keep this reading window open and retry the same action.",
        });
    },
  });
  async function advance() {
    if (
      save.kind !== "idle" ||
      mutation.isPending ||
      !isTeachingViewport() ||
      document.visibilityState !== "visible"
    )
      return;
    const captured = view;
    setSave({ kind: "preparing" });
    try {
      const command = await client.prepare(captured);
      if (
        !sameOwner(active.current, command) ||
        keyFor(active.current).join("/") !== keyFor(captured).join("/")
      ) {
        setSave({ kind: "idle" });
        return;
      }
      setSave({ kind: "pending", command });
      mutation.mutate(command);
    } catch {
      setSave({
        kind: "rejected",
        message:
          "This action is unavailable. Retry to reload your saved place without advancing.",
      });
    }
  }
  async function retry() {
    if (save.kind === "failed") {
      setSave({ kind: "pending", command: save.command });
      mutation.mutate(save.command);
    } else if (save.kind === "rejected") {
      try {
        publish(await client.read());
        setSave({ kind: "idle" });
      } catch {
        setSave({
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
      busy={
        mutation.isPending ||
        save.kind === "preparing" ||
        save.kind === "pending"
      }
      saveError={
        save.kind === "failed" || save.kind === "rejected" ? save.message : null
      }
      onAdvance={() => {
        void advance();
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
