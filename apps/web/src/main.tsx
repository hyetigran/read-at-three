import { browserConfiguration } from "./platform/browser-configuration.ts";
import { StorageCleanup } from "./features/parent/StorageCleanup.tsx";
import { InstallationScreen } from "./features/installation/InstallationScreen.tsx";
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
import {
  canonical,
  resolveAvatar,
  InstalledResourceUnavailableError,
} from "@readatthree/teaching";
import type {
  CourseAction,
  ProfileAdministrationIntent,
  ProfileRemovalIntent,
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
  freshParentAfterRemoval,
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
import type { Operation } from "./platform/writing-controller.ts";
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
type PendingCourseEntry = Readonly<{
  attempt: number;
  origin: string;
  selection: SelectedOwnerWitness;
  action: CourseAction;
}>;
function retainsCourseEntry(entry: PendingCourseEntry, operation: Operation) {
  if (operation.kind === "inkFailed")
    return (
      operation.retry.kind === "action" &&
      canonical(operation.retry.request) === canonical(entry.action)
    );
  if (operation.kind !== "failed") return false;
  const retained = operation.prepared.operation;
  const command = retained.command;
  return (
    sameParentSelection(retained.selection, entry.selection) &&
    (command.kind === "select" || command.kind === "writingSelect") &&
    canonical({
      kind: command.payload.intent,
      taskId: command.payload.taskId,
      packageHash: command.payload.packageHash,
      sessionId: command.payload.sessionId,
    }) === canonical(entry.action.intent)
  );
}
function ApplicationShell() {
  const committed = useCommittedTeaching(controller.committed);
  const state = useSyncExternalStore(controller.subscribe, controller.getState);
  const [cleanupOpen, setCleanupOpen] = useState(false);
  const cleanupCommand = useRef<
    import("@readatthree/teaching").StorageCleanupCommand | null
  >(null);
  const installationCommand = useRef<
    import("@readatthree/teaching").InitialInstallCommand | null
  >(null);
  const lessonFilesCommand = useRef<
    import("@readatthree/teaching").LessonFilesCommand | null
  >(null);
  const connectionObservation = useSyncExternalStore(
    client.subscribeConnection,
    client.connectionState,
  );
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
  const pendingEntry = useRef<PendingCourseEntry | null>(null);
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
  const [removalGatePending, setRemovalGatePending] = useState(false);
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
  const selectedProfile = directory?.profiles.find(
    (profile) => canonical(profile.edit.owner) === canonical(selection?.owner),
  );
  const operation = state.operation;
  const cleanupAvailable =
    !!selection &&
    (operation.kind === "failed" ||
      operation.kind === "inkFailed" ||
      cleanupCommand.current !== null);
  const busy =
    (cleanupOpen && cleanupAvailable) ||
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
      location.key + ":" + location.pathname + location.search,
    );
  }, [location.key, location.pathname]);
  useLayoutEffect(() => {
    if (pendingEntry.current && pendingEntry.current.origin !== location.key) {
      pendingEntry.current = null;
      entryAttempt.current++;
      setEntering(false);
    }
  }, [location.key]);
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
  const removalSettled =
    ((operation.kind === "adopting" || operation.kind === "adoptionFailed") &&
      operation.receipt.version === 2) ||
    (pendingAdministration.current?.after === "removal" &&
      !!directory &&
      !directory.profiles.some(
        (profile) =>
          canonical(profile.edit.owner) ===
          canonical(
            pendingAdministration.current?.visit.lifetime.selection.owner,
          ),
      ));
  useLayoutEffect(() => {
    if (!removalSettled && !removalGatePending) return;
    if (removalSettled && !removalGatePending) {
      pendingAdministration.current = null;
      pendingEntry.current = null;
      entryAttempt.current++;
      menuReturn.current = null;
      returnBookmark.current = null;
      blockedVisit.current = null;
      visitRef.current = null;
      setParentVisit(null);
      setEntering(false);
      setRemovalGatePending(true);
    }
    if (operation.kind !== "idle" || !selection) return;
    const fresh = freshParentAfterRemoval({
      selection,
      connectionTicket: connection,
      visitId: ++visitSerial.current,
      entryKey: location.key,
    });
    visitRef.current = fresh;
    setParentVisit(fresh);
    setRemovalGatePending(false);
    navigate("/parent/gate", { replace: true });
  }, [
    removalSettled,
    removalGatePending,
    operation.kind,
    selectionKey,
    connection,
  ]);
  const committedSwitch =
    removalGatePending ||
    removalSettled ||
    ((operation.kind === "adopting" || operation.kind === "adoptionFailed") &&
      parentVisit &&
      (!("selection" in operation.receipt) ||
        !sameParentSelection(
          operation.receipt.selection,
          parentVisit.lifetime.selection,
        )));
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
    if (location.pathname === "/parent/support") return { kind: "support" };
    if (location.pathname === "/parent/lesson-files")
      return { kind: "lessonFiles" };
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
        "/parent/support",
        "/parent/lesson-files",
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
      const container = document.querySelector(".course-saved");
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
      const container = document.querySelector(".course-saved");
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
      flushSync: true,
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
    if (pending.after === "removal") {
      pendingEntry.current = null;
      entryAttempt.current++;
      menuReturn.current = null;
      returnBookmark.current = null;
      blockedVisit.current = null;
      pendingAdministration.current = null;
      const fresh = freshParentAfterRemoval({
        selection: live.directory.selection,
        connectionTicket: client.connectionTicket(),
        visitId: ++visitSerial.current,
        entryKey: currentLocation.current.key,
      });
      visitRef.current = fresh;
      setParentVisit(fresh);
      setRemovalGatePending(false);
      navigate("/parent/gate", { replace: true });
      return;
    }
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
    intent: ProfileAdministrationIntent | ProfileRemovalIntent,
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
  function finishEntry(pending: PendingCourseEntry) {
    const current = controller.committed.getSnapshot().visible.data;
    const target = current?.projection;
    if (
      pendingEntry.current !== pending ||
      pending.attempt !== entryAttempt.current ||
      currentLocation.current.key !== pending.origin ||
      controller.getState().operation.kind !== "idle" ||
      !current ||
      !sameParentSelection(current.directory.selection, pending.selection) ||
      !target ||
      target.kind === "entry" ||
      target.kind === "recovery" ||
      target.taskId !== pending.action.intent.taskId ||
      target.packageHash !== pending.action.intent.packageHash ||
      (pending.action.intent.kind === "resume" &&
        target.sessionId !== pending.action.intent.sessionId)
    )
      return;
    pendingEntry.current = null;
    navigate("/teaching");
  }
  function enter(action: CourseAction) {
    if (busy || saveError) return;
    if (!selection) return;
    const pending: PendingCourseEntry = {
      attempt: ++entryAttempt.current,
      origin: location.key,
      selection,
      action,
    };
    const connection = client.connectionTicket();
    pendingEntry.current = pending;
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
      if (pending.attempt !== entryAttempt.current) return;
      setEntering(false);
      if (saved && connection === client.connectionTicket())
        finishEntry(pending);
    });
  }
  async function retryEntry() {
    const pending = pendingEntry.current;
    const retained =
      pending && retainsCourseEntry(pending, controller.getState().operation);
    if (!retained) pendingEntry.current = null;
    await controller.retry();
    if (pending && retained) finishEntry(pending);
  }
  async function reconnectAndRecover() {
    const entry = pendingEntry.current;
    const administration = pendingAdministration.current;
    const outcome = await controller.reconnect();
    if (outcome.kind !== "restored") return;
    if (entry && retainsCourseEntry(entry, outcome.retained))
      finishEntry(entry);
    if (
      administration &&
      pendingAdministration.current === administration &&
      (outcome.retained.kind === "adminFailed" ||
        outcome.retained.kind === "adoptionFailed")
    )
      finishAdministration();
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
  type ResourceAttempt = Readonly<{
    serial: number;
    block: NonNullable<typeof state.resourceBlock>;
    connection: number;
    origin: string;
    selection: string;
    target: import("@readatthree/teaching").PublicationSelection;
  }>;
  type ResourceAction =
    | Readonly<{ kind: "idle" }>
    | Readonly<{
        kind: "pending";
        mode: "check" | "repair";
        attempt: ResourceAttempt;
      }>
    | Readonly<{
        kind: "observed";
        attempt: ResourceAttempt;
        result: import("@readatthree/teaching").PublicationCheck;
      }>
    | Readonly<{ kind: "unknown"; attempt: ResourceAttempt | null }>;
  const resourceSerial = useRef(0);
  const resourceBusy = useRef(false);
  const resourceFlight = useRef<ResourceAttempt | null>(null);
  const resourceTarget = useRef<
    import("@readatthree/teaching").PublicationSelection | null
  >(null);
  const [resourceAction, setResourceAction] = useState<ResourceAction>({
    kind: "idle",
  });
  function currentResourceAttempt(attempt: ResourceAttempt): boolean {
    return (
      attempt.serial === resourceSerial.current &&
      resourceFlight.current === attempt &&
      controller.getState().resourceBlock === attempt.block &&
      client.connectionTicket() === attempt.connection &&
      currentLocation.current.key === attempt.origin &&
      canonical(
        controller.committed.getSnapshot().visible.data?.directory.selection ??
          null,
      ) === attempt.selection
    );
  }
  async function inspectResource(mode: "check" | "repair") {
    if (resourceBusy.current) return;
    const block = controller.getState().resourceBlock;
    if (!block || (mode === "repair" && block.reason.kind !== "content"))
      return;
    resourceBusy.current = true;
    const serial = ++resourceSerial.current,
      connection = client.connectionTicket(),
      origin = currentLocation.current.key;
    const selected = canonical(
      controller.committed.getSnapshot().visible.data?.directory.selection ??
        null,
    );
    setResourceAction({ kind: "unknown", attempt: null });
    try {
      let target = resourceTarget.current;
      if (!target || target.packageHash !== block.packageHash) {
        const catalog = await client.installations();
        if (
          serial !== resourceSerial.current ||
          client.connectionTicket() !== connection ||
          currentLocation.current.key !== origin ||
          controller.getState().resourceBlock !== block ||
          canonical(
            controller.committed.getSnapshot().visible.data?.directory
              .selection ?? null,
          ) !== selected
        )
          return;
        target = {
          installationId: catalog.installationId,
          packageHash: block.packageHash,
        };
        resourceTarget.current = target;
      }
      const attempt: ResourceAttempt = {
        serial,
        block,
        connection,
        origin,
        selection: selected,
        target,
      };
      resourceFlight.current = attempt;
      setResourceAction({ kind: "pending", mode, attempt });
      const result =
        mode === "check"
          ? await client.checkPublication(target)
          : await client.repairPublication(target);
      if (!currentResourceAttempt(attempt)) return;
      if (result.kind === "unavailable")
        controller.blockResources({
          packageHash: result.target.packageHash,
          reason: result.reason,
        });
      setResourceAction({ kind: "observed", attempt, result });
    } catch {
      const attempt = resourceFlight.current;
      if (
        serial === resourceSerial.current &&
        (!attempt || currentResourceAttempt(attempt))
      )
        setResourceAction({ kind: "unknown", attempt });
    } finally {
      if (serial === resourceSerial.current) {
        resourceBusy.current = false;
        setResourceAction((current) =>
          current.kind === "pending" && !currentResourceAttempt(current.attempt)
            ? { kind: "unknown", attempt: current.attempt }
            : current,
        );
      }
    }
  }
  async function resumeResources() {
    if (
      resourceAction.kind !== "observed" ||
      resourceAction.result.kind !== "verified" ||
      !currentResourceAttempt(resourceAction.attempt)
    )
      return;
    const block = resourceAction.attempt.block;
    if (!controller.clearResourceBlock(block)) return;
    resourceFlight.current = null;
    resourceTarget.current = null;
    setResourceAction({ kind: "idle" });
    if (parentPath) await retryParent();
    else await retryEntry();
  }

  let screen;
  const recovery =
    committed.recovery ??
    (operation.kind === "openingFailed"
      ? { code: "storage-initialization-failed", message: operation.message }
      : null);
  if (!supported) screen = <WindowRecovery busy={busy} />;
  else if (state.resourceBlock)
    screen = (
      <main
        className="course-screen"
        data-package-hash={state.resourceBlock.packageHash}
      >
        <h1>
          <AddedText>Lesson files are unavailable</AddedText>
        </h1>
        <p>
          <AddedText>
            {state.resourceBlock.reason.kind === "content"
              ? "Check the saved lesson files locally, or connect to the internet and explicitly repair these lessons."
              : "These lesson files cannot be repaired by downloading. Check again or use the available recovery options."}
          </AddedText>
        </p>
        <p role="status">
          <AddedText>
            {resourceAction.kind === "pending"
              ? resourceAction.mode === "check"
                ? "Checking saved lesson files locally."
                : "Repairing the exact saved lesson files."
              : resourceAction.kind === "unknown"
                ? "The check or repair could not be confirmed. Check again before resuming."
                : resourceAction.kind === "observed"
                  ? resourceAction.result.kind === "verified"
                    ? "Lesson files verified. Choose Resume to recover your saved place."
                    : resourceAction.result.kind === "staleTarget"
                      ? "The saved reading place changed. Check again before resuming."
                      : resourceAction.result.kind === "notAuthorized"
                        ? "These lesson files are not authorized by the saved reading place."
                        : "Lesson files remain unavailable. No reading action was accepted by this check or repair."
                  : "No lesson download starts until you choose Repair these lessons."}
          </AddedText>
        </p>
        {operation.kind !== "idle" && (
          <p>
            <AddedText>
              A reading or writing action still needs recovery. Resume will
              recover that same action.
            </AddedText>
          </p>
        )}
        <Button
          disabled={resourceAction.kind === "pending"}
          onClick={() => void inspectResource("check")}
        >
          <AddedText>Check saved lessons</AddedText>
        </Button>
        <Button onClick={() => void reconnectAndRecover()}>
          <AddedText>Reconnect and recover</AddedText>
        </Button>
        {state.resourceBlock.reason.kind === "content" && (
          <Button
            disabled={resourceAction.kind === "pending"}
            onClick={() => void inspectResource("repair")}
          >
            <AddedText>Repair these lessons</AddedText>
          </Button>
        )}
        {resourceAction.kind === "observed" &&
          resourceAction.result.kind === "verified" &&
          currentResourceAttempt(resourceAction.attempt) && (
            <Button onClick={() => void resumeResources()}>
              <AddedText>Resume</AddedText>
            </Button>
          )}
      </main>
    );
  else if (browserConfiguration.kind === "installed" && !read)
    screen = (
      <InstallationScreen
        client={client}
        retained={installationCommand}
        configuration={browserConfiguration}
        opening={operation.kind === "opening"}
        onOpen={() => void controller.reopen()}
        onReconnect={() => void reconnectAndRecover()}
      />
    );
  else if (committedSwitch)
    screen = (
      <main className="course-screen course-parent">
        <section className="course-message">
          <h1>
            <AddedText>Restoring the selected child's saved work</AddedText>
          </h1>
          <p>
            <AddedText>
              This change is saved. Reading and writing stay paused until
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
        readParentMaterial={async (input) => {
          const visit = validVisit;
          if (!visit) throw new Error("Parent visit was retired");
          const ticket: TaskPreviewTicket = {
            lifetime: visit.lifetime,
            routeAttempt: visit.routeAttempt,
            packageHash: input.packageHash,
          };
          const origin = location.key;
          try {
            return await client.parentMaterial(input);
          } catch (error) {
            if (
              currentLocation.current.key === origin &&
              previewCurrent(ticket) &&
              error instanceof InstalledResourceUnavailableError &&
              error.failure.packageHash === ticket.packageHash
            )
              controller.blockResources(error.failure);
            throw error;
          }
        }}
        packageHash={read.witness.activePackageHash}
        busy={busy || saveError !== null}
        readDiagnostics={client.readDiagnostics}
        lessonFiles={{
          client,
          retained: lessonFilesCommand,
          onChanged: () => controller.reopen(),
        }}
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
          recoveryActions={
            cleanupAvailable ? (
              <Button disabled={busy} onClick={() => setCleanupOpen(true)}>
                <AddedText>Parent storage cleanup</AddedText>
              </Button>
            ) : null
          }
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
        onResourceFailure={(failure) => {
          if (
            currentLocation.current.key === location.key &&
            client.connectionTicket() === connection &&
            canonical(
              controller.committed.getSnapshot().visible.data?.directory
                .selection ?? null,
            ) === canonical(selection)
          )
            controller.blockResources(failure);
        }}
      />
    );
  else screen = <Unavailable title="Page unavailable" />;
  return (
    <>
      {screen}
      {connectionObservation.slow > 0 ? (
        <aside
          className="course-navigation-status"
          role="status"
          aria-live="polite"
        >
          <p>
            <AddedText>
              This is taking longer than usual. Saved actions are still waiting
              for confirmation.
            </AddedText>
          </p>
          <Button
            className="course-primary"
            onClick={() => void reconnectAndRecover()}
          >
            <AddedText>Reconnect and recover</AddedText>
          </Button>
        </aside>
      ) : null}
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
      {selection && cleanupAvailable ? (
        <>
          {cleanupOpen ? (
            <StorageCleanup
              key={canonical([selection, connection])}
              client={client}
              selection={selection}
              retained={cleanupCommand}
              onClose={() => setCleanupOpen(false)}
            />
          ) : null}
        </>
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
