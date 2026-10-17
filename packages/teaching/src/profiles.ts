import type {
  CommandId,
  CommandRejection,
  Counter,
  CourseId,
  HashFunction,
  IdFactory,
  InstallationId,
  Owner,
  PayloadHash,
  PreparationHash,
  CourseWitness,
  DocumentToken,
} from "./index.ts";

export { animalCatalog } from "./profile-schemas.ts";
import type {
  AvatarId,
  RawPreferences,
  RawProfileDirectory,
  RawProfileAdministrationCommand,
  RawProfileAdministrationReceipt,
} from "./profile-schemas.ts";
import { avatarSchema } from "./profile-schemas.ts";
import {
  validateLocalPreferences,
  validatePreparationPolicy,
  validateProfileDirectory,
  validateProfileAdministrationCommand,
  validateProfileAdministrationReceipt,
} from "./generated-profile-validators.js";
import {
  canonical,
  deepFreeze,
  parseCounter,
  parseHash,
  parseId,
} from "./identity.ts";
import { parseDocumentToken } from "./ink.ts";
import { unicodeLength } from "./unicode-length.ts";
export type { AvatarId } from "./profile-schemas.ts";
export type LocalPreferences = Readonly<RawPreferences>;
export type AdministrationWitness = Readonly<{
  installationId: InstallationId;
  revision: Counter;
}>;
export type SelectedOwnerWitness = Readonly<{
  installationId: InstallationId;
  revision: Counter;
  owner: Owner;
}>;
export type ProfileEditWitness = Readonly<{
  owner: Owner;
  revision: Counter;
}>;
export type ProfileSummary = Readonly<{
  edit: ProfileEditWitness;
  preferences: LocalPreferences;
}>;
export type PreparationPolicy =
  | Readonly<{ kind: "unavailable" }>
  | Readonly<{ kind: "reviewed"; hash: PreparationHash }>;
export type ProfileDirectory = Readonly<{
  administration: AdministrationWitness;
  selection: SelectedOwnerWitness;
  profiles: readonly [ProfileSummary, ...ProfileSummary[]];
  preparation:
    | Readonly<{
        kind: "required";
        requiredHash: PreparationHash;
        acknowledgedHash: PreparationHash | null;
      }>
    | Readonly<{ kind: "acknowledged"; hash: PreparationHash }>
    | Readonly<{
        kind: "unavailable";
        acknowledgedHash: PreparationHash | null;
      }>;
  initialSetup: Readonly<RawProfileDirectory["initialSetup"]>;
}>;
export type ProfilePreferencesInput = Readonly<{
  avatarId: AvatarId;
  displayName?: string;
}>;
export type DepartureWitness = Readonly<{
  courses: readonly Readonly<{
    courseId: CourseId;
    witness: CourseWitness;
    documents: readonly DocumentToken[];
  }>[];
}>;
export type ProfileAdministrationIntent = Readonly<{
  directory: AdministrationWitness;
}> &
  (
    | Readonly<{
        kind: "setAvatar";
        target: ProfileEditWitness;
        avatarId: AvatarId;
      }>
    | Readonly<{
        kind: "setDisplayName";
        target: ProfileEditWitness;
        displayName: string | null;
      }>
    | Readonly<{
        kind: "finishInitialProfile";
        target: ProfileEditWitness;
        preferences: ProfilePreferencesInput;
      }>
    | Readonly<{
        kind: "createAndSelect";
        preferences: ProfilePreferencesInput;
      }>
    | Readonly<{ kind: "selectProfile"; target: Owner }>
    | Readonly<{ kind: "acknowledgePreparation"; hash: PreparationHash }>
  );
type PayloadOf<Intent> = Intent extends unknown
  ? Omit<Intent, "directory">
  : never;
export type ProfileAdministrationPayload =
  | PayloadOf<
      Exclude<
        ProfileAdministrationIntent,
        { kind: "createAndSelect" | "selectProfile" }
      >
    >
  | Readonly<{
      kind: "createAndSelect";
      owner: Owner;
      preferences: ProfilePreferencesInput;
      departure: DepartureWitness;
    }>
  | Readonly<{
      kind: "selectProfile";
      target: Owner;
      departure: DepartureWitness;
    }>;
export type ProfileAdministrationCommand = Readonly<{
  version: 1;
  commandId: CommandId;
  scope: AdministrationWitness;
  selection: SelectedOwnerWitness;
  payloadHash: PayloadHash;
  payload: ProfileAdministrationPayload;
}>;
export type ProfileAdministrationReceipt = Readonly<{
  kind: "profileCommitted";
  version: 1;
  commandId: CommandId;
  payloadHash: PayloadHash;
  administration: AdministrationWitness;
  selection: SelectedOwnerWitness;
  effect:
    | Readonly<{
        kind: "preferences" | "created" | "initialSetup";
        target: ProfileEditWitness;
      }>
    | Readonly<{ kind: "selection"; previous: SelectedOwnerWitness }>
    | Readonly<{ kind: "preparation"; hash: PreparationHash }>;
}>;
export interface ProfileAdministrationApplication {
  readDirectory(): Promise<ProfileDirectory>;
  readDeparture(input: {
    selection: SelectedOwnerWitness;
  }): Promise<DepartureWitness>;
  administer(
    command: ProfileAdministrationCommand,
  ): Promise<ProfileAdministrationReceipt | CommandRejection>;
}

export type AdministrationPreparation = Readonly<{
  selection: SelectedOwnerWitness;
  ids: IdFactory;
  hash: HashFunction;
}> &
  (
    | Readonly<{
        intent: Extract<
          ProfileAdministrationIntent,
          { kind: "createAndSelect" | "selectProfile" }
        >;
        departure: DepartureWitness;
      }>
    | Readonly<{
        intent: Exclude<
          ProfileAdministrationIntent,
          { kind: "createAndSelect" | "selectProfile" }
        >;
      }>
  );
type RawOwner = RawProfileDirectory["selection"]["owner"];
type RawEdit = RawProfileDirectory["profiles"][number]["edit"];
type RawSelection = RawProfileDirectory["selection"];
type RawAdministration = RawProfileDirectory["administration"];
type RawPayload = RawProfileAdministrationCommand["payload"];

function boundedJson(value: unknown, maximum: number): void {
  const seen = new Set<object>();
  let nodes = 0;
  function visit(item: unknown, depth: number): void {
    if (++nodes > 20000 || depth > 32)
      throw new Error("Profile data exceeds its bounds");
    if (item === null || typeof item === "boolean") return;
    if (typeof item === "string") {
      if (item.length > maximum)
        throw new Error("Profile text exceeds its bounds");
      return;
    }
    if (typeof item === "number") {
      if (!Number.isFinite(item))
        throw new Error("Profile data contains an invalid number");
      return;
    }
    if (typeof item !== "object" || seen.has(item))
      throw new Error("Profile data is not bounded JSON");
    seen.add(item);
    if (Array.isArray(item)) {
      for (const child of item) visit(child, depth + 1);
    } else {
      if (
        Object.getPrototypeOf(item) !== Object.prototype &&
        Object.getPrototypeOf(item) !== null
      )
        throw new Error("Profile data must contain plain JSON objects");
      for (const [key, child] of Object.entries(item)) {
        if (key.length > 200)
          throw new Error("Profile field name exceeds its bounds");
        visit(child, depth + 1);
      }
    }
    seen.delete(item);
  }
  visit(value, 0);
  if (canonical(value).length > maximum)
    throw new Error("Profile data exceeds its bounds");
}
function owner(input: RawOwner): Owner {
  return {
    profileId: parseId({ kind: "profile", value: input.profileId }),
    generation: parseCounter(input.generation),
  };
}
function administration(input: RawAdministration): AdministrationWitness {
  return {
    installationId: parseId({
      kind: "installation",
      value: input.installationId,
    }),
    revision: parseCounter(input.revision),
  };
}
function selection(input: RawSelection): SelectedOwnerWitness {
  return {
    installationId: parseId({
      kind: "installation",
      value: input.installationId,
    }),
    revision: parseCounter(input.revision),
    owner: owner(input.owner),
  };
}
function edit(input: RawEdit): ProfileEditWitness {
  return { owner: owner(input.owner), revision: parseCounter(input.revision) };
}
function displayName(value: string): string {
  if (unicodeLength(value) > 120)
    throw new Error("Profile name exceeds its bounds");
  return value;
}
export function parseLocalPreferences(input: unknown): LocalPreferences {
  boundedJson(input, 16384);
  if (!validateLocalPreferences(input) || input.version !== 1)
    throw new Error("Profile preferences are unsupported");
  if (input.displayName !== undefined) displayName(input.displayName);
  if (input.avatarId !== undefined && unicodeLength(input.avatarId) > 200)
    throw new Error("Saved animal key exceeds its bounds");
  return deepFreeze(input);
}
export function parsePreparationPolicy(input: unknown): PreparationPolicy {
  if (!validatePreparationPolicy(input))
    throw new Error("Preparation policy is unsupported");
  return input.kind === "unavailable"
    ? { kind: "unavailable" }
    : {
        kind: "reviewed",
        hash: parseHash({ kind: "preparation", value: input.hash }),
      };
}
export function resolveAvatar(input: {
  savedId: LocalPreferences["avatarId"];
}): AvatarId {
  return avatarSchema.enum.find((id) => id === input.savedId) ?? "rabbit";
}
export function parseProfileDirectory(input: unknown): ProfileDirectory {
  boundedJson(input, 2 * 1024 * 1024);
  if (!validateProfileDirectory(input))
    throw new Error("Profile directory is unsupported");
  const profiles = input.profiles.map((profile) => ({
    edit: edit(profile.edit),
    preferences: parseLocalPreferences(profile.preferences),
  }));
  const first = profiles[0];
  if (
    !first ||
    profiles.length > 256 ||
    new Set(profiles.map((profile) => profile.edit.owner.profileId)).size !==
      profiles.length
  )
    throw new Error("Profile directory has invalid child identities");
  const current = selection(input.selection);
  if (
    input.administration.installationId !== current.installationId ||
    !profiles.some(
      (profile) =>
        profile.edit.owner.profileId === current.owner.profileId &&
        profile.edit.owner.generation === current.owner.generation,
    )
  )
    throw new Error("Selected child is not in this installation");
  let preparation: ProfileDirectory["preparation"];
  if (input.preparation.kind === "acknowledged")
    preparation = {
      kind: "acknowledged",
      hash: parseHash({ kind: "preparation", value: input.preparation.hash }),
    };
  else if (input.preparation.kind === "required")
    preparation = {
      kind: "required",
      requiredHash: parseHash({
        kind: "preparation",
        value: input.preparation.requiredHash,
      }),
      acknowledgedHash:
        input.preparation.acknowledgedHash === null
          ? null
          : parseHash({
              kind: "preparation",
              value: input.preparation.acknowledgedHash,
            }),
    };
  else
    preparation = {
      kind: "unavailable",
      acknowledgedHash:
        input.preparation.acknowledgedHash === null
          ? null
          : parseHash({
              kind: "preparation",
              value: input.preparation.acknowledgedHash,
            }),
    };
  return deepFreeze({
    administration: administration(input.administration),
    selection: current,
    profiles: [first, ...profiles.slice(1)],
    preparation,
    initialSetup: input.initialSetup,
  });
}
function preferences(
  input: Extract<RawPayload, { kind: "createAndSelect" }>["preferences"],
): ProfilePreferencesInput {
  return {
    avatarId: input.avatarId,
    ...(input.displayName === undefined
      ? {}
      : { displayName: displayName(input.displayName) }),
  };
}
export function decodeDepartureWitness(
  input: Extract<RawPayload, { kind: "selectProfile" }>["departure"],
): DepartureWitness {
  if (
    input.courses.length > 64 ||
    new Set(input.courses.map((course) => course.courseId)).size !==
      input.courses.length
  )
    throw new Error("Departure courses are invalid");
  return {
    courses: input.courses.map((course) => {
      if (course.documents.length > 4096)
        throw new Error("Departure documents exceed their bounds");
      return {
        courseId: parseId({ kind: "course", value: course.courseId }),
        witness: {
          owner: owner(course.witness.owner),
          profileRevision: parseCounter(course.witness.profileRevision),
          activePackageHash: parseHash({
            kind: "package",
            value: course.witness.activePackageHash,
          }),
          activationRevision: parseCounter(course.witness.activationRevision),
          cursorRevision: parseCounter(course.witness.cursorRevision),
          selectedSessionRevision:
            course.witness.selectedSessionRevision === null
              ? null
              : parseCounter(course.witness.selectedSessionRevision),
        },
        documents: course.documents.map(parseDocumentToken),
      };
    }),
  };
}
function payload(input: RawPayload): ProfileAdministrationPayload {
  switch (input.kind) {
    case "setAvatar":
      return {
        kind: input.kind,
        target: edit(input.target),
        avatarId: input.avatarId,
      };
    case "setDisplayName":
      return {
        kind: input.kind,
        target: edit(input.target),
        displayName:
          input.displayName === null ? null : displayName(input.displayName),
      };
    case "finishInitialProfile":
      return {
        kind: input.kind,
        target: edit(input.target),
        preferences: preferences(input.preferences),
      };
    case "createAndSelect":
      return {
        kind: input.kind,
        owner: owner(input.owner),
        preferences: preferences(input.preferences),
        departure: decodeDepartureWitness(input.departure),
      };
    case "selectProfile":
      return {
        kind: input.kind,
        target: owner(input.target),
        departure: decodeDepartureWitness(input.departure),
      };
    case "acknowledgePreparation":
      return {
        kind: input.kind,
        hash: parseHash({ kind: "preparation", value: input.hash }),
      };
    default: {
      const exhaustive: never = input;
      return exhaustive;
    }
  }
}
export function parseProfileAdministrationCommand(
  input: unknown,
): ProfileAdministrationCommand {
  boundedJson(input, 2 * 1024 * 1024);
  if (!validateProfileAdministrationCommand(input) || input.version !== 1)
    throw new Error("Profile administration command is unsupported");
  const result: ProfileAdministrationCommand = {
    version: input.version,
    commandId: parseId({ kind: "command", value: input.commandId }),
    scope: administration(input.scope),
    selection: selection(input.selection),
    payloadHash: parseHash({ kind: "payload", value: input.payloadHash }),
    payload: payload(input.payload),
  };
  if (result.scope.installationId !== result.selection.installationId)
    throw new Error("Profile command installation changed");
  return deepFreeze(result);
}
function effect(
  input: RawProfileAdministrationReceipt["effect"],
): ProfileAdministrationReceipt["effect"] {
  switch (input.kind) {
    case "created":
    case "preferences":
    case "initialSetup":
      return { kind: input.kind, target: edit(input.target) };
    case "selection":
      return { kind: input.kind, previous: selection(input.previous) };
    case "preparation":
      return {
        kind: input.kind,
        hash: parseHash({ kind: "preparation", value: input.hash }),
      };
    default: {
      const exhaustive: never = input;
      return exhaustive;
    }
  }
}
export function parseProfileAdministrationReceipt(
  input: unknown,
): ProfileAdministrationReceipt {
  boundedJson(input, 2 * 1024 * 1024);
  if (!validateProfileAdministrationReceipt(input) || input.version !== 1)
    throw new Error("Profile administration receipt is unsupported");
  const result: ProfileAdministrationReceipt = {
    kind: input.kind,
    version: input.version,
    commandId: parseId({ kind: "command", value: input.commandId }),
    payloadHash: parseHash({ kind: "payload", value: input.payloadHash }),
    administration: administration(input.administration),
    selection: selection(input.selection),
    effect: effect(input.effect),
  };
  if (
    result.administration.installationId !== result.selection.installationId ||
    (result.effect.kind === "selection" &&
      result.effect.previous.installationId !== result.selection.installationId)
  )
    throw new Error("Profile receipt installation changed");
  return deepFreeze(result);
}
export function profileAdministrationPreimage(
  input: Pick<
    ProfileAdministrationCommand,
    "version" | "scope" | "selection" | "payload"
  >,
): string {
  return canonical({
    version: input.version,
    scope: input.scope,
    selection: input.selection,
    payload: input.payload,
  });
}
export async function prepareProfileAdministration(
  input: AdministrationPreparation,
): Promise<ProfileAdministrationCommand> {
  let body: ProfileAdministrationPayload;
  if ("departure" in input) {
    body =
      input.intent.kind === "createAndSelect"
        ? {
            kind: "createAndSelect",
            owner: {
              profileId: parseId({ kind: "profile", value: input.ids() }),
              generation: parseCounter("0"),
            },
            preferences: input.intent.preferences,
            departure: input.departure,
          }
        : {
            kind: "selectProfile",
            target: input.intent.target,
            departure: input.departure,
          };
  } else {
    const { directory, ...intent } = input.intent;
    body = intent;
  }
  const preimage = {
    version: 1,
    scope: input.intent.directory,
    selection: input.selection,
    payload: body,
  };
  return parseProfileAdministrationCommand({
    ...preimage,
    commandId: input.ids(),
    payloadHash: await input.hash(
      profileAdministrationPreimage({ ...preimage, version: 1 }),
    ),
  });
}
