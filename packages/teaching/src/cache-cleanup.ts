import { deepFreeze, parseCounter, parseHash, parseId } from "./identity.ts";
import { publicationCatalogLimits } from "./package-catalog.ts";
import {
  validateCacheCleanupView,
  validateCacheCleanupCommand,
  validateCacheCleanupResult,
} from "./generated-installation-validators.js";
import type { Counter, InstallationId, PackageHash } from "./types.ts";

export type CacheCleanupTarget = Readonly<{
  packageHash: PackageHash;
  collectionRevision: Counter;
}>;
export type CacheCleanupView = Readonly<{
  installationId: InstallationId;
  targets: readonly CacheCleanupTarget[];
}>;
export type CacheCleanupCommand = CacheCleanupView & Readonly<{ version: 1 }>;
export type CacheCleanupResult = Readonly<{
  version: 1;
  installationId: InstallationId;
  results: readonly Readonly<{
    target: CacheCleanupTarget;
    outcome: "collected" | "retained" | "changed";
  }>[];
}>;
export interface CacheCleanupApplication {
  readCacheCleanup(): Promise<CacheCleanupView>;
  cleanupCache(command: CacheCleanupCommand): Promise<CacheCleanupResult>;
}
function targets(
  values: readonly { packageHash: string; collectionRevision: string }[],
) {
  if (
    values.length > publicationCatalogLimits.namespaces ||
    new Set(values.map((value) => value.packageHash)).size !== values.length
  )
    throw new Error("Cache cleanup targets must be bounded and distinct");
  return values.map((value) => ({
    packageHash: parseHash({ kind: "package", value: value.packageHash }),
    collectionRevision: parseCounter(value.collectionRevision),
  }));
}
export function parseCacheCleanupView(input: unknown): CacheCleanupView {
  if (!validateCacheCleanupView(input))
    throw new Error("Unsupported cache cleanup view");
  return deepFreeze({
    installationId: parseId({
      kind: "installation",
      value: input.installationId,
    }),
    targets: targets(input.targets),
  });
}
export function parseCacheCleanupCommand(input: unknown): CacheCleanupCommand {
  if (
    !validateCacheCleanupCommand(input) ||
    input.version !== 1 ||
    input.targets.length === 0
  )
    throw new Error("Unsupported cache cleanup command");
  return deepFreeze({
    version: 1,
    installationId: parseId({
      kind: "installation",
      value: input.installationId,
    }),
    targets: targets(input.targets),
  });
}
export function parseCacheCleanupResult(input: unknown): CacheCleanupResult {
  if (
    !validateCacheCleanupResult(input) ||
    input.version !== 1 ||
    input.results.length === 0
  )
    throw new Error("Unsupported cache cleanup result");
  const checked = targets(input.results.map((value) => value.target));
  return deepFreeze({
    version: 1,
    installationId: parseId({
      kind: "installation",
      value: input.installationId,
    }),
    results: input.results.map((value, index) => ({
      outcome: value.outcome,
      target: checked[index]!,
    })),
  });
}
