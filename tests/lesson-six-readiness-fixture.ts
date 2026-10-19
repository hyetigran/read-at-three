import { canonical, parseId, parseRuntimePackage } from "@readatthree/teaching";
import { hash } from "./lesson-two-fixture.ts";
import { syntheticLessonSixCourse } from "./lesson-six-fixture.ts";

export async function syntheticLessonSixReadiness() {
  const original = await syntheticLessonSixCourse();
  const oldTaskId = original.taskIds[4];
  if (!oldTaskId) throw Error("Synthetic task identity required");
  const oldId = oldTaskId;
  async function rename(content: typeof original.content) {
    const body: unknown = JSON.parse(
      JSON.stringify(content.body)
        .replaceAll(oldId, "l06.t05")
        .replaceAll(
          '"policyId":"l06.t05.firm"',
          '"policyId":"l06.t05.whole-replay"',
        ),
    );
    const value = await parseRuntimePackage(
      { formatVersion: 1, body, packageHash: await hash(canonical(body)) },
      hash,
    );
    if (value.body.coverage !== "course-development-v4")
      throw Error("Synthetic cumulative fixture required");
    return { ...value, body: value.body };
  }
  const previous = await rename(original.previous);
  const content = await rename(original.content);
  const candidate = {
    formatVersion: 1,
    packageHash: content.packageHash,
    body: content.body,
  };
  return {
    previous,
    content,
    candidate,
    taskIds: original.taskIds.map((id) =>
      id === oldId ? parseId({ kind: "task", value: "l06.t05" }) : id,
    ),
  };
}
