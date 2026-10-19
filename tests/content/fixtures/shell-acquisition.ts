type AcquisitionProbe = Readonly<{
  name: string;
  source: string;
  oldBuild: "accepted" | "refused";
  proposedBuild: "accepted" | "refused";
  runtimeObligation: string;
}>;
export const shellAcquisitionCases = [
  {
    name: "direct-module",
    source: 'new Worker(new URL("./lazy.js",import.meta.url))',
    oldBuild: "accepted",
    proposedBuild: "accepted",
    runtimeObligation: "authenticated explicit module URL works",
  },
  {
    name: "bound-module",
    source:
      'const entry=new URL("./lazy.js",import.meta.url);new SharedWorker(entry)',
    oldBuild: "accepted",
    proposedBuild: "accepted",
    runtimeObligation: "authenticated explicit module URL works",
  },
  {
    name: "relative-string",
    source: 'new Worker("./lazy.js")',
    oldBuild: "refused",
    proposedBuild: "accepted",
    runtimeObligation:
      "document-base final URL only; missing root and nested request refuses",
  },
  {
    name: "bound-string",
    source: 'const entry="./lazy.js";new Worker(entry)',
    oldBuild: "refused",
    proposedBuild: "accepted",
    runtimeObligation:
      "document-base final URL only; missing root and nested request refuses",
  },
  {
    name: "mutated-url",
    source:
      'const entry=new URL("./lazy.js",import.meta.url);entry.pathname="/missing.js";new Worker(entry)',
    oldBuild: "refused",
    proposedBuild: "accepted",
    runtimeObligation: "missing mutated final URL refuses",
  },
  {
    name: "alias-url",
    source:
      'const entry=new URL("./lazy.js",import.meta.url);const alias=entry;new Worker(alias)',
    oldBuild: "refused",
    proposedBuild: "accepted",
    runtimeObligation: "authenticated final URL only",
  },
  {
    name: "escape-url",
    source:
      'const entry=new URL("./lazy.js",import.meta.url);Object.assign(entry,{pathname:"/missing.js"});new Worker(entry)',
    oldBuild: "refused",
    proposedBuild: "accepted",
    runtimeObligation: "missing mutated final URL refuses",
  },
  {
    name: "shadow-worker",
    source:
      'const entry=new URL("./lazy.js",import.meta.url);function Worker(x){x.href="/missing.js"}new Worker(entry);new globalThis.Worker(entry)',
    oldBuild: "refused",
    proposedBuild: "accepted",
    runtimeObligation: "missing mutated final URL refuses",
  },
  {
    name: "missing-module",
    source: 'new Worker(new URL("./missing.js",import.meta.url))',
    oldBuild: "refused",
    proposedBuild: "refused",
    runtimeObligation: "recognized static missing-target refusal retained",
  },
  {
    name: "destructured-worker",
    source: 'const {Worker: Entry}=globalThis;new Entry("./missing.js")',
    oldBuild: "accepted",
    proposedBuild: "accepted",
    runtimeObligation: "missing document-base final URL refuses",
  },
  {
    name: "destructured-shared",
    source: 'const {SharedWorker: Entry}=window;new Entry("./missing.js")',
    oldBuild: "accepted",
    proposedBuild: "accepted",
    runtimeObligation: "missing document-base final URL refuses",
  },
  {
    name: "aliased-global",
    source:
      'const host=globalThis;const Entry=host.Worker;new Entry("./missing.js")',
    oldBuild: "accepted",
    proposedBuild: "accepted",
    runtimeObligation: "missing document-base final URL refuses",
  },
  {
    name: "computed-constructor",
    source: 'new globalThis["Wor"+"ker"]("./missing.js")',
    oldBuild: "accepted",
    proposedBuild: "accepted",
    runtimeObligation: "missing document-base final URL refuses",
  },
  {
    name: "reflected-constructor",
    source:
      'const Entry=Reflect.get(globalThis,"Worker");new Entry("./missing.js")',
    oldBuild: "accepted",
    proposedBuild: "accepted",
    runtimeObligation: "missing document-base final URL refuses",
  },
  {
    name: "reflect-construct",
    source: 'Reflect.construct(globalThis.Worker,["./missing.js"])',
    oldBuild: "refused",
    proposedBuild: "accepted",
    runtimeObligation: "missing document-base final URL refuses",
  },
  {
    name: "literal-constructor-alias",
    source: 'const Entry=globalThis.Worker;new Entry("./missing.js")',
    oldBuild: "refused",
    proposedBuild: "accepted",
    runtimeObligation: "missing document-base final URL refuses",
  },
  {
    name: "direct-computed-literal",
    source: 'new globalThis["Worker"]("./missing.js")',
    oldBuild: "refused",
    proposedBuild: "accepted",
    runtimeObligation:
      "document-relative string runtime-only; missing final URL refuses",
  },
  {
    name: "plain-constructor-alias",
    source: 'const Entry=Worker;new Entry("./missing.js")',
    oldBuild: "refused",
    proposedBuild: "accepted",
    runtimeObligation: "missing document-base final URL refuses",
  },
  {
    name: "old-string-18",
    source: 'new Worker("./lazy.js")',
    oldBuild: "refused",
    proposedBuild: "accepted",
    runtimeObligation:
      "explicit root/nested request qualification; relative strings carry no module-base reference claim",
  },
  {
    name: "old-string-19",
    source: 'const entry="./lazy.js";new Worker(entry)',
    oldBuild: "refused",
    proposedBuild: "accepted",
    runtimeObligation:
      "explicit root/nested request qualification; relative strings carry no module-base reference claim",
  },
  {
    name: "old-string-20",
    source: 'new Worker("/assets/lazy.js")',
    oldBuild: "refused",
    proposedBuild: "accepted",
    runtimeObligation:
      "explicit root/nested request qualification; relative strings carry no module-base reference claim",
  },
  {
    name: "old-string-21",
    source: 'const entry="/assets/lazy.js";new Worker(entry)',
    oldBuild: "refused",
    proposedBuild: "accepted",
    runtimeObligation:
      "explicit root/nested request qualification; relative strings carry no module-base reference claim",
  },
  {
    name: "old-string-22",
    source: "new Worker(`./lazy.js`)",
    oldBuild: "refused",
    proposedBuild: "accepted",
    runtimeObligation:
      "explicit root/nested request qualification; relative strings carry no module-base reference claim",
  },
  {
    name: "old-string-23",
    source: "const entry=`./lazy.js`;new Worker(entry)",
    oldBuild: "refused",
    proposedBuild: "accepted",
    runtimeObligation:
      "explicit root/nested request qualification; relative strings carry no module-base reference claim",
  },
  {
    name: "old-string-24",
    source: 'new SharedWorker("./lazy.js")',
    oldBuild: "refused",
    proposedBuild: "accepted",
    runtimeObligation:
      "explicit root/nested request qualification; relative strings carry no module-base reference claim",
  },
  {
    name: "old-string-25",
    source: 'const entry="./lazy.js";new SharedWorker(entry)',
    oldBuild: "refused",
    proposedBuild: "accepted",
    runtimeObligation:
      "explicit root/nested request qualification; relative strings carry no module-base reference claim",
  },
  {
    name: "old-string-26",
    source: 'new SharedWorker("/assets/lazy.js")',
    oldBuild: "refused",
    proposedBuild: "accepted",
    runtimeObligation:
      "explicit root/nested request qualification; relative strings carry no module-base reference claim",
  },
  {
    name: "old-string-27",
    source: 'const entry="/assets/lazy.js";new SharedWorker(entry)',
    oldBuild: "refused",
    proposedBuild: "accepted",
    runtimeObligation:
      "explicit root/nested request qualification; relative strings carry no module-base reference claim",
  },
  {
    name: "old-string-28",
    source: "new SharedWorker(`./lazy.js`)",
    oldBuild: "refused",
    proposedBuild: "accepted",
    runtimeObligation:
      "explicit root/nested request qualification; relative strings carry no module-base reference claim",
  },
  {
    name: "old-string-29",
    source: "const entry=`./lazy.js`;new SharedWorker(entry)",
    oldBuild: "refused",
    proposedBuild: "accepted",
    runtimeObligation:
      "explicit root/nested request qualification; relative strings carry no module-base reference claim",
  },
  {
    name: "old-string-30",
    source: 'new window.Worker("./lazy.js")',
    oldBuild: "refused",
    proposedBuild: "accepted",
    runtimeObligation:
      "explicit root/nested request qualification; relative strings carry no module-base reference claim",
  },
  {
    name: "old-string-31",
    source: 'const entry="./lazy.js";new window.Worker(entry)',
    oldBuild: "refused",
    proposedBuild: "accepted",
    runtimeObligation:
      "explicit root/nested request qualification; relative strings carry no module-base reference claim",
  },
  {
    name: "old-string-32",
    source: 'new window.Worker("/assets/lazy.js")',
    oldBuild: "refused",
    proposedBuild: "accepted",
    runtimeObligation:
      "explicit root/nested request qualification; relative strings carry no module-base reference claim",
  },
  {
    name: "old-string-33",
    source: 'const entry="/assets/lazy.js";new window.Worker(entry)',
    oldBuild: "refused",
    proposedBuild: "accepted",
    runtimeObligation:
      "explicit root/nested request qualification; relative strings carry no module-base reference claim",
  },
  {
    name: "old-string-34",
    source: "new window.Worker(`./lazy.js`)",
    oldBuild: "refused",
    proposedBuild: "accepted",
    runtimeObligation:
      "explicit root/nested request qualification; relative strings carry no module-base reference claim",
  },
  {
    name: "old-string-35",
    source: "const entry=`./lazy.js`;new window.Worker(entry)",
    oldBuild: "refused",
    proposedBuild: "accepted",
    runtimeObligation:
      "explicit root/nested request qualification; relative strings carry no module-base reference claim",
  },
  {
    name: "old-string-36",
    source: 'new globalThis["SharedWorker"]("./lazy.js")',
    oldBuild: "refused",
    proposedBuild: "accepted",
    runtimeObligation:
      "explicit root/nested request qualification; relative strings carry no module-base reference claim",
  },
  {
    name: "old-string-37",
    source: 'const entry="./lazy.js";new globalThis["SharedWorker"](entry)',
    oldBuild: "refused",
    proposedBuild: "accepted",
    runtimeObligation:
      "explicit root/nested request qualification; relative strings carry no module-base reference claim",
  },
  {
    name: "old-string-38",
    source: 'new globalThis["SharedWorker"]("/assets/lazy.js")',
    oldBuild: "refused",
    proposedBuild: "accepted",
    runtimeObligation:
      "explicit root/nested request qualification; relative strings carry no module-base reference claim",
  },
  {
    name: "old-string-39",
    source:
      'const entry="/assets/lazy.js";new globalThis["SharedWorker"](entry)',
    oldBuild: "refused",
    proposedBuild: "accepted",
    runtimeObligation:
      "explicit root/nested request qualification; relative strings carry no module-base reference claim",
  },
  {
    name: "old-string-40",
    source: 'new globalThis["SharedWorker"](`./lazy.js`)',
    oldBuild: "refused",
    proposedBuild: "accepted",
    runtimeObligation:
      "explicit root/nested request qualification; relative strings carry no module-base reference claim",
  },
  {
    name: "old-string-41",
    source: 'const entry=`./lazy.js`;new globalThis["SharedWorker"](entry)',
    oldBuild: "refused",
    proposedBuild: "accepted",
    runtimeObligation:
      "explicit root/nested request qualification; relative strings carry no module-base reference claim",
  },
  {
    name: "old-url-use-42",
    source:
      'const entry=new URL("./lazy.js",import.meta.url);entry.pathname="/missing.js";new Worker(entry)',
    oldBuild: "refused",
    proposedBuild: "accepted",
    runtimeObligation:
      "final resulting URL membership or JavaScript failure, with no static acquisition certificate",
  },
  {
    name: "old-url-use-43",
    source:
      'const entry=new URL("./lazy.js",import.meta.url);entry.search="?changed";new Worker(entry)',
    oldBuild: "refused",
    proposedBuild: "accepted",
    runtimeObligation:
      "final resulting URL membership or JavaScript failure, with no static acquisition certificate",
  },
  {
    name: "old-url-use-44",
    source:
      'const entry=new URL("./lazy.js",import.meta.url);entry.href="/missing.js";new Worker(entry)',
    oldBuild: "refused",
    proposedBuild: "accepted",
    runtimeObligation:
      "final resulting URL membership or JavaScript failure, with no static acquisition certificate",
  },
  {
    name: "old-url-use-45",
    source:
      'const entry=new URL("./lazy.js",import.meta.url);entry.searchParams.set("path","missing");new Worker(entry)',
    oldBuild: "refused",
    proposedBuild: "accepted",
    runtimeObligation:
      "final resulting URL membership or JavaScript failure, with no static acquisition certificate",
  },
  {
    name: "old-url-use-46",
    source:
      'const entry=new URL("./lazy.js",import.meta.url);entry.unknown();new Worker(entry)',
    oldBuild: "refused",
    proposedBuild: "accepted",
    runtimeObligation:
      "final resulting URL membership or JavaScript failure, with no static acquisition certificate",
  },
  {
    name: "old-url-use-47",
    source:
      'const entry=new URL("./lazy.js",import.meta.url);const alias=entry;new Worker(entry)',
    oldBuild: "refused",
    proposedBuild: "accepted",
    runtimeObligation:
      "final resulting URL membership or JavaScript failure, with no static acquisition certificate",
  },
  {
    name: "old-url-use-48",
    source:
      'const entry=new URL("./lazy.js",import.meta.url);consume(entry);new Worker(entry)',
    oldBuild: "refused",
    proposedBuild: "accepted",
    runtimeObligation:
      "final resulting URL membership or JavaScript failure, with no static acquisition certificate",
  },
  {
    name: "old-url-use-49",
    source:
      'const entry=new URL("./lazy.js",import.meta.url);globalThis.entry=entry;new Worker(entry)',
    oldBuild: "refused",
    proposedBuild: "accepted",
    runtimeObligation:
      "final resulting URL membership or JavaScript failure, with no static acquisition certificate",
  },
  {
    name: "old-url-use-50",
    source:
      'const entry=new URL("./lazy.js",import.meta.url);const object={entry};new Worker(entry)',
    oldBuild: "refused",
    proposedBuild: "accepted",
    runtimeObligation:
      "final resulting URL membership or JavaScript failure, with no static acquisition certificate",
  },
  {
    name: "old-url-use-51",
    source:
      'const entry=new URL("./lazy.js",import.meta.url);Object.assign(entry,{pathname:"/missing.js"});new Worker(entry)',
    oldBuild: "refused",
    proposedBuild: "accepted",
    runtimeObligation:
      "final resulting URL membership or JavaScript failure, with no static acquisition certificate",
  },
  {
    name: "old-immutable-url-Worker",
    source:
      'const entry=new URL("./lazy.js",""+import.meta.url);new Worker(entry);new Worker(entry)',
    oldBuild: "accepted",
    proposedBuild: "accepted",
    runtimeObligation:
      "authenticated explicit module URL works; omission retains static failure",
  },
  {
    name: "old-url-use-53",
    source:
      'const entry=new URL("./lazy.js",import.meta.url);entry.pathname="/missing.js";new SharedWorker(entry)',
    oldBuild: "refused",
    proposedBuild: "accepted",
    runtimeObligation:
      "final resulting URL membership or JavaScript failure, with no static acquisition certificate",
  },
  {
    name: "old-url-use-54",
    source:
      'const entry=new URL("./lazy.js",import.meta.url);entry.search="?changed";new SharedWorker(entry)',
    oldBuild: "refused",
    proposedBuild: "accepted",
    runtimeObligation:
      "final resulting URL membership or JavaScript failure, with no static acquisition certificate",
  },
  {
    name: "old-url-use-55",
    source:
      'const entry=new URL("./lazy.js",import.meta.url);entry.href="/missing.js";new SharedWorker(entry)',
    oldBuild: "refused",
    proposedBuild: "accepted",
    runtimeObligation:
      "final resulting URL membership or JavaScript failure, with no static acquisition certificate",
  },
  {
    name: "old-url-use-56",
    source:
      'const entry=new URL("./lazy.js",import.meta.url);entry.searchParams.set("path","missing");new SharedWorker(entry)',
    oldBuild: "refused",
    proposedBuild: "accepted",
    runtimeObligation:
      "final resulting URL membership or JavaScript failure, with no static acquisition certificate",
  },
  {
    name: "old-url-use-57",
    source:
      'const entry=new URL("./lazy.js",import.meta.url);entry.unknown();new SharedWorker(entry)',
    oldBuild: "refused",
    proposedBuild: "accepted",
    runtimeObligation:
      "final resulting URL membership or JavaScript failure, with no static acquisition certificate",
  },
  {
    name: "old-url-use-58",
    source:
      'const entry=new URL("./lazy.js",import.meta.url);const alias=entry;new SharedWorker(entry)',
    oldBuild: "refused",
    proposedBuild: "accepted",
    runtimeObligation:
      "final resulting URL membership or JavaScript failure, with no static acquisition certificate",
  },
  {
    name: "old-url-use-59",
    source:
      'const entry=new URL("./lazy.js",import.meta.url);consume(entry);new SharedWorker(entry)',
    oldBuild: "refused",
    proposedBuild: "accepted",
    runtimeObligation:
      "final resulting URL membership or JavaScript failure, with no static acquisition certificate",
  },
  {
    name: "old-url-use-60",
    source:
      'const entry=new URL("./lazy.js",import.meta.url);globalThis.entry=entry;new SharedWorker(entry)',
    oldBuild: "refused",
    proposedBuild: "accepted",
    runtimeObligation:
      "final resulting URL membership or JavaScript failure, with no static acquisition certificate",
  },
  {
    name: "old-url-use-61",
    source:
      'const entry=new URL("./lazy.js",import.meta.url);const object={entry};new SharedWorker(entry)',
    oldBuild: "refused",
    proposedBuild: "accepted",
    runtimeObligation:
      "final resulting URL membership or JavaScript failure, with no static acquisition certificate",
  },
  {
    name: "old-url-use-62",
    source:
      'const entry=new URL("./lazy.js",import.meta.url);Object.assign(entry,{pathname:"/missing.js"});new SharedWorker(entry)',
    oldBuild: "refused",
    proposedBuild: "accepted",
    runtimeObligation:
      "final resulting URL membership or JavaScript failure, with no static acquisition certificate",
  },
  {
    name: "old-immutable-url-SharedWorker",
    source:
      'const entry=new URL("./lazy.js",""+import.meta.url);new SharedWorker(entry);new SharedWorker(entry)',
    oldBuild: "accepted",
    proposedBuild: "accepted",
    runtimeObligation:
      "authenticated explicit module URL works; omission retains static failure",
  },
  {
    name: "old-shadow-computed-64",
    source:
      'const entry=new URL("./lazy.js",import.meta.url);function Worker(url){url.pathname="/missing.js"}new Worker(entry);new globalThis.Worker(entry)',
    oldBuild: "refused",
    proposedBuild: "accepted",
    runtimeObligation:
      "final URL runtime-only, missing target refuses if construction requests it",
  },
  {
    name: "old-shadow-computed-65",
    source:
      'const entry=new URL("./lazy.js",import.meta.url);const window={Worker:function(url){url.pathname="/missing.js"}};new window.Worker(entry);new globalThis.Worker(entry)',
    oldBuild: "refused",
    proposedBuild: "accepted",
    runtimeObligation:
      "final URL runtime-only, missing target refuses if construction requests it",
  },
  {
    name: "old-shadow-computed-66",
    source:
      'function URL(){return {toString(){return "/missing.js"}}}const entry=new URL("./lazy.js",import.meta.url);new Worker(entry)',
    oldBuild: "refused",
    proposedBuild: "accepted",
    runtimeObligation:
      "final URL runtime-only, missing target refuses if construction requests it",
  },
  {
    name: "old-shadow-computed-67",
    source: "new globalThis.Worker(globalThis.workerPath)",
    oldBuild: "refused",
    proposedBuild: "accepted",
    runtimeObligation:
      "final URL runtime-only, missing target refuses if construction requests it",
  },
  {
    name: "old-shadow-computed-68",
    source: "new Worker(new URL(path,import.meta.url))",
    oldBuild: "refused",
    proposedBuild: "accepted",
    runtimeObligation:
      "final URL runtime-only, missing target refuses if construction requests it",
  },
  {
    name: "old-shadow-computed-69",
    source:
      'let entry=new URL("./lazy.js",import.meta.url);entry=globalThis.path;new Worker(entry)',
    oldBuild: "refused",
    proposedBuild: "accepted",
    runtimeObligation:
      "final URL runtime-only, missing target refuses if construction requests it",
  },
  {
    name: "old-shadow-computed-70",
    source: 'new Worker(new URL("./lazy.js",location.origin))',
    oldBuild: "refused",
    proposedBuild: "accepted",
    runtimeObligation:
      "final URL runtime-only, missing target refuses if construction requests it",
  },
  {
    name: "old-relative-missing-71",
    source: 'new Worker("./missing-worker.js",{type:"module"})',
    oldBuild: "refused",
    proposedBuild: "accepted",
    runtimeObligation:
      "document-relative string runtime-only; missing root/nested URL refuses",
  },
  {
    name: "old-relative-missing-72",
    source: 'new SharedWorker("./missing-worker.js")',
    oldBuild: "refused",
    proposedBuild: "accepted",
    runtimeObligation:
      "document-relative string runtime-only; missing root/nested URL refuses",
  },
  {
    name: "old-relative-missing-73",
    source: 'new globalThis["Worker"]("./missing-worker.js")',
    oldBuild: "refused",
    proposedBuild: "accepted",
    runtimeObligation:
      "document-relative string runtime-only; missing root/nested URL refuses",
  },
  {
    name: "old-explicit-positive-74",
    source: 'new Worker(new URL("./lazy.js",import.meta.url),{type:"module"})',
    oldBuild: "accepted",
    proposedBuild: "accepted",
    runtimeObligation:
      "authenticated explicit module URL works; omission retains static failure",
  },
  {
    name: "old-explicit-positive-75",
    source: 'new window.Worker(new URL("./lazy.js",import.meta.url))',
    oldBuild: "accepted",
    proposedBuild: "accepted",
    runtimeObligation:
      "authenticated explicit module URL works; omission retains static failure",
  },
  {
    name: "old-explicit-positive-76",
    source:
      'new globalThis["SharedWorker"](new URL("./lazy.js",import.meta.url))',
    oldBuild: "accepted",
    proposedBuild: "accepted",
    runtimeObligation:
      "authenticated explicit module URL works; omission retains static failure",
  },
  {
    name: "old-explicit-positive-77",
    source: 'new SharedWorker(new URL("./lazy.js",import.meta.url))',
    oldBuild: "accepted",
    proposedBuild: "accepted",
    runtimeObligation:
      "authenticated explicit module URL works; omission retains static failure",
  },
  {
    name: "old-explicit-positive-78",
    source:
      'const entry=new URL("./lazy.js",import.meta.url);new globalThis.Worker(entry)',
    oldBuild: "accepted",
    proposedBuild: "accepted",
    runtimeObligation:
      "authenticated explicit module URL works; omission retains static failure",
  },
  {
    name: "root-static-missing-79",
    source: 'new Worker("/missing-worker.js",{type:"module"})',
    oldBuild: "refused",
    proposedBuild: "refused",
    runtimeObligation: "root-absolute static missing-target refusal retained",
  },
  {
    name: "root-static-missing-80",
    source: 'new SharedWorker("/missing-worker.js")',
    oldBuild: "refused",
    proposedBuild: "refused",
    runtimeObligation: "root-absolute static missing-target refusal retained",
  },
  {
    name: "root-static-missing-81",
    source: 'new globalThis["Worker"]("/missing-worker.js")',
    oldBuild: "refused",
    proposedBuild: "refused",
    runtimeObligation: "root-absolute static missing-target refusal retained",
  },
  {
    name: "old-missing-alias-82",
    source: 'const Entry=Worker;new Entry("./missing-worker.js")',
    oldBuild: "refused",
    proposedBuild: "accepted",
    runtimeObligation: "missing document-base final URL refuses",
  },
  {
    name: "old-missing-alias-83",
    source: 'const Entry=globalThis.Worker;new Entry("./missing-worker.js")',
    oldBuild: "refused",
    proposedBuild: "accepted",
    runtimeObligation: "missing document-base final URL refuses",
  },
  {
    name: "old-missing-module-worker",
    source: 'new Worker(new URL("./missing-worker.js",import.meta.url))',
    oldBuild: "refused",
    proposedBuild: "refused",
    runtimeObligation: "recognized static missing-target refusal retained",
  },
] satisfies readonly AcquisitionProbe[];
