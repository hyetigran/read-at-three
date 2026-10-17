import { TeachingRecoveryError } from "@readatthree/react-integration";
import type { ReadEnvelope } from "@readatthree/react-integration";
import type {
  CourseId,
  SelectedApplication,
  SelectedReadTarget,
} from "@readatthree/teaching";

export async function readEnvelope(
  app: SelectedApplication,
  input: SelectedReadTarget,
  courseId: CourseId,
): Promise<ReadEnvelope> {
  const { directory, application } = await app.readApplication(input);
  if (application.kind === "recovery")
    return { directory, courseId, projection: application };
  return {
    directory,
    courseId: application.courseId,
    projection: application.projection,
    application,
  };
}
