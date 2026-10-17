export const INK_LIMITS = Object.freeze({
  pointsPerChunk: 2048,
  pointsPerStroke: 100_000,
  pointsPerDocument: 1_000_000,
  bytesPerDocument: 32 * 1024 * 1024,
  liveBytes: 4 * 1024 * 1024,
  queuedBytes: 2 * 1024 * 1024,
  retainedOperations: 128,
});
