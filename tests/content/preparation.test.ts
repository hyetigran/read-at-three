import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import {
  canonical,
  parsePreparationPackage,
  parsePreparationAvailability,
  preparationPolicy,
} from "@readatthree/teaching";
import { createFixturePreparationPackage } from "../../tools/content/preparation.ts";
import { preparationResources } from "../../tools/content/preparation-resources.ts";
import { validatePreparationPackage } from "../../packages/teaching/src/generated-preparation-validators.js";
import type { RawPreparationPackage } from "../../packages/teaching/src/preparation-schemas.ts";
import { parseRequest } from "../../apps/web/src/platform/protocol.ts";

const hash = async (text: string) =>
  createHash("sha256").update(text).digest("hex");

function added(text: string) {
  return { copy: { kind: "added", text }, marks: [] };
}

test("a real synthetic preparation body produces its own verified acknowledgement identity", async () => {
  const provenance = {
    kind: "synthetic",
    reviewId: "fixture.preparation.review.v1",
    compositionHash: await hash("Synthetic preparation composition."),
    reviews: [],
    sources: [],
  };
  const body = {
    documentId: "fixture.preparation.v1",
    title: added("Fixture parent preparation"),
    reviewHash: await hash(canonical(provenance)),
    provenance,
    sections: [
      {
        id: "fixture.overview",
        title: added("Read together"),
        blocks: [
          {
            kind: "paragraph",
            id: "fixture.direction",
            role: "guidance",
            content: added("A parent reads these synthetic directions."),
          },
        ],
      },
    ],
    assets: [],
  };
  const preparationHash = await hash(canonical(body));
  const parsed = await parsePreparationPackage(
    { formatVersion: 1, preparationHash, body, assets: [] },
    hash,
  );
  assert.equal(parsed.preparationHash, preparationHash);
});

async function mutablePackage(): Promise<RawPreparationPackage> {
  const value: unknown = JSON.parse(
    canonical(await createFixturePreparationPackage()),
  );
  if (!validatePreparationPackage(value))
    throw new Error("Invalid fixture package.");
  return value;
}
async function rehash(value: RawPreparationPackage) {
  value.body.reviewHash = await hash(canonical(value.body.provenance));
  value.preparationHash = await hash(canonical(value.body));
  return value;
}

test("synthetic preparation retains its full body, provenance, structures and verified policy", async () => {
  const original = await mutablePackage();
  const document = await parsePreparationPackage(original, hash);
  assert.equal(
    document.preparationHash,
    "4b4a785901dbee18262fbfc42a9de2cbcf3fb2a96fdbfcd174f1f26dfa2bc2f6",
  );
  assert.deepEqual(document.body, original.body);
  assert.deepEqual(document.assets, original.assets);
  assert.equal(document.body.provenance.kind, "synthetic");
  assert.deepEqual(document.body.provenance.sources, []);
  assert.deepEqual(
    document.body.sections[0]?.blocks.map((block) => block.kind),
    ["paragraph", "list", "table", "diagram", "reference"],
  );
  const availability = await parsePreparationAvailability(
    { kind: "available", package: original },
    hash,
  );
  assert.equal(availability.kind, "available");
  assert.deepEqual(preparationPolicy(availability), {
    kind: "reviewed",
    hash: original.preparationHash,
  });
  original.body.title.copy.text = "Changed after verification.";
  assert.equal(document.body.title.copy.text, "Fixture parent preparation");
  assert.equal(Object.isFrozen(document.body.sections[0]?.blocks), true);
});

test("body, review and asset tampering and incomplete closure reject", async () => {
  for (const mutate of [
    (value: RawPreparationPackage) => {
      value.body.title.copy.text = "Tampered text.";
    },
    (value: RawPreparationPackage) => {
      value.body.reviewHash = "0".repeat(64);
    },
    (value: RawPreparationPackage) => {
      value.body.provenance.reviewId = "changed.review";
    },
    (value: RawPreparationPackage) => {
      const asset = value.assets[0];
      if (asset) asset.svg += " ";
    },
    (value: RawPreparationPackage) => {
      value.assets = [];
    },
  ]) {
    const value = await mutablePackage();
    mutate(value);
    await assert.rejects(parsePreparationPackage(value, hash));
  }
});

test("rehashed malformed tables, links, marks, provenance and asset paths reject", async () => {
  for (const mutate of [
    (value: RawPreparationPackage) => {
      const block = value.body.sections[0]?.blocks.find(
        (block) => block.kind === "table",
      );
      if (block?.kind === "table") block.headers.pop();
    },
    (value: RawPreparationPackage) => {
      const block = value.body.sections[0]?.blocks.find(
        (block) => block.kind === "reference",
      );
      if (block?.kind === "reference")
        block.target = { kind: "section", sectionId: "missing" };
    },
    (value: RawPreparationPackage) => {
      value.body.title.marks = [{ kind: "bold", start: 0, length: 6000 }];
    },
    (value: RawPreparationPackage) => {
      value.body.title.copy = {
        kind: "source",
        sourceRef: "unknown",
        text: "Unknown source.",
      };
    },
    (value: RawPreparationPackage) => {
      const asset = value.body.assets[0];
      if (asset) asset.path = "../outside.svg";
    },
    (value: RawPreparationPackage) => {
      value.body.sections.push(...value.body.sections);
    },
  ]) {
    const value = await mutablePackage();
    mutate(value);
    await assert.rejects(parsePreparationPackage(await rehash(value), hash));
  }
});

test("rich text marks accept complete supplementary characters and reject split surrogate pairs", async () => {
  const valid = await mutablePackage();
  valid.body.title.copy.text = "🐻";
  valid.body.title.marks = [{ kind: "bold", start: 0, length: 2 }];
  assert.equal(
    (await parsePreparationPackage(await rehash(valid), hash)).body.title.copy
      .text,
    "🐻",
  );
  for (const mark of [
    { kind: "bold", start: 0, length: 1 },
    { kind: "bold", start: 1, length: 1 },
  ] satisfies typeof valid.body.title.marks) {
    const value = await mutablePackage();
    value.body.title.copy.text = "🐻";
    value.body.title.marks = [mark];
    await assert.rejects(
      parsePreparationPackage(await rehash(value), hash),
      /Unicode/u,
    );
  }
});

test("strict SVG grammar refuses executable, external and malformed geometry even after rehash", async () => {
  for (const svg of [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50" aria-hidden="true" focusable="false"><script/></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50" aria-hidden="true" focusable="false"><g fill="#211b46" onclick="alert(1)"></g></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50" aria-hidden="true" focusable="false"><path d="M0 0L5"/></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50" aria-hidden="true" focusable="false"><image href="https://example.com/a.png"/></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50" aria-hidden="true" focusable="false"><g fill="#211b46"></svg>',
  ]) {
    const value = await mutablePackage(),
      asset = value.body.assets[0];
    if (!asset) throw new Error("Missing fixture asset.");
    asset.sha256 = await hash(svg);
    asset.path = `assets/${asset.sha256}.svg`;
    asset.byteLength = Buffer.byteLength(svg);
    value.assets = [{ path: asset.path, svg }];
    await assert.rejects(
      parsePreparationPackage(await rehash(value), hash),
      /SVG|path/u,
    );
  }
});

test("missing and invalid preparation never create a reviewed policy", async () => {
  assert.throws(
    () =>
      Reflect.apply(preparationPolicy, undefined, [
        { kind: "available", document: { preparationHash: "4".repeat(64) } },
      ]),
    /verified/u,
  );
  for (const input of [
    { kind: "unavailable", reason: "missing" },
    { kind: "available", package: { preparationHash: "4".repeat(64) } },
    { kind: "reviewed", hash: "4".repeat(64) },
  ]) {
    const result = await parsePreparationAvailability(input, hash);
    assert.equal(result.kind, "unavailable");
    assert.deepEqual(preparationPolicy(result), { kind: "unavailable" });
  }
  assert.throws(() =>
    parseRequest({
      id: "request",
      kind: "openRecovery",
      content: {},
      opening: { kind: "cold" },
      preparation: { kind: "reviewed", hash: "4".repeat(64) },
    }),
  );
  const wire = {
    id: "request",
    kind: "openRecovery",
    content: {},
    opening: { kind: "cold" },
    preparation: { kind: "available", package: await mutablePackage() },
  };
  assert.deepEqual(parseRequest(JSON.parse(JSON.stringify(wire))), wire);
});

test("Vite resources expose the verified closure and honest absent or invalid local data", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "preparation-resources-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const absent = await preparationResources({ mode: "local", root });
  assert.deepEqual(
    JSON.parse(absent.get("/preparation/development.json")?.source ?? "null"),
    { kind: "unavailable", reason: "missing" },
  );
  const fixture = await preparationResources({ mode: "fixture", root });
  const raw: unknown = JSON.parse(
    fixture.get("/preparation/development.json")?.source ?? "null",
  );
  const available = await parsePreparationAvailability(raw, hash);
  assert.equal(available.kind, "available");
  if (available.kind !== "available") throw new Error("Fixture unavailable.");
  assert.equal(fixture.size, available.document.assets.length + 1);
  for (const asset of available.document.assets)
    assert.equal(fixture.get(`/preparation/${asset.path}`)?.source, asset.svg);
  await mkdir(join(root, ".local/preparation"), { recursive: true });
  await writeFile(
    join(root, ".local/preparation/preparation-package.json"),
    canonical(available.document),
  );
  assert.deepEqual(
    await preparationResources({ mode: "local", root }),
    fixture,
  );
  await writeFile(
    join(root, ".local/preparation/preparation-package.json"),
    "{}",
  );
  const invalid = await preparationResources({ mode: "local", root });
  assert.equal(invalid.size, 1);
  assert.deepEqual(
    JSON.parse(invalid.get("/preparation/development.json")?.source ?? "null"),
    { kind: "unavailable", reason: "invalid" },
  );
});
