import { useEffect, useRef } from "react";
import type { InkPoint, InkSample, InkSnapshot } from "@readatthree/teaching";
import type {
  WritingController,
  InkContact,
} from "@/platform/writing-controller";

type Transform = Readonly<{ scale: number; x: number; y: number }>;
type Contact = {
  pointerId: number;
  handle: InkContact;
  snapshot: InkSnapshot;
  transform: Transform;
  lastEventAt: number;
  last: InkSample;
};

export function WritingBoard({
  controller,
  disabled,
}: {
  controller: WritingController;
  disabled: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const blocked = useRef(disabled);
  blocked.current = disabled;
  useEffect(() => {
    if (disabled) void controller.interrupt();
  }, [controller, disabled]);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    let contact: Contact | null = null;
    let frame = 0;
    let transform: Transform = { scale: 1, x: 0, y: 0 };
    function release() {
      const current = contact;
      contact = null;
      if (current && canvas?.hasPointerCapture(current.pointerId))
        canvas.releasePointerCapture(current.pointerId);
    }
    function finish(status: "finished" | "interrupted") {
      if (contact) controller.finish(contact.handle, status);
      release();
    }
    function drawStroke(points: readonly InkPoint[], width: number) {
      if (!context || !points.length) return;
      const first = points[0];
      if (!first) return;
      context.lineWidth = width;
      context.lineCap = "round";
      context.lineJoin = "round";
      context.beginPath();
      context.moveTo(first.x, first.y);
      if (points.every((point) => point.x === first.x && point.y === first.y)) {
        context.arc(first.x, first.y, width / 2, 0, Math.PI * 2);
        context.fill();
      } else {
        for (const point of points.slice(1)) context.lineTo(point.x, point.y);
        context.stroke();
      }
    }
    function paint() {
      frame = 0;
      if (!canvas || !context) return;
      const rows = controller.getBoard();
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = Math.max(1, Math.round(rect.width * dpr));
      const height = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, rect.width, rect.height);
      const logicalWidth = Math.max(
        1,
        ...rows.map(({ snapshot }) => snapshot.bounds.width),
      );
      const logicalHeight = Math.max(
        1,
        ...rows.map(({ snapshot }) => snapshot.boardY + snapshot.bounds.height),
      );
      const scale = Math.min(
        (rect.width - 32) / logicalWidth,
        (rect.height - 24) / logicalHeight,
      );
      transform = {
        scale,
        x: (rect.width - logicalWidth * scale) / 2,
        y: (rect.height - logicalHeight * scale) / 2,
      };
      canvas.dataset.scale = String(scale);
      canvas.dataset.offsetX = String(transform.x);
      canvas.dataset.offsetY = String(transform.y);
      canvas.dataset.logicalWidth = String(logicalWidth);
      canvas.dataset.logicalHeight = String(logicalHeight);
      canvas.dataset.writable = String(
        !blocked.current && controller.canWrite(),
      );
      context.translate(transform.x, transform.y);
      context.scale(scale, scale);
      for (const { snapshot, strokes } of rows) {
        context.save();
        context.translate(0, snapshot.boardY);
        context.beginPath();
        context.rect(0, 0, snapshot.bounds.width, snapshot.bounds.height);
        context.clip();
        context.strokeStyle = "#c6bdce";
        context.lineWidth = 1.4 / scale;
        for (const y of [
          snapshot.guides.top,
          snapshot.guides.midline,
          snapshot.guides.baseline,
        ]) {
          context.setLineDash(
            y === snapshot.guides.midline ? [4 / scale, 4 / scale] : [],
          );
          context.beginPath();
          context.moveTo(0, y);
          context.lineTo(snapshot.bounds.width, y);
          context.stroke();
        }
        context.setLineDash([]);
        context.strokeStyle = "#211b46";
        context.fillStyle = "#211b46";
        for (const stroke of strokes) {
          context.globalAlpha =
            stroke.layer === "model" &&
            snapshot.token.phase !== "parentDemonstration"
              ? 0.25
              : 1;
          drawStroke(stroke.points, stroke.width);
        }
        context.restore();
      }
    }
    function schedule() {
      if (!frame) frame = requestAnimationFrame(paint);
    }
    function local(
      event: PointerEvent,
      snapshot: InkSnapshot,
      currentTransform: Transform,
    ): InkSample {
      const rect = canvas?.getBoundingClientRect();
      const elapsedMs = contact
        ? Math.max(
            contact.last.elapsedMs,
            Math.round(event.timeStamp - contact.handle.startedAt),
          )
        : 0;
      return {
        x:
          (event.clientX - (rect?.left ?? 0) - currentTransform.x) /
          currentTransform.scale,
        y:
          (event.clientY - (rect?.top ?? 0) - currentTransform.y) /
            currentTransform.scale -
          snapshot.boardY,
        elapsedMs,
        pressure:
          event.pointerType === "pen" && event.pressure > 0
            ? event.pressure
            : 1,
      };
    }
    function inside(point: InkSample, snapshot: InkSnapshot) {
      return (
        point.x >= 0 &&
        point.y >= 0 &&
        point.x <= snapshot.bounds.width &&
        point.y <= snapshot.bounds.height
      );
    }
    function down(event: PointerEvent) {
      event.preventDefault();
      if (
        blocked.current ||
        contact ||
        !event.isPrimary ||
        event.button !== 0 ||
        !controller.canWrite()
      )
        return;
      for (const { snapshot } of controller.getBoard()) {
        const point = local(event, snapshot, transform);
        if (!snapshot.writable || !inside(point, snapshot)) continue;
        const handle = controller.begin(
          snapshot.token.documentId,
          point,
          event.timeStamp,
        );
        if (!handle) return;
        contact = {
          pointerId: event.pointerId,
          handle,
          snapshot,
          transform,
          lastEventAt: event.timeStamp,
          last: point,
        };
        canvas?.setPointerCapture(event.pointerId);
        return;
      }
    }
    function belongsToContact(event: PointerEvent, current: Contact): boolean {
      return (
        event.pointerId === current.pointerId &&
        Number.isFinite(event.timeStamp) &&
        event.timeStamp >= current.handle.startedAt &&
        event.timeStamp >= current.lastEventAt
      );
    }
    function move(event: PointerEvent) {
      if (!contact || !belongsToContact(event, contact)) return;
      event.preventDefault();
      const events = event.getCoalescedEvents?.();
      for (const sampleEvent of events?.length ? events : [event]) {
        const current = contact;
        if (!current) break;
        if (!belongsToContact(sampleEvent, current)) continue;
        const point = local(sampleEvent, current.snapshot, current.transform);
        if (!inside(point, current.snapshot)) {
          const dx = point.x - current.last.x;
          const dy = point.y - current.last.y;
          const tx =
            dx > 0
              ? (current.snapshot.bounds.width - current.last.x) / dx
              : dx < 0
                ? -current.last.x / dx
                : 1;
          const ty =
            dy > 0
              ? (current.snapshot.bounds.height - current.last.y) / dy
              : dy < 0
                ? -current.last.y / dy
                : 1;
          const fraction = Math.max(0, Math.min(1, tx, ty));
          controller.append(current.handle, [
            {
              ...point,
              x: Math.max(
                0,
                Math.min(
                  current.snapshot.bounds.width,
                  current.last.x + dx * fraction,
                ),
              ),
              y: Math.max(
                0,
                Math.min(
                  current.snapshot.bounds.height,
                  current.last.y + dy * fraction,
                ),
              ),
            },
          ]);
          finish("interrupted");
          break;
        }
        controller.append(current.handle, [point]);
        current.last = point;
        current.lastEventAt = sampleEvent.timeStamp;
      }
    }
    function up(event: PointerEvent) {
      if (!contact || !belongsToContact(event, contact)) return;
      move(event);
      finish("finished");
    }
    function cancel(event: PointerEvent) {
      if (contact && belongsToContact(event, contact)) finish("interrupted");
    }
    function lostCapture(event: PointerEvent) {
      if (!canvas?.hasPointerCapture(event.pointerId)) cancel(event);
    }
    function resized() {
      void controller.interrupt();
      schedule();
    }
    const unsubscribePaint = controller.subscribePaint(schedule);
    const unsubscribeFence = controller.subscribeFence(release);
    const observer = new ResizeObserver(resized);
    observer.observe(canvas);
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", cancel);
    canvas.addEventListener("lostpointercapture", lostCapture);
    window.addEventListener("resize", resized);
    paint();
    return () => {
      void controller.interrupt();
      release();
      cancelAnimationFrame(frame);
      observer.disconnect();
      unsubscribePaint();
      unsubscribeFence();
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", cancel);
      canvas.removeEventListener("lostpointercapture", lostCapture);
      window.removeEventListener("resize", resized);
    };
  }, [controller]);
  return (
    <canvas
      ref={ref}
      className="teaching-writing-board"
      aria-label="Two-line writing board. Parent demonstration and child practice."
      role="img"
    />
  );
}
