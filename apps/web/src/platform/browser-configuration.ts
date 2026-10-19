import type {
  CourseId,
  PublicationHash,
  PublicationTrustKey,
  ReleaseId,
  ShellPolicy,
} from "@readatthree/teaching";

export type PublicationPolicy = Readonly<{
  mode: "fixture" | "publication";
  keys: readonly PublicationTrustKey[];
}>;
export type BrowserConfiguration =
  | Readonly<{ kind: "development" }>
  | Readonly<{
      kind: "installed";
      courseId: CourseId;
      shell: ShellPolicy;
      publication: PublicationPolicy;
      initialTarget: Readonly<{
        publicationHash: PublicationHash;
        releaseId: ReleaseId;
      }> | null;
    }>;

declare const __READING_BROWSER_CONFIGURATION__: BrowserConfiguration;
export const browserConfiguration = __READING_BROWSER_CONFIGURATION__;
