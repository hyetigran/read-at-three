"use strict";
export const validatePreparationInput = validate57;
const schema29 = {
  discriminator: "kind",
  mapping: {
    unavailable: { properties: { reason: { enum: ["missing", "invalid"] } } },
    available: { properties: { package: {} } },
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
        if (data.reason !== undefined) {
          let data0 = data.reason;
          if (!(
            typeof data0 == "string" &&
            (data0 === "missing" || data0 === "invalid")
          )) {
            const err1 = {
              instancePath: instancePath + "/reason",
              schemaPath: "/mapping/unavailable/properties/reason/enum",
              keyword: "enum",
              params: {
                allowedValues:
                  schema29.mapping.unavailable.properties.reason.enum,
              },
              message: "must be equal to one of the allowed values",
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
            schemaPath: "/mapping/unavailable/properties/reason",
            keyword: "properties",
            params: { error: "missing", missingProperty: "reason" },
            message: "must have property 'reason'",
          };
          if (vErrors === null) {
            vErrors = [err2];
          } else {
            vErrors.push(err2);
          }
          errors++;
        }
        for (const key0 in data) {
          if (key0 !== "kind" && key0 !== "reason") {
            const err3 = {
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
              vErrors = [err3];
            } else {
              vErrors.push(err3);
            }
            errors++;
          }
        }
        if (!valid2) {
          const err4 = {
            instancePath,
            schemaPath: "/mapping/unavailable/properties",
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
        var valid1 = _errs0 === errors;
        valid0 = valid1;
      } else if (tag0 === "available") {
        const _errs2 = errors;
        let valid6 = false;
        valid6 = true;
        for (const key1 in data) {
          if (key1 !== "kind" && key1 !== "package") {
            const err5 = {
              instancePath:
                instancePath +
                "/" +
                key1.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/available",
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
            schemaPath: "/mapping/available/properties",
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
        var valid5 = _errs2 === errors;
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
  validate57.errors = vErrors;
  return errors === 0;
}
export const validatePreparationPackage = validate58;
const schema30 = {
  properties: {
    formatVersion: { type: "uint32" },
    preparationHash: { type: "string" },
    body: {
      properties: {
        documentId: { type: "string" },
        title: {
          properties: {
            copy: {
              discriminator: "kind",
              mapping: {
                added: { properties: { text: { type: "string" } } },
                source: {
                  properties: {
                    text: { type: "string" },
                    sourceRef: { type: "string" },
                  },
                },
                adapted: {
                  properties: {
                    text: { type: "string" },
                    sourceRef: { type: "string" },
                  },
                },
              },
            },
            marks: {
              elements: {
                properties: {
                  kind: { enum: ["bold", "italic", "underline"] },
                  start: { type: "uint32" },
                  length: { type: "uint32" },
                },
              },
            },
          },
        },
        reviewHash: { type: "string" },
        provenance: {
          properties: {
            kind: { enum: ["synthetic", "sourceReviewed"] },
            reviewId: { type: "string" },
            compositionHash: { type: "string" },
            reviews: {
              elements: {
                properties: {
                  id: { type: "string" },
                  sha256: { type: "string" },
                },
              },
            },
            sources: {
              elements: {
                properties: {
                  sourceRef: { type: "string" },
                  sourceKey: { type: "string" },
                  documentId: { type: "string" },
                  pdfPages: { elements: { type: "uint32" } },
                  printedPages: {
                    elements: { type: "uint32", nullable: true },
                  },
                  textHash: { type: "string" },
                  parentTextHash: { type: "string" },
                  start: { type: "uint32" },
                  length: { type: "uint32" },
                },
              },
            },
          },
        },
        sections: {
          elements: {
            properties: {
              id: { type: "string" },
              title: {
                properties: {
                  copy: {
                    discriminator: "kind",
                    mapping: {
                      added: { properties: { text: { type: "string" } } },
                      source: {
                        properties: {
                          text: { type: "string" },
                          sourceRef: { type: "string" },
                        },
                      },
                      adapted: {
                        properties: {
                          text: { type: "string" },
                          sourceRef: { type: "string" },
                        },
                      },
                    },
                  },
                  marks: {
                    elements: {
                      properties: {
                        kind: { enum: ["bold", "italic", "underline"] },
                        start: { type: "uint32" },
                        length: { type: "uint32" },
                      },
                    },
                  },
                },
              },
              blocks: {
                elements: {
                  discriminator: "kind",
                  mapping: {
                    paragraph: {
                      properties: {
                        id: { type: "string" },
                        role: { enum: ["guidance", "action", "speech"] },
                        content: {
                          properties: {
                            copy: {
                              discriminator: "kind",
                              mapping: {
                                added: {
                                  properties: { text: { type: "string" } },
                                },
                                source: {
                                  properties: {
                                    text: { type: "string" },
                                    sourceRef: { type: "string" },
                                  },
                                },
                                adapted: {
                                  properties: {
                                    text: { type: "string" },
                                    sourceRef: { type: "string" },
                                  },
                                },
                              },
                            },
                            marks: {
                              elements: {
                                properties: {
                                  kind: {
                                    enum: ["bold", "italic", "underline"],
                                  },
                                  start: { type: "uint32" },
                                  length: { type: "uint32" },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                    list: {
                      properties: {
                        id: { type: "string" },
                        ordered: { type: "boolean" },
                        items: {
                          elements: {
                            properties: {
                              copy: {
                                discriminator: "kind",
                                mapping: {
                                  added: {
                                    properties: { text: { type: "string" } },
                                  },
                                  source: {
                                    properties: {
                                      text: { type: "string" },
                                      sourceRef: { type: "string" },
                                    },
                                  },
                                  adapted: {
                                    properties: {
                                      text: { type: "string" },
                                      sourceRef: { type: "string" },
                                    },
                                  },
                                },
                              },
                              marks: {
                                elements: {
                                  properties: {
                                    kind: {
                                      enum: ["bold", "italic", "underline"],
                                    },
                                    start: { type: "uint32" },
                                    length: { type: "uint32" },
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                    table: {
                      properties: {
                        id: { type: "string" },
                        caption: {
                          properties: {
                            copy: {
                              discriminator: "kind",
                              mapping: {
                                added: {
                                  properties: { text: { type: "string" } },
                                },
                                source: {
                                  properties: {
                                    text: { type: "string" },
                                    sourceRef: { type: "string" },
                                  },
                                },
                                adapted: {
                                  properties: {
                                    text: { type: "string" },
                                    sourceRef: { type: "string" },
                                  },
                                },
                              },
                            },
                            marks: {
                              elements: {
                                properties: {
                                  kind: {
                                    enum: ["bold", "italic", "underline"],
                                  },
                                  start: { type: "uint32" },
                                  length: { type: "uint32" },
                                },
                              },
                            },
                          },
                        },
                        headers: {
                          elements: {
                            properties: {
                              copy: {
                                discriminator: "kind",
                                mapping: {
                                  added: {
                                    properties: { text: { type: "string" } },
                                  },
                                  source: {
                                    properties: {
                                      text: { type: "string" },
                                      sourceRef: { type: "string" },
                                    },
                                  },
                                  adapted: {
                                    properties: {
                                      text: { type: "string" },
                                      sourceRef: { type: "string" },
                                    },
                                  },
                                },
                              },
                              marks: {
                                elements: {
                                  properties: {
                                    kind: {
                                      enum: ["bold", "italic", "underline"],
                                    },
                                    start: { type: "uint32" },
                                    length: { type: "uint32" },
                                  },
                                },
                              },
                            },
                          },
                        },
                        rows: {
                          elements: {
                            properties: {
                              cells: {
                                elements: {
                                  properties: {
                                    lines: {
                                      elements: {
                                        properties: {
                                          copy: {
                                            discriminator: "kind",
                                            mapping: {
                                              added: {
                                                properties: {
                                                  text: { type: "string" },
                                                },
                                              },
                                              source: {
                                                properties: {
                                                  text: { type: "string" },
                                                  sourceRef: { type: "string" },
                                                },
                                              },
                                              adapted: {
                                                properties: {
                                                  text: { type: "string" },
                                                  sourceRef: { type: "string" },
                                                },
                                              },
                                            },
                                          },
                                          marks: {
                                            elements: {
                                              properties: {
                                                kind: {
                                                  enum: [
                                                    "bold",
                                                    "italic",
                                                    "underline",
                                                  ],
                                                },
                                                start: { type: "uint32" },
                                                length: { type: "uint32" },
                                              },
                                            },
                                          },
                                        },
                                      },
                                    },
                                  },
                                  optionalProperties: {
                                    symbol: { enum: ["m", "s", "a", "ē"] },
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                    diagram: {
                      properties: {
                        id: { type: "string" },
                        assetId: { type: "string" },
                        caption: {
                          properties: {
                            copy: {
                              discriminator: "kind",
                              mapping: {
                                added: {
                                  properties: { text: { type: "string" } },
                                },
                                source: {
                                  properties: {
                                    text: { type: "string" },
                                    sourceRef: { type: "string" },
                                  },
                                },
                                adapted: {
                                  properties: {
                                    text: { type: "string" },
                                    sourceRef: { type: "string" },
                                  },
                                },
                              },
                            },
                            marks: {
                              elements: {
                                properties: {
                                  kind: {
                                    enum: ["bold", "italic", "underline"],
                                  },
                                  start: { type: "uint32" },
                                  length: { type: "uint32" },
                                },
                              },
                            },
                          },
                        },
                        alt: {
                          properties: {
                            copy: {
                              discriminator: "kind",
                              mapping: {
                                added: {
                                  properties: { text: { type: "string" } },
                                },
                                source: {
                                  properties: {
                                    text: { type: "string" },
                                    sourceRef: { type: "string" },
                                  },
                                },
                                adapted: {
                                  properties: {
                                    text: { type: "string" },
                                    sourceRef: { type: "string" },
                                  },
                                },
                              },
                            },
                            marks: {
                              elements: {
                                properties: {
                                  kind: {
                                    enum: ["bold", "italic", "underline"],
                                  },
                                  start: { type: "uint32" },
                                  length: { type: "uint32" },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                    reference: {
                      properties: {
                        id: { type: "string" },
                        label: {
                          properties: {
                            copy: {
                              discriminator: "kind",
                              mapping: {
                                added: {
                                  properties: { text: { type: "string" } },
                                },
                                source: {
                                  properties: {
                                    text: { type: "string" },
                                    sourceRef: { type: "string" },
                                  },
                                },
                                adapted: {
                                  properties: {
                                    text: { type: "string" },
                                    sourceRef: { type: "string" },
                                  },
                                },
                              },
                            },
                            marks: {
                              elements: {
                                properties: {
                                  kind: {
                                    enum: ["bold", "italic", "underline"],
                                  },
                                  start: { type: "uint32" },
                                  length: { type: "uint32" },
                                },
                              },
                            },
                          },
                        },
                        target: {
                          discriminator: "kind",
                          mapping: {
                            section: {
                              properties: { sectionId: { type: "string" } },
                            },
                            lessonTask: {
                              properties: {
                                lesson: { type: "uint32" },
                                task: { type: "uint32" },
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
          },
        },
        assets: {
          elements: {
            properties: {
              id: { type: "string" },
              path: { type: "string" },
              sha256: { type: "string" },
              byteLength: { type: "uint32" },
              mediaType: { enum: ["image/svg+xml"] },
            },
          },
        },
      },
    },
    assets: {
      elements: {
        properties: { path: { type: "string" }, svg: { type: "string" } },
      },
    },
  },
};
const func0 = Object.prototype.hasOwnProperty;
function validate58(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  let valid0 = false;
  if (data && typeof data == "object" && !Array.isArray(data)) {
    valid0 = true;
    if (data.formatVersion !== undefined) {
      let data0 = data.formatVersion;
      if (!(
        typeof data0 == "number" &&
        isFinite(data0) &&
        !(data0 % 1) &&
        data0 >= 0 &&
        data0 <= 4294967295
      )) {
        const err0 = {
          instancePath: instancePath + "/formatVersion",
          schemaPath: "/properties/formatVersion/type",
          keyword: "type",
          params: { type: "uint32", nullable: false },
          message: "must be uint32",
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
        schemaPath: "/properties/formatVersion",
        keyword: "properties",
        params: { error: "missing", missingProperty: "formatVersion" },
        message: "must have property 'formatVersion'",
      };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.preparationHash !== undefined) {
      if (!(typeof data.preparationHash == "string")) {
        const err2 = {
          instancePath: instancePath + "/preparationHash",
          schemaPath: "/properties/preparationHash/type",
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
        schemaPath: "/properties/preparationHash",
        keyword: "properties",
        params: { error: "missing", missingProperty: "preparationHash" },
        message: "must have property 'preparationHash'",
      };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    if (data.body !== undefined) {
      let data2 = data.body;
      let valid2 = false;
      if (data2 && typeof data2 == "object" && !Array.isArray(data2)) {
        valid2 = true;
        if (data2.documentId !== undefined) {
          if (!(typeof data2.documentId == "string")) {
            const err4 = {
              instancePath: instancePath + "/body/documentId",
              schemaPath: "/properties/body/properties/documentId/type",
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
            instancePath: instancePath + "/body",
            schemaPath: "/properties/body/properties/documentId",
            keyword: "properties",
            params: { error: "missing", missingProperty: "documentId" },
            message: "must have property 'documentId'",
          };
          if (vErrors === null) {
            vErrors = [err5];
          } else {
            vErrors.push(err5);
          }
          errors++;
        }
        if (data2.title !== undefined) {
          let data4 = data2.title;
          let valid4 = false;
          if (data4 && typeof data4 == "object" && !Array.isArray(data4)) {
            valid4 = true;
            if (data4.copy !== undefined) {
              let data5 = data4.copy;
              let valid6 = false;
              if (data5 && typeof data5 == "object" && !Array.isArray(data5)) {
                const tag0 = data5.kind;
                if (tag0 === undefined) {
                  const err6 = {
                    instancePath: instancePath + "/body/title/copy",
                    schemaPath:
                      "/properties/body/properties/title/properties/copy/discriminator",
                    keyword: "discriminator",
                    params: { error: "tag", tag: "kind", tagValue: tag0 },
                    message: 'tag "kind" must be string',
                  };
                  if (vErrors === null) {
                    vErrors = [err6];
                  } else {
                    vErrors.push(err6);
                  }
                  errors++;
                } else if (typeof tag0 == "string") {
                  if (tag0 === "added") {
                    const _errs6 = errors;
                    let valid8 = false;
                    valid8 = true;
                    if (data5.text !== undefined) {
                      if (!(typeof data5.text == "string")) {
                        const err7 = {
                          instancePath: instancePath + "/body/title/copy/text",
                          schemaPath:
                            "/properties/body/properties/title/properties/copy/mapping/added/properties/text/type",
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
                        instancePath: instancePath + "/body/title/copy",
                        schemaPath:
                          "/properties/body/properties/title/properties/copy/mapping/added/properties/text",
                        keyword: "properties",
                        params: { error: "missing", missingProperty: "text" },
                        message: "must have property 'text'",
                      };
                      if (vErrors === null) {
                        vErrors = [err8];
                      } else {
                        vErrors.push(err8);
                      }
                      errors++;
                    }
                    for (const key0 in data5) {
                      if (key0 !== "kind" && key0 !== "text") {
                        const err9 = {
                          instancePath:
                            instancePath +
                            "/body/title/copy/" +
                            key0.replace(/~/g, "~0").replace(/\//g, "~1"),
                          schemaPath:
                            "/properties/body/properties/title/properties/copy/mapping/added",
                          keyword: "properties",
                          params: {
                            error: "additional",
                            additionalProperty: key0,
                          },
                          message: "must NOT have additional properties",
                        };
                        if (vErrors === null) {
                          vErrors = [err9];
                        } else {
                          vErrors.push(err9);
                        }
                        errors++;
                      }
                    }
                    if (!valid8) {
                      const err10 = {
                        instancePath: instancePath + "/body/title/copy",
                        schemaPath:
                          "/properties/body/properties/title/properties/copy/mapping/added/properties",
                        keyword: "properties",
                        params: { type: "object", nullable: false },
                        message: "must be object",
                      };
                      if (vErrors === null) {
                        vErrors = [err10];
                      } else {
                        vErrors.push(err10);
                      }
                      errors++;
                    }
                    var valid7 = _errs6 === errors;
                    valid6 = valid7;
                  } else if (tag0 === "source") {
                    const _errs8 = errors;
                    let valid12 = false;
                    valid12 = true;
                    if (data5.text !== undefined) {
                      if (!(typeof data5.text == "string")) {
                        const err11 = {
                          instancePath: instancePath + "/body/title/copy/text",
                          schemaPath:
                            "/properties/body/properties/title/properties/copy/mapping/source/properties/text/type",
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
                        instancePath: instancePath + "/body/title/copy",
                        schemaPath:
                          "/properties/body/properties/title/properties/copy/mapping/source/properties/text",
                        keyword: "properties",
                        params: { error: "missing", missingProperty: "text" },
                        message: "must have property 'text'",
                      };
                      if (vErrors === null) {
                        vErrors = [err12];
                      } else {
                        vErrors.push(err12);
                      }
                      errors++;
                    }
                    if (data5.sourceRef !== undefined) {
                      if (!(typeof data5.sourceRef == "string")) {
                        const err13 = {
                          instancePath:
                            instancePath + "/body/title/copy/sourceRef",
                          schemaPath:
                            "/properties/body/properties/title/properties/copy/mapping/source/properties/sourceRef/type",
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
                        instancePath: instancePath + "/body/title/copy",
                        schemaPath:
                          "/properties/body/properties/title/properties/copy/mapping/source/properties/sourceRef",
                        keyword: "properties",
                        params: {
                          error: "missing",
                          missingProperty: "sourceRef",
                        },
                        message: "must have property 'sourceRef'",
                      };
                      if (vErrors === null) {
                        vErrors = [err14];
                      } else {
                        vErrors.push(err14);
                      }
                      errors++;
                    }
                    for (const key1 in data5) {
                      if (
                        key1 !== "kind" &&
                        key1 !== "text" &&
                        key1 !== "sourceRef"
                      ) {
                        const err15 = {
                          instancePath:
                            instancePath +
                            "/body/title/copy/" +
                            key1.replace(/~/g, "~0").replace(/\//g, "~1"),
                          schemaPath:
                            "/properties/body/properties/title/properties/copy/mapping/source",
                          keyword: "properties",
                          params: {
                            error: "additional",
                            additionalProperty: key1,
                          },
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
                    if (!valid12) {
                      const err16 = {
                        instancePath: instancePath + "/body/title/copy",
                        schemaPath:
                          "/properties/body/properties/title/properties/copy/mapping/source/properties",
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
                    var valid11 = _errs8 === errors;
                    valid6 = valid11;
                  } else if (tag0 === "adapted") {
                    const _errs11 = errors;
                    let valid16 = false;
                    valid16 = true;
                    if (data5.text !== undefined) {
                      if (!(typeof data5.text == "string")) {
                        const err17 = {
                          instancePath: instancePath + "/body/title/copy/text",
                          schemaPath:
                            "/properties/body/properties/title/properties/copy/mapping/adapted/properties/text/type",
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
                        instancePath: instancePath + "/body/title/copy",
                        schemaPath:
                          "/properties/body/properties/title/properties/copy/mapping/adapted/properties/text",
                        keyword: "properties",
                        params: { error: "missing", missingProperty: "text" },
                        message: "must have property 'text'",
                      };
                      if (vErrors === null) {
                        vErrors = [err18];
                      } else {
                        vErrors.push(err18);
                      }
                      errors++;
                    }
                    if (data5.sourceRef !== undefined) {
                      if (!(typeof data5.sourceRef == "string")) {
                        const err19 = {
                          instancePath:
                            instancePath + "/body/title/copy/sourceRef",
                          schemaPath:
                            "/properties/body/properties/title/properties/copy/mapping/adapted/properties/sourceRef/type",
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
                        instancePath: instancePath + "/body/title/copy",
                        schemaPath:
                          "/properties/body/properties/title/properties/copy/mapping/adapted/properties/sourceRef",
                        keyword: "properties",
                        params: {
                          error: "missing",
                          missingProperty: "sourceRef",
                        },
                        message: "must have property 'sourceRef'",
                      };
                      if (vErrors === null) {
                        vErrors = [err20];
                      } else {
                        vErrors.push(err20);
                      }
                      errors++;
                    }
                    for (const key2 in data5) {
                      if (
                        key2 !== "kind" &&
                        key2 !== "text" &&
                        key2 !== "sourceRef"
                      ) {
                        const err21 = {
                          instancePath:
                            instancePath +
                            "/body/title/copy/" +
                            key2.replace(/~/g, "~0").replace(/\//g, "~1"),
                          schemaPath:
                            "/properties/body/properties/title/properties/copy/mapping/adapted",
                          keyword: "properties",
                          params: {
                            error: "additional",
                            additionalProperty: key2,
                          },
                          message: "must NOT have additional properties",
                        };
                        if (vErrors === null) {
                          vErrors = [err21];
                        } else {
                          vErrors.push(err21);
                        }
                        errors++;
                      }
                    }
                    if (!valid16) {
                      const err22 = {
                        instancePath: instancePath + "/body/title/copy",
                        schemaPath:
                          "/properties/body/properties/title/properties/copy/mapping/adapted/properties",
                        keyword: "properties",
                        params: { type: "object", nullable: false },
                        message: "must be object",
                      };
                      if (vErrors === null) {
                        vErrors = [err22];
                      } else {
                        vErrors.push(err22);
                      }
                      errors++;
                    }
                    var valid15 = _errs11 === errors;
                    valid6 = valid15;
                  } else {
                    const err23 = {
                      instancePath: instancePath + "/body/title/copy/kind",
                      schemaPath:
                        "/properties/body/properties/title/properties/copy/mapping",
                      keyword: "discriminator",
                      params: { error: "mapping", tag: "kind", tagValue: tag0 },
                      message: 'value of tag "kind" must be in mapping',
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
                    instancePath: instancePath + "/body/title/copy/kind",
                    schemaPath:
                      "/properties/body/properties/title/properties/copy/discriminator",
                    keyword: "discriminator",
                    params: { error: "tag", tag: "kind", tagValue: tag0 },
                    message: 'tag "kind" must be string',
                  };
                  if (vErrors === null) {
                    vErrors = [err24];
                  } else {
                    vErrors.push(err24);
                  }
                  errors++;
                }
              } else if (!valid6) {
                const err25 = {
                  instancePath: instancePath + "/body/title/copy",
                  schemaPath:
                    "/properties/body/properties/title/properties/copy/discriminator",
                  keyword: "discriminator",
                  params: { type: "object", nullable: false },
                  message: "must be object",
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
                instancePath: instancePath + "/body/title",
                schemaPath: "/properties/body/properties/title/properties/copy",
                keyword: "properties",
                params: { error: "missing", missingProperty: "copy" },
                message: "must have property 'copy'",
              };
              if (vErrors === null) {
                vErrors = [err26];
              } else {
                vErrors.push(err26);
              }
              errors++;
            }
            if (data4.marks !== undefined) {
              let data11 = data4.marks;
              let valid19 = false;
              if (!valid19) {
                if (Array.isArray(data11)) {
                  let valid21 = true;
                  const len0 = data11.length;
                  for (let i0 = 0; i0 < len0; i0++) {
                    let data12 = data11[i0];
                    const _errs15 = errors;
                    let valid22 = false;
                    if (
                      data12 &&
                      typeof data12 == "object" &&
                      !Array.isArray(data12)
                    ) {
                      valid22 = true;
                      if (data12.kind !== undefined) {
                        let data13 = data12.kind;
                        if (!(
                          typeof data13 == "string" &&
                          (data13 === "bold" ||
                            data13 === "italic" ||
                            data13 === "underline")
                        )) {
                          const err27 = {
                            instancePath:
                              instancePath +
                              "/body/title/marks/" +
                              i0 +
                              "/kind",
                            schemaPath:
                              "/properties/body/properties/title/properties/marks/elements/properties/kind/enum",
                            keyword: "enum",
                            params: {
                              allowedValues:
                                schema30.properties.body.properties.title
                                  .properties.marks.elements.properties.kind
                                  .enum,
                            },
                            message:
                              "must be equal to one of the allowed values",
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
                          instancePath:
                            instancePath + "/body/title/marks/" + i0,
                          schemaPath:
                            "/properties/body/properties/title/properties/marks/elements/properties/kind",
                          keyword: "properties",
                          params: { error: "missing", missingProperty: "kind" },
                          message: "must have property 'kind'",
                        };
                        if (vErrors === null) {
                          vErrors = [err28];
                        } else {
                          vErrors.push(err28);
                        }
                        errors++;
                      }
                      if (data12.start !== undefined) {
                        let data14 = data12.start;
                        if (!(
                          typeof data14 == "number" &&
                          isFinite(data14) &&
                          !(data14 % 1) &&
                          data14 >= 0 &&
                          data14 <= 4294967295
                        )) {
                          const err29 = {
                            instancePath:
                              instancePath +
                              "/body/title/marks/" +
                              i0 +
                              "/start",
                            schemaPath:
                              "/properties/body/properties/title/properties/marks/elements/properties/start/type",
                            keyword: "type",
                            params: { type: "uint32", nullable: false },
                            message: "must be uint32",
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
                          instancePath:
                            instancePath + "/body/title/marks/" + i0,
                          schemaPath:
                            "/properties/body/properties/title/properties/marks/elements/properties/start",
                          keyword: "properties",
                          params: {
                            error: "missing",
                            missingProperty: "start",
                          },
                          message: "must have property 'start'",
                        };
                        if (vErrors === null) {
                          vErrors = [err30];
                        } else {
                          vErrors.push(err30);
                        }
                        errors++;
                      }
                      if (data12.length !== undefined) {
                        let data15 = data12.length;
                        if (!(
                          typeof data15 == "number" &&
                          isFinite(data15) &&
                          !(data15 % 1) &&
                          data15 >= 0 &&
                          data15 <= 4294967295
                        )) {
                          const err31 = {
                            instancePath:
                              instancePath +
                              "/body/title/marks/" +
                              i0 +
                              "/length",
                            schemaPath:
                              "/properties/body/properties/title/properties/marks/elements/properties/length/type",
                            keyword: "type",
                            params: { type: "uint32", nullable: false },
                            message: "must be uint32",
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
                          instancePath:
                            instancePath + "/body/title/marks/" + i0,
                          schemaPath:
                            "/properties/body/properties/title/properties/marks/elements/properties/length",
                          keyword: "properties",
                          params: {
                            error: "missing",
                            missingProperty: "length",
                          },
                          message: "must have property 'length'",
                        };
                        if (vErrors === null) {
                          vErrors = [err32];
                        } else {
                          vErrors.push(err32);
                        }
                        errors++;
                      }
                      for (const key3 in data12) {
                        if (
                          key3 !== "kind" &&
                          key3 !== "start" &&
                          key3 !== "length"
                        ) {
                          const err33 = {
                            instancePath:
                              instancePath +
                              "/body/title/marks/" +
                              i0 +
                              "/" +
                              key3.replace(/~/g, "~0").replace(/\//g, "~1"),
                            schemaPath:
                              "/properties/body/properties/title/properties/marks/elements",
                            keyword: "properties",
                            params: {
                              error: "additional",
                              additionalProperty: key3,
                            },
                            message: "must NOT have additional properties",
                          };
                          if (vErrors === null) {
                            vErrors = [err33];
                          } else {
                            vErrors.push(err33);
                          }
                          errors++;
                        }
                      }
                    }
                    if (!valid22) {
                      const err34 = {
                        instancePath: instancePath + "/body/title/marks/" + i0,
                        schemaPath:
                          "/properties/body/properties/title/properties/marks/elements/properties",
                        keyword: "properties",
                        params: { type: "object", nullable: false },
                        message: "must be object",
                      };
                      if (vErrors === null) {
                        vErrors = [err34];
                      } else {
                        vErrors.push(err34);
                      }
                      errors++;
                    }
                    var valid20 = _errs15 === errors;
                    if (!valid20) {
                      valid21 = false;
                    }
                  }
                  valid19 = valid21;
                } else {
                  const err35 = {
                    instancePath: instancePath + "/body/title/marks",
                    schemaPath:
                      "/properties/body/properties/title/properties/marks/elements",
                    keyword: "elements",
                    params: { type: "array", nullable: false },
                    message: "must be array",
                  };
                  if (vErrors === null) {
                    vErrors = [err35];
                  } else {
                    vErrors.push(err35);
                  }
                  errors++;
                }
              }
            } else {
              const err36 = {
                instancePath: instancePath + "/body/title",
                schemaPath:
                  "/properties/body/properties/title/properties/marks",
                keyword: "properties",
                params: { error: "missing", missingProperty: "marks" },
                message: "must have property 'marks'",
              };
              if (vErrors === null) {
                vErrors = [err36];
              } else {
                vErrors.push(err36);
              }
              errors++;
            }
            for (const key4 in data4) {
              if (key4 !== "copy" && key4 !== "marks") {
                const err37 = {
                  instancePath:
                    instancePath +
                    "/body/title/" +
                    key4.replace(/~/g, "~0").replace(/\//g, "~1"),
                  schemaPath: "/properties/body/properties/title",
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
          if (!valid4) {
            const err38 = {
              instancePath: instancePath + "/body/title",
              schemaPath: "/properties/body/properties/title/properties",
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
            instancePath: instancePath + "/body",
            schemaPath: "/properties/body/properties/title",
            keyword: "properties",
            params: { error: "missing", missingProperty: "title" },
            message: "must have property 'title'",
          };
          if (vErrors === null) {
            vErrors = [err39];
          } else {
            vErrors.push(err39);
          }
          errors++;
        }
        if (data2.reviewHash !== undefined) {
          if (!(typeof data2.reviewHash == "string")) {
            const err40 = {
              instancePath: instancePath + "/body/reviewHash",
              schemaPath: "/properties/body/properties/reviewHash/type",
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
            instancePath: instancePath + "/body",
            schemaPath: "/properties/body/properties/reviewHash",
            keyword: "properties",
            params: { error: "missing", missingProperty: "reviewHash" },
            message: "must have property 'reviewHash'",
          };
          if (vErrors === null) {
            vErrors = [err41];
          } else {
            vErrors.push(err41);
          }
          errors++;
        }
        if (data2.provenance !== undefined) {
          let data17 = data2.provenance;
          let valid26 = false;
          if (data17 && typeof data17 == "object" && !Array.isArray(data17)) {
            valid26 = true;
            if (data17.kind !== undefined) {
              let data18 = data17.kind;
              if (!(
                typeof data18 == "string" &&
                (data18 === "synthetic" || data18 === "sourceReviewed")
              )) {
                const err42 = {
                  instancePath: instancePath + "/body/provenance/kind",
                  schemaPath:
                    "/properties/body/properties/provenance/properties/kind/enum",
                  keyword: "enum",
                  params: {
                    allowedValues:
                      schema30.properties.body.properties.provenance.properties
                        .kind.enum,
                  },
                  message: "must be equal to one of the allowed values",
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
                instancePath: instancePath + "/body/provenance",
                schemaPath:
                  "/properties/body/properties/provenance/properties/kind",
                keyword: "properties",
                params: { error: "missing", missingProperty: "kind" },
                message: "must have property 'kind'",
              };
              if (vErrors === null) {
                vErrors = [err43];
              } else {
                vErrors.push(err43);
              }
              errors++;
            }
            if (data17.reviewId !== undefined) {
              if (!(typeof data17.reviewId == "string")) {
                const err44 = {
                  instancePath: instancePath + "/body/provenance/reviewId",
                  schemaPath:
                    "/properties/body/properties/provenance/properties/reviewId/type",
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
                instancePath: instancePath + "/body/provenance",
                schemaPath:
                  "/properties/body/properties/provenance/properties/reviewId",
                keyword: "properties",
                params: { error: "missing", missingProperty: "reviewId" },
                message: "must have property 'reviewId'",
              };
              if (vErrors === null) {
                vErrors = [err45];
              } else {
                vErrors.push(err45);
              }
              errors++;
            }
            if (data17.compositionHash !== undefined) {
              if (!(typeof data17.compositionHash == "string")) {
                const err46 = {
                  instancePath:
                    instancePath + "/body/provenance/compositionHash",
                  schemaPath:
                    "/properties/body/properties/provenance/properties/compositionHash/type",
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
                instancePath: instancePath + "/body/provenance",
                schemaPath:
                  "/properties/body/properties/provenance/properties/compositionHash",
                keyword: "properties",
                params: {
                  error: "missing",
                  missingProperty: "compositionHash",
                },
                message: "must have property 'compositionHash'",
              };
              if (vErrors === null) {
                vErrors = [err47];
              } else {
                vErrors.push(err47);
              }
              errors++;
            }
            if (data17.reviews !== undefined) {
              let data21 = data17.reviews;
              let valid28 = false;
              if (!valid28) {
                if (Array.isArray(data21)) {
                  let valid30 = true;
                  const len1 = data21.length;
                  for (let i1 = 0; i1 < len1; i1++) {
                    let data22 = data21[i1];
                    const _errs25 = errors;
                    let valid31 = false;
                    if (
                      data22 &&
                      typeof data22 == "object" &&
                      !Array.isArray(data22)
                    ) {
                      valid31 = true;
                      if (data22.id !== undefined) {
                        if (!(typeof data22.id == "string")) {
                          const err48 = {
                            instancePath:
                              instancePath +
                              "/body/provenance/reviews/" +
                              i1 +
                              "/id",
                            schemaPath:
                              "/properties/body/properties/provenance/properties/reviews/elements/properties/id/type",
                            keyword: "type",
                            params: { type: "string", nullable: false },
                            message: "must be string",
                          };
                          if (vErrors === null) {
                            vErrors = [err48];
                          } else {
                            vErrors.push(err48);
                          }
                          errors++;
                        }
                      } else {
                        const err49 = {
                          instancePath:
                            instancePath + "/body/provenance/reviews/" + i1,
                          schemaPath:
                            "/properties/body/properties/provenance/properties/reviews/elements/properties/id",
                          keyword: "properties",
                          params: { error: "missing", missingProperty: "id" },
                          message: "must have property 'id'",
                        };
                        if (vErrors === null) {
                          vErrors = [err49];
                        } else {
                          vErrors.push(err49);
                        }
                        errors++;
                      }
                      if (data22.sha256 !== undefined) {
                        if (!(typeof data22.sha256 == "string")) {
                          const err50 = {
                            instancePath:
                              instancePath +
                              "/body/provenance/reviews/" +
                              i1 +
                              "/sha256",
                            schemaPath:
                              "/properties/body/properties/provenance/properties/reviews/elements/properties/sha256/type",
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
                          instancePath:
                            instancePath + "/body/provenance/reviews/" + i1,
                          schemaPath:
                            "/properties/body/properties/provenance/properties/reviews/elements/properties/sha256",
                          keyword: "properties",
                          params: {
                            error: "missing",
                            missingProperty: "sha256",
                          },
                          message: "must have property 'sha256'",
                        };
                        if (vErrors === null) {
                          vErrors = [err51];
                        } else {
                          vErrors.push(err51);
                        }
                        errors++;
                      }
                      for (const key5 in data22) {
                        if (key5 !== "id" && key5 !== "sha256") {
                          const err52 = {
                            instancePath:
                              instancePath +
                              "/body/provenance/reviews/" +
                              i1 +
                              "/" +
                              key5.replace(/~/g, "~0").replace(/\//g, "~1"),
                            schemaPath:
                              "/properties/body/properties/provenance/properties/reviews/elements",
                            keyword: "properties",
                            params: {
                              error: "additional",
                              additionalProperty: key5,
                            },
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
                    }
                    if (!valid31) {
                      const err53 = {
                        instancePath:
                          instancePath + "/body/provenance/reviews/" + i1,
                        schemaPath:
                          "/properties/body/properties/provenance/properties/reviews/elements/properties",
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
                    var valid29 = _errs25 === errors;
                    if (!valid29) {
                      valid30 = false;
                    }
                  }
                  valid28 = valid30;
                } else {
                  const err54 = {
                    instancePath: instancePath + "/body/provenance/reviews",
                    schemaPath:
                      "/properties/body/properties/provenance/properties/reviews/elements",
                    keyword: "elements",
                    params: { type: "array", nullable: false },
                    message: "must be array",
                  };
                  if (vErrors === null) {
                    vErrors = [err54];
                  } else {
                    vErrors.push(err54);
                  }
                  errors++;
                }
              }
            } else {
              const err55 = {
                instancePath: instancePath + "/body/provenance",
                schemaPath:
                  "/properties/body/properties/provenance/properties/reviews",
                keyword: "properties",
                params: { error: "missing", missingProperty: "reviews" },
                message: "must have property 'reviews'",
              };
              if (vErrors === null) {
                vErrors = [err55];
              } else {
                vErrors.push(err55);
              }
              errors++;
            }
            if (data17.sources !== undefined) {
              let data25 = data17.sources;
              let valid34 = false;
              if (!valid34) {
                if (Array.isArray(data25)) {
                  let valid36 = true;
                  const len2 = data25.length;
                  for (let i2 = 0; i2 < len2; i2++) {
                    let data26 = data25[i2];
                    const _errs29 = errors;
                    let valid37 = false;
                    if (
                      data26 &&
                      typeof data26 == "object" &&
                      !Array.isArray(data26)
                    ) {
                      valid37 = true;
                      if (data26.sourceRef !== undefined) {
                        if (!(typeof data26.sourceRef == "string")) {
                          const err56 = {
                            instancePath:
                              instancePath +
                              "/body/provenance/sources/" +
                              i2 +
                              "/sourceRef",
                            schemaPath:
                              "/properties/body/properties/provenance/properties/sources/elements/properties/sourceRef/type",
                            keyword: "type",
                            params: { type: "string", nullable: false },
                            message: "must be string",
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
                          instancePath:
                            instancePath + "/body/provenance/sources/" + i2,
                          schemaPath:
                            "/properties/body/properties/provenance/properties/sources/elements/properties/sourceRef",
                          keyword: "properties",
                          params: {
                            error: "missing",
                            missingProperty: "sourceRef",
                          },
                          message: "must have property 'sourceRef'",
                        };
                        if (vErrors === null) {
                          vErrors = [err57];
                        } else {
                          vErrors.push(err57);
                        }
                        errors++;
                      }
                      if (data26.sourceKey !== undefined) {
                        if (!(typeof data26.sourceKey == "string")) {
                          const err58 = {
                            instancePath:
                              instancePath +
                              "/body/provenance/sources/" +
                              i2 +
                              "/sourceKey",
                            schemaPath:
                              "/properties/body/properties/provenance/properties/sources/elements/properties/sourceKey/type",
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
                          instancePath:
                            instancePath + "/body/provenance/sources/" + i2,
                          schemaPath:
                            "/properties/body/properties/provenance/properties/sources/elements/properties/sourceKey",
                          keyword: "properties",
                          params: {
                            error: "missing",
                            missingProperty: "sourceKey",
                          },
                          message: "must have property 'sourceKey'",
                        };
                        if (vErrors === null) {
                          vErrors = [err59];
                        } else {
                          vErrors.push(err59);
                        }
                        errors++;
                      }
                      if (data26.documentId !== undefined) {
                        if (!(typeof data26.documentId == "string")) {
                          const err60 = {
                            instancePath:
                              instancePath +
                              "/body/provenance/sources/" +
                              i2 +
                              "/documentId",
                            schemaPath:
                              "/properties/body/properties/provenance/properties/sources/elements/properties/documentId/type",
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
                          instancePath:
                            instancePath + "/body/provenance/sources/" + i2,
                          schemaPath:
                            "/properties/body/properties/provenance/properties/sources/elements/properties/documentId",
                          keyword: "properties",
                          params: {
                            error: "missing",
                            missingProperty: "documentId",
                          },
                          message: "must have property 'documentId'",
                        };
                        if (vErrors === null) {
                          vErrors = [err61];
                        } else {
                          vErrors.push(err61);
                        }
                        errors++;
                      }
                      if (data26.pdfPages !== undefined) {
                        let data30 = data26.pdfPages;
                        let valid39 = false;
                        if (!valid39) {
                          if (Array.isArray(data30)) {
                            let valid41 = true;
                            const len3 = data30.length;
                            for (let i3 = 0; i3 < len3; i3++) {
                              let data31 = data30[i3];
                              const _errs34 = errors;
                              if (!(
                                typeof data31 == "number" &&
                                isFinite(data31) &&
                                !(data31 % 1) &&
                                data31 >= 0 &&
                                data31 <= 4294967295
                              )) {
                                const err62 = {
                                  instancePath:
                                    instancePath +
                                    "/body/provenance/sources/" +
                                    i2 +
                                    "/pdfPages/" +
                                    i3,
                                  schemaPath:
                                    "/properties/body/properties/provenance/properties/sources/elements/properties/pdfPages/elements/type",
                                  keyword: "type",
                                  params: { type: "uint32", nullable: false },
                                  message: "must be uint32",
                                };
                                if (vErrors === null) {
                                  vErrors = [err62];
                                } else {
                                  vErrors.push(err62);
                                }
                                errors++;
                              }
                              var valid40 = _errs34 === errors;
                              if (!valid40) {
                                valid41 = false;
                              }
                            }
                            valid39 = valid41;
                          } else {
                            const err63 = {
                              instancePath:
                                instancePath +
                                "/body/provenance/sources/" +
                                i2 +
                                "/pdfPages",
                              schemaPath:
                                "/properties/body/properties/provenance/properties/sources/elements/properties/pdfPages/elements",
                              keyword: "elements",
                              params: { type: "array", nullable: false },
                              message: "must be array",
                            };
                            if (vErrors === null) {
                              vErrors = [err63];
                            } else {
                              vErrors.push(err63);
                            }
                            errors++;
                          }
                        }
                      } else {
                        const err64 = {
                          instancePath:
                            instancePath + "/body/provenance/sources/" + i2,
                          schemaPath:
                            "/properties/body/properties/provenance/properties/sources/elements/properties/pdfPages",
                          keyword: "properties",
                          params: {
                            error: "missing",
                            missingProperty: "pdfPages",
                          },
                          message: "must have property 'pdfPages'",
                        };
                        if (vErrors === null) {
                          vErrors = [err64];
                        } else {
                          vErrors.push(err64);
                        }
                        errors++;
                      }
                      if (data26.printedPages !== undefined) {
                        let data32 = data26.printedPages;
                        let valid42 = false;
                        if (!valid42) {
                          if (Array.isArray(data32)) {
                            let valid44 = true;
                            const len4 = data32.length;
                            for (let i4 = 0; i4 < len4; i4++) {
                              let data33 = data32[i4];
                              const _errs36 = errors;
                              if (!(
                                data33 === null ||
                                (typeof data33 == "number" &&
                                  isFinite(data33) &&
                                  !(data33 % 1) &&
                                  data33 >= 0 &&
                                  data33 <= 4294967295)
                              )) {
                                const err65 = {
                                  instancePath:
                                    instancePath +
                                    "/body/provenance/sources/" +
                                    i2 +
                                    "/printedPages/" +
                                    i4,
                                  schemaPath:
                                    "/properties/body/properties/provenance/properties/sources/elements/properties/printedPages/elements/type",
                                  keyword: "type",
                                  params: { type: "uint32", nullable: true },
                                  message: "must be uint32 or null",
                                };
                                if (vErrors === null) {
                                  vErrors = [err65];
                                } else {
                                  vErrors.push(err65);
                                }
                                errors++;
                              }
                              var valid43 = _errs36 === errors;
                              if (!valid43) {
                                valid44 = false;
                              }
                            }
                            valid42 = valid44;
                          } else {
                            const err66 = {
                              instancePath:
                                instancePath +
                                "/body/provenance/sources/" +
                                i2 +
                                "/printedPages",
                              schemaPath:
                                "/properties/body/properties/provenance/properties/sources/elements/properties/printedPages/elements",
                              keyword: "elements",
                              params: { type: "array", nullable: false },
                              message: "must be array",
                            };
                            if (vErrors === null) {
                              vErrors = [err66];
                            } else {
                              vErrors.push(err66);
                            }
                            errors++;
                          }
                        }
                      } else {
                        const err67 = {
                          instancePath:
                            instancePath + "/body/provenance/sources/" + i2,
                          schemaPath:
                            "/properties/body/properties/provenance/properties/sources/elements/properties/printedPages",
                          keyword: "properties",
                          params: {
                            error: "missing",
                            missingProperty: "printedPages",
                          },
                          message: "must have property 'printedPages'",
                        };
                        if (vErrors === null) {
                          vErrors = [err67];
                        } else {
                          vErrors.push(err67);
                        }
                        errors++;
                      }
                      if (data26.textHash !== undefined) {
                        if (!(typeof data26.textHash == "string")) {
                          const err68 = {
                            instancePath:
                              instancePath +
                              "/body/provenance/sources/" +
                              i2 +
                              "/textHash",
                            schemaPath:
                              "/properties/body/properties/provenance/properties/sources/elements/properties/textHash/type",
                            keyword: "type",
                            params: { type: "string", nullable: false },
                            message: "must be string",
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
                          instancePath:
                            instancePath + "/body/provenance/sources/" + i2,
                          schemaPath:
                            "/properties/body/properties/provenance/properties/sources/elements/properties/textHash",
                          keyword: "properties",
                          params: {
                            error: "missing",
                            missingProperty: "textHash",
                          },
                          message: "must have property 'textHash'",
                        };
                        if (vErrors === null) {
                          vErrors = [err69];
                        } else {
                          vErrors.push(err69);
                        }
                        errors++;
                      }
                      if (data26.parentTextHash !== undefined) {
                        if (!(typeof data26.parentTextHash == "string")) {
                          const err70 = {
                            instancePath:
                              instancePath +
                              "/body/provenance/sources/" +
                              i2 +
                              "/parentTextHash",
                            schemaPath:
                              "/properties/body/properties/provenance/properties/sources/elements/properties/parentTextHash/type",
                            keyword: "type",
                            params: { type: "string", nullable: false },
                            message: "must be string",
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
                          instancePath:
                            instancePath + "/body/provenance/sources/" + i2,
                          schemaPath:
                            "/properties/body/properties/provenance/properties/sources/elements/properties/parentTextHash",
                          keyword: "properties",
                          params: {
                            error: "missing",
                            missingProperty: "parentTextHash",
                          },
                          message: "must have property 'parentTextHash'",
                        };
                        if (vErrors === null) {
                          vErrors = [err71];
                        } else {
                          vErrors.push(err71);
                        }
                        errors++;
                      }
                      if (data26.start !== undefined) {
                        let data36 = data26.start;
                        if (!(
                          typeof data36 == "number" &&
                          isFinite(data36) &&
                          !(data36 % 1) &&
                          data36 >= 0 &&
                          data36 <= 4294967295
                        )) {
                          const err72 = {
                            instancePath:
                              instancePath +
                              "/body/provenance/sources/" +
                              i2 +
                              "/start",
                            schemaPath:
                              "/properties/body/properties/provenance/properties/sources/elements/properties/start/type",
                            keyword: "type",
                            params: { type: "uint32", nullable: false },
                            message: "must be uint32",
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
                          instancePath:
                            instancePath + "/body/provenance/sources/" + i2,
                          schemaPath:
                            "/properties/body/properties/provenance/properties/sources/elements/properties/start",
                          keyword: "properties",
                          params: {
                            error: "missing",
                            missingProperty: "start",
                          },
                          message: "must have property 'start'",
                        };
                        if (vErrors === null) {
                          vErrors = [err73];
                        } else {
                          vErrors.push(err73);
                        }
                        errors++;
                      }
                      if (data26.length !== undefined) {
                        let data37 = data26.length;
                        if (!(
                          typeof data37 == "number" &&
                          isFinite(data37) &&
                          !(data37 % 1) &&
                          data37 >= 0 &&
                          data37 <= 4294967295
                        )) {
                          const err74 = {
                            instancePath:
                              instancePath +
                              "/body/provenance/sources/" +
                              i2 +
                              "/length",
                            schemaPath:
                              "/properties/body/properties/provenance/properties/sources/elements/properties/length/type",
                            keyword: "type",
                            params: { type: "uint32", nullable: false },
                            message: "must be uint32",
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
                          instancePath:
                            instancePath + "/body/provenance/sources/" + i2,
                          schemaPath:
                            "/properties/body/properties/provenance/properties/sources/elements/properties/length",
                          keyword: "properties",
                          params: {
                            error: "missing",
                            missingProperty: "length",
                          },
                          message: "must have property 'length'",
                        };
                        if (vErrors === null) {
                          vErrors = [err75];
                        } else {
                          vErrors.push(err75);
                        }
                        errors++;
                      }
                      for (const key6 in data26) {
                        if (
                          !func0.call(
                            schema30.properties.body.properties.provenance
                              .properties.sources.elements.properties,
                            key6,
                          )
                        ) {
                          const err76 = {
                            instancePath:
                              instancePath +
                              "/body/provenance/sources/" +
                              i2 +
                              "/" +
                              key6.replace(/~/g, "~0").replace(/\//g, "~1"),
                            schemaPath:
                              "/properties/body/properties/provenance/properties/sources/elements",
                            keyword: "properties",
                            params: {
                              error: "additional",
                              additionalProperty: key6,
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
                    if (!valid37) {
                      const err77 = {
                        instancePath:
                          instancePath + "/body/provenance/sources/" + i2,
                        schemaPath:
                          "/properties/body/properties/provenance/properties/sources/elements/properties",
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
                    var valid35 = _errs29 === errors;
                    if (!valid35) {
                      valid36 = false;
                    }
                  }
                  valid34 = valid36;
                } else {
                  const err78 = {
                    instancePath: instancePath + "/body/provenance/sources",
                    schemaPath:
                      "/properties/body/properties/provenance/properties/sources/elements",
                    keyword: "elements",
                    params: { type: "array", nullable: false },
                    message: "must be array",
                  };
                  if (vErrors === null) {
                    vErrors = [err78];
                  } else {
                    vErrors.push(err78);
                  }
                  errors++;
                }
              }
            } else {
              const err79 = {
                instancePath: instancePath + "/body/provenance",
                schemaPath:
                  "/properties/body/properties/provenance/properties/sources",
                keyword: "properties",
                params: { error: "missing", missingProperty: "sources" },
                message: "must have property 'sources'",
              };
              if (vErrors === null) {
                vErrors = [err79];
              } else {
                vErrors.push(err79);
              }
              errors++;
            }
            for (const key7 in data17) {
              if (
                key7 !== "kind" &&
                key7 !== "reviewId" &&
                key7 !== "compositionHash" &&
                key7 !== "reviews" &&
                key7 !== "sources"
              ) {
                const err80 = {
                  instancePath:
                    instancePath +
                    "/body/provenance/" +
                    key7.replace(/~/g, "~0").replace(/\//g, "~1"),
                  schemaPath: "/properties/body/properties/provenance",
                  keyword: "properties",
                  params: { error: "additional", additionalProperty: key7 },
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
          if (!valid26) {
            const err81 = {
              instancePath: instancePath + "/body/provenance",
              schemaPath: "/properties/body/properties/provenance/properties",
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
            instancePath: instancePath + "/body",
            schemaPath: "/properties/body/properties/provenance",
            keyword: "properties",
            params: { error: "missing", missingProperty: "provenance" },
            message: "must have property 'provenance'",
          };
          if (vErrors === null) {
            vErrors = [err82];
          } else {
            vErrors.push(err82);
          }
          errors++;
        }
        if (data2.sections !== undefined) {
          let data38 = data2.sections;
          let valid47 = false;
          if (!valid47) {
            if (Array.isArray(data38)) {
              let valid49 = true;
              const len5 = data38.length;
              for (let i5 = 0; i5 < len5; i5++) {
                let data39 = data38[i5];
                const _errs43 = errors;
                let valid50 = false;
                if (
                  data39 &&
                  typeof data39 == "object" &&
                  !Array.isArray(data39)
                ) {
                  valid50 = true;
                  if (data39.id !== undefined) {
                    if (!(typeof data39.id == "string")) {
                      const err83 = {
                        instancePath:
                          instancePath + "/body/sections/" + i5 + "/id",
                        schemaPath:
                          "/properties/body/properties/sections/elements/properties/id/type",
                        keyword: "type",
                        params: { type: "string", nullable: false },
                        message: "must be string",
                      };
                      if (vErrors === null) {
                        vErrors = [err83];
                      } else {
                        vErrors.push(err83);
                      }
                      errors++;
                    }
                  } else {
                    const err84 = {
                      instancePath: instancePath + "/body/sections/" + i5,
                      schemaPath:
                        "/properties/body/properties/sections/elements/properties/id",
                      keyword: "properties",
                      params: { error: "missing", missingProperty: "id" },
                      message: "must have property 'id'",
                    };
                    if (vErrors === null) {
                      vErrors = [err84];
                    } else {
                      vErrors.push(err84);
                    }
                    errors++;
                  }
                  if (data39.title !== undefined) {
                    let data41 = data39.title;
                    let valid52 = false;
                    if (
                      data41 &&
                      typeof data41 == "object" &&
                      !Array.isArray(data41)
                    ) {
                      valid52 = true;
                      if (data41.copy !== undefined) {
                        let data42 = data41.copy;
                        let valid54 = false;
                        if (
                          data42 &&
                          typeof data42 == "object" &&
                          !Array.isArray(data42)
                        ) {
                          const tag1 = data42.kind;
                          if (tag1 === undefined) {
                            const err85 = {
                              instancePath:
                                instancePath +
                                "/body/sections/" +
                                i5 +
                                "/title/copy",
                              schemaPath:
                                "/properties/body/properties/sections/elements/properties/title/properties/copy/discriminator",
                              keyword: "discriminator",
                              params: {
                                error: "tag",
                                tag: "kind",
                                tagValue: tag1,
                              },
                              message: 'tag "kind" must be string',
                            };
                            if (vErrors === null) {
                              vErrors = [err85];
                            } else {
                              vErrors.push(err85);
                            }
                            errors++;
                          } else if (typeof tag1 == "string") {
                            if (tag1 === "added") {
                              const _errs47 = errors;
                              let valid56 = false;
                              valid56 = true;
                              if (data42.text !== undefined) {
                                if (!(typeof data42.text == "string")) {
                                  const err86 = {
                                    instancePath:
                                      instancePath +
                                      "/body/sections/" +
                                      i5 +
                                      "/title/copy/text",
                                    schemaPath:
                                      "/properties/body/properties/sections/elements/properties/title/properties/copy/mapping/added/properties/text/type",
                                    keyword: "type",
                                    params: { type: "string", nullable: false },
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
                                    "/body/sections/" +
                                    i5 +
                                    "/title/copy",
                                  schemaPath:
                                    "/properties/body/properties/sections/elements/properties/title/properties/copy/mapping/added/properties/text",
                                  keyword: "properties",
                                  params: {
                                    error: "missing",
                                    missingProperty: "text",
                                  },
                                  message: "must have property 'text'",
                                };
                                if (vErrors === null) {
                                  vErrors = [err87];
                                } else {
                                  vErrors.push(err87);
                                }
                                errors++;
                              }
                              for (const key8 in data42) {
                                if (key8 !== "kind" && key8 !== "text") {
                                  const err88 = {
                                    instancePath:
                                      instancePath +
                                      "/body/sections/" +
                                      i5 +
                                      "/title/copy/" +
                                      key8
                                        .replace(/~/g, "~0")
                                        .replace(/\//g, "~1"),
                                    schemaPath:
                                      "/properties/body/properties/sections/elements/properties/title/properties/copy/mapping/added",
                                    keyword: "properties",
                                    params: {
                                      error: "additional",
                                      additionalProperty: key8,
                                    },
                                    message:
                                      "must NOT have additional properties",
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err88];
                                  } else {
                                    vErrors.push(err88);
                                  }
                                  errors++;
                                }
                              }
                              if (!valid56) {
                                const err89 = {
                                  instancePath:
                                    instancePath +
                                    "/body/sections/" +
                                    i5 +
                                    "/title/copy",
                                  schemaPath:
                                    "/properties/body/properties/sections/elements/properties/title/properties/copy/mapping/added/properties",
                                  keyword: "properties",
                                  params: { type: "object", nullable: false },
                                  message: "must be object",
                                };
                                if (vErrors === null) {
                                  vErrors = [err89];
                                } else {
                                  vErrors.push(err89);
                                }
                                errors++;
                              }
                              var valid55 = _errs47 === errors;
                              valid54 = valid55;
                            } else if (tag1 === "source") {
                              const _errs49 = errors;
                              let valid60 = false;
                              valid60 = true;
                              if (data42.text !== undefined) {
                                if (!(typeof data42.text == "string")) {
                                  const err90 = {
                                    instancePath:
                                      instancePath +
                                      "/body/sections/" +
                                      i5 +
                                      "/title/copy/text",
                                    schemaPath:
                                      "/properties/body/properties/sections/elements/properties/title/properties/copy/mapping/source/properties/text/type",
                                    keyword: "type",
                                    params: { type: "string", nullable: false },
                                    message: "must be string",
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err90];
                                  } else {
                                    vErrors.push(err90);
                                  }
                                  errors++;
                                }
                              } else {
                                const err91 = {
                                  instancePath:
                                    instancePath +
                                    "/body/sections/" +
                                    i5 +
                                    "/title/copy",
                                  schemaPath:
                                    "/properties/body/properties/sections/elements/properties/title/properties/copy/mapping/source/properties/text",
                                  keyword: "properties",
                                  params: {
                                    error: "missing",
                                    missingProperty: "text",
                                  },
                                  message: "must have property 'text'",
                                };
                                if (vErrors === null) {
                                  vErrors = [err91];
                                } else {
                                  vErrors.push(err91);
                                }
                                errors++;
                              }
                              if (data42.sourceRef !== undefined) {
                                if (!(typeof data42.sourceRef == "string")) {
                                  const err92 = {
                                    instancePath:
                                      instancePath +
                                      "/body/sections/" +
                                      i5 +
                                      "/title/copy/sourceRef",
                                    schemaPath:
                                      "/properties/body/properties/sections/elements/properties/title/properties/copy/mapping/source/properties/sourceRef/type",
                                    keyword: "type",
                                    params: { type: "string", nullable: false },
                                    message: "must be string",
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
                                  instancePath:
                                    instancePath +
                                    "/body/sections/" +
                                    i5 +
                                    "/title/copy",
                                  schemaPath:
                                    "/properties/body/properties/sections/elements/properties/title/properties/copy/mapping/source/properties/sourceRef",
                                  keyword: "properties",
                                  params: {
                                    error: "missing",
                                    missingProperty: "sourceRef",
                                  },
                                  message: "must have property 'sourceRef'",
                                };
                                if (vErrors === null) {
                                  vErrors = [err93];
                                } else {
                                  vErrors.push(err93);
                                }
                                errors++;
                              }
                              for (const key9 in data42) {
                                if (
                                  key9 !== "kind" &&
                                  key9 !== "text" &&
                                  key9 !== "sourceRef"
                                ) {
                                  const err94 = {
                                    instancePath:
                                      instancePath +
                                      "/body/sections/" +
                                      i5 +
                                      "/title/copy/" +
                                      key9
                                        .replace(/~/g, "~0")
                                        .replace(/\//g, "~1"),
                                    schemaPath:
                                      "/properties/body/properties/sections/elements/properties/title/properties/copy/mapping/source",
                                    keyword: "properties",
                                    params: {
                                      error: "additional",
                                      additionalProperty: key9,
                                    },
                                    message:
                                      "must NOT have additional properties",
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err94];
                                  } else {
                                    vErrors.push(err94);
                                  }
                                  errors++;
                                }
                              }
                              if (!valid60) {
                                const err95 = {
                                  instancePath:
                                    instancePath +
                                    "/body/sections/" +
                                    i5 +
                                    "/title/copy",
                                  schemaPath:
                                    "/properties/body/properties/sections/elements/properties/title/properties/copy/mapping/source/properties",
                                  keyword: "properties",
                                  params: { type: "object", nullable: false },
                                  message: "must be object",
                                };
                                if (vErrors === null) {
                                  vErrors = [err95];
                                } else {
                                  vErrors.push(err95);
                                }
                                errors++;
                              }
                              var valid59 = _errs49 === errors;
                              valid54 = valid59;
                            } else if (tag1 === "adapted") {
                              const _errs52 = errors;
                              let valid64 = false;
                              valid64 = true;
                              if (data42.text !== undefined) {
                                if (!(typeof data42.text == "string")) {
                                  const err96 = {
                                    instancePath:
                                      instancePath +
                                      "/body/sections/" +
                                      i5 +
                                      "/title/copy/text",
                                    schemaPath:
                                      "/properties/body/properties/sections/elements/properties/title/properties/copy/mapping/adapted/properties/text/type",
                                    keyword: "type",
                                    params: { type: "string", nullable: false },
                                    message: "must be string",
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err96];
                                  } else {
                                    vErrors.push(err96);
                                  }
                                  errors++;
                                }
                              } else {
                                const err97 = {
                                  instancePath:
                                    instancePath +
                                    "/body/sections/" +
                                    i5 +
                                    "/title/copy",
                                  schemaPath:
                                    "/properties/body/properties/sections/elements/properties/title/properties/copy/mapping/adapted/properties/text",
                                  keyword: "properties",
                                  params: {
                                    error: "missing",
                                    missingProperty: "text",
                                  },
                                  message: "must have property 'text'",
                                };
                                if (vErrors === null) {
                                  vErrors = [err97];
                                } else {
                                  vErrors.push(err97);
                                }
                                errors++;
                              }
                              if (data42.sourceRef !== undefined) {
                                if (!(typeof data42.sourceRef == "string")) {
                                  const err98 = {
                                    instancePath:
                                      instancePath +
                                      "/body/sections/" +
                                      i5 +
                                      "/title/copy/sourceRef",
                                    schemaPath:
                                      "/properties/body/properties/sections/elements/properties/title/properties/copy/mapping/adapted/properties/sourceRef/type",
                                    keyword: "type",
                                    params: { type: "string", nullable: false },
                                    message: "must be string",
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err98];
                                  } else {
                                    vErrors.push(err98);
                                  }
                                  errors++;
                                }
                              } else {
                                const err99 = {
                                  instancePath:
                                    instancePath +
                                    "/body/sections/" +
                                    i5 +
                                    "/title/copy",
                                  schemaPath:
                                    "/properties/body/properties/sections/elements/properties/title/properties/copy/mapping/adapted/properties/sourceRef",
                                  keyword: "properties",
                                  params: {
                                    error: "missing",
                                    missingProperty: "sourceRef",
                                  },
                                  message: "must have property 'sourceRef'",
                                };
                                if (vErrors === null) {
                                  vErrors = [err99];
                                } else {
                                  vErrors.push(err99);
                                }
                                errors++;
                              }
                              for (const key10 in data42) {
                                if (
                                  key10 !== "kind" &&
                                  key10 !== "text" &&
                                  key10 !== "sourceRef"
                                ) {
                                  const err100 = {
                                    instancePath:
                                      instancePath +
                                      "/body/sections/" +
                                      i5 +
                                      "/title/copy/" +
                                      key10
                                        .replace(/~/g, "~0")
                                        .replace(/\//g, "~1"),
                                    schemaPath:
                                      "/properties/body/properties/sections/elements/properties/title/properties/copy/mapping/adapted",
                                    keyword: "properties",
                                    params: {
                                      error: "additional",
                                      additionalProperty: key10,
                                    },
                                    message:
                                      "must NOT have additional properties",
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err100];
                                  } else {
                                    vErrors.push(err100);
                                  }
                                  errors++;
                                }
                              }
                              if (!valid64) {
                                const err101 = {
                                  instancePath:
                                    instancePath +
                                    "/body/sections/" +
                                    i5 +
                                    "/title/copy",
                                  schemaPath:
                                    "/properties/body/properties/sections/elements/properties/title/properties/copy/mapping/adapted/properties",
                                  keyword: "properties",
                                  params: { type: "object", nullable: false },
                                  message: "must be object",
                                };
                                if (vErrors === null) {
                                  vErrors = [err101];
                                } else {
                                  vErrors.push(err101);
                                }
                                errors++;
                              }
                              var valid63 = _errs52 === errors;
                              valid54 = valid63;
                            } else {
                              const err102 = {
                                instancePath:
                                  instancePath +
                                  "/body/sections/" +
                                  i5 +
                                  "/title/copy/kind",
                                schemaPath:
                                  "/properties/body/properties/sections/elements/properties/title/properties/copy/mapping",
                                keyword: "discriminator",
                                params: {
                                  error: "mapping",
                                  tag: "kind",
                                  tagValue: tag1,
                                },
                                message:
                                  'value of tag "kind" must be in mapping',
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
                                "/body/sections/" +
                                i5 +
                                "/title/copy/kind",
                              schemaPath:
                                "/properties/body/properties/sections/elements/properties/title/properties/copy/discriminator",
                              keyword: "discriminator",
                              params: {
                                error: "tag",
                                tag: "kind",
                                tagValue: tag1,
                              },
                              message: 'tag "kind" must be string',
                            };
                            if (vErrors === null) {
                              vErrors = [err103];
                            } else {
                              vErrors.push(err103);
                            }
                            errors++;
                          }
                        } else if (!valid54) {
                          const err104 = {
                            instancePath:
                              instancePath +
                              "/body/sections/" +
                              i5 +
                              "/title/copy",
                            schemaPath:
                              "/properties/body/properties/sections/elements/properties/title/properties/copy/discriminator",
                            keyword: "discriminator",
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
                            instancePath + "/body/sections/" + i5 + "/title",
                          schemaPath:
                            "/properties/body/properties/sections/elements/properties/title/properties/copy",
                          keyword: "properties",
                          params: { error: "missing", missingProperty: "copy" },
                          message: "must have property 'copy'",
                        };
                        if (vErrors === null) {
                          vErrors = [err105];
                        } else {
                          vErrors.push(err105);
                        }
                        errors++;
                      }
                      if (data41.marks !== undefined) {
                        let data48 = data41.marks;
                        let valid67 = false;
                        if (!valid67) {
                          if (Array.isArray(data48)) {
                            let valid69 = true;
                            const len6 = data48.length;
                            for (let i6 = 0; i6 < len6; i6++) {
                              let data49 = data48[i6];
                              const _errs56 = errors;
                              let valid70 = false;
                              if (
                                data49 &&
                                typeof data49 == "object" &&
                                !Array.isArray(data49)
                              ) {
                                valid70 = true;
                                if (data49.kind !== undefined) {
                                  let data50 = data49.kind;
                                  if (!(
                                    typeof data50 == "string" &&
                                    (data50 === "bold" ||
                                      data50 === "italic" ||
                                      data50 === "underline")
                                  )) {
                                    const err106 = {
                                      instancePath:
                                        instancePath +
                                        "/body/sections/" +
                                        i5 +
                                        "/title/marks/" +
                                        i6 +
                                        "/kind",
                                      schemaPath:
                                        "/properties/body/properties/sections/elements/properties/title/properties/marks/elements/properties/kind/enum",
                                      keyword: "enum",
                                      params: {
                                        allowedValues:
                                          schema30.properties.body.properties
                                            .sections.elements.properties.title
                                            .properties.marks.elements
                                            .properties.kind.enum,
                                      },
                                      message:
                                        "must be equal to one of the allowed values",
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
                                      "/body/sections/" +
                                      i5 +
                                      "/title/marks/" +
                                      i6,
                                    schemaPath:
                                      "/properties/body/properties/sections/elements/properties/title/properties/marks/elements/properties/kind",
                                    keyword: "properties",
                                    params: {
                                      error: "missing",
                                      missingProperty: "kind",
                                    },
                                    message: "must have property 'kind'",
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err107];
                                  } else {
                                    vErrors.push(err107);
                                  }
                                  errors++;
                                }
                                if (data49.start !== undefined) {
                                  let data51 = data49.start;
                                  if (!(
                                    typeof data51 == "number" &&
                                    isFinite(data51) &&
                                    !(data51 % 1) &&
                                    data51 >= 0 &&
                                    data51 <= 4294967295
                                  )) {
                                    const err108 = {
                                      instancePath:
                                        instancePath +
                                        "/body/sections/" +
                                        i5 +
                                        "/title/marks/" +
                                        i6 +
                                        "/start",
                                      schemaPath:
                                        "/properties/body/properties/sections/elements/properties/title/properties/marks/elements/properties/start/type",
                                      keyword: "type",
                                      params: {
                                        type: "uint32",
                                        nullable: false,
                                      },
                                      message: "must be uint32",
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
                                      "/body/sections/" +
                                      i5 +
                                      "/title/marks/" +
                                      i6,
                                    schemaPath:
                                      "/properties/body/properties/sections/elements/properties/title/properties/marks/elements/properties/start",
                                    keyword: "properties",
                                    params: {
                                      error: "missing",
                                      missingProperty: "start",
                                    },
                                    message: "must have property 'start'",
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err109];
                                  } else {
                                    vErrors.push(err109);
                                  }
                                  errors++;
                                }
                                if (data49.length !== undefined) {
                                  let data52 = data49.length;
                                  if (!(
                                    typeof data52 == "number" &&
                                    isFinite(data52) &&
                                    !(data52 % 1) &&
                                    data52 >= 0 &&
                                    data52 <= 4294967295
                                  )) {
                                    const err110 = {
                                      instancePath:
                                        instancePath +
                                        "/body/sections/" +
                                        i5 +
                                        "/title/marks/" +
                                        i6 +
                                        "/length",
                                      schemaPath:
                                        "/properties/body/properties/sections/elements/properties/title/properties/marks/elements/properties/length/type",
                                      keyword: "type",
                                      params: {
                                        type: "uint32",
                                        nullable: false,
                                      },
                                      message: "must be uint32",
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
                                      "/body/sections/" +
                                      i5 +
                                      "/title/marks/" +
                                      i6,
                                    schemaPath:
                                      "/properties/body/properties/sections/elements/properties/title/properties/marks/elements/properties/length",
                                    keyword: "properties",
                                    params: {
                                      error: "missing",
                                      missingProperty: "length",
                                    },
                                    message: "must have property 'length'",
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err111];
                                  } else {
                                    vErrors.push(err111);
                                  }
                                  errors++;
                                }
                                for (const key11 in data49) {
                                  if (
                                    key11 !== "kind" &&
                                    key11 !== "start" &&
                                    key11 !== "length"
                                  ) {
                                    const err112 = {
                                      instancePath:
                                        instancePath +
                                        "/body/sections/" +
                                        i5 +
                                        "/title/marks/" +
                                        i6 +
                                        "/" +
                                        key11
                                          .replace(/~/g, "~0")
                                          .replace(/\//g, "~1"),
                                      schemaPath:
                                        "/properties/body/properties/sections/elements/properties/title/properties/marks/elements",
                                      keyword: "properties",
                                      params: {
                                        error: "additional",
                                        additionalProperty: key11,
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
                              if (!valid70) {
                                const err113 = {
                                  instancePath:
                                    instancePath +
                                    "/body/sections/" +
                                    i5 +
                                    "/title/marks/" +
                                    i6,
                                  schemaPath:
                                    "/properties/body/properties/sections/elements/properties/title/properties/marks/elements/properties",
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
                              var valid68 = _errs56 === errors;
                              if (!valid68) {
                                valid69 = false;
                              }
                            }
                            valid67 = valid69;
                          } else {
                            const err114 = {
                              instancePath:
                                instancePath +
                                "/body/sections/" +
                                i5 +
                                "/title/marks",
                              schemaPath:
                                "/properties/body/properties/sections/elements/properties/title/properties/marks/elements",
                              keyword: "elements",
                              params: { type: "array", nullable: false },
                              message: "must be array",
                            };
                            if (vErrors === null) {
                              vErrors = [err114];
                            } else {
                              vErrors.push(err114);
                            }
                            errors++;
                          }
                        }
                      } else {
                        const err115 = {
                          instancePath:
                            instancePath + "/body/sections/" + i5 + "/title",
                          schemaPath:
                            "/properties/body/properties/sections/elements/properties/title/properties/marks",
                          keyword: "properties",
                          params: {
                            error: "missing",
                            missingProperty: "marks",
                          },
                          message: "must have property 'marks'",
                        };
                        if (vErrors === null) {
                          vErrors = [err115];
                        } else {
                          vErrors.push(err115);
                        }
                        errors++;
                      }
                      for (const key12 in data41) {
                        if (key12 !== "copy" && key12 !== "marks") {
                          const err116 = {
                            instancePath:
                              instancePath +
                              "/body/sections/" +
                              i5 +
                              "/title/" +
                              key12.replace(/~/g, "~0").replace(/\//g, "~1"),
                            schemaPath:
                              "/properties/body/properties/sections/elements/properties/title",
                            keyword: "properties",
                            params: {
                              error: "additional",
                              additionalProperty: key12,
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
                    if (!valid52) {
                      const err117 = {
                        instancePath:
                          instancePath + "/body/sections/" + i5 + "/title",
                        schemaPath:
                          "/properties/body/properties/sections/elements/properties/title/properties",
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
                  } else {
                    const err118 = {
                      instancePath: instancePath + "/body/sections/" + i5,
                      schemaPath:
                        "/properties/body/properties/sections/elements/properties/title",
                      keyword: "properties",
                      params: { error: "missing", missingProperty: "title" },
                      message: "must have property 'title'",
                    };
                    if (vErrors === null) {
                      vErrors = [err118];
                    } else {
                      vErrors.push(err118);
                    }
                    errors++;
                  }
                  if (data39.blocks !== undefined) {
                    let data53 = data39.blocks;
                    let valid74 = false;
                    if (!valid74) {
                      if (Array.isArray(data53)) {
                        let valid76 = true;
                        const len7 = data53.length;
                        for (let i7 = 0; i7 < len7; i7++) {
                          let data54 = data53[i7];
                          const _errs61 = errors;
                          let valid77 = false;
                          if (
                            data54 &&
                            typeof data54 == "object" &&
                            !Array.isArray(data54)
                          ) {
                            const tag2 = data54.kind;
                            if (tag2 === undefined) {
                              const err119 = {
                                instancePath:
                                  instancePath +
                                  "/body/sections/" +
                                  i5 +
                                  "/blocks/" +
                                  i7,
                                schemaPath:
                                  "/properties/body/properties/sections/elements/properties/blocks/elements/discriminator",
                                keyword: "discriminator",
                                params: {
                                  error: "tag",
                                  tag: "kind",
                                  tagValue: tag2,
                                },
                                message: 'tag "kind" must be string',
                              };
                              if (vErrors === null) {
                                vErrors = [err119];
                              } else {
                                vErrors.push(err119);
                              }
                              errors++;
                            } else if (typeof tag2 == "string") {
                              if (tag2 === "paragraph") {
                                const _errs62 = errors;
                                let valid79 = false;
                                valid79 = true;
                                if (data54.id !== undefined) {
                                  if (!(typeof data54.id == "string")) {
                                    const err120 = {
                                      instancePath:
                                        instancePath +
                                        "/body/sections/" +
                                        i5 +
                                        "/blocks/" +
                                        i7 +
                                        "/id",
                                      schemaPath:
                                        "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/paragraph/properties/id/type",
                                      keyword: "type",
                                      params: {
                                        type: "string",
                                        nullable: false,
                                      },
                                      message: "must be string",
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
                                    instancePath:
                                      instancePath +
                                      "/body/sections/" +
                                      i5 +
                                      "/blocks/" +
                                      i7,
                                    schemaPath:
                                      "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/paragraph/properties/id",
                                    keyword: "properties",
                                    params: {
                                      error: "missing",
                                      missingProperty: "id",
                                    },
                                    message: "must have property 'id'",
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err121];
                                  } else {
                                    vErrors.push(err121);
                                  }
                                  errors++;
                                }
                                if (data54.role !== undefined) {
                                  let data56 = data54.role;
                                  if (!(
                                    typeof data56 == "string" &&
                                    (data56 === "guidance" ||
                                      data56 === "action" ||
                                      data56 === "speech")
                                  )) {
                                    const err122 = {
                                      instancePath:
                                        instancePath +
                                        "/body/sections/" +
                                        i5 +
                                        "/blocks/" +
                                        i7 +
                                        "/role",
                                      schemaPath:
                                        "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/paragraph/properties/role/enum",
                                      keyword: "enum",
                                      params: {
                                        allowedValues:
                                          schema30.properties.body.properties
                                            .sections.elements.properties.blocks
                                            .elements.mapping.paragraph
                                            .properties.role.enum,
                                      },
                                      message:
                                        "must be equal to one of the allowed values",
                                    };
                                    if (vErrors === null) {
                                      vErrors = [err122];
                                    } else {
                                      vErrors.push(err122);
                                    }
                                    errors++;
                                  }
                                } else {
                                  const err123 = {
                                    instancePath:
                                      instancePath +
                                      "/body/sections/" +
                                      i5 +
                                      "/blocks/" +
                                      i7,
                                    schemaPath:
                                      "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/paragraph/properties/role",
                                    keyword: "properties",
                                    params: {
                                      error: "missing",
                                      missingProperty: "role",
                                    },
                                    message: "must have property 'role'",
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err123];
                                  } else {
                                    vErrors.push(err123);
                                  }
                                  errors++;
                                }
                                if (data54.content !== undefined) {
                                  let data57 = data54.content;
                                  let valid81 = false;
                                  if (
                                    data57 &&
                                    typeof data57 == "object" &&
                                    !Array.isArray(data57)
                                  ) {
                                    valid81 = true;
                                    if (data57.copy !== undefined) {
                                      let data58 = data57.copy;
                                      let valid83 = false;
                                      if (
                                        data58 &&
                                        typeof data58 == "object" &&
                                        !Array.isArray(data58)
                                      ) {
                                        const tag3 = data58.kind;
                                        if (tag3 === undefined) {
                                          const err124 = {
                                            instancePath:
                                              instancePath +
                                              "/body/sections/" +
                                              i5 +
                                              "/blocks/" +
                                              i7 +
                                              "/content/copy",
                                            schemaPath:
                                              "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/paragraph/properties/content/properties/copy/discriminator",
                                            keyword: "discriminator",
                                            params: {
                                              error: "tag",
                                              tag: "kind",
                                              tagValue: tag3,
                                            },
                                            message:
                                              'tag "kind" must be string',
                                          };
                                          if (vErrors === null) {
                                            vErrors = [err124];
                                          } else {
                                            vErrors.push(err124);
                                          }
                                          errors++;
                                        } else if (typeof tag3 == "string") {
                                          if (tag3 === "added") {
                                            const _errs67 = errors;
                                            let valid85 = false;
                                            valid85 = true;
                                            if (data58.text !== undefined) {
                                              if (
                                                !(
                                                  typeof data58.text == "string"
                                                )
                                              ) {
                                                const err125 = {
                                                  instancePath:
                                                    instancePath +
                                                    "/body/sections/" +
                                                    i5 +
                                                    "/blocks/" +
                                                    i7 +
                                                    "/content/copy/text",
                                                  schemaPath:
                                                    "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/paragraph/properties/content/properties/copy/mapping/added/properties/text/type",
                                                  keyword: "type",
                                                  params: {
                                                    type: "string",
                                                    nullable: false,
                                                  },
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
                                                instancePath:
                                                  instancePath +
                                                  "/body/sections/" +
                                                  i5 +
                                                  "/blocks/" +
                                                  i7 +
                                                  "/content/copy",
                                                schemaPath:
                                                  "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/paragraph/properties/content/properties/copy/mapping/added/properties/text",
                                                keyword: "properties",
                                                params: {
                                                  error: "missing",
                                                  missingProperty: "text",
                                                },
                                                message:
                                                  "must have property 'text'",
                                              };
                                              if (vErrors === null) {
                                                vErrors = [err126];
                                              } else {
                                                vErrors.push(err126);
                                              }
                                              errors++;
                                            }
                                            for (const key13 in data58) {
                                              if (
                                                key13 !== "kind" &&
                                                key13 !== "text"
                                              ) {
                                                const err127 = {
                                                  instancePath:
                                                    instancePath +
                                                    "/body/sections/" +
                                                    i5 +
                                                    "/blocks/" +
                                                    i7 +
                                                    "/content/copy/" +
                                                    key13
                                                      .replace(/~/g, "~0")
                                                      .replace(/\//g, "~1"),
                                                  schemaPath:
                                                    "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/paragraph/properties/content/properties/copy/mapping/added",
                                                  keyword: "properties",
                                                  params: {
                                                    error: "additional",
                                                    additionalProperty: key13,
                                                  },
                                                  message:
                                                    "must NOT have additional properties",
                                                };
                                                if (vErrors === null) {
                                                  vErrors = [err127];
                                                } else {
                                                  vErrors.push(err127);
                                                }
                                                errors++;
                                              }
                                            }
                                            if (!valid85) {
                                              const err128 = {
                                                instancePath:
                                                  instancePath +
                                                  "/body/sections/" +
                                                  i5 +
                                                  "/blocks/" +
                                                  i7 +
                                                  "/content/copy",
                                                schemaPath:
                                                  "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/paragraph/properties/content/properties/copy/mapping/added/properties",
                                                keyword: "properties",
                                                params: {
                                                  type: "object",
                                                  nullable: false,
                                                },
                                                message: "must be object",
                                              };
                                              if (vErrors === null) {
                                                vErrors = [err128];
                                              } else {
                                                vErrors.push(err128);
                                              }
                                              errors++;
                                            }
                                            var valid84 = _errs67 === errors;
                                            valid83 = valid84;
                                          } else if (tag3 === "source") {
                                            const _errs69 = errors;
                                            let valid89 = false;
                                            valid89 = true;
                                            if (data58.text !== undefined) {
                                              if (
                                                !(
                                                  typeof data58.text == "string"
                                                )
                                              ) {
                                                const err129 = {
                                                  instancePath:
                                                    instancePath +
                                                    "/body/sections/" +
                                                    i5 +
                                                    "/blocks/" +
                                                    i7 +
                                                    "/content/copy/text",
                                                  schemaPath:
                                                    "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/paragraph/properties/content/properties/copy/mapping/source/properties/text/type",
                                                  keyword: "type",
                                                  params: {
                                                    type: "string",
                                                    nullable: false,
                                                  },
                                                  message: "must be string",
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
                                                instancePath:
                                                  instancePath +
                                                  "/body/sections/" +
                                                  i5 +
                                                  "/blocks/" +
                                                  i7 +
                                                  "/content/copy",
                                                schemaPath:
                                                  "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/paragraph/properties/content/properties/copy/mapping/source/properties/text",
                                                keyword: "properties",
                                                params: {
                                                  error: "missing",
                                                  missingProperty: "text",
                                                },
                                                message:
                                                  "must have property 'text'",
                                              };
                                              if (vErrors === null) {
                                                vErrors = [err130];
                                              } else {
                                                vErrors.push(err130);
                                              }
                                              errors++;
                                            }
                                            if (
                                              data58.sourceRef !== undefined
                                            ) {
                                              if (
                                                !(
                                                  typeof data58.sourceRef ==
                                                  "string"
                                                )
                                              ) {
                                                const err131 = {
                                                  instancePath:
                                                    instancePath +
                                                    "/body/sections/" +
                                                    i5 +
                                                    "/blocks/" +
                                                    i7 +
                                                    "/content/copy/sourceRef",
                                                  schemaPath:
                                                    "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/paragraph/properties/content/properties/copy/mapping/source/properties/sourceRef/type",
                                                  keyword: "type",
                                                  params: {
                                                    type: "string",
                                                    nullable: false,
                                                  },
                                                  message: "must be string",
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
                                                  instancePath +
                                                  "/body/sections/" +
                                                  i5 +
                                                  "/blocks/" +
                                                  i7 +
                                                  "/content/copy",
                                                schemaPath:
                                                  "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/paragraph/properties/content/properties/copy/mapping/source/properties/sourceRef",
                                                keyword: "properties",
                                                params: {
                                                  error: "missing",
                                                  missingProperty: "sourceRef",
                                                },
                                                message:
                                                  "must have property 'sourceRef'",
                                              };
                                              if (vErrors === null) {
                                                vErrors = [err132];
                                              } else {
                                                vErrors.push(err132);
                                              }
                                              errors++;
                                            }
                                            for (const key14 in data58) {
                                              if (
                                                key14 !== "kind" &&
                                                key14 !== "text" &&
                                                key14 !== "sourceRef"
                                              ) {
                                                const err133 = {
                                                  instancePath:
                                                    instancePath +
                                                    "/body/sections/" +
                                                    i5 +
                                                    "/blocks/" +
                                                    i7 +
                                                    "/content/copy/" +
                                                    key14
                                                      .replace(/~/g, "~0")
                                                      .replace(/\//g, "~1"),
                                                  schemaPath:
                                                    "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/paragraph/properties/content/properties/copy/mapping/source",
                                                  keyword: "properties",
                                                  params: {
                                                    error: "additional",
                                                    additionalProperty: key14,
                                                  },
                                                  message:
                                                    "must NOT have additional properties",
                                                };
                                                if (vErrors === null) {
                                                  vErrors = [err133];
                                                } else {
                                                  vErrors.push(err133);
                                                }
                                                errors++;
                                              }
                                            }
                                            if (!valid89) {
                                              const err134 = {
                                                instancePath:
                                                  instancePath +
                                                  "/body/sections/" +
                                                  i5 +
                                                  "/blocks/" +
                                                  i7 +
                                                  "/content/copy",
                                                schemaPath:
                                                  "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/paragraph/properties/content/properties/copy/mapping/source/properties",
                                                keyword: "properties",
                                                params: {
                                                  type: "object",
                                                  nullable: false,
                                                },
                                                message: "must be object",
                                              };
                                              if (vErrors === null) {
                                                vErrors = [err134];
                                              } else {
                                                vErrors.push(err134);
                                              }
                                              errors++;
                                            }
                                            var valid88 = _errs69 === errors;
                                            valid83 = valid88;
                                          } else if (tag3 === "adapted") {
                                            const _errs72 = errors;
                                            let valid93 = false;
                                            valid93 = true;
                                            if (data58.text !== undefined) {
                                              if (
                                                !(
                                                  typeof data58.text == "string"
                                                )
                                              ) {
                                                const err135 = {
                                                  instancePath:
                                                    instancePath +
                                                    "/body/sections/" +
                                                    i5 +
                                                    "/blocks/" +
                                                    i7 +
                                                    "/content/copy/text",
                                                  schemaPath:
                                                    "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/paragraph/properties/content/properties/copy/mapping/adapted/properties/text/type",
                                                  keyword: "type",
                                                  params: {
                                                    type: "string",
                                                    nullable: false,
                                                  },
                                                  message: "must be string",
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
                                                instancePath:
                                                  instancePath +
                                                  "/body/sections/" +
                                                  i5 +
                                                  "/blocks/" +
                                                  i7 +
                                                  "/content/copy",
                                                schemaPath:
                                                  "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/paragraph/properties/content/properties/copy/mapping/adapted/properties/text",
                                                keyword: "properties",
                                                params: {
                                                  error: "missing",
                                                  missingProperty: "text",
                                                },
                                                message:
                                                  "must have property 'text'",
                                              };
                                              if (vErrors === null) {
                                                vErrors = [err136];
                                              } else {
                                                vErrors.push(err136);
                                              }
                                              errors++;
                                            }
                                            if (
                                              data58.sourceRef !== undefined
                                            ) {
                                              if (
                                                !(
                                                  typeof data58.sourceRef ==
                                                  "string"
                                                )
                                              ) {
                                                const err137 = {
                                                  instancePath:
                                                    instancePath +
                                                    "/body/sections/" +
                                                    i5 +
                                                    "/blocks/" +
                                                    i7 +
                                                    "/content/copy/sourceRef",
                                                  schemaPath:
                                                    "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/paragraph/properties/content/properties/copy/mapping/adapted/properties/sourceRef/type",
                                                  keyword: "type",
                                                  params: {
                                                    type: "string",
                                                    nullable: false,
                                                  },
                                                  message: "must be string",
                                                };
                                                if (vErrors === null) {
                                                  vErrors = [err137];
                                                } else {
                                                  vErrors.push(err137);
                                                }
                                                errors++;
                                              }
                                            } else {
                                              const err138 = {
                                                instancePath:
                                                  instancePath +
                                                  "/body/sections/" +
                                                  i5 +
                                                  "/blocks/" +
                                                  i7 +
                                                  "/content/copy",
                                                schemaPath:
                                                  "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/paragraph/properties/content/properties/copy/mapping/adapted/properties/sourceRef",
                                                keyword: "properties",
                                                params: {
                                                  error: "missing",
                                                  missingProperty: "sourceRef",
                                                },
                                                message:
                                                  "must have property 'sourceRef'",
                                              };
                                              if (vErrors === null) {
                                                vErrors = [err138];
                                              } else {
                                                vErrors.push(err138);
                                              }
                                              errors++;
                                            }
                                            for (const key15 in data58) {
                                              if (
                                                key15 !== "kind" &&
                                                key15 !== "text" &&
                                                key15 !== "sourceRef"
                                              ) {
                                                const err139 = {
                                                  instancePath:
                                                    instancePath +
                                                    "/body/sections/" +
                                                    i5 +
                                                    "/blocks/" +
                                                    i7 +
                                                    "/content/copy/" +
                                                    key15
                                                      .replace(/~/g, "~0")
                                                      .replace(/\//g, "~1"),
                                                  schemaPath:
                                                    "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/paragraph/properties/content/properties/copy/mapping/adapted",
                                                  keyword: "properties",
                                                  params: {
                                                    error: "additional",
                                                    additionalProperty: key15,
                                                  },
                                                  message:
                                                    "must NOT have additional properties",
                                                };
                                                if (vErrors === null) {
                                                  vErrors = [err139];
                                                } else {
                                                  vErrors.push(err139);
                                                }
                                                errors++;
                                              }
                                            }
                                            if (!valid93) {
                                              const err140 = {
                                                instancePath:
                                                  instancePath +
                                                  "/body/sections/" +
                                                  i5 +
                                                  "/blocks/" +
                                                  i7 +
                                                  "/content/copy",
                                                schemaPath:
                                                  "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/paragraph/properties/content/properties/copy/mapping/adapted/properties",
                                                keyword: "properties",
                                                params: {
                                                  type: "object",
                                                  nullable: false,
                                                },
                                                message: "must be object",
                                              };
                                              if (vErrors === null) {
                                                vErrors = [err140];
                                              } else {
                                                vErrors.push(err140);
                                              }
                                              errors++;
                                            }
                                            var valid92 = _errs72 === errors;
                                            valid83 = valid92;
                                          } else {
                                            const err141 = {
                                              instancePath:
                                                instancePath +
                                                "/body/sections/" +
                                                i5 +
                                                "/blocks/" +
                                                i7 +
                                                "/content/copy/kind",
                                              schemaPath:
                                                "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/paragraph/properties/content/properties/copy/mapping",
                                              keyword: "discriminator",
                                              params: {
                                                error: "mapping",
                                                tag: "kind",
                                                tagValue: tag3,
                                              },
                                              message:
                                                'value of tag "kind" must be in mapping',
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
                                              "/body/sections/" +
                                              i5 +
                                              "/blocks/" +
                                              i7 +
                                              "/content/copy/kind",
                                            schemaPath:
                                              "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/paragraph/properties/content/properties/copy/discriminator",
                                            keyword: "discriminator",
                                            params: {
                                              error: "tag",
                                              tag: "kind",
                                              tagValue: tag3,
                                            },
                                            message:
                                              'tag "kind" must be string',
                                          };
                                          if (vErrors === null) {
                                            vErrors = [err142];
                                          } else {
                                            vErrors.push(err142);
                                          }
                                          errors++;
                                        }
                                      } else if (!valid83) {
                                        const err143 = {
                                          instancePath:
                                            instancePath +
                                            "/body/sections/" +
                                            i5 +
                                            "/blocks/" +
                                            i7 +
                                            "/content/copy",
                                          schemaPath:
                                            "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/paragraph/properties/content/properties/copy/discriminator",
                                          keyword: "discriminator",
                                          params: {
                                            type: "object",
                                            nullable: false,
                                          },
                                          message: "must be object",
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
                                          "/body/sections/" +
                                          i5 +
                                          "/blocks/" +
                                          i7 +
                                          "/content",
                                        schemaPath:
                                          "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/paragraph/properties/content/properties/copy",
                                        keyword: "properties",
                                        params: {
                                          error: "missing",
                                          missingProperty: "copy",
                                        },
                                        message: "must have property 'copy'",
                                      };
                                      if (vErrors === null) {
                                        vErrors = [err144];
                                      } else {
                                        vErrors.push(err144);
                                      }
                                      errors++;
                                    }
                                    if (data57.marks !== undefined) {
                                      let data64 = data57.marks;
                                      let valid96 = false;
                                      if (!valid96) {
                                        if (Array.isArray(data64)) {
                                          let valid98 = true;
                                          const len8 = data64.length;
                                          for (let i8 = 0; i8 < len8; i8++) {
                                            let data65 = data64[i8];
                                            const _errs76 = errors;
                                            let valid99 = false;
                                            if (
                                              data65 &&
                                              typeof data65 == "object" &&
                                              !Array.isArray(data65)
                                            ) {
                                              valid99 = true;
                                              if (data65.kind !== undefined) {
                                                let data66 = data65.kind;
                                                if (!(
                                                  typeof data66 == "string" &&
                                                  (data66 === "bold" ||
                                                    data66 === "italic" ||
                                                    data66 === "underline")
                                                )) {
                                                  const err145 = {
                                                    instancePath:
                                                      instancePath +
                                                      "/body/sections/" +
                                                      i5 +
                                                      "/blocks/" +
                                                      i7 +
                                                      "/content/marks/" +
                                                      i8 +
                                                      "/kind",
                                                    schemaPath:
                                                      "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/paragraph/properties/content/properties/marks/elements/properties/kind/enum",
                                                    keyword: "enum",
                                                    params: {
                                                      allowedValues:
                                                        schema30.properties.body
                                                          .properties.sections
                                                          .elements.properties
                                                          .blocks.elements
                                                          .mapping.paragraph
                                                          .properties.content
                                                          .properties.marks
                                                          .elements.properties
                                                          .kind.enum,
                                                    },
                                                    message:
                                                      "must be equal to one of the allowed values",
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
                                                    "/body/sections/" +
                                                    i5 +
                                                    "/blocks/" +
                                                    i7 +
                                                    "/content/marks/" +
                                                    i8,
                                                  schemaPath:
                                                    "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/paragraph/properties/content/properties/marks/elements/properties/kind",
                                                  keyword: "properties",
                                                  params: {
                                                    error: "missing",
                                                    missingProperty: "kind",
                                                  },
                                                  message:
                                                    "must have property 'kind'",
                                                };
                                                if (vErrors === null) {
                                                  vErrors = [err146];
                                                } else {
                                                  vErrors.push(err146);
                                                }
                                                errors++;
                                              }
                                              if (data65.start !== undefined) {
                                                let data67 = data65.start;
                                                if (!(
                                                  typeof data67 == "number" &&
                                                  isFinite(data67) &&
                                                  !(data67 % 1) &&
                                                  data67 >= 0 &&
                                                  data67 <= 4294967295
                                                )) {
                                                  const err147 = {
                                                    instancePath:
                                                      instancePath +
                                                      "/body/sections/" +
                                                      i5 +
                                                      "/blocks/" +
                                                      i7 +
                                                      "/content/marks/" +
                                                      i8 +
                                                      "/start",
                                                    schemaPath:
                                                      "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/paragraph/properties/content/properties/marks/elements/properties/start/type",
                                                    keyword: "type",
                                                    params: {
                                                      type: "uint32",
                                                      nullable: false,
                                                    },
                                                    message: "must be uint32",
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
                                                    "/body/sections/" +
                                                    i5 +
                                                    "/blocks/" +
                                                    i7 +
                                                    "/content/marks/" +
                                                    i8,
                                                  schemaPath:
                                                    "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/paragraph/properties/content/properties/marks/elements/properties/start",
                                                  keyword: "properties",
                                                  params: {
                                                    error: "missing",
                                                    missingProperty: "start",
                                                  },
                                                  message:
                                                    "must have property 'start'",
                                                };
                                                if (vErrors === null) {
                                                  vErrors = [err148];
                                                } else {
                                                  vErrors.push(err148);
                                                }
                                                errors++;
                                              }
                                              if (data65.length !== undefined) {
                                                let data68 = data65.length;
                                                if (!(
                                                  typeof data68 == "number" &&
                                                  isFinite(data68) &&
                                                  !(data68 % 1) &&
                                                  data68 >= 0 &&
                                                  data68 <= 4294967295
                                                )) {
                                                  const err149 = {
                                                    instancePath:
                                                      instancePath +
                                                      "/body/sections/" +
                                                      i5 +
                                                      "/blocks/" +
                                                      i7 +
                                                      "/content/marks/" +
                                                      i8 +
                                                      "/length",
                                                    schemaPath:
                                                      "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/paragraph/properties/content/properties/marks/elements/properties/length/type",
                                                    keyword: "type",
                                                    params: {
                                                      type: "uint32",
                                                      nullable: false,
                                                    },
                                                    message: "must be uint32",
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
                                                    "/body/sections/" +
                                                    i5 +
                                                    "/blocks/" +
                                                    i7 +
                                                    "/content/marks/" +
                                                    i8,
                                                  schemaPath:
                                                    "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/paragraph/properties/content/properties/marks/elements/properties/length",
                                                  keyword: "properties",
                                                  params: {
                                                    error: "missing",
                                                    missingProperty: "length",
                                                  },
                                                  message:
                                                    "must have property 'length'",
                                                };
                                                if (vErrors === null) {
                                                  vErrors = [err150];
                                                } else {
                                                  vErrors.push(err150);
                                                }
                                                errors++;
                                              }
                                              for (const key16 in data65) {
                                                if (
                                                  key16 !== "kind" &&
                                                  key16 !== "start" &&
                                                  key16 !== "length"
                                                ) {
                                                  const err151 = {
                                                    instancePath:
                                                      instancePath +
                                                      "/body/sections/" +
                                                      i5 +
                                                      "/blocks/" +
                                                      i7 +
                                                      "/content/marks/" +
                                                      i8 +
                                                      "/" +
                                                      key16
                                                        .replace(/~/g, "~0")
                                                        .replace(/\//g, "~1"),
                                                    schemaPath:
                                                      "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/paragraph/properties/content/properties/marks/elements",
                                                    keyword: "properties",
                                                    params: {
                                                      error: "additional",
                                                      additionalProperty: key16,
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
                                            if (!valid99) {
                                              const err152 = {
                                                instancePath:
                                                  instancePath +
                                                  "/body/sections/" +
                                                  i5 +
                                                  "/blocks/" +
                                                  i7 +
                                                  "/content/marks/" +
                                                  i8,
                                                schemaPath:
                                                  "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/paragraph/properties/content/properties/marks/elements/properties",
                                                keyword: "properties",
                                                params: {
                                                  type: "object",
                                                  nullable: false,
                                                },
                                                message: "must be object",
                                              };
                                              if (vErrors === null) {
                                                vErrors = [err152];
                                              } else {
                                                vErrors.push(err152);
                                              }
                                              errors++;
                                            }
                                            var valid97 = _errs76 === errors;
                                            if (!valid97) {
                                              valid98 = false;
                                            }
                                          }
                                          valid96 = valid98;
                                        } else {
                                          const err153 = {
                                            instancePath:
                                              instancePath +
                                              "/body/sections/" +
                                              i5 +
                                              "/blocks/" +
                                              i7 +
                                              "/content/marks",
                                            schemaPath:
                                              "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/paragraph/properties/content/properties/marks/elements",
                                            keyword: "elements",
                                            params: {
                                              type: "array",
                                              nullable: false,
                                            },
                                            message: "must be array",
                                          };
                                          if (vErrors === null) {
                                            vErrors = [err153];
                                          } else {
                                            vErrors.push(err153);
                                          }
                                          errors++;
                                        }
                                      }
                                    } else {
                                      const err154 = {
                                        instancePath:
                                          instancePath +
                                          "/body/sections/" +
                                          i5 +
                                          "/blocks/" +
                                          i7 +
                                          "/content",
                                        schemaPath:
                                          "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/paragraph/properties/content/properties/marks",
                                        keyword: "properties",
                                        params: {
                                          error: "missing",
                                          missingProperty: "marks",
                                        },
                                        message: "must have property 'marks'",
                                      };
                                      if (vErrors === null) {
                                        vErrors = [err154];
                                      } else {
                                        vErrors.push(err154);
                                      }
                                      errors++;
                                    }
                                    for (const key17 in data57) {
                                      if (
                                        key17 !== "copy" &&
                                        key17 !== "marks"
                                      ) {
                                        const err155 = {
                                          instancePath:
                                            instancePath +
                                            "/body/sections/" +
                                            i5 +
                                            "/blocks/" +
                                            i7 +
                                            "/content/" +
                                            key17
                                              .replace(/~/g, "~0")
                                              .replace(/\//g, "~1"),
                                          schemaPath:
                                            "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/paragraph/properties/content",
                                          keyword: "properties",
                                          params: {
                                            error: "additional",
                                            additionalProperty: key17,
                                          },
                                          message:
                                            "must NOT have additional properties",
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
                                        instancePath +
                                        "/body/sections/" +
                                        i5 +
                                        "/blocks/" +
                                        i7 +
                                        "/content",
                                      schemaPath:
                                        "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/paragraph/properties/content/properties",
                                      keyword: "properties",
                                      params: {
                                        type: "object",
                                        nullable: false,
                                      },
                                      message: "must be object",
                                    };
                                    if (vErrors === null) {
                                      vErrors = [err156];
                                    } else {
                                      vErrors.push(err156);
                                    }
                                    errors++;
                                  }
                                } else {
                                  const err157 = {
                                    instancePath:
                                      instancePath +
                                      "/body/sections/" +
                                      i5 +
                                      "/blocks/" +
                                      i7,
                                    schemaPath:
                                      "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/paragraph/properties/content",
                                    keyword: "properties",
                                    params: {
                                      error: "missing",
                                      missingProperty: "content",
                                    },
                                    message: "must have property 'content'",
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err157];
                                  } else {
                                    vErrors.push(err157);
                                  }
                                  errors++;
                                }
                                for (const key18 in data54) {
                                  if (
                                    key18 !== "kind" &&
                                    key18 !== "id" &&
                                    key18 !== "role" &&
                                    key18 !== "content"
                                  ) {
                                    const err158 = {
                                      instancePath:
                                        instancePath +
                                        "/body/sections/" +
                                        i5 +
                                        "/blocks/" +
                                        i7 +
                                        "/" +
                                        key18
                                          .replace(/~/g, "~0")
                                          .replace(/\//g, "~1"),
                                      schemaPath:
                                        "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/paragraph",
                                      keyword: "properties",
                                      params: {
                                        error: "additional",
                                        additionalProperty: key18,
                                      },
                                      message:
                                        "must NOT have additional properties",
                                    };
                                    if (vErrors === null) {
                                      vErrors = [err158];
                                    } else {
                                      vErrors.push(err158);
                                    }
                                    errors++;
                                  }
                                }
                                if (!valid79) {
                                  const err159 = {
                                    instancePath:
                                      instancePath +
                                      "/body/sections/" +
                                      i5 +
                                      "/blocks/" +
                                      i7,
                                    schemaPath:
                                      "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/paragraph/properties",
                                    keyword: "properties",
                                    params: { type: "object", nullable: false },
                                    message: "must be object",
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err159];
                                  } else {
                                    vErrors.push(err159);
                                  }
                                  errors++;
                                }
                                var valid78 = _errs62 === errors;
                                valid77 = valid78;
                              } else if (tag2 === "list") {
                                const _errs80 = errors;
                                let valid105 = false;
                                valid105 = true;
                                if (data54.id !== undefined) {
                                  if (!(typeof data54.id == "string")) {
                                    const err160 = {
                                      instancePath:
                                        instancePath +
                                        "/body/sections/" +
                                        i5 +
                                        "/blocks/" +
                                        i7 +
                                        "/id",
                                      schemaPath:
                                        "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/list/properties/id/type",
                                      keyword: "type",
                                      params: {
                                        type: "string",
                                        nullable: false,
                                      },
                                      message: "must be string",
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
                                    instancePath:
                                      instancePath +
                                      "/body/sections/" +
                                      i5 +
                                      "/blocks/" +
                                      i7,
                                    schemaPath:
                                      "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/list/properties/id",
                                    keyword: "properties",
                                    params: {
                                      error: "missing",
                                      missingProperty: "id",
                                    },
                                    message: "must have property 'id'",
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err161];
                                  } else {
                                    vErrors.push(err161);
                                  }
                                  errors++;
                                }
                                if (data54.ordered !== undefined) {
                                  if (!(typeof data54.ordered == "boolean")) {
                                    const err162 = {
                                      instancePath:
                                        instancePath +
                                        "/body/sections/" +
                                        i5 +
                                        "/blocks/" +
                                        i7 +
                                        "/ordered",
                                      schemaPath:
                                        "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/list/properties/ordered/type",
                                      keyword: "type",
                                      params: {
                                        type: "boolean",
                                        nullable: false,
                                      },
                                      message: "must be boolean",
                                    };
                                    if (vErrors === null) {
                                      vErrors = [err162];
                                    } else {
                                      vErrors.push(err162);
                                    }
                                    errors++;
                                  }
                                } else {
                                  const err163 = {
                                    instancePath:
                                      instancePath +
                                      "/body/sections/" +
                                      i5 +
                                      "/blocks/" +
                                      i7,
                                    schemaPath:
                                      "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/list/properties/ordered",
                                    keyword: "properties",
                                    params: {
                                      error: "missing",
                                      missingProperty: "ordered",
                                    },
                                    message: "must have property 'ordered'",
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err163];
                                  } else {
                                    vErrors.push(err163);
                                  }
                                  errors++;
                                }
                                if (data54.items !== undefined) {
                                  let data71 = data54.items;
                                  let valid107 = false;
                                  if (!valid107) {
                                    if (Array.isArray(data71)) {
                                      let valid109 = true;
                                      const len9 = data71.length;
                                      for (let i9 = 0; i9 < len9; i9++) {
                                        let data72 = data71[i9];
                                        const _errs84 = errors;
                                        let valid110 = false;
                                        if (
                                          data72 &&
                                          typeof data72 == "object" &&
                                          !Array.isArray(data72)
                                        ) {
                                          valid110 = true;
                                          if (data72.copy !== undefined) {
                                            let data73 = data72.copy;
                                            let valid112 = false;
                                            if (
                                              data73 &&
                                              typeof data73 == "object" &&
                                              !Array.isArray(data73)
                                            ) {
                                              const tag4 = data73.kind;
                                              if (tag4 === undefined) {
                                                const err164 = {
                                                  instancePath:
                                                    instancePath +
                                                    "/body/sections/" +
                                                    i5 +
                                                    "/blocks/" +
                                                    i7 +
                                                    "/items/" +
                                                    i9 +
                                                    "/copy",
                                                  schemaPath:
                                                    "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/list/properties/items/elements/properties/copy/discriminator",
                                                  keyword: "discriminator",
                                                  params: {
                                                    error: "tag",
                                                    tag: "kind",
                                                    tagValue: tag4,
                                                  },
                                                  message:
                                                    'tag "kind" must be string',
                                                };
                                                if (vErrors === null) {
                                                  vErrors = [err164];
                                                } else {
                                                  vErrors.push(err164);
                                                }
                                                errors++;
                                              } else if (
                                                typeof tag4 == "string"
                                              ) {
                                                if (tag4 === "added") {
                                                  const _errs86 = errors;
                                                  let valid114 = false;
                                                  valid114 = true;
                                                  if (
                                                    data73.text !== undefined
                                                  ) {
                                                    if (
                                                      !(
                                                        typeof data73.text ==
                                                        "string"
                                                      )
                                                    ) {
                                                      const err165 = {
                                                        instancePath:
                                                          instancePath +
                                                          "/body/sections/" +
                                                          i5 +
                                                          "/blocks/" +
                                                          i7 +
                                                          "/items/" +
                                                          i9 +
                                                          "/copy/text",
                                                        schemaPath:
                                                          "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/list/properties/items/elements/properties/copy/mapping/added/properties/text/type",
                                                        keyword: "type",
                                                        params: {
                                                          type: "string",
                                                          nullable: false,
                                                        },
                                                        message:
                                                          "must be string",
                                                      };
                                                      if (vErrors === null) {
                                                        vErrors = [err165];
                                                      } else {
                                                        vErrors.push(err165);
                                                      }
                                                      errors++;
                                                    }
                                                  } else {
                                                    const err166 = {
                                                      instancePath:
                                                        instancePath +
                                                        "/body/sections/" +
                                                        i5 +
                                                        "/blocks/" +
                                                        i7 +
                                                        "/items/" +
                                                        i9 +
                                                        "/copy",
                                                      schemaPath:
                                                        "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/list/properties/items/elements/properties/copy/mapping/added/properties/text",
                                                      keyword: "properties",
                                                      params: {
                                                        error: "missing",
                                                        missingProperty: "text",
                                                      },
                                                      message:
                                                        "must have property 'text'",
                                                    };
                                                    if (vErrors === null) {
                                                      vErrors = [err166];
                                                    } else {
                                                      vErrors.push(err166);
                                                    }
                                                    errors++;
                                                  }
                                                  for (const key19 in data73) {
                                                    if (
                                                      key19 !== "kind" &&
                                                      key19 !== "text"
                                                    ) {
                                                      const err167 = {
                                                        instancePath:
                                                          instancePath +
                                                          "/body/sections/" +
                                                          i5 +
                                                          "/blocks/" +
                                                          i7 +
                                                          "/items/" +
                                                          i9 +
                                                          "/copy/" +
                                                          key19
                                                            .replace(/~/g, "~0")
                                                            .replace(
                                                              /\//g,
                                                              "~1",
                                                            ),
                                                        schemaPath:
                                                          "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/list/properties/items/elements/properties/copy/mapping/added",
                                                        keyword: "properties",
                                                        params: {
                                                          error: "additional",
                                                          additionalProperty:
                                                            key19,
                                                        },
                                                        message:
                                                          "must NOT have additional properties",
                                                      };
                                                      if (vErrors === null) {
                                                        vErrors = [err167];
                                                      } else {
                                                        vErrors.push(err167);
                                                      }
                                                      errors++;
                                                    }
                                                  }
                                                  if (!valid114) {
                                                    const err168 = {
                                                      instancePath:
                                                        instancePath +
                                                        "/body/sections/" +
                                                        i5 +
                                                        "/blocks/" +
                                                        i7 +
                                                        "/items/" +
                                                        i9 +
                                                        "/copy",
                                                      schemaPath:
                                                        "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/list/properties/items/elements/properties/copy/mapping/added/properties",
                                                      keyword: "properties",
                                                      params: {
                                                        type: "object",
                                                        nullable: false,
                                                      },
                                                      message: "must be object",
                                                    };
                                                    if (vErrors === null) {
                                                      vErrors = [err168];
                                                    } else {
                                                      vErrors.push(err168);
                                                    }
                                                    errors++;
                                                  }
                                                  var valid113 =
                                                    _errs86 === errors;
                                                  valid112 = valid113;
                                                } else if (tag4 === "source") {
                                                  const _errs88 = errors;
                                                  let valid118 = false;
                                                  valid118 = true;
                                                  if (
                                                    data73.text !== undefined
                                                  ) {
                                                    if (
                                                      !(
                                                        typeof data73.text ==
                                                        "string"
                                                      )
                                                    ) {
                                                      const err169 = {
                                                        instancePath:
                                                          instancePath +
                                                          "/body/sections/" +
                                                          i5 +
                                                          "/blocks/" +
                                                          i7 +
                                                          "/items/" +
                                                          i9 +
                                                          "/copy/text",
                                                        schemaPath:
                                                          "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/list/properties/items/elements/properties/copy/mapping/source/properties/text/type",
                                                        keyword: "type",
                                                        params: {
                                                          type: "string",
                                                          nullable: false,
                                                        },
                                                        message:
                                                          "must be string",
                                                      };
                                                      if (vErrors === null) {
                                                        vErrors = [err169];
                                                      } else {
                                                        vErrors.push(err169);
                                                      }
                                                      errors++;
                                                    }
                                                  } else {
                                                    const err170 = {
                                                      instancePath:
                                                        instancePath +
                                                        "/body/sections/" +
                                                        i5 +
                                                        "/blocks/" +
                                                        i7 +
                                                        "/items/" +
                                                        i9 +
                                                        "/copy",
                                                      schemaPath:
                                                        "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/list/properties/items/elements/properties/copy/mapping/source/properties/text",
                                                      keyword: "properties",
                                                      params: {
                                                        error: "missing",
                                                        missingProperty: "text",
                                                      },
                                                      message:
                                                        "must have property 'text'",
                                                    };
                                                    if (vErrors === null) {
                                                      vErrors = [err170];
                                                    } else {
                                                      vErrors.push(err170);
                                                    }
                                                    errors++;
                                                  }
                                                  if (
                                                    data73.sourceRef !==
                                                    undefined
                                                  ) {
                                                    if (
                                                      !(
                                                        typeof data73.sourceRef ==
                                                        "string"
                                                      )
                                                    ) {
                                                      const err171 = {
                                                        instancePath:
                                                          instancePath +
                                                          "/body/sections/" +
                                                          i5 +
                                                          "/blocks/" +
                                                          i7 +
                                                          "/items/" +
                                                          i9 +
                                                          "/copy/sourceRef",
                                                        schemaPath:
                                                          "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/list/properties/items/elements/properties/copy/mapping/source/properties/sourceRef/type",
                                                        keyword: "type",
                                                        params: {
                                                          type: "string",
                                                          nullable: false,
                                                        },
                                                        message:
                                                          "must be string",
                                                      };
                                                      if (vErrors === null) {
                                                        vErrors = [err171];
                                                      } else {
                                                        vErrors.push(err171);
                                                      }
                                                      errors++;
                                                    }
                                                  } else {
                                                    const err172 = {
                                                      instancePath:
                                                        instancePath +
                                                        "/body/sections/" +
                                                        i5 +
                                                        "/blocks/" +
                                                        i7 +
                                                        "/items/" +
                                                        i9 +
                                                        "/copy",
                                                      schemaPath:
                                                        "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/list/properties/items/elements/properties/copy/mapping/source/properties/sourceRef",
                                                      keyword: "properties",
                                                      params: {
                                                        error: "missing",
                                                        missingProperty:
                                                          "sourceRef",
                                                      },
                                                      message:
                                                        "must have property 'sourceRef'",
                                                    };
                                                    if (vErrors === null) {
                                                      vErrors = [err172];
                                                    } else {
                                                      vErrors.push(err172);
                                                    }
                                                    errors++;
                                                  }
                                                  for (const key20 in data73) {
                                                    if (
                                                      key20 !== "kind" &&
                                                      key20 !== "text" &&
                                                      key20 !== "sourceRef"
                                                    ) {
                                                      const err173 = {
                                                        instancePath:
                                                          instancePath +
                                                          "/body/sections/" +
                                                          i5 +
                                                          "/blocks/" +
                                                          i7 +
                                                          "/items/" +
                                                          i9 +
                                                          "/copy/" +
                                                          key20
                                                            .replace(/~/g, "~0")
                                                            .replace(
                                                              /\//g,
                                                              "~1",
                                                            ),
                                                        schemaPath:
                                                          "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/list/properties/items/elements/properties/copy/mapping/source",
                                                        keyword: "properties",
                                                        params: {
                                                          error: "additional",
                                                          additionalProperty:
                                                            key20,
                                                        },
                                                        message:
                                                          "must NOT have additional properties",
                                                      };
                                                      if (vErrors === null) {
                                                        vErrors = [err173];
                                                      } else {
                                                        vErrors.push(err173);
                                                      }
                                                      errors++;
                                                    }
                                                  }
                                                  if (!valid118) {
                                                    const err174 = {
                                                      instancePath:
                                                        instancePath +
                                                        "/body/sections/" +
                                                        i5 +
                                                        "/blocks/" +
                                                        i7 +
                                                        "/items/" +
                                                        i9 +
                                                        "/copy",
                                                      schemaPath:
                                                        "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/list/properties/items/elements/properties/copy/mapping/source/properties",
                                                      keyword: "properties",
                                                      params: {
                                                        type: "object",
                                                        nullable: false,
                                                      },
                                                      message: "must be object",
                                                    };
                                                    if (vErrors === null) {
                                                      vErrors = [err174];
                                                    } else {
                                                      vErrors.push(err174);
                                                    }
                                                    errors++;
                                                  }
                                                  var valid117 =
                                                    _errs88 === errors;
                                                  valid112 = valid117;
                                                } else if (tag4 === "adapted") {
                                                  const _errs91 = errors;
                                                  let valid122 = false;
                                                  valid122 = true;
                                                  if (
                                                    data73.text !== undefined
                                                  ) {
                                                    if (
                                                      !(
                                                        typeof data73.text ==
                                                        "string"
                                                      )
                                                    ) {
                                                      const err175 = {
                                                        instancePath:
                                                          instancePath +
                                                          "/body/sections/" +
                                                          i5 +
                                                          "/blocks/" +
                                                          i7 +
                                                          "/items/" +
                                                          i9 +
                                                          "/copy/text",
                                                        schemaPath:
                                                          "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/list/properties/items/elements/properties/copy/mapping/adapted/properties/text/type",
                                                        keyword: "type",
                                                        params: {
                                                          type: "string",
                                                          nullable: false,
                                                        },
                                                        message:
                                                          "must be string",
                                                      };
                                                      if (vErrors === null) {
                                                        vErrors = [err175];
                                                      } else {
                                                        vErrors.push(err175);
                                                      }
                                                      errors++;
                                                    }
                                                  } else {
                                                    const err176 = {
                                                      instancePath:
                                                        instancePath +
                                                        "/body/sections/" +
                                                        i5 +
                                                        "/blocks/" +
                                                        i7 +
                                                        "/items/" +
                                                        i9 +
                                                        "/copy",
                                                      schemaPath:
                                                        "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/list/properties/items/elements/properties/copy/mapping/adapted/properties/text",
                                                      keyword: "properties",
                                                      params: {
                                                        error: "missing",
                                                        missingProperty: "text",
                                                      },
                                                      message:
                                                        "must have property 'text'",
                                                    };
                                                    if (vErrors === null) {
                                                      vErrors = [err176];
                                                    } else {
                                                      vErrors.push(err176);
                                                    }
                                                    errors++;
                                                  }
                                                  if (
                                                    data73.sourceRef !==
                                                    undefined
                                                  ) {
                                                    if (
                                                      !(
                                                        typeof data73.sourceRef ==
                                                        "string"
                                                      )
                                                    ) {
                                                      const err177 = {
                                                        instancePath:
                                                          instancePath +
                                                          "/body/sections/" +
                                                          i5 +
                                                          "/blocks/" +
                                                          i7 +
                                                          "/items/" +
                                                          i9 +
                                                          "/copy/sourceRef",
                                                        schemaPath:
                                                          "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/list/properties/items/elements/properties/copy/mapping/adapted/properties/sourceRef/type",
                                                        keyword: "type",
                                                        params: {
                                                          type: "string",
                                                          nullable: false,
                                                        },
                                                        message:
                                                          "must be string",
                                                      };
                                                      if (vErrors === null) {
                                                        vErrors = [err177];
                                                      } else {
                                                        vErrors.push(err177);
                                                      }
                                                      errors++;
                                                    }
                                                  } else {
                                                    const err178 = {
                                                      instancePath:
                                                        instancePath +
                                                        "/body/sections/" +
                                                        i5 +
                                                        "/blocks/" +
                                                        i7 +
                                                        "/items/" +
                                                        i9 +
                                                        "/copy",
                                                      schemaPath:
                                                        "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/list/properties/items/elements/properties/copy/mapping/adapted/properties/sourceRef",
                                                      keyword: "properties",
                                                      params: {
                                                        error: "missing",
                                                        missingProperty:
                                                          "sourceRef",
                                                      },
                                                      message:
                                                        "must have property 'sourceRef'",
                                                    };
                                                    if (vErrors === null) {
                                                      vErrors = [err178];
                                                    } else {
                                                      vErrors.push(err178);
                                                    }
                                                    errors++;
                                                  }
                                                  for (const key21 in data73) {
                                                    if (
                                                      key21 !== "kind" &&
                                                      key21 !== "text" &&
                                                      key21 !== "sourceRef"
                                                    ) {
                                                      const err179 = {
                                                        instancePath:
                                                          instancePath +
                                                          "/body/sections/" +
                                                          i5 +
                                                          "/blocks/" +
                                                          i7 +
                                                          "/items/" +
                                                          i9 +
                                                          "/copy/" +
                                                          key21
                                                            .replace(/~/g, "~0")
                                                            .replace(
                                                              /\//g,
                                                              "~1",
                                                            ),
                                                        schemaPath:
                                                          "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/list/properties/items/elements/properties/copy/mapping/adapted",
                                                        keyword: "properties",
                                                        params: {
                                                          error: "additional",
                                                          additionalProperty:
                                                            key21,
                                                        },
                                                        message:
                                                          "must NOT have additional properties",
                                                      };
                                                      if (vErrors === null) {
                                                        vErrors = [err179];
                                                      } else {
                                                        vErrors.push(err179);
                                                      }
                                                      errors++;
                                                    }
                                                  }
                                                  if (!valid122) {
                                                    const err180 = {
                                                      instancePath:
                                                        instancePath +
                                                        "/body/sections/" +
                                                        i5 +
                                                        "/blocks/" +
                                                        i7 +
                                                        "/items/" +
                                                        i9 +
                                                        "/copy",
                                                      schemaPath:
                                                        "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/list/properties/items/elements/properties/copy/mapping/adapted/properties",
                                                      keyword: "properties",
                                                      params: {
                                                        type: "object",
                                                        nullable: false,
                                                      },
                                                      message: "must be object",
                                                    };
                                                    if (vErrors === null) {
                                                      vErrors = [err180];
                                                    } else {
                                                      vErrors.push(err180);
                                                    }
                                                    errors++;
                                                  }
                                                  var valid121 =
                                                    _errs91 === errors;
                                                  valid112 = valid121;
                                                } else {
                                                  const err181 = {
                                                    instancePath:
                                                      instancePath +
                                                      "/body/sections/" +
                                                      i5 +
                                                      "/blocks/" +
                                                      i7 +
                                                      "/items/" +
                                                      i9 +
                                                      "/copy/kind",
                                                    schemaPath:
                                                      "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/list/properties/items/elements/properties/copy/mapping",
                                                    keyword: "discriminator",
                                                    params: {
                                                      error: "mapping",
                                                      tag: "kind",
                                                      tagValue: tag4,
                                                    },
                                                    message:
                                                      'value of tag "kind" must be in mapping',
                                                  };
                                                  if (vErrors === null) {
                                                    vErrors = [err181];
                                                  } else {
                                                    vErrors.push(err181);
                                                  }
                                                  errors++;
                                                }
                                              } else {
                                                const err182 = {
                                                  instancePath:
                                                    instancePath +
                                                    "/body/sections/" +
                                                    i5 +
                                                    "/blocks/" +
                                                    i7 +
                                                    "/items/" +
                                                    i9 +
                                                    "/copy/kind",
                                                  schemaPath:
                                                    "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/list/properties/items/elements/properties/copy/discriminator",
                                                  keyword: "discriminator",
                                                  params: {
                                                    error: "tag",
                                                    tag: "kind",
                                                    tagValue: tag4,
                                                  },
                                                  message:
                                                    'tag "kind" must be string',
                                                };
                                                if (vErrors === null) {
                                                  vErrors = [err182];
                                                } else {
                                                  vErrors.push(err182);
                                                }
                                                errors++;
                                              }
                                            } else if (!valid112) {
                                              const err183 = {
                                                instancePath:
                                                  instancePath +
                                                  "/body/sections/" +
                                                  i5 +
                                                  "/blocks/" +
                                                  i7 +
                                                  "/items/" +
                                                  i9 +
                                                  "/copy",
                                                schemaPath:
                                                  "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/list/properties/items/elements/properties/copy/discriminator",
                                                keyword: "discriminator",
                                                params: {
                                                  type: "object",
                                                  nullable: false,
                                                },
                                                message: "must be object",
                                              };
                                              if (vErrors === null) {
                                                vErrors = [err183];
                                              } else {
                                                vErrors.push(err183);
                                              }
                                              errors++;
                                            }
                                          } else {
                                            const err184 = {
                                              instancePath:
                                                instancePath +
                                                "/body/sections/" +
                                                i5 +
                                                "/blocks/" +
                                                i7 +
                                                "/items/" +
                                                i9,
                                              schemaPath:
                                                "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/list/properties/items/elements/properties/copy",
                                              keyword: "properties",
                                              params: {
                                                error: "missing",
                                                missingProperty: "copy",
                                              },
                                              message:
                                                "must have property 'copy'",
                                            };
                                            if (vErrors === null) {
                                              vErrors = [err184];
                                            } else {
                                              vErrors.push(err184);
                                            }
                                            errors++;
                                          }
                                          if (data72.marks !== undefined) {
                                            let data79 = data72.marks;
                                            let valid125 = false;
                                            if (!valid125) {
                                              if (Array.isArray(data79)) {
                                                let valid127 = true;
                                                const len10 = data79.length;
                                                for (
                                                  let i10 = 0;
                                                  i10 < len10;
                                                  i10++
                                                ) {
                                                  let data80 = data79[i10];
                                                  const _errs95 = errors;
                                                  let valid128 = false;
                                                  if (
                                                    data80 &&
                                                    typeof data80 == "object" &&
                                                    !Array.isArray(data80)
                                                  ) {
                                                    valid128 = true;
                                                    if (
                                                      data80.kind !== undefined
                                                    ) {
                                                      let data81 = data80.kind;
                                                      if (!(
                                                        typeof data81 ==
                                                          "string" &&
                                                        (data81 === "bold" ||
                                                          data81 === "italic" ||
                                                          data81 ===
                                                            "underline")
                                                      )) {
                                                        const err185 = {
                                                          instancePath:
                                                            instancePath +
                                                            "/body/sections/" +
                                                            i5 +
                                                            "/blocks/" +
                                                            i7 +
                                                            "/items/" +
                                                            i9 +
                                                            "/marks/" +
                                                            i10 +
                                                            "/kind",
                                                          schemaPath:
                                                            "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/list/properties/items/elements/properties/marks/elements/properties/kind/enum",
                                                          keyword: "enum",
                                                          params: {
                                                            allowedValues:
                                                              schema30
                                                                .properties.body
                                                                .properties
                                                                .sections
                                                                .elements
                                                                .properties
                                                                .blocks.elements
                                                                .mapping.list
                                                                .properties
                                                                .items.elements
                                                                .properties
                                                                .marks.elements
                                                                .properties.kind
                                                                .enum,
                                                          },
                                                          message:
                                                            "must be equal to one of the allowed values",
                                                        };
                                                        if (vErrors === null) {
                                                          vErrors = [err185];
                                                        } else {
                                                          vErrors.push(err185);
                                                        }
                                                        errors++;
                                                      }
                                                    } else {
                                                      const err186 = {
                                                        instancePath:
                                                          instancePath +
                                                          "/body/sections/" +
                                                          i5 +
                                                          "/blocks/" +
                                                          i7 +
                                                          "/items/" +
                                                          i9 +
                                                          "/marks/" +
                                                          i10,
                                                        schemaPath:
                                                          "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/list/properties/items/elements/properties/marks/elements/properties/kind",
                                                        keyword: "properties",
                                                        params: {
                                                          error: "missing",
                                                          missingProperty:
                                                            "kind",
                                                        },
                                                        message:
                                                          "must have property 'kind'",
                                                      };
                                                      if (vErrors === null) {
                                                        vErrors = [err186];
                                                      } else {
                                                        vErrors.push(err186);
                                                      }
                                                      errors++;
                                                    }
                                                    if (
                                                      data80.start !== undefined
                                                    ) {
                                                      let data82 = data80.start;
                                                      if (!(
                                                        typeof data82 ==
                                                          "number" &&
                                                        isFinite(data82) &&
                                                        !(data82 % 1) &&
                                                        data82 >= 0 &&
                                                        data82 <= 4294967295
                                                      )) {
                                                        const err187 = {
                                                          instancePath:
                                                            instancePath +
                                                            "/body/sections/" +
                                                            i5 +
                                                            "/blocks/" +
                                                            i7 +
                                                            "/items/" +
                                                            i9 +
                                                            "/marks/" +
                                                            i10 +
                                                            "/start",
                                                          schemaPath:
                                                            "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/list/properties/items/elements/properties/marks/elements/properties/start/type",
                                                          keyword: "type",
                                                          params: {
                                                            type: "uint32",
                                                            nullable: false,
                                                          },
                                                          message:
                                                            "must be uint32",
                                                        };
                                                        if (vErrors === null) {
                                                          vErrors = [err187];
                                                        } else {
                                                          vErrors.push(err187);
                                                        }
                                                        errors++;
                                                      }
                                                    } else {
                                                      const err188 = {
                                                        instancePath:
                                                          instancePath +
                                                          "/body/sections/" +
                                                          i5 +
                                                          "/blocks/" +
                                                          i7 +
                                                          "/items/" +
                                                          i9 +
                                                          "/marks/" +
                                                          i10,
                                                        schemaPath:
                                                          "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/list/properties/items/elements/properties/marks/elements/properties/start",
                                                        keyword: "properties",
                                                        params: {
                                                          error: "missing",
                                                          missingProperty:
                                                            "start",
                                                        },
                                                        message:
                                                          "must have property 'start'",
                                                      };
                                                      if (vErrors === null) {
                                                        vErrors = [err188];
                                                      } else {
                                                        vErrors.push(err188);
                                                      }
                                                      errors++;
                                                    }
                                                    if (
                                                      data80.length !==
                                                      undefined
                                                    ) {
                                                      let data83 =
                                                        data80.length;
                                                      if (!(
                                                        typeof data83 ==
                                                          "number" &&
                                                        isFinite(data83) &&
                                                        !(data83 % 1) &&
                                                        data83 >= 0 &&
                                                        data83 <= 4294967295
                                                      )) {
                                                        const err189 = {
                                                          instancePath:
                                                            instancePath +
                                                            "/body/sections/" +
                                                            i5 +
                                                            "/blocks/" +
                                                            i7 +
                                                            "/items/" +
                                                            i9 +
                                                            "/marks/" +
                                                            i10 +
                                                            "/length",
                                                          schemaPath:
                                                            "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/list/properties/items/elements/properties/marks/elements/properties/length/type",
                                                          keyword: "type",
                                                          params: {
                                                            type: "uint32",
                                                            nullable: false,
                                                          },
                                                          message:
                                                            "must be uint32",
                                                        };
                                                        if (vErrors === null) {
                                                          vErrors = [err189];
                                                        } else {
                                                          vErrors.push(err189);
                                                        }
                                                        errors++;
                                                      }
                                                    } else {
                                                      const err190 = {
                                                        instancePath:
                                                          instancePath +
                                                          "/body/sections/" +
                                                          i5 +
                                                          "/blocks/" +
                                                          i7 +
                                                          "/items/" +
                                                          i9 +
                                                          "/marks/" +
                                                          i10,
                                                        schemaPath:
                                                          "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/list/properties/items/elements/properties/marks/elements/properties/length",
                                                        keyword: "properties",
                                                        params: {
                                                          error: "missing",
                                                          missingProperty:
                                                            "length",
                                                        },
                                                        message:
                                                          "must have property 'length'",
                                                      };
                                                      if (vErrors === null) {
                                                        vErrors = [err190];
                                                      } else {
                                                        vErrors.push(err190);
                                                      }
                                                      errors++;
                                                    }
                                                    for (const key22 in data80) {
                                                      if (
                                                        key22 !== "kind" &&
                                                        key22 !== "start" &&
                                                        key22 !== "length"
                                                      ) {
                                                        const err191 = {
                                                          instancePath:
                                                            instancePath +
                                                            "/body/sections/" +
                                                            i5 +
                                                            "/blocks/" +
                                                            i7 +
                                                            "/items/" +
                                                            i9 +
                                                            "/marks/" +
                                                            i10 +
                                                            "/" +
                                                            key22
                                                              .replace(
                                                                /~/g,
                                                                "~0",
                                                              )
                                                              .replace(
                                                                /\//g,
                                                                "~1",
                                                              ),
                                                          schemaPath:
                                                            "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/list/properties/items/elements/properties/marks/elements",
                                                          keyword: "properties",
                                                          params: {
                                                            error: "additional",
                                                            additionalProperty:
                                                              key22,
                                                          },
                                                          message:
                                                            "must NOT have additional properties",
                                                        };
                                                        if (vErrors === null) {
                                                          vErrors = [err191];
                                                        } else {
                                                          vErrors.push(err191);
                                                        }
                                                        errors++;
                                                      }
                                                    }
                                                  }
                                                  if (!valid128) {
                                                    const err192 = {
                                                      instancePath:
                                                        instancePath +
                                                        "/body/sections/" +
                                                        i5 +
                                                        "/blocks/" +
                                                        i7 +
                                                        "/items/" +
                                                        i9 +
                                                        "/marks/" +
                                                        i10,
                                                      schemaPath:
                                                        "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/list/properties/items/elements/properties/marks/elements/properties",
                                                      keyword: "properties",
                                                      params: {
                                                        type: "object",
                                                        nullable: false,
                                                      },
                                                      message: "must be object",
                                                    };
                                                    if (vErrors === null) {
                                                      vErrors = [err192];
                                                    } else {
                                                      vErrors.push(err192);
                                                    }
                                                    errors++;
                                                  }
                                                  var valid126 =
                                                    _errs95 === errors;
                                                  if (!valid126) {
                                                    valid127 = false;
                                                  }
                                                }
                                                valid125 = valid127;
                                              } else {
                                                const err193 = {
                                                  instancePath:
                                                    instancePath +
                                                    "/body/sections/" +
                                                    i5 +
                                                    "/blocks/" +
                                                    i7 +
                                                    "/items/" +
                                                    i9 +
                                                    "/marks",
                                                  schemaPath:
                                                    "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/list/properties/items/elements/properties/marks/elements",
                                                  keyword: "elements",
                                                  params: {
                                                    type: "array",
                                                    nullable: false,
                                                  },
                                                  message: "must be array",
                                                };
                                                if (vErrors === null) {
                                                  vErrors = [err193];
                                                } else {
                                                  vErrors.push(err193);
                                                }
                                                errors++;
                                              }
                                            }
                                          } else {
                                            const err194 = {
                                              instancePath:
                                                instancePath +
                                                "/body/sections/" +
                                                i5 +
                                                "/blocks/" +
                                                i7 +
                                                "/items/" +
                                                i9,
                                              schemaPath:
                                                "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/list/properties/items/elements/properties/marks",
                                              keyword: "properties",
                                              params: {
                                                error: "missing",
                                                missingProperty: "marks",
                                              },
                                              message:
                                                "must have property 'marks'",
                                            };
                                            if (vErrors === null) {
                                              vErrors = [err194];
                                            } else {
                                              vErrors.push(err194);
                                            }
                                            errors++;
                                          }
                                          for (const key23 in data72) {
                                            if (
                                              key23 !== "copy" &&
                                              key23 !== "marks"
                                            ) {
                                              const err195 = {
                                                instancePath:
                                                  instancePath +
                                                  "/body/sections/" +
                                                  i5 +
                                                  "/blocks/" +
                                                  i7 +
                                                  "/items/" +
                                                  i9 +
                                                  "/" +
                                                  key23
                                                    .replace(/~/g, "~0")
                                                    .replace(/\//g, "~1"),
                                                schemaPath:
                                                  "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/list/properties/items/elements",
                                                keyword: "properties",
                                                params: {
                                                  error: "additional",
                                                  additionalProperty: key23,
                                                },
                                                message:
                                                  "must NOT have additional properties",
                                              };
                                              if (vErrors === null) {
                                                vErrors = [err195];
                                              } else {
                                                vErrors.push(err195);
                                              }
                                              errors++;
                                            }
                                          }
                                        }
                                        if (!valid110) {
                                          const err196 = {
                                            instancePath:
                                              instancePath +
                                              "/body/sections/" +
                                              i5 +
                                              "/blocks/" +
                                              i7 +
                                              "/items/" +
                                              i9,
                                            schemaPath:
                                              "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/list/properties/items/elements/properties",
                                            keyword: "properties",
                                            params: {
                                              type: "object",
                                              nullable: false,
                                            },
                                            message: "must be object",
                                          };
                                          if (vErrors === null) {
                                            vErrors = [err196];
                                          } else {
                                            vErrors.push(err196);
                                          }
                                          errors++;
                                        }
                                        var valid108 = _errs84 === errors;
                                        if (!valid108) {
                                          valid109 = false;
                                        }
                                      }
                                      valid107 = valid109;
                                    } else {
                                      const err197 = {
                                        instancePath:
                                          instancePath +
                                          "/body/sections/" +
                                          i5 +
                                          "/blocks/" +
                                          i7 +
                                          "/items",
                                        schemaPath:
                                          "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/list/properties/items/elements",
                                        keyword: "elements",
                                        params: {
                                          type: "array",
                                          nullable: false,
                                        },
                                        message: "must be array",
                                      };
                                      if (vErrors === null) {
                                        vErrors = [err197];
                                      } else {
                                        vErrors.push(err197);
                                      }
                                      errors++;
                                    }
                                  }
                                } else {
                                  const err198 = {
                                    instancePath:
                                      instancePath +
                                      "/body/sections/" +
                                      i5 +
                                      "/blocks/" +
                                      i7,
                                    schemaPath:
                                      "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/list/properties/items",
                                    keyword: "properties",
                                    params: {
                                      error: "missing",
                                      missingProperty: "items",
                                    },
                                    message: "must have property 'items'",
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err198];
                                  } else {
                                    vErrors.push(err198);
                                  }
                                  errors++;
                                }
                                for (const key24 in data54) {
                                  if (
                                    key24 !== "kind" &&
                                    key24 !== "id" &&
                                    key24 !== "ordered" &&
                                    key24 !== "items"
                                  ) {
                                    const err199 = {
                                      instancePath:
                                        instancePath +
                                        "/body/sections/" +
                                        i5 +
                                        "/blocks/" +
                                        i7 +
                                        "/" +
                                        key24
                                          .replace(/~/g, "~0")
                                          .replace(/\//g, "~1"),
                                      schemaPath:
                                        "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/list",
                                      keyword: "properties",
                                      params: {
                                        error: "additional",
                                        additionalProperty: key24,
                                      },
                                      message:
                                        "must NOT have additional properties",
                                    };
                                    if (vErrors === null) {
                                      vErrors = [err199];
                                    } else {
                                      vErrors.push(err199);
                                    }
                                    errors++;
                                  }
                                }
                                if (!valid105) {
                                  const err200 = {
                                    instancePath:
                                      instancePath +
                                      "/body/sections/" +
                                      i5 +
                                      "/blocks/" +
                                      i7,
                                    schemaPath:
                                      "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/list/properties",
                                    keyword: "properties",
                                    params: { type: "object", nullable: false },
                                    message: "must be object",
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err200];
                                  } else {
                                    vErrors.push(err200);
                                  }
                                  errors++;
                                }
                                var valid104 = _errs80 === errors;
                                valid77 = valid104;
                              } else if (tag2 === "table") {
                                const _errs99 = errors;
                                let valid134 = false;
                                valid134 = true;
                                if (data54.id !== undefined) {
                                  if (!(typeof data54.id == "string")) {
                                    const err201 = {
                                      instancePath:
                                        instancePath +
                                        "/body/sections/" +
                                        i5 +
                                        "/blocks/" +
                                        i7 +
                                        "/id",
                                      schemaPath:
                                        "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/id/type",
                                      keyword: "type",
                                      params: {
                                        type: "string",
                                        nullable: false,
                                      },
                                      message: "must be string",
                                    };
                                    if (vErrors === null) {
                                      vErrors = [err201];
                                    } else {
                                      vErrors.push(err201);
                                    }
                                    errors++;
                                  }
                                } else {
                                  const err202 = {
                                    instancePath:
                                      instancePath +
                                      "/body/sections/" +
                                      i5 +
                                      "/blocks/" +
                                      i7,
                                    schemaPath:
                                      "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/id",
                                    keyword: "properties",
                                    params: {
                                      error: "missing",
                                      missingProperty: "id",
                                    },
                                    message: "must have property 'id'",
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err202];
                                  } else {
                                    vErrors.push(err202);
                                  }
                                  errors++;
                                }
                                if (data54.caption !== undefined) {
                                  let data85 = data54.caption;
                                  let valid136 = false;
                                  if (
                                    data85 &&
                                    typeof data85 == "object" &&
                                    !Array.isArray(data85)
                                  ) {
                                    valid136 = true;
                                    if (data85.copy !== undefined) {
                                      let data86 = data85.copy;
                                      let valid138 = false;
                                      if (
                                        data86 &&
                                        typeof data86 == "object" &&
                                        !Array.isArray(data86)
                                      ) {
                                        const tag5 = data86.kind;
                                        if (tag5 === undefined) {
                                          const err203 = {
                                            instancePath:
                                              instancePath +
                                              "/body/sections/" +
                                              i5 +
                                              "/blocks/" +
                                              i7 +
                                              "/caption/copy",
                                            schemaPath:
                                              "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/caption/properties/copy/discriminator",
                                            keyword: "discriminator",
                                            params: {
                                              error: "tag",
                                              tag: "kind",
                                              tagValue: tag5,
                                            },
                                            message:
                                              'tag "kind" must be string',
                                          };
                                          if (vErrors === null) {
                                            vErrors = [err203];
                                          } else {
                                            vErrors.push(err203);
                                          }
                                          errors++;
                                        } else if (typeof tag5 == "string") {
                                          if (tag5 === "added") {
                                            const _errs103 = errors;
                                            let valid140 = false;
                                            valid140 = true;
                                            if (data86.text !== undefined) {
                                              if (
                                                !(
                                                  typeof data86.text == "string"
                                                )
                                              ) {
                                                const err204 = {
                                                  instancePath:
                                                    instancePath +
                                                    "/body/sections/" +
                                                    i5 +
                                                    "/blocks/" +
                                                    i7 +
                                                    "/caption/copy/text",
                                                  schemaPath:
                                                    "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/caption/properties/copy/mapping/added/properties/text/type",
                                                  keyword: "type",
                                                  params: {
                                                    type: "string",
                                                    nullable: false,
                                                  },
                                                  message: "must be string",
                                                };
                                                if (vErrors === null) {
                                                  vErrors = [err204];
                                                } else {
                                                  vErrors.push(err204);
                                                }
                                                errors++;
                                              }
                                            } else {
                                              const err205 = {
                                                instancePath:
                                                  instancePath +
                                                  "/body/sections/" +
                                                  i5 +
                                                  "/blocks/" +
                                                  i7 +
                                                  "/caption/copy",
                                                schemaPath:
                                                  "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/caption/properties/copy/mapping/added/properties/text",
                                                keyword: "properties",
                                                params: {
                                                  error: "missing",
                                                  missingProperty: "text",
                                                },
                                                message:
                                                  "must have property 'text'",
                                              };
                                              if (vErrors === null) {
                                                vErrors = [err205];
                                              } else {
                                                vErrors.push(err205);
                                              }
                                              errors++;
                                            }
                                            for (const key25 in data86) {
                                              if (
                                                key25 !== "kind" &&
                                                key25 !== "text"
                                              ) {
                                                const err206 = {
                                                  instancePath:
                                                    instancePath +
                                                    "/body/sections/" +
                                                    i5 +
                                                    "/blocks/" +
                                                    i7 +
                                                    "/caption/copy/" +
                                                    key25
                                                      .replace(/~/g, "~0")
                                                      .replace(/\//g, "~1"),
                                                  schemaPath:
                                                    "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/caption/properties/copy/mapping/added",
                                                  keyword: "properties",
                                                  params: {
                                                    error: "additional",
                                                    additionalProperty: key25,
                                                  },
                                                  message:
                                                    "must NOT have additional properties",
                                                };
                                                if (vErrors === null) {
                                                  vErrors = [err206];
                                                } else {
                                                  vErrors.push(err206);
                                                }
                                                errors++;
                                              }
                                            }
                                            if (!valid140) {
                                              const err207 = {
                                                instancePath:
                                                  instancePath +
                                                  "/body/sections/" +
                                                  i5 +
                                                  "/blocks/" +
                                                  i7 +
                                                  "/caption/copy",
                                                schemaPath:
                                                  "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/caption/properties/copy/mapping/added/properties",
                                                keyword: "properties",
                                                params: {
                                                  type: "object",
                                                  nullable: false,
                                                },
                                                message: "must be object",
                                              };
                                              if (vErrors === null) {
                                                vErrors = [err207];
                                              } else {
                                                vErrors.push(err207);
                                              }
                                              errors++;
                                            }
                                            var valid139 = _errs103 === errors;
                                            valid138 = valid139;
                                          } else if (tag5 === "source") {
                                            const _errs105 = errors;
                                            let valid144 = false;
                                            valid144 = true;
                                            if (data86.text !== undefined) {
                                              if (
                                                !(
                                                  typeof data86.text == "string"
                                                )
                                              ) {
                                                const err208 = {
                                                  instancePath:
                                                    instancePath +
                                                    "/body/sections/" +
                                                    i5 +
                                                    "/blocks/" +
                                                    i7 +
                                                    "/caption/copy/text",
                                                  schemaPath:
                                                    "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/caption/properties/copy/mapping/source/properties/text/type",
                                                  keyword: "type",
                                                  params: {
                                                    type: "string",
                                                    nullable: false,
                                                  },
                                                  message: "must be string",
                                                };
                                                if (vErrors === null) {
                                                  vErrors = [err208];
                                                } else {
                                                  vErrors.push(err208);
                                                }
                                                errors++;
                                              }
                                            } else {
                                              const err209 = {
                                                instancePath:
                                                  instancePath +
                                                  "/body/sections/" +
                                                  i5 +
                                                  "/blocks/" +
                                                  i7 +
                                                  "/caption/copy",
                                                schemaPath:
                                                  "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/caption/properties/copy/mapping/source/properties/text",
                                                keyword: "properties",
                                                params: {
                                                  error: "missing",
                                                  missingProperty: "text",
                                                },
                                                message:
                                                  "must have property 'text'",
                                              };
                                              if (vErrors === null) {
                                                vErrors = [err209];
                                              } else {
                                                vErrors.push(err209);
                                              }
                                              errors++;
                                            }
                                            if (
                                              data86.sourceRef !== undefined
                                            ) {
                                              if (
                                                !(
                                                  typeof data86.sourceRef ==
                                                  "string"
                                                )
                                              ) {
                                                const err210 = {
                                                  instancePath:
                                                    instancePath +
                                                    "/body/sections/" +
                                                    i5 +
                                                    "/blocks/" +
                                                    i7 +
                                                    "/caption/copy/sourceRef",
                                                  schemaPath:
                                                    "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/caption/properties/copy/mapping/source/properties/sourceRef/type",
                                                  keyword: "type",
                                                  params: {
                                                    type: "string",
                                                    nullable: false,
                                                  },
                                                  message: "must be string",
                                                };
                                                if (vErrors === null) {
                                                  vErrors = [err210];
                                                } else {
                                                  vErrors.push(err210);
                                                }
                                                errors++;
                                              }
                                            } else {
                                              const err211 = {
                                                instancePath:
                                                  instancePath +
                                                  "/body/sections/" +
                                                  i5 +
                                                  "/blocks/" +
                                                  i7 +
                                                  "/caption/copy",
                                                schemaPath:
                                                  "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/caption/properties/copy/mapping/source/properties/sourceRef",
                                                keyword: "properties",
                                                params: {
                                                  error: "missing",
                                                  missingProperty: "sourceRef",
                                                },
                                                message:
                                                  "must have property 'sourceRef'",
                                              };
                                              if (vErrors === null) {
                                                vErrors = [err211];
                                              } else {
                                                vErrors.push(err211);
                                              }
                                              errors++;
                                            }
                                            for (const key26 in data86) {
                                              if (
                                                key26 !== "kind" &&
                                                key26 !== "text" &&
                                                key26 !== "sourceRef"
                                              ) {
                                                const err212 = {
                                                  instancePath:
                                                    instancePath +
                                                    "/body/sections/" +
                                                    i5 +
                                                    "/blocks/" +
                                                    i7 +
                                                    "/caption/copy/" +
                                                    key26
                                                      .replace(/~/g, "~0")
                                                      .replace(/\//g, "~1"),
                                                  schemaPath:
                                                    "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/caption/properties/copy/mapping/source",
                                                  keyword: "properties",
                                                  params: {
                                                    error: "additional",
                                                    additionalProperty: key26,
                                                  },
                                                  message:
                                                    "must NOT have additional properties",
                                                };
                                                if (vErrors === null) {
                                                  vErrors = [err212];
                                                } else {
                                                  vErrors.push(err212);
                                                }
                                                errors++;
                                              }
                                            }
                                            if (!valid144) {
                                              const err213 = {
                                                instancePath:
                                                  instancePath +
                                                  "/body/sections/" +
                                                  i5 +
                                                  "/blocks/" +
                                                  i7 +
                                                  "/caption/copy",
                                                schemaPath:
                                                  "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/caption/properties/copy/mapping/source/properties",
                                                keyword: "properties",
                                                params: {
                                                  type: "object",
                                                  nullable: false,
                                                },
                                                message: "must be object",
                                              };
                                              if (vErrors === null) {
                                                vErrors = [err213];
                                              } else {
                                                vErrors.push(err213);
                                              }
                                              errors++;
                                            }
                                            var valid143 = _errs105 === errors;
                                            valid138 = valid143;
                                          } else if (tag5 === "adapted") {
                                            const _errs108 = errors;
                                            let valid148 = false;
                                            valid148 = true;
                                            if (data86.text !== undefined) {
                                              if (
                                                !(
                                                  typeof data86.text == "string"
                                                )
                                              ) {
                                                const err214 = {
                                                  instancePath:
                                                    instancePath +
                                                    "/body/sections/" +
                                                    i5 +
                                                    "/blocks/" +
                                                    i7 +
                                                    "/caption/copy/text",
                                                  schemaPath:
                                                    "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/caption/properties/copy/mapping/adapted/properties/text/type",
                                                  keyword: "type",
                                                  params: {
                                                    type: "string",
                                                    nullable: false,
                                                  },
                                                  message: "must be string",
                                                };
                                                if (vErrors === null) {
                                                  vErrors = [err214];
                                                } else {
                                                  vErrors.push(err214);
                                                }
                                                errors++;
                                              }
                                            } else {
                                              const err215 = {
                                                instancePath:
                                                  instancePath +
                                                  "/body/sections/" +
                                                  i5 +
                                                  "/blocks/" +
                                                  i7 +
                                                  "/caption/copy",
                                                schemaPath:
                                                  "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/caption/properties/copy/mapping/adapted/properties/text",
                                                keyword: "properties",
                                                params: {
                                                  error: "missing",
                                                  missingProperty: "text",
                                                },
                                                message:
                                                  "must have property 'text'",
                                              };
                                              if (vErrors === null) {
                                                vErrors = [err215];
                                              } else {
                                                vErrors.push(err215);
                                              }
                                              errors++;
                                            }
                                            if (
                                              data86.sourceRef !== undefined
                                            ) {
                                              if (
                                                !(
                                                  typeof data86.sourceRef ==
                                                  "string"
                                                )
                                              ) {
                                                const err216 = {
                                                  instancePath:
                                                    instancePath +
                                                    "/body/sections/" +
                                                    i5 +
                                                    "/blocks/" +
                                                    i7 +
                                                    "/caption/copy/sourceRef",
                                                  schemaPath:
                                                    "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/caption/properties/copy/mapping/adapted/properties/sourceRef/type",
                                                  keyword: "type",
                                                  params: {
                                                    type: "string",
                                                    nullable: false,
                                                  },
                                                  message: "must be string",
                                                };
                                                if (vErrors === null) {
                                                  vErrors = [err216];
                                                } else {
                                                  vErrors.push(err216);
                                                }
                                                errors++;
                                              }
                                            } else {
                                              const err217 = {
                                                instancePath:
                                                  instancePath +
                                                  "/body/sections/" +
                                                  i5 +
                                                  "/blocks/" +
                                                  i7 +
                                                  "/caption/copy",
                                                schemaPath:
                                                  "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/caption/properties/copy/mapping/adapted/properties/sourceRef",
                                                keyword: "properties",
                                                params: {
                                                  error: "missing",
                                                  missingProperty: "sourceRef",
                                                },
                                                message:
                                                  "must have property 'sourceRef'",
                                              };
                                              if (vErrors === null) {
                                                vErrors = [err217];
                                              } else {
                                                vErrors.push(err217);
                                              }
                                              errors++;
                                            }
                                            for (const key27 in data86) {
                                              if (
                                                key27 !== "kind" &&
                                                key27 !== "text" &&
                                                key27 !== "sourceRef"
                                              ) {
                                                const err218 = {
                                                  instancePath:
                                                    instancePath +
                                                    "/body/sections/" +
                                                    i5 +
                                                    "/blocks/" +
                                                    i7 +
                                                    "/caption/copy/" +
                                                    key27
                                                      .replace(/~/g, "~0")
                                                      .replace(/\//g, "~1"),
                                                  schemaPath:
                                                    "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/caption/properties/copy/mapping/adapted",
                                                  keyword: "properties",
                                                  params: {
                                                    error: "additional",
                                                    additionalProperty: key27,
                                                  },
                                                  message:
                                                    "must NOT have additional properties",
                                                };
                                                if (vErrors === null) {
                                                  vErrors = [err218];
                                                } else {
                                                  vErrors.push(err218);
                                                }
                                                errors++;
                                              }
                                            }
                                            if (!valid148) {
                                              const err219 = {
                                                instancePath:
                                                  instancePath +
                                                  "/body/sections/" +
                                                  i5 +
                                                  "/blocks/" +
                                                  i7 +
                                                  "/caption/copy",
                                                schemaPath:
                                                  "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/caption/properties/copy/mapping/adapted/properties",
                                                keyword: "properties",
                                                params: {
                                                  type: "object",
                                                  nullable: false,
                                                },
                                                message: "must be object",
                                              };
                                              if (vErrors === null) {
                                                vErrors = [err219];
                                              } else {
                                                vErrors.push(err219);
                                              }
                                              errors++;
                                            }
                                            var valid147 = _errs108 === errors;
                                            valid138 = valid147;
                                          } else {
                                            const err220 = {
                                              instancePath:
                                                instancePath +
                                                "/body/sections/" +
                                                i5 +
                                                "/blocks/" +
                                                i7 +
                                                "/caption/copy/kind",
                                              schemaPath:
                                                "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/caption/properties/copy/mapping",
                                              keyword: "discriminator",
                                              params: {
                                                error: "mapping",
                                                tag: "kind",
                                                tagValue: tag5,
                                              },
                                              message:
                                                'value of tag "kind" must be in mapping',
                                            };
                                            if (vErrors === null) {
                                              vErrors = [err220];
                                            } else {
                                              vErrors.push(err220);
                                            }
                                            errors++;
                                          }
                                        } else {
                                          const err221 = {
                                            instancePath:
                                              instancePath +
                                              "/body/sections/" +
                                              i5 +
                                              "/blocks/" +
                                              i7 +
                                              "/caption/copy/kind",
                                            schemaPath:
                                              "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/caption/properties/copy/discriminator",
                                            keyword: "discriminator",
                                            params: {
                                              error: "tag",
                                              tag: "kind",
                                              tagValue: tag5,
                                            },
                                            message:
                                              'tag "kind" must be string',
                                          };
                                          if (vErrors === null) {
                                            vErrors = [err221];
                                          } else {
                                            vErrors.push(err221);
                                          }
                                          errors++;
                                        }
                                      } else if (!valid138) {
                                        const err222 = {
                                          instancePath:
                                            instancePath +
                                            "/body/sections/" +
                                            i5 +
                                            "/blocks/" +
                                            i7 +
                                            "/caption/copy",
                                          schemaPath:
                                            "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/caption/properties/copy/discriminator",
                                          keyword: "discriminator",
                                          params: {
                                            type: "object",
                                            nullable: false,
                                          },
                                          message: "must be object",
                                        };
                                        if (vErrors === null) {
                                          vErrors = [err222];
                                        } else {
                                          vErrors.push(err222);
                                        }
                                        errors++;
                                      }
                                    } else {
                                      const err223 = {
                                        instancePath:
                                          instancePath +
                                          "/body/sections/" +
                                          i5 +
                                          "/blocks/" +
                                          i7 +
                                          "/caption",
                                        schemaPath:
                                          "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/caption/properties/copy",
                                        keyword: "properties",
                                        params: {
                                          error: "missing",
                                          missingProperty: "copy",
                                        },
                                        message: "must have property 'copy'",
                                      };
                                      if (vErrors === null) {
                                        vErrors = [err223];
                                      } else {
                                        vErrors.push(err223);
                                      }
                                      errors++;
                                    }
                                    if (data85.marks !== undefined) {
                                      let data92 = data85.marks;
                                      let valid151 = false;
                                      if (!valid151) {
                                        if (Array.isArray(data92)) {
                                          let valid153 = true;
                                          const len11 = data92.length;
                                          for (
                                            let i11 = 0;
                                            i11 < len11;
                                            i11++
                                          ) {
                                            let data93 = data92[i11];
                                            const _errs112 = errors;
                                            let valid154 = false;
                                            if (
                                              data93 &&
                                              typeof data93 == "object" &&
                                              !Array.isArray(data93)
                                            ) {
                                              valid154 = true;
                                              if (data93.kind !== undefined) {
                                                let data94 = data93.kind;
                                                if (!(
                                                  typeof data94 == "string" &&
                                                  (data94 === "bold" ||
                                                    data94 === "italic" ||
                                                    data94 === "underline")
                                                )) {
                                                  const err224 = {
                                                    instancePath:
                                                      instancePath +
                                                      "/body/sections/" +
                                                      i5 +
                                                      "/blocks/" +
                                                      i7 +
                                                      "/caption/marks/" +
                                                      i11 +
                                                      "/kind",
                                                    schemaPath:
                                                      "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/caption/properties/marks/elements/properties/kind/enum",
                                                    keyword: "enum",
                                                    params: {
                                                      allowedValues:
                                                        schema30.properties.body
                                                          .properties.sections
                                                          .elements.properties
                                                          .blocks.elements
                                                          .mapping.table
                                                          .properties.caption
                                                          .properties.marks
                                                          .elements.properties
                                                          .kind.enum,
                                                    },
                                                    message:
                                                      "must be equal to one of the allowed values",
                                                  };
                                                  if (vErrors === null) {
                                                    vErrors = [err224];
                                                  } else {
                                                    vErrors.push(err224);
                                                  }
                                                  errors++;
                                                }
                                              } else {
                                                const err225 = {
                                                  instancePath:
                                                    instancePath +
                                                    "/body/sections/" +
                                                    i5 +
                                                    "/blocks/" +
                                                    i7 +
                                                    "/caption/marks/" +
                                                    i11,
                                                  schemaPath:
                                                    "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/caption/properties/marks/elements/properties/kind",
                                                  keyword: "properties",
                                                  params: {
                                                    error: "missing",
                                                    missingProperty: "kind",
                                                  },
                                                  message:
                                                    "must have property 'kind'",
                                                };
                                                if (vErrors === null) {
                                                  vErrors = [err225];
                                                } else {
                                                  vErrors.push(err225);
                                                }
                                                errors++;
                                              }
                                              if (data93.start !== undefined) {
                                                let data95 = data93.start;
                                                if (!(
                                                  typeof data95 == "number" &&
                                                  isFinite(data95) &&
                                                  !(data95 % 1) &&
                                                  data95 >= 0 &&
                                                  data95 <= 4294967295
                                                )) {
                                                  const err226 = {
                                                    instancePath:
                                                      instancePath +
                                                      "/body/sections/" +
                                                      i5 +
                                                      "/blocks/" +
                                                      i7 +
                                                      "/caption/marks/" +
                                                      i11 +
                                                      "/start",
                                                    schemaPath:
                                                      "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/caption/properties/marks/elements/properties/start/type",
                                                    keyword: "type",
                                                    params: {
                                                      type: "uint32",
                                                      nullable: false,
                                                    },
                                                    message: "must be uint32",
                                                  };
                                                  if (vErrors === null) {
                                                    vErrors = [err226];
                                                  } else {
                                                    vErrors.push(err226);
                                                  }
                                                  errors++;
                                                }
                                              } else {
                                                const err227 = {
                                                  instancePath:
                                                    instancePath +
                                                    "/body/sections/" +
                                                    i5 +
                                                    "/blocks/" +
                                                    i7 +
                                                    "/caption/marks/" +
                                                    i11,
                                                  schemaPath:
                                                    "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/caption/properties/marks/elements/properties/start",
                                                  keyword: "properties",
                                                  params: {
                                                    error: "missing",
                                                    missingProperty: "start",
                                                  },
                                                  message:
                                                    "must have property 'start'",
                                                };
                                                if (vErrors === null) {
                                                  vErrors = [err227];
                                                } else {
                                                  vErrors.push(err227);
                                                }
                                                errors++;
                                              }
                                              if (data93.length !== undefined) {
                                                let data96 = data93.length;
                                                if (!(
                                                  typeof data96 == "number" &&
                                                  isFinite(data96) &&
                                                  !(data96 % 1) &&
                                                  data96 >= 0 &&
                                                  data96 <= 4294967295
                                                )) {
                                                  const err228 = {
                                                    instancePath:
                                                      instancePath +
                                                      "/body/sections/" +
                                                      i5 +
                                                      "/blocks/" +
                                                      i7 +
                                                      "/caption/marks/" +
                                                      i11 +
                                                      "/length",
                                                    schemaPath:
                                                      "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/caption/properties/marks/elements/properties/length/type",
                                                    keyword: "type",
                                                    params: {
                                                      type: "uint32",
                                                      nullable: false,
                                                    },
                                                    message: "must be uint32",
                                                  };
                                                  if (vErrors === null) {
                                                    vErrors = [err228];
                                                  } else {
                                                    vErrors.push(err228);
                                                  }
                                                  errors++;
                                                }
                                              } else {
                                                const err229 = {
                                                  instancePath:
                                                    instancePath +
                                                    "/body/sections/" +
                                                    i5 +
                                                    "/blocks/" +
                                                    i7 +
                                                    "/caption/marks/" +
                                                    i11,
                                                  schemaPath:
                                                    "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/caption/properties/marks/elements/properties/length",
                                                  keyword: "properties",
                                                  params: {
                                                    error: "missing",
                                                    missingProperty: "length",
                                                  },
                                                  message:
                                                    "must have property 'length'",
                                                };
                                                if (vErrors === null) {
                                                  vErrors = [err229];
                                                } else {
                                                  vErrors.push(err229);
                                                }
                                                errors++;
                                              }
                                              for (const key28 in data93) {
                                                if (
                                                  key28 !== "kind" &&
                                                  key28 !== "start" &&
                                                  key28 !== "length"
                                                ) {
                                                  const err230 = {
                                                    instancePath:
                                                      instancePath +
                                                      "/body/sections/" +
                                                      i5 +
                                                      "/blocks/" +
                                                      i7 +
                                                      "/caption/marks/" +
                                                      i11 +
                                                      "/" +
                                                      key28
                                                        .replace(/~/g, "~0")
                                                        .replace(/\//g, "~1"),
                                                    schemaPath:
                                                      "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/caption/properties/marks/elements",
                                                    keyword: "properties",
                                                    params: {
                                                      error: "additional",
                                                      additionalProperty: key28,
                                                    },
                                                    message:
                                                      "must NOT have additional properties",
                                                  };
                                                  if (vErrors === null) {
                                                    vErrors = [err230];
                                                  } else {
                                                    vErrors.push(err230);
                                                  }
                                                  errors++;
                                                }
                                              }
                                            }
                                            if (!valid154) {
                                              const err231 = {
                                                instancePath:
                                                  instancePath +
                                                  "/body/sections/" +
                                                  i5 +
                                                  "/blocks/" +
                                                  i7 +
                                                  "/caption/marks/" +
                                                  i11,
                                                schemaPath:
                                                  "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/caption/properties/marks/elements/properties",
                                                keyword: "properties",
                                                params: {
                                                  type: "object",
                                                  nullable: false,
                                                },
                                                message: "must be object",
                                              };
                                              if (vErrors === null) {
                                                vErrors = [err231];
                                              } else {
                                                vErrors.push(err231);
                                              }
                                              errors++;
                                            }
                                            var valid152 = _errs112 === errors;
                                            if (!valid152) {
                                              valid153 = false;
                                            }
                                          }
                                          valid151 = valid153;
                                        } else {
                                          const err232 = {
                                            instancePath:
                                              instancePath +
                                              "/body/sections/" +
                                              i5 +
                                              "/blocks/" +
                                              i7 +
                                              "/caption/marks",
                                            schemaPath:
                                              "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/caption/properties/marks/elements",
                                            keyword: "elements",
                                            params: {
                                              type: "array",
                                              nullable: false,
                                            },
                                            message: "must be array",
                                          };
                                          if (vErrors === null) {
                                            vErrors = [err232];
                                          } else {
                                            vErrors.push(err232);
                                          }
                                          errors++;
                                        }
                                      }
                                    } else {
                                      const err233 = {
                                        instancePath:
                                          instancePath +
                                          "/body/sections/" +
                                          i5 +
                                          "/blocks/" +
                                          i7 +
                                          "/caption",
                                        schemaPath:
                                          "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/caption/properties/marks",
                                        keyword: "properties",
                                        params: {
                                          error: "missing",
                                          missingProperty: "marks",
                                        },
                                        message: "must have property 'marks'",
                                      };
                                      if (vErrors === null) {
                                        vErrors = [err233];
                                      } else {
                                        vErrors.push(err233);
                                      }
                                      errors++;
                                    }
                                    for (const key29 in data85) {
                                      if (
                                        key29 !== "copy" &&
                                        key29 !== "marks"
                                      ) {
                                        const err234 = {
                                          instancePath:
                                            instancePath +
                                            "/body/sections/" +
                                            i5 +
                                            "/blocks/" +
                                            i7 +
                                            "/caption/" +
                                            key29
                                              .replace(/~/g, "~0")
                                              .replace(/\//g, "~1"),
                                          schemaPath:
                                            "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/caption",
                                          keyword: "properties",
                                          params: {
                                            error: "additional",
                                            additionalProperty: key29,
                                          },
                                          message:
                                            "must NOT have additional properties",
                                        };
                                        if (vErrors === null) {
                                          vErrors = [err234];
                                        } else {
                                          vErrors.push(err234);
                                        }
                                        errors++;
                                      }
                                    }
                                  }
                                  if (!valid136) {
                                    const err235 = {
                                      instancePath:
                                        instancePath +
                                        "/body/sections/" +
                                        i5 +
                                        "/blocks/" +
                                        i7 +
                                        "/caption",
                                      schemaPath:
                                        "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/caption/properties",
                                      keyword: "properties",
                                      params: {
                                        type: "object",
                                        nullable: false,
                                      },
                                      message: "must be object",
                                    };
                                    if (vErrors === null) {
                                      vErrors = [err235];
                                    } else {
                                      vErrors.push(err235);
                                    }
                                    errors++;
                                  }
                                } else {
                                  const err236 = {
                                    instancePath:
                                      instancePath +
                                      "/body/sections/" +
                                      i5 +
                                      "/blocks/" +
                                      i7,
                                    schemaPath:
                                      "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/caption",
                                    keyword: "properties",
                                    params: {
                                      error: "missing",
                                      missingProperty: "caption",
                                    },
                                    message: "must have property 'caption'",
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err236];
                                  } else {
                                    vErrors.push(err236);
                                  }
                                  errors++;
                                }
                                if (data54.headers !== undefined) {
                                  let data97 = data54.headers;
                                  let valid158 = false;
                                  if (!valid158) {
                                    if (Array.isArray(data97)) {
                                      let valid160 = true;
                                      const len12 = data97.length;
                                      for (let i12 = 0; i12 < len12; i12++) {
                                        let data98 = data97[i12];
                                        const _errs117 = errors;
                                        let valid161 = false;
                                        if (
                                          data98 &&
                                          typeof data98 == "object" &&
                                          !Array.isArray(data98)
                                        ) {
                                          valid161 = true;
                                          if (data98.copy !== undefined) {
                                            let data99 = data98.copy;
                                            let valid163 = false;
                                            if (
                                              data99 &&
                                              typeof data99 == "object" &&
                                              !Array.isArray(data99)
                                            ) {
                                              const tag6 = data99.kind;
                                              if (tag6 === undefined) {
                                                const err237 = {
                                                  instancePath:
                                                    instancePath +
                                                    "/body/sections/" +
                                                    i5 +
                                                    "/blocks/" +
                                                    i7 +
                                                    "/headers/" +
                                                    i12 +
                                                    "/copy",
                                                  schemaPath:
                                                    "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/headers/elements/properties/copy/discriminator",
                                                  keyword: "discriminator",
                                                  params: {
                                                    error: "tag",
                                                    tag: "kind",
                                                    tagValue: tag6,
                                                  },
                                                  message:
                                                    'tag "kind" must be string',
                                                };
                                                if (vErrors === null) {
                                                  vErrors = [err237];
                                                } else {
                                                  vErrors.push(err237);
                                                }
                                                errors++;
                                              } else if (
                                                typeof tag6 == "string"
                                              ) {
                                                if (tag6 === "added") {
                                                  const _errs119 = errors;
                                                  let valid165 = false;
                                                  valid165 = true;
                                                  if (
                                                    data99.text !== undefined
                                                  ) {
                                                    if (
                                                      !(
                                                        typeof data99.text ==
                                                        "string"
                                                      )
                                                    ) {
                                                      const err238 = {
                                                        instancePath:
                                                          instancePath +
                                                          "/body/sections/" +
                                                          i5 +
                                                          "/blocks/" +
                                                          i7 +
                                                          "/headers/" +
                                                          i12 +
                                                          "/copy/text",
                                                        schemaPath:
                                                          "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/headers/elements/properties/copy/mapping/added/properties/text/type",
                                                        keyword: "type",
                                                        params: {
                                                          type: "string",
                                                          nullable: false,
                                                        },
                                                        message:
                                                          "must be string",
                                                      };
                                                      if (vErrors === null) {
                                                        vErrors = [err238];
                                                      } else {
                                                        vErrors.push(err238);
                                                      }
                                                      errors++;
                                                    }
                                                  } else {
                                                    const err239 = {
                                                      instancePath:
                                                        instancePath +
                                                        "/body/sections/" +
                                                        i5 +
                                                        "/blocks/" +
                                                        i7 +
                                                        "/headers/" +
                                                        i12 +
                                                        "/copy",
                                                      schemaPath:
                                                        "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/headers/elements/properties/copy/mapping/added/properties/text",
                                                      keyword: "properties",
                                                      params: {
                                                        error: "missing",
                                                        missingProperty: "text",
                                                      },
                                                      message:
                                                        "must have property 'text'",
                                                    };
                                                    if (vErrors === null) {
                                                      vErrors = [err239];
                                                    } else {
                                                      vErrors.push(err239);
                                                    }
                                                    errors++;
                                                  }
                                                  for (const key30 in data99) {
                                                    if (
                                                      key30 !== "kind" &&
                                                      key30 !== "text"
                                                    ) {
                                                      const err240 = {
                                                        instancePath:
                                                          instancePath +
                                                          "/body/sections/" +
                                                          i5 +
                                                          "/blocks/" +
                                                          i7 +
                                                          "/headers/" +
                                                          i12 +
                                                          "/copy/" +
                                                          key30
                                                            .replace(/~/g, "~0")
                                                            .replace(
                                                              /\//g,
                                                              "~1",
                                                            ),
                                                        schemaPath:
                                                          "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/headers/elements/properties/copy/mapping/added",
                                                        keyword: "properties",
                                                        params: {
                                                          error: "additional",
                                                          additionalProperty:
                                                            key30,
                                                        },
                                                        message:
                                                          "must NOT have additional properties",
                                                      };
                                                      if (vErrors === null) {
                                                        vErrors = [err240];
                                                      } else {
                                                        vErrors.push(err240);
                                                      }
                                                      errors++;
                                                    }
                                                  }
                                                  if (!valid165) {
                                                    const err241 = {
                                                      instancePath:
                                                        instancePath +
                                                        "/body/sections/" +
                                                        i5 +
                                                        "/blocks/" +
                                                        i7 +
                                                        "/headers/" +
                                                        i12 +
                                                        "/copy",
                                                      schemaPath:
                                                        "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/headers/elements/properties/copy/mapping/added/properties",
                                                      keyword: "properties",
                                                      params: {
                                                        type: "object",
                                                        nullable: false,
                                                      },
                                                      message: "must be object",
                                                    };
                                                    if (vErrors === null) {
                                                      vErrors = [err241];
                                                    } else {
                                                      vErrors.push(err241);
                                                    }
                                                    errors++;
                                                  }
                                                  var valid164 =
                                                    _errs119 === errors;
                                                  valid163 = valid164;
                                                } else if (tag6 === "source") {
                                                  const _errs121 = errors;
                                                  let valid169 = false;
                                                  valid169 = true;
                                                  if (
                                                    data99.text !== undefined
                                                  ) {
                                                    if (
                                                      !(
                                                        typeof data99.text ==
                                                        "string"
                                                      )
                                                    ) {
                                                      const err242 = {
                                                        instancePath:
                                                          instancePath +
                                                          "/body/sections/" +
                                                          i5 +
                                                          "/blocks/" +
                                                          i7 +
                                                          "/headers/" +
                                                          i12 +
                                                          "/copy/text",
                                                        schemaPath:
                                                          "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/headers/elements/properties/copy/mapping/source/properties/text/type",
                                                        keyword: "type",
                                                        params: {
                                                          type: "string",
                                                          nullable: false,
                                                        },
                                                        message:
                                                          "must be string",
                                                      };
                                                      if (vErrors === null) {
                                                        vErrors = [err242];
                                                      } else {
                                                        vErrors.push(err242);
                                                      }
                                                      errors++;
                                                    }
                                                  } else {
                                                    const err243 = {
                                                      instancePath:
                                                        instancePath +
                                                        "/body/sections/" +
                                                        i5 +
                                                        "/blocks/" +
                                                        i7 +
                                                        "/headers/" +
                                                        i12 +
                                                        "/copy",
                                                      schemaPath:
                                                        "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/headers/elements/properties/copy/mapping/source/properties/text",
                                                      keyword: "properties",
                                                      params: {
                                                        error: "missing",
                                                        missingProperty: "text",
                                                      },
                                                      message:
                                                        "must have property 'text'",
                                                    };
                                                    if (vErrors === null) {
                                                      vErrors = [err243];
                                                    } else {
                                                      vErrors.push(err243);
                                                    }
                                                    errors++;
                                                  }
                                                  if (
                                                    data99.sourceRef !==
                                                    undefined
                                                  ) {
                                                    if (
                                                      !(
                                                        typeof data99.sourceRef ==
                                                        "string"
                                                      )
                                                    ) {
                                                      const err244 = {
                                                        instancePath:
                                                          instancePath +
                                                          "/body/sections/" +
                                                          i5 +
                                                          "/blocks/" +
                                                          i7 +
                                                          "/headers/" +
                                                          i12 +
                                                          "/copy/sourceRef",
                                                        schemaPath:
                                                          "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/headers/elements/properties/copy/mapping/source/properties/sourceRef/type",
                                                        keyword: "type",
                                                        params: {
                                                          type: "string",
                                                          nullable: false,
                                                        },
                                                        message:
                                                          "must be string",
                                                      };
                                                      if (vErrors === null) {
                                                        vErrors = [err244];
                                                      } else {
                                                        vErrors.push(err244);
                                                      }
                                                      errors++;
                                                    }
                                                  } else {
                                                    const err245 = {
                                                      instancePath:
                                                        instancePath +
                                                        "/body/sections/" +
                                                        i5 +
                                                        "/blocks/" +
                                                        i7 +
                                                        "/headers/" +
                                                        i12 +
                                                        "/copy",
                                                      schemaPath:
                                                        "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/headers/elements/properties/copy/mapping/source/properties/sourceRef",
                                                      keyword: "properties",
                                                      params: {
                                                        error: "missing",
                                                        missingProperty:
                                                          "sourceRef",
                                                      },
                                                      message:
                                                        "must have property 'sourceRef'",
                                                    };
                                                    if (vErrors === null) {
                                                      vErrors = [err245];
                                                    } else {
                                                      vErrors.push(err245);
                                                    }
                                                    errors++;
                                                  }
                                                  for (const key31 in data99) {
                                                    if (
                                                      key31 !== "kind" &&
                                                      key31 !== "text" &&
                                                      key31 !== "sourceRef"
                                                    ) {
                                                      const err246 = {
                                                        instancePath:
                                                          instancePath +
                                                          "/body/sections/" +
                                                          i5 +
                                                          "/blocks/" +
                                                          i7 +
                                                          "/headers/" +
                                                          i12 +
                                                          "/copy/" +
                                                          key31
                                                            .replace(/~/g, "~0")
                                                            .replace(
                                                              /\//g,
                                                              "~1",
                                                            ),
                                                        schemaPath:
                                                          "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/headers/elements/properties/copy/mapping/source",
                                                        keyword: "properties",
                                                        params: {
                                                          error: "additional",
                                                          additionalProperty:
                                                            key31,
                                                        },
                                                        message:
                                                          "must NOT have additional properties",
                                                      };
                                                      if (vErrors === null) {
                                                        vErrors = [err246];
                                                      } else {
                                                        vErrors.push(err246);
                                                      }
                                                      errors++;
                                                    }
                                                  }
                                                  if (!valid169) {
                                                    const err247 = {
                                                      instancePath:
                                                        instancePath +
                                                        "/body/sections/" +
                                                        i5 +
                                                        "/blocks/" +
                                                        i7 +
                                                        "/headers/" +
                                                        i12 +
                                                        "/copy",
                                                      schemaPath:
                                                        "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/headers/elements/properties/copy/mapping/source/properties",
                                                      keyword: "properties",
                                                      params: {
                                                        type: "object",
                                                        nullable: false,
                                                      },
                                                      message: "must be object",
                                                    };
                                                    if (vErrors === null) {
                                                      vErrors = [err247];
                                                    } else {
                                                      vErrors.push(err247);
                                                    }
                                                    errors++;
                                                  }
                                                  var valid168 =
                                                    _errs121 === errors;
                                                  valid163 = valid168;
                                                } else if (tag6 === "adapted") {
                                                  const _errs124 = errors;
                                                  let valid173 = false;
                                                  valid173 = true;
                                                  if (
                                                    data99.text !== undefined
                                                  ) {
                                                    if (
                                                      !(
                                                        typeof data99.text ==
                                                        "string"
                                                      )
                                                    ) {
                                                      const err248 = {
                                                        instancePath:
                                                          instancePath +
                                                          "/body/sections/" +
                                                          i5 +
                                                          "/blocks/" +
                                                          i7 +
                                                          "/headers/" +
                                                          i12 +
                                                          "/copy/text",
                                                        schemaPath:
                                                          "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/headers/elements/properties/copy/mapping/adapted/properties/text/type",
                                                        keyword: "type",
                                                        params: {
                                                          type: "string",
                                                          nullable: false,
                                                        },
                                                        message:
                                                          "must be string",
                                                      };
                                                      if (vErrors === null) {
                                                        vErrors = [err248];
                                                      } else {
                                                        vErrors.push(err248);
                                                      }
                                                      errors++;
                                                    }
                                                  } else {
                                                    const err249 = {
                                                      instancePath:
                                                        instancePath +
                                                        "/body/sections/" +
                                                        i5 +
                                                        "/blocks/" +
                                                        i7 +
                                                        "/headers/" +
                                                        i12 +
                                                        "/copy",
                                                      schemaPath:
                                                        "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/headers/elements/properties/copy/mapping/adapted/properties/text",
                                                      keyword: "properties",
                                                      params: {
                                                        error: "missing",
                                                        missingProperty: "text",
                                                      },
                                                      message:
                                                        "must have property 'text'",
                                                    };
                                                    if (vErrors === null) {
                                                      vErrors = [err249];
                                                    } else {
                                                      vErrors.push(err249);
                                                    }
                                                    errors++;
                                                  }
                                                  if (
                                                    data99.sourceRef !==
                                                    undefined
                                                  ) {
                                                    if (
                                                      !(
                                                        typeof data99.sourceRef ==
                                                        "string"
                                                      )
                                                    ) {
                                                      const err250 = {
                                                        instancePath:
                                                          instancePath +
                                                          "/body/sections/" +
                                                          i5 +
                                                          "/blocks/" +
                                                          i7 +
                                                          "/headers/" +
                                                          i12 +
                                                          "/copy/sourceRef",
                                                        schemaPath:
                                                          "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/headers/elements/properties/copy/mapping/adapted/properties/sourceRef/type",
                                                        keyword: "type",
                                                        params: {
                                                          type: "string",
                                                          nullable: false,
                                                        },
                                                        message:
                                                          "must be string",
                                                      };
                                                      if (vErrors === null) {
                                                        vErrors = [err250];
                                                      } else {
                                                        vErrors.push(err250);
                                                      }
                                                      errors++;
                                                    }
                                                  } else {
                                                    const err251 = {
                                                      instancePath:
                                                        instancePath +
                                                        "/body/sections/" +
                                                        i5 +
                                                        "/blocks/" +
                                                        i7 +
                                                        "/headers/" +
                                                        i12 +
                                                        "/copy",
                                                      schemaPath:
                                                        "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/headers/elements/properties/copy/mapping/adapted/properties/sourceRef",
                                                      keyword: "properties",
                                                      params: {
                                                        error: "missing",
                                                        missingProperty:
                                                          "sourceRef",
                                                      },
                                                      message:
                                                        "must have property 'sourceRef'",
                                                    };
                                                    if (vErrors === null) {
                                                      vErrors = [err251];
                                                    } else {
                                                      vErrors.push(err251);
                                                    }
                                                    errors++;
                                                  }
                                                  for (const key32 in data99) {
                                                    if (
                                                      key32 !== "kind" &&
                                                      key32 !== "text" &&
                                                      key32 !== "sourceRef"
                                                    ) {
                                                      const err252 = {
                                                        instancePath:
                                                          instancePath +
                                                          "/body/sections/" +
                                                          i5 +
                                                          "/blocks/" +
                                                          i7 +
                                                          "/headers/" +
                                                          i12 +
                                                          "/copy/" +
                                                          key32
                                                            .replace(/~/g, "~0")
                                                            .replace(
                                                              /\//g,
                                                              "~1",
                                                            ),
                                                        schemaPath:
                                                          "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/headers/elements/properties/copy/mapping/adapted",
                                                        keyword: "properties",
                                                        params: {
                                                          error: "additional",
                                                          additionalProperty:
                                                            key32,
                                                        },
                                                        message:
                                                          "must NOT have additional properties",
                                                      };
                                                      if (vErrors === null) {
                                                        vErrors = [err252];
                                                      } else {
                                                        vErrors.push(err252);
                                                      }
                                                      errors++;
                                                    }
                                                  }
                                                  if (!valid173) {
                                                    const err253 = {
                                                      instancePath:
                                                        instancePath +
                                                        "/body/sections/" +
                                                        i5 +
                                                        "/blocks/" +
                                                        i7 +
                                                        "/headers/" +
                                                        i12 +
                                                        "/copy",
                                                      schemaPath:
                                                        "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/headers/elements/properties/copy/mapping/adapted/properties",
                                                      keyword: "properties",
                                                      params: {
                                                        type: "object",
                                                        nullable: false,
                                                      },
                                                      message: "must be object",
                                                    };
                                                    if (vErrors === null) {
                                                      vErrors = [err253];
                                                    } else {
                                                      vErrors.push(err253);
                                                    }
                                                    errors++;
                                                  }
                                                  var valid172 =
                                                    _errs124 === errors;
                                                  valid163 = valid172;
                                                } else {
                                                  const err254 = {
                                                    instancePath:
                                                      instancePath +
                                                      "/body/sections/" +
                                                      i5 +
                                                      "/blocks/" +
                                                      i7 +
                                                      "/headers/" +
                                                      i12 +
                                                      "/copy/kind",
                                                    schemaPath:
                                                      "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/headers/elements/properties/copy/mapping",
                                                    keyword: "discriminator",
                                                    params: {
                                                      error: "mapping",
                                                      tag: "kind",
                                                      tagValue: tag6,
                                                    },
                                                    message:
                                                      'value of tag "kind" must be in mapping',
                                                  };
                                                  if (vErrors === null) {
                                                    vErrors = [err254];
                                                  } else {
                                                    vErrors.push(err254);
                                                  }
                                                  errors++;
                                                }
                                              } else {
                                                const err255 = {
                                                  instancePath:
                                                    instancePath +
                                                    "/body/sections/" +
                                                    i5 +
                                                    "/blocks/" +
                                                    i7 +
                                                    "/headers/" +
                                                    i12 +
                                                    "/copy/kind",
                                                  schemaPath:
                                                    "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/headers/elements/properties/copy/discriminator",
                                                  keyword: "discriminator",
                                                  params: {
                                                    error: "tag",
                                                    tag: "kind",
                                                    tagValue: tag6,
                                                  },
                                                  message:
                                                    'tag "kind" must be string',
                                                };
                                                if (vErrors === null) {
                                                  vErrors = [err255];
                                                } else {
                                                  vErrors.push(err255);
                                                }
                                                errors++;
                                              }
                                            } else if (!valid163) {
                                              const err256 = {
                                                instancePath:
                                                  instancePath +
                                                  "/body/sections/" +
                                                  i5 +
                                                  "/blocks/" +
                                                  i7 +
                                                  "/headers/" +
                                                  i12 +
                                                  "/copy",
                                                schemaPath:
                                                  "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/headers/elements/properties/copy/discriminator",
                                                keyword: "discriminator",
                                                params: {
                                                  type: "object",
                                                  nullable: false,
                                                },
                                                message: "must be object",
                                              };
                                              if (vErrors === null) {
                                                vErrors = [err256];
                                              } else {
                                                vErrors.push(err256);
                                              }
                                              errors++;
                                            }
                                          } else {
                                            const err257 = {
                                              instancePath:
                                                instancePath +
                                                "/body/sections/" +
                                                i5 +
                                                "/blocks/" +
                                                i7 +
                                                "/headers/" +
                                                i12,
                                              schemaPath:
                                                "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/headers/elements/properties/copy",
                                              keyword: "properties",
                                              params: {
                                                error: "missing",
                                                missingProperty: "copy",
                                              },
                                              message:
                                                "must have property 'copy'",
                                            };
                                            if (vErrors === null) {
                                              vErrors = [err257];
                                            } else {
                                              vErrors.push(err257);
                                            }
                                            errors++;
                                          }
                                          if (data98.marks !== undefined) {
                                            let data105 = data98.marks;
                                            let valid176 = false;
                                            if (!valid176) {
                                              if (Array.isArray(data105)) {
                                                let valid178 = true;
                                                const len13 = data105.length;
                                                for (
                                                  let i13 = 0;
                                                  i13 < len13;
                                                  i13++
                                                ) {
                                                  let data106 = data105[i13];
                                                  const _errs128 = errors;
                                                  let valid179 = false;
                                                  if (
                                                    data106 &&
                                                    typeof data106 ==
                                                      "object" &&
                                                    !Array.isArray(data106)
                                                  ) {
                                                    valid179 = true;
                                                    if (
                                                      data106.kind !== undefined
                                                    ) {
                                                      let data107 =
                                                        data106.kind;
                                                      if (!(
                                                        typeof data107 ==
                                                          "string" &&
                                                        (data107 === "bold" ||
                                                          data107 ===
                                                            "italic" ||
                                                          data107 ===
                                                            "underline")
                                                      )) {
                                                        const err258 = {
                                                          instancePath:
                                                            instancePath +
                                                            "/body/sections/" +
                                                            i5 +
                                                            "/blocks/" +
                                                            i7 +
                                                            "/headers/" +
                                                            i12 +
                                                            "/marks/" +
                                                            i13 +
                                                            "/kind",
                                                          schemaPath:
                                                            "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/headers/elements/properties/marks/elements/properties/kind/enum",
                                                          keyword: "enum",
                                                          params: {
                                                            allowedValues:
                                                              schema30
                                                                .properties.body
                                                                .properties
                                                                .sections
                                                                .elements
                                                                .properties
                                                                .blocks.elements
                                                                .mapping.table
                                                                .properties
                                                                .headers
                                                                .elements
                                                                .properties
                                                                .marks.elements
                                                                .properties.kind
                                                                .enum,
                                                          },
                                                          message:
                                                            "must be equal to one of the allowed values",
                                                        };
                                                        if (vErrors === null) {
                                                          vErrors = [err258];
                                                        } else {
                                                          vErrors.push(err258);
                                                        }
                                                        errors++;
                                                      }
                                                    } else {
                                                      const err259 = {
                                                        instancePath:
                                                          instancePath +
                                                          "/body/sections/" +
                                                          i5 +
                                                          "/blocks/" +
                                                          i7 +
                                                          "/headers/" +
                                                          i12 +
                                                          "/marks/" +
                                                          i13,
                                                        schemaPath:
                                                          "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/headers/elements/properties/marks/elements/properties/kind",
                                                        keyword: "properties",
                                                        params: {
                                                          error: "missing",
                                                          missingProperty:
                                                            "kind",
                                                        },
                                                        message:
                                                          "must have property 'kind'",
                                                      };
                                                      if (vErrors === null) {
                                                        vErrors = [err259];
                                                      } else {
                                                        vErrors.push(err259);
                                                      }
                                                      errors++;
                                                    }
                                                    if (
                                                      data106.start !==
                                                      undefined
                                                    ) {
                                                      let data108 =
                                                        data106.start;
                                                      if (!(
                                                        typeof data108 ==
                                                          "number" &&
                                                        isFinite(data108) &&
                                                        !(data108 % 1) &&
                                                        data108 >= 0 &&
                                                        data108 <= 4294967295
                                                      )) {
                                                        const err260 = {
                                                          instancePath:
                                                            instancePath +
                                                            "/body/sections/" +
                                                            i5 +
                                                            "/blocks/" +
                                                            i7 +
                                                            "/headers/" +
                                                            i12 +
                                                            "/marks/" +
                                                            i13 +
                                                            "/start",
                                                          schemaPath:
                                                            "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/headers/elements/properties/marks/elements/properties/start/type",
                                                          keyword: "type",
                                                          params: {
                                                            type: "uint32",
                                                            nullable: false,
                                                          },
                                                          message:
                                                            "must be uint32",
                                                        };
                                                        if (vErrors === null) {
                                                          vErrors = [err260];
                                                        } else {
                                                          vErrors.push(err260);
                                                        }
                                                        errors++;
                                                      }
                                                    } else {
                                                      const err261 = {
                                                        instancePath:
                                                          instancePath +
                                                          "/body/sections/" +
                                                          i5 +
                                                          "/blocks/" +
                                                          i7 +
                                                          "/headers/" +
                                                          i12 +
                                                          "/marks/" +
                                                          i13,
                                                        schemaPath:
                                                          "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/headers/elements/properties/marks/elements/properties/start",
                                                        keyword: "properties",
                                                        params: {
                                                          error: "missing",
                                                          missingProperty:
                                                            "start",
                                                        },
                                                        message:
                                                          "must have property 'start'",
                                                      };
                                                      if (vErrors === null) {
                                                        vErrors = [err261];
                                                      } else {
                                                        vErrors.push(err261);
                                                      }
                                                      errors++;
                                                    }
                                                    if (
                                                      data106.length !==
                                                      undefined
                                                    ) {
                                                      let data109 =
                                                        data106.length;
                                                      if (!(
                                                        typeof data109 ==
                                                          "number" &&
                                                        isFinite(data109) &&
                                                        !(data109 % 1) &&
                                                        data109 >= 0 &&
                                                        data109 <= 4294967295
                                                      )) {
                                                        const err262 = {
                                                          instancePath:
                                                            instancePath +
                                                            "/body/sections/" +
                                                            i5 +
                                                            "/blocks/" +
                                                            i7 +
                                                            "/headers/" +
                                                            i12 +
                                                            "/marks/" +
                                                            i13 +
                                                            "/length",
                                                          schemaPath:
                                                            "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/headers/elements/properties/marks/elements/properties/length/type",
                                                          keyword: "type",
                                                          params: {
                                                            type: "uint32",
                                                            nullable: false,
                                                          },
                                                          message:
                                                            "must be uint32",
                                                        };
                                                        if (vErrors === null) {
                                                          vErrors = [err262];
                                                        } else {
                                                          vErrors.push(err262);
                                                        }
                                                        errors++;
                                                      }
                                                    } else {
                                                      const err263 = {
                                                        instancePath:
                                                          instancePath +
                                                          "/body/sections/" +
                                                          i5 +
                                                          "/blocks/" +
                                                          i7 +
                                                          "/headers/" +
                                                          i12 +
                                                          "/marks/" +
                                                          i13,
                                                        schemaPath:
                                                          "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/headers/elements/properties/marks/elements/properties/length",
                                                        keyword: "properties",
                                                        params: {
                                                          error: "missing",
                                                          missingProperty:
                                                            "length",
                                                        },
                                                        message:
                                                          "must have property 'length'",
                                                      };
                                                      if (vErrors === null) {
                                                        vErrors = [err263];
                                                      } else {
                                                        vErrors.push(err263);
                                                      }
                                                      errors++;
                                                    }
                                                    for (const key33 in data106) {
                                                      if (
                                                        key33 !== "kind" &&
                                                        key33 !== "start" &&
                                                        key33 !== "length"
                                                      ) {
                                                        const err264 = {
                                                          instancePath:
                                                            instancePath +
                                                            "/body/sections/" +
                                                            i5 +
                                                            "/blocks/" +
                                                            i7 +
                                                            "/headers/" +
                                                            i12 +
                                                            "/marks/" +
                                                            i13 +
                                                            "/" +
                                                            key33
                                                              .replace(
                                                                /~/g,
                                                                "~0",
                                                              )
                                                              .replace(
                                                                /\//g,
                                                                "~1",
                                                              ),
                                                          schemaPath:
                                                            "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/headers/elements/properties/marks/elements",
                                                          keyword: "properties",
                                                          params: {
                                                            error: "additional",
                                                            additionalProperty:
                                                              key33,
                                                          },
                                                          message:
                                                            "must NOT have additional properties",
                                                        };
                                                        if (vErrors === null) {
                                                          vErrors = [err264];
                                                        } else {
                                                          vErrors.push(err264);
                                                        }
                                                        errors++;
                                                      }
                                                    }
                                                  }
                                                  if (!valid179) {
                                                    const err265 = {
                                                      instancePath:
                                                        instancePath +
                                                        "/body/sections/" +
                                                        i5 +
                                                        "/blocks/" +
                                                        i7 +
                                                        "/headers/" +
                                                        i12 +
                                                        "/marks/" +
                                                        i13,
                                                      schemaPath:
                                                        "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/headers/elements/properties/marks/elements/properties",
                                                      keyword: "properties",
                                                      params: {
                                                        type: "object",
                                                        nullable: false,
                                                      },
                                                      message: "must be object",
                                                    };
                                                    if (vErrors === null) {
                                                      vErrors = [err265];
                                                    } else {
                                                      vErrors.push(err265);
                                                    }
                                                    errors++;
                                                  }
                                                  var valid177 =
                                                    _errs128 === errors;
                                                  if (!valid177) {
                                                    valid178 = false;
                                                  }
                                                }
                                                valid176 = valid178;
                                              } else {
                                                const err266 = {
                                                  instancePath:
                                                    instancePath +
                                                    "/body/sections/" +
                                                    i5 +
                                                    "/blocks/" +
                                                    i7 +
                                                    "/headers/" +
                                                    i12 +
                                                    "/marks",
                                                  schemaPath:
                                                    "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/headers/elements/properties/marks/elements",
                                                  keyword: "elements",
                                                  params: {
                                                    type: "array",
                                                    nullable: false,
                                                  },
                                                  message: "must be array",
                                                };
                                                if (vErrors === null) {
                                                  vErrors = [err266];
                                                } else {
                                                  vErrors.push(err266);
                                                }
                                                errors++;
                                              }
                                            }
                                          } else {
                                            const err267 = {
                                              instancePath:
                                                instancePath +
                                                "/body/sections/" +
                                                i5 +
                                                "/blocks/" +
                                                i7 +
                                                "/headers/" +
                                                i12,
                                              schemaPath:
                                                "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/headers/elements/properties/marks",
                                              keyword: "properties",
                                              params: {
                                                error: "missing",
                                                missingProperty: "marks",
                                              },
                                              message:
                                                "must have property 'marks'",
                                            };
                                            if (vErrors === null) {
                                              vErrors = [err267];
                                            } else {
                                              vErrors.push(err267);
                                            }
                                            errors++;
                                          }
                                          for (const key34 in data98) {
                                            if (
                                              key34 !== "copy" &&
                                              key34 !== "marks"
                                            ) {
                                              const err268 = {
                                                instancePath:
                                                  instancePath +
                                                  "/body/sections/" +
                                                  i5 +
                                                  "/blocks/" +
                                                  i7 +
                                                  "/headers/" +
                                                  i12 +
                                                  "/" +
                                                  key34
                                                    .replace(/~/g, "~0")
                                                    .replace(/\//g, "~1"),
                                                schemaPath:
                                                  "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/headers/elements",
                                                keyword: "properties",
                                                params: {
                                                  error: "additional",
                                                  additionalProperty: key34,
                                                },
                                                message:
                                                  "must NOT have additional properties",
                                              };
                                              if (vErrors === null) {
                                                vErrors = [err268];
                                              } else {
                                                vErrors.push(err268);
                                              }
                                              errors++;
                                            }
                                          }
                                        }
                                        if (!valid161) {
                                          const err269 = {
                                            instancePath:
                                              instancePath +
                                              "/body/sections/" +
                                              i5 +
                                              "/blocks/" +
                                              i7 +
                                              "/headers/" +
                                              i12,
                                            schemaPath:
                                              "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/headers/elements/properties",
                                            keyword: "properties",
                                            params: {
                                              type: "object",
                                              nullable: false,
                                            },
                                            message: "must be object",
                                          };
                                          if (vErrors === null) {
                                            vErrors = [err269];
                                          } else {
                                            vErrors.push(err269);
                                          }
                                          errors++;
                                        }
                                        var valid159 = _errs117 === errors;
                                        if (!valid159) {
                                          valid160 = false;
                                        }
                                      }
                                      valid158 = valid160;
                                    } else {
                                      const err270 = {
                                        instancePath:
                                          instancePath +
                                          "/body/sections/" +
                                          i5 +
                                          "/blocks/" +
                                          i7 +
                                          "/headers",
                                        schemaPath:
                                          "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/headers/elements",
                                        keyword: "elements",
                                        params: {
                                          type: "array",
                                          nullable: false,
                                        },
                                        message: "must be array",
                                      };
                                      if (vErrors === null) {
                                        vErrors = [err270];
                                      } else {
                                        vErrors.push(err270);
                                      }
                                      errors++;
                                    }
                                  }
                                } else {
                                  const err271 = {
                                    instancePath:
                                      instancePath +
                                      "/body/sections/" +
                                      i5 +
                                      "/blocks/" +
                                      i7,
                                    schemaPath:
                                      "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/headers",
                                    keyword: "properties",
                                    params: {
                                      error: "missing",
                                      missingProperty: "headers",
                                    },
                                    message: "must have property 'headers'",
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err271];
                                  } else {
                                    vErrors.push(err271);
                                  }
                                  errors++;
                                }
                                if (data54.rows !== undefined) {
                                  let data110 = data54.rows;
                                  let valid183 = false;
                                  if (!valid183) {
                                    if (Array.isArray(data110)) {
                                      let valid185 = true;
                                      const len14 = data110.length;
                                      for (let i14 = 0; i14 < len14; i14++) {
                                        let data111 = data110[i14];
                                        const _errs133 = errors;
                                        let valid186 = false;
                                        if (
                                          data111 &&
                                          typeof data111 == "object" &&
                                          !Array.isArray(data111)
                                        ) {
                                          valid186 = true;
                                          if (data111.cells !== undefined) {
                                            let data112 = data111.cells;
                                            let valid188 = false;
                                            if (!valid188) {
                                              if (Array.isArray(data112)) {
                                                let valid190 = true;
                                                const len15 = data112.length;
                                                for (
                                                  let i15 = 0;
                                                  i15 < len15;
                                                  i15++
                                                ) {
                                                  let data113 = data112[i15];
                                                  const _errs135 = errors;
                                                  let valid191 = false;
                                                  if (
                                                    data113 &&
                                                    typeof data113 ==
                                                      "object" &&
                                                    !Array.isArray(data113)
                                                  ) {
                                                    valid191 = true;
                                                    if (
                                                      data113.lines !==
                                                      undefined
                                                    ) {
                                                      let data114 =
                                                        data113.lines;
                                                      let valid193 = false;
                                                      if (!valid193) {
                                                        if (
                                                          Array.isArray(data114)
                                                        ) {
                                                          let valid195 = true;
                                                          const len16 =
                                                            data114.length;
                                                          for (
                                                            let i16 = 0;
                                                            i16 < len16;
                                                            i16++
                                                          ) {
                                                            let data115 =
                                                              data114[i16];
                                                            const _errs137 =
                                                              errors;
                                                            let valid196 = false;
                                                            if (
                                                              data115 &&
                                                              typeof data115 ==
                                                                "object" &&
                                                              !Array.isArray(
                                                                data115,
                                                              )
                                                            ) {
                                                              valid196 = true;
                                                              if (
                                                                data115.copy !==
                                                                undefined
                                                              ) {
                                                                let data116 =
                                                                  data115.copy;
                                                                let valid198 = false;
                                                                if (
                                                                  data116 &&
                                                                  typeof data116 ==
                                                                    "object" &&
                                                                  !Array.isArray(
                                                                    data116,
                                                                  )
                                                                ) {
                                                                  const tag7 =
                                                                    data116.kind;
                                                                  if (
                                                                    tag7 ===
                                                                    undefined
                                                                  ) {
                                                                    const err272 =
                                                                      {
                                                                        instancePath:
                                                                          instancePath +
                                                                          "/body/sections/" +
                                                                          i5 +
                                                                          "/blocks/" +
                                                                          i7 +
                                                                          "/rows/" +
                                                                          i14 +
                                                                          "/cells/" +
                                                                          i15 +
                                                                          "/lines/" +
                                                                          i16 +
                                                                          "/copy",
                                                                        schemaPath:
                                                                          "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/rows/elements/properties/cells/elements/properties/lines/elements/properties/copy/discriminator",
                                                                        keyword:
                                                                          "discriminator",
                                                                        params:
                                                                          {
                                                                            error:
                                                                              "tag",
                                                                            tag: "kind",
                                                                            tagValue:
                                                                              tag7,
                                                                          },
                                                                        message:
                                                                          'tag "kind" must be string',
                                                                      };
                                                                    if (
                                                                      vErrors ===
                                                                      null
                                                                    ) {
                                                                      vErrors =
                                                                        [
                                                                          err272,
                                                                        ];
                                                                    } else {
                                                                      vErrors.push(
                                                                        err272,
                                                                      );
                                                                    }
                                                                    errors++;
                                                                  } else if (
                                                                    typeof tag7 ==
                                                                    "string"
                                                                  ) {
                                                                    if (
                                                                      tag7 ===
                                                                      "added"
                                                                    ) {
                                                                      const _errs139 =
                                                                        errors;
                                                                      let valid200 = false;
                                                                      valid200 = true;
                                                                      if (
                                                                        data116.text !==
                                                                        undefined
                                                                      ) {
                                                                        if (
                                                                          !(
                                                                            typeof data116.text ==
                                                                            "string"
                                                                          )
                                                                        ) {
                                                                          const err273 =
                                                                            {
                                                                              instancePath:
                                                                                instancePath +
                                                                                "/body/sections/" +
                                                                                i5 +
                                                                                "/blocks/" +
                                                                                i7 +
                                                                                "/rows/" +
                                                                                i14 +
                                                                                "/cells/" +
                                                                                i15 +
                                                                                "/lines/" +
                                                                                i16 +
                                                                                "/copy/text",
                                                                              schemaPath:
                                                                                "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/rows/elements/properties/cells/elements/properties/lines/elements/properties/copy/mapping/added/properties/text/type",
                                                                              keyword:
                                                                                "type",
                                                                              params:
                                                                                {
                                                                                  type: "string",
                                                                                  nullable: false,
                                                                                },
                                                                              message:
                                                                                "must be string",
                                                                            };
                                                                          if (
                                                                            vErrors ===
                                                                            null
                                                                          ) {
                                                                            vErrors =
                                                                              [
                                                                                err273,
                                                                              ];
                                                                          } else {
                                                                            vErrors.push(
                                                                              err273,
                                                                            );
                                                                          }
                                                                          errors++;
                                                                        }
                                                                      } else {
                                                                        const err274 =
                                                                          {
                                                                            instancePath:
                                                                              instancePath +
                                                                              "/body/sections/" +
                                                                              i5 +
                                                                              "/blocks/" +
                                                                              i7 +
                                                                              "/rows/" +
                                                                              i14 +
                                                                              "/cells/" +
                                                                              i15 +
                                                                              "/lines/" +
                                                                              i16 +
                                                                              "/copy",
                                                                            schemaPath:
                                                                              "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/rows/elements/properties/cells/elements/properties/lines/elements/properties/copy/mapping/added/properties/text",
                                                                            keyword:
                                                                              "properties",
                                                                            params:
                                                                              {
                                                                                error:
                                                                                  "missing",
                                                                                missingProperty:
                                                                                  "text",
                                                                              },
                                                                            message:
                                                                              "must have property 'text'",
                                                                          };
                                                                        if (
                                                                          vErrors ===
                                                                          null
                                                                        ) {
                                                                          vErrors =
                                                                            [
                                                                              err274,
                                                                            ];
                                                                        } else {
                                                                          vErrors.push(
                                                                            err274,
                                                                          );
                                                                        }
                                                                        errors++;
                                                                      }
                                                                      for (const key35 in data116) {
                                                                        if (
                                                                          key35 !==
                                                                            "kind" &&
                                                                          key35 !==
                                                                            "text"
                                                                        ) {
                                                                          const err275 =
                                                                            {
                                                                              instancePath:
                                                                                instancePath +
                                                                                "/body/sections/" +
                                                                                i5 +
                                                                                "/blocks/" +
                                                                                i7 +
                                                                                "/rows/" +
                                                                                i14 +
                                                                                "/cells/" +
                                                                                i15 +
                                                                                "/lines/" +
                                                                                i16 +
                                                                                "/copy/" +
                                                                                key35
                                                                                  .replace(
                                                                                    /~/g,
                                                                                    "~0",
                                                                                  )
                                                                                  .replace(
                                                                                    /\//g,
                                                                                    "~1",
                                                                                  ),
                                                                              schemaPath:
                                                                                "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/rows/elements/properties/cells/elements/properties/lines/elements/properties/copy/mapping/added",
                                                                              keyword:
                                                                                "properties",
                                                                              params:
                                                                                {
                                                                                  error:
                                                                                    "additional",
                                                                                  additionalProperty:
                                                                                    key35,
                                                                                },
                                                                              message:
                                                                                "must NOT have additional properties",
                                                                            };
                                                                          if (
                                                                            vErrors ===
                                                                            null
                                                                          ) {
                                                                            vErrors =
                                                                              [
                                                                                err275,
                                                                              ];
                                                                          } else {
                                                                            vErrors.push(
                                                                              err275,
                                                                            );
                                                                          }
                                                                          errors++;
                                                                        }
                                                                      }
                                                                      if (
                                                                        !valid200
                                                                      ) {
                                                                        const err276 =
                                                                          {
                                                                            instancePath:
                                                                              instancePath +
                                                                              "/body/sections/" +
                                                                              i5 +
                                                                              "/blocks/" +
                                                                              i7 +
                                                                              "/rows/" +
                                                                              i14 +
                                                                              "/cells/" +
                                                                              i15 +
                                                                              "/lines/" +
                                                                              i16 +
                                                                              "/copy",
                                                                            schemaPath:
                                                                              "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/rows/elements/properties/cells/elements/properties/lines/elements/properties/copy/mapping/added/properties",
                                                                            keyword:
                                                                              "properties",
                                                                            params:
                                                                              {
                                                                                type: "object",
                                                                                nullable: false,
                                                                              },
                                                                            message:
                                                                              "must be object",
                                                                          };
                                                                        if (
                                                                          vErrors ===
                                                                          null
                                                                        ) {
                                                                          vErrors =
                                                                            [
                                                                              err276,
                                                                            ];
                                                                        } else {
                                                                          vErrors.push(
                                                                            err276,
                                                                          );
                                                                        }
                                                                        errors++;
                                                                      }
                                                                      var valid199 =
                                                                        _errs139 ===
                                                                        errors;
                                                                      valid198 =
                                                                        valid199;
                                                                    } else if (
                                                                      tag7 ===
                                                                      "source"
                                                                    ) {
                                                                      const _errs141 =
                                                                        errors;
                                                                      let valid204 = false;
                                                                      valid204 = true;
                                                                      if (
                                                                        data116.text !==
                                                                        undefined
                                                                      ) {
                                                                        if (
                                                                          !(
                                                                            typeof data116.text ==
                                                                            "string"
                                                                          )
                                                                        ) {
                                                                          const err277 =
                                                                            {
                                                                              instancePath:
                                                                                instancePath +
                                                                                "/body/sections/" +
                                                                                i5 +
                                                                                "/blocks/" +
                                                                                i7 +
                                                                                "/rows/" +
                                                                                i14 +
                                                                                "/cells/" +
                                                                                i15 +
                                                                                "/lines/" +
                                                                                i16 +
                                                                                "/copy/text",
                                                                              schemaPath:
                                                                                "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/rows/elements/properties/cells/elements/properties/lines/elements/properties/copy/mapping/source/properties/text/type",
                                                                              keyword:
                                                                                "type",
                                                                              params:
                                                                                {
                                                                                  type: "string",
                                                                                  nullable: false,
                                                                                },
                                                                              message:
                                                                                "must be string",
                                                                            };
                                                                          if (
                                                                            vErrors ===
                                                                            null
                                                                          ) {
                                                                            vErrors =
                                                                              [
                                                                                err277,
                                                                              ];
                                                                          } else {
                                                                            vErrors.push(
                                                                              err277,
                                                                            );
                                                                          }
                                                                          errors++;
                                                                        }
                                                                      } else {
                                                                        const err278 =
                                                                          {
                                                                            instancePath:
                                                                              instancePath +
                                                                              "/body/sections/" +
                                                                              i5 +
                                                                              "/blocks/" +
                                                                              i7 +
                                                                              "/rows/" +
                                                                              i14 +
                                                                              "/cells/" +
                                                                              i15 +
                                                                              "/lines/" +
                                                                              i16 +
                                                                              "/copy",
                                                                            schemaPath:
                                                                              "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/rows/elements/properties/cells/elements/properties/lines/elements/properties/copy/mapping/source/properties/text",
                                                                            keyword:
                                                                              "properties",
                                                                            params:
                                                                              {
                                                                                error:
                                                                                  "missing",
                                                                                missingProperty:
                                                                                  "text",
                                                                              },
                                                                            message:
                                                                              "must have property 'text'",
                                                                          };
                                                                        if (
                                                                          vErrors ===
                                                                          null
                                                                        ) {
                                                                          vErrors =
                                                                            [
                                                                              err278,
                                                                            ];
                                                                        } else {
                                                                          vErrors.push(
                                                                            err278,
                                                                          );
                                                                        }
                                                                        errors++;
                                                                      }
                                                                      if (
                                                                        data116.sourceRef !==
                                                                        undefined
                                                                      ) {
                                                                        if (
                                                                          !(
                                                                            typeof data116.sourceRef ==
                                                                            "string"
                                                                          )
                                                                        ) {
                                                                          const err279 =
                                                                            {
                                                                              instancePath:
                                                                                instancePath +
                                                                                "/body/sections/" +
                                                                                i5 +
                                                                                "/blocks/" +
                                                                                i7 +
                                                                                "/rows/" +
                                                                                i14 +
                                                                                "/cells/" +
                                                                                i15 +
                                                                                "/lines/" +
                                                                                i16 +
                                                                                "/copy/sourceRef",
                                                                              schemaPath:
                                                                                "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/rows/elements/properties/cells/elements/properties/lines/elements/properties/copy/mapping/source/properties/sourceRef/type",
                                                                              keyword:
                                                                                "type",
                                                                              params:
                                                                                {
                                                                                  type: "string",
                                                                                  nullable: false,
                                                                                },
                                                                              message:
                                                                                "must be string",
                                                                            };
                                                                          if (
                                                                            vErrors ===
                                                                            null
                                                                          ) {
                                                                            vErrors =
                                                                              [
                                                                                err279,
                                                                              ];
                                                                          } else {
                                                                            vErrors.push(
                                                                              err279,
                                                                            );
                                                                          }
                                                                          errors++;
                                                                        }
                                                                      } else {
                                                                        const err280 =
                                                                          {
                                                                            instancePath:
                                                                              instancePath +
                                                                              "/body/sections/" +
                                                                              i5 +
                                                                              "/blocks/" +
                                                                              i7 +
                                                                              "/rows/" +
                                                                              i14 +
                                                                              "/cells/" +
                                                                              i15 +
                                                                              "/lines/" +
                                                                              i16 +
                                                                              "/copy",
                                                                            schemaPath:
                                                                              "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/rows/elements/properties/cells/elements/properties/lines/elements/properties/copy/mapping/source/properties/sourceRef",
                                                                            keyword:
                                                                              "properties",
                                                                            params:
                                                                              {
                                                                                error:
                                                                                  "missing",
                                                                                missingProperty:
                                                                                  "sourceRef",
                                                                              },
                                                                            message:
                                                                              "must have property 'sourceRef'",
                                                                          };
                                                                        if (
                                                                          vErrors ===
                                                                          null
                                                                        ) {
                                                                          vErrors =
                                                                            [
                                                                              err280,
                                                                            ];
                                                                        } else {
                                                                          vErrors.push(
                                                                            err280,
                                                                          );
                                                                        }
                                                                        errors++;
                                                                      }
                                                                      for (const key36 in data116) {
                                                                        if (
                                                                          key36 !==
                                                                            "kind" &&
                                                                          key36 !==
                                                                            "text" &&
                                                                          key36 !==
                                                                            "sourceRef"
                                                                        ) {
                                                                          const err281 =
                                                                            {
                                                                              instancePath:
                                                                                instancePath +
                                                                                "/body/sections/" +
                                                                                i5 +
                                                                                "/blocks/" +
                                                                                i7 +
                                                                                "/rows/" +
                                                                                i14 +
                                                                                "/cells/" +
                                                                                i15 +
                                                                                "/lines/" +
                                                                                i16 +
                                                                                "/copy/" +
                                                                                key36
                                                                                  .replace(
                                                                                    /~/g,
                                                                                    "~0",
                                                                                  )
                                                                                  .replace(
                                                                                    /\//g,
                                                                                    "~1",
                                                                                  ),
                                                                              schemaPath:
                                                                                "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/rows/elements/properties/cells/elements/properties/lines/elements/properties/copy/mapping/source",
                                                                              keyword:
                                                                                "properties",
                                                                              params:
                                                                                {
                                                                                  error:
                                                                                    "additional",
                                                                                  additionalProperty:
                                                                                    key36,
                                                                                },
                                                                              message:
                                                                                "must NOT have additional properties",
                                                                            };
                                                                          if (
                                                                            vErrors ===
                                                                            null
                                                                          ) {
                                                                            vErrors =
                                                                              [
                                                                                err281,
                                                                              ];
                                                                          } else {
                                                                            vErrors.push(
                                                                              err281,
                                                                            );
                                                                          }
                                                                          errors++;
                                                                        }
                                                                      }
                                                                      if (
                                                                        !valid204
                                                                      ) {
                                                                        const err282 =
                                                                          {
                                                                            instancePath:
                                                                              instancePath +
                                                                              "/body/sections/" +
                                                                              i5 +
                                                                              "/blocks/" +
                                                                              i7 +
                                                                              "/rows/" +
                                                                              i14 +
                                                                              "/cells/" +
                                                                              i15 +
                                                                              "/lines/" +
                                                                              i16 +
                                                                              "/copy",
                                                                            schemaPath:
                                                                              "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/rows/elements/properties/cells/elements/properties/lines/elements/properties/copy/mapping/source/properties",
                                                                            keyword:
                                                                              "properties",
                                                                            params:
                                                                              {
                                                                                type: "object",
                                                                                nullable: false,
                                                                              },
                                                                            message:
                                                                              "must be object",
                                                                          };
                                                                        if (
                                                                          vErrors ===
                                                                          null
                                                                        ) {
                                                                          vErrors =
                                                                            [
                                                                              err282,
                                                                            ];
                                                                        } else {
                                                                          vErrors.push(
                                                                            err282,
                                                                          );
                                                                        }
                                                                        errors++;
                                                                      }
                                                                      var valid203 =
                                                                        _errs141 ===
                                                                        errors;
                                                                      valid198 =
                                                                        valid203;
                                                                    } else if (
                                                                      tag7 ===
                                                                      "adapted"
                                                                    ) {
                                                                      const _errs144 =
                                                                        errors;
                                                                      let valid208 = false;
                                                                      valid208 = true;
                                                                      if (
                                                                        data116.text !==
                                                                        undefined
                                                                      ) {
                                                                        if (
                                                                          !(
                                                                            typeof data116.text ==
                                                                            "string"
                                                                          )
                                                                        ) {
                                                                          const err283 =
                                                                            {
                                                                              instancePath:
                                                                                instancePath +
                                                                                "/body/sections/" +
                                                                                i5 +
                                                                                "/blocks/" +
                                                                                i7 +
                                                                                "/rows/" +
                                                                                i14 +
                                                                                "/cells/" +
                                                                                i15 +
                                                                                "/lines/" +
                                                                                i16 +
                                                                                "/copy/text",
                                                                              schemaPath:
                                                                                "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/rows/elements/properties/cells/elements/properties/lines/elements/properties/copy/mapping/adapted/properties/text/type",
                                                                              keyword:
                                                                                "type",
                                                                              params:
                                                                                {
                                                                                  type: "string",
                                                                                  nullable: false,
                                                                                },
                                                                              message:
                                                                                "must be string",
                                                                            };
                                                                          if (
                                                                            vErrors ===
                                                                            null
                                                                          ) {
                                                                            vErrors =
                                                                              [
                                                                                err283,
                                                                              ];
                                                                          } else {
                                                                            vErrors.push(
                                                                              err283,
                                                                            );
                                                                          }
                                                                          errors++;
                                                                        }
                                                                      } else {
                                                                        const err284 =
                                                                          {
                                                                            instancePath:
                                                                              instancePath +
                                                                              "/body/sections/" +
                                                                              i5 +
                                                                              "/blocks/" +
                                                                              i7 +
                                                                              "/rows/" +
                                                                              i14 +
                                                                              "/cells/" +
                                                                              i15 +
                                                                              "/lines/" +
                                                                              i16 +
                                                                              "/copy",
                                                                            schemaPath:
                                                                              "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/rows/elements/properties/cells/elements/properties/lines/elements/properties/copy/mapping/adapted/properties/text",
                                                                            keyword:
                                                                              "properties",
                                                                            params:
                                                                              {
                                                                                error:
                                                                                  "missing",
                                                                                missingProperty:
                                                                                  "text",
                                                                              },
                                                                            message:
                                                                              "must have property 'text'",
                                                                          };
                                                                        if (
                                                                          vErrors ===
                                                                          null
                                                                        ) {
                                                                          vErrors =
                                                                            [
                                                                              err284,
                                                                            ];
                                                                        } else {
                                                                          vErrors.push(
                                                                            err284,
                                                                          );
                                                                        }
                                                                        errors++;
                                                                      }
                                                                      if (
                                                                        data116.sourceRef !==
                                                                        undefined
                                                                      ) {
                                                                        if (
                                                                          !(
                                                                            typeof data116.sourceRef ==
                                                                            "string"
                                                                          )
                                                                        ) {
                                                                          const err285 =
                                                                            {
                                                                              instancePath:
                                                                                instancePath +
                                                                                "/body/sections/" +
                                                                                i5 +
                                                                                "/blocks/" +
                                                                                i7 +
                                                                                "/rows/" +
                                                                                i14 +
                                                                                "/cells/" +
                                                                                i15 +
                                                                                "/lines/" +
                                                                                i16 +
                                                                                "/copy/sourceRef",
                                                                              schemaPath:
                                                                                "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/rows/elements/properties/cells/elements/properties/lines/elements/properties/copy/mapping/adapted/properties/sourceRef/type",
                                                                              keyword:
                                                                                "type",
                                                                              params:
                                                                                {
                                                                                  type: "string",
                                                                                  nullable: false,
                                                                                },
                                                                              message:
                                                                                "must be string",
                                                                            };
                                                                          if (
                                                                            vErrors ===
                                                                            null
                                                                          ) {
                                                                            vErrors =
                                                                              [
                                                                                err285,
                                                                              ];
                                                                          } else {
                                                                            vErrors.push(
                                                                              err285,
                                                                            );
                                                                          }
                                                                          errors++;
                                                                        }
                                                                      } else {
                                                                        const err286 =
                                                                          {
                                                                            instancePath:
                                                                              instancePath +
                                                                              "/body/sections/" +
                                                                              i5 +
                                                                              "/blocks/" +
                                                                              i7 +
                                                                              "/rows/" +
                                                                              i14 +
                                                                              "/cells/" +
                                                                              i15 +
                                                                              "/lines/" +
                                                                              i16 +
                                                                              "/copy",
                                                                            schemaPath:
                                                                              "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/rows/elements/properties/cells/elements/properties/lines/elements/properties/copy/mapping/adapted/properties/sourceRef",
                                                                            keyword:
                                                                              "properties",
                                                                            params:
                                                                              {
                                                                                error:
                                                                                  "missing",
                                                                                missingProperty:
                                                                                  "sourceRef",
                                                                              },
                                                                            message:
                                                                              "must have property 'sourceRef'",
                                                                          };
                                                                        if (
                                                                          vErrors ===
                                                                          null
                                                                        ) {
                                                                          vErrors =
                                                                            [
                                                                              err286,
                                                                            ];
                                                                        } else {
                                                                          vErrors.push(
                                                                            err286,
                                                                          );
                                                                        }
                                                                        errors++;
                                                                      }
                                                                      for (const key37 in data116) {
                                                                        if (
                                                                          key37 !==
                                                                            "kind" &&
                                                                          key37 !==
                                                                            "text" &&
                                                                          key37 !==
                                                                            "sourceRef"
                                                                        ) {
                                                                          const err287 =
                                                                            {
                                                                              instancePath:
                                                                                instancePath +
                                                                                "/body/sections/" +
                                                                                i5 +
                                                                                "/blocks/" +
                                                                                i7 +
                                                                                "/rows/" +
                                                                                i14 +
                                                                                "/cells/" +
                                                                                i15 +
                                                                                "/lines/" +
                                                                                i16 +
                                                                                "/copy/" +
                                                                                key37
                                                                                  .replace(
                                                                                    /~/g,
                                                                                    "~0",
                                                                                  )
                                                                                  .replace(
                                                                                    /\//g,
                                                                                    "~1",
                                                                                  ),
                                                                              schemaPath:
                                                                                "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/rows/elements/properties/cells/elements/properties/lines/elements/properties/copy/mapping/adapted",
                                                                              keyword:
                                                                                "properties",
                                                                              params:
                                                                                {
                                                                                  error:
                                                                                    "additional",
                                                                                  additionalProperty:
                                                                                    key37,
                                                                                },
                                                                              message:
                                                                                "must NOT have additional properties",
                                                                            };
                                                                          if (
                                                                            vErrors ===
                                                                            null
                                                                          ) {
                                                                            vErrors =
                                                                              [
                                                                                err287,
                                                                              ];
                                                                          } else {
                                                                            vErrors.push(
                                                                              err287,
                                                                            );
                                                                          }
                                                                          errors++;
                                                                        }
                                                                      }
                                                                      if (
                                                                        !valid208
                                                                      ) {
                                                                        const err288 =
                                                                          {
                                                                            instancePath:
                                                                              instancePath +
                                                                              "/body/sections/" +
                                                                              i5 +
                                                                              "/blocks/" +
                                                                              i7 +
                                                                              "/rows/" +
                                                                              i14 +
                                                                              "/cells/" +
                                                                              i15 +
                                                                              "/lines/" +
                                                                              i16 +
                                                                              "/copy",
                                                                            schemaPath:
                                                                              "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/rows/elements/properties/cells/elements/properties/lines/elements/properties/copy/mapping/adapted/properties",
                                                                            keyword:
                                                                              "properties",
                                                                            params:
                                                                              {
                                                                                type: "object",
                                                                                nullable: false,
                                                                              },
                                                                            message:
                                                                              "must be object",
                                                                          };
                                                                        if (
                                                                          vErrors ===
                                                                          null
                                                                        ) {
                                                                          vErrors =
                                                                            [
                                                                              err288,
                                                                            ];
                                                                        } else {
                                                                          vErrors.push(
                                                                            err288,
                                                                          );
                                                                        }
                                                                        errors++;
                                                                      }
                                                                      var valid207 =
                                                                        _errs144 ===
                                                                        errors;
                                                                      valid198 =
                                                                        valid207;
                                                                    } else {
                                                                      const err289 =
                                                                        {
                                                                          instancePath:
                                                                            instancePath +
                                                                            "/body/sections/" +
                                                                            i5 +
                                                                            "/blocks/" +
                                                                            i7 +
                                                                            "/rows/" +
                                                                            i14 +
                                                                            "/cells/" +
                                                                            i15 +
                                                                            "/lines/" +
                                                                            i16 +
                                                                            "/copy/kind",
                                                                          schemaPath:
                                                                            "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/rows/elements/properties/cells/elements/properties/lines/elements/properties/copy/mapping",
                                                                          keyword:
                                                                            "discriminator",
                                                                          params:
                                                                            {
                                                                              error:
                                                                                "mapping",
                                                                              tag: "kind",
                                                                              tagValue:
                                                                                tag7,
                                                                            },
                                                                          message:
                                                                            'value of tag "kind" must be in mapping',
                                                                        };
                                                                      if (
                                                                        vErrors ===
                                                                        null
                                                                      ) {
                                                                        vErrors =
                                                                          [
                                                                            err289,
                                                                          ];
                                                                      } else {
                                                                        vErrors.push(
                                                                          err289,
                                                                        );
                                                                      }
                                                                      errors++;
                                                                    }
                                                                  } else {
                                                                    const err290 =
                                                                      {
                                                                        instancePath:
                                                                          instancePath +
                                                                          "/body/sections/" +
                                                                          i5 +
                                                                          "/blocks/" +
                                                                          i7 +
                                                                          "/rows/" +
                                                                          i14 +
                                                                          "/cells/" +
                                                                          i15 +
                                                                          "/lines/" +
                                                                          i16 +
                                                                          "/copy/kind",
                                                                        schemaPath:
                                                                          "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/rows/elements/properties/cells/elements/properties/lines/elements/properties/copy/discriminator",
                                                                        keyword:
                                                                          "discriminator",
                                                                        params:
                                                                          {
                                                                            error:
                                                                              "tag",
                                                                            tag: "kind",
                                                                            tagValue:
                                                                              tag7,
                                                                          },
                                                                        message:
                                                                          'tag "kind" must be string',
                                                                      };
                                                                    if (
                                                                      vErrors ===
                                                                      null
                                                                    ) {
                                                                      vErrors =
                                                                        [
                                                                          err290,
                                                                        ];
                                                                    } else {
                                                                      vErrors.push(
                                                                        err290,
                                                                      );
                                                                    }
                                                                    errors++;
                                                                  }
                                                                } else if (
                                                                  !valid198
                                                                ) {
                                                                  const err291 =
                                                                    {
                                                                      instancePath:
                                                                        instancePath +
                                                                        "/body/sections/" +
                                                                        i5 +
                                                                        "/blocks/" +
                                                                        i7 +
                                                                        "/rows/" +
                                                                        i14 +
                                                                        "/cells/" +
                                                                        i15 +
                                                                        "/lines/" +
                                                                        i16 +
                                                                        "/copy",
                                                                      schemaPath:
                                                                        "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/rows/elements/properties/cells/elements/properties/lines/elements/properties/copy/discriminator",
                                                                      keyword:
                                                                        "discriminator",
                                                                      params: {
                                                                        type: "object",
                                                                        nullable: false,
                                                                      },
                                                                      message:
                                                                        "must be object",
                                                                    };
                                                                  if (
                                                                    vErrors ===
                                                                    null
                                                                  ) {
                                                                    vErrors = [
                                                                      err291,
                                                                    ];
                                                                  } else {
                                                                    vErrors.push(
                                                                      err291,
                                                                    );
                                                                  }
                                                                  errors++;
                                                                }
                                                              } else {
                                                                const err292 = {
                                                                  instancePath:
                                                                    instancePath +
                                                                    "/body/sections/" +
                                                                    i5 +
                                                                    "/blocks/" +
                                                                    i7 +
                                                                    "/rows/" +
                                                                    i14 +
                                                                    "/cells/" +
                                                                    i15 +
                                                                    "/lines/" +
                                                                    i16,
                                                                  schemaPath:
                                                                    "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/rows/elements/properties/cells/elements/properties/lines/elements/properties/copy",
                                                                  keyword:
                                                                    "properties",
                                                                  params: {
                                                                    error:
                                                                      "missing",
                                                                    missingProperty:
                                                                      "copy",
                                                                  },
                                                                  message:
                                                                    "must have property 'copy'",
                                                                };
                                                                if (
                                                                  vErrors ===
                                                                  null
                                                                ) {
                                                                  vErrors = [
                                                                    err292,
                                                                  ];
                                                                } else {
                                                                  vErrors.push(
                                                                    err292,
                                                                  );
                                                                }
                                                                errors++;
                                                              }
                                                              if (
                                                                data115.marks !==
                                                                undefined
                                                              ) {
                                                                let data122 =
                                                                  data115.marks;
                                                                let valid211 = false;
                                                                if (!valid211) {
                                                                  if (
                                                                    Array.isArray(
                                                                      data122,
                                                                    )
                                                                  ) {
                                                                    let valid213 = true;
                                                                    const len17 =
                                                                      data122.length;
                                                                    for (
                                                                      let i17 = 0;
                                                                      i17 <
                                                                      len17;
                                                                      i17++
                                                                    ) {
                                                                      let data123 =
                                                                        data122[
                                                                          i17
                                                                        ];
                                                                      const _errs148 =
                                                                        errors;
                                                                      let valid214 = false;
                                                                      if (
                                                                        data123 &&
                                                                        typeof data123 ==
                                                                          "object" &&
                                                                        !Array.isArray(
                                                                          data123,
                                                                        )
                                                                      ) {
                                                                        valid214 = true;
                                                                        if (
                                                                          data123.kind !==
                                                                          undefined
                                                                        ) {
                                                                          let data124 =
                                                                            data123.kind;
                                                                          if (!(
                                                                            typeof data124 ==
                                                                              "string" &&
                                                                            (data124 ===
                                                                              "bold" ||
                                                                              data124 ===
                                                                                "italic" ||
                                                                              data124 ===
                                                                                "underline")
                                                                          )) {
                                                                            const err293 =
                                                                              {
                                                                                instancePath:
                                                                                  instancePath +
                                                                                  "/body/sections/" +
                                                                                  i5 +
                                                                                  "/blocks/" +
                                                                                  i7 +
                                                                                  "/rows/" +
                                                                                  i14 +
                                                                                  "/cells/" +
                                                                                  i15 +
                                                                                  "/lines/" +
                                                                                  i16 +
                                                                                  "/marks/" +
                                                                                  i17 +
                                                                                  "/kind",
                                                                                schemaPath:
                                                                                  "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/rows/elements/properties/cells/elements/properties/lines/elements/properties/marks/elements/properties/kind/enum",
                                                                                keyword:
                                                                                  "enum",
                                                                                params:
                                                                                  {
                                                                                    allowedValues:
                                                                                      schema30
                                                                                        .properties
                                                                                        .body
                                                                                        .properties
                                                                                        .sections
                                                                                        .elements
                                                                                        .properties
                                                                                        .blocks
                                                                                        .elements
                                                                                        .mapping
                                                                                        .table
                                                                                        .properties
                                                                                        .rows
                                                                                        .elements
                                                                                        .properties
                                                                                        .cells
                                                                                        .elements
                                                                                        .properties
                                                                                        .lines
                                                                                        .elements
                                                                                        .properties
                                                                                        .marks
                                                                                        .elements
                                                                                        .properties
                                                                                        .kind
                                                                                        .enum,
                                                                                  },
                                                                                message:
                                                                                  "must be equal to one of the allowed values",
                                                                              };
                                                                            if (
                                                                              vErrors ===
                                                                              null
                                                                            ) {
                                                                              vErrors =
                                                                                [
                                                                                  err293,
                                                                                ];
                                                                            } else {
                                                                              vErrors.push(
                                                                                err293,
                                                                              );
                                                                            }
                                                                            errors++;
                                                                          }
                                                                        } else {
                                                                          const err294 =
                                                                            {
                                                                              instancePath:
                                                                                instancePath +
                                                                                "/body/sections/" +
                                                                                i5 +
                                                                                "/blocks/" +
                                                                                i7 +
                                                                                "/rows/" +
                                                                                i14 +
                                                                                "/cells/" +
                                                                                i15 +
                                                                                "/lines/" +
                                                                                i16 +
                                                                                "/marks/" +
                                                                                i17,
                                                                              schemaPath:
                                                                                "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/rows/elements/properties/cells/elements/properties/lines/elements/properties/marks/elements/properties/kind",
                                                                              keyword:
                                                                                "properties",
                                                                              params:
                                                                                {
                                                                                  error:
                                                                                    "missing",
                                                                                  missingProperty:
                                                                                    "kind",
                                                                                },
                                                                              message:
                                                                                "must have property 'kind'",
                                                                            };
                                                                          if (
                                                                            vErrors ===
                                                                            null
                                                                          ) {
                                                                            vErrors =
                                                                              [
                                                                                err294,
                                                                              ];
                                                                          } else {
                                                                            vErrors.push(
                                                                              err294,
                                                                            );
                                                                          }
                                                                          errors++;
                                                                        }
                                                                        if (
                                                                          data123.start !==
                                                                          undefined
                                                                        ) {
                                                                          let data125 =
                                                                            data123.start;
                                                                          if (!(
                                                                            typeof data125 ==
                                                                              "number" &&
                                                                            isFinite(
                                                                              data125,
                                                                            ) &&
                                                                            !(
                                                                              data125 %
                                                                              1
                                                                            ) &&
                                                                            data125 >=
                                                                              0 &&
                                                                            data125 <=
                                                                              4294967295
                                                                          )) {
                                                                            const err295 =
                                                                              {
                                                                                instancePath:
                                                                                  instancePath +
                                                                                  "/body/sections/" +
                                                                                  i5 +
                                                                                  "/blocks/" +
                                                                                  i7 +
                                                                                  "/rows/" +
                                                                                  i14 +
                                                                                  "/cells/" +
                                                                                  i15 +
                                                                                  "/lines/" +
                                                                                  i16 +
                                                                                  "/marks/" +
                                                                                  i17 +
                                                                                  "/start",
                                                                                schemaPath:
                                                                                  "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/rows/elements/properties/cells/elements/properties/lines/elements/properties/marks/elements/properties/start/type",
                                                                                keyword:
                                                                                  "type",
                                                                                params:
                                                                                  {
                                                                                    type: "uint32",
                                                                                    nullable: false,
                                                                                  },
                                                                                message:
                                                                                  "must be uint32",
                                                                              };
                                                                            if (
                                                                              vErrors ===
                                                                              null
                                                                            ) {
                                                                              vErrors =
                                                                                [
                                                                                  err295,
                                                                                ];
                                                                            } else {
                                                                              vErrors.push(
                                                                                err295,
                                                                              );
                                                                            }
                                                                            errors++;
                                                                          }
                                                                        } else {
                                                                          const err296 =
                                                                            {
                                                                              instancePath:
                                                                                instancePath +
                                                                                "/body/sections/" +
                                                                                i5 +
                                                                                "/blocks/" +
                                                                                i7 +
                                                                                "/rows/" +
                                                                                i14 +
                                                                                "/cells/" +
                                                                                i15 +
                                                                                "/lines/" +
                                                                                i16 +
                                                                                "/marks/" +
                                                                                i17,
                                                                              schemaPath:
                                                                                "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/rows/elements/properties/cells/elements/properties/lines/elements/properties/marks/elements/properties/start",
                                                                              keyword:
                                                                                "properties",
                                                                              params:
                                                                                {
                                                                                  error:
                                                                                    "missing",
                                                                                  missingProperty:
                                                                                    "start",
                                                                                },
                                                                              message:
                                                                                "must have property 'start'",
                                                                            };
                                                                          if (
                                                                            vErrors ===
                                                                            null
                                                                          ) {
                                                                            vErrors =
                                                                              [
                                                                                err296,
                                                                              ];
                                                                          } else {
                                                                            vErrors.push(
                                                                              err296,
                                                                            );
                                                                          }
                                                                          errors++;
                                                                        }
                                                                        if (
                                                                          data123.length !==
                                                                          undefined
                                                                        ) {
                                                                          let data126 =
                                                                            data123.length;
                                                                          if (!(
                                                                            typeof data126 ==
                                                                              "number" &&
                                                                            isFinite(
                                                                              data126,
                                                                            ) &&
                                                                            !(
                                                                              data126 %
                                                                              1
                                                                            ) &&
                                                                            data126 >=
                                                                              0 &&
                                                                            data126 <=
                                                                              4294967295
                                                                          )) {
                                                                            const err297 =
                                                                              {
                                                                                instancePath:
                                                                                  instancePath +
                                                                                  "/body/sections/" +
                                                                                  i5 +
                                                                                  "/blocks/" +
                                                                                  i7 +
                                                                                  "/rows/" +
                                                                                  i14 +
                                                                                  "/cells/" +
                                                                                  i15 +
                                                                                  "/lines/" +
                                                                                  i16 +
                                                                                  "/marks/" +
                                                                                  i17 +
                                                                                  "/length",
                                                                                schemaPath:
                                                                                  "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/rows/elements/properties/cells/elements/properties/lines/elements/properties/marks/elements/properties/length/type",
                                                                                keyword:
                                                                                  "type",
                                                                                params:
                                                                                  {
                                                                                    type: "uint32",
                                                                                    nullable: false,
                                                                                  },
                                                                                message:
                                                                                  "must be uint32",
                                                                              };
                                                                            if (
                                                                              vErrors ===
                                                                              null
                                                                            ) {
                                                                              vErrors =
                                                                                [
                                                                                  err297,
                                                                                ];
                                                                            } else {
                                                                              vErrors.push(
                                                                                err297,
                                                                              );
                                                                            }
                                                                            errors++;
                                                                          }
                                                                        } else {
                                                                          const err298 =
                                                                            {
                                                                              instancePath:
                                                                                instancePath +
                                                                                "/body/sections/" +
                                                                                i5 +
                                                                                "/blocks/" +
                                                                                i7 +
                                                                                "/rows/" +
                                                                                i14 +
                                                                                "/cells/" +
                                                                                i15 +
                                                                                "/lines/" +
                                                                                i16 +
                                                                                "/marks/" +
                                                                                i17,
                                                                              schemaPath:
                                                                                "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/rows/elements/properties/cells/elements/properties/lines/elements/properties/marks/elements/properties/length",
                                                                              keyword:
                                                                                "properties",
                                                                              params:
                                                                                {
                                                                                  error:
                                                                                    "missing",
                                                                                  missingProperty:
                                                                                    "length",
                                                                                },
                                                                              message:
                                                                                "must have property 'length'",
                                                                            };
                                                                          if (
                                                                            vErrors ===
                                                                            null
                                                                          ) {
                                                                            vErrors =
                                                                              [
                                                                                err298,
                                                                              ];
                                                                          } else {
                                                                            vErrors.push(
                                                                              err298,
                                                                            );
                                                                          }
                                                                          errors++;
                                                                        }
                                                                        for (const key38 in data123) {
                                                                          if (
                                                                            key38 !==
                                                                              "kind" &&
                                                                            key38 !==
                                                                              "start" &&
                                                                            key38 !==
                                                                              "length"
                                                                          ) {
                                                                            const err299 =
                                                                              {
                                                                                instancePath:
                                                                                  instancePath +
                                                                                  "/body/sections/" +
                                                                                  i5 +
                                                                                  "/blocks/" +
                                                                                  i7 +
                                                                                  "/rows/" +
                                                                                  i14 +
                                                                                  "/cells/" +
                                                                                  i15 +
                                                                                  "/lines/" +
                                                                                  i16 +
                                                                                  "/marks/" +
                                                                                  i17 +
                                                                                  "/" +
                                                                                  key38
                                                                                    .replace(
                                                                                      /~/g,
                                                                                      "~0",
                                                                                    )
                                                                                    .replace(
                                                                                      /\//g,
                                                                                      "~1",
                                                                                    ),
                                                                                schemaPath:
                                                                                  "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/rows/elements/properties/cells/elements/properties/lines/elements/properties/marks/elements",
                                                                                keyword:
                                                                                  "properties",
                                                                                params:
                                                                                  {
                                                                                    error:
                                                                                      "additional",
                                                                                    additionalProperty:
                                                                                      key38,
                                                                                  },
                                                                                message:
                                                                                  "must NOT have additional properties",
                                                                              };
                                                                            if (
                                                                              vErrors ===
                                                                              null
                                                                            ) {
                                                                              vErrors =
                                                                                [
                                                                                  err299,
                                                                                ];
                                                                            } else {
                                                                              vErrors.push(
                                                                                err299,
                                                                              );
                                                                            }
                                                                            errors++;
                                                                          }
                                                                        }
                                                                      }
                                                                      if (
                                                                        !valid214
                                                                      ) {
                                                                        const err300 =
                                                                          {
                                                                            instancePath:
                                                                              instancePath +
                                                                              "/body/sections/" +
                                                                              i5 +
                                                                              "/blocks/" +
                                                                              i7 +
                                                                              "/rows/" +
                                                                              i14 +
                                                                              "/cells/" +
                                                                              i15 +
                                                                              "/lines/" +
                                                                              i16 +
                                                                              "/marks/" +
                                                                              i17,
                                                                            schemaPath:
                                                                              "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/rows/elements/properties/cells/elements/properties/lines/elements/properties/marks/elements/properties",
                                                                            keyword:
                                                                              "properties",
                                                                            params:
                                                                              {
                                                                                type: "object",
                                                                                nullable: false,
                                                                              },
                                                                            message:
                                                                              "must be object",
                                                                          };
                                                                        if (
                                                                          vErrors ===
                                                                          null
                                                                        ) {
                                                                          vErrors =
                                                                            [
                                                                              err300,
                                                                            ];
                                                                        } else {
                                                                          vErrors.push(
                                                                            err300,
                                                                          );
                                                                        }
                                                                        errors++;
                                                                      }
                                                                      var valid212 =
                                                                        _errs148 ===
                                                                        errors;
                                                                      if (
                                                                        !valid212
                                                                      ) {
                                                                        valid213 = false;
                                                                      }
                                                                    }
                                                                    valid211 =
                                                                      valid213;
                                                                  } else {
                                                                    const err301 =
                                                                      {
                                                                        instancePath:
                                                                          instancePath +
                                                                          "/body/sections/" +
                                                                          i5 +
                                                                          "/blocks/" +
                                                                          i7 +
                                                                          "/rows/" +
                                                                          i14 +
                                                                          "/cells/" +
                                                                          i15 +
                                                                          "/lines/" +
                                                                          i16 +
                                                                          "/marks",
                                                                        schemaPath:
                                                                          "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/rows/elements/properties/cells/elements/properties/lines/elements/properties/marks/elements",
                                                                        keyword:
                                                                          "elements",
                                                                        params:
                                                                          {
                                                                            type: "array",
                                                                            nullable: false,
                                                                          },
                                                                        message:
                                                                          "must be array",
                                                                      };
                                                                    if (
                                                                      vErrors ===
                                                                      null
                                                                    ) {
                                                                      vErrors =
                                                                        [
                                                                          err301,
                                                                        ];
                                                                    } else {
                                                                      vErrors.push(
                                                                        err301,
                                                                      );
                                                                    }
                                                                    errors++;
                                                                  }
                                                                }
                                                              } else {
                                                                const err302 = {
                                                                  instancePath:
                                                                    instancePath +
                                                                    "/body/sections/" +
                                                                    i5 +
                                                                    "/blocks/" +
                                                                    i7 +
                                                                    "/rows/" +
                                                                    i14 +
                                                                    "/cells/" +
                                                                    i15 +
                                                                    "/lines/" +
                                                                    i16,
                                                                  schemaPath:
                                                                    "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/rows/elements/properties/cells/elements/properties/lines/elements/properties/marks",
                                                                  keyword:
                                                                    "properties",
                                                                  params: {
                                                                    error:
                                                                      "missing",
                                                                    missingProperty:
                                                                      "marks",
                                                                  },
                                                                  message:
                                                                    "must have property 'marks'",
                                                                };
                                                                if (
                                                                  vErrors ===
                                                                  null
                                                                ) {
                                                                  vErrors = [
                                                                    err302,
                                                                  ];
                                                                } else {
                                                                  vErrors.push(
                                                                    err302,
                                                                  );
                                                                }
                                                                errors++;
                                                              }
                                                              for (const key39 in data115) {
                                                                if (
                                                                  key39 !==
                                                                    "copy" &&
                                                                  key39 !==
                                                                    "marks"
                                                                ) {
                                                                  const err303 =
                                                                    {
                                                                      instancePath:
                                                                        instancePath +
                                                                        "/body/sections/" +
                                                                        i5 +
                                                                        "/blocks/" +
                                                                        i7 +
                                                                        "/rows/" +
                                                                        i14 +
                                                                        "/cells/" +
                                                                        i15 +
                                                                        "/lines/" +
                                                                        i16 +
                                                                        "/" +
                                                                        key39
                                                                          .replace(
                                                                            /~/g,
                                                                            "~0",
                                                                          )
                                                                          .replace(
                                                                            /\//g,
                                                                            "~1",
                                                                          ),
                                                                      schemaPath:
                                                                        "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/rows/elements/properties/cells/elements/properties/lines/elements",
                                                                      keyword:
                                                                        "properties",
                                                                      params: {
                                                                        error:
                                                                          "additional",
                                                                        additionalProperty:
                                                                          key39,
                                                                      },
                                                                      message:
                                                                        "must NOT have additional properties",
                                                                    };
                                                                  if (
                                                                    vErrors ===
                                                                    null
                                                                  ) {
                                                                    vErrors = [
                                                                      err303,
                                                                    ];
                                                                  } else {
                                                                    vErrors.push(
                                                                      err303,
                                                                    );
                                                                  }
                                                                  errors++;
                                                                }
                                                              }
                                                            }
                                                            if (!valid196) {
                                                              const err304 = {
                                                                instancePath:
                                                                  instancePath +
                                                                  "/body/sections/" +
                                                                  i5 +
                                                                  "/blocks/" +
                                                                  i7 +
                                                                  "/rows/" +
                                                                  i14 +
                                                                  "/cells/" +
                                                                  i15 +
                                                                  "/lines/" +
                                                                  i16,
                                                                schemaPath:
                                                                  "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/rows/elements/properties/cells/elements/properties/lines/elements/properties",
                                                                keyword:
                                                                  "properties",
                                                                params: {
                                                                  type: "object",
                                                                  nullable: false,
                                                                },
                                                                message:
                                                                  "must be object",
                                                              };
                                                              if (
                                                                vErrors === null
                                                              ) {
                                                                vErrors = [
                                                                  err304,
                                                                ];
                                                              } else {
                                                                vErrors.push(
                                                                  err304,
                                                                );
                                                              }
                                                              errors++;
                                                            }
                                                            var valid194 =
                                                              _errs137 ===
                                                              errors;
                                                            if (!valid194) {
                                                              valid195 = false;
                                                            }
                                                          }
                                                          valid193 = valid195;
                                                        } else {
                                                          const err305 = {
                                                            instancePath:
                                                              instancePath +
                                                              "/body/sections/" +
                                                              i5 +
                                                              "/blocks/" +
                                                              i7 +
                                                              "/rows/" +
                                                              i14 +
                                                              "/cells/" +
                                                              i15 +
                                                              "/lines",
                                                            schemaPath:
                                                              "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/rows/elements/properties/cells/elements/properties/lines/elements",
                                                            keyword: "elements",
                                                            params: {
                                                              type: "array",
                                                              nullable: false,
                                                            },
                                                            message:
                                                              "must be array",
                                                          };
                                                          if (
                                                            vErrors === null
                                                          ) {
                                                            vErrors = [err305];
                                                          } else {
                                                            vErrors.push(
                                                              err305,
                                                            );
                                                          }
                                                          errors++;
                                                        }
                                                      }
                                                    } else {
                                                      const err306 = {
                                                        instancePath:
                                                          instancePath +
                                                          "/body/sections/" +
                                                          i5 +
                                                          "/blocks/" +
                                                          i7 +
                                                          "/rows/" +
                                                          i14 +
                                                          "/cells/" +
                                                          i15,
                                                        schemaPath:
                                                          "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/rows/elements/properties/cells/elements/properties/lines",
                                                        keyword: "properties",
                                                        params: {
                                                          error: "missing",
                                                          missingProperty:
                                                            "lines",
                                                        },
                                                        message:
                                                          "must have property 'lines'",
                                                      };
                                                      if (vErrors === null) {
                                                        vErrors = [err306];
                                                      } else {
                                                        vErrors.push(err306);
                                                      }
                                                      errors++;
                                                    }
                                                    if (
                                                      data113.symbol !==
                                                      undefined
                                                    ) {
                                                      let data127 =
                                                        data113.symbol;
                                                      if (!(
                                                        typeof data127 ==
                                                          "string" &&
                                                        (data127 === "m" ||
                                                          data127 === "s" ||
                                                          data127 === "a" ||
                                                          data127 === "ē")
                                                      )) {
                                                        const err307 = {
                                                          instancePath:
                                                            instancePath +
                                                            "/body/sections/" +
                                                            i5 +
                                                            "/blocks/" +
                                                            i7 +
                                                            "/rows/" +
                                                            i14 +
                                                            "/cells/" +
                                                            i15 +
                                                            "/symbol",
                                                          schemaPath:
                                                            "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/rows/elements/properties/cells/elements/optionalProperties/symbol/enum",
                                                          keyword: "enum",
                                                          params: {
                                                            allowedValues:
                                                              schema30
                                                                .properties.body
                                                                .properties
                                                                .sections
                                                                .elements
                                                                .properties
                                                                .blocks.elements
                                                                .mapping.table
                                                                .properties.rows
                                                                .elements
                                                                .properties
                                                                .cells.elements
                                                                .optionalProperties
                                                                .symbol.enum,
                                                          },
                                                          message:
                                                            "must be equal to one of the allowed values",
                                                        };
                                                        if (vErrors === null) {
                                                          vErrors = [err307];
                                                        } else {
                                                          vErrors.push(err307);
                                                        }
                                                        errors++;
                                                      }
                                                    }
                                                    for (const key40 in data113) {
                                                      if (
                                                        key40 !== "lines" &&
                                                        key40 !== "symbol"
                                                      ) {
                                                        const err308 = {
                                                          instancePath:
                                                            instancePath +
                                                            "/body/sections/" +
                                                            i5 +
                                                            "/blocks/" +
                                                            i7 +
                                                            "/rows/" +
                                                            i14 +
                                                            "/cells/" +
                                                            i15 +
                                                            "/" +
                                                            key40
                                                              .replace(
                                                                /~/g,
                                                                "~0",
                                                              )
                                                              .replace(
                                                                /\//g,
                                                                "~1",
                                                              ),
                                                          schemaPath:
                                                            "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/rows/elements/properties/cells/elements",
                                                          keyword: "properties",
                                                          params: {
                                                            error: "additional",
                                                            additionalProperty:
                                                              key40,
                                                          },
                                                          message:
                                                            "must NOT have additional properties",
                                                        };
                                                        if (vErrors === null) {
                                                          vErrors = [err308];
                                                        } else {
                                                          vErrors.push(err308);
                                                        }
                                                        errors++;
                                                      }
                                                    }
                                                  }
                                                  if (!valid191) {
                                                    const err309 = {
                                                      instancePath:
                                                        instancePath +
                                                        "/body/sections/" +
                                                        i5 +
                                                        "/blocks/" +
                                                        i7 +
                                                        "/rows/" +
                                                        i14 +
                                                        "/cells/" +
                                                        i15,
                                                      schemaPath:
                                                        "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/rows/elements/properties/cells/elements/properties",
                                                      keyword: "properties",
                                                      params: {
                                                        type: "object",
                                                        nullable: false,
                                                      },
                                                      message: "must be object",
                                                    };
                                                    if (vErrors === null) {
                                                      vErrors = [err309];
                                                    } else {
                                                      vErrors.push(err309);
                                                    }
                                                    errors++;
                                                  }
                                                  var valid189 =
                                                    _errs135 === errors;
                                                  if (!valid189) {
                                                    valid190 = false;
                                                  }
                                                }
                                                valid188 = valid190;
                                              } else {
                                                const err310 = {
                                                  instancePath:
                                                    instancePath +
                                                    "/body/sections/" +
                                                    i5 +
                                                    "/blocks/" +
                                                    i7 +
                                                    "/rows/" +
                                                    i14 +
                                                    "/cells",
                                                  schemaPath:
                                                    "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/rows/elements/properties/cells/elements",
                                                  keyword: "elements",
                                                  params: {
                                                    type: "array",
                                                    nullable: false,
                                                  },
                                                  message: "must be array",
                                                };
                                                if (vErrors === null) {
                                                  vErrors = [err310];
                                                } else {
                                                  vErrors.push(err310);
                                                }
                                                errors++;
                                              }
                                            }
                                          } else {
                                            const err311 = {
                                              instancePath:
                                                instancePath +
                                                "/body/sections/" +
                                                i5 +
                                                "/blocks/" +
                                                i7 +
                                                "/rows/" +
                                                i14,
                                              schemaPath:
                                                "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/rows/elements/properties/cells",
                                              keyword: "properties",
                                              params: {
                                                error: "missing",
                                                missingProperty: "cells",
                                              },
                                              message:
                                                "must have property 'cells'",
                                            };
                                            if (vErrors === null) {
                                              vErrors = [err311];
                                            } else {
                                              vErrors.push(err311);
                                            }
                                            errors++;
                                          }
                                          for (const key41 in data111) {
                                            if (key41 !== "cells") {
                                              const err312 = {
                                                instancePath:
                                                  instancePath +
                                                  "/body/sections/" +
                                                  i5 +
                                                  "/blocks/" +
                                                  i7 +
                                                  "/rows/" +
                                                  i14 +
                                                  "/" +
                                                  key41
                                                    .replace(/~/g, "~0")
                                                    .replace(/\//g, "~1"),
                                                schemaPath:
                                                  "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/rows/elements",
                                                keyword: "properties",
                                                params: {
                                                  error: "additional",
                                                  additionalProperty: key41,
                                                },
                                                message:
                                                  "must NOT have additional properties",
                                              };
                                              if (vErrors === null) {
                                                vErrors = [err312];
                                              } else {
                                                vErrors.push(err312);
                                              }
                                              errors++;
                                            }
                                          }
                                        }
                                        if (!valid186) {
                                          const err313 = {
                                            instancePath:
                                              instancePath +
                                              "/body/sections/" +
                                              i5 +
                                              "/blocks/" +
                                              i7 +
                                              "/rows/" +
                                              i14,
                                            schemaPath:
                                              "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/rows/elements/properties",
                                            keyword: "properties",
                                            params: {
                                              type: "object",
                                              nullable: false,
                                            },
                                            message: "must be object",
                                          };
                                          if (vErrors === null) {
                                            vErrors = [err313];
                                          } else {
                                            vErrors.push(err313);
                                          }
                                          errors++;
                                        }
                                        var valid184 = _errs133 === errors;
                                        if (!valid184) {
                                          valid185 = false;
                                        }
                                      }
                                      valid183 = valid185;
                                    } else {
                                      const err314 = {
                                        instancePath:
                                          instancePath +
                                          "/body/sections/" +
                                          i5 +
                                          "/blocks/" +
                                          i7 +
                                          "/rows",
                                        schemaPath:
                                          "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/rows/elements",
                                        keyword: "elements",
                                        params: {
                                          type: "array",
                                          nullable: false,
                                        },
                                        message: "must be array",
                                      };
                                      if (vErrors === null) {
                                        vErrors = [err314];
                                      } else {
                                        vErrors.push(err314);
                                      }
                                      errors++;
                                    }
                                  }
                                } else {
                                  const err315 = {
                                    instancePath:
                                      instancePath +
                                      "/body/sections/" +
                                      i5 +
                                      "/blocks/" +
                                      i7,
                                    schemaPath:
                                      "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties/rows",
                                    keyword: "properties",
                                    params: {
                                      error: "missing",
                                      missingProperty: "rows",
                                    },
                                    message: "must have property 'rows'",
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err315];
                                  } else {
                                    vErrors.push(err315);
                                  }
                                  errors++;
                                }
                                for (const key42 in data54) {
                                  if (
                                    key42 !== "kind" &&
                                    key42 !== "id" &&
                                    key42 !== "caption" &&
                                    key42 !== "headers" &&
                                    key42 !== "rows"
                                  ) {
                                    const err316 = {
                                      instancePath:
                                        instancePath +
                                        "/body/sections/" +
                                        i5 +
                                        "/blocks/" +
                                        i7 +
                                        "/" +
                                        key42
                                          .replace(/~/g, "~0")
                                          .replace(/\//g, "~1"),
                                      schemaPath:
                                        "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table",
                                      keyword: "properties",
                                      params: {
                                        error: "additional",
                                        additionalProperty: key42,
                                      },
                                      message:
                                        "must NOT have additional properties",
                                    };
                                    if (vErrors === null) {
                                      vErrors = [err316];
                                    } else {
                                      vErrors.push(err316);
                                    }
                                    errors++;
                                  }
                                }
                                if (!valid134) {
                                  const err317 = {
                                    instancePath:
                                      instancePath +
                                      "/body/sections/" +
                                      i5 +
                                      "/blocks/" +
                                      i7,
                                    schemaPath:
                                      "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/table/properties",
                                    keyword: "properties",
                                    params: { type: "object", nullable: false },
                                    message: "must be object",
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err317];
                                  } else {
                                    vErrors.push(err317);
                                  }
                                  errors++;
                                }
                                var valid133 = _errs99 === errors;
                                valid77 = valid133;
                              } else if (tag2 === "diagram") {
                                const _errs153 = errors;
                                let valid222 = false;
                                valid222 = true;
                                if (data54.id !== undefined) {
                                  if (!(typeof data54.id == "string")) {
                                    const err318 = {
                                      instancePath:
                                        instancePath +
                                        "/body/sections/" +
                                        i5 +
                                        "/blocks/" +
                                        i7 +
                                        "/id",
                                      schemaPath:
                                        "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram/properties/id/type",
                                      keyword: "type",
                                      params: {
                                        type: "string",
                                        nullable: false,
                                      },
                                      message: "must be string",
                                    };
                                    if (vErrors === null) {
                                      vErrors = [err318];
                                    } else {
                                      vErrors.push(err318);
                                    }
                                    errors++;
                                  }
                                } else {
                                  const err319 = {
                                    instancePath:
                                      instancePath +
                                      "/body/sections/" +
                                      i5 +
                                      "/blocks/" +
                                      i7,
                                    schemaPath:
                                      "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram/properties/id",
                                    keyword: "properties",
                                    params: {
                                      error: "missing",
                                      missingProperty: "id",
                                    },
                                    message: "must have property 'id'",
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err319];
                                  } else {
                                    vErrors.push(err319);
                                  }
                                  errors++;
                                }
                                if (data54.assetId !== undefined) {
                                  if (!(typeof data54.assetId == "string")) {
                                    const err320 = {
                                      instancePath:
                                        instancePath +
                                        "/body/sections/" +
                                        i5 +
                                        "/blocks/" +
                                        i7 +
                                        "/assetId",
                                      schemaPath:
                                        "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram/properties/assetId/type",
                                      keyword: "type",
                                      params: {
                                        type: "string",
                                        nullable: false,
                                      },
                                      message: "must be string",
                                    };
                                    if (vErrors === null) {
                                      vErrors = [err320];
                                    } else {
                                      vErrors.push(err320);
                                    }
                                    errors++;
                                  }
                                } else {
                                  const err321 = {
                                    instancePath:
                                      instancePath +
                                      "/body/sections/" +
                                      i5 +
                                      "/blocks/" +
                                      i7,
                                    schemaPath:
                                      "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram/properties/assetId",
                                    keyword: "properties",
                                    params: {
                                      error: "missing",
                                      missingProperty: "assetId",
                                    },
                                    message: "must have property 'assetId'",
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err321];
                                  } else {
                                    vErrors.push(err321);
                                  }
                                  errors++;
                                }
                                if (data54.caption !== undefined) {
                                  let data130 = data54.caption;
                                  let valid224 = false;
                                  if (
                                    data130 &&
                                    typeof data130 == "object" &&
                                    !Array.isArray(data130)
                                  ) {
                                    valid224 = true;
                                    if (data130.copy !== undefined) {
                                      let data131 = data130.copy;
                                      let valid226 = false;
                                      if (
                                        data131 &&
                                        typeof data131 == "object" &&
                                        !Array.isArray(data131)
                                      ) {
                                        const tag8 = data131.kind;
                                        if (tag8 === undefined) {
                                          const err322 = {
                                            instancePath:
                                              instancePath +
                                              "/body/sections/" +
                                              i5 +
                                              "/blocks/" +
                                              i7 +
                                              "/caption/copy",
                                            schemaPath:
                                              "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram/properties/caption/properties/copy/discriminator",
                                            keyword: "discriminator",
                                            params: {
                                              error: "tag",
                                              tag: "kind",
                                              tagValue: tag8,
                                            },
                                            message:
                                              'tag "kind" must be string',
                                          };
                                          if (vErrors === null) {
                                            vErrors = [err322];
                                          } else {
                                            vErrors.push(err322);
                                          }
                                          errors++;
                                        } else if (typeof tag8 == "string") {
                                          if (tag8 === "added") {
                                            const _errs158 = errors;
                                            let valid228 = false;
                                            valid228 = true;
                                            if (data131.text !== undefined) {
                                              if (
                                                !(
                                                  typeof data131.text ==
                                                  "string"
                                                )
                                              ) {
                                                const err323 = {
                                                  instancePath:
                                                    instancePath +
                                                    "/body/sections/" +
                                                    i5 +
                                                    "/blocks/" +
                                                    i7 +
                                                    "/caption/copy/text",
                                                  schemaPath:
                                                    "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram/properties/caption/properties/copy/mapping/added/properties/text/type",
                                                  keyword: "type",
                                                  params: {
                                                    type: "string",
                                                    nullable: false,
                                                  },
                                                  message: "must be string",
                                                };
                                                if (vErrors === null) {
                                                  vErrors = [err323];
                                                } else {
                                                  vErrors.push(err323);
                                                }
                                                errors++;
                                              }
                                            } else {
                                              const err324 = {
                                                instancePath:
                                                  instancePath +
                                                  "/body/sections/" +
                                                  i5 +
                                                  "/blocks/" +
                                                  i7 +
                                                  "/caption/copy",
                                                schemaPath:
                                                  "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram/properties/caption/properties/copy/mapping/added/properties/text",
                                                keyword: "properties",
                                                params: {
                                                  error: "missing",
                                                  missingProperty: "text",
                                                },
                                                message:
                                                  "must have property 'text'",
                                              };
                                              if (vErrors === null) {
                                                vErrors = [err324];
                                              } else {
                                                vErrors.push(err324);
                                              }
                                              errors++;
                                            }
                                            for (const key43 in data131) {
                                              if (
                                                key43 !== "kind" &&
                                                key43 !== "text"
                                              ) {
                                                const err325 = {
                                                  instancePath:
                                                    instancePath +
                                                    "/body/sections/" +
                                                    i5 +
                                                    "/blocks/" +
                                                    i7 +
                                                    "/caption/copy/" +
                                                    key43
                                                      .replace(/~/g, "~0")
                                                      .replace(/\//g, "~1"),
                                                  schemaPath:
                                                    "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram/properties/caption/properties/copy/mapping/added",
                                                  keyword: "properties",
                                                  params: {
                                                    error: "additional",
                                                    additionalProperty: key43,
                                                  },
                                                  message:
                                                    "must NOT have additional properties",
                                                };
                                                if (vErrors === null) {
                                                  vErrors = [err325];
                                                } else {
                                                  vErrors.push(err325);
                                                }
                                                errors++;
                                              }
                                            }
                                            if (!valid228) {
                                              const err326 = {
                                                instancePath:
                                                  instancePath +
                                                  "/body/sections/" +
                                                  i5 +
                                                  "/blocks/" +
                                                  i7 +
                                                  "/caption/copy",
                                                schemaPath:
                                                  "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram/properties/caption/properties/copy/mapping/added/properties",
                                                keyword: "properties",
                                                params: {
                                                  type: "object",
                                                  nullable: false,
                                                },
                                                message: "must be object",
                                              };
                                              if (vErrors === null) {
                                                vErrors = [err326];
                                              } else {
                                                vErrors.push(err326);
                                              }
                                              errors++;
                                            }
                                            var valid227 = _errs158 === errors;
                                            valid226 = valid227;
                                          } else if (tag8 === "source") {
                                            const _errs160 = errors;
                                            let valid232 = false;
                                            valid232 = true;
                                            if (data131.text !== undefined) {
                                              if (
                                                !(
                                                  typeof data131.text ==
                                                  "string"
                                                )
                                              ) {
                                                const err327 = {
                                                  instancePath:
                                                    instancePath +
                                                    "/body/sections/" +
                                                    i5 +
                                                    "/blocks/" +
                                                    i7 +
                                                    "/caption/copy/text",
                                                  schemaPath:
                                                    "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram/properties/caption/properties/copy/mapping/source/properties/text/type",
                                                  keyword: "type",
                                                  params: {
                                                    type: "string",
                                                    nullable: false,
                                                  },
                                                  message: "must be string",
                                                };
                                                if (vErrors === null) {
                                                  vErrors = [err327];
                                                } else {
                                                  vErrors.push(err327);
                                                }
                                                errors++;
                                              }
                                            } else {
                                              const err328 = {
                                                instancePath:
                                                  instancePath +
                                                  "/body/sections/" +
                                                  i5 +
                                                  "/blocks/" +
                                                  i7 +
                                                  "/caption/copy",
                                                schemaPath:
                                                  "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram/properties/caption/properties/copy/mapping/source/properties/text",
                                                keyword: "properties",
                                                params: {
                                                  error: "missing",
                                                  missingProperty: "text",
                                                },
                                                message:
                                                  "must have property 'text'",
                                              };
                                              if (vErrors === null) {
                                                vErrors = [err328];
                                              } else {
                                                vErrors.push(err328);
                                              }
                                              errors++;
                                            }
                                            if (
                                              data131.sourceRef !== undefined
                                            ) {
                                              if (
                                                !(
                                                  typeof data131.sourceRef ==
                                                  "string"
                                                )
                                              ) {
                                                const err329 = {
                                                  instancePath:
                                                    instancePath +
                                                    "/body/sections/" +
                                                    i5 +
                                                    "/blocks/" +
                                                    i7 +
                                                    "/caption/copy/sourceRef",
                                                  schemaPath:
                                                    "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram/properties/caption/properties/copy/mapping/source/properties/sourceRef/type",
                                                  keyword: "type",
                                                  params: {
                                                    type: "string",
                                                    nullable: false,
                                                  },
                                                  message: "must be string",
                                                };
                                                if (vErrors === null) {
                                                  vErrors = [err329];
                                                } else {
                                                  vErrors.push(err329);
                                                }
                                                errors++;
                                              }
                                            } else {
                                              const err330 = {
                                                instancePath:
                                                  instancePath +
                                                  "/body/sections/" +
                                                  i5 +
                                                  "/blocks/" +
                                                  i7 +
                                                  "/caption/copy",
                                                schemaPath:
                                                  "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram/properties/caption/properties/copy/mapping/source/properties/sourceRef",
                                                keyword: "properties",
                                                params: {
                                                  error: "missing",
                                                  missingProperty: "sourceRef",
                                                },
                                                message:
                                                  "must have property 'sourceRef'",
                                              };
                                              if (vErrors === null) {
                                                vErrors = [err330];
                                              } else {
                                                vErrors.push(err330);
                                              }
                                              errors++;
                                            }
                                            for (const key44 in data131) {
                                              if (
                                                key44 !== "kind" &&
                                                key44 !== "text" &&
                                                key44 !== "sourceRef"
                                              ) {
                                                const err331 = {
                                                  instancePath:
                                                    instancePath +
                                                    "/body/sections/" +
                                                    i5 +
                                                    "/blocks/" +
                                                    i7 +
                                                    "/caption/copy/" +
                                                    key44
                                                      .replace(/~/g, "~0")
                                                      .replace(/\//g, "~1"),
                                                  schemaPath:
                                                    "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram/properties/caption/properties/copy/mapping/source",
                                                  keyword: "properties",
                                                  params: {
                                                    error: "additional",
                                                    additionalProperty: key44,
                                                  },
                                                  message:
                                                    "must NOT have additional properties",
                                                };
                                                if (vErrors === null) {
                                                  vErrors = [err331];
                                                } else {
                                                  vErrors.push(err331);
                                                }
                                                errors++;
                                              }
                                            }
                                            if (!valid232) {
                                              const err332 = {
                                                instancePath:
                                                  instancePath +
                                                  "/body/sections/" +
                                                  i5 +
                                                  "/blocks/" +
                                                  i7 +
                                                  "/caption/copy",
                                                schemaPath:
                                                  "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram/properties/caption/properties/copy/mapping/source/properties",
                                                keyword: "properties",
                                                params: {
                                                  type: "object",
                                                  nullable: false,
                                                },
                                                message: "must be object",
                                              };
                                              if (vErrors === null) {
                                                vErrors = [err332];
                                              } else {
                                                vErrors.push(err332);
                                              }
                                              errors++;
                                            }
                                            var valid231 = _errs160 === errors;
                                            valid226 = valid231;
                                          } else if (tag8 === "adapted") {
                                            const _errs163 = errors;
                                            let valid236 = false;
                                            valid236 = true;
                                            if (data131.text !== undefined) {
                                              if (
                                                !(
                                                  typeof data131.text ==
                                                  "string"
                                                )
                                              ) {
                                                const err333 = {
                                                  instancePath:
                                                    instancePath +
                                                    "/body/sections/" +
                                                    i5 +
                                                    "/blocks/" +
                                                    i7 +
                                                    "/caption/copy/text",
                                                  schemaPath:
                                                    "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram/properties/caption/properties/copy/mapping/adapted/properties/text/type",
                                                  keyword: "type",
                                                  params: {
                                                    type: "string",
                                                    nullable: false,
                                                  },
                                                  message: "must be string",
                                                };
                                                if (vErrors === null) {
                                                  vErrors = [err333];
                                                } else {
                                                  vErrors.push(err333);
                                                }
                                                errors++;
                                              }
                                            } else {
                                              const err334 = {
                                                instancePath:
                                                  instancePath +
                                                  "/body/sections/" +
                                                  i5 +
                                                  "/blocks/" +
                                                  i7 +
                                                  "/caption/copy",
                                                schemaPath:
                                                  "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram/properties/caption/properties/copy/mapping/adapted/properties/text",
                                                keyword: "properties",
                                                params: {
                                                  error: "missing",
                                                  missingProperty: "text",
                                                },
                                                message:
                                                  "must have property 'text'",
                                              };
                                              if (vErrors === null) {
                                                vErrors = [err334];
                                              } else {
                                                vErrors.push(err334);
                                              }
                                              errors++;
                                            }
                                            if (
                                              data131.sourceRef !== undefined
                                            ) {
                                              if (
                                                !(
                                                  typeof data131.sourceRef ==
                                                  "string"
                                                )
                                              ) {
                                                const err335 = {
                                                  instancePath:
                                                    instancePath +
                                                    "/body/sections/" +
                                                    i5 +
                                                    "/blocks/" +
                                                    i7 +
                                                    "/caption/copy/sourceRef",
                                                  schemaPath:
                                                    "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram/properties/caption/properties/copy/mapping/adapted/properties/sourceRef/type",
                                                  keyword: "type",
                                                  params: {
                                                    type: "string",
                                                    nullable: false,
                                                  },
                                                  message: "must be string",
                                                };
                                                if (vErrors === null) {
                                                  vErrors = [err335];
                                                } else {
                                                  vErrors.push(err335);
                                                }
                                                errors++;
                                              }
                                            } else {
                                              const err336 = {
                                                instancePath:
                                                  instancePath +
                                                  "/body/sections/" +
                                                  i5 +
                                                  "/blocks/" +
                                                  i7 +
                                                  "/caption/copy",
                                                schemaPath:
                                                  "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram/properties/caption/properties/copy/mapping/adapted/properties/sourceRef",
                                                keyword: "properties",
                                                params: {
                                                  error: "missing",
                                                  missingProperty: "sourceRef",
                                                },
                                                message:
                                                  "must have property 'sourceRef'",
                                              };
                                              if (vErrors === null) {
                                                vErrors = [err336];
                                              } else {
                                                vErrors.push(err336);
                                              }
                                              errors++;
                                            }
                                            for (const key45 in data131) {
                                              if (
                                                key45 !== "kind" &&
                                                key45 !== "text" &&
                                                key45 !== "sourceRef"
                                              ) {
                                                const err337 = {
                                                  instancePath:
                                                    instancePath +
                                                    "/body/sections/" +
                                                    i5 +
                                                    "/blocks/" +
                                                    i7 +
                                                    "/caption/copy/" +
                                                    key45
                                                      .replace(/~/g, "~0")
                                                      .replace(/\//g, "~1"),
                                                  schemaPath:
                                                    "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram/properties/caption/properties/copy/mapping/adapted",
                                                  keyword: "properties",
                                                  params: {
                                                    error: "additional",
                                                    additionalProperty: key45,
                                                  },
                                                  message:
                                                    "must NOT have additional properties",
                                                };
                                                if (vErrors === null) {
                                                  vErrors = [err337];
                                                } else {
                                                  vErrors.push(err337);
                                                }
                                                errors++;
                                              }
                                            }
                                            if (!valid236) {
                                              const err338 = {
                                                instancePath:
                                                  instancePath +
                                                  "/body/sections/" +
                                                  i5 +
                                                  "/blocks/" +
                                                  i7 +
                                                  "/caption/copy",
                                                schemaPath:
                                                  "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram/properties/caption/properties/copy/mapping/adapted/properties",
                                                keyword: "properties",
                                                params: {
                                                  type: "object",
                                                  nullable: false,
                                                },
                                                message: "must be object",
                                              };
                                              if (vErrors === null) {
                                                vErrors = [err338];
                                              } else {
                                                vErrors.push(err338);
                                              }
                                              errors++;
                                            }
                                            var valid235 = _errs163 === errors;
                                            valid226 = valid235;
                                          } else {
                                            const err339 = {
                                              instancePath:
                                                instancePath +
                                                "/body/sections/" +
                                                i5 +
                                                "/blocks/" +
                                                i7 +
                                                "/caption/copy/kind",
                                              schemaPath:
                                                "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram/properties/caption/properties/copy/mapping",
                                              keyword: "discriminator",
                                              params: {
                                                error: "mapping",
                                                tag: "kind",
                                                tagValue: tag8,
                                              },
                                              message:
                                                'value of tag "kind" must be in mapping',
                                            };
                                            if (vErrors === null) {
                                              vErrors = [err339];
                                            } else {
                                              vErrors.push(err339);
                                            }
                                            errors++;
                                          }
                                        } else {
                                          const err340 = {
                                            instancePath:
                                              instancePath +
                                              "/body/sections/" +
                                              i5 +
                                              "/blocks/" +
                                              i7 +
                                              "/caption/copy/kind",
                                            schemaPath:
                                              "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram/properties/caption/properties/copy/discriminator",
                                            keyword: "discriminator",
                                            params: {
                                              error: "tag",
                                              tag: "kind",
                                              tagValue: tag8,
                                            },
                                            message:
                                              'tag "kind" must be string',
                                          };
                                          if (vErrors === null) {
                                            vErrors = [err340];
                                          } else {
                                            vErrors.push(err340);
                                          }
                                          errors++;
                                        }
                                      } else if (!valid226) {
                                        const err341 = {
                                          instancePath:
                                            instancePath +
                                            "/body/sections/" +
                                            i5 +
                                            "/blocks/" +
                                            i7 +
                                            "/caption/copy",
                                          schemaPath:
                                            "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram/properties/caption/properties/copy/discriminator",
                                          keyword: "discriminator",
                                          params: {
                                            type: "object",
                                            nullable: false,
                                          },
                                          message: "must be object",
                                        };
                                        if (vErrors === null) {
                                          vErrors = [err341];
                                        } else {
                                          vErrors.push(err341);
                                        }
                                        errors++;
                                      }
                                    } else {
                                      const err342 = {
                                        instancePath:
                                          instancePath +
                                          "/body/sections/" +
                                          i5 +
                                          "/blocks/" +
                                          i7 +
                                          "/caption",
                                        schemaPath:
                                          "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram/properties/caption/properties/copy",
                                        keyword: "properties",
                                        params: {
                                          error: "missing",
                                          missingProperty: "copy",
                                        },
                                        message: "must have property 'copy'",
                                      };
                                      if (vErrors === null) {
                                        vErrors = [err342];
                                      } else {
                                        vErrors.push(err342);
                                      }
                                      errors++;
                                    }
                                    if (data130.marks !== undefined) {
                                      let data137 = data130.marks;
                                      let valid239 = false;
                                      if (!valid239) {
                                        if (Array.isArray(data137)) {
                                          let valid241 = true;
                                          const len18 = data137.length;
                                          for (
                                            let i18 = 0;
                                            i18 < len18;
                                            i18++
                                          ) {
                                            let data138 = data137[i18];
                                            const _errs167 = errors;
                                            let valid242 = false;
                                            if (
                                              data138 &&
                                              typeof data138 == "object" &&
                                              !Array.isArray(data138)
                                            ) {
                                              valid242 = true;
                                              if (data138.kind !== undefined) {
                                                let data139 = data138.kind;
                                                if (!(
                                                  typeof data139 == "string" &&
                                                  (data139 === "bold" ||
                                                    data139 === "italic" ||
                                                    data139 === "underline")
                                                )) {
                                                  const err343 = {
                                                    instancePath:
                                                      instancePath +
                                                      "/body/sections/" +
                                                      i5 +
                                                      "/blocks/" +
                                                      i7 +
                                                      "/caption/marks/" +
                                                      i18 +
                                                      "/kind",
                                                    schemaPath:
                                                      "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram/properties/caption/properties/marks/elements/properties/kind/enum",
                                                    keyword: "enum",
                                                    params: {
                                                      allowedValues:
                                                        schema30.properties.body
                                                          .properties.sections
                                                          .elements.properties
                                                          .blocks.elements
                                                          .mapping.diagram
                                                          .properties.caption
                                                          .properties.marks
                                                          .elements.properties
                                                          .kind.enum,
                                                    },
                                                    message:
                                                      "must be equal to one of the allowed values",
                                                  };
                                                  if (vErrors === null) {
                                                    vErrors = [err343];
                                                  } else {
                                                    vErrors.push(err343);
                                                  }
                                                  errors++;
                                                }
                                              } else {
                                                const err344 = {
                                                  instancePath:
                                                    instancePath +
                                                    "/body/sections/" +
                                                    i5 +
                                                    "/blocks/" +
                                                    i7 +
                                                    "/caption/marks/" +
                                                    i18,
                                                  schemaPath:
                                                    "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram/properties/caption/properties/marks/elements/properties/kind",
                                                  keyword: "properties",
                                                  params: {
                                                    error: "missing",
                                                    missingProperty: "kind",
                                                  },
                                                  message:
                                                    "must have property 'kind'",
                                                };
                                                if (vErrors === null) {
                                                  vErrors = [err344];
                                                } else {
                                                  vErrors.push(err344);
                                                }
                                                errors++;
                                              }
                                              if (data138.start !== undefined) {
                                                let data140 = data138.start;
                                                if (!(
                                                  typeof data140 == "number" &&
                                                  isFinite(data140) &&
                                                  !(data140 % 1) &&
                                                  data140 >= 0 &&
                                                  data140 <= 4294967295
                                                )) {
                                                  const err345 = {
                                                    instancePath:
                                                      instancePath +
                                                      "/body/sections/" +
                                                      i5 +
                                                      "/blocks/" +
                                                      i7 +
                                                      "/caption/marks/" +
                                                      i18 +
                                                      "/start",
                                                    schemaPath:
                                                      "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram/properties/caption/properties/marks/elements/properties/start/type",
                                                    keyword: "type",
                                                    params: {
                                                      type: "uint32",
                                                      nullable: false,
                                                    },
                                                    message: "must be uint32",
                                                  };
                                                  if (vErrors === null) {
                                                    vErrors = [err345];
                                                  } else {
                                                    vErrors.push(err345);
                                                  }
                                                  errors++;
                                                }
                                              } else {
                                                const err346 = {
                                                  instancePath:
                                                    instancePath +
                                                    "/body/sections/" +
                                                    i5 +
                                                    "/blocks/" +
                                                    i7 +
                                                    "/caption/marks/" +
                                                    i18,
                                                  schemaPath:
                                                    "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram/properties/caption/properties/marks/elements/properties/start",
                                                  keyword: "properties",
                                                  params: {
                                                    error: "missing",
                                                    missingProperty: "start",
                                                  },
                                                  message:
                                                    "must have property 'start'",
                                                };
                                                if (vErrors === null) {
                                                  vErrors = [err346];
                                                } else {
                                                  vErrors.push(err346);
                                                }
                                                errors++;
                                              }
                                              if (
                                                data138.length !== undefined
                                              ) {
                                                let data141 = data138.length;
                                                if (!(
                                                  typeof data141 == "number" &&
                                                  isFinite(data141) &&
                                                  !(data141 % 1) &&
                                                  data141 >= 0 &&
                                                  data141 <= 4294967295
                                                )) {
                                                  const err347 = {
                                                    instancePath:
                                                      instancePath +
                                                      "/body/sections/" +
                                                      i5 +
                                                      "/blocks/" +
                                                      i7 +
                                                      "/caption/marks/" +
                                                      i18 +
                                                      "/length",
                                                    schemaPath:
                                                      "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram/properties/caption/properties/marks/elements/properties/length/type",
                                                    keyword: "type",
                                                    params: {
                                                      type: "uint32",
                                                      nullable: false,
                                                    },
                                                    message: "must be uint32",
                                                  };
                                                  if (vErrors === null) {
                                                    vErrors = [err347];
                                                  } else {
                                                    vErrors.push(err347);
                                                  }
                                                  errors++;
                                                }
                                              } else {
                                                const err348 = {
                                                  instancePath:
                                                    instancePath +
                                                    "/body/sections/" +
                                                    i5 +
                                                    "/blocks/" +
                                                    i7 +
                                                    "/caption/marks/" +
                                                    i18,
                                                  schemaPath:
                                                    "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram/properties/caption/properties/marks/elements/properties/length",
                                                  keyword: "properties",
                                                  params: {
                                                    error: "missing",
                                                    missingProperty: "length",
                                                  },
                                                  message:
                                                    "must have property 'length'",
                                                };
                                                if (vErrors === null) {
                                                  vErrors = [err348];
                                                } else {
                                                  vErrors.push(err348);
                                                }
                                                errors++;
                                              }
                                              for (const key46 in data138) {
                                                if (
                                                  key46 !== "kind" &&
                                                  key46 !== "start" &&
                                                  key46 !== "length"
                                                ) {
                                                  const err349 = {
                                                    instancePath:
                                                      instancePath +
                                                      "/body/sections/" +
                                                      i5 +
                                                      "/blocks/" +
                                                      i7 +
                                                      "/caption/marks/" +
                                                      i18 +
                                                      "/" +
                                                      key46
                                                        .replace(/~/g, "~0")
                                                        .replace(/\//g, "~1"),
                                                    schemaPath:
                                                      "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram/properties/caption/properties/marks/elements",
                                                    keyword: "properties",
                                                    params: {
                                                      error: "additional",
                                                      additionalProperty: key46,
                                                    },
                                                    message:
                                                      "must NOT have additional properties",
                                                  };
                                                  if (vErrors === null) {
                                                    vErrors = [err349];
                                                  } else {
                                                    vErrors.push(err349);
                                                  }
                                                  errors++;
                                                }
                                              }
                                            }
                                            if (!valid242) {
                                              const err350 = {
                                                instancePath:
                                                  instancePath +
                                                  "/body/sections/" +
                                                  i5 +
                                                  "/blocks/" +
                                                  i7 +
                                                  "/caption/marks/" +
                                                  i18,
                                                schemaPath:
                                                  "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram/properties/caption/properties/marks/elements/properties",
                                                keyword: "properties",
                                                params: {
                                                  type: "object",
                                                  nullable: false,
                                                },
                                                message: "must be object",
                                              };
                                              if (vErrors === null) {
                                                vErrors = [err350];
                                              } else {
                                                vErrors.push(err350);
                                              }
                                              errors++;
                                            }
                                            var valid240 = _errs167 === errors;
                                            if (!valid240) {
                                              valid241 = false;
                                            }
                                          }
                                          valid239 = valid241;
                                        } else {
                                          const err351 = {
                                            instancePath:
                                              instancePath +
                                              "/body/sections/" +
                                              i5 +
                                              "/blocks/" +
                                              i7 +
                                              "/caption/marks",
                                            schemaPath:
                                              "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram/properties/caption/properties/marks/elements",
                                            keyword: "elements",
                                            params: {
                                              type: "array",
                                              nullable: false,
                                            },
                                            message: "must be array",
                                          };
                                          if (vErrors === null) {
                                            vErrors = [err351];
                                          } else {
                                            vErrors.push(err351);
                                          }
                                          errors++;
                                        }
                                      }
                                    } else {
                                      const err352 = {
                                        instancePath:
                                          instancePath +
                                          "/body/sections/" +
                                          i5 +
                                          "/blocks/" +
                                          i7 +
                                          "/caption",
                                        schemaPath:
                                          "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram/properties/caption/properties/marks",
                                        keyword: "properties",
                                        params: {
                                          error: "missing",
                                          missingProperty: "marks",
                                        },
                                        message: "must have property 'marks'",
                                      };
                                      if (vErrors === null) {
                                        vErrors = [err352];
                                      } else {
                                        vErrors.push(err352);
                                      }
                                      errors++;
                                    }
                                    for (const key47 in data130) {
                                      if (
                                        key47 !== "copy" &&
                                        key47 !== "marks"
                                      ) {
                                        const err353 = {
                                          instancePath:
                                            instancePath +
                                            "/body/sections/" +
                                            i5 +
                                            "/blocks/" +
                                            i7 +
                                            "/caption/" +
                                            key47
                                              .replace(/~/g, "~0")
                                              .replace(/\//g, "~1"),
                                          schemaPath:
                                            "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram/properties/caption",
                                          keyword: "properties",
                                          params: {
                                            error: "additional",
                                            additionalProperty: key47,
                                          },
                                          message:
                                            "must NOT have additional properties",
                                        };
                                        if (vErrors === null) {
                                          vErrors = [err353];
                                        } else {
                                          vErrors.push(err353);
                                        }
                                        errors++;
                                      }
                                    }
                                  }
                                  if (!valid224) {
                                    const err354 = {
                                      instancePath:
                                        instancePath +
                                        "/body/sections/" +
                                        i5 +
                                        "/blocks/" +
                                        i7 +
                                        "/caption",
                                      schemaPath:
                                        "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram/properties/caption/properties",
                                      keyword: "properties",
                                      params: {
                                        type: "object",
                                        nullable: false,
                                      },
                                      message: "must be object",
                                    };
                                    if (vErrors === null) {
                                      vErrors = [err354];
                                    } else {
                                      vErrors.push(err354);
                                    }
                                    errors++;
                                  }
                                } else {
                                  const err355 = {
                                    instancePath:
                                      instancePath +
                                      "/body/sections/" +
                                      i5 +
                                      "/blocks/" +
                                      i7,
                                    schemaPath:
                                      "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram/properties/caption",
                                    keyword: "properties",
                                    params: {
                                      error: "missing",
                                      missingProperty: "caption",
                                    },
                                    message: "must have property 'caption'",
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err355];
                                  } else {
                                    vErrors.push(err355);
                                  }
                                  errors++;
                                }
                                if (data54.alt !== undefined) {
                                  let data142 = data54.alt;
                                  let valid246 = false;
                                  if (
                                    data142 &&
                                    typeof data142 == "object" &&
                                    !Array.isArray(data142)
                                  ) {
                                    valid246 = true;
                                    if (data142.copy !== undefined) {
                                      let data143 = data142.copy;
                                      let valid248 = false;
                                      if (
                                        data143 &&
                                        typeof data143 == "object" &&
                                        !Array.isArray(data143)
                                      ) {
                                        const tag9 = data143.kind;
                                        if (tag9 === undefined) {
                                          const err356 = {
                                            instancePath:
                                              instancePath +
                                              "/body/sections/" +
                                              i5 +
                                              "/blocks/" +
                                              i7 +
                                              "/alt/copy",
                                            schemaPath:
                                              "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram/properties/alt/properties/copy/discriminator",
                                            keyword: "discriminator",
                                            params: {
                                              error: "tag",
                                              tag: "kind",
                                              tagValue: tag9,
                                            },
                                            message:
                                              'tag "kind" must be string',
                                          };
                                          if (vErrors === null) {
                                            vErrors = [err356];
                                          } else {
                                            vErrors.push(err356);
                                          }
                                          errors++;
                                        } else if (typeof tag9 == "string") {
                                          if (tag9 === "added") {
                                            const _errs173 = errors;
                                            let valid250 = false;
                                            valid250 = true;
                                            if (data143.text !== undefined) {
                                              if (
                                                !(
                                                  typeof data143.text ==
                                                  "string"
                                                )
                                              ) {
                                                const err357 = {
                                                  instancePath:
                                                    instancePath +
                                                    "/body/sections/" +
                                                    i5 +
                                                    "/blocks/" +
                                                    i7 +
                                                    "/alt/copy/text",
                                                  schemaPath:
                                                    "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram/properties/alt/properties/copy/mapping/added/properties/text/type",
                                                  keyword: "type",
                                                  params: {
                                                    type: "string",
                                                    nullable: false,
                                                  },
                                                  message: "must be string",
                                                };
                                                if (vErrors === null) {
                                                  vErrors = [err357];
                                                } else {
                                                  vErrors.push(err357);
                                                }
                                                errors++;
                                              }
                                            } else {
                                              const err358 = {
                                                instancePath:
                                                  instancePath +
                                                  "/body/sections/" +
                                                  i5 +
                                                  "/blocks/" +
                                                  i7 +
                                                  "/alt/copy",
                                                schemaPath:
                                                  "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram/properties/alt/properties/copy/mapping/added/properties/text",
                                                keyword: "properties",
                                                params: {
                                                  error: "missing",
                                                  missingProperty: "text",
                                                },
                                                message:
                                                  "must have property 'text'",
                                              };
                                              if (vErrors === null) {
                                                vErrors = [err358];
                                              } else {
                                                vErrors.push(err358);
                                              }
                                              errors++;
                                            }
                                            for (const key48 in data143) {
                                              if (
                                                key48 !== "kind" &&
                                                key48 !== "text"
                                              ) {
                                                const err359 = {
                                                  instancePath:
                                                    instancePath +
                                                    "/body/sections/" +
                                                    i5 +
                                                    "/blocks/" +
                                                    i7 +
                                                    "/alt/copy/" +
                                                    key48
                                                      .replace(/~/g, "~0")
                                                      .replace(/\//g, "~1"),
                                                  schemaPath:
                                                    "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram/properties/alt/properties/copy/mapping/added",
                                                  keyword: "properties",
                                                  params: {
                                                    error: "additional",
                                                    additionalProperty: key48,
                                                  },
                                                  message:
                                                    "must NOT have additional properties",
                                                };
                                                if (vErrors === null) {
                                                  vErrors = [err359];
                                                } else {
                                                  vErrors.push(err359);
                                                }
                                                errors++;
                                              }
                                            }
                                            if (!valid250) {
                                              const err360 = {
                                                instancePath:
                                                  instancePath +
                                                  "/body/sections/" +
                                                  i5 +
                                                  "/blocks/" +
                                                  i7 +
                                                  "/alt/copy",
                                                schemaPath:
                                                  "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram/properties/alt/properties/copy/mapping/added/properties",
                                                keyword: "properties",
                                                params: {
                                                  type: "object",
                                                  nullable: false,
                                                },
                                                message: "must be object",
                                              };
                                              if (vErrors === null) {
                                                vErrors = [err360];
                                              } else {
                                                vErrors.push(err360);
                                              }
                                              errors++;
                                            }
                                            var valid249 = _errs173 === errors;
                                            valid248 = valid249;
                                          } else if (tag9 === "source") {
                                            const _errs175 = errors;
                                            let valid254 = false;
                                            valid254 = true;
                                            if (data143.text !== undefined) {
                                              if (
                                                !(
                                                  typeof data143.text ==
                                                  "string"
                                                )
                                              ) {
                                                const err361 = {
                                                  instancePath:
                                                    instancePath +
                                                    "/body/sections/" +
                                                    i5 +
                                                    "/blocks/" +
                                                    i7 +
                                                    "/alt/copy/text",
                                                  schemaPath:
                                                    "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram/properties/alt/properties/copy/mapping/source/properties/text/type",
                                                  keyword: "type",
                                                  params: {
                                                    type: "string",
                                                    nullable: false,
                                                  },
                                                  message: "must be string",
                                                };
                                                if (vErrors === null) {
                                                  vErrors = [err361];
                                                } else {
                                                  vErrors.push(err361);
                                                }
                                                errors++;
                                              }
                                            } else {
                                              const err362 = {
                                                instancePath:
                                                  instancePath +
                                                  "/body/sections/" +
                                                  i5 +
                                                  "/blocks/" +
                                                  i7 +
                                                  "/alt/copy",
                                                schemaPath:
                                                  "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram/properties/alt/properties/copy/mapping/source/properties/text",
                                                keyword: "properties",
                                                params: {
                                                  error: "missing",
                                                  missingProperty: "text",
                                                },
                                                message:
                                                  "must have property 'text'",
                                              };
                                              if (vErrors === null) {
                                                vErrors = [err362];
                                              } else {
                                                vErrors.push(err362);
                                              }
                                              errors++;
                                            }
                                            if (
                                              data143.sourceRef !== undefined
                                            ) {
                                              if (
                                                !(
                                                  typeof data143.sourceRef ==
                                                  "string"
                                                )
                                              ) {
                                                const err363 = {
                                                  instancePath:
                                                    instancePath +
                                                    "/body/sections/" +
                                                    i5 +
                                                    "/blocks/" +
                                                    i7 +
                                                    "/alt/copy/sourceRef",
                                                  schemaPath:
                                                    "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram/properties/alt/properties/copy/mapping/source/properties/sourceRef/type",
                                                  keyword: "type",
                                                  params: {
                                                    type: "string",
                                                    nullable: false,
                                                  },
                                                  message: "must be string",
                                                };
                                                if (vErrors === null) {
                                                  vErrors = [err363];
                                                } else {
                                                  vErrors.push(err363);
                                                }
                                                errors++;
                                              }
                                            } else {
                                              const err364 = {
                                                instancePath:
                                                  instancePath +
                                                  "/body/sections/" +
                                                  i5 +
                                                  "/blocks/" +
                                                  i7 +
                                                  "/alt/copy",
                                                schemaPath:
                                                  "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram/properties/alt/properties/copy/mapping/source/properties/sourceRef",
                                                keyword: "properties",
                                                params: {
                                                  error: "missing",
                                                  missingProperty: "sourceRef",
                                                },
                                                message:
                                                  "must have property 'sourceRef'",
                                              };
                                              if (vErrors === null) {
                                                vErrors = [err364];
                                              } else {
                                                vErrors.push(err364);
                                              }
                                              errors++;
                                            }
                                            for (const key49 in data143) {
                                              if (
                                                key49 !== "kind" &&
                                                key49 !== "text" &&
                                                key49 !== "sourceRef"
                                              ) {
                                                const err365 = {
                                                  instancePath:
                                                    instancePath +
                                                    "/body/sections/" +
                                                    i5 +
                                                    "/blocks/" +
                                                    i7 +
                                                    "/alt/copy/" +
                                                    key49
                                                      .replace(/~/g, "~0")
                                                      .replace(/\//g, "~1"),
                                                  schemaPath:
                                                    "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram/properties/alt/properties/copy/mapping/source",
                                                  keyword: "properties",
                                                  params: {
                                                    error: "additional",
                                                    additionalProperty: key49,
                                                  },
                                                  message:
                                                    "must NOT have additional properties",
                                                };
                                                if (vErrors === null) {
                                                  vErrors = [err365];
                                                } else {
                                                  vErrors.push(err365);
                                                }
                                                errors++;
                                              }
                                            }
                                            if (!valid254) {
                                              const err366 = {
                                                instancePath:
                                                  instancePath +
                                                  "/body/sections/" +
                                                  i5 +
                                                  "/blocks/" +
                                                  i7 +
                                                  "/alt/copy",
                                                schemaPath:
                                                  "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram/properties/alt/properties/copy/mapping/source/properties",
                                                keyword: "properties",
                                                params: {
                                                  type: "object",
                                                  nullable: false,
                                                },
                                                message: "must be object",
                                              };
                                              if (vErrors === null) {
                                                vErrors = [err366];
                                              } else {
                                                vErrors.push(err366);
                                              }
                                              errors++;
                                            }
                                            var valid253 = _errs175 === errors;
                                            valid248 = valid253;
                                          } else if (tag9 === "adapted") {
                                            const _errs178 = errors;
                                            let valid258 = false;
                                            valid258 = true;
                                            if (data143.text !== undefined) {
                                              if (
                                                !(
                                                  typeof data143.text ==
                                                  "string"
                                                )
                                              ) {
                                                const err367 = {
                                                  instancePath:
                                                    instancePath +
                                                    "/body/sections/" +
                                                    i5 +
                                                    "/blocks/" +
                                                    i7 +
                                                    "/alt/copy/text",
                                                  schemaPath:
                                                    "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram/properties/alt/properties/copy/mapping/adapted/properties/text/type",
                                                  keyword: "type",
                                                  params: {
                                                    type: "string",
                                                    nullable: false,
                                                  },
                                                  message: "must be string",
                                                };
                                                if (vErrors === null) {
                                                  vErrors = [err367];
                                                } else {
                                                  vErrors.push(err367);
                                                }
                                                errors++;
                                              }
                                            } else {
                                              const err368 = {
                                                instancePath:
                                                  instancePath +
                                                  "/body/sections/" +
                                                  i5 +
                                                  "/blocks/" +
                                                  i7 +
                                                  "/alt/copy",
                                                schemaPath:
                                                  "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram/properties/alt/properties/copy/mapping/adapted/properties/text",
                                                keyword: "properties",
                                                params: {
                                                  error: "missing",
                                                  missingProperty: "text",
                                                },
                                                message:
                                                  "must have property 'text'",
                                              };
                                              if (vErrors === null) {
                                                vErrors = [err368];
                                              } else {
                                                vErrors.push(err368);
                                              }
                                              errors++;
                                            }
                                            if (
                                              data143.sourceRef !== undefined
                                            ) {
                                              if (
                                                !(
                                                  typeof data143.sourceRef ==
                                                  "string"
                                                )
                                              ) {
                                                const err369 = {
                                                  instancePath:
                                                    instancePath +
                                                    "/body/sections/" +
                                                    i5 +
                                                    "/blocks/" +
                                                    i7 +
                                                    "/alt/copy/sourceRef",
                                                  schemaPath:
                                                    "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram/properties/alt/properties/copy/mapping/adapted/properties/sourceRef/type",
                                                  keyword: "type",
                                                  params: {
                                                    type: "string",
                                                    nullable: false,
                                                  },
                                                  message: "must be string",
                                                };
                                                if (vErrors === null) {
                                                  vErrors = [err369];
                                                } else {
                                                  vErrors.push(err369);
                                                }
                                                errors++;
                                              }
                                            } else {
                                              const err370 = {
                                                instancePath:
                                                  instancePath +
                                                  "/body/sections/" +
                                                  i5 +
                                                  "/blocks/" +
                                                  i7 +
                                                  "/alt/copy",
                                                schemaPath:
                                                  "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram/properties/alt/properties/copy/mapping/adapted/properties/sourceRef",
                                                keyword: "properties",
                                                params: {
                                                  error: "missing",
                                                  missingProperty: "sourceRef",
                                                },
                                                message:
                                                  "must have property 'sourceRef'",
                                              };
                                              if (vErrors === null) {
                                                vErrors = [err370];
                                              } else {
                                                vErrors.push(err370);
                                              }
                                              errors++;
                                            }
                                            for (const key50 in data143) {
                                              if (
                                                key50 !== "kind" &&
                                                key50 !== "text" &&
                                                key50 !== "sourceRef"
                                              ) {
                                                const err371 = {
                                                  instancePath:
                                                    instancePath +
                                                    "/body/sections/" +
                                                    i5 +
                                                    "/blocks/" +
                                                    i7 +
                                                    "/alt/copy/" +
                                                    key50
                                                      .replace(/~/g, "~0")
                                                      .replace(/\//g, "~1"),
                                                  schemaPath:
                                                    "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram/properties/alt/properties/copy/mapping/adapted",
                                                  keyword: "properties",
                                                  params: {
                                                    error: "additional",
                                                    additionalProperty: key50,
                                                  },
                                                  message:
                                                    "must NOT have additional properties",
                                                };
                                                if (vErrors === null) {
                                                  vErrors = [err371];
                                                } else {
                                                  vErrors.push(err371);
                                                }
                                                errors++;
                                              }
                                            }
                                            if (!valid258) {
                                              const err372 = {
                                                instancePath:
                                                  instancePath +
                                                  "/body/sections/" +
                                                  i5 +
                                                  "/blocks/" +
                                                  i7 +
                                                  "/alt/copy",
                                                schemaPath:
                                                  "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram/properties/alt/properties/copy/mapping/adapted/properties",
                                                keyword: "properties",
                                                params: {
                                                  type: "object",
                                                  nullable: false,
                                                },
                                                message: "must be object",
                                              };
                                              if (vErrors === null) {
                                                vErrors = [err372];
                                              } else {
                                                vErrors.push(err372);
                                              }
                                              errors++;
                                            }
                                            var valid257 = _errs178 === errors;
                                            valid248 = valid257;
                                          } else {
                                            const err373 = {
                                              instancePath:
                                                instancePath +
                                                "/body/sections/" +
                                                i5 +
                                                "/blocks/" +
                                                i7 +
                                                "/alt/copy/kind",
                                              schemaPath:
                                                "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram/properties/alt/properties/copy/mapping",
                                              keyword: "discriminator",
                                              params: {
                                                error: "mapping",
                                                tag: "kind",
                                                tagValue: tag9,
                                              },
                                              message:
                                                'value of tag "kind" must be in mapping',
                                            };
                                            if (vErrors === null) {
                                              vErrors = [err373];
                                            } else {
                                              vErrors.push(err373);
                                            }
                                            errors++;
                                          }
                                        } else {
                                          const err374 = {
                                            instancePath:
                                              instancePath +
                                              "/body/sections/" +
                                              i5 +
                                              "/blocks/" +
                                              i7 +
                                              "/alt/copy/kind",
                                            schemaPath:
                                              "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram/properties/alt/properties/copy/discriminator",
                                            keyword: "discriminator",
                                            params: {
                                              error: "tag",
                                              tag: "kind",
                                              tagValue: tag9,
                                            },
                                            message:
                                              'tag "kind" must be string',
                                          };
                                          if (vErrors === null) {
                                            vErrors = [err374];
                                          } else {
                                            vErrors.push(err374);
                                          }
                                          errors++;
                                        }
                                      } else if (!valid248) {
                                        const err375 = {
                                          instancePath:
                                            instancePath +
                                            "/body/sections/" +
                                            i5 +
                                            "/blocks/" +
                                            i7 +
                                            "/alt/copy",
                                          schemaPath:
                                            "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram/properties/alt/properties/copy/discriminator",
                                          keyword: "discriminator",
                                          params: {
                                            type: "object",
                                            nullable: false,
                                          },
                                          message: "must be object",
                                        };
                                        if (vErrors === null) {
                                          vErrors = [err375];
                                        } else {
                                          vErrors.push(err375);
                                        }
                                        errors++;
                                      }
                                    } else {
                                      const err376 = {
                                        instancePath:
                                          instancePath +
                                          "/body/sections/" +
                                          i5 +
                                          "/blocks/" +
                                          i7 +
                                          "/alt",
                                        schemaPath:
                                          "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram/properties/alt/properties/copy",
                                        keyword: "properties",
                                        params: {
                                          error: "missing",
                                          missingProperty: "copy",
                                        },
                                        message: "must have property 'copy'",
                                      };
                                      if (vErrors === null) {
                                        vErrors = [err376];
                                      } else {
                                        vErrors.push(err376);
                                      }
                                      errors++;
                                    }
                                    if (data142.marks !== undefined) {
                                      let data149 = data142.marks;
                                      let valid261 = false;
                                      if (!valid261) {
                                        if (Array.isArray(data149)) {
                                          let valid263 = true;
                                          const len19 = data149.length;
                                          for (
                                            let i19 = 0;
                                            i19 < len19;
                                            i19++
                                          ) {
                                            let data150 = data149[i19];
                                            const _errs182 = errors;
                                            let valid264 = false;
                                            if (
                                              data150 &&
                                              typeof data150 == "object" &&
                                              !Array.isArray(data150)
                                            ) {
                                              valid264 = true;
                                              if (data150.kind !== undefined) {
                                                let data151 = data150.kind;
                                                if (!(
                                                  typeof data151 == "string" &&
                                                  (data151 === "bold" ||
                                                    data151 === "italic" ||
                                                    data151 === "underline")
                                                )) {
                                                  const err377 = {
                                                    instancePath:
                                                      instancePath +
                                                      "/body/sections/" +
                                                      i5 +
                                                      "/blocks/" +
                                                      i7 +
                                                      "/alt/marks/" +
                                                      i19 +
                                                      "/kind",
                                                    schemaPath:
                                                      "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram/properties/alt/properties/marks/elements/properties/kind/enum",
                                                    keyword: "enum",
                                                    params: {
                                                      allowedValues:
                                                        schema30.properties.body
                                                          .properties.sections
                                                          .elements.properties
                                                          .blocks.elements
                                                          .mapping.diagram
                                                          .properties.alt
                                                          .properties.marks
                                                          .elements.properties
                                                          .kind.enum,
                                                    },
                                                    message:
                                                      "must be equal to one of the allowed values",
                                                  };
                                                  if (vErrors === null) {
                                                    vErrors = [err377];
                                                  } else {
                                                    vErrors.push(err377);
                                                  }
                                                  errors++;
                                                }
                                              } else {
                                                const err378 = {
                                                  instancePath:
                                                    instancePath +
                                                    "/body/sections/" +
                                                    i5 +
                                                    "/blocks/" +
                                                    i7 +
                                                    "/alt/marks/" +
                                                    i19,
                                                  schemaPath:
                                                    "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram/properties/alt/properties/marks/elements/properties/kind",
                                                  keyword: "properties",
                                                  params: {
                                                    error: "missing",
                                                    missingProperty: "kind",
                                                  },
                                                  message:
                                                    "must have property 'kind'",
                                                };
                                                if (vErrors === null) {
                                                  vErrors = [err378];
                                                } else {
                                                  vErrors.push(err378);
                                                }
                                                errors++;
                                              }
                                              if (data150.start !== undefined) {
                                                let data152 = data150.start;
                                                if (!(
                                                  typeof data152 == "number" &&
                                                  isFinite(data152) &&
                                                  !(data152 % 1) &&
                                                  data152 >= 0 &&
                                                  data152 <= 4294967295
                                                )) {
                                                  const err379 = {
                                                    instancePath:
                                                      instancePath +
                                                      "/body/sections/" +
                                                      i5 +
                                                      "/blocks/" +
                                                      i7 +
                                                      "/alt/marks/" +
                                                      i19 +
                                                      "/start",
                                                    schemaPath:
                                                      "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram/properties/alt/properties/marks/elements/properties/start/type",
                                                    keyword: "type",
                                                    params: {
                                                      type: "uint32",
                                                      nullable: false,
                                                    },
                                                    message: "must be uint32",
                                                  };
                                                  if (vErrors === null) {
                                                    vErrors = [err379];
                                                  } else {
                                                    vErrors.push(err379);
                                                  }
                                                  errors++;
                                                }
                                              } else {
                                                const err380 = {
                                                  instancePath:
                                                    instancePath +
                                                    "/body/sections/" +
                                                    i5 +
                                                    "/blocks/" +
                                                    i7 +
                                                    "/alt/marks/" +
                                                    i19,
                                                  schemaPath:
                                                    "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram/properties/alt/properties/marks/elements/properties/start",
                                                  keyword: "properties",
                                                  params: {
                                                    error: "missing",
                                                    missingProperty: "start",
                                                  },
                                                  message:
                                                    "must have property 'start'",
                                                };
                                                if (vErrors === null) {
                                                  vErrors = [err380];
                                                } else {
                                                  vErrors.push(err380);
                                                }
                                                errors++;
                                              }
                                              if (
                                                data150.length !== undefined
                                              ) {
                                                let data153 = data150.length;
                                                if (!(
                                                  typeof data153 == "number" &&
                                                  isFinite(data153) &&
                                                  !(data153 % 1) &&
                                                  data153 >= 0 &&
                                                  data153 <= 4294967295
                                                )) {
                                                  const err381 = {
                                                    instancePath:
                                                      instancePath +
                                                      "/body/sections/" +
                                                      i5 +
                                                      "/blocks/" +
                                                      i7 +
                                                      "/alt/marks/" +
                                                      i19 +
                                                      "/length",
                                                    schemaPath:
                                                      "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram/properties/alt/properties/marks/elements/properties/length/type",
                                                    keyword: "type",
                                                    params: {
                                                      type: "uint32",
                                                      nullable: false,
                                                    },
                                                    message: "must be uint32",
                                                  };
                                                  if (vErrors === null) {
                                                    vErrors = [err381];
                                                  } else {
                                                    vErrors.push(err381);
                                                  }
                                                  errors++;
                                                }
                                              } else {
                                                const err382 = {
                                                  instancePath:
                                                    instancePath +
                                                    "/body/sections/" +
                                                    i5 +
                                                    "/blocks/" +
                                                    i7 +
                                                    "/alt/marks/" +
                                                    i19,
                                                  schemaPath:
                                                    "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram/properties/alt/properties/marks/elements/properties/length",
                                                  keyword: "properties",
                                                  params: {
                                                    error: "missing",
                                                    missingProperty: "length",
                                                  },
                                                  message:
                                                    "must have property 'length'",
                                                };
                                                if (vErrors === null) {
                                                  vErrors = [err382];
                                                } else {
                                                  vErrors.push(err382);
                                                }
                                                errors++;
                                              }
                                              for (const key51 in data150) {
                                                if (
                                                  key51 !== "kind" &&
                                                  key51 !== "start" &&
                                                  key51 !== "length"
                                                ) {
                                                  const err383 = {
                                                    instancePath:
                                                      instancePath +
                                                      "/body/sections/" +
                                                      i5 +
                                                      "/blocks/" +
                                                      i7 +
                                                      "/alt/marks/" +
                                                      i19 +
                                                      "/" +
                                                      key51
                                                        .replace(/~/g, "~0")
                                                        .replace(/\//g, "~1"),
                                                    schemaPath:
                                                      "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram/properties/alt/properties/marks/elements",
                                                    keyword: "properties",
                                                    params: {
                                                      error: "additional",
                                                      additionalProperty: key51,
                                                    },
                                                    message:
                                                      "must NOT have additional properties",
                                                  };
                                                  if (vErrors === null) {
                                                    vErrors = [err383];
                                                  } else {
                                                    vErrors.push(err383);
                                                  }
                                                  errors++;
                                                }
                                              }
                                            }
                                            if (!valid264) {
                                              const err384 = {
                                                instancePath:
                                                  instancePath +
                                                  "/body/sections/" +
                                                  i5 +
                                                  "/blocks/" +
                                                  i7 +
                                                  "/alt/marks/" +
                                                  i19,
                                                schemaPath:
                                                  "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram/properties/alt/properties/marks/elements/properties",
                                                keyword: "properties",
                                                params: {
                                                  type: "object",
                                                  nullable: false,
                                                },
                                                message: "must be object",
                                              };
                                              if (vErrors === null) {
                                                vErrors = [err384];
                                              } else {
                                                vErrors.push(err384);
                                              }
                                              errors++;
                                            }
                                            var valid262 = _errs182 === errors;
                                            if (!valid262) {
                                              valid263 = false;
                                            }
                                          }
                                          valid261 = valid263;
                                        } else {
                                          const err385 = {
                                            instancePath:
                                              instancePath +
                                              "/body/sections/" +
                                              i5 +
                                              "/blocks/" +
                                              i7 +
                                              "/alt/marks",
                                            schemaPath:
                                              "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram/properties/alt/properties/marks/elements",
                                            keyword: "elements",
                                            params: {
                                              type: "array",
                                              nullable: false,
                                            },
                                            message: "must be array",
                                          };
                                          if (vErrors === null) {
                                            vErrors = [err385];
                                          } else {
                                            vErrors.push(err385);
                                          }
                                          errors++;
                                        }
                                      }
                                    } else {
                                      const err386 = {
                                        instancePath:
                                          instancePath +
                                          "/body/sections/" +
                                          i5 +
                                          "/blocks/" +
                                          i7 +
                                          "/alt",
                                        schemaPath:
                                          "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram/properties/alt/properties/marks",
                                        keyword: "properties",
                                        params: {
                                          error: "missing",
                                          missingProperty: "marks",
                                        },
                                        message: "must have property 'marks'",
                                      };
                                      if (vErrors === null) {
                                        vErrors = [err386];
                                      } else {
                                        vErrors.push(err386);
                                      }
                                      errors++;
                                    }
                                    for (const key52 in data142) {
                                      if (
                                        key52 !== "copy" &&
                                        key52 !== "marks"
                                      ) {
                                        const err387 = {
                                          instancePath:
                                            instancePath +
                                            "/body/sections/" +
                                            i5 +
                                            "/blocks/" +
                                            i7 +
                                            "/alt/" +
                                            key52
                                              .replace(/~/g, "~0")
                                              .replace(/\//g, "~1"),
                                          schemaPath:
                                            "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram/properties/alt",
                                          keyword: "properties",
                                          params: {
                                            error: "additional",
                                            additionalProperty: key52,
                                          },
                                          message:
                                            "must NOT have additional properties",
                                        };
                                        if (vErrors === null) {
                                          vErrors = [err387];
                                        } else {
                                          vErrors.push(err387);
                                        }
                                        errors++;
                                      }
                                    }
                                  }
                                  if (!valid246) {
                                    const err388 = {
                                      instancePath:
                                        instancePath +
                                        "/body/sections/" +
                                        i5 +
                                        "/blocks/" +
                                        i7 +
                                        "/alt",
                                      schemaPath:
                                        "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram/properties/alt/properties",
                                      keyword: "properties",
                                      params: {
                                        type: "object",
                                        nullable: false,
                                      },
                                      message: "must be object",
                                    };
                                    if (vErrors === null) {
                                      vErrors = [err388];
                                    } else {
                                      vErrors.push(err388);
                                    }
                                    errors++;
                                  }
                                } else {
                                  const err389 = {
                                    instancePath:
                                      instancePath +
                                      "/body/sections/" +
                                      i5 +
                                      "/blocks/" +
                                      i7,
                                    schemaPath:
                                      "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram/properties/alt",
                                    keyword: "properties",
                                    params: {
                                      error: "missing",
                                      missingProperty: "alt",
                                    },
                                    message: "must have property 'alt'",
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err389];
                                  } else {
                                    vErrors.push(err389);
                                  }
                                  errors++;
                                }
                                for (const key53 in data54) {
                                  if (
                                    key53 !== "kind" &&
                                    key53 !== "id" &&
                                    key53 !== "assetId" &&
                                    key53 !== "caption" &&
                                    key53 !== "alt"
                                  ) {
                                    const err390 = {
                                      instancePath:
                                        instancePath +
                                        "/body/sections/" +
                                        i5 +
                                        "/blocks/" +
                                        i7 +
                                        "/" +
                                        key53
                                          .replace(/~/g, "~0")
                                          .replace(/\//g, "~1"),
                                      schemaPath:
                                        "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram",
                                      keyword: "properties",
                                      params: {
                                        error: "additional",
                                        additionalProperty: key53,
                                      },
                                      message:
                                        "must NOT have additional properties",
                                    };
                                    if (vErrors === null) {
                                      vErrors = [err390];
                                    } else {
                                      vErrors.push(err390);
                                    }
                                    errors++;
                                  }
                                }
                                if (!valid222) {
                                  const err391 = {
                                    instancePath:
                                      instancePath +
                                      "/body/sections/" +
                                      i5 +
                                      "/blocks/" +
                                      i7,
                                    schemaPath:
                                      "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/diagram/properties",
                                    keyword: "properties",
                                    params: { type: "object", nullable: false },
                                    message: "must be object",
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err391];
                                  } else {
                                    vErrors.push(err391);
                                  }
                                  errors++;
                                }
                                var valid221 = _errs153 === errors;
                                valid77 = valid221;
                              } else if (tag2 === "reference") {
                                const _errs186 = errors;
                                let valid270 = false;
                                valid270 = true;
                                if (data54.id !== undefined) {
                                  if (!(typeof data54.id == "string")) {
                                    const err392 = {
                                      instancePath:
                                        instancePath +
                                        "/body/sections/" +
                                        i5 +
                                        "/blocks/" +
                                        i7 +
                                        "/id",
                                      schemaPath:
                                        "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/reference/properties/id/type",
                                      keyword: "type",
                                      params: {
                                        type: "string",
                                        nullable: false,
                                      },
                                      message: "must be string",
                                    };
                                    if (vErrors === null) {
                                      vErrors = [err392];
                                    } else {
                                      vErrors.push(err392);
                                    }
                                    errors++;
                                  }
                                } else {
                                  const err393 = {
                                    instancePath:
                                      instancePath +
                                      "/body/sections/" +
                                      i5 +
                                      "/blocks/" +
                                      i7,
                                    schemaPath:
                                      "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/reference/properties/id",
                                    keyword: "properties",
                                    params: {
                                      error: "missing",
                                      missingProperty: "id",
                                    },
                                    message: "must have property 'id'",
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err393];
                                  } else {
                                    vErrors.push(err393);
                                  }
                                  errors++;
                                }
                                if (data54.label !== undefined) {
                                  let data155 = data54.label;
                                  let valid272 = false;
                                  if (
                                    data155 &&
                                    typeof data155 == "object" &&
                                    !Array.isArray(data155)
                                  ) {
                                    valid272 = true;
                                    if (data155.copy !== undefined) {
                                      let data156 = data155.copy;
                                      let valid274 = false;
                                      if (
                                        data156 &&
                                        typeof data156 == "object" &&
                                        !Array.isArray(data156)
                                      ) {
                                        const tag10 = data156.kind;
                                        if (tag10 === undefined) {
                                          const err394 = {
                                            instancePath:
                                              instancePath +
                                              "/body/sections/" +
                                              i5 +
                                              "/blocks/" +
                                              i7 +
                                              "/label/copy",
                                            schemaPath:
                                              "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/reference/properties/label/properties/copy/discriminator",
                                            keyword: "discriminator",
                                            params: {
                                              error: "tag",
                                              tag: "kind",
                                              tagValue: tag10,
                                            },
                                            message:
                                              'tag "kind" must be string',
                                          };
                                          if (vErrors === null) {
                                            vErrors = [err394];
                                          } else {
                                            vErrors.push(err394);
                                          }
                                          errors++;
                                        } else if (typeof tag10 == "string") {
                                          if (tag10 === "added") {
                                            const _errs190 = errors;
                                            let valid276 = false;
                                            valid276 = true;
                                            if (data156.text !== undefined) {
                                              if (
                                                !(
                                                  typeof data156.text ==
                                                  "string"
                                                )
                                              ) {
                                                const err395 = {
                                                  instancePath:
                                                    instancePath +
                                                    "/body/sections/" +
                                                    i5 +
                                                    "/blocks/" +
                                                    i7 +
                                                    "/label/copy/text",
                                                  schemaPath:
                                                    "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/reference/properties/label/properties/copy/mapping/added/properties/text/type",
                                                  keyword: "type",
                                                  params: {
                                                    type: "string",
                                                    nullable: false,
                                                  },
                                                  message: "must be string",
                                                };
                                                if (vErrors === null) {
                                                  vErrors = [err395];
                                                } else {
                                                  vErrors.push(err395);
                                                }
                                                errors++;
                                              }
                                            } else {
                                              const err396 = {
                                                instancePath:
                                                  instancePath +
                                                  "/body/sections/" +
                                                  i5 +
                                                  "/blocks/" +
                                                  i7 +
                                                  "/label/copy",
                                                schemaPath:
                                                  "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/reference/properties/label/properties/copy/mapping/added/properties/text",
                                                keyword: "properties",
                                                params: {
                                                  error: "missing",
                                                  missingProperty: "text",
                                                },
                                                message:
                                                  "must have property 'text'",
                                              };
                                              if (vErrors === null) {
                                                vErrors = [err396];
                                              } else {
                                                vErrors.push(err396);
                                              }
                                              errors++;
                                            }
                                            for (const key54 in data156) {
                                              if (
                                                key54 !== "kind" &&
                                                key54 !== "text"
                                              ) {
                                                const err397 = {
                                                  instancePath:
                                                    instancePath +
                                                    "/body/sections/" +
                                                    i5 +
                                                    "/blocks/" +
                                                    i7 +
                                                    "/label/copy/" +
                                                    key54
                                                      .replace(/~/g, "~0")
                                                      .replace(/\//g, "~1"),
                                                  schemaPath:
                                                    "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/reference/properties/label/properties/copy/mapping/added",
                                                  keyword: "properties",
                                                  params: {
                                                    error: "additional",
                                                    additionalProperty: key54,
                                                  },
                                                  message:
                                                    "must NOT have additional properties",
                                                };
                                                if (vErrors === null) {
                                                  vErrors = [err397];
                                                } else {
                                                  vErrors.push(err397);
                                                }
                                                errors++;
                                              }
                                            }
                                            if (!valid276) {
                                              const err398 = {
                                                instancePath:
                                                  instancePath +
                                                  "/body/sections/" +
                                                  i5 +
                                                  "/blocks/" +
                                                  i7 +
                                                  "/label/copy",
                                                schemaPath:
                                                  "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/reference/properties/label/properties/copy/mapping/added/properties",
                                                keyword: "properties",
                                                params: {
                                                  type: "object",
                                                  nullable: false,
                                                },
                                                message: "must be object",
                                              };
                                              if (vErrors === null) {
                                                vErrors = [err398];
                                              } else {
                                                vErrors.push(err398);
                                              }
                                              errors++;
                                            }
                                            var valid275 = _errs190 === errors;
                                            valid274 = valid275;
                                          } else if (tag10 === "source") {
                                            const _errs192 = errors;
                                            let valid280 = false;
                                            valid280 = true;
                                            if (data156.text !== undefined) {
                                              if (
                                                !(
                                                  typeof data156.text ==
                                                  "string"
                                                )
                                              ) {
                                                const err399 = {
                                                  instancePath:
                                                    instancePath +
                                                    "/body/sections/" +
                                                    i5 +
                                                    "/blocks/" +
                                                    i7 +
                                                    "/label/copy/text",
                                                  schemaPath:
                                                    "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/reference/properties/label/properties/copy/mapping/source/properties/text/type",
                                                  keyword: "type",
                                                  params: {
                                                    type: "string",
                                                    nullable: false,
                                                  },
                                                  message: "must be string",
                                                };
                                                if (vErrors === null) {
                                                  vErrors = [err399];
                                                } else {
                                                  vErrors.push(err399);
                                                }
                                                errors++;
                                              }
                                            } else {
                                              const err400 = {
                                                instancePath:
                                                  instancePath +
                                                  "/body/sections/" +
                                                  i5 +
                                                  "/blocks/" +
                                                  i7 +
                                                  "/label/copy",
                                                schemaPath:
                                                  "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/reference/properties/label/properties/copy/mapping/source/properties/text",
                                                keyword: "properties",
                                                params: {
                                                  error: "missing",
                                                  missingProperty: "text",
                                                },
                                                message:
                                                  "must have property 'text'",
                                              };
                                              if (vErrors === null) {
                                                vErrors = [err400];
                                              } else {
                                                vErrors.push(err400);
                                              }
                                              errors++;
                                            }
                                            if (
                                              data156.sourceRef !== undefined
                                            ) {
                                              if (
                                                !(
                                                  typeof data156.sourceRef ==
                                                  "string"
                                                )
                                              ) {
                                                const err401 = {
                                                  instancePath:
                                                    instancePath +
                                                    "/body/sections/" +
                                                    i5 +
                                                    "/blocks/" +
                                                    i7 +
                                                    "/label/copy/sourceRef",
                                                  schemaPath:
                                                    "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/reference/properties/label/properties/copy/mapping/source/properties/sourceRef/type",
                                                  keyword: "type",
                                                  params: {
                                                    type: "string",
                                                    nullable: false,
                                                  },
                                                  message: "must be string",
                                                };
                                                if (vErrors === null) {
                                                  vErrors = [err401];
                                                } else {
                                                  vErrors.push(err401);
                                                }
                                                errors++;
                                              }
                                            } else {
                                              const err402 = {
                                                instancePath:
                                                  instancePath +
                                                  "/body/sections/" +
                                                  i5 +
                                                  "/blocks/" +
                                                  i7 +
                                                  "/label/copy",
                                                schemaPath:
                                                  "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/reference/properties/label/properties/copy/mapping/source/properties/sourceRef",
                                                keyword: "properties",
                                                params: {
                                                  error: "missing",
                                                  missingProperty: "sourceRef",
                                                },
                                                message:
                                                  "must have property 'sourceRef'",
                                              };
                                              if (vErrors === null) {
                                                vErrors = [err402];
                                              } else {
                                                vErrors.push(err402);
                                              }
                                              errors++;
                                            }
                                            for (const key55 in data156) {
                                              if (
                                                key55 !== "kind" &&
                                                key55 !== "text" &&
                                                key55 !== "sourceRef"
                                              ) {
                                                const err403 = {
                                                  instancePath:
                                                    instancePath +
                                                    "/body/sections/" +
                                                    i5 +
                                                    "/blocks/" +
                                                    i7 +
                                                    "/label/copy/" +
                                                    key55
                                                      .replace(/~/g, "~0")
                                                      .replace(/\//g, "~1"),
                                                  schemaPath:
                                                    "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/reference/properties/label/properties/copy/mapping/source",
                                                  keyword: "properties",
                                                  params: {
                                                    error: "additional",
                                                    additionalProperty: key55,
                                                  },
                                                  message:
                                                    "must NOT have additional properties",
                                                };
                                                if (vErrors === null) {
                                                  vErrors = [err403];
                                                } else {
                                                  vErrors.push(err403);
                                                }
                                                errors++;
                                              }
                                            }
                                            if (!valid280) {
                                              const err404 = {
                                                instancePath:
                                                  instancePath +
                                                  "/body/sections/" +
                                                  i5 +
                                                  "/blocks/" +
                                                  i7 +
                                                  "/label/copy",
                                                schemaPath:
                                                  "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/reference/properties/label/properties/copy/mapping/source/properties",
                                                keyword: "properties",
                                                params: {
                                                  type: "object",
                                                  nullable: false,
                                                },
                                                message: "must be object",
                                              };
                                              if (vErrors === null) {
                                                vErrors = [err404];
                                              } else {
                                                vErrors.push(err404);
                                              }
                                              errors++;
                                            }
                                            var valid279 = _errs192 === errors;
                                            valid274 = valid279;
                                          } else if (tag10 === "adapted") {
                                            const _errs195 = errors;
                                            let valid284 = false;
                                            valid284 = true;
                                            if (data156.text !== undefined) {
                                              if (
                                                !(
                                                  typeof data156.text ==
                                                  "string"
                                                )
                                              ) {
                                                const err405 = {
                                                  instancePath:
                                                    instancePath +
                                                    "/body/sections/" +
                                                    i5 +
                                                    "/blocks/" +
                                                    i7 +
                                                    "/label/copy/text",
                                                  schemaPath:
                                                    "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/reference/properties/label/properties/copy/mapping/adapted/properties/text/type",
                                                  keyword: "type",
                                                  params: {
                                                    type: "string",
                                                    nullable: false,
                                                  },
                                                  message: "must be string",
                                                };
                                                if (vErrors === null) {
                                                  vErrors = [err405];
                                                } else {
                                                  vErrors.push(err405);
                                                }
                                                errors++;
                                              }
                                            } else {
                                              const err406 = {
                                                instancePath:
                                                  instancePath +
                                                  "/body/sections/" +
                                                  i5 +
                                                  "/blocks/" +
                                                  i7 +
                                                  "/label/copy",
                                                schemaPath:
                                                  "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/reference/properties/label/properties/copy/mapping/adapted/properties/text",
                                                keyword: "properties",
                                                params: {
                                                  error: "missing",
                                                  missingProperty: "text",
                                                },
                                                message:
                                                  "must have property 'text'",
                                              };
                                              if (vErrors === null) {
                                                vErrors = [err406];
                                              } else {
                                                vErrors.push(err406);
                                              }
                                              errors++;
                                            }
                                            if (
                                              data156.sourceRef !== undefined
                                            ) {
                                              if (
                                                !(
                                                  typeof data156.sourceRef ==
                                                  "string"
                                                )
                                              ) {
                                                const err407 = {
                                                  instancePath:
                                                    instancePath +
                                                    "/body/sections/" +
                                                    i5 +
                                                    "/blocks/" +
                                                    i7 +
                                                    "/label/copy/sourceRef",
                                                  schemaPath:
                                                    "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/reference/properties/label/properties/copy/mapping/adapted/properties/sourceRef/type",
                                                  keyword: "type",
                                                  params: {
                                                    type: "string",
                                                    nullable: false,
                                                  },
                                                  message: "must be string",
                                                };
                                                if (vErrors === null) {
                                                  vErrors = [err407];
                                                } else {
                                                  vErrors.push(err407);
                                                }
                                                errors++;
                                              }
                                            } else {
                                              const err408 = {
                                                instancePath:
                                                  instancePath +
                                                  "/body/sections/" +
                                                  i5 +
                                                  "/blocks/" +
                                                  i7 +
                                                  "/label/copy",
                                                schemaPath:
                                                  "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/reference/properties/label/properties/copy/mapping/adapted/properties/sourceRef",
                                                keyword: "properties",
                                                params: {
                                                  error: "missing",
                                                  missingProperty: "sourceRef",
                                                },
                                                message:
                                                  "must have property 'sourceRef'",
                                              };
                                              if (vErrors === null) {
                                                vErrors = [err408];
                                              } else {
                                                vErrors.push(err408);
                                              }
                                              errors++;
                                            }
                                            for (const key56 in data156) {
                                              if (
                                                key56 !== "kind" &&
                                                key56 !== "text" &&
                                                key56 !== "sourceRef"
                                              ) {
                                                const err409 = {
                                                  instancePath:
                                                    instancePath +
                                                    "/body/sections/" +
                                                    i5 +
                                                    "/blocks/" +
                                                    i7 +
                                                    "/label/copy/" +
                                                    key56
                                                      .replace(/~/g, "~0")
                                                      .replace(/\//g, "~1"),
                                                  schemaPath:
                                                    "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/reference/properties/label/properties/copy/mapping/adapted",
                                                  keyword: "properties",
                                                  params: {
                                                    error: "additional",
                                                    additionalProperty: key56,
                                                  },
                                                  message:
                                                    "must NOT have additional properties",
                                                };
                                                if (vErrors === null) {
                                                  vErrors = [err409];
                                                } else {
                                                  vErrors.push(err409);
                                                }
                                                errors++;
                                              }
                                            }
                                            if (!valid284) {
                                              const err410 = {
                                                instancePath:
                                                  instancePath +
                                                  "/body/sections/" +
                                                  i5 +
                                                  "/blocks/" +
                                                  i7 +
                                                  "/label/copy",
                                                schemaPath:
                                                  "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/reference/properties/label/properties/copy/mapping/adapted/properties",
                                                keyword: "properties",
                                                params: {
                                                  type: "object",
                                                  nullable: false,
                                                },
                                                message: "must be object",
                                              };
                                              if (vErrors === null) {
                                                vErrors = [err410];
                                              } else {
                                                vErrors.push(err410);
                                              }
                                              errors++;
                                            }
                                            var valid283 = _errs195 === errors;
                                            valid274 = valid283;
                                          } else {
                                            const err411 = {
                                              instancePath:
                                                instancePath +
                                                "/body/sections/" +
                                                i5 +
                                                "/blocks/" +
                                                i7 +
                                                "/label/copy/kind",
                                              schemaPath:
                                                "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/reference/properties/label/properties/copy/mapping",
                                              keyword: "discriminator",
                                              params: {
                                                error: "mapping",
                                                tag: "kind",
                                                tagValue: tag10,
                                              },
                                              message:
                                                'value of tag "kind" must be in mapping',
                                            };
                                            if (vErrors === null) {
                                              vErrors = [err411];
                                            } else {
                                              vErrors.push(err411);
                                            }
                                            errors++;
                                          }
                                        } else {
                                          const err412 = {
                                            instancePath:
                                              instancePath +
                                              "/body/sections/" +
                                              i5 +
                                              "/blocks/" +
                                              i7 +
                                              "/label/copy/kind",
                                            schemaPath:
                                              "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/reference/properties/label/properties/copy/discriminator",
                                            keyword: "discriminator",
                                            params: {
                                              error: "tag",
                                              tag: "kind",
                                              tagValue: tag10,
                                            },
                                            message:
                                              'tag "kind" must be string',
                                          };
                                          if (vErrors === null) {
                                            vErrors = [err412];
                                          } else {
                                            vErrors.push(err412);
                                          }
                                          errors++;
                                        }
                                      } else if (!valid274) {
                                        const err413 = {
                                          instancePath:
                                            instancePath +
                                            "/body/sections/" +
                                            i5 +
                                            "/blocks/" +
                                            i7 +
                                            "/label/copy",
                                          schemaPath:
                                            "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/reference/properties/label/properties/copy/discriminator",
                                          keyword: "discriminator",
                                          params: {
                                            type: "object",
                                            nullable: false,
                                          },
                                          message: "must be object",
                                        };
                                        if (vErrors === null) {
                                          vErrors = [err413];
                                        } else {
                                          vErrors.push(err413);
                                        }
                                        errors++;
                                      }
                                    } else {
                                      const err414 = {
                                        instancePath:
                                          instancePath +
                                          "/body/sections/" +
                                          i5 +
                                          "/blocks/" +
                                          i7 +
                                          "/label",
                                        schemaPath:
                                          "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/reference/properties/label/properties/copy",
                                        keyword: "properties",
                                        params: {
                                          error: "missing",
                                          missingProperty: "copy",
                                        },
                                        message: "must have property 'copy'",
                                      };
                                      if (vErrors === null) {
                                        vErrors = [err414];
                                      } else {
                                        vErrors.push(err414);
                                      }
                                      errors++;
                                    }
                                    if (data155.marks !== undefined) {
                                      let data162 = data155.marks;
                                      let valid287 = false;
                                      if (!valid287) {
                                        if (Array.isArray(data162)) {
                                          let valid289 = true;
                                          const len20 = data162.length;
                                          for (
                                            let i20 = 0;
                                            i20 < len20;
                                            i20++
                                          ) {
                                            let data163 = data162[i20];
                                            const _errs199 = errors;
                                            let valid290 = false;
                                            if (
                                              data163 &&
                                              typeof data163 == "object" &&
                                              !Array.isArray(data163)
                                            ) {
                                              valid290 = true;
                                              if (data163.kind !== undefined) {
                                                let data164 = data163.kind;
                                                if (!(
                                                  typeof data164 == "string" &&
                                                  (data164 === "bold" ||
                                                    data164 === "italic" ||
                                                    data164 === "underline")
                                                )) {
                                                  const err415 = {
                                                    instancePath:
                                                      instancePath +
                                                      "/body/sections/" +
                                                      i5 +
                                                      "/blocks/" +
                                                      i7 +
                                                      "/label/marks/" +
                                                      i20 +
                                                      "/kind",
                                                    schemaPath:
                                                      "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/reference/properties/label/properties/marks/elements/properties/kind/enum",
                                                    keyword: "enum",
                                                    params: {
                                                      allowedValues:
                                                        schema30.properties.body
                                                          .properties.sections
                                                          .elements.properties
                                                          .blocks.elements
                                                          .mapping.reference
                                                          .properties.label
                                                          .properties.marks
                                                          .elements.properties
                                                          .kind.enum,
                                                    },
                                                    message:
                                                      "must be equal to one of the allowed values",
                                                  };
                                                  if (vErrors === null) {
                                                    vErrors = [err415];
                                                  } else {
                                                    vErrors.push(err415);
                                                  }
                                                  errors++;
                                                }
                                              } else {
                                                const err416 = {
                                                  instancePath:
                                                    instancePath +
                                                    "/body/sections/" +
                                                    i5 +
                                                    "/blocks/" +
                                                    i7 +
                                                    "/label/marks/" +
                                                    i20,
                                                  schemaPath:
                                                    "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/reference/properties/label/properties/marks/elements/properties/kind",
                                                  keyword: "properties",
                                                  params: {
                                                    error: "missing",
                                                    missingProperty: "kind",
                                                  },
                                                  message:
                                                    "must have property 'kind'",
                                                };
                                                if (vErrors === null) {
                                                  vErrors = [err416];
                                                } else {
                                                  vErrors.push(err416);
                                                }
                                                errors++;
                                              }
                                              if (data163.start !== undefined) {
                                                let data165 = data163.start;
                                                if (!(
                                                  typeof data165 == "number" &&
                                                  isFinite(data165) &&
                                                  !(data165 % 1) &&
                                                  data165 >= 0 &&
                                                  data165 <= 4294967295
                                                )) {
                                                  const err417 = {
                                                    instancePath:
                                                      instancePath +
                                                      "/body/sections/" +
                                                      i5 +
                                                      "/blocks/" +
                                                      i7 +
                                                      "/label/marks/" +
                                                      i20 +
                                                      "/start",
                                                    schemaPath:
                                                      "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/reference/properties/label/properties/marks/elements/properties/start/type",
                                                    keyword: "type",
                                                    params: {
                                                      type: "uint32",
                                                      nullable: false,
                                                    },
                                                    message: "must be uint32",
                                                  };
                                                  if (vErrors === null) {
                                                    vErrors = [err417];
                                                  } else {
                                                    vErrors.push(err417);
                                                  }
                                                  errors++;
                                                }
                                              } else {
                                                const err418 = {
                                                  instancePath:
                                                    instancePath +
                                                    "/body/sections/" +
                                                    i5 +
                                                    "/blocks/" +
                                                    i7 +
                                                    "/label/marks/" +
                                                    i20,
                                                  schemaPath:
                                                    "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/reference/properties/label/properties/marks/elements/properties/start",
                                                  keyword: "properties",
                                                  params: {
                                                    error: "missing",
                                                    missingProperty: "start",
                                                  },
                                                  message:
                                                    "must have property 'start'",
                                                };
                                                if (vErrors === null) {
                                                  vErrors = [err418];
                                                } else {
                                                  vErrors.push(err418);
                                                }
                                                errors++;
                                              }
                                              if (
                                                data163.length !== undefined
                                              ) {
                                                let data166 = data163.length;
                                                if (!(
                                                  typeof data166 == "number" &&
                                                  isFinite(data166) &&
                                                  !(data166 % 1) &&
                                                  data166 >= 0 &&
                                                  data166 <= 4294967295
                                                )) {
                                                  const err419 = {
                                                    instancePath:
                                                      instancePath +
                                                      "/body/sections/" +
                                                      i5 +
                                                      "/blocks/" +
                                                      i7 +
                                                      "/label/marks/" +
                                                      i20 +
                                                      "/length",
                                                    schemaPath:
                                                      "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/reference/properties/label/properties/marks/elements/properties/length/type",
                                                    keyword: "type",
                                                    params: {
                                                      type: "uint32",
                                                      nullable: false,
                                                    },
                                                    message: "must be uint32",
                                                  };
                                                  if (vErrors === null) {
                                                    vErrors = [err419];
                                                  } else {
                                                    vErrors.push(err419);
                                                  }
                                                  errors++;
                                                }
                                              } else {
                                                const err420 = {
                                                  instancePath:
                                                    instancePath +
                                                    "/body/sections/" +
                                                    i5 +
                                                    "/blocks/" +
                                                    i7 +
                                                    "/label/marks/" +
                                                    i20,
                                                  schemaPath:
                                                    "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/reference/properties/label/properties/marks/elements/properties/length",
                                                  keyword: "properties",
                                                  params: {
                                                    error: "missing",
                                                    missingProperty: "length",
                                                  },
                                                  message:
                                                    "must have property 'length'",
                                                };
                                                if (vErrors === null) {
                                                  vErrors = [err420];
                                                } else {
                                                  vErrors.push(err420);
                                                }
                                                errors++;
                                              }
                                              for (const key57 in data163) {
                                                if (
                                                  key57 !== "kind" &&
                                                  key57 !== "start" &&
                                                  key57 !== "length"
                                                ) {
                                                  const err421 = {
                                                    instancePath:
                                                      instancePath +
                                                      "/body/sections/" +
                                                      i5 +
                                                      "/blocks/" +
                                                      i7 +
                                                      "/label/marks/" +
                                                      i20 +
                                                      "/" +
                                                      key57
                                                        .replace(/~/g, "~0")
                                                        .replace(/\//g, "~1"),
                                                    schemaPath:
                                                      "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/reference/properties/label/properties/marks/elements",
                                                    keyword: "properties",
                                                    params: {
                                                      error: "additional",
                                                      additionalProperty: key57,
                                                    },
                                                    message:
                                                      "must NOT have additional properties",
                                                  };
                                                  if (vErrors === null) {
                                                    vErrors = [err421];
                                                  } else {
                                                    vErrors.push(err421);
                                                  }
                                                  errors++;
                                                }
                                              }
                                            }
                                            if (!valid290) {
                                              const err422 = {
                                                instancePath:
                                                  instancePath +
                                                  "/body/sections/" +
                                                  i5 +
                                                  "/blocks/" +
                                                  i7 +
                                                  "/label/marks/" +
                                                  i20,
                                                schemaPath:
                                                  "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/reference/properties/label/properties/marks/elements/properties",
                                                keyword: "properties",
                                                params: {
                                                  type: "object",
                                                  nullable: false,
                                                },
                                                message: "must be object",
                                              };
                                              if (vErrors === null) {
                                                vErrors = [err422];
                                              } else {
                                                vErrors.push(err422);
                                              }
                                              errors++;
                                            }
                                            var valid288 = _errs199 === errors;
                                            if (!valid288) {
                                              valid289 = false;
                                            }
                                          }
                                          valid287 = valid289;
                                        } else {
                                          const err423 = {
                                            instancePath:
                                              instancePath +
                                              "/body/sections/" +
                                              i5 +
                                              "/blocks/" +
                                              i7 +
                                              "/label/marks",
                                            schemaPath:
                                              "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/reference/properties/label/properties/marks/elements",
                                            keyword: "elements",
                                            params: {
                                              type: "array",
                                              nullable: false,
                                            },
                                            message: "must be array",
                                          };
                                          if (vErrors === null) {
                                            vErrors = [err423];
                                          } else {
                                            vErrors.push(err423);
                                          }
                                          errors++;
                                        }
                                      }
                                    } else {
                                      const err424 = {
                                        instancePath:
                                          instancePath +
                                          "/body/sections/" +
                                          i5 +
                                          "/blocks/" +
                                          i7 +
                                          "/label",
                                        schemaPath:
                                          "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/reference/properties/label/properties/marks",
                                        keyword: "properties",
                                        params: {
                                          error: "missing",
                                          missingProperty: "marks",
                                        },
                                        message: "must have property 'marks'",
                                      };
                                      if (vErrors === null) {
                                        vErrors = [err424];
                                      } else {
                                        vErrors.push(err424);
                                      }
                                      errors++;
                                    }
                                    for (const key58 in data155) {
                                      if (
                                        key58 !== "copy" &&
                                        key58 !== "marks"
                                      ) {
                                        const err425 = {
                                          instancePath:
                                            instancePath +
                                            "/body/sections/" +
                                            i5 +
                                            "/blocks/" +
                                            i7 +
                                            "/label/" +
                                            key58
                                              .replace(/~/g, "~0")
                                              .replace(/\//g, "~1"),
                                          schemaPath:
                                            "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/reference/properties/label",
                                          keyword: "properties",
                                          params: {
                                            error: "additional",
                                            additionalProperty: key58,
                                          },
                                          message:
                                            "must NOT have additional properties",
                                        };
                                        if (vErrors === null) {
                                          vErrors = [err425];
                                        } else {
                                          vErrors.push(err425);
                                        }
                                        errors++;
                                      }
                                    }
                                  }
                                  if (!valid272) {
                                    const err426 = {
                                      instancePath:
                                        instancePath +
                                        "/body/sections/" +
                                        i5 +
                                        "/blocks/" +
                                        i7 +
                                        "/label",
                                      schemaPath:
                                        "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/reference/properties/label/properties",
                                      keyword: "properties",
                                      params: {
                                        type: "object",
                                        nullable: false,
                                      },
                                      message: "must be object",
                                    };
                                    if (vErrors === null) {
                                      vErrors = [err426];
                                    } else {
                                      vErrors.push(err426);
                                    }
                                    errors++;
                                  }
                                } else {
                                  const err427 = {
                                    instancePath:
                                      instancePath +
                                      "/body/sections/" +
                                      i5 +
                                      "/blocks/" +
                                      i7,
                                    schemaPath:
                                      "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/reference/properties/label",
                                    keyword: "properties",
                                    params: {
                                      error: "missing",
                                      missingProperty: "label",
                                    },
                                    message: "must have property 'label'",
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err427];
                                  } else {
                                    vErrors.push(err427);
                                  }
                                  errors++;
                                }
                                if (data54.target !== undefined) {
                                  let data167 = data54.target;
                                  let valid294 = false;
                                  if (
                                    data167 &&
                                    typeof data167 == "object" &&
                                    !Array.isArray(data167)
                                  ) {
                                    const tag11 = data167.kind;
                                    if (tag11 === undefined) {
                                      const err428 = {
                                        instancePath:
                                          instancePath +
                                          "/body/sections/" +
                                          i5 +
                                          "/blocks/" +
                                          i7 +
                                          "/target",
                                        schemaPath:
                                          "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/reference/properties/target/discriminator",
                                        keyword: "discriminator",
                                        params: {
                                          error: "tag",
                                          tag: "kind",
                                          tagValue: tag11,
                                        },
                                        message: 'tag "kind" must be string',
                                      };
                                      if (vErrors === null) {
                                        vErrors = [err428];
                                      } else {
                                        vErrors.push(err428);
                                      }
                                      errors++;
                                    } else if (typeof tag11 == "string") {
                                      if (tag11 === "section") {
                                        const _errs204 = errors;
                                        let valid296 = false;
                                        valid296 = true;
                                        if (data167.sectionId !== undefined) {
                                          if (
                                            !(
                                              typeof data167.sectionId ==
                                              "string"
                                            )
                                          ) {
                                            const err429 = {
                                              instancePath:
                                                instancePath +
                                                "/body/sections/" +
                                                i5 +
                                                "/blocks/" +
                                                i7 +
                                                "/target/sectionId",
                                              schemaPath:
                                                "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/reference/properties/target/mapping/section/properties/sectionId/type",
                                              keyword: "type",
                                              params: {
                                                type: "string",
                                                nullable: false,
                                              },
                                              message: "must be string",
                                            };
                                            if (vErrors === null) {
                                              vErrors = [err429];
                                            } else {
                                              vErrors.push(err429);
                                            }
                                            errors++;
                                          }
                                        } else {
                                          const err430 = {
                                            instancePath:
                                              instancePath +
                                              "/body/sections/" +
                                              i5 +
                                              "/blocks/" +
                                              i7 +
                                              "/target",
                                            schemaPath:
                                              "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/reference/properties/target/mapping/section/properties/sectionId",
                                            keyword: "properties",
                                            params: {
                                              error: "missing",
                                              missingProperty: "sectionId",
                                            },
                                            message:
                                              "must have property 'sectionId'",
                                          };
                                          if (vErrors === null) {
                                            vErrors = [err430];
                                          } else {
                                            vErrors.push(err430);
                                          }
                                          errors++;
                                        }
                                        for (const key59 in data167) {
                                          if (
                                            key59 !== "kind" &&
                                            key59 !== "sectionId"
                                          ) {
                                            const err431 = {
                                              instancePath:
                                                instancePath +
                                                "/body/sections/" +
                                                i5 +
                                                "/blocks/" +
                                                i7 +
                                                "/target/" +
                                                key59
                                                  .replace(/~/g, "~0")
                                                  .replace(/\//g, "~1"),
                                              schemaPath:
                                                "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/reference/properties/target/mapping/section",
                                              keyword: "properties",
                                              params: {
                                                error: "additional",
                                                additionalProperty: key59,
                                              },
                                              message:
                                                "must NOT have additional properties",
                                            };
                                            if (vErrors === null) {
                                              vErrors = [err431];
                                            } else {
                                              vErrors.push(err431);
                                            }
                                            errors++;
                                          }
                                        }
                                        if (!valid296) {
                                          const err432 = {
                                            instancePath:
                                              instancePath +
                                              "/body/sections/" +
                                              i5 +
                                              "/blocks/" +
                                              i7 +
                                              "/target",
                                            schemaPath:
                                              "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/reference/properties/target/mapping/section/properties",
                                            keyword: "properties",
                                            params: {
                                              type: "object",
                                              nullable: false,
                                            },
                                            message: "must be object",
                                          };
                                          if (vErrors === null) {
                                            vErrors = [err432];
                                          } else {
                                            vErrors.push(err432);
                                          }
                                          errors++;
                                        }
                                        var valid295 = _errs204 === errors;
                                        valid294 = valid295;
                                      } else if (tag11 === "lessonTask") {
                                        const _errs206 = errors;
                                        let valid300 = false;
                                        valid300 = true;
                                        if (data167.lesson !== undefined) {
                                          let data169 = data167.lesson;
                                          if (!(
                                            typeof data169 == "number" &&
                                            isFinite(data169) &&
                                            !(data169 % 1) &&
                                            data169 >= 0 &&
                                            data169 <= 4294967295
                                          )) {
                                            const err433 = {
                                              instancePath:
                                                instancePath +
                                                "/body/sections/" +
                                                i5 +
                                                "/blocks/" +
                                                i7 +
                                                "/target/lesson",
                                              schemaPath:
                                                "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/reference/properties/target/mapping/lessonTask/properties/lesson/type",
                                              keyword: "type",
                                              params: {
                                                type: "uint32",
                                                nullable: false,
                                              },
                                              message: "must be uint32",
                                            };
                                            if (vErrors === null) {
                                              vErrors = [err433];
                                            } else {
                                              vErrors.push(err433);
                                            }
                                            errors++;
                                          }
                                        } else {
                                          const err434 = {
                                            instancePath:
                                              instancePath +
                                              "/body/sections/" +
                                              i5 +
                                              "/blocks/" +
                                              i7 +
                                              "/target",
                                            schemaPath:
                                              "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/reference/properties/target/mapping/lessonTask/properties/lesson",
                                            keyword: "properties",
                                            params: {
                                              error: "missing",
                                              missingProperty: "lesson",
                                            },
                                            message:
                                              "must have property 'lesson'",
                                          };
                                          if (vErrors === null) {
                                            vErrors = [err434];
                                          } else {
                                            vErrors.push(err434);
                                          }
                                          errors++;
                                        }
                                        if (data167.task !== undefined) {
                                          let data170 = data167.task;
                                          if (!(
                                            typeof data170 == "number" &&
                                            isFinite(data170) &&
                                            !(data170 % 1) &&
                                            data170 >= 0 &&
                                            data170 <= 4294967295
                                          )) {
                                            const err435 = {
                                              instancePath:
                                                instancePath +
                                                "/body/sections/" +
                                                i5 +
                                                "/blocks/" +
                                                i7 +
                                                "/target/task",
                                              schemaPath:
                                                "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/reference/properties/target/mapping/lessonTask/properties/task/type",
                                              keyword: "type",
                                              params: {
                                                type: "uint32",
                                                nullable: false,
                                              },
                                              message: "must be uint32",
                                            };
                                            if (vErrors === null) {
                                              vErrors = [err435];
                                            } else {
                                              vErrors.push(err435);
                                            }
                                            errors++;
                                          }
                                        } else {
                                          const err436 = {
                                            instancePath:
                                              instancePath +
                                              "/body/sections/" +
                                              i5 +
                                              "/blocks/" +
                                              i7 +
                                              "/target",
                                            schemaPath:
                                              "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/reference/properties/target/mapping/lessonTask/properties/task",
                                            keyword: "properties",
                                            params: {
                                              error: "missing",
                                              missingProperty: "task",
                                            },
                                            message:
                                              "must have property 'task'",
                                          };
                                          if (vErrors === null) {
                                            vErrors = [err436];
                                          } else {
                                            vErrors.push(err436);
                                          }
                                          errors++;
                                        }
                                        for (const key60 in data167) {
                                          if (
                                            key60 !== "kind" &&
                                            key60 !== "lesson" &&
                                            key60 !== "task"
                                          ) {
                                            const err437 = {
                                              instancePath:
                                                instancePath +
                                                "/body/sections/" +
                                                i5 +
                                                "/blocks/" +
                                                i7 +
                                                "/target/" +
                                                key60
                                                  .replace(/~/g, "~0")
                                                  .replace(/\//g, "~1"),
                                              schemaPath:
                                                "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/reference/properties/target/mapping/lessonTask",
                                              keyword: "properties",
                                              params: {
                                                error: "additional",
                                                additionalProperty: key60,
                                              },
                                              message:
                                                "must NOT have additional properties",
                                            };
                                            if (vErrors === null) {
                                              vErrors = [err437];
                                            } else {
                                              vErrors.push(err437);
                                            }
                                            errors++;
                                          }
                                        }
                                        if (!valid300) {
                                          const err438 = {
                                            instancePath:
                                              instancePath +
                                              "/body/sections/" +
                                              i5 +
                                              "/blocks/" +
                                              i7 +
                                              "/target",
                                            schemaPath:
                                              "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/reference/properties/target/mapping/lessonTask/properties",
                                            keyword: "properties",
                                            params: {
                                              type: "object",
                                              nullable: false,
                                            },
                                            message: "must be object",
                                          };
                                          if (vErrors === null) {
                                            vErrors = [err438];
                                          } else {
                                            vErrors.push(err438);
                                          }
                                          errors++;
                                        }
                                        var valid299 = _errs206 === errors;
                                        valid294 = valid299;
                                      } else {
                                        const err439 = {
                                          instancePath:
                                            instancePath +
                                            "/body/sections/" +
                                            i5 +
                                            "/blocks/" +
                                            i7 +
                                            "/target/kind",
                                          schemaPath:
                                            "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/reference/properties/target/mapping",
                                          keyword: "discriminator",
                                          params: {
                                            error: "mapping",
                                            tag: "kind",
                                            tagValue: tag11,
                                          },
                                          message:
                                            'value of tag "kind" must be in mapping',
                                        };
                                        if (vErrors === null) {
                                          vErrors = [err439];
                                        } else {
                                          vErrors.push(err439);
                                        }
                                        errors++;
                                      }
                                    } else {
                                      const err440 = {
                                        instancePath:
                                          instancePath +
                                          "/body/sections/" +
                                          i5 +
                                          "/blocks/" +
                                          i7 +
                                          "/target/kind",
                                        schemaPath:
                                          "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/reference/properties/target/discriminator",
                                        keyword: "discriminator",
                                        params: {
                                          error: "tag",
                                          tag: "kind",
                                          tagValue: tag11,
                                        },
                                        message: 'tag "kind" must be string',
                                      };
                                      if (vErrors === null) {
                                        vErrors = [err440];
                                      } else {
                                        vErrors.push(err440);
                                      }
                                      errors++;
                                    }
                                  } else if (!valid294) {
                                    const err441 = {
                                      instancePath:
                                        instancePath +
                                        "/body/sections/" +
                                        i5 +
                                        "/blocks/" +
                                        i7 +
                                        "/target",
                                      schemaPath:
                                        "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/reference/properties/target/discriminator",
                                      keyword: "discriminator",
                                      params: {
                                        type: "object",
                                        nullable: false,
                                      },
                                      message: "must be object",
                                    };
                                    if (vErrors === null) {
                                      vErrors = [err441];
                                    } else {
                                      vErrors.push(err441);
                                    }
                                    errors++;
                                  }
                                } else {
                                  const err442 = {
                                    instancePath:
                                      instancePath +
                                      "/body/sections/" +
                                      i5 +
                                      "/blocks/" +
                                      i7,
                                    schemaPath:
                                      "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/reference/properties/target",
                                    keyword: "properties",
                                    params: {
                                      error: "missing",
                                      missingProperty: "target",
                                    },
                                    message: "must have property 'target'",
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err442];
                                  } else {
                                    vErrors.push(err442);
                                  }
                                  errors++;
                                }
                                for (const key61 in data54) {
                                  if (
                                    key61 !== "kind" &&
                                    key61 !== "id" &&
                                    key61 !== "label" &&
                                    key61 !== "target"
                                  ) {
                                    const err443 = {
                                      instancePath:
                                        instancePath +
                                        "/body/sections/" +
                                        i5 +
                                        "/blocks/" +
                                        i7 +
                                        "/" +
                                        key61
                                          .replace(/~/g, "~0")
                                          .replace(/\//g, "~1"),
                                      schemaPath:
                                        "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/reference",
                                      keyword: "properties",
                                      params: {
                                        error: "additional",
                                        additionalProperty: key61,
                                      },
                                      message:
                                        "must NOT have additional properties",
                                    };
                                    if (vErrors === null) {
                                      vErrors = [err443];
                                    } else {
                                      vErrors.push(err443);
                                    }
                                    errors++;
                                  }
                                }
                                if (!valid270) {
                                  const err444 = {
                                    instancePath:
                                      instancePath +
                                      "/body/sections/" +
                                      i5 +
                                      "/blocks/" +
                                      i7,
                                    schemaPath:
                                      "/properties/body/properties/sections/elements/properties/blocks/elements/mapping/reference/properties",
                                    keyword: "properties",
                                    params: { type: "object", nullable: false },
                                    message: "must be object",
                                  };
                                  if (vErrors === null) {
                                    vErrors = [err444];
                                  } else {
                                    vErrors.push(err444);
                                  }
                                  errors++;
                                }
                                var valid269 = _errs186 === errors;
                                valid77 = valid269;
                              } else {
                                const err445 = {
                                  instancePath:
                                    instancePath +
                                    "/body/sections/" +
                                    i5 +
                                    "/blocks/" +
                                    i7 +
                                    "/kind",
                                  schemaPath:
                                    "/properties/body/properties/sections/elements/properties/blocks/elements/mapping",
                                  keyword: "discriminator",
                                  params: {
                                    error: "mapping",
                                    tag: "kind",
                                    tagValue: tag2,
                                  },
                                  message:
                                    'value of tag "kind" must be in mapping',
                                };
                                if (vErrors === null) {
                                  vErrors = [err445];
                                } else {
                                  vErrors.push(err445);
                                }
                                errors++;
                              }
                            } else {
                              const err446 = {
                                instancePath:
                                  instancePath +
                                  "/body/sections/" +
                                  i5 +
                                  "/blocks/" +
                                  i7 +
                                  "/kind",
                                schemaPath:
                                  "/properties/body/properties/sections/elements/properties/blocks/elements/discriminator",
                                keyword: "discriminator",
                                params: {
                                  error: "tag",
                                  tag: "kind",
                                  tagValue: tag2,
                                },
                                message: 'tag "kind" must be string',
                              };
                              if (vErrors === null) {
                                vErrors = [err446];
                              } else {
                                vErrors.push(err446);
                              }
                              errors++;
                            }
                          } else if (!valid77) {
                            const err447 = {
                              instancePath:
                                instancePath +
                                "/body/sections/" +
                                i5 +
                                "/blocks/" +
                                i7,
                              schemaPath:
                                "/properties/body/properties/sections/elements/properties/blocks/elements/discriminator",
                              keyword: "discriminator",
                              params: { type: "object", nullable: false },
                              message: "must be object",
                            };
                            if (vErrors === null) {
                              vErrors = [err447];
                            } else {
                              vErrors.push(err447);
                            }
                            errors++;
                          }
                          var valid75 = _errs61 === errors;
                          if (!valid75) {
                            valid76 = false;
                          }
                        }
                        valid74 = valid76;
                      } else {
                        const err448 = {
                          instancePath:
                            instancePath + "/body/sections/" + i5 + "/blocks",
                          schemaPath:
                            "/properties/body/properties/sections/elements/properties/blocks/elements",
                          keyword: "elements",
                          params: { type: "array", nullable: false },
                          message: "must be array",
                        };
                        if (vErrors === null) {
                          vErrors = [err448];
                        } else {
                          vErrors.push(err448);
                        }
                        errors++;
                      }
                    }
                  } else {
                    const err449 = {
                      instancePath: instancePath + "/body/sections/" + i5,
                      schemaPath:
                        "/properties/body/properties/sections/elements/properties/blocks",
                      keyword: "properties",
                      params: { error: "missing", missingProperty: "blocks" },
                      message: "must have property 'blocks'",
                    };
                    if (vErrors === null) {
                      vErrors = [err449];
                    } else {
                      vErrors.push(err449);
                    }
                    errors++;
                  }
                  for (const key62 in data39) {
                    if (
                      key62 !== "id" &&
                      key62 !== "title" &&
                      key62 !== "blocks"
                    ) {
                      const err450 = {
                        instancePath:
                          instancePath +
                          "/body/sections/" +
                          i5 +
                          "/" +
                          key62.replace(/~/g, "~0").replace(/\//g, "~1"),
                        schemaPath:
                          "/properties/body/properties/sections/elements",
                        keyword: "properties",
                        params: {
                          error: "additional",
                          additionalProperty: key62,
                        },
                        message: "must NOT have additional properties",
                      };
                      if (vErrors === null) {
                        vErrors = [err450];
                      } else {
                        vErrors.push(err450);
                      }
                      errors++;
                    }
                  }
                }
                if (!valid50) {
                  const err451 = {
                    instancePath: instancePath + "/body/sections/" + i5,
                    schemaPath:
                      "/properties/body/properties/sections/elements/properties",
                    keyword: "properties",
                    params: { type: "object", nullable: false },
                    message: "must be object",
                  };
                  if (vErrors === null) {
                    vErrors = [err451];
                  } else {
                    vErrors.push(err451);
                  }
                  errors++;
                }
                var valid48 = _errs43 === errors;
                if (!valid48) {
                  valid49 = false;
                }
              }
              valid47 = valid49;
            } else {
              const err452 = {
                instancePath: instancePath + "/body/sections",
                schemaPath: "/properties/body/properties/sections/elements",
                keyword: "elements",
                params: { type: "array", nullable: false },
                message: "must be array",
              };
              if (vErrors === null) {
                vErrors = [err452];
              } else {
                vErrors.push(err452);
              }
              errors++;
            }
          }
        } else {
          const err453 = {
            instancePath: instancePath + "/body",
            schemaPath: "/properties/body/properties/sections",
            keyword: "properties",
            params: { error: "missing", missingProperty: "sections" },
            message: "must have property 'sections'",
          };
          if (vErrors === null) {
            vErrors = [err453];
          } else {
            vErrors.push(err453);
          }
          errors++;
        }
        if (data2.assets !== undefined) {
          let data171 = data2.assets;
          let valid305 = false;
          if (!valid305) {
            if (Array.isArray(data171)) {
              let valid307 = true;
              const len21 = data171.length;
              for (let i21 = 0; i21 < len21; i21++) {
                let data172 = data171[i21];
                const _errs210 = errors;
                let valid308 = false;
                if (
                  data172 &&
                  typeof data172 == "object" &&
                  !Array.isArray(data172)
                ) {
                  valid308 = true;
                  if (data172.id !== undefined) {
                    if (!(typeof data172.id == "string")) {
                      const err454 = {
                        instancePath:
                          instancePath + "/body/assets/" + i21 + "/id",
                        schemaPath:
                          "/properties/body/properties/assets/elements/properties/id/type",
                        keyword: "type",
                        params: { type: "string", nullable: false },
                        message: "must be string",
                      };
                      if (vErrors === null) {
                        vErrors = [err454];
                      } else {
                        vErrors.push(err454);
                      }
                      errors++;
                    }
                  } else {
                    const err455 = {
                      instancePath: instancePath + "/body/assets/" + i21,
                      schemaPath:
                        "/properties/body/properties/assets/elements/properties/id",
                      keyword: "properties",
                      params: { error: "missing", missingProperty: "id" },
                      message: "must have property 'id'",
                    };
                    if (vErrors === null) {
                      vErrors = [err455];
                    } else {
                      vErrors.push(err455);
                    }
                    errors++;
                  }
                  if (data172.path !== undefined) {
                    if (!(typeof data172.path == "string")) {
                      const err456 = {
                        instancePath:
                          instancePath + "/body/assets/" + i21 + "/path",
                        schemaPath:
                          "/properties/body/properties/assets/elements/properties/path/type",
                        keyword: "type",
                        params: { type: "string", nullable: false },
                        message: "must be string",
                      };
                      if (vErrors === null) {
                        vErrors = [err456];
                      } else {
                        vErrors.push(err456);
                      }
                      errors++;
                    }
                  } else {
                    const err457 = {
                      instancePath: instancePath + "/body/assets/" + i21,
                      schemaPath:
                        "/properties/body/properties/assets/elements/properties/path",
                      keyword: "properties",
                      params: { error: "missing", missingProperty: "path" },
                      message: "must have property 'path'",
                    };
                    if (vErrors === null) {
                      vErrors = [err457];
                    } else {
                      vErrors.push(err457);
                    }
                    errors++;
                  }
                  if (data172.sha256 !== undefined) {
                    if (!(typeof data172.sha256 == "string")) {
                      const err458 = {
                        instancePath:
                          instancePath + "/body/assets/" + i21 + "/sha256",
                        schemaPath:
                          "/properties/body/properties/assets/elements/properties/sha256/type",
                        keyword: "type",
                        params: { type: "string", nullable: false },
                        message: "must be string",
                      };
                      if (vErrors === null) {
                        vErrors = [err458];
                      } else {
                        vErrors.push(err458);
                      }
                      errors++;
                    }
                  } else {
                    const err459 = {
                      instancePath: instancePath + "/body/assets/" + i21,
                      schemaPath:
                        "/properties/body/properties/assets/elements/properties/sha256",
                      keyword: "properties",
                      params: { error: "missing", missingProperty: "sha256" },
                      message: "must have property 'sha256'",
                    };
                    if (vErrors === null) {
                      vErrors = [err459];
                    } else {
                      vErrors.push(err459);
                    }
                    errors++;
                  }
                  if (data172.byteLength !== undefined) {
                    let data176 = data172.byteLength;
                    if (!(
                      typeof data176 == "number" &&
                      isFinite(data176) &&
                      !(data176 % 1) &&
                      data176 >= 0 &&
                      data176 <= 4294967295
                    )) {
                      const err460 = {
                        instancePath:
                          instancePath + "/body/assets/" + i21 + "/byteLength",
                        schemaPath:
                          "/properties/body/properties/assets/elements/properties/byteLength/type",
                        keyword: "type",
                        params: { type: "uint32", nullable: false },
                        message: "must be uint32",
                      };
                      if (vErrors === null) {
                        vErrors = [err460];
                      } else {
                        vErrors.push(err460);
                      }
                      errors++;
                    }
                  } else {
                    const err461 = {
                      instancePath: instancePath + "/body/assets/" + i21,
                      schemaPath:
                        "/properties/body/properties/assets/elements/properties/byteLength",
                      keyword: "properties",
                      params: {
                        error: "missing",
                        missingProperty: "byteLength",
                      },
                      message: "must have property 'byteLength'",
                    };
                    if (vErrors === null) {
                      vErrors = [err461];
                    } else {
                      vErrors.push(err461);
                    }
                    errors++;
                  }
                  if (data172.mediaType !== undefined) {
                    let data177 = data172.mediaType;
                    if (!(
                      typeof data177 == "string" && data177 === "image/svg+xml"
                    )) {
                      const err462 = {
                        instancePath:
                          instancePath + "/body/assets/" + i21 + "/mediaType",
                        schemaPath:
                          "/properties/body/properties/assets/elements/properties/mediaType/enum",
                        keyword: "enum",
                        params: {
                          allowedValues:
                            schema30.properties.body.properties.assets.elements
                              .properties.mediaType.enum,
                        },
                        message: "must be equal to one of the allowed values",
                      };
                      if (vErrors === null) {
                        vErrors = [err462];
                      } else {
                        vErrors.push(err462);
                      }
                      errors++;
                    }
                  } else {
                    const err463 = {
                      instancePath: instancePath + "/body/assets/" + i21,
                      schemaPath:
                        "/properties/body/properties/assets/elements/properties/mediaType",
                      keyword: "properties",
                      params: {
                        error: "missing",
                        missingProperty: "mediaType",
                      },
                      message: "must have property 'mediaType'",
                    };
                    if (vErrors === null) {
                      vErrors = [err463];
                    } else {
                      vErrors.push(err463);
                    }
                    errors++;
                  }
                  for (const key63 in data172) {
                    if (
                      key63 !== "id" &&
                      key63 !== "path" &&
                      key63 !== "sha256" &&
                      key63 !== "byteLength" &&
                      key63 !== "mediaType"
                    ) {
                      const err464 = {
                        instancePath:
                          instancePath +
                          "/body/assets/" +
                          i21 +
                          "/" +
                          key63.replace(/~/g, "~0").replace(/\//g, "~1"),
                        schemaPath:
                          "/properties/body/properties/assets/elements",
                        keyword: "properties",
                        params: {
                          error: "additional",
                          additionalProperty: key63,
                        },
                        message: "must NOT have additional properties",
                      };
                      if (vErrors === null) {
                        vErrors = [err464];
                      } else {
                        vErrors.push(err464);
                      }
                      errors++;
                    }
                  }
                }
                if (!valid308) {
                  const err465 = {
                    instancePath: instancePath + "/body/assets/" + i21,
                    schemaPath:
                      "/properties/body/properties/assets/elements/properties",
                    keyword: "properties",
                    params: { type: "object", nullable: false },
                    message: "must be object",
                  };
                  if (vErrors === null) {
                    vErrors = [err465];
                  } else {
                    vErrors.push(err465);
                  }
                  errors++;
                }
                var valid306 = _errs210 === errors;
                if (!valid306) {
                  valid307 = false;
                }
              }
              valid305 = valid307;
            } else {
              const err466 = {
                instancePath: instancePath + "/body/assets",
                schemaPath: "/properties/body/properties/assets/elements",
                keyword: "elements",
                params: { type: "array", nullable: false },
                message: "must be array",
              };
              if (vErrors === null) {
                vErrors = [err466];
              } else {
                vErrors.push(err466);
              }
              errors++;
            }
          }
        } else {
          const err467 = {
            instancePath: instancePath + "/body",
            schemaPath: "/properties/body/properties/assets",
            keyword: "properties",
            params: { error: "missing", missingProperty: "assets" },
            message: "must have property 'assets'",
          };
          if (vErrors === null) {
            vErrors = [err467];
          } else {
            vErrors.push(err467);
          }
          errors++;
        }
        for (const key64 in data2) {
          if (
            key64 !== "documentId" &&
            key64 !== "title" &&
            key64 !== "reviewHash" &&
            key64 !== "provenance" &&
            key64 !== "sections" &&
            key64 !== "assets"
          ) {
            const err468 = {
              instancePath:
                instancePath +
                "/body/" +
                key64.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/properties/body",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key64 },
              message: "must NOT have additional properties",
            };
            if (vErrors === null) {
              vErrors = [err468];
            } else {
              vErrors.push(err468);
            }
            errors++;
          }
        }
      }
      if (!valid2) {
        const err469 = {
          instancePath: instancePath + "/body",
          schemaPath: "/properties/body/properties",
          keyword: "properties",
          params: { type: "object", nullable: false },
          message: "must be object",
        };
        if (vErrors === null) {
          vErrors = [err469];
        } else {
          vErrors.push(err469);
        }
        errors++;
      }
    } else {
      const err470 = {
        instancePath,
        schemaPath: "/properties/body",
        keyword: "properties",
        params: { error: "missing", missingProperty: "body" },
        message: "must have property 'body'",
      };
      if (vErrors === null) {
        vErrors = [err470];
      } else {
        vErrors.push(err470);
      }
      errors++;
    }
    if (data.assets !== undefined) {
      let data178 = data.assets;
      let valid312 = false;
      if (!valid312) {
        if (Array.isArray(data178)) {
          let valid314 = true;
          const len22 = data178.length;
          for (let i22 = 0; i22 < len22; i22++) {
            let data179 = data178[i22];
            const _errs217 = errors;
            let valid315 = false;
            if (
              data179 &&
              typeof data179 == "object" &&
              !Array.isArray(data179)
            ) {
              valid315 = true;
              if (data179.path !== undefined) {
                if (!(typeof data179.path == "string")) {
                  const err471 = {
                    instancePath: instancePath + "/assets/" + i22 + "/path",
                    schemaPath:
                      "/properties/assets/elements/properties/path/type",
                    keyword: "type",
                    params: { type: "string", nullable: false },
                    message: "must be string",
                  };
                  if (vErrors === null) {
                    vErrors = [err471];
                  } else {
                    vErrors.push(err471);
                  }
                  errors++;
                }
              } else {
                const err472 = {
                  instancePath: instancePath + "/assets/" + i22,
                  schemaPath: "/properties/assets/elements/properties/path",
                  keyword: "properties",
                  params: { error: "missing", missingProperty: "path" },
                  message: "must have property 'path'",
                };
                if (vErrors === null) {
                  vErrors = [err472];
                } else {
                  vErrors.push(err472);
                }
                errors++;
              }
              if (data179.svg !== undefined) {
                if (!(typeof data179.svg == "string")) {
                  const err473 = {
                    instancePath: instancePath + "/assets/" + i22 + "/svg",
                    schemaPath:
                      "/properties/assets/elements/properties/svg/type",
                    keyword: "type",
                    params: { type: "string", nullable: false },
                    message: "must be string",
                  };
                  if (vErrors === null) {
                    vErrors = [err473];
                  } else {
                    vErrors.push(err473);
                  }
                  errors++;
                }
              } else {
                const err474 = {
                  instancePath: instancePath + "/assets/" + i22,
                  schemaPath: "/properties/assets/elements/properties/svg",
                  keyword: "properties",
                  params: { error: "missing", missingProperty: "svg" },
                  message: "must have property 'svg'",
                };
                if (vErrors === null) {
                  vErrors = [err474];
                } else {
                  vErrors.push(err474);
                }
                errors++;
              }
              for (const key65 in data179) {
                if (key65 !== "path" && key65 !== "svg") {
                  const err475 = {
                    instancePath:
                      instancePath +
                      "/assets/" +
                      i22 +
                      "/" +
                      key65.replace(/~/g, "~0").replace(/\//g, "~1"),
                    schemaPath: "/properties/assets/elements",
                    keyword: "properties",
                    params: { error: "additional", additionalProperty: key65 },
                    message: "must NOT have additional properties",
                  };
                  if (vErrors === null) {
                    vErrors = [err475];
                  } else {
                    vErrors.push(err475);
                  }
                  errors++;
                }
              }
            }
            if (!valid315) {
              const err476 = {
                instancePath: instancePath + "/assets/" + i22,
                schemaPath: "/properties/assets/elements/properties",
                keyword: "properties",
                params: { type: "object", nullable: false },
                message: "must be object",
              };
              if (vErrors === null) {
                vErrors = [err476];
              } else {
                vErrors.push(err476);
              }
              errors++;
            }
            var valid313 = _errs217 === errors;
            if (!valid313) {
              valid314 = false;
            }
          }
          valid312 = valid314;
        } else {
          const err477 = {
            instancePath: instancePath + "/assets",
            schemaPath: "/properties/assets/elements",
            keyword: "elements",
            params: { type: "array", nullable: false },
            message: "must be array",
          };
          if (vErrors === null) {
            vErrors = [err477];
          } else {
            vErrors.push(err477);
          }
          errors++;
        }
      }
    } else {
      const err478 = {
        instancePath,
        schemaPath: "/properties/assets",
        keyword: "properties",
        params: { error: "missing", missingProperty: "assets" },
        message: "must have property 'assets'",
      };
      if (vErrors === null) {
        vErrors = [err478];
      } else {
        vErrors.push(err478);
      }
      errors++;
    }
    for (const key66 in data) {
      if (
        key66 !== "formatVersion" &&
        key66 !== "preparationHash" &&
        key66 !== "body" &&
        key66 !== "assets"
      ) {
        const err479 = {
          instancePath:
            instancePath + "/" + key66.replace(/~/g, "~0").replace(/\//g, "~1"),
          schemaPath: "",
          keyword: "properties",
          params: { error: "additional", additionalProperty: key66 },
          message: "must NOT have additional properties",
        };
        if (vErrors === null) {
          vErrors = [err479];
        } else {
          vErrors.push(err479);
        }
        errors++;
      }
    }
  }
  if (!valid0) {
    const err480 = {
      instancePath,
      schemaPath: "/properties",
      keyword: "properties",
      params: { type: "object", nullable: false },
      message: "must be object",
    };
    if (vErrors === null) {
      vErrors = [err480];
    } else {
      vErrors.push(err480);
    }
    errors++;
  }
  validate58.errors = vErrors;
  return errors === 0;
}
