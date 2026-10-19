import { expect, test } from "@playwright/test";
import { browserBaseURL } from "./environment.ts";
import { useLegacyContent } from "./legacy-content.ts";
import {
  completeInitialSetup,
  installInitialSetupObservation,
} from "./parent-setup.ts";

const storageWorker = `
let locked;
self.onmessage = async ({data}) => {
  try {
    const root = await navigator.storage.getDirectory();
    const pool = await root.getDirectoryHandle('.read-at-three.sqlite');
    const directory = await pool.getDirectoryHandle('.opaque');
    const files = [];
    for await (const [name, handle] of directory.entries()) {
      if (handle.kind === 'file') files.push([name, handle]);
    }
    files.sort(([a], [b]) => a.localeCompare(b));
    if (data === 'seed-and-lock') {
      const unused = [];
      for (const entry of files) {
        const bytes = new Uint8Array(await (await entry[1].getFile()).arrayBuffer());
        if (bytes.length === 4096 && bytes.every(value => value === 0)) unused.push(entry);
      }
      if (unused.length < 2) throw Error('Two genuinely unused pool files are required.');
      const [[candidate, candidateFile], [held, heldFile]] = unused;
      if (![candidate, held].every(name => /^[a-z0-9]+$/.test(name))) throw Error('Unexpected opaque filename.');
      const handle = await candidateFile.createSyncAccessHandle();
      try {
        handle.write(new TextEncoder().encode('Deliberately seeded unused residual tail'), {at:4096});
        handle.flush();
      } finally { handle.close(); }
      locked = await heldFile.createSyncAccessHandle();
      self.postMessage(candidate + ',' + held);
    } else if (data === 'release') {
      locked.close(); locked = undefined; self.postMessage('released');
    } else if (data === 'hashes') {
      const hashes = [];
      for (const [name, handle] of files) {
        const bytes = await (await handle.getFile()).arrayBuffer();
        const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
        hashes.push([name, bytes.byteLength, Array.from(digest, value => value.toString(16).padStart(2, '0')).join('')]);
      }
      self.postMessage(JSON.stringify(hashes));
    } else if (data === 'reacquire-all') {
      for (const [, file] of files) {
        const handle = await file.createSyncAccessHandle();
        handle.close();
      }
      self.postMessage('all handles released');
    } else throw Error('Unknown storage operation.');
  } catch (error) { self.postMessage({failure:String(error)}); }
};`;

for (const ordering of ["early-success", "late-success"]) {
  test(`native OPFS ${ordering} acquisition failure preserves residual bytes and releases all handles`, async ({
    page,
    context,
  }, testInfo) => {
    await useLegacyContent(context);
    await installInitialSetupObservation(page);
    await page.goto(browserBaseURL);
    await completeInitialSetup({ page });
    await page.getByRole("link", { name: "Lesson 1", exact: true }).click();
    await page.getByRole("button", { name: "Start", exact: true }).click();
    await expect(
      page.getByText("Fixture model.", { exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(
      page.getByText("Fixture child response.", { exact: true }),
    ).toBeVisible();
    await page.close();

    const harness = await context.newPage();
    await harness.route("**/storage-harness", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: "<title>Owned OPFS acquisition harness</title>",
      }),
    );
    await harness.goto(`${browserBaseURL}/storage-harness`);
    const locker = await harness.evaluateHandle(
      (source) =>
        new Worker(
          URL.createObjectURL(new Blob([source], { type: "text/javascript" })),
        ),
      storageWorker,
    );
    const operation = (kind: string) =>
      locker.evaluate(
        (worker, value) =>
          new Promise<string>((resolve, reject) => {
            worker.onmessage = (event: MessageEvent<unknown>) => {
              if (typeof event.data === "string") resolve(event.data);
              else reject(new Error(JSON.stringify(event.data)));
            };
            worker.postMessage(value);
          }),
        kind,
      );
    try {
      const [candidate, held] = (await operation("seed-and-lock")).split(",");
      if (!candidate || !held)
        throw new Error("Both native pool filenames are required.");
      expect(await operation("release")).toBe("released");
      const before = await operation("hashes");
      const holder = await harness.evaluateHandle(async (name) => {
        const source = `let handle;self.onmessage=async({data})=>{try{if(data==='lock'){const root=await navigator.storage.getDirectory();const pool=await root.getDirectoryHandle('.read-at-three.sqlite');const dir=await pool.getDirectoryHandle('.opaque');handle=await(await dir.getFileHandle(${JSON.stringify(name)})).createSyncAccessHandle();self.postMessage('locked');}else{handle.close();self.postMessage('released');}}catch(error){self.postMessage(String(error));}};`;
        return new Worker(
          URL.createObjectURL(new Blob([source], { type: "text/javascript" })),
        );
      }, held);
      const hold = (kind: string) =>
        holder.evaluate(
          (worker, data) =>
            new Promise<unknown>((resolve) => {
              worker.onmessage = (event) => resolve(event.data);
              worker.postMessage(data);
            }),
          kind,
        );
      try {
        expect(await hold("lock")).toBe("locked");
        const failed = await context.newPage();
        const events: string[] = [];
        failed.on("console", (message) => {
          if (message.text().startsWith("OPFS acquisition: "))
            events.push(message.text().slice(18));
        });
        const wrapperPath = `/__test__/opfs-acquisition-${ordering}-worker.mjs`;
        const prelude = `
                const candidate=${JSON.stringify(candidate)}, held=${JSON.stringify(held)}, ordering=${JSON.stringify(ordering)};
                let ready=false;const queued=[];
                self.addEventListener('message',event=>{if(!ready){queued.push(event.data);event.stopImmediatePropagation();}});
                const nextTask=()=>new Promise(resolve=>{const channel=new MessageChannel();channel.port1.onmessage=()=>{channel.port1.close();channel.port2.close();resolve();};channel.port2.postMessage(null);});
                let candidateDone, heldFailed;
                const candidateAcquired=new Promise(resolve=>candidateDone=resolve);
                const heldRejected=new Promise(resolve=>heldFailed=resolve);
                const nativeCreate=FileSystemFileHandle.prototype.createSyncAccessHandle;
                FileSystemFileHandle.prototype.createSyncAccessHandle=async function(...args){
                  if(this.name===held&&ordering==='early-success'){await candidateAcquired;await nextTask();}
                  let handle;
                  try{handle=await Reflect.apply(nativeCreate,this,args);}
                  catch(error){if(this.name===held){console.log('OPFS acquisition: held rejected');heldFailed();}throw error;}
                  if(this.name===candidate){
                    candidateDone();
                    if(ordering==='late-success'){await heldRejected;await nextTask();}
                    console.log('OPFS acquisition: candidate delivered');
                  }
                  return handle;
                };
        `;
        await context.route(
          (url) =>
            url.origin === new URL(browserBaseURL).origin &&
            url.pathname === wrapperPath,
          async (route) => {
            const requested = new URL(route.request().url());
            const actual = requested.searchParams.get("actual");
            if (!actual || actual.length > 4096)
              throw new Error("A bounded application worker URL is required.");
            const applicationWorker = new URL(actual, browserBaseURL);
            if (applicationWorker.origin !== new URL(browserBaseURL).origin)
              throw new Error(
                "The application worker must remain same-origin.",
              );
            await route.fulfill({
              contentType: "text/javascript",
              body:
                prelude +
                "\nawait import(" +
                JSON.stringify(applicationWorker.href) +
                ');ready=true;for(const data of queued)self.dispatchEvent(new MessageEvent("message",{data}));',
            });
          },
        );
        await failed.addInitScript(
          ({ wrapperPath }) => {
            const NativeWorker = window.Worker;
            window.Worker = class extends NativeWorker {
              constructor(url: string | URL, options?: WorkerOptions) {
                const absolute = new URL(String(url), location.href);
                if (absolute.origin !== location.origin)
                  throw new Error(
                    "The application worker must remain same-origin.",
                  );
                const wrapper = new URL(wrapperPath, location.href);
                wrapper.searchParams.set("actual", absolute.href);
                super(wrapper, options);
              }
            };
          },
          { wrapperPath },
        );
        await failed.goto(browserBaseURL);
        await expect(
          failed.getByRole("heading", { name: "Saved storage is unavailable" }),
        ).toBeVisible();
        expect(events).toEqual(
          ordering === "early-success"
            ? ["candidate delivered", "held rejected"]
            : ["held rejected", "candidate delivered"],
        );
        expect(await hold("release")).toBe("released");
        const after = await operation("hashes");
        await testInfo.attach("complete-native-pool-hashes", {
          body: JSON.stringify({
            ordering,
            candidate,
            held,
            before,
            after,
            events,
          }),
          contentType: "application/json",
        });
        expect(after).toEqual(before);
        expect(await operation("reacquire-all")).toBe("all handles released");
        await failed.close();
        const restored = await context.newPage();
        await restored.goto(browserBaseURL);
        await restored
          .getByRole("button", {
            name: "Resume saved activity · Lesson 1",
            exact: true,
          })
          .click();
        await expect(
          restored.getByText("Fixture child response.", { exact: true }),
        ).toBeVisible();
      } finally {
        await holder.evaluate((worker) => worker.terminate());
      }
    } finally {
      await locker.evaluate((worker) => worker.terminate());
    }
  });
}
