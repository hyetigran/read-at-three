"use strict";
export const validateDiagnosticEvent = validate57;
const schema29 = {
  properties: {
    category: {
      enum: [
        "storage-unavailable",
        "storage-corrupt",
        "quota",
        "write-failed",
        "read-failed",
        "recovery",
        "unsupported",
        "timing",
      ],
    },
    operation: {
      enum: ["startup", "read", "teaching", "ink", "administration", "support"],
    },
    count: { type: "uint32" },
    durationMs: { type: "uint32" },
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
    if (data.category !== undefined) {
      let data0 = data.category;
      if (!(
        typeof data0 == "string" &&
        (data0 === "storage-unavailable" ||
          data0 === "storage-corrupt" ||
          data0 === "quota" ||
          data0 === "write-failed" ||
          data0 === "read-failed" ||
          data0 === "recovery" ||
          data0 === "unsupported" ||
          data0 === "timing")
      )) {
        const err0 = {
          instancePath: instancePath + "/category",
          schemaPath: "/properties/category/enum",
          keyword: "enum",
          params: { allowedValues: schema29.properties.category.enum },
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
        schemaPath: "/properties/category",
        keyword: "properties",
        params: { error: "missing", missingProperty: "category" },
        message: "must have property 'category'",
      };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.operation !== undefined) {
      let data1 = data.operation;
      if (!(
        typeof data1 == "string" &&
        (data1 === "startup" ||
          data1 === "read" ||
          data1 === "teaching" ||
          data1 === "ink" ||
          data1 === "administration" ||
          data1 === "support")
      )) {
        const err2 = {
          instancePath: instancePath + "/operation",
          schemaPath: "/properties/operation/enum",
          keyword: "enum",
          params: { allowedValues: schema29.properties.operation.enum },
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
        schemaPath: "/properties/operation",
        keyword: "properties",
        params: { error: "missing", missingProperty: "operation" },
        message: "must have property 'operation'",
      };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    if (data.count !== undefined) {
      let data2 = data.count;
      if (!(
        typeof data2 == "number" &&
        isFinite(data2) &&
        !(data2 % 1) &&
        data2 >= 0 &&
        data2 <= 4294967295
      )) {
        const err4 = {
          instancePath: instancePath + "/count",
          schemaPath: "/properties/count/type",
          keyword: "type",
          params: { type: "uint32", nullable: false },
          message: "must be uint32",
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
        schemaPath: "/properties/count",
        keyword: "properties",
        params: { error: "missing", missingProperty: "count" },
        message: "must have property 'count'",
      };
      if (vErrors === null) {
        vErrors = [err5];
      } else {
        vErrors.push(err5);
      }
      errors++;
    }
    if (data.durationMs !== undefined) {
      let data3 = data.durationMs;
      if (!(
        typeof data3 == "number" &&
        isFinite(data3) &&
        !(data3 % 1) &&
        data3 >= 0 &&
        data3 <= 4294967295
      )) {
        const err6 = {
          instancePath: instancePath + "/durationMs",
          schemaPath: "/properties/durationMs/type",
          keyword: "type",
          params: { type: "uint32", nullable: false },
          message: "must be uint32",
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
        schemaPath: "/properties/durationMs",
        keyword: "properties",
        params: { error: "missing", missingProperty: "durationMs" },
        message: "must have property 'durationMs'",
      };
      if (vErrors === null) {
        vErrors = [err7];
      } else {
        vErrors.push(err7);
      }
      errors++;
    }
    for (const key0 in data) {
      if (
        key0 !== "category" &&
        key0 !== "operation" &&
        key0 !== "count" &&
        key0 !== "durationMs"
      ) {
        const err8 = {
          instancePath:
            instancePath + "/" + key0.replace(/~/g, "~0").replace(/\//g, "~1"),
          schemaPath: "",
          keyword: "properties",
          params: { error: "additional", additionalProperty: key0 },
          message: "must NOT have additional properties",
        };
        if (vErrors === null) {
          vErrors = [err8];
        } else {
          vErrors.push(err8);
        }
        errors++;
      }
    }
  }
  if (!valid0) {
    const err9 = {
      instancePath,
      schemaPath: "/properties",
      keyword: "properties",
      params: { type: "object", nullable: false },
      message: "must be object",
    };
    if (vErrors === null) {
      vErrors = [err9];
    } else {
      vErrors.push(err9);
    }
    errors++;
  }
  validate57.errors = vErrors;
  return errors === 0;
}
export const validateDiagnosticRing = validate58;
const schema30 = {
  properties: {
    version: { type: "uint8" },
    omitted: { type: "float64" },
    records: {
      elements: {
        properties: {
          category: {
            enum: [
              "storage-unavailable",
              "storage-corrupt",
              "quota",
              "write-failed",
              "read-failed",
              "recovery",
              "unsupported",
              "timing",
            ],
          },
          operation: {
            enum: [
              "startup",
              "read",
              "teaching",
              "ink",
              "administration",
              "support",
            ],
          },
          count: { type: "uint32" },
          durationMs: { type: "uint32" },
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
    if (data.omitted !== undefined) {
      if (!(typeof data.omitted == "number")) {
        const err2 = {
          instancePath: instancePath + "/omitted",
          schemaPath: "/properties/omitted/type",
          keyword: "type",
          params: { type: "float64", nullable: false },
          message: "must be float64",
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
        schemaPath: "/properties/omitted",
        keyword: "properties",
        params: { error: "missing", missingProperty: "omitted" },
        message: "must have property 'omitted'",
      };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    if (data.records !== undefined) {
      let data2 = data.records;
      let valid2 = false;
      if (!valid2) {
        if (Array.isArray(data2)) {
          let valid4 = true;
          const len0 = data2.length;
          for (let i0 = 0; i0 < len0; i0++) {
            let data3 = data2[i0];
            const _errs3 = errors;
            let valid5 = false;
            if (data3 && typeof data3 == "object" && !Array.isArray(data3)) {
              valid5 = true;
              if (data3.category !== undefined) {
                let data4 = data3.category;
                if (!(
                  typeof data4 == "string" &&
                  (data4 === "storage-unavailable" ||
                    data4 === "storage-corrupt" ||
                    data4 === "quota" ||
                    data4 === "write-failed" ||
                    data4 === "read-failed" ||
                    data4 === "recovery" ||
                    data4 === "unsupported" ||
                    data4 === "timing")
                )) {
                  const err4 = {
                    instancePath: instancePath + "/records/" + i0 + "/category",
                    schemaPath:
                      "/properties/records/elements/properties/category/enum",
                    keyword: "enum",
                    params: {
                      allowedValues:
                        schema30.properties.records.elements.properties.category
                          .enum,
                    },
                    message: "must be equal to one of the allowed values",
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
                  instancePath: instancePath + "/records/" + i0,
                  schemaPath:
                    "/properties/records/elements/properties/category",
                  keyword: "properties",
                  params: { error: "missing", missingProperty: "category" },
                  message: "must have property 'category'",
                };
                if (vErrors === null) {
                  vErrors = [err5];
                } else {
                  vErrors.push(err5);
                }
                errors++;
              }
              if (data3.operation !== undefined) {
                let data5 = data3.operation;
                if (!(
                  typeof data5 == "string" &&
                  (data5 === "startup" ||
                    data5 === "read" ||
                    data5 === "teaching" ||
                    data5 === "ink" ||
                    data5 === "administration" ||
                    data5 === "support")
                )) {
                  const err6 = {
                    instancePath:
                      instancePath + "/records/" + i0 + "/operation",
                    schemaPath:
                      "/properties/records/elements/properties/operation/enum",
                    keyword: "enum",
                    params: {
                      allowedValues:
                        schema30.properties.records.elements.properties
                          .operation.enum,
                    },
                    message: "must be equal to one of the allowed values",
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
                  instancePath: instancePath + "/records/" + i0,
                  schemaPath:
                    "/properties/records/elements/properties/operation",
                  keyword: "properties",
                  params: { error: "missing", missingProperty: "operation" },
                  message: "must have property 'operation'",
                };
                if (vErrors === null) {
                  vErrors = [err7];
                } else {
                  vErrors.push(err7);
                }
                errors++;
              }
              if (data3.count !== undefined) {
                let data6 = data3.count;
                if (!(
                  typeof data6 == "number" &&
                  isFinite(data6) &&
                  !(data6 % 1) &&
                  data6 >= 0 &&
                  data6 <= 4294967295
                )) {
                  const err8 = {
                    instancePath: instancePath + "/records/" + i0 + "/count",
                    schemaPath:
                      "/properties/records/elements/properties/count/type",
                    keyword: "type",
                    params: { type: "uint32", nullable: false },
                    message: "must be uint32",
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
                  instancePath: instancePath + "/records/" + i0,
                  schemaPath: "/properties/records/elements/properties/count",
                  keyword: "properties",
                  params: { error: "missing", missingProperty: "count" },
                  message: "must have property 'count'",
                };
                if (vErrors === null) {
                  vErrors = [err9];
                } else {
                  vErrors.push(err9);
                }
                errors++;
              }
              if (data3.durationMs !== undefined) {
                let data7 = data3.durationMs;
                if (!(
                  typeof data7 == "number" &&
                  isFinite(data7) &&
                  !(data7 % 1) &&
                  data7 >= 0 &&
                  data7 <= 4294967295
                )) {
                  const err10 = {
                    instancePath:
                      instancePath + "/records/" + i0 + "/durationMs",
                    schemaPath:
                      "/properties/records/elements/properties/durationMs/type",
                    keyword: "type",
                    params: { type: "uint32", nullable: false },
                    message: "must be uint32",
                  };
                  if (vErrors === null) {
                    vErrors = [err10];
                  } else {
                    vErrors.push(err10);
                  }
                  errors++;
                }
              } else {
                const err11 = {
                  instancePath: instancePath + "/records/" + i0,
                  schemaPath:
                    "/properties/records/elements/properties/durationMs",
                  keyword: "properties",
                  params: { error: "missing", missingProperty: "durationMs" },
                  message: "must have property 'durationMs'",
                };
                if (vErrors === null) {
                  vErrors = [err11];
                } else {
                  vErrors.push(err11);
                }
                errors++;
              }
              for (const key0 in data3) {
                if (
                  key0 !== "category" &&
                  key0 !== "operation" &&
                  key0 !== "count" &&
                  key0 !== "durationMs"
                ) {
                  const err12 = {
                    instancePath:
                      instancePath +
                      "/records/" +
                      i0 +
                      "/" +
                      key0.replace(/~/g, "~0").replace(/\//g, "~1"),
                    schemaPath: "/properties/records/elements",
                    keyword: "properties",
                    params: { error: "additional", additionalProperty: key0 },
                    message: "must NOT have additional properties",
                  };
                  if (vErrors === null) {
                    vErrors = [err12];
                  } else {
                    vErrors.push(err12);
                  }
                  errors++;
                }
              }
            }
            if (!valid5) {
              const err13 = {
                instancePath: instancePath + "/records/" + i0,
                schemaPath: "/properties/records/elements/properties",
                keyword: "properties",
                params: { type: "object", nullable: false },
                message: "must be object",
              };
              if (vErrors === null) {
                vErrors = [err13];
              } else {
                vErrors.push(err13);
              }
              errors++;
            }
            var valid3 = _errs3 === errors;
            if (!valid3) {
              valid4 = false;
            }
          }
          valid2 = valid4;
        } else {
          const err14 = {
            instancePath: instancePath + "/records",
            schemaPath: "/properties/records/elements",
            keyword: "elements",
            params: { type: "array", nullable: false },
            message: "must be array",
          };
          if (vErrors === null) {
            vErrors = [err14];
          } else {
            vErrors.push(err14);
          }
          errors++;
        }
      }
    } else {
      const err15 = {
        instancePath,
        schemaPath: "/properties/records",
        keyword: "properties",
        params: { error: "missing", missingProperty: "records" },
        message: "must have property 'records'",
      };
      if (vErrors === null) {
        vErrors = [err15];
      } else {
        vErrors.push(err15);
      }
      errors++;
    }
    for (const key1 in data) {
      if (key1 !== "version" && key1 !== "omitted" && key1 !== "records") {
        const err16 = {
          instancePath:
            instancePath + "/" + key1.replace(/~/g, "~0").replace(/\//g, "~1"),
          schemaPath: "",
          keyword: "properties",
          params: { error: "additional", additionalProperty: key1 },
          message: "must NOT have additional properties",
        };
        if (vErrors === null) {
          vErrors = [err16];
        } else {
          vErrors.push(err16);
        }
        errors++;
      }
    }
  }
  if (!valid0) {
    const err17 = {
      instancePath,
      schemaPath: "/properties",
      keyword: "properties",
      params: { type: "object", nullable: false },
      message: "must be object",
    };
    if (vErrors === null) {
      vErrors = [err17];
    } else {
      vErrors.push(err17);
    }
    errors++;
  }
  validate58.errors = vErrors;
  return errors === 0;
}
export const validateProfileRemovalCommand = validate59;
const schema31 = {
  properties: {
    version: { type: "uint8" },
    commandId: { type: "string" },
    scope: {
      properties: {
        installationId: { type: "string" },
        revision: { type: "string" },
      },
    },
    selection: {
      properties: {
        installationId: { type: "string" },
        revision: { type: "string" },
        owner: {
          properties: {
            profileId: { type: "string" },
            generation: { type: "string" },
          },
        },
      },
    },
    payloadHash: { type: "string" },
    payload: {
      discriminator: "kind",
      mapping: {
        resetProfile: {
          properties: {
            target: {
              properties: {
                owner: {
                  properties: {
                    profileId: { type: "string" },
                    generation: { type: "string" },
                  },
                },
                revision: { type: "string" },
              },
            },
            departure: {
              properties: {
                courses: {
                  elements: {
                    properties: {
                      courseId: { type: "string" },
                      witness: {
                        properties: {
                          owner: {
                            properties: {
                              profileId: { type: "string" },
                              generation: { type: "string" },
                            },
                          },
                          profileRevision: { type: "string" },
                          activePackageHash: { type: "string" },
                          activationRevision: { type: "string" },
                          cursorRevision: { type: "string" },
                          selectedSessionRevision: {
                            type: "string",
                            nullable: true,
                          },
                        },
                      },
                      documents: { elements: {} },
                    },
                  },
                },
              },
            },
          },
        },
        deleteProfile: {
          properties: {
            target: {
              properties: {
                owner: {
                  properties: {
                    profileId: { type: "string" },
                    generation: { type: "string" },
                  },
                },
                revision: { type: "string" },
              },
            },
            departure: {
              properties: {
                courses: {
                  elements: {
                    properties: {
                      courseId: { type: "string" },
                      witness: {
                        properties: {
                          owner: {
                            properties: {
                              profileId: { type: "string" },
                              generation: { type: "string" },
                            },
                          },
                          profileRevision: { type: "string" },
                          activePackageHash: { type: "string" },
                          activationRevision: { type: "string" },
                          cursorRevision: { type: "string" },
                          selectedSessionRevision: {
                            type: "string",
                            nullable: true,
                          },
                        },
                      },
                      documents: { elements: {} },
                    },
                  },
                },
              },
            },
            successor: {
              discriminator: "kind",
              mapping: {
                existing: {
                  properties: {
                    owner: {
                      properties: {
                        profileId: { type: "string" },
                        generation: { type: "string" },
                      },
                    },
                  },
                },
                replacement: {
                  properties: {
                    owner: {
                      properties: {
                        profileId: { type: "string" },
                        generation: { type: "string" },
                      },
                    },
                    preferences: {
                      properties: {
                        avatarId: {
                          enum: [
                            "rabbit",
                            "fox",
                            "bear",
                            "owl",
                            "turtle",
                            "bird",
                            "frog",
                            "cat",
                          ],
                        },
                      },
                      optionalProperties: { displayName: { type: "string" } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
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
    if (data.commandId !== undefined) {
      if (!(typeof data.commandId == "string")) {
        const err2 = {
          instancePath: instancePath + "/commandId",
          schemaPath: "/properties/commandId/type",
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
        schemaPath: "/properties/commandId",
        keyword: "properties",
        params: { error: "missing", missingProperty: "commandId" },
        message: "must have property 'commandId'",
      };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    if (data.scope !== undefined) {
      let data2 = data.scope;
      let valid2 = false;
      if (data2 && typeof data2 == "object" && !Array.isArray(data2)) {
        valid2 = true;
        if (data2.installationId !== undefined) {
          if (!(typeof data2.installationId == "string")) {
            const err4 = {
              instancePath: instancePath + "/scope/installationId",
              schemaPath: "/properties/scope/properties/installationId/type",
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
            instancePath: instancePath + "/scope",
            schemaPath: "/properties/scope/properties/installationId",
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
        if (data2.revision !== undefined) {
          if (!(typeof data2.revision == "string")) {
            const err6 = {
              instancePath: instancePath + "/scope/revision",
              schemaPath: "/properties/scope/properties/revision/type",
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
            instancePath: instancePath + "/scope",
            schemaPath: "/properties/scope/properties/revision",
            keyword: "properties",
            params: { error: "missing", missingProperty: "revision" },
            message: "must have property 'revision'",
          };
          if (vErrors === null) {
            vErrors = [err7];
          } else {
            vErrors.push(err7);
          }
          errors++;
        }
        for (const key0 in data2) {
          if (key0 !== "installationId" && key0 !== "revision") {
            const err8 = {
              instancePath:
                instancePath +
                "/scope/" +
                key0.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/properties/scope",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key0 },
              message: "must NOT have additional properties",
            };
            if (vErrors === null) {
              vErrors = [err8];
            } else {
              vErrors.push(err8);
            }
            errors++;
          }
        }
      }
      if (!valid2) {
        const err9 = {
          instancePath: instancePath + "/scope",
          schemaPath: "/properties/scope/properties",
          keyword: "properties",
          params: { type: "object", nullable: false },
          message: "must be object",
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
        schemaPath: "/properties/scope",
        keyword: "properties",
        params: { error: "missing", missingProperty: "scope" },
        message: "must have property 'scope'",
      };
      if (vErrors === null) {
        vErrors = [err10];
      } else {
        vErrors.push(err10);
      }
      errors++;
    }
    if (data.selection !== undefined) {
      let data5 = data.selection;
      let valid5 = false;
      if (data5 && typeof data5 == "object" && !Array.isArray(data5)) {
        valid5 = true;
        if (data5.installationId !== undefined) {
          if (!(typeof data5.installationId == "string")) {
            const err11 = {
              instancePath: instancePath + "/selection/installationId",
              schemaPath:
                "/properties/selection/properties/installationId/type",
              keyword: "type",
              params: { type: "string", nullable: false },
              message: "must be string",
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
            instancePath: instancePath + "/selection",
            schemaPath: "/properties/selection/properties/installationId",
            keyword: "properties",
            params: { error: "missing", missingProperty: "installationId" },
            message: "must have property 'installationId'",
          };
          if (vErrors === null) {
            vErrors = [err12];
          } else {
            vErrors.push(err12);
          }
          errors++;
        }
        if (data5.revision !== undefined) {
          if (!(typeof data5.revision == "string")) {
            const err13 = {
              instancePath: instancePath + "/selection/revision",
              schemaPath: "/properties/selection/properties/revision/type",
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
            instancePath: instancePath + "/selection",
            schemaPath: "/properties/selection/properties/revision",
            keyword: "properties",
            params: { error: "missing", missingProperty: "revision" },
            message: "must have property 'revision'",
          };
          if (vErrors === null) {
            vErrors = [err14];
          } else {
            vErrors.push(err14);
          }
          errors++;
        }
        if (data5.owner !== undefined) {
          let data8 = data5.owner;
          let valid7 = false;
          if (data8 && typeof data8 == "object" && !Array.isArray(data8)) {
            valid7 = true;
            if (data8.profileId !== undefined) {
              if (!(typeof data8.profileId == "string")) {
                const err15 = {
                  instancePath: instancePath + "/selection/owner/profileId",
                  schemaPath:
                    "/properties/selection/properties/owner/properties/profileId/type",
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
                instancePath: instancePath + "/selection/owner",
                schemaPath:
                  "/properties/selection/properties/owner/properties/profileId",
                keyword: "properties",
                params: { error: "missing", missingProperty: "profileId" },
                message: "must have property 'profileId'",
              };
              if (vErrors === null) {
                vErrors = [err16];
              } else {
                vErrors.push(err16);
              }
              errors++;
            }
            if (data8.generation !== undefined) {
              if (!(typeof data8.generation == "string")) {
                const err17 = {
                  instancePath: instancePath + "/selection/owner/generation",
                  schemaPath:
                    "/properties/selection/properties/owner/properties/generation/type",
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
                instancePath: instancePath + "/selection/owner",
                schemaPath:
                  "/properties/selection/properties/owner/properties/generation",
                keyword: "properties",
                params: { error: "missing", missingProperty: "generation" },
                message: "must have property 'generation'",
              };
              if (vErrors === null) {
                vErrors = [err18];
              } else {
                vErrors.push(err18);
              }
              errors++;
            }
            for (const key1 in data8) {
              if (key1 !== "profileId" && key1 !== "generation") {
                const err19 = {
                  instancePath:
                    instancePath +
                    "/selection/owner/" +
                    key1.replace(/~/g, "~0").replace(/\//g, "~1"),
                  schemaPath: "/properties/selection/properties/owner",
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
          if (!valid7) {
            const err20 = {
              instancePath: instancePath + "/selection/owner",
              schemaPath: "/properties/selection/properties/owner/properties",
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
            instancePath: instancePath + "/selection",
            schemaPath: "/properties/selection/properties/owner",
            keyword: "properties",
            params: { error: "missing", missingProperty: "owner" },
            message: "must have property 'owner'",
          };
          if (vErrors === null) {
            vErrors = [err21];
          } else {
            vErrors.push(err21);
          }
          errors++;
        }
        for (const key2 in data5) {
          if (
            key2 !== "installationId" &&
            key2 !== "revision" &&
            key2 !== "owner"
          ) {
            const err22 = {
              instancePath:
                instancePath +
                "/selection/" +
                key2.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/properties/selection",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key2 },
              message: "must NOT have additional properties",
            };
            if (vErrors === null) {
              vErrors = [err22];
            } else {
              vErrors.push(err22);
            }
            errors++;
          }
        }
      }
      if (!valid5) {
        const err23 = {
          instancePath: instancePath + "/selection",
          schemaPath: "/properties/selection/properties",
          keyword: "properties",
          params: { type: "object", nullable: false },
          message: "must be object",
        };
        if (vErrors === null) {
          vErrors = [err23];
        } else {
          vErrors.push(err23);
        }
        errors++;
      }
    } else {
      const err24 = {
        instancePath,
        schemaPath: "/properties/selection",
        keyword: "properties",
        params: { error: "missing", missingProperty: "selection" },
        message: "must have property 'selection'",
      };
      if (vErrors === null) {
        vErrors = [err24];
      } else {
        vErrors.push(err24);
      }
      errors++;
    }
    if (data.payloadHash !== undefined) {
      if (!(typeof data.payloadHash == "string")) {
        const err25 = {
          instancePath: instancePath + "/payloadHash",
          schemaPath: "/properties/payloadHash/type",
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
        instancePath,
        schemaPath: "/properties/payloadHash",
        keyword: "properties",
        params: { error: "missing", missingProperty: "payloadHash" },
        message: "must have property 'payloadHash'",
      };
      if (vErrors === null) {
        vErrors = [err26];
      } else {
        vErrors.push(err26);
      }
      errors++;
    }
    if (data.payload !== undefined) {
      let data12 = data.payload;
      let valid11 = false;
      if (data12 && typeof data12 == "object" && !Array.isArray(data12)) {
        const tag0 = data12.kind;
        if (tag0 === undefined) {
          const err27 = {
            instancePath: instancePath + "/payload",
            schemaPath: "/properties/payload/discriminator",
            keyword: "discriminator",
            params: { error: "tag", tag: "kind", tagValue: tag0 },
            message: 'tag "kind" must be string',
          };
          if (vErrors === null) {
            vErrors = [err27];
          } else {
            vErrors.push(err27);
          }
          errors++;
        } else if (typeof tag0 == "string") {
          if (tag0 === "resetProfile") {
            const _errs13 = errors;
            let valid13 = false;
            valid13 = true;
            if (data12.target !== undefined) {
              let data13 = data12.target;
              let valid15 = false;
              if (
                data13 &&
                typeof data13 == "object" &&
                !Array.isArray(data13)
              ) {
                valid15 = true;
                if (data13.owner !== undefined) {
                  let data14 = data13.owner;
                  let valid17 = false;
                  if (
                    data14 &&
                    typeof data14 == "object" &&
                    !Array.isArray(data14)
                  ) {
                    valid17 = true;
                    if (data14.profileId !== undefined) {
                      if (!(typeof data14.profileId == "string")) {
                        const err28 = {
                          instancePath:
                            instancePath + "/payload/target/owner/profileId",
                          schemaPath:
                            "/properties/payload/mapping/resetProfile/properties/target/properties/owner/properties/profileId/type",
                          keyword: "type",
                          params: { type: "string", nullable: false },
                          message: "must be string",
                        };
                        if (vErrors === null) {
                          vErrors = [err28];
                        } else {
                          vErrors.push(err28);
                        }
                        errors++;
                      }
                    } else {
                      const err29 = {
                        instancePath: instancePath + "/payload/target/owner",
                        schemaPath:
                          "/properties/payload/mapping/resetProfile/properties/target/properties/owner/properties/profileId",
                        keyword: "properties",
                        params: {
                          error: "missing",
                          missingProperty: "profileId",
                        },
                        message: "must have property 'profileId'",
                      };
                      if (vErrors === null) {
                        vErrors = [err29];
                      } else {
                        vErrors.push(err29);
                      }
                      errors++;
                    }
                    if (data14.generation !== undefined) {
                      if (!(typeof data14.generation == "string")) {
                        const err30 = {
                          instancePath:
                            instancePath + "/payload/target/owner/generation",
                          schemaPath:
                            "/properties/payload/mapping/resetProfile/properties/target/properties/owner/properties/generation/type",
                          keyword: "type",
                          params: { type: "string", nullable: false },
                          message: "must be string",
                        };
                        if (vErrors === null) {
                          vErrors = [err30];
                        } else {
                          vErrors.push(err30);
                        }
                        errors++;
                      }
                    } else {
                      const err31 = {
                        instancePath: instancePath + "/payload/target/owner",
                        schemaPath:
                          "/properties/payload/mapping/resetProfile/properties/target/properties/owner/properties/generation",
                        keyword: "properties",
                        params: {
                          error: "missing",
                          missingProperty: "generation",
                        },
                        message: "must have property 'generation'",
                      };
                      if (vErrors === null) {
                        vErrors = [err31];
                      } else {
                        vErrors.push(err31);
                      }
                      errors++;
                    }
                    for (const key3 in data14) {
                      if (key3 !== "profileId" && key3 !== "generation") {
                        const err32 = {
                          instancePath:
                            instancePath +
                            "/payload/target/owner/" +
                            key3.replace(/~/g, "~0").replace(/\//g, "~1"),
                          schemaPath:
                            "/properties/payload/mapping/resetProfile/properties/target/properties/owner",
                          keyword: "properties",
                          params: {
                            error: "additional",
                            additionalProperty: key3,
                          },
                          message: "must NOT have additional properties",
                        };
                        if (vErrors === null) {
                          vErrors = [err32];
                        } else {
                          vErrors.push(err32);
                        }
                        errors++;
                      }
                    }
                  }
                  if (!valid17) {
                    const err33 = {
                      instancePath: instancePath + "/payload/target/owner",
                      schemaPath:
                        "/properties/payload/mapping/resetProfile/properties/target/properties/owner/properties",
                      keyword: "properties",
                      params: { type: "object", nullable: false },
                      message: "must be object",
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
                    instancePath: instancePath + "/payload/target",
                    schemaPath:
                      "/properties/payload/mapping/resetProfile/properties/target/properties/owner",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "owner" },
                    message: "must have property 'owner'",
                  };
                  if (vErrors === null) {
                    vErrors = [err34];
                  } else {
                    vErrors.push(err34);
                  }
                  errors++;
                }
                if (data13.revision !== undefined) {
                  if (!(typeof data13.revision == "string")) {
                    const err35 = {
                      instancePath: instancePath + "/payload/target/revision",
                      schemaPath:
                        "/properties/payload/mapping/resetProfile/properties/target/properties/revision/type",
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
                    instancePath: instancePath + "/payload/target",
                    schemaPath:
                      "/properties/payload/mapping/resetProfile/properties/target/properties/revision",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "revision" },
                    message: "must have property 'revision'",
                  };
                  if (vErrors === null) {
                    vErrors = [err36];
                  } else {
                    vErrors.push(err36);
                  }
                  errors++;
                }
                for (const key4 in data13) {
                  if (key4 !== "owner" && key4 !== "revision") {
                    const err37 = {
                      instancePath:
                        instancePath +
                        "/payload/target/" +
                        key4.replace(/~/g, "~0").replace(/\//g, "~1"),
                      schemaPath:
                        "/properties/payload/mapping/resetProfile/properties/target",
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
              if (!valid15) {
                const err38 = {
                  instancePath: instancePath + "/payload/target",
                  schemaPath:
                    "/properties/payload/mapping/resetProfile/properties/target/properties",
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
            } else {
              const err39 = {
                instancePath: instancePath + "/payload",
                schemaPath:
                  "/properties/payload/mapping/resetProfile/properties/target",
                keyword: "properties",
                params: { error: "missing", missingProperty: "target" },
                message: "must have property 'target'",
              };
              if (vErrors === null) {
                vErrors = [err39];
              } else {
                vErrors.push(err39);
              }
              errors++;
            }
            if (data12.departure !== undefined) {
              let data18 = data12.departure;
              let valid21 = false;
              if (
                data18 &&
                typeof data18 == "object" &&
                !Array.isArray(data18)
              ) {
                valid21 = true;
                if (data18.courses !== undefined) {
                  let data19 = data18.courses;
                  let valid23 = false;
                  if (!valid23) {
                    if (Array.isArray(data19)) {
                      let valid25 = true;
                      const len0 = data19.length;
                      for (let i0 = 0; i0 < len0; i0++) {
                        let data20 = data19[i0];
                        const _errs21 = errors;
                        let valid26 = false;
                        if (
                          data20 &&
                          typeof data20 == "object" &&
                          !Array.isArray(data20)
                        ) {
                          valid26 = true;
                          if (data20.courseId !== undefined) {
                            if (!(typeof data20.courseId == "string")) {
                              const err40 = {
                                instancePath:
                                  instancePath +
                                  "/payload/departure/courses/" +
                                  i0 +
                                  "/courseId",
                                schemaPath:
                                  "/properties/payload/mapping/resetProfile/properties/departure/properties/courses/elements/properties/courseId/type",
                                keyword: "type",
                                params: { type: "string", nullable: false },
                                message: "must be string",
                              };
                              if (vErrors === null) {
                                vErrors = [err40];
                              } else {
                                vErrors.push(err40);
                              }
                              errors++;
                            }
                          } else {
                            const err41 = {
                              instancePath:
                                instancePath +
                                "/payload/departure/courses/" +
                                i0,
                              schemaPath:
                                "/properties/payload/mapping/resetProfile/properties/departure/properties/courses/elements/properties/courseId",
                              keyword: "properties",
                              params: {
                                error: "missing",
                                missingProperty: "courseId",
                              },
                              message: "must have property 'courseId'",
                            };
                            if (vErrors === null) {
                              vErrors = [err41];
                            } else {
                              vErrors.push(err41);
                            }
                            errors++;
                          }
                          if (data20.witness !== undefined) {
                            let data22 = data20.witness;
                            let valid28 = false;
                            if (
                              data22 &&
                              typeof data22 == "object" &&
                              !Array.isArray(data22)
                            ) {
                              valid28 = true;
                              if (data22.owner !== undefined) {
                                let data23 = data22.owner;
                                let valid30 = false;
                                if (
                                  data23 &&
                                  typeof data23 == "object" &&
                                  !Array.isArray(data23)
                                ) {
                                  valid30 = true;
                                  if (data23.profileId !== undefined) {
                                    if (
                                      !(typeof data23.profileId == "string")
                                    ) {
                                      const err42 = {
                                        instancePath:
                                          instancePath +
                                          "/payload/departure/courses/" +
                                          i0 +
                                          "/witness/owner/profileId",
                                        schemaPath:
                                          "/properties/payload/mapping/resetProfile/properties/departure/properties/courses/elements/properties/witness/properties/owner/properties/profileId/type",
                                        keyword: "type",
                                        params: {
                                          type: "string",
                                          nullable: false,
                                        },
                                        message: "must be string",
                                      };
                                      if (vErrors === null) {
                                        vErrors = [err42];
                                      } else {
                                        vErrors.push(err42);
                                      }
                                      errors++;
                                    }
                                  } else {
                                    const err43 = {
                                      instancePath:
                                        instancePath +
                                        "/payload/departure/courses/" +
                                        i0 +
                                        "/witness/owner",
                                      schemaPath:
                                        "/properties/payload/mapping/resetProfile/properties/departure/properties/courses/elements/properties/witness/properties/owner/properties/profileId",
                                      keyword: "properties",
                                      params: {
                                        error: "missing",
                                        missingProperty: "profileId",
                                      },
                                      message: "must have property 'profileId'",
                                    };
                                    if (vErrors === null) {
                                      vErrors = [err43];
                                    } else {
                                      vErrors.push(err43);
                                    }
                                    errors++;
                                  }
                                  if (data23.generation !== undefined) {
                                    if (
                                      !(typeof data23.generation == "string")
                                    ) {
                                      const err44 = {
                                        instancePath:
                                          instancePath +
                                          "/payload/departure/courses/" +
                                          i0 +
                                          "/witness/owner/generation",
                                        schemaPath:
                                          "/properties/payload/mapping/resetProfile/properties/departure/properties/courses/elements/properties/witness/properties/owner/properties/generation/type",
                                        keyword: "type",
                                        params: {
                                          type: "string",
                                          nullable: false,
                                        },
                                        message: "must be string",
                                      };
                                      if (vErrors === null) {
                                        vErrors = [err44];
                                      } else {
                                        vErrors.push(err44);
                                      }
                                      errors++;
                                    }
                                  } else {
                                    const err45 = {
                                      instancePath:
                                        instancePath +
                                        "/payload/departure/courses/" +
                                        i0 +
                                        "/witness/owner",
                                      schemaPath:
                                        "/properties/payload/mapping/resetProfile/properties/departure/properties/courses/elements/properties/witness/properties/owner/properties/generation",
                                      keyword: "properties",
                                      params: {
                                        error: "missing",
                                        missingProperty: "generation",
                                      },
                                      message:
                                        "must have property 'generation'",
                                    };
                                    if (vErrors === null) {
                                      vErrors = [err45];
                                    } else {
                                      vErrors.push(err45);
                                    }
                                    errors++;
                                  }
                                  for (const key5 in data23) {
                                    if (
                                      key5 !== "profileId" &&
                                      key5 !== "generation"
                                    ) {
                                      const err46 = {
                                        instancePath:
                                          instancePath +
                                          "/payload/departure/courses/" +
                                          i0 +
                                          "/witness/owner/" +
                                          key5
                                            .replace(/~/g, "~0")
                                            .replace(/\//g, "~1"),
                                        schemaPath:
                                          "/properties/payload/mapping/resetProfile/properties/departure/properties/courses/elements/properties/witness/properties/owner",
                                        keyword: "properties",
                                        params: {
                                          error: "additional",
                                          additionalProperty: key5,
                                        },
                                        message:
                                          "must NOT have additional properties",
                                      };
                                      if (vErrors === null) {
                                        vErrors = [err46];
                                      } else {
                                        vErrors.push(err46);
                                      }
                                      errors++;
                                    }
                                  }
                                }
                                if (!valid30) {
                                  const err47 = {
                                    instancePath:
                                      instancePath +
                                      "/payload/departure/courses/" +
                                      i0 +
                                      "/witness/owner",
                                    schemaPath:
                                      "/properties/payload/mapping/resetProfile/properties/departure/properties/courses/elements/properties/witness/properties/owner/properties",
                                    keyword: "properties",
                                    params: { type: "object", nullable: false },
                                    message: "must be object",
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
                                  instancePath:
                                    instancePath +
                                    "/payload/departure/courses/" +
                                    i0 +
                                    "/witness",
                                  schemaPath:
                                    "/properties/payload/mapping/resetProfile/properties/departure/properties/courses/elements/properties/witness/properties/owner",
                                  keyword: "properties",
                                  params: {
                                    error: "missing",
                                    missingProperty: "owner",
                                  },
                                  message: "must have property 'owner'",
                                };
                                if (vErrors === null) {
                                  vErrors = [err48];
                                } else {
                                  vErrors.push(err48);
                                }
                                errors++;
                              }
                              if (data22.profileRevision !== undefined) {
                                if (
                                  !(typeof data22.profileRevision == "string")
                                ) {
                                  const err49 = {
                                    instancePath:
                                      instancePath +
                                      "/payload/departure/courses/" +
                                      i0 +
                                      "/witness/profileRevision",
                                    schemaPath:
                                      "/properties/payload/mapping/resetProfile/properties/departure/properties/courses/elements/properties/witness/properties/profileRevision/type",
                                    keyword: "type",
                                    params: { type: "string", nullable: false },
                                    message: "must be string",
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
                                  instancePath:
                                    instancePath +
                                    "/payload/departure/courses/" +
                                    i0 +
                                    "/witness",
                                  schemaPath:
                                    "/properties/payload/mapping/resetProfile/properties/departure/properties/courses/elements/properties/witness/properties/profileRevision",
                                  keyword: "properties",
                                  params: {
                                    error: "missing",
                                    missingProperty: "profileRevision",
                                  },
                                  message:
                                    "must have property 'profileRevision'",
                                };
                                if (vErrors === null) {
                                  vErrors = [err50];
                                } else {
                                  vErrors.push(err50);
                                }
                                errors++;
                              }
                              if (data22.activePackageHash !== undefined) {
                                if (
                                  !(typeof data22.activePackageHash == "string")
                                ) {
                                  const err51 = {
                                    instancePath:
                                      instancePath +
                                      "/payload/departure/courses/" +
                                      i0 +
                                      "/witness/activePackageHash",
                                    schemaPath:
                                      "/properties/payload/mapping/resetProfile/properties/departure/properties/courses/elements/properties/witness/properties/activePackageHash/type",
                                    keyword: "type",
                                    params: { type: "string", nullable: false },
                                    message: "must be string",
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err51];
                                  } else {
                                    vErrors.push(err51);
                                  }
                                  errors++;
                                }
                              } else {
                                const err52 = {
                                  instancePath:
                                    instancePath +
                                    "/payload/departure/courses/" +
                                    i0 +
                                    "/witness",
                                  schemaPath:
                                    "/properties/payload/mapping/resetProfile/properties/departure/properties/courses/elements/properties/witness/properties/activePackageHash",
                                  keyword: "properties",
                                  params: {
                                    error: "missing",
                                    missingProperty: "activePackageHash",
                                  },
                                  message:
                                    "must have property 'activePackageHash'",
                                };
                                if (vErrors === null) {
                                  vErrors = [err52];
                                } else {
                                  vErrors.push(err52);
                                }
                                errors++;
                              }
                              if (data22.activationRevision !== undefined) {
                                if (
                                  !(
                                    typeof data22.activationRevision == "string"
                                  )
                                ) {
                                  const err53 = {
                                    instancePath:
                                      instancePath +
                                      "/payload/departure/courses/" +
                                      i0 +
                                      "/witness/activationRevision",
                                    schemaPath:
                                      "/properties/payload/mapping/resetProfile/properties/departure/properties/courses/elements/properties/witness/properties/activationRevision/type",
                                    keyword: "type",
                                    params: { type: "string", nullable: false },
                                    message: "must be string",
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
                                  instancePath:
                                    instancePath +
                                    "/payload/departure/courses/" +
                                    i0 +
                                    "/witness",
                                  schemaPath:
                                    "/properties/payload/mapping/resetProfile/properties/departure/properties/courses/elements/properties/witness/properties/activationRevision",
                                  keyword: "properties",
                                  params: {
                                    error: "missing",
                                    missingProperty: "activationRevision",
                                  },
                                  message:
                                    "must have property 'activationRevision'",
                                };
                                if (vErrors === null) {
                                  vErrors = [err54];
                                } else {
                                  vErrors.push(err54);
                                }
                                errors++;
                              }
                              if (data22.cursorRevision !== undefined) {
                                if (
                                  !(typeof data22.cursorRevision == "string")
                                ) {
                                  const err55 = {
                                    instancePath:
                                      instancePath +
                                      "/payload/departure/courses/" +
                                      i0 +
                                      "/witness/cursorRevision",
                                    schemaPath:
                                      "/properties/payload/mapping/resetProfile/properties/departure/properties/courses/elements/properties/witness/properties/cursorRevision/type",
                                    keyword: "type",
                                    params: { type: "string", nullable: false },
                                    message: "must be string",
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err55];
                                  } else {
                                    vErrors.push(err55);
                                  }
                                  errors++;
                                }
                              } else {
                                const err56 = {
                                  instancePath:
                                    instancePath +
                                    "/payload/departure/courses/" +
                                    i0 +
                                    "/witness",
                                  schemaPath:
                                    "/properties/payload/mapping/resetProfile/properties/departure/properties/courses/elements/properties/witness/properties/cursorRevision",
                                  keyword: "properties",
                                  params: {
                                    error: "missing",
                                    missingProperty: "cursorRevision",
                                  },
                                  message:
                                    "must have property 'cursorRevision'",
                                };
                                if (vErrors === null) {
                                  vErrors = [err56];
                                } else {
                                  vErrors.push(err56);
                                }
                                errors++;
                              }
                              if (
                                data22.selectedSessionRevision !== undefined
                              ) {
                                let data30 = data22.selectedSessionRevision;
                                if (!(
                                  data30 === null || typeof data30 == "string"
                                )) {
                                  const err57 = {
                                    instancePath:
                                      instancePath +
                                      "/payload/departure/courses/" +
                                      i0 +
                                      "/witness/selectedSessionRevision",
                                    schemaPath:
                                      "/properties/payload/mapping/resetProfile/properties/departure/properties/courses/elements/properties/witness/properties/selectedSessionRevision/type",
                                    keyword: "type",
                                    params: { type: "string", nullable: true },
                                    message: "must be string or null",
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err57];
                                  } else {
                                    vErrors.push(err57);
                                  }
                                  errors++;
                                }
                              } else {
                                const err58 = {
                                  instancePath:
                                    instancePath +
                                    "/payload/departure/courses/" +
                                    i0 +
                                    "/witness",
                                  schemaPath:
                                    "/properties/payload/mapping/resetProfile/properties/departure/properties/courses/elements/properties/witness/properties/selectedSessionRevision",
                                  keyword: "properties",
                                  params: {
                                    error: "missing",
                                    missingProperty: "selectedSessionRevision",
                                  },
                                  message:
                                    "must have property 'selectedSessionRevision'",
                                };
                                if (vErrors === null) {
                                  vErrors = [err58];
                                } else {
                                  vErrors.push(err58);
                                }
                                errors++;
                              }
                              for (const key6 in data22) {
                                if (
                                  key6 !== "owner" &&
                                  key6 !== "profileRevision" &&
                                  key6 !== "activePackageHash" &&
                                  key6 !== "activationRevision" &&
                                  key6 !== "cursorRevision" &&
                                  key6 !== "selectedSessionRevision"
                                ) {
                                  const err59 = {
                                    instancePath:
                                      instancePath +
                                      "/payload/departure/courses/" +
                                      i0 +
                                      "/witness/" +
                                      key6
                                        .replace(/~/g, "~0")
                                        .replace(/\//g, "~1"),
                                    schemaPath:
                                      "/properties/payload/mapping/resetProfile/properties/departure/properties/courses/elements/properties/witness",
                                    keyword: "properties",
                                    params: {
                                      error: "additional",
                                      additionalProperty: key6,
                                    },
                                    message:
                                      "must NOT have additional properties",
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err59];
                                  } else {
                                    vErrors.push(err59);
                                  }
                                  errors++;
                                }
                              }
                            }
                            if (!valid28) {
                              const err60 = {
                                instancePath:
                                  instancePath +
                                  "/payload/departure/courses/" +
                                  i0 +
                                  "/witness",
                                schemaPath:
                                  "/properties/payload/mapping/resetProfile/properties/departure/properties/courses/elements/properties/witness/properties",
                                keyword: "properties",
                                params: { type: "object", nullable: false },
                                message: "must be object",
                              };
                              if (vErrors === null) {
                                vErrors = [err60];
                              } else {
                                vErrors.push(err60);
                              }
                              errors++;
                            }
                          } else {
                            const err61 = {
                              instancePath:
                                instancePath +
                                "/payload/departure/courses/" +
                                i0,
                              schemaPath:
                                "/properties/payload/mapping/resetProfile/properties/departure/properties/courses/elements/properties/witness",
                              keyword: "properties",
                              params: {
                                error: "missing",
                                missingProperty: "witness",
                              },
                              message: "must have property 'witness'",
                            };
                            if (vErrors === null) {
                              vErrors = [err61];
                            } else {
                              vErrors.push(err61);
                            }
                            errors++;
                          }
                          if (data20.documents !== undefined) {
                          } else {
                            const err62 = {
                              instancePath:
                                instancePath +
                                "/payload/departure/courses/" +
                                i0,
                              schemaPath:
                                "/properties/payload/mapping/resetProfile/properties/departure/properties/courses/elements/properties/documents",
                              keyword: "properties",
                              params: {
                                error: "missing",
                                missingProperty: "documents",
                              },
                              message: "must have property 'documents'",
                            };
                            if (vErrors === null) {
                              vErrors = [err62];
                            } else {
                              vErrors.push(err62);
                            }
                            errors++;
                          }
                          for (const key7 in data20) {
                            if (
                              key7 !== "courseId" &&
                              key7 !== "witness" &&
                              key7 !== "documents"
                            ) {
                              const err63 = {
                                instancePath:
                                  instancePath +
                                  "/payload/departure/courses/" +
                                  i0 +
                                  "/" +
                                  key7.replace(/~/g, "~0").replace(/\//g, "~1"),
                                schemaPath:
                                  "/properties/payload/mapping/resetProfile/properties/departure/properties/courses/elements",
                                keyword: "properties",
                                params: {
                                  error: "additional",
                                  additionalProperty: key7,
                                },
                                message: "must NOT have additional properties",
                              };
                              if (vErrors === null) {
                                vErrors = [err63];
                              } else {
                                vErrors.push(err63);
                              }
                              errors++;
                            }
                          }
                        }
                        if (!valid26) {
                          const err64 = {
                            instancePath:
                              instancePath + "/payload/departure/courses/" + i0,
                            schemaPath:
                              "/properties/payload/mapping/resetProfile/properties/departure/properties/courses/elements/properties",
                            keyword: "properties",
                            params: { type: "object", nullable: false },
                            message: "must be object",
                          };
                          if (vErrors === null) {
                            vErrors = [err64];
                          } else {
                            vErrors.push(err64);
                          }
                          errors++;
                        }
                        var valid24 = _errs21 === errors;
                        if (!valid24) {
                          valid25 = false;
                        }
                      }
                      valid23 = valid25;
                    } else {
                      const err65 = {
                        instancePath:
                          instancePath + "/payload/departure/courses",
                        schemaPath:
                          "/properties/payload/mapping/resetProfile/properties/departure/properties/courses/elements",
                        keyword: "elements",
                        params: { type: "array", nullable: false },
                        message: "must be array",
                      };
                      if (vErrors === null) {
                        vErrors = [err65];
                      } else {
                        vErrors.push(err65);
                      }
                      errors++;
                    }
                  }
                } else {
                  const err66 = {
                    instancePath: instancePath + "/payload/departure",
                    schemaPath:
                      "/properties/payload/mapping/resetProfile/properties/departure/properties/courses",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "courses" },
                    message: "must have property 'courses'",
                  };
                  if (vErrors === null) {
                    vErrors = [err66];
                  } else {
                    vErrors.push(err66);
                  }
                  errors++;
                }
                for (const key8 in data18) {
                  if (key8 !== "courses") {
                    const err67 = {
                      instancePath:
                        instancePath +
                        "/payload/departure/" +
                        key8.replace(/~/g, "~0").replace(/\//g, "~1"),
                      schemaPath:
                        "/properties/payload/mapping/resetProfile/properties/departure",
                      keyword: "properties",
                      params: { error: "additional", additionalProperty: key8 },
                      message: "must NOT have additional properties",
                    };
                    if (vErrors === null) {
                      vErrors = [err67];
                    } else {
                      vErrors.push(err67);
                    }
                    errors++;
                  }
                }
              }
              if (!valid21) {
                const err68 = {
                  instancePath: instancePath + "/payload/departure",
                  schemaPath:
                    "/properties/payload/mapping/resetProfile/properties/departure/properties",
                  keyword: "properties",
                  params: { type: "object", nullable: false },
                  message: "must be object",
                };
                if (vErrors === null) {
                  vErrors = [err68];
                } else {
                  vErrors.push(err68);
                }
                errors++;
              }
            } else {
              const err69 = {
                instancePath: instancePath + "/payload",
                schemaPath:
                  "/properties/payload/mapping/resetProfile/properties/departure",
                keyword: "properties",
                params: { error: "missing", missingProperty: "departure" },
                message: "must have property 'departure'",
              };
              if (vErrors === null) {
                vErrors = [err69];
              } else {
                vErrors.push(err69);
              }
              errors++;
            }
            for (const key9 in data12) {
              if (
                key9 !== "kind" &&
                key9 !== "target" &&
                key9 !== "departure"
              ) {
                const err70 = {
                  instancePath:
                    instancePath +
                    "/payload/" +
                    key9.replace(/~/g, "~0").replace(/\//g, "~1"),
                  schemaPath: "/properties/payload/mapping/resetProfile",
                  keyword: "properties",
                  params: { error: "additional", additionalProperty: key9 },
                  message: "must NOT have additional properties",
                };
                if (vErrors === null) {
                  vErrors = [err70];
                } else {
                  vErrors.push(err70);
                }
                errors++;
              }
            }
            if (!valid13) {
              const err71 = {
                instancePath: instancePath + "/payload",
                schemaPath:
                  "/properties/payload/mapping/resetProfile/properties",
                keyword: "properties",
                params: { type: "object", nullable: false },
                message: "must be object",
              };
              if (vErrors === null) {
                vErrors = [err71];
              } else {
                vErrors.push(err71);
              }
              errors++;
            }
            var valid12 = _errs13 === errors;
            valid11 = valid12;
          } else if (tag0 === "deleteProfile") {
            const _errs34 = errors;
            let valid38 = false;
            valid38 = true;
            if (data12.target !== undefined) {
              let data32 = data12.target;
              let valid40 = false;
              if (
                data32 &&
                typeof data32 == "object" &&
                !Array.isArray(data32)
              ) {
                valid40 = true;
                if (data32.owner !== undefined) {
                  let data33 = data32.owner;
                  let valid42 = false;
                  if (
                    data33 &&
                    typeof data33 == "object" &&
                    !Array.isArray(data33)
                  ) {
                    valid42 = true;
                    if (data33.profileId !== undefined) {
                      if (!(typeof data33.profileId == "string")) {
                        const err72 = {
                          instancePath:
                            instancePath + "/payload/target/owner/profileId",
                          schemaPath:
                            "/properties/payload/mapping/deleteProfile/properties/target/properties/owner/properties/profileId/type",
                          keyword: "type",
                          params: { type: "string", nullable: false },
                          message: "must be string",
                        };
                        if (vErrors === null) {
                          vErrors = [err72];
                        } else {
                          vErrors.push(err72);
                        }
                        errors++;
                      }
                    } else {
                      const err73 = {
                        instancePath: instancePath + "/payload/target/owner",
                        schemaPath:
                          "/properties/payload/mapping/deleteProfile/properties/target/properties/owner/properties/profileId",
                        keyword: "properties",
                        params: {
                          error: "missing",
                          missingProperty: "profileId",
                        },
                        message: "must have property 'profileId'",
                      };
                      if (vErrors === null) {
                        vErrors = [err73];
                      } else {
                        vErrors.push(err73);
                      }
                      errors++;
                    }
                    if (data33.generation !== undefined) {
                      if (!(typeof data33.generation == "string")) {
                        const err74 = {
                          instancePath:
                            instancePath + "/payload/target/owner/generation",
                          schemaPath:
                            "/properties/payload/mapping/deleteProfile/properties/target/properties/owner/properties/generation/type",
                          keyword: "type",
                          params: { type: "string", nullable: false },
                          message: "must be string",
                        };
                        if (vErrors === null) {
                          vErrors = [err74];
                        } else {
                          vErrors.push(err74);
                        }
                        errors++;
                      }
                    } else {
                      const err75 = {
                        instancePath: instancePath + "/payload/target/owner",
                        schemaPath:
                          "/properties/payload/mapping/deleteProfile/properties/target/properties/owner/properties/generation",
                        keyword: "properties",
                        params: {
                          error: "missing",
                          missingProperty: "generation",
                        },
                        message: "must have property 'generation'",
                      };
                      if (vErrors === null) {
                        vErrors = [err75];
                      } else {
                        vErrors.push(err75);
                      }
                      errors++;
                    }
                    for (const key10 in data33) {
                      if (key10 !== "profileId" && key10 !== "generation") {
                        const err76 = {
                          instancePath:
                            instancePath +
                            "/payload/target/owner/" +
                            key10.replace(/~/g, "~0").replace(/\//g, "~1"),
                          schemaPath:
                            "/properties/payload/mapping/deleteProfile/properties/target/properties/owner",
                          keyword: "properties",
                          params: {
                            error: "additional",
                            additionalProperty: key10,
                          },
                          message: "must NOT have additional properties",
                        };
                        if (vErrors === null) {
                          vErrors = [err76];
                        } else {
                          vErrors.push(err76);
                        }
                        errors++;
                      }
                    }
                  }
                  if (!valid42) {
                    const err77 = {
                      instancePath: instancePath + "/payload/target/owner",
                      schemaPath:
                        "/properties/payload/mapping/deleteProfile/properties/target/properties/owner/properties",
                      keyword: "properties",
                      params: { type: "object", nullable: false },
                      message: "must be object",
                    };
                    if (vErrors === null) {
                      vErrors = [err77];
                    } else {
                      vErrors.push(err77);
                    }
                    errors++;
                  }
                } else {
                  const err78 = {
                    instancePath: instancePath + "/payload/target",
                    schemaPath:
                      "/properties/payload/mapping/deleteProfile/properties/target/properties/owner",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "owner" },
                    message: "must have property 'owner'",
                  };
                  if (vErrors === null) {
                    vErrors = [err78];
                  } else {
                    vErrors.push(err78);
                  }
                  errors++;
                }
                if (data32.revision !== undefined) {
                  if (!(typeof data32.revision == "string")) {
                    const err79 = {
                      instancePath: instancePath + "/payload/target/revision",
                      schemaPath:
                        "/properties/payload/mapping/deleteProfile/properties/target/properties/revision/type",
                      keyword: "type",
                      params: { type: "string", nullable: false },
                      message: "must be string",
                    };
                    if (vErrors === null) {
                      vErrors = [err79];
                    } else {
                      vErrors.push(err79);
                    }
                    errors++;
                  }
                } else {
                  const err80 = {
                    instancePath: instancePath + "/payload/target",
                    schemaPath:
                      "/properties/payload/mapping/deleteProfile/properties/target/properties/revision",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "revision" },
                    message: "must have property 'revision'",
                  };
                  if (vErrors === null) {
                    vErrors = [err80];
                  } else {
                    vErrors.push(err80);
                  }
                  errors++;
                }
                for (const key11 in data32) {
                  if (key11 !== "owner" && key11 !== "revision") {
                    const err81 = {
                      instancePath:
                        instancePath +
                        "/payload/target/" +
                        key11.replace(/~/g, "~0").replace(/\//g, "~1"),
                      schemaPath:
                        "/properties/payload/mapping/deleteProfile/properties/target",
                      keyword: "properties",
                      params: {
                        error: "additional",
                        additionalProperty: key11,
                      },
                      message: "must NOT have additional properties",
                    };
                    if (vErrors === null) {
                      vErrors = [err81];
                    } else {
                      vErrors.push(err81);
                    }
                    errors++;
                  }
                }
              }
              if (!valid40) {
                const err82 = {
                  instancePath: instancePath + "/payload/target",
                  schemaPath:
                    "/properties/payload/mapping/deleteProfile/properties/target/properties",
                  keyword: "properties",
                  params: { type: "object", nullable: false },
                  message: "must be object",
                };
                if (vErrors === null) {
                  vErrors = [err82];
                } else {
                  vErrors.push(err82);
                }
                errors++;
              }
            } else {
              const err83 = {
                instancePath: instancePath + "/payload",
                schemaPath:
                  "/properties/payload/mapping/deleteProfile/properties/target",
                keyword: "properties",
                params: { error: "missing", missingProperty: "target" },
                message: "must have property 'target'",
              };
              if (vErrors === null) {
                vErrors = [err83];
              } else {
                vErrors.push(err83);
              }
              errors++;
            }
            if (data12.departure !== undefined) {
              let data37 = data12.departure;
              let valid46 = false;
              if (
                data37 &&
                typeof data37 == "object" &&
                !Array.isArray(data37)
              ) {
                valid46 = true;
                if (data37.courses !== undefined) {
                  let data38 = data37.courses;
                  let valid48 = false;
                  if (!valid48) {
                    if (Array.isArray(data38)) {
                      let valid50 = true;
                      const len1 = data38.length;
                      for (let i1 = 0; i1 < len1; i1++) {
                        let data39 = data38[i1];
                        const _errs42 = errors;
                        let valid51 = false;
                        if (
                          data39 &&
                          typeof data39 == "object" &&
                          !Array.isArray(data39)
                        ) {
                          valid51 = true;
                          if (data39.courseId !== undefined) {
                            if (!(typeof data39.courseId == "string")) {
                              const err84 = {
                                instancePath:
                                  instancePath +
                                  "/payload/departure/courses/" +
                                  i1 +
                                  "/courseId",
                                schemaPath:
                                  "/properties/payload/mapping/deleteProfile/properties/departure/properties/courses/elements/properties/courseId/type",
                                keyword: "type",
                                params: { type: "string", nullable: false },
                                message: "must be string",
                              };
                              if (vErrors === null) {
                                vErrors = [err84];
                              } else {
                                vErrors.push(err84);
                              }
                              errors++;
                            }
                          } else {
                            const err85 = {
                              instancePath:
                                instancePath +
                                "/payload/departure/courses/" +
                                i1,
                              schemaPath:
                                "/properties/payload/mapping/deleteProfile/properties/departure/properties/courses/elements/properties/courseId",
                              keyword: "properties",
                              params: {
                                error: "missing",
                                missingProperty: "courseId",
                              },
                              message: "must have property 'courseId'",
                            };
                            if (vErrors === null) {
                              vErrors = [err85];
                            } else {
                              vErrors.push(err85);
                            }
                            errors++;
                          }
                          if (data39.witness !== undefined) {
                            let data41 = data39.witness;
                            let valid53 = false;
                            if (
                              data41 &&
                              typeof data41 == "object" &&
                              !Array.isArray(data41)
                            ) {
                              valid53 = true;
                              if (data41.owner !== undefined) {
                                let data42 = data41.owner;
                                let valid55 = false;
                                if (
                                  data42 &&
                                  typeof data42 == "object" &&
                                  !Array.isArray(data42)
                                ) {
                                  valid55 = true;
                                  if (data42.profileId !== undefined) {
                                    if (
                                      !(typeof data42.profileId == "string")
                                    ) {
                                      const err86 = {
                                        instancePath:
                                          instancePath +
                                          "/payload/departure/courses/" +
                                          i1 +
                                          "/witness/owner/profileId",
                                        schemaPath:
                                          "/properties/payload/mapping/deleteProfile/properties/departure/properties/courses/elements/properties/witness/properties/owner/properties/profileId/type",
                                        keyword: "type",
                                        params: {
                                          type: "string",
                                          nullable: false,
                                        },
                                        message: "must be string",
                                      };
                                      if (vErrors === null) {
                                        vErrors = [err86];
                                      } else {
                                        vErrors.push(err86);
                                      }
                                      errors++;
                                    }
                                  } else {
                                    const err87 = {
                                      instancePath:
                                        instancePath +
                                        "/payload/departure/courses/" +
                                        i1 +
                                        "/witness/owner",
                                      schemaPath:
                                        "/properties/payload/mapping/deleteProfile/properties/departure/properties/courses/elements/properties/witness/properties/owner/properties/profileId",
                                      keyword: "properties",
                                      params: {
                                        error: "missing",
                                        missingProperty: "profileId",
                                      },
                                      message: "must have property 'profileId'",
                                    };
                                    if (vErrors === null) {
                                      vErrors = [err87];
                                    } else {
                                      vErrors.push(err87);
                                    }
                                    errors++;
                                  }
                                  if (data42.generation !== undefined) {
                                    if (
                                      !(typeof data42.generation == "string")
                                    ) {
                                      const err88 = {
                                        instancePath:
                                          instancePath +
                                          "/payload/departure/courses/" +
                                          i1 +
                                          "/witness/owner/generation",
                                        schemaPath:
                                          "/properties/payload/mapping/deleteProfile/properties/departure/properties/courses/elements/properties/witness/properties/owner/properties/generation/type",
                                        keyword: "type",
                                        params: {
                                          type: "string",
                                          nullable: false,
                                        },
                                        message: "must be string",
                                      };
                                      if (vErrors === null) {
                                        vErrors = [err88];
                                      } else {
                                        vErrors.push(err88);
                                      }
                                      errors++;
                                    }
                                  } else {
                                    const err89 = {
                                      instancePath:
                                        instancePath +
                                        "/payload/departure/courses/" +
                                        i1 +
                                        "/witness/owner",
                                      schemaPath:
                                        "/properties/payload/mapping/deleteProfile/properties/departure/properties/courses/elements/properties/witness/properties/owner/properties/generation",
                                      keyword: "properties",
                                      params: {
                                        error: "missing",
                                        missingProperty: "generation",
                                      },
                                      message:
                                        "must have property 'generation'",
                                    };
                                    if (vErrors === null) {
                                      vErrors = [err89];
                                    } else {
                                      vErrors.push(err89);
                                    }
                                    errors++;
                                  }
                                  for (const key12 in data42) {
                                    if (
                                      key12 !== "profileId" &&
                                      key12 !== "generation"
                                    ) {
                                      const err90 = {
                                        instancePath:
                                          instancePath +
                                          "/payload/departure/courses/" +
                                          i1 +
                                          "/witness/owner/" +
                                          key12
                                            .replace(/~/g, "~0")
                                            .replace(/\//g, "~1"),
                                        schemaPath:
                                          "/properties/payload/mapping/deleteProfile/properties/departure/properties/courses/elements/properties/witness/properties/owner",
                                        keyword: "properties",
                                        params: {
                                          error: "additional",
                                          additionalProperty: key12,
                                        },
                                        message:
                                          "must NOT have additional properties",
                                      };
                                      if (vErrors === null) {
                                        vErrors = [err90];
                                      } else {
                                        vErrors.push(err90);
                                      }
                                      errors++;
                                    }
                                  }
                                }
                                if (!valid55) {
                                  const err91 = {
                                    instancePath:
                                      instancePath +
                                      "/payload/departure/courses/" +
                                      i1 +
                                      "/witness/owner",
                                    schemaPath:
                                      "/properties/payload/mapping/deleteProfile/properties/departure/properties/courses/elements/properties/witness/properties/owner/properties",
                                    keyword: "properties",
                                    params: { type: "object", nullable: false },
                                    message: "must be object",
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err91];
                                  } else {
                                    vErrors.push(err91);
                                  }
                                  errors++;
                                }
                              } else {
                                const err92 = {
                                  instancePath:
                                    instancePath +
                                    "/payload/departure/courses/" +
                                    i1 +
                                    "/witness",
                                  schemaPath:
                                    "/properties/payload/mapping/deleteProfile/properties/departure/properties/courses/elements/properties/witness/properties/owner",
                                  keyword: "properties",
                                  params: {
                                    error: "missing",
                                    missingProperty: "owner",
                                  },
                                  message: "must have property 'owner'",
                                };
                                if (vErrors === null) {
                                  vErrors = [err92];
                                } else {
                                  vErrors.push(err92);
                                }
                                errors++;
                              }
                              if (data41.profileRevision !== undefined) {
                                if (
                                  !(typeof data41.profileRevision == "string")
                                ) {
                                  const err93 = {
                                    instancePath:
                                      instancePath +
                                      "/payload/departure/courses/" +
                                      i1 +
                                      "/witness/profileRevision",
                                    schemaPath:
                                      "/properties/payload/mapping/deleteProfile/properties/departure/properties/courses/elements/properties/witness/properties/profileRevision/type",
                                    keyword: "type",
                                    params: { type: "string", nullable: false },
                                    message: "must be string",
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err93];
                                  } else {
                                    vErrors.push(err93);
                                  }
                                  errors++;
                                }
                              } else {
                                const err94 = {
                                  instancePath:
                                    instancePath +
                                    "/payload/departure/courses/" +
                                    i1 +
                                    "/witness",
                                  schemaPath:
                                    "/properties/payload/mapping/deleteProfile/properties/departure/properties/courses/elements/properties/witness/properties/profileRevision",
                                  keyword: "properties",
                                  params: {
                                    error: "missing",
                                    missingProperty: "profileRevision",
                                  },
                                  message:
                                    "must have property 'profileRevision'",
                                };
                                if (vErrors === null) {
                                  vErrors = [err94];
                                } else {
                                  vErrors.push(err94);
                                }
                                errors++;
                              }
                              if (data41.activePackageHash !== undefined) {
                                if (
                                  !(typeof data41.activePackageHash == "string")
                                ) {
                                  const err95 = {
                                    instancePath:
                                      instancePath +
                                      "/payload/departure/courses/" +
                                      i1 +
                                      "/witness/activePackageHash",
                                    schemaPath:
                                      "/properties/payload/mapping/deleteProfile/properties/departure/properties/courses/elements/properties/witness/properties/activePackageHash/type",
                                    keyword: "type",
                                    params: { type: "string", nullable: false },
                                    message: "must be string",
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err95];
                                  } else {
                                    vErrors.push(err95);
                                  }
                                  errors++;
                                }
                              } else {
                                const err96 = {
                                  instancePath:
                                    instancePath +
                                    "/payload/departure/courses/" +
                                    i1 +
                                    "/witness",
                                  schemaPath:
                                    "/properties/payload/mapping/deleteProfile/properties/departure/properties/courses/elements/properties/witness/properties/activePackageHash",
                                  keyword: "properties",
                                  params: {
                                    error: "missing",
                                    missingProperty: "activePackageHash",
                                  },
                                  message:
                                    "must have property 'activePackageHash'",
                                };
                                if (vErrors === null) {
                                  vErrors = [err96];
                                } else {
                                  vErrors.push(err96);
                                }
                                errors++;
                              }
                              if (data41.activationRevision !== undefined) {
                                if (
                                  !(
                                    typeof data41.activationRevision == "string"
                                  )
                                ) {
                                  const err97 = {
                                    instancePath:
                                      instancePath +
                                      "/payload/departure/courses/" +
                                      i1 +
                                      "/witness/activationRevision",
                                    schemaPath:
                                      "/properties/payload/mapping/deleteProfile/properties/departure/properties/courses/elements/properties/witness/properties/activationRevision/type",
                                    keyword: "type",
                                    params: { type: "string", nullable: false },
                                    message: "must be string",
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err97];
                                  } else {
                                    vErrors.push(err97);
                                  }
                                  errors++;
                                }
                              } else {
                                const err98 = {
                                  instancePath:
                                    instancePath +
                                    "/payload/departure/courses/" +
                                    i1 +
                                    "/witness",
                                  schemaPath:
                                    "/properties/payload/mapping/deleteProfile/properties/departure/properties/courses/elements/properties/witness/properties/activationRevision",
                                  keyword: "properties",
                                  params: {
                                    error: "missing",
                                    missingProperty: "activationRevision",
                                  },
                                  message:
                                    "must have property 'activationRevision'",
                                };
                                if (vErrors === null) {
                                  vErrors = [err98];
                                } else {
                                  vErrors.push(err98);
                                }
                                errors++;
                              }
                              if (data41.cursorRevision !== undefined) {
                                if (
                                  !(typeof data41.cursorRevision == "string")
                                ) {
                                  const err99 = {
                                    instancePath:
                                      instancePath +
                                      "/payload/departure/courses/" +
                                      i1 +
                                      "/witness/cursorRevision",
                                    schemaPath:
                                      "/properties/payload/mapping/deleteProfile/properties/departure/properties/courses/elements/properties/witness/properties/cursorRevision/type",
                                    keyword: "type",
                                    params: { type: "string", nullable: false },
                                    message: "must be string",
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err99];
                                  } else {
                                    vErrors.push(err99);
                                  }
                                  errors++;
                                }
                              } else {
                                const err100 = {
                                  instancePath:
                                    instancePath +
                                    "/payload/departure/courses/" +
                                    i1 +
                                    "/witness",
                                  schemaPath:
                                    "/properties/payload/mapping/deleteProfile/properties/departure/properties/courses/elements/properties/witness/properties/cursorRevision",
                                  keyword: "properties",
                                  params: {
                                    error: "missing",
                                    missingProperty: "cursorRevision",
                                  },
                                  message:
                                    "must have property 'cursorRevision'",
                                };
                                if (vErrors === null) {
                                  vErrors = [err100];
                                } else {
                                  vErrors.push(err100);
                                }
                                errors++;
                              }
                              if (
                                data41.selectedSessionRevision !== undefined
                              ) {
                                let data49 = data41.selectedSessionRevision;
                                if (!(
                                  data49 === null || typeof data49 == "string"
                                )) {
                                  const err101 = {
                                    instancePath:
                                      instancePath +
                                      "/payload/departure/courses/" +
                                      i1 +
                                      "/witness/selectedSessionRevision",
                                    schemaPath:
                                      "/properties/payload/mapping/deleteProfile/properties/departure/properties/courses/elements/properties/witness/properties/selectedSessionRevision/type",
                                    keyword: "type",
                                    params: { type: "string", nullable: true },
                                    message: "must be string or null",
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err101];
                                  } else {
                                    vErrors.push(err101);
                                  }
                                  errors++;
                                }
                              } else {
                                const err102 = {
                                  instancePath:
                                    instancePath +
                                    "/payload/departure/courses/" +
                                    i1 +
                                    "/witness",
                                  schemaPath:
                                    "/properties/payload/mapping/deleteProfile/properties/departure/properties/courses/elements/properties/witness/properties/selectedSessionRevision",
                                  keyword: "properties",
                                  params: {
                                    error: "missing",
                                    missingProperty: "selectedSessionRevision",
                                  },
                                  message:
                                    "must have property 'selectedSessionRevision'",
                                };
                                if (vErrors === null) {
                                  vErrors = [err102];
                                } else {
                                  vErrors.push(err102);
                                }
                                errors++;
                              }
                              for (const key13 in data41) {
                                if (
                                  key13 !== "owner" &&
                                  key13 !== "profileRevision" &&
                                  key13 !== "activePackageHash" &&
                                  key13 !== "activationRevision" &&
                                  key13 !== "cursorRevision" &&
                                  key13 !== "selectedSessionRevision"
                                ) {
                                  const err103 = {
                                    instancePath:
                                      instancePath +
                                      "/payload/departure/courses/" +
                                      i1 +
                                      "/witness/" +
                                      key13
                                        .replace(/~/g, "~0")
                                        .replace(/\//g, "~1"),
                                    schemaPath:
                                      "/properties/payload/mapping/deleteProfile/properties/departure/properties/courses/elements/properties/witness",
                                    keyword: "properties",
                                    params: {
                                      error: "additional",
                                      additionalProperty: key13,
                                    },
                                    message:
                                      "must NOT have additional properties",
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err103];
                                  } else {
                                    vErrors.push(err103);
                                  }
                                  errors++;
                                }
                              }
                            }
                            if (!valid53) {
                              const err104 = {
                                instancePath:
                                  instancePath +
                                  "/payload/departure/courses/" +
                                  i1 +
                                  "/witness",
                                schemaPath:
                                  "/properties/payload/mapping/deleteProfile/properties/departure/properties/courses/elements/properties/witness/properties",
                                keyword: "properties",
                                params: { type: "object", nullable: false },
                                message: "must be object",
                              };
                              if (vErrors === null) {
                                vErrors = [err104];
                              } else {
                                vErrors.push(err104);
                              }
                              errors++;
                            }
                          } else {
                            const err105 = {
                              instancePath:
                                instancePath +
                                "/payload/departure/courses/" +
                                i1,
                              schemaPath:
                                "/properties/payload/mapping/deleteProfile/properties/departure/properties/courses/elements/properties/witness",
                              keyword: "properties",
                              params: {
                                error: "missing",
                                missingProperty: "witness",
                              },
                              message: "must have property 'witness'",
                            };
                            if (vErrors === null) {
                              vErrors = [err105];
                            } else {
                              vErrors.push(err105);
                            }
                            errors++;
                          }
                          if (data39.documents !== undefined) {
                          } else {
                            const err106 = {
                              instancePath:
                                instancePath +
                                "/payload/departure/courses/" +
                                i1,
                              schemaPath:
                                "/properties/payload/mapping/deleteProfile/properties/departure/properties/courses/elements/properties/documents",
                              keyword: "properties",
                              params: {
                                error: "missing",
                                missingProperty: "documents",
                              },
                              message: "must have property 'documents'",
                            };
                            if (vErrors === null) {
                              vErrors = [err106];
                            } else {
                              vErrors.push(err106);
                            }
                            errors++;
                          }
                          for (const key14 in data39) {
                            if (
                              key14 !== "courseId" &&
                              key14 !== "witness" &&
                              key14 !== "documents"
                            ) {
                              const err107 = {
                                instancePath:
                                  instancePath +
                                  "/payload/departure/courses/" +
                                  i1 +
                                  "/" +
                                  key14
                                    .replace(/~/g, "~0")
                                    .replace(/\//g, "~1"),
                                schemaPath:
                                  "/properties/payload/mapping/deleteProfile/properties/departure/properties/courses/elements",
                                keyword: "properties",
                                params: {
                                  error: "additional",
                                  additionalProperty: key14,
                                },
                                message: "must NOT have additional properties",
                              };
                              if (vErrors === null) {
                                vErrors = [err107];
                              } else {
                                vErrors.push(err107);
                              }
                              errors++;
                            }
                          }
                        }
                        if (!valid51) {
                          const err108 = {
                            instancePath:
                              instancePath + "/payload/departure/courses/" + i1,
                            schemaPath:
                              "/properties/payload/mapping/deleteProfile/properties/departure/properties/courses/elements/properties",
                            keyword: "properties",
                            params: { type: "object", nullable: false },
                            message: "must be object",
                          };
                          if (vErrors === null) {
                            vErrors = [err108];
                          } else {
                            vErrors.push(err108);
                          }
                          errors++;
                        }
                        var valid49 = _errs42 === errors;
                        if (!valid49) {
                          valid50 = false;
                        }
                      }
                      valid48 = valid50;
                    } else {
                      const err109 = {
                        instancePath:
                          instancePath + "/payload/departure/courses",
                        schemaPath:
                          "/properties/payload/mapping/deleteProfile/properties/departure/properties/courses/elements",
                        keyword: "elements",
                        params: { type: "array", nullable: false },
                        message: "must be array",
                      };
                      if (vErrors === null) {
                        vErrors = [err109];
                      } else {
                        vErrors.push(err109);
                      }
                      errors++;
                    }
                  }
                } else {
                  const err110 = {
                    instancePath: instancePath + "/payload/departure",
                    schemaPath:
                      "/properties/payload/mapping/deleteProfile/properties/departure/properties/courses",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "courses" },
                    message: "must have property 'courses'",
                  };
                  if (vErrors === null) {
                    vErrors = [err110];
                  } else {
                    vErrors.push(err110);
                  }
                  errors++;
                }
                for (const key15 in data37) {
                  if (key15 !== "courses") {
                    const err111 = {
                      instancePath:
                        instancePath +
                        "/payload/departure/" +
                        key15.replace(/~/g, "~0").replace(/\//g, "~1"),
                      schemaPath:
                        "/properties/payload/mapping/deleteProfile/properties/departure",
                      keyword: "properties",
                      params: {
                        error: "additional",
                        additionalProperty: key15,
                      },
                      message: "must NOT have additional properties",
                    };
                    if (vErrors === null) {
                      vErrors = [err111];
                    } else {
                      vErrors.push(err111);
                    }
                    errors++;
                  }
                }
              }
              if (!valid46) {
                const err112 = {
                  instancePath: instancePath + "/payload/departure",
                  schemaPath:
                    "/properties/payload/mapping/deleteProfile/properties/departure/properties",
                  keyword: "properties",
                  params: { type: "object", nullable: false },
                  message: "must be object",
                };
                if (vErrors === null) {
                  vErrors = [err112];
                } else {
                  vErrors.push(err112);
                }
                errors++;
              }
            } else {
              const err113 = {
                instancePath: instancePath + "/payload",
                schemaPath:
                  "/properties/payload/mapping/deleteProfile/properties/departure",
                keyword: "properties",
                params: { error: "missing", missingProperty: "departure" },
                message: "must have property 'departure'",
              };
              if (vErrors === null) {
                vErrors = [err113];
              } else {
                vErrors.push(err113);
              }
              errors++;
            }
            if (data12.successor !== undefined) {
              let data51 = data12.successor;
              let valid61 = false;
              if (
                data51 &&
                typeof data51 == "object" &&
                !Array.isArray(data51)
              ) {
                const tag1 = data51.kind;
                if (tag1 === undefined) {
                  const err114 = {
                    instancePath: instancePath + "/payload/successor",
                    schemaPath:
                      "/properties/payload/mapping/deleteProfile/properties/successor/discriminator",
                    keyword: "discriminator",
                    params: { error: "tag", tag: "kind", tagValue: tag1 },
                    message: 'tag "kind" must be string',
                  };
                  if (vErrors === null) {
                    vErrors = [err114];
                  } else {
                    vErrors.push(err114);
                  }
                  errors++;
                } else if (typeof tag1 == "string") {
                  if (tag1 === "existing") {
                    const _errs56 = errors;
                    let valid63 = false;
                    valid63 = true;
                    if (data51.owner !== undefined) {
                      let data52 = data51.owner;
                      let valid65 = false;
                      if (
                        data52 &&
                        typeof data52 == "object" &&
                        !Array.isArray(data52)
                      ) {
                        valid65 = true;
                        if (data52.profileId !== undefined) {
                          if (!(typeof data52.profileId == "string")) {
                            const err115 = {
                              instancePath:
                                instancePath +
                                "/payload/successor/owner/profileId",
                              schemaPath:
                                "/properties/payload/mapping/deleteProfile/properties/successor/mapping/existing/properties/owner/properties/profileId/type",
                              keyword: "type",
                              params: { type: "string", nullable: false },
                              message: "must be string",
                            };
                            if (vErrors === null) {
                              vErrors = [err115];
                            } else {
                              vErrors.push(err115);
                            }
                            errors++;
                          }
                        } else {
                          const err116 = {
                            instancePath:
                              instancePath + "/payload/successor/owner",
                            schemaPath:
                              "/properties/payload/mapping/deleteProfile/properties/successor/mapping/existing/properties/owner/properties/profileId",
                            keyword: "properties",
                            params: {
                              error: "missing",
                              missingProperty: "profileId",
                            },
                            message: "must have property 'profileId'",
                          };
                          if (vErrors === null) {
                            vErrors = [err116];
                          } else {
                            vErrors.push(err116);
                          }
                          errors++;
                        }
                        if (data52.generation !== undefined) {
                          if (!(typeof data52.generation == "string")) {
                            const err117 = {
                              instancePath:
                                instancePath +
                                "/payload/successor/owner/generation",
                              schemaPath:
                                "/properties/payload/mapping/deleteProfile/properties/successor/mapping/existing/properties/owner/properties/generation/type",
                              keyword: "type",
                              params: { type: "string", nullable: false },
                              message: "must be string",
                            };
                            if (vErrors === null) {
                              vErrors = [err117];
                            } else {
                              vErrors.push(err117);
                            }
                            errors++;
                          }
                        } else {
                          const err118 = {
                            instancePath:
                              instancePath + "/payload/successor/owner",
                            schemaPath:
                              "/properties/payload/mapping/deleteProfile/properties/successor/mapping/existing/properties/owner/properties/generation",
                            keyword: "properties",
                            params: {
                              error: "missing",
                              missingProperty: "generation",
                            },
                            message: "must have property 'generation'",
                          };
                          if (vErrors === null) {
                            vErrors = [err118];
                          } else {
                            vErrors.push(err118);
                          }
                          errors++;
                        }
                        for (const key16 in data52) {
                          if (key16 !== "profileId" && key16 !== "generation") {
                            const err119 = {
                              instancePath:
                                instancePath +
                                "/payload/successor/owner/" +
                                key16.replace(/~/g, "~0").replace(/\//g, "~1"),
                              schemaPath:
                                "/properties/payload/mapping/deleteProfile/properties/successor/mapping/existing/properties/owner",
                              keyword: "properties",
                              params: {
                                error: "additional",
                                additionalProperty: key16,
                              },
                              message: "must NOT have additional properties",
                            };
                            if (vErrors === null) {
                              vErrors = [err119];
                            } else {
                              vErrors.push(err119);
                            }
                            errors++;
                          }
                        }
                      }
                      if (!valid65) {
                        const err120 = {
                          instancePath:
                            instancePath + "/payload/successor/owner",
                          schemaPath:
                            "/properties/payload/mapping/deleteProfile/properties/successor/mapping/existing/properties/owner/properties",
                          keyword: "properties",
                          params: { type: "object", nullable: false },
                          message: "must be object",
                        };
                        if (vErrors === null) {
                          vErrors = [err120];
                        } else {
                          vErrors.push(err120);
                        }
                        errors++;
                      }
                    } else {
                      const err121 = {
                        instancePath: instancePath + "/payload/successor",
                        schemaPath:
                          "/properties/payload/mapping/deleteProfile/properties/successor/mapping/existing/properties/owner",
                        keyword: "properties",
                        params: { error: "missing", missingProperty: "owner" },
                        message: "must have property 'owner'",
                      };
                      if (vErrors === null) {
                        vErrors = [err121];
                      } else {
                        vErrors.push(err121);
                      }
                      errors++;
                    }
                    for (const key17 in data51) {
                      if (key17 !== "kind" && key17 !== "owner") {
                        const err122 = {
                          instancePath:
                            instancePath +
                            "/payload/successor/" +
                            key17.replace(/~/g, "~0").replace(/\//g, "~1"),
                          schemaPath:
                            "/properties/payload/mapping/deleteProfile/properties/successor/mapping/existing",
                          keyword: "properties",
                          params: {
                            error: "additional",
                            additionalProperty: key17,
                          },
                          message: "must NOT have additional properties",
                        };
                        if (vErrors === null) {
                          vErrors = [err122];
                        } else {
                          vErrors.push(err122);
                        }
                        errors++;
                      }
                    }
                    if (!valid63) {
                      const err123 = {
                        instancePath: instancePath + "/payload/successor",
                        schemaPath:
                          "/properties/payload/mapping/deleteProfile/properties/successor/mapping/existing/properties",
                        keyword: "properties",
                        params: { type: "object", nullable: false },
                        message: "must be object",
                      };
                      if (vErrors === null) {
                        vErrors = [err123];
                      } else {
                        vErrors.push(err123);
                      }
                      errors++;
                    }
                    var valid62 = _errs56 === errors;
                    valid61 = valid62;
                  } else if (tag1 === "replacement") {
                    const _errs60 = errors;
                    let valid70 = false;
                    valid70 = true;
                    if (data51.owner !== undefined) {
                      let data55 = data51.owner;
                      let valid72 = false;
                      if (
                        data55 &&
                        typeof data55 == "object" &&
                        !Array.isArray(data55)
                      ) {
                        valid72 = true;
                        if (data55.profileId !== undefined) {
                          if (!(typeof data55.profileId == "string")) {
                            const err124 = {
                              instancePath:
                                instancePath +
                                "/payload/successor/owner/profileId",
                              schemaPath:
                                "/properties/payload/mapping/deleteProfile/properties/successor/mapping/replacement/properties/owner/properties/profileId/type",
                              keyword: "type",
                              params: { type: "string", nullable: false },
                              message: "must be string",
                            };
                            if (vErrors === null) {
                              vErrors = [err124];
                            } else {
                              vErrors.push(err124);
                            }
                            errors++;
                          }
                        } else {
                          const err125 = {
                            instancePath:
                              instancePath + "/payload/successor/owner",
                            schemaPath:
                              "/properties/payload/mapping/deleteProfile/properties/successor/mapping/replacement/properties/owner/properties/profileId",
                            keyword: "properties",
                            params: {
                              error: "missing",
                              missingProperty: "profileId",
                            },
                            message: "must have property 'profileId'",
                          };
                          if (vErrors === null) {
                            vErrors = [err125];
                          } else {
                            vErrors.push(err125);
                          }
                          errors++;
                        }
                        if (data55.generation !== undefined) {
                          if (!(typeof data55.generation == "string")) {
                            const err126 = {
                              instancePath:
                                instancePath +
                                "/payload/successor/owner/generation",
                              schemaPath:
                                "/properties/payload/mapping/deleteProfile/properties/successor/mapping/replacement/properties/owner/properties/generation/type",
                              keyword: "type",
                              params: { type: "string", nullable: false },
                              message: "must be string",
                            };
                            if (vErrors === null) {
                              vErrors = [err126];
                            } else {
                              vErrors.push(err126);
                            }
                            errors++;
                          }
                        } else {
                          const err127 = {
                            instancePath:
                              instancePath + "/payload/successor/owner",
                            schemaPath:
                              "/properties/payload/mapping/deleteProfile/properties/successor/mapping/replacement/properties/owner/properties/generation",
                            keyword: "properties",
                            params: {
                              error: "missing",
                              missingProperty: "generation",
                            },
                            message: "must have property 'generation'",
                          };
                          if (vErrors === null) {
                            vErrors = [err127];
                          } else {
                            vErrors.push(err127);
                          }
                          errors++;
                        }
                        for (const key18 in data55) {
                          if (key18 !== "profileId" && key18 !== "generation") {
                            const err128 = {
                              instancePath:
                                instancePath +
                                "/payload/successor/owner/" +
                                key18.replace(/~/g, "~0").replace(/\//g, "~1"),
                              schemaPath:
                                "/properties/payload/mapping/deleteProfile/properties/successor/mapping/replacement/properties/owner",
                              keyword: "properties",
                              params: {
                                error: "additional",
                                additionalProperty: key18,
                              },
                              message: "must NOT have additional properties",
                            };
                            if (vErrors === null) {
                              vErrors = [err128];
                            } else {
                              vErrors.push(err128);
                            }
                            errors++;
                          }
                        }
                      }
                      if (!valid72) {
                        const err129 = {
                          instancePath:
                            instancePath + "/payload/successor/owner",
                          schemaPath:
                            "/properties/payload/mapping/deleteProfile/properties/successor/mapping/replacement/properties/owner/properties",
                          keyword: "properties",
                          params: { type: "object", nullable: false },
                          message: "must be object",
                        };
                        if (vErrors === null) {
                          vErrors = [err129];
                        } else {
                          vErrors.push(err129);
                        }
                        errors++;
                      }
                    } else {
                      const err130 = {
                        instancePath: instancePath + "/payload/successor",
                        schemaPath:
                          "/properties/payload/mapping/deleteProfile/properties/successor/mapping/replacement/properties/owner",
                        keyword: "properties",
                        params: { error: "missing", missingProperty: "owner" },
                        message: "must have property 'owner'",
                      };
                      if (vErrors === null) {
                        vErrors = [err130];
                      } else {
                        vErrors.push(err130);
                      }
                      errors++;
                    }
                    if (data51.preferences !== undefined) {
                      let data58 = data51.preferences;
                      let valid75 = false;
                      if (
                        data58 &&
                        typeof data58 == "object" &&
                        !Array.isArray(data58)
                      ) {
                        valid75 = true;
                        if (data58.avatarId !== undefined) {
                          let data59 = data58.avatarId;
                          if (!(
                            typeof data59 == "string" &&
                            (data59 === "rabbit" ||
                              data59 === "fox" ||
                              data59 === "bear" ||
                              data59 === "owl" ||
                              data59 === "turtle" ||
                              data59 === "bird" ||
                              data59 === "frog" ||
                              data59 === "cat")
                          )) {
                            const err131 = {
                              instancePath:
                                instancePath +
                                "/payload/successor/preferences/avatarId",
                              schemaPath:
                                "/properties/payload/mapping/deleteProfile/properties/successor/mapping/replacement/properties/preferences/properties/avatarId/enum",
                              keyword: "enum",
                              params: {
                                allowedValues:
                                  schema31.properties.payload.mapping
                                    .deleteProfile.properties.successor.mapping
                                    .replacement.properties.preferences
                                    .properties.avatarId.enum,
                              },
                              message:
                                "must be equal to one of the allowed values",
                            };
                            if (vErrors === null) {
                              vErrors = [err131];
                            } else {
                              vErrors.push(err131);
                            }
                            errors++;
                          }
                        } else {
                          const err132 = {
                            instancePath:
                              instancePath + "/payload/successor/preferences",
                            schemaPath:
                              "/properties/payload/mapping/deleteProfile/properties/successor/mapping/replacement/properties/preferences/properties/avatarId",
                            keyword: "properties",
                            params: {
                              error: "missing",
                              missingProperty: "avatarId",
                            },
                            message: "must have property 'avatarId'",
                          };
                          if (vErrors === null) {
                            vErrors = [err132];
                          } else {
                            vErrors.push(err132);
                          }
                          errors++;
                        }
                        if (data58.displayName !== undefined) {
                          if (!(typeof data58.displayName == "string")) {
                            const err133 = {
                              instancePath:
                                instancePath +
                                "/payload/successor/preferences/displayName",
                              schemaPath:
                                "/properties/payload/mapping/deleteProfile/properties/successor/mapping/replacement/properties/preferences/optionalProperties/displayName/type",
                              keyword: "type",
                              params: { type: "string", nullable: false },
                              message: "must be string",
                            };
                            if (vErrors === null) {
                              vErrors = [err133];
                            } else {
                              vErrors.push(err133);
                            }
                            errors++;
                          }
                        }
                        for (const key19 in data58) {
                          if (key19 !== "avatarId" && key19 !== "displayName") {
                            const err134 = {
                              instancePath:
                                instancePath +
                                "/payload/successor/preferences/" +
                                key19.replace(/~/g, "~0").replace(/\//g, "~1"),
                              schemaPath:
                                "/properties/payload/mapping/deleteProfile/properties/successor/mapping/replacement/properties/preferences",
                              keyword: "properties",
                              params: {
                                error: "additional",
                                additionalProperty: key19,
                              },
                              message: "must NOT have additional properties",
                            };
                            if (vErrors === null) {
                              vErrors = [err134];
                            } else {
                              vErrors.push(err134);
                            }
                            errors++;
                          }
                        }
                      }
                      if (!valid75) {
                        const err135 = {
                          instancePath:
                            instancePath + "/payload/successor/preferences",
                          schemaPath:
                            "/properties/payload/mapping/deleteProfile/properties/successor/mapping/replacement/properties/preferences/properties",
                          keyword: "properties",
                          params: { type: "object", nullable: false },
                          message: "must be object",
                        };
                        if (vErrors === null) {
                          vErrors = [err135];
                        } else {
                          vErrors.push(err135);
                        }
                        errors++;
                      }
                    } else {
                      const err136 = {
                        instancePath: instancePath + "/payload/successor",
                        schemaPath:
                          "/properties/payload/mapping/deleteProfile/properties/successor/mapping/replacement/properties/preferences",
                        keyword: "properties",
                        params: {
                          error: "missing",
                          missingProperty: "preferences",
                        },
                        message: "must have property 'preferences'",
                      };
                      if (vErrors === null) {
                        vErrors = [err136];
                      } else {
                        vErrors.push(err136);
                      }
                      errors++;
                    }
                    for (const key20 in data51) {
                      if (
                        key20 !== "kind" &&
                        key20 !== "owner" &&
                        key20 !== "preferences"
                      ) {
                        const err137 = {
                          instancePath:
                            instancePath +
                            "/payload/successor/" +
                            key20.replace(/~/g, "~0").replace(/\//g, "~1"),
                          schemaPath:
                            "/properties/payload/mapping/deleteProfile/properties/successor/mapping/replacement",
                          keyword: "properties",
                          params: {
                            error: "additional",
                            additionalProperty: key20,
                          },
                          message: "must NOT have additional properties",
                        };
                        if (vErrors === null) {
                          vErrors = [err137];
                        } else {
                          vErrors.push(err137);
                        }
                        errors++;
                      }
                    }
                    if (!valid70) {
                      const err138 = {
                        instancePath: instancePath + "/payload/successor",
                        schemaPath:
                          "/properties/payload/mapping/deleteProfile/properties/successor/mapping/replacement/properties",
                        keyword: "properties",
                        params: { type: "object", nullable: false },
                        message: "must be object",
                      };
                      if (vErrors === null) {
                        vErrors = [err138];
                      } else {
                        vErrors.push(err138);
                      }
                      errors++;
                    }
                    var valid69 = _errs60 === errors;
                    valid61 = valid69;
                  } else {
                    const err139 = {
                      instancePath: instancePath + "/payload/successor/kind",
                      schemaPath:
                        "/properties/payload/mapping/deleteProfile/properties/successor/mapping",
                      keyword: "discriminator",
                      params: { error: "mapping", tag: "kind", tagValue: tag1 },
                      message: 'value of tag "kind" must be in mapping',
                    };
                    if (vErrors === null) {
                      vErrors = [err139];
                    } else {
                      vErrors.push(err139);
                    }
                    errors++;
                  }
                } else {
                  const err140 = {
                    instancePath: instancePath + "/payload/successor/kind",
                    schemaPath:
                      "/properties/payload/mapping/deleteProfile/properties/successor/discriminator",
                    keyword: "discriminator",
                    params: { error: "tag", tag: "kind", tagValue: tag1 },
                    message: 'tag "kind" must be string',
                  };
                  if (vErrors === null) {
                    vErrors = [err140];
                  } else {
                    vErrors.push(err140);
                  }
                  errors++;
                }
              } else if (!valid61) {
                const err141 = {
                  instancePath: instancePath + "/payload/successor",
                  schemaPath:
                    "/properties/payload/mapping/deleteProfile/properties/successor/discriminator",
                  keyword: "discriminator",
                  params: { type: "object", nullable: false },
                  message: "must be object",
                };
                if (vErrors === null) {
                  vErrors = [err141];
                } else {
                  vErrors.push(err141);
                }
                errors++;
              }
            } else {
              const err142 = {
                instancePath: instancePath + "/payload",
                schemaPath:
                  "/properties/payload/mapping/deleteProfile/properties/successor",
                keyword: "properties",
                params: { error: "missing", missingProperty: "successor" },
                message: "must have property 'successor'",
              };
              if (vErrors === null) {
                vErrors = [err142];
              } else {
                vErrors.push(err142);
              }
              errors++;
            }
            for (const key21 in data12) {
              if (
                key21 !== "kind" &&
                key21 !== "target" &&
                key21 !== "departure" &&
                key21 !== "successor"
              ) {
                const err143 = {
                  instancePath:
                    instancePath +
                    "/payload/" +
                    key21.replace(/~/g, "~0").replace(/\//g, "~1"),
                  schemaPath: "/properties/payload/mapping/deleteProfile",
                  keyword: "properties",
                  params: { error: "additional", additionalProperty: key21 },
                  message: "must NOT have additional properties",
                };
                if (vErrors === null) {
                  vErrors = [err143];
                } else {
                  vErrors.push(err143);
                }
                errors++;
              }
            }
            if (!valid38) {
              const err144 = {
                instancePath: instancePath + "/payload",
                schemaPath:
                  "/properties/payload/mapping/deleteProfile/properties",
                keyword: "properties",
                params: { type: "object", nullable: false },
                message: "must be object",
              };
              if (vErrors === null) {
                vErrors = [err144];
              } else {
                vErrors.push(err144);
              }
              errors++;
            }
            var valid37 = _errs34 === errors;
            valid11 = valid37;
          } else {
            const err145 = {
              instancePath: instancePath + "/payload/kind",
              schemaPath: "/properties/payload/mapping",
              keyword: "discriminator",
              params: { error: "mapping", tag: "kind", tagValue: tag0 },
              message: 'value of tag "kind" must be in mapping',
            };
            if (vErrors === null) {
              vErrors = [err145];
            } else {
              vErrors.push(err145);
            }
            errors++;
          }
        } else {
          const err146 = {
            instancePath: instancePath + "/payload/kind",
            schemaPath: "/properties/payload/discriminator",
            keyword: "discriminator",
            params: { error: "tag", tag: "kind", tagValue: tag0 },
            message: 'tag "kind" must be string',
          };
          if (vErrors === null) {
            vErrors = [err146];
          } else {
            vErrors.push(err146);
          }
          errors++;
        }
      } else if (!valid11) {
        const err147 = {
          instancePath: instancePath + "/payload",
          schemaPath: "/properties/payload/discriminator",
          keyword: "discriminator",
          params: { type: "object", nullable: false },
          message: "must be object",
        };
        if (vErrors === null) {
          vErrors = [err147];
        } else {
          vErrors.push(err147);
        }
        errors++;
      }
    } else {
      const err148 = {
        instancePath,
        schemaPath: "/properties/payload",
        keyword: "properties",
        params: { error: "missing", missingProperty: "payload" },
        message: "must have property 'payload'",
      };
      if (vErrors === null) {
        vErrors = [err148];
      } else {
        vErrors.push(err148);
      }
      errors++;
    }
    for (const key22 in data) {
      if (
        key22 !== "version" &&
        key22 !== "commandId" &&
        key22 !== "scope" &&
        key22 !== "selection" &&
        key22 !== "payloadHash" &&
        key22 !== "payload"
      ) {
        const err149 = {
          instancePath:
            instancePath + "/" + key22.replace(/~/g, "~0").replace(/\//g, "~1"),
          schemaPath: "",
          keyword: "properties",
          params: { error: "additional", additionalProperty: key22 },
          message: "must NOT have additional properties",
        };
        if (vErrors === null) {
          vErrors = [err149];
        } else {
          vErrors.push(err149);
        }
        errors++;
      }
    }
  }
  if (!valid0) {
    const err150 = {
      instancePath,
      schemaPath: "/properties",
      keyword: "properties",
      params: { type: "object", nullable: false },
      message: "must be object",
    };
    if (vErrors === null) {
      vErrors = [err150];
    } else {
      vErrors.push(err150);
    }
    errors++;
  }
  validate59.errors = vErrors;
  return errors === 0;
}
export const validateProfileResetReceipt = validate60;
const schema32 = {
  properties: {
    kind: { enum: ["profileCommitted"] },
    version: { type: "uint8" },
    commandId: { type: "string" },
    payloadHash: { type: "string" },
    administration: {
      properties: {
        installationId: { type: "string" },
        revision: { type: "string" },
      },
    },
    selection: {
      properties: {
        installationId: { type: "string" },
        revision: { type: "string" },
        owner: {
          properties: {
            profileId: { type: "string" },
            generation: { type: "string" },
          },
        },
      },
    },
    effect: {
      properties: {
        kind: { enum: ["reset"] },
        target: {
          properties: {
            owner: {
              properties: {
                profileId: { type: "string" },
                generation: { type: "string" },
              },
            },
            revision: { type: "string" },
          },
        },
      },
    },
  },
};
function validate60(
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
      if (!(typeof data0 == "string" && data0 === "profileCommitted")) {
        const err0 = {
          instancePath: instancePath + "/kind",
          schemaPath: "/properties/kind/enum",
          keyword: "enum",
          params: { allowedValues: schema32.properties.kind.enum },
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
    if (data.version !== undefined) {
      let data1 = data.version;
      if (!(
        typeof data1 == "number" &&
        isFinite(data1) &&
        !(data1 % 1) &&
        data1 >= 0 &&
        data1 <= 255
      )) {
        const err2 = {
          instancePath: instancePath + "/version",
          schemaPath: "/properties/version/type",
          keyword: "type",
          params: { type: "uint8", nullable: false },
          message: "must be uint8",
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
        schemaPath: "/properties/version",
        keyword: "properties",
        params: { error: "missing", missingProperty: "version" },
        message: "must have property 'version'",
      };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    if (data.commandId !== undefined) {
      if (!(typeof data.commandId == "string")) {
        const err4 = {
          instancePath: instancePath + "/commandId",
          schemaPath: "/properties/commandId/type",
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
        schemaPath: "/properties/commandId",
        keyword: "properties",
        params: { error: "missing", missingProperty: "commandId" },
        message: "must have property 'commandId'",
      };
      if (vErrors === null) {
        vErrors = [err5];
      } else {
        vErrors.push(err5);
      }
      errors++;
    }
    if (data.payloadHash !== undefined) {
      if (!(typeof data.payloadHash == "string")) {
        const err6 = {
          instancePath: instancePath + "/payloadHash",
          schemaPath: "/properties/payloadHash/type",
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
        schemaPath: "/properties/payloadHash",
        keyword: "properties",
        params: { error: "missing", missingProperty: "payloadHash" },
        message: "must have property 'payloadHash'",
      };
      if (vErrors === null) {
        vErrors = [err7];
      } else {
        vErrors.push(err7);
      }
      errors++;
    }
    if (data.administration !== undefined) {
      let data4 = data.administration;
      let valid2 = false;
      if (data4 && typeof data4 == "object" && !Array.isArray(data4)) {
        valid2 = true;
        if (data4.installationId !== undefined) {
          if (!(typeof data4.installationId == "string")) {
            const err8 = {
              instancePath: instancePath + "/administration/installationId",
              schemaPath:
                "/properties/administration/properties/installationId/type",
              keyword: "type",
              params: { type: "string", nullable: false },
              message: "must be string",
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
            instancePath: instancePath + "/administration",
            schemaPath: "/properties/administration/properties/installationId",
            keyword: "properties",
            params: { error: "missing", missingProperty: "installationId" },
            message: "must have property 'installationId'",
          };
          if (vErrors === null) {
            vErrors = [err9];
          } else {
            vErrors.push(err9);
          }
          errors++;
        }
        if (data4.revision !== undefined) {
          if (!(typeof data4.revision == "string")) {
            const err10 = {
              instancePath: instancePath + "/administration/revision",
              schemaPath: "/properties/administration/properties/revision/type",
              keyword: "type",
              params: { type: "string", nullable: false },
              message: "must be string",
            };
            if (vErrors === null) {
              vErrors = [err10];
            } else {
              vErrors.push(err10);
            }
            errors++;
          }
        } else {
          const err11 = {
            instancePath: instancePath + "/administration",
            schemaPath: "/properties/administration/properties/revision",
            keyword: "properties",
            params: { error: "missing", missingProperty: "revision" },
            message: "must have property 'revision'",
          };
          if (vErrors === null) {
            vErrors = [err11];
          } else {
            vErrors.push(err11);
          }
          errors++;
        }
        for (const key0 in data4) {
          if (key0 !== "installationId" && key0 !== "revision") {
            const err12 = {
              instancePath:
                instancePath +
                "/administration/" +
                key0.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/properties/administration",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key0 },
              message: "must NOT have additional properties",
            };
            if (vErrors === null) {
              vErrors = [err12];
            } else {
              vErrors.push(err12);
            }
            errors++;
          }
        }
      }
      if (!valid2) {
        const err13 = {
          instancePath: instancePath + "/administration",
          schemaPath: "/properties/administration/properties",
          keyword: "properties",
          params: { type: "object", nullable: false },
          message: "must be object",
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
        schemaPath: "/properties/administration",
        keyword: "properties",
        params: { error: "missing", missingProperty: "administration" },
        message: "must have property 'administration'",
      };
      if (vErrors === null) {
        vErrors = [err14];
      } else {
        vErrors.push(err14);
      }
      errors++;
    }
    if (data.selection !== undefined) {
      let data7 = data.selection;
      let valid5 = false;
      if (data7 && typeof data7 == "object" && !Array.isArray(data7)) {
        valid5 = true;
        if (data7.installationId !== undefined) {
          if (!(typeof data7.installationId == "string")) {
            const err15 = {
              instancePath: instancePath + "/selection/installationId",
              schemaPath:
                "/properties/selection/properties/installationId/type",
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
            instancePath: instancePath + "/selection",
            schemaPath: "/properties/selection/properties/installationId",
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
        if (data7.revision !== undefined) {
          if (!(typeof data7.revision == "string")) {
            const err17 = {
              instancePath: instancePath + "/selection/revision",
              schemaPath: "/properties/selection/properties/revision/type",
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
            instancePath: instancePath + "/selection",
            schemaPath: "/properties/selection/properties/revision",
            keyword: "properties",
            params: { error: "missing", missingProperty: "revision" },
            message: "must have property 'revision'",
          };
          if (vErrors === null) {
            vErrors = [err18];
          } else {
            vErrors.push(err18);
          }
          errors++;
        }
        if (data7.owner !== undefined) {
          let data10 = data7.owner;
          let valid7 = false;
          if (data10 && typeof data10 == "object" && !Array.isArray(data10)) {
            valid7 = true;
            if (data10.profileId !== undefined) {
              if (!(typeof data10.profileId == "string")) {
                const err19 = {
                  instancePath: instancePath + "/selection/owner/profileId",
                  schemaPath:
                    "/properties/selection/properties/owner/properties/profileId/type",
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
                instancePath: instancePath + "/selection/owner",
                schemaPath:
                  "/properties/selection/properties/owner/properties/profileId",
                keyword: "properties",
                params: { error: "missing", missingProperty: "profileId" },
                message: "must have property 'profileId'",
              };
              if (vErrors === null) {
                vErrors = [err20];
              } else {
                vErrors.push(err20);
              }
              errors++;
            }
            if (data10.generation !== undefined) {
              if (!(typeof data10.generation == "string")) {
                const err21 = {
                  instancePath: instancePath + "/selection/owner/generation",
                  schemaPath:
                    "/properties/selection/properties/owner/properties/generation/type",
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
                instancePath: instancePath + "/selection/owner",
                schemaPath:
                  "/properties/selection/properties/owner/properties/generation",
                keyword: "properties",
                params: { error: "missing", missingProperty: "generation" },
                message: "must have property 'generation'",
              };
              if (vErrors === null) {
                vErrors = [err22];
              } else {
                vErrors.push(err22);
              }
              errors++;
            }
            for (const key1 in data10) {
              if (key1 !== "profileId" && key1 !== "generation") {
                const err23 = {
                  instancePath:
                    instancePath +
                    "/selection/owner/" +
                    key1.replace(/~/g, "~0").replace(/\//g, "~1"),
                  schemaPath: "/properties/selection/properties/owner",
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
          }
          if (!valid7) {
            const err24 = {
              instancePath: instancePath + "/selection/owner",
              schemaPath: "/properties/selection/properties/owner/properties",
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
        } else {
          const err25 = {
            instancePath: instancePath + "/selection",
            schemaPath: "/properties/selection/properties/owner",
            keyword: "properties",
            params: { error: "missing", missingProperty: "owner" },
            message: "must have property 'owner'",
          };
          if (vErrors === null) {
            vErrors = [err25];
          } else {
            vErrors.push(err25);
          }
          errors++;
        }
        for (const key2 in data7) {
          if (
            key2 !== "installationId" &&
            key2 !== "revision" &&
            key2 !== "owner"
          ) {
            const err26 = {
              instancePath:
                instancePath +
                "/selection/" +
                key2.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/properties/selection",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key2 },
              message: "must NOT have additional properties",
            };
            if (vErrors === null) {
              vErrors = [err26];
            } else {
              vErrors.push(err26);
            }
            errors++;
          }
        }
      }
      if (!valid5) {
        const err27 = {
          instancePath: instancePath + "/selection",
          schemaPath: "/properties/selection/properties",
          keyword: "properties",
          params: { type: "object", nullable: false },
          message: "must be object",
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
        schemaPath: "/properties/selection",
        keyword: "properties",
        params: { error: "missing", missingProperty: "selection" },
        message: "must have property 'selection'",
      };
      if (vErrors === null) {
        vErrors = [err28];
      } else {
        vErrors.push(err28);
      }
      errors++;
    }
    if (data.effect !== undefined) {
      let data13 = data.effect;
      let valid11 = false;
      if (data13 && typeof data13 == "object" && !Array.isArray(data13)) {
        valid11 = true;
        if (data13.kind !== undefined) {
          let data14 = data13.kind;
          if (!(typeof data14 == "string" && data14 === "reset")) {
            const err29 = {
              instancePath: instancePath + "/effect/kind",
              schemaPath: "/properties/effect/properties/kind/enum",
              keyword: "enum",
              params: {
                allowedValues: schema32.properties.effect.properties.kind.enum,
              },
              message: "must be equal to one of the allowed values",
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
            instancePath: instancePath + "/effect",
            schemaPath: "/properties/effect/properties/kind",
            keyword: "properties",
            params: { error: "missing", missingProperty: "kind" },
            message: "must have property 'kind'",
          };
          if (vErrors === null) {
            vErrors = [err30];
          } else {
            vErrors.push(err30);
          }
          errors++;
        }
        if (data13.target !== undefined) {
          let data15 = data13.target;
          let valid13 = false;
          if (data15 && typeof data15 == "object" && !Array.isArray(data15)) {
            valid13 = true;
            if (data15.owner !== undefined) {
              let data16 = data15.owner;
              let valid15 = false;
              if (
                data16 &&
                typeof data16 == "object" &&
                !Array.isArray(data16)
              ) {
                valid15 = true;
                if (data16.profileId !== undefined) {
                  if (!(typeof data16.profileId == "string")) {
                    const err31 = {
                      instancePath:
                        instancePath + "/effect/target/owner/profileId",
                      schemaPath:
                        "/properties/effect/properties/target/properties/owner/properties/profileId/type",
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
                    instancePath: instancePath + "/effect/target/owner",
                    schemaPath:
                      "/properties/effect/properties/target/properties/owner/properties/profileId",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "profileId" },
                    message: "must have property 'profileId'",
                  };
                  if (vErrors === null) {
                    vErrors = [err32];
                  } else {
                    vErrors.push(err32);
                  }
                  errors++;
                }
                if (data16.generation !== undefined) {
                  if (!(typeof data16.generation == "string")) {
                    const err33 = {
                      instancePath:
                        instancePath + "/effect/target/owner/generation",
                      schemaPath:
                        "/properties/effect/properties/target/properties/owner/properties/generation/type",
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
                    instancePath: instancePath + "/effect/target/owner",
                    schemaPath:
                      "/properties/effect/properties/target/properties/owner/properties/generation",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "generation" },
                    message: "must have property 'generation'",
                  };
                  if (vErrors === null) {
                    vErrors = [err34];
                  } else {
                    vErrors.push(err34);
                  }
                  errors++;
                }
                for (const key3 in data16) {
                  if (key3 !== "profileId" && key3 !== "generation") {
                    const err35 = {
                      instancePath:
                        instancePath +
                        "/effect/target/owner/" +
                        key3.replace(/~/g, "~0").replace(/\//g, "~1"),
                      schemaPath:
                        "/properties/effect/properties/target/properties/owner",
                      keyword: "properties",
                      params: { error: "additional", additionalProperty: key3 },
                      message: "must NOT have additional properties",
                    };
                    if (vErrors === null) {
                      vErrors = [err35];
                    } else {
                      vErrors.push(err35);
                    }
                    errors++;
                  }
                }
              }
              if (!valid15) {
                const err36 = {
                  instancePath: instancePath + "/effect/target/owner",
                  schemaPath:
                    "/properties/effect/properties/target/properties/owner/properties",
                  keyword: "properties",
                  params: { type: "object", nullable: false },
                  message: "must be object",
                };
                if (vErrors === null) {
                  vErrors = [err36];
                } else {
                  vErrors.push(err36);
                }
                errors++;
              }
            } else {
              const err37 = {
                instancePath: instancePath + "/effect/target",
                schemaPath:
                  "/properties/effect/properties/target/properties/owner",
                keyword: "properties",
                params: { error: "missing", missingProperty: "owner" },
                message: "must have property 'owner'",
              };
              if (vErrors === null) {
                vErrors = [err37];
              } else {
                vErrors.push(err37);
              }
              errors++;
            }
            if (data15.revision !== undefined) {
              if (!(typeof data15.revision == "string")) {
                const err38 = {
                  instancePath: instancePath + "/effect/target/revision",
                  schemaPath:
                    "/properties/effect/properties/target/properties/revision/type",
                  keyword: "type",
                  params: { type: "string", nullable: false },
                  message: "must be string",
                };
                if (vErrors === null) {
                  vErrors = [err38];
                } else {
                  vErrors.push(err38);
                }
                errors++;
              }
            } else {
              const err39 = {
                instancePath: instancePath + "/effect/target",
                schemaPath:
                  "/properties/effect/properties/target/properties/revision",
                keyword: "properties",
                params: { error: "missing", missingProperty: "revision" },
                message: "must have property 'revision'",
              };
              if (vErrors === null) {
                vErrors = [err39];
              } else {
                vErrors.push(err39);
              }
              errors++;
            }
            for (const key4 in data15) {
              if (key4 !== "owner" && key4 !== "revision") {
                const err40 = {
                  instancePath:
                    instancePath +
                    "/effect/target/" +
                    key4.replace(/~/g, "~0").replace(/\//g, "~1"),
                  schemaPath: "/properties/effect/properties/target",
                  keyword: "properties",
                  params: { error: "additional", additionalProperty: key4 },
                  message: "must NOT have additional properties",
                };
                if (vErrors === null) {
                  vErrors = [err40];
                } else {
                  vErrors.push(err40);
                }
                errors++;
              }
            }
          }
          if (!valid13) {
            const err41 = {
              instancePath: instancePath + "/effect/target",
              schemaPath: "/properties/effect/properties/target/properties",
              keyword: "properties",
              params: { type: "object", nullable: false },
              message: "must be object",
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
            instancePath: instancePath + "/effect",
            schemaPath: "/properties/effect/properties/target",
            keyword: "properties",
            params: { error: "missing", missingProperty: "target" },
            message: "must have property 'target'",
          };
          if (vErrors === null) {
            vErrors = [err42];
          } else {
            vErrors.push(err42);
          }
          errors++;
        }
        for (const key5 in data13) {
          if (key5 !== "kind" && key5 !== "target") {
            const err43 = {
              instancePath:
                instancePath +
                "/effect/" +
                key5.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/properties/effect",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key5 },
              message: "must NOT have additional properties",
            };
            if (vErrors === null) {
              vErrors = [err43];
            } else {
              vErrors.push(err43);
            }
            errors++;
          }
        }
      }
      if (!valid11) {
        const err44 = {
          instancePath: instancePath + "/effect",
          schemaPath: "/properties/effect/properties",
          keyword: "properties",
          params: { type: "object", nullable: false },
          message: "must be object",
        };
        if (vErrors === null) {
          vErrors = [err44];
        } else {
          vErrors.push(err44);
        }
        errors++;
      }
    } else {
      const err45 = {
        instancePath,
        schemaPath: "/properties/effect",
        keyword: "properties",
        params: { error: "missing", missingProperty: "effect" },
        message: "must have property 'effect'",
      };
      if (vErrors === null) {
        vErrors = [err45];
      } else {
        vErrors.push(err45);
      }
      errors++;
    }
    for (const key6 in data) {
      if (
        key6 !== "kind" &&
        key6 !== "version" &&
        key6 !== "commandId" &&
        key6 !== "payloadHash" &&
        key6 !== "administration" &&
        key6 !== "selection" &&
        key6 !== "effect"
      ) {
        const err46 = {
          instancePath:
            instancePath + "/" + key6.replace(/~/g, "~0").replace(/\//g, "~1"),
          schemaPath: "",
          keyword: "properties",
          params: { error: "additional", additionalProperty: key6 },
          message: "must NOT have additional properties",
        };
        if (vErrors === null) {
          vErrors = [err46];
        } else {
          vErrors.push(err46);
        }
        errors++;
      }
    }
  }
  if (!valid0) {
    const err47 = {
      instancePath,
      schemaPath: "/properties",
      keyword: "properties",
      params: { type: "object", nullable: false },
      message: "must be object",
    };
    if (vErrors === null) {
      vErrors = [err47];
    } else {
      vErrors.push(err47);
    }
    errors++;
  }
  validate60.errors = vErrors;
  return errors === 0;
}
export const validateProfileDeletionReceipt = validate61;
const schema33 = {
  properties: {
    kind: { enum: ["profileCommitted"] },
    version: { type: "uint8" },
    commandId: { type: "string" },
    payloadHash: { type: "string" },
    administration: {
      properties: {
        installationId: { type: "string" },
        revision: { type: "string" },
      },
    },
    expectedRevision: { type: "string" },
    effect: { properties: { kind: { enum: ["deleted"] } } },
  },
};
function validate61(
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
      if (!(typeof data0 == "string" && data0 === "profileCommitted")) {
        const err0 = {
          instancePath: instancePath + "/kind",
          schemaPath: "/properties/kind/enum",
          keyword: "enum",
          params: { allowedValues: schema33.properties.kind.enum },
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
    if (data.version !== undefined) {
      let data1 = data.version;
      if (!(
        typeof data1 == "number" &&
        isFinite(data1) &&
        !(data1 % 1) &&
        data1 >= 0 &&
        data1 <= 255
      )) {
        const err2 = {
          instancePath: instancePath + "/version",
          schemaPath: "/properties/version/type",
          keyword: "type",
          params: { type: "uint8", nullable: false },
          message: "must be uint8",
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
        schemaPath: "/properties/version",
        keyword: "properties",
        params: { error: "missing", missingProperty: "version" },
        message: "must have property 'version'",
      };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    if (data.commandId !== undefined) {
      if (!(typeof data.commandId == "string")) {
        const err4 = {
          instancePath: instancePath + "/commandId",
          schemaPath: "/properties/commandId/type",
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
        schemaPath: "/properties/commandId",
        keyword: "properties",
        params: { error: "missing", missingProperty: "commandId" },
        message: "must have property 'commandId'",
      };
      if (vErrors === null) {
        vErrors = [err5];
      } else {
        vErrors.push(err5);
      }
      errors++;
    }
    if (data.payloadHash !== undefined) {
      if (!(typeof data.payloadHash == "string")) {
        const err6 = {
          instancePath: instancePath + "/payloadHash",
          schemaPath: "/properties/payloadHash/type",
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
        schemaPath: "/properties/payloadHash",
        keyword: "properties",
        params: { error: "missing", missingProperty: "payloadHash" },
        message: "must have property 'payloadHash'",
      };
      if (vErrors === null) {
        vErrors = [err7];
      } else {
        vErrors.push(err7);
      }
      errors++;
    }
    if (data.administration !== undefined) {
      let data4 = data.administration;
      let valid2 = false;
      if (data4 && typeof data4 == "object" && !Array.isArray(data4)) {
        valid2 = true;
        if (data4.installationId !== undefined) {
          if (!(typeof data4.installationId == "string")) {
            const err8 = {
              instancePath: instancePath + "/administration/installationId",
              schemaPath:
                "/properties/administration/properties/installationId/type",
              keyword: "type",
              params: { type: "string", nullable: false },
              message: "must be string",
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
            instancePath: instancePath + "/administration",
            schemaPath: "/properties/administration/properties/installationId",
            keyword: "properties",
            params: { error: "missing", missingProperty: "installationId" },
            message: "must have property 'installationId'",
          };
          if (vErrors === null) {
            vErrors = [err9];
          } else {
            vErrors.push(err9);
          }
          errors++;
        }
        if (data4.revision !== undefined) {
          if (!(typeof data4.revision == "string")) {
            const err10 = {
              instancePath: instancePath + "/administration/revision",
              schemaPath: "/properties/administration/properties/revision/type",
              keyword: "type",
              params: { type: "string", nullable: false },
              message: "must be string",
            };
            if (vErrors === null) {
              vErrors = [err10];
            } else {
              vErrors.push(err10);
            }
            errors++;
          }
        } else {
          const err11 = {
            instancePath: instancePath + "/administration",
            schemaPath: "/properties/administration/properties/revision",
            keyword: "properties",
            params: { error: "missing", missingProperty: "revision" },
            message: "must have property 'revision'",
          };
          if (vErrors === null) {
            vErrors = [err11];
          } else {
            vErrors.push(err11);
          }
          errors++;
        }
        for (const key0 in data4) {
          if (key0 !== "installationId" && key0 !== "revision") {
            const err12 = {
              instancePath:
                instancePath +
                "/administration/" +
                key0.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/properties/administration",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key0 },
              message: "must NOT have additional properties",
            };
            if (vErrors === null) {
              vErrors = [err12];
            } else {
              vErrors.push(err12);
            }
            errors++;
          }
        }
      }
      if (!valid2) {
        const err13 = {
          instancePath: instancePath + "/administration",
          schemaPath: "/properties/administration/properties",
          keyword: "properties",
          params: { type: "object", nullable: false },
          message: "must be object",
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
        schemaPath: "/properties/administration",
        keyword: "properties",
        params: { error: "missing", missingProperty: "administration" },
        message: "must have property 'administration'",
      };
      if (vErrors === null) {
        vErrors = [err14];
      } else {
        vErrors.push(err14);
      }
      errors++;
    }
    if (data.expectedRevision !== undefined) {
      if (!(typeof data.expectedRevision == "string")) {
        const err15 = {
          instancePath: instancePath + "/expectedRevision",
          schemaPath: "/properties/expectedRevision/type",
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
        schemaPath: "/properties/expectedRevision",
        keyword: "properties",
        params: { error: "missing", missingProperty: "expectedRevision" },
        message: "must have property 'expectedRevision'",
      };
      if (vErrors === null) {
        vErrors = [err16];
      } else {
        vErrors.push(err16);
      }
      errors++;
    }
    if (data.effect !== undefined) {
      let data8 = data.effect;
      let valid5 = false;
      if (data8 && typeof data8 == "object" && !Array.isArray(data8)) {
        valid5 = true;
        if (data8.kind !== undefined) {
          let data9 = data8.kind;
          if (!(typeof data9 == "string" && data9 === "deleted")) {
            const err17 = {
              instancePath: instancePath + "/effect/kind",
              schemaPath: "/properties/effect/properties/kind/enum",
              keyword: "enum",
              params: {
                allowedValues: schema33.properties.effect.properties.kind.enum,
              },
              message: "must be equal to one of the allowed values",
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
            instancePath: instancePath + "/effect",
            schemaPath: "/properties/effect/properties/kind",
            keyword: "properties",
            params: { error: "missing", missingProperty: "kind" },
            message: "must have property 'kind'",
          };
          if (vErrors === null) {
            vErrors = [err18];
          } else {
            vErrors.push(err18);
          }
          errors++;
        }
        for (const key1 in data8) {
          if (key1 !== "kind") {
            const err19 = {
              instancePath:
                instancePath +
                "/effect/" +
                key1.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/properties/effect",
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
          instancePath: instancePath + "/effect",
          schemaPath: "/properties/effect/properties",
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
        schemaPath: "/properties/effect",
        keyword: "properties",
        params: { error: "missing", missingProperty: "effect" },
        message: "must have property 'effect'",
      };
      if (vErrors === null) {
        vErrors = [err21];
      } else {
        vErrors.push(err21);
      }
      errors++;
    }
    for (const key2 in data) {
      if (
        key2 !== "kind" &&
        key2 !== "version" &&
        key2 !== "commandId" &&
        key2 !== "payloadHash" &&
        key2 !== "administration" &&
        key2 !== "expectedRevision" &&
        key2 !== "effect"
      ) {
        const err22 = {
          instancePath:
            instancePath + "/" + key2.replace(/~/g, "~0").replace(/\//g, "~1"),
          schemaPath: "",
          keyword: "properties",
          params: { error: "additional", additionalProperty: key2 },
          message: "must NOT have additional properties",
        };
        if (vErrors === null) {
          vErrors = [err22];
        } else {
          vErrors.push(err22);
        }
        errors++;
      }
    }
  }
  if (!valid0) {
    const err23 = {
      instancePath,
      schemaPath: "/properties",
      keyword: "properties",
      params: { type: "object", nullable: false },
      message: "must be object",
    };
    if (vErrors === null) {
      vErrors = [err23];
    } else {
      vErrors.push(err23);
    }
    errors++;
  }
  validate61.errors = vErrors;
  return errors === 0;
}
export const validateLocalPreferences = validate62;
const schema34 = {
  properties: { version: { type: "uint8" } },
  optionalProperties: {
    displayName: { type: "string" },
    avatarId: { type: "string" },
  },
  additionalProperties: true,
};
function validate62(
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
    if (data.displayName !== undefined) {
      if (!(typeof data.displayName == "string")) {
        const err2 = {
          instancePath: instancePath + "/displayName",
          schemaPath: "/optionalProperties/displayName/type",
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
    }
    if (data.avatarId !== undefined) {
      if (!(typeof data.avatarId == "string")) {
        const err3 = {
          instancePath: instancePath + "/avatarId",
          schemaPath: "/optionalProperties/avatarId/type",
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
    }
  }
  if (!valid0) {
    const err4 = {
      instancePath,
      schemaPath: "/properties",
      keyword: "properties",
      params: { type: "object", nullable: false },
      message: "must be object",
    };
    if (vErrors === null) {
      vErrors = [err4];
    } else {
      vErrors.push(err4);
    }
    errors++;
  }
  validate62.errors = vErrors;
  return errors === 0;
}
export const validatePreparationPolicy = validate63;
const schema35 = {
  discriminator: "kind",
  mapping: {
    unavailable: { properties: {} },
    reviewed: { properties: { hash: { type: "string" } } },
  },
};
function validate63(
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
      if (tag0 === "unavailable") {
        const _errs0 = errors;
        let valid2 = false;
        valid2 = true;
        for (const key0 in data) {
          if (key0 !== "kind") {
            const err1 = {
              instancePath:
                instancePath +
                "/" +
                key0.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/unavailable",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key0 },
              message: "must NOT have additional properties",
            };
            if (vErrors === null) {
              vErrors = [err1];
            } else {
              vErrors.push(err1);
            }
            errors++;
          }
        }
        if (!valid2) {
          const err2 = {
            instancePath,
            schemaPath: "/mapping/unavailable/properties",
            keyword: "properties",
            params: { type: "object", nullable: false },
            message: "must be object",
          };
          if (vErrors === null) {
            vErrors = [err2];
          } else {
            vErrors.push(err2);
          }
          errors++;
        }
        var valid1 = _errs0 === errors;
        valid0 = valid1;
      } else if (tag0 === "reviewed") {
        const _errs1 = errors;
        let valid6 = false;
        valid6 = true;
        if (data.hash !== undefined) {
          if (!(typeof data.hash == "string")) {
            const err3 = {
              instancePath: instancePath + "/hash",
              schemaPath: "/mapping/reviewed/properties/hash/type",
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
            schemaPath: "/mapping/reviewed/properties/hash",
            keyword: "properties",
            params: { error: "missing", missingProperty: "hash" },
            message: "must have property 'hash'",
          };
          if (vErrors === null) {
            vErrors = [err4];
          } else {
            vErrors.push(err4);
          }
          errors++;
        }
        for (const key1 in data) {
          if (key1 !== "kind" && key1 !== "hash") {
            const err5 = {
              instancePath:
                instancePath +
                "/" +
                key1.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/reviewed",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key1 },
              message: "must NOT have additional properties",
            };
            if (vErrors === null) {
              vErrors = [err5];
            } else {
              vErrors.push(err5);
            }
            errors++;
          }
        }
        if (!valid6) {
          const err6 = {
            instancePath,
            schemaPath: "/mapping/reviewed/properties",
            keyword: "properties",
            params: { type: "object", nullable: false },
            message: "must be object",
          };
          if (vErrors === null) {
            vErrors = [err6];
          } else {
            vErrors.push(err6);
          }
          errors++;
        }
        var valid5 = _errs1 === errors;
        valid0 = valid5;
      } else {
        const err7 = {
          instancePath: instancePath + "/kind",
          schemaPath: "/mapping",
          keyword: "discriminator",
          params: { error: "mapping", tag: "kind", tagValue: tag0 },
          message: 'value of tag "kind" must be in mapping',
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
        instancePath: instancePath + "/kind",
        schemaPath: "/discriminator",
        keyword: "discriminator",
        params: { error: "tag", tag: "kind", tagValue: tag0 },
        message: 'tag "kind" must be string',
      };
      if (vErrors === null) {
        vErrors = [err8];
      } else {
        vErrors.push(err8);
      }
      errors++;
    }
  } else if (!valid0) {
    const err9 = {
      instancePath,
      schemaPath: "/discriminator",
      keyword: "discriminator",
      params: { type: "object", nullable: false },
      message: "must be object",
    };
    if (vErrors === null) {
      vErrors = [err9];
    } else {
      vErrors.push(err9);
    }
    errors++;
  }
  validate63.errors = vErrors;
  return errors === 0;
}
export const validateProfileDirectory = validate64;
const schema36 = {
  properties: {
    administration: {
      properties: {
        installationId: { type: "string" },
        revision: { type: "string" },
      },
    },
    selection: {
      properties: {
        installationId: { type: "string" },
        revision: { type: "string" },
        owner: {
          properties: {
            profileId: { type: "string" },
            generation: { type: "string" },
          },
        },
      },
    },
    profiles: {
      elements: {
        properties: {
          edit: {
            properties: {
              owner: {
                properties: {
                  profileId: { type: "string" },
                  generation: { type: "string" },
                },
              },
              revision: { type: "string" },
            },
          },
          preferences: {
            properties: { version: { type: "uint8" } },
            optionalProperties: {
              displayName: { type: "string" },
              avatarId: { type: "string" },
            },
            additionalProperties: true,
          },
        },
      },
    },
    preparation: {
      discriminator: "kind",
      mapping: {
        required: {
          properties: {
            requiredHash: { type: "string" },
            acknowledgedHash: { type: "string", nullable: true },
          },
        },
        acknowledged: { properties: { hash: { type: "string" } } },
        unavailable: {
          properties: { acknowledgedHash: { type: "string", nullable: true } },
        },
      },
    },
    initialSetup: {
      properties: {
        kind: { enum: ["firstLaunch", "existingFamily", "complete"] },
      },
    },
  },
};
function validate64(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  let valid0 = false;
  if (data && typeof data == "object" && !Array.isArray(data)) {
    valid0 = true;
    if (data.administration !== undefined) {
      let data0 = data.administration;
      let valid2 = false;
      if (data0 && typeof data0 == "object" && !Array.isArray(data0)) {
        valid2 = true;
        if (data0.installationId !== undefined) {
          if (!(typeof data0.installationId == "string")) {
            const err0 = {
              instancePath: instancePath + "/administration/installationId",
              schemaPath:
                "/properties/administration/properties/installationId/type",
              keyword: "type",
              params: { type: "string", nullable: false },
              message: "must be string",
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
            instancePath: instancePath + "/administration",
            schemaPath: "/properties/administration/properties/installationId",
            keyword: "properties",
            params: { error: "missing", missingProperty: "installationId" },
            message: "must have property 'installationId'",
          };
          if (vErrors === null) {
            vErrors = [err1];
          } else {
            vErrors.push(err1);
          }
          errors++;
        }
        if (data0.revision !== undefined) {
          if (!(typeof data0.revision == "string")) {
            const err2 = {
              instancePath: instancePath + "/administration/revision",
              schemaPath: "/properties/administration/properties/revision/type",
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
            instancePath: instancePath + "/administration",
            schemaPath: "/properties/administration/properties/revision",
            keyword: "properties",
            params: { error: "missing", missingProperty: "revision" },
            message: "must have property 'revision'",
          };
          if (vErrors === null) {
            vErrors = [err3];
          } else {
            vErrors.push(err3);
          }
          errors++;
        }
        for (const key0 in data0) {
          if (key0 !== "installationId" && key0 !== "revision") {
            const err4 = {
              instancePath:
                instancePath +
                "/administration/" +
                key0.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/properties/administration",
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
      if (!valid2) {
        const err5 = {
          instancePath: instancePath + "/administration",
          schemaPath: "/properties/administration/properties",
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
    } else {
      const err6 = {
        instancePath,
        schemaPath: "/properties/administration",
        keyword: "properties",
        params: { error: "missing", missingProperty: "administration" },
        message: "must have property 'administration'",
      };
      if (vErrors === null) {
        vErrors = [err6];
      } else {
        vErrors.push(err6);
      }
      errors++;
    }
    if (data.selection !== undefined) {
      let data3 = data.selection;
      let valid5 = false;
      if (data3 && typeof data3 == "object" && !Array.isArray(data3)) {
        valid5 = true;
        if (data3.installationId !== undefined) {
          if (!(typeof data3.installationId == "string")) {
            const err7 = {
              instancePath: instancePath + "/selection/installationId",
              schemaPath:
                "/properties/selection/properties/installationId/type",
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
            instancePath: instancePath + "/selection",
            schemaPath: "/properties/selection/properties/installationId",
            keyword: "properties",
            params: { error: "missing", missingProperty: "installationId" },
            message: "must have property 'installationId'",
          };
          if (vErrors === null) {
            vErrors = [err8];
          } else {
            vErrors.push(err8);
          }
          errors++;
        }
        if (data3.revision !== undefined) {
          if (!(typeof data3.revision == "string")) {
            const err9 = {
              instancePath: instancePath + "/selection/revision",
              schemaPath: "/properties/selection/properties/revision/type",
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
            instancePath: instancePath + "/selection",
            schemaPath: "/properties/selection/properties/revision",
            keyword: "properties",
            params: { error: "missing", missingProperty: "revision" },
            message: "must have property 'revision'",
          };
          if (vErrors === null) {
            vErrors = [err10];
          } else {
            vErrors.push(err10);
          }
          errors++;
        }
        if (data3.owner !== undefined) {
          let data6 = data3.owner;
          let valid7 = false;
          if (data6 && typeof data6 == "object" && !Array.isArray(data6)) {
            valid7 = true;
            if (data6.profileId !== undefined) {
              if (!(typeof data6.profileId == "string")) {
                const err11 = {
                  instancePath: instancePath + "/selection/owner/profileId",
                  schemaPath:
                    "/properties/selection/properties/owner/properties/profileId/type",
                  keyword: "type",
                  params: { type: "string", nullable: false },
                  message: "must be string",
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
                instancePath: instancePath + "/selection/owner",
                schemaPath:
                  "/properties/selection/properties/owner/properties/profileId",
                keyword: "properties",
                params: { error: "missing", missingProperty: "profileId" },
                message: "must have property 'profileId'",
              };
              if (vErrors === null) {
                vErrors = [err12];
              } else {
                vErrors.push(err12);
              }
              errors++;
            }
            if (data6.generation !== undefined) {
              if (!(typeof data6.generation == "string")) {
                const err13 = {
                  instancePath: instancePath + "/selection/owner/generation",
                  schemaPath:
                    "/properties/selection/properties/owner/properties/generation/type",
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
                instancePath: instancePath + "/selection/owner",
                schemaPath:
                  "/properties/selection/properties/owner/properties/generation",
                keyword: "properties",
                params: { error: "missing", missingProperty: "generation" },
                message: "must have property 'generation'",
              };
              if (vErrors === null) {
                vErrors = [err14];
              } else {
                vErrors.push(err14);
              }
              errors++;
            }
            for (const key1 in data6) {
              if (key1 !== "profileId" && key1 !== "generation") {
                const err15 = {
                  instancePath:
                    instancePath +
                    "/selection/owner/" +
                    key1.replace(/~/g, "~0").replace(/\//g, "~1"),
                  schemaPath: "/properties/selection/properties/owner",
                  keyword: "properties",
                  params: { error: "additional", additionalProperty: key1 },
                  message: "must NOT have additional properties",
                };
                if (vErrors === null) {
                  vErrors = [err15];
                } else {
                  vErrors.push(err15);
                }
                errors++;
              }
            }
          }
          if (!valid7) {
            const err16 = {
              instancePath: instancePath + "/selection/owner",
              schemaPath: "/properties/selection/properties/owner/properties",
              keyword: "properties",
              params: { type: "object", nullable: false },
              message: "must be object",
            };
            if (vErrors === null) {
              vErrors = [err16];
            } else {
              vErrors.push(err16);
            }
            errors++;
          }
        } else {
          const err17 = {
            instancePath: instancePath + "/selection",
            schemaPath: "/properties/selection/properties/owner",
            keyword: "properties",
            params: { error: "missing", missingProperty: "owner" },
            message: "must have property 'owner'",
          };
          if (vErrors === null) {
            vErrors = [err17];
          } else {
            vErrors.push(err17);
          }
          errors++;
        }
        for (const key2 in data3) {
          if (
            key2 !== "installationId" &&
            key2 !== "revision" &&
            key2 !== "owner"
          ) {
            const err18 = {
              instancePath:
                instancePath +
                "/selection/" +
                key2.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/properties/selection",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key2 },
              message: "must NOT have additional properties",
            };
            if (vErrors === null) {
              vErrors = [err18];
            } else {
              vErrors.push(err18);
            }
            errors++;
          }
        }
      }
      if (!valid5) {
        const err19 = {
          instancePath: instancePath + "/selection",
          schemaPath: "/properties/selection/properties",
          keyword: "properties",
          params: { type: "object", nullable: false },
          message: "must be object",
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
        schemaPath: "/properties/selection",
        keyword: "properties",
        params: { error: "missing", missingProperty: "selection" },
        message: "must have property 'selection'",
      };
      if (vErrors === null) {
        vErrors = [err20];
      } else {
        vErrors.push(err20);
      }
      errors++;
    }
    if (data.profiles !== undefined) {
      let data9 = data.profiles;
      let valid11 = false;
      if (!valid11) {
        if (Array.isArray(data9)) {
          let valid13 = true;
          const len0 = data9.length;
          for (let i0 = 0; i0 < len0; i0++) {
            let data10 = data9[i0];
            const _errs10 = errors;
            let valid14 = false;
            if (data10 && typeof data10 == "object" && !Array.isArray(data10)) {
              valid14 = true;
              if (data10.edit !== undefined) {
                let data11 = data10.edit;
                let valid16 = false;
                if (
                  data11 &&
                  typeof data11 == "object" &&
                  !Array.isArray(data11)
                ) {
                  valid16 = true;
                  if (data11.owner !== undefined) {
                    let data12 = data11.owner;
                    let valid18 = false;
                    if (
                      data12 &&
                      typeof data12 == "object" &&
                      !Array.isArray(data12)
                    ) {
                      valid18 = true;
                      if (data12.profileId !== undefined) {
                        if (!(typeof data12.profileId == "string")) {
                          const err21 = {
                            instancePath:
                              instancePath +
                              "/profiles/" +
                              i0 +
                              "/edit/owner/profileId",
                            schemaPath:
                              "/properties/profiles/elements/properties/edit/properties/owner/properties/profileId/type",
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
                          instancePath:
                            instancePath + "/profiles/" + i0 + "/edit/owner",
                          schemaPath:
                            "/properties/profiles/elements/properties/edit/properties/owner/properties/profileId",
                          keyword: "properties",
                          params: {
                            error: "missing",
                            missingProperty: "profileId",
                          },
                          message: "must have property 'profileId'",
                        };
                        if (vErrors === null) {
                          vErrors = [err22];
                        } else {
                          vErrors.push(err22);
                        }
                        errors++;
                      }
                      if (data12.generation !== undefined) {
                        if (!(typeof data12.generation == "string")) {
                          const err23 = {
                            instancePath:
                              instancePath +
                              "/profiles/" +
                              i0 +
                              "/edit/owner/generation",
                            schemaPath:
                              "/properties/profiles/elements/properties/edit/properties/owner/properties/generation/type",
                            keyword: "type",
                            params: { type: "string", nullable: false },
                            message: "must be string",
                          };
                          if (vErrors === null) {
                            vErrors = [err23];
                          } else {
                            vErrors.push(err23);
                          }
                          errors++;
                        }
                      } else {
                        const err24 = {
                          instancePath:
                            instancePath + "/profiles/" + i0 + "/edit/owner",
                          schemaPath:
                            "/properties/profiles/elements/properties/edit/properties/owner/properties/generation",
                          keyword: "properties",
                          params: {
                            error: "missing",
                            missingProperty: "generation",
                          },
                          message: "must have property 'generation'",
                        };
                        if (vErrors === null) {
                          vErrors = [err24];
                        } else {
                          vErrors.push(err24);
                        }
                        errors++;
                      }
                      for (const key3 in data12) {
                        if (key3 !== "profileId" && key3 !== "generation") {
                          const err25 = {
                            instancePath:
                              instancePath +
                              "/profiles/" +
                              i0 +
                              "/edit/owner/" +
                              key3.replace(/~/g, "~0").replace(/\//g, "~1"),
                            schemaPath:
                              "/properties/profiles/elements/properties/edit/properties/owner",
                            keyword: "properties",
                            params: {
                              error: "additional",
                              additionalProperty: key3,
                            },
                            message: "must NOT have additional properties",
                          };
                          if (vErrors === null) {
                            vErrors = [err25];
                          } else {
                            vErrors.push(err25);
                          }
                          errors++;
                        }
                      }
                    }
                    if (!valid18) {
                      const err26 = {
                        instancePath:
                          instancePath + "/profiles/" + i0 + "/edit/owner",
                        schemaPath:
                          "/properties/profiles/elements/properties/edit/properties/owner/properties",
                        keyword: "properties",
                        params: { type: "object", nullable: false },
                        message: "must be object",
                      };
                      if (vErrors === null) {
                        vErrors = [err26];
                      } else {
                        vErrors.push(err26);
                      }
                      errors++;
                    }
                  } else {
                    const err27 = {
                      instancePath: instancePath + "/profiles/" + i0 + "/edit",
                      schemaPath:
                        "/properties/profiles/elements/properties/edit/properties/owner",
                      keyword: "properties",
                      params: { error: "missing", missingProperty: "owner" },
                      message: "must have property 'owner'",
                    };
                    if (vErrors === null) {
                      vErrors = [err27];
                    } else {
                      vErrors.push(err27);
                    }
                    errors++;
                  }
                  if (data11.revision !== undefined) {
                    if (!(typeof data11.revision == "string")) {
                      const err28 = {
                        instancePath:
                          instancePath + "/profiles/" + i0 + "/edit/revision",
                        schemaPath:
                          "/properties/profiles/elements/properties/edit/properties/revision/type",
                        keyword: "type",
                        params: { type: "string", nullable: false },
                        message: "must be string",
                      };
                      if (vErrors === null) {
                        vErrors = [err28];
                      } else {
                        vErrors.push(err28);
                      }
                      errors++;
                    }
                  } else {
                    const err29 = {
                      instancePath: instancePath + "/profiles/" + i0 + "/edit",
                      schemaPath:
                        "/properties/profiles/elements/properties/edit/properties/revision",
                      keyword: "properties",
                      params: { error: "missing", missingProperty: "revision" },
                      message: "must have property 'revision'",
                    };
                    if (vErrors === null) {
                      vErrors = [err29];
                    } else {
                      vErrors.push(err29);
                    }
                    errors++;
                  }
                  for (const key4 in data11) {
                    if (key4 !== "owner" && key4 !== "revision") {
                      const err30 = {
                        instancePath:
                          instancePath +
                          "/profiles/" +
                          i0 +
                          "/edit/" +
                          key4.replace(/~/g, "~0").replace(/\//g, "~1"),
                        schemaPath:
                          "/properties/profiles/elements/properties/edit",
                        keyword: "properties",
                        params: {
                          error: "additional",
                          additionalProperty: key4,
                        },
                        message: "must NOT have additional properties",
                      };
                      if (vErrors === null) {
                        vErrors = [err30];
                      } else {
                        vErrors.push(err30);
                      }
                      errors++;
                    }
                  }
                }
                if (!valid16) {
                  const err31 = {
                    instancePath: instancePath + "/profiles/" + i0 + "/edit",
                    schemaPath:
                      "/properties/profiles/elements/properties/edit/properties",
                    keyword: "properties",
                    params: { type: "object", nullable: false },
                    message: "must be object",
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
                  instancePath: instancePath + "/profiles/" + i0,
                  schemaPath: "/properties/profiles/elements/properties/edit",
                  keyword: "properties",
                  params: { error: "missing", missingProperty: "edit" },
                  message: "must have property 'edit'",
                };
                if (vErrors === null) {
                  vErrors = [err32];
                } else {
                  vErrors.push(err32);
                }
                errors++;
              }
              if (data10.preferences !== undefined) {
                let data16 = data10.preferences;
                let valid22 = false;
                if (
                  data16 &&
                  typeof data16 == "object" &&
                  !Array.isArray(data16)
                ) {
                  valid22 = true;
                  if (data16.version !== undefined) {
                    let data17 = data16.version;
                    if (!(
                      typeof data17 == "number" &&
                      isFinite(data17) &&
                      !(data17 % 1) &&
                      data17 >= 0 &&
                      data17 <= 255
                    )) {
                      const err33 = {
                        instancePath:
                          instancePath +
                          "/profiles/" +
                          i0 +
                          "/preferences/version",
                        schemaPath:
                          "/properties/profiles/elements/properties/preferences/properties/version/type",
                        keyword: "type",
                        params: { type: "uint8", nullable: false },
                        message: "must be uint8",
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
                      instancePath:
                        instancePath + "/profiles/" + i0 + "/preferences",
                      schemaPath:
                        "/properties/profiles/elements/properties/preferences/properties/version",
                      keyword: "properties",
                      params: { error: "missing", missingProperty: "version" },
                      message: "must have property 'version'",
                    };
                    if (vErrors === null) {
                      vErrors = [err34];
                    } else {
                      vErrors.push(err34);
                    }
                    errors++;
                  }
                  if (data16.displayName !== undefined) {
                    if (!(typeof data16.displayName == "string")) {
                      const err35 = {
                        instancePath:
                          instancePath +
                          "/profiles/" +
                          i0 +
                          "/preferences/displayName",
                        schemaPath:
                          "/properties/profiles/elements/properties/preferences/optionalProperties/displayName/type",
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
                  }
                  if (data16.avatarId !== undefined) {
                    if (!(typeof data16.avatarId == "string")) {
                      const err36 = {
                        instancePath:
                          instancePath +
                          "/profiles/" +
                          i0 +
                          "/preferences/avatarId",
                        schemaPath:
                          "/properties/profiles/elements/properties/preferences/optionalProperties/avatarId/type",
                        keyword: "type",
                        params: { type: "string", nullable: false },
                        message: "must be string",
                      };
                      if (vErrors === null) {
                        vErrors = [err36];
                      } else {
                        vErrors.push(err36);
                      }
                      errors++;
                    }
                  }
                }
                if (!valid22) {
                  const err37 = {
                    instancePath:
                      instancePath + "/profiles/" + i0 + "/preferences",
                    schemaPath:
                      "/properties/profiles/elements/properties/preferences/properties",
                    keyword: "properties",
                    params: { type: "object", nullable: false },
                    message: "must be object",
                  };
                  if (vErrors === null) {
                    vErrors = [err37];
                  } else {
                    vErrors.push(err37);
                  }
                  errors++;
                }
              } else {
                const err38 = {
                  instancePath: instancePath + "/profiles/" + i0,
                  schemaPath:
                    "/properties/profiles/elements/properties/preferences",
                  keyword: "properties",
                  params: { error: "missing", missingProperty: "preferences" },
                  message: "must have property 'preferences'",
                };
                if (vErrors === null) {
                  vErrors = [err38];
                } else {
                  vErrors.push(err38);
                }
                errors++;
              }
              for (const key5 in data10) {
                if (key5 !== "edit" && key5 !== "preferences") {
                  const err39 = {
                    instancePath:
                      instancePath +
                      "/profiles/" +
                      i0 +
                      "/" +
                      key5.replace(/~/g, "~0").replace(/\//g, "~1"),
                    schemaPath: "/properties/profiles/elements",
                    keyword: "properties",
                    params: { error: "additional", additionalProperty: key5 },
                    message: "must NOT have additional properties",
                  };
                  if (vErrors === null) {
                    vErrors = [err39];
                  } else {
                    vErrors.push(err39);
                  }
                  errors++;
                }
              }
            }
            if (!valid14) {
              const err40 = {
                instancePath: instancePath + "/profiles/" + i0,
                schemaPath: "/properties/profiles/elements/properties",
                keyword: "properties",
                params: { type: "object", nullable: false },
                message: "must be object",
              };
              if (vErrors === null) {
                vErrors = [err40];
              } else {
                vErrors.push(err40);
              }
              errors++;
            }
            var valid12 = _errs10 === errors;
            if (!valid12) {
              valid13 = false;
            }
          }
          valid11 = valid13;
        } else {
          const err41 = {
            instancePath: instancePath + "/profiles",
            schemaPath: "/properties/profiles/elements",
            keyword: "elements",
            params: { type: "array", nullable: false },
            message: "must be array",
          };
          if (vErrors === null) {
            vErrors = [err41];
          } else {
            vErrors.push(err41);
          }
          errors++;
        }
      }
    } else {
      const err42 = {
        instancePath,
        schemaPath: "/properties/profiles",
        keyword: "properties",
        params: { error: "missing", missingProperty: "profiles" },
        message: "must have property 'profiles'",
      };
      if (vErrors === null) {
        vErrors = [err42];
      } else {
        vErrors.push(err42);
      }
      errors++;
    }
    if (data.preparation !== undefined) {
      let data20 = data.preparation;
      let valid26 = false;
      if (data20 && typeof data20 == "object" && !Array.isArray(data20)) {
        const tag0 = data20.kind;
        if (tag0 === undefined) {
          const err43 = {
            instancePath: instancePath + "/preparation",
            schemaPath: "/properties/preparation/discriminator",
            keyword: "discriminator",
            params: { error: "tag", tag: "kind", tagValue: tag0 },
            message: 'tag "kind" must be string',
          };
          if (vErrors === null) {
            vErrors = [err43];
          } else {
            vErrors.push(err43);
          }
          errors++;
        } else if (typeof tag0 == "string") {
          if (tag0 === "required") {
            const _errs22 = errors;
            let valid28 = false;
            valid28 = true;
            if (data20.requiredHash !== undefined) {
              if (!(typeof data20.requiredHash == "string")) {
                const err44 = {
                  instancePath: instancePath + "/preparation/requiredHash",
                  schemaPath:
                    "/properties/preparation/mapping/required/properties/requiredHash/type",
                  keyword: "type",
                  params: { type: "string", nullable: false },
                  message: "must be string",
                };
                if (vErrors === null) {
                  vErrors = [err44];
                } else {
                  vErrors.push(err44);
                }
                errors++;
              }
            } else {
              const err45 = {
                instancePath: instancePath + "/preparation",
                schemaPath:
                  "/properties/preparation/mapping/required/properties/requiredHash",
                keyword: "properties",
                params: { error: "missing", missingProperty: "requiredHash" },
                message: "must have property 'requiredHash'",
              };
              if (vErrors === null) {
                vErrors = [err45];
              } else {
                vErrors.push(err45);
              }
              errors++;
            }
            if (data20.acknowledgedHash !== undefined) {
              let data22 = data20.acknowledgedHash;
              if (!(data22 === null || typeof data22 == "string")) {
                const err46 = {
                  instancePath: instancePath + "/preparation/acknowledgedHash",
                  schemaPath:
                    "/properties/preparation/mapping/required/properties/acknowledgedHash/type",
                  keyword: "type",
                  params: { type: "string", nullable: true },
                  message: "must be string or null",
                };
                if (vErrors === null) {
                  vErrors = [err46];
                } else {
                  vErrors.push(err46);
                }
                errors++;
              }
            } else {
              const err47 = {
                instancePath: instancePath + "/preparation",
                schemaPath:
                  "/properties/preparation/mapping/required/properties/acknowledgedHash",
                keyword: "properties",
                params: {
                  error: "missing",
                  missingProperty: "acknowledgedHash",
                },
                message: "must have property 'acknowledgedHash'",
              };
              if (vErrors === null) {
                vErrors = [err47];
              } else {
                vErrors.push(err47);
              }
              errors++;
            }
            for (const key6 in data20) {
              if (
                key6 !== "kind" &&
                key6 !== "requiredHash" &&
                key6 !== "acknowledgedHash"
              ) {
                const err48 = {
                  instancePath:
                    instancePath +
                    "/preparation/" +
                    key6.replace(/~/g, "~0").replace(/\//g, "~1"),
                  schemaPath: "/properties/preparation/mapping/required",
                  keyword: "properties",
                  params: { error: "additional", additionalProperty: key6 },
                  message: "must NOT have additional properties",
                };
                if (vErrors === null) {
                  vErrors = [err48];
                } else {
                  vErrors.push(err48);
                }
                errors++;
              }
            }
            if (!valid28) {
              const err49 = {
                instancePath: instancePath + "/preparation",
                schemaPath:
                  "/properties/preparation/mapping/required/properties",
                keyword: "properties",
                params: { type: "object", nullable: false },
                message: "must be object",
              };
              if (vErrors === null) {
                vErrors = [err49];
              } else {
                vErrors.push(err49);
              }
              errors++;
            }
            var valid27 = _errs22 === errors;
            valid26 = valid27;
          } else if (tag0 === "acknowledged") {
            const _errs26 = errors;
            let valid32 = false;
            valid32 = true;
            if (data20.hash !== undefined) {
              if (!(typeof data20.hash == "string")) {
                const err50 = {
                  instancePath: instancePath + "/preparation/hash",
                  schemaPath:
                    "/properties/preparation/mapping/acknowledged/properties/hash/type",
                  keyword: "type",
                  params: { type: "string", nullable: false },
                  message: "must be string",
                };
                if (vErrors === null) {
                  vErrors = [err50];
                } else {
                  vErrors.push(err50);
                }
                errors++;
              }
            } else {
              const err51 = {
                instancePath: instancePath + "/preparation",
                schemaPath:
                  "/properties/preparation/mapping/acknowledged/properties/hash",
                keyword: "properties",
                params: { error: "missing", missingProperty: "hash" },
                message: "must have property 'hash'",
              };
              if (vErrors === null) {
                vErrors = [err51];
              } else {
                vErrors.push(err51);
              }
              errors++;
            }
            for (const key7 in data20) {
              if (key7 !== "kind" && key7 !== "hash") {
                const err52 = {
                  instancePath:
                    instancePath +
                    "/preparation/" +
                    key7.replace(/~/g, "~0").replace(/\//g, "~1"),
                  schemaPath: "/properties/preparation/mapping/acknowledged",
                  keyword: "properties",
                  params: { error: "additional", additionalProperty: key7 },
                  message: "must NOT have additional properties",
                };
                if (vErrors === null) {
                  vErrors = [err52];
                } else {
                  vErrors.push(err52);
                }
                errors++;
              }
            }
            if (!valid32) {
              const err53 = {
                instancePath: instancePath + "/preparation",
                schemaPath:
                  "/properties/preparation/mapping/acknowledged/properties",
                keyword: "properties",
                params: { type: "object", nullable: false },
                message: "must be object",
              };
              if (vErrors === null) {
                vErrors = [err53];
              } else {
                vErrors.push(err53);
              }
              errors++;
            }
            var valid31 = _errs26 === errors;
            valid26 = valid31;
          } else if (tag0 === "unavailable") {
            const _errs28 = errors;
            let valid36 = false;
            valid36 = true;
            if (data20.acknowledgedHash !== undefined) {
              let data24 = data20.acknowledgedHash;
              if (!(data24 === null || typeof data24 == "string")) {
                const err54 = {
                  instancePath: instancePath + "/preparation/acknowledgedHash",
                  schemaPath:
                    "/properties/preparation/mapping/unavailable/properties/acknowledgedHash/type",
                  keyword: "type",
                  params: { type: "string", nullable: true },
                  message: "must be string or null",
                };
                if (vErrors === null) {
                  vErrors = [err54];
                } else {
                  vErrors.push(err54);
                }
                errors++;
              }
            } else {
              const err55 = {
                instancePath: instancePath + "/preparation",
                schemaPath:
                  "/properties/preparation/mapping/unavailable/properties/acknowledgedHash",
                keyword: "properties",
                params: {
                  error: "missing",
                  missingProperty: "acknowledgedHash",
                },
                message: "must have property 'acknowledgedHash'",
              };
              if (vErrors === null) {
                vErrors = [err55];
              } else {
                vErrors.push(err55);
              }
              errors++;
            }
            for (const key8 in data20) {
              if (key8 !== "kind" && key8 !== "acknowledgedHash") {
                const err56 = {
                  instancePath:
                    instancePath +
                    "/preparation/" +
                    key8.replace(/~/g, "~0").replace(/\//g, "~1"),
                  schemaPath: "/properties/preparation/mapping/unavailable",
                  keyword: "properties",
                  params: { error: "additional", additionalProperty: key8 },
                  message: "must NOT have additional properties",
                };
                if (vErrors === null) {
                  vErrors = [err56];
                } else {
                  vErrors.push(err56);
                }
                errors++;
              }
            }
            if (!valid36) {
              const err57 = {
                instancePath: instancePath + "/preparation",
                schemaPath:
                  "/properties/preparation/mapping/unavailable/properties",
                keyword: "properties",
                params: { type: "object", nullable: false },
                message: "must be object",
              };
              if (vErrors === null) {
                vErrors = [err57];
              } else {
                vErrors.push(err57);
              }
              errors++;
            }
            var valid35 = _errs28 === errors;
            valid26 = valid35;
          } else {
            const err58 = {
              instancePath: instancePath + "/preparation/kind",
              schemaPath: "/properties/preparation/mapping",
              keyword: "discriminator",
              params: { error: "mapping", tag: "kind", tagValue: tag0 },
              message: 'value of tag "kind" must be in mapping',
            };
            if (vErrors === null) {
              vErrors = [err58];
            } else {
              vErrors.push(err58);
            }
            errors++;
          }
        } else {
          const err59 = {
            instancePath: instancePath + "/preparation/kind",
            schemaPath: "/properties/preparation/discriminator",
            keyword: "discriminator",
            params: { error: "tag", tag: "kind", tagValue: tag0 },
            message: 'tag "kind" must be string',
          };
          if (vErrors === null) {
            vErrors = [err59];
          } else {
            vErrors.push(err59);
          }
          errors++;
        }
      } else if (!valid26) {
        const err60 = {
          instancePath: instancePath + "/preparation",
          schemaPath: "/properties/preparation/discriminator",
          keyword: "discriminator",
          params: { type: "object", nullable: false },
          message: "must be object",
        };
        if (vErrors === null) {
          vErrors = [err60];
        } else {
          vErrors.push(err60);
        }
        errors++;
      }
    } else {
      const err61 = {
        instancePath,
        schemaPath: "/properties/preparation",
        keyword: "properties",
        params: { error: "missing", missingProperty: "preparation" },
        message: "must have property 'preparation'",
      };
      if (vErrors === null) {
        vErrors = [err61];
      } else {
        vErrors.push(err61);
      }
      errors++;
    }
    if (data.initialSetup !== undefined) {
      let data25 = data.initialSetup;
      let valid39 = false;
      if (data25 && typeof data25 == "object" && !Array.isArray(data25)) {
        valid39 = true;
        if (data25.kind !== undefined) {
          let data26 = data25.kind;
          if (!(
            typeof data26 == "string" &&
            (data26 === "firstLaunch" ||
              data26 === "existingFamily" ||
              data26 === "complete")
          )) {
            const err62 = {
              instancePath: instancePath + "/initialSetup/kind",
              schemaPath: "/properties/initialSetup/properties/kind/enum",
              keyword: "enum",
              params: {
                allowedValues:
                  schema36.properties.initialSetup.properties.kind.enum,
              },
              message: "must be equal to one of the allowed values",
            };
            if (vErrors === null) {
              vErrors = [err62];
            } else {
              vErrors.push(err62);
            }
            errors++;
          }
        } else {
          const err63 = {
            instancePath: instancePath + "/initialSetup",
            schemaPath: "/properties/initialSetup/properties/kind",
            keyword: "properties",
            params: { error: "missing", missingProperty: "kind" },
            message: "must have property 'kind'",
          };
          if (vErrors === null) {
            vErrors = [err63];
          } else {
            vErrors.push(err63);
          }
          errors++;
        }
        for (const key9 in data25) {
          if (key9 !== "kind") {
            const err64 = {
              instancePath:
                instancePath +
                "/initialSetup/" +
                key9.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/properties/initialSetup",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key9 },
              message: "must NOT have additional properties",
            };
            if (vErrors === null) {
              vErrors = [err64];
            } else {
              vErrors.push(err64);
            }
            errors++;
          }
        }
      }
      if (!valid39) {
        const err65 = {
          instancePath: instancePath + "/initialSetup",
          schemaPath: "/properties/initialSetup/properties",
          keyword: "properties",
          params: { type: "object", nullable: false },
          message: "must be object",
        };
        if (vErrors === null) {
          vErrors = [err65];
        } else {
          vErrors.push(err65);
        }
        errors++;
      }
    } else {
      const err66 = {
        instancePath,
        schemaPath: "/properties/initialSetup",
        keyword: "properties",
        params: { error: "missing", missingProperty: "initialSetup" },
        message: "must have property 'initialSetup'",
      };
      if (vErrors === null) {
        vErrors = [err66];
      } else {
        vErrors.push(err66);
      }
      errors++;
    }
    for (const key10 in data) {
      if (
        key10 !== "administration" &&
        key10 !== "selection" &&
        key10 !== "profiles" &&
        key10 !== "preparation" &&
        key10 !== "initialSetup"
      ) {
        const err67 = {
          instancePath:
            instancePath + "/" + key10.replace(/~/g, "~0").replace(/\//g, "~1"),
          schemaPath: "",
          keyword: "properties",
          params: { error: "additional", additionalProperty: key10 },
          message: "must NOT have additional properties",
        };
        if (vErrors === null) {
          vErrors = [err67];
        } else {
          vErrors.push(err67);
        }
        errors++;
      }
    }
  }
  if (!valid0) {
    const err68 = {
      instancePath,
      schemaPath: "/properties",
      keyword: "properties",
      params: { type: "object", nullable: false },
      message: "must be object",
    };
    if (vErrors === null) {
      vErrors = [err68];
    } else {
      vErrors.push(err68);
    }
    errors++;
  }
  validate64.errors = vErrors;
  return errors === 0;
}
export const validateProfileAdministrationCommand = validate65;
const schema37 = {
  properties: {
    version: { type: "uint8" },
    commandId: { type: "string" },
    scope: {
      properties: {
        installationId: { type: "string" },
        revision: { type: "string" },
      },
    },
    selection: {
      properties: {
        installationId: { type: "string" },
        revision: { type: "string" },
        owner: {
          properties: {
            profileId: { type: "string" },
            generation: { type: "string" },
          },
        },
      },
    },
    payloadHash: { type: "string" },
    payload: {
      discriminator: "kind",
      mapping: {
        setAvatar: {
          properties: {
            target: {
              properties: {
                owner: {
                  properties: {
                    profileId: { type: "string" },
                    generation: { type: "string" },
                  },
                },
                revision: { type: "string" },
              },
            },
            avatarId: {
              enum: [
                "rabbit",
                "fox",
                "bear",
                "owl",
                "turtle",
                "bird",
                "frog",
                "cat",
              ],
            },
          },
        },
        setDisplayName: {
          properties: {
            target: {
              properties: {
                owner: {
                  properties: {
                    profileId: { type: "string" },
                    generation: { type: "string" },
                  },
                },
                revision: { type: "string" },
              },
            },
            displayName: { type: "string", nullable: true },
          },
        },
        finishInitialProfile: {
          properties: {
            target: {
              properties: {
                owner: {
                  properties: {
                    profileId: { type: "string" },
                    generation: { type: "string" },
                  },
                },
                revision: { type: "string" },
              },
            },
            preferences: {
              properties: {
                avatarId: {
                  enum: [
                    "rabbit",
                    "fox",
                    "bear",
                    "owl",
                    "turtle",
                    "bird",
                    "frog",
                    "cat",
                  ],
                },
              },
              optionalProperties: { displayName: { type: "string" } },
            },
          },
        },
        createAndSelect: {
          properties: {
            owner: {
              properties: {
                profileId: { type: "string" },
                generation: { type: "string" },
              },
            },
            preferences: {
              properties: {
                avatarId: {
                  enum: [
                    "rabbit",
                    "fox",
                    "bear",
                    "owl",
                    "turtle",
                    "bird",
                    "frog",
                    "cat",
                  ],
                },
              },
              optionalProperties: { displayName: { type: "string" } },
            },
            departure: {
              properties: {
                courses: {
                  elements: {
                    properties: {
                      courseId: { type: "string" },
                      witness: {
                        properties: {
                          owner: {
                            properties: {
                              profileId: { type: "string" },
                              generation: { type: "string" },
                            },
                          },
                          profileRevision: { type: "string" },
                          activePackageHash: { type: "string" },
                          activationRevision: { type: "string" },
                          cursorRevision: { type: "string" },
                          selectedSessionRevision: {
                            type: "string",
                            nullable: true,
                          },
                        },
                      },
                      documents: { elements: {} },
                    },
                  },
                },
              },
            },
          },
        },
        selectProfile: {
          properties: {
            target: {
              properties: {
                profileId: { type: "string" },
                generation: { type: "string" },
              },
            },
            departure: {
              properties: {
                courses: {
                  elements: {
                    properties: {
                      courseId: { type: "string" },
                      witness: {
                        properties: {
                          owner: {
                            properties: {
                              profileId: { type: "string" },
                              generation: { type: "string" },
                            },
                          },
                          profileRevision: { type: "string" },
                          activePackageHash: { type: "string" },
                          activationRevision: { type: "string" },
                          cursorRevision: { type: "string" },
                          selectedSessionRevision: {
                            type: "string",
                            nullable: true,
                          },
                        },
                      },
                      documents: { elements: {} },
                    },
                  },
                },
              },
            },
          },
        },
        acknowledgePreparation: { properties: { hash: { type: "string" } } },
      },
    },
  },
};
function validate65(
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
    if (data.commandId !== undefined) {
      if (!(typeof data.commandId == "string")) {
        const err2 = {
          instancePath: instancePath + "/commandId",
          schemaPath: "/properties/commandId/type",
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
        schemaPath: "/properties/commandId",
        keyword: "properties",
        params: { error: "missing", missingProperty: "commandId" },
        message: "must have property 'commandId'",
      };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    if (data.scope !== undefined) {
      let data2 = data.scope;
      let valid2 = false;
      if (data2 && typeof data2 == "object" && !Array.isArray(data2)) {
        valid2 = true;
        if (data2.installationId !== undefined) {
          if (!(typeof data2.installationId == "string")) {
            const err4 = {
              instancePath: instancePath + "/scope/installationId",
              schemaPath: "/properties/scope/properties/installationId/type",
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
            instancePath: instancePath + "/scope",
            schemaPath: "/properties/scope/properties/installationId",
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
        if (data2.revision !== undefined) {
          if (!(typeof data2.revision == "string")) {
            const err6 = {
              instancePath: instancePath + "/scope/revision",
              schemaPath: "/properties/scope/properties/revision/type",
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
            instancePath: instancePath + "/scope",
            schemaPath: "/properties/scope/properties/revision",
            keyword: "properties",
            params: { error: "missing", missingProperty: "revision" },
            message: "must have property 'revision'",
          };
          if (vErrors === null) {
            vErrors = [err7];
          } else {
            vErrors.push(err7);
          }
          errors++;
        }
        for (const key0 in data2) {
          if (key0 !== "installationId" && key0 !== "revision") {
            const err8 = {
              instancePath:
                instancePath +
                "/scope/" +
                key0.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/properties/scope",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key0 },
              message: "must NOT have additional properties",
            };
            if (vErrors === null) {
              vErrors = [err8];
            } else {
              vErrors.push(err8);
            }
            errors++;
          }
        }
      }
      if (!valid2) {
        const err9 = {
          instancePath: instancePath + "/scope",
          schemaPath: "/properties/scope/properties",
          keyword: "properties",
          params: { type: "object", nullable: false },
          message: "must be object",
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
        schemaPath: "/properties/scope",
        keyword: "properties",
        params: { error: "missing", missingProperty: "scope" },
        message: "must have property 'scope'",
      };
      if (vErrors === null) {
        vErrors = [err10];
      } else {
        vErrors.push(err10);
      }
      errors++;
    }
    if (data.selection !== undefined) {
      let data5 = data.selection;
      let valid5 = false;
      if (data5 && typeof data5 == "object" && !Array.isArray(data5)) {
        valid5 = true;
        if (data5.installationId !== undefined) {
          if (!(typeof data5.installationId == "string")) {
            const err11 = {
              instancePath: instancePath + "/selection/installationId",
              schemaPath:
                "/properties/selection/properties/installationId/type",
              keyword: "type",
              params: { type: "string", nullable: false },
              message: "must be string",
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
            instancePath: instancePath + "/selection",
            schemaPath: "/properties/selection/properties/installationId",
            keyword: "properties",
            params: { error: "missing", missingProperty: "installationId" },
            message: "must have property 'installationId'",
          };
          if (vErrors === null) {
            vErrors = [err12];
          } else {
            vErrors.push(err12);
          }
          errors++;
        }
        if (data5.revision !== undefined) {
          if (!(typeof data5.revision == "string")) {
            const err13 = {
              instancePath: instancePath + "/selection/revision",
              schemaPath: "/properties/selection/properties/revision/type",
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
            instancePath: instancePath + "/selection",
            schemaPath: "/properties/selection/properties/revision",
            keyword: "properties",
            params: { error: "missing", missingProperty: "revision" },
            message: "must have property 'revision'",
          };
          if (vErrors === null) {
            vErrors = [err14];
          } else {
            vErrors.push(err14);
          }
          errors++;
        }
        if (data5.owner !== undefined) {
          let data8 = data5.owner;
          let valid7 = false;
          if (data8 && typeof data8 == "object" && !Array.isArray(data8)) {
            valid7 = true;
            if (data8.profileId !== undefined) {
              if (!(typeof data8.profileId == "string")) {
                const err15 = {
                  instancePath: instancePath + "/selection/owner/profileId",
                  schemaPath:
                    "/properties/selection/properties/owner/properties/profileId/type",
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
                instancePath: instancePath + "/selection/owner",
                schemaPath:
                  "/properties/selection/properties/owner/properties/profileId",
                keyword: "properties",
                params: { error: "missing", missingProperty: "profileId" },
                message: "must have property 'profileId'",
              };
              if (vErrors === null) {
                vErrors = [err16];
              } else {
                vErrors.push(err16);
              }
              errors++;
            }
            if (data8.generation !== undefined) {
              if (!(typeof data8.generation == "string")) {
                const err17 = {
                  instancePath: instancePath + "/selection/owner/generation",
                  schemaPath:
                    "/properties/selection/properties/owner/properties/generation/type",
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
                instancePath: instancePath + "/selection/owner",
                schemaPath:
                  "/properties/selection/properties/owner/properties/generation",
                keyword: "properties",
                params: { error: "missing", missingProperty: "generation" },
                message: "must have property 'generation'",
              };
              if (vErrors === null) {
                vErrors = [err18];
              } else {
                vErrors.push(err18);
              }
              errors++;
            }
            for (const key1 in data8) {
              if (key1 !== "profileId" && key1 !== "generation") {
                const err19 = {
                  instancePath:
                    instancePath +
                    "/selection/owner/" +
                    key1.replace(/~/g, "~0").replace(/\//g, "~1"),
                  schemaPath: "/properties/selection/properties/owner",
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
          if (!valid7) {
            const err20 = {
              instancePath: instancePath + "/selection/owner",
              schemaPath: "/properties/selection/properties/owner/properties",
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
            instancePath: instancePath + "/selection",
            schemaPath: "/properties/selection/properties/owner",
            keyword: "properties",
            params: { error: "missing", missingProperty: "owner" },
            message: "must have property 'owner'",
          };
          if (vErrors === null) {
            vErrors = [err21];
          } else {
            vErrors.push(err21);
          }
          errors++;
        }
        for (const key2 in data5) {
          if (
            key2 !== "installationId" &&
            key2 !== "revision" &&
            key2 !== "owner"
          ) {
            const err22 = {
              instancePath:
                instancePath +
                "/selection/" +
                key2.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/properties/selection",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key2 },
              message: "must NOT have additional properties",
            };
            if (vErrors === null) {
              vErrors = [err22];
            } else {
              vErrors.push(err22);
            }
            errors++;
          }
        }
      }
      if (!valid5) {
        const err23 = {
          instancePath: instancePath + "/selection",
          schemaPath: "/properties/selection/properties",
          keyword: "properties",
          params: { type: "object", nullable: false },
          message: "must be object",
        };
        if (vErrors === null) {
          vErrors = [err23];
        } else {
          vErrors.push(err23);
        }
        errors++;
      }
    } else {
      const err24 = {
        instancePath,
        schemaPath: "/properties/selection",
        keyword: "properties",
        params: { error: "missing", missingProperty: "selection" },
        message: "must have property 'selection'",
      };
      if (vErrors === null) {
        vErrors = [err24];
      } else {
        vErrors.push(err24);
      }
      errors++;
    }
    if (data.payloadHash !== undefined) {
      if (!(typeof data.payloadHash == "string")) {
        const err25 = {
          instancePath: instancePath + "/payloadHash",
          schemaPath: "/properties/payloadHash/type",
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
        instancePath,
        schemaPath: "/properties/payloadHash",
        keyword: "properties",
        params: { error: "missing", missingProperty: "payloadHash" },
        message: "must have property 'payloadHash'",
      };
      if (vErrors === null) {
        vErrors = [err26];
      } else {
        vErrors.push(err26);
      }
      errors++;
    }
    if (data.payload !== undefined) {
      let data12 = data.payload;
      let valid11 = false;
      if (data12 && typeof data12 == "object" && !Array.isArray(data12)) {
        const tag0 = data12.kind;
        if (tag0 === undefined) {
          const err27 = {
            instancePath: instancePath + "/payload",
            schemaPath: "/properties/payload/discriminator",
            keyword: "discriminator",
            params: { error: "tag", tag: "kind", tagValue: tag0 },
            message: 'tag "kind" must be string',
          };
          if (vErrors === null) {
            vErrors = [err27];
          } else {
            vErrors.push(err27);
          }
          errors++;
        } else if (typeof tag0 == "string") {
          if (tag0 === "setAvatar") {
            const _errs13 = errors;
            let valid13 = false;
            valid13 = true;
            if (data12.target !== undefined) {
              let data13 = data12.target;
              let valid15 = false;
              if (
                data13 &&
                typeof data13 == "object" &&
                !Array.isArray(data13)
              ) {
                valid15 = true;
                if (data13.owner !== undefined) {
                  let data14 = data13.owner;
                  let valid17 = false;
                  if (
                    data14 &&
                    typeof data14 == "object" &&
                    !Array.isArray(data14)
                  ) {
                    valid17 = true;
                    if (data14.profileId !== undefined) {
                      if (!(typeof data14.profileId == "string")) {
                        const err28 = {
                          instancePath:
                            instancePath + "/payload/target/owner/profileId",
                          schemaPath:
                            "/properties/payload/mapping/setAvatar/properties/target/properties/owner/properties/profileId/type",
                          keyword: "type",
                          params: { type: "string", nullable: false },
                          message: "must be string",
                        };
                        if (vErrors === null) {
                          vErrors = [err28];
                        } else {
                          vErrors.push(err28);
                        }
                        errors++;
                      }
                    } else {
                      const err29 = {
                        instancePath: instancePath + "/payload/target/owner",
                        schemaPath:
                          "/properties/payload/mapping/setAvatar/properties/target/properties/owner/properties/profileId",
                        keyword: "properties",
                        params: {
                          error: "missing",
                          missingProperty: "profileId",
                        },
                        message: "must have property 'profileId'",
                      };
                      if (vErrors === null) {
                        vErrors = [err29];
                      } else {
                        vErrors.push(err29);
                      }
                      errors++;
                    }
                    if (data14.generation !== undefined) {
                      if (!(typeof data14.generation == "string")) {
                        const err30 = {
                          instancePath:
                            instancePath + "/payload/target/owner/generation",
                          schemaPath:
                            "/properties/payload/mapping/setAvatar/properties/target/properties/owner/properties/generation/type",
                          keyword: "type",
                          params: { type: "string", nullable: false },
                          message: "must be string",
                        };
                        if (vErrors === null) {
                          vErrors = [err30];
                        } else {
                          vErrors.push(err30);
                        }
                        errors++;
                      }
                    } else {
                      const err31 = {
                        instancePath: instancePath + "/payload/target/owner",
                        schemaPath:
                          "/properties/payload/mapping/setAvatar/properties/target/properties/owner/properties/generation",
                        keyword: "properties",
                        params: {
                          error: "missing",
                          missingProperty: "generation",
                        },
                        message: "must have property 'generation'",
                      };
                      if (vErrors === null) {
                        vErrors = [err31];
                      } else {
                        vErrors.push(err31);
                      }
                      errors++;
                    }
                    for (const key3 in data14) {
                      if (key3 !== "profileId" && key3 !== "generation") {
                        const err32 = {
                          instancePath:
                            instancePath +
                            "/payload/target/owner/" +
                            key3.replace(/~/g, "~0").replace(/\//g, "~1"),
                          schemaPath:
                            "/properties/payload/mapping/setAvatar/properties/target/properties/owner",
                          keyword: "properties",
                          params: {
                            error: "additional",
                            additionalProperty: key3,
                          },
                          message: "must NOT have additional properties",
                        };
                        if (vErrors === null) {
                          vErrors = [err32];
                        } else {
                          vErrors.push(err32);
                        }
                        errors++;
                      }
                    }
                  }
                  if (!valid17) {
                    const err33 = {
                      instancePath: instancePath + "/payload/target/owner",
                      schemaPath:
                        "/properties/payload/mapping/setAvatar/properties/target/properties/owner/properties",
                      keyword: "properties",
                      params: { type: "object", nullable: false },
                      message: "must be object",
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
                    instancePath: instancePath + "/payload/target",
                    schemaPath:
                      "/properties/payload/mapping/setAvatar/properties/target/properties/owner",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "owner" },
                    message: "must have property 'owner'",
                  };
                  if (vErrors === null) {
                    vErrors = [err34];
                  } else {
                    vErrors.push(err34);
                  }
                  errors++;
                }
                if (data13.revision !== undefined) {
                  if (!(typeof data13.revision == "string")) {
                    const err35 = {
                      instancePath: instancePath + "/payload/target/revision",
                      schemaPath:
                        "/properties/payload/mapping/setAvatar/properties/target/properties/revision/type",
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
                    instancePath: instancePath + "/payload/target",
                    schemaPath:
                      "/properties/payload/mapping/setAvatar/properties/target/properties/revision",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "revision" },
                    message: "must have property 'revision'",
                  };
                  if (vErrors === null) {
                    vErrors = [err36];
                  } else {
                    vErrors.push(err36);
                  }
                  errors++;
                }
                for (const key4 in data13) {
                  if (key4 !== "owner" && key4 !== "revision") {
                    const err37 = {
                      instancePath:
                        instancePath +
                        "/payload/target/" +
                        key4.replace(/~/g, "~0").replace(/\//g, "~1"),
                      schemaPath:
                        "/properties/payload/mapping/setAvatar/properties/target",
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
              if (!valid15) {
                const err38 = {
                  instancePath: instancePath + "/payload/target",
                  schemaPath:
                    "/properties/payload/mapping/setAvatar/properties/target/properties",
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
            } else {
              const err39 = {
                instancePath: instancePath + "/payload",
                schemaPath:
                  "/properties/payload/mapping/setAvatar/properties/target",
                keyword: "properties",
                params: { error: "missing", missingProperty: "target" },
                message: "must have property 'target'",
              };
              if (vErrors === null) {
                vErrors = [err39];
              } else {
                vErrors.push(err39);
              }
              errors++;
            }
            if (data12.avatarId !== undefined) {
              let data18 = data12.avatarId;
              if (!(
                typeof data18 == "string" &&
                (data18 === "rabbit" ||
                  data18 === "fox" ||
                  data18 === "bear" ||
                  data18 === "owl" ||
                  data18 === "turtle" ||
                  data18 === "bird" ||
                  data18 === "frog" ||
                  data18 === "cat")
              )) {
                const err40 = {
                  instancePath: instancePath + "/payload/avatarId",
                  schemaPath:
                    "/properties/payload/mapping/setAvatar/properties/avatarId/enum",
                  keyword: "enum",
                  params: {
                    allowedValues:
                      schema37.properties.payload.mapping.setAvatar.properties
                        .avatarId.enum,
                  },
                  message: "must be equal to one of the allowed values",
                };
                if (vErrors === null) {
                  vErrors = [err40];
                } else {
                  vErrors.push(err40);
                }
                errors++;
              }
            } else {
              const err41 = {
                instancePath: instancePath + "/payload",
                schemaPath:
                  "/properties/payload/mapping/setAvatar/properties/avatarId",
                keyword: "properties",
                params: { error: "missing", missingProperty: "avatarId" },
                message: "must have property 'avatarId'",
              };
              if (vErrors === null) {
                vErrors = [err41];
              } else {
                vErrors.push(err41);
              }
              errors++;
            }
            for (const key5 in data12) {
              if (key5 !== "kind" && key5 !== "target" && key5 !== "avatarId") {
                const err42 = {
                  instancePath:
                    instancePath +
                    "/payload/" +
                    key5.replace(/~/g, "~0").replace(/\//g, "~1"),
                  schemaPath: "/properties/payload/mapping/setAvatar",
                  keyword: "properties",
                  params: { error: "additional", additionalProperty: key5 },
                  message: "must NOT have additional properties",
                };
                if (vErrors === null) {
                  vErrors = [err42];
                } else {
                  vErrors.push(err42);
                }
                errors++;
              }
            }
            if (!valid13) {
              const err43 = {
                instancePath: instancePath + "/payload",
                schemaPath: "/properties/payload/mapping/setAvatar/properties",
                keyword: "properties",
                params: { type: "object", nullable: false },
                message: "must be object",
              };
              if (vErrors === null) {
                vErrors = [err43];
              } else {
                vErrors.push(err43);
              }
              errors++;
            }
            var valid12 = _errs13 === errors;
            valid11 = valid12;
          } else if (tag0 === "setDisplayName") {
            const _errs20 = errors;
            let valid23 = false;
            valid23 = true;
            if (data12.target !== undefined) {
              let data19 = data12.target;
              let valid25 = false;
              if (
                data19 &&
                typeof data19 == "object" &&
                !Array.isArray(data19)
              ) {
                valid25 = true;
                if (data19.owner !== undefined) {
                  let data20 = data19.owner;
                  let valid27 = false;
                  if (
                    data20 &&
                    typeof data20 == "object" &&
                    !Array.isArray(data20)
                  ) {
                    valid27 = true;
                    if (data20.profileId !== undefined) {
                      if (!(typeof data20.profileId == "string")) {
                        const err44 = {
                          instancePath:
                            instancePath + "/payload/target/owner/profileId",
                          schemaPath:
                            "/properties/payload/mapping/setDisplayName/properties/target/properties/owner/properties/profileId/type",
                          keyword: "type",
                          params: { type: "string", nullable: false },
                          message: "must be string",
                        };
                        if (vErrors === null) {
                          vErrors = [err44];
                        } else {
                          vErrors.push(err44);
                        }
                        errors++;
                      }
                    } else {
                      const err45 = {
                        instancePath: instancePath + "/payload/target/owner",
                        schemaPath:
                          "/properties/payload/mapping/setDisplayName/properties/target/properties/owner/properties/profileId",
                        keyword: "properties",
                        params: {
                          error: "missing",
                          missingProperty: "profileId",
                        },
                        message: "must have property 'profileId'",
                      };
                      if (vErrors === null) {
                        vErrors = [err45];
                      } else {
                        vErrors.push(err45);
                      }
                      errors++;
                    }
                    if (data20.generation !== undefined) {
                      if (!(typeof data20.generation == "string")) {
                        const err46 = {
                          instancePath:
                            instancePath + "/payload/target/owner/generation",
                          schemaPath:
                            "/properties/payload/mapping/setDisplayName/properties/target/properties/owner/properties/generation/type",
                          keyword: "type",
                          params: { type: "string", nullable: false },
                          message: "must be string",
                        };
                        if (vErrors === null) {
                          vErrors = [err46];
                        } else {
                          vErrors.push(err46);
                        }
                        errors++;
                      }
                    } else {
                      const err47 = {
                        instancePath: instancePath + "/payload/target/owner",
                        schemaPath:
                          "/properties/payload/mapping/setDisplayName/properties/target/properties/owner/properties/generation",
                        keyword: "properties",
                        params: {
                          error: "missing",
                          missingProperty: "generation",
                        },
                        message: "must have property 'generation'",
                      };
                      if (vErrors === null) {
                        vErrors = [err47];
                      } else {
                        vErrors.push(err47);
                      }
                      errors++;
                    }
                    for (const key6 in data20) {
                      if (key6 !== "profileId" && key6 !== "generation") {
                        const err48 = {
                          instancePath:
                            instancePath +
                            "/payload/target/owner/" +
                            key6.replace(/~/g, "~0").replace(/\//g, "~1"),
                          schemaPath:
                            "/properties/payload/mapping/setDisplayName/properties/target/properties/owner",
                          keyword: "properties",
                          params: {
                            error: "additional",
                            additionalProperty: key6,
                          },
                          message: "must NOT have additional properties",
                        };
                        if (vErrors === null) {
                          vErrors = [err48];
                        } else {
                          vErrors.push(err48);
                        }
                        errors++;
                      }
                    }
                  }
                  if (!valid27) {
                    const err49 = {
                      instancePath: instancePath + "/payload/target/owner",
                      schemaPath:
                        "/properties/payload/mapping/setDisplayName/properties/target/properties/owner/properties",
                      keyword: "properties",
                      params: { type: "object", nullable: false },
                      message: "must be object",
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
                    instancePath: instancePath + "/payload/target",
                    schemaPath:
                      "/properties/payload/mapping/setDisplayName/properties/target/properties/owner",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "owner" },
                    message: "must have property 'owner'",
                  };
                  if (vErrors === null) {
                    vErrors = [err50];
                  } else {
                    vErrors.push(err50);
                  }
                  errors++;
                }
                if (data19.revision !== undefined) {
                  if (!(typeof data19.revision == "string")) {
                    const err51 = {
                      instancePath: instancePath + "/payload/target/revision",
                      schemaPath:
                        "/properties/payload/mapping/setDisplayName/properties/target/properties/revision/type",
                      keyword: "type",
                      params: { type: "string", nullable: false },
                      message: "must be string",
                    };
                    if (vErrors === null) {
                      vErrors = [err51];
                    } else {
                      vErrors.push(err51);
                    }
                    errors++;
                  }
                } else {
                  const err52 = {
                    instancePath: instancePath + "/payload/target",
                    schemaPath:
                      "/properties/payload/mapping/setDisplayName/properties/target/properties/revision",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "revision" },
                    message: "must have property 'revision'",
                  };
                  if (vErrors === null) {
                    vErrors = [err52];
                  } else {
                    vErrors.push(err52);
                  }
                  errors++;
                }
                for (const key7 in data19) {
                  if (key7 !== "owner" && key7 !== "revision") {
                    const err53 = {
                      instancePath:
                        instancePath +
                        "/payload/target/" +
                        key7.replace(/~/g, "~0").replace(/\//g, "~1"),
                      schemaPath:
                        "/properties/payload/mapping/setDisplayName/properties/target",
                      keyword: "properties",
                      params: { error: "additional", additionalProperty: key7 },
                      message: "must NOT have additional properties",
                    };
                    if (vErrors === null) {
                      vErrors = [err53];
                    } else {
                      vErrors.push(err53);
                    }
                    errors++;
                  }
                }
              }
              if (!valid25) {
                const err54 = {
                  instancePath: instancePath + "/payload/target",
                  schemaPath:
                    "/properties/payload/mapping/setDisplayName/properties/target/properties",
                  keyword: "properties",
                  params: { type: "object", nullable: false },
                  message: "must be object",
                };
                if (vErrors === null) {
                  vErrors = [err54];
                } else {
                  vErrors.push(err54);
                }
                errors++;
              }
            } else {
              const err55 = {
                instancePath: instancePath + "/payload",
                schemaPath:
                  "/properties/payload/mapping/setDisplayName/properties/target",
                keyword: "properties",
                params: { error: "missing", missingProperty: "target" },
                message: "must have property 'target'",
              };
              if (vErrors === null) {
                vErrors = [err55];
              } else {
                vErrors.push(err55);
              }
              errors++;
            }
            if (data12.displayName !== undefined) {
              let data24 = data12.displayName;
              if (!(data24 === null || typeof data24 == "string")) {
                const err56 = {
                  instancePath: instancePath + "/payload/displayName",
                  schemaPath:
                    "/properties/payload/mapping/setDisplayName/properties/displayName/type",
                  keyword: "type",
                  params: { type: "string", nullable: true },
                  message: "must be string or null",
                };
                if (vErrors === null) {
                  vErrors = [err56];
                } else {
                  vErrors.push(err56);
                }
                errors++;
              }
            } else {
              const err57 = {
                instancePath: instancePath + "/payload",
                schemaPath:
                  "/properties/payload/mapping/setDisplayName/properties/displayName",
                keyword: "properties",
                params: { error: "missing", missingProperty: "displayName" },
                message: "must have property 'displayName'",
              };
              if (vErrors === null) {
                vErrors = [err57];
              } else {
                vErrors.push(err57);
              }
              errors++;
            }
            for (const key8 in data12) {
              if (
                key8 !== "kind" &&
                key8 !== "target" &&
                key8 !== "displayName"
              ) {
                const err58 = {
                  instancePath:
                    instancePath +
                    "/payload/" +
                    key8.replace(/~/g, "~0").replace(/\//g, "~1"),
                  schemaPath: "/properties/payload/mapping/setDisplayName",
                  keyword: "properties",
                  params: { error: "additional", additionalProperty: key8 },
                  message: "must NOT have additional properties",
                };
                if (vErrors === null) {
                  vErrors = [err58];
                } else {
                  vErrors.push(err58);
                }
                errors++;
              }
            }
            if (!valid23) {
              const err59 = {
                instancePath: instancePath + "/payload",
                schemaPath:
                  "/properties/payload/mapping/setDisplayName/properties",
                keyword: "properties",
                params: { type: "object", nullable: false },
                message: "must be object",
              };
              if (vErrors === null) {
                vErrors = [err59];
              } else {
                vErrors.push(err59);
              }
              errors++;
            }
            var valid22 = _errs20 === errors;
            valid11 = valid22;
          } else if (tag0 === "finishInitialProfile") {
            const _errs28 = errors;
            let valid33 = false;
            valid33 = true;
            if (data12.target !== undefined) {
              let data25 = data12.target;
              let valid35 = false;
              if (
                data25 &&
                typeof data25 == "object" &&
                !Array.isArray(data25)
              ) {
                valid35 = true;
                if (data25.owner !== undefined) {
                  let data26 = data25.owner;
                  let valid37 = false;
                  if (
                    data26 &&
                    typeof data26 == "object" &&
                    !Array.isArray(data26)
                  ) {
                    valid37 = true;
                    if (data26.profileId !== undefined) {
                      if (!(typeof data26.profileId == "string")) {
                        const err60 = {
                          instancePath:
                            instancePath + "/payload/target/owner/profileId",
                          schemaPath:
                            "/properties/payload/mapping/finishInitialProfile/properties/target/properties/owner/properties/profileId/type",
                          keyword: "type",
                          params: { type: "string", nullable: false },
                          message: "must be string",
                        };
                        if (vErrors === null) {
                          vErrors = [err60];
                        } else {
                          vErrors.push(err60);
                        }
                        errors++;
                      }
                    } else {
                      const err61 = {
                        instancePath: instancePath + "/payload/target/owner",
                        schemaPath:
                          "/properties/payload/mapping/finishInitialProfile/properties/target/properties/owner/properties/profileId",
                        keyword: "properties",
                        params: {
                          error: "missing",
                          missingProperty: "profileId",
                        },
                        message: "must have property 'profileId'",
                      };
                      if (vErrors === null) {
                        vErrors = [err61];
                      } else {
                        vErrors.push(err61);
                      }
                      errors++;
                    }
                    if (data26.generation !== undefined) {
                      if (!(typeof data26.generation == "string")) {
                        const err62 = {
                          instancePath:
                            instancePath + "/payload/target/owner/generation",
                          schemaPath:
                            "/properties/payload/mapping/finishInitialProfile/properties/target/properties/owner/properties/generation/type",
                          keyword: "type",
                          params: { type: "string", nullable: false },
                          message: "must be string",
                        };
                        if (vErrors === null) {
                          vErrors = [err62];
                        } else {
                          vErrors.push(err62);
                        }
                        errors++;
                      }
                    } else {
                      const err63 = {
                        instancePath: instancePath + "/payload/target/owner",
                        schemaPath:
                          "/properties/payload/mapping/finishInitialProfile/properties/target/properties/owner/properties/generation",
                        keyword: "properties",
                        params: {
                          error: "missing",
                          missingProperty: "generation",
                        },
                        message: "must have property 'generation'",
                      };
                      if (vErrors === null) {
                        vErrors = [err63];
                      } else {
                        vErrors.push(err63);
                      }
                      errors++;
                    }
                    for (const key9 in data26) {
                      if (key9 !== "profileId" && key9 !== "generation") {
                        const err64 = {
                          instancePath:
                            instancePath +
                            "/payload/target/owner/" +
                            key9.replace(/~/g, "~0").replace(/\//g, "~1"),
                          schemaPath:
                            "/properties/payload/mapping/finishInitialProfile/properties/target/properties/owner",
                          keyword: "properties",
                          params: {
                            error: "additional",
                            additionalProperty: key9,
                          },
                          message: "must NOT have additional properties",
                        };
                        if (vErrors === null) {
                          vErrors = [err64];
                        } else {
                          vErrors.push(err64);
                        }
                        errors++;
                      }
                    }
                  }
                  if (!valid37) {
                    const err65 = {
                      instancePath: instancePath + "/payload/target/owner",
                      schemaPath:
                        "/properties/payload/mapping/finishInitialProfile/properties/target/properties/owner/properties",
                      keyword: "properties",
                      params: { type: "object", nullable: false },
                      message: "must be object",
                    };
                    if (vErrors === null) {
                      vErrors = [err65];
                    } else {
                      vErrors.push(err65);
                    }
                    errors++;
                  }
                } else {
                  const err66 = {
                    instancePath: instancePath + "/payload/target",
                    schemaPath:
                      "/properties/payload/mapping/finishInitialProfile/properties/target/properties/owner",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "owner" },
                    message: "must have property 'owner'",
                  };
                  if (vErrors === null) {
                    vErrors = [err66];
                  } else {
                    vErrors.push(err66);
                  }
                  errors++;
                }
                if (data25.revision !== undefined) {
                  if (!(typeof data25.revision == "string")) {
                    const err67 = {
                      instancePath: instancePath + "/payload/target/revision",
                      schemaPath:
                        "/properties/payload/mapping/finishInitialProfile/properties/target/properties/revision/type",
                      keyword: "type",
                      params: { type: "string", nullable: false },
                      message: "must be string",
                    };
                    if (vErrors === null) {
                      vErrors = [err67];
                    } else {
                      vErrors.push(err67);
                    }
                    errors++;
                  }
                } else {
                  const err68 = {
                    instancePath: instancePath + "/payload/target",
                    schemaPath:
                      "/properties/payload/mapping/finishInitialProfile/properties/target/properties/revision",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "revision" },
                    message: "must have property 'revision'",
                  };
                  if (vErrors === null) {
                    vErrors = [err68];
                  } else {
                    vErrors.push(err68);
                  }
                  errors++;
                }
                for (const key10 in data25) {
                  if (key10 !== "owner" && key10 !== "revision") {
                    const err69 = {
                      instancePath:
                        instancePath +
                        "/payload/target/" +
                        key10.replace(/~/g, "~0").replace(/\//g, "~1"),
                      schemaPath:
                        "/properties/payload/mapping/finishInitialProfile/properties/target",
                      keyword: "properties",
                      params: {
                        error: "additional",
                        additionalProperty: key10,
                      },
                      message: "must NOT have additional properties",
                    };
                    if (vErrors === null) {
                      vErrors = [err69];
                    } else {
                      vErrors.push(err69);
                    }
                    errors++;
                  }
                }
              }
              if (!valid35) {
                const err70 = {
                  instancePath: instancePath + "/payload/target",
                  schemaPath:
                    "/properties/payload/mapping/finishInitialProfile/properties/target/properties",
                  keyword: "properties",
                  params: { type: "object", nullable: false },
                  message: "must be object",
                };
                if (vErrors === null) {
                  vErrors = [err70];
                } else {
                  vErrors.push(err70);
                }
                errors++;
              }
            } else {
              const err71 = {
                instancePath: instancePath + "/payload",
                schemaPath:
                  "/properties/payload/mapping/finishInitialProfile/properties/target",
                keyword: "properties",
                params: { error: "missing", missingProperty: "target" },
                message: "must have property 'target'",
              };
              if (vErrors === null) {
                vErrors = [err71];
              } else {
                vErrors.push(err71);
              }
              errors++;
            }
            if (data12.preferences !== undefined) {
              let data30 = data12.preferences;
              let valid41 = false;
              if (
                data30 &&
                typeof data30 == "object" &&
                !Array.isArray(data30)
              ) {
                valid41 = true;
                if (data30.avatarId !== undefined) {
                  let data31 = data30.avatarId;
                  if (!(
                    typeof data31 == "string" &&
                    (data31 === "rabbit" ||
                      data31 === "fox" ||
                      data31 === "bear" ||
                      data31 === "owl" ||
                      data31 === "turtle" ||
                      data31 === "bird" ||
                      data31 === "frog" ||
                      data31 === "cat")
                  )) {
                    const err72 = {
                      instancePath:
                        instancePath + "/payload/preferences/avatarId",
                      schemaPath:
                        "/properties/payload/mapping/finishInitialProfile/properties/preferences/properties/avatarId/enum",
                      keyword: "enum",
                      params: {
                        allowedValues:
                          schema37.properties.payload.mapping
                            .finishInitialProfile.properties.preferences
                            .properties.avatarId.enum,
                      },
                      message: "must be equal to one of the allowed values",
                    };
                    if (vErrors === null) {
                      vErrors = [err72];
                    } else {
                      vErrors.push(err72);
                    }
                    errors++;
                  }
                } else {
                  const err73 = {
                    instancePath: instancePath + "/payload/preferences",
                    schemaPath:
                      "/properties/payload/mapping/finishInitialProfile/properties/preferences/properties/avatarId",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "avatarId" },
                    message: "must have property 'avatarId'",
                  };
                  if (vErrors === null) {
                    vErrors = [err73];
                  } else {
                    vErrors.push(err73);
                  }
                  errors++;
                }
                if (data30.displayName !== undefined) {
                  if (!(typeof data30.displayName == "string")) {
                    const err74 = {
                      instancePath:
                        instancePath + "/payload/preferences/displayName",
                      schemaPath:
                        "/properties/payload/mapping/finishInitialProfile/properties/preferences/optionalProperties/displayName/type",
                      keyword: "type",
                      params: { type: "string", nullable: false },
                      message: "must be string",
                    };
                    if (vErrors === null) {
                      vErrors = [err74];
                    } else {
                      vErrors.push(err74);
                    }
                    errors++;
                  }
                }
                for (const key11 in data30) {
                  if (key11 !== "avatarId" && key11 !== "displayName") {
                    const err75 = {
                      instancePath:
                        instancePath +
                        "/payload/preferences/" +
                        key11.replace(/~/g, "~0").replace(/\//g, "~1"),
                      schemaPath:
                        "/properties/payload/mapping/finishInitialProfile/properties/preferences",
                      keyword: "properties",
                      params: {
                        error: "additional",
                        additionalProperty: key11,
                      },
                      message: "must NOT have additional properties",
                    };
                    if (vErrors === null) {
                      vErrors = [err75];
                    } else {
                      vErrors.push(err75);
                    }
                    errors++;
                  }
                }
              }
              if (!valid41) {
                const err76 = {
                  instancePath: instancePath + "/payload/preferences",
                  schemaPath:
                    "/properties/payload/mapping/finishInitialProfile/properties/preferences/properties",
                  keyword: "properties",
                  params: { type: "object", nullable: false },
                  message: "must be object",
                };
                if (vErrors === null) {
                  vErrors = [err76];
                } else {
                  vErrors.push(err76);
                }
                errors++;
              }
            } else {
              const err77 = {
                instancePath: instancePath + "/payload",
                schemaPath:
                  "/properties/payload/mapping/finishInitialProfile/properties/preferences",
                keyword: "properties",
                params: { error: "missing", missingProperty: "preferences" },
                message: "must have property 'preferences'",
              };
              if (vErrors === null) {
                vErrors = [err77];
              } else {
                vErrors.push(err77);
              }
              errors++;
            }
            for (const key12 in data12) {
              if (
                key12 !== "kind" &&
                key12 !== "target" &&
                key12 !== "preferences"
              ) {
                const err78 = {
                  instancePath:
                    instancePath +
                    "/payload/" +
                    key12.replace(/~/g, "~0").replace(/\//g, "~1"),
                  schemaPath:
                    "/properties/payload/mapping/finishInitialProfile",
                  keyword: "properties",
                  params: { error: "additional", additionalProperty: key12 },
                  message: "must NOT have additional properties",
                };
                if (vErrors === null) {
                  vErrors = [err78];
                } else {
                  vErrors.push(err78);
                }
                errors++;
              }
            }
            if (!valid33) {
              const err79 = {
                instancePath: instancePath + "/payload",
                schemaPath:
                  "/properties/payload/mapping/finishInitialProfile/properties",
                keyword: "properties",
                params: { type: "object", nullable: false },
                message: "must be object",
              };
              if (vErrors === null) {
                vErrors = [err79];
              } else {
                vErrors.push(err79);
              }
              errors++;
            }
            var valid32 = _errs28 === errors;
            valid11 = valid32;
          } else if (tag0 === "createAndSelect") {
            const _errs37 = errors;
            let valid46 = false;
            valid46 = true;
            if (data12.owner !== undefined) {
              let data33 = data12.owner;
              let valid48 = false;
              if (
                data33 &&
                typeof data33 == "object" &&
                !Array.isArray(data33)
              ) {
                valid48 = true;
                if (data33.profileId !== undefined) {
                  if (!(typeof data33.profileId == "string")) {
                    const err80 = {
                      instancePath: instancePath + "/payload/owner/profileId",
                      schemaPath:
                        "/properties/payload/mapping/createAndSelect/properties/owner/properties/profileId/type",
                      keyword: "type",
                      params: { type: "string", nullable: false },
                      message: "must be string",
                    };
                    if (vErrors === null) {
                      vErrors = [err80];
                    } else {
                      vErrors.push(err80);
                    }
                    errors++;
                  }
                } else {
                  const err81 = {
                    instancePath: instancePath + "/payload/owner",
                    schemaPath:
                      "/properties/payload/mapping/createAndSelect/properties/owner/properties/profileId",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "profileId" },
                    message: "must have property 'profileId'",
                  };
                  if (vErrors === null) {
                    vErrors = [err81];
                  } else {
                    vErrors.push(err81);
                  }
                  errors++;
                }
                if (data33.generation !== undefined) {
                  if (!(typeof data33.generation == "string")) {
                    const err82 = {
                      instancePath: instancePath + "/payload/owner/generation",
                      schemaPath:
                        "/properties/payload/mapping/createAndSelect/properties/owner/properties/generation/type",
                      keyword: "type",
                      params: { type: "string", nullable: false },
                      message: "must be string",
                    };
                    if (vErrors === null) {
                      vErrors = [err82];
                    } else {
                      vErrors.push(err82);
                    }
                    errors++;
                  }
                } else {
                  const err83 = {
                    instancePath: instancePath + "/payload/owner",
                    schemaPath:
                      "/properties/payload/mapping/createAndSelect/properties/owner/properties/generation",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "generation" },
                    message: "must have property 'generation'",
                  };
                  if (vErrors === null) {
                    vErrors = [err83];
                  } else {
                    vErrors.push(err83);
                  }
                  errors++;
                }
                for (const key13 in data33) {
                  if (key13 !== "profileId" && key13 !== "generation") {
                    const err84 = {
                      instancePath:
                        instancePath +
                        "/payload/owner/" +
                        key13.replace(/~/g, "~0").replace(/\//g, "~1"),
                      schemaPath:
                        "/properties/payload/mapping/createAndSelect/properties/owner",
                      keyword: "properties",
                      params: {
                        error: "additional",
                        additionalProperty: key13,
                      },
                      message: "must NOT have additional properties",
                    };
                    if (vErrors === null) {
                      vErrors = [err84];
                    } else {
                      vErrors.push(err84);
                    }
                    errors++;
                  }
                }
              }
              if (!valid48) {
                const err85 = {
                  instancePath: instancePath + "/payload/owner",
                  schemaPath:
                    "/properties/payload/mapping/createAndSelect/properties/owner/properties",
                  keyword: "properties",
                  params: { type: "object", nullable: false },
                  message: "must be object",
                };
                if (vErrors === null) {
                  vErrors = [err85];
                } else {
                  vErrors.push(err85);
                }
                errors++;
              }
            } else {
              const err86 = {
                instancePath: instancePath + "/payload",
                schemaPath:
                  "/properties/payload/mapping/createAndSelect/properties/owner",
                keyword: "properties",
                params: { error: "missing", missingProperty: "owner" },
                message: "must have property 'owner'",
              };
              if (vErrors === null) {
                vErrors = [err86];
              } else {
                vErrors.push(err86);
              }
              errors++;
            }
            if (data12.preferences !== undefined) {
              let data36 = data12.preferences;
              let valid51 = false;
              if (
                data36 &&
                typeof data36 == "object" &&
                !Array.isArray(data36)
              ) {
                valid51 = true;
                if (data36.avatarId !== undefined) {
                  let data37 = data36.avatarId;
                  if (!(
                    typeof data37 == "string" &&
                    (data37 === "rabbit" ||
                      data37 === "fox" ||
                      data37 === "bear" ||
                      data37 === "owl" ||
                      data37 === "turtle" ||
                      data37 === "bird" ||
                      data37 === "frog" ||
                      data37 === "cat")
                  )) {
                    const err87 = {
                      instancePath:
                        instancePath + "/payload/preferences/avatarId",
                      schemaPath:
                        "/properties/payload/mapping/createAndSelect/properties/preferences/properties/avatarId/enum",
                      keyword: "enum",
                      params: {
                        allowedValues:
                          schema37.properties.payload.mapping.createAndSelect
                            .properties.preferences.properties.avatarId.enum,
                      },
                      message: "must be equal to one of the allowed values",
                    };
                    if (vErrors === null) {
                      vErrors = [err87];
                    } else {
                      vErrors.push(err87);
                    }
                    errors++;
                  }
                } else {
                  const err88 = {
                    instancePath: instancePath + "/payload/preferences",
                    schemaPath:
                      "/properties/payload/mapping/createAndSelect/properties/preferences/properties/avatarId",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "avatarId" },
                    message: "must have property 'avatarId'",
                  };
                  if (vErrors === null) {
                    vErrors = [err88];
                  } else {
                    vErrors.push(err88);
                  }
                  errors++;
                }
                if (data36.displayName !== undefined) {
                  if (!(typeof data36.displayName == "string")) {
                    const err89 = {
                      instancePath:
                        instancePath + "/payload/preferences/displayName",
                      schemaPath:
                        "/properties/payload/mapping/createAndSelect/properties/preferences/optionalProperties/displayName/type",
                      keyword: "type",
                      params: { type: "string", nullable: false },
                      message: "must be string",
                    };
                    if (vErrors === null) {
                      vErrors = [err89];
                    } else {
                      vErrors.push(err89);
                    }
                    errors++;
                  }
                }
                for (const key14 in data36) {
                  if (key14 !== "avatarId" && key14 !== "displayName") {
                    const err90 = {
                      instancePath:
                        instancePath +
                        "/payload/preferences/" +
                        key14.replace(/~/g, "~0").replace(/\//g, "~1"),
                      schemaPath:
                        "/properties/payload/mapping/createAndSelect/properties/preferences",
                      keyword: "properties",
                      params: {
                        error: "additional",
                        additionalProperty: key14,
                      },
                      message: "must NOT have additional properties",
                    };
                    if (vErrors === null) {
                      vErrors = [err90];
                    } else {
                      vErrors.push(err90);
                    }
                    errors++;
                  }
                }
              }
              if (!valid51) {
                const err91 = {
                  instancePath: instancePath + "/payload/preferences",
                  schemaPath:
                    "/properties/payload/mapping/createAndSelect/properties/preferences/properties",
                  keyword: "properties",
                  params: { type: "object", nullable: false },
                  message: "must be object",
                };
                if (vErrors === null) {
                  vErrors = [err91];
                } else {
                  vErrors.push(err91);
                }
                errors++;
              }
            } else {
              const err92 = {
                instancePath: instancePath + "/payload",
                schemaPath:
                  "/properties/payload/mapping/createAndSelect/properties/preferences",
                keyword: "properties",
                params: { error: "missing", missingProperty: "preferences" },
                message: "must have property 'preferences'",
              };
              if (vErrors === null) {
                vErrors = [err92];
              } else {
                vErrors.push(err92);
              }
              errors++;
            }
            if (data12.departure !== undefined) {
              let data39 = data12.departure;
              let valid54 = false;
              if (
                data39 &&
                typeof data39 == "object" &&
                !Array.isArray(data39)
              ) {
                valid54 = true;
                if (data39.courses !== undefined) {
                  let data40 = data39.courses;
                  let valid56 = false;
                  if (!valid56) {
                    if (Array.isArray(data40)) {
                      let valid58 = true;
                      const len0 = data40.length;
                      for (let i0 = 0; i0 < len0; i0++) {
                        let data41 = data40[i0];
                        const _errs46 = errors;
                        let valid59 = false;
                        if (
                          data41 &&
                          typeof data41 == "object" &&
                          !Array.isArray(data41)
                        ) {
                          valid59 = true;
                          if (data41.courseId !== undefined) {
                            if (!(typeof data41.courseId == "string")) {
                              const err93 = {
                                instancePath:
                                  instancePath +
                                  "/payload/departure/courses/" +
                                  i0 +
                                  "/courseId",
                                schemaPath:
                                  "/properties/payload/mapping/createAndSelect/properties/departure/properties/courses/elements/properties/courseId/type",
                                keyword: "type",
                                params: { type: "string", nullable: false },
                                message: "must be string",
                              };
                              if (vErrors === null) {
                                vErrors = [err93];
                              } else {
                                vErrors.push(err93);
                              }
                              errors++;
                            }
                          } else {
                            const err94 = {
                              instancePath:
                                instancePath +
                                "/payload/departure/courses/" +
                                i0,
                              schemaPath:
                                "/properties/payload/mapping/createAndSelect/properties/departure/properties/courses/elements/properties/courseId",
                              keyword: "properties",
                              params: {
                                error: "missing",
                                missingProperty: "courseId",
                              },
                              message: "must have property 'courseId'",
                            };
                            if (vErrors === null) {
                              vErrors = [err94];
                            } else {
                              vErrors.push(err94);
                            }
                            errors++;
                          }
                          if (data41.witness !== undefined) {
                            let data43 = data41.witness;
                            let valid61 = false;
                            if (
                              data43 &&
                              typeof data43 == "object" &&
                              !Array.isArray(data43)
                            ) {
                              valid61 = true;
                              if (data43.owner !== undefined) {
                                let data44 = data43.owner;
                                let valid63 = false;
                                if (
                                  data44 &&
                                  typeof data44 == "object" &&
                                  !Array.isArray(data44)
                                ) {
                                  valid63 = true;
                                  if (data44.profileId !== undefined) {
                                    if (
                                      !(typeof data44.profileId == "string")
                                    ) {
                                      const err95 = {
                                        instancePath:
                                          instancePath +
                                          "/payload/departure/courses/" +
                                          i0 +
                                          "/witness/owner/profileId",
                                        schemaPath:
                                          "/properties/payload/mapping/createAndSelect/properties/departure/properties/courses/elements/properties/witness/properties/owner/properties/profileId/type",
                                        keyword: "type",
                                        params: {
                                          type: "string",
                                          nullable: false,
                                        },
                                        message: "must be string",
                                      };
                                      if (vErrors === null) {
                                        vErrors = [err95];
                                      } else {
                                        vErrors.push(err95);
                                      }
                                      errors++;
                                    }
                                  } else {
                                    const err96 = {
                                      instancePath:
                                        instancePath +
                                        "/payload/departure/courses/" +
                                        i0 +
                                        "/witness/owner",
                                      schemaPath:
                                        "/properties/payload/mapping/createAndSelect/properties/departure/properties/courses/elements/properties/witness/properties/owner/properties/profileId",
                                      keyword: "properties",
                                      params: {
                                        error: "missing",
                                        missingProperty: "profileId",
                                      },
                                      message: "must have property 'profileId'",
                                    };
                                    if (vErrors === null) {
                                      vErrors = [err96];
                                    } else {
                                      vErrors.push(err96);
                                    }
                                    errors++;
                                  }
                                  if (data44.generation !== undefined) {
                                    if (
                                      !(typeof data44.generation == "string")
                                    ) {
                                      const err97 = {
                                        instancePath:
                                          instancePath +
                                          "/payload/departure/courses/" +
                                          i0 +
                                          "/witness/owner/generation",
                                        schemaPath:
                                          "/properties/payload/mapping/createAndSelect/properties/departure/properties/courses/elements/properties/witness/properties/owner/properties/generation/type",
                                        keyword: "type",
                                        params: {
                                          type: "string",
                                          nullable: false,
                                        },
                                        message: "must be string",
                                      };
                                      if (vErrors === null) {
                                        vErrors = [err97];
                                      } else {
                                        vErrors.push(err97);
                                      }
                                      errors++;
                                    }
                                  } else {
                                    const err98 = {
                                      instancePath:
                                        instancePath +
                                        "/payload/departure/courses/" +
                                        i0 +
                                        "/witness/owner",
                                      schemaPath:
                                        "/properties/payload/mapping/createAndSelect/properties/departure/properties/courses/elements/properties/witness/properties/owner/properties/generation",
                                      keyword: "properties",
                                      params: {
                                        error: "missing",
                                        missingProperty: "generation",
                                      },
                                      message:
                                        "must have property 'generation'",
                                    };
                                    if (vErrors === null) {
                                      vErrors = [err98];
                                    } else {
                                      vErrors.push(err98);
                                    }
                                    errors++;
                                  }
                                  for (const key15 in data44) {
                                    if (
                                      key15 !== "profileId" &&
                                      key15 !== "generation"
                                    ) {
                                      const err99 = {
                                        instancePath:
                                          instancePath +
                                          "/payload/departure/courses/" +
                                          i0 +
                                          "/witness/owner/" +
                                          key15
                                            .replace(/~/g, "~0")
                                            .replace(/\//g, "~1"),
                                        schemaPath:
                                          "/properties/payload/mapping/createAndSelect/properties/departure/properties/courses/elements/properties/witness/properties/owner",
                                        keyword: "properties",
                                        params: {
                                          error: "additional",
                                          additionalProperty: key15,
                                        },
                                        message:
                                          "must NOT have additional properties",
                                      };
                                      if (vErrors === null) {
                                        vErrors = [err99];
                                      } else {
                                        vErrors.push(err99);
                                      }
                                      errors++;
                                    }
                                  }
                                }
                                if (!valid63) {
                                  const err100 = {
                                    instancePath:
                                      instancePath +
                                      "/payload/departure/courses/" +
                                      i0 +
                                      "/witness/owner",
                                    schemaPath:
                                      "/properties/payload/mapping/createAndSelect/properties/departure/properties/courses/elements/properties/witness/properties/owner/properties",
                                    keyword: "properties",
                                    params: { type: "object", nullable: false },
                                    message: "must be object",
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err100];
                                  } else {
                                    vErrors.push(err100);
                                  }
                                  errors++;
                                }
                              } else {
                                const err101 = {
                                  instancePath:
                                    instancePath +
                                    "/payload/departure/courses/" +
                                    i0 +
                                    "/witness",
                                  schemaPath:
                                    "/properties/payload/mapping/createAndSelect/properties/departure/properties/courses/elements/properties/witness/properties/owner",
                                  keyword: "properties",
                                  params: {
                                    error: "missing",
                                    missingProperty: "owner",
                                  },
                                  message: "must have property 'owner'",
                                };
                                if (vErrors === null) {
                                  vErrors = [err101];
                                } else {
                                  vErrors.push(err101);
                                }
                                errors++;
                              }
                              if (data43.profileRevision !== undefined) {
                                if (
                                  !(typeof data43.profileRevision == "string")
                                ) {
                                  const err102 = {
                                    instancePath:
                                      instancePath +
                                      "/payload/departure/courses/" +
                                      i0 +
                                      "/witness/profileRevision",
                                    schemaPath:
                                      "/properties/payload/mapping/createAndSelect/properties/departure/properties/courses/elements/properties/witness/properties/profileRevision/type",
                                    keyword: "type",
                                    params: { type: "string", nullable: false },
                                    message: "must be string",
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err102];
                                  } else {
                                    vErrors.push(err102);
                                  }
                                  errors++;
                                }
                              } else {
                                const err103 = {
                                  instancePath:
                                    instancePath +
                                    "/payload/departure/courses/" +
                                    i0 +
                                    "/witness",
                                  schemaPath:
                                    "/properties/payload/mapping/createAndSelect/properties/departure/properties/courses/elements/properties/witness/properties/profileRevision",
                                  keyword: "properties",
                                  params: {
                                    error: "missing",
                                    missingProperty: "profileRevision",
                                  },
                                  message:
                                    "must have property 'profileRevision'",
                                };
                                if (vErrors === null) {
                                  vErrors = [err103];
                                } else {
                                  vErrors.push(err103);
                                }
                                errors++;
                              }
                              if (data43.activePackageHash !== undefined) {
                                if (
                                  !(typeof data43.activePackageHash == "string")
                                ) {
                                  const err104 = {
                                    instancePath:
                                      instancePath +
                                      "/payload/departure/courses/" +
                                      i0 +
                                      "/witness/activePackageHash",
                                    schemaPath:
                                      "/properties/payload/mapping/createAndSelect/properties/departure/properties/courses/elements/properties/witness/properties/activePackageHash/type",
                                    keyword: "type",
                                    params: { type: "string", nullable: false },
                                    message: "must be string",
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err104];
                                  } else {
                                    vErrors.push(err104);
                                  }
                                  errors++;
                                }
                              } else {
                                const err105 = {
                                  instancePath:
                                    instancePath +
                                    "/payload/departure/courses/" +
                                    i0 +
                                    "/witness",
                                  schemaPath:
                                    "/properties/payload/mapping/createAndSelect/properties/departure/properties/courses/elements/properties/witness/properties/activePackageHash",
                                  keyword: "properties",
                                  params: {
                                    error: "missing",
                                    missingProperty: "activePackageHash",
                                  },
                                  message:
                                    "must have property 'activePackageHash'",
                                };
                                if (vErrors === null) {
                                  vErrors = [err105];
                                } else {
                                  vErrors.push(err105);
                                }
                                errors++;
                              }
                              if (data43.activationRevision !== undefined) {
                                if (
                                  !(
                                    typeof data43.activationRevision == "string"
                                  )
                                ) {
                                  const err106 = {
                                    instancePath:
                                      instancePath +
                                      "/payload/departure/courses/" +
                                      i0 +
                                      "/witness/activationRevision",
                                    schemaPath:
                                      "/properties/payload/mapping/createAndSelect/properties/departure/properties/courses/elements/properties/witness/properties/activationRevision/type",
                                    keyword: "type",
                                    params: { type: "string", nullable: false },
                                    message: "must be string",
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err106];
                                  } else {
                                    vErrors.push(err106);
                                  }
                                  errors++;
                                }
                              } else {
                                const err107 = {
                                  instancePath:
                                    instancePath +
                                    "/payload/departure/courses/" +
                                    i0 +
                                    "/witness",
                                  schemaPath:
                                    "/properties/payload/mapping/createAndSelect/properties/departure/properties/courses/elements/properties/witness/properties/activationRevision",
                                  keyword: "properties",
                                  params: {
                                    error: "missing",
                                    missingProperty: "activationRevision",
                                  },
                                  message:
                                    "must have property 'activationRevision'",
                                };
                                if (vErrors === null) {
                                  vErrors = [err107];
                                } else {
                                  vErrors.push(err107);
                                }
                                errors++;
                              }
                              if (data43.cursorRevision !== undefined) {
                                if (
                                  !(typeof data43.cursorRevision == "string")
                                ) {
                                  const err108 = {
                                    instancePath:
                                      instancePath +
                                      "/payload/departure/courses/" +
                                      i0 +
                                      "/witness/cursorRevision",
                                    schemaPath:
                                      "/properties/payload/mapping/createAndSelect/properties/departure/properties/courses/elements/properties/witness/properties/cursorRevision/type",
                                    keyword: "type",
                                    params: { type: "string", nullable: false },
                                    message: "must be string",
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err108];
                                  } else {
                                    vErrors.push(err108);
                                  }
                                  errors++;
                                }
                              } else {
                                const err109 = {
                                  instancePath:
                                    instancePath +
                                    "/payload/departure/courses/" +
                                    i0 +
                                    "/witness",
                                  schemaPath:
                                    "/properties/payload/mapping/createAndSelect/properties/departure/properties/courses/elements/properties/witness/properties/cursorRevision",
                                  keyword: "properties",
                                  params: {
                                    error: "missing",
                                    missingProperty: "cursorRevision",
                                  },
                                  message:
                                    "must have property 'cursorRevision'",
                                };
                                if (vErrors === null) {
                                  vErrors = [err109];
                                } else {
                                  vErrors.push(err109);
                                }
                                errors++;
                              }
                              if (
                                data43.selectedSessionRevision !== undefined
                              ) {
                                let data51 = data43.selectedSessionRevision;
                                if (!(
                                  data51 === null || typeof data51 == "string"
                                )) {
                                  const err110 = {
                                    instancePath:
                                      instancePath +
                                      "/payload/departure/courses/" +
                                      i0 +
                                      "/witness/selectedSessionRevision",
                                    schemaPath:
                                      "/properties/payload/mapping/createAndSelect/properties/departure/properties/courses/elements/properties/witness/properties/selectedSessionRevision/type",
                                    keyword: "type",
                                    params: { type: "string", nullable: true },
                                    message: "must be string or null",
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err110];
                                  } else {
                                    vErrors.push(err110);
                                  }
                                  errors++;
                                }
                              } else {
                                const err111 = {
                                  instancePath:
                                    instancePath +
                                    "/payload/departure/courses/" +
                                    i0 +
                                    "/witness",
                                  schemaPath:
                                    "/properties/payload/mapping/createAndSelect/properties/departure/properties/courses/elements/properties/witness/properties/selectedSessionRevision",
                                  keyword: "properties",
                                  params: {
                                    error: "missing",
                                    missingProperty: "selectedSessionRevision",
                                  },
                                  message:
                                    "must have property 'selectedSessionRevision'",
                                };
                                if (vErrors === null) {
                                  vErrors = [err111];
                                } else {
                                  vErrors.push(err111);
                                }
                                errors++;
                              }
                              for (const key16 in data43) {
                                if (
                                  key16 !== "owner" &&
                                  key16 !== "profileRevision" &&
                                  key16 !== "activePackageHash" &&
                                  key16 !== "activationRevision" &&
                                  key16 !== "cursorRevision" &&
                                  key16 !== "selectedSessionRevision"
                                ) {
                                  const err112 = {
                                    instancePath:
                                      instancePath +
                                      "/payload/departure/courses/" +
                                      i0 +
                                      "/witness/" +
                                      key16
                                        .replace(/~/g, "~0")
                                        .replace(/\//g, "~1"),
                                    schemaPath:
                                      "/properties/payload/mapping/createAndSelect/properties/departure/properties/courses/elements/properties/witness",
                                    keyword: "properties",
                                    params: {
                                      error: "additional",
                                      additionalProperty: key16,
                                    },
                                    message:
                                      "must NOT have additional properties",
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err112];
                                  } else {
                                    vErrors.push(err112);
                                  }
                                  errors++;
                                }
                              }
                            }
                            if (!valid61) {
                              const err113 = {
                                instancePath:
                                  instancePath +
                                  "/payload/departure/courses/" +
                                  i0 +
                                  "/witness",
                                schemaPath:
                                  "/properties/payload/mapping/createAndSelect/properties/departure/properties/courses/elements/properties/witness/properties",
                                keyword: "properties",
                                params: { type: "object", nullable: false },
                                message: "must be object",
                              };
                              if (vErrors === null) {
                                vErrors = [err113];
                              } else {
                                vErrors.push(err113);
                              }
                              errors++;
                            }
                          } else {
                            const err114 = {
                              instancePath:
                                instancePath +
                                "/payload/departure/courses/" +
                                i0,
                              schemaPath:
                                "/properties/payload/mapping/createAndSelect/properties/departure/properties/courses/elements/properties/witness",
                              keyword: "properties",
                              params: {
                                error: "missing",
                                missingProperty: "witness",
                              },
                              message: "must have property 'witness'",
                            };
                            if (vErrors === null) {
                              vErrors = [err114];
                            } else {
                              vErrors.push(err114);
                            }
                            errors++;
                          }
                          if (data41.documents !== undefined) {
                          } else {
                            const err115 = {
                              instancePath:
                                instancePath +
                                "/payload/departure/courses/" +
                                i0,
                              schemaPath:
                                "/properties/payload/mapping/createAndSelect/properties/departure/properties/courses/elements/properties/documents",
                              keyword: "properties",
                              params: {
                                error: "missing",
                                missingProperty: "documents",
                              },
                              message: "must have property 'documents'",
                            };
                            if (vErrors === null) {
                              vErrors = [err115];
                            } else {
                              vErrors.push(err115);
                            }
                            errors++;
                          }
                          for (const key17 in data41) {
                            if (
                              key17 !== "courseId" &&
                              key17 !== "witness" &&
                              key17 !== "documents"
                            ) {
                              const err116 = {
                                instancePath:
                                  instancePath +
                                  "/payload/departure/courses/" +
                                  i0 +
                                  "/" +
                                  key17
                                    .replace(/~/g, "~0")
                                    .replace(/\//g, "~1"),
                                schemaPath:
                                  "/properties/payload/mapping/createAndSelect/properties/departure/properties/courses/elements",
                                keyword: "properties",
                                params: {
                                  error: "additional",
                                  additionalProperty: key17,
                                },
                                message: "must NOT have additional properties",
                              };
                              if (vErrors === null) {
                                vErrors = [err116];
                              } else {
                                vErrors.push(err116);
                              }
                              errors++;
                            }
                          }
                        }
                        if (!valid59) {
                          const err117 = {
                            instancePath:
                              instancePath + "/payload/departure/courses/" + i0,
                            schemaPath:
                              "/properties/payload/mapping/createAndSelect/properties/departure/properties/courses/elements/properties",
                            keyword: "properties",
                            params: { type: "object", nullable: false },
                            message: "must be object",
                          };
                          if (vErrors === null) {
                            vErrors = [err117];
                          } else {
                            vErrors.push(err117);
                          }
                          errors++;
                        }
                        var valid57 = _errs46 === errors;
                        if (!valid57) {
                          valid58 = false;
                        }
                      }
                      valid56 = valid58;
                    } else {
                      const err118 = {
                        instancePath:
                          instancePath + "/payload/departure/courses",
                        schemaPath:
                          "/properties/payload/mapping/createAndSelect/properties/departure/properties/courses/elements",
                        keyword: "elements",
                        params: { type: "array", nullable: false },
                        message: "must be array",
                      };
                      if (vErrors === null) {
                        vErrors = [err118];
                      } else {
                        vErrors.push(err118);
                      }
                      errors++;
                    }
                  }
                } else {
                  const err119 = {
                    instancePath: instancePath + "/payload/departure",
                    schemaPath:
                      "/properties/payload/mapping/createAndSelect/properties/departure/properties/courses",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "courses" },
                    message: "must have property 'courses'",
                  };
                  if (vErrors === null) {
                    vErrors = [err119];
                  } else {
                    vErrors.push(err119);
                  }
                  errors++;
                }
                for (const key18 in data39) {
                  if (key18 !== "courses") {
                    const err120 = {
                      instancePath:
                        instancePath +
                        "/payload/departure/" +
                        key18.replace(/~/g, "~0").replace(/\//g, "~1"),
                      schemaPath:
                        "/properties/payload/mapping/createAndSelect/properties/departure",
                      keyword: "properties",
                      params: {
                        error: "additional",
                        additionalProperty: key18,
                      },
                      message: "must NOT have additional properties",
                    };
                    if (vErrors === null) {
                      vErrors = [err120];
                    } else {
                      vErrors.push(err120);
                    }
                    errors++;
                  }
                }
              }
              if (!valid54) {
                const err121 = {
                  instancePath: instancePath + "/payload/departure",
                  schemaPath:
                    "/properties/payload/mapping/createAndSelect/properties/departure/properties",
                  keyword: "properties",
                  params: { type: "object", nullable: false },
                  message: "must be object",
                };
                if (vErrors === null) {
                  vErrors = [err121];
                } else {
                  vErrors.push(err121);
                }
                errors++;
              }
            } else {
              const err122 = {
                instancePath: instancePath + "/payload",
                schemaPath:
                  "/properties/payload/mapping/createAndSelect/properties/departure",
                keyword: "properties",
                params: { error: "missing", missingProperty: "departure" },
                message: "must have property 'departure'",
              };
              if (vErrors === null) {
                vErrors = [err122];
              } else {
                vErrors.push(err122);
              }
              errors++;
            }
            for (const key19 in data12) {
              if (
                key19 !== "kind" &&
                key19 !== "owner" &&
                key19 !== "preferences" &&
                key19 !== "departure"
              ) {
                const err123 = {
                  instancePath:
                    instancePath +
                    "/payload/" +
                    key19.replace(/~/g, "~0").replace(/\//g, "~1"),
                  schemaPath: "/properties/payload/mapping/createAndSelect",
                  keyword: "properties",
                  params: { error: "additional", additionalProperty: key19 },
                  message: "must NOT have additional properties",
                };
                if (vErrors === null) {
                  vErrors = [err123];
                } else {
                  vErrors.push(err123);
                }
                errors++;
              }
            }
            if (!valid46) {
              const err124 = {
                instancePath: instancePath + "/payload",
                schemaPath:
                  "/properties/payload/mapping/createAndSelect/properties",
                keyword: "properties",
                params: { type: "object", nullable: false },
                message: "must be object",
              };
              if (vErrors === null) {
                vErrors = [err124];
              } else {
                vErrors.push(err124);
              }
              errors++;
            }
            var valid45 = _errs37 === errors;
            valid11 = valid45;
          } else if (tag0 === "selectProfile") {
            const _errs59 = errors;
            let valid71 = false;
            valid71 = true;
            if (data12.target !== undefined) {
              let data53 = data12.target;
              let valid73 = false;
              if (
                data53 &&
                typeof data53 == "object" &&
                !Array.isArray(data53)
              ) {
                valid73 = true;
                if (data53.profileId !== undefined) {
                  if (!(typeof data53.profileId == "string")) {
                    const err125 = {
                      instancePath: instancePath + "/payload/target/profileId",
                      schemaPath:
                        "/properties/payload/mapping/selectProfile/properties/target/properties/profileId/type",
                      keyword: "type",
                      params: { type: "string", nullable: false },
                      message: "must be string",
                    };
                    if (vErrors === null) {
                      vErrors = [err125];
                    } else {
                      vErrors.push(err125);
                    }
                    errors++;
                  }
                } else {
                  const err126 = {
                    instancePath: instancePath + "/payload/target",
                    schemaPath:
                      "/properties/payload/mapping/selectProfile/properties/target/properties/profileId",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "profileId" },
                    message: "must have property 'profileId'",
                  };
                  if (vErrors === null) {
                    vErrors = [err126];
                  } else {
                    vErrors.push(err126);
                  }
                  errors++;
                }
                if (data53.generation !== undefined) {
                  if (!(typeof data53.generation == "string")) {
                    const err127 = {
                      instancePath: instancePath + "/payload/target/generation",
                      schemaPath:
                        "/properties/payload/mapping/selectProfile/properties/target/properties/generation/type",
                      keyword: "type",
                      params: { type: "string", nullable: false },
                      message: "must be string",
                    };
                    if (vErrors === null) {
                      vErrors = [err127];
                    } else {
                      vErrors.push(err127);
                    }
                    errors++;
                  }
                } else {
                  const err128 = {
                    instancePath: instancePath + "/payload/target",
                    schemaPath:
                      "/properties/payload/mapping/selectProfile/properties/target/properties/generation",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "generation" },
                    message: "must have property 'generation'",
                  };
                  if (vErrors === null) {
                    vErrors = [err128];
                  } else {
                    vErrors.push(err128);
                  }
                  errors++;
                }
                for (const key20 in data53) {
                  if (key20 !== "profileId" && key20 !== "generation") {
                    const err129 = {
                      instancePath:
                        instancePath +
                        "/payload/target/" +
                        key20.replace(/~/g, "~0").replace(/\//g, "~1"),
                      schemaPath:
                        "/properties/payload/mapping/selectProfile/properties/target",
                      keyword: "properties",
                      params: {
                        error: "additional",
                        additionalProperty: key20,
                      },
                      message: "must NOT have additional properties",
                    };
                    if (vErrors === null) {
                      vErrors = [err129];
                    } else {
                      vErrors.push(err129);
                    }
                    errors++;
                  }
                }
              }
              if (!valid73) {
                const err130 = {
                  instancePath: instancePath + "/payload/target",
                  schemaPath:
                    "/properties/payload/mapping/selectProfile/properties/target/properties",
                  keyword: "properties",
                  params: { type: "object", nullable: false },
                  message: "must be object",
                };
                if (vErrors === null) {
                  vErrors = [err130];
                } else {
                  vErrors.push(err130);
                }
                errors++;
              }
            } else {
              const err131 = {
                instancePath: instancePath + "/payload",
                schemaPath:
                  "/properties/payload/mapping/selectProfile/properties/target",
                keyword: "properties",
                params: { error: "missing", missingProperty: "target" },
                message: "must have property 'target'",
              };
              if (vErrors === null) {
                vErrors = [err131];
              } else {
                vErrors.push(err131);
              }
              errors++;
            }
            if (data12.departure !== undefined) {
              let data56 = data12.departure;
              let valid76 = false;
              if (
                data56 &&
                typeof data56 == "object" &&
                !Array.isArray(data56)
              ) {
                valid76 = true;
                if (data56.courses !== undefined) {
                  let data57 = data56.courses;
                  let valid78 = false;
                  if (!valid78) {
                    if (Array.isArray(data57)) {
                      let valid80 = true;
                      const len1 = data57.length;
                      for (let i1 = 0; i1 < len1; i1++) {
                        let data58 = data57[i1];
                        const _errs65 = errors;
                        let valid81 = false;
                        if (
                          data58 &&
                          typeof data58 == "object" &&
                          !Array.isArray(data58)
                        ) {
                          valid81 = true;
                          if (data58.courseId !== undefined) {
                            if (!(typeof data58.courseId == "string")) {
                              const err132 = {
                                instancePath:
                                  instancePath +
                                  "/payload/departure/courses/" +
                                  i1 +
                                  "/courseId",
                                schemaPath:
                                  "/properties/payload/mapping/selectProfile/properties/departure/properties/courses/elements/properties/courseId/type",
                                keyword: "type",
                                params: { type: "string", nullable: false },
                                message: "must be string",
                              };
                              if (vErrors === null) {
                                vErrors = [err132];
                              } else {
                                vErrors.push(err132);
                              }
                              errors++;
                            }
                          } else {
                            const err133 = {
                              instancePath:
                                instancePath +
                                "/payload/departure/courses/" +
                                i1,
                              schemaPath:
                                "/properties/payload/mapping/selectProfile/properties/departure/properties/courses/elements/properties/courseId",
                              keyword: "properties",
                              params: {
                                error: "missing",
                                missingProperty: "courseId",
                              },
                              message: "must have property 'courseId'",
                            };
                            if (vErrors === null) {
                              vErrors = [err133];
                            } else {
                              vErrors.push(err133);
                            }
                            errors++;
                          }
                          if (data58.witness !== undefined) {
                            let data60 = data58.witness;
                            let valid83 = false;
                            if (
                              data60 &&
                              typeof data60 == "object" &&
                              !Array.isArray(data60)
                            ) {
                              valid83 = true;
                              if (data60.owner !== undefined) {
                                let data61 = data60.owner;
                                let valid85 = false;
                                if (
                                  data61 &&
                                  typeof data61 == "object" &&
                                  !Array.isArray(data61)
                                ) {
                                  valid85 = true;
                                  if (data61.profileId !== undefined) {
                                    if (
                                      !(typeof data61.profileId == "string")
                                    ) {
                                      const err134 = {
                                        instancePath:
                                          instancePath +
                                          "/payload/departure/courses/" +
                                          i1 +
                                          "/witness/owner/profileId",
                                        schemaPath:
                                          "/properties/payload/mapping/selectProfile/properties/departure/properties/courses/elements/properties/witness/properties/owner/properties/profileId/type",
                                        keyword: "type",
                                        params: {
                                          type: "string",
                                          nullable: false,
                                        },
                                        message: "must be string",
                                      };
                                      if (vErrors === null) {
                                        vErrors = [err134];
                                      } else {
                                        vErrors.push(err134);
                                      }
                                      errors++;
                                    }
                                  } else {
                                    const err135 = {
                                      instancePath:
                                        instancePath +
                                        "/payload/departure/courses/" +
                                        i1 +
                                        "/witness/owner",
                                      schemaPath:
                                        "/properties/payload/mapping/selectProfile/properties/departure/properties/courses/elements/properties/witness/properties/owner/properties/profileId",
                                      keyword: "properties",
                                      params: {
                                        error: "missing",
                                        missingProperty: "profileId",
                                      },
                                      message: "must have property 'profileId'",
                                    };
                                    if (vErrors === null) {
                                      vErrors = [err135];
                                    } else {
                                      vErrors.push(err135);
                                    }
                                    errors++;
                                  }
                                  if (data61.generation !== undefined) {
                                    if (
                                      !(typeof data61.generation == "string")
                                    ) {
                                      const err136 = {
                                        instancePath:
                                          instancePath +
                                          "/payload/departure/courses/" +
                                          i1 +
                                          "/witness/owner/generation",
                                        schemaPath:
                                          "/properties/payload/mapping/selectProfile/properties/departure/properties/courses/elements/properties/witness/properties/owner/properties/generation/type",
                                        keyword: "type",
                                        params: {
                                          type: "string",
                                          nullable: false,
                                        },
                                        message: "must be string",
                                      };
                                      if (vErrors === null) {
                                        vErrors = [err136];
                                      } else {
                                        vErrors.push(err136);
                                      }
                                      errors++;
                                    }
                                  } else {
                                    const err137 = {
                                      instancePath:
                                        instancePath +
                                        "/payload/departure/courses/" +
                                        i1 +
                                        "/witness/owner",
                                      schemaPath:
                                        "/properties/payload/mapping/selectProfile/properties/departure/properties/courses/elements/properties/witness/properties/owner/properties/generation",
                                      keyword: "properties",
                                      params: {
                                        error: "missing",
                                        missingProperty: "generation",
                                      },
                                      message:
                                        "must have property 'generation'",
                                    };
                                    if (vErrors === null) {
                                      vErrors = [err137];
                                    } else {
                                      vErrors.push(err137);
                                    }
                                    errors++;
                                  }
                                  for (const key21 in data61) {
                                    if (
                                      key21 !== "profileId" &&
                                      key21 !== "generation"
                                    ) {
                                      const err138 = {
                                        instancePath:
                                          instancePath +
                                          "/payload/departure/courses/" +
                                          i1 +
                                          "/witness/owner/" +
                                          key21
                                            .replace(/~/g, "~0")
                                            .replace(/\//g, "~1"),
                                        schemaPath:
                                          "/properties/payload/mapping/selectProfile/properties/departure/properties/courses/elements/properties/witness/properties/owner",
                                        keyword: "properties",
                                        params: {
                                          error: "additional",
                                          additionalProperty: key21,
                                        },
                                        message:
                                          "must NOT have additional properties",
                                      };
                                      if (vErrors === null) {
                                        vErrors = [err138];
                                      } else {
                                        vErrors.push(err138);
                                      }
                                      errors++;
                                    }
                                  }
                                }
                                if (!valid85) {
                                  const err139 = {
                                    instancePath:
                                      instancePath +
                                      "/payload/departure/courses/" +
                                      i1 +
                                      "/witness/owner",
                                    schemaPath:
                                      "/properties/payload/mapping/selectProfile/properties/departure/properties/courses/elements/properties/witness/properties/owner/properties",
                                    keyword: "properties",
                                    params: { type: "object", nullable: false },
                                    message: "must be object",
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err139];
                                  } else {
                                    vErrors.push(err139);
                                  }
                                  errors++;
                                }
                              } else {
                                const err140 = {
                                  instancePath:
                                    instancePath +
                                    "/payload/departure/courses/" +
                                    i1 +
                                    "/witness",
                                  schemaPath:
                                    "/properties/payload/mapping/selectProfile/properties/departure/properties/courses/elements/properties/witness/properties/owner",
                                  keyword: "properties",
                                  params: {
                                    error: "missing",
                                    missingProperty: "owner",
                                  },
                                  message: "must have property 'owner'",
                                };
                                if (vErrors === null) {
                                  vErrors = [err140];
                                } else {
                                  vErrors.push(err140);
                                }
                                errors++;
                              }
                              if (data60.profileRevision !== undefined) {
                                if (
                                  !(typeof data60.profileRevision == "string")
                                ) {
                                  const err141 = {
                                    instancePath:
                                      instancePath +
                                      "/payload/departure/courses/" +
                                      i1 +
                                      "/witness/profileRevision",
                                    schemaPath:
                                      "/properties/payload/mapping/selectProfile/properties/departure/properties/courses/elements/properties/witness/properties/profileRevision/type",
                                    keyword: "type",
                                    params: { type: "string", nullable: false },
                                    message: "must be string",
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err141];
                                  } else {
                                    vErrors.push(err141);
                                  }
                                  errors++;
                                }
                              } else {
                                const err142 = {
                                  instancePath:
                                    instancePath +
                                    "/payload/departure/courses/" +
                                    i1 +
                                    "/witness",
                                  schemaPath:
                                    "/properties/payload/mapping/selectProfile/properties/departure/properties/courses/elements/properties/witness/properties/profileRevision",
                                  keyword: "properties",
                                  params: {
                                    error: "missing",
                                    missingProperty: "profileRevision",
                                  },
                                  message:
                                    "must have property 'profileRevision'",
                                };
                                if (vErrors === null) {
                                  vErrors = [err142];
                                } else {
                                  vErrors.push(err142);
                                }
                                errors++;
                              }
                              if (data60.activePackageHash !== undefined) {
                                if (
                                  !(typeof data60.activePackageHash == "string")
                                ) {
                                  const err143 = {
                                    instancePath:
                                      instancePath +
                                      "/payload/departure/courses/" +
                                      i1 +
                                      "/witness/activePackageHash",
                                    schemaPath:
                                      "/properties/payload/mapping/selectProfile/properties/departure/properties/courses/elements/properties/witness/properties/activePackageHash/type",
                                    keyword: "type",
                                    params: { type: "string", nullable: false },
                                    message: "must be string",
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err143];
                                  } else {
                                    vErrors.push(err143);
                                  }
                                  errors++;
                                }
                              } else {
                                const err144 = {
                                  instancePath:
                                    instancePath +
                                    "/payload/departure/courses/" +
                                    i1 +
                                    "/witness",
                                  schemaPath:
                                    "/properties/payload/mapping/selectProfile/properties/departure/properties/courses/elements/properties/witness/properties/activePackageHash",
                                  keyword: "properties",
                                  params: {
                                    error: "missing",
                                    missingProperty: "activePackageHash",
                                  },
                                  message:
                                    "must have property 'activePackageHash'",
                                };
                                if (vErrors === null) {
                                  vErrors = [err144];
                                } else {
                                  vErrors.push(err144);
                                }
                                errors++;
                              }
                              if (data60.activationRevision !== undefined) {
                                if (
                                  !(
                                    typeof data60.activationRevision == "string"
                                  )
                                ) {
                                  const err145 = {
                                    instancePath:
                                      instancePath +
                                      "/payload/departure/courses/" +
                                      i1 +
                                      "/witness/activationRevision",
                                    schemaPath:
                                      "/properties/payload/mapping/selectProfile/properties/departure/properties/courses/elements/properties/witness/properties/activationRevision/type",
                                    keyword: "type",
                                    params: { type: "string", nullable: false },
                                    message: "must be string",
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err145];
                                  } else {
                                    vErrors.push(err145);
                                  }
                                  errors++;
                                }
                              } else {
                                const err146 = {
                                  instancePath:
                                    instancePath +
                                    "/payload/departure/courses/" +
                                    i1 +
                                    "/witness",
                                  schemaPath:
                                    "/properties/payload/mapping/selectProfile/properties/departure/properties/courses/elements/properties/witness/properties/activationRevision",
                                  keyword: "properties",
                                  params: {
                                    error: "missing",
                                    missingProperty: "activationRevision",
                                  },
                                  message:
                                    "must have property 'activationRevision'",
                                };
                                if (vErrors === null) {
                                  vErrors = [err146];
                                } else {
                                  vErrors.push(err146);
                                }
                                errors++;
                              }
                              if (data60.cursorRevision !== undefined) {
                                if (
                                  !(typeof data60.cursorRevision == "string")
                                ) {
                                  const err147 = {
                                    instancePath:
                                      instancePath +
                                      "/payload/departure/courses/" +
                                      i1 +
                                      "/witness/cursorRevision",
                                    schemaPath:
                                      "/properties/payload/mapping/selectProfile/properties/departure/properties/courses/elements/properties/witness/properties/cursorRevision/type",
                                    keyword: "type",
                                    params: { type: "string", nullable: false },
                                    message: "must be string",
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err147];
                                  } else {
                                    vErrors.push(err147);
                                  }
                                  errors++;
                                }
                              } else {
                                const err148 = {
                                  instancePath:
                                    instancePath +
                                    "/payload/departure/courses/" +
                                    i1 +
                                    "/witness",
                                  schemaPath:
                                    "/properties/payload/mapping/selectProfile/properties/departure/properties/courses/elements/properties/witness/properties/cursorRevision",
                                  keyword: "properties",
                                  params: {
                                    error: "missing",
                                    missingProperty: "cursorRevision",
                                  },
                                  message:
                                    "must have property 'cursorRevision'",
                                };
                                if (vErrors === null) {
                                  vErrors = [err148];
                                } else {
                                  vErrors.push(err148);
                                }
                                errors++;
                              }
                              if (
                                data60.selectedSessionRevision !== undefined
                              ) {
                                let data68 = data60.selectedSessionRevision;
                                if (!(
                                  data68 === null || typeof data68 == "string"
                                )) {
                                  const err149 = {
                                    instancePath:
                                      instancePath +
                                      "/payload/departure/courses/" +
                                      i1 +
                                      "/witness/selectedSessionRevision",
                                    schemaPath:
                                      "/properties/payload/mapping/selectProfile/properties/departure/properties/courses/elements/properties/witness/properties/selectedSessionRevision/type",
                                    keyword: "type",
                                    params: { type: "string", nullable: true },
                                    message: "must be string or null",
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err149];
                                  } else {
                                    vErrors.push(err149);
                                  }
                                  errors++;
                                }
                              } else {
                                const err150 = {
                                  instancePath:
                                    instancePath +
                                    "/payload/departure/courses/" +
                                    i1 +
                                    "/witness",
                                  schemaPath:
                                    "/properties/payload/mapping/selectProfile/properties/departure/properties/courses/elements/properties/witness/properties/selectedSessionRevision",
                                  keyword: "properties",
                                  params: {
                                    error: "missing",
                                    missingProperty: "selectedSessionRevision",
                                  },
                                  message:
                                    "must have property 'selectedSessionRevision'",
                                };
                                if (vErrors === null) {
                                  vErrors = [err150];
                                } else {
                                  vErrors.push(err150);
                                }
                                errors++;
                              }
                              for (const key22 in data60) {
                                if (
                                  key22 !== "owner" &&
                                  key22 !== "profileRevision" &&
                                  key22 !== "activePackageHash" &&
                                  key22 !== "activationRevision" &&
                                  key22 !== "cursorRevision" &&
                                  key22 !== "selectedSessionRevision"
                                ) {
                                  const err151 = {
                                    instancePath:
                                      instancePath +
                                      "/payload/departure/courses/" +
                                      i1 +
                                      "/witness/" +
                                      key22
                                        .replace(/~/g, "~0")
                                        .replace(/\//g, "~1"),
                                    schemaPath:
                                      "/properties/payload/mapping/selectProfile/properties/departure/properties/courses/elements/properties/witness",
                                    keyword: "properties",
                                    params: {
                                      error: "additional",
                                      additionalProperty: key22,
                                    },
                                    message:
                                      "must NOT have additional properties",
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err151];
                                  } else {
                                    vErrors.push(err151);
                                  }
                                  errors++;
                                }
                              }
                            }
                            if (!valid83) {
                              const err152 = {
                                instancePath:
                                  instancePath +
                                  "/payload/departure/courses/" +
                                  i1 +
                                  "/witness",
                                schemaPath:
                                  "/properties/payload/mapping/selectProfile/properties/departure/properties/courses/elements/properties/witness/properties",
                                keyword: "properties",
                                params: { type: "object", nullable: false },
                                message: "must be object",
                              };
                              if (vErrors === null) {
                                vErrors = [err152];
                              } else {
                                vErrors.push(err152);
                              }
                              errors++;
                            }
                          } else {
                            const err153 = {
                              instancePath:
                                instancePath +
                                "/payload/departure/courses/" +
                                i1,
                              schemaPath:
                                "/properties/payload/mapping/selectProfile/properties/departure/properties/courses/elements/properties/witness",
                              keyword: "properties",
                              params: {
                                error: "missing",
                                missingProperty: "witness",
                              },
                              message: "must have property 'witness'",
                            };
                            if (vErrors === null) {
                              vErrors = [err153];
                            } else {
                              vErrors.push(err153);
                            }
                            errors++;
                          }
                          if (data58.documents !== undefined) {
                          } else {
                            const err154 = {
                              instancePath:
                                instancePath +
                                "/payload/departure/courses/" +
                                i1,
                              schemaPath:
                                "/properties/payload/mapping/selectProfile/properties/departure/properties/courses/elements/properties/documents",
                              keyword: "properties",
                              params: {
                                error: "missing",
                                missingProperty: "documents",
                              },
                              message: "must have property 'documents'",
                            };
                            if (vErrors === null) {
                              vErrors = [err154];
                            } else {
                              vErrors.push(err154);
                            }
                            errors++;
                          }
                          for (const key23 in data58) {
                            if (
                              key23 !== "courseId" &&
                              key23 !== "witness" &&
                              key23 !== "documents"
                            ) {
                              const err155 = {
                                instancePath:
                                  instancePath +
                                  "/payload/departure/courses/" +
                                  i1 +
                                  "/" +
                                  key23
                                    .replace(/~/g, "~0")
                                    .replace(/\//g, "~1"),
                                schemaPath:
                                  "/properties/payload/mapping/selectProfile/properties/departure/properties/courses/elements",
                                keyword: "properties",
                                params: {
                                  error: "additional",
                                  additionalProperty: key23,
                                },
                                message: "must NOT have additional properties",
                              };
                              if (vErrors === null) {
                                vErrors = [err155];
                              } else {
                                vErrors.push(err155);
                              }
                              errors++;
                            }
                          }
                        }
                        if (!valid81) {
                          const err156 = {
                            instancePath:
                              instancePath + "/payload/departure/courses/" + i1,
                            schemaPath:
                              "/properties/payload/mapping/selectProfile/properties/departure/properties/courses/elements/properties",
                            keyword: "properties",
                            params: { type: "object", nullable: false },
                            message: "must be object",
                          };
                          if (vErrors === null) {
                            vErrors = [err156];
                          } else {
                            vErrors.push(err156);
                          }
                          errors++;
                        }
                        var valid79 = _errs65 === errors;
                        if (!valid79) {
                          valid80 = false;
                        }
                      }
                      valid78 = valid80;
                    } else {
                      const err157 = {
                        instancePath:
                          instancePath + "/payload/departure/courses",
                        schemaPath:
                          "/properties/payload/mapping/selectProfile/properties/departure/properties/courses/elements",
                        keyword: "elements",
                        params: { type: "array", nullable: false },
                        message: "must be array",
                      };
                      if (vErrors === null) {
                        vErrors = [err157];
                      } else {
                        vErrors.push(err157);
                      }
                      errors++;
                    }
                  }
                } else {
                  const err158 = {
                    instancePath: instancePath + "/payload/departure",
                    schemaPath:
                      "/properties/payload/mapping/selectProfile/properties/departure/properties/courses",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "courses" },
                    message: "must have property 'courses'",
                  };
                  if (vErrors === null) {
                    vErrors = [err158];
                  } else {
                    vErrors.push(err158);
                  }
                  errors++;
                }
                for (const key24 in data56) {
                  if (key24 !== "courses") {
                    const err159 = {
                      instancePath:
                        instancePath +
                        "/payload/departure/" +
                        key24.replace(/~/g, "~0").replace(/\//g, "~1"),
                      schemaPath:
                        "/properties/payload/mapping/selectProfile/properties/departure",
                      keyword: "properties",
                      params: {
                        error: "additional",
                        additionalProperty: key24,
                      },
                      message: "must NOT have additional properties",
                    };
                    if (vErrors === null) {
                      vErrors = [err159];
                    } else {
                      vErrors.push(err159);
                    }
                    errors++;
                  }
                }
              }
              if (!valid76) {
                const err160 = {
                  instancePath: instancePath + "/payload/departure",
                  schemaPath:
                    "/properties/payload/mapping/selectProfile/properties/departure/properties",
                  keyword: "properties",
                  params: { type: "object", nullable: false },
                  message: "must be object",
                };
                if (vErrors === null) {
                  vErrors = [err160];
                } else {
                  vErrors.push(err160);
                }
                errors++;
              }
            } else {
              const err161 = {
                instancePath: instancePath + "/payload",
                schemaPath:
                  "/properties/payload/mapping/selectProfile/properties/departure",
                keyword: "properties",
                params: { error: "missing", missingProperty: "departure" },
                message: "must have property 'departure'",
              };
              if (vErrors === null) {
                vErrors = [err161];
              } else {
                vErrors.push(err161);
              }
              errors++;
            }
            for (const key25 in data12) {
              if (
                key25 !== "kind" &&
                key25 !== "target" &&
                key25 !== "departure"
              ) {
                const err162 = {
                  instancePath:
                    instancePath +
                    "/payload/" +
                    key25.replace(/~/g, "~0").replace(/\//g, "~1"),
                  schemaPath: "/properties/payload/mapping/selectProfile",
                  keyword: "properties",
                  params: { error: "additional", additionalProperty: key25 },
                  message: "must NOT have additional properties",
                };
                if (vErrors === null) {
                  vErrors = [err162];
                } else {
                  vErrors.push(err162);
                }
                errors++;
              }
            }
            if (!valid71) {
              const err163 = {
                instancePath: instancePath + "/payload",
                schemaPath:
                  "/properties/payload/mapping/selectProfile/properties",
                keyword: "properties",
                params: { type: "object", nullable: false },
                message: "must be object",
              };
              if (vErrors === null) {
                vErrors = [err163];
              } else {
                vErrors.push(err163);
              }
              errors++;
            }
            var valid70 = _errs59 === errors;
            valid11 = valid70;
          } else if (tag0 === "acknowledgePreparation") {
            const _errs78 = errors;
            let valid93 = false;
            valid93 = true;
            if (data12.hash !== undefined) {
              if (!(typeof data12.hash == "string")) {
                const err164 = {
                  instancePath: instancePath + "/payload/hash",
                  schemaPath:
                    "/properties/payload/mapping/acknowledgePreparation/properties/hash/type",
                  keyword: "type",
                  params: { type: "string", nullable: false },
                  message: "must be string",
                };
                if (vErrors === null) {
                  vErrors = [err164];
                } else {
                  vErrors.push(err164);
                }
                errors++;
              }
            } else {
              const err165 = {
                instancePath: instancePath + "/payload",
                schemaPath:
                  "/properties/payload/mapping/acknowledgePreparation/properties/hash",
                keyword: "properties",
                params: { error: "missing", missingProperty: "hash" },
                message: "must have property 'hash'",
              };
              if (vErrors === null) {
                vErrors = [err165];
              } else {
                vErrors.push(err165);
              }
              errors++;
            }
            for (const key26 in data12) {
              if (key26 !== "kind" && key26 !== "hash") {
                const err166 = {
                  instancePath:
                    instancePath +
                    "/payload/" +
                    key26.replace(/~/g, "~0").replace(/\//g, "~1"),
                  schemaPath:
                    "/properties/payload/mapping/acknowledgePreparation",
                  keyword: "properties",
                  params: { error: "additional", additionalProperty: key26 },
                  message: "must NOT have additional properties",
                };
                if (vErrors === null) {
                  vErrors = [err166];
                } else {
                  vErrors.push(err166);
                }
                errors++;
              }
            }
            if (!valid93) {
              const err167 = {
                instancePath: instancePath + "/payload",
                schemaPath:
                  "/properties/payload/mapping/acknowledgePreparation/properties",
                keyword: "properties",
                params: { type: "object", nullable: false },
                message: "must be object",
              };
              if (vErrors === null) {
                vErrors = [err167];
              } else {
                vErrors.push(err167);
              }
              errors++;
            }
            var valid92 = _errs78 === errors;
            valid11 = valid92;
          } else {
            const err168 = {
              instancePath: instancePath + "/payload/kind",
              schemaPath: "/properties/payload/mapping",
              keyword: "discriminator",
              params: { error: "mapping", tag: "kind", tagValue: tag0 },
              message: 'value of tag "kind" must be in mapping',
            };
            if (vErrors === null) {
              vErrors = [err168];
            } else {
              vErrors.push(err168);
            }
            errors++;
          }
        } else {
          const err169 = {
            instancePath: instancePath + "/payload/kind",
            schemaPath: "/properties/payload/discriminator",
            keyword: "discriminator",
            params: { error: "tag", tag: "kind", tagValue: tag0 },
            message: 'tag "kind" must be string',
          };
          if (vErrors === null) {
            vErrors = [err169];
          } else {
            vErrors.push(err169);
          }
          errors++;
        }
      } else if (!valid11) {
        const err170 = {
          instancePath: instancePath + "/payload",
          schemaPath: "/properties/payload/discriminator",
          keyword: "discriminator",
          params: { type: "object", nullable: false },
          message: "must be object",
        };
        if (vErrors === null) {
          vErrors = [err170];
        } else {
          vErrors.push(err170);
        }
        errors++;
      }
    } else {
      const err171 = {
        instancePath,
        schemaPath: "/properties/payload",
        keyword: "properties",
        params: { error: "missing", missingProperty: "payload" },
        message: "must have property 'payload'",
      };
      if (vErrors === null) {
        vErrors = [err171];
      } else {
        vErrors.push(err171);
      }
      errors++;
    }
    for (const key27 in data) {
      if (
        key27 !== "version" &&
        key27 !== "commandId" &&
        key27 !== "scope" &&
        key27 !== "selection" &&
        key27 !== "payloadHash" &&
        key27 !== "payload"
      ) {
        const err172 = {
          instancePath:
            instancePath + "/" + key27.replace(/~/g, "~0").replace(/\//g, "~1"),
          schemaPath: "",
          keyword: "properties",
          params: { error: "additional", additionalProperty: key27 },
          message: "must NOT have additional properties",
        };
        if (vErrors === null) {
          vErrors = [err172];
        } else {
          vErrors.push(err172);
        }
        errors++;
      }
    }
  }
  if (!valid0) {
    const err173 = {
      instancePath,
      schemaPath: "/properties",
      keyword: "properties",
      params: { type: "object", nullable: false },
      message: "must be object",
    };
    if (vErrors === null) {
      vErrors = [err173];
    } else {
      vErrors.push(err173);
    }
    errors++;
  }
  validate65.errors = vErrors;
  return errors === 0;
}
export const validateProfileAdministrationReceipt = validate66;
const schema38 = {
  properties: {
    kind: { enum: ["profileCommitted"] },
    version: { type: "uint8" },
    commandId: { type: "string" },
    payloadHash: { type: "string" },
    administration: {
      properties: {
        installationId: { type: "string" },
        revision: { type: "string" },
      },
    },
    selection: {
      properties: {
        installationId: { type: "string" },
        revision: { type: "string" },
        owner: {
          properties: {
            profileId: { type: "string" },
            generation: { type: "string" },
          },
        },
      },
    },
    effect: {
      discriminator: "kind",
      mapping: {
        preferences: {
          properties: {
            target: {
              properties: {
                owner: {
                  properties: {
                    profileId: { type: "string" },
                    generation: { type: "string" },
                  },
                },
                revision: { type: "string" },
              },
            },
          },
        },
        created: {
          properties: {
            target: {
              properties: {
                owner: {
                  properties: {
                    profileId: { type: "string" },
                    generation: { type: "string" },
                  },
                },
                revision: { type: "string" },
              },
            },
          },
        },
        initialSetup: {
          properties: {
            target: {
              properties: {
                owner: {
                  properties: {
                    profileId: { type: "string" },
                    generation: { type: "string" },
                  },
                },
                revision: { type: "string" },
              },
            },
          },
        },
        selection: {
          properties: {
            previous: {
              properties: {
                installationId: { type: "string" },
                revision: { type: "string" },
                owner: {
                  properties: {
                    profileId: { type: "string" },
                    generation: { type: "string" },
                  },
                },
              },
            },
          },
        },
        preparation: { properties: { hash: { type: "string" } } },
      },
    },
  },
};
function validate66(
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
      if (!(typeof data0 == "string" && data0 === "profileCommitted")) {
        const err0 = {
          instancePath: instancePath + "/kind",
          schemaPath: "/properties/kind/enum",
          keyword: "enum",
          params: { allowedValues: schema38.properties.kind.enum },
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
    if (data.version !== undefined) {
      let data1 = data.version;
      if (!(
        typeof data1 == "number" &&
        isFinite(data1) &&
        !(data1 % 1) &&
        data1 >= 0 &&
        data1 <= 255
      )) {
        const err2 = {
          instancePath: instancePath + "/version",
          schemaPath: "/properties/version/type",
          keyword: "type",
          params: { type: "uint8", nullable: false },
          message: "must be uint8",
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
        schemaPath: "/properties/version",
        keyword: "properties",
        params: { error: "missing", missingProperty: "version" },
        message: "must have property 'version'",
      };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    if (data.commandId !== undefined) {
      if (!(typeof data.commandId == "string")) {
        const err4 = {
          instancePath: instancePath + "/commandId",
          schemaPath: "/properties/commandId/type",
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
        schemaPath: "/properties/commandId",
        keyword: "properties",
        params: { error: "missing", missingProperty: "commandId" },
        message: "must have property 'commandId'",
      };
      if (vErrors === null) {
        vErrors = [err5];
      } else {
        vErrors.push(err5);
      }
      errors++;
    }
    if (data.payloadHash !== undefined) {
      if (!(typeof data.payloadHash == "string")) {
        const err6 = {
          instancePath: instancePath + "/payloadHash",
          schemaPath: "/properties/payloadHash/type",
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
        schemaPath: "/properties/payloadHash",
        keyword: "properties",
        params: { error: "missing", missingProperty: "payloadHash" },
        message: "must have property 'payloadHash'",
      };
      if (vErrors === null) {
        vErrors = [err7];
      } else {
        vErrors.push(err7);
      }
      errors++;
    }
    if (data.administration !== undefined) {
      let data4 = data.administration;
      let valid2 = false;
      if (data4 && typeof data4 == "object" && !Array.isArray(data4)) {
        valid2 = true;
        if (data4.installationId !== undefined) {
          if (!(typeof data4.installationId == "string")) {
            const err8 = {
              instancePath: instancePath + "/administration/installationId",
              schemaPath:
                "/properties/administration/properties/installationId/type",
              keyword: "type",
              params: { type: "string", nullable: false },
              message: "must be string",
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
            instancePath: instancePath + "/administration",
            schemaPath: "/properties/administration/properties/installationId",
            keyword: "properties",
            params: { error: "missing", missingProperty: "installationId" },
            message: "must have property 'installationId'",
          };
          if (vErrors === null) {
            vErrors = [err9];
          } else {
            vErrors.push(err9);
          }
          errors++;
        }
        if (data4.revision !== undefined) {
          if (!(typeof data4.revision == "string")) {
            const err10 = {
              instancePath: instancePath + "/administration/revision",
              schemaPath: "/properties/administration/properties/revision/type",
              keyword: "type",
              params: { type: "string", nullable: false },
              message: "must be string",
            };
            if (vErrors === null) {
              vErrors = [err10];
            } else {
              vErrors.push(err10);
            }
            errors++;
          }
        } else {
          const err11 = {
            instancePath: instancePath + "/administration",
            schemaPath: "/properties/administration/properties/revision",
            keyword: "properties",
            params: { error: "missing", missingProperty: "revision" },
            message: "must have property 'revision'",
          };
          if (vErrors === null) {
            vErrors = [err11];
          } else {
            vErrors.push(err11);
          }
          errors++;
        }
        for (const key0 in data4) {
          if (key0 !== "installationId" && key0 !== "revision") {
            const err12 = {
              instancePath:
                instancePath +
                "/administration/" +
                key0.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/properties/administration",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key0 },
              message: "must NOT have additional properties",
            };
            if (vErrors === null) {
              vErrors = [err12];
            } else {
              vErrors.push(err12);
            }
            errors++;
          }
        }
      }
      if (!valid2) {
        const err13 = {
          instancePath: instancePath + "/administration",
          schemaPath: "/properties/administration/properties",
          keyword: "properties",
          params: { type: "object", nullable: false },
          message: "must be object",
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
        schemaPath: "/properties/administration",
        keyword: "properties",
        params: { error: "missing", missingProperty: "administration" },
        message: "must have property 'administration'",
      };
      if (vErrors === null) {
        vErrors = [err14];
      } else {
        vErrors.push(err14);
      }
      errors++;
    }
    if (data.selection !== undefined) {
      let data7 = data.selection;
      let valid5 = false;
      if (data7 && typeof data7 == "object" && !Array.isArray(data7)) {
        valid5 = true;
        if (data7.installationId !== undefined) {
          if (!(typeof data7.installationId == "string")) {
            const err15 = {
              instancePath: instancePath + "/selection/installationId",
              schemaPath:
                "/properties/selection/properties/installationId/type",
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
            instancePath: instancePath + "/selection",
            schemaPath: "/properties/selection/properties/installationId",
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
        if (data7.revision !== undefined) {
          if (!(typeof data7.revision == "string")) {
            const err17 = {
              instancePath: instancePath + "/selection/revision",
              schemaPath: "/properties/selection/properties/revision/type",
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
            instancePath: instancePath + "/selection",
            schemaPath: "/properties/selection/properties/revision",
            keyword: "properties",
            params: { error: "missing", missingProperty: "revision" },
            message: "must have property 'revision'",
          };
          if (vErrors === null) {
            vErrors = [err18];
          } else {
            vErrors.push(err18);
          }
          errors++;
        }
        if (data7.owner !== undefined) {
          let data10 = data7.owner;
          let valid7 = false;
          if (data10 && typeof data10 == "object" && !Array.isArray(data10)) {
            valid7 = true;
            if (data10.profileId !== undefined) {
              if (!(typeof data10.profileId == "string")) {
                const err19 = {
                  instancePath: instancePath + "/selection/owner/profileId",
                  schemaPath:
                    "/properties/selection/properties/owner/properties/profileId/type",
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
                instancePath: instancePath + "/selection/owner",
                schemaPath:
                  "/properties/selection/properties/owner/properties/profileId",
                keyword: "properties",
                params: { error: "missing", missingProperty: "profileId" },
                message: "must have property 'profileId'",
              };
              if (vErrors === null) {
                vErrors = [err20];
              } else {
                vErrors.push(err20);
              }
              errors++;
            }
            if (data10.generation !== undefined) {
              if (!(typeof data10.generation == "string")) {
                const err21 = {
                  instancePath: instancePath + "/selection/owner/generation",
                  schemaPath:
                    "/properties/selection/properties/owner/properties/generation/type",
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
                instancePath: instancePath + "/selection/owner",
                schemaPath:
                  "/properties/selection/properties/owner/properties/generation",
                keyword: "properties",
                params: { error: "missing", missingProperty: "generation" },
                message: "must have property 'generation'",
              };
              if (vErrors === null) {
                vErrors = [err22];
              } else {
                vErrors.push(err22);
              }
              errors++;
            }
            for (const key1 in data10) {
              if (key1 !== "profileId" && key1 !== "generation") {
                const err23 = {
                  instancePath:
                    instancePath +
                    "/selection/owner/" +
                    key1.replace(/~/g, "~0").replace(/\//g, "~1"),
                  schemaPath: "/properties/selection/properties/owner",
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
          }
          if (!valid7) {
            const err24 = {
              instancePath: instancePath + "/selection/owner",
              schemaPath: "/properties/selection/properties/owner/properties",
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
        } else {
          const err25 = {
            instancePath: instancePath + "/selection",
            schemaPath: "/properties/selection/properties/owner",
            keyword: "properties",
            params: { error: "missing", missingProperty: "owner" },
            message: "must have property 'owner'",
          };
          if (vErrors === null) {
            vErrors = [err25];
          } else {
            vErrors.push(err25);
          }
          errors++;
        }
        for (const key2 in data7) {
          if (
            key2 !== "installationId" &&
            key2 !== "revision" &&
            key2 !== "owner"
          ) {
            const err26 = {
              instancePath:
                instancePath +
                "/selection/" +
                key2.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/properties/selection",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key2 },
              message: "must NOT have additional properties",
            };
            if (vErrors === null) {
              vErrors = [err26];
            } else {
              vErrors.push(err26);
            }
            errors++;
          }
        }
      }
      if (!valid5) {
        const err27 = {
          instancePath: instancePath + "/selection",
          schemaPath: "/properties/selection/properties",
          keyword: "properties",
          params: { type: "object", nullable: false },
          message: "must be object",
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
        schemaPath: "/properties/selection",
        keyword: "properties",
        params: { error: "missing", missingProperty: "selection" },
        message: "must have property 'selection'",
      };
      if (vErrors === null) {
        vErrors = [err28];
      } else {
        vErrors.push(err28);
      }
      errors++;
    }
    if (data.effect !== undefined) {
      let data13 = data.effect;
      let valid11 = false;
      if (data13 && typeof data13 == "object" && !Array.isArray(data13)) {
        const tag0 = data13.kind;
        if (tag0 === undefined) {
          const err29 = {
            instancePath: instancePath + "/effect",
            schemaPath: "/properties/effect/discriminator",
            keyword: "discriminator",
            params: { error: "tag", tag: "kind", tagValue: tag0 },
            message: 'tag "kind" must be string',
          };
          if (vErrors === null) {
            vErrors = [err29];
          } else {
            vErrors.push(err29);
          }
          errors++;
        } else if (typeof tag0 == "string") {
          if (tag0 === "preferences") {
            const _errs14 = errors;
            let valid13 = false;
            valid13 = true;
            if (data13.target !== undefined) {
              let data14 = data13.target;
              let valid15 = false;
              if (
                data14 &&
                typeof data14 == "object" &&
                !Array.isArray(data14)
              ) {
                valid15 = true;
                if (data14.owner !== undefined) {
                  let data15 = data14.owner;
                  let valid17 = false;
                  if (
                    data15 &&
                    typeof data15 == "object" &&
                    !Array.isArray(data15)
                  ) {
                    valid17 = true;
                    if (data15.profileId !== undefined) {
                      if (!(typeof data15.profileId == "string")) {
                        const err30 = {
                          instancePath:
                            instancePath + "/effect/target/owner/profileId",
                          schemaPath:
                            "/properties/effect/mapping/preferences/properties/target/properties/owner/properties/profileId/type",
                          keyword: "type",
                          params: { type: "string", nullable: false },
                          message: "must be string",
                        };
                        if (vErrors === null) {
                          vErrors = [err30];
                        } else {
                          vErrors.push(err30);
                        }
                        errors++;
                      }
                    } else {
                      const err31 = {
                        instancePath: instancePath + "/effect/target/owner",
                        schemaPath:
                          "/properties/effect/mapping/preferences/properties/target/properties/owner/properties/profileId",
                        keyword: "properties",
                        params: {
                          error: "missing",
                          missingProperty: "profileId",
                        },
                        message: "must have property 'profileId'",
                      };
                      if (vErrors === null) {
                        vErrors = [err31];
                      } else {
                        vErrors.push(err31);
                      }
                      errors++;
                    }
                    if (data15.generation !== undefined) {
                      if (!(typeof data15.generation == "string")) {
                        const err32 = {
                          instancePath:
                            instancePath + "/effect/target/owner/generation",
                          schemaPath:
                            "/properties/effect/mapping/preferences/properties/target/properties/owner/properties/generation/type",
                          keyword: "type",
                          params: { type: "string", nullable: false },
                          message: "must be string",
                        };
                        if (vErrors === null) {
                          vErrors = [err32];
                        } else {
                          vErrors.push(err32);
                        }
                        errors++;
                      }
                    } else {
                      const err33 = {
                        instancePath: instancePath + "/effect/target/owner",
                        schemaPath:
                          "/properties/effect/mapping/preferences/properties/target/properties/owner/properties/generation",
                        keyword: "properties",
                        params: {
                          error: "missing",
                          missingProperty: "generation",
                        },
                        message: "must have property 'generation'",
                      };
                      if (vErrors === null) {
                        vErrors = [err33];
                      } else {
                        vErrors.push(err33);
                      }
                      errors++;
                    }
                    for (const key3 in data15) {
                      if (key3 !== "profileId" && key3 !== "generation") {
                        const err34 = {
                          instancePath:
                            instancePath +
                            "/effect/target/owner/" +
                            key3.replace(/~/g, "~0").replace(/\//g, "~1"),
                          schemaPath:
                            "/properties/effect/mapping/preferences/properties/target/properties/owner",
                          keyword: "properties",
                          params: {
                            error: "additional",
                            additionalProperty: key3,
                          },
                          message: "must NOT have additional properties",
                        };
                        if (vErrors === null) {
                          vErrors = [err34];
                        } else {
                          vErrors.push(err34);
                        }
                        errors++;
                      }
                    }
                  }
                  if (!valid17) {
                    const err35 = {
                      instancePath: instancePath + "/effect/target/owner",
                      schemaPath:
                        "/properties/effect/mapping/preferences/properties/target/properties/owner/properties",
                      keyword: "properties",
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
                    instancePath: instancePath + "/effect/target",
                    schemaPath:
                      "/properties/effect/mapping/preferences/properties/target/properties/owner",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "owner" },
                    message: "must have property 'owner'",
                  };
                  if (vErrors === null) {
                    vErrors = [err36];
                  } else {
                    vErrors.push(err36);
                  }
                  errors++;
                }
                if (data14.revision !== undefined) {
                  if (!(typeof data14.revision == "string")) {
                    const err37 = {
                      instancePath: instancePath + "/effect/target/revision",
                      schemaPath:
                        "/properties/effect/mapping/preferences/properties/target/properties/revision/type",
                      keyword: "type",
                      params: { type: "string", nullable: false },
                      message: "must be string",
                    };
                    if (vErrors === null) {
                      vErrors = [err37];
                    } else {
                      vErrors.push(err37);
                    }
                    errors++;
                  }
                } else {
                  const err38 = {
                    instancePath: instancePath + "/effect/target",
                    schemaPath:
                      "/properties/effect/mapping/preferences/properties/target/properties/revision",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "revision" },
                    message: "must have property 'revision'",
                  };
                  if (vErrors === null) {
                    vErrors = [err38];
                  } else {
                    vErrors.push(err38);
                  }
                  errors++;
                }
                for (const key4 in data14) {
                  if (key4 !== "owner" && key4 !== "revision") {
                    const err39 = {
                      instancePath:
                        instancePath +
                        "/effect/target/" +
                        key4.replace(/~/g, "~0").replace(/\//g, "~1"),
                      schemaPath:
                        "/properties/effect/mapping/preferences/properties/target",
                      keyword: "properties",
                      params: { error: "additional", additionalProperty: key4 },
                      message: "must NOT have additional properties",
                    };
                    if (vErrors === null) {
                      vErrors = [err39];
                    } else {
                      vErrors.push(err39);
                    }
                    errors++;
                  }
                }
              }
              if (!valid15) {
                const err40 = {
                  instancePath: instancePath + "/effect/target",
                  schemaPath:
                    "/properties/effect/mapping/preferences/properties/target/properties",
                  keyword: "properties",
                  params: { type: "object", nullable: false },
                  message: "must be object",
                };
                if (vErrors === null) {
                  vErrors = [err40];
                } else {
                  vErrors.push(err40);
                }
                errors++;
              }
            } else {
              const err41 = {
                instancePath: instancePath + "/effect",
                schemaPath:
                  "/properties/effect/mapping/preferences/properties/target",
                keyword: "properties",
                params: { error: "missing", missingProperty: "target" },
                message: "must have property 'target'",
              };
              if (vErrors === null) {
                vErrors = [err41];
              } else {
                vErrors.push(err41);
              }
              errors++;
            }
            for (const key5 in data13) {
              if (key5 !== "kind" && key5 !== "target") {
                const err42 = {
                  instancePath:
                    instancePath +
                    "/effect/" +
                    key5.replace(/~/g, "~0").replace(/\//g, "~1"),
                  schemaPath: "/properties/effect/mapping/preferences",
                  keyword: "properties",
                  params: { error: "additional", additionalProperty: key5 },
                  message: "must NOT have additional properties",
                };
                if (vErrors === null) {
                  vErrors = [err42];
                } else {
                  vErrors.push(err42);
                }
                errors++;
              }
            }
            if (!valid13) {
              const err43 = {
                instancePath: instancePath + "/effect",
                schemaPath: "/properties/effect/mapping/preferences/properties",
                keyword: "properties",
                params: { type: "object", nullable: false },
                message: "must be object",
              };
              if (vErrors === null) {
                vErrors = [err43];
              } else {
                vErrors.push(err43);
              }
              errors++;
            }
            var valid12 = _errs14 === errors;
            valid11 = valid12;
          } else if (tag0 === "created") {
            const _errs20 = errors;
            let valid23 = false;
            valid23 = true;
            if (data13.target !== undefined) {
              let data19 = data13.target;
              let valid25 = false;
              if (
                data19 &&
                typeof data19 == "object" &&
                !Array.isArray(data19)
              ) {
                valid25 = true;
                if (data19.owner !== undefined) {
                  let data20 = data19.owner;
                  let valid27 = false;
                  if (
                    data20 &&
                    typeof data20 == "object" &&
                    !Array.isArray(data20)
                  ) {
                    valid27 = true;
                    if (data20.profileId !== undefined) {
                      if (!(typeof data20.profileId == "string")) {
                        const err44 = {
                          instancePath:
                            instancePath + "/effect/target/owner/profileId",
                          schemaPath:
                            "/properties/effect/mapping/created/properties/target/properties/owner/properties/profileId/type",
                          keyword: "type",
                          params: { type: "string", nullable: false },
                          message: "must be string",
                        };
                        if (vErrors === null) {
                          vErrors = [err44];
                        } else {
                          vErrors.push(err44);
                        }
                        errors++;
                      }
                    } else {
                      const err45 = {
                        instancePath: instancePath + "/effect/target/owner",
                        schemaPath:
                          "/properties/effect/mapping/created/properties/target/properties/owner/properties/profileId",
                        keyword: "properties",
                        params: {
                          error: "missing",
                          missingProperty: "profileId",
                        },
                        message: "must have property 'profileId'",
                      };
                      if (vErrors === null) {
                        vErrors = [err45];
                      } else {
                        vErrors.push(err45);
                      }
                      errors++;
                    }
                    if (data20.generation !== undefined) {
                      if (!(typeof data20.generation == "string")) {
                        const err46 = {
                          instancePath:
                            instancePath + "/effect/target/owner/generation",
                          schemaPath:
                            "/properties/effect/mapping/created/properties/target/properties/owner/properties/generation/type",
                          keyword: "type",
                          params: { type: "string", nullable: false },
                          message: "must be string",
                        };
                        if (vErrors === null) {
                          vErrors = [err46];
                        } else {
                          vErrors.push(err46);
                        }
                        errors++;
                      }
                    } else {
                      const err47 = {
                        instancePath: instancePath + "/effect/target/owner",
                        schemaPath:
                          "/properties/effect/mapping/created/properties/target/properties/owner/properties/generation",
                        keyword: "properties",
                        params: {
                          error: "missing",
                          missingProperty: "generation",
                        },
                        message: "must have property 'generation'",
                      };
                      if (vErrors === null) {
                        vErrors = [err47];
                      } else {
                        vErrors.push(err47);
                      }
                      errors++;
                    }
                    for (const key6 in data20) {
                      if (key6 !== "profileId" && key6 !== "generation") {
                        const err48 = {
                          instancePath:
                            instancePath +
                            "/effect/target/owner/" +
                            key6.replace(/~/g, "~0").replace(/\//g, "~1"),
                          schemaPath:
                            "/properties/effect/mapping/created/properties/target/properties/owner",
                          keyword: "properties",
                          params: {
                            error: "additional",
                            additionalProperty: key6,
                          },
                          message: "must NOT have additional properties",
                        };
                        if (vErrors === null) {
                          vErrors = [err48];
                        } else {
                          vErrors.push(err48);
                        }
                        errors++;
                      }
                    }
                  }
                  if (!valid27) {
                    const err49 = {
                      instancePath: instancePath + "/effect/target/owner",
                      schemaPath:
                        "/properties/effect/mapping/created/properties/target/properties/owner/properties",
                      keyword: "properties",
                      params: { type: "object", nullable: false },
                      message: "must be object",
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
                    instancePath: instancePath + "/effect/target",
                    schemaPath:
                      "/properties/effect/mapping/created/properties/target/properties/owner",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "owner" },
                    message: "must have property 'owner'",
                  };
                  if (vErrors === null) {
                    vErrors = [err50];
                  } else {
                    vErrors.push(err50);
                  }
                  errors++;
                }
                if (data19.revision !== undefined) {
                  if (!(typeof data19.revision == "string")) {
                    const err51 = {
                      instancePath: instancePath + "/effect/target/revision",
                      schemaPath:
                        "/properties/effect/mapping/created/properties/target/properties/revision/type",
                      keyword: "type",
                      params: { type: "string", nullable: false },
                      message: "must be string",
                    };
                    if (vErrors === null) {
                      vErrors = [err51];
                    } else {
                      vErrors.push(err51);
                    }
                    errors++;
                  }
                } else {
                  const err52 = {
                    instancePath: instancePath + "/effect/target",
                    schemaPath:
                      "/properties/effect/mapping/created/properties/target/properties/revision",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "revision" },
                    message: "must have property 'revision'",
                  };
                  if (vErrors === null) {
                    vErrors = [err52];
                  } else {
                    vErrors.push(err52);
                  }
                  errors++;
                }
                for (const key7 in data19) {
                  if (key7 !== "owner" && key7 !== "revision") {
                    const err53 = {
                      instancePath:
                        instancePath +
                        "/effect/target/" +
                        key7.replace(/~/g, "~0").replace(/\//g, "~1"),
                      schemaPath:
                        "/properties/effect/mapping/created/properties/target",
                      keyword: "properties",
                      params: { error: "additional", additionalProperty: key7 },
                      message: "must NOT have additional properties",
                    };
                    if (vErrors === null) {
                      vErrors = [err53];
                    } else {
                      vErrors.push(err53);
                    }
                    errors++;
                  }
                }
              }
              if (!valid25) {
                const err54 = {
                  instancePath: instancePath + "/effect/target",
                  schemaPath:
                    "/properties/effect/mapping/created/properties/target/properties",
                  keyword: "properties",
                  params: { type: "object", nullable: false },
                  message: "must be object",
                };
                if (vErrors === null) {
                  vErrors = [err54];
                } else {
                  vErrors.push(err54);
                }
                errors++;
              }
            } else {
              const err55 = {
                instancePath: instancePath + "/effect",
                schemaPath:
                  "/properties/effect/mapping/created/properties/target",
                keyword: "properties",
                params: { error: "missing", missingProperty: "target" },
                message: "must have property 'target'",
              };
              if (vErrors === null) {
                vErrors = [err55];
              } else {
                vErrors.push(err55);
              }
              errors++;
            }
            for (const key8 in data13) {
              if (key8 !== "kind" && key8 !== "target") {
                const err56 = {
                  instancePath:
                    instancePath +
                    "/effect/" +
                    key8.replace(/~/g, "~0").replace(/\//g, "~1"),
                  schemaPath: "/properties/effect/mapping/created",
                  keyword: "properties",
                  params: { error: "additional", additionalProperty: key8 },
                  message: "must NOT have additional properties",
                };
                if (vErrors === null) {
                  vErrors = [err56];
                } else {
                  vErrors.push(err56);
                }
                errors++;
              }
            }
            if (!valid23) {
              const err57 = {
                instancePath: instancePath + "/effect",
                schemaPath: "/properties/effect/mapping/created/properties",
                keyword: "properties",
                params: { type: "object", nullable: false },
                message: "must be object",
              };
              if (vErrors === null) {
                vErrors = [err57];
              } else {
                vErrors.push(err57);
              }
              errors++;
            }
            var valid22 = _errs20 === errors;
            valid11 = valid22;
          } else if (tag0 === "initialSetup") {
            const _errs26 = errors;
            let valid33 = false;
            valid33 = true;
            if (data13.target !== undefined) {
              let data24 = data13.target;
              let valid35 = false;
              if (
                data24 &&
                typeof data24 == "object" &&
                !Array.isArray(data24)
              ) {
                valid35 = true;
                if (data24.owner !== undefined) {
                  let data25 = data24.owner;
                  let valid37 = false;
                  if (
                    data25 &&
                    typeof data25 == "object" &&
                    !Array.isArray(data25)
                  ) {
                    valid37 = true;
                    if (data25.profileId !== undefined) {
                      if (!(typeof data25.profileId == "string")) {
                        const err58 = {
                          instancePath:
                            instancePath + "/effect/target/owner/profileId",
                          schemaPath:
                            "/properties/effect/mapping/initialSetup/properties/target/properties/owner/properties/profileId/type",
                          keyword: "type",
                          params: { type: "string", nullable: false },
                          message: "must be string",
                        };
                        if (vErrors === null) {
                          vErrors = [err58];
                        } else {
                          vErrors.push(err58);
                        }
                        errors++;
                      }
                    } else {
                      const err59 = {
                        instancePath: instancePath + "/effect/target/owner",
                        schemaPath:
                          "/properties/effect/mapping/initialSetup/properties/target/properties/owner/properties/profileId",
                        keyword: "properties",
                        params: {
                          error: "missing",
                          missingProperty: "profileId",
                        },
                        message: "must have property 'profileId'",
                      };
                      if (vErrors === null) {
                        vErrors = [err59];
                      } else {
                        vErrors.push(err59);
                      }
                      errors++;
                    }
                    if (data25.generation !== undefined) {
                      if (!(typeof data25.generation == "string")) {
                        const err60 = {
                          instancePath:
                            instancePath + "/effect/target/owner/generation",
                          schemaPath:
                            "/properties/effect/mapping/initialSetup/properties/target/properties/owner/properties/generation/type",
                          keyword: "type",
                          params: { type: "string", nullable: false },
                          message: "must be string",
                        };
                        if (vErrors === null) {
                          vErrors = [err60];
                        } else {
                          vErrors.push(err60);
                        }
                        errors++;
                      }
                    } else {
                      const err61 = {
                        instancePath: instancePath + "/effect/target/owner",
                        schemaPath:
                          "/properties/effect/mapping/initialSetup/properties/target/properties/owner/properties/generation",
                        keyword: "properties",
                        params: {
                          error: "missing",
                          missingProperty: "generation",
                        },
                        message: "must have property 'generation'",
                      };
                      if (vErrors === null) {
                        vErrors = [err61];
                      } else {
                        vErrors.push(err61);
                      }
                      errors++;
                    }
                    for (const key9 in data25) {
                      if (key9 !== "profileId" && key9 !== "generation") {
                        const err62 = {
                          instancePath:
                            instancePath +
                            "/effect/target/owner/" +
                            key9.replace(/~/g, "~0").replace(/\//g, "~1"),
                          schemaPath:
                            "/properties/effect/mapping/initialSetup/properties/target/properties/owner",
                          keyword: "properties",
                          params: {
                            error: "additional",
                            additionalProperty: key9,
                          },
                          message: "must NOT have additional properties",
                        };
                        if (vErrors === null) {
                          vErrors = [err62];
                        } else {
                          vErrors.push(err62);
                        }
                        errors++;
                      }
                    }
                  }
                  if (!valid37) {
                    const err63 = {
                      instancePath: instancePath + "/effect/target/owner",
                      schemaPath:
                        "/properties/effect/mapping/initialSetup/properties/target/properties/owner/properties",
                      keyword: "properties",
                      params: { type: "object", nullable: false },
                      message: "must be object",
                    };
                    if (vErrors === null) {
                      vErrors = [err63];
                    } else {
                      vErrors.push(err63);
                    }
                    errors++;
                  }
                } else {
                  const err64 = {
                    instancePath: instancePath + "/effect/target",
                    schemaPath:
                      "/properties/effect/mapping/initialSetup/properties/target/properties/owner",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "owner" },
                    message: "must have property 'owner'",
                  };
                  if (vErrors === null) {
                    vErrors = [err64];
                  } else {
                    vErrors.push(err64);
                  }
                  errors++;
                }
                if (data24.revision !== undefined) {
                  if (!(typeof data24.revision == "string")) {
                    const err65 = {
                      instancePath: instancePath + "/effect/target/revision",
                      schemaPath:
                        "/properties/effect/mapping/initialSetup/properties/target/properties/revision/type",
                      keyword: "type",
                      params: { type: "string", nullable: false },
                      message: "must be string",
                    };
                    if (vErrors === null) {
                      vErrors = [err65];
                    } else {
                      vErrors.push(err65);
                    }
                    errors++;
                  }
                } else {
                  const err66 = {
                    instancePath: instancePath + "/effect/target",
                    schemaPath:
                      "/properties/effect/mapping/initialSetup/properties/target/properties/revision",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "revision" },
                    message: "must have property 'revision'",
                  };
                  if (vErrors === null) {
                    vErrors = [err66];
                  } else {
                    vErrors.push(err66);
                  }
                  errors++;
                }
                for (const key10 in data24) {
                  if (key10 !== "owner" && key10 !== "revision") {
                    const err67 = {
                      instancePath:
                        instancePath +
                        "/effect/target/" +
                        key10.replace(/~/g, "~0").replace(/\//g, "~1"),
                      schemaPath:
                        "/properties/effect/mapping/initialSetup/properties/target",
                      keyword: "properties",
                      params: {
                        error: "additional",
                        additionalProperty: key10,
                      },
                      message: "must NOT have additional properties",
                    };
                    if (vErrors === null) {
                      vErrors = [err67];
                    } else {
                      vErrors.push(err67);
                    }
                    errors++;
                  }
                }
              }
              if (!valid35) {
                const err68 = {
                  instancePath: instancePath + "/effect/target",
                  schemaPath:
                    "/properties/effect/mapping/initialSetup/properties/target/properties",
                  keyword: "properties",
                  params: { type: "object", nullable: false },
                  message: "must be object",
                };
                if (vErrors === null) {
                  vErrors = [err68];
                } else {
                  vErrors.push(err68);
                }
                errors++;
              }
            } else {
              const err69 = {
                instancePath: instancePath + "/effect",
                schemaPath:
                  "/properties/effect/mapping/initialSetup/properties/target",
                keyword: "properties",
                params: { error: "missing", missingProperty: "target" },
                message: "must have property 'target'",
              };
              if (vErrors === null) {
                vErrors = [err69];
              } else {
                vErrors.push(err69);
              }
              errors++;
            }
            for (const key11 in data13) {
              if (key11 !== "kind" && key11 !== "target") {
                const err70 = {
                  instancePath:
                    instancePath +
                    "/effect/" +
                    key11.replace(/~/g, "~0").replace(/\//g, "~1"),
                  schemaPath: "/properties/effect/mapping/initialSetup",
                  keyword: "properties",
                  params: { error: "additional", additionalProperty: key11 },
                  message: "must NOT have additional properties",
                };
                if (vErrors === null) {
                  vErrors = [err70];
                } else {
                  vErrors.push(err70);
                }
                errors++;
              }
            }
            if (!valid33) {
              const err71 = {
                instancePath: instancePath + "/effect",
                schemaPath:
                  "/properties/effect/mapping/initialSetup/properties",
                keyword: "properties",
                params: { type: "object", nullable: false },
                message: "must be object",
              };
              if (vErrors === null) {
                vErrors = [err71];
              } else {
                vErrors.push(err71);
              }
              errors++;
            }
            var valid32 = _errs26 === errors;
            valid11 = valid32;
          } else if (tag0 === "selection") {
            const _errs32 = errors;
            let valid43 = false;
            valid43 = true;
            if (data13.previous !== undefined) {
              let data29 = data13.previous;
              let valid45 = false;
              if (
                data29 &&
                typeof data29 == "object" &&
                !Array.isArray(data29)
              ) {
                valid45 = true;
                if (data29.installationId !== undefined) {
                  if (!(typeof data29.installationId == "string")) {
                    const err72 = {
                      instancePath:
                        instancePath + "/effect/previous/installationId",
                      schemaPath:
                        "/properties/effect/mapping/selection/properties/previous/properties/installationId/type",
                      keyword: "type",
                      params: { type: "string", nullable: false },
                      message: "must be string",
                    };
                    if (vErrors === null) {
                      vErrors = [err72];
                    } else {
                      vErrors.push(err72);
                    }
                    errors++;
                  }
                } else {
                  const err73 = {
                    instancePath: instancePath + "/effect/previous",
                    schemaPath:
                      "/properties/effect/mapping/selection/properties/previous/properties/installationId",
                    keyword: "properties",
                    params: {
                      error: "missing",
                      missingProperty: "installationId",
                    },
                    message: "must have property 'installationId'",
                  };
                  if (vErrors === null) {
                    vErrors = [err73];
                  } else {
                    vErrors.push(err73);
                  }
                  errors++;
                }
                if (data29.revision !== undefined) {
                  if (!(typeof data29.revision == "string")) {
                    const err74 = {
                      instancePath: instancePath + "/effect/previous/revision",
                      schemaPath:
                        "/properties/effect/mapping/selection/properties/previous/properties/revision/type",
                      keyword: "type",
                      params: { type: "string", nullable: false },
                      message: "must be string",
                    };
                    if (vErrors === null) {
                      vErrors = [err74];
                    } else {
                      vErrors.push(err74);
                    }
                    errors++;
                  }
                } else {
                  const err75 = {
                    instancePath: instancePath + "/effect/previous",
                    schemaPath:
                      "/properties/effect/mapping/selection/properties/previous/properties/revision",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "revision" },
                    message: "must have property 'revision'",
                  };
                  if (vErrors === null) {
                    vErrors = [err75];
                  } else {
                    vErrors.push(err75);
                  }
                  errors++;
                }
                if (data29.owner !== undefined) {
                  let data32 = data29.owner;
                  let valid47 = false;
                  if (
                    data32 &&
                    typeof data32 == "object" &&
                    !Array.isArray(data32)
                  ) {
                    valid47 = true;
                    if (data32.profileId !== undefined) {
                      if (!(typeof data32.profileId == "string")) {
                        const err76 = {
                          instancePath:
                            instancePath + "/effect/previous/owner/profileId",
                          schemaPath:
                            "/properties/effect/mapping/selection/properties/previous/properties/owner/properties/profileId/type",
                          keyword: "type",
                          params: { type: "string", nullable: false },
                          message: "must be string",
                        };
                        if (vErrors === null) {
                          vErrors = [err76];
                        } else {
                          vErrors.push(err76);
                        }
                        errors++;
                      }
                    } else {
                      const err77 = {
                        instancePath: instancePath + "/effect/previous/owner",
                        schemaPath:
                          "/properties/effect/mapping/selection/properties/previous/properties/owner/properties/profileId",
                        keyword: "properties",
                        params: {
                          error: "missing",
                          missingProperty: "profileId",
                        },
                        message: "must have property 'profileId'",
                      };
                      if (vErrors === null) {
                        vErrors = [err77];
                      } else {
                        vErrors.push(err77);
                      }
                      errors++;
                    }
                    if (data32.generation !== undefined) {
                      if (!(typeof data32.generation == "string")) {
                        const err78 = {
                          instancePath:
                            instancePath + "/effect/previous/owner/generation",
                          schemaPath:
                            "/properties/effect/mapping/selection/properties/previous/properties/owner/properties/generation/type",
                          keyword: "type",
                          params: { type: "string", nullable: false },
                          message: "must be string",
                        };
                        if (vErrors === null) {
                          vErrors = [err78];
                        } else {
                          vErrors.push(err78);
                        }
                        errors++;
                      }
                    } else {
                      const err79 = {
                        instancePath: instancePath + "/effect/previous/owner",
                        schemaPath:
                          "/properties/effect/mapping/selection/properties/previous/properties/owner/properties/generation",
                        keyword: "properties",
                        params: {
                          error: "missing",
                          missingProperty: "generation",
                        },
                        message: "must have property 'generation'",
                      };
                      if (vErrors === null) {
                        vErrors = [err79];
                      } else {
                        vErrors.push(err79);
                      }
                      errors++;
                    }
                    for (const key12 in data32) {
                      if (key12 !== "profileId" && key12 !== "generation") {
                        const err80 = {
                          instancePath:
                            instancePath +
                            "/effect/previous/owner/" +
                            key12.replace(/~/g, "~0").replace(/\//g, "~1"),
                          schemaPath:
                            "/properties/effect/mapping/selection/properties/previous/properties/owner",
                          keyword: "properties",
                          params: {
                            error: "additional",
                            additionalProperty: key12,
                          },
                          message: "must NOT have additional properties",
                        };
                        if (vErrors === null) {
                          vErrors = [err80];
                        } else {
                          vErrors.push(err80);
                        }
                        errors++;
                      }
                    }
                  }
                  if (!valid47) {
                    const err81 = {
                      instancePath: instancePath + "/effect/previous/owner",
                      schemaPath:
                        "/properties/effect/mapping/selection/properties/previous/properties/owner/properties",
                      keyword: "properties",
                      params: { type: "object", nullable: false },
                      message: "must be object",
                    };
                    if (vErrors === null) {
                      vErrors = [err81];
                    } else {
                      vErrors.push(err81);
                    }
                    errors++;
                  }
                } else {
                  const err82 = {
                    instancePath: instancePath + "/effect/previous",
                    schemaPath:
                      "/properties/effect/mapping/selection/properties/previous/properties/owner",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "owner" },
                    message: "must have property 'owner'",
                  };
                  if (vErrors === null) {
                    vErrors = [err82];
                  } else {
                    vErrors.push(err82);
                  }
                  errors++;
                }
                for (const key13 in data29) {
                  if (
                    key13 !== "installationId" &&
                    key13 !== "revision" &&
                    key13 !== "owner"
                  ) {
                    const err83 = {
                      instancePath:
                        instancePath +
                        "/effect/previous/" +
                        key13.replace(/~/g, "~0").replace(/\//g, "~1"),
                      schemaPath:
                        "/properties/effect/mapping/selection/properties/previous",
                      keyword: "properties",
                      params: {
                        error: "additional",
                        additionalProperty: key13,
                      },
                      message: "must NOT have additional properties",
                    };
                    if (vErrors === null) {
                      vErrors = [err83];
                    } else {
                      vErrors.push(err83);
                    }
                    errors++;
                  }
                }
              }
              if (!valid45) {
                const err84 = {
                  instancePath: instancePath + "/effect/previous",
                  schemaPath:
                    "/properties/effect/mapping/selection/properties/previous/properties",
                  keyword: "properties",
                  params: { type: "object", nullable: false },
                  message: "must be object",
                };
                if (vErrors === null) {
                  vErrors = [err84];
                } else {
                  vErrors.push(err84);
                }
                errors++;
              }
            } else {
              const err85 = {
                instancePath: instancePath + "/effect",
                schemaPath:
                  "/properties/effect/mapping/selection/properties/previous",
                keyword: "properties",
                params: { error: "missing", missingProperty: "previous" },
                message: "must have property 'previous'",
              };
              if (vErrors === null) {
                vErrors = [err85];
              } else {
                vErrors.push(err85);
              }
              errors++;
            }
            for (const key14 in data13) {
              if (key14 !== "kind" && key14 !== "previous") {
                const err86 = {
                  instancePath:
                    instancePath +
                    "/effect/" +
                    key14.replace(/~/g, "~0").replace(/\//g, "~1"),
                  schemaPath: "/properties/effect/mapping/selection",
                  keyword: "properties",
                  params: { error: "additional", additionalProperty: key14 },
                  message: "must NOT have additional properties",
                };
                if (vErrors === null) {
                  vErrors = [err86];
                } else {
                  vErrors.push(err86);
                }
                errors++;
              }
            }
            if (!valid43) {
              const err87 = {
                instancePath: instancePath + "/effect",
                schemaPath: "/properties/effect/mapping/selection/properties",
                keyword: "properties",
                params: { type: "object", nullable: false },
                message: "must be object",
              };
              if (vErrors === null) {
                vErrors = [err87];
              } else {
                vErrors.push(err87);
              }
              errors++;
            }
            var valid42 = _errs32 === errors;
            valid11 = valid42;
          } else if (tag0 === "preparation") {
            const _errs39 = errors;
            let valid53 = false;
            valid53 = true;
            if (data13.hash !== undefined) {
              if (!(typeof data13.hash == "string")) {
                const err88 = {
                  instancePath: instancePath + "/effect/hash",
                  schemaPath:
                    "/properties/effect/mapping/preparation/properties/hash/type",
                  keyword: "type",
                  params: { type: "string", nullable: false },
                  message: "must be string",
                };
                if (vErrors === null) {
                  vErrors = [err88];
                } else {
                  vErrors.push(err88);
                }
                errors++;
              }
            } else {
              const err89 = {
                instancePath: instancePath + "/effect",
                schemaPath:
                  "/properties/effect/mapping/preparation/properties/hash",
                keyword: "properties",
                params: { error: "missing", missingProperty: "hash" },
                message: "must have property 'hash'",
              };
              if (vErrors === null) {
                vErrors = [err89];
              } else {
                vErrors.push(err89);
              }
              errors++;
            }
            for (const key15 in data13) {
              if (key15 !== "kind" && key15 !== "hash") {
                const err90 = {
                  instancePath:
                    instancePath +
                    "/effect/" +
                    key15.replace(/~/g, "~0").replace(/\//g, "~1"),
                  schemaPath: "/properties/effect/mapping/preparation",
                  keyword: "properties",
                  params: { error: "additional", additionalProperty: key15 },
                  message: "must NOT have additional properties",
                };
                if (vErrors === null) {
                  vErrors = [err90];
                } else {
                  vErrors.push(err90);
                }
                errors++;
              }
            }
            if (!valid53) {
              const err91 = {
                instancePath: instancePath + "/effect",
                schemaPath: "/properties/effect/mapping/preparation/properties",
                keyword: "properties",
                params: { type: "object", nullable: false },
                message: "must be object",
              };
              if (vErrors === null) {
                vErrors = [err91];
              } else {
                vErrors.push(err91);
              }
              errors++;
            }
            var valid52 = _errs39 === errors;
            valid11 = valid52;
          } else {
            const err92 = {
              instancePath: instancePath + "/effect/kind",
              schemaPath: "/properties/effect/mapping",
              keyword: "discriminator",
              params: { error: "mapping", tag: "kind", tagValue: tag0 },
              message: 'value of tag "kind" must be in mapping',
            };
            if (vErrors === null) {
              vErrors = [err92];
            } else {
              vErrors.push(err92);
            }
            errors++;
          }
        } else {
          const err93 = {
            instancePath: instancePath + "/effect/kind",
            schemaPath: "/properties/effect/discriminator",
            keyword: "discriminator",
            params: { error: "tag", tag: "kind", tagValue: tag0 },
            message: 'tag "kind" must be string',
          };
          if (vErrors === null) {
            vErrors = [err93];
          } else {
            vErrors.push(err93);
          }
          errors++;
        }
      } else if (!valid11) {
        const err94 = {
          instancePath: instancePath + "/effect",
          schemaPath: "/properties/effect/discriminator",
          keyword: "discriminator",
          params: { type: "object", nullable: false },
          message: "must be object",
        };
        if (vErrors === null) {
          vErrors = [err94];
        } else {
          vErrors.push(err94);
        }
        errors++;
      }
    } else {
      const err95 = {
        instancePath,
        schemaPath: "/properties/effect",
        keyword: "properties",
        params: { error: "missing", missingProperty: "effect" },
        message: "must have property 'effect'",
      };
      if (vErrors === null) {
        vErrors = [err95];
      } else {
        vErrors.push(err95);
      }
      errors++;
    }
    for (const key16 in data) {
      if (
        key16 !== "kind" &&
        key16 !== "version" &&
        key16 !== "commandId" &&
        key16 !== "payloadHash" &&
        key16 !== "administration" &&
        key16 !== "selection" &&
        key16 !== "effect"
      ) {
        const err96 = {
          instancePath:
            instancePath + "/" + key16.replace(/~/g, "~0").replace(/\//g, "~1"),
          schemaPath: "",
          keyword: "properties",
          params: { error: "additional", additionalProperty: key16 },
          message: "must NOT have additional properties",
        };
        if (vErrors === null) {
          vErrors = [err96];
        } else {
          vErrors.push(err96);
        }
        errors++;
      }
    }
  }
  if (!valid0) {
    const err97 = {
      instancePath,
      schemaPath: "/properties",
      keyword: "properties",
      params: { type: "object", nullable: false },
      message: "must be object",
    };
    if (vErrors === null) {
      vErrors = [err97];
    } else {
      vErrors.push(err97);
    }
    errors++;
  }
  validate66.errors = vErrors;
  return errors === 0;
}
