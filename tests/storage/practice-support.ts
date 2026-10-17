import {
  executeInk,
  executeTeaching,
  prepareSelectedInk,
  prepareSelectedTeaching,
  selectedInk,
  selectedProjection,
} from "./selected-support.ts";

import {
  encodeInkPoints,
  layerForPhase,
  parseId,
  prepareCommand,
  prepareInkCommand,
  prepareWritingCommand,
  prepareWritingControl,
  visibleInkStrokes,
} from "@readatthree/teaching";
import type {
  DocumentToken,
  InkEdit,
  PracticeControl,
  TeachingIntent,
  SelectedApplication,
  RuntimePackage,
} from "@readatthree/teaching";
import { writingFixture } from "../teaching/writing-fixture.ts";
import { hash, storageFixture } from "./support.ts";
export async function practiceFixture(
  t: Parameters<typeof storageFixture>[0],
  supplied?: RuntimePackage,
) {
  const fixture = await storageFixture(t, supplied ?? (await writingFixture()));
  async function action(
    app: SelectedApplication,
    kind: TeachingIntent["kind"],
  ) {
    const projection = await selectedProjection(app);
    if (projection.kind === "recovery") throw new Error(projection.message);
    const action = projection.actions.find(
      (value) => value.intent.kind === kind,
    );
    if (!action) throw new Error(`Missing action ${kind}`);
    const command =
      projection.kind === "writing" || projection.kind === "writingResult"
        ? await prepareSelectedTeaching(app, async () =>
            prepareWritingCommand({
              projection,
              action,
              barrier: { kind: "writing", documents: projection.documents },
              ids: fixture.ids,
              hash,
            }),
          )
        : await prepareSelectedTeaching(app, async () =>
            prepareCommand({
              projection,
              request: { kind: "action", action },
              ids: fixture.ids,
              hash,
            }),
          );
    return executeTeaching(app, command);
  }
  async function current(app: SelectedApplication) {
    const projection = await selectedProjection(app);
    if (projection.kind !== "writing") throw new Error("Writing required");
    const token = projection.documents.find(
      (document) => document.targetId === "first",
    );
    if (!token) throw new Error("First document missing");
    return { projection, token, snapshot: await selectedInk(app, { token }) };
  }
  async function edit(
    app: SelectedApplication,
    token: DocumentToken,
    edit: InkEdit,
  ) {
    const result = await executeInk(
      app,
      await prepareSelectedInk(app, async () =>
        prepareInkCommand({ token, edit, ids: fixture.ids, hash }),
      ),
    );
    if (result.kind !== "inkCommitted") throw new Error(result.code);
    return result.token;
  }
  async function draw(app: SelectedApplication, x = 10) {
    const { token } = await current(app);
    const layer = layerForPhase(token.phase),
      strokeId = parseId({ kind: "stroke", value: fixture.ids() });
    const next = await edit(app, token, {
      kind: "begin",
      strokeId,
      layer,
      brush: {
        kind: "round",
        width: 5,
        colorRole: layer === "model" ? "model" : "child",
        cap: "round",
        join: "round",
      },
      chunks: [
        {
          chunkIndex: 0,
          firstPointIndex: 0,
          pointCount: 1,
          codecVersion: 1,
          payload: [
            ...encodeInkPoints({
              bounds: { width: 1000, height: 180 },
              points: [{ x, y: 100, elapsedMs: 0 }],
            }),
          ],
        },
      ],
    });
    await edit(app, next, {
      kind: "finalize",
      strokeId,
      layer,
      chunks: [],
      status: "finished",
    });
    return strokeId;
  }
  async function prepareControl(
    app: SelectedApplication,
    control: PracticeControl,
  ) {
    const { projection, token } = await current(app);
    if (token.phase === "parentDemonstration")
      throw new Error("Child layer required");
    return prepareSelectedTeaching(app, async () =>
      prepareWritingControl({
        projection,
        control,
        documentId: token.documentId,
        layer:
          layerForPhase(token.phase) === "tracing" ? "tracing" : "independent",
        barrier: { kind: "writing", documents: projection.documents },
        ids: fixture.ids,
        hash,
      }),
    );
  }
  async function visible(app: SelectedApplication) {
    const { snapshot } = await current(app),
      history = snapshot.histories.find((value) => value.layer === "tracing");
    if (!history) throw new Error("History missing");
    return visibleInkStrokes({ history, strokes: snapshot.strokes });
  }
  async function start(app: SelectedApplication) {
    await selectedProjection(app);
    await action(app, "start");
    await action(app, "continue");
    const model = await draw(app, 25);
    await action(app, "continue");
    return model;
  }
  return {
    ...fixture,
    action,
    current,
    edit,
    draw,
    prepareControl,
    visible,
    start,
  };
}
