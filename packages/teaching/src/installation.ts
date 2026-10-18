import {
  canonical,
  deepFreeze,
  parseCounter,
  parseHash,
  parseId,
} from "./identity.ts";
import {
  validateInitialInstallCommand,
  validateInstallationFact,
  validateParentMaterialRequest,
} from "./generated-installation-validators.js";
import { installationFactSchema } from "./installation-schemas.ts";
import type {
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
export function parseInitialInstallCommand(
  input: unknown,
): InitialInstallCommand {
  if (!validateInitialInstallCommand(input) || input.version !== 1)
    throw new Error("Initial installation command is unsupported");
  const expected: ActivationWitness =
    input.expected.kind === "absent"
      ? { kind: "absent" }
      : {
          kind: "present",
          revision: parseCounter(input.expected.revision),
          activePackageHash: parseHash({
            kind: "package",
            value: input.expected.activePackageHash,
          }),
          fallbackPackageHash:
            input.expected.fallbackPackageHash === null
              ? null
              : parseHash({
                  kind: "package",
                  value: input.expected.fallbackPackageHash,
                }),
        };
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
export interface PortableInstallationApplication {
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
