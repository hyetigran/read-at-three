export class DamagedStoreError extends Error {
  constructor() {
    super(
      "Saved storage could not be read safely. Your original files have been kept. Retry opening; reading and writing stay paused until storage can open safely.",
    );
    this.name = "DamagedStoreError";
  }
}

export class PendingStoreResetError extends Error {
  constructor() {
    super(
      "Start fresh has not finished. Saved work may already have been erased. Ask a parent to resume the same Start fresh action before opening reading.",
    );
    this.name = "PendingStoreResetError";
  }
}
