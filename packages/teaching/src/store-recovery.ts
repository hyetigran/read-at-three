export class UnsupportedStoreFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsupportedStoreFormatError";
  }
}
