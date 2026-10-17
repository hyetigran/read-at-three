import { createElement, useState, useSyncExternalStore } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createCommittedTeaching,
  useCommittedTeaching,
} from "@readatthree/react-integration";
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
function Harness() {
  const [attached, setAttached] = useState(true);
  return createElement(
    QueryClientProvider,
    { client: queryClient },
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
  );
}
const root = document.getElementById("root");
if (!root) throw new Error("Test root missing");
createRoot(root).render(createElement(Harness));
