import type { Query, QueryClient, QueryKey } from "@tanstack/react-query";
import type {
  CourseId,
  DocumentToken,
  InstallationId,
  Owner,
  PackageHash,
  SelectedOwnerWitness,
} from "@readatthree/teaching";
import type { ReadEnvelope } from "./teaching.ts";

export type TeachingQueryDomain = Readonly<{ installationId: InstallationId }> &
  (
    | Readonly<{ kind: "directory"; owner?: Owner }>
    | Readonly<{ kind: "personal"; owner: Owner }>
  );
const lifetimes = new WeakMap<QueryClient, Map<InstallationId, number>>();
function generations(client: QueryClient) {
  let value = lifetimes.get(client);
  if (!value) {
    value = new Map();
    lifetimes.set(client, value);
  }
  return value;
}
export function captureQueryPublication(
  client: QueryClient,
  installationId: InstallationId,
) {
  const generation = generations(client).get(installationId) ?? 0;
  return () => {
    if ((generations(client).get(installationId) ?? 0) !== generation)
      throw new Error("The local profile publication lifetime was retired.");
  };
}
export function teachingQuery(domain: TeachingQueryDomain, queryKey: QueryKey) {
  return {
    queryKey,
    meta: {
      readingDomain: domain.kind,
      installationId: domain.installationId,
      ...(domain.owner
        ? {
            profileId: domain.owner.profileId,
            generation: domain.owner.generation,
          }
        : {}),
    },
  };
}
export function committedTeachingQuery(read: ReadEnvelope) {
  const view = read.projection;
  if (view.kind === "recovery")
    throw new Error("Recovery has no committed cache identity.");
  return teachingQuery(
    {
      installationId: read.directory.selection.installationId,
      kind: "directory",
      owner: view.owner,
    },
    [
      "teaching",
      read.directory.selection.installationId,
      read.directory.selection.revision,
      read.directory.administration.revision,
      view.owner.profileId,
      view.owner.generation,
      read.courseId,
      read.application?.witness.activePackageHash ?? view.packageHash,
      view.packageHash,
      view.kind === "entry" ? "entry" : view.sessionId,
      ...(view.kind === "writing" || view.kind === "writingResult"
        ? view.documents.map((token) => token.documentId)
        : []),
    ],
  );
}
export function historicalWorkQuery(
  input: Readonly<{
    selection: SelectedOwnerWitness;
    connection: number;
    courseId: CourseId;
    packageHash: PackageHash | undefined;
    runId: string | undefined;
  }>,
) {
  return teachingQuery(
    {
      installationId: input.selection.installationId,
      kind: "personal",
      owner: input.selection.owner,
    },
    [
      "historical-work",
      input.selection.installationId,
      input.selection.revision,
      input.connection,
      input.selection.owner.profileId,
      input.selection.owner.generation,
      input.courseId,
      input.packageHash,
      input.runId,
    ],
  );
}
export function queryContainsDocument(
  query: Query,
  token: Pick<DocumentToken, "profileId" | "generation" | "documentId">,
) {
  return (
    query.meta?.readingDomain === "directory" &&
    query.meta.profileId === token.profileId &&
    query.meta.generation === token.generation &&
    query.queryKey.includes(token.documentId)
  );
}
export function retireProfileQueries(
  client: QueryClient,
  input: Readonly<{
    installationId: InstallationId;
    owner: Owner;
    kind: "reset" | "delete";
  }>,
) {
  const values = generations(client);
  values.set(input.installationId, (values.get(input.installationId) ?? 0) + 1);
  const predicate = (query: Query) =>
    query.meta?.installationId === input.installationId &&
    (query.meta.readingDomain === "directory" ||
      (query.meta.readingDomain === "personal" &&
        query.meta.profileId === input.owner.profileId &&
        (input.kind === "delete" ||
          query.meta.generation === input.owner.generation)));
  void client.cancelQueries({ predicate });
  client.removeQueries({ predicate });
  for (const mutation of client.getMutationCache().getAll()) {
    const meta = mutation.options.meta;
    if (
      meta?.installationId === input.installationId &&
      meta.profileId === input.owner.profileId &&
      (input.kind === "delete" || meta.generation === input.owner.generation)
    )
      client.getMutationCache().remove(mutation);
  }
}
