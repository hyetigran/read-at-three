import { StrictMode, useEffect, useSyncExternalStore } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createCommittedTeaching,
  useCommittedTeaching,
} from "@readatthree/react-integration";
import { TeachingScreen } from "./features/teaching/TeachingScreen.tsx";
import { RecoveryScreen } from "./features/teaching/RecoveryScreen.tsx";
import { createBrowserTeachingClient } from "./platform/teaching-client.ts";
import { createWritingController } from "./platform/writing-controller.ts";
import "./styles.css";
import "./teaching.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, refetchOnWindowFocus: false },
    mutations: { retry: false },
  },
});
const client = createBrowserTeachingClient();
const controller = createWritingController({
  client,
  createTeaching: (stageRestore) =>
    createCommittedTeaching({ queryClient, repository: client, stageRestore }),
});
if (import.meta.hot) import.meta.hot.dispose(() => controller.close());
function ReadyApplication() {
  const committed = useCommittedTeaching(controller.committed);
  const state = useSyncExternalStore(controller.subscribe, controller.getState);
  const projection = committed.visible.data?.projection;
  const operation = state.operation;
  const busy =
    operation.kind === "opening" ||
    operation.kind === "pending" ||
    operation.kind === "preparing";
  const recovery =
    committed.recovery ??
    (operation.kind === "openingFailed"
      ? { code: "storage-initialization-failed", message: operation.message }
      : null);
  if (!projection || recovery)
    return (
      <RecoveryScreen
        recovery={recovery}
        busy={busy}
        message={committed.read.error?.message}
        onRetry={() => {
          void controller.reopen();
        }}
      />
    );
  return (
    <TeachingScreen
      projection={projection}
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
      onOpenRetry={() => {
        void controller.reopen();
      }}
    />
  );
}
function App() {
  useEffect(() => {
    void controller.open();
  }, []);
  return <ReadyApplication />;
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
