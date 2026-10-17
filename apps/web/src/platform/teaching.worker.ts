import sqlite3InitModule from "@sqlite.org/sqlite-wasm";
import { createTeachingApplication } from "@readatthree/storage";
import type { SqlExecutor } from "@readatthree/storage";
import {
  parseRuntimePackage,
  parsePreparationAvailability,
  preparationPolicy,
} from "@readatthree/teaching";
import type { CourseId, SelectedApplication } from "@readatthree/teaching";
import { hashText } from "./hash.ts";
import { parseRequest } from "./protocol.ts";
import type { WorkerResponse } from "./protocol.ts";

type OpenedStore = Readonly<{
  app: SelectedApplication;
  courseId: CourseId;
}>;
let application: Promise<OpenedStore> | undefined;

function bootstrap(
  content: unknown,
  preparationInput: unknown,
): Promise<OpenedStore> {
  return new Promise((resolve, reject) => {
    navigator.locks
      .request(
        "read-at-three.sqlite.v1",
        { ifAvailable: true },
        async (lock) => {
          if (!lock) {
            reject(
              new Error(
                "Another tab has this child's local reading store open. Close it and retry.",
              ),
            );
            return;
          }
          try {
            const verified = await parseRuntimePackage(content, hashText);
            const preparation = await parsePreparationAvailability(
              preparationInput,
              hashText,
            );
            const sqlite3 = await sqlite3InitModule();
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
              courseId: verified.body.courseId,
              app: createTeachingApplication({
                executor,
                content: verified,
                ids: () => crypto.randomUUID(),
                hash: hashText,
                preparation: preparationPolicy(preparation),
              }),
            });
            await new Promise<void>(() => {});
          } catch (error) {
            reject(error);
          }
        },
      )
      .catch(reject);
  });
}

self.addEventListener("message", (event: MessageEvent<unknown>) => {
  const request = parseRequest(event.data);
  void (async () => {
    try {
      if (request.kind === "openRecovery")
        application ??= bootstrap(request.content, request.preparation);
      if (!application) throw new Error("The local store has not been opened.");
      const { app, courseId } = await application;
      let response: WorkerResponse;
      switch (request.kind) {
        case "openRecovery":
          response = {
            id: request.id,
            kind: "inventory",
            value: await app.openRecovery(request.opening),
          };
          break;
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
    } catch {
      self.postMessage({
        id: request.id,
        kind: "failed",
        message:
          "The local save could not be confirmed. Keep this reading window open and retry the same action.",
      } satisfies WorkerResponse);
    }
  })();
});
