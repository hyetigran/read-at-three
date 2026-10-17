import type { JTDDataType, SomeJTDSchemaType } from "ajv/dist/jtd.js";
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
  CourseWitness,
  DocumentToken,
} from "./index.ts";

export const animalCatalog = Object.freeze({
  rabbit: "Rabbit",
  fox: "Fox",
  bear: "Bear",
  owl: "Owl",
  turtle: "Turtle",
  bird: "Bird",
  frog: "Frog",
  cat: "Cat",
});

export const avatarSchema = {
  enum: Object.keys(animalCatalog).filter(
    (key): key is keyof typeof animalCatalog =>
      Object.hasOwn(animalCatalog, key),
  ),
} satisfies SomeJTDSchemaType;
export type AvatarId = JTDDataType<typeof avatarSchema>;
export const preferencesSchema = {
  properties: { version: { type: "uint8" } },
  optionalProperties: {
    displayName: { type: "string" },
    avatarId: { type: "string" },
  },
  additionalProperties: true,
} satisfies SomeJTDSchemaType;
export type LocalPreferences = Readonly<JTDDataType<typeof preferencesSchema>>;
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
export type ProfileDirectory = Readonly<{
  administration: AdministrationWitness;
  selection: SelectedOwnerWitness;
  profiles: readonly ProfileSummary[];
  preparation:
    | Readonly<{
        kind: "required";
        requiredHash: PayloadHash;
        acknowledgedHash: PayloadHash | null;
      }>
    | Readonly<{ kind: "acknowledged"; hash: PayloadHash }>;
  initialSetup: Readonly<{
    kind: "firstLaunch" | "existingFamily" | "complete";
  }>;
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
    | Readonly<{ kind: "acknowledgePreparation"; hash: PayloadHash }>
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
    | Readonly<{ kind: "preparation"; hash: PayloadHash }>;
}>;
export interface ProfileAdministrationApplication {
  readDirectory(): Promise<ProfileDirectory>;
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
export async function prepareProfileAdministration(
  input: AdministrationPreparation,
): Promise<ProfileAdministrationCommand> {
  throw new Error("Profile administration is not implemented");
}
