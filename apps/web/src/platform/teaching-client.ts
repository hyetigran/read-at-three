import { browserConfiguration } from "./browser-configuration.ts";
import { StorageBusyError } from "./storage-busy.ts";
import { loadDevelopmentOpening } from "./development-opening.ts";
import { registerOfflineShell } from "./controlled-shell.ts";
import { createPageShellBridge } from "./shell-page-bridge.ts";
import {
  parsePublicationSelection,
  InstalledResourceUnavailableError,
  canonical,
  initialInstallIdentity,
  parseInitialInstallCommand,
  parseParentMaterialRequest,
  parsePreparationPackage,
  parseLessonFilesCommand,
  lessonFilesIdentity,
  assertLessonFilesEvidence,
} from "@readatthree/teaching";
import type {
  PublicationSelection,
  PublicationCheck,
  InitialInstallCommand,
  ParentMaterialRequest,
  LessonFilesCommand,
} from "@readatthree/teaching";
import { hashText } from "./hash.ts";
import { TeachingRecoveryError } from "@readatthree/react-integration";
import type {
  SelectedApplication,
  DiagnosticEvent,
  SelectedRecoveryOpening,
  PreparationAvailability,
} from "@readatthree/teaching";
import { preparationInput } from "./preparation.ts";
type Input<Method extends keyof SelectedApplication> = Parameters<
  SelectedApplication[Method]
>[0];
import { parseResponse, parseWorkerRequestId } from "./protocol.ts";
import type {
  WorkerRequest,
  WorkerResponse,
  WorkerRequestId,
} from "./protocol.ts";

export function createBrowserTeachingClient() {
  let worker: Worker | undefined;
  let connectionRevision = 0;
  let connectionLifetime = new AbortController();
  let shellBridge: ReturnType<typeof createPageShellBridge> | undefined;
  let preparation: PreparationAvailability = {
    kind: "unavailable",
    reason: "missing",
  };
  let lossListener = () => {};
  const connectionListeners = new Set<() => void>();
  const observations = new Map<
    string,
    { slow: boolean; timer: ReturnType<typeof setTimeout> }
  >();
  let connectionState = { revision: connectionRevision, pending: 0, slow: 0 };
  function publishConnection() {
    connectionState = {
      revision: connectionRevision,
      pending: observations.size,
      slow: [...observations.values()].filter((entry) => entry.slow).length,
    };
    for (const listener of connectionListeners) listener();
  }
  function observe(key: string) {
    const revision = connectionRevision;
    const entry = {
      slow: false,
      timer: setTimeout(() => {
        if (revision !== connectionRevision || observations.get(key) !== entry)
          return;
        entry.slow = true;
        publishConnection();
      }, 15000),
    };
    observations.set(key, entry);
    publishConnection();
    return () => {
      clearTimeout(entry.timer);
      if (observations.get(key) !== entry) return;
      observations.delete(key);
      publishConnection();
    };
  }
  const pending = new Map<
    WorkerRequestId,
    {
      resolve: (response: WorkerResponse) => void;
      reject: (error: Error) => void;
      finishObservation: () => void;
    }
  >();
  function dispose() {
    connectionRevision++;
    connectionLifetime.abort();
    shellBridge?.close();
    shellBridge = undefined;
    preparation = { kind: "unavailable", reason: "missing" };
    worker?.terminate();
    worker = undefined;
    for (const entry of observations.values()) clearTimeout(entry.timer);
    observations.clear();
    publishConnection();
    lossListener();
    for (const request of pending.values()) {
      request.finishObservation();
      request.reject(
        new Error(
          "The local store connection closed. Retry to recover the same saved work.",
        ),
      );
    }
    pending.clear();
  }
  function request(
    value: WorkerRequest,
    transfer: Transferable[] = [],
  ): Promise<WorkerResponse> {
    const active = worker;
    if (!active)
      return Promise.reject(new Error("The local store is unavailable."));
    return new Promise((resolve, reject) => {
      const finishObservation = observe(value.id);
      pending.set(value.id, { resolve, reject, finishObservation });
      try {
        active.postMessage(value, transfer);
      } catch (error) {
        pending.delete(value.id);
        finishObservation();
        reject(error);
      }
    });
  }
  const id = () => parseWorkerRequestId(crypto.randomUUID());
  async function publicationOperation(
    operation: "check" | "repair",
    input: PublicationSelection,
  ): Promise<PublicationCheck> {
    const target = parsePublicationSelection(input),
      ticket = connectionRevision;
    const response = await request({
      id: id(),
      kind: operation === "check" ? "checkPublication" : "repairPublication",
      input: target,
    });
    if (
      response.kind !== "publicationCheck" ||
      response.operation !== operation ||
      ticket !== connectionRevision ||
      canonical(response.value.target) !== canonical(target)
    )
      throw new Error("Publication observation changed target or connection");
    return response.value;
  }
  return {
    async readLessonFiles() {
      const ticket = connectionRevision;
      const response = await request({ id: id(), kind: "readLessonFiles" });
      if (response.kind !== "lessonFiles" || ticket !== connectionRevision)
        throw new Error("Lesson files connection changed");
      for (const saved of response.value.commands) {
        const identity = await lessonFilesIdentity(saved.command, hashText);
        if (
          identity.payloadHash !== saved.receipt.payloadHash ||
          ticket !== connectionRevision
        )
          throw new Error("Lesson files evidence changed");
      }
      return response.value;
    },
    async changeLessonFiles(input: LessonFilesCommand) {
      const command = parseLessonFilesCommand(input),
        ticket = connectionRevision;
      const identity = await lessonFilesIdentity(command, hashText);
      if (ticket !== connectionRevision)
        throw new Error("Lesson files connection changed");
      const response = await request({
        id: id(),
        kind: "changeLessonFiles",
        command,
      });
      if (
        response.kind !== "lessonFilesReceipt" ||
        ticket !== connectionRevision ||
        response.value.installationId !== command.installationId ||
        response.value.commandId !== command.commandId ||
        response.value.payloadHash !== identity.payloadHash
      )
        throw new Error("Lesson files reply changed its command identity");
      assertLessonFilesEvidence(command, response.value);
      return response.value;
    },
    checkPublication: (target: PublicationSelection) =>
      publicationOperation("check", target),
    repairPublication: (target: PublicationSelection) =>
      publicationOperation("repair", target),
    connectionState: () => connectionState,
    subscribeConnection(listener: () => void) {
      connectionListeners.add(listener);
      return () => {
        connectionListeners.delete(listener);
      };
    },
    async installations() {
      const ticket = connectionRevision;
      const response = await request({ id: id(), kind: "installations" });
      if (
        response.kind !== "installationCatalog" ||
        ticket !== connectionRevision
      )
        throw new Error("Installation catalog connection changed");
      for (const read of response.value.commands) {
        const identity = await initialInstallIdentity(read.command, hashText);
        if (
          identity.payloadHash !== read.fact.payloadHash ||
          ticket !== connectionRevision
        )
          throw new Error("Installation catalog evidence changed");
      }
      return response.value;
    },
    async initialInstall(input: InitialInstallCommand) {
      const command = parseInitialInstallCommand(input),
        ticket = connectionRevision;
      const response = await request({
        id: id(),
        kind: "initialInstall",
        command,
      });
      if (
        response.kind !== "installationRead" ||
        ticket !== connectionRevision ||
        canonical(response.value.command) !== canonical(command)
      )
        throw new Error("Installation reply does not match its exact command");
      const identity = await initialInstallIdentity(command, hashText);
      if (
        identity.payloadHash !== response.value.fact.payloadHash ||
        ticket !== connectionRevision
      )
        throw new Error("Installation evidence changed");
      return response.value;
    },
    async parentMaterial(input: ParentMaterialRequest) {
      const material = parseParentMaterialRequest(input),
        ticket = connectionRevision;
      const response = await request({
        id: id(),
        kind: "parentMaterial",
        input: material,
      });
      if (
        response.kind !== "parentMaterial" ||
        ticket !== connectionRevision ||
        response.value.packageHash !== material.packageHash ||
        (response.value.kind !== "unavailable" &&
          response.value.kind !== material.kind)
      )
        throw new Error("Parent material reply changed request or connection");
      if (response.value.kind !== "preparation") return response.value;
      const document = await parsePreparationPackage(
        response.value.document,
        hashText,
      );
      if (ticket !== connectionRevision)
        throw new Error(
          "Parent material connection was retired during verification",
        );
      return { ...response.value, document };
    },
    onLoss(listener: () => void) {
      lossListener = listener;
    },
    async connect(opening: SelectedRecoveryOpening) {
      dispose();
      const ticket = connectionRevision;
      const finishOpening = observe(`opening:${ticket}`);
      try {
        if (
          !window.isSecureContext ||
          !navigator.storage?.getDirectory ||
          !navigator.locks ||
          typeof Worker === "undefined"
        )
          throw new Error(
            "This browser cannot save reading progress safely. Use a supported browser with local storage available, then retry.",
          );
        connectionLifetime = new AbortController();
        const development =
          browserConfiguration.kind === "development"
            ? await loadDevelopmentOpening()
            : undefined;
        if (browserConfiguration.kind === "installed")
          await registerOfflineShell(browserConfiguration.shell);
        if (ticket !== connectionRevision)
          throw new Error("This local store connection was retired.");
        const connection = new Worker(
          new URL("./teaching.worker.ts", import.meta.url),
          {
            type: "module",
          },
        );
        worker = connection;
        connection.addEventListener(
          "message",
          (event: MessageEvent<unknown>) => {
            if (worker !== connection) return;
            try {
              const result = parseResponse(event.data);
              if (result.kind === "connectionLost") {
                dispose();
                return;
              }
              const waiting = pending.get(result.id);
              if (!waiting) return;
              pending.delete(result.id);
              waiting.finishObservation();
              if (result.kind === "contentUnavailable") {
                waiting.reject(
                  new InstalledResourceUnavailableError(result.value),
                );
              } else if (result.kind === "storageBusy")
                waiting.reject(new StorageBusyError());
              else if (result.kind === "failed")
                waiting.reject(new Error(result.message));
              else waiting.resolve(result);
            } catch {
              dispose();
            }
          },
        );
        const lost = () => {
          if (worker === connection) dispose();
        };
        connection.addEventListener("error", lost);
        connection.addEventListener("messageerror", lost);
        let response: WorkerResponse;
        if (browserConfiguration.kind === "installed") {
          const channel = new MessageChannel();
          shellBridge = createPageShellBridge({
            port: channel.port1,
            policy: browserConfiguration.shell,
            signal: connectionLifetime.signal,
          });
          response = await request(
            { id: id(), kind: "openInstalledRecovery", opening },
            [channel.port2],
          );
        } else {
          if (!development)
            throw new Error("Development opening is unavailable");
          response = await request({
            id: id(),
            kind: "openRecovery",
            content: development.content,
            preparation: preparationInput(development.preparation),
            opening,
          });
        }
        if (response.kind !== "inventory")
          throw new Error(
            "The local store returned an invalid recovery inventory.",
          );
        if (ticket !== connectionRevision || worker !== connection)
          throw new Error("This local store connection was retired.");
        preparation = development?.preparation ?? {
          kind: "unavailable",
          reason: "missing",
        };
        return response.value;
      } finally {
        finishOpening();
      }
    },
    readPreparation() {
      return {
        connectionTicket: connectionRevision,
        availability: preparation,
      };
    },
    connectionTicket: () => connectionRevision,
    async read(input: Input<"readApplication">) {
      const response = await request({ id: id(), kind: "read", input });
      if (response.kind !== "application")
        throw new Error("The saved place could not be read.");
      const { directory, application } = response.value;
      if (application.kind === "recovery")
        throw new TeachingRecoveryError(application);
      return {
        directory,
        courseId: application.courseId,
        projection: application.projection,
        application,
      };
    },
    async readDiagnostics() {
      const response = await request({ id: id(), kind: "readDiagnostics" });
      if (response.kind !== "diagnostics")
        throw new Error("Local support information could not be read.");
      return { ...response.value, metadata: response.metadata };
    },
    async recordDiagnostic(event: DiagnosticEvent) {
      const response = await request({
        id: id(),
        kind: "recordDiagnostic",
        event,
      });
      if (response.kind !== "diagnostics")
        throw new Error("Local support information could not be recorded.");
      return response.value;
    },
    async readDirectory() {
      const response = await request({ id: id(), kind: "readDirectory" });
      if (response.kind !== "directory")
        throw new Error("Child profiles could not be loaded.");
      return response.value;
    },
    async readWork(input: Input<"readWork">) {
      const response = await request({ id: id(), kind: "readWork", input });
      if (response.kind !== "work")
        throw new Error("Saved work could not be read.");
      return response.value;
    },
    async readPracticeControls(input: Input<"readPracticeControls">) {
      const response = await request({
        id: id(),
        kind: "readPracticeControls",
        input,
      });
      if (response.kind !== "practiceControls")
        throw new Error("Practice tools could not be read.");
      return response.value;
    },
    async execute(operation: Input<"execute">) {
      const response = await request({ id: id(), kind: "execute", operation });
      if (response.kind !== "execution")
        throw new Error("The saved action could not be confirmed.");
      return response.value;
    },
    async administer(command: Input<"administer">) {
      const response = await request({ id: id(), kind: "administer", command });
      if (response.kind !== "profileReceipt")
        throw new Error("The profile change could not be confirmed.");
      return response.value;
    },
    async readDeparture(input: Input<"readDeparture">) {
      const response = await request({
        id: id(),
        kind: "readDeparture",
        selection: input.selection,
      });
      if (response.kind !== "departure")
        throw new Error(
          "The current child’s saved work could not be confirmed.",
        );
      return response.value;
    },
    async readInk(input: Input<"readInk">) {
      const response = await request({ id: id(), kind: "readInk", input });
      if (response.kind !== "inkSnapshot")
        throw new Error("The writing could not be restored.");
      return response.value;
    },
    async recoverInk(input: Input<"recoverInk">) {
      const response = await request({
        id: id(),
        kind: "recoverInk",
        ...input,
      });
      if (response.kind !== "inkRecovery")
        throw new Error("Saved writing could not be recovered.");
      return response.value;
    },
    async recoverTeaching(input: Input<"recoverTeaching">) {
      const response = await request({
        id: id(),
        kind: "recoverTeaching",
        ...input,
      });
      if (response.kind !== "teachingRecovery")
        throw new Error("The saved lesson could not be recovered.");
      return response.value;
    },
    async recoverAdministration(input: Input<"recoverAdministration">) {
      const response = await request({
        id: id(),
        kind: "recoverAdministration",
        ...input,
      });
      if (response.kind !== "administrationRecovery")
        throw new Error("The profile change could not be recovered.");
      return response.value;
    },
    async reconcileRecovery(input: Input<"reconcileRecovery">) {
      const response = await request({
        id: id(),
        kind: "reconcileRecovery",
        ...input,
      });
      if (response.kind !== "reconciled")
        throw new Error("Saved work could not be reopened.");
      return response.value;
    },
    close: dispose,
  };
}
export type BrowserTeachingClient = ReturnType<
  typeof createBrowserTeachingClient
>;

export type InkLifecycleClient = Omit<
  BrowserTeachingClient,
  | "readWork"
  | "readPracticeControls"
  | "readPreparation"
  | "installations"
  | "initialInstall"
  | "readLessonFiles"
  | "changeLessonFiles"
  | "parentMaterial"
  | "checkPublication"
  | "repairPublication"
  | "readDiagnostics"
  | "recordDiagnostic"
  | "connectionState"
  | "subscribeConnection"
>;
