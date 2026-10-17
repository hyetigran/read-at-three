import { canonical } from "@readatthree/teaching";
import type {
  AvatarId,
  CourseAction,
  LessonId,
  ProfileEditWitness,
  ProfilePreferencesInput,
  SavedWork,
  SelectedOwnerWitness,
  TaskId,
} from "@readatthree/teaching";

export type ReturnFocus =
  | Readonly<{ kind: "parentButton"; destination: "settings" | "profiles" }>
  | Readonly<{ kind: "lesson"; lessonId: LessonId }>
  | Readonly<{
      kind: "taskEntry";
      taskId: TaskId;
      intent: CourseAction["intent"];
    }>
  | Readonly<{ kind: "savedWork"; runId: SavedWork["runId"] }>
  | Readonly<{ kind: "none" }>;
export type ParentOrigin =
  | Readonly<{ kind: "map"; entryKey: string; focus: ReturnFocus }>
  | Readonly<{
      kind: "menu";
      lessonId: LessonId;
      entryKey: string;
      scrollTop: number;
      focus: ReturnFocus;
    }>
  | Readonly<{
      kind: "teaching";
      sessionId: SavedWork["sessionId"];
      runId: SavedWork["runId"];
      packageHash: SavedWork["packageHash"];
      focus: ReturnFocus;
    }>
  | Readonly<{
      kind: "savedWork";
      runId: SavedWork["runId"];
      lessonId: LessonId;
      scrollTop: number;
      focus: ReturnFocus;
    }>;
export type ParentDestination =
  | Readonly<{ kind: "unavailable" }>
  | Readonly<{ kind: "settings" }>
  | Readonly<{ kind: "profiles" }>
  | Readonly<{
      kind: "preparation";
      continuation: "return" | "initialProfile" | "profiles";
    }>
  | Readonly<{ kind: "initialProfile"; preferences: ProfilePreferencesInput }>
  | Readonly<{ kind: "createProfile"; preferences: ProfilePreferencesInput }>
  | Readonly<{
      kind: "editAvatar";
      target: ProfileEditWitness;
      avatarId: AvatarId;
    }>
  | Readonly<{
      kind: "editName";
      target: ProfileEditWitness;
      displayName: string;
    }>;
export type ParentLifetime = Readonly<{
  selection: SelectedOwnerWitness;
  connectionTicket: number;
  visitId: number;
}>;
export type ParentVisit = Readonly<{
  lifetime: ParentLifetime;
  origin: ParentOrigin;
  routeAttempt: number;
  destination: ParentDestination;
  gate: Readonly<{ kind: "locked" } | { kind: "granted" }>;
}>;
export function sameParentSelection(
  a: SelectedOwnerWitness,
  b: SelectedOwnerWitness,
) {
  return canonical(a) === canonical(b);
}
export function currentVisit(input: {
  visit: ParentVisit;
  selection: SelectedOwnerWitness;
  connectionTicket: number;
}) {
  return (
    sameParentSelection(input.visit.lifetime.selection, input.selection) &&
    input.visit.lifetime.connectionTicket === input.connectionTicket
  );
}
export function parentAddress(destination: ParentDestination): string {
  switch (destination.kind) {
    case "unavailable":
      return "/parent/unavailable";
    case "settings":
      return "/parent/settings";
    case "profiles":
      return "/parent/profiles";
    case "preparation":
      return "/parent/preparation";
    case "initialProfile":
      return "/parent/setup/animal";
    case "createProfile":
      return "/parent/profiles/new";
    case "editAvatar":
      return `/parent/profiles/${encodeURIComponent(destination.target.owner.profileId)}/animal`;
    case "editName":
      return `/parent/profiles/${encodeURIComponent(destination.target.owner.profileId)}/name`;
    default: {
      const exhaustive: never = destination;
      return exhaustive;
    }
  }
}
export function originAddress(origin: ParentOrigin): string {
  switch (origin.kind) {
    case "map":
      return "/";
    case "menu":
      return `/lessons/${encodeURIComponent(origin.lessonId)}`;
    case "teaching":
      return "/teaching";
    case "savedWork":
      return `/work/${encodeURIComponent(origin.runId)}`;
    default: {
      const exhaustive: never = origin;
      return exhaustive;
    }
  }
}
export function returnFocusId(focus: ReturnFocus): string | null {
  switch (focus.kind) {
    case "parentButton":
      return `parent-${focus.destination}`;
    case "lesson":
      return `lesson-${focus.lessonId}`;
    case "taskEntry":
      return `task-${focus.intent.taskId}-${focus.intent.kind}-${focus.intent.sessionId ?? "new"}`;
    case "savedWork":
      return `work-${focus.runId}`;
    case "none":
      return null;
    default: {
      const exhaustive: never = focus;
      return exhaustive;
    }
  }
}

export function parentRouteAllowed(
  visit: ParentVisit,
  pathname: string,
): boolean {
  return (
    pathname ===
    (visit.gate.kind === "locked"
      ? "/parent/gate"
      : parentAddress(visit.destination))
  );
}
