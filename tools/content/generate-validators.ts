import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Ajv2020 } from "ajv/dist/2020.js";
import { Ajv as AjvJTD } from "ajv/dist/jtd.js";
import standaloneCode from "ajv/dist/standalone/index.js";
import { format } from "prettier";
import { validatorSchemas } from "@readatthree/teaching/authoring";
import { profileValidationSchemas } from "../../packages/teaching/src/profile-schemas.ts";
import { selectionValidationSchemas } from "../../packages/teaching/src/selection-schemas.ts";

const arguments_ = process.argv.slice(2);
if (arguments_.some((argument) => argument !== "--check")) {
  throw new Error("Usage: generate-validators.ts [--check]");
}
const check = arguments_.includes("--check");
const directory = resolve(import.meta.dirname, "../../packages/teaching/src");
const domains = {
  validatePracticeControlsBinding: "PracticeControlsBinding",
  validatePracticeControlsSummary: "PracticeControlsSummary",
  validateDocumentToken: "DocumentToken",
  validateInkSnapshot: "InkSnapshot",
  validateRecoveryOpening: "RecoveryOpening",
  validateRecoveryChoice: "RecoveryChoice",
  validateRecoveryInventory: "RecoveryInventory",
  validateInkBrush: "BrushSpec",
  validateInkStrokeIds: "StrokeIdList",
  validateInkOperation: "InkOperation",
  validateInkCommand: "InkCommand",
  validateInkReceipt: "InkReceipt",
  validateApplicationRead: "ApplicationRead",
  validateHistoricalWork: "HistoricalWork",
  validatePackage: "DevelopmentPackage",
  validateCumulativePackage: "CumulativeDevelopmentPackage",
  validateState: "TeachingState",
  validateCommand: "TeachingCommand",
  validateReceipt: "CommitReceipt",
  validateProjection: "CommittedProjection",
  validateResult: "CommandResult",
} satisfies Record<keyof typeof validatorSchemas, string>;
const ajv = new Ajv2020({
  strict: true,
  inlineRefs: false,
  allErrors: true,
  code: { source: true, esm: true },
});
for (const [name, schema] of Object.entries(validatorSchemas)) {
  ajv.addSchema(schema, name);
}
const exports = Object.fromEntries(
  Object.keys(validatorSchemas).map((name) => [name, name]),
);
let javascript = standaloneCode(ajv, exports);

// Ajv emits a CommonJS reference for this one helper even with esm enabled.
// Replace only the reviewed helper; fail closed if a future upgrade adds others.
const unicodeHelper = 'require("ajv/dist/runtime/ucs2length").default';
if (javascript.includes(unicodeHelper)) {
  javascript =
    'import { unicodeLength } from "./unicode-length.ts";\n' +
    javascript.replaceAll(unicodeHelper, "unicodeLength");
}
if (/\b(?:require|eval|Function)\b/u.test(javascript)) {
  throw new Error(
    "Generated validators contain an unreviewed runtime dependency",
  );
}
const declarations =
  'import type { ValidateFunction } from "ajv";\n' +
  `import type { ${Object.values(domains).join(", ")} } from "./index.ts";\n` +
  Object.entries(domains)
    .map(
      ([name, domain]) =>
        `export declare const ${name}: ValidateFunction<${domain}>;`,
    )
    .join("\n");
const profileDomains = {
  validateLocalPreferences: "RawPreferences",
  validatePreparationPolicy: "RawPreparationPolicy",
  validateProfileDirectory: "RawProfileDirectory",
  validateProfileAdministrationCommand: "RawProfileAdministrationCommand",
  validateProfileAdministrationReceipt: "RawProfileAdministrationReceipt",
} satisfies Record<keyof typeof profileValidationSchemas, string>;
const profileAjv = new AjvJTD({
  allErrors: true,
  code: { source: true, esm: true },
});
for (const [name, schema] of Object.entries(profileValidationSchemas))
  profileAjv.addSchema(schema, name);
const profileJavascript = standaloneCode(
  profileAjv,
  Object.fromEntries(
    Object.keys(profileValidationSchemas).map((name) => [name, name]),
  ),
);
if (/\b(?:require|eval|Function)\b/u.test(profileJavascript))
  throw new Error(
    "Generated profile validators contain an unreviewed runtime dependency",
  );
const profileDeclarations =
  'import type { ValidateFunction } from "ajv";\n' +
  `import type { ${Object.values(profileDomains).join(", ")} } from "./profile-schemas.ts";\n` +
  Object.entries(profileDomains)
    .map(
      ([name, domain]) =>
        `export declare const ${name}: ValidateFunction<${domain}>;`,
    )
    .join("\n");
const selectionDomains = {
  validateSelectedOwnerWitness: "RawSelectedOwnerWitness",
  validateSelectedOperation: "RawSelectedOperation",
  validateSelectedReadTarget: "RawSelectedReadTarget",
  validateCurrentApplicationRead: "RawCurrentApplicationRead",
  validateCurrentResult: "RawCurrentResult",
  validateExecutionResult: "RawExecutionResult",
  validateSelectedRecoveryOpening: "RawSelectedRecoveryOpening",
  validateSelectedRecoveryInventory: "RawSelectedRecoveryInventory",
  validateRecoveryResult: "RawRecoveryResult",
  validateInkResult: "RawInkResult",
  validateSelectedWorkInput: "RawSelectedWorkInput",
  validateSelectedInkInput: "RawSelectedInkInput",
  validateSelectedControlsInput: "RawSelectedControlsInput",
  validateDepartureWitness: "RawDepartureWitness",
  validateProfileAdministrationResult: "RawProfileAdministrationResult",
  validateSelectedWorkerRequest: "RawSelectedWorkerRequest",
  validateSelectedWorkerResponse: "RawSelectedWorkerResponse",
} satisfies Record<keyof typeof selectionValidationSchemas, string>;
const selectionAjv = new AjvJTD({
  allErrors: true,
  code: { source: true, esm: true },
});
for (const [name, schema] of Object.entries(selectionValidationSchemas))
  selectionAjv.addSchema(schema, name);
const selectionJavascript = standaloneCode(
  selectionAjv,
  Object.fromEntries(
    Object.keys(selectionValidationSchemas).map((name) => [name, name]),
  ),
);
if (/\b(?:require|eval|Function)\b/u.test(selectionJavascript))
  throw new Error(
    "Generated selected validators contain an unreviewed runtime dependency",
  );
const selectionDeclarations =
  'import type { ValidateFunction } from "ajv";\n' +
  `import type { ${Object.values(selectionDomains).join(", ")} } from "./selection-schemas.ts";\n` +
  Object.entries(selectionDomains)
    .map(
      ([name, domain]) =>
        `export declare const ${name}: ValidateFunction<${domain}>;`,
    )
    .join("\n");
for (const { filename, source, parser } of [
  { filename: "generated-validators.js", source: javascript, parser: "babel" },
  {
    filename: "generated-validators.d.ts",
    source: declarations,
    parser: "typescript",
  },
  {
    filename: "generated-profile-validators.js",
    source: profileJavascript,
    parser: "babel",
  },
  {
    filename: "generated-profile-validators.d.ts",
    source: profileDeclarations,
    parser: "typescript",
  },
  {
    filename: "generated-selection-validators.js",
    source: selectionJavascript,
    parser: "babel",
  },
  {
    filename: "generated-selection-validators.d.ts",
    source: selectionDeclarations,
    parser: "typescript",
  },
]) {
  const expected = await format(source, { parser });
  const path = resolve(directory, filename);
  if (check) {
    const actual = await readFile(path, "utf8").catch((error: unknown) => {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        return undefined;
      }
      throw error;
    });
    if (actual !== expected) {
      throw new Error(`${filename} is stale; run npm run validators:generate`);
    }
  } else {
    await writeFile(path, expected);
  }
}
process.stdout.write(
  `Trusted validators ${check ? "are current" : "generated"}.\n`,
);
