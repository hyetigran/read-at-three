import sqlite3InitModule from "@sqlite.org/sqlite-wasm";
export function initializeReadingSqlite() {
  Object.assign(globalThis, {
    sqlite3ApiConfig: { disable: { vfs: { opfs: true, "opfs-wl": true } } },
  });
  return sqlite3InitModule();
}
