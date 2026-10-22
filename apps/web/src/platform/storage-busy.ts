export class StorageBusyError extends Error {
  constructor() {
    super(
      "Close the other reading window, then retry opening here. Your saved reading and writing are kept.",
    );
    this.name = "StorageBusyError";
  }
}
