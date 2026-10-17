import { canonical, parseCounter } from "./identity.ts";
import { utf8ByteLength } from "./unicode-length.ts";
import { INK_LIMITS } from "./ink-limits.ts";
import { inkSnapshotUsage } from "./ink.ts";
import type {
  BrushSpec,
  InkCommand,
  InkSnapshot,
  RetainedInkUsage,
} from "./ink.ts";
import type { DocumentToken, StrokeId } from "./types.ts";
const maximumCounter = parseCounter("9223372036854775807");
const maximumChunk = {
  chunkIndex: INK_LIMITS.pointsPerStroke,
  firstPointIndex: INK_LIMITS.pointsPerStroke,
  pointCount: INK_LIMITS.pointsPerChunk,
  codecVersion: 1,
};
export const inkChunkMetadataReservation =
  utf8ByteLength(canonical(maximumChunk)) + 1;
export function inkCommandByteLength(command: InkCommand): number {
  return (
    command.edit.chunks.reduce((sum, chunk) => sum + chunk.payload.length, 0) +
    utf8ByteLength(
      canonical({
        ...command,
        edit: {
          ...command.edit,
          chunks: command.edit.chunks.map(({ payload, ...chunk }) => chunk),
        },
      }),
    )
  );
}
export function inkAdmissionAnchor(snapshot: InkSnapshot): RetainedInkUsage {
  const maximum = {
    ...snapshot,
    token: {
      ...snapshot.token,
      revision: maximumCounter,
      inputEpoch: maximumCounter,
    },
    nextStrokeOrder: maximumCounter,
    histories: snapshot.histories.map((history) => ({
      ...history,
      baseSeq: maximumCounter,
      cursorSeq: maximumCounter,
      tipSeq: maximumCounter,
      nextOpSeq: maximumCounter,
    })),
  };
  return inkSnapshotUsage(maximum);
}
export function inkStrokeMetadataReservation({
  strokeId,
  layer,
  brush,
}: {
  strokeId: StrokeId;
  layer: import("./types.ts").InkLayer;
  brush: BrushSpec;
}): number {
  return (
    utf8ByteLength(
      canonical({
        strokeId,
        layer,
        strokeOrder: maximumCounter,
        status: "interrupted",
        brush,
        pointCount: INK_LIMITS.pointsPerStroke,
        chunks: [],
      }),
    ) +
    1 +
    utf8ByteLength(
      canonical({ kind: "AddStroke", seq: maximumCounter, strokeId }),
    ) +
    1
  );
}
export function inkTailWriteReservation({
  token,
  strokeId,
  layer,
  brush,
  pointCount,
}: {
  token: DocumentToken;
  strokeId: StrokeId;
  layer: import("./types.ts").InkLayer;
  brush: BrushSpec;
  pointCount: number;
}): number {
  const command = {
    kind: "ink",
    commandId: "\u0000".repeat(200),
    payloadHash: "f".repeat(64),
    token: { ...token, revision: maximumCounter, inputEpoch: maximumCounter },
    edit: { kind: "begin", strokeId, layer, brush, chunks: [] },
  };
  return (
    utf8ByteLength(canonical(command)) +
    pointCount * 16 +
    Math.ceil(pointCount / INK_LIMITS.pointsPerChunk) *
      inkChunkMetadataReservation
  );
}
