import type { profileAdministrationReceipt } from "./schema.ts";
import {
  canonical,
  increment,
  parseCounter,
  parseHash,
  parseId,
  parseProfileAdministrationCommand,
  parseProfileAdministrationReceipt,
  parseProfileRemovalReceipt,
} from "../../teaching/src/index.ts";
import type {
  ProfileAdministrationCommandV1,
  ProfileAdministrationReceiptV1,
  ProfileRemovalCommand,
  ProfileRemovalReceipt,
} from "../../teaching/src/index.ts";

export function receiptFor(
  command: ProfileAdministrationCommandV1,
): ProfileAdministrationReceiptV1 {
  const body = command.payload;
  let selection = command.selection;
  let effect: ProfileAdministrationReceiptV1["effect"];
  switch (body.kind) {
    case "setAvatar":
    case "setDisplayName":
    case "finishInitialProfile":
      effect = {
        kind:
          body.kind === "finishInitialProfile" ? "initialSetup" : "preferences",
        target: {
          owner: body.target.owner,
          revision: increment(body.target.revision),
        },
      };
      break;
    case "acknowledgePreparation":
      effect = { kind: "preparation", hash: body.hash };
      break;
    case "createAndSelect":
    case "selectProfile": {
      const owner = body.kind === "createAndSelect" ? body.owner : body.target;
      selection = {
        installationId: command.selection.installationId,
        revision: increment(command.selection.revision),
        owner,
      };
      effect =
        body.kind === "createAndSelect"
          ? { kind: "created", target: { owner, revision: parseCounter("0") } }
          : { kind: "selection", previous: command.selection };
      break;
    }
    default: {
      const exhaustive: never = body;
      return exhaustive;
    }
  }
  return parseProfileAdministrationReceipt({
    kind: "profileCommitted",
    version: 1,
    commandId: command.commandId,
    payloadHash: command.payloadHash,
    administration: {
      installationId: command.scope.installationId,
      revision: increment(command.scope.revision),
    },
    selection,
    effect,
  });
}

export function removalReceipt(
  command: ProfileRemovalCommand,
): ProfileRemovalReceipt {
  const administration = {
    installationId: command.scope.installationId,
    revision: increment(command.scope.revision),
  };
  if (command.payload.kind === "deleteProfile")
    return parseProfileRemovalReceipt({
      kind: "profileCommitted",
      version: 2,
      commandId: command.commandId,
      payloadHash: command.payloadHash,
      administration,
      expectedRevision: command.scope.revision,
      effect: { kind: "deleted" },
    });
  const owner = {
    ...command.payload.target.owner,
    generation: increment(command.payload.target.owner.generation),
  };
  return parseProfileRemovalReceipt({
    kind: "profileCommitted",
    version: 2,
    commandId: command.commandId,
    payloadHash: command.payloadHash,
    administration,
    selection: {
      ...command.selection,
      revision: increment(command.selection.revision),
      owner,
    },
    effect: {
      kind: "reset",
      target: { owner, revision: increment(command.payload.target.revision) },
    },
  });
}
type AdministrationRow = typeof profileAdministrationReceipt.$inferSelect;
type IdentityRow = Pick<
  AdministrationRow,
  | "installationId"
  | "commandId"
  | "commandVersion"
  | "expectedRevision"
  | "resultingRevision"
  | "payloadHash"
>;

function parseAdministrationIdentity(input: IdentityRow) {
  const version = Number(input.commandVersion);
  if (version !== 1 && version !== 2)
    throw new Error("Saved administration version is unsupported");
  const identity = {
    installationId: parseId({
      kind: "installation",
      value: input.installationId,
    }),
    commandId: parseId({ kind: "command", value: input.commandId }),
    version,
    expectedRevision: parseCounter(input.expectedRevision),
    resultingRevision: parseCounter(input.resultingRevision),
    payloadHash: parseHash({ kind: "payload", value: input.payloadHash }),
  };
  if (identity.resultingRevision !== increment(identity.expectedRevision))
    throw new Error("Saved administration revision step is corrupt");
  return identity;
}
export function administrationIdentity(input: IdentityRow) {
  return canonical(parseAdministrationIdentity(input));
}

type AdministrationEvidence =
  | {
      kind: "full";
      command: ProfileAdministrationCommandV1;
      receipt: ProfileAdministrationReceiptV1;
    }
  | {
      kind: "retired";
      identity: ReturnType<typeof parseAdministrationIdentity>;
    }
  | {
      kind: "deleted";
      receipt: Extract<ProfileRemovalReceipt, { effect: { kind: "deleted" } }>;
    };

export function decodeAdministrationEvidence(
  row: AdministrationRow,
): AdministrationEvidence {
  const identity = parseAdministrationIdentity(row);
  if (Number(row.resultVersion) !== identity.version)
    throw new Error("Saved administration versions disagree");
  switch (row.evidenceKind) {
    case "full": {
      const command = parseProfileAdministrationCommand(
        JSON.parse(row.command),
      );
      const receipt = parseProfileAdministrationReceipt(JSON.parse(row.result));
      if (
        identity.version !== 1 ||
        command.version !== 1 ||
        receipt.version !== 1 ||
        canonical(command) !== row.command ||
        canonical(receipt) !== row.result ||
        command.scope.installationId !== identity.installationId ||
        command.commandId !== identity.commandId ||
        command.payloadHash !== identity.payloadHash ||
        command.scope.revision !== identity.expectedRevision ||
        canonical(receiptFor(command)) !== row.result
      )
        throw new Error("Saved profile administration receipt is corrupt");
      return { kind: "full", command, receipt };
    }
    case "retired":
      if (row.command !== canonical(identity) || row.result !== "{}")
        throw new Error("Retired administration evidence is corrupt");
      return { kind: "retired", identity };
    case "deleted": {
      const receipt = parseProfileRemovalReceipt(JSON.parse(row.result));
      if (
        identity.version !== 2 ||
        receipt.effect.kind !== "deleted" ||
        !("expectedRevision" in receipt) ||
        row.command !== canonical(identity) ||
        row.result !== canonical(receipt) ||
        receipt.commandId !== identity.commandId ||
        receipt.payloadHash !== identity.payloadHash ||
        receipt.expectedRevision !== identity.expectedRevision ||
        receipt.administration.installationId !== identity.installationId ||
        receipt.administration.revision !== identity.resultingRevision
      )
        throw new Error("Saved deletion receipt is corrupt");
      return { kind: "deleted", receipt };
    }
    default:
      throw new Error("Saved administration evidence kind is unsupported");
  }
}
