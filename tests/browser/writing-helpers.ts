import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { parseInkSnapshot } from "@readatthree/teaching";
import { parseRequest } from "../../apps/web/src/platform/protocol.ts";

export const writingBase =
  process.env.READING_BROWSER_BUILD === "1"
    ? "http://127.0.0.1:5175"
    : "http://127.0.0.1:5174";
export const writingTask = "fixture.graph.l01.t06";
export async function probe(page: Page) {
  await page.addInitScript(`
    const NativeWorker = window.Worker;
    const requests = [], snapshots = [], responses = [];
    let mode = '', held = null, heldWrite = null, droppedTail = false, loseRecoveredTeaching = false, loseReconcile = false;
    window.writingEvidence = () => structuredClone({requests, snapshots, responses});
    window.armWritingFault = (value) => { mode = value; if(value==='teaching-before-twice'){mode='teaching-before';loseRecoveredTeaching=true;} if(value==='teaching-after-reconcile'){mode='teaching-after';loseReconcile=true;} };
    window.hasHeldWritingReply = () => held !== null;
    window.hasHeldWritingWrite = () => heldWrite !== null;
    window.failHeldWritingWrite = () => { if(!heldWrite) throw Error('No retained writing write');const {worker,message}=heldWrite;heldWrite=null;worker.dispatchEvent(new MessageEvent('message',{data:{id:message.id,kind:'failed',message:'Injected finalized write failure'}})); };
    window.loseWritingReply = () => { if (!held) throw Error('No committed reply held'); const worker=held; held=null; worker.dispatchEvent(new ErrorEvent('error',{message:'Injected committed reply loss'})); };
    window.injectWritingCommand = command => new Promise(resolve=>{const worker=window.activeWritingWorker,id=crypto.randomUUID();const listener=event=>{if(event.data?.id===id){worker.removeEventListener('message',listener);resolve(event.data);}};worker.addEventListener('message',listener);worker.postMessage({id,kind:'dispatchInk',command});});
    window.Worker = class extends NativeWorker {
      constructor(url, options) {
        super(url, options);
        window.activeWritingWorker=this;
        this.sent = new Map();
        this.addEventListener('message', event => {
          const data = event.data;
          responses.push(structuredClone(data));
          if (data?.kind === 'inkSnapshot') snapshots.push(structuredClone(data.value));
          const request = this.sent.get(data?.id);
          if (loseRecoveredTeaching && request?.kind === 'recoverTeaching' && data?.kind === 'receipt') {
            loseRecoveredTeaching=false;event.stopImmediatePropagation();queueMicrotask(()=>this.dispatchEvent(new ErrorEvent('error',{message:'Injected recovered teaching reply loss'})));
          } else if (loseReconcile && request?.kind === 'reconcileRecovery' && data?.kind === 'projection') {
            loseReconcile=false;event.stopImmediatePropagation();queueMicrotask(()=>this.dispatchEvent(new ErrorEvent('error',{message:'Injected reconciliation reply loss'})));
          } else if (mode === 'teaching-read-recovery' && request?.kind === 'read' && data?.kind === 'projection') {
            mode=''; event.stopImmediatePropagation();this.dispatchEvent(new MessageEvent('message',{data:{id:data.id,kind:'projection',value:{kind:'recovery',code:'worker-lost',message:'Synthetic connection recovery.'}}}));queueMicrotask(()=>this.dispatchEvent(new ErrorEvent('error',{message:'Injected worker replacement after read recovery'})));
          } else if (mode === 'checkpoint-tail' && request?.kind === 'dispatchInk' && request.command.edit.kind === 'checkpoint' && data?.kind === 'inkReceipt') {
            event.stopImmediatePropagation(); held=this; mode='tail-reply';
          } else if (mode === 'tail-reply' && !droppedTail && request?.kind === 'recoverInk' && request.command.edit.kind === 'finalize' && data?.kind === 'inkReceipt') {
            droppedTail=true; event.stopImmediatePropagation(); queueMicrotask(()=>this.dispatchEvent(new ErrorEvent('error',{message:'Injected tail-finalize reply loss'})));
          } else if (mode === 'teaching-after' && request?.kind === 'dispatch' && data?.kind === 'receipt' && data.value.kind === 'committed') {
            mode=''; event.stopImmediatePropagation(); queueMicrotask(()=>this.dispatchEvent(new ErrorEvent('error',{message:'Injected teaching COMMIT reply loss'})));
          }
        });
      }
      postMessage(message, options) {
        requests.push(structuredClone(message));
        this.sent.set(message.id, message);
        if (mode === 'teaching-before' && message.kind === 'dispatch') {
          mode=''; queueMicrotask(()=>this.dispatchEvent(new ErrorEvent('error',{message:'Injected transport loss before teaching write'}))); return;
        }
        if(mode === 'hold-finalize' && message.kind === 'dispatchInk' && message.command.edit.kind === 'finalize'){mode='';heldWrite={worker:this,message};return;}
        if (mode === 'ink-failure' && message.kind === 'dispatchInk' && message.command.edit.kind === 'finalize') {
          mode=''; this.dispatchEvent(new MessageEvent('message',{data:{id:message.id,kind:'failed',message:'Injected writing transaction failure'}})); return;
        }
        super.postMessage(message, options);
      }
    };
  `);
}
export async function requests(page: Page) {
  const evidence: unknown = await page.evaluate(
    "window.writingEvidence().requests",
  );
  if (!Array.isArray(evidence))
    throw new Error("Writing request evidence missing");
  return evidence.map(parseRequest);
}
export async function snapshots(page: Page) {
  const evidence: unknown = await page.evaluate(
    "window.writingEvidence().snapshots",
  );
  if (!Array.isArray(evidence))
    throw new Error("Writing SQL snapshot evidence missing");
  return evidence.map(parseInkSnapshot);
}
export async function latestDocuments(page: Page) {
  const values = await snapshots(page);
  const last = new Map(
    values.map((snapshot) => [snapshot.token.targetId, snapshot]),
  );
  return [...last.values()].sort((a, b) => a.boardY - b.boardY);
}
export async function atWriting(page: Page, suffix: string) {
  await expect(page.locator("main[data-turn-id]")).toHaveAttribute(
    "data-turn-id",
    `${writingTask}.${suffix}`,
  );
  await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");
}
export async function writingAction(page: Page, name = "Continue") {
  await page.getByRole("button", { name, exact: true }).click();
  await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");
}
export async function startWriting(page: Page) {
  await page.goto(writingBase);
  await page.getByRole("button", { name: "Start Task 6", exact: true }).click();
  await atWriting(page, "m-sound");
}
export async function boardPoint(page: Page, x: number, y: number) {
  return page.locator("canvas").evaluate(
    (canvas, point) => {
      const rect = canvas.getBoundingClientRect();
      const scale = Number(canvas.dataset.scale);
      return {
        x: rect.left + Number(canvas.dataset.offsetX) + point.x * scale,
        y: rect.top + Number(canvas.dataset.offsetY) + point.y * scale,
      };
    },
    { x, y },
  );
}
export async function drawStroke(
  page: Page,
  points: readonly { x: number; y: number }[],
) {
  const first = points[0];
  if (!first) throw new Error("Stroke needs a point");
  const origin = await boardPoint(page, first.x, first.y);
  await page.mouse.move(origin.x, origin.y);
  await page.mouse.down();
  for (const point of points.slice(1)) {
    const next = await boardPoint(page, point.x, point.y);
    await page.mouse.move(next.x, next.y);
  }
  await page.mouse.up();
}
export async function drawPractice(page: Page, rowIndex = 0) {
  const document = (await latestDocuments(page))[rowIndex];
  if (!document) throw new Error("Authored writing row missing");
  const offset = document.boardY + document.guides.midline - 90;
  await drawStroke(page, [{ x: 100, y: 110 + offset }]);
  await drawStroke(page, [
    { x: 150, y: 155 + offset },
    { x: 150, y: 100 + offset },
    { x: 175, y: 100 + offset },
    { x: 190, y: 125 + offset },
    { x: 205, y: 100 + offset },
    { x: 230, y: 130 + offset },
  ]);
  await drawStroke(page, [
    { x: 175, y: 130 + offset },
    { x: 245, y: 145 + offset },
  ]);
}
