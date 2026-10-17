import { StrictMode, useEffect, useState, useSyncExternalStore } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { Projection } from "@readatthree/teaching";
import { TeachingScreen } from "./features/teaching/TeachingScreen.tsx";
import { AddedText } from "./features/teaching/CopyText.tsx";
import { createBrowserTeachingClient } from "./platform/teaching-client.ts";
import { createWritingController } from "./platform/writing-controller.ts";
import "./styles.css";
import "./teaching.css";

const controller = createWritingController(createBrowserTeachingClient());
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, refetchOnWindowFocus: false },
    mutations: { retry: false },
  },
});
if (import.meta.hot) import.meta.hot.dispose(() => controller.close());
function keyFor(view: Projection): readonly string[] {
  if (view.kind === "recovery") return ["teaching", "recovery", view.code];
  return [
    "teaching",
    view.owner.profileId,
    view.owner.generation,
    view.packageHash,
    view.kind === "entry" ? "entry" : view.sessionId,
    ...(view.kind === "writing" || view.kind === "writingResult"
      ? view.documents.map(
          (token) =>
            `${token.documentId}:${token.revision}:${token.inputEpoch}`,
        )
      : []),
  ];
}
function ReadyApplication({ onReopen }: { onReopen: () => void }) {
  const cache = useQueryClient();
  const state = useSyncExternalStore(controller.subscribe, controller.getState);
  const projection = state.projection;
  const query = useQuery({
    queryKey: keyFor(projection),
    queryFn: async () => projection,
    initialData: projection,
    staleTime: Infinity,
    refetchOnMount: false,
    networkMode: "always",
  });
  useEffect(() => {
    cache.setQueryData(keyFor(projection), projection);
  }, [cache, projection]);
  const operation = state.operation;
  const busy =
    operation.kind === "opening" ||
    operation.kind === "pending" ||
    operation.kind === "preparing";
  return (
    <TeachingScreen
      projection={query.data === projection ? query.data : projection}
      correctionPreview={state.correctionPreview}
      busy={busy}
      saveError={
        operation.kind === "failed" ||
        operation.kind === "inkFailed" ||
        operation.kind === "rejected"
          ? operation.message
          : null
      }
      writingController={controller}
      onAction={controller.act}
      onReview={controller.act}
      onRetry={() => {
        void controller.retry();
      }}
      onOpenRetry={onReopen}
    />
  );
}
function App() {
  const [opening, setOpening] = useState(true);
  const [attachmentEpoch, setAttachmentEpoch] = useState(0);
  useEffect(() => {
    let live = true;
    void controller.open().then(() => {
      if (live) setOpening(false);
    });
    return () => {
      live = false;
    };
  }, []);
  if (opening)
    return (
      <main className="teaching-screen teaching-centered">
        <section className="teaching-recovery" aria-live="polite">
          <h1>
            <AddedText>Opening your saved place…</AddedText>
          </h1>
        </section>
      </main>
    );
  return (
    <ReadyApplication
      key={attachmentEpoch}
      onReopen={() => {
        void controller
          .reopen()
          .then(() => setAttachmentEpoch((epoch) => epoch + 1));
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
