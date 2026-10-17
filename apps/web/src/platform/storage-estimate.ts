export type OriginStorageEstimate =
  | Readonly<{
      kind: "measured";
      scope: "origin";
      usage: number;
      quota: number;
    }>
  | Readonly<{
      kind: "incomplete";
      scope: "origin";
      usage?: number;
      quota?: number;
    }>
  | Readonly<{ kind: "unavailable"; reason: "unsupported" }>
  | Readonly<{ kind: "error"; reason: "estimate-failed" }>;
export async function readOriginStorageEstimate(
  storage: Pick<StorageManager, "estimate"> | undefined = globalThis.navigator
    ?.storage,
): Promise<OriginStorageEstimate> {
  if (typeof storage?.estimate !== "function")
    return { kind: "unavailable", reason: "unsupported" };
  try {
    const estimate = await storage.estimate();
    const usage = validBytes(estimate.usage),
      quota = validBytes(estimate.quota);
    if (usage !== undefined && quota !== undefined)
      return { kind: "measured", scope: "origin", usage, quota };
    return {
      kind: "incomplete",
      scope: "origin",
      ...(usage === undefined ? {} : { usage }),
      ...(quota === undefined ? {} : { quota }),
    };
  } catch {
    return { kind: "error", reason: "estimate-failed" };
  }
}
function validBytes(value: unknown): number | undefined {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0
    ? value
    : undefined;
}
