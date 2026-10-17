import {
  StrictMode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  Navigate,
  Outlet,
  RouterProvider,
  useBlocker,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createCommittedTeaching,
  useCommittedTeaching,
} from "@readatthree/react-integration";
import { canonical } from "@readatthree/teaching";
import type { CourseAction, Owner } from "@readatthree/teaching";
import { TeachingScreen } from "./features/teaching/TeachingScreen.tsx";
import {
  RecoveryScreen,
  WindowRecovery,
} from "./features/teaching/RecoveryScreen.tsx";
import { AddedText } from "./features/teaching/CopyText.tsx";
import {
  menuEntryKey,
  LessonMap,
  LessonMenu,
  ParentGate,
  ParentSettings,
  SavedWorkScreen,
  Unavailable,
} from "./features/course/CourseScreens.tsx";
import { Button } from "./components/ui/button.tsx";
import { createBrowserTeachingClient } from "./platform/teaching-client.ts";
import { createWritingController } from "./platform/writing-controller.ts";
import { isTeachingViewport, subscribeViewport } from "./platform/viewport.ts";
import "./styles.css";
import "./teaching.css";
import "./course.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, refetchOnWindowFocus: false },
    mutations: { retry: false },
  },
});
const client = createBrowserTeachingClient();
const controller = createWritingController({
  client,
  initialSurface: "other",
  createTeaching: (stageRestore) =>
    createCommittedTeaching({ queryClient, repository: client, stageRestore }),
});
if (import.meta.hot) import.meta.hot.dispose(() => controller.close());
function ApplicationShell() {
  const committed = useCommittedTeaching(controller.committed);
  const state = useSyncExternalStore(controller.subscribe, controller.getState);
  const supported = useSyncExternalStore(
    subscribeViewport,
    isTeachingViewport,
    () => false,
  );
  const location = useLocation();
  const navigate = useNavigate();
  const currentLocation = useRef(location);
  currentLocation.current = location;
  const entryAttempt = useRef(0);
  const pendingEntry = useRef<{ origin: string; owner: string | null } | null>(
    null,
  );
  const menuReturn = useRef<{ lessonId: string; entryKey: string } | null>(
    null,
  );
  const [entering, setEntering] = useState(false);
  const grant = useRef<{
    owner: string;
    destination: "/parent/settings";
  } | null>(null);
  const [departure, setDeparture] = useState<"saving" | "failed" | null>(null);
  const blockedVisit = useRef<Promise<boolean> | null>(null);
  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    if (
      (currentLocation.pathname === "/parent/settings" &&
        nextLocation.pathname !== "/parent/settings") ||
      (nextLocation.pathname !== "/parent/settings" &&
        nextLocation.pathname !== "/parent/gate")
    )
      grant.current = null;
    if (
      currentLocation.pathname !== "/teaching" ||
      (currentLocation.pathname === nextLocation.pathname &&
        currentLocation.search === nextLocation.search)
    )
      return false;
    blockedVisit.current = controller.visit();
    return true;
  });
  const read = committed.visible.data?.application;
  const selection = committed.visible.data?.directory.selection;
  const projection = committed.visible.data?.projection;
  const ownerKey = read ? canonical(read.witness.owner) : null;
  const ownerRef = useRef(ownerKey);
  ownerRef.current = ownerKey;
  const operation = state.operation;
  const busy =
    entering ||
    operation.kind === "opening" ||
    operation.kind === "pending" ||
    operation.kind === "preparing";
  const saveError =
    operation.kind === "failed" ||
    operation.kind === "inkFailed" ||
    operation.kind === "rejected"
      ? operation.message
      : null;
  useEffect(() => {
    void controller.open();
  }, []);
  useLayoutEffect(() => {
    controller.setSurface(
      location.pathname === "/teaching" ? "teaching" : "other",
    );
  }, [location.key, location.pathname]);
  useLayoutEffect(() => {
    if (
      location.pathname !== "/parent/settings" &&
      location.pathname !== "/parent/gate"
    )
      grant.current = null;
  }, [location.pathname]);
  useLayoutEffect(() => {
    if (grant.current?.owner !== ownerKey) grant.current = null;
  }, [ownerKey]);
  useEffect(() => {
    if (blocker.state !== "blocked") return;
    let active = true;
    setDeparture("saving");
    const work = blockedVisit.current ?? controller.visit();
    void work.then((saved) => {
      if (!active) return;
      if (saved) {
        setDeparture(null);
        blocker.proceed();
      } else setDeparture("failed");
    });
    return () => {
      active = false;
    };
  }, [blocker]);
  async function retryDeparture() {
    if (blocker.state !== "blocked") return;
    setDeparture("saving");
    await controller.retry();
    const saved = await controller.visit();
    if (blocker.state !== "blocked") return;
    if (saved) {
      setDeparture(null);
      blocker.proceed();
    } else setDeparture("failed");
  }
  function enter(action: CourseAction) {
    if (busy || saveError) return;
    const ticket = ++entryAttempt.current;
    const origin = location.key;
    const owner = ownerKey;
    pendingEntry.current = { origin, owner };
    const lesson = read?.course.lessons.find((lesson) =>
      lesson.tasks.some((task) => task.id === action.intent.taskId),
    );
    if (lesson)
      menuReturn.current = {
        lessonId: lesson.lessonId,
        entryKey: menuEntryKey(location),
      };
    setEntering(true);
    void controller.enter(action).then((saved) => {
      if (ticket !== entryAttempt.current) return;
      setEntering(false);
      if (
        saved &&
        currentLocation.current.key === origin &&
        owner === ownerRef.current
      ) {
        pendingEntry.current = null;
        navigate("/teaching");
      }
    });
  }
  async function retryEntry() {
    await controller.retry();
    const pending = pendingEntry.current;
    if (
      pending &&
      controller.getState().operation.kind === "idle" &&
      currentLocation.current.key === pending.origin &&
      ownerRef.current === pending.owner
    ) {
      pendingEntry.current = null;
      navigate("/teaching");
    }
  }
  function returnToMenu() {
    if (
      !read ||
      !projection ||
      projection.kind === "entry" ||
      projection.kind === "recovery"
    ) {
      navigate("/");
      return;
    }
    const lesson = read.course.lessons.find((lesson) =>
      lesson.tasks.some((task) => task.id === projection.taskId),
    );
    if (!lesson) {
      navigate("/");
      return;
    }
    const saved = menuReturn.current;
    navigate(`/lessons/${lesson.lessonId}`, {
      state:
        saved?.lessonId === lesson.lessonId
          ? { menuEntryKey: saved.entryKey }
          : null,
    });
  }
  let screen;
  const recovery =
    committed.recovery ??
    (operation.kind === "openingFailed"
      ? { code: "storage-initialization-failed", message: operation.message }
      : null);
  if (!projection || !read || !selection || recovery)
    screen = (
      <RecoveryScreen
        recovery={recovery}
        busy={busy}
        message={committed.read.error?.message}
        onRetry={() => void controller.reopen()}
      />
    );
  else if (!supported) screen = <WindowRecovery busy={busy} />;
  else if (location.pathname === "/")
    screen = <LessonMap read={read} onEntry={enter} busy={busy} />;
  else if (location.pathname.startsWith("/lessons/"))
    screen = <LessonMenu read={read} onEntry={enter} busy={busy} />;
  else if (location.pathname === "/teaching")
    screen =
      projection.kind === "entry" || projection.kind === "recovery" ? (
        <Unavailable title="No selected activity" />
      ) : (
        <TeachingScreen
          projection={projection}
          correctionPreview={state.correctionPreview}
          busy={busy || departure === "saving"}
          saveError={saveError}
          writingController={controller}
          onAction={controller.act}
          onReview={controller.act}
          onRetry={() => void controller.retry()}
          onOpenRetry={() => void controller.reopen()}
          onLessonMenu={returnToMenu}
          lessonNumber={
            read.course.lessons.find((lesson) =>
              lesson.tasks.some((task) => task.id === projection.taskId),
            )?.number ?? 1
          }
          inputSuspended={state.inputSuspended}
        />
      );
  else if (location.pathname.startsWith("/work/"))
    screen = (
      <SavedWorkScreen read={read} client={client} selection={selection} />
    );
  else if (location.pathname === "/parent/gate")
    screen = (
      <ParentGate
        owner={read.witness.owner}
        onGrant={(owner: Owner) => {
          grant.current = {
            owner: canonical(owner),
            destination: "/parent/settings",
          };
          navigate("/parent/settings", { replace: true });
        }}
      />
    );
  else if (location.pathname === "/parent/settings")
    screen =
      grant.current?.owner === ownerKey &&
      grant.current.destination === "/parent/settings" ? (
        <ParentSettings />
      ) : (
        <Navigate to="/parent/gate" replace />
      );
  else screen = <Unavailable title="Page unavailable" />;
  return (
    <>
      {screen}
      <Outlet />
      {departure ? (
        <aside
          className="course-navigation-status"
          role={departure === "failed" ? "alert" : "status"}
        >
          <p>
            <AddedText>
              {departure === "failed"
                ? "Your place could not be saved. Keep this window open and retry before leaving."
                : "Saving your place before leaving…"}
            </AddedText>
          </p>
          {departure === "failed" ? (
            <Button
              className="course-primary"
              onClick={() => void retryDeparture()}
            >
              <AddedText>Retry save and leave</AddedText>
            </Button>
          ) : null}
        </aside>
      ) : saveError && location.pathname !== "/teaching" ? (
        <aside className="course-navigation-status" role="alert">
          <p>
            <AddedText>{saveError}</AddedText>
          </p>
          <Button className="course-primary" onClick={() => void retryEntry()}>
            <AddedText>Retry save</AddedText>
          </Button>
        </aside>
      ) : null}
    </>
  );
}
const router = createBrowserRouter([
  {
    element: <ApplicationShell />,
    children: [
      { path: "/", element: <></> },
      { path: "/lessons/:lessonId", element: <></> },
      { path: "/teaching", element: <></> },
      { path: "/work/:runId", element: <></> },
      { path: "/parent/gate", element: <></> },
      { path: "/parent/settings", element: <></> },
      { path: "*", element: <></> },
    ],
  },
]);
const root = document.getElementById("root");
if (!root) throw new Error("Application root is missing.");
createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
