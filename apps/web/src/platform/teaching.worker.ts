import { browserConfiguration } from "./browser-configuration.ts";
import type { BrowserConfiguration } from "./browser-configuration.ts";
import { createBrowserInstalledOptions } from "./installed-application.ts";
import { initializeReadingSqlite } from "./sqlite-bootstrap.ts";
import applicationPackage from "../../../../package.json";
import {
  createTeachingApplication,
  DATABASE_VERSION,
} from "@readatthree/storage";
import type { SqlExecutor } from "@readatthree/storage";
import {
  InstalledResourceUnavailableError,
  InstalledContentUnavailableError,
  parseRuntimePackage,
  parsePreparationAvailability,
  preparationPolicy,
} from "@readatthree/teaching";
import type {
  CourseId,
  SelectedApplication,
  LocalSupportApplication,
  DiagnosticEvent,
  InkChunk,
  PortableInstallationApplication,
} from "@readatthree/teaching";
import { hashText } from "./hash.ts";
import { parseRequest, serializeParentMaterial } from "./protocol.ts";
import type {
  WorkerRequest,
  WorkerResponse,
  LocalSupportMetadata,
} from "./protocol.ts";

type OpenedStore = Readonly<{
  app: SelectedApplication &
    LocalSupportApplication &
    PortableInstallationApplication;
  courseId: CourseId;
  support: LocalSupportMetadata;
}>;
let application: Promise<OpenedStore> | undefined;

type Opening =
  | Readonly<{
      kind: "development";
      content: unknown;
      preparationInput: unknown;
    }>
  | Readonly<{
      kind: "installed";
      configuration: Extract<BrowserConfiguration, { kind: "installed" }>;
      port: MessagePort;
    }>;
function bootstrap(input: Opening): Promise<OpenedStore> {
  return new Promise((resolve, reject) => {
    const ownership = new AbortController();
    const ownershipDeadline = setTimeout(
      () =>
        ownership.abort(
          new Error(
            "Another tab has this child's local reading store open. Close it and retry.",
          ),
        ),
      10000,
    );
    navigator.locks
      .request(
        "read-at-three.sqlite.v1",
        { mode: "exclusive", signal: ownership.signal },
        async (lock) => {
          clearTimeout(ownershipDeadline);
          if (!lock) {
            reject(
              new Error(
                "Another tab has this child's local reading store open. Close it and retry.",
              ),
            );
            return;
          }
          try {
            const selected =
              input.kind === "development"
                ? {
                    kind: "development" as const,
                    content: await parseRuntimePackage(input.content, hashText),
                    preparation: await parsePreparationAvailability(
                      input.preparationInput,
                      hashText,
                    ),
                  }
                : {
                    kind: "installed" as const,
                    options: createBrowserInstalledOptions({
                      configuration: input.configuration,
                      port: input.port,
                      signal: ownership.signal,
                    }),
                  };
            const sqlite3 = await initializeReadingSqlite();
            if (!sqlite3.config.bigIntEnabled)
              throw new Error(
                "This browser cannot preserve SQLite integer values safely.",
              );
            const pool = await sqlite3.installOpfsSAHPoolVfs({
              name: "opfs-sahpool",
              directory: ".read-at-three.sqlite",
              initialCapacity: 6,
            });
            const database = new pool.OpfsSAHPoolDb("/reading.sqlite3");
            const executor: SqlExecutor = {
              async execute(sql, parameters) {
                const rows: unknown[][] = [];
                database.exec({
                  sql,
                  bind: [...parameters],
                  rowMode: "array",
                  callback: (row) => {
                    rows.push([...row]);
                  },
                });
                return { rows };
              },
            };
            resolve({
              courseId:
                selected.kind === "development"
                  ? selected.content.body.courseId
                  : selected.options.courseId,
              support: {
                versions: {
                  application: applicationPackage.version,
                  database: DATABASE_VERSION,
                  inkCodec: 1 satisfies InkChunk["codecVersion"],
                },
                capabilities: {
                  opfs: true,
                  storeLock: true,
                  sqliteBigInt: true,
                },
              },
              app:
                selected.kind === "development"
                  ? createTeachingApplication({
                      executor,
                      content: selected.content,
                      ids: () => crypto.randomUUID(),
                      hash: hashText,
                      preparation: preparationPolicy(selected.preparation),
                    })
                  : createTeachingApplication({
                      executor,
                      installed: selected.options,
                      ids: () => crypto.randomUUID(),
                      hash: hashText,
                    }),
            });
            await new Promise<void>(() => {});
          } catch (error) {
            reject(error);
          }
        },
      )
      .catch((error: unknown) => {
        clearTimeout(ownershipDeadline);
        reject(error);
      });
  });
}

self.addEventListener("message", (event: MessageEvent<unknown>) => {
  const request = parseRequest(event.data);
  void (async () => {
    const started = performance.now();
    try {
      if (
        request.kind === "openRecovery" ||
        request.kind === "openInstalledRecovery"
      ) {
        if (application)
          throw new Error("This worker already has an opening owner");
        if (request.kind === "openRecovery") {
          if (
            browserConfiguration.kind !== "development" ||
            event.ports.length !== 0
          )
            throw new Error("Opening mode differs from compiled configuration");
          application = bootstrap({
            kind: "development",
            content: request.content,
            preparationInput: request.preparation,
          });
        } else {
          const port = event.ports[0];
          if (
            browserConfiguration.kind !== "installed" ||
            event.ports.length !== 1 ||
            !(port instanceof MessagePort)
          )
            throw new Error(
              "Installed opening requires its private controller bridge",
            );
          application = bootstrap({
            kind: "installed",
            configuration: browserConfiguration,
            port,
          });
        }
      }
      if (!application) throw new Error("The local store has not been opened.");
      const { app, support } = await application;
      let response: WorkerResponse;
      switch (request.kind) {
        case "openInstalledRecovery":
        case "openRecovery":
          response = {
            id: request.id,
            kind: "inventory",
            value: await app.openRecovery(request.opening),
          };
          break;
        case "readDiagnostics":
          response = {
            id: request.id,
            kind: "diagnostics",
            value: await app.readDiagnostics(),
            metadata: support,
          };
          break;
        case "recordDiagnostic":
          response = {
            id: request.id,
            kind: "diagnostics",
            value: await app.recordDiagnostic(request.event),
            metadata: support,
          };
          break;
        case "installations":
          response = {
            id: request.id,
            kind: "installationCatalog",
            value: await app.installations(),
          };
          break;
        case "checkPublication":
        case "repairPublication":
          response = {
            id: request.id,
            kind: "publicationCheck",
            operation: request.kind === "checkPublication" ? "check" : "repair",
            value:
              request.kind === "checkPublication"
                ? await app.checkPublication(request.input)
                : await app.repairPublication(request.input),
          };
          break;
        case "initialInstall":
          response = {
            id: request.id,
            kind: "installationRead",
            value: await app.initialInstall(request.command),
          };
          break;
        case "parentMaterial": {
          const material = await app.parentMaterial(request.input);
          if (material.kind === "unavailable")
            throw new InstalledResourceUnavailableError({
              packageHash: material.packageHash,
              reason: material.failure,
            });
          response = {
            id: request.id,
            kind: "parentMaterial",
            value: serializeParentMaterial(material),
          };
          break;
        }
        case "readDirectory":
          response = {
            id: request.id,
            kind: "directory",
            value: await app.readDirectory(),
          };
          break;
        case "read":
          response = {
            id: request.id,
            kind: "application",
            value: await app.readApplication(request.input),
          };
          break;
        case "readWork":
          response = {
            id: request.id,
            kind: "work",
            value: await app.readWork(request.input),
          };
          break;
        case "readPracticeControls":
          response = {
            id: request.id,
            kind: "practiceControls",
            value: await app.readPracticeControls(request.input),
          };
          break;
        case "execute":
          response = {
            id: request.id,
            kind: "execution",
            value: await app.execute(request.operation),
          };
          break;
        case "administer":
          response = {
            id: request.id,
            kind: "profileReceipt",
            value: await app.administer(request.command),
          };
          break;
        case "readDeparture":
          response = {
            id: request.id,
            kind: "departure",
            value: await app.readDeparture({ selection: request.selection }),
          };
          break;
        case "readInk":
          response = {
            id: request.id,
            kind: "inkSnapshot",
            value: await app.readInk(request.input),
          };
          break;
        case "recoverInk":
          response = {
            id: request.id,
            kind: "inkRecovery",
            value: await app.recoverInk({
              recoveryId: request.recoveryId,
              operation: request.operation,
            }),
          };
          break;
        case "recoverTeaching":
          response = {
            id: request.id,
            kind: "teachingRecovery",
            value: await app.recoverTeaching({
              recoveryId: request.recoveryId,
              operation: request.operation,
            }),
          };
          break;
        case "recoverAdministration":
          response = {
            id: request.id,
            kind: "administrationRecovery",
            value: await app.recoverAdministration({
              recoveryId: request.recoveryId,
              command: request.command,
            }),
          };
          break;
        case "reconcileRecovery":
          response = {
            id: request.id,
            kind: "reconciled",
            value: await app.reconcileRecovery({
              recoveryId: request.recoveryId,
              choice: request.choice,
            }),
          };
          break;
        default: {
          const exhaustive: never = request;
          throw new Error(String(exhaustive));
        }
      }
      self.postMessage(response);
      if (
        request.kind !== "readDiagnostics" &&
        request.kind !== "recordDiagnostic" &&
        request.kind !== "checkPublication" &&
        request.kind !== "repairPublication"
      )
        void app
          .recordDiagnostic({
            category: "timing",
            operation: diagnosticOperation(request),
            count: 1,
            durationMs: Math.min(
              600000,
              Math.max(0, Math.round(performance.now() - started)),
            ),
          })
          .catch(() => {});
    } catch (error) {
      if (
        application &&
        request.kind !== "readDiagnostics" &&
        request.kind !== "recordDiagnostic" &&
        request.kind !== "checkPublication" &&
        request.kind !== "repairPublication"
      )
        void application
          .then(({ app }) =>
            app.recordDiagnostic({
              category:
                diagnosticOperation(request) === "read"
                  ? "read-failed"
                  : "write-failed",
              operation: diagnosticOperation(request),
              count: 1,
              durationMs: 0,
            }),
          )
          .catch(() => {});
      if (error instanceof InstalledContentUnavailableError)
        self.postMessage({
          id: request.id,
          kind: "contentUnavailable",
          value: {
            packageHash: error.packageHash,
            reason: { kind: "representationUnavailable" },
          },
        } satisfies WorkerResponse);
      else if (error instanceof InstalledResourceUnavailableError)
        self.postMessage({
          id: request.id,
          kind: "contentUnavailable",
          value: error.failure,
        } satisfies WorkerResponse);
      else
        self.postMessage({
          id: request.id,
          kind: "failed",
          message:
            "The local save could not be confirmed. Keep this reading window open and retry the same action.",
        } satisfies WorkerResponse);
    }
  })();
});

function diagnosticOperation(
  request: WorkerRequest,
): DiagnosticEvent["operation"] {
  switch (request.kind) {
    case "openInstalledRecovery":
    case "openRecovery":
    case "initialInstall":
      return "startup";
    case "execute":
      return request.operation.kind === "ink" ? "ink" : "teaching";
    case "administer":
    case "recoverAdministration":
      return "administration";
    case "recoverInk":
      return "ink";
    case "recoverTeaching":
    case "reconcileRecovery":
      return "teaching";
    case "checkPublication":
    case "repairPublication":
    case "installations":
    case "parentMaterial":
    case "read":
    case "readWork":
    case "readInk":
    case "readDirectory":
    case "readDeparture":
    case "readPracticeControls":
      return "read";
    case "readDiagnostics":
    case "recordDiagnostic":
      return "support";
    default: {
      const exhaustive: never = request;
      return exhaustive;
    }
  }
}
