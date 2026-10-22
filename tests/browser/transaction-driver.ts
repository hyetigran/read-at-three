import type { BrowserContext, Page } from "@playwright/test";
import { browserBaseURL } from "./environment.ts";

export async function installTransactionDriver(
  context: BrowserContext,
  page: Page,
) {
  const wrapperPath = "/__transaction-driver-worker";
  const prelude = `
    let armed = null, target = null, activated = false, database = null, sqlite = null;
    let failed = false;
    const events = [];
    const queued = [];
    let ready = false;
    const emit = value => self.postMessage({__transactionEvidence:value});
    self.addEventListener('message', event => {
      const data=event.data;
      if (data?.__transactionControl) {
        event.stopImmediatePropagation();
        if(data.__transactionControl==='arm') { armed=data.cut; target=null; activated=false; failed=false; events.length=0; emit({id:data.id,armed}); }
        if(data.__transactionControl==='storeVersion') {
          if(!database || !sqlite.capi.sqlite3_get_autocommit(database.pointer) || !Number.isSafeInteger(data.cut) || data.cut<0 || data.cut>1000000) throw Error('Invalid settled store version fixture');
          database.exec('PRAGMA user_version='+data.cut);
          database.close();
          emit({id:data.id,version:data.cut});
        }
        if(data.__transactionControl==='inkCodec') {
          const table = {document:'ink_document',stroke:'ink_stroke',chunk:'ink_point_chunk'}[data.cut];
          if(!database || !sqlite.capi.sqlite3_get_autocommit(database.pointer) || !table) throw Error('Invalid settled codec fixture');
          database.exec('PRAGMA ignore_check_constraints=ON');
          database.exec('UPDATE '+table+' SET codec_version=2');
          database.exec('PRAGMA ignore_check_constraints=OFF');
          database.close();
          emit({id:data.id,codec:2});
        }
        if(data.__transactionControl==='snapshot') {
          if(!database || !sqlite.capi.sqlite3_get_autocommit(database.pointer)) throw Error('Snapshot requires settled actual SQLite');
          const tables=[];
          const names=database.exec({sql:"SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",rowMode:'array',returnValue:'resultRows'});
          for(const [name] of names) {
            const columns=[];
            const rows=database.exec({columnNames:columns,sql:'SELECT * FROM "'+name.replaceAll('"','""')+'" ORDER BY rowid',rowMode:'array',returnValue:'resultRows'});
            tables.push({name,columns,rows:rows.map(row=>row.map(value=>typeof value==='bigint'?{integer:String(value)}:value instanceof Uint8Array?{blob:Array.from(value)}:value))});
          }
          emit({id:data.id,tables});
        }
        return;
      }
      if(!ready){event.stopImmediatePropagation();queued.push(data);return;}
      if(armed && data?.kind==='execute' && data.operation.kind===armed.operation && (!armed.edit || data.operation.command.edit.kind===armed.edit)) target=data.operation.command.commandId;
    });
    let bootstrap;
    Object.defineProperty(globalThis,'sqlite3ApiBootstrap',{configurable:true,get:()=>bootstrap,set(value){
      bootstrap=new Proxy(value,{async apply(fn,receiver,args){
        const api=await Reflect.apply(fn,receiver,args);sqlite=api;
        const nativeExec=api.oo1.DB.prototype.exec;
        api.oo1.DB.prototype.exec=function(input,...args){
          database=this;
          const sql=typeof input==='string'?input:input.sql;
          if(target && /insert into "?command_receipt"?/i.test(sql) && input.bind?.includes(target)) activated=true;
          if(armed?.operation==='diagnostic' && /insert into "?local_diagnostics"?/i.test(sql)) { activated=true; target='diagnostic'; }
          if(activated) {
            events.push({boundary:sql==='COMMIT'||sql==='ROLLBACK'?sql:'statement',autocommit:api.capi.sqlite3_get_autocommit(this.pointer)});
            emit({events:structuredClone(events),target});
          }
          if(activated && sql==='COMMIT') {
            const cut=armed.cut;
            if(cut==='commit-after') {
              const result=Reflect.apply(nativeExec,this,[input,...args]);activated=false;failed=true;armed=null;
              events.push({boundary:'COMMIT-effect',autocommit:api.capi.sqlite3_get_autocommit(this.pointer)});emit({events:structuredClone(events),target});
              throw Error('Synthetic driver acknowledgement failure');
            }
            failed=true;
            throw Error('Synthetic driver COMMIT failure');
          }
          if(activated && failed && sql==='ROLLBACK' && armed.cut==='rollback-before') {
            events.push({boundary:'ROLLBACK-refused',autocommit:api.capi.sqlite3_get_autocommit(this.pointer)});emit({events:structuredClone(events),target});
            throw Error('Synthetic driver cleanup failure');
          }
          const result=Reflect.apply(nativeExec,this,[input,...args]);
          if(activated && sql==='ROLLBACK') { activated=false; target=null; armed=null; }
          return result;
        };
        return api;
      }});
    }});
  `;
  await context.route(
    (url) =>
      url.origin === new URL(browserBaseURL).origin &&
      url.pathname === wrapperPath,
    async (route) => {
      const actual = new URL(route.request().url()).searchParams.get("actual");
      if (!actual || new URL(actual).origin !== new URL(browserBaseURL).origin)
        throw new Error("Same-origin application worker required");
      await route.fulfill({
        contentType: "text/javascript",
        body:
          prelude +
          "\nawait import(" +
          JSON.stringify(actual) +
          ");ready=true;for(const data of queued)self.dispatchEvent(new MessageEvent('message',{data}));",
      });
    },
  );
  await page.addInitScript(
    ({ wrapperPath }) => {
      const NativeWorker = window.Worker;
      const workers: Worker[] = [];
      const pending = new Map<string, (value: unknown) => void>();
      const evidence: unknown[] = [];
      let lastReply: unknown;
      Object.assign(window, {
        transactionDriverEvidence: () =>
          structuredClone({ evidence, workers: workers.length }),
        transactionDriverControl: (control: string, cut?: unknown) =>
          new Promise((resolve) => {
            const worker = workers.at(-1);
            if (!worker) throw new Error("No application worker");
            const id = crypto.randomUUID();
            pending.set(id, resolve);
            NativeWorker.prototype.postMessage.call(worker, {
              __transactionControl: control,
              cut,
              id,
            });
          }),
        transactionDriverTriggerRead: () => {
          const worker = workers.at(-1);
          if (!worker) throw new Error("No application worker");
          NativeWorker.prototype.postMessage.call(worker, {
            id: "observer-read",
            kind: "readDirectory",
          });
        },
        transactionDriverLateReply: () =>
          workers[0]?.dispatchEvent(
            new MessageEvent("message", { data: lastReply }),
          ),
      });
      window.Worker = class extends NativeWorker {
        constructor(url: string | URL, options?: WorkerOptions) {
          const actual = new URL(String(url), location.href);
          if (actual.origin !== location.origin)
            throw new Error("Same-origin worker required");
          const wrapped = new URL(wrapperPath, location.href);
          wrapped.searchParams.set("actual", actual.href);
          super(wrapped, options);
          workers.push(this);
          this.addEventListener("message", (event) => {
            if (event.data?.__transactionEvidence) {
              event.stopImmediatePropagation();
              const item = event.data.__transactionEvidence;
              evidence.push(structuredClone(item));
              if (item.id) {
                pending.get(item.id)?.(item);
                pending.delete(item.id);
              }
            } else if (event.data?.kind === "execution")
              lastReply = structuredClone(event.data);
          });
        }
      };
    },
    { wrapperPath },
  );
}
