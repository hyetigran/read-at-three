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
