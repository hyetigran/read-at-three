import {
  installInitialSetupObservation,
  completeInitialSetup,
  scenarioRequests,
  scenarioResponses,
} from "./parent-setup.ts";
import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { parseCurrentResult, parseInkSnapshot } from "@readatthree/teaching";
import {
  parseRequest,
  parseResponse,
} from "../../apps/web/src/platform/protocol.ts";

export const writingBase =
  process.env.READING_BROWSER_BUILD === "1"
    ? "http://127.0.0.1:5175"
    : "http://127.0.0.1:5174";
export const writingTask = "fixture.graph.l01.t06";
export async function probe(page: Page) {
  await page.addInitScript(`
    const NativeWorker = window.Worker;
    const requests = [], snapshots = [], responses = [];
    let mode = '', held = null, heldSummary = null, heldWrite = null, heldTeaching = null, droppedTail = false, loseRecoveredTeaching = false, loseReconcile = false;
    window.writingEvidence = () => structuredClone({requests, snapshots, responses});
    window.armWritingFault = (value) => { mode = value; if(value==='teaching-before-twice'){mode='teaching-before';loseRecoveredTeaching=true;} if(value==='teaching-after-reconcile'){mode='teaching-after';loseReconcile=true;} };
    window.hasHeldWritingReply = () => held !== null;
    window.hasHeldSummary = () => heldSummary !== null;
    window.releaseHeldSummary = () => { if (!heldSummary) throw Error('No held summary'); const {worker,data}=heldSummary; heldSummary=null; worker.dispatchEvent(new MessageEvent('message',{data})); };
    window.hasHeldWritingWrite = () => heldWrite !== null;
    window.releaseHeldWritingWrite = () => { if(!heldWrite) throw Error('No retained writing write');const send=heldWrite.release;heldWrite=null;send(); };
    window.hasHeldTeachingWrite = () => heldTeaching !== null;
    window.releaseHeldTeachingWrite = () => { if(!heldTeaching) throw Error('No retained teaching write');const send=heldTeaching;heldTeaching=null;send(); };
    window.failHeldWritingWrite = () => { if(!heldWrite) throw Error('No retained writing write');const {worker,message}=heldWrite;heldWrite=null;worker.dispatchEvent(new MessageEvent('message',{data:{id:message.id,kind:'failed',message:'Injected finalized write failure'}})); };
    window.loseWritingReply = () => { if (!held) throw Error('No committed reply held'); const worker=held; held=null; worker.dispatchEvent(new ErrorEvent('error',{message:'Injected committed reply loss'})); };
    window.injectWritingOperation = operation => new Promise(resolve=>{const worker=window.activeWritingWorker,id=crypto.randomUUID();const listener=event=>{if(event.data?.id===id){worker.removeEventListener('message',listener);resolve(event.data);}};worker.addEventListener('message',listener);worker.postMessage({id,kind:'execute',operation});});
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
          if (mode === 'hold-summary' && request?.kind === 'readPracticeControls' && data?.kind === 'practiceControls') {
            mode=''; event.stopImmediatePropagation(); heldSummary={worker:this,data};
          } else if (mode === 'ahead-summary' && request?.kind === 'readPracticeControls' && data?.kind === 'practiceControls' && data.value.value.kind === 'editable') {
            mode=''; event.stopImmediatePropagation(); this.dispatchEvent(new MessageEvent('message',{data:{...data,value:{...data.value,value:{...data.value.value,token:{...data.value.value.token,revision:String(BigInt(data.value.value.token.revision)+1n)}}}}}));
          } else if (mode === 'teaching-receipt-command-id' && ((request?.kind === 'execute' && request.operation.kind === 'teaching') || request?.kind === 'recoverTeaching') && ((data?.kind === 'execution' && data.value.kind === 'teaching') || data?.kind === 'teachingRecovery') && data.value.result.kind === 'committed') {
            mode='';event.stopImmediatePropagation();this.dispatchEvent(new MessageEvent('message',{data:{...data,value:{...data.value,result:{...data.value.result,commandId:'wrong-teaching-command'}}}}));
          } else if (mode === 'teaching-read-revision' && request?.kind === 'read' && data?.kind === 'application' && data.value.application.kind === 'ready' && data.value.application.projection.kind === 'writing') {
            mode='';event.stopImmediatePropagation();this.dispatchEvent(new MessageEvent('message',{data:{...data,value:{...data.value,application:{...data.value.application,witness:{...data.value.application.witness,selectedSessionRevision:'99'},projection:{...data.value.application.projection,revision:'99'}}}}}));
          } else if (mode === 'teaching-restore-revision' && request?.kind === 'readInk' && data?.kind === 'inkSnapshot') {
            mode='';event.stopImmediatePropagation();this.dispatchEvent(new MessageEvent('message',{data:{...data,value:{...data.value,value:{...data.value.value,token:{...data.value.value.token,revision:'99'}}}}}));
          } else if (loseRecoveredTeaching && request?.kind === 'recoverTeaching' && data?.kind === 'teachingRecovery') {
            loseRecoveredTeaching=false;event.stopImmediatePropagation();queueMicrotask(()=>this.dispatchEvent(new ErrorEvent('error',{message:'Injected recovered teaching reply loss'})));
          } else if (loseReconcile && request?.kind === 'reconcileRecovery' && data?.kind === 'reconciled') {
            loseReconcile=false;event.stopImmediatePropagation();queueMicrotask(()=>this.dispatchEvent(new ErrorEvent('error',{message:'Injected reconciliation reply loss'})));
          } else if (mode === 'teaching-read-recovery' && request?.kind === 'read' && data?.kind === 'application') {
            mode=''; event.stopImmediatePropagation();this.dispatchEvent(new MessageEvent('message',{data:{...data,value:{...data.value,application:{kind:'recovery',code:'worker-lost',message:'Synthetic connection recovery.'}}}}));queueMicrotask(()=>this.dispatchEvent(new ErrorEvent('error',{message:'Injected worker replacement after read recovery'})));
          } else if (mode === 'checkpoint-tail' && (request?.kind === 'execute' && request.operation.kind === 'ink') && request.operation.command.edit.kind === 'checkpoint' && data?.kind === 'execution' && data.value.kind === 'ink') {
            event.stopImmediatePropagation(); held=this; mode='tail-reply';
          } else if (mode === 'tail-reply' && !droppedTail && request?.kind === 'recoverInk' && request.operation.command.edit.kind === 'finalize' && data?.kind === 'inkRecovery') {
            droppedTail=true; event.stopImmediatePropagation(); queueMicrotask(()=>this.dispatchEvent(new ErrorEvent('error',{message:'Injected tail-finalize reply loss'})));
          } else if (mode === 'teaching-after' && (request?.kind === 'execute' && request.operation.kind === 'teaching') && ((data?.kind === 'execution' && data.value.kind === 'teaching') || data?.kind === 'teachingRecovery') && data.value.result.kind === 'committed') {
            mode=''; event.stopImmediatePropagation(); queueMicrotask(()=>this.dispatchEvent(new ErrorEvent('error',{message:'Injected teaching COMMIT reply loss'})));
          }
        });
      }
      postMessage(message, options) {
        requests.push(structuredClone(message));
        this.sent.set(message.id, message);
        if(mode === 'control-restore-revision' && (message.kind === 'execute' && message.operation.kind === 'teaching') && message.operation.command.kind === 'writingControl') mode='teaching-restore-revision';
        if(mode === 'reject-control' && (message.kind === 'execute' && message.operation.kind === 'teaching') && message.operation.command.kind === 'writingControl'){ mode=''; super.postMessage({...message,operation:{...message.operation,command:{...message.operation.command,expectedRevision:'99'}}}, options); return; }
        if(mode === 'hold-teaching' && (message.kind === 'execute' && message.operation.kind === 'teaching')){mode='';heldTeaching=()=>super.postMessage(message,options);return;}
        if (mode === 'teaching-before' && (message.kind === 'execute' && message.operation.kind === 'teaching')) {
          mode=''; queueMicrotask(()=>this.dispatchEvent(new ErrorEvent('error',{message:'Injected transport loss before teaching write'}))); return;
        }
        if(mode === 'hold-finalize' && (message.kind === 'execute' && message.operation.kind === 'ink') && message.operation.command.edit.kind === 'finalize'){mode='';heldWrite={worker:this,message,release:()=>super.postMessage(message,options)};return;}
        if (mode === 'ink-failure' && (message.kind === 'execute' && message.operation.kind === 'ink') && message.operation.command.edit.kind === 'finalize') {
          mode=''; this.dispatchEvent(new MessageEvent('message',{data:{id:message.id,kind:'failed',message:'Injected writing transaction failure'}})); return;
        }
        super.postMessage(message, options);
      }
    };
  `);
  await installInitialSetupObservation(page);
}
export async function requests(page: Page) {
  const evidence: unknown = await page.evaluate(
    "window.writingEvidence().requests",
  );
  if (!Array.isArray(evidence))
    throw new Error("Writing request evidence missing");
  return scenarioRequests(page, evidence.map(parseRequest));
}
export async function snapshots(page: Page) {
  const evidence: unknown = await page.evaluate(
    "window.writingEvidence().snapshots",
  );
  if (!Array.isArray(evidence))
    throw new Error("Writing SQL snapshot evidence missing");
  return evidence.map(
    (value) => parseCurrentResult(value, parseInkSnapshot).value,
  );
}
export async function responses(page: Page) {
  const evidence: unknown = await page.evaluate(
    "window.writingEvidence().responses",
  );
  if (!Array.isArray(evidence))
    throw new Error("Writing response evidence missing");
  return scenarioResponses(page, evidence.map(parseResponse));
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
export async function atWritableWriting(page: Page, suffix: string) {
  await atWriting(page, suffix);
  await expect(page.locator("canvas")).toHaveAttribute("data-writable", "true");
}
export async function finalizedWriting(
  page: Page,
  documentId: string,
  expected: number,
) {
  await expect
    .poll(async () => {
      const sent = (await requests(page)).filter(
        (request) =>
          request.kind === "execute" &&
          request.operation.kind === "ink" &&
          request.operation.command.token.documentId === documentId &&
          request.operation.command.edit.kind === "finalize",
      );
      const replies = await responses(page);
      return sent.filter(
        (request) =>
          request.kind === "execute" &&
          request.operation.kind === "ink" &&
          replies.some(
            (reply) =>
              reply.id === request.id &&
              reply.kind === "execution" &&
              reply.value.kind === "ink" &&
              reply.value.result.kind === "inkCommitted" &&
              reply.value.result.commandId ===
                request.operation.command.commandId,
          ),
      ).length;
    })
    .toBe(expected);
}
export async function writingAction(page: Page, name = "Continue") {
  await page.getByRole("button", { name, exact: true }).click();
  await expect(page.locator("main")).toHaveAttribute("aria-busy", "false");
}
export async function startWriting(page: Page) {
  await installInitialSetupObservation(page);
  await page.goto(writingBase);
  await completeInitialSetup({ page });
  await page.getByRole("link", { name: "Lesson 1", exact: true }).click();
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
