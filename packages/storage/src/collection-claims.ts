import type {
  Counter,
  PackageCollectionClaim,
  PackageHash,
} from "../../teaching/src/index.ts";
import type {
  PublicationHash,
  PublicationMode,
} from "../../teaching/src/index.ts";

const issued = new WeakMap<
  object,
  Readonly<{
    current(): boolean;
    validate(): Promise<void>;
    mode: PublicationMode;
    packageHash: PackageHash;
  }>
>();
export function issueCollectionClaim({
  packageHash,
  tombstoneRevision,
  current,
  validate,
  mode,
}: Readonly<{
  packageHash: PackageHash;
  tombstoneRevision: Counter;
  current(): boolean;
  validate(): Promise<void>;
  mode: PublicationMode;
}>) {
  const claim: PackageCollectionClaim = Object.freeze({
    packageHash,
    tombstoneRevision,
    isCurrent: current,
  });
  issued.set(claim, { current, validate, mode, packageHash });
  return {
    claim,
    revoke() {
      issued.delete(claim);
    },
  };
}
export async function requireCollectionClaim({
  claim: value,
  mode,
  hash,
}: Readonly<{
  claim: unknown;
  mode: PublicationMode;
  hash: PublicationHash;
}>): Promise<void> {
  const proof =
    value !== null && typeof value === "object" ? issued.get(value) : undefined;
  if (
    !proof ||
    !proof.current() ||
    proof.mode !== mode ||
    String(proof.packageHash) !== String(hash)
  )
    throw new Error("Collection requires a current owned claim");
  await proof.validate();
  if (
    !proof.current() ||
    (typeof value === "object" && value !== null && !issued.has(value))
  )
    throw new Error("Collection claim was retired");
}
