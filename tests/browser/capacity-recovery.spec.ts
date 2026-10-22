import { expect, test } from "@playwright/test";
import { browserBaseURL } from "./environment.ts";
import {
  atWriting,
  atWritableWriting,
  drawPractice,
  drawStroke,
  finalizedWriting,
  latestDocuments,
  probe,
  requests,
  startWriting,
  writingAction,
} from "./writing-helpers.ts";

test("actual SQLite capacity refusal retains ink and explains explicit recovery", async ({
  context,
  page,
}) => {
  test.setTimeout(90000);
  await context.route("**/__capacity-worker?*", async (route) => {
    const actual = new URL(route.request().url()).searchParams.get("actual");
    if (!actual || new URL(actual).origin !== new URL(browserBaseURL).origin)
      throw new Error("Same-origin worker required");
    await route.fulfill({
      contentType: "text/javascript",
      body: `
      let bootstrap, database, sqlite, ready=false; const queued=[];
      const emit=value=>self.postMessage({__capacityEvidence:value});
      self.addEventListener('message',event=>{
        const data=event.data;
        if(data?.__capacityControl){
          event.stopImmediatePropagation();
          if(!database || !sqlite.capi.sqlite3_get_autocommit(database.pointer)) throw Error('Idle database required');
          const count=database.exec({sql:'PRAGMA page_count',rowMode:'array',returnValue:'resultRows'})[0][0];
          const limit=data.__capacityControl==='limit'?count:1073741823;
          const result=database.exec({sql:'PRAGMA max_page_count='+limit,rowMode:'array',returnValue:'resultRows'})[0][0];
          emit({id:data.id,count,limit:result});return;
        }
        if(!ready){event.stopImmediatePropagation();queued.push(data);}
      });
      Object.defineProperty(globalThis,'sqlite3ApiBootstrap',{configurable:true,get:()=>bootstrap,set(value){
        bootstrap=new Proxy(value,{async apply(fn,receiver,args){
          const api=await Reflect.apply(fn,receiver,args);sqlite=api;
          const exec=api.oo1.DB.prototype.exec;
          api.oo1.DB.prototype.exec=function(...args){database=this;try{return Reflect.apply(exec,this,args);}catch(error){if(error instanceof api.SQLite3Error && error.resultCode===13)emit({full:true});throw error;}};
          return api;
        }});
      }});
      await import(${JSON.stringify(actual)});ready=true;for(const data of queued)self.dispatchEvent(new MessageEvent('message',{data}));
    `,
    });
  });
  await page.addInitScript(() => {
    const NativeWorker = window.Worker;
    let current: Worker;
    const pending = new Map<string, (value: unknown) => void>();
    const events: unknown[] = [];
    Object.assign(window, {
      capacityEvents: () => structuredClone(events),
      capacityControl: (control: string) =>
        new Promise((resolve) => {
          const id = crypto.randomUUID();
          pending.set(id, resolve);
          NativeWorker.prototype.postMessage.call(current, {
            __capacityControl: control,
            id,
          });
        }),
    });
    window.Worker = class extends NativeWorker {
      constructor(url: string | URL, options?: WorkerOptions) {
        const actual = new URL(String(url), location.href);
        const wrapper = new URL("/__capacity-worker", location.href);
        wrapper.searchParams.set("actual", actual.href);
        super(wrapper, options);
        current = this;
        this.addEventListener("message", (event) => {
          const item = event.data?.__capacityEvidence;
          if (!item) return;
          event.stopImmediatePropagation();
          events.push(item);
          if (item.id) {
            pending.get(item.id)?.(item);
            pending.delete(item.id);
          }
        });
      }
    };
  });
  await probe(page);
  await startWriting(page);
  await writingAction(page);
  await atWriting(page, "m-model");
  await drawPractice(page);
  const original = (await latestDocuments(page))[0];
  if (!original) throw new Error("Saved document missing");
  await finalizedWriting(page, original.token.documentId, 3);
  await page.reload();
  await writingAction(page, "Resume");
  await atWritableWriting(page, "m-model");
  const saved = (await latestDocuments(page))[0];
  expect(saved?.strokes.length).toBe(3);
  await page.evaluate("window.capacityControl('limit')");
  await drawStroke(
    page,
    Array.from({ length: 350 }, (_, i) => ({
      x: 100 + (i % 600),
      y: 100 + (i % 40),
    })),
  );
  await expect(
    page.getByRole("button", { name: "Retry save", exact: true }),
  ).toBeVisible();
  await expect
    .poll(() => page.evaluate("window.capacityEvents().some(item=>item.full)"))
    .toBe(true);
  await expect(
    page.getByText(
      "Storage is full. Keep this reading window open, free some device storage, then retry the same action. New work may still be unsaved.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Continue", exact: true }),
  ).toBeDisabled();
  const beforeRetry = await requests(page);
  const failed = beforeRetry
    .filter((item) => item.kind === "execute" && item.operation.kind === "ink")
    .at(-1);
  if (failed?.kind !== "execute" || failed.operation.kind !== "ink")
    throw new Error("Retained ink command missing");
  await page.evaluate("window.capacityControl('release')");
  await writingAction(page, "Retry save");
  await expect(
    page.getByRole("button", { name: "Retry save", exact: true }),
  ).toHaveCount(0);
  const after = await requests(page);
  expect(
    after
      .slice(beforeRetry.length)
      .some(
        (item) =>
          item.kind === "execute" &&
          JSON.stringify(item.operation) === JSON.stringify(failed.operation),
      ),
  ).toBe(true);
  const restored = (await latestDocuments(page))[0];
  expect(restored?.strokes.slice(0, 3)).toEqual(saved?.strokes);
  expect(restored?.strokes.length).toBe(4);
});
