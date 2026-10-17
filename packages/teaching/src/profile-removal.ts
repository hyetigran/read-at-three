import type {
  AdministrationWitness,
  CommandId,
  Counter,
  DepartureWitness,
  HashFunction,
  IdFactory,
  Owner,
  PayloadHash,
  ProfileAdministrationCommand,
  ProfileAdministrationReceipt,
  ProfileEditWitness,
  ProfilePreferencesInput,
  SelectedOwnerWitness,
} from "./index.ts";
import {
  validateProfileRemovalCommand,
  validateProfileResetReceipt,
  validateProfileDeletionReceipt,
} from "./generated-profile-validators.js";
import {
  canonical,
  deepFreeze,
  increment,
  parseCounter,
  parseHash,
  parseId,
} from "./identity.ts";
import { decodeDepartureWitness, parseLocalPreferences } from "./profiles.ts";
import { parseSelectedOwnerWitness } from "./selection.ts";
import type { RawProfileRemovalCommand } from "./profile-schemas.ts";

export type ProfileRemovalIntent = Readonly<{
  directory: AdministrationWitness;
  target: ProfileEditWitness;
}> &
  (
    | Readonly<{ kind: "resetProfile" }>
    | Readonly<{
        kind: "deleteProfile";
        successor:
          | Readonly<{ kind: "existing"; owner: Owner }>
          | Readonly<{
              kind: "replacement";
              preferences: ProfilePreferencesInput;
            }>;
      }>
  );
export type ProfileRemovalCommand = Readonly<{
  version: 2;
  commandId: CommandId;
  scope: AdministrationWitness;
  selection: SelectedOwnerWitness;
  payloadHash: PayloadHash;
  payload:
    | Readonly<{
        kind: "resetProfile";
        target: ProfileEditWitness;
        departure: DepartureWitness;
      }>
    | Readonly<{
        kind: "deleteProfile";
        target: ProfileEditWitness;
        departure: DepartureWitness;
        successor:
          | Readonly<{ kind: "existing"; owner: Owner }>
          | Readonly<{
              kind: "replacement";
              owner: Owner;
              preferences: ProfilePreferencesInput;
            }>;
      }>;
}>;
export type ProfileResetReceipt = Readonly<{
  kind: "profileCommitted";
  version: 2;
  commandId: CommandId;
  payloadHash: PayloadHash;
  administration: AdministrationWitness;
  selection: SelectedOwnerWitness;
  effect: Readonly<{ kind: "reset"; target: ProfileEditWitness }>;
}>;
export type ProfileDeletionReceipt = Readonly<{
  kind: "profileCommitted";
  version: 2;
  commandId: CommandId;
  payloadHash: PayloadHash;
  administration: AdministrationWitness;
  expectedRevision: Counter;
  effect: Readonly<{ kind: "deleted" }>;
}>;
export type ProfileRemovalReceipt =
  ProfileResetReceipt | ProfileDeletionReceipt;

function owner(input: RawProfileRemovalCommand["selection"]["owner"]): Owner {
  return {
    profileId: parseId({ kind: "profile", value: input.profileId }),
    generation: parseCounter(input.generation),
  };
}
function administration(
  input: RawProfileRemovalCommand["scope"],
): AdministrationWitness {
  return {
    installationId: parseId({
      kind: "installation",
      value: input.installationId,
    }),
    revision: parseCounter(input.revision),
  };
}
function edit(
  input: RawProfileRemovalCommand["payload"]["target"],
): ProfileEditWitness {
  return { owner: owner(input.owner), revision: parseCounter(input.revision) };
}
export function parseProfileRemovalCommand(
  input: unknown,
): ProfileRemovalCommand {
  if (
    !validateProfileRemovalCommand(input) ||
    input.version !== 2 ||
    canonical(input).length > 2 * 1024 * 1024
  )
    throw new Error("Profile removal command is unsupported");
  const common = {
    version: 2,
    commandId: parseId({ kind: "command", value: input.commandId }),
    scope: administration(input.scope),
    selection: parseSelectedOwnerWitness(input.selection),
    payloadHash: parseHash({ kind: "payload", value: input.payloadHash }),
  } satisfies Omit<ProfileRemovalCommand, "payload">;
  if (common.scope.installationId !== common.selection.installationId)
    throw new Error("Profile removal installation changed");
  const body = input.payload;
  const target = edit(body.target),
    departure = decodeDepartureWitness(body.departure);
  if (body.kind === "resetProfile")
    return deepFreeze({
      ...common,
      payload: { kind: body.kind, target, departure },
    });
  const successor = body.successor;
  if (successor.kind === "replacement")
    parseLocalPreferences({ version: 1, ...successor.preferences });
  return deepFreeze({
    ...common,
    payload: {
      kind: body.kind,
      target,
      departure,
      successor:
        successor.kind === "existing"
          ? { kind: successor.kind, owner: owner(successor.owner) }
          : {
              kind: successor.kind,
              owner: owner(successor.owner),
              preferences: successor.preferences,
            },
    },
  });
}
export function parseProfileRemovalReceipt(
  input: unknown,
): ProfileRemovalReceipt {
  if (validateProfileResetReceipt(input) && input.version === 2) {
    const result = {
      kind: input.kind,
      version: 2,
      commandId: parseId({ kind: "command", value: input.commandId }),
      payloadHash: parseHash({ kind: "payload", value: input.payloadHash }),
      administration: administration(input.administration),
      selection: parseSelectedOwnerWitness(input.selection),
      effect: { kind: "reset", target: edit(input.effect.target) },
    } satisfies ProfileResetReceipt;
    if (
      result.administration.installationId !==
        result.selection.installationId ||
      canonical(result.selection.owner) !==
        canonical(result.effect.target.owner)
    )
      throw new Error("Reset receipt ownership is inconsistent");
    return deepFreeze(result);
  }
  if (validateProfileDeletionReceipt(input) && input.version === 2) {
    const result = {
      kind: input.kind,
      version: 2,
      commandId: parseId({ kind: "command", value: input.commandId }),
      payloadHash: parseHash({ kind: "payload", value: input.payloadHash }),
      administration: administration(input.administration),
      expectedRevision: parseCounter(input.expectedRevision),
      effect: { kind: "deleted" },
    } satisfies ProfileDeletionReceipt;
    if (result.administration.revision !== increment(result.expectedRevision))
      throw new Error("Deletion receipt revision step is inconsistent");
    return deepFreeze(result);
  }
  throw new Error("Profile removal receipt is unsupported");
}
export async function prepareProfileRemoval(input: {
  intent: ProfileRemovalIntent;
  selection: SelectedOwnerWitness;
  departure: DepartureWitness;
  ids: IdFactory;
  hash: HashFunction;
}): Promise<ProfileRemovalCommand> {
  const { intent } = input;
  const payload: ProfileRemovalCommand["payload"] =
    intent.kind === "resetProfile"
      ? { kind: intent.kind, target: intent.target, departure: input.departure }
      : {
          kind: intent.kind,
          target: intent.target,
          departure: input.departure,
          successor:
            intent.successor.kind === "existing"
              ? intent.successor
              : {
                  ...intent.successor,
                  owner: {
                    profileId: parseId({ kind: "profile", value: input.ids() }),
                    generation: parseCounter("0"),
                  },
                },
        };
  const preimage = {
    version: 2,
    scope: intent.directory,
    selection: input.selection,
    payload,
  } satisfies Omit<ProfileRemovalCommand, "commandId" | "payloadHash">;
  return parseProfileRemovalCommand({
    ...preimage,
    commandId: input.ids(),
    payloadHash: await input.hash(canonical(preimage)),
  });
}

export function profileAdministrationOwners(input: {
  command: ProfileAdministrationCommand | null;
  receipt: ProfileAdministrationReceipt | null;
}): readonly Owner[] {
  const result: Owner[] = [];
  function departure(value: DepartureWitness) {
    for (const course of value.courses) {
      result.push(course.witness.owner);
      for (const document of course.documents)
        result.push({
          profileId: document.profileId,
          generation: document.generation,
        });
    }
  }
  const command = input.command;
  if (command) {
    result.push(command.selection.owner);
    switch (command.version) {
      case 1: {
        const body = command.payload;
        switch (body.kind) {
          case "setAvatar":
          case "setDisplayName":
          case "finishInitialProfile":
            result.push(body.target.owner);
            break;
          case "createAndSelect":
            result.push(body.owner);
            departure(body.departure);
            break;
          case "selectProfile":
            result.push(body.target);
            departure(body.departure);
            break;
          case "acknowledgePreparation":
            break;
          default: {
            const exhaustive: never = body;
            return exhaustive;
          }
        }
        break;
      }
      case 2: {
        const body = command.payload;
        switch (body.kind) {
          case "resetProfile":
            result.push(body.target.owner);
            departure(body.departure);
            break;
          case "deleteProfile":
            result.push(body.target.owner, body.successor.owner);
            departure(body.departure);
            break;
          default: {
            const exhaustive: never = body;
            return exhaustive;
          }
        }
        break;
      }
      default: {
        const exhaustive: never = command;
        return exhaustive;
      }
    }
  }
  const receipt = input.receipt;
  if (!receipt) return result;
  switch (receipt.version) {
    case 1: {
      result.push(receipt.selection.owner);
      const effect = receipt.effect;
      switch (effect.kind) {
        case "preferences":
        case "created":
        case "initialSetup":
          result.push(effect.target.owner);
          break;
        case "selection":
          result.push(effect.previous.owner);
          break;
        case "preparation":
          break;
        default: {
          const exhaustive: never = effect;
          return exhaustive;
        }
      }
      break;
    }
    case 2: {
      switch (receipt.effect.kind) {
        case "reset":
          if (!("selection" in receipt))
            throw new Error("Reset receipt has no selected owner");
          result.push(receipt.selection.owner, receipt.effect.target.owner);
          break;
        case "deleted":
          break;
        default: {
          const exhaustive: never = receipt.effect;
          return exhaustive;
        }
      }
      break;
    }
    default: {
      const exhaustive: never = receipt;
      return exhaustive;
    }
  }
  return result;
}
