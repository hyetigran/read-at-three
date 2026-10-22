import type { Page } from "@playwright/test";

export async function savedFiles(page: Page) {
  return page.evaluate(async () => {
    const root = await navigator.storage.getDirectory();
    const values: { path: string; size: number; sha256: string }[] = [];
    async function visit(directory: FileSystemDirectoryHandle, prefix: string) {
      for await (const [name, handle] of directory.entries()) {
        if (handle.kind === "directory")
          await visit(handle, `${prefix}${name}/`);
        else {
          const file = await handle.getFile();
          const bytes = await file.arrayBuffer();
          values.push({
            path: `${prefix}${name}`,
            size: file.size,
            sha256: [
              ...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
            ]
              .map((value) => value.toString(16).padStart(2, "0"))
              .join(""),
          });
        }
      }
    }
    await visit(root, "");
    return values.sort((a, b) => a.path.localeCompare(b.path));
  });
}

export async function damageStoreHeader(page: Page) {
  return page.evaluate(async () =>
    navigator.locks.request("read-at-three.sqlite.v1", async () => {
      const root = await navigator.storage.getDirectory();
      const matches: {
        handle: FileSystemFileHandle;
        offset: number;
        path: string;
      }[] = [];
      const magic = new TextEncoder().encode("SQLite format 3\0");
      async function visit(
        directory: FileSystemDirectoryHandle,
        prefix: string,
      ) {
        for await (const [name, handle] of directory.entries()) {
          if (handle.kind === "directory")
            await visit(handle, `${prefix}${name}/`);
          else {
            const bytes = new Uint8Array(
              await (await handle.getFile()).arrayBuffer(),
            );
            const offset = bytes.findIndex((_, index) =>
              magic.every((byte, j) => bytes[index + j] === byte),
            );
            if (offset >= 0)
              matches.push({ handle, offset, path: `${prefix}${name}` });
          }
        }
      }
      await visit(root, "");
      if (matches.length !== 1)
        throw new Error("Expected one real SQLite database header");
      const target = matches[0]!;
      const writer = await target.handle.createWritable({
        keepExistingData: true,
      });
      await writer.write({
        type: "write",
        position: target.offset,
        data: new Uint8Array([0]),
      });
      await writer.close();
      return { offset: target.offset };
    }),
  );
}
