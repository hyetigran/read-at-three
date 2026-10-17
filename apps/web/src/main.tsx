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
import { canonical, resolveAvatar } from "@readatthree/teaching";
import type {
  CourseAction,
  ProfileAdministrationIntent,
  SelectedOwnerWitness,
} from "@readatthree/teaching";
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
  SavedWorkScreen,
  Unavailable,
} from "./features/course/CourseScreens.tsx";
import { ParentScreens } from "./features/parent/ParentScreens.tsx";
import type { ParentAfter } from "./features/parent/ParentScreens.tsx";
import { ProfileButton } from "./features/parent/AnimalPortrait.tsx";
import {
  currentVisit,
  originAddress,
  parentAddress,
  parentRouteAllowed,
  returnFocusId,
  sameParentSelection,
} from "./features/parent/parent-visit.ts";
import type {
  ParentDestination,
  ParentOrigin,
  ParentVisit,
  ReturnFocus,
} from "./features/parent/parent-visit.ts";
import type { TaskPreviewTicket } from "./features/parent/task-preview.ts";
import { Button } from "./components/ui/button.tsx";
import { createBrowserTeachingClient } from "./platform/teaching-client.ts";
import { createWritingController } from "./platform/writing-controller.ts";
import { isTeachingViewport, subscribeViewport } from "./platform/viewport.ts";
import "./styles.css";
import "./teaching.css";
import "./course.css";
import "./features/parent/parent.css";

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
  const pendingEntry = useRef<{
    origin: string;
    selection: SelectedOwnerWitness;
    connection: number;
  } | null>(null);
  const menuReturn = useRef<{ lessonId: string; entryKey: string } | null>(
    null,
  );
  const [entering, setEntering] = useState(false);
  const [parentVisit, setParentVisit] = useState<ParentVisit | null>(null);
  const visitRef = useRef(parentVisit);
  visitRef.current = parentVisit;
  const visitSerial = useRef(0);
  const returnBookmark = useRef<ParentOrigin | null>(null);
  const pendingAdministration = useRef<{
    visit: ParentVisit;
    after: ParentAfter;
  } | null>(null);
  const [departure, setDeparture] = useState<"saving" | "failed" | null>(null);
  const blockedVisit = useRef<Promise<boolean> | null>(null);
  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
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
  const directory = committed.visible.data?.directory;
  const selection = directory?.selection;
  const connection = client.connectionTicket();
  const projection = committed.visible.data?.projection;
  const selectionKey = selection ? canonical(selection) : null;
  const lifetimeRef = useRef({ selection, connection });
  lifetimeRef.current = { selection, connection };
  const selectedProfile = directory?.profiles.find(
    (profile) => canonical(profile.edit.owner) === canonical(selection?.owner),
  );
  const operation = state.operation;
  const busy =
    entering ||
    operation.kind === "opening" ||
    operation.kind === "pending" ||
    operation.kind === "preparing" ||
    operation.kind === "adminPreparing" ||
    operation.kind === "adminSaving" ||
    operation.kind === "adopting";
  const saveError =
    operation.kind === "failed" ||
    operation.kind === "inkFailed" ||
    operation.kind === "rejected" ||
    operation.kind === "adminFailed" ||
    operation.kind === "adoptionFailed"
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
  const parentPath = location.pathname.startsWith("/parent/");
  const validVisit =
    parentVisit &&
    selection &&
    currentVisit({
      visit: parentVisit,
      selection,
      connectionTicket: connection,
    })
      ? parentVisit
      : null;
  const committedSwitch =
    (operation.kind === "adopting" || operation.kind === "adoptionFailed") &&
    parentVisit &&
    !sameParentSelection(
      operation.receipt.selection,
      parentVisit.lifetime.selection,
    );
  function defaultDestination(): ParentDestination {
    if (directory?.initialSetup.kind === "firstLaunch")
      return directory.preparation.kind === "acknowledged"
        ? { kind: "initialProfile", preferences: { avatarId: "rabbit" } }
        : { kind: "preparation", continuation: "initialProfile" };
    const match = location.pathname.match(
      /^\/parent\/profiles\/([^/]+)\/(animal|name)$/,
    );
    const profile =
      match &&
      directory?.profiles.find(
        (profile) =>
          encodeURIComponent(profile.edit.owner.profileId) === match[1],
      );
    if (match && !profile) return { kind: "unavailable" };
    if (profile && match?.[2] === "animal")
      return {
        kind: "editAvatar",
        target: profile.edit,
        avatarId: resolveAvatar({ savedId: profile.preferences.avatarId }),
      };
    if (profile && match?.[2] === "name")
      return {
        kind: "editName",
        target: profile.edit,
        displayName: profile.preferences.displayName ?? "",
      };
    if (location.pathname === "/parent/preparation")
      return { kind: "preparation", continuation: "return" };
    if (location.pathname === "/parent/profiles/new")
      return { kind: "createProfile", preferences: { avatarId: "rabbit" } };
    if (
      ![
        "/parent/gate",
        "/parent/settings",
        "/parent/profiles",
        "/parent/preparation",
      ].includes(location.pathname)
    )
      return { kind: "unavailable" };
    return location.pathname.startsWith("/parent/profiles")
      ? { kind: "profiles" }
      : { kind: "settings" };
  }
  useLayoutEffect(() => {
    if (!read || !directory || !selection || !supported || committedSwitch)
      return;
    if (parentVisit && !validVisit) {
      setParentVisit(null);
      navigate("/", { replace: true });
      return;
    }
    if (!parentPath && directory.initialSetup.kind !== "firstLaunch") {
      if (parentVisit) setParentVisit(null);
      return;
    }
    if (!parentVisit) {
      setParentVisit({
        lifetime: {
          selection,
          connectionTicket: connection,
          visitId: ++visitSerial.current,
        },
        origin: {
          kind: "map",
          entryKey: location.key,
          focus: { kind: "none" },
        },
        routeAttempt: 0,
        destination: defaultDestination(),
        gate: { kind: "locked" },
      });
      if (location.pathname !== "/parent/gate")
        navigate("/parent/gate", { replace: true });
    } else if (!parentRouteAllowed(parentVisit, location.pathname)) {
      setParentVisit({
        ...parentVisit,
        lifetime: { ...parentVisit.lifetime, visitId: ++visitSerial.current },
        gate: { kind: "locked" },
        destination: defaultDestination(),
        routeAttempt: parentVisit.routeAttempt + 1,
      });
      navigate("/parent/gate", { replace: true });
    }
  }, [
    location.key,
    selectionKey,
    connection,
    directory?.initialSetup.kind,
    supported,
    committedSwitch,
  ]);
  useLayoutEffect(() => {
    const bookmark = returnBookmark.current;
    if (!bookmark || location.pathname !== originAddress(bookmark)) return;
    if (bookmark.kind === "menu") {
      const container = document.querySelector("[data-menu-scroll]");
      if (container instanceof HTMLElement)
        container.scrollTop = bookmark.scrollTop;
    } else if (bookmark.kind === "savedWork") {
      const container = document.querySelector(".course-saved-content");
      if (container instanceof HTMLElement)
        container.scrollTop = bookmark.scrollTop;
    }
    const id = returnFocusId(bookmark.focus);
    if (id) document.getElementById(id)?.focus({ preventScroll: true });
    returnBookmark.current = null;
  }, [location.key]);
  function captureOrigin(destination: "settings" | "profiles"): ParentOrigin {
    const focus: ReturnFocus = { kind: "parentButton", destination };
    if (
      read &&
      projection &&
      projection.kind !== "entry" &&
      projection.kind !== "recovery" &&
      location.pathname === "/teaching"
    )
      return {
        kind: "teaching",
        sessionId: projection.sessionId,
        runId: projection.runId,
        packageHash: projection.packageHash,
        focus,
      };
    const lesson = read?.course.lessons.find(
      (lesson) => location.pathname === `/lessons/${lesson.lessonId}`,
    );
    if (lesson) {
      const container = document.querySelector("[data-menu-scroll]");
      return {
        kind: "menu",
        lessonId: lesson.lessonId,
        entryKey: menuEntryKey(location),
        scrollTop: container instanceof HTMLElement ? container.scrollTop : 0,
        focus,
      };
    }
    const work = read?.course.lessons
      .flatMap((lesson) => lesson.tasks.flatMap((task) => task.history))
      .find((work) => location.pathname === `/work/${work.runId}`);
    if (work) {
      const container = document.querySelector(".course-saved-content");
      return {
        kind: "savedWork",
        runId: work.runId,
        lessonId: work.lessonId,
        scrollTop: container instanceof HTMLElement ? container.scrollTop : 0,
        focus,
      };
    }
    return { kind: "map", entryKey: location.key, focus };
  }
  function openParents(kind: "settings" | "profiles") {
    if (!selection || busy || saveError) return;
    setParentVisit({
      lifetime: {
        selection,
        connectionTicket: client.connectionTicket(),
        visitId: ++visitSerial.current,
      },
      origin: captureOrigin(kind),
      routeAttempt: 0,
      destination: { kind },
      gate: { kind: "locked" },
    });
    navigate("/parent/gate");
  }
  function navigateParent(destination: ParentDestination) {
    const visit = visitRef.current;
    if (
      !visit ||
      !selection ||
      !currentVisit({
        visit,
        selection,
        connectionTicket: client.connectionTicket(),
      })
    )
      return;
    setParentVisit({
      ...visit,
      destination,
      routeAttempt: visit.routeAttempt + 1,
    });
    navigate(parentAddress(destination), { replace: true });
  }
  function returnFromParents() {
    const visit = visitRef.current;
    if (!visit || busy) return;
    setParentVisit(null);
    pendingAdministration.current = null;
    if (directory?.initialSetup.kind === "firstLaunch") {
      navigate("/", { replace: true });
      return;
    }
    returnBookmark.current = visit.origin;
    navigate(originAddress(visit.origin), {
      state:
        visit.origin.kind === "menu"
          ? { menuEntryKey: visit.origin.entryKey }
          : null,
    });
  }
  function previewCurrent(ticket: TaskPreviewTicket) {
    const visit = visitRef.current;
    const live = controller.committed.getSnapshot().visible.data;
    return (
      !!visit &&
      !!live &&
      currentVisit({
        visit,
        selection: live.directory.selection,
        connectionTicket: client.connectionTicket(),
      }) &&
      visit.lifetime.visitId === ticket.lifetime.visitId &&
      visit.routeAttempt === ticket.routeAttempt &&
      sameParentSelection(
        visit.lifetime.selection,
        ticket.lifetime.selection,
      ) &&
      live.application?.witness.activePackageHash === ticket.packageHash
    );
  }
  function finishAdministration() {
    const pending = pendingAdministration.current;
    const live = controller.committed.getSnapshot().visible.data;
    if (!pending || !live || controller.getState().operation.kind !== "idle")
      return;
    pendingAdministration.current = null;
    const visit = visitRef.current;
    if (
      !visit ||
      visit.lifetime.visitId !== pending.visit.lifetime.visitId ||
      !currentLocation.current.pathname.startsWith("/parent/")
    )
      return;
    if (
      pending.after === "map" ||
      !sameParentSelection(
        live.directory.selection,
        pending.visit.lifetime.selection,
      )
    ) {
      setParentVisit(null);
      navigate("/", { replace: true });
      return;
    }
    if (pending.after === "profiles") navigateParent({ kind: "profiles" });
    else if (live.directory.initialSetup.kind === "firstLaunch")
      navigateParent({
        kind: "initialProfile",
        preferences: { avatarId: "rabbit" },
      });
    else if (
      visit.destination.kind === "preparation" &&
      visit.destination.continuation === "profiles"
    )
      navigateParent({ kind: "profiles" });
  }
  async function submitAdministration(
    intent: ProfileAdministrationIntent,
    after: ParentAfter,
  ) {
    const visit = visitRef.current;
    if (
      !visit ||
      !selection ||
      busy ||
      !currentVisit({
        visit,
        selection,
        connectionTicket: client.connectionTicket(),
      })
    )
      return;
    pendingAdministration.current = { visit, after };
    const outcome = await controller.administer(intent);
    if (outcome.kind === "visible" || outcome.kind === "resolved")
      finishAdministration();
  }
  async function retryParent() {
    const retained = controller.getState().operation;
    await controller.retry();
    if (retained.kind === "adminFailed" || retained.kind === "adoptionFailed") {
      finishAdministration();
      return;
    }
    pendingAdministration.current = null;
    const live = controller.committed.getSnapshot().visible.data;
    const visit = visitRef.current;
    if (
      !live ||
      !visit ||
      controller.getState().operation.kind !== "idle" ||
      !currentVisit({
        visit,
        selection: live.directory.selection,
        connectionTicket: client.connectionTicket(),
      })
    )
      return;
    const destination = visit.destination;
    if ("target" in destination) {
      const target = live.directory.profiles.find(
        (profile) =>
          canonical(profile.edit.owner) === canonical(destination.target.owner),
      );
      if (target)
        setParentVisit({
          ...visit,
          destination: { ...destination, target: target.edit },
        });
    }
  }
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
    if (!selection) return;
    const selected = selection;
    const connection = client.connectionTicket();
    pendingEntry.current = { origin, selection: selected, connection };
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
        lifetimeRef.current.selection &&
        sameParentSelection(selected, lifetimeRef.current.selection) &&
        connection === client.connectionTicket()
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
      lifetimeRef.current.selection &&
      sameParentSelection(lifetimeRef.current.selection, pending.selection) &&
      client.connectionTicket() === pending.connection
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
  if (
    !projection ||
    !read ||
    !selection ||
    !directory ||
    !selectedProfile ||
    recovery
  )
    screen = (
      <RecoveryScreen
        recovery={recovery}
        busy={busy}
        message={committed.read.error?.message}
        onRetry={() => void controller.reopen()}
      />
    );
  else if (!supported) screen = <WindowRecovery busy={busy} />;
  else if (committedSwitch)
    screen = (
      <main className="course-screen course-parent">
        <section className="course-message">
          <h1>
            <AddedText>Restoring the selected child's saved work</AddedText>
          </h1>
          <p>
            <AddedText>
              The child change is saved. Reading and writing stay paused until
              restoration finishes.
            </AddedText>
          </p>
          {operation.kind === "adoptionFailed" ? (
            <Button
              className="course-primary"
              onClick={() => void retryParent()}
            >
              <AddedText>Retry restoration</AddedText>
            </Button>
          ) : null}
        </section>
      </main>
    );
  else if (
    parentPath &&
    validVisit &&
    parentRouteAllowed(validVisit, location.pathname)
  )
    screen = (
      <ParentScreens
        visit={validVisit}
        directory={directory}
        preparation={client.readPreparation().availability}
        packageHash={read.witness.activePackageHash}
        busy={busy || saveError !== null}
        onGrant={() => {
          const visit = visitRef.current;
          if (
            !visit ||
            !currentVisit({
              visit,
              selection,
              connectionTicket: client.connectionTicket(),
            })
          )
            return;
          const destination =
            directory.initialSetup.kind === "firstLaunch"
              ? directory.preparation.kind === "acknowledged"
                ? ({
                    kind: "initialProfile",
                    preferences: { avatarId: "rabbit" },
                  } satisfies ParentDestination)
                : ({
                    kind: "preparation",
                    continuation: "initialProfile",
                  } satisfies ParentDestination)
              : directory.preparation.kind !== "acknowledged" &&
                  visit.destination.kind !== "settings" &&
                  visit.destination.kind !== "preparation"
                ? ({
                    kind: "preparation",
                    continuation: "profiles",
                  } satisfies ParentDestination)
                : visit.destination;
          setParentVisit({
            ...visit,
            gate: { kind: "granted" },
            destination,
            routeAttempt: visit.routeAttempt + 1,
          });
          navigate(parentAddress(destination), { replace: true });
        }}
        onNavigate={navigateParent}
        onDraft={(destination) =>
          setParentVisit((visit) => (visit ? { ...visit, destination } : null))
        }
        onReturn={returnFromParents}
        onSubmit={(intent, after) => void submitAdministration(intent, after)}
        connectionTicket={client.connectionTicket}
        isCurrent={previewCurrent}
      />
    );
  else if (directory.initialSetup.kind === "firstLaunch" || parentPath)
    screen = (
      <main className="course-screen">
        <p role="status">
          <AddedText>Opening parent access…</AddedText>
        </p>
      </main>
    );
  else if (location.pathname === "/")
    screen = (
      <LessonMap
        read={read}
        onEntry={enter}
        busy={busy}
        profile={selectedProfile}
        onParents={openParents}
      />
    );
  else if (location.pathname.startsWith("/lessons/"))
    screen = (
      <LessonMenu
        read={read}
        onEntry={enter}
        busy={busy}
        profile={selectedProfile}
        onParents={openParents}
        navigationLifetime={canonical([selection, connection])}
      />
    );
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
          parentAccess={
            <ProfileButton
              profile={selectedProfile}
              disabled={busy}
              onClick={() => openParents("profiles")}
            />
          }
        />
      );
  else if (location.pathname.startsWith("/work/"))
    screen = (
      <SavedWorkScreen
        read={read}
        client={client}
        selection={selection}
        profile={selectedProfile}
        onParents={openParents}
      />
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
            <AddedText>
              {operation.kind === "adoptionFailed"
                ? "This change is saved. Retry to restore the committed profile and saved work."
                : saveError}
            </AddedText>
          </p>
          <Button
            className="course-primary"
            onClick={() =>
              void (pendingAdministration.current
                ? retryParent()
                : retryEntry())
            }
          >
            <AddedText>
              {operation.kind === "adoptionFailed"
                ? "Retry restoration"
                : "Retry save"}
            </AddedText>
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
      { path: "/parent/*", element: <></> },
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
