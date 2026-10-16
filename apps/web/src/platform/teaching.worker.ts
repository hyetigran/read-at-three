import sqlite3InitModule from "@sqlite.org/sqlite-wasm";
import { createTeachingApplication } from "@readatthree/storage";
import type { SqlExecutor } from "@readatthree/storage";
import { parseDevelopmentPackage } from "@readatthree/teaching";
import type { TeachingApplication } from "@readatthree/teaching";
import { hashText } from "./hash.ts";
import { parseRequest } from "./protocol.ts";
import type { WorkerResponse } from "./protocol.ts";

let application: Promise<TeachingApplication> | undefined;

function bootstrap(content: unknown): Promise<TeachingApplication> {
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
            const verified = await parseDevelopmentPackage(content, hashText);
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
            resolve(
              createTeachingApplication({
                executor,
                content: verified,
                ids: () => crypto.randomUUID(),
                hash: hashText,
              }),
            );
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
      if (request.kind === "open") application ??= bootstrap(request.content);
      if (!application) throw new Error("The local store has not been opened.");
      const app = await application;
      let response: WorkerResponse;
      switch (request.kind) {
        case "open":
          response = {
            id: request.id,
            kind: "projection",
            value: await app.open(),
          };
          break;
        case "read":
          response = {
            id: request.id,
            kind: "projection",
            value: await app.read(),
          };
          break;
        case "dispatch":
          response = {
            id: request.id,
            kind: "receipt",
            value: await app.dispatch(request.command),
          };
          break;
      }
      self.postMessage(response);
    } catch (error) {
      const message =
        request.kind === "open"
          ? "The local reading store could not open safely. Your saved data has been kept. Close other reading windows and retry."
          : "The local save could not be confirmed. Keep your saved place and retry the same action.";
      self.postMessage({
        id: request.id,
        kind: "failed",
        message,
      } satisfies WorkerResponse);
    }
  })();
});
