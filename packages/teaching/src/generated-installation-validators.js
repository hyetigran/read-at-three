"use strict";
export const validateInitialInstallCommand = validate57;
const schema29 = {
  properties: {
    version: { type: "uint8" },
    kind: { enum: ["initialInstall"] },
    installationId: { type: "string" },
    commandId: { type: "string" },
    source: { properties: { mode: { enum: ["fixture", "publication"] } } },
    target: {
      properties: {
        publicationHash: { type: "string" },
        courseId: { type: "string" },
        releaseId: { type: "string" },
      },
    },
    expected: {
      discriminator: "kind",
      mapping: {
        absent: { properties: {} },
        present: {
          properties: {
            revision: { type: "string" },
            activePackageHash: { type: "string" },
            fallbackPackageHash: { type: "string", nullable: true },
          },
        },
      },
    },
  },
};
function validate57(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  let valid0 = false;
  if (data && typeof data == "object" && !Array.isArray(data)) {
    valid0 = true;
    if (data.version !== undefined) {
      let data0 = data.version;
      if (!(
        typeof data0 == "number" &&
        isFinite(data0) &&
        !(data0 % 1) &&
        data0 >= 0 &&
        data0 <= 255
      )) {
        const err0 = {
          instancePath: instancePath + "/version",
          schemaPath: "/properties/version/type",
          keyword: "type",
          params: { type: "uint8", nullable: false },
          message: "must be uint8",
        };
        if (vErrors === null) {
          vErrors = [err0];
        } else {
          vErrors.push(err0);
        }
        errors++;
      }
    } else {
      const err1 = {
        instancePath,
        schemaPath: "/properties/version",
        keyword: "properties",
        params: { error: "missing", missingProperty: "version" },
        message: "must have property 'version'",
      };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.kind !== undefined) {
      let data1 = data.kind;
      if (!(typeof data1 == "string" && data1 === "initialInstall")) {
        const err2 = {
          instancePath: instancePath + "/kind",
          schemaPath: "/properties/kind/enum",
          keyword: "enum",
          params: { allowedValues: schema29.properties.kind.enum },
          message: "must be equal to one of the allowed values",
        };
        if (vErrors === null) {
          vErrors = [err2];
        } else {
          vErrors.push(err2);
        }
        errors++;
      }
    } else {
      const err3 = {
        instancePath,
        schemaPath: "/properties/kind",
        keyword: "properties",
        params: { error: "missing", missingProperty: "kind" },
        message: "must have property 'kind'",
      };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    if (data.installationId !== undefined) {
      if (!(typeof data.installationId == "string")) {
        const err4 = {
          instancePath: instancePath + "/installationId",
          schemaPath: "/properties/installationId/type",
          keyword: "type",
          params: { type: "string", nullable: false },
          message: "must be string",
        };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    } else {
      const err5 = {
        instancePath,
        schemaPath: "/properties/installationId",
        keyword: "properties",
        params: { error: "missing", missingProperty: "installationId" },
        message: "must have property 'installationId'",
      };
      if (vErrors === null) {
        vErrors = [err5];
      } else {
        vErrors.push(err5);
      }
      errors++;
    }
    if (data.commandId !== undefined) {
      if (!(typeof data.commandId == "string")) {
        const err6 = {
          instancePath: instancePath + "/commandId",
          schemaPath: "/properties/commandId/type",
          keyword: "type",
          params: { type: "string", nullable: false },
          message: "must be string",
        };
        if (vErrors === null) {
          vErrors = [err6];
        } else {
          vErrors.push(err6);
        }
        errors++;
      }
    } else {
      const err7 = {
        instancePath,
        schemaPath: "/properties/commandId",
        keyword: "properties",
        params: { error: "missing", missingProperty: "commandId" },
        message: "must have property 'commandId'",
      };
      if (vErrors === null) {
        vErrors = [err7];
      } else {
        vErrors.push(err7);
      }
      errors++;
    }
    if (data.source !== undefined) {
      let data4 = data.source;
      let valid2 = false;
      if (data4 && typeof data4 == "object" && !Array.isArray(data4)) {
        valid2 = true;
        if (data4.mode !== undefined) {
          let data5 = data4.mode;
          if (!(
            typeof data5 == "string" &&
            (data5 === "fixture" || data5 === "publication")
          )) {
            const err8 = {
              instancePath: instancePath + "/source/mode",
              schemaPath: "/properties/source/properties/mode/enum",
              keyword: "enum",
              params: {
                allowedValues: schema29.properties.source.properties.mode.enum,
              },
              message: "must be equal to one of the allowed values",
            };
            if (vErrors === null) {
              vErrors = [err8];
            } else {
              vErrors.push(err8);
            }
            errors++;
          }
        } else {
          const err9 = {
            instancePath: instancePath + "/source",
            schemaPath: "/properties/source/properties/mode",
            keyword: "properties",
            params: { error: "missing", missingProperty: "mode" },
            message: "must have property 'mode'",
          };
          if (vErrors === null) {
            vErrors = [err9];
          } else {
            vErrors.push(err9);
          }
          errors++;
        }
        for (const key0 in data4) {
          if (key0 !== "mode") {
            const err10 = {
              instancePath:
                instancePath +
                "/source/" +
                key0.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/properties/source",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key0 },
              message: "must NOT have additional properties",
            };
            if (vErrors === null) {
              vErrors = [err10];
            } else {
              vErrors.push(err10);
            }
            errors++;
          }
        }
      }
      if (!valid2) {
        const err11 = {
          instancePath: instancePath + "/source",
          schemaPath: "/properties/source/properties",
          keyword: "properties",
          params: { type: "object", nullable: false },
          message: "must be object",
        };
        if (vErrors === null) {
          vErrors = [err11];
        } else {
          vErrors.push(err11);
        }
        errors++;
      }
    } else {
      const err12 = {
        instancePath,
        schemaPath: "/properties/source",
        keyword: "properties",
        params: { error: "missing", missingProperty: "source" },
        message: "must have property 'source'",
      };
      if (vErrors === null) {
        vErrors = [err12];
      } else {
        vErrors.push(err12);
      }
      errors++;
    }
    if (data.target !== undefined) {
      let data6 = data.target;
      let valid5 = false;
      if (data6 && typeof data6 == "object" && !Array.isArray(data6)) {
        valid5 = true;
        if (data6.publicationHash !== undefined) {
          if (!(typeof data6.publicationHash == "string")) {
            const err13 = {
              instancePath: instancePath + "/target/publicationHash",
              schemaPath: "/properties/target/properties/publicationHash/type",
              keyword: "type",
              params: { type: "string", nullable: false },
              message: "must be string",
            };
            if (vErrors === null) {
              vErrors = [err13];
            } else {
              vErrors.push(err13);
            }
            errors++;
          }
        } else {
          const err14 = {
            instancePath: instancePath + "/target",
            schemaPath: "/properties/target/properties/publicationHash",
            keyword: "properties",
            params: { error: "missing", missingProperty: "publicationHash" },
            message: "must have property 'publicationHash'",
          };
          if (vErrors === null) {
            vErrors = [err14];
          } else {
            vErrors.push(err14);
          }
          errors++;
        }
        if (data6.courseId !== undefined) {
          if (!(typeof data6.courseId == "string")) {
            const err15 = {
              instancePath: instancePath + "/target/courseId",
              schemaPath: "/properties/target/properties/courseId/type",
              keyword: "type",
              params: { type: "string", nullable: false },
              message: "must be string",
            };
            if (vErrors === null) {
              vErrors = [err15];
            } else {
              vErrors.push(err15);
            }
            errors++;
          }
        } else {
          const err16 = {
            instancePath: instancePath + "/target",
            schemaPath: "/properties/target/properties/courseId",
            keyword: "properties",
            params: { error: "missing", missingProperty: "courseId" },
            message: "must have property 'courseId'",
          };
          if (vErrors === null) {
            vErrors = [err16];
          } else {
            vErrors.push(err16);
          }
          errors++;
        }
        if (data6.releaseId !== undefined) {
          if (!(typeof data6.releaseId == "string")) {
            const err17 = {
              instancePath: instancePath + "/target/releaseId",
              schemaPath: "/properties/target/properties/releaseId/type",
              keyword: "type",
              params: { type: "string", nullable: false },
              message: "must be string",
            };
            if (vErrors === null) {
              vErrors = [err17];
            } else {
              vErrors.push(err17);
            }
            errors++;
          }
        } else {
          const err18 = {
            instancePath: instancePath + "/target",
            schemaPath: "/properties/target/properties/releaseId",
            keyword: "properties",
            params: { error: "missing", missingProperty: "releaseId" },
            message: "must have property 'releaseId'",
          };
          if (vErrors === null) {
            vErrors = [err18];
          } else {
            vErrors.push(err18);
          }
          errors++;
        }
        for (const key1 in data6) {
          if (
            key1 !== "publicationHash" &&
            key1 !== "courseId" &&
            key1 !== "releaseId"
          ) {
            const err19 = {
              instancePath:
                instancePath +
                "/target/" +
                key1.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/properties/target",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key1 },
              message: "must NOT have additional properties",
            };
            if (vErrors === null) {
              vErrors = [err19];
            } else {
              vErrors.push(err19);
            }
            errors++;
          }
        }
      }
      if (!valid5) {
        const err20 = {
          instancePath: instancePath + "/target",
          schemaPath: "/properties/target/properties",
          keyword: "properties",
          params: { type: "object", nullable: false },
          message: "must be object",
        };
        if (vErrors === null) {
          vErrors = [err20];
        } else {
          vErrors.push(err20);
        }
        errors++;
      }
    } else {
      const err21 = {
        instancePath,
        schemaPath: "/properties/target",
        keyword: "properties",
        params: { error: "missing", missingProperty: "target" },
        message: "must have property 'target'",
      };
      if (vErrors === null) {
        vErrors = [err21];
      } else {
        vErrors.push(err21);
      }
      errors++;
    }
    if (data.expected !== undefined) {
      let data10 = data.expected;
      let valid8 = false;
      if (data10 && typeof data10 == "object" && !Array.isArray(data10)) {
        const tag0 = data10.kind;
        if (tag0 === undefined) {
          const err22 = {
            instancePath: instancePath + "/expected",
            schemaPath: "/properties/expected/discriminator",
            keyword: "discriminator",
            params: { error: "tag", tag: "kind", tagValue: tag0 },
            message: 'tag "kind" must be string',
          };
          if (vErrors === null) {
            vErrors = [err22];
          } else {
            vErrors.push(err22);
          }
          errors++;
        } else if (typeof tag0 == "string") {
          if (tag0 === "absent") {
            const _errs11 = errors;
            let valid10 = false;
            valid10 = true;
            for (const key2 in data10) {
              if (key2 !== "kind") {
                const err23 = {
                  instancePath:
                    instancePath +
                    "/expected/" +
                    key2.replace(/~/g, "~0").replace(/\//g, "~1"),
                  schemaPath: "/properties/expected/mapping/absent",
                  keyword: "properties",
                  params: { error: "additional", additionalProperty: key2 },
                  message: "must NOT have additional properties",
                };
                if (vErrors === null) {
                  vErrors = [err23];
                } else {
                  vErrors.push(err23);
                }
                errors++;
              }
            }
            if (!valid10) {
              const err24 = {
                instancePath: instancePath + "/expected",
                schemaPath: "/properties/expected/mapping/absent/properties",
                keyword: "properties",
                params: { type: "object", nullable: false },
                message: "must be object",
              };
              if (vErrors === null) {
                vErrors = [err24];
              } else {
                vErrors.push(err24);
              }
              errors++;
            }
            var valid9 = _errs11 === errors;
            valid8 = valid9;
          } else if (tag0 === "present") {
            const _errs12 = errors;
            let valid14 = false;
            valid14 = true;
            if (data10.revision !== undefined) {
              if (!(typeof data10.revision == "string")) {
                const err25 = {
                  instancePath: instancePath + "/expected/revision",
                  schemaPath:
                    "/properties/expected/mapping/present/properties/revision/type",
                  keyword: "type",
                  params: { type: "string", nullable: false },
                  message: "must be string",
                };
                if (vErrors === null) {
                  vErrors = [err25];
                } else {
                  vErrors.push(err25);
                }
                errors++;
              }
            } else {
              const err26 = {
                instancePath: instancePath + "/expected",
                schemaPath:
                  "/properties/expected/mapping/present/properties/revision",
                keyword: "properties",
                params: { error: "missing", missingProperty: "revision" },
                message: "must have property 'revision'",
              };
              if (vErrors === null) {
                vErrors = [err26];
              } else {
                vErrors.push(err26);
              }
              errors++;
            }
            if (data10.activePackageHash !== undefined) {
              if (!(typeof data10.activePackageHash == "string")) {
                const err27 = {
                  instancePath: instancePath + "/expected/activePackageHash",
                  schemaPath:
                    "/properties/expected/mapping/present/properties/activePackageHash/type",
                  keyword: "type",
                  params: { type: "string", nullable: false },
                  message: "must be string",
                };
                if (vErrors === null) {
                  vErrors = [err27];
                } else {
                  vErrors.push(err27);
                }
                errors++;
              }
            } else {
              const err28 = {
                instancePath: instancePath + "/expected",
                schemaPath:
                  "/properties/expected/mapping/present/properties/activePackageHash",
                keyword: "properties",
                params: {
                  error: "missing",
                  missingProperty: "activePackageHash",
                },
                message: "must have property 'activePackageHash'",
              };
              if (vErrors === null) {
                vErrors = [err28];
              } else {
                vErrors.push(err28);
              }
              errors++;
            }
            if (data10.fallbackPackageHash !== undefined) {
              let data13 = data10.fallbackPackageHash;
              if (!(data13 === null || typeof data13 == "string")) {
                const err29 = {
                  instancePath: instancePath + "/expected/fallbackPackageHash",
                  schemaPath:
                    "/properties/expected/mapping/present/properties/fallbackPackageHash/type",
                  keyword: "type",
                  params: { type: "string", nullable: true },
                  message: "must be string or null",
                };
                if (vErrors === null) {
                  vErrors = [err29];
                } else {
                  vErrors.push(err29);
                }
                errors++;
              }
            } else {
              const err30 = {
                instancePath: instancePath + "/expected",
                schemaPath:
                  "/properties/expected/mapping/present/properties/fallbackPackageHash",
                keyword: "properties",
                params: {
                  error: "missing",
                  missingProperty: "fallbackPackageHash",
                },
                message: "must have property 'fallbackPackageHash'",
              };
              if (vErrors === null) {
                vErrors = [err30];
              } else {
                vErrors.push(err30);
              }
              errors++;
            }
            for (const key3 in data10) {
              if (
                key3 !== "kind" &&
                key3 !== "revision" &&
                key3 !== "activePackageHash" &&
                key3 !== "fallbackPackageHash"
              ) {
                const err31 = {
                  instancePath:
                    instancePath +
                    "/expected/" +
                    key3.replace(/~/g, "~0").replace(/\//g, "~1"),
                  schemaPath: "/properties/expected/mapping/present",
                  keyword: "properties",
                  params: { error: "additional", additionalProperty: key3 },
                  message: "must NOT have additional properties",
                };
                if (vErrors === null) {
                  vErrors = [err31];
                } else {
                  vErrors.push(err31);
                }
                errors++;
              }
            }
            if (!valid14) {
              const err32 = {
                instancePath: instancePath + "/expected",
                schemaPath: "/properties/expected/mapping/present/properties",
                keyword: "properties",
                params: { type: "object", nullable: false },
                message: "must be object",
              };
              if (vErrors === null) {
                vErrors = [err32];
              } else {
                vErrors.push(err32);
              }
              errors++;
            }
            var valid13 = _errs12 === errors;
            valid8 = valid13;
          } else {
            const err33 = {
              instancePath: instancePath + "/expected/kind",
              schemaPath: "/properties/expected/mapping",
              keyword: "discriminator",
              params: { error: "mapping", tag: "kind", tagValue: tag0 },
              message: 'value of tag "kind" must be in mapping',
            };
            if (vErrors === null) {
              vErrors = [err33];
            } else {
              vErrors.push(err33);
            }
            errors++;
          }
        } else {
          const err34 = {
            instancePath: instancePath + "/expected/kind",
            schemaPath: "/properties/expected/discriminator",
            keyword: "discriminator",
            params: { error: "tag", tag: "kind", tagValue: tag0 },
            message: 'tag "kind" must be string',
          };
          if (vErrors === null) {
            vErrors = [err34];
          } else {
            vErrors.push(err34);
          }
          errors++;
        }
      } else if (!valid8) {
        const err35 = {
          instancePath: instancePath + "/expected",
          schemaPath: "/properties/expected/discriminator",
          keyword: "discriminator",
          params: { type: "object", nullable: false },
          message: "must be object",
        };
        if (vErrors === null) {
          vErrors = [err35];
        } else {
          vErrors.push(err35);
        }
        errors++;
      }
    } else {
      const err36 = {
        instancePath,
        schemaPath: "/properties/expected",
        keyword: "properties",
        params: { error: "missing", missingProperty: "expected" },
        message: "must have property 'expected'",
      };
      if (vErrors === null) {
        vErrors = [err36];
      } else {
        vErrors.push(err36);
      }
      errors++;
    }
    for (const key4 in data) {
      if (
        key4 !== "version" &&
        key4 !== "kind" &&
        key4 !== "installationId" &&
        key4 !== "commandId" &&
        key4 !== "source" &&
        key4 !== "target" &&
        key4 !== "expected"
      ) {
        const err37 = {
          instancePath:
            instancePath + "/" + key4.replace(/~/g, "~0").replace(/\//g, "~1"),
          schemaPath: "",
          keyword: "properties",
          params: { error: "additional", additionalProperty: key4 },
          message: "must NOT have additional properties",
        };
        if (vErrors === null) {
          vErrors = [err37];
        } else {
          vErrors.push(err37);
        }
        errors++;
      }
    }
  }
  if (!valid0) {
    const err38 = {
      instancePath,
      schemaPath: "/properties",
      keyword: "properties",
      params: { type: "object", nullable: false },
      message: "must be object",
    };
    if (vErrors === null) {
      vErrors = [err38];
    } else {
      vErrors.push(err38);
    }
    errors++;
  }
  validate57.errors = vErrors;
  return errors === 0;
}
export const validateInstallationFact = validate58;
const schema30 = {
  discriminator: "kind",
  mapping: {
    accepted: {
      properties: {
        version: { type: "uint8" },
        installationId: { type: "string" },
        commandId: { type: "string" },
        payloadHash: { type: "string" },
        targetPackageHash: { type: "string" },
      },
    },
    readyInactive: {
      properties: {
        version: { type: "uint8" },
        installationId: { type: "string" },
        commandId: { type: "string" },
        payloadHash: { type: "string" },
        registeredPackageHash: { type: "string" },
      },
    },
    activated: {
      properties: {
        version: { type: "uint8" },
        installationId: { type: "string" },
        commandId: { type: "string" },
        payloadHash: { type: "string" },
        registeredPackageHash: { type: "string" },
        activationRevision: { type: "string" },
      },
    },
    rejected: {
      properties: {
        version: { type: "uint8" },
        installationId: { type: "string" },
        commandId: { type: "string" },
        payloadHash: { type: "string" },
        registeredPackageHash: { type: "string", nullable: true },
        reason: {
          enum: [
            "courseAlreadyActive",
            "activationChanged",
            "releaseIdentityConflict",
            "packageIdentityConflict",
            "unsupportedInstallProfile",
          ],
        },
      },
    },
  },
};
function validate58(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  let valid0 = false;
  if (data && typeof data == "object" && !Array.isArray(data)) {
    const tag0 = data.kind;
    if (tag0 === undefined) {
      const err0 = {
        instancePath,
        schemaPath: "/discriminator",
        keyword: "discriminator",
        params: { error: "tag", tag: "kind", tagValue: tag0 },
        message: 'tag "kind" must be string',
      };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    } else if (typeof tag0 == "string") {
      if (tag0 === "accepted") {
        const _errs0 = errors;
        let valid2 = false;
        valid2 = true;
        if (data.version !== undefined) {
          let data0 = data.version;
          if (!(
            typeof data0 == "number" &&
            isFinite(data0) &&
            !(data0 % 1) &&
            data0 >= 0 &&
            data0 <= 255
          )) {
            const err1 = {
              instancePath: instancePath + "/version",
              schemaPath: "/mapping/accepted/properties/version/type",
              keyword: "type",
              params: { type: "uint8", nullable: false },
              message: "must be uint8",
            };
            if (vErrors === null) {
              vErrors = [err1];
            } else {
              vErrors.push(err1);
            }
            errors++;
          }
        } else {
          const err2 = {
            instancePath,
            schemaPath: "/mapping/accepted/properties/version",
            keyword: "properties",
            params: { error: "missing", missingProperty: "version" },
            message: "must have property 'version'",
          };
          if (vErrors === null) {
            vErrors = [err2];
          } else {
            vErrors.push(err2);
          }
          errors++;
        }
        if (data.installationId !== undefined) {
          if (!(typeof data.installationId == "string")) {
            const err3 = {
              instancePath: instancePath + "/installationId",
              schemaPath: "/mapping/accepted/properties/installationId/type",
              keyword: "type",
              params: { type: "string", nullable: false },
              message: "must be string",
            };
            if (vErrors === null) {
              vErrors = [err3];
            } else {
              vErrors.push(err3);
            }
            errors++;
          }
        } else {
          const err4 = {
            instancePath,
            schemaPath: "/mapping/accepted/properties/installationId",
            keyword: "properties",
            params: { error: "missing", missingProperty: "installationId" },
            message: "must have property 'installationId'",
          };
          if (vErrors === null) {
            vErrors = [err4];
          } else {
            vErrors.push(err4);
          }
          errors++;
        }
        if (data.commandId !== undefined) {
          if (!(typeof data.commandId == "string")) {
            const err5 = {
              instancePath: instancePath + "/commandId",
              schemaPath: "/mapping/accepted/properties/commandId/type",
              keyword: "type",
              params: { type: "string", nullable: false },
              message: "must be string",
            };
            if (vErrors === null) {
              vErrors = [err5];
            } else {
              vErrors.push(err5);
            }
            errors++;
          }
        } else {
          const err6 = {
            instancePath,
            schemaPath: "/mapping/accepted/properties/commandId",
            keyword: "properties",
            params: { error: "missing", missingProperty: "commandId" },
            message: "must have property 'commandId'",
          };
          if (vErrors === null) {
            vErrors = [err6];
          } else {
            vErrors.push(err6);
          }
          errors++;
        }
        if (data.payloadHash !== undefined) {
          if (!(typeof data.payloadHash == "string")) {
            const err7 = {
              instancePath: instancePath + "/payloadHash",
              schemaPath: "/mapping/accepted/properties/payloadHash/type",
              keyword: "type",
              params: { type: "string", nullable: false },
              message: "must be string",
            };
            if (vErrors === null) {
              vErrors = [err7];
            } else {
              vErrors.push(err7);
            }
            errors++;
          }
        } else {
          const err8 = {
            instancePath,
            schemaPath: "/mapping/accepted/properties/payloadHash",
            keyword: "properties",
            params: { error: "missing", missingProperty: "payloadHash" },
            message: "must have property 'payloadHash'",
          };
          if (vErrors === null) {
            vErrors = [err8];
          } else {
            vErrors.push(err8);
          }
          errors++;
        }
        if (data.targetPackageHash !== undefined) {
          if (!(typeof data.targetPackageHash == "string")) {
            const err9 = {
              instancePath: instancePath + "/targetPackageHash",
              schemaPath: "/mapping/accepted/properties/targetPackageHash/type",
              keyword: "type",
              params: { type: "string", nullable: false },
              message: "must be string",
            };
            if (vErrors === null) {
              vErrors = [err9];
            } else {
              vErrors.push(err9);
            }
            errors++;
          }
        } else {
          const err10 = {
            instancePath,
            schemaPath: "/mapping/accepted/properties/targetPackageHash",
            keyword: "properties",
            params: { error: "missing", missingProperty: "targetPackageHash" },
            message: "must have property 'targetPackageHash'",
          };
          if (vErrors === null) {
            vErrors = [err10];
          } else {
            vErrors.push(err10);
          }
          errors++;
        }
        for (const key0 in data) {
          if (
            key0 !== "kind" &&
            key0 !== "version" &&
            key0 !== "installationId" &&
            key0 !== "commandId" &&
            key0 !== "payloadHash" &&
            key0 !== "targetPackageHash"
          ) {
            const err11 = {
              instancePath:
                instancePath +
                "/" +
                key0.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/accepted",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key0 },
              message: "must NOT have additional properties",
            };
            if (vErrors === null) {
              vErrors = [err11];
            } else {
              vErrors.push(err11);
            }
            errors++;
          }
        }
        if (!valid2) {
          const err12 = {
            instancePath,
            schemaPath: "/mapping/accepted/properties",
            keyword: "properties",
            params: { type: "object", nullable: false },
            message: "must be object",
          };
          if (vErrors === null) {
            vErrors = [err12];
          } else {
            vErrors.push(err12);
          }
          errors++;
        }
        var valid1 = _errs0 === errors;
        valid0 = valid1;
      } else if (tag0 === "readyInactive") {
        const _errs6 = errors;
        let valid6 = false;
        valid6 = true;
        if (data.version !== undefined) {
          let data5 = data.version;
          if (!(
            typeof data5 == "number" &&
            isFinite(data5) &&
            !(data5 % 1) &&
            data5 >= 0 &&
            data5 <= 255
          )) {
            const err13 = {
              instancePath: instancePath + "/version",
              schemaPath: "/mapping/readyInactive/properties/version/type",
              keyword: "type",
              params: { type: "uint8", nullable: false },
              message: "must be uint8",
            };
            if (vErrors === null) {
              vErrors = [err13];
            } else {
              vErrors.push(err13);
            }
            errors++;
          }
        } else {
          const err14 = {
            instancePath,
            schemaPath: "/mapping/readyInactive/properties/version",
            keyword: "properties",
            params: { error: "missing", missingProperty: "version" },
            message: "must have property 'version'",
          };
          if (vErrors === null) {
            vErrors = [err14];
          } else {
            vErrors.push(err14);
          }
          errors++;
        }
        if (data.installationId !== undefined) {
          if (!(typeof data.installationId == "string")) {
            const err15 = {
              instancePath: instancePath + "/installationId",
              schemaPath:
                "/mapping/readyInactive/properties/installationId/type",
              keyword: "type",
              params: { type: "string", nullable: false },
              message: "must be string",
            };
            if (vErrors === null) {
              vErrors = [err15];
            } else {
              vErrors.push(err15);
            }
            errors++;
          }
        } else {
          const err16 = {
            instancePath,
            schemaPath: "/mapping/readyInactive/properties/installationId",
            keyword: "properties",
            params: { error: "missing", missingProperty: "installationId" },
            message: "must have property 'installationId'",
          };
          if (vErrors === null) {
            vErrors = [err16];
          } else {
            vErrors.push(err16);
          }
          errors++;
        }
        if (data.commandId !== undefined) {
          if (!(typeof data.commandId == "string")) {
            const err17 = {
              instancePath: instancePath + "/commandId",
              schemaPath: "/mapping/readyInactive/properties/commandId/type",
              keyword: "type",
              params: { type: "string", nullable: false },
              message: "must be string",
            };
            if (vErrors === null) {
              vErrors = [err17];
            } else {
              vErrors.push(err17);
            }
            errors++;
          }
        } else {
          const err18 = {
            instancePath,
            schemaPath: "/mapping/readyInactive/properties/commandId",
            keyword: "properties",
            params: { error: "missing", missingProperty: "commandId" },
            message: "must have property 'commandId'",
          };
          if (vErrors === null) {
            vErrors = [err18];
          } else {
            vErrors.push(err18);
          }
          errors++;
        }
        if (data.payloadHash !== undefined) {
          if (!(typeof data.payloadHash == "string")) {
            const err19 = {
              instancePath: instancePath + "/payloadHash",
              schemaPath: "/mapping/readyInactive/properties/payloadHash/type",
              keyword: "type",
              params: { type: "string", nullable: false },
              message: "must be string",
            };
            if (vErrors === null) {
              vErrors = [err19];
            } else {
              vErrors.push(err19);
            }
            errors++;
          }
        } else {
          const err20 = {
            instancePath,
            schemaPath: "/mapping/readyInactive/properties/payloadHash",
            keyword: "properties",
            params: { error: "missing", missingProperty: "payloadHash" },
            message: "must have property 'payloadHash'",
          };
          if (vErrors === null) {
            vErrors = [err20];
          } else {
            vErrors.push(err20);
          }
          errors++;
        }
        if (data.registeredPackageHash !== undefined) {
          if (!(typeof data.registeredPackageHash == "string")) {
            const err21 = {
              instancePath: instancePath + "/registeredPackageHash",
              schemaPath:
                "/mapping/readyInactive/properties/registeredPackageHash/type",
              keyword: "type",
              params: { type: "string", nullable: false },
              message: "must be string",
            };
            if (vErrors === null) {
              vErrors = [err21];
            } else {
              vErrors.push(err21);
            }
            errors++;
          }
        } else {
          const err22 = {
            instancePath,
            schemaPath:
              "/mapping/readyInactive/properties/registeredPackageHash",
            keyword: "properties",
            params: {
              error: "missing",
              missingProperty: "registeredPackageHash",
            },
            message: "must have property 'registeredPackageHash'",
          };
          if (vErrors === null) {
            vErrors = [err22];
          } else {
            vErrors.push(err22);
          }
          errors++;
        }
        for (const key1 in data) {
          if (
            key1 !== "kind" &&
            key1 !== "version" &&
            key1 !== "installationId" &&
            key1 !== "commandId" &&
            key1 !== "payloadHash" &&
            key1 !== "registeredPackageHash"
          ) {
            const err23 = {
              instancePath:
                instancePath +
                "/" +
                key1.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/readyInactive",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key1 },
              message: "must NOT have additional properties",
            };
            if (vErrors === null) {
              vErrors = [err23];
            } else {
              vErrors.push(err23);
            }
            errors++;
          }
        }
        if (!valid6) {
          const err24 = {
            instancePath,
            schemaPath: "/mapping/readyInactive/properties",
            keyword: "properties",
            params: { type: "object", nullable: false },
            message: "must be object",
          };
          if (vErrors === null) {
            vErrors = [err24];
          } else {
            vErrors.push(err24);
          }
          errors++;
        }
        var valid5 = _errs6 === errors;
        valid0 = valid5;
      } else if (tag0 === "activated") {
        const _errs12 = errors;
        let valid10 = false;
        valid10 = true;
        if (data.version !== undefined) {
          let data10 = data.version;
          if (!(
            typeof data10 == "number" &&
            isFinite(data10) &&
            !(data10 % 1) &&
            data10 >= 0 &&
            data10 <= 255
          )) {
            const err25 = {
              instancePath: instancePath + "/version",
              schemaPath: "/mapping/activated/properties/version/type",
              keyword: "type",
              params: { type: "uint8", nullable: false },
              message: "must be uint8",
            };
            if (vErrors === null) {
              vErrors = [err25];
            } else {
              vErrors.push(err25);
            }
            errors++;
          }
        } else {
          const err26 = {
            instancePath,
            schemaPath: "/mapping/activated/properties/version",
            keyword: "properties",
            params: { error: "missing", missingProperty: "version" },
            message: "must have property 'version'",
          };
          if (vErrors === null) {
            vErrors = [err26];
          } else {
            vErrors.push(err26);
          }
          errors++;
        }
        if (data.installationId !== undefined) {
          if (!(typeof data.installationId == "string")) {
            const err27 = {
              instancePath: instancePath + "/installationId",
              schemaPath: "/mapping/activated/properties/installationId/type",
              keyword: "type",
              params: { type: "string", nullable: false },
              message: "must be string",
            };
            if (vErrors === null) {
              vErrors = [err27];
            } else {
              vErrors.push(err27);
            }
            errors++;
          }
        } else {
          const err28 = {
            instancePath,
            schemaPath: "/mapping/activated/properties/installationId",
            keyword: "properties",
            params: { error: "missing", missingProperty: "installationId" },
            message: "must have property 'installationId'",
          };
          if (vErrors === null) {
            vErrors = [err28];
          } else {
            vErrors.push(err28);
          }
          errors++;
        }
        if (data.commandId !== undefined) {
          if (!(typeof data.commandId == "string")) {
            const err29 = {
              instancePath: instancePath + "/commandId",
              schemaPath: "/mapping/activated/properties/commandId/type",
              keyword: "type",
              params: { type: "string", nullable: false },
              message: "must be string",
            };
            if (vErrors === null) {
              vErrors = [err29];
            } else {
              vErrors.push(err29);
            }
            errors++;
          }
        } else {
          const err30 = {
            instancePath,
            schemaPath: "/mapping/activated/properties/commandId",
            keyword: "properties",
            params: { error: "missing", missingProperty: "commandId" },
            message: "must have property 'commandId'",
          };
          if (vErrors === null) {
            vErrors = [err30];
          } else {
            vErrors.push(err30);
          }
          errors++;
        }
        if (data.payloadHash !== undefined) {
          if (!(typeof data.payloadHash == "string")) {
            const err31 = {
              instancePath: instancePath + "/payloadHash",
              schemaPath: "/mapping/activated/properties/payloadHash/type",
              keyword: "type",
              params: { type: "string", nullable: false },
              message: "must be string",
            };
            if (vErrors === null) {
              vErrors = [err31];
            } else {
              vErrors.push(err31);
            }
            errors++;
          }
        } else {
          const err32 = {
            instancePath,
            schemaPath: "/mapping/activated/properties/payloadHash",
            keyword: "properties",
            params: { error: "missing", missingProperty: "payloadHash" },
            message: "must have property 'payloadHash'",
          };
          if (vErrors === null) {
            vErrors = [err32];
          } else {
            vErrors.push(err32);
          }
          errors++;
        }
        if (data.registeredPackageHash !== undefined) {
          if (!(typeof data.registeredPackageHash == "string")) {
            const err33 = {
              instancePath: instancePath + "/registeredPackageHash",
              schemaPath:
                "/mapping/activated/properties/registeredPackageHash/type",
              keyword: "type",
              params: { type: "string", nullable: false },
              message: "must be string",
            };
            if (vErrors === null) {
              vErrors = [err33];
            } else {
              vErrors.push(err33);
            }
            errors++;
          }
        } else {
          const err34 = {
            instancePath,
            schemaPath: "/mapping/activated/properties/registeredPackageHash",
            keyword: "properties",
            params: {
              error: "missing",
              missingProperty: "registeredPackageHash",
            },
            message: "must have property 'registeredPackageHash'",
          };
          if (vErrors === null) {
            vErrors = [err34];
          } else {
            vErrors.push(err34);
          }
          errors++;
        }
        if (data.activationRevision !== undefined) {
          if (!(typeof data.activationRevision == "string")) {
            const err35 = {
              instancePath: instancePath + "/activationRevision",
              schemaPath:
                "/mapping/activated/properties/activationRevision/type",
              keyword: "type",
              params: { type: "string", nullable: false },
              message: "must be string",
            };
            if (vErrors === null) {
              vErrors = [err35];
            } else {
              vErrors.push(err35);
            }
            errors++;
          }
        } else {
          const err36 = {
            instancePath,
            schemaPath: "/mapping/activated/properties/activationRevision",
            keyword: "properties",
            params: { error: "missing", missingProperty: "activationRevision" },
            message: "must have property 'activationRevision'",
          };
          if (vErrors === null) {
            vErrors = [err36];
          } else {
            vErrors.push(err36);
          }
          errors++;
        }
        for (const key2 in data) {
          if (
            key2 !== "kind" &&
            key2 !== "version" &&
            key2 !== "installationId" &&
            key2 !== "commandId" &&
            key2 !== "payloadHash" &&
            key2 !== "registeredPackageHash" &&
            key2 !== "activationRevision"
          ) {
            const err37 = {
              instancePath:
                instancePath +
                "/" +
                key2.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/activated",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key2 },
              message: "must NOT have additional properties",
            };
            if (vErrors === null) {
              vErrors = [err37];
            } else {
              vErrors.push(err37);
            }
            errors++;
          }
        }
        if (!valid10) {
          const err38 = {
            instancePath,
            schemaPath: "/mapping/activated/properties",
            keyword: "properties",
            params: { type: "object", nullable: false },
            message: "must be object",
          };
          if (vErrors === null) {
            vErrors = [err38];
          } else {
            vErrors.push(err38);
          }
          errors++;
        }
        var valid9 = _errs12 === errors;
        valid0 = valid9;
      } else if (tag0 === "rejected") {
        const _errs19 = errors;
        let valid14 = false;
        valid14 = true;
        if (data.version !== undefined) {
          let data16 = data.version;
          if (!(
            typeof data16 == "number" &&
            isFinite(data16) &&
            !(data16 % 1) &&
            data16 >= 0 &&
            data16 <= 255
          )) {
            const err39 = {
              instancePath: instancePath + "/version",
              schemaPath: "/mapping/rejected/properties/version/type",
              keyword: "type",
              params: { type: "uint8", nullable: false },
              message: "must be uint8",
            };
            if (vErrors === null) {
              vErrors = [err39];
            } else {
              vErrors.push(err39);
            }
            errors++;
          }
        } else {
          const err40 = {
            instancePath,
            schemaPath: "/mapping/rejected/properties/version",
            keyword: "properties",
            params: { error: "missing", missingProperty: "version" },
            message: "must have property 'version'",
          };
          if (vErrors === null) {
            vErrors = [err40];
          } else {
            vErrors.push(err40);
          }
          errors++;
        }
        if (data.installationId !== undefined) {
          if (!(typeof data.installationId == "string")) {
            const err41 = {
              instancePath: instancePath + "/installationId",
              schemaPath: "/mapping/rejected/properties/installationId/type",
              keyword: "type",
              params: { type: "string", nullable: false },
              message: "must be string",
            };
            if (vErrors === null) {
              vErrors = [err41];
            } else {
              vErrors.push(err41);
            }
            errors++;
          }
        } else {
          const err42 = {
            instancePath,
            schemaPath: "/mapping/rejected/properties/installationId",
            keyword: "properties",
            params: { error: "missing", missingProperty: "installationId" },
            message: "must have property 'installationId'",
          };
          if (vErrors === null) {
            vErrors = [err42];
          } else {
            vErrors.push(err42);
          }
          errors++;
        }
        if (data.commandId !== undefined) {
          if (!(typeof data.commandId == "string")) {
            const err43 = {
              instancePath: instancePath + "/commandId",
              schemaPath: "/mapping/rejected/properties/commandId/type",
              keyword: "type",
              params: { type: "string", nullable: false },
              message: "must be string",
            };
            if (vErrors === null) {
              vErrors = [err43];
            } else {
              vErrors.push(err43);
            }
            errors++;
          }
        } else {
          const err44 = {
            instancePath,
            schemaPath: "/mapping/rejected/properties/commandId",
            keyword: "properties",
            params: { error: "missing", missingProperty: "commandId" },
            message: "must have property 'commandId'",
          };
          if (vErrors === null) {
            vErrors = [err44];
          } else {
            vErrors.push(err44);
          }
          errors++;
        }
        if (data.payloadHash !== undefined) {
          if (!(typeof data.payloadHash == "string")) {
            const err45 = {
              instancePath: instancePath + "/payloadHash",
              schemaPath: "/mapping/rejected/properties/payloadHash/type",
              keyword: "type",
              params: { type: "string", nullable: false },
              message: "must be string",
            };
            if (vErrors === null) {
              vErrors = [err45];
            } else {
              vErrors.push(err45);
            }
            errors++;
          }
        } else {
          const err46 = {
            instancePath,
            schemaPath: "/mapping/rejected/properties/payloadHash",
            keyword: "properties",
            params: { error: "missing", missingProperty: "payloadHash" },
            message: "must have property 'payloadHash'",
          };
          if (vErrors === null) {
            vErrors = [err46];
          } else {
            vErrors.push(err46);
          }
          errors++;
        }
        if (data.registeredPackageHash !== undefined) {
          let data20 = data.registeredPackageHash;
          if (!(data20 === null || typeof data20 == "string")) {
            const err47 = {
              instancePath: instancePath + "/registeredPackageHash",
              schemaPath:
                "/mapping/rejected/properties/registeredPackageHash/type",
              keyword: "type",
              params: { type: "string", nullable: true },
              message: "must be string or null",
            };
            if (vErrors === null) {
              vErrors = [err47];
            } else {
              vErrors.push(err47);
            }
            errors++;
          }
        } else {
          const err48 = {
            instancePath,
            schemaPath: "/mapping/rejected/properties/registeredPackageHash",
            keyword: "properties",
            params: {
              error: "missing",
              missingProperty: "registeredPackageHash",
            },
            message: "must have property 'registeredPackageHash'",
          };
          if (vErrors === null) {
            vErrors = [err48];
          } else {
            vErrors.push(err48);
          }
          errors++;
        }
        if (data.reason !== undefined) {
          let data21 = data.reason;
          if (!(
            typeof data21 == "string" &&
            (data21 === "courseAlreadyActive" ||
              data21 === "activationChanged" ||
              data21 === "releaseIdentityConflict" ||
              data21 === "packageIdentityConflict" ||
              data21 === "unsupportedInstallProfile")
          )) {
            const err49 = {
              instancePath: instancePath + "/reason",
              schemaPath: "/mapping/rejected/properties/reason/enum",
              keyword: "enum",
              params: {
                allowedValues: schema30.mapping.rejected.properties.reason.enum,
              },
              message: "must be equal to one of the allowed values",
            };
            if (vErrors === null) {
              vErrors = [err49];
            } else {
              vErrors.push(err49);
            }
            errors++;
          }
        } else {
          const err50 = {
            instancePath,
            schemaPath: "/mapping/rejected/properties/reason",
            keyword: "properties",
            params: { error: "missing", missingProperty: "reason" },
            message: "must have property 'reason'",
          };
          if (vErrors === null) {
            vErrors = [err50];
          } else {
            vErrors.push(err50);
          }
          errors++;
        }
        for (const key3 in data) {
          if (
            key3 !== "kind" &&
            key3 !== "version" &&
            key3 !== "installationId" &&
            key3 !== "commandId" &&
            key3 !== "payloadHash" &&
            key3 !== "registeredPackageHash" &&
            key3 !== "reason"
          ) {
            const err51 = {
              instancePath:
                instancePath +
                "/" +
                key3.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/rejected",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key3 },
              message: "must NOT have additional properties",
            };
            if (vErrors === null) {
              vErrors = [err51];
            } else {
              vErrors.push(err51);
            }
            errors++;
          }
        }
        if (!valid14) {
          const err52 = {
            instancePath,
            schemaPath: "/mapping/rejected/properties",
            keyword: "properties",
            params: { type: "object", nullable: false },
            message: "must be object",
          };
          if (vErrors === null) {
            vErrors = [err52];
          } else {
            vErrors.push(err52);
          }
          errors++;
        }
        var valid13 = _errs19 === errors;
        valid0 = valid13;
      } else {
        const err53 = {
          instancePath: instancePath + "/kind",
          schemaPath: "/mapping",
          keyword: "discriminator",
          params: { error: "mapping", tag: "kind", tagValue: tag0 },
          message: 'value of tag "kind" must be in mapping',
        };
        if (vErrors === null) {
          vErrors = [err53];
        } else {
          vErrors.push(err53);
        }
        errors++;
      }
    } else {
      const err54 = {
        instancePath: instancePath + "/kind",
        schemaPath: "/discriminator",
        keyword: "discriminator",
        params: { error: "tag", tag: "kind", tagValue: tag0 },
        message: 'tag "kind" must be string',
      };
      if (vErrors === null) {
        vErrors = [err54];
      } else {
        vErrors.push(err54);
      }
      errors++;
    }
  } else if (!valid0) {
    const err55 = {
      instancePath,
      schemaPath: "/discriminator",
      keyword: "discriminator",
      params: { type: "object", nullable: false },
      message: "must be object",
    };
    if (vErrors === null) {
      vErrors = [err55];
    } else {
      vErrors.push(err55);
    }
    errors++;
  }
  validate58.errors = vErrors;
  return errors === 0;
}
export const validateParentMaterialRequest = validate59;
const schema31 = {
  properties: {
    kind: { enum: ["preparation", "firstTaskPreview"] },
    packageHash: { type: "string" },
  },
};
function validate59(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  let valid0 = false;
  if (data && typeof data == "object" && !Array.isArray(data)) {
    valid0 = true;
    if (data.kind !== undefined) {
      let data0 = data.kind;
      if (!(
        typeof data0 == "string" &&
        (data0 === "preparation" || data0 === "firstTaskPreview")
      )) {
        const err0 = {
          instancePath: instancePath + "/kind",
          schemaPath: "/properties/kind/enum",
          keyword: "enum",
          params: { allowedValues: schema31.properties.kind.enum },
          message: "must be equal to one of the allowed values",
        };
        if (vErrors === null) {
          vErrors = [err0];
        } else {
          vErrors.push(err0);
        }
        errors++;
      }
    } else {
      const err1 = {
        instancePath,
        schemaPath: "/properties/kind",
        keyword: "properties",
        params: { error: "missing", missingProperty: "kind" },
        message: "must have property 'kind'",
      };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.packageHash !== undefined) {
      if (!(typeof data.packageHash == "string")) {
        const err2 = {
          instancePath: instancePath + "/packageHash",
          schemaPath: "/properties/packageHash/type",
          keyword: "type",
          params: { type: "string", nullable: false },
          message: "must be string",
        };
        if (vErrors === null) {
          vErrors = [err2];
        } else {
          vErrors.push(err2);
        }
        errors++;
      }
    } else {
      const err3 = {
        instancePath,
        schemaPath: "/properties/packageHash",
        keyword: "properties",
        params: { error: "missing", missingProperty: "packageHash" },
        message: "must have property 'packageHash'",
      };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    for (const key0 in data) {
      if (key0 !== "kind" && key0 !== "packageHash") {
        const err4 = {
          instancePath:
            instancePath + "/" + key0.replace(/~/g, "~0").replace(/\//g, "~1"),
          schemaPath: "",
          keyword: "properties",
          params: { error: "additional", additionalProperty: key0 },
          message: "must NOT have additional properties",
        };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    }
  }
  if (!valid0) {
    const err5 = {
      instancePath,
      schemaPath: "/properties",
      keyword: "properties",
      params: { type: "object", nullable: false },
      message: "must be object",
    };
    if (vErrors === null) {
      vErrors = [err5];
    } else {
      vErrors.push(err5);
    }
    errors++;
  }
  validate59.errors = vErrors;
  return errors === 0;
}
