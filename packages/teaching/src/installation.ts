import { parsePrintedPreviewTask } from "./content.ts";
import {
  canonical,
  deepFreeze,
  parseCounter,
  parseHash,
  parseId,
} from "./identity.ts";
import {
  validatePublicationSelection,
  validatePublicationCheck,
  validateInstalledResourceFailure,
  validateInitialInstallCommand,
  validateInstallationFact,
  validateParentMaterialRequest,
  validateParentMaterialWire,
  validateActivationWitness,
  validateInstallationRead,
  validateInstallationCatalog,
} from "./generated-installation-validators.js";
import { installationFactSchema } from "./installation-schemas.ts";
import type {
  RawInstalledResourceFailure,
  RawInitialInstallCommand,
  RawParentMaterialRequest,
} from "./installation-schemas.ts";
import { parsePublicationHash } from "./publication.ts";
import type { PublicationHash } from "./publication.ts";
import type {
  CommandId,
  Counter,
  CourseId,
  HashFunction,
  InstallationId,
  PackageHash,
  PayloadHash,
  ReleaseId,
} from "./types.ts";

type RawWitness = RawInitialInstallCommand["expected"];
export type ActivationWitness =
  | Extract<RawWitness, { kind: "absent" }>
  | Readonly<{
      kind: "present";
      revision: Counter;
      activePackageHash: PackageHash;
      fallbackPackageHash: PackageHash | null;
    }>;
export type InitialInstallCommand = Readonly<
  Omit<
    RawInitialInstallCommand,
    "version" | "installationId" | "commandId" | "target" | "expected"
  > & {
    version: 1;
    installationId: InstallationId;
    commandId: CommandId;
    target: Readonly<{
      publicationHash: PublicationHash;
      courseId: CourseId;
      releaseId: ReleaseId;
    }>;
    expected: ActivationWitness;
  }
>;
type FactIdentity = Readonly<{
  version: 1;
  installationId: InstallationId;
  commandId: CommandId;
  payloadHash: PayloadHash;
}>;
export type InstallationFact = FactIdentity &
  (
    | Readonly<{ kind: "accepted"; targetPackageHash: PackageHash }>
    | Readonly<{ kind: "readyInactive"; registeredPackageHash: PackageHash }>
    | Readonly<{
        kind: "activated";
        registeredPackageHash: PackageHash;
        activationRevision: Counter;
      }>
    | Readonly<{
        kind: "rejected";
        registeredPackageHash: PackageHash | null;
        reason: (typeof installationFactSchema.mapping.rejected.properties.reason.enum)[number];
      }>
  );
export function parseActivationWitness(input: unknown): ActivationWitness {
  if (!validateActivationWitness(input))
    throw new Error("Activation witness is unsupported");
  return input.kind === "absent"
    ? { kind: "absent" }
    : {
        kind: "present",
        revision: parseCounter(input.revision),
        activePackageHash: parseHash({
          kind: "package",
          value: input.activePackageHash,
        }),
        fallbackPackageHash:
          input.fallbackPackageHash === null
            ? null
            : parseHash({ kind: "package", value: input.fallbackPackageHash }),
      };
}
export function parseInitialInstallCommand(
  input: unknown,
): InitialInstallCommand {
  if (!validateInitialInstallCommand(input) || input.version !== 1)
    throw new Error("Initial installation command is unsupported");
  const expected = parseActivationWitness(input.expected);
  return deepFreeze({
    ...input,
    version: 1,
    installationId: parseId({
      kind: "installation",
      value: input.installationId,
    }),
    commandId: parseId({ kind: "command", value: input.commandId }),
    source: { mode: input.source.mode },
    target: {
      publicationHash: parsePublicationHash(input.target.publicationHash),
      courseId: parseId({ kind: "course", value: input.target.courseId }),
      releaseId: parseId({ kind: "release", value: input.target.releaseId }),
    },
    expected,
  });
}
export async function initialInstallIdentity(
  command: InitialInstallCommand,
  hash: HashFunction,
) {
  const parsed = parseInitialInstallCommand(command);
  const preimage = canonical(parsed);
  return Object.freeze({
    command: parsed,
    preimage,
    payloadHash: parseHash({ kind: "payload", value: await hash(preimage) }),
  });
}
export function parseInstallationFact(input: unknown): InstallationFact {
  if (!validateInstallationFact(input) || input.version !== 1)
    throw new Error("Installation evidence is unsupported");
  const common: FactIdentity = {
    version: 1,
    installationId: parseId({
      kind: "installation",
      value: input.installationId,
    }),
    commandId: parseId({ kind: "command", value: input.commandId }),
    payloadHash: parseHash({ kind: "payload", value: input.payloadHash }),
  };
  switch (input.kind) {
    case "accepted":
      return deepFreeze({
        ...common,
        kind: input.kind,
        targetPackageHash: parseHash({
          kind: "package",
          value: input.targetPackageHash,
        }),
      });
    case "readyInactive":
      return deepFreeze({
        ...common,
        kind: input.kind,
        registeredPackageHash: parseHash({
          kind: "package",
          value: input.registeredPackageHash,
        }),
      });
    case "activated":
      return deepFreeze({
        ...common,
        kind: input.kind,
        registeredPackageHash: parseHash({
          kind: "package",
          value: input.registeredPackageHash,
        }),
        activationRevision: parseCounter(input.activationRevision),
      });
    case "rejected":
      return deepFreeze({
        ...common,
        kind: input.kind,
        reason: input.reason,
        registeredPackageHash:
          input.registeredPackageHash === null
            ? null
            : parseHash({
                kind: "package",
                value: input.registeredPackageHash,
              }),
      });
    default: {
      const exhaustive: never = input;
      throw new Error(String(exhaustive));
    }
  }
}
export type InstallationObservation =
  | Readonly<{ kind: "notChecked" }>
  | Readonly<{ kind: "checking"; inspectionId: string }>
  | Readonly<{
      kind: "stale";
      last: "verified" | "missing" | "corrupt" | "unavailable";
    }>;
export type InstallationRead = Readonly<{
  command: InitialInstallCommand;
  fact: InstallationFact;
  availability: InstallationObservation;
}>;

export type InstallationCatalog = Readonly<{
  installationId: InstallationId;
  courses: readonly Readonly<{
    courseId: CourseId;
    activation: ActivationWitness;
  }>[];
  commands: readonly InstallationRead[];
}>;
export function parseInstallationRead(input: unknown): InstallationRead {
  if (!validateInstallationRead(input))
    throw new Error("Installation read is unsupported");
  const command = parseInitialInstallCommand(input.command),
    fact = parseInstallationFact(input.fact);
  if (
    command.installationId !== fact.installationId ||
    command.commandId !== fact.commandId
  )
    throw new Error("Installation command and fact identity differ");
  const key =
    fact.kind === "accepted"
      ? fact.targetPackageHash
      : fact.registeredPackageHash;
  const targetKey = parseHash({
    kind: "package",
    value: command.target.publicationHash,
  });
  if (key !== null && key !== targetKey)
    throw new Error("Installation command and fact target differ");
  const availability: InstallationObservation =
    input.availability.kind === "checking"
      ? {
          kind: "checking",
          inspectionId: parseId({
            kind: "review",
            value: input.availability.inspectionId,
          }),
        }
      : input.availability;
  return deepFreeze({ command, fact, availability });
}
export function parseInstallationCatalog(input: unknown): InstallationCatalog {
  if (!validateInstallationCatalog(input))
    throw new Error("Installation catalog is unsupported");
  const installationId = parseId({
    kind: "installation",
    value: input.installationId,
  });
  const courses = input.courses.map((course) => ({
    courseId: parseId({ kind: "course", value: course.courseId }),
    activation: parseActivationWitness(course.activation),
  }));
  if (new Set(courses.map((course) => course.courseId)).size !== courses.length)
    throw new Error("Duplicate installation course");
  const commands = input.commands.map(parseInstallationRead);
  if (
    new Set(commands.map((read) => read.command.commandId)).size !==
      commands.length ||
    commands.some(
      (read) =>
        read.command.installationId !== installationId ||
        !courses.some(
          (course) => course.courseId === read.command.target.courseId,
        ),
    )
  )
    throw new Error("Installation catalog command ownership differs");
  return deepFreeze({ installationId, courses, commands });
}
export interface PortableInstallationApplication {
  checkPublication(target: PublicationSelection): Promise<PublicationCheck>;
  repairPublication(target: PublicationSelection): Promise<PublicationCheck>;
  parentMaterial(request: ParentMaterialRequest): Promise<ParentMaterialRead>;
  initialInstall(command: InitialInstallCommand): Promise<InstallationRead>;
  installations(): Promise<InstallationCatalog>;
}

export type ParentMaterialRequest = Readonly<
  Omit<RawParentMaterialRequest, "packageHash"> & { packageHash: PackageHash }
>;
export function parseParentMaterialRequest(
  input: unknown,
): ParentMaterialRequest {
  if (!validateParentMaterialRequest(input))
    throw new Error("Parent material request is unsupported");
  return deepFreeze({
    kind: input.kind,
    packageHash: parseHash({ kind: "package", value: input.packageHash }),
  });
}
export function parseParentMaterialWire(input: unknown) {
  if (!validateParentMaterialWire(input))
    throw new Error("Parent material response is unsupported");
  const packageHash = parseHash({ kind: "package", value: input.packageHash });
  switch (input.kind) {
    case "unavailable":
      return deepFreeze({ ...input, packageHash });
    case "preparation":
      return deepFreeze({ ...input, packageHash });
    case "firstTaskPreview":
      return deepFreeze({
        ...input,
        packageHash,
        task: parsePrintedPreviewTask(input.task),
      });
    default: {
      const exhaustive: never = input;
      throw new Error(String(exhaustive));
    }
  }
}
export type ParentMaterialFailure =
  | Readonly<{
      kind: "content";
      failure: import("./publication-resources.ts").PublicationResourceError["failure"];
    }>
  | Readonly<{
      kind: "shell";
      failure: import("./shell.ts").ShellError["failure"];
    }>
  | Readonly<{ kind: "representationUnavailable" }>
  | Readonly<{ kind: "unsupportedProfile" }>
  | Readonly<{ kind: "verificationUnavailable" }>;
export type ParentMaterialRead =
  | Readonly<{
      kind: "unavailable";
      packageHash: PackageHash;
      failure: ParentMaterialFailure;
    }>
  | Readonly<{
      kind: "preparation";
      packageHash: PackageHash;
      document: import("./preparation.ts").VerifiedPreparationDocument;
    }>
  | Readonly<{
      kind: "firstTaskPreview";
      packageHash: PackageHash;
      task: import("./course-content.ts").ResolvedLesson["tasks"][number];
    }>;

export function makeInitialInstallCommand(
  input: Omit<InitialInstallCommand, "version" | "kind">,
): InitialInstallCommand {
  return parseInitialInstallCommand({
    ...input,
    version: 1,
    kind: "initialInstall",
  });
}

export class InstalledContentUnavailableError extends Error {
  readonly kind = "unavailable";
  constructor(readonly packageHash: PackageHash) {
    super("Exact signed package is unavailable");
    this.name = "InstalledContentUnavailableError";
  }
}

export type PublicationSelection = Readonly<{
  installationId: InstallationId;
  packageHash: PackageHash;
}>;
export function parsePublicationSelection(
  input: unknown,
): PublicationSelection {
  if (!validatePublicationSelection(input))
    throw new Error("Publication selection is unsupported");
  return deepFreeze({
    installationId: parseId({
      kind: "installation",
      value: input.installationId,
    }),
    packageHash: parseHash({ kind: "package", value: input.packageHash }),
  });
}
export type PublicationCheck =
  | Readonly<{ kind: "verified"; target: PublicationSelection }>
  | Readonly<{ kind: "notAuthorized"; target: PublicationSelection }>
  | Readonly<{ kind: "staleTarget"; target: PublicationSelection }>
  | Readonly<{
      kind: "unavailable";
      target: PublicationSelection;
      reason: RawInstalledResourceFailure["reason"];
    }>;
export function parsePublicationCheck(input: unknown): PublicationCheck {
  if (!validatePublicationCheck(input))
    throw new Error("Publication observation is unsupported");
  const target = parsePublicationSelection(input.target);
  return input.kind === "unavailable"
    ? deepFreeze({ ...input, target })
    : deepFreeze({ kind: input.kind, target });
}
export type InstalledResourceFailure = Readonly<
  Omit<RawInstalledResourceFailure, "packageHash"> & {
    packageHash: PackageHash;
  }
>;
export function parseInstalledResourceFailure(
  input: unknown,
): InstalledResourceFailure {
  if (!validateInstalledResourceFailure(input))
    throw new Error("Installed resource failure is unsupported");
  return deepFreeze({
    ...input,
    packageHash: parseHash({ kind: "package", value: input.packageHash }),
  });
}
export class InstalledResourceUnavailableError extends Error {
  constructor(readonly failure: InstalledResourceFailure) {
    super("Exact installed resources are unavailable");
    this.name = "InstalledResourceUnavailableError";
  }
}
