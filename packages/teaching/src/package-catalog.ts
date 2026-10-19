import {
  canonical,
  deepFreeze,
  parseCounter,
  parseHash,
  parseId,
  increment,
} from "./identity.ts";
import { parseActivationWitness } from "./installation.ts";
import { parsePublicationHash } from "./publication.ts";
import {
  validateLessonFilesCommand,
  validateLessonFilesReceipt,
  validateLessonFilesView,
} from "./generated-installation-validators.js";
import type {
  ActivationWitness,
  InitialInstallCommand,
} from "./installation.ts";
import type {
  RawLessonFilesCommand,
  RawLessonFilesReceipt,
} from "./installation-schemas.ts";
import type {
  CommandId,
  Counter,
  HashFunction,
  InstallationId,
  PackageHash,
  PayloadHash,
} from "./types.ts";
export const publicationCatalogLimits = Object.freeze({ namespaces: 256 });

export type LessonFilesTarget = InitialInstallCommand["target"] &
  InitialInstallCommand["source"];
type Identity = Readonly<{
  installationId: InstallationId;
  commandId: CommandId;
}>;
export type DownloadReference = Identity &
  Readonly<{ payloadHash: PayloadHash }>;
export type LessonFilesCommand = Identity &
  Readonly<{
    version: 1;
    family: "lesson-files";
    expected: ActivationWitness;
    action:
      | Readonly<{ kind: "download"; target: LessonFilesTarget }>
      | Readonly<{
          kind: "use";
          target: LessonFilesTarget;
          ready: DownloadReference;
        }>
      | Readonly<{ kind: "cancel"; download: DownloadReference }>;
  }>;
type ReceiptIdentity = Identity &
  Readonly<{ version: 1; family: "lesson-files"; payloadHash: PayloadHash }>;
export type LessonFilesReceipt = ReceiptIdentity &
  (
    | Readonly<{ kind: "accepted"; target: LessonFilesTarget }>
    | Readonly<{
        kind: "ready";
        target: LessonFilesTarget;
        packageHash: PackageHash;
      }>
    | Readonly<{
        kind: "activated";
        packageHash: PackageHash;
        activationRevision: Counter;
      }>
    | Readonly<{ kind: "cancelled"; download: DownloadReference }>
    | Readonly<{
        kind: "rejected";
        reason: Extract<RawLessonFilesReceipt, { kind: "rejected" }>["reason"];
      }>
  );
export type AcquisitionObservation =
  | Readonly<{ kind: "idle" | "acquiring" }>
  | Readonly<{
      kind: "retryable";
      reason: "unavailable" | "quota" | "interrupted";
    }>;
export type LessonFilesView = Readonly<{
  activation: ActivationWitness;
  offer:
    | Readonly<{ kind: "absent" }>
    | Readonly<{ kind: "available"; target: LessonFilesTarget }>
    | Readonly<{
        kind: "ready";
        target: LessonFilesTarget;
        packageHash: PackageHash;
        receipt: DownloadReference;
      }>;
  commands: readonly Readonly<{
    command: LessonFilesCommand;
    receipt: LessonFilesReceipt;
    observation: AcquisitionObservation;
  }>[];
  packages: readonly Readonly<{
    packageHash: PackageHash;
    role: "active" | "fallback" | "historical" | "inactive";
    bytes: "unchecked" | "verified" | "missing" | "corrupt" | "metadataOnly";
  }>[];
}>;
export interface LessonFilesApplication {
  readLessonFiles(): Promise<LessonFilesView>;
  changeLessonFiles(command: LessonFilesCommand): Promise<LessonFilesReceipt>;
}
export type PackageCollectionClaim = Readonly<{
  packageHash: PackageHash;
  tombstoneRevision: Counter;
  isCurrent(): boolean;
}>;

function parseTarget(
  input: Extract<
    RawLessonFilesCommand["action"],
    { kind: "download" }
  >["target"],
): LessonFilesTarget {
  return {
    mode: input.mode,
    publicationHash: parsePublicationHash(input.publicationHash),
    courseId: parseId({ kind: "course", value: input.courseId }),
    releaseId: parseId({ kind: "release", value: input.releaseId }),
  };
}
function parseReference(
  input: Extract<
    RawLessonFilesCommand["action"],
    { kind: "cancel" }
  >["download"],
): DownloadReference {
  return {
    installationId: parseId({
      kind: "installation",
      value: input.installationId,
    }),
    commandId: parseId({ kind: "command", value: input.commandId }),
    payloadHash: parseHash({ kind: "payload", value: input.payloadHash }),
  };
}
export function parseLessonFilesCommand(input: unknown): LessonFilesCommand {
  if (!validateLessonFilesCommand(input) || input.version !== 1)
    throw new Error("Lesson file command is unsupported");
  const action = input.action;
  return deepFreeze({
    version: 1,
    family: "lesson-files",
    installationId: parseId({
      kind: "installation",
      value: input.installationId,
    }),
    commandId: parseId({ kind: "command", value: input.commandId }),
    expected: parseActivationWitness(input.expected),
    action:
      action.kind === "cancel"
        ? { kind: "cancel", download: parseReference(action.download) }
        : action.kind === "download"
          ? { kind: "download", target: parseTarget(action.target) }
          : {
              kind: "use",
              target: parseTarget(action.target),
              ready: parseReference(action.ready),
            },
  });
}
export function parseLessonFilesReceipt(input: unknown): LessonFilesReceipt {
  if (!validateLessonFilesReceipt(input) || input.version !== 1)
    throw new Error("Lesson file receipt is unsupported");
  const identity: ReceiptIdentity = {
    version: 1,
    family: "lesson-files",
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
        ...identity,
        kind: input.kind,
        target: parseTarget(input.target),
      });
    case "ready":
      if (input.packageHash !== input.target.publicationHash)
        throw new Error(
          "Ready lesson files changed their publication identity",
        );
      return deepFreeze({
        ...identity,
        kind: input.kind,
        target: parseTarget(input.target),
        packageHash: parseHash({ kind: "package", value: input.packageHash }),
      });
    case "activated":
      return deepFreeze({
        ...identity,
        kind: input.kind,
        packageHash: parseHash({ kind: "package", value: input.packageHash }),
        activationRevision: parseCounter(input.activationRevision),
      });
    case "cancelled":
      return deepFreeze({
        ...identity,
        kind: input.kind,
        download: parseReference(input.download),
      });
    case "rejected":
      return deepFreeze({
        ...identity,
        kind: input.kind,
        reason: input.reason,
      });
    default: {
      const exhaustive: never = input;
      return exhaustive;
    }
  }
}
export function assertLessonFilesEvidence(
  command: LessonFilesCommand,
  receipt: LessonFilesReceipt,
): void {
  if (
    command.installationId !== receipt.installationId ||
    command.commandId !== receipt.commandId
  )
    throw new Error("Lesson files command identity changed");
  if (receipt.kind === "accepted" || receipt.kind === "ready") {
    if (
      command.action.kind === "cancel" ||
      canonical(receipt.target) !== canonical(command.action.target) ||
      (receipt.kind === "ready" && command.action.kind !== "download")
    )
      throw new Error("Lesson-file receipt target changed");
  }
  if (
    receipt.kind === "activated" &&
    (command.action.kind !== "use" ||
      receipt.packageHash !==
        parseHash({
          kind: "package",
          value: command.action.target.publicationHash,
        }) ||
      command.expected.kind !== "present" ||
      receipt.activationRevision !== increment(command.expected.revision))
  )
    throw new Error("Activation receipt source or revision changed");
  if (receipt.kind === "cancelled") {
    const expected =
      command.action.kind === "cancel"
        ? command.action.download
        : {
            installationId: command.installationId,
            commandId: command.commandId,
            payloadHash: receipt.payloadHash,
          };
    if (
      command.action.kind === "use" ||
      canonical(receipt.download) !== canonical(expected)
    )
      throw new Error("Cancellation receipt identity changed");
  }
}
export async function lessonFilesIdentity(
  command: LessonFilesCommand,
  hash: HashFunction,
) {
  const parsed = parseLessonFilesCommand(command);
  const preimage = canonical(parsed);
  return Object.freeze({
    command: parsed,
    preimage,
    payloadHash: parseHash({ kind: "payload", value: await hash(preimage) }),
  });
}
export function parseLessonFilesView(input: unknown): LessonFilesView {
  if (!validateLessonFilesView(input))
    throw new Error("Lesson file view is unsupported");
  const offer = input.offer;
  if (
    offer.kind === "ready" &&
    offer.packageHash !== offer.target.publicationHash
  )
    throw new Error("Ready offer source changed");
  if (
    new Set(input.packages.map((item) => item.packageHash)).size !==
      input.packages.length ||
    new Set(
      input.commands.map((item) =>
        canonical([item.receipt.installationId, item.receipt.commandId]),
      ),
    ).size !== input.commands.length
  )
    throw new Error("Lesson file view has duplicate identities");
  return deepFreeze({
    activation: parseActivationWitness(input.activation),
    offer:
      offer.kind === "absent"
        ? offer
        : offer.kind === "available"
          ? { kind: "available", target: parseTarget(offer.target) }
          : {
              kind: "ready",
              target: parseTarget(offer.target),
              packageHash: parseHash({
                kind: "package",
                value: offer.packageHash,
              }),
              receipt: parseReference(offer.receipt),
            },
    commands: input.commands.map((item) => {
      const command = parseLessonFilesCommand(item.command),
        receipt = parseLessonFilesReceipt(item.receipt);
      assertLessonFilesEvidence(command, receipt);
      return { command, receipt, observation: item.observation };
    }),
    packages: input.packages.map((item) => ({
      ...item,
      packageHash: parseHash({ kind: "package", value: item.packageHash }),
    })),
  });
}
