export class StorageCapacityError extends Error {
  constructor() {
    super(
      "Storage is full. Keep this reading window open, free some device storage, then retry the same action. New work may still be unsaved.",
    );
    this.name = "StorageCapacityError";
  }
}

export function isStorageCapacityError(error: unknown): boolean {
  const visited = new Set<Error>();
  while (error instanceof Error && !visited.has(error)) {
    if (error instanceof StorageCapacityError) return true;
    visited.add(error);
    error = error.cause;
  }
  return false;
}
