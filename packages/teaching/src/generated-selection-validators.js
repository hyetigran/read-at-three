"use strict";
export const validateSelectedOwnerWitness = validate57;
const schema29 = {
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
    if (data.installationId !== undefined) {
      if (!(typeof data.installationId == "string")) {
        const err0 = {
          instancePath: instancePath + "/installationId",
          schemaPath: "/properties/installationId/type",
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
        instancePath,
        schemaPath: "/properties/installationId",
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
    if (data.revision !== undefined) {
      if (!(typeof data.revision == "string")) {
        const err2 = {
          instancePath: instancePath + "/revision",
          schemaPath: "/properties/revision/type",
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
        schemaPath: "/properties/revision",
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
    if (data.owner !== undefined) {
      let data2 = data.owner;
      let valid2 = false;
      if (data2 && typeof data2 == "object" && !Array.isArray(data2)) {
        valid2 = true;
        if (data2.profileId !== undefined) {
          if (!(typeof data2.profileId == "string")) {
            const err4 = {
              instancePath: instancePath + "/owner/profileId",
              schemaPath: "/properties/owner/properties/profileId/type",
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
            instancePath: instancePath + "/owner",
            schemaPath: "/properties/owner/properties/profileId",
            keyword: "properties",
            params: { error: "missing", missingProperty: "profileId" },
            message: "must have property 'profileId'",
          };
          if (vErrors === null) {
            vErrors = [err5];
          } else {
            vErrors.push(err5);
          }
          errors++;
        }
        if (data2.generation !== undefined) {
          if (!(typeof data2.generation == "string")) {
            const err6 = {
              instancePath: instancePath + "/owner/generation",
              schemaPath: "/properties/owner/properties/generation/type",
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
            instancePath: instancePath + "/owner",
            schemaPath: "/properties/owner/properties/generation",
            keyword: "properties",
            params: { error: "missing", missingProperty: "generation" },
            message: "must have property 'generation'",
          };
          if (vErrors === null) {
            vErrors = [err7];
          } else {
            vErrors.push(err7);
          }
          errors++;
        }
        for (const key0 in data2) {
          if (key0 !== "profileId" && key0 !== "generation") {
            const err8 = {
              instancePath:
                instancePath +
                "/owner/" +
                key0.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/properties/owner",
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
          instancePath: instancePath + "/owner",
          schemaPath: "/properties/owner/properties",
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
        schemaPath: "/properties/owner",
        keyword: "properties",
        params: { error: "missing", missingProperty: "owner" },
        message: "must have property 'owner'",
      };
      if (vErrors === null) {
        vErrors = [err10];
      } else {
        vErrors.push(err10);
      }
      errors++;
    }
    for (const key1 in data) {
      if (
        key1 !== "installationId" &&
        key1 !== "revision" &&
        key1 !== "owner"
      ) {
        const err11 = {
          instancePath:
            instancePath + "/" + key1.replace(/~/g, "~0").replace(/\//g, "~1"),
          schemaPath: "",
          keyword: "properties",
          params: { error: "additional", additionalProperty: key1 },
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
  }
  if (!valid0) {
    const err12 = {
      instancePath,
      schemaPath: "/properties",
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
  validate57.errors = vErrors;
  return errors === 0;
}
export const validateSelectedOperation = validate58;
const schema30 = {
  discriminator: "kind",
  mapping: {
    teaching: {
      properties: {
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
        command: {},
      },
    },
    ink: {
      properties: {
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
        command: {},
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
      if (tag0 === "teaching") {
        const _errs0 = errors;
        let valid2 = false;
        valid2 = true;
        if (data.selection !== undefined) {
          let data0 = data.selection;
          let valid4 = false;
          if (data0 && typeof data0 == "object" && !Array.isArray(data0)) {
            valid4 = true;
            if (data0.installationId !== undefined) {
              if (!(typeof data0.installationId == "string")) {
                const err1 = {
                  instancePath: instancePath + "/selection/installationId",
                  schemaPath:
                    "/mapping/teaching/properties/selection/properties/installationId/type",
                  keyword: "type",
                  params: { type: "string", nullable: false },
                  message: "must be string",
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
                instancePath: instancePath + "/selection",
                schemaPath:
                  "/mapping/teaching/properties/selection/properties/installationId",
                keyword: "properties",
                params: { error: "missing", missingProperty: "installationId" },
                message: "must have property 'installationId'",
              };
              if (vErrors === null) {
                vErrors = [err2];
              } else {
                vErrors.push(err2);
              }
              errors++;
            }
            if (data0.revision !== undefined) {
              if (!(typeof data0.revision == "string")) {
                const err3 = {
                  instancePath: instancePath + "/selection/revision",
                  schemaPath:
                    "/mapping/teaching/properties/selection/properties/revision/type",
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
                instancePath: instancePath + "/selection",
                schemaPath:
                  "/mapping/teaching/properties/selection/properties/revision",
                keyword: "properties",
                params: { error: "missing", missingProperty: "revision" },
                message: "must have property 'revision'",
              };
              if (vErrors === null) {
                vErrors = [err4];
              } else {
                vErrors.push(err4);
              }
              errors++;
            }
            if (data0.owner !== undefined) {
              let data3 = data0.owner;
              let valid6 = false;
              if (data3 && typeof data3 == "object" && !Array.isArray(data3)) {
                valid6 = true;
                if (data3.profileId !== undefined) {
                  if (!(typeof data3.profileId == "string")) {
                    const err5 = {
                      instancePath: instancePath + "/selection/owner/profileId",
                      schemaPath:
                        "/mapping/teaching/properties/selection/properties/owner/properties/profileId/type",
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
                    instancePath: instancePath + "/selection/owner",
                    schemaPath:
                      "/mapping/teaching/properties/selection/properties/owner/properties/profileId",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "profileId" },
                    message: "must have property 'profileId'",
                  };
                  if (vErrors === null) {
                    vErrors = [err6];
                  } else {
                    vErrors.push(err6);
                  }
                  errors++;
                }
                if (data3.generation !== undefined) {
                  if (!(typeof data3.generation == "string")) {
                    const err7 = {
                      instancePath:
                        instancePath + "/selection/owner/generation",
                      schemaPath:
                        "/mapping/teaching/properties/selection/properties/owner/properties/generation/type",
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
                    instancePath: instancePath + "/selection/owner",
                    schemaPath:
                      "/mapping/teaching/properties/selection/properties/owner/properties/generation",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "generation" },
                    message: "must have property 'generation'",
                  };
                  if (vErrors === null) {
                    vErrors = [err8];
                  } else {
                    vErrors.push(err8);
                  }
                  errors++;
                }
                for (const key0 in data3) {
                  if (key0 !== "profileId" && key0 !== "generation") {
                    const err9 = {
                      instancePath:
                        instancePath +
                        "/selection/owner/" +
                        key0.replace(/~/g, "~0").replace(/\//g, "~1"),
                      schemaPath:
                        "/mapping/teaching/properties/selection/properties/owner",
                      keyword: "properties",
                      params: { error: "additional", additionalProperty: key0 },
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
              }
              if (!valid6) {
                const err10 = {
                  instancePath: instancePath + "/selection/owner",
                  schemaPath:
                    "/mapping/teaching/properties/selection/properties/owner/properties",
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
            } else {
              const err11 = {
                instancePath: instancePath + "/selection",
                schemaPath:
                  "/mapping/teaching/properties/selection/properties/owner",
                keyword: "properties",
                params: { error: "missing", missingProperty: "owner" },
                message: "must have property 'owner'",
              };
              if (vErrors === null) {
                vErrors = [err11];
              } else {
                vErrors.push(err11);
              }
              errors++;
            }
            for (const key1 in data0) {
              if (
                key1 !== "installationId" &&
                key1 !== "revision" &&
                key1 !== "owner"
              ) {
                const err12 = {
                  instancePath:
                    instancePath +
                    "/selection/" +
                    key1.replace(/~/g, "~0").replace(/\//g, "~1"),
                  schemaPath: "/mapping/teaching/properties/selection",
                  keyword: "properties",
                  params: { error: "additional", additionalProperty: key1 },
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
          if (!valid4) {
            const err13 = {
              instancePath: instancePath + "/selection",
              schemaPath: "/mapping/teaching/properties/selection/properties",
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
            schemaPath: "/mapping/teaching/properties/selection",
            keyword: "properties",
            params: { error: "missing", missingProperty: "selection" },
            message: "must have property 'selection'",
          };
          if (vErrors === null) {
            vErrors = [err14];
          } else {
            vErrors.push(err14);
          }
          errors++;
        }
        for (const key2 in data) {
          if (key2 !== "kind" && key2 !== "selection" && key2 !== "command") {
            const err15 = {
              instancePath:
                instancePath +
                "/" +
                key2.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/teaching",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key2 },
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
        if (!valid2) {
          const err16 = {
            instancePath,
            schemaPath: "/mapping/teaching/properties",
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
        var valid1 = _errs0 === errors;
        valid0 = valid1;
      } else if (tag0 === "ink") {
        const _errs7 = errors;
        let valid12 = false;
        valid12 = true;
        if (data.selection !== undefined) {
          let data6 = data.selection;
          let valid14 = false;
          if (data6 && typeof data6 == "object" && !Array.isArray(data6)) {
            valid14 = true;
            if (data6.installationId !== undefined) {
              if (!(typeof data6.installationId == "string")) {
                const err17 = {
                  instancePath: instancePath + "/selection/installationId",
                  schemaPath:
                    "/mapping/ink/properties/selection/properties/installationId/type",
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
                schemaPath:
                  "/mapping/ink/properties/selection/properties/installationId",
                keyword: "properties",
                params: { error: "missing", missingProperty: "installationId" },
                message: "must have property 'installationId'",
              };
              if (vErrors === null) {
                vErrors = [err18];
              } else {
                vErrors.push(err18);
              }
              errors++;
            }
            if (data6.revision !== undefined) {
              if (!(typeof data6.revision == "string")) {
                const err19 = {
                  instancePath: instancePath + "/selection/revision",
                  schemaPath:
                    "/mapping/ink/properties/selection/properties/revision/type",
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
                instancePath: instancePath + "/selection",
                schemaPath:
                  "/mapping/ink/properties/selection/properties/revision",
                keyword: "properties",
                params: { error: "missing", missingProperty: "revision" },
                message: "must have property 'revision'",
              };
              if (vErrors === null) {
                vErrors = [err20];
              } else {
                vErrors.push(err20);
              }
              errors++;
            }
            if (data6.owner !== undefined) {
              let data9 = data6.owner;
              let valid16 = false;
              if (data9 && typeof data9 == "object" && !Array.isArray(data9)) {
                valid16 = true;
                if (data9.profileId !== undefined) {
                  if (!(typeof data9.profileId == "string")) {
                    const err21 = {
                      instancePath: instancePath + "/selection/owner/profileId",
                      schemaPath:
                        "/mapping/ink/properties/selection/properties/owner/properties/profileId/type",
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
                      "/mapping/ink/properties/selection/properties/owner/properties/profileId",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "profileId" },
                    message: "must have property 'profileId'",
                  };
                  if (vErrors === null) {
                    vErrors = [err22];
                  } else {
                    vErrors.push(err22);
                  }
                  errors++;
                }
                if (data9.generation !== undefined) {
                  if (!(typeof data9.generation == "string")) {
                    const err23 = {
                      instancePath:
                        instancePath + "/selection/owner/generation",
                      schemaPath:
                        "/mapping/ink/properties/selection/properties/owner/properties/generation/type",
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
                    instancePath: instancePath + "/selection/owner",
                    schemaPath:
                      "/mapping/ink/properties/selection/properties/owner/properties/generation",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "generation" },
                    message: "must have property 'generation'",
                  };
                  if (vErrors === null) {
                    vErrors = [err24];
                  } else {
                    vErrors.push(err24);
                  }
                  errors++;
                }
                for (const key3 in data9) {
                  if (key3 !== "profileId" && key3 !== "generation") {
                    const err25 = {
                      instancePath:
                        instancePath +
                        "/selection/owner/" +
                        key3.replace(/~/g, "~0").replace(/\//g, "~1"),
                      schemaPath:
                        "/mapping/ink/properties/selection/properties/owner",
                      keyword: "properties",
                      params: { error: "additional", additionalProperty: key3 },
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
              if (!valid16) {
                const err26 = {
                  instancePath: instancePath + "/selection/owner",
                  schemaPath:
                    "/mapping/ink/properties/selection/properties/owner/properties",
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
                instancePath: instancePath + "/selection",
                schemaPath:
                  "/mapping/ink/properties/selection/properties/owner",
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
            for (const key4 in data6) {
              if (
                key4 !== "installationId" &&
                key4 !== "revision" &&
                key4 !== "owner"
              ) {
                const err28 = {
                  instancePath:
                    instancePath +
                    "/selection/" +
                    key4.replace(/~/g, "~0").replace(/\//g, "~1"),
                  schemaPath: "/mapping/ink/properties/selection",
                  keyword: "properties",
                  params: { error: "additional", additionalProperty: key4 },
                  message: "must NOT have additional properties",
                };
                if (vErrors === null) {
                  vErrors = [err28];
                } else {
                  vErrors.push(err28);
                }
                errors++;
              }
            }
          }
          if (!valid14) {
            const err29 = {
              instancePath: instancePath + "/selection",
              schemaPath: "/mapping/ink/properties/selection/properties",
              keyword: "properties",
              params: { type: "object", nullable: false },
              message: "must be object",
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
            schemaPath: "/mapping/ink/properties/selection",
            keyword: "properties",
            params: { error: "missing", missingProperty: "selection" },
            message: "must have property 'selection'",
          };
          if (vErrors === null) {
            vErrors = [err30];
          } else {
            vErrors.push(err30);
          }
          errors++;
        }
        for (const key5 in data) {
          if (key5 !== "kind" && key5 !== "selection" && key5 !== "command") {
            const err31 = {
              instancePath:
                instancePath +
                "/" +
                key5.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/ink",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key5 },
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
        if (!valid12) {
          const err32 = {
            instancePath,
            schemaPath: "/mapping/ink/properties",
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
        var valid11 = _errs7 === errors;
        valid0 = valid11;
      } else {
        const err33 = {
          instancePath: instancePath + "/kind",
          schemaPath: "/mapping",
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
        instancePath: instancePath + "/kind",
        schemaPath: "/discriminator",
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
  } else if (!valid0) {
    const err35 = {
      instancePath,
      schemaPath: "/discriminator",
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
  validate58.errors = vErrors;
  return errors === 0;
}
export const validateSelectedReadTarget = validate59;
const schema31 = {
  properties: {
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
    target: {
      discriminator: "kind",
      mapping: {
        cursor: { properties: {} },
        accepted: { properties: { receipt: {} } },
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
    if (data.selection !== undefined) {
      let data0 = data.selection;
      let valid2 = false;
      if (data0 && typeof data0 == "object" && !Array.isArray(data0)) {
        valid2 = true;
        if (data0.installationId !== undefined) {
          if (!(typeof data0.installationId == "string")) {
            const err0 = {
              instancePath: instancePath + "/selection/installationId",
              schemaPath:
                "/properties/selection/properties/installationId/type",
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
            instancePath: instancePath + "/selection",
            schemaPath: "/properties/selection/properties/installationId",
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
              instancePath: instancePath + "/selection/revision",
              schemaPath: "/properties/selection/properties/revision/type",
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
            instancePath: instancePath + "/selection",
            schemaPath: "/properties/selection/properties/revision",
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
        if (data0.owner !== undefined) {
          let data3 = data0.owner;
          let valid4 = false;
          if (data3 && typeof data3 == "object" && !Array.isArray(data3)) {
            valid4 = true;
            if (data3.profileId !== undefined) {
              if (!(typeof data3.profileId == "string")) {
                const err4 = {
                  instancePath: instancePath + "/selection/owner/profileId",
                  schemaPath:
                    "/properties/selection/properties/owner/properties/profileId/type",
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
                instancePath: instancePath + "/selection/owner",
                schemaPath:
                  "/properties/selection/properties/owner/properties/profileId",
                keyword: "properties",
                params: { error: "missing", missingProperty: "profileId" },
                message: "must have property 'profileId'",
              };
              if (vErrors === null) {
                vErrors = [err5];
              } else {
                vErrors.push(err5);
              }
              errors++;
            }
            if (data3.generation !== undefined) {
              if (!(typeof data3.generation == "string")) {
                const err6 = {
                  instancePath: instancePath + "/selection/owner/generation",
                  schemaPath:
                    "/properties/selection/properties/owner/properties/generation/type",
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
                instancePath: instancePath + "/selection/owner",
                schemaPath:
                  "/properties/selection/properties/owner/properties/generation",
                keyword: "properties",
                params: { error: "missing", missingProperty: "generation" },
                message: "must have property 'generation'",
              };
              if (vErrors === null) {
                vErrors = [err7];
              } else {
                vErrors.push(err7);
              }
              errors++;
            }
            for (const key0 in data3) {
              if (key0 !== "profileId" && key0 !== "generation") {
                const err8 = {
                  instancePath:
                    instancePath +
                    "/selection/owner/" +
                    key0.replace(/~/g, "~0").replace(/\//g, "~1"),
                  schemaPath: "/properties/selection/properties/owner",
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
          if (!valid4) {
            const err9 = {
              instancePath: instancePath + "/selection/owner",
              schemaPath: "/properties/selection/properties/owner/properties",
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
            instancePath: instancePath + "/selection",
            schemaPath: "/properties/selection/properties/owner",
            keyword: "properties",
            params: { error: "missing", missingProperty: "owner" },
            message: "must have property 'owner'",
          };
          if (vErrors === null) {
            vErrors = [err10];
          } else {
            vErrors.push(err10);
          }
          errors++;
        }
        for (const key1 in data0) {
          if (
            key1 !== "installationId" &&
            key1 !== "revision" &&
            key1 !== "owner"
          ) {
            const err11 = {
              instancePath:
                instancePath +
                "/selection/" +
                key1.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/properties/selection",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key1 },
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
      }
      if (!valid2) {
        const err12 = {
          instancePath: instancePath + "/selection",
          schemaPath: "/properties/selection/properties",
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
    } else {
      const err13 = {
        instancePath,
        schemaPath: "/properties/selection",
        keyword: "properties",
        params: { error: "missing", missingProperty: "selection" },
        message: "must have property 'selection'",
      };
      if (vErrors === null) {
        vErrors = [err13];
      } else {
        vErrors.push(err13);
      }
      errors++;
    }
    if (data.target !== undefined) {
      let data6 = data.target;
      let valid8 = false;
      if (data6 && typeof data6 == "object" && !Array.isArray(data6)) {
        const tag0 = data6.kind;
        if (tag0 === undefined) {
          const err14 = {
            instancePath: instancePath + "/target",
            schemaPath: "/properties/target/discriminator",
            keyword: "discriminator",
            params: { error: "tag", tag: "kind", tagValue: tag0 },
            message: 'tag "kind" must be string',
          };
          if (vErrors === null) {
            vErrors = [err14];
          } else {
            vErrors.push(err14);
          }
          errors++;
        } else if (typeof tag0 == "string") {
          if (tag0 === "cursor") {
            const _errs7 = errors;
            let valid10 = false;
            valid10 = true;
            for (const key2 in data6) {
              if (key2 !== "kind") {
                const err15 = {
                  instancePath:
                    instancePath +
                    "/target/" +
                    key2.replace(/~/g, "~0").replace(/\//g, "~1"),
                  schemaPath: "/properties/target/mapping/cursor",
                  keyword: "properties",
                  params: { error: "additional", additionalProperty: key2 },
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
            if (!valid10) {
              const err16 = {
                instancePath: instancePath + "/target",
                schemaPath: "/properties/target/mapping/cursor/properties",
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
            var valid9 = _errs7 === errors;
            valid8 = valid9;
          } else if (tag0 === "accepted") {
            const _errs8 = errors;
            let valid14 = false;
            valid14 = true;
            for (const key3 in data6) {
              if (key3 !== "kind" && key3 !== "receipt") {
                const err17 = {
                  instancePath:
                    instancePath +
                    "/target/" +
                    key3.replace(/~/g, "~0").replace(/\//g, "~1"),
                  schemaPath: "/properties/target/mapping/accepted",
                  keyword: "properties",
                  params: { error: "additional", additionalProperty: key3 },
                  message: "must NOT have additional properties",
                };
                if (vErrors === null) {
                  vErrors = [err17];
                } else {
                  vErrors.push(err17);
                }
                errors++;
              }
            }
            if (!valid14) {
              const err18 = {
                instancePath: instancePath + "/target",
                schemaPath: "/properties/target/mapping/accepted/properties",
                keyword: "properties",
                params: { type: "object", nullable: false },
                message: "must be object",
              };
              if (vErrors === null) {
                vErrors = [err18];
              } else {
                vErrors.push(err18);
              }
              errors++;
            }
            var valid13 = _errs8 === errors;
            valid8 = valid13;
          } else {
            const err19 = {
              instancePath: instancePath + "/target/kind",
              schemaPath: "/properties/target/mapping",
              keyword: "discriminator",
              params: { error: "mapping", tag: "kind", tagValue: tag0 },
              message: 'value of tag "kind" must be in mapping',
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
            instancePath: instancePath + "/target/kind",
            schemaPath: "/properties/target/discriminator",
            keyword: "discriminator",
            params: { error: "tag", tag: "kind", tagValue: tag0 },
            message: 'tag "kind" must be string',
          };
          if (vErrors === null) {
            vErrors = [err20];
          } else {
            vErrors.push(err20);
          }
          errors++;
        }
      } else if (!valid8) {
        const err21 = {
          instancePath: instancePath + "/target",
          schemaPath: "/properties/target/discriminator",
          keyword: "discriminator",
          params: { type: "object", nullable: false },
          message: "must be object",
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
        schemaPath: "/properties/target",
        keyword: "properties",
        params: { error: "missing", missingProperty: "target" },
        message: "must have property 'target'",
      };
      if (vErrors === null) {
        vErrors = [err22];
      } else {
        vErrors.push(err22);
      }
      errors++;
    }
    for (const key4 in data) {
      if (key4 !== "selection" && key4 !== "target") {
        const err23 = {
          instancePath:
            instancePath + "/" + key4.replace(/~/g, "~0").replace(/\//g, "~1"),
          schemaPath: "",
          keyword: "properties",
          params: { error: "additional", additionalProperty: key4 },
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
  if (!valid0) {
    const err24 = {
      instancePath,
      schemaPath: "/properties",
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
  validate59.errors = vErrors;
  return errors === 0;
}
export const validateSelectedWorkInput = validate60;
const schema32 = {
  properties: {
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
    runId: { type: "string" },
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
    if (data.selection !== undefined) {
      let data0 = data.selection;
      let valid2 = false;
      if (data0 && typeof data0 == "object" && !Array.isArray(data0)) {
        valid2 = true;
        if (data0.installationId !== undefined) {
          if (!(typeof data0.installationId == "string")) {
            const err0 = {
              instancePath: instancePath + "/selection/installationId",
              schemaPath:
                "/properties/selection/properties/installationId/type",
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
            instancePath: instancePath + "/selection",
            schemaPath: "/properties/selection/properties/installationId",
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
              instancePath: instancePath + "/selection/revision",
              schemaPath: "/properties/selection/properties/revision/type",
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
            instancePath: instancePath + "/selection",
            schemaPath: "/properties/selection/properties/revision",
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
        if (data0.owner !== undefined) {
          let data3 = data0.owner;
          let valid4 = false;
          if (data3 && typeof data3 == "object" && !Array.isArray(data3)) {
            valid4 = true;
            if (data3.profileId !== undefined) {
              if (!(typeof data3.profileId == "string")) {
                const err4 = {
                  instancePath: instancePath + "/selection/owner/profileId",
                  schemaPath:
                    "/properties/selection/properties/owner/properties/profileId/type",
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
                instancePath: instancePath + "/selection/owner",
                schemaPath:
                  "/properties/selection/properties/owner/properties/profileId",
                keyword: "properties",
                params: { error: "missing", missingProperty: "profileId" },
                message: "must have property 'profileId'",
              };
              if (vErrors === null) {
                vErrors = [err5];
              } else {
                vErrors.push(err5);
              }
              errors++;
            }
            if (data3.generation !== undefined) {
              if (!(typeof data3.generation == "string")) {
                const err6 = {
                  instancePath: instancePath + "/selection/owner/generation",
                  schemaPath:
                    "/properties/selection/properties/owner/properties/generation/type",
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
                instancePath: instancePath + "/selection/owner",
                schemaPath:
                  "/properties/selection/properties/owner/properties/generation",
                keyword: "properties",
                params: { error: "missing", missingProperty: "generation" },
                message: "must have property 'generation'",
              };
              if (vErrors === null) {
                vErrors = [err7];
              } else {
                vErrors.push(err7);
              }
              errors++;
            }
            for (const key0 in data3) {
              if (key0 !== "profileId" && key0 !== "generation") {
                const err8 = {
                  instancePath:
                    instancePath +
                    "/selection/owner/" +
                    key0.replace(/~/g, "~0").replace(/\//g, "~1"),
                  schemaPath: "/properties/selection/properties/owner",
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
          if (!valid4) {
            const err9 = {
              instancePath: instancePath + "/selection/owner",
              schemaPath: "/properties/selection/properties/owner/properties",
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
            instancePath: instancePath + "/selection",
            schemaPath: "/properties/selection/properties/owner",
            keyword: "properties",
            params: { error: "missing", missingProperty: "owner" },
            message: "must have property 'owner'",
          };
          if (vErrors === null) {
            vErrors = [err10];
          } else {
            vErrors.push(err10);
          }
          errors++;
        }
        for (const key1 in data0) {
          if (
            key1 !== "installationId" &&
            key1 !== "revision" &&
            key1 !== "owner"
          ) {
            const err11 = {
              instancePath:
                instancePath +
                "/selection/" +
                key1.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/properties/selection",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key1 },
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
      }
      if (!valid2) {
        const err12 = {
          instancePath: instancePath + "/selection",
          schemaPath: "/properties/selection/properties",
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
    } else {
      const err13 = {
        instancePath,
        schemaPath: "/properties/selection",
        keyword: "properties",
        params: { error: "missing", missingProperty: "selection" },
        message: "must have property 'selection'",
      };
      if (vErrors === null) {
        vErrors = [err13];
      } else {
        vErrors.push(err13);
      }
      errors++;
    }
    if (data.runId !== undefined) {
      if (!(typeof data.runId == "string")) {
        const err14 = {
          instancePath: instancePath + "/runId",
          schemaPath: "/properties/runId/type",
          keyword: "type",
          params: { type: "string", nullable: false },
          message: "must be string",
        };
        if (vErrors === null) {
          vErrors = [err14];
        } else {
          vErrors.push(err14);
        }
        errors++;
      }
    } else {
      const err15 = {
        instancePath,
        schemaPath: "/properties/runId",
        keyword: "properties",
        params: { error: "missing", missingProperty: "runId" },
        message: "must have property 'runId'",
      };
      if (vErrors === null) {
        vErrors = [err15];
      } else {
        vErrors.push(err15);
      }
      errors++;
    }
    for (const key2 in data) {
      if (key2 !== "selection" && key2 !== "runId") {
        const err16 = {
          instancePath:
            instancePath + "/" + key2.replace(/~/g, "~0").replace(/\//g, "~1"),
          schemaPath: "",
          keyword: "properties",
          params: { error: "additional", additionalProperty: key2 },
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
  validate60.errors = vErrors;
  return errors === 0;
}
export const validateSelectedInkInput = validate61;
const schema33 = {
  properties: {
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
    token: {},
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
    if (data.selection !== undefined) {
      let data0 = data.selection;
      let valid2 = false;
      if (data0 && typeof data0 == "object" && !Array.isArray(data0)) {
        valid2 = true;
        if (data0.installationId !== undefined) {
          if (!(typeof data0.installationId == "string")) {
            const err0 = {
              instancePath: instancePath + "/selection/installationId",
              schemaPath:
                "/properties/selection/properties/installationId/type",
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
            instancePath: instancePath + "/selection",
            schemaPath: "/properties/selection/properties/installationId",
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
              instancePath: instancePath + "/selection/revision",
              schemaPath: "/properties/selection/properties/revision/type",
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
            instancePath: instancePath + "/selection",
            schemaPath: "/properties/selection/properties/revision",
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
        if (data0.owner !== undefined) {
          let data3 = data0.owner;
          let valid4 = false;
          if (data3 && typeof data3 == "object" && !Array.isArray(data3)) {
            valid4 = true;
            if (data3.profileId !== undefined) {
              if (!(typeof data3.profileId == "string")) {
                const err4 = {
                  instancePath: instancePath + "/selection/owner/profileId",
                  schemaPath:
                    "/properties/selection/properties/owner/properties/profileId/type",
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
                instancePath: instancePath + "/selection/owner",
                schemaPath:
                  "/properties/selection/properties/owner/properties/profileId",
                keyword: "properties",
                params: { error: "missing", missingProperty: "profileId" },
                message: "must have property 'profileId'",
              };
              if (vErrors === null) {
                vErrors = [err5];
              } else {
                vErrors.push(err5);
              }
              errors++;
            }
            if (data3.generation !== undefined) {
              if (!(typeof data3.generation == "string")) {
                const err6 = {
                  instancePath: instancePath + "/selection/owner/generation",
                  schemaPath:
                    "/properties/selection/properties/owner/properties/generation/type",
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
                instancePath: instancePath + "/selection/owner",
                schemaPath:
                  "/properties/selection/properties/owner/properties/generation",
                keyword: "properties",
                params: { error: "missing", missingProperty: "generation" },
                message: "must have property 'generation'",
              };
              if (vErrors === null) {
                vErrors = [err7];
              } else {
                vErrors.push(err7);
              }
              errors++;
            }
            for (const key0 in data3) {
              if (key0 !== "profileId" && key0 !== "generation") {
                const err8 = {
                  instancePath:
                    instancePath +
                    "/selection/owner/" +
                    key0.replace(/~/g, "~0").replace(/\//g, "~1"),
                  schemaPath: "/properties/selection/properties/owner",
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
          if (!valid4) {
            const err9 = {
              instancePath: instancePath + "/selection/owner",
              schemaPath: "/properties/selection/properties/owner/properties",
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
            instancePath: instancePath + "/selection",
            schemaPath: "/properties/selection/properties/owner",
            keyword: "properties",
            params: { error: "missing", missingProperty: "owner" },
            message: "must have property 'owner'",
          };
          if (vErrors === null) {
            vErrors = [err10];
          } else {
            vErrors.push(err10);
          }
          errors++;
        }
        for (const key1 in data0) {
          if (
            key1 !== "installationId" &&
            key1 !== "revision" &&
            key1 !== "owner"
          ) {
            const err11 = {
              instancePath:
                instancePath +
                "/selection/" +
                key1.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/properties/selection",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key1 },
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
      }
      if (!valid2) {
        const err12 = {
          instancePath: instancePath + "/selection",
          schemaPath: "/properties/selection/properties",
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
    } else {
      const err13 = {
        instancePath,
        schemaPath: "/properties/selection",
        keyword: "properties",
        params: { error: "missing", missingProperty: "selection" },
        message: "must have property 'selection'",
      };
      if (vErrors === null) {
        vErrors = [err13];
      } else {
        vErrors.push(err13);
      }
      errors++;
    }
    for (const key2 in data) {
      if (key2 !== "selection" && key2 !== "token") {
        const err14 = {
          instancePath:
            instancePath + "/" + key2.replace(/~/g, "~0").replace(/\//g, "~1"),
          schemaPath: "",
          keyword: "properties",
          params: { error: "additional", additionalProperty: key2 },
          message: "must NOT have additional properties",
        };
        if (vErrors === null) {
          vErrors = [err14];
        } else {
          vErrors.push(err14);
        }
        errors++;
      }
    }
  }
  if (!valid0) {
    const err15 = {
      instancePath,
      schemaPath: "/properties",
      keyword: "properties",
      params: { type: "object", nullable: false },
      message: "must be object",
    };
    if (vErrors === null) {
      vErrors = [err15];
    } else {
      vErrors.push(err15);
    }
    errors++;
  }
  validate61.errors = vErrors;
  return errors === 0;
}
export const validateSelectedControlsInput = validate62;
const schema34 = {
  properties: {
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
    binding: {},
  },
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
    if (data.selection !== undefined) {
      let data0 = data.selection;
      let valid2 = false;
      if (data0 && typeof data0 == "object" && !Array.isArray(data0)) {
        valid2 = true;
        if (data0.installationId !== undefined) {
          if (!(typeof data0.installationId == "string")) {
            const err0 = {
              instancePath: instancePath + "/selection/installationId",
              schemaPath:
                "/properties/selection/properties/installationId/type",
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
            instancePath: instancePath + "/selection",
            schemaPath: "/properties/selection/properties/installationId",
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
              instancePath: instancePath + "/selection/revision",
              schemaPath: "/properties/selection/properties/revision/type",
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
            instancePath: instancePath + "/selection",
            schemaPath: "/properties/selection/properties/revision",
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
        if (data0.owner !== undefined) {
          let data3 = data0.owner;
          let valid4 = false;
          if (data3 && typeof data3 == "object" && !Array.isArray(data3)) {
            valid4 = true;
            if (data3.profileId !== undefined) {
              if (!(typeof data3.profileId == "string")) {
                const err4 = {
                  instancePath: instancePath + "/selection/owner/profileId",
                  schemaPath:
                    "/properties/selection/properties/owner/properties/profileId/type",
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
                instancePath: instancePath + "/selection/owner",
                schemaPath:
                  "/properties/selection/properties/owner/properties/profileId",
                keyword: "properties",
                params: { error: "missing", missingProperty: "profileId" },
                message: "must have property 'profileId'",
              };
              if (vErrors === null) {
                vErrors = [err5];
              } else {
                vErrors.push(err5);
              }
              errors++;
            }
            if (data3.generation !== undefined) {
              if (!(typeof data3.generation == "string")) {
                const err6 = {
                  instancePath: instancePath + "/selection/owner/generation",
                  schemaPath:
                    "/properties/selection/properties/owner/properties/generation/type",
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
                instancePath: instancePath + "/selection/owner",
                schemaPath:
                  "/properties/selection/properties/owner/properties/generation",
                keyword: "properties",
                params: { error: "missing", missingProperty: "generation" },
                message: "must have property 'generation'",
              };
              if (vErrors === null) {
                vErrors = [err7];
              } else {
                vErrors.push(err7);
              }
              errors++;
            }
            for (const key0 in data3) {
              if (key0 !== "profileId" && key0 !== "generation") {
                const err8 = {
                  instancePath:
                    instancePath +
                    "/selection/owner/" +
                    key0.replace(/~/g, "~0").replace(/\//g, "~1"),
                  schemaPath: "/properties/selection/properties/owner",
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
          if (!valid4) {
            const err9 = {
              instancePath: instancePath + "/selection/owner",
              schemaPath: "/properties/selection/properties/owner/properties",
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
            instancePath: instancePath + "/selection",
            schemaPath: "/properties/selection/properties/owner",
            keyword: "properties",
            params: { error: "missing", missingProperty: "owner" },
            message: "must have property 'owner'",
          };
          if (vErrors === null) {
            vErrors = [err10];
          } else {
            vErrors.push(err10);
          }
          errors++;
        }
        for (const key1 in data0) {
          if (
            key1 !== "installationId" &&
            key1 !== "revision" &&
            key1 !== "owner"
          ) {
            const err11 = {
              instancePath:
                instancePath +
                "/selection/" +
                key1.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/properties/selection",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key1 },
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
      }
      if (!valid2) {
        const err12 = {
          instancePath: instancePath + "/selection",
          schemaPath: "/properties/selection/properties",
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
    } else {
      const err13 = {
        instancePath,
        schemaPath: "/properties/selection",
        keyword: "properties",
        params: { error: "missing", missingProperty: "selection" },
        message: "must have property 'selection'",
      };
      if (vErrors === null) {
        vErrors = [err13];
      } else {
        vErrors.push(err13);
      }
      errors++;
    }
    for (const key2 in data) {
      if (key2 !== "selection" && key2 !== "binding") {
        const err14 = {
          instancePath:
            instancePath + "/" + key2.replace(/~/g, "~0").replace(/\//g, "~1"),
          schemaPath: "",
          keyword: "properties",
          params: { error: "additional", additionalProperty: key2 },
          message: "must NOT have additional properties",
        };
        if (vErrors === null) {
          vErrors = [err14];
        } else {
          vErrors.push(err14);
        }
        errors++;
      }
    }
  }
  if (!valid0) {
    const err15 = {
      instancePath,
      schemaPath: "/properties",
      keyword: "properties",
      params: { type: "object", nullable: false },
      message: "must be object",
    };
    if (vErrors === null) {
      vErrors = [err15];
    } else {
      vErrors.push(err15);
    }
    errors++;
  }
  validate62.errors = vErrors;
  return errors === 0;
}
export const validateDepartureWitness = validate63;
const schema35 = {
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
              selectedSessionRevision: { type: "string", nullable: true },
            },
          },
          documents: { elements: {} },
        },
      },
    },
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
    valid0 = true;
    if (data.courses !== undefined) {
      let data0 = data.courses;
      let valid2 = false;
      if (!valid2) {
        if (Array.isArray(data0)) {
          let valid4 = true;
          const len0 = data0.length;
          for (let i0 = 0; i0 < len0; i0++) {
            let data1 = data0[i0];
            const _errs1 = errors;
            let valid5 = false;
            if (data1 && typeof data1 == "object" && !Array.isArray(data1)) {
              valid5 = true;
              if (data1.courseId !== undefined) {
                if (!(typeof data1.courseId == "string")) {
                  const err0 = {
                    instancePath: instancePath + "/courses/" + i0 + "/courseId",
                    schemaPath:
                      "/properties/courses/elements/properties/courseId/type",
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
                  instancePath: instancePath + "/courses/" + i0,
                  schemaPath:
                    "/properties/courses/elements/properties/courseId",
                  keyword: "properties",
                  params: { error: "missing", missingProperty: "courseId" },
                  message: "must have property 'courseId'",
                };
                if (vErrors === null) {
                  vErrors = [err1];
                } else {
                  vErrors.push(err1);
                }
                errors++;
              }
              if (data1.witness !== undefined) {
                let data3 = data1.witness;
                let valid7 = false;
                if (
                  data3 &&
                  typeof data3 == "object" &&
                  !Array.isArray(data3)
                ) {
                  valid7 = true;
                  if (data3.owner !== undefined) {
                    let data4 = data3.owner;
                    let valid9 = false;
                    if (
                      data4 &&
                      typeof data4 == "object" &&
                      !Array.isArray(data4)
                    ) {
                      valid9 = true;
                      if (data4.profileId !== undefined) {
                        if (!(typeof data4.profileId == "string")) {
                          const err2 = {
                            instancePath:
                              instancePath +
                              "/courses/" +
                              i0 +
                              "/witness/owner/profileId",
                            schemaPath:
                              "/properties/courses/elements/properties/witness/properties/owner/properties/profileId/type",
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
                          instancePath:
                            instancePath + "/courses/" + i0 + "/witness/owner",
                          schemaPath:
                            "/properties/courses/elements/properties/witness/properties/owner/properties/profileId",
                          keyword: "properties",
                          params: {
                            error: "missing",
                            missingProperty: "profileId",
                          },
                          message: "must have property 'profileId'",
                        };
                        if (vErrors === null) {
                          vErrors = [err3];
                        } else {
                          vErrors.push(err3);
                        }
                        errors++;
                      }
                      if (data4.generation !== undefined) {
                        if (!(typeof data4.generation == "string")) {
                          const err4 = {
                            instancePath:
                              instancePath +
                              "/courses/" +
                              i0 +
                              "/witness/owner/generation",
                            schemaPath:
                              "/properties/courses/elements/properties/witness/properties/owner/properties/generation/type",
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
                          instancePath:
                            instancePath + "/courses/" + i0 + "/witness/owner",
                          schemaPath:
                            "/properties/courses/elements/properties/witness/properties/owner/properties/generation",
                          keyword: "properties",
                          params: {
                            error: "missing",
                            missingProperty: "generation",
                          },
                          message: "must have property 'generation'",
                        };
                        if (vErrors === null) {
                          vErrors = [err5];
                        } else {
                          vErrors.push(err5);
                        }
                        errors++;
                      }
                      for (const key0 in data4) {
                        if (key0 !== "profileId" && key0 !== "generation") {
                          const err6 = {
                            instancePath:
                              instancePath +
                              "/courses/" +
                              i0 +
                              "/witness/owner/" +
                              key0.replace(/~/g, "~0").replace(/\//g, "~1"),
                            schemaPath:
                              "/properties/courses/elements/properties/witness/properties/owner",
                            keyword: "properties",
                            params: {
                              error: "additional",
                              additionalProperty: key0,
                            },
                            message: "must NOT have additional properties",
                          };
                          if (vErrors === null) {
                            vErrors = [err6];
                          } else {
                            vErrors.push(err6);
                          }
                          errors++;
                        }
                      }
                    }
                    if (!valid9) {
                      const err7 = {
                        instancePath:
                          instancePath + "/courses/" + i0 + "/witness/owner",
                        schemaPath:
                          "/properties/courses/elements/properties/witness/properties/owner/properties",
                        keyword: "properties",
                        params: { type: "object", nullable: false },
                        message: "must be object",
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
                      instancePath:
                        instancePath + "/courses/" + i0 + "/witness",
                      schemaPath:
                        "/properties/courses/elements/properties/witness/properties/owner",
                      keyword: "properties",
                      params: { error: "missing", missingProperty: "owner" },
                      message: "must have property 'owner'",
                    };
                    if (vErrors === null) {
                      vErrors = [err8];
                    } else {
                      vErrors.push(err8);
                    }
                    errors++;
                  }
                  if (data3.profileRevision !== undefined) {
                    if (!(typeof data3.profileRevision == "string")) {
                      const err9 = {
                        instancePath:
                          instancePath +
                          "/courses/" +
                          i0 +
                          "/witness/profileRevision",
                        schemaPath:
                          "/properties/courses/elements/properties/witness/properties/profileRevision/type",
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
                      instancePath:
                        instancePath + "/courses/" + i0 + "/witness",
                      schemaPath:
                        "/properties/courses/elements/properties/witness/properties/profileRevision",
                      keyword: "properties",
                      params: {
                        error: "missing",
                        missingProperty: "profileRevision",
                      },
                      message: "must have property 'profileRevision'",
                    };
                    if (vErrors === null) {
                      vErrors = [err10];
                    } else {
                      vErrors.push(err10);
                    }
                    errors++;
                  }
                  if (data3.activePackageHash !== undefined) {
                    if (!(typeof data3.activePackageHash == "string")) {
                      const err11 = {
                        instancePath:
                          instancePath +
                          "/courses/" +
                          i0 +
                          "/witness/activePackageHash",
                        schemaPath:
                          "/properties/courses/elements/properties/witness/properties/activePackageHash/type",
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
                      instancePath:
                        instancePath + "/courses/" + i0 + "/witness",
                      schemaPath:
                        "/properties/courses/elements/properties/witness/properties/activePackageHash",
                      keyword: "properties",
                      params: {
                        error: "missing",
                        missingProperty: "activePackageHash",
                      },
                      message: "must have property 'activePackageHash'",
                    };
                    if (vErrors === null) {
                      vErrors = [err12];
                    } else {
                      vErrors.push(err12);
                    }
                    errors++;
                  }
                  if (data3.activationRevision !== undefined) {
                    if (!(typeof data3.activationRevision == "string")) {
                      const err13 = {
                        instancePath:
                          instancePath +
                          "/courses/" +
                          i0 +
                          "/witness/activationRevision",
                        schemaPath:
                          "/properties/courses/elements/properties/witness/properties/activationRevision/type",
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
                      instancePath:
                        instancePath + "/courses/" + i0 + "/witness",
                      schemaPath:
                        "/properties/courses/elements/properties/witness/properties/activationRevision",
                      keyword: "properties",
                      params: {
                        error: "missing",
                        missingProperty: "activationRevision",
                      },
                      message: "must have property 'activationRevision'",
                    };
                    if (vErrors === null) {
                      vErrors = [err14];
                    } else {
                      vErrors.push(err14);
                    }
                    errors++;
                  }
                  if (data3.cursorRevision !== undefined) {
                    if (!(typeof data3.cursorRevision == "string")) {
                      const err15 = {
                        instancePath:
                          instancePath +
                          "/courses/" +
                          i0 +
                          "/witness/cursorRevision",
                        schemaPath:
                          "/properties/courses/elements/properties/witness/properties/cursorRevision/type",
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
                      instancePath:
                        instancePath + "/courses/" + i0 + "/witness",
                      schemaPath:
                        "/properties/courses/elements/properties/witness/properties/cursorRevision",
                      keyword: "properties",
                      params: {
                        error: "missing",
                        missingProperty: "cursorRevision",
                      },
                      message: "must have property 'cursorRevision'",
                    };
                    if (vErrors === null) {
                      vErrors = [err16];
                    } else {
                      vErrors.push(err16);
                    }
                    errors++;
                  }
                  if (data3.selectedSessionRevision !== undefined) {
                    let data11 = data3.selectedSessionRevision;
                    if (!(data11 === null || typeof data11 == "string")) {
                      const err17 = {
                        instancePath:
                          instancePath +
                          "/courses/" +
                          i0 +
                          "/witness/selectedSessionRevision",
                        schemaPath:
                          "/properties/courses/elements/properties/witness/properties/selectedSessionRevision/type",
                        keyword: "type",
                        params: { type: "string", nullable: true },
                        message: "must be string or null",
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
                      instancePath:
                        instancePath + "/courses/" + i0 + "/witness",
                      schemaPath:
                        "/properties/courses/elements/properties/witness/properties/selectedSessionRevision",
                      keyword: "properties",
                      params: {
                        error: "missing",
                        missingProperty: "selectedSessionRevision",
                      },
                      message: "must have property 'selectedSessionRevision'",
                    };
                    if (vErrors === null) {
                      vErrors = [err18];
                    } else {
                      vErrors.push(err18);
                    }
                    errors++;
                  }
                  for (const key1 in data3) {
                    if (
                      key1 !== "owner" &&
                      key1 !== "profileRevision" &&
                      key1 !== "activePackageHash" &&
                      key1 !== "activationRevision" &&
                      key1 !== "cursorRevision" &&
                      key1 !== "selectedSessionRevision"
                    ) {
                      const err19 = {
                        instancePath:
                          instancePath +
                          "/courses/" +
                          i0 +
                          "/witness/" +
                          key1.replace(/~/g, "~0").replace(/\//g, "~1"),
                        schemaPath:
                          "/properties/courses/elements/properties/witness",
                        keyword: "properties",
                        params: {
                          error: "additional",
                          additionalProperty: key1,
                        },
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
                    instancePath: instancePath + "/courses/" + i0 + "/witness",
                    schemaPath:
                      "/properties/courses/elements/properties/witness/properties",
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
                  instancePath: instancePath + "/courses/" + i0,
                  schemaPath: "/properties/courses/elements/properties/witness",
                  keyword: "properties",
                  params: { error: "missing", missingProperty: "witness" },
                  message: "must have property 'witness'",
                };
                if (vErrors === null) {
                  vErrors = [err21];
                } else {
                  vErrors.push(err21);
                }
                errors++;
              }
              if (data1.documents !== undefined) {
              } else {
                const err22 = {
                  instancePath: instancePath + "/courses/" + i0,
                  schemaPath:
                    "/properties/courses/elements/properties/documents",
                  keyword: "properties",
                  params: { error: "missing", missingProperty: "documents" },
                  message: "must have property 'documents'",
                };
                if (vErrors === null) {
                  vErrors = [err22];
                } else {
                  vErrors.push(err22);
                }
                errors++;
              }
              for (const key2 in data1) {
                if (
                  key2 !== "courseId" &&
                  key2 !== "witness" &&
                  key2 !== "documents"
                ) {
                  const err23 = {
                    instancePath:
                      instancePath +
                      "/courses/" +
                      i0 +
                      "/" +
                      key2.replace(/~/g, "~0").replace(/\//g, "~1"),
                    schemaPath: "/properties/courses/elements",
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
            }
            if (!valid5) {
              const err24 = {
                instancePath: instancePath + "/courses/" + i0,
                schemaPath: "/properties/courses/elements/properties",
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
            var valid3 = _errs1 === errors;
            if (!valid3) {
              valid4 = false;
            }
          }
          valid2 = valid4;
        } else {
          const err25 = {
            instancePath: instancePath + "/courses",
            schemaPath: "/properties/courses/elements",
            keyword: "elements",
            params: { type: "array", nullable: false },
            message: "must be array",
          };
          if (vErrors === null) {
            vErrors = [err25];
          } else {
            vErrors.push(err25);
          }
          errors++;
        }
      }
    } else {
      const err26 = {
        instancePath,
        schemaPath: "/properties/courses",
        keyword: "properties",
        params: { error: "missing", missingProperty: "courses" },
        message: "must have property 'courses'",
      };
      if (vErrors === null) {
        vErrors = [err26];
      } else {
        vErrors.push(err26);
      }
      errors++;
    }
    for (const key3 in data) {
      if (key3 !== "courses") {
        const err27 = {
          instancePath:
            instancePath + "/" + key3.replace(/~/g, "~0").replace(/\//g, "~1"),
          schemaPath: "",
          keyword: "properties",
          params: { error: "additional", additionalProperty: key3 },
          message: "must NOT have additional properties",
        };
        if (vErrors === null) {
          vErrors = [err27];
        } else {
          vErrors.push(err27);
        }
        errors++;
      }
    }
  }
  if (!valid0) {
    const err28 = {
      instancePath,
      schemaPath: "/properties",
      keyword: "properties",
      params: { type: "object", nullable: false },
      message: "must be object",
    };
    if (vErrors === null) {
      vErrors = [err28];
    } else {
      vErrors.push(err28);
    }
    errors++;
  }
  validate63.errors = vErrors;
  return errors === 0;
}
export const validateProfileAdministrationResult = validate64;
const schema36 = {
  discriminator: "kind",
  mapping: {
    profileCommitted: {
      properties: {
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
    },
    rejected: {
      properties: { code: { type: "string" }, message: { type: "string" } },
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
      if (tag0 === "profileCommitted") {
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
              schemaPath: "/mapping/profileCommitted/properties/version/type",
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
            schemaPath: "/mapping/profileCommitted/properties/version",
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
        if (data.commandId !== undefined) {
          if (!(typeof data.commandId == "string")) {
            const err3 = {
              instancePath: instancePath + "/commandId",
              schemaPath: "/mapping/profileCommitted/properties/commandId/type",
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
            schemaPath: "/mapping/profileCommitted/properties/commandId",
            keyword: "properties",
            params: { error: "missing", missingProperty: "commandId" },
            message: "must have property 'commandId'",
          };
          if (vErrors === null) {
            vErrors = [err4];
          } else {
            vErrors.push(err4);
          }
          errors++;
        }
        if (data.payloadHash !== undefined) {
          if (!(typeof data.payloadHash == "string")) {
            const err5 = {
              instancePath: instancePath + "/payloadHash",
              schemaPath:
                "/mapping/profileCommitted/properties/payloadHash/type",
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
            schemaPath: "/mapping/profileCommitted/properties/payloadHash",
            keyword: "properties",
            params: { error: "missing", missingProperty: "payloadHash" },
            message: "must have property 'payloadHash'",
          };
          if (vErrors === null) {
            vErrors = [err6];
          } else {
            vErrors.push(err6);
          }
          errors++;
        }
        if (data.administration !== undefined) {
          let data3 = data.administration;
          let valid4 = false;
          if (data3 && typeof data3 == "object" && !Array.isArray(data3)) {
            valid4 = true;
            if (data3.installationId !== undefined) {
              if (!(typeof data3.installationId == "string")) {
                const err7 = {
                  instancePath: instancePath + "/administration/installationId",
                  schemaPath:
                    "/mapping/profileCommitted/properties/administration/properties/installationId/type",
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
                instancePath: instancePath + "/administration",
                schemaPath:
                  "/mapping/profileCommitted/properties/administration/properties/installationId",
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
                  instancePath: instancePath + "/administration/revision",
                  schemaPath:
                    "/mapping/profileCommitted/properties/administration/properties/revision/type",
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
                instancePath: instancePath + "/administration",
                schemaPath:
                  "/mapping/profileCommitted/properties/administration/properties/revision",
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
            for (const key0 in data3) {
              if (key0 !== "installationId" && key0 !== "revision") {
                const err11 = {
                  instancePath:
                    instancePath +
                    "/administration/" +
                    key0.replace(/~/g, "~0").replace(/\//g, "~1"),
                  schemaPath:
                    "/mapping/profileCommitted/properties/administration",
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
          }
          if (!valid4) {
            const err12 = {
              instancePath: instancePath + "/administration",
              schemaPath:
                "/mapping/profileCommitted/properties/administration/properties",
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
        } else {
          const err13 = {
            instancePath,
            schemaPath: "/mapping/profileCommitted/properties/administration",
            keyword: "properties",
            params: { error: "missing", missingProperty: "administration" },
            message: "must have property 'administration'",
          };
          if (vErrors === null) {
            vErrors = [err13];
          } else {
            vErrors.push(err13);
          }
          errors++;
        }
        if (data.selection !== undefined) {
          let data6 = data.selection;
          let valid7 = false;
          if (data6 && typeof data6 == "object" && !Array.isArray(data6)) {
            valid7 = true;
            if (data6.installationId !== undefined) {
              if (!(typeof data6.installationId == "string")) {
                const err14 = {
                  instancePath: instancePath + "/selection/installationId",
                  schemaPath:
                    "/mapping/profileCommitted/properties/selection/properties/installationId/type",
                  keyword: "type",
                  params: { type: "string", nullable: false },
                  message: "must be string",
                };
                if (vErrors === null) {
                  vErrors = [err14];
                } else {
                  vErrors.push(err14);
                }
                errors++;
              }
            } else {
              const err15 = {
                instancePath: instancePath + "/selection",
                schemaPath:
                  "/mapping/profileCommitted/properties/selection/properties/installationId",
                keyword: "properties",
                params: { error: "missing", missingProperty: "installationId" },
                message: "must have property 'installationId'",
              };
              if (vErrors === null) {
                vErrors = [err15];
              } else {
                vErrors.push(err15);
              }
              errors++;
            }
            if (data6.revision !== undefined) {
              if (!(typeof data6.revision == "string")) {
                const err16 = {
                  instancePath: instancePath + "/selection/revision",
                  schemaPath:
                    "/mapping/profileCommitted/properties/selection/properties/revision/type",
                  keyword: "type",
                  params: { type: "string", nullable: false },
                  message: "must be string",
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
                schemaPath:
                  "/mapping/profileCommitted/properties/selection/properties/revision",
                keyword: "properties",
                params: { error: "missing", missingProperty: "revision" },
                message: "must have property 'revision'",
              };
              if (vErrors === null) {
                vErrors = [err17];
              } else {
                vErrors.push(err17);
              }
              errors++;
            }
            if (data6.owner !== undefined) {
              let data9 = data6.owner;
              let valid9 = false;
              if (data9 && typeof data9 == "object" && !Array.isArray(data9)) {
                valid9 = true;
                if (data9.profileId !== undefined) {
                  if (!(typeof data9.profileId == "string")) {
                    const err18 = {
                      instancePath: instancePath + "/selection/owner/profileId",
                      schemaPath:
                        "/mapping/profileCommitted/properties/selection/properties/owner/properties/profileId/type",
                      keyword: "type",
                      params: { type: "string", nullable: false },
                      message: "must be string",
                    };
                    if (vErrors === null) {
                      vErrors = [err18];
                    } else {
                      vErrors.push(err18);
                    }
                    errors++;
                  }
                } else {
                  const err19 = {
                    instancePath: instancePath + "/selection/owner",
                    schemaPath:
                      "/mapping/profileCommitted/properties/selection/properties/owner/properties/profileId",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "profileId" },
                    message: "must have property 'profileId'",
                  };
                  if (vErrors === null) {
                    vErrors = [err19];
                  } else {
                    vErrors.push(err19);
                  }
                  errors++;
                }
                if (data9.generation !== undefined) {
                  if (!(typeof data9.generation == "string")) {
                    const err20 = {
                      instancePath:
                        instancePath + "/selection/owner/generation",
                      schemaPath:
                        "/mapping/profileCommitted/properties/selection/properties/owner/properties/generation/type",
                      keyword: "type",
                      params: { type: "string", nullable: false },
                      message: "must be string",
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
                    instancePath: instancePath + "/selection/owner",
                    schemaPath:
                      "/mapping/profileCommitted/properties/selection/properties/owner/properties/generation",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "generation" },
                    message: "must have property 'generation'",
                  };
                  if (vErrors === null) {
                    vErrors = [err21];
                  } else {
                    vErrors.push(err21);
                  }
                  errors++;
                }
                for (const key1 in data9) {
                  if (key1 !== "profileId" && key1 !== "generation") {
                    const err22 = {
                      instancePath:
                        instancePath +
                        "/selection/owner/" +
                        key1.replace(/~/g, "~0").replace(/\//g, "~1"),
                      schemaPath:
                        "/mapping/profileCommitted/properties/selection/properties/owner",
                      keyword: "properties",
                      params: { error: "additional", additionalProperty: key1 },
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
              if (!valid9) {
                const err23 = {
                  instancePath: instancePath + "/selection/owner",
                  schemaPath:
                    "/mapping/profileCommitted/properties/selection/properties/owner/properties",
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
                instancePath: instancePath + "/selection",
                schemaPath:
                  "/mapping/profileCommitted/properties/selection/properties/owner",
                keyword: "properties",
                params: { error: "missing", missingProperty: "owner" },
                message: "must have property 'owner'",
              };
              if (vErrors === null) {
                vErrors = [err24];
              } else {
                vErrors.push(err24);
              }
              errors++;
            }
            for (const key2 in data6) {
              if (
                key2 !== "installationId" &&
                key2 !== "revision" &&
                key2 !== "owner"
              ) {
                const err25 = {
                  instancePath:
                    instancePath +
                    "/selection/" +
                    key2.replace(/~/g, "~0").replace(/\//g, "~1"),
                  schemaPath: "/mapping/profileCommitted/properties/selection",
                  keyword: "properties",
                  params: { error: "additional", additionalProperty: key2 },
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
          if (!valid7) {
            const err26 = {
              instancePath: instancePath + "/selection",
              schemaPath:
                "/mapping/profileCommitted/properties/selection/properties",
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
            instancePath,
            schemaPath: "/mapping/profileCommitted/properties/selection",
            keyword: "properties",
            params: { error: "missing", missingProperty: "selection" },
            message: "must have property 'selection'",
          };
          if (vErrors === null) {
            vErrors = [err27];
          } else {
            vErrors.push(err27);
          }
          errors++;
        }
        if (data.effect !== undefined) {
          let data12 = data.effect;
          let valid13 = false;
          if (data12 && typeof data12 == "object" && !Array.isArray(data12)) {
            const tag1 = data12.kind;
            if (tag1 === undefined) {
              const err28 = {
                instancePath: instancePath + "/effect",
                schemaPath:
                  "/mapping/profileCommitted/properties/effect/discriminator",
                keyword: "discriminator",
                params: { error: "tag", tag: "kind", tagValue: tag1 },
                message: 'tag "kind" must be string',
              };
              if (vErrors === null) {
                vErrors = [err28];
              } else {
                vErrors.push(err28);
              }
              errors++;
            } else if (typeof tag1 == "string") {
              if (tag1 === "preferences") {
                const _errs14 = errors;
                let valid15 = false;
                valid15 = true;
                if (data12.target !== undefined) {
                  let data13 = data12.target;
                  let valid17 = false;
                  if (
                    data13 &&
                    typeof data13 == "object" &&
                    !Array.isArray(data13)
                  ) {
                    valid17 = true;
                    if (data13.owner !== undefined) {
                      let data14 = data13.owner;
                      let valid19 = false;
                      if (
                        data14 &&
                        typeof data14 == "object" &&
                        !Array.isArray(data14)
                      ) {
                        valid19 = true;
                        if (data14.profileId !== undefined) {
                          if (!(typeof data14.profileId == "string")) {
                            const err29 = {
                              instancePath:
                                instancePath + "/effect/target/owner/profileId",
                              schemaPath:
                                "/mapping/profileCommitted/properties/effect/mapping/preferences/properties/target/properties/owner/properties/profileId/type",
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
                            instancePath: instancePath + "/effect/target/owner",
                            schemaPath:
                              "/mapping/profileCommitted/properties/effect/mapping/preferences/properties/target/properties/owner/properties/profileId",
                            keyword: "properties",
                            params: {
                              error: "missing",
                              missingProperty: "profileId",
                            },
                            message: "must have property 'profileId'",
                          };
                          if (vErrors === null) {
                            vErrors = [err30];
                          } else {
                            vErrors.push(err30);
                          }
                          errors++;
                        }
                        if (data14.generation !== undefined) {
                          if (!(typeof data14.generation == "string")) {
                            const err31 = {
                              instancePath:
                                instancePath +
                                "/effect/target/owner/generation",
                              schemaPath:
                                "/mapping/profileCommitted/properties/effect/mapping/preferences/properties/target/properties/owner/properties/generation/type",
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
                              "/mapping/profileCommitted/properties/effect/mapping/preferences/properties/target/properties/owner/properties/generation",
                            keyword: "properties",
                            params: {
                              error: "missing",
                              missingProperty: "generation",
                            },
                            message: "must have property 'generation'",
                          };
                          if (vErrors === null) {
                            vErrors = [err32];
                          } else {
                            vErrors.push(err32);
                          }
                          errors++;
                        }
                        for (const key3 in data14) {
                          if (key3 !== "profileId" && key3 !== "generation") {
                            const err33 = {
                              instancePath:
                                instancePath +
                                "/effect/target/owner/" +
                                key3.replace(/~/g, "~0").replace(/\//g, "~1"),
                              schemaPath:
                                "/mapping/profileCommitted/properties/effect/mapping/preferences/properties/target/properties/owner",
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
                      if (!valid19) {
                        const err34 = {
                          instancePath: instancePath + "/effect/target/owner",
                          schemaPath:
                            "/mapping/profileCommitted/properties/effect/mapping/preferences/properties/target/properties/owner/properties",
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
                    } else {
                      const err35 = {
                        instancePath: instancePath + "/effect/target",
                        schemaPath:
                          "/mapping/profileCommitted/properties/effect/mapping/preferences/properties/target/properties/owner",
                        keyword: "properties",
                        params: { error: "missing", missingProperty: "owner" },
                        message: "must have property 'owner'",
                      };
                      if (vErrors === null) {
                        vErrors = [err35];
                      } else {
                        vErrors.push(err35);
                      }
                      errors++;
                    }
                    if (data13.revision !== undefined) {
                      if (!(typeof data13.revision == "string")) {
                        const err36 = {
                          instancePath:
                            instancePath + "/effect/target/revision",
                          schemaPath:
                            "/mapping/profileCommitted/properties/effect/mapping/preferences/properties/target/properties/revision/type",
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
                    } else {
                      const err37 = {
                        instancePath: instancePath + "/effect/target",
                        schemaPath:
                          "/mapping/profileCommitted/properties/effect/mapping/preferences/properties/target/properties/revision",
                        keyword: "properties",
                        params: {
                          error: "missing",
                          missingProperty: "revision",
                        },
                        message: "must have property 'revision'",
                      };
                      if (vErrors === null) {
                        vErrors = [err37];
                      } else {
                        vErrors.push(err37);
                      }
                      errors++;
                    }
                    for (const key4 in data13) {
                      if (key4 !== "owner" && key4 !== "revision") {
                        const err38 = {
                          instancePath:
                            instancePath +
                            "/effect/target/" +
                            key4.replace(/~/g, "~0").replace(/\//g, "~1"),
                          schemaPath:
                            "/mapping/profileCommitted/properties/effect/mapping/preferences/properties/target",
                          keyword: "properties",
                          params: {
                            error: "additional",
                            additionalProperty: key4,
                          },
                          message: "must NOT have additional properties",
                        };
                        if (vErrors === null) {
                          vErrors = [err38];
                        } else {
                          vErrors.push(err38);
                        }
                        errors++;
                      }
                    }
                  }
                  if (!valid17) {
                    const err39 = {
                      instancePath: instancePath + "/effect/target",
                      schemaPath:
                        "/mapping/profileCommitted/properties/effect/mapping/preferences/properties/target/properties",
                      keyword: "properties",
                      params: { type: "object", nullable: false },
                      message: "must be object",
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
                    instancePath: instancePath + "/effect",
                    schemaPath:
                      "/mapping/profileCommitted/properties/effect/mapping/preferences/properties/target",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "target" },
                    message: "must have property 'target'",
                  };
                  if (vErrors === null) {
                    vErrors = [err40];
                  } else {
                    vErrors.push(err40);
                  }
                  errors++;
                }
                for (const key5 in data12) {
                  if (key5 !== "kind" && key5 !== "target") {
                    const err41 = {
                      instancePath:
                        instancePath +
                        "/effect/" +
                        key5.replace(/~/g, "~0").replace(/\//g, "~1"),
                      schemaPath:
                        "/mapping/profileCommitted/properties/effect/mapping/preferences",
                      keyword: "properties",
                      params: { error: "additional", additionalProperty: key5 },
                      message: "must NOT have additional properties",
                    };
                    if (vErrors === null) {
                      vErrors = [err41];
                    } else {
                      vErrors.push(err41);
                    }
                    errors++;
                  }
                }
                if (!valid15) {
                  const err42 = {
                    instancePath: instancePath + "/effect",
                    schemaPath:
                      "/mapping/profileCommitted/properties/effect/mapping/preferences/properties",
                    keyword: "properties",
                    params: { type: "object", nullable: false },
                    message: "must be object",
                  };
                  if (vErrors === null) {
                    vErrors = [err42];
                  } else {
                    vErrors.push(err42);
                  }
                  errors++;
                }
                var valid14 = _errs14 === errors;
                valid13 = valid14;
              } else if (tag1 === "created") {
                const _errs20 = errors;
                let valid25 = false;
                valid25 = true;
                if (data12.target !== undefined) {
                  let data18 = data12.target;
                  let valid27 = false;
                  if (
                    data18 &&
                    typeof data18 == "object" &&
                    !Array.isArray(data18)
                  ) {
                    valid27 = true;
                    if (data18.owner !== undefined) {
                      let data19 = data18.owner;
                      let valid29 = false;
                      if (
                        data19 &&
                        typeof data19 == "object" &&
                        !Array.isArray(data19)
                      ) {
                        valid29 = true;
                        if (data19.profileId !== undefined) {
                          if (!(typeof data19.profileId == "string")) {
                            const err43 = {
                              instancePath:
                                instancePath + "/effect/target/owner/profileId",
                              schemaPath:
                                "/mapping/profileCommitted/properties/effect/mapping/created/properties/target/properties/owner/properties/profileId/type",
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
                            instancePath: instancePath + "/effect/target/owner",
                            schemaPath:
                              "/mapping/profileCommitted/properties/effect/mapping/created/properties/target/properties/owner/properties/profileId",
                            keyword: "properties",
                            params: {
                              error: "missing",
                              missingProperty: "profileId",
                            },
                            message: "must have property 'profileId'",
                          };
                          if (vErrors === null) {
                            vErrors = [err44];
                          } else {
                            vErrors.push(err44);
                          }
                          errors++;
                        }
                        if (data19.generation !== undefined) {
                          if (!(typeof data19.generation == "string")) {
                            const err45 = {
                              instancePath:
                                instancePath +
                                "/effect/target/owner/generation",
                              schemaPath:
                                "/mapping/profileCommitted/properties/effect/mapping/created/properties/target/properties/owner/properties/generation/type",
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
                            instancePath: instancePath + "/effect/target/owner",
                            schemaPath:
                              "/mapping/profileCommitted/properties/effect/mapping/created/properties/target/properties/owner/properties/generation",
                            keyword: "properties",
                            params: {
                              error: "missing",
                              missingProperty: "generation",
                            },
                            message: "must have property 'generation'",
                          };
                          if (vErrors === null) {
                            vErrors = [err46];
                          } else {
                            vErrors.push(err46);
                          }
                          errors++;
                        }
                        for (const key6 in data19) {
                          if (key6 !== "profileId" && key6 !== "generation") {
                            const err47 = {
                              instancePath:
                                instancePath +
                                "/effect/target/owner/" +
                                key6.replace(/~/g, "~0").replace(/\//g, "~1"),
                              schemaPath:
                                "/mapping/profileCommitted/properties/effect/mapping/created/properties/target/properties/owner",
                              keyword: "properties",
                              params: {
                                error: "additional",
                                additionalProperty: key6,
                              },
                              message: "must NOT have additional properties",
                            };
                            if (vErrors === null) {
                              vErrors = [err47];
                            } else {
                              vErrors.push(err47);
                            }
                            errors++;
                          }
                        }
                      }
                      if (!valid29) {
                        const err48 = {
                          instancePath: instancePath + "/effect/target/owner",
                          schemaPath:
                            "/mapping/profileCommitted/properties/effect/mapping/created/properties/target/properties/owner/properties",
                          keyword: "properties",
                          params: { type: "object", nullable: false },
                          message: "must be object",
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
                        instancePath: instancePath + "/effect/target",
                        schemaPath:
                          "/mapping/profileCommitted/properties/effect/mapping/created/properties/target/properties/owner",
                        keyword: "properties",
                        params: { error: "missing", missingProperty: "owner" },
                        message: "must have property 'owner'",
                      };
                      if (vErrors === null) {
                        vErrors = [err49];
                      } else {
                        vErrors.push(err49);
                      }
                      errors++;
                    }
                    if (data18.revision !== undefined) {
                      if (!(typeof data18.revision == "string")) {
                        const err50 = {
                          instancePath:
                            instancePath + "/effect/target/revision",
                          schemaPath:
                            "/mapping/profileCommitted/properties/effect/mapping/created/properties/target/properties/revision/type",
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
                        instancePath: instancePath + "/effect/target",
                        schemaPath:
                          "/mapping/profileCommitted/properties/effect/mapping/created/properties/target/properties/revision",
                        keyword: "properties",
                        params: {
                          error: "missing",
                          missingProperty: "revision",
                        },
                        message: "must have property 'revision'",
                      };
                      if (vErrors === null) {
                        vErrors = [err51];
                      } else {
                        vErrors.push(err51);
                      }
                      errors++;
                    }
                    for (const key7 in data18) {
                      if (key7 !== "owner" && key7 !== "revision") {
                        const err52 = {
                          instancePath:
                            instancePath +
                            "/effect/target/" +
                            key7.replace(/~/g, "~0").replace(/\//g, "~1"),
                          schemaPath:
                            "/mapping/profileCommitted/properties/effect/mapping/created/properties/target",
                          keyword: "properties",
                          params: {
                            error: "additional",
                            additionalProperty: key7,
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
                  if (!valid27) {
                    const err53 = {
                      instancePath: instancePath + "/effect/target",
                      schemaPath:
                        "/mapping/profileCommitted/properties/effect/mapping/created/properties/target/properties",
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
                } else {
                  const err54 = {
                    instancePath: instancePath + "/effect",
                    schemaPath:
                      "/mapping/profileCommitted/properties/effect/mapping/created/properties/target",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "target" },
                    message: "must have property 'target'",
                  };
                  if (vErrors === null) {
                    vErrors = [err54];
                  } else {
                    vErrors.push(err54);
                  }
                  errors++;
                }
                for (const key8 in data12) {
                  if (key8 !== "kind" && key8 !== "target") {
                    const err55 = {
                      instancePath:
                        instancePath +
                        "/effect/" +
                        key8.replace(/~/g, "~0").replace(/\//g, "~1"),
                      schemaPath:
                        "/mapping/profileCommitted/properties/effect/mapping/created",
                      keyword: "properties",
                      params: { error: "additional", additionalProperty: key8 },
                      message: "must NOT have additional properties",
                    };
                    if (vErrors === null) {
                      vErrors = [err55];
                    } else {
                      vErrors.push(err55);
                    }
                    errors++;
                  }
                }
                if (!valid25) {
                  const err56 = {
                    instancePath: instancePath + "/effect",
                    schemaPath:
                      "/mapping/profileCommitted/properties/effect/mapping/created/properties",
                    keyword: "properties",
                    params: { type: "object", nullable: false },
                    message: "must be object",
                  };
                  if (vErrors === null) {
                    vErrors = [err56];
                  } else {
                    vErrors.push(err56);
                  }
                  errors++;
                }
                var valid24 = _errs20 === errors;
                valid13 = valid24;
              } else if (tag1 === "initialSetup") {
                const _errs26 = errors;
                let valid35 = false;
                valid35 = true;
                if (data12.target !== undefined) {
                  let data23 = data12.target;
                  let valid37 = false;
                  if (
                    data23 &&
                    typeof data23 == "object" &&
                    !Array.isArray(data23)
                  ) {
                    valid37 = true;
                    if (data23.owner !== undefined) {
                      let data24 = data23.owner;
                      let valid39 = false;
                      if (
                        data24 &&
                        typeof data24 == "object" &&
                        !Array.isArray(data24)
                      ) {
                        valid39 = true;
                        if (data24.profileId !== undefined) {
                          if (!(typeof data24.profileId == "string")) {
                            const err57 = {
                              instancePath:
                                instancePath + "/effect/target/owner/profileId",
                              schemaPath:
                                "/mapping/profileCommitted/properties/effect/mapping/initialSetup/properties/target/properties/owner/properties/profileId/type",
                              keyword: "type",
                              params: { type: "string", nullable: false },
                              message: "must be string",
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
                            instancePath: instancePath + "/effect/target/owner",
                            schemaPath:
                              "/mapping/profileCommitted/properties/effect/mapping/initialSetup/properties/target/properties/owner/properties/profileId",
                            keyword: "properties",
                            params: {
                              error: "missing",
                              missingProperty: "profileId",
                            },
                            message: "must have property 'profileId'",
                          };
                          if (vErrors === null) {
                            vErrors = [err58];
                          } else {
                            vErrors.push(err58);
                          }
                          errors++;
                        }
                        if (data24.generation !== undefined) {
                          if (!(typeof data24.generation == "string")) {
                            const err59 = {
                              instancePath:
                                instancePath +
                                "/effect/target/owner/generation",
                              schemaPath:
                                "/mapping/profileCommitted/properties/effect/mapping/initialSetup/properties/target/properties/owner/properties/generation/type",
                              keyword: "type",
                              params: { type: "string", nullable: false },
                              message: "must be string",
                            };
                            if (vErrors === null) {
                              vErrors = [err59];
                            } else {
                              vErrors.push(err59);
                            }
                            errors++;
                          }
                        } else {
                          const err60 = {
                            instancePath: instancePath + "/effect/target/owner",
                            schemaPath:
                              "/mapping/profileCommitted/properties/effect/mapping/initialSetup/properties/target/properties/owner/properties/generation",
                            keyword: "properties",
                            params: {
                              error: "missing",
                              missingProperty: "generation",
                            },
                            message: "must have property 'generation'",
                          };
                          if (vErrors === null) {
                            vErrors = [err60];
                          } else {
                            vErrors.push(err60);
                          }
                          errors++;
                        }
                        for (const key9 in data24) {
                          if (key9 !== "profileId" && key9 !== "generation") {
                            const err61 = {
                              instancePath:
                                instancePath +
                                "/effect/target/owner/" +
                                key9.replace(/~/g, "~0").replace(/\//g, "~1"),
                              schemaPath:
                                "/mapping/profileCommitted/properties/effect/mapping/initialSetup/properties/target/properties/owner",
                              keyword: "properties",
                              params: {
                                error: "additional",
                                additionalProperty: key9,
                              },
                              message: "must NOT have additional properties",
                            };
                            if (vErrors === null) {
                              vErrors = [err61];
                            } else {
                              vErrors.push(err61);
                            }
                            errors++;
                          }
                        }
                      }
                      if (!valid39) {
                        const err62 = {
                          instancePath: instancePath + "/effect/target/owner",
                          schemaPath:
                            "/mapping/profileCommitted/properties/effect/mapping/initialSetup/properties/target/properties/owner/properties",
                          keyword: "properties",
                          params: { type: "object", nullable: false },
                          message: "must be object",
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
                        instancePath: instancePath + "/effect/target",
                        schemaPath:
                          "/mapping/profileCommitted/properties/effect/mapping/initialSetup/properties/target/properties/owner",
                        keyword: "properties",
                        params: { error: "missing", missingProperty: "owner" },
                        message: "must have property 'owner'",
                      };
                      if (vErrors === null) {
                        vErrors = [err63];
                      } else {
                        vErrors.push(err63);
                      }
                      errors++;
                    }
                    if (data23.revision !== undefined) {
                      if (!(typeof data23.revision == "string")) {
                        const err64 = {
                          instancePath:
                            instancePath + "/effect/target/revision",
                          schemaPath:
                            "/mapping/profileCommitted/properties/effect/mapping/initialSetup/properties/target/properties/revision/type",
                          keyword: "type",
                          params: { type: "string", nullable: false },
                          message: "must be string",
                        };
                        if (vErrors === null) {
                          vErrors = [err64];
                        } else {
                          vErrors.push(err64);
                        }
                        errors++;
                      }
                    } else {
                      const err65 = {
                        instancePath: instancePath + "/effect/target",
                        schemaPath:
                          "/mapping/profileCommitted/properties/effect/mapping/initialSetup/properties/target/properties/revision",
                        keyword: "properties",
                        params: {
                          error: "missing",
                          missingProperty: "revision",
                        },
                        message: "must have property 'revision'",
                      };
                      if (vErrors === null) {
                        vErrors = [err65];
                      } else {
                        vErrors.push(err65);
                      }
                      errors++;
                    }
                    for (const key10 in data23) {
                      if (key10 !== "owner" && key10 !== "revision") {
                        const err66 = {
                          instancePath:
                            instancePath +
                            "/effect/target/" +
                            key10.replace(/~/g, "~0").replace(/\//g, "~1"),
                          schemaPath:
                            "/mapping/profileCommitted/properties/effect/mapping/initialSetup/properties/target",
                          keyword: "properties",
                          params: {
                            error: "additional",
                            additionalProperty: key10,
                          },
                          message: "must NOT have additional properties",
                        };
                        if (vErrors === null) {
                          vErrors = [err66];
                        } else {
                          vErrors.push(err66);
                        }
                        errors++;
                      }
                    }
                  }
                  if (!valid37) {
                    const err67 = {
                      instancePath: instancePath + "/effect/target",
                      schemaPath:
                        "/mapping/profileCommitted/properties/effect/mapping/initialSetup/properties/target/properties",
                      keyword: "properties",
                      params: { type: "object", nullable: false },
                      message: "must be object",
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
                    instancePath: instancePath + "/effect",
                    schemaPath:
                      "/mapping/profileCommitted/properties/effect/mapping/initialSetup/properties/target",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "target" },
                    message: "must have property 'target'",
                  };
                  if (vErrors === null) {
                    vErrors = [err68];
                  } else {
                    vErrors.push(err68);
                  }
                  errors++;
                }
                for (const key11 in data12) {
                  if (key11 !== "kind" && key11 !== "target") {
                    const err69 = {
                      instancePath:
                        instancePath +
                        "/effect/" +
                        key11.replace(/~/g, "~0").replace(/\//g, "~1"),
                      schemaPath:
                        "/mapping/profileCommitted/properties/effect/mapping/initialSetup",
                      keyword: "properties",
                      params: {
                        error: "additional",
                        additionalProperty: key11,
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
                if (!valid35) {
                  const err70 = {
                    instancePath: instancePath + "/effect",
                    schemaPath:
                      "/mapping/profileCommitted/properties/effect/mapping/initialSetup/properties",
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
                var valid34 = _errs26 === errors;
                valid13 = valid34;
              } else if (tag1 === "selection") {
                const _errs32 = errors;
                let valid45 = false;
                valid45 = true;
                if (data12.previous !== undefined) {
                  let data28 = data12.previous;
                  let valid47 = false;
                  if (
                    data28 &&
                    typeof data28 == "object" &&
                    !Array.isArray(data28)
                  ) {
                    valid47 = true;
                    if (data28.installationId !== undefined) {
                      if (!(typeof data28.installationId == "string")) {
                        const err71 = {
                          instancePath:
                            instancePath + "/effect/previous/installationId",
                          schemaPath:
                            "/mapping/profileCommitted/properties/effect/mapping/selection/properties/previous/properties/installationId/type",
                          keyword: "type",
                          params: { type: "string", nullable: false },
                          message: "must be string",
                        };
                        if (vErrors === null) {
                          vErrors = [err71];
                        } else {
                          vErrors.push(err71);
                        }
                        errors++;
                      }
                    } else {
                      const err72 = {
                        instancePath: instancePath + "/effect/previous",
                        schemaPath:
                          "/mapping/profileCommitted/properties/effect/mapping/selection/properties/previous/properties/installationId",
                        keyword: "properties",
                        params: {
                          error: "missing",
                          missingProperty: "installationId",
                        },
                        message: "must have property 'installationId'",
                      };
                      if (vErrors === null) {
                        vErrors = [err72];
                      } else {
                        vErrors.push(err72);
                      }
                      errors++;
                    }
                    if (data28.revision !== undefined) {
                      if (!(typeof data28.revision == "string")) {
                        const err73 = {
                          instancePath:
                            instancePath + "/effect/previous/revision",
                          schemaPath:
                            "/mapping/profileCommitted/properties/effect/mapping/selection/properties/previous/properties/revision/type",
                          keyword: "type",
                          params: { type: "string", nullable: false },
                          message: "must be string",
                        };
                        if (vErrors === null) {
                          vErrors = [err73];
                        } else {
                          vErrors.push(err73);
                        }
                        errors++;
                      }
                    } else {
                      const err74 = {
                        instancePath: instancePath + "/effect/previous",
                        schemaPath:
                          "/mapping/profileCommitted/properties/effect/mapping/selection/properties/previous/properties/revision",
                        keyword: "properties",
                        params: {
                          error: "missing",
                          missingProperty: "revision",
                        },
                        message: "must have property 'revision'",
                      };
                      if (vErrors === null) {
                        vErrors = [err74];
                      } else {
                        vErrors.push(err74);
                      }
                      errors++;
                    }
                    if (data28.owner !== undefined) {
                      let data31 = data28.owner;
                      let valid49 = false;
                      if (
                        data31 &&
                        typeof data31 == "object" &&
                        !Array.isArray(data31)
                      ) {
                        valid49 = true;
                        if (data31.profileId !== undefined) {
                          if (!(typeof data31.profileId == "string")) {
                            const err75 = {
                              instancePath:
                                instancePath +
                                "/effect/previous/owner/profileId",
                              schemaPath:
                                "/mapping/profileCommitted/properties/effect/mapping/selection/properties/previous/properties/owner/properties/profileId/type",
                              keyword: "type",
                              params: { type: "string", nullable: false },
                              message: "must be string",
                            };
                            if (vErrors === null) {
                              vErrors = [err75];
                            } else {
                              vErrors.push(err75);
                            }
                            errors++;
                          }
                        } else {
                          const err76 = {
                            instancePath:
                              instancePath + "/effect/previous/owner",
                            schemaPath:
                              "/mapping/profileCommitted/properties/effect/mapping/selection/properties/previous/properties/owner/properties/profileId",
                            keyword: "properties",
                            params: {
                              error: "missing",
                              missingProperty: "profileId",
                            },
                            message: "must have property 'profileId'",
                          };
                          if (vErrors === null) {
                            vErrors = [err76];
                          } else {
                            vErrors.push(err76);
                          }
                          errors++;
                        }
                        if (data31.generation !== undefined) {
                          if (!(typeof data31.generation == "string")) {
                            const err77 = {
                              instancePath:
                                instancePath +
                                "/effect/previous/owner/generation",
                              schemaPath:
                                "/mapping/profileCommitted/properties/effect/mapping/selection/properties/previous/properties/owner/properties/generation/type",
                              keyword: "type",
                              params: { type: "string", nullable: false },
                              message: "must be string",
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
                            instancePath:
                              instancePath + "/effect/previous/owner",
                            schemaPath:
                              "/mapping/profileCommitted/properties/effect/mapping/selection/properties/previous/properties/owner/properties/generation",
                            keyword: "properties",
                            params: {
                              error: "missing",
                              missingProperty: "generation",
                            },
                            message: "must have property 'generation'",
                          };
                          if (vErrors === null) {
                            vErrors = [err78];
                          } else {
                            vErrors.push(err78);
                          }
                          errors++;
                        }
                        for (const key12 in data31) {
                          if (key12 !== "profileId" && key12 !== "generation") {
                            const err79 = {
                              instancePath:
                                instancePath +
                                "/effect/previous/owner/" +
                                key12.replace(/~/g, "~0").replace(/\//g, "~1"),
                              schemaPath:
                                "/mapping/profileCommitted/properties/effect/mapping/selection/properties/previous/properties/owner",
                              keyword: "properties",
                              params: {
                                error: "additional",
                                additionalProperty: key12,
                              },
                              message: "must NOT have additional properties",
                            };
                            if (vErrors === null) {
                              vErrors = [err79];
                            } else {
                              vErrors.push(err79);
                            }
                            errors++;
                          }
                        }
                      }
                      if (!valid49) {
                        const err80 = {
                          instancePath: instancePath + "/effect/previous/owner",
                          schemaPath:
                            "/mapping/profileCommitted/properties/effect/mapping/selection/properties/previous/properties/owner/properties",
                          keyword: "properties",
                          params: { type: "object", nullable: false },
                          message: "must be object",
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
                        instancePath: instancePath + "/effect/previous",
                        schemaPath:
                          "/mapping/profileCommitted/properties/effect/mapping/selection/properties/previous/properties/owner",
                        keyword: "properties",
                        params: { error: "missing", missingProperty: "owner" },
                        message: "must have property 'owner'",
                      };
                      if (vErrors === null) {
                        vErrors = [err81];
                      } else {
                        vErrors.push(err81);
                      }
                      errors++;
                    }
                    for (const key13 in data28) {
                      if (
                        key13 !== "installationId" &&
                        key13 !== "revision" &&
                        key13 !== "owner"
                      ) {
                        const err82 = {
                          instancePath:
                            instancePath +
                            "/effect/previous/" +
                            key13.replace(/~/g, "~0").replace(/\//g, "~1"),
                          schemaPath:
                            "/mapping/profileCommitted/properties/effect/mapping/selection/properties/previous",
                          keyword: "properties",
                          params: {
                            error: "additional",
                            additionalProperty: key13,
                          },
                          message: "must NOT have additional properties",
                        };
                        if (vErrors === null) {
                          vErrors = [err82];
                        } else {
                          vErrors.push(err82);
                        }
                        errors++;
                      }
                    }
                  }
                  if (!valid47) {
                    const err83 = {
                      instancePath: instancePath + "/effect/previous",
                      schemaPath:
                        "/mapping/profileCommitted/properties/effect/mapping/selection/properties/previous/properties",
                      keyword: "properties",
                      params: { type: "object", nullable: false },
                      message: "must be object",
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
                    instancePath: instancePath + "/effect",
                    schemaPath:
                      "/mapping/profileCommitted/properties/effect/mapping/selection/properties/previous",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "previous" },
                    message: "must have property 'previous'",
                  };
                  if (vErrors === null) {
                    vErrors = [err84];
                  } else {
                    vErrors.push(err84);
                  }
                  errors++;
                }
                for (const key14 in data12) {
                  if (key14 !== "kind" && key14 !== "previous") {
                    const err85 = {
                      instancePath:
                        instancePath +
                        "/effect/" +
                        key14.replace(/~/g, "~0").replace(/\//g, "~1"),
                      schemaPath:
                        "/mapping/profileCommitted/properties/effect/mapping/selection",
                      keyword: "properties",
                      params: {
                        error: "additional",
                        additionalProperty: key14,
                      },
                      message: "must NOT have additional properties",
                    };
                    if (vErrors === null) {
                      vErrors = [err85];
                    } else {
                      vErrors.push(err85);
                    }
                    errors++;
                  }
                }
                if (!valid45) {
                  const err86 = {
                    instancePath: instancePath + "/effect",
                    schemaPath:
                      "/mapping/profileCommitted/properties/effect/mapping/selection/properties",
                    keyword: "properties",
                    params: { type: "object", nullable: false },
                    message: "must be object",
                  };
                  if (vErrors === null) {
                    vErrors = [err86];
                  } else {
                    vErrors.push(err86);
                  }
                  errors++;
                }
                var valid44 = _errs32 === errors;
                valid13 = valid44;
              } else if (tag1 === "preparation") {
                const _errs39 = errors;
                let valid55 = false;
                valid55 = true;
                if (data12.hash !== undefined) {
                  if (!(typeof data12.hash == "string")) {
                    const err87 = {
                      instancePath: instancePath + "/effect/hash",
                      schemaPath:
                        "/mapping/profileCommitted/properties/effect/mapping/preparation/properties/hash/type",
                      keyword: "type",
                      params: { type: "string", nullable: false },
                      message: "must be string",
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
                    instancePath: instancePath + "/effect",
                    schemaPath:
                      "/mapping/profileCommitted/properties/effect/mapping/preparation/properties/hash",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "hash" },
                    message: "must have property 'hash'",
                  };
                  if (vErrors === null) {
                    vErrors = [err88];
                  } else {
                    vErrors.push(err88);
                  }
                  errors++;
                }
                for (const key15 in data12) {
                  if (key15 !== "kind" && key15 !== "hash") {
                    const err89 = {
                      instancePath:
                        instancePath +
                        "/effect/" +
                        key15.replace(/~/g, "~0").replace(/\//g, "~1"),
                      schemaPath:
                        "/mapping/profileCommitted/properties/effect/mapping/preparation",
                      keyword: "properties",
                      params: {
                        error: "additional",
                        additionalProperty: key15,
                      },
                      message: "must NOT have additional properties",
                    };
                    if (vErrors === null) {
                      vErrors = [err89];
                    } else {
                      vErrors.push(err89);
                    }
                    errors++;
                  }
                }
                if (!valid55) {
                  const err90 = {
                    instancePath: instancePath + "/effect",
                    schemaPath:
                      "/mapping/profileCommitted/properties/effect/mapping/preparation/properties",
                    keyword: "properties",
                    params: { type: "object", nullable: false },
                    message: "must be object",
                  };
                  if (vErrors === null) {
                    vErrors = [err90];
                  } else {
                    vErrors.push(err90);
                  }
                  errors++;
                }
                var valid54 = _errs39 === errors;
                valid13 = valid54;
              } else {
                const err91 = {
                  instancePath: instancePath + "/effect/kind",
                  schemaPath:
                    "/mapping/profileCommitted/properties/effect/mapping",
                  keyword: "discriminator",
                  params: { error: "mapping", tag: "kind", tagValue: tag1 },
                  message: 'value of tag "kind" must be in mapping',
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
                instancePath: instancePath + "/effect/kind",
                schemaPath:
                  "/mapping/profileCommitted/properties/effect/discriminator",
                keyword: "discriminator",
                params: { error: "tag", tag: "kind", tagValue: tag1 },
                message: 'tag "kind" must be string',
              };
              if (vErrors === null) {
                vErrors = [err92];
              } else {
                vErrors.push(err92);
              }
              errors++;
            }
          } else if (!valid13) {
            const err93 = {
              instancePath: instancePath + "/effect",
              schemaPath:
                "/mapping/profileCommitted/properties/effect/discriminator",
              keyword: "discriminator",
              params: { type: "object", nullable: false },
              message: "must be object",
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
            instancePath,
            schemaPath: "/mapping/profileCommitted/properties/effect",
            keyword: "properties",
            params: { error: "missing", missingProperty: "effect" },
            message: "must have property 'effect'",
          };
          if (vErrors === null) {
            vErrors = [err94];
          } else {
            vErrors.push(err94);
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
            const err95 = {
              instancePath:
                instancePath +
                "/" +
                key16.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/profileCommitted",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key16 },
              message: "must NOT have additional properties",
            };
            if (vErrors === null) {
              vErrors = [err95];
            } else {
              vErrors.push(err95);
            }
            errors++;
          }
        }
        if (!valid2) {
          const err96 = {
            instancePath,
            schemaPath: "/mapping/profileCommitted/properties",
            keyword: "properties",
            params: { type: "object", nullable: false },
            message: "must be object",
          };
          if (vErrors === null) {
            vErrors = [err96];
          } else {
            vErrors.push(err96);
          }
          errors++;
        }
        var valid1 = _errs0 === errors;
        valid0 = valid1;
      } else if (tag0 === "rejected") {
        const _errs41 = errors;
        let valid60 = false;
        valid60 = true;
        if (data.code !== undefined) {
          if (!(typeof data.code == "string")) {
            const err97 = {
              instancePath: instancePath + "/code",
              schemaPath: "/mapping/rejected/properties/code/type",
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
            instancePath,
            schemaPath: "/mapping/rejected/properties/code",
            keyword: "properties",
            params: { error: "missing", missingProperty: "code" },
            message: "must have property 'code'",
          };
          if (vErrors === null) {
            vErrors = [err98];
          } else {
            vErrors.push(err98);
          }
          errors++;
        }
        if (data.message !== undefined) {
          if (!(typeof data.message == "string")) {
            const err99 = {
              instancePath: instancePath + "/message",
              schemaPath: "/mapping/rejected/properties/message/type",
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
            instancePath,
            schemaPath: "/mapping/rejected/properties/message",
            keyword: "properties",
            params: { error: "missing", missingProperty: "message" },
            message: "must have property 'message'",
          };
          if (vErrors === null) {
            vErrors = [err100];
          } else {
            vErrors.push(err100);
          }
          errors++;
        }
        for (const key17 in data) {
          if (key17 !== "kind" && key17 !== "code" && key17 !== "message") {
            const err101 = {
              instancePath:
                instancePath +
                "/" +
                key17.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/rejected",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key17 },
              message: "must NOT have additional properties",
            };
            if (vErrors === null) {
              vErrors = [err101];
            } else {
              vErrors.push(err101);
            }
            errors++;
          }
        }
        if (!valid60) {
          const err102 = {
            instancePath,
            schemaPath: "/mapping/rejected/properties",
            keyword: "properties",
            params: { type: "object", nullable: false },
            message: "must be object",
          };
          if (vErrors === null) {
            vErrors = [err102];
          } else {
            vErrors.push(err102);
          }
          errors++;
        }
        var valid59 = _errs41 === errors;
        valid0 = valid59;
      } else {
        const err103 = {
          instancePath: instancePath + "/kind",
          schemaPath: "/mapping",
          keyword: "discriminator",
          params: { error: "mapping", tag: "kind", tagValue: tag0 },
          message: 'value of tag "kind" must be in mapping',
        };
        if (vErrors === null) {
          vErrors = [err103];
        } else {
          vErrors.push(err103);
        }
        errors++;
      }
    } else {
      const err104 = {
        instancePath: instancePath + "/kind",
        schemaPath: "/discriminator",
        keyword: "discriminator",
        params: { error: "tag", tag: "kind", tagValue: tag0 },
        message: 'tag "kind" must be string',
      };
      if (vErrors === null) {
        vErrors = [err104];
      } else {
        vErrors.push(err104);
      }
      errors++;
    }
  } else if (!valid0) {
    const err105 = {
      instancePath,
      schemaPath: "/discriminator",
      keyword: "discriminator",
      params: { type: "object", nullable: false },
      message: "must be object",
    };
    if (vErrors === null) {
      vErrors = [err105];
    } else {
      vErrors.push(err105);
    }
    errors++;
  }
  validate64.errors = vErrors;
  return errors === 0;
}
export const validateSelectedWorkerRequest = validate65;
const schema37 = {
  discriminator: "kind",
  mapping: {
    openRecovery: {
      properties: { id: { type: "string" }, content: {}, opening: {} },
    },
    readDirectory: { properties: { id: { type: "string" } } },
    read: {
      properties: {
        id: { type: "string" },
        input: {
          properties: {
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
            target: {
              discriminator: "kind",
              mapping: {
                cursor: { properties: {} },
                accepted: { properties: { receipt: {} } },
              },
            },
          },
        },
      },
    },
    readWork: {
      properties: {
        id: { type: "string" },
        input: {
          properties: {
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
            runId: { type: "string" },
          },
        },
      },
    },
    readInk: {
      properties: {
        id: { type: "string" },
        input: {
          properties: {
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
            token: {},
          },
        },
      },
    },
    readPracticeControls: {
      properties: {
        id: { type: "string" },
        input: {
          properties: {
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
            binding: {},
          },
        },
      },
    },
    execute: {
      properties: {
        id: { type: "string" },
        operation: {
          discriminator: "kind",
          mapping: {
            teaching: {
              properties: {
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
                command: {},
              },
            },
            ink: {
              properties: {
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
                command: {},
              },
            },
          },
        },
      },
    },
    administer: { properties: { id: { type: "string" }, command: {} } },
    readDeparture: {
      properties: {
        id: { type: "string" },
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
      },
    },
    recoverInk: {
      properties: {
        id: { type: "string" },
        recoveryId: { type: "string" },
        operation: {
          discriminator: "kind",
          mapping: {
            teaching: {
              properties: {
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
                command: {},
              },
            },
            ink: {
              properties: {
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
                command: {},
              },
            },
          },
        },
      },
    },
    recoverTeaching: {
      properties: {
        id: { type: "string" },
        recoveryId: { type: "string" },
        operation: {
          discriminator: "kind",
          mapping: {
            teaching: {
              properties: {
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
                command: {},
              },
            },
            ink: {
              properties: {
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
                command: {},
              },
            },
          },
        },
      },
    },
    recoverAdministration: {
      properties: {
        id: { type: "string" },
        recoveryId: { type: "string" },
        command: {},
      },
    },
    reconcileRecovery: {
      properties: {
        id: { type: "string" },
        recoveryId: { type: "string" },
        choice: {},
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
      if (tag0 === "openRecovery") {
        const _errs0 = errors;
        let valid2 = false;
        valid2 = true;
        if (data.id !== undefined) {
          if (!(typeof data.id == "string")) {
            const err1 = {
              instancePath: instancePath + "/id",
              schemaPath: "/mapping/openRecovery/properties/id/type",
              keyword: "type",
              params: { type: "string", nullable: false },
              message: "must be string",
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
            schemaPath: "/mapping/openRecovery/properties/id",
            keyword: "properties",
            params: { error: "missing", missingProperty: "id" },
            message: "must have property 'id'",
          };
          if (vErrors === null) {
            vErrors = [err2];
          } else {
            vErrors.push(err2);
          }
          errors++;
        }
        for (const key0 in data) {
          if (
            key0 !== "kind" &&
            key0 !== "id" &&
            key0 !== "content" &&
            key0 !== "opening"
          ) {
            const err3 = {
              instancePath:
                instancePath +
                "/" +
                key0.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/openRecovery",
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
            schemaPath: "/mapping/openRecovery/properties",
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
      } else if (tag0 === "readDirectory") {
        const _errs2 = errors;
        let valid6 = false;
        valid6 = true;
        if (data.id !== undefined) {
          if (!(typeof data.id == "string")) {
            const err5 = {
              instancePath: instancePath + "/id",
              schemaPath: "/mapping/readDirectory/properties/id/type",
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
            schemaPath: "/mapping/readDirectory/properties/id",
            keyword: "properties",
            params: { error: "missing", missingProperty: "id" },
            message: "must have property 'id'",
          };
          if (vErrors === null) {
            vErrors = [err6];
          } else {
            vErrors.push(err6);
          }
          errors++;
        }
        for (const key1 in data) {
          if (key1 !== "kind" && key1 !== "id") {
            const err7 = {
              instancePath:
                instancePath +
                "/" +
                key1.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/readDirectory",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key1 },
              message: "must NOT have additional properties",
            };
            if (vErrors === null) {
              vErrors = [err7];
            } else {
              vErrors.push(err7);
            }
            errors++;
          }
        }
        if (!valid6) {
          const err8 = {
            instancePath,
            schemaPath: "/mapping/readDirectory/properties",
            keyword: "properties",
            params: { type: "object", nullable: false },
            message: "must be object",
          };
          if (vErrors === null) {
            vErrors = [err8];
          } else {
            vErrors.push(err8);
          }
          errors++;
        }
        var valid5 = _errs2 === errors;
        valid0 = valid5;
      } else if (tag0 === "read") {
        const _errs4 = errors;
        let valid10 = false;
        valid10 = true;
        if (data.id !== undefined) {
          if (!(typeof data.id == "string")) {
            const err9 = {
              instancePath: instancePath + "/id",
              schemaPath: "/mapping/read/properties/id/type",
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
            schemaPath: "/mapping/read/properties/id",
            keyword: "properties",
            params: { error: "missing", missingProperty: "id" },
            message: "must have property 'id'",
          };
          if (vErrors === null) {
            vErrors = [err10];
          } else {
            vErrors.push(err10);
          }
          errors++;
        }
        if (data.input !== undefined) {
          let data3 = data.input;
          let valid12 = false;
          if (data3 && typeof data3 == "object" && !Array.isArray(data3)) {
            valid12 = true;
            if (data3.selection !== undefined) {
              let data4 = data3.selection;
              let valid14 = false;
              if (data4 && typeof data4 == "object" && !Array.isArray(data4)) {
                valid14 = true;
                if (data4.installationId !== undefined) {
                  if (!(typeof data4.installationId == "string")) {
                    const err11 = {
                      instancePath:
                        instancePath + "/input/selection/installationId",
                      schemaPath:
                        "/mapping/read/properties/input/properties/selection/properties/installationId/type",
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
                    instancePath: instancePath + "/input/selection",
                    schemaPath:
                      "/mapping/read/properties/input/properties/selection/properties/installationId",
                    keyword: "properties",
                    params: {
                      error: "missing",
                      missingProperty: "installationId",
                    },
                    message: "must have property 'installationId'",
                  };
                  if (vErrors === null) {
                    vErrors = [err12];
                  } else {
                    vErrors.push(err12);
                  }
                  errors++;
                }
                if (data4.revision !== undefined) {
                  if (!(typeof data4.revision == "string")) {
                    const err13 = {
                      instancePath: instancePath + "/input/selection/revision",
                      schemaPath:
                        "/mapping/read/properties/input/properties/selection/properties/revision/type",
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
                    instancePath: instancePath + "/input/selection",
                    schemaPath:
                      "/mapping/read/properties/input/properties/selection/properties/revision",
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
                if (data4.owner !== undefined) {
                  let data7 = data4.owner;
                  let valid16 = false;
                  if (
                    data7 &&
                    typeof data7 == "object" &&
                    !Array.isArray(data7)
                  ) {
                    valid16 = true;
                    if (data7.profileId !== undefined) {
                      if (!(typeof data7.profileId == "string")) {
                        const err15 = {
                          instancePath:
                            instancePath + "/input/selection/owner/profileId",
                          schemaPath:
                            "/mapping/read/properties/input/properties/selection/properties/owner/properties/profileId/type",
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
                        instancePath: instancePath + "/input/selection/owner",
                        schemaPath:
                          "/mapping/read/properties/input/properties/selection/properties/owner/properties/profileId",
                        keyword: "properties",
                        params: {
                          error: "missing",
                          missingProperty: "profileId",
                        },
                        message: "must have property 'profileId'",
                      };
                      if (vErrors === null) {
                        vErrors = [err16];
                      } else {
                        vErrors.push(err16);
                      }
                      errors++;
                    }
                    if (data7.generation !== undefined) {
                      if (!(typeof data7.generation == "string")) {
                        const err17 = {
                          instancePath:
                            instancePath + "/input/selection/owner/generation",
                          schemaPath:
                            "/mapping/read/properties/input/properties/selection/properties/owner/properties/generation/type",
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
                        instancePath: instancePath + "/input/selection/owner",
                        schemaPath:
                          "/mapping/read/properties/input/properties/selection/properties/owner/properties/generation",
                        keyword: "properties",
                        params: {
                          error: "missing",
                          missingProperty: "generation",
                        },
                        message: "must have property 'generation'",
                      };
                      if (vErrors === null) {
                        vErrors = [err18];
                      } else {
                        vErrors.push(err18);
                      }
                      errors++;
                    }
                    for (const key2 in data7) {
                      if (key2 !== "profileId" && key2 !== "generation") {
                        const err19 = {
                          instancePath:
                            instancePath +
                            "/input/selection/owner/" +
                            key2.replace(/~/g, "~0").replace(/\//g, "~1"),
                          schemaPath:
                            "/mapping/read/properties/input/properties/selection/properties/owner",
                          keyword: "properties",
                          params: {
                            error: "additional",
                            additionalProperty: key2,
                          },
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
                  if (!valid16) {
                    const err20 = {
                      instancePath: instancePath + "/input/selection/owner",
                      schemaPath:
                        "/mapping/read/properties/input/properties/selection/properties/owner/properties",
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
                    instancePath: instancePath + "/input/selection",
                    schemaPath:
                      "/mapping/read/properties/input/properties/selection/properties/owner",
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
                for (const key3 in data4) {
                  if (
                    key3 !== "installationId" &&
                    key3 !== "revision" &&
                    key3 !== "owner"
                  ) {
                    const err22 = {
                      instancePath:
                        instancePath +
                        "/input/selection/" +
                        key3.replace(/~/g, "~0").replace(/\//g, "~1"),
                      schemaPath:
                        "/mapping/read/properties/input/properties/selection",
                      keyword: "properties",
                      params: { error: "additional", additionalProperty: key3 },
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
              if (!valid14) {
                const err23 = {
                  instancePath: instancePath + "/input/selection",
                  schemaPath:
                    "/mapping/read/properties/input/properties/selection/properties",
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
                instancePath: instancePath + "/input",
                schemaPath:
                  "/mapping/read/properties/input/properties/selection",
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
            if (data3.target !== undefined) {
              let data10 = data3.target;
              let valid20 = false;
              if (
                data10 &&
                typeof data10 == "object" &&
                !Array.isArray(data10)
              ) {
                const tag1 = data10.kind;
                if (tag1 === undefined) {
                  const err25 = {
                    instancePath: instancePath + "/input/target",
                    schemaPath:
                      "/mapping/read/properties/input/properties/target/discriminator",
                    keyword: "discriminator",
                    params: { error: "tag", tag: "kind", tagValue: tag1 },
                    message: 'tag "kind" must be string',
                  };
                  if (vErrors === null) {
                    vErrors = [err25];
                  } else {
                    vErrors.push(err25);
                  }
                  errors++;
                } else if (typeof tag1 == "string") {
                  if (tag1 === "cursor") {
                    const _errs14 = errors;
                    let valid22 = false;
                    valid22 = true;
                    for (const key4 in data10) {
                      if (key4 !== "kind") {
                        const err26 = {
                          instancePath:
                            instancePath +
                            "/input/target/" +
                            key4.replace(/~/g, "~0").replace(/\//g, "~1"),
                          schemaPath:
                            "/mapping/read/properties/input/properties/target/mapping/cursor",
                          keyword: "properties",
                          params: {
                            error: "additional",
                            additionalProperty: key4,
                          },
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
                    if (!valid22) {
                      const err27 = {
                        instancePath: instancePath + "/input/target",
                        schemaPath:
                          "/mapping/read/properties/input/properties/target/mapping/cursor/properties",
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
                    var valid21 = _errs14 === errors;
                    valid20 = valid21;
                  } else if (tag1 === "accepted") {
                    const _errs15 = errors;
                    let valid26 = false;
                    valid26 = true;
                    for (const key5 in data10) {
                      if (key5 !== "kind" && key5 !== "receipt") {
                        const err28 = {
                          instancePath:
                            instancePath +
                            "/input/target/" +
                            key5.replace(/~/g, "~0").replace(/\//g, "~1"),
                          schemaPath:
                            "/mapping/read/properties/input/properties/target/mapping/accepted",
                          keyword: "properties",
                          params: {
                            error: "additional",
                            additionalProperty: key5,
                          },
                          message: "must NOT have additional properties",
                        };
                        if (vErrors === null) {
                          vErrors = [err28];
                        } else {
                          vErrors.push(err28);
                        }
                        errors++;
                      }
                    }
                    if (!valid26) {
                      const err29 = {
                        instancePath: instancePath + "/input/target",
                        schemaPath:
                          "/mapping/read/properties/input/properties/target/mapping/accepted/properties",
                        keyword: "properties",
                        params: { type: "object", nullable: false },
                        message: "must be object",
                      };
                      if (vErrors === null) {
                        vErrors = [err29];
                      } else {
                        vErrors.push(err29);
                      }
                      errors++;
                    }
                    var valid25 = _errs15 === errors;
                    valid20 = valid25;
                  } else {
                    const err30 = {
                      instancePath: instancePath + "/input/target/kind",
                      schemaPath:
                        "/mapping/read/properties/input/properties/target/mapping",
                      keyword: "discriminator",
                      params: { error: "mapping", tag: "kind", tagValue: tag1 },
                      message: 'value of tag "kind" must be in mapping',
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
                    instancePath: instancePath + "/input/target/kind",
                    schemaPath:
                      "/mapping/read/properties/input/properties/target/discriminator",
                    keyword: "discriminator",
                    params: { error: "tag", tag: "kind", tagValue: tag1 },
                    message: 'tag "kind" must be string',
                  };
                  if (vErrors === null) {
                    vErrors = [err31];
                  } else {
                    vErrors.push(err31);
                  }
                  errors++;
                }
              } else if (!valid20) {
                const err32 = {
                  instancePath: instancePath + "/input/target",
                  schemaPath:
                    "/mapping/read/properties/input/properties/target/discriminator",
                  keyword: "discriminator",
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
            } else {
              const err33 = {
                instancePath: instancePath + "/input",
                schemaPath: "/mapping/read/properties/input/properties/target",
                keyword: "properties",
                params: { error: "missing", missingProperty: "target" },
                message: "must have property 'target'",
              };
              if (vErrors === null) {
                vErrors = [err33];
              } else {
                vErrors.push(err33);
              }
              errors++;
            }
            for (const key6 in data3) {
              if (key6 !== "selection" && key6 !== "target") {
                const err34 = {
                  instancePath:
                    instancePath +
                    "/input/" +
                    key6.replace(/~/g, "~0").replace(/\//g, "~1"),
                  schemaPath: "/mapping/read/properties/input",
                  keyword: "properties",
                  params: { error: "additional", additionalProperty: key6 },
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
          if (!valid12) {
            const err35 = {
              instancePath: instancePath + "/input",
              schemaPath: "/mapping/read/properties/input/properties",
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
            instancePath,
            schemaPath: "/mapping/read/properties/input",
            keyword: "properties",
            params: { error: "missing", missingProperty: "input" },
            message: "must have property 'input'",
          };
          if (vErrors === null) {
            vErrors = [err36];
          } else {
            vErrors.push(err36);
          }
          errors++;
        }
        for (const key7 in data) {
          if (key7 !== "kind" && key7 !== "id" && key7 !== "input") {
            const err37 = {
              instancePath:
                instancePath +
                "/" +
                key7.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/read",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key7 },
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
            schemaPath: "/mapping/read/properties",
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
        var valid9 = _errs4 === errors;
        valid0 = valid9;
      } else if (tag0 === "readWork") {
        const _errs16 = errors;
        let valid32 = false;
        valid32 = true;
        if (data.id !== undefined) {
          if (!(typeof data.id == "string")) {
            const err39 = {
              instancePath: instancePath + "/id",
              schemaPath: "/mapping/readWork/properties/id/type",
              keyword: "type",
              params: { type: "string", nullable: false },
              message: "must be string",
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
            schemaPath: "/mapping/readWork/properties/id",
            keyword: "properties",
            params: { error: "missing", missingProperty: "id" },
            message: "must have property 'id'",
          };
          if (vErrors === null) {
            vErrors = [err40];
          } else {
            vErrors.push(err40);
          }
          errors++;
        }
        if (data.input !== undefined) {
          let data12 = data.input;
          let valid34 = false;
          if (data12 && typeof data12 == "object" && !Array.isArray(data12)) {
            valid34 = true;
            if (data12.selection !== undefined) {
              let data13 = data12.selection;
              let valid36 = false;
              if (
                data13 &&
                typeof data13 == "object" &&
                !Array.isArray(data13)
              ) {
                valid36 = true;
                if (data13.installationId !== undefined) {
                  if (!(typeof data13.installationId == "string")) {
                    const err41 = {
                      instancePath:
                        instancePath + "/input/selection/installationId",
                      schemaPath:
                        "/mapping/readWork/properties/input/properties/selection/properties/installationId/type",
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
                    instancePath: instancePath + "/input/selection",
                    schemaPath:
                      "/mapping/readWork/properties/input/properties/selection/properties/installationId",
                    keyword: "properties",
                    params: {
                      error: "missing",
                      missingProperty: "installationId",
                    },
                    message: "must have property 'installationId'",
                  };
                  if (vErrors === null) {
                    vErrors = [err42];
                  } else {
                    vErrors.push(err42);
                  }
                  errors++;
                }
                if (data13.revision !== undefined) {
                  if (!(typeof data13.revision == "string")) {
                    const err43 = {
                      instancePath: instancePath + "/input/selection/revision",
                      schemaPath:
                        "/mapping/readWork/properties/input/properties/selection/properties/revision/type",
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
                    instancePath: instancePath + "/input/selection",
                    schemaPath:
                      "/mapping/readWork/properties/input/properties/selection/properties/revision",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "revision" },
                    message: "must have property 'revision'",
                  };
                  if (vErrors === null) {
                    vErrors = [err44];
                  } else {
                    vErrors.push(err44);
                  }
                  errors++;
                }
                if (data13.owner !== undefined) {
                  let data16 = data13.owner;
                  let valid38 = false;
                  if (
                    data16 &&
                    typeof data16 == "object" &&
                    !Array.isArray(data16)
                  ) {
                    valid38 = true;
                    if (data16.profileId !== undefined) {
                      if (!(typeof data16.profileId == "string")) {
                        const err45 = {
                          instancePath:
                            instancePath + "/input/selection/owner/profileId",
                          schemaPath:
                            "/mapping/readWork/properties/input/properties/selection/properties/owner/properties/profileId/type",
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
                        instancePath: instancePath + "/input/selection/owner",
                        schemaPath:
                          "/mapping/readWork/properties/input/properties/selection/properties/owner/properties/profileId",
                        keyword: "properties",
                        params: {
                          error: "missing",
                          missingProperty: "profileId",
                        },
                        message: "must have property 'profileId'",
                      };
                      if (vErrors === null) {
                        vErrors = [err46];
                      } else {
                        vErrors.push(err46);
                      }
                      errors++;
                    }
                    if (data16.generation !== undefined) {
                      if (!(typeof data16.generation == "string")) {
                        const err47 = {
                          instancePath:
                            instancePath + "/input/selection/owner/generation",
                          schemaPath:
                            "/mapping/readWork/properties/input/properties/selection/properties/owner/properties/generation/type",
                          keyword: "type",
                          params: { type: "string", nullable: false },
                          message: "must be string",
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
                        instancePath: instancePath + "/input/selection/owner",
                        schemaPath:
                          "/mapping/readWork/properties/input/properties/selection/properties/owner/properties/generation",
                        keyword: "properties",
                        params: {
                          error: "missing",
                          missingProperty: "generation",
                        },
                        message: "must have property 'generation'",
                      };
                      if (vErrors === null) {
                        vErrors = [err48];
                      } else {
                        vErrors.push(err48);
                      }
                      errors++;
                    }
                    for (const key8 in data16) {
                      if (key8 !== "profileId" && key8 !== "generation") {
                        const err49 = {
                          instancePath:
                            instancePath +
                            "/input/selection/owner/" +
                            key8.replace(/~/g, "~0").replace(/\//g, "~1"),
                          schemaPath:
                            "/mapping/readWork/properties/input/properties/selection/properties/owner",
                          keyword: "properties",
                          params: {
                            error: "additional",
                            additionalProperty: key8,
                          },
                          message: "must NOT have additional properties",
                        };
                        if (vErrors === null) {
                          vErrors = [err49];
                        } else {
                          vErrors.push(err49);
                        }
                        errors++;
                      }
                    }
                  }
                  if (!valid38) {
                    const err50 = {
                      instancePath: instancePath + "/input/selection/owner",
                      schemaPath:
                        "/mapping/readWork/properties/input/properties/selection/properties/owner/properties",
                      keyword: "properties",
                      params: { type: "object", nullable: false },
                      message: "must be object",
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
                    instancePath: instancePath + "/input/selection",
                    schemaPath:
                      "/mapping/readWork/properties/input/properties/selection/properties/owner",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "owner" },
                    message: "must have property 'owner'",
                  };
                  if (vErrors === null) {
                    vErrors = [err51];
                  } else {
                    vErrors.push(err51);
                  }
                  errors++;
                }
                for (const key9 in data13) {
                  if (
                    key9 !== "installationId" &&
                    key9 !== "revision" &&
                    key9 !== "owner"
                  ) {
                    const err52 = {
                      instancePath:
                        instancePath +
                        "/input/selection/" +
                        key9.replace(/~/g, "~0").replace(/\//g, "~1"),
                      schemaPath:
                        "/mapping/readWork/properties/input/properties/selection",
                      keyword: "properties",
                      params: { error: "additional", additionalProperty: key9 },
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
              if (!valid36) {
                const err53 = {
                  instancePath: instancePath + "/input/selection",
                  schemaPath:
                    "/mapping/readWork/properties/input/properties/selection/properties",
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
            } else {
              const err54 = {
                instancePath: instancePath + "/input",
                schemaPath:
                  "/mapping/readWork/properties/input/properties/selection",
                keyword: "properties",
                params: { error: "missing", missingProperty: "selection" },
                message: "must have property 'selection'",
              };
              if (vErrors === null) {
                vErrors = [err54];
              } else {
                vErrors.push(err54);
              }
              errors++;
            }
            if (data12.runId !== undefined) {
              if (!(typeof data12.runId == "string")) {
                const err55 = {
                  instancePath: instancePath + "/input/runId",
                  schemaPath:
                    "/mapping/readWork/properties/input/properties/runId/type",
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
                instancePath: instancePath + "/input",
                schemaPath:
                  "/mapping/readWork/properties/input/properties/runId",
                keyword: "properties",
                params: { error: "missing", missingProperty: "runId" },
                message: "must have property 'runId'",
              };
              if (vErrors === null) {
                vErrors = [err56];
              } else {
                vErrors.push(err56);
              }
              errors++;
            }
            for (const key10 in data12) {
              if (key10 !== "selection" && key10 !== "runId") {
                const err57 = {
                  instancePath:
                    instancePath +
                    "/input/" +
                    key10.replace(/~/g, "~0").replace(/\//g, "~1"),
                  schemaPath: "/mapping/readWork/properties/input",
                  keyword: "properties",
                  params: { error: "additional", additionalProperty: key10 },
                  message: "must NOT have additional properties",
                };
                if (vErrors === null) {
                  vErrors = [err57];
                } else {
                  vErrors.push(err57);
                }
                errors++;
              }
            }
          }
          if (!valid34) {
            const err58 = {
              instancePath: instancePath + "/input",
              schemaPath: "/mapping/readWork/properties/input/properties",
              keyword: "properties",
              params: { type: "object", nullable: false },
              message: "must be object",
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
            instancePath,
            schemaPath: "/mapping/readWork/properties/input",
            keyword: "properties",
            params: { error: "missing", missingProperty: "input" },
            message: "must have property 'input'",
          };
          if (vErrors === null) {
            vErrors = [err59];
          } else {
            vErrors.push(err59);
          }
          errors++;
        }
        for (const key11 in data) {
          if (key11 !== "kind" && key11 !== "id" && key11 !== "input") {
            const err60 = {
              instancePath:
                instancePath +
                "/" +
                key11.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/readWork",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key11 },
              message: "must NOT have additional properties",
            };
            if (vErrors === null) {
              vErrors = [err60];
            } else {
              vErrors.push(err60);
            }
            errors++;
          }
        }
        if (!valid32) {
          const err61 = {
            instancePath,
            schemaPath: "/mapping/readWork/properties",
            keyword: "properties",
            params: { type: "object", nullable: false },
            message: "must be object",
          };
          if (vErrors === null) {
            vErrors = [err61];
          } else {
            vErrors.push(err61);
          }
          errors++;
        }
        var valid31 = _errs16 === errors;
        valid0 = valid31;
      } else if (tag0 === "readInk") {
        const _errs26 = errors;
        let valid45 = false;
        valid45 = true;
        if (data.id !== undefined) {
          if (!(typeof data.id == "string")) {
            const err62 = {
              instancePath: instancePath + "/id",
              schemaPath: "/mapping/readInk/properties/id/type",
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
            instancePath,
            schemaPath: "/mapping/readInk/properties/id",
            keyword: "properties",
            params: { error: "missing", missingProperty: "id" },
            message: "must have property 'id'",
          };
          if (vErrors === null) {
            vErrors = [err63];
          } else {
            vErrors.push(err63);
          }
          errors++;
        }
        if (data.input !== undefined) {
          let data21 = data.input;
          let valid47 = false;
          if (data21 && typeof data21 == "object" && !Array.isArray(data21)) {
            valid47 = true;
            if (data21.selection !== undefined) {
              let data22 = data21.selection;
              let valid49 = false;
              if (
                data22 &&
                typeof data22 == "object" &&
                !Array.isArray(data22)
              ) {
                valid49 = true;
                if (data22.installationId !== undefined) {
                  if (!(typeof data22.installationId == "string")) {
                    const err64 = {
                      instancePath:
                        instancePath + "/input/selection/installationId",
                      schemaPath:
                        "/mapping/readInk/properties/input/properties/selection/properties/installationId/type",
                      keyword: "type",
                      params: { type: "string", nullable: false },
                      message: "must be string",
                    };
                    if (vErrors === null) {
                      vErrors = [err64];
                    } else {
                      vErrors.push(err64);
                    }
                    errors++;
                  }
                } else {
                  const err65 = {
                    instancePath: instancePath + "/input/selection",
                    schemaPath:
                      "/mapping/readInk/properties/input/properties/selection/properties/installationId",
                    keyword: "properties",
                    params: {
                      error: "missing",
                      missingProperty: "installationId",
                    },
                    message: "must have property 'installationId'",
                  };
                  if (vErrors === null) {
                    vErrors = [err65];
                  } else {
                    vErrors.push(err65);
                  }
                  errors++;
                }
                if (data22.revision !== undefined) {
                  if (!(typeof data22.revision == "string")) {
                    const err66 = {
                      instancePath: instancePath + "/input/selection/revision",
                      schemaPath:
                        "/mapping/readInk/properties/input/properties/selection/properties/revision/type",
                      keyword: "type",
                      params: { type: "string", nullable: false },
                      message: "must be string",
                    };
                    if (vErrors === null) {
                      vErrors = [err66];
                    } else {
                      vErrors.push(err66);
                    }
                    errors++;
                  }
                } else {
                  const err67 = {
                    instancePath: instancePath + "/input/selection",
                    schemaPath:
                      "/mapping/readInk/properties/input/properties/selection/properties/revision",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "revision" },
                    message: "must have property 'revision'",
                  };
                  if (vErrors === null) {
                    vErrors = [err67];
                  } else {
                    vErrors.push(err67);
                  }
                  errors++;
                }
                if (data22.owner !== undefined) {
                  let data25 = data22.owner;
                  let valid51 = false;
                  if (
                    data25 &&
                    typeof data25 == "object" &&
                    !Array.isArray(data25)
                  ) {
                    valid51 = true;
                    if (data25.profileId !== undefined) {
                      if (!(typeof data25.profileId == "string")) {
                        const err68 = {
                          instancePath:
                            instancePath + "/input/selection/owner/profileId",
                          schemaPath:
                            "/mapping/readInk/properties/input/properties/selection/properties/owner/properties/profileId/type",
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
                        instancePath: instancePath + "/input/selection/owner",
                        schemaPath:
                          "/mapping/readInk/properties/input/properties/selection/properties/owner/properties/profileId",
                        keyword: "properties",
                        params: {
                          error: "missing",
                          missingProperty: "profileId",
                        },
                        message: "must have property 'profileId'",
                      };
                      if (vErrors === null) {
                        vErrors = [err69];
                      } else {
                        vErrors.push(err69);
                      }
                      errors++;
                    }
                    if (data25.generation !== undefined) {
                      if (!(typeof data25.generation == "string")) {
                        const err70 = {
                          instancePath:
                            instancePath + "/input/selection/owner/generation",
                          schemaPath:
                            "/mapping/readInk/properties/input/properties/selection/properties/owner/properties/generation/type",
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
                        instancePath: instancePath + "/input/selection/owner",
                        schemaPath:
                          "/mapping/readInk/properties/input/properties/selection/properties/owner/properties/generation",
                        keyword: "properties",
                        params: {
                          error: "missing",
                          missingProperty: "generation",
                        },
                        message: "must have property 'generation'",
                      };
                      if (vErrors === null) {
                        vErrors = [err71];
                      } else {
                        vErrors.push(err71);
                      }
                      errors++;
                    }
                    for (const key12 in data25) {
                      if (key12 !== "profileId" && key12 !== "generation") {
                        const err72 = {
                          instancePath:
                            instancePath +
                            "/input/selection/owner/" +
                            key12.replace(/~/g, "~0").replace(/\//g, "~1"),
                          schemaPath:
                            "/mapping/readInk/properties/input/properties/selection/properties/owner",
                          keyword: "properties",
                          params: {
                            error: "additional",
                            additionalProperty: key12,
                          },
                          message: "must NOT have additional properties",
                        };
                        if (vErrors === null) {
                          vErrors = [err72];
                        } else {
                          vErrors.push(err72);
                        }
                        errors++;
                      }
                    }
                  }
                  if (!valid51) {
                    const err73 = {
                      instancePath: instancePath + "/input/selection/owner",
                      schemaPath:
                        "/mapping/readInk/properties/input/properties/selection/properties/owner/properties",
                      keyword: "properties",
                      params: { type: "object", nullable: false },
                      message: "must be object",
                    };
                    if (vErrors === null) {
                      vErrors = [err73];
                    } else {
                      vErrors.push(err73);
                    }
                    errors++;
                  }
                } else {
                  const err74 = {
                    instancePath: instancePath + "/input/selection",
                    schemaPath:
                      "/mapping/readInk/properties/input/properties/selection/properties/owner",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "owner" },
                    message: "must have property 'owner'",
                  };
                  if (vErrors === null) {
                    vErrors = [err74];
                  } else {
                    vErrors.push(err74);
                  }
                  errors++;
                }
                for (const key13 in data22) {
                  if (
                    key13 !== "installationId" &&
                    key13 !== "revision" &&
                    key13 !== "owner"
                  ) {
                    const err75 = {
                      instancePath:
                        instancePath +
                        "/input/selection/" +
                        key13.replace(/~/g, "~0").replace(/\//g, "~1"),
                      schemaPath:
                        "/mapping/readInk/properties/input/properties/selection",
                      keyword: "properties",
                      params: {
                        error: "additional",
                        additionalProperty: key13,
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
              if (!valid49) {
                const err76 = {
                  instancePath: instancePath + "/input/selection",
                  schemaPath:
                    "/mapping/readInk/properties/input/properties/selection/properties",
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
                instancePath: instancePath + "/input",
                schemaPath:
                  "/mapping/readInk/properties/input/properties/selection",
                keyword: "properties",
                params: { error: "missing", missingProperty: "selection" },
                message: "must have property 'selection'",
              };
              if (vErrors === null) {
                vErrors = [err77];
              } else {
                vErrors.push(err77);
              }
              errors++;
            }
            for (const key14 in data21) {
              if (key14 !== "selection" && key14 !== "token") {
                const err78 = {
                  instancePath:
                    instancePath +
                    "/input/" +
                    key14.replace(/~/g, "~0").replace(/\//g, "~1"),
                  schemaPath: "/mapping/readInk/properties/input",
                  keyword: "properties",
                  params: { error: "additional", additionalProperty: key14 },
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
          }
          if (!valid47) {
            const err79 = {
              instancePath: instancePath + "/input",
              schemaPath: "/mapping/readInk/properties/input/properties",
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
        } else {
          const err80 = {
            instancePath,
            schemaPath: "/mapping/readInk/properties/input",
            keyword: "properties",
            params: { error: "missing", missingProperty: "input" },
            message: "must have property 'input'",
          };
          if (vErrors === null) {
            vErrors = [err80];
          } else {
            vErrors.push(err80);
          }
          errors++;
        }
        for (const key15 in data) {
          if (key15 !== "kind" && key15 !== "id" && key15 !== "input") {
            const err81 = {
              instancePath:
                instancePath +
                "/" +
                key15.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/readInk",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key15 },
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
        if (!valid45) {
          const err82 = {
            instancePath,
            schemaPath: "/mapping/readInk/properties",
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
        var valid44 = _errs26 === errors;
        valid0 = valid44;
      } else if (tag0 === "readPracticeControls") {
        const _errs35 = errors;
        let valid58 = false;
        valid58 = true;
        if (data.id !== undefined) {
          if (!(typeof data.id == "string")) {
            const err83 = {
              instancePath: instancePath + "/id",
              schemaPath: "/mapping/readPracticeControls/properties/id/type",
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
            instancePath,
            schemaPath: "/mapping/readPracticeControls/properties/id",
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
        if (data.input !== undefined) {
          let data29 = data.input;
          let valid60 = false;
          if (data29 && typeof data29 == "object" && !Array.isArray(data29)) {
            valid60 = true;
            if (data29.selection !== undefined) {
              let data30 = data29.selection;
              let valid62 = false;
              if (
                data30 &&
                typeof data30 == "object" &&
                !Array.isArray(data30)
              ) {
                valid62 = true;
                if (data30.installationId !== undefined) {
                  if (!(typeof data30.installationId == "string")) {
                    const err85 = {
                      instancePath:
                        instancePath + "/input/selection/installationId",
                      schemaPath:
                        "/mapping/readPracticeControls/properties/input/properties/selection/properties/installationId/type",
                      keyword: "type",
                      params: { type: "string", nullable: false },
                      message: "must be string",
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
                    instancePath: instancePath + "/input/selection",
                    schemaPath:
                      "/mapping/readPracticeControls/properties/input/properties/selection/properties/installationId",
                    keyword: "properties",
                    params: {
                      error: "missing",
                      missingProperty: "installationId",
                    },
                    message: "must have property 'installationId'",
                  };
                  if (vErrors === null) {
                    vErrors = [err86];
                  } else {
                    vErrors.push(err86);
                  }
                  errors++;
                }
                if (data30.revision !== undefined) {
                  if (!(typeof data30.revision == "string")) {
                    const err87 = {
                      instancePath: instancePath + "/input/selection/revision",
                      schemaPath:
                        "/mapping/readPracticeControls/properties/input/properties/selection/properties/revision/type",
                      keyword: "type",
                      params: { type: "string", nullable: false },
                      message: "must be string",
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
                    instancePath: instancePath + "/input/selection",
                    schemaPath:
                      "/mapping/readPracticeControls/properties/input/properties/selection/properties/revision",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "revision" },
                    message: "must have property 'revision'",
                  };
                  if (vErrors === null) {
                    vErrors = [err88];
                  } else {
                    vErrors.push(err88);
                  }
                  errors++;
                }
                if (data30.owner !== undefined) {
                  let data33 = data30.owner;
                  let valid64 = false;
                  if (
                    data33 &&
                    typeof data33 == "object" &&
                    !Array.isArray(data33)
                  ) {
                    valid64 = true;
                    if (data33.profileId !== undefined) {
                      if (!(typeof data33.profileId == "string")) {
                        const err89 = {
                          instancePath:
                            instancePath + "/input/selection/owner/profileId",
                          schemaPath:
                            "/mapping/readPracticeControls/properties/input/properties/selection/properties/owner/properties/profileId/type",
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
                    } else {
                      const err90 = {
                        instancePath: instancePath + "/input/selection/owner",
                        schemaPath:
                          "/mapping/readPracticeControls/properties/input/properties/selection/properties/owner/properties/profileId",
                        keyword: "properties",
                        params: {
                          error: "missing",
                          missingProperty: "profileId",
                        },
                        message: "must have property 'profileId'",
                      };
                      if (vErrors === null) {
                        vErrors = [err90];
                      } else {
                        vErrors.push(err90);
                      }
                      errors++;
                    }
                    if (data33.generation !== undefined) {
                      if (!(typeof data33.generation == "string")) {
                        const err91 = {
                          instancePath:
                            instancePath + "/input/selection/owner/generation",
                          schemaPath:
                            "/mapping/readPracticeControls/properties/input/properties/selection/properties/owner/properties/generation/type",
                          keyword: "type",
                          params: { type: "string", nullable: false },
                          message: "must be string",
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
                        instancePath: instancePath + "/input/selection/owner",
                        schemaPath:
                          "/mapping/readPracticeControls/properties/input/properties/selection/properties/owner/properties/generation",
                        keyword: "properties",
                        params: {
                          error: "missing",
                          missingProperty: "generation",
                        },
                        message: "must have property 'generation'",
                      };
                      if (vErrors === null) {
                        vErrors = [err92];
                      } else {
                        vErrors.push(err92);
                      }
                      errors++;
                    }
                    for (const key16 in data33) {
                      if (key16 !== "profileId" && key16 !== "generation") {
                        const err93 = {
                          instancePath:
                            instancePath +
                            "/input/selection/owner/" +
                            key16.replace(/~/g, "~0").replace(/\//g, "~1"),
                          schemaPath:
                            "/mapping/readPracticeControls/properties/input/properties/selection/properties/owner",
                          keyword: "properties",
                          params: {
                            error: "additional",
                            additionalProperty: key16,
                          },
                          message: "must NOT have additional properties",
                        };
                        if (vErrors === null) {
                          vErrors = [err93];
                        } else {
                          vErrors.push(err93);
                        }
                        errors++;
                      }
                    }
                  }
                  if (!valid64) {
                    const err94 = {
                      instancePath: instancePath + "/input/selection/owner",
                      schemaPath:
                        "/mapping/readPracticeControls/properties/input/properties/selection/properties/owner/properties",
                      keyword: "properties",
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
                    instancePath: instancePath + "/input/selection",
                    schemaPath:
                      "/mapping/readPracticeControls/properties/input/properties/selection/properties/owner",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "owner" },
                    message: "must have property 'owner'",
                  };
                  if (vErrors === null) {
                    vErrors = [err95];
                  } else {
                    vErrors.push(err95);
                  }
                  errors++;
                }
                for (const key17 in data30) {
                  if (
                    key17 !== "installationId" &&
                    key17 !== "revision" &&
                    key17 !== "owner"
                  ) {
                    const err96 = {
                      instancePath:
                        instancePath +
                        "/input/selection/" +
                        key17.replace(/~/g, "~0").replace(/\//g, "~1"),
                      schemaPath:
                        "/mapping/readPracticeControls/properties/input/properties/selection",
                      keyword: "properties",
                      params: {
                        error: "additional",
                        additionalProperty: key17,
                      },
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
              if (!valid62) {
                const err97 = {
                  instancePath: instancePath + "/input/selection",
                  schemaPath:
                    "/mapping/readPracticeControls/properties/input/properties/selection/properties",
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
            } else {
              const err98 = {
                instancePath: instancePath + "/input",
                schemaPath:
                  "/mapping/readPracticeControls/properties/input/properties/selection",
                keyword: "properties",
                params: { error: "missing", missingProperty: "selection" },
                message: "must have property 'selection'",
              };
              if (vErrors === null) {
                vErrors = [err98];
              } else {
                vErrors.push(err98);
              }
              errors++;
            }
            for (const key18 in data29) {
              if (key18 !== "selection" && key18 !== "binding") {
                const err99 = {
                  instancePath:
                    instancePath +
                    "/input/" +
                    key18.replace(/~/g, "~0").replace(/\//g, "~1"),
                  schemaPath: "/mapping/readPracticeControls/properties/input",
                  keyword: "properties",
                  params: { error: "additional", additionalProperty: key18 },
                  message: "must NOT have additional properties",
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
          if (!valid60) {
            const err100 = {
              instancePath: instancePath + "/input",
              schemaPath:
                "/mapping/readPracticeControls/properties/input/properties",
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
            instancePath,
            schemaPath: "/mapping/readPracticeControls/properties/input",
            keyword: "properties",
            params: { error: "missing", missingProperty: "input" },
            message: "must have property 'input'",
          };
          if (vErrors === null) {
            vErrors = [err101];
          } else {
            vErrors.push(err101);
          }
          errors++;
        }
        for (const key19 in data) {
          if (key19 !== "kind" && key19 !== "id" && key19 !== "input") {
            const err102 = {
              instancePath:
                instancePath +
                "/" +
                key19.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/readPracticeControls",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key19 },
              message: "must NOT have additional properties",
            };
            if (vErrors === null) {
              vErrors = [err102];
            } else {
              vErrors.push(err102);
            }
            errors++;
          }
        }
        if (!valid58) {
          const err103 = {
            instancePath,
            schemaPath: "/mapping/readPracticeControls/properties",
            keyword: "properties",
            params: { type: "object", nullable: false },
            message: "must be object",
          };
          if (vErrors === null) {
            vErrors = [err103];
          } else {
            vErrors.push(err103);
          }
          errors++;
        }
        var valid57 = _errs35 === errors;
        valid0 = valid57;
      } else if (tag0 === "execute") {
        const _errs44 = errors;
        let valid71 = false;
        valid71 = true;
        if (data.id !== undefined) {
          if (!(typeof data.id == "string")) {
            const err104 = {
              instancePath: instancePath + "/id",
              schemaPath: "/mapping/execute/properties/id/type",
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
            instancePath,
            schemaPath: "/mapping/execute/properties/id",
            keyword: "properties",
            params: { error: "missing", missingProperty: "id" },
            message: "must have property 'id'",
          };
          if (vErrors === null) {
            vErrors = [err105];
          } else {
            vErrors.push(err105);
          }
          errors++;
        }
        if (data.operation !== undefined) {
          let data37 = data.operation;
          let valid73 = false;
          if (data37 && typeof data37 == "object" && !Array.isArray(data37)) {
            const tag2 = data37.kind;
            if (tag2 === undefined) {
              const err106 = {
                instancePath: instancePath + "/operation",
                schemaPath:
                  "/mapping/execute/properties/operation/discriminator",
                keyword: "discriminator",
                params: { error: "tag", tag: "kind", tagValue: tag2 },
                message: 'tag "kind" must be string',
              };
              if (vErrors === null) {
                vErrors = [err106];
              } else {
                vErrors.push(err106);
              }
              errors++;
            } else if (typeof tag2 == "string") {
              if (tag2 === "teaching") {
                const _errs47 = errors;
                let valid75 = false;
                valid75 = true;
                if (data37.selection !== undefined) {
                  let data38 = data37.selection;
                  let valid77 = false;
                  if (
                    data38 &&
                    typeof data38 == "object" &&
                    !Array.isArray(data38)
                  ) {
                    valid77 = true;
                    if (data38.installationId !== undefined) {
                      if (!(typeof data38.installationId == "string")) {
                        const err107 = {
                          instancePath:
                            instancePath +
                            "/operation/selection/installationId",
                          schemaPath:
                            "/mapping/execute/properties/operation/mapping/teaching/properties/selection/properties/installationId/type",
                          keyword: "type",
                          params: { type: "string", nullable: false },
                          message: "must be string",
                        };
                        if (vErrors === null) {
                          vErrors = [err107];
                        } else {
                          vErrors.push(err107);
                        }
                        errors++;
                      }
                    } else {
                      const err108 = {
                        instancePath: instancePath + "/operation/selection",
                        schemaPath:
                          "/mapping/execute/properties/operation/mapping/teaching/properties/selection/properties/installationId",
                        keyword: "properties",
                        params: {
                          error: "missing",
                          missingProperty: "installationId",
                        },
                        message: "must have property 'installationId'",
                      };
                      if (vErrors === null) {
                        vErrors = [err108];
                      } else {
                        vErrors.push(err108);
                      }
                      errors++;
                    }
                    if (data38.revision !== undefined) {
                      if (!(typeof data38.revision == "string")) {
                        const err109 = {
                          instancePath:
                            instancePath + "/operation/selection/revision",
                          schemaPath:
                            "/mapping/execute/properties/operation/mapping/teaching/properties/selection/properties/revision/type",
                          keyword: "type",
                          params: { type: "string", nullable: false },
                          message: "must be string",
                        };
                        if (vErrors === null) {
                          vErrors = [err109];
                        } else {
                          vErrors.push(err109);
                        }
                        errors++;
                      }
                    } else {
                      const err110 = {
                        instancePath: instancePath + "/operation/selection",
                        schemaPath:
                          "/mapping/execute/properties/operation/mapping/teaching/properties/selection/properties/revision",
                        keyword: "properties",
                        params: {
                          error: "missing",
                          missingProperty: "revision",
                        },
                        message: "must have property 'revision'",
                      };
                      if (vErrors === null) {
                        vErrors = [err110];
                      } else {
                        vErrors.push(err110);
                      }
                      errors++;
                    }
                    if (data38.owner !== undefined) {
                      let data41 = data38.owner;
                      let valid79 = false;
                      if (
                        data41 &&
                        typeof data41 == "object" &&
                        !Array.isArray(data41)
                      ) {
                        valid79 = true;
                        if (data41.profileId !== undefined) {
                          if (!(typeof data41.profileId == "string")) {
                            const err111 = {
                              instancePath:
                                instancePath +
                                "/operation/selection/owner/profileId",
                              schemaPath:
                                "/mapping/execute/properties/operation/mapping/teaching/properties/selection/properties/owner/properties/profileId/type",
                              keyword: "type",
                              params: { type: "string", nullable: false },
                              message: "must be string",
                            };
                            if (vErrors === null) {
                              vErrors = [err111];
                            } else {
                              vErrors.push(err111);
                            }
                            errors++;
                          }
                        } else {
                          const err112 = {
                            instancePath:
                              instancePath + "/operation/selection/owner",
                            schemaPath:
                              "/mapping/execute/properties/operation/mapping/teaching/properties/selection/properties/owner/properties/profileId",
                            keyword: "properties",
                            params: {
                              error: "missing",
                              missingProperty: "profileId",
                            },
                            message: "must have property 'profileId'",
                          };
                          if (vErrors === null) {
                            vErrors = [err112];
                          } else {
                            vErrors.push(err112);
                          }
                          errors++;
                        }
                        if (data41.generation !== undefined) {
                          if (!(typeof data41.generation == "string")) {
                            const err113 = {
                              instancePath:
                                instancePath +
                                "/operation/selection/owner/generation",
                              schemaPath:
                                "/mapping/execute/properties/operation/mapping/teaching/properties/selection/properties/owner/properties/generation/type",
                              keyword: "type",
                              params: { type: "string", nullable: false },
                              message: "must be string",
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
                              instancePath + "/operation/selection/owner",
                            schemaPath:
                              "/mapping/execute/properties/operation/mapping/teaching/properties/selection/properties/owner/properties/generation",
                            keyword: "properties",
                            params: {
                              error: "missing",
                              missingProperty: "generation",
                            },
                            message: "must have property 'generation'",
                          };
                          if (vErrors === null) {
                            vErrors = [err114];
                          } else {
                            vErrors.push(err114);
                          }
                          errors++;
                        }
                        for (const key20 in data41) {
                          if (key20 !== "profileId" && key20 !== "generation") {
                            const err115 = {
                              instancePath:
                                instancePath +
                                "/operation/selection/owner/" +
                                key20.replace(/~/g, "~0").replace(/\//g, "~1"),
                              schemaPath:
                                "/mapping/execute/properties/operation/mapping/teaching/properties/selection/properties/owner",
                              keyword: "properties",
                              params: {
                                error: "additional",
                                additionalProperty: key20,
                              },
                              message: "must NOT have additional properties",
                            };
                            if (vErrors === null) {
                              vErrors = [err115];
                            } else {
                              vErrors.push(err115);
                            }
                            errors++;
                          }
                        }
                      }
                      if (!valid79) {
                        const err116 = {
                          instancePath:
                            instancePath + "/operation/selection/owner",
                          schemaPath:
                            "/mapping/execute/properties/operation/mapping/teaching/properties/selection/properties/owner/properties",
                          keyword: "properties",
                          params: { type: "object", nullable: false },
                          message: "must be object",
                        };
                        if (vErrors === null) {
                          vErrors = [err116];
                        } else {
                          vErrors.push(err116);
                        }
                        errors++;
                      }
                    } else {
                      const err117 = {
                        instancePath: instancePath + "/operation/selection",
                        schemaPath:
                          "/mapping/execute/properties/operation/mapping/teaching/properties/selection/properties/owner",
                        keyword: "properties",
                        params: { error: "missing", missingProperty: "owner" },
                        message: "must have property 'owner'",
                      };
                      if (vErrors === null) {
                        vErrors = [err117];
                      } else {
                        vErrors.push(err117);
                      }
                      errors++;
                    }
                    for (const key21 in data38) {
                      if (
                        key21 !== "installationId" &&
                        key21 !== "revision" &&
                        key21 !== "owner"
                      ) {
                        const err118 = {
                          instancePath:
                            instancePath +
                            "/operation/selection/" +
                            key21.replace(/~/g, "~0").replace(/\//g, "~1"),
                          schemaPath:
                            "/mapping/execute/properties/operation/mapping/teaching/properties/selection",
                          keyword: "properties",
                          params: {
                            error: "additional",
                            additionalProperty: key21,
                          },
                          message: "must NOT have additional properties",
                        };
                        if (vErrors === null) {
                          vErrors = [err118];
                        } else {
                          vErrors.push(err118);
                        }
                        errors++;
                      }
                    }
                  }
                  if (!valid77) {
                    const err119 = {
                      instancePath: instancePath + "/operation/selection",
                      schemaPath:
                        "/mapping/execute/properties/operation/mapping/teaching/properties/selection/properties",
                      keyword: "properties",
                      params: { type: "object", nullable: false },
                      message: "must be object",
                    };
                    if (vErrors === null) {
                      vErrors = [err119];
                    } else {
                      vErrors.push(err119);
                    }
                    errors++;
                  }
                } else {
                  const err120 = {
                    instancePath: instancePath + "/operation",
                    schemaPath:
                      "/mapping/execute/properties/operation/mapping/teaching/properties/selection",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "selection" },
                    message: "must have property 'selection'",
                  };
                  if (vErrors === null) {
                    vErrors = [err120];
                  } else {
                    vErrors.push(err120);
                  }
                  errors++;
                }
                for (const key22 in data37) {
                  if (
                    key22 !== "kind" &&
                    key22 !== "selection" &&
                    key22 !== "command"
                  ) {
                    const err121 = {
                      instancePath:
                        instancePath +
                        "/operation/" +
                        key22.replace(/~/g, "~0").replace(/\//g, "~1"),
                      schemaPath:
                        "/mapping/execute/properties/operation/mapping/teaching",
                      keyword: "properties",
                      params: {
                        error: "additional",
                        additionalProperty: key22,
                      },
                      message: "must NOT have additional properties",
                    };
                    if (vErrors === null) {
                      vErrors = [err121];
                    } else {
                      vErrors.push(err121);
                    }
                    errors++;
                  }
                }
                if (!valid75) {
                  const err122 = {
                    instancePath: instancePath + "/operation",
                    schemaPath:
                      "/mapping/execute/properties/operation/mapping/teaching/properties",
                    keyword: "properties",
                    params: { type: "object", nullable: false },
                    message: "must be object",
                  };
                  if (vErrors === null) {
                    vErrors = [err122];
                  } else {
                    vErrors.push(err122);
                  }
                  errors++;
                }
                var valid74 = _errs47 === errors;
                valid73 = valid74;
              } else if (tag2 === "ink") {
                const _errs54 = errors;
                let valid85 = false;
                valid85 = true;
                if (data37.selection !== undefined) {
                  let data44 = data37.selection;
                  let valid87 = false;
                  if (
                    data44 &&
                    typeof data44 == "object" &&
                    !Array.isArray(data44)
                  ) {
                    valid87 = true;
                    if (data44.installationId !== undefined) {
                      if (!(typeof data44.installationId == "string")) {
                        const err123 = {
                          instancePath:
                            instancePath +
                            "/operation/selection/installationId",
                          schemaPath:
                            "/mapping/execute/properties/operation/mapping/ink/properties/selection/properties/installationId/type",
                          keyword: "type",
                          params: { type: "string", nullable: false },
                          message: "must be string",
                        };
                        if (vErrors === null) {
                          vErrors = [err123];
                        } else {
                          vErrors.push(err123);
                        }
                        errors++;
                      }
                    } else {
                      const err124 = {
                        instancePath: instancePath + "/operation/selection",
                        schemaPath:
                          "/mapping/execute/properties/operation/mapping/ink/properties/selection/properties/installationId",
                        keyword: "properties",
                        params: {
                          error: "missing",
                          missingProperty: "installationId",
                        },
                        message: "must have property 'installationId'",
                      };
                      if (vErrors === null) {
                        vErrors = [err124];
                      } else {
                        vErrors.push(err124);
                      }
                      errors++;
                    }
                    if (data44.revision !== undefined) {
                      if (!(typeof data44.revision == "string")) {
                        const err125 = {
                          instancePath:
                            instancePath + "/operation/selection/revision",
                          schemaPath:
                            "/mapping/execute/properties/operation/mapping/ink/properties/selection/properties/revision/type",
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
                        instancePath: instancePath + "/operation/selection",
                        schemaPath:
                          "/mapping/execute/properties/operation/mapping/ink/properties/selection/properties/revision",
                        keyword: "properties",
                        params: {
                          error: "missing",
                          missingProperty: "revision",
                        },
                        message: "must have property 'revision'",
                      };
                      if (vErrors === null) {
                        vErrors = [err126];
                      } else {
                        vErrors.push(err126);
                      }
                      errors++;
                    }
                    if (data44.owner !== undefined) {
                      let data47 = data44.owner;
                      let valid89 = false;
                      if (
                        data47 &&
                        typeof data47 == "object" &&
                        !Array.isArray(data47)
                      ) {
                        valid89 = true;
                        if (data47.profileId !== undefined) {
                          if (!(typeof data47.profileId == "string")) {
                            const err127 = {
                              instancePath:
                                instancePath +
                                "/operation/selection/owner/profileId",
                              schemaPath:
                                "/mapping/execute/properties/operation/mapping/ink/properties/selection/properties/owner/properties/profileId/type",
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
                            instancePath:
                              instancePath + "/operation/selection/owner",
                            schemaPath:
                              "/mapping/execute/properties/operation/mapping/ink/properties/selection/properties/owner/properties/profileId",
                            keyword: "properties",
                            params: {
                              error: "missing",
                              missingProperty: "profileId",
                            },
                            message: "must have property 'profileId'",
                          };
                          if (vErrors === null) {
                            vErrors = [err128];
                          } else {
                            vErrors.push(err128);
                          }
                          errors++;
                        }
                        if (data47.generation !== undefined) {
                          if (!(typeof data47.generation == "string")) {
                            const err129 = {
                              instancePath:
                                instancePath +
                                "/operation/selection/owner/generation",
                              schemaPath:
                                "/mapping/execute/properties/operation/mapping/ink/properties/selection/properties/owner/properties/generation/type",
                              keyword: "type",
                              params: { type: "string", nullable: false },
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
                              instancePath + "/operation/selection/owner",
                            schemaPath:
                              "/mapping/execute/properties/operation/mapping/ink/properties/selection/properties/owner/properties/generation",
                            keyword: "properties",
                            params: {
                              error: "missing",
                              missingProperty: "generation",
                            },
                            message: "must have property 'generation'",
                          };
                          if (vErrors === null) {
                            vErrors = [err130];
                          } else {
                            vErrors.push(err130);
                          }
                          errors++;
                        }
                        for (const key23 in data47) {
                          if (key23 !== "profileId" && key23 !== "generation") {
                            const err131 = {
                              instancePath:
                                instancePath +
                                "/operation/selection/owner/" +
                                key23.replace(/~/g, "~0").replace(/\//g, "~1"),
                              schemaPath:
                                "/mapping/execute/properties/operation/mapping/ink/properties/selection/properties/owner",
                              keyword: "properties",
                              params: {
                                error: "additional",
                                additionalProperty: key23,
                              },
                              message: "must NOT have additional properties",
                            };
                            if (vErrors === null) {
                              vErrors = [err131];
                            } else {
                              vErrors.push(err131);
                            }
                            errors++;
                          }
                        }
                      }
                      if (!valid89) {
                        const err132 = {
                          instancePath:
                            instancePath + "/operation/selection/owner",
                          schemaPath:
                            "/mapping/execute/properties/operation/mapping/ink/properties/selection/properties/owner/properties",
                          keyword: "properties",
                          params: { type: "object", nullable: false },
                          message: "must be object",
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
                        instancePath: instancePath + "/operation/selection",
                        schemaPath:
                          "/mapping/execute/properties/operation/mapping/ink/properties/selection/properties/owner",
                        keyword: "properties",
                        params: { error: "missing", missingProperty: "owner" },
                        message: "must have property 'owner'",
                      };
                      if (vErrors === null) {
                        vErrors = [err133];
                      } else {
                        vErrors.push(err133);
                      }
                      errors++;
                    }
                    for (const key24 in data44) {
                      if (
                        key24 !== "installationId" &&
                        key24 !== "revision" &&
                        key24 !== "owner"
                      ) {
                        const err134 = {
                          instancePath:
                            instancePath +
                            "/operation/selection/" +
                            key24.replace(/~/g, "~0").replace(/\//g, "~1"),
                          schemaPath:
                            "/mapping/execute/properties/operation/mapping/ink/properties/selection",
                          keyword: "properties",
                          params: {
                            error: "additional",
                            additionalProperty: key24,
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
                  if (!valid87) {
                    const err135 = {
                      instancePath: instancePath + "/operation/selection",
                      schemaPath:
                        "/mapping/execute/properties/operation/mapping/ink/properties/selection/properties",
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
                    instancePath: instancePath + "/operation",
                    schemaPath:
                      "/mapping/execute/properties/operation/mapping/ink/properties/selection",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "selection" },
                    message: "must have property 'selection'",
                  };
                  if (vErrors === null) {
                    vErrors = [err136];
                  } else {
                    vErrors.push(err136);
                  }
                  errors++;
                }
                for (const key25 in data37) {
                  if (
                    key25 !== "kind" &&
                    key25 !== "selection" &&
                    key25 !== "command"
                  ) {
                    const err137 = {
                      instancePath:
                        instancePath +
                        "/operation/" +
                        key25.replace(/~/g, "~0").replace(/\//g, "~1"),
                      schemaPath:
                        "/mapping/execute/properties/operation/mapping/ink",
                      keyword: "properties",
                      params: {
                        error: "additional",
                        additionalProperty: key25,
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
                if (!valid85) {
                  const err138 = {
                    instancePath: instancePath + "/operation",
                    schemaPath:
                      "/mapping/execute/properties/operation/mapping/ink/properties",
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
                var valid84 = _errs54 === errors;
                valid73 = valid84;
              } else {
                const err139 = {
                  instancePath: instancePath + "/operation/kind",
                  schemaPath: "/mapping/execute/properties/operation/mapping",
                  keyword: "discriminator",
                  params: { error: "mapping", tag: "kind", tagValue: tag2 },
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
                instancePath: instancePath + "/operation/kind",
                schemaPath:
                  "/mapping/execute/properties/operation/discriminator",
                keyword: "discriminator",
                params: { error: "tag", tag: "kind", tagValue: tag2 },
                message: 'tag "kind" must be string',
              };
              if (vErrors === null) {
                vErrors = [err140];
              } else {
                vErrors.push(err140);
              }
              errors++;
            }
          } else if (!valid73) {
            const err141 = {
              instancePath: instancePath + "/operation",
              schemaPath: "/mapping/execute/properties/operation/discriminator",
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
            instancePath,
            schemaPath: "/mapping/execute/properties/operation",
            keyword: "properties",
            params: { error: "missing", missingProperty: "operation" },
            message: "must have property 'operation'",
          };
          if (vErrors === null) {
            vErrors = [err142];
          } else {
            vErrors.push(err142);
          }
          errors++;
        }
        for (const key26 in data) {
          if (key26 !== "kind" && key26 !== "id" && key26 !== "operation") {
            const err143 = {
              instancePath:
                instancePath +
                "/" +
                key26.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/execute",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key26 },
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
        if (!valid71) {
          const err144 = {
            instancePath,
            schemaPath: "/mapping/execute/properties",
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
        var valid70 = _errs44 === errors;
        valid0 = valid70;
      } else if (tag0 === "administer") {
        const _errs61 = errors;
        let valid96 = false;
        valid96 = true;
        if (data.id !== undefined) {
          if (!(typeof data.id == "string")) {
            const err145 = {
              instancePath: instancePath + "/id",
              schemaPath: "/mapping/administer/properties/id/type",
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
            instancePath,
            schemaPath: "/mapping/administer/properties/id",
            keyword: "properties",
            params: { error: "missing", missingProperty: "id" },
            message: "must have property 'id'",
          };
          if (vErrors === null) {
            vErrors = [err146];
          } else {
            vErrors.push(err146);
          }
          errors++;
        }
        for (const key27 in data) {
          if (key27 !== "kind" && key27 !== "id" && key27 !== "command") {
            const err147 = {
              instancePath:
                instancePath +
                "/" +
                key27.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/administer",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key27 },
              message: "must NOT have additional properties",
            };
            if (vErrors === null) {
              vErrors = [err147];
            } else {
              vErrors.push(err147);
            }
            errors++;
          }
        }
        if (!valid96) {
          const err148 = {
            instancePath,
            schemaPath: "/mapping/administer/properties",
            keyword: "properties",
            params: { type: "object", nullable: false },
            message: "must be object",
          };
          if (vErrors === null) {
            vErrors = [err148];
          } else {
            vErrors.push(err148);
          }
          errors++;
        }
        var valid95 = _errs61 === errors;
        valid0 = valid95;
      } else if (tag0 === "readDeparture") {
        const _errs63 = errors;
        let valid100 = false;
        valid100 = true;
        if (data.id !== undefined) {
          if (!(typeof data.id == "string")) {
            const err149 = {
              instancePath: instancePath + "/id",
              schemaPath: "/mapping/readDeparture/properties/id/type",
              keyword: "type",
              params: { type: "string", nullable: false },
              message: "must be string",
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
            instancePath,
            schemaPath: "/mapping/readDeparture/properties/id",
            keyword: "properties",
            params: { error: "missing", missingProperty: "id" },
            message: "must have property 'id'",
          };
          if (vErrors === null) {
            vErrors = [err150];
          } else {
            vErrors.push(err150);
          }
          errors++;
        }
        if (data.selection !== undefined) {
          let data52 = data.selection;
          let valid102 = false;
          if (data52 && typeof data52 == "object" && !Array.isArray(data52)) {
            valid102 = true;
            if (data52.installationId !== undefined) {
              if (!(typeof data52.installationId == "string")) {
                const err151 = {
                  instancePath: instancePath + "/selection/installationId",
                  schemaPath:
                    "/mapping/readDeparture/properties/selection/properties/installationId/type",
                  keyword: "type",
                  params: { type: "string", nullable: false },
                  message: "must be string",
                };
                if (vErrors === null) {
                  vErrors = [err151];
                } else {
                  vErrors.push(err151);
                }
                errors++;
              }
            } else {
              const err152 = {
                instancePath: instancePath + "/selection",
                schemaPath:
                  "/mapping/readDeparture/properties/selection/properties/installationId",
                keyword: "properties",
                params: { error: "missing", missingProperty: "installationId" },
                message: "must have property 'installationId'",
              };
              if (vErrors === null) {
                vErrors = [err152];
              } else {
                vErrors.push(err152);
              }
              errors++;
            }
            if (data52.revision !== undefined) {
              if (!(typeof data52.revision == "string")) {
                const err153 = {
                  instancePath: instancePath + "/selection/revision",
                  schemaPath:
                    "/mapping/readDeparture/properties/selection/properties/revision/type",
                  keyword: "type",
                  params: { type: "string", nullable: false },
                  message: "must be string",
                };
                if (vErrors === null) {
                  vErrors = [err153];
                } else {
                  vErrors.push(err153);
                }
                errors++;
              }
            } else {
              const err154 = {
                instancePath: instancePath + "/selection",
                schemaPath:
                  "/mapping/readDeparture/properties/selection/properties/revision",
                keyword: "properties",
                params: { error: "missing", missingProperty: "revision" },
                message: "must have property 'revision'",
              };
              if (vErrors === null) {
                vErrors = [err154];
              } else {
                vErrors.push(err154);
              }
              errors++;
            }
            if (data52.owner !== undefined) {
              let data55 = data52.owner;
              let valid104 = false;
              if (
                data55 &&
                typeof data55 == "object" &&
                !Array.isArray(data55)
              ) {
                valid104 = true;
                if (data55.profileId !== undefined) {
                  if (!(typeof data55.profileId == "string")) {
                    const err155 = {
                      instancePath: instancePath + "/selection/owner/profileId",
                      schemaPath:
                        "/mapping/readDeparture/properties/selection/properties/owner/properties/profileId/type",
                      keyword: "type",
                      params: { type: "string", nullable: false },
                      message: "must be string",
                    };
                    if (vErrors === null) {
                      vErrors = [err155];
                    } else {
                      vErrors.push(err155);
                    }
                    errors++;
                  }
                } else {
                  const err156 = {
                    instancePath: instancePath + "/selection/owner",
                    schemaPath:
                      "/mapping/readDeparture/properties/selection/properties/owner/properties/profileId",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "profileId" },
                    message: "must have property 'profileId'",
                  };
                  if (vErrors === null) {
                    vErrors = [err156];
                  } else {
                    vErrors.push(err156);
                  }
                  errors++;
                }
                if (data55.generation !== undefined) {
                  if (!(typeof data55.generation == "string")) {
                    const err157 = {
                      instancePath:
                        instancePath + "/selection/owner/generation",
                      schemaPath:
                        "/mapping/readDeparture/properties/selection/properties/owner/properties/generation/type",
                      keyword: "type",
                      params: { type: "string", nullable: false },
                      message: "must be string",
                    };
                    if (vErrors === null) {
                      vErrors = [err157];
                    } else {
                      vErrors.push(err157);
                    }
                    errors++;
                  }
                } else {
                  const err158 = {
                    instancePath: instancePath + "/selection/owner",
                    schemaPath:
                      "/mapping/readDeparture/properties/selection/properties/owner/properties/generation",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "generation" },
                    message: "must have property 'generation'",
                  };
                  if (vErrors === null) {
                    vErrors = [err158];
                  } else {
                    vErrors.push(err158);
                  }
                  errors++;
                }
                for (const key28 in data55) {
                  if (key28 !== "profileId" && key28 !== "generation") {
                    const err159 = {
                      instancePath:
                        instancePath +
                        "/selection/owner/" +
                        key28.replace(/~/g, "~0").replace(/\//g, "~1"),
                      schemaPath:
                        "/mapping/readDeparture/properties/selection/properties/owner",
                      keyword: "properties",
                      params: {
                        error: "additional",
                        additionalProperty: key28,
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
              if (!valid104) {
                const err160 = {
                  instancePath: instancePath + "/selection/owner",
                  schemaPath:
                    "/mapping/readDeparture/properties/selection/properties/owner/properties",
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
                instancePath: instancePath + "/selection",
                schemaPath:
                  "/mapping/readDeparture/properties/selection/properties/owner",
                keyword: "properties",
                params: { error: "missing", missingProperty: "owner" },
                message: "must have property 'owner'",
              };
              if (vErrors === null) {
                vErrors = [err161];
              } else {
                vErrors.push(err161);
              }
              errors++;
            }
            for (const key29 in data52) {
              if (
                key29 !== "installationId" &&
                key29 !== "revision" &&
                key29 !== "owner"
              ) {
                const err162 = {
                  instancePath:
                    instancePath +
                    "/selection/" +
                    key29.replace(/~/g, "~0").replace(/\//g, "~1"),
                  schemaPath: "/mapping/readDeparture/properties/selection",
                  keyword: "properties",
                  params: { error: "additional", additionalProperty: key29 },
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
          }
          if (!valid102) {
            const err163 = {
              instancePath: instancePath + "/selection",
              schemaPath:
                "/mapping/readDeparture/properties/selection/properties",
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
        } else {
          const err164 = {
            instancePath,
            schemaPath: "/mapping/readDeparture/properties/selection",
            keyword: "properties",
            params: { error: "missing", missingProperty: "selection" },
            message: "must have property 'selection'",
          };
          if (vErrors === null) {
            vErrors = [err164];
          } else {
            vErrors.push(err164);
          }
          errors++;
        }
        for (const key30 in data) {
          if (key30 !== "kind" && key30 !== "id" && key30 !== "selection") {
            const err165 = {
              instancePath:
                instancePath +
                "/" +
                key30.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/readDeparture",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key30 },
              message: "must NOT have additional properties",
            };
            if (vErrors === null) {
              vErrors = [err165];
            } else {
              vErrors.push(err165);
            }
            errors++;
          }
        }
        if (!valid100) {
          const err166 = {
            instancePath,
            schemaPath: "/mapping/readDeparture/properties",
            keyword: "properties",
            params: { type: "object", nullable: false },
            message: "must be object",
          };
          if (vErrors === null) {
            vErrors = [err166];
          } else {
            vErrors.push(err166);
          }
          errors++;
        }
        var valid99 = _errs63 === errors;
        valid0 = valid99;
      } else if (tag0 === "recoverInk") {
        const _errs71 = errors;
        let valid110 = false;
        valid110 = true;
        if (data.id !== undefined) {
          if (!(typeof data.id == "string")) {
            const err167 = {
              instancePath: instancePath + "/id",
              schemaPath: "/mapping/recoverInk/properties/id/type",
              keyword: "type",
              params: { type: "string", nullable: false },
              message: "must be string",
            };
            if (vErrors === null) {
              vErrors = [err167];
            } else {
              vErrors.push(err167);
            }
            errors++;
          }
        } else {
          const err168 = {
            instancePath,
            schemaPath: "/mapping/recoverInk/properties/id",
            keyword: "properties",
            params: { error: "missing", missingProperty: "id" },
            message: "must have property 'id'",
          };
          if (vErrors === null) {
            vErrors = [err168];
          } else {
            vErrors.push(err168);
          }
          errors++;
        }
        if (data.recoveryId !== undefined) {
          if (!(typeof data.recoveryId == "string")) {
            const err169 = {
              instancePath: instancePath + "/recoveryId",
              schemaPath: "/mapping/recoverInk/properties/recoveryId/type",
              keyword: "type",
              params: { type: "string", nullable: false },
              message: "must be string",
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
            instancePath,
            schemaPath: "/mapping/recoverInk/properties/recoveryId",
            keyword: "properties",
            params: { error: "missing", missingProperty: "recoveryId" },
            message: "must have property 'recoveryId'",
          };
          if (vErrors === null) {
            vErrors = [err170];
          } else {
            vErrors.push(err170);
          }
          errors++;
        }
        if (data.operation !== undefined) {
          let data60 = data.operation;
          let valid112 = false;
          if (data60 && typeof data60 == "object" && !Array.isArray(data60)) {
            const tag3 = data60.kind;
            if (tag3 === undefined) {
              const err171 = {
                instancePath: instancePath + "/operation",
                schemaPath:
                  "/mapping/recoverInk/properties/operation/discriminator",
                keyword: "discriminator",
                params: { error: "tag", tag: "kind", tagValue: tag3 },
                message: 'tag "kind" must be string',
              };
              if (vErrors === null) {
                vErrors = [err171];
              } else {
                vErrors.push(err171);
              }
              errors++;
            } else if (typeof tag3 == "string") {
              if (tag3 === "teaching") {
                const _errs75 = errors;
                let valid114 = false;
                valid114 = true;
                if (data60.selection !== undefined) {
                  let data61 = data60.selection;
                  let valid116 = false;
                  if (
                    data61 &&
                    typeof data61 == "object" &&
                    !Array.isArray(data61)
                  ) {
                    valid116 = true;
                    if (data61.installationId !== undefined) {
                      if (!(typeof data61.installationId == "string")) {
                        const err172 = {
                          instancePath:
                            instancePath +
                            "/operation/selection/installationId",
                          schemaPath:
                            "/mapping/recoverInk/properties/operation/mapping/teaching/properties/selection/properties/installationId/type",
                          keyword: "type",
                          params: { type: "string", nullable: false },
                          message: "must be string",
                        };
                        if (vErrors === null) {
                          vErrors = [err172];
                        } else {
                          vErrors.push(err172);
                        }
                        errors++;
                      }
                    } else {
                      const err173 = {
                        instancePath: instancePath + "/operation/selection",
                        schemaPath:
                          "/mapping/recoverInk/properties/operation/mapping/teaching/properties/selection/properties/installationId",
                        keyword: "properties",
                        params: {
                          error: "missing",
                          missingProperty: "installationId",
                        },
                        message: "must have property 'installationId'",
                      };
                      if (vErrors === null) {
                        vErrors = [err173];
                      } else {
                        vErrors.push(err173);
                      }
                      errors++;
                    }
                    if (data61.revision !== undefined) {
                      if (!(typeof data61.revision == "string")) {
                        const err174 = {
                          instancePath:
                            instancePath + "/operation/selection/revision",
                          schemaPath:
                            "/mapping/recoverInk/properties/operation/mapping/teaching/properties/selection/properties/revision/type",
                          keyword: "type",
                          params: { type: "string", nullable: false },
                          message: "must be string",
                        };
                        if (vErrors === null) {
                          vErrors = [err174];
                        } else {
                          vErrors.push(err174);
                        }
                        errors++;
                      }
                    } else {
                      const err175 = {
                        instancePath: instancePath + "/operation/selection",
                        schemaPath:
                          "/mapping/recoverInk/properties/operation/mapping/teaching/properties/selection/properties/revision",
                        keyword: "properties",
                        params: {
                          error: "missing",
                          missingProperty: "revision",
                        },
                        message: "must have property 'revision'",
                      };
                      if (vErrors === null) {
                        vErrors = [err175];
                      } else {
                        vErrors.push(err175);
                      }
                      errors++;
                    }
                    if (data61.owner !== undefined) {
                      let data64 = data61.owner;
                      let valid118 = false;
                      if (
                        data64 &&
                        typeof data64 == "object" &&
                        !Array.isArray(data64)
                      ) {
                        valid118 = true;
                        if (data64.profileId !== undefined) {
                          if (!(typeof data64.profileId == "string")) {
                            const err176 = {
                              instancePath:
                                instancePath +
                                "/operation/selection/owner/profileId",
                              schemaPath:
                                "/mapping/recoverInk/properties/operation/mapping/teaching/properties/selection/properties/owner/properties/profileId/type",
                              keyword: "type",
                              params: { type: "string", nullable: false },
                              message: "must be string",
                            };
                            if (vErrors === null) {
                              vErrors = [err176];
                            } else {
                              vErrors.push(err176);
                            }
                            errors++;
                          }
                        } else {
                          const err177 = {
                            instancePath:
                              instancePath + "/operation/selection/owner",
                            schemaPath:
                              "/mapping/recoverInk/properties/operation/mapping/teaching/properties/selection/properties/owner/properties/profileId",
                            keyword: "properties",
                            params: {
                              error: "missing",
                              missingProperty: "profileId",
                            },
                            message: "must have property 'profileId'",
                          };
                          if (vErrors === null) {
                            vErrors = [err177];
                          } else {
                            vErrors.push(err177);
                          }
                          errors++;
                        }
                        if (data64.generation !== undefined) {
                          if (!(typeof data64.generation == "string")) {
                            const err178 = {
                              instancePath:
                                instancePath +
                                "/operation/selection/owner/generation",
                              schemaPath:
                                "/mapping/recoverInk/properties/operation/mapping/teaching/properties/selection/properties/owner/properties/generation/type",
                              keyword: "type",
                              params: { type: "string", nullable: false },
                              message: "must be string",
                            };
                            if (vErrors === null) {
                              vErrors = [err178];
                            } else {
                              vErrors.push(err178);
                            }
                            errors++;
                          }
                        } else {
                          const err179 = {
                            instancePath:
                              instancePath + "/operation/selection/owner",
                            schemaPath:
                              "/mapping/recoverInk/properties/operation/mapping/teaching/properties/selection/properties/owner/properties/generation",
                            keyword: "properties",
                            params: {
                              error: "missing",
                              missingProperty: "generation",
                            },
                            message: "must have property 'generation'",
                          };
                          if (vErrors === null) {
                            vErrors = [err179];
                          } else {
                            vErrors.push(err179);
                          }
                          errors++;
                        }
                        for (const key31 in data64) {
                          if (key31 !== "profileId" && key31 !== "generation") {
                            const err180 = {
                              instancePath:
                                instancePath +
                                "/operation/selection/owner/" +
                                key31.replace(/~/g, "~0").replace(/\//g, "~1"),
                              schemaPath:
                                "/mapping/recoverInk/properties/operation/mapping/teaching/properties/selection/properties/owner",
                              keyword: "properties",
                              params: {
                                error: "additional",
                                additionalProperty: key31,
                              },
                              message: "must NOT have additional properties",
                            };
                            if (vErrors === null) {
                              vErrors = [err180];
                            } else {
                              vErrors.push(err180);
                            }
                            errors++;
                          }
                        }
                      }
                      if (!valid118) {
                        const err181 = {
                          instancePath:
                            instancePath + "/operation/selection/owner",
                          schemaPath:
                            "/mapping/recoverInk/properties/operation/mapping/teaching/properties/selection/properties/owner/properties",
                          keyword: "properties",
                          params: { type: "object", nullable: false },
                          message: "must be object",
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
                        instancePath: instancePath + "/operation/selection",
                        schemaPath:
                          "/mapping/recoverInk/properties/operation/mapping/teaching/properties/selection/properties/owner",
                        keyword: "properties",
                        params: { error: "missing", missingProperty: "owner" },
                        message: "must have property 'owner'",
                      };
                      if (vErrors === null) {
                        vErrors = [err182];
                      } else {
                        vErrors.push(err182);
                      }
                      errors++;
                    }
                    for (const key32 in data61) {
                      if (
                        key32 !== "installationId" &&
                        key32 !== "revision" &&
                        key32 !== "owner"
                      ) {
                        const err183 = {
                          instancePath:
                            instancePath +
                            "/operation/selection/" +
                            key32.replace(/~/g, "~0").replace(/\//g, "~1"),
                          schemaPath:
                            "/mapping/recoverInk/properties/operation/mapping/teaching/properties/selection",
                          keyword: "properties",
                          params: {
                            error: "additional",
                            additionalProperty: key32,
                          },
                          message: "must NOT have additional properties",
                        };
                        if (vErrors === null) {
                          vErrors = [err183];
                        } else {
                          vErrors.push(err183);
                        }
                        errors++;
                      }
                    }
                  }
                  if (!valid116) {
                    const err184 = {
                      instancePath: instancePath + "/operation/selection",
                      schemaPath:
                        "/mapping/recoverInk/properties/operation/mapping/teaching/properties/selection/properties",
                      keyword: "properties",
                      params: { type: "object", nullable: false },
                      message: "must be object",
                    };
                    if (vErrors === null) {
                      vErrors = [err184];
                    } else {
                      vErrors.push(err184);
                    }
                    errors++;
                  }
                } else {
                  const err185 = {
                    instancePath: instancePath + "/operation",
                    schemaPath:
                      "/mapping/recoverInk/properties/operation/mapping/teaching/properties/selection",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "selection" },
                    message: "must have property 'selection'",
                  };
                  if (vErrors === null) {
                    vErrors = [err185];
                  } else {
                    vErrors.push(err185);
                  }
                  errors++;
                }
                for (const key33 in data60) {
                  if (
                    key33 !== "kind" &&
                    key33 !== "selection" &&
                    key33 !== "command"
                  ) {
                    const err186 = {
                      instancePath:
                        instancePath +
                        "/operation/" +
                        key33.replace(/~/g, "~0").replace(/\//g, "~1"),
                      schemaPath:
                        "/mapping/recoverInk/properties/operation/mapping/teaching",
                      keyword: "properties",
                      params: {
                        error: "additional",
                        additionalProperty: key33,
                      },
                      message: "must NOT have additional properties",
                    };
                    if (vErrors === null) {
                      vErrors = [err186];
                    } else {
                      vErrors.push(err186);
                    }
                    errors++;
                  }
                }
                if (!valid114) {
                  const err187 = {
                    instancePath: instancePath + "/operation",
                    schemaPath:
                      "/mapping/recoverInk/properties/operation/mapping/teaching/properties",
                    keyword: "properties",
                    params: { type: "object", nullable: false },
                    message: "must be object",
                  };
                  if (vErrors === null) {
                    vErrors = [err187];
                  } else {
                    vErrors.push(err187);
                  }
                  errors++;
                }
                var valid113 = _errs75 === errors;
                valid112 = valid113;
              } else if (tag3 === "ink") {
                const _errs82 = errors;
                let valid124 = false;
                valid124 = true;
                if (data60.selection !== undefined) {
                  let data67 = data60.selection;
                  let valid126 = false;
                  if (
                    data67 &&
                    typeof data67 == "object" &&
                    !Array.isArray(data67)
                  ) {
                    valid126 = true;
                    if (data67.installationId !== undefined) {
                      if (!(typeof data67.installationId == "string")) {
                        const err188 = {
                          instancePath:
                            instancePath +
                            "/operation/selection/installationId",
                          schemaPath:
                            "/mapping/recoverInk/properties/operation/mapping/ink/properties/selection/properties/installationId/type",
                          keyword: "type",
                          params: { type: "string", nullable: false },
                          message: "must be string",
                        };
                        if (vErrors === null) {
                          vErrors = [err188];
                        } else {
                          vErrors.push(err188);
                        }
                        errors++;
                      }
                    } else {
                      const err189 = {
                        instancePath: instancePath + "/operation/selection",
                        schemaPath:
                          "/mapping/recoverInk/properties/operation/mapping/ink/properties/selection/properties/installationId",
                        keyword: "properties",
                        params: {
                          error: "missing",
                          missingProperty: "installationId",
                        },
                        message: "must have property 'installationId'",
                      };
                      if (vErrors === null) {
                        vErrors = [err189];
                      } else {
                        vErrors.push(err189);
                      }
                      errors++;
                    }
                    if (data67.revision !== undefined) {
                      if (!(typeof data67.revision == "string")) {
                        const err190 = {
                          instancePath:
                            instancePath + "/operation/selection/revision",
                          schemaPath:
                            "/mapping/recoverInk/properties/operation/mapping/ink/properties/selection/properties/revision/type",
                          keyword: "type",
                          params: { type: "string", nullable: false },
                          message: "must be string",
                        };
                        if (vErrors === null) {
                          vErrors = [err190];
                        } else {
                          vErrors.push(err190);
                        }
                        errors++;
                      }
                    } else {
                      const err191 = {
                        instancePath: instancePath + "/operation/selection",
                        schemaPath:
                          "/mapping/recoverInk/properties/operation/mapping/ink/properties/selection/properties/revision",
                        keyword: "properties",
                        params: {
                          error: "missing",
                          missingProperty: "revision",
                        },
                        message: "must have property 'revision'",
                      };
                      if (vErrors === null) {
                        vErrors = [err191];
                      } else {
                        vErrors.push(err191);
                      }
                      errors++;
                    }
                    if (data67.owner !== undefined) {
                      let data70 = data67.owner;
                      let valid128 = false;
                      if (
                        data70 &&
                        typeof data70 == "object" &&
                        !Array.isArray(data70)
                      ) {
                        valid128 = true;
                        if (data70.profileId !== undefined) {
                          if (!(typeof data70.profileId == "string")) {
                            const err192 = {
                              instancePath:
                                instancePath +
                                "/operation/selection/owner/profileId",
                              schemaPath:
                                "/mapping/recoverInk/properties/operation/mapping/ink/properties/selection/properties/owner/properties/profileId/type",
                              keyword: "type",
                              params: { type: "string", nullable: false },
                              message: "must be string",
                            };
                            if (vErrors === null) {
                              vErrors = [err192];
                            } else {
                              vErrors.push(err192);
                            }
                            errors++;
                          }
                        } else {
                          const err193 = {
                            instancePath:
                              instancePath + "/operation/selection/owner",
                            schemaPath:
                              "/mapping/recoverInk/properties/operation/mapping/ink/properties/selection/properties/owner/properties/profileId",
                            keyword: "properties",
                            params: {
                              error: "missing",
                              missingProperty: "profileId",
                            },
                            message: "must have property 'profileId'",
                          };
                          if (vErrors === null) {
                            vErrors = [err193];
                          } else {
                            vErrors.push(err193);
                          }
                          errors++;
                        }
                        if (data70.generation !== undefined) {
                          if (!(typeof data70.generation == "string")) {
                            const err194 = {
                              instancePath:
                                instancePath +
                                "/operation/selection/owner/generation",
                              schemaPath:
                                "/mapping/recoverInk/properties/operation/mapping/ink/properties/selection/properties/owner/properties/generation/type",
                              keyword: "type",
                              params: { type: "string", nullable: false },
                              message: "must be string",
                            };
                            if (vErrors === null) {
                              vErrors = [err194];
                            } else {
                              vErrors.push(err194);
                            }
                            errors++;
                          }
                        } else {
                          const err195 = {
                            instancePath:
                              instancePath + "/operation/selection/owner",
                            schemaPath:
                              "/mapping/recoverInk/properties/operation/mapping/ink/properties/selection/properties/owner/properties/generation",
                            keyword: "properties",
                            params: {
                              error: "missing",
                              missingProperty: "generation",
                            },
                            message: "must have property 'generation'",
                          };
                          if (vErrors === null) {
                            vErrors = [err195];
                          } else {
                            vErrors.push(err195);
                          }
                          errors++;
                        }
                        for (const key34 in data70) {
                          if (key34 !== "profileId" && key34 !== "generation") {
                            const err196 = {
                              instancePath:
                                instancePath +
                                "/operation/selection/owner/" +
                                key34.replace(/~/g, "~0").replace(/\//g, "~1"),
                              schemaPath:
                                "/mapping/recoverInk/properties/operation/mapping/ink/properties/selection/properties/owner",
                              keyword: "properties",
                              params: {
                                error: "additional",
                                additionalProperty: key34,
                              },
                              message: "must NOT have additional properties",
                            };
                            if (vErrors === null) {
                              vErrors = [err196];
                            } else {
                              vErrors.push(err196);
                            }
                            errors++;
                          }
                        }
                      }
                      if (!valid128) {
                        const err197 = {
                          instancePath:
                            instancePath + "/operation/selection/owner",
                          schemaPath:
                            "/mapping/recoverInk/properties/operation/mapping/ink/properties/selection/properties/owner/properties",
                          keyword: "properties",
                          params: { type: "object", nullable: false },
                          message: "must be object",
                        };
                        if (vErrors === null) {
                          vErrors = [err197];
                        } else {
                          vErrors.push(err197);
                        }
                        errors++;
                      }
                    } else {
                      const err198 = {
                        instancePath: instancePath + "/operation/selection",
                        schemaPath:
                          "/mapping/recoverInk/properties/operation/mapping/ink/properties/selection/properties/owner",
                        keyword: "properties",
                        params: { error: "missing", missingProperty: "owner" },
                        message: "must have property 'owner'",
                      };
                      if (vErrors === null) {
                        vErrors = [err198];
                      } else {
                        vErrors.push(err198);
                      }
                      errors++;
                    }
                    for (const key35 in data67) {
                      if (
                        key35 !== "installationId" &&
                        key35 !== "revision" &&
                        key35 !== "owner"
                      ) {
                        const err199 = {
                          instancePath:
                            instancePath +
                            "/operation/selection/" +
                            key35.replace(/~/g, "~0").replace(/\//g, "~1"),
                          schemaPath:
                            "/mapping/recoverInk/properties/operation/mapping/ink/properties/selection",
                          keyword: "properties",
                          params: {
                            error: "additional",
                            additionalProperty: key35,
                          },
                          message: "must NOT have additional properties",
                        };
                        if (vErrors === null) {
                          vErrors = [err199];
                        } else {
                          vErrors.push(err199);
                        }
                        errors++;
                      }
                    }
                  }
                  if (!valid126) {
                    const err200 = {
                      instancePath: instancePath + "/operation/selection",
                      schemaPath:
                        "/mapping/recoverInk/properties/operation/mapping/ink/properties/selection/properties",
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
                } else {
                  const err201 = {
                    instancePath: instancePath + "/operation",
                    schemaPath:
                      "/mapping/recoverInk/properties/operation/mapping/ink/properties/selection",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "selection" },
                    message: "must have property 'selection'",
                  };
                  if (vErrors === null) {
                    vErrors = [err201];
                  } else {
                    vErrors.push(err201);
                  }
                  errors++;
                }
                for (const key36 in data60) {
                  if (
                    key36 !== "kind" &&
                    key36 !== "selection" &&
                    key36 !== "command"
                  ) {
                    const err202 = {
                      instancePath:
                        instancePath +
                        "/operation/" +
                        key36.replace(/~/g, "~0").replace(/\//g, "~1"),
                      schemaPath:
                        "/mapping/recoverInk/properties/operation/mapping/ink",
                      keyword: "properties",
                      params: {
                        error: "additional",
                        additionalProperty: key36,
                      },
                      message: "must NOT have additional properties",
                    };
                    if (vErrors === null) {
                      vErrors = [err202];
                    } else {
                      vErrors.push(err202);
                    }
                    errors++;
                  }
                }
                if (!valid124) {
                  const err203 = {
                    instancePath: instancePath + "/operation",
                    schemaPath:
                      "/mapping/recoverInk/properties/operation/mapping/ink/properties",
                    keyword: "properties",
                    params: { type: "object", nullable: false },
                    message: "must be object",
                  };
                  if (vErrors === null) {
                    vErrors = [err203];
                  } else {
                    vErrors.push(err203);
                  }
                  errors++;
                }
                var valid123 = _errs82 === errors;
                valid112 = valid123;
              } else {
                const err204 = {
                  instancePath: instancePath + "/operation/kind",
                  schemaPath:
                    "/mapping/recoverInk/properties/operation/mapping",
                  keyword: "discriminator",
                  params: { error: "mapping", tag: "kind", tagValue: tag3 },
                  message: 'value of tag "kind" must be in mapping',
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
                instancePath: instancePath + "/operation/kind",
                schemaPath:
                  "/mapping/recoverInk/properties/operation/discriminator",
                keyword: "discriminator",
                params: { error: "tag", tag: "kind", tagValue: tag3 },
                message: 'tag "kind" must be string',
              };
              if (vErrors === null) {
                vErrors = [err205];
              } else {
                vErrors.push(err205);
              }
              errors++;
            }
          } else if (!valid112) {
            const err206 = {
              instancePath: instancePath + "/operation",
              schemaPath:
                "/mapping/recoverInk/properties/operation/discriminator",
              keyword: "discriminator",
              params: { type: "object", nullable: false },
              message: "must be object",
            };
            if (vErrors === null) {
              vErrors = [err206];
            } else {
              vErrors.push(err206);
            }
            errors++;
          }
        } else {
          const err207 = {
            instancePath,
            schemaPath: "/mapping/recoverInk/properties/operation",
            keyword: "properties",
            params: { error: "missing", missingProperty: "operation" },
            message: "must have property 'operation'",
          };
          if (vErrors === null) {
            vErrors = [err207];
          } else {
            vErrors.push(err207);
          }
          errors++;
        }
        for (const key37 in data) {
          if (
            key37 !== "kind" &&
            key37 !== "id" &&
            key37 !== "recoveryId" &&
            key37 !== "operation"
          ) {
            const err208 = {
              instancePath:
                instancePath +
                "/" +
                key37.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/recoverInk",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key37 },
              message: "must NOT have additional properties",
            };
            if (vErrors === null) {
              vErrors = [err208];
            } else {
              vErrors.push(err208);
            }
            errors++;
          }
        }
        if (!valid110) {
          const err209 = {
            instancePath,
            schemaPath: "/mapping/recoverInk/properties",
            keyword: "properties",
            params: { type: "object", nullable: false },
            message: "must be object",
          };
          if (vErrors === null) {
            vErrors = [err209];
          } else {
            vErrors.push(err209);
          }
          errors++;
        }
        var valid109 = _errs71 === errors;
        valid0 = valid109;
      } else if (tag0 === "recoverTeaching") {
        const _errs89 = errors;
        let valid135 = false;
        valid135 = true;
        if (data.id !== undefined) {
          if (!(typeof data.id == "string")) {
            const err210 = {
              instancePath: instancePath + "/id",
              schemaPath: "/mapping/recoverTeaching/properties/id/type",
              keyword: "type",
              params: { type: "string", nullable: false },
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
            instancePath,
            schemaPath: "/mapping/recoverTeaching/properties/id",
            keyword: "properties",
            params: { error: "missing", missingProperty: "id" },
            message: "must have property 'id'",
          };
          if (vErrors === null) {
            vErrors = [err211];
          } else {
            vErrors.push(err211);
          }
          errors++;
        }
        if (data.recoveryId !== undefined) {
          if (!(typeof data.recoveryId == "string")) {
            const err212 = {
              instancePath: instancePath + "/recoveryId",
              schemaPath: "/mapping/recoverTeaching/properties/recoveryId/type",
              keyword: "type",
              params: { type: "string", nullable: false },
              message: "must be string",
            };
            if (vErrors === null) {
              vErrors = [err212];
            } else {
              vErrors.push(err212);
            }
            errors++;
          }
        } else {
          const err213 = {
            instancePath,
            schemaPath: "/mapping/recoverTeaching/properties/recoveryId",
            keyword: "properties",
            params: { error: "missing", missingProperty: "recoveryId" },
            message: "must have property 'recoveryId'",
          };
          if (vErrors === null) {
            vErrors = [err213];
          } else {
            vErrors.push(err213);
          }
          errors++;
        }
        if (data.operation !== undefined) {
          let data75 = data.operation;
          let valid137 = false;
          if (data75 && typeof data75 == "object" && !Array.isArray(data75)) {
            const tag4 = data75.kind;
            if (tag4 === undefined) {
              const err214 = {
                instancePath: instancePath + "/operation",
                schemaPath:
                  "/mapping/recoverTeaching/properties/operation/discriminator",
                keyword: "discriminator",
                params: { error: "tag", tag: "kind", tagValue: tag4 },
                message: 'tag "kind" must be string',
              };
              if (vErrors === null) {
                vErrors = [err214];
              } else {
                vErrors.push(err214);
              }
              errors++;
            } else if (typeof tag4 == "string") {
              if (tag4 === "teaching") {
                const _errs93 = errors;
                let valid139 = false;
                valid139 = true;
                if (data75.selection !== undefined) {
                  let data76 = data75.selection;
                  let valid141 = false;
                  if (
                    data76 &&
                    typeof data76 == "object" &&
                    !Array.isArray(data76)
                  ) {
                    valid141 = true;
                    if (data76.installationId !== undefined) {
                      if (!(typeof data76.installationId == "string")) {
                        const err215 = {
                          instancePath:
                            instancePath +
                            "/operation/selection/installationId",
                          schemaPath:
                            "/mapping/recoverTeaching/properties/operation/mapping/teaching/properties/selection/properties/installationId/type",
                          keyword: "type",
                          params: { type: "string", nullable: false },
                          message: "must be string",
                        };
                        if (vErrors === null) {
                          vErrors = [err215];
                        } else {
                          vErrors.push(err215);
                        }
                        errors++;
                      }
                    } else {
                      const err216 = {
                        instancePath: instancePath + "/operation/selection",
                        schemaPath:
                          "/mapping/recoverTeaching/properties/operation/mapping/teaching/properties/selection/properties/installationId",
                        keyword: "properties",
                        params: {
                          error: "missing",
                          missingProperty: "installationId",
                        },
                        message: "must have property 'installationId'",
                      };
                      if (vErrors === null) {
                        vErrors = [err216];
                      } else {
                        vErrors.push(err216);
                      }
                      errors++;
                    }
                    if (data76.revision !== undefined) {
                      if (!(typeof data76.revision == "string")) {
                        const err217 = {
                          instancePath:
                            instancePath + "/operation/selection/revision",
                          schemaPath:
                            "/mapping/recoverTeaching/properties/operation/mapping/teaching/properties/selection/properties/revision/type",
                          keyword: "type",
                          params: { type: "string", nullable: false },
                          message: "must be string",
                        };
                        if (vErrors === null) {
                          vErrors = [err217];
                        } else {
                          vErrors.push(err217);
                        }
                        errors++;
                      }
                    } else {
                      const err218 = {
                        instancePath: instancePath + "/operation/selection",
                        schemaPath:
                          "/mapping/recoverTeaching/properties/operation/mapping/teaching/properties/selection/properties/revision",
                        keyword: "properties",
                        params: {
                          error: "missing",
                          missingProperty: "revision",
                        },
                        message: "must have property 'revision'",
                      };
                      if (vErrors === null) {
                        vErrors = [err218];
                      } else {
                        vErrors.push(err218);
                      }
                      errors++;
                    }
                    if (data76.owner !== undefined) {
                      let data79 = data76.owner;
                      let valid143 = false;
                      if (
                        data79 &&
                        typeof data79 == "object" &&
                        !Array.isArray(data79)
                      ) {
                        valid143 = true;
                        if (data79.profileId !== undefined) {
                          if (!(typeof data79.profileId == "string")) {
                            const err219 = {
                              instancePath:
                                instancePath +
                                "/operation/selection/owner/profileId",
                              schemaPath:
                                "/mapping/recoverTeaching/properties/operation/mapping/teaching/properties/selection/properties/owner/properties/profileId/type",
                              keyword: "type",
                              params: { type: "string", nullable: false },
                              message: "must be string",
                            };
                            if (vErrors === null) {
                              vErrors = [err219];
                            } else {
                              vErrors.push(err219);
                            }
                            errors++;
                          }
                        } else {
                          const err220 = {
                            instancePath:
                              instancePath + "/operation/selection/owner",
                            schemaPath:
                              "/mapping/recoverTeaching/properties/operation/mapping/teaching/properties/selection/properties/owner/properties/profileId",
                            keyword: "properties",
                            params: {
                              error: "missing",
                              missingProperty: "profileId",
                            },
                            message: "must have property 'profileId'",
                          };
                          if (vErrors === null) {
                            vErrors = [err220];
                          } else {
                            vErrors.push(err220);
                          }
                          errors++;
                        }
                        if (data79.generation !== undefined) {
                          if (!(typeof data79.generation == "string")) {
                            const err221 = {
                              instancePath:
                                instancePath +
                                "/operation/selection/owner/generation",
                              schemaPath:
                                "/mapping/recoverTeaching/properties/operation/mapping/teaching/properties/selection/properties/owner/properties/generation/type",
                              keyword: "type",
                              params: { type: "string", nullable: false },
                              message: "must be string",
                            };
                            if (vErrors === null) {
                              vErrors = [err221];
                            } else {
                              vErrors.push(err221);
                            }
                            errors++;
                          }
                        } else {
                          const err222 = {
                            instancePath:
                              instancePath + "/operation/selection/owner",
                            schemaPath:
                              "/mapping/recoverTeaching/properties/operation/mapping/teaching/properties/selection/properties/owner/properties/generation",
                            keyword: "properties",
                            params: {
                              error: "missing",
                              missingProperty: "generation",
                            },
                            message: "must have property 'generation'",
                          };
                          if (vErrors === null) {
                            vErrors = [err222];
                          } else {
                            vErrors.push(err222);
                          }
                          errors++;
                        }
                        for (const key38 in data79) {
                          if (key38 !== "profileId" && key38 !== "generation") {
                            const err223 = {
                              instancePath:
                                instancePath +
                                "/operation/selection/owner/" +
                                key38.replace(/~/g, "~0").replace(/\//g, "~1"),
                              schemaPath:
                                "/mapping/recoverTeaching/properties/operation/mapping/teaching/properties/selection/properties/owner",
                              keyword: "properties",
                              params: {
                                error: "additional",
                                additionalProperty: key38,
                              },
                              message: "must NOT have additional properties",
                            };
                            if (vErrors === null) {
                              vErrors = [err223];
                            } else {
                              vErrors.push(err223);
                            }
                            errors++;
                          }
                        }
                      }
                      if (!valid143) {
                        const err224 = {
                          instancePath:
                            instancePath + "/operation/selection/owner",
                          schemaPath:
                            "/mapping/recoverTeaching/properties/operation/mapping/teaching/properties/selection/properties/owner/properties",
                          keyword: "properties",
                          params: { type: "object", nullable: false },
                          message: "must be object",
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
                        instancePath: instancePath + "/operation/selection",
                        schemaPath:
                          "/mapping/recoverTeaching/properties/operation/mapping/teaching/properties/selection/properties/owner",
                        keyword: "properties",
                        params: { error: "missing", missingProperty: "owner" },
                        message: "must have property 'owner'",
                      };
                      if (vErrors === null) {
                        vErrors = [err225];
                      } else {
                        vErrors.push(err225);
                      }
                      errors++;
                    }
                    for (const key39 in data76) {
                      if (
                        key39 !== "installationId" &&
                        key39 !== "revision" &&
                        key39 !== "owner"
                      ) {
                        const err226 = {
                          instancePath:
                            instancePath +
                            "/operation/selection/" +
                            key39.replace(/~/g, "~0").replace(/\//g, "~1"),
                          schemaPath:
                            "/mapping/recoverTeaching/properties/operation/mapping/teaching/properties/selection",
                          keyword: "properties",
                          params: {
                            error: "additional",
                            additionalProperty: key39,
                          },
                          message: "must NOT have additional properties",
                        };
                        if (vErrors === null) {
                          vErrors = [err226];
                        } else {
                          vErrors.push(err226);
                        }
                        errors++;
                      }
                    }
                  }
                  if (!valid141) {
                    const err227 = {
                      instancePath: instancePath + "/operation/selection",
                      schemaPath:
                        "/mapping/recoverTeaching/properties/operation/mapping/teaching/properties/selection/properties",
                      keyword: "properties",
                      params: { type: "object", nullable: false },
                      message: "must be object",
                    };
                    if (vErrors === null) {
                      vErrors = [err227];
                    } else {
                      vErrors.push(err227);
                    }
                    errors++;
                  }
                } else {
                  const err228 = {
                    instancePath: instancePath + "/operation",
                    schemaPath:
                      "/mapping/recoverTeaching/properties/operation/mapping/teaching/properties/selection",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "selection" },
                    message: "must have property 'selection'",
                  };
                  if (vErrors === null) {
                    vErrors = [err228];
                  } else {
                    vErrors.push(err228);
                  }
                  errors++;
                }
                for (const key40 in data75) {
                  if (
                    key40 !== "kind" &&
                    key40 !== "selection" &&
                    key40 !== "command"
                  ) {
                    const err229 = {
                      instancePath:
                        instancePath +
                        "/operation/" +
                        key40.replace(/~/g, "~0").replace(/\//g, "~1"),
                      schemaPath:
                        "/mapping/recoverTeaching/properties/operation/mapping/teaching",
                      keyword: "properties",
                      params: {
                        error: "additional",
                        additionalProperty: key40,
                      },
                      message: "must NOT have additional properties",
                    };
                    if (vErrors === null) {
                      vErrors = [err229];
                    } else {
                      vErrors.push(err229);
                    }
                    errors++;
                  }
                }
                if (!valid139) {
                  const err230 = {
                    instancePath: instancePath + "/operation",
                    schemaPath:
                      "/mapping/recoverTeaching/properties/operation/mapping/teaching/properties",
                    keyword: "properties",
                    params: { type: "object", nullable: false },
                    message: "must be object",
                  };
                  if (vErrors === null) {
                    vErrors = [err230];
                  } else {
                    vErrors.push(err230);
                  }
                  errors++;
                }
                var valid138 = _errs93 === errors;
                valid137 = valid138;
              } else if (tag4 === "ink") {
                const _errs100 = errors;
                let valid149 = false;
                valid149 = true;
                if (data75.selection !== undefined) {
                  let data82 = data75.selection;
                  let valid151 = false;
                  if (
                    data82 &&
                    typeof data82 == "object" &&
                    !Array.isArray(data82)
                  ) {
                    valid151 = true;
                    if (data82.installationId !== undefined) {
                      if (!(typeof data82.installationId == "string")) {
                        const err231 = {
                          instancePath:
                            instancePath +
                            "/operation/selection/installationId",
                          schemaPath:
                            "/mapping/recoverTeaching/properties/operation/mapping/ink/properties/selection/properties/installationId/type",
                          keyword: "type",
                          params: { type: "string", nullable: false },
                          message: "must be string",
                        };
                        if (vErrors === null) {
                          vErrors = [err231];
                        } else {
                          vErrors.push(err231);
                        }
                        errors++;
                      }
                    } else {
                      const err232 = {
                        instancePath: instancePath + "/operation/selection",
                        schemaPath:
                          "/mapping/recoverTeaching/properties/operation/mapping/ink/properties/selection/properties/installationId",
                        keyword: "properties",
                        params: {
                          error: "missing",
                          missingProperty: "installationId",
                        },
                        message: "must have property 'installationId'",
                      };
                      if (vErrors === null) {
                        vErrors = [err232];
                      } else {
                        vErrors.push(err232);
                      }
                      errors++;
                    }
                    if (data82.revision !== undefined) {
                      if (!(typeof data82.revision == "string")) {
                        const err233 = {
                          instancePath:
                            instancePath + "/operation/selection/revision",
                          schemaPath:
                            "/mapping/recoverTeaching/properties/operation/mapping/ink/properties/selection/properties/revision/type",
                          keyword: "type",
                          params: { type: "string", nullable: false },
                          message: "must be string",
                        };
                        if (vErrors === null) {
                          vErrors = [err233];
                        } else {
                          vErrors.push(err233);
                        }
                        errors++;
                      }
                    } else {
                      const err234 = {
                        instancePath: instancePath + "/operation/selection",
                        schemaPath:
                          "/mapping/recoverTeaching/properties/operation/mapping/ink/properties/selection/properties/revision",
                        keyword: "properties",
                        params: {
                          error: "missing",
                          missingProperty: "revision",
                        },
                        message: "must have property 'revision'",
                      };
                      if (vErrors === null) {
                        vErrors = [err234];
                      } else {
                        vErrors.push(err234);
                      }
                      errors++;
                    }
                    if (data82.owner !== undefined) {
                      let data85 = data82.owner;
                      let valid153 = false;
                      if (
                        data85 &&
                        typeof data85 == "object" &&
                        !Array.isArray(data85)
                      ) {
                        valid153 = true;
                        if (data85.profileId !== undefined) {
                          if (!(typeof data85.profileId == "string")) {
                            const err235 = {
                              instancePath:
                                instancePath +
                                "/operation/selection/owner/profileId",
                              schemaPath:
                                "/mapping/recoverTeaching/properties/operation/mapping/ink/properties/selection/properties/owner/properties/profileId/type",
                              keyword: "type",
                              params: { type: "string", nullable: false },
                              message: "must be string",
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
                              instancePath + "/operation/selection/owner",
                            schemaPath:
                              "/mapping/recoverTeaching/properties/operation/mapping/ink/properties/selection/properties/owner/properties/profileId",
                            keyword: "properties",
                            params: {
                              error: "missing",
                              missingProperty: "profileId",
                            },
                            message: "must have property 'profileId'",
                          };
                          if (vErrors === null) {
                            vErrors = [err236];
                          } else {
                            vErrors.push(err236);
                          }
                          errors++;
                        }
                        if (data85.generation !== undefined) {
                          if (!(typeof data85.generation == "string")) {
                            const err237 = {
                              instancePath:
                                instancePath +
                                "/operation/selection/owner/generation",
                              schemaPath:
                                "/mapping/recoverTeaching/properties/operation/mapping/ink/properties/selection/properties/owner/properties/generation/type",
                              keyword: "type",
                              params: { type: "string", nullable: false },
                              message: "must be string",
                            };
                            if (vErrors === null) {
                              vErrors = [err237];
                            } else {
                              vErrors.push(err237);
                            }
                            errors++;
                          }
                        } else {
                          const err238 = {
                            instancePath:
                              instancePath + "/operation/selection/owner",
                            schemaPath:
                              "/mapping/recoverTeaching/properties/operation/mapping/ink/properties/selection/properties/owner/properties/generation",
                            keyword: "properties",
                            params: {
                              error: "missing",
                              missingProperty: "generation",
                            },
                            message: "must have property 'generation'",
                          };
                          if (vErrors === null) {
                            vErrors = [err238];
                          } else {
                            vErrors.push(err238);
                          }
                          errors++;
                        }
                        for (const key41 in data85) {
                          if (key41 !== "profileId" && key41 !== "generation") {
                            const err239 = {
                              instancePath:
                                instancePath +
                                "/operation/selection/owner/" +
                                key41.replace(/~/g, "~0").replace(/\//g, "~1"),
                              schemaPath:
                                "/mapping/recoverTeaching/properties/operation/mapping/ink/properties/selection/properties/owner",
                              keyword: "properties",
                              params: {
                                error: "additional",
                                additionalProperty: key41,
                              },
                              message: "must NOT have additional properties",
                            };
                            if (vErrors === null) {
                              vErrors = [err239];
                            } else {
                              vErrors.push(err239);
                            }
                            errors++;
                          }
                        }
                      }
                      if (!valid153) {
                        const err240 = {
                          instancePath:
                            instancePath + "/operation/selection/owner",
                          schemaPath:
                            "/mapping/recoverTeaching/properties/operation/mapping/ink/properties/selection/properties/owner/properties",
                          keyword: "properties",
                          params: { type: "object", nullable: false },
                          message: "must be object",
                        };
                        if (vErrors === null) {
                          vErrors = [err240];
                        } else {
                          vErrors.push(err240);
                        }
                        errors++;
                      }
                    } else {
                      const err241 = {
                        instancePath: instancePath + "/operation/selection",
                        schemaPath:
                          "/mapping/recoverTeaching/properties/operation/mapping/ink/properties/selection/properties/owner",
                        keyword: "properties",
                        params: { error: "missing", missingProperty: "owner" },
                        message: "must have property 'owner'",
                      };
                      if (vErrors === null) {
                        vErrors = [err241];
                      } else {
                        vErrors.push(err241);
                      }
                      errors++;
                    }
                    for (const key42 in data82) {
                      if (
                        key42 !== "installationId" &&
                        key42 !== "revision" &&
                        key42 !== "owner"
                      ) {
                        const err242 = {
                          instancePath:
                            instancePath +
                            "/operation/selection/" +
                            key42.replace(/~/g, "~0").replace(/\//g, "~1"),
                          schemaPath:
                            "/mapping/recoverTeaching/properties/operation/mapping/ink/properties/selection",
                          keyword: "properties",
                          params: {
                            error: "additional",
                            additionalProperty: key42,
                          },
                          message: "must NOT have additional properties",
                        };
                        if (vErrors === null) {
                          vErrors = [err242];
                        } else {
                          vErrors.push(err242);
                        }
                        errors++;
                      }
                    }
                  }
                  if (!valid151) {
                    const err243 = {
                      instancePath: instancePath + "/operation/selection",
                      schemaPath:
                        "/mapping/recoverTeaching/properties/operation/mapping/ink/properties/selection/properties",
                      keyword: "properties",
                      params: { type: "object", nullable: false },
                      message: "must be object",
                    };
                    if (vErrors === null) {
                      vErrors = [err243];
                    } else {
                      vErrors.push(err243);
                    }
                    errors++;
                  }
                } else {
                  const err244 = {
                    instancePath: instancePath + "/operation",
                    schemaPath:
                      "/mapping/recoverTeaching/properties/operation/mapping/ink/properties/selection",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "selection" },
                    message: "must have property 'selection'",
                  };
                  if (vErrors === null) {
                    vErrors = [err244];
                  } else {
                    vErrors.push(err244);
                  }
                  errors++;
                }
                for (const key43 in data75) {
                  if (
                    key43 !== "kind" &&
                    key43 !== "selection" &&
                    key43 !== "command"
                  ) {
                    const err245 = {
                      instancePath:
                        instancePath +
                        "/operation/" +
                        key43.replace(/~/g, "~0").replace(/\//g, "~1"),
                      schemaPath:
                        "/mapping/recoverTeaching/properties/operation/mapping/ink",
                      keyword: "properties",
                      params: {
                        error: "additional",
                        additionalProperty: key43,
                      },
                      message: "must NOT have additional properties",
                    };
                    if (vErrors === null) {
                      vErrors = [err245];
                    } else {
                      vErrors.push(err245);
                    }
                    errors++;
                  }
                }
                if (!valid149) {
                  const err246 = {
                    instancePath: instancePath + "/operation",
                    schemaPath:
                      "/mapping/recoverTeaching/properties/operation/mapping/ink/properties",
                    keyword: "properties",
                    params: { type: "object", nullable: false },
                    message: "must be object",
                  };
                  if (vErrors === null) {
                    vErrors = [err246];
                  } else {
                    vErrors.push(err246);
                  }
                  errors++;
                }
                var valid148 = _errs100 === errors;
                valid137 = valid148;
              } else {
                const err247 = {
                  instancePath: instancePath + "/operation/kind",
                  schemaPath:
                    "/mapping/recoverTeaching/properties/operation/mapping",
                  keyword: "discriminator",
                  params: { error: "mapping", tag: "kind", tagValue: tag4 },
                  message: 'value of tag "kind" must be in mapping',
                };
                if (vErrors === null) {
                  vErrors = [err247];
                } else {
                  vErrors.push(err247);
                }
                errors++;
              }
            } else {
              const err248 = {
                instancePath: instancePath + "/operation/kind",
                schemaPath:
                  "/mapping/recoverTeaching/properties/operation/discriminator",
                keyword: "discriminator",
                params: { error: "tag", tag: "kind", tagValue: tag4 },
                message: 'tag "kind" must be string',
              };
              if (vErrors === null) {
                vErrors = [err248];
              } else {
                vErrors.push(err248);
              }
              errors++;
            }
          } else if (!valid137) {
            const err249 = {
              instancePath: instancePath + "/operation",
              schemaPath:
                "/mapping/recoverTeaching/properties/operation/discriminator",
              keyword: "discriminator",
              params: { type: "object", nullable: false },
              message: "must be object",
            };
            if (vErrors === null) {
              vErrors = [err249];
            } else {
              vErrors.push(err249);
            }
            errors++;
          }
        } else {
          const err250 = {
            instancePath,
            schemaPath: "/mapping/recoverTeaching/properties/operation",
            keyword: "properties",
            params: { error: "missing", missingProperty: "operation" },
            message: "must have property 'operation'",
          };
          if (vErrors === null) {
            vErrors = [err250];
          } else {
            vErrors.push(err250);
          }
          errors++;
        }
        for (const key44 in data) {
          if (
            key44 !== "kind" &&
            key44 !== "id" &&
            key44 !== "recoveryId" &&
            key44 !== "operation"
          ) {
            const err251 = {
              instancePath:
                instancePath +
                "/" +
                key44.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/recoverTeaching",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key44 },
              message: "must NOT have additional properties",
            };
            if (vErrors === null) {
              vErrors = [err251];
            } else {
              vErrors.push(err251);
            }
            errors++;
          }
        }
        if (!valid135) {
          const err252 = {
            instancePath,
            schemaPath: "/mapping/recoverTeaching/properties",
            keyword: "properties",
            params: { type: "object", nullable: false },
            message: "must be object",
          };
          if (vErrors === null) {
            vErrors = [err252];
          } else {
            vErrors.push(err252);
          }
          errors++;
        }
        var valid134 = _errs89 === errors;
        valid0 = valid134;
      } else if (tag0 === "recoverAdministration") {
        const _errs107 = errors;
        let valid160 = false;
        valid160 = true;
        if (data.id !== undefined) {
          if (!(typeof data.id == "string")) {
            const err253 = {
              instancePath: instancePath + "/id",
              schemaPath: "/mapping/recoverAdministration/properties/id/type",
              keyword: "type",
              params: { type: "string", nullable: false },
              message: "must be string",
            };
            if (vErrors === null) {
              vErrors = [err253];
            } else {
              vErrors.push(err253);
            }
            errors++;
          }
        } else {
          const err254 = {
            instancePath,
            schemaPath: "/mapping/recoverAdministration/properties/id",
            keyword: "properties",
            params: { error: "missing", missingProperty: "id" },
            message: "must have property 'id'",
          };
          if (vErrors === null) {
            vErrors = [err254];
          } else {
            vErrors.push(err254);
          }
          errors++;
        }
        if (data.recoveryId !== undefined) {
          if (!(typeof data.recoveryId == "string")) {
            const err255 = {
              instancePath: instancePath + "/recoveryId",
              schemaPath:
                "/mapping/recoverAdministration/properties/recoveryId/type",
              keyword: "type",
              params: { type: "string", nullable: false },
              message: "must be string",
            };
            if (vErrors === null) {
              vErrors = [err255];
            } else {
              vErrors.push(err255);
            }
            errors++;
          }
        } else {
          const err256 = {
            instancePath,
            schemaPath: "/mapping/recoverAdministration/properties/recoveryId",
            keyword: "properties",
            params: { error: "missing", missingProperty: "recoveryId" },
            message: "must have property 'recoveryId'",
          };
          if (vErrors === null) {
            vErrors = [err256];
          } else {
            vErrors.push(err256);
          }
          errors++;
        }
        for (const key45 in data) {
          if (
            key45 !== "kind" &&
            key45 !== "id" &&
            key45 !== "recoveryId" &&
            key45 !== "command"
          ) {
            const err257 = {
              instancePath:
                instancePath +
                "/" +
                key45.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/recoverAdministration",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key45 },
              message: "must NOT have additional properties",
            };
            if (vErrors === null) {
              vErrors = [err257];
            } else {
              vErrors.push(err257);
            }
            errors++;
          }
        }
        if (!valid160) {
          const err258 = {
            instancePath,
            schemaPath: "/mapping/recoverAdministration/properties",
            keyword: "properties",
            params: { type: "object", nullable: false },
            message: "must be object",
          };
          if (vErrors === null) {
            vErrors = [err258];
          } else {
            vErrors.push(err258);
          }
          errors++;
        }
        var valid159 = _errs107 === errors;
        valid0 = valid159;
      } else if (tag0 === "reconcileRecovery") {
        const _errs110 = errors;
        let valid164 = false;
        valid164 = true;
        if (data.id !== undefined) {
          if (!(typeof data.id == "string")) {
            const err259 = {
              instancePath: instancePath + "/id",
              schemaPath: "/mapping/reconcileRecovery/properties/id/type",
              keyword: "type",
              params: { type: "string", nullable: false },
              message: "must be string",
            };
            if (vErrors === null) {
              vErrors = [err259];
            } else {
              vErrors.push(err259);
            }
            errors++;
          }
        } else {
          const err260 = {
            instancePath,
            schemaPath: "/mapping/reconcileRecovery/properties/id",
            keyword: "properties",
            params: { error: "missing", missingProperty: "id" },
            message: "must have property 'id'",
          };
          if (vErrors === null) {
            vErrors = [err260];
          } else {
            vErrors.push(err260);
          }
          errors++;
        }
        if (data.recoveryId !== undefined) {
          if (!(typeof data.recoveryId == "string")) {
            const err261 = {
              instancePath: instancePath + "/recoveryId",
              schemaPath:
                "/mapping/reconcileRecovery/properties/recoveryId/type",
              keyword: "type",
              params: { type: "string", nullable: false },
              message: "must be string",
            };
            if (vErrors === null) {
              vErrors = [err261];
            } else {
              vErrors.push(err261);
            }
            errors++;
          }
        } else {
          const err262 = {
            instancePath,
            schemaPath: "/mapping/reconcileRecovery/properties/recoveryId",
            keyword: "properties",
            params: { error: "missing", missingProperty: "recoveryId" },
            message: "must have property 'recoveryId'",
          };
          if (vErrors === null) {
            vErrors = [err262];
          } else {
            vErrors.push(err262);
          }
          errors++;
        }
        for (const key46 in data) {
          if (
            key46 !== "kind" &&
            key46 !== "id" &&
            key46 !== "recoveryId" &&
            key46 !== "choice"
          ) {
            const err263 = {
              instancePath:
                instancePath +
                "/" +
                key46.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/reconcileRecovery",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key46 },
              message: "must NOT have additional properties",
            };
            if (vErrors === null) {
              vErrors = [err263];
            } else {
              vErrors.push(err263);
            }
            errors++;
          }
        }
        if (!valid164) {
          const err264 = {
            instancePath,
            schemaPath: "/mapping/reconcileRecovery/properties",
            keyword: "properties",
            params: { type: "object", nullable: false },
            message: "must be object",
          };
          if (vErrors === null) {
            vErrors = [err264];
          } else {
            vErrors.push(err264);
          }
          errors++;
        }
        var valid163 = _errs110 === errors;
        valid0 = valid163;
      } else {
        const err265 = {
          instancePath: instancePath + "/kind",
          schemaPath: "/mapping",
          keyword: "discriminator",
          params: { error: "mapping", tag: "kind", tagValue: tag0 },
          message: 'value of tag "kind" must be in mapping',
        };
        if (vErrors === null) {
          vErrors = [err265];
        } else {
          vErrors.push(err265);
        }
        errors++;
      }
    } else {
      const err266 = {
        instancePath: instancePath + "/kind",
        schemaPath: "/discriminator",
        keyword: "discriminator",
        params: { error: "tag", tag: "kind", tagValue: tag0 },
        message: 'tag "kind" must be string',
      };
      if (vErrors === null) {
        vErrors = [err266];
      } else {
        vErrors.push(err266);
      }
      errors++;
    }
  } else if (!valid0) {
    const err267 = {
      instancePath,
      schemaPath: "/discriminator",
      keyword: "discriminator",
      params: { type: "object", nullable: false },
      message: "must be object",
    };
    if (vErrors === null) {
      vErrors = [err267];
    } else {
      vErrors.push(err267);
    }
    errors++;
  }
  validate65.errors = vErrors;
  return errors === 0;
}
export const validateSelectedWorkerResponse = validate66;
const schema38 = {
  discriminator: "kind",
  mapping: {
    directory: { properties: { id: { type: "string" }, value: {} } },
    application: { properties: { id: { type: "string" }, value: {} } },
    work: { properties: { id: { type: "string" }, value: {} } },
    practiceControls: { properties: { id: { type: "string" }, value: {} } },
    execution: { properties: { id: { type: "string" }, value: {} } },
    profileReceipt: { properties: { id: { type: "string" }, value: {} } },
    departure: { properties: { id: { type: "string" }, value: {} } },
    inkSnapshot: { properties: { id: { type: "string" }, value: {} } },
    inventory: { properties: { id: { type: "string" }, value: {} } },
    inkRecovery: { properties: { id: { type: "string" }, value: {} } },
    teachingRecovery: { properties: { id: { type: "string" }, value: {} } },
    administrationRecovery: {
      properties: { id: { type: "string" }, value: {} },
    },
    reconciled: { properties: { id: { type: "string" }, value: {} } },
    failed: {
      properties: { id: { type: "string" }, message: { type: "string" } },
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
      if (tag0 === "directory") {
        const _errs0 = errors;
        let valid2 = false;
        valid2 = true;
        if (data.id !== undefined) {
          if (!(typeof data.id == "string")) {
            const err1 = {
              instancePath: instancePath + "/id",
              schemaPath: "/mapping/directory/properties/id/type",
              keyword: "type",
              params: { type: "string", nullable: false },
              message: "must be string",
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
            schemaPath: "/mapping/directory/properties/id",
            keyword: "properties",
            params: { error: "missing", missingProperty: "id" },
            message: "must have property 'id'",
          };
          if (vErrors === null) {
            vErrors = [err2];
          } else {
            vErrors.push(err2);
          }
          errors++;
        }
        for (const key0 in data) {
          if (key0 !== "kind" && key0 !== "id" && key0 !== "value") {
            const err3 = {
              instancePath:
                instancePath +
                "/" +
                key0.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/directory",
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
            schemaPath: "/mapping/directory/properties",
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
      } else if (tag0 === "application") {
        const _errs2 = errors;
        let valid6 = false;
        valid6 = true;
        if (data.id !== undefined) {
          if (!(typeof data.id == "string")) {
            const err5 = {
              instancePath: instancePath + "/id",
              schemaPath: "/mapping/application/properties/id/type",
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
            schemaPath: "/mapping/application/properties/id",
            keyword: "properties",
            params: { error: "missing", missingProperty: "id" },
            message: "must have property 'id'",
          };
          if (vErrors === null) {
            vErrors = [err6];
          } else {
            vErrors.push(err6);
          }
          errors++;
        }
        for (const key1 in data) {
          if (key1 !== "kind" && key1 !== "id" && key1 !== "value") {
            const err7 = {
              instancePath:
                instancePath +
                "/" +
                key1.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/application",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key1 },
              message: "must NOT have additional properties",
            };
            if (vErrors === null) {
              vErrors = [err7];
            } else {
              vErrors.push(err7);
            }
            errors++;
          }
        }
        if (!valid6) {
          const err8 = {
            instancePath,
            schemaPath: "/mapping/application/properties",
            keyword: "properties",
            params: { type: "object", nullable: false },
            message: "must be object",
          };
          if (vErrors === null) {
            vErrors = [err8];
          } else {
            vErrors.push(err8);
          }
          errors++;
        }
        var valid5 = _errs2 === errors;
        valid0 = valid5;
      } else if (tag0 === "work") {
        const _errs4 = errors;
        let valid10 = false;
        valid10 = true;
        if (data.id !== undefined) {
          if (!(typeof data.id == "string")) {
            const err9 = {
              instancePath: instancePath + "/id",
              schemaPath: "/mapping/work/properties/id/type",
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
            schemaPath: "/mapping/work/properties/id",
            keyword: "properties",
            params: { error: "missing", missingProperty: "id" },
            message: "must have property 'id'",
          };
          if (vErrors === null) {
            vErrors = [err10];
          } else {
            vErrors.push(err10);
          }
          errors++;
        }
        for (const key2 in data) {
          if (key2 !== "kind" && key2 !== "id" && key2 !== "value") {
            const err11 = {
              instancePath:
                instancePath +
                "/" +
                key2.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/work",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key2 },
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
        if (!valid10) {
          const err12 = {
            instancePath,
            schemaPath: "/mapping/work/properties",
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
        var valid9 = _errs4 === errors;
        valid0 = valid9;
      } else if (tag0 === "practiceControls") {
        const _errs6 = errors;
        let valid14 = false;
        valid14 = true;
        if (data.id !== undefined) {
          if (!(typeof data.id == "string")) {
            const err13 = {
              instancePath: instancePath + "/id",
              schemaPath: "/mapping/practiceControls/properties/id/type",
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
            instancePath,
            schemaPath: "/mapping/practiceControls/properties/id",
            keyword: "properties",
            params: { error: "missing", missingProperty: "id" },
            message: "must have property 'id'",
          };
          if (vErrors === null) {
            vErrors = [err14];
          } else {
            vErrors.push(err14);
          }
          errors++;
        }
        for (const key3 in data) {
          if (key3 !== "kind" && key3 !== "id" && key3 !== "value") {
            const err15 = {
              instancePath:
                instancePath +
                "/" +
                key3.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/practiceControls",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key3 },
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
        if (!valid14) {
          const err16 = {
            instancePath,
            schemaPath: "/mapping/practiceControls/properties",
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
        var valid13 = _errs6 === errors;
        valid0 = valid13;
      } else if (tag0 === "execution") {
        const _errs8 = errors;
        let valid18 = false;
        valid18 = true;
        if (data.id !== undefined) {
          if (!(typeof data.id == "string")) {
            const err17 = {
              instancePath: instancePath + "/id",
              schemaPath: "/mapping/execution/properties/id/type",
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
            schemaPath: "/mapping/execution/properties/id",
            keyword: "properties",
            params: { error: "missing", missingProperty: "id" },
            message: "must have property 'id'",
          };
          if (vErrors === null) {
            vErrors = [err18];
          } else {
            vErrors.push(err18);
          }
          errors++;
        }
        for (const key4 in data) {
          if (key4 !== "kind" && key4 !== "id" && key4 !== "value") {
            const err19 = {
              instancePath:
                instancePath +
                "/" +
                key4.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/execution",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key4 },
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
        if (!valid18) {
          const err20 = {
            instancePath,
            schemaPath: "/mapping/execution/properties",
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
        var valid17 = _errs8 === errors;
        valid0 = valid17;
      } else if (tag0 === "profileReceipt") {
        const _errs10 = errors;
        let valid22 = false;
        valid22 = true;
        if (data.id !== undefined) {
          if (!(typeof data.id == "string")) {
            const err21 = {
              instancePath: instancePath + "/id",
              schemaPath: "/mapping/profileReceipt/properties/id/type",
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
            schemaPath: "/mapping/profileReceipt/properties/id",
            keyword: "properties",
            params: { error: "missing", missingProperty: "id" },
            message: "must have property 'id'",
          };
          if (vErrors === null) {
            vErrors = [err22];
          } else {
            vErrors.push(err22);
          }
          errors++;
        }
        for (const key5 in data) {
          if (key5 !== "kind" && key5 !== "id" && key5 !== "value") {
            const err23 = {
              instancePath:
                instancePath +
                "/" +
                key5.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/profileReceipt",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key5 },
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
        if (!valid22) {
          const err24 = {
            instancePath,
            schemaPath: "/mapping/profileReceipt/properties",
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
        var valid21 = _errs10 === errors;
        valid0 = valid21;
      } else if (tag0 === "departure") {
        const _errs12 = errors;
        let valid26 = false;
        valid26 = true;
        if (data.id !== undefined) {
          if (!(typeof data.id == "string")) {
            const err25 = {
              instancePath: instancePath + "/id",
              schemaPath: "/mapping/departure/properties/id/type",
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
            schemaPath: "/mapping/departure/properties/id",
            keyword: "properties",
            params: { error: "missing", missingProperty: "id" },
            message: "must have property 'id'",
          };
          if (vErrors === null) {
            vErrors = [err26];
          } else {
            vErrors.push(err26);
          }
          errors++;
        }
        for (const key6 in data) {
          if (key6 !== "kind" && key6 !== "id" && key6 !== "value") {
            const err27 = {
              instancePath:
                instancePath +
                "/" +
                key6.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/departure",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key6 },
              message: "must NOT have additional properties",
            };
            if (vErrors === null) {
              vErrors = [err27];
            } else {
              vErrors.push(err27);
            }
            errors++;
          }
        }
        if (!valid26) {
          const err28 = {
            instancePath,
            schemaPath: "/mapping/departure/properties",
            keyword: "properties",
            params: { type: "object", nullable: false },
            message: "must be object",
          };
          if (vErrors === null) {
            vErrors = [err28];
          } else {
            vErrors.push(err28);
          }
          errors++;
        }
        var valid25 = _errs12 === errors;
        valid0 = valid25;
      } else if (tag0 === "inkSnapshot") {
        const _errs14 = errors;
        let valid30 = false;
        valid30 = true;
        if (data.id !== undefined) {
          if (!(typeof data.id == "string")) {
            const err29 = {
              instancePath: instancePath + "/id",
              schemaPath: "/mapping/inkSnapshot/properties/id/type",
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
            schemaPath: "/mapping/inkSnapshot/properties/id",
            keyword: "properties",
            params: { error: "missing", missingProperty: "id" },
            message: "must have property 'id'",
          };
          if (vErrors === null) {
            vErrors = [err30];
          } else {
            vErrors.push(err30);
          }
          errors++;
        }
        for (const key7 in data) {
          if (key7 !== "kind" && key7 !== "id" && key7 !== "value") {
            const err31 = {
              instancePath:
                instancePath +
                "/" +
                key7.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/inkSnapshot",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key7 },
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
        if (!valid30) {
          const err32 = {
            instancePath,
            schemaPath: "/mapping/inkSnapshot/properties",
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
        var valid29 = _errs14 === errors;
        valid0 = valid29;
      } else if (tag0 === "inventory") {
        const _errs16 = errors;
        let valid34 = false;
        valid34 = true;
        if (data.id !== undefined) {
          if (!(typeof data.id == "string")) {
            const err33 = {
              instancePath: instancePath + "/id",
              schemaPath: "/mapping/inventory/properties/id/type",
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
            schemaPath: "/mapping/inventory/properties/id",
            keyword: "properties",
            params: { error: "missing", missingProperty: "id" },
            message: "must have property 'id'",
          };
          if (vErrors === null) {
            vErrors = [err34];
          } else {
            vErrors.push(err34);
          }
          errors++;
        }
        for (const key8 in data) {
          if (key8 !== "kind" && key8 !== "id" && key8 !== "value") {
            const err35 = {
              instancePath:
                instancePath +
                "/" +
                key8.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/inventory",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key8 },
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
        if (!valid34) {
          const err36 = {
            instancePath,
            schemaPath: "/mapping/inventory/properties",
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
        var valid33 = _errs16 === errors;
        valid0 = valid33;
      } else if (tag0 === "inkRecovery") {
        const _errs18 = errors;
        let valid38 = false;
        valid38 = true;
        if (data.id !== undefined) {
          if (!(typeof data.id == "string")) {
            const err37 = {
              instancePath: instancePath + "/id",
              schemaPath: "/mapping/inkRecovery/properties/id/type",
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
            instancePath,
            schemaPath: "/mapping/inkRecovery/properties/id",
            keyword: "properties",
            params: { error: "missing", missingProperty: "id" },
            message: "must have property 'id'",
          };
          if (vErrors === null) {
            vErrors = [err38];
          } else {
            vErrors.push(err38);
          }
          errors++;
        }
        for (const key9 in data) {
          if (key9 !== "kind" && key9 !== "id" && key9 !== "value") {
            const err39 = {
              instancePath:
                instancePath +
                "/" +
                key9.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/inkRecovery",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key9 },
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
        if (!valid38) {
          const err40 = {
            instancePath,
            schemaPath: "/mapping/inkRecovery/properties",
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
        var valid37 = _errs18 === errors;
        valid0 = valid37;
      } else if (tag0 === "teachingRecovery") {
        const _errs20 = errors;
        let valid42 = false;
        valid42 = true;
        if (data.id !== undefined) {
          if (!(typeof data.id == "string")) {
            const err41 = {
              instancePath: instancePath + "/id",
              schemaPath: "/mapping/teachingRecovery/properties/id/type",
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
            schemaPath: "/mapping/teachingRecovery/properties/id",
            keyword: "properties",
            params: { error: "missing", missingProperty: "id" },
            message: "must have property 'id'",
          };
          if (vErrors === null) {
            vErrors = [err42];
          } else {
            vErrors.push(err42);
          }
          errors++;
        }
        for (const key10 in data) {
          if (key10 !== "kind" && key10 !== "id" && key10 !== "value") {
            const err43 = {
              instancePath:
                instancePath +
                "/" +
                key10.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/teachingRecovery",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key10 },
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
        if (!valid42) {
          const err44 = {
            instancePath,
            schemaPath: "/mapping/teachingRecovery/properties",
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
        var valid41 = _errs20 === errors;
        valid0 = valid41;
      } else if (tag0 === "administrationRecovery") {
        const _errs22 = errors;
        let valid46 = false;
        valid46 = true;
        if (data.id !== undefined) {
          if (!(typeof data.id == "string")) {
            const err45 = {
              instancePath: instancePath + "/id",
              schemaPath: "/mapping/administrationRecovery/properties/id/type",
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
            schemaPath: "/mapping/administrationRecovery/properties/id",
            keyword: "properties",
            params: { error: "missing", missingProperty: "id" },
            message: "must have property 'id'",
          };
          if (vErrors === null) {
            vErrors = [err46];
          } else {
            vErrors.push(err46);
          }
          errors++;
        }
        for (const key11 in data) {
          if (key11 !== "kind" && key11 !== "id" && key11 !== "value") {
            const err47 = {
              instancePath:
                instancePath +
                "/" +
                key11.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/administrationRecovery",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key11 },
              message: "must NOT have additional properties",
            };
            if (vErrors === null) {
              vErrors = [err47];
            } else {
              vErrors.push(err47);
            }
            errors++;
          }
        }
        if (!valid46) {
          const err48 = {
            instancePath,
            schemaPath: "/mapping/administrationRecovery/properties",
            keyword: "properties",
            params: { type: "object", nullable: false },
            message: "must be object",
          };
          if (vErrors === null) {
            vErrors = [err48];
          } else {
            vErrors.push(err48);
          }
          errors++;
        }
        var valid45 = _errs22 === errors;
        valid0 = valid45;
      } else if (tag0 === "reconciled") {
        const _errs24 = errors;
        let valid50 = false;
        valid50 = true;
        if (data.id !== undefined) {
          if (!(typeof data.id == "string")) {
            const err49 = {
              instancePath: instancePath + "/id",
              schemaPath: "/mapping/reconciled/properties/id/type",
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
            instancePath,
            schemaPath: "/mapping/reconciled/properties/id",
            keyword: "properties",
            params: { error: "missing", missingProperty: "id" },
            message: "must have property 'id'",
          };
          if (vErrors === null) {
            vErrors = [err50];
          } else {
            vErrors.push(err50);
          }
          errors++;
        }
        for (const key12 in data) {
          if (key12 !== "kind" && key12 !== "id" && key12 !== "value") {
            const err51 = {
              instancePath:
                instancePath +
                "/" +
                key12.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/reconciled",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key12 },
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
        if (!valid50) {
          const err52 = {
            instancePath,
            schemaPath: "/mapping/reconciled/properties",
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
        var valid49 = _errs24 === errors;
        valid0 = valid49;
      } else if (tag0 === "failed") {
        const _errs26 = errors;
        let valid54 = false;
        valid54 = true;
        if (data.id !== undefined) {
          if (!(typeof data.id == "string")) {
            const err53 = {
              instancePath: instancePath + "/id",
              schemaPath: "/mapping/failed/properties/id/type",
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
            instancePath,
            schemaPath: "/mapping/failed/properties/id",
            keyword: "properties",
            params: { error: "missing", missingProperty: "id" },
            message: "must have property 'id'",
          };
          if (vErrors === null) {
            vErrors = [err54];
          } else {
            vErrors.push(err54);
          }
          errors++;
        }
        if (data.message !== undefined) {
          if (!(typeof data.message == "string")) {
            const err55 = {
              instancePath: instancePath + "/message",
              schemaPath: "/mapping/failed/properties/message/type",
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
            instancePath,
            schemaPath: "/mapping/failed/properties/message",
            keyword: "properties",
            params: { error: "missing", missingProperty: "message" },
            message: "must have property 'message'",
          };
          if (vErrors === null) {
            vErrors = [err56];
          } else {
            vErrors.push(err56);
          }
          errors++;
        }
        for (const key13 in data) {
          if (key13 !== "kind" && key13 !== "id" && key13 !== "message") {
            const err57 = {
              instancePath:
                instancePath +
                "/" +
                key13.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/failed",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key13 },
              message: "must NOT have additional properties",
            };
            if (vErrors === null) {
              vErrors = [err57];
            } else {
              vErrors.push(err57);
            }
            errors++;
          }
        }
        if (!valid54) {
          const err58 = {
            instancePath,
            schemaPath: "/mapping/failed/properties",
            keyword: "properties",
            params: { type: "object", nullable: false },
            message: "must be object",
          };
          if (vErrors === null) {
            vErrors = [err58];
          } else {
            vErrors.push(err58);
          }
          errors++;
        }
        var valid53 = _errs26 === errors;
        valid0 = valid53;
      } else {
        const err59 = {
          instancePath: instancePath + "/kind",
          schemaPath: "/mapping",
          keyword: "discriminator",
          params: { error: "mapping", tag: "kind", tagValue: tag0 },
          message: 'value of tag "kind" must be in mapping',
        };
        if (vErrors === null) {
          vErrors = [err59];
        } else {
          vErrors.push(err59);
        }
        errors++;
      }
    } else {
      const err60 = {
        instancePath: instancePath + "/kind",
        schemaPath: "/discriminator",
        keyword: "discriminator",
        params: { error: "tag", tag: "kind", tagValue: tag0 },
        message: 'tag "kind" must be string',
      };
      if (vErrors === null) {
        vErrors = [err60];
      } else {
        vErrors.push(err60);
      }
      errors++;
    }
  } else if (!valid0) {
    const err61 = {
      instancePath,
      schemaPath: "/discriminator",
      keyword: "discriminator",
      params: { type: "object", nullable: false },
      message: "must be object",
    };
    if (vErrors === null) {
      vErrors = [err61];
    } else {
      vErrors.push(err61);
    }
    errors++;
  }
  validate66.errors = vErrors;
  return errors === 0;
}
export const validateCurrentApplicationRead = validate67;
const schema39 = { properties: { directory: {}, application: {} } };
function validate67(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  let valid0 = false;
  if (data && typeof data == "object" && !Array.isArray(data)) {
    valid0 = true;
    for (const key0 in data) {
      if (key0 !== "directory" && key0 !== "application") {
        const err0 = {
          instancePath:
            instancePath + "/" + key0.replace(/~/g, "~0").replace(/\//g, "~1"),
          schemaPath: "",
          keyword: "properties",
          params: { error: "additional", additionalProperty: key0 },
          message: "must NOT have additional properties",
        };
        if (vErrors === null) {
          vErrors = [err0];
        } else {
          vErrors.push(err0);
        }
        errors++;
      }
    }
  }
  if (!valid0) {
    const err1 = {
      instancePath,
      schemaPath: "/properties",
      keyword: "properties",
      params: { type: "object", nullable: false },
      message: "must be object",
    };
    if (vErrors === null) {
      vErrors = [err1];
    } else {
      vErrors.push(err1);
    }
    errors++;
  }
  validate67.errors = vErrors;
  return errors === 0;
}
export const validateCurrentResult = validate68;
const schema40 = {
  properties: {
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
    value: {},
  },
};
function validate68(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  let valid0 = false;
  if (data && typeof data == "object" && !Array.isArray(data)) {
    valid0 = true;
    if (data.selection !== undefined) {
      let data0 = data.selection;
      let valid2 = false;
      if (data0 && typeof data0 == "object" && !Array.isArray(data0)) {
        valid2 = true;
        if (data0.installationId !== undefined) {
          if (!(typeof data0.installationId == "string")) {
            const err0 = {
              instancePath: instancePath + "/selection/installationId",
              schemaPath:
                "/properties/selection/properties/installationId/type",
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
            instancePath: instancePath + "/selection",
            schemaPath: "/properties/selection/properties/installationId",
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
              instancePath: instancePath + "/selection/revision",
              schemaPath: "/properties/selection/properties/revision/type",
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
            instancePath: instancePath + "/selection",
            schemaPath: "/properties/selection/properties/revision",
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
        if (data0.owner !== undefined) {
          let data3 = data0.owner;
          let valid4 = false;
          if (data3 && typeof data3 == "object" && !Array.isArray(data3)) {
            valid4 = true;
            if (data3.profileId !== undefined) {
              if (!(typeof data3.profileId == "string")) {
                const err4 = {
                  instancePath: instancePath + "/selection/owner/profileId",
                  schemaPath:
                    "/properties/selection/properties/owner/properties/profileId/type",
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
                instancePath: instancePath + "/selection/owner",
                schemaPath:
                  "/properties/selection/properties/owner/properties/profileId",
                keyword: "properties",
                params: { error: "missing", missingProperty: "profileId" },
                message: "must have property 'profileId'",
              };
              if (vErrors === null) {
                vErrors = [err5];
              } else {
                vErrors.push(err5);
              }
              errors++;
            }
            if (data3.generation !== undefined) {
              if (!(typeof data3.generation == "string")) {
                const err6 = {
                  instancePath: instancePath + "/selection/owner/generation",
                  schemaPath:
                    "/properties/selection/properties/owner/properties/generation/type",
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
                instancePath: instancePath + "/selection/owner",
                schemaPath:
                  "/properties/selection/properties/owner/properties/generation",
                keyword: "properties",
                params: { error: "missing", missingProperty: "generation" },
                message: "must have property 'generation'",
              };
              if (vErrors === null) {
                vErrors = [err7];
              } else {
                vErrors.push(err7);
              }
              errors++;
            }
            for (const key0 in data3) {
              if (key0 !== "profileId" && key0 !== "generation") {
                const err8 = {
                  instancePath:
                    instancePath +
                    "/selection/owner/" +
                    key0.replace(/~/g, "~0").replace(/\//g, "~1"),
                  schemaPath: "/properties/selection/properties/owner",
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
          if (!valid4) {
            const err9 = {
              instancePath: instancePath + "/selection/owner",
              schemaPath: "/properties/selection/properties/owner/properties",
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
            instancePath: instancePath + "/selection",
            schemaPath: "/properties/selection/properties/owner",
            keyword: "properties",
            params: { error: "missing", missingProperty: "owner" },
            message: "must have property 'owner'",
          };
          if (vErrors === null) {
            vErrors = [err10];
          } else {
            vErrors.push(err10);
          }
          errors++;
        }
        for (const key1 in data0) {
          if (
            key1 !== "installationId" &&
            key1 !== "revision" &&
            key1 !== "owner"
          ) {
            const err11 = {
              instancePath:
                instancePath +
                "/selection/" +
                key1.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/properties/selection",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key1 },
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
      }
      if (!valid2) {
        const err12 = {
          instancePath: instancePath + "/selection",
          schemaPath: "/properties/selection/properties",
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
    } else {
      const err13 = {
        instancePath,
        schemaPath: "/properties/selection",
        keyword: "properties",
        params: { error: "missing", missingProperty: "selection" },
        message: "must have property 'selection'",
      };
      if (vErrors === null) {
        vErrors = [err13];
      } else {
        vErrors.push(err13);
      }
      errors++;
    }
    for (const key2 in data) {
      if (key2 !== "selection" && key2 !== "value") {
        const err14 = {
          instancePath:
            instancePath + "/" + key2.replace(/~/g, "~0").replace(/\//g, "~1"),
          schemaPath: "",
          keyword: "properties",
          params: { error: "additional", additionalProperty: key2 },
          message: "must NOT have additional properties",
        };
        if (vErrors === null) {
          vErrors = [err14];
        } else {
          vErrors.push(err14);
        }
        errors++;
      }
    }
  }
  if (!valid0) {
    const err15 = {
      instancePath,
      schemaPath: "/properties",
      keyword: "properties",
      params: { type: "object", nullable: false },
      message: "must be object",
    };
    if (vErrors === null) {
      vErrors = [err15];
    } else {
      vErrors.push(err15);
    }
    errors++;
  }
  validate68.errors = vErrors;
  return errors === 0;
}
export const validateExecutionResult = validate69;
const schema41 = {
  discriminator: "kind",
  mapping: {
    teaching: {
      properties: {
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
        result: {},
      },
    },
    ink: {
      properties: {
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
        result: {},
      },
    },
  },
};
function validate69(
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
      if (tag0 === "teaching") {
        const _errs0 = errors;
        let valid2 = false;
        valid2 = true;
        if (data.selection !== undefined) {
          let data0 = data.selection;
          let valid4 = false;
          if (data0 && typeof data0 == "object" && !Array.isArray(data0)) {
            valid4 = true;
            if (data0.installationId !== undefined) {
              if (!(typeof data0.installationId == "string")) {
                const err1 = {
                  instancePath: instancePath + "/selection/installationId",
                  schemaPath:
                    "/mapping/teaching/properties/selection/properties/installationId/type",
                  keyword: "type",
                  params: { type: "string", nullable: false },
                  message: "must be string",
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
                instancePath: instancePath + "/selection",
                schemaPath:
                  "/mapping/teaching/properties/selection/properties/installationId",
                keyword: "properties",
                params: { error: "missing", missingProperty: "installationId" },
                message: "must have property 'installationId'",
              };
              if (vErrors === null) {
                vErrors = [err2];
              } else {
                vErrors.push(err2);
              }
              errors++;
            }
            if (data0.revision !== undefined) {
              if (!(typeof data0.revision == "string")) {
                const err3 = {
                  instancePath: instancePath + "/selection/revision",
                  schemaPath:
                    "/mapping/teaching/properties/selection/properties/revision/type",
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
                instancePath: instancePath + "/selection",
                schemaPath:
                  "/mapping/teaching/properties/selection/properties/revision",
                keyword: "properties",
                params: { error: "missing", missingProperty: "revision" },
                message: "must have property 'revision'",
              };
              if (vErrors === null) {
                vErrors = [err4];
              } else {
                vErrors.push(err4);
              }
              errors++;
            }
            if (data0.owner !== undefined) {
              let data3 = data0.owner;
              let valid6 = false;
              if (data3 && typeof data3 == "object" && !Array.isArray(data3)) {
                valid6 = true;
                if (data3.profileId !== undefined) {
                  if (!(typeof data3.profileId == "string")) {
                    const err5 = {
                      instancePath: instancePath + "/selection/owner/profileId",
                      schemaPath:
                        "/mapping/teaching/properties/selection/properties/owner/properties/profileId/type",
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
                    instancePath: instancePath + "/selection/owner",
                    schemaPath:
                      "/mapping/teaching/properties/selection/properties/owner/properties/profileId",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "profileId" },
                    message: "must have property 'profileId'",
                  };
                  if (vErrors === null) {
                    vErrors = [err6];
                  } else {
                    vErrors.push(err6);
                  }
                  errors++;
                }
                if (data3.generation !== undefined) {
                  if (!(typeof data3.generation == "string")) {
                    const err7 = {
                      instancePath:
                        instancePath + "/selection/owner/generation",
                      schemaPath:
                        "/mapping/teaching/properties/selection/properties/owner/properties/generation/type",
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
                    instancePath: instancePath + "/selection/owner",
                    schemaPath:
                      "/mapping/teaching/properties/selection/properties/owner/properties/generation",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "generation" },
                    message: "must have property 'generation'",
                  };
                  if (vErrors === null) {
                    vErrors = [err8];
                  } else {
                    vErrors.push(err8);
                  }
                  errors++;
                }
                for (const key0 in data3) {
                  if (key0 !== "profileId" && key0 !== "generation") {
                    const err9 = {
                      instancePath:
                        instancePath +
                        "/selection/owner/" +
                        key0.replace(/~/g, "~0").replace(/\//g, "~1"),
                      schemaPath:
                        "/mapping/teaching/properties/selection/properties/owner",
                      keyword: "properties",
                      params: { error: "additional", additionalProperty: key0 },
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
              }
              if (!valid6) {
                const err10 = {
                  instancePath: instancePath + "/selection/owner",
                  schemaPath:
                    "/mapping/teaching/properties/selection/properties/owner/properties",
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
            } else {
              const err11 = {
                instancePath: instancePath + "/selection",
                schemaPath:
                  "/mapping/teaching/properties/selection/properties/owner",
                keyword: "properties",
                params: { error: "missing", missingProperty: "owner" },
                message: "must have property 'owner'",
              };
              if (vErrors === null) {
                vErrors = [err11];
              } else {
                vErrors.push(err11);
              }
              errors++;
            }
            for (const key1 in data0) {
              if (
                key1 !== "installationId" &&
                key1 !== "revision" &&
                key1 !== "owner"
              ) {
                const err12 = {
                  instancePath:
                    instancePath +
                    "/selection/" +
                    key1.replace(/~/g, "~0").replace(/\//g, "~1"),
                  schemaPath: "/mapping/teaching/properties/selection",
                  keyword: "properties",
                  params: { error: "additional", additionalProperty: key1 },
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
          if (!valid4) {
            const err13 = {
              instancePath: instancePath + "/selection",
              schemaPath: "/mapping/teaching/properties/selection/properties",
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
            schemaPath: "/mapping/teaching/properties/selection",
            keyword: "properties",
            params: { error: "missing", missingProperty: "selection" },
            message: "must have property 'selection'",
          };
          if (vErrors === null) {
            vErrors = [err14];
          } else {
            vErrors.push(err14);
          }
          errors++;
        }
        for (const key2 in data) {
          if (key2 !== "kind" && key2 !== "selection" && key2 !== "result") {
            const err15 = {
              instancePath:
                instancePath +
                "/" +
                key2.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/teaching",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key2 },
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
        if (!valid2) {
          const err16 = {
            instancePath,
            schemaPath: "/mapping/teaching/properties",
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
        var valid1 = _errs0 === errors;
        valid0 = valid1;
      } else if (tag0 === "ink") {
        const _errs7 = errors;
        let valid12 = false;
        valid12 = true;
        if (data.selection !== undefined) {
          let data6 = data.selection;
          let valid14 = false;
          if (data6 && typeof data6 == "object" && !Array.isArray(data6)) {
            valid14 = true;
            if (data6.installationId !== undefined) {
              if (!(typeof data6.installationId == "string")) {
                const err17 = {
                  instancePath: instancePath + "/selection/installationId",
                  schemaPath:
                    "/mapping/ink/properties/selection/properties/installationId/type",
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
                schemaPath:
                  "/mapping/ink/properties/selection/properties/installationId",
                keyword: "properties",
                params: { error: "missing", missingProperty: "installationId" },
                message: "must have property 'installationId'",
              };
              if (vErrors === null) {
                vErrors = [err18];
              } else {
                vErrors.push(err18);
              }
              errors++;
            }
            if (data6.revision !== undefined) {
              if (!(typeof data6.revision == "string")) {
                const err19 = {
                  instancePath: instancePath + "/selection/revision",
                  schemaPath:
                    "/mapping/ink/properties/selection/properties/revision/type",
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
                instancePath: instancePath + "/selection",
                schemaPath:
                  "/mapping/ink/properties/selection/properties/revision",
                keyword: "properties",
                params: { error: "missing", missingProperty: "revision" },
                message: "must have property 'revision'",
              };
              if (vErrors === null) {
                vErrors = [err20];
              } else {
                vErrors.push(err20);
              }
              errors++;
            }
            if (data6.owner !== undefined) {
              let data9 = data6.owner;
              let valid16 = false;
              if (data9 && typeof data9 == "object" && !Array.isArray(data9)) {
                valid16 = true;
                if (data9.profileId !== undefined) {
                  if (!(typeof data9.profileId == "string")) {
                    const err21 = {
                      instancePath: instancePath + "/selection/owner/profileId",
                      schemaPath:
                        "/mapping/ink/properties/selection/properties/owner/properties/profileId/type",
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
                      "/mapping/ink/properties/selection/properties/owner/properties/profileId",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "profileId" },
                    message: "must have property 'profileId'",
                  };
                  if (vErrors === null) {
                    vErrors = [err22];
                  } else {
                    vErrors.push(err22);
                  }
                  errors++;
                }
                if (data9.generation !== undefined) {
                  if (!(typeof data9.generation == "string")) {
                    const err23 = {
                      instancePath:
                        instancePath + "/selection/owner/generation",
                      schemaPath:
                        "/mapping/ink/properties/selection/properties/owner/properties/generation/type",
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
                    instancePath: instancePath + "/selection/owner",
                    schemaPath:
                      "/mapping/ink/properties/selection/properties/owner/properties/generation",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "generation" },
                    message: "must have property 'generation'",
                  };
                  if (vErrors === null) {
                    vErrors = [err24];
                  } else {
                    vErrors.push(err24);
                  }
                  errors++;
                }
                for (const key3 in data9) {
                  if (key3 !== "profileId" && key3 !== "generation") {
                    const err25 = {
                      instancePath:
                        instancePath +
                        "/selection/owner/" +
                        key3.replace(/~/g, "~0").replace(/\//g, "~1"),
                      schemaPath:
                        "/mapping/ink/properties/selection/properties/owner",
                      keyword: "properties",
                      params: { error: "additional", additionalProperty: key3 },
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
              if (!valid16) {
                const err26 = {
                  instancePath: instancePath + "/selection/owner",
                  schemaPath:
                    "/mapping/ink/properties/selection/properties/owner/properties",
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
                instancePath: instancePath + "/selection",
                schemaPath:
                  "/mapping/ink/properties/selection/properties/owner",
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
            for (const key4 in data6) {
              if (
                key4 !== "installationId" &&
                key4 !== "revision" &&
                key4 !== "owner"
              ) {
                const err28 = {
                  instancePath:
                    instancePath +
                    "/selection/" +
                    key4.replace(/~/g, "~0").replace(/\//g, "~1"),
                  schemaPath: "/mapping/ink/properties/selection",
                  keyword: "properties",
                  params: { error: "additional", additionalProperty: key4 },
                  message: "must NOT have additional properties",
                };
                if (vErrors === null) {
                  vErrors = [err28];
                } else {
                  vErrors.push(err28);
                }
                errors++;
              }
            }
          }
          if (!valid14) {
            const err29 = {
              instancePath: instancePath + "/selection",
              schemaPath: "/mapping/ink/properties/selection/properties",
              keyword: "properties",
              params: { type: "object", nullable: false },
              message: "must be object",
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
            schemaPath: "/mapping/ink/properties/selection",
            keyword: "properties",
            params: { error: "missing", missingProperty: "selection" },
            message: "must have property 'selection'",
          };
          if (vErrors === null) {
            vErrors = [err30];
          } else {
            vErrors.push(err30);
          }
          errors++;
        }
        for (const key5 in data) {
          if (key5 !== "kind" && key5 !== "selection" && key5 !== "result") {
            const err31 = {
              instancePath:
                instancePath +
                "/" +
                key5.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/ink",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key5 },
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
        if (!valid12) {
          const err32 = {
            instancePath,
            schemaPath: "/mapping/ink/properties",
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
        var valid11 = _errs7 === errors;
        valid0 = valid11;
      } else {
        const err33 = {
          instancePath: instancePath + "/kind",
          schemaPath: "/mapping",
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
        instancePath: instancePath + "/kind",
        schemaPath: "/discriminator",
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
  } else if (!valid0) {
    const err35 = {
      instancePath,
      schemaPath: "/discriminator",
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
  validate69.errors = vErrors;
  return errors === 0;
}
export const validateSelectedRecoveryOpening = validate70;
const schema42 = {
  discriminator: "kind",
  mapping: {
    cold: { properties: {} },
    warm: {
      properties: {
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
        retainedStrokeIds: { elements: { type: "string" } },
        teaching: {},
        administration: {},
      },
    },
  },
};
function validate70(
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
      if (tag0 === "cold") {
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
              schemaPath: "/mapping/cold",
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
            schemaPath: "/mapping/cold/properties",
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
      } else if (tag0 === "warm") {
        const _errs1 = errors;
        let valid6 = false;
        valid6 = true;
        if (data.selection !== undefined) {
          let data0 = data.selection;
          let valid8 = false;
          if (data0 && typeof data0 == "object" && !Array.isArray(data0)) {
            valid8 = true;
            if (data0.installationId !== undefined) {
              if (!(typeof data0.installationId == "string")) {
                const err3 = {
                  instancePath: instancePath + "/selection/installationId",
                  schemaPath:
                    "/mapping/warm/properties/selection/properties/installationId/type",
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
                instancePath: instancePath + "/selection",
                schemaPath:
                  "/mapping/warm/properties/selection/properties/installationId",
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
            if (data0.revision !== undefined) {
              if (!(typeof data0.revision == "string")) {
                const err5 = {
                  instancePath: instancePath + "/selection/revision",
                  schemaPath:
                    "/mapping/warm/properties/selection/properties/revision/type",
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
                instancePath: instancePath + "/selection",
                schemaPath:
                  "/mapping/warm/properties/selection/properties/revision",
                keyword: "properties",
                params: { error: "missing", missingProperty: "revision" },
                message: "must have property 'revision'",
              };
              if (vErrors === null) {
                vErrors = [err6];
              } else {
                vErrors.push(err6);
              }
              errors++;
            }
            if (data0.owner !== undefined) {
              let data3 = data0.owner;
              let valid10 = false;
              if (data3 && typeof data3 == "object" && !Array.isArray(data3)) {
                valid10 = true;
                if (data3.profileId !== undefined) {
                  if (!(typeof data3.profileId == "string")) {
                    const err7 = {
                      instancePath: instancePath + "/selection/owner/profileId",
                      schemaPath:
                        "/mapping/warm/properties/selection/properties/owner/properties/profileId/type",
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
                    instancePath: instancePath + "/selection/owner",
                    schemaPath:
                      "/mapping/warm/properties/selection/properties/owner/properties/profileId",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "profileId" },
                    message: "must have property 'profileId'",
                  };
                  if (vErrors === null) {
                    vErrors = [err8];
                  } else {
                    vErrors.push(err8);
                  }
                  errors++;
                }
                if (data3.generation !== undefined) {
                  if (!(typeof data3.generation == "string")) {
                    const err9 = {
                      instancePath:
                        instancePath + "/selection/owner/generation",
                      schemaPath:
                        "/mapping/warm/properties/selection/properties/owner/properties/generation/type",
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
                    instancePath: instancePath + "/selection/owner",
                    schemaPath:
                      "/mapping/warm/properties/selection/properties/owner/properties/generation",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "generation" },
                    message: "must have property 'generation'",
                  };
                  if (vErrors === null) {
                    vErrors = [err10];
                  } else {
                    vErrors.push(err10);
                  }
                  errors++;
                }
                for (const key1 in data3) {
                  if (key1 !== "profileId" && key1 !== "generation") {
                    const err11 = {
                      instancePath:
                        instancePath +
                        "/selection/owner/" +
                        key1.replace(/~/g, "~0").replace(/\//g, "~1"),
                      schemaPath:
                        "/mapping/warm/properties/selection/properties/owner",
                      keyword: "properties",
                      params: { error: "additional", additionalProperty: key1 },
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
              }
              if (!valid10) {
                const err12 = {
                  instancePath: instancePath + "/selection/owner",
                  schemaPath:
                    "/mapping/warm/properties/selection/properties/owner/properties",
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
            } else {
              const err13 = {
                instancePath: instancePath + "/selection",
                schemaPath:
                  "/mapping/warm/properties/selection/properties/owner",
                keyword: "properties",
                params: { error: "missing", missingProperty: "owner" },
                message: "must have property 'owner'",
              };
              if (vErrors === null) {
                vErrors = [err13];
              } else {
                vErrors.push(err13);
              }
              errors++;
            }
            for (const key2 in data0) {
              if (
                key2 !== "installationId" &&
                key2 !== "revision" &&
                key2 !== "owner"
              ) {
                const err14 = {
                  instancePath:
                    instancePath +
                    "/selection/" +
                    key2.replace(/~/g, "~0").replace(/\//g, "~1"),
                  schemaPath: "/mapping/warm/properties/selection",
                  keyword: "properties",
                  params: { error: "additional", additionalProperty: key2 },
                  message: "must NOT have additional properties",
                };
                if (vErrors === null) {
                  vErrors = [err14];
                } else {
                  vErrors.push(err14);
                }
                errors++;
              }
            }
          }
          if (!valid8) {
            const err15 = {
              instancePath: instancePath + "/selection",
              schemaPath: "/mapping/warm/properties/selection/properties",
              keyword: "properties",
              params: { type: "object", nullable: false },
              message: "must be object",
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
            schemaPath: "/mapping/warm/properties/selection",
            keyword: "properties",
            params: { error: "missing", missingProperty: "selection" },
            message: "must have property 'selection'",
          };
          if (vErrors === null) {
            vErrors = [err16];
          } else {
            vErrors.push(err16);
          }
          errors++;
        }
        if (data.retainedStrokeIds !== undefined) {
          let data6 = data.retainedStrokeIds;
          let valid14 = false;
          if (!valid14) {
            if (Array.isArray(data6)) {
              let valid16 = true;
              const len0 = data6.length;
              for (let i0 = 0; i0 < len0; i0++) {
                const _errs9 = errors;
                if (!(typeof data6[i0] == "string")) {
                  const err17 = {
                    instancePath: instancePath + "/retainedStrokeIds/" + i0,
                    schemaPath:
                      "/mapping/warm/properties/retainedStrokeIds/elements/type",
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
                var valid15 = _errs9 === errors;
                if (!valid15) {
                  valid16 = false;
                }
              }
              valid14 = valid16;
            } else {
              const err18 = {
                instancePath: instancePath + "/retainedStrokeIds",
                schemaPath:
                  "/mapping/warm/properties/retainedStrokeIds/elements",
                keyword: "elements",
                params: { type: "array", nullable: false },
                message: "must be array",
              };
              if (vErrors === null) {
                vErrors = [err18];
              } else {
                vErrors.push(err18);
              }
              errors++;
            }
          }
        } else {
          const err19 = {
            instancePath,
            schemaPath: "/mapping/warm/properties/retainedStrokeIds",
            keyword: "properties",
            params: { error: "missing", missingProperty: "retainedStrokeIds" },
            message: "must have property 'retainedStrokeIds'",
          };
          if (vErrors === null) {
            vErrors = [err19];
          } else {
            vErrors.push(err19);
          }
          errors++;
        }
        for (const key3 in data) {
          if (
            key3 !== "kind" &&
            key3 !== "selection" &&
            key3 !== "retainedStrokeIds" &&
            key3 !== "teaching" &&
            key3 !== "administration"
          ) {
            const err20 = {
              instancePath:
                instancePath +
                "/" +
                key3.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/warm",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key3 },
              message: "must NOT have additional properties",
            };
            if (vErrors === null) {
              vErrors = [err20];
            } else {
              vErrors.push(err20);
            }
            errors++;
          }
        }
        if (!valid6) {
          const err21 = {
            instancePath,
            schemaPath: "/mapping/warm/properties",
            keyword: "properties",
            params: { type: "object", nullable: false },
            message: "must be object",
          };
          if (vErrors === null) {
            vErrors = [err21];
          } else {
            vErrors.push(err21);
          }
          errors++;
        }
        var valid5 = _errs1 === errors;
        valid0 = valid5;
      } else {
        const err22 = {
          instancePath: instancePath + "/kind",
          schemaPath: "/mapping",
          keyword: "discriminator",
          params: { error: "mapping", tag: "kind", tagValue: tag0 },
          message: 'value of tag "kind" must be in mapping',
        };
        if (vErrors === null) {
          vErrors = [err22];
        } else {
          vErrors.push(err22);
        }
        errors++;
      }
    } else {
      const err23 = {
        instancePath: instancePath + "/kind",
        schemaPath: "/discriminator",
        keyword: "discriminator",
        params: { error: "tag", tag: "kind", tagValue: tag0 },
        message: 'tag "kind" must be string',
      };
      if (vErrors === null) {
        vErrors = [err23];
      } else {
        vErrors.push(err23);
      }
      errors++;
    }
  } else if (!valid0) {
    const err24 = {
      instancePath,
      schemaPath: "/discriminator",
      keyword: "discriminator",
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
  validate70.errors = vErrors;
  return errors === 0;
}
export const validateSelectedRecoveryInventory = validate71;
const schema43 = {
  properties: {
    kind: { enum: ["closed"] },
    recoveryId: { type: "string" },
    captures: {},
    directory: {},
  },
};
function validate71(
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
      if (!(typeof data0 == "string" && data0 === "closed")) {
        const err0 = {
          instancePath: instancePath + "/kind",
          schemaPath: "/properties/kind/enum",
          keyword: "enum",
          params: { allowedValues: schema43.properties.kind.enum },
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
    if (data.recoveryId !== undefined) {
      if (!(typeof data.recoveryId == "string")) {
        const err2 = {
          instancePath: instancePath + "/recoveryId",
          schemaPath: "/properties/recoveryId/type",
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
        schemaPath: "/properties/recoveryId",
        keyword: "properties",
        params: { error: "missing", missingProperty: "recoveryId" },
        message: "must have property 'recoveryId'",
      };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    }
    for (const key0 in data) {
      if (
        key0 !== "kind" &&
        key0 !== "recoveryId" &&
        key0 !== "captures" &&
        key0 !== "directory"
      ) {
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
  validate71.errors = vErrors;
  return errors === 0;
}
export const validateRecoveryResult = validate72;
const schema44 = {
  discriminator: "resolution",
  mapping: {
    applied: {
      properties: {
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
        result: {
          discriminator: "kind",
          mapping: {
            committed: { properties: {}, additionalProperties: true },
            inkCommitted: { properties: {}, additionalProperties: true },
            profileCommitted: { properties: {}, additionalProperties: true },
          },
        },
      },
    },
    receiptOnly: {
      properties: {
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
        result: {
          discriminator: "kind",
          mapping: {
            committed: { properties: {}, additionalProperties: true },
            inkCommitted: { properties: {}, additionalProperties: true },
            profileCommitted: { properties: {}, additionalProperties: true },
          },
        },
      },
    },
    rejected: {
      properties: {
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
        result: {
          discriminator: "kind",
          mapping: {
            rejected: {
              properties: {
                code: { type: "string" },
                message: { type: "string" },
              },
            },
          },
        },
      },
    },
  },
};
function validate72(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  let valid0 = false;
  if (data && typeof data == "object" && !Array.isArray(data)) {
    const tag0 = data.resolution;
    if (tag0 === undefined) {
      const err0 = {
        instancePath,
        schemaPath: "/discriminator",
        keyword: "discriminator",
        params: { error: "tag", tag: "resolution", tagValue: tag0 },
        message: 'tag "resolution" must be string',
      };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    } else if (typeof tag0 == "string") {
      if (tag0 === "applied") {
        const _errs0 = errors;
        let valid2 = false;
        valid2 = true;
        if (data.selection !== undefined) {
          let data0 = data.selection;
          let valid4 = false;
          if (data0 && typeof data0 == "object" && !Array.isArray(data0)) {
            valid4 = true;
            if (data0.installationId !== undefined) {
              if (!(typeof data0.installationId == "string")) {
                const err1 = {
                  instancePath: instancePath + "/selection/installationId",
                  schemaPath:
                    "/mapping/applied/properties/selection/properties/installationId/type",
                  keyword: "type",
                  params: { type: "string", nullable: false },
                  message: "must be string",
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
                instancePath: instancePath + "/selection",
                schemaPath:
                  "/mapping/applied/properties/selection/properties/installationId",
                keyword: "properties",
                params: { error: "missing", missingProperty: "installationId" },
                message: "must have property 'installationId'",
              };
              if (vErrors === null) {
                vErrors = [err2];
              } else {
                vErrors.push(err2);
              }
              errors++;
            }
            if (data0.revision !== undefined) {
              if (!(typeof data0.revision == "string")) {
                const err3 = {
                  instancePath: instancePath + "/selection/revision",
                  schemaPath:
                    "/mapping/applied/properties/selection/properties/revision/type",
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
                instancePath: instancePath + "/selection",
                schemaPath:
                  "/mapping/applied/properties/selection/properties/revision",
                keyword: "properties",
                params: { error: "missing", missingProperty: "revision" },
                message: "must have property 'revision'",
              };
              if (vErrors === null) {
                vErrors = [err4];
              } else {
                vErrors.push(err4);
              }
              errors++;
            }
            if (data0.owner !== undefined) {
              let data3 = data0.owner;
              let valid6 = false;
              if (data3 && typeof data3 == "object" && !Array.isArray(data3)) {
                valid6 = true;
                if (data3.profileId !== undefined) {
                  if (!(typeof data3.profileId == "string")) {
                    const err5 = {
                      instancePath: instancePath + "/selection/owner/profileId",
                      schemaPath:
                        "/mapping/applied/properties/selection/properties/owner/properties/profileId/type",
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
                    instancePath: instancePath + "/selection/owner",
                    schemaPath:
                      "/mapping/applied/properties/selection/properties/owner/properties/profileId",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "profileId" },
                    message: "must have property 'profileId'",
                  };
                  if (vErrors === null) {
                    vErrors = [err6];
                  } else {
                    vErrors.push(err6);
                  }
                  errors++;
                }
                if (data3.generation !== undefined) {
                  if (!(typeof data3.generation == "string")) {
                    const err7 = {
                      instancePath:
                        instancePath + "/selection/owner/generation",
                      schemaPath:
                        "/mapping/applied/properties/selection/properties/owner/properties/generation/type",
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
                    instancePath: instancePath + "/selection/owner",
                    schemaPath:
                      "/mapping/applied/properties/selection/properties/owner/properties/generation",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "generation" },
                    message: "must have property 'generation'",
                  };
                  if (vErrors === null) {
                    vErrors = [err8];
                  } else {
                    vErrors.push(err8);
                  }
                  errors++;
                }
                for (const key0 in data3) {
                  if (key0 !== "profileId" && key0 !== "generation") {
                    const err9 = {
                      instancePath:
                        instancePath +
                        "/selection/owner/" +
                        key0.replace(/~/g, "~0").replace(/\//g, "~1"),
                      schemaPath:
                        "/mapping/applied/properties/selection/properties/owner",
                      keyword: "properties",
                      params: { error: "additional", additionalProperty: key0 },
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
              }
              if (!valid6) {
                const err10 = {
                  instancePath: instancePath + "/selection/owner",
                  schemaPath:
                    "/mapping/applied/properties/selection/properties/owner/properties",
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
            } else {
              const err11 = {
                instancePath: instancePath + "/selection",
                schemaPath:
                  "/mapping/applied/properties/selection/properties/owner",
                keyword: "properties",
                params: { error: "missing", missingProperty: "owner" },
                message: "must have property 'owner'",
              };
              if (vErrors === null) {
                vErrors = [err11];
              } else {
                vErrors.push(err11);
              }
              errors++;
            }
            for (const key1 in data0) {
              if (
                key1 !== "installationId" &&
                key1 !== "revision" &&
                key1 !== "owner"
              ) {
                const err12 = {
                  instancePath:
                    instancePath +
                    "/selection/" +
                    key1.replace(/~/g, "~0").replace(/\//g, "~1"),
                  schemaPath: "/mapping/applied/properties/selection",
                  keyword: "properties",
                  params: { error: "additional", additionalProperty: key1 },
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
          if (!valid4) {
            const err13 = {
              instancePath: instancePath + "/selection",
              schemaPath: "/mapping/applied/properties/selection/properties",
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
            schemaPath: "/mapping/applied/properties/selection",
            keyword: "properties",
            params: { error: "missing", missingProperty: "selection" },
            message: "must have property 'selection'",
          };
          if (vErrors === null) {
            vErrors = [err14];
          } else {
            vErrors.push(err14);
          }
          errors++;
        }
        if (data.result !== undefined) {
          let data6 = data.result;
          let valid10 = false;
          if (data6 && typeof data6 == "object" && !Array.isArray(data6)) {
            const tag1 = data6.kind;
            if (tag1 === undefined) {
              const err15 = {
                instancePath: instancePath + "/result",
                schemaPath: "/mapping/applied/properties/result/discriminator",
                keyword: "discriminator",
                params: { error: "tag", tag: "kind", tagValue: tag1 },
                message: 'tag "kind" must be string',
              };
              if (vErrors === null) {
                vErrors = [err15];
              } else {
                vErrors.push(err15);
              }
              errors++;
            } else if (typeof tag1 == "string") {
              if (tag1 === "committed") {
                const _errs8 = errors;
                var valid11 = _errs8 === errors;
                valid10 = valid11;
              } else if (tag1 === "inkCommitted") {
                const _errs10 = errors;
                var valid12 = _errs10 === errors;
                valid10 = valid12;
              } else if (tag1 === "profileCommitted") {
                const _errs12 = errors;
                var valid13 = _errs12 === errors;
                valid10 = valid13;
              } else {
                const err16 = {
                  instancePath: instancePath + "/result/kind",
                  schemaPath: "/mapping/applied/properties/result/mapping",
                  keyword: "discriminator",
                  params: { error: "mapping", tag: "kind", tagValue: tag1 },
                  message: 'value of tag "kind" must be in mapping',
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
                instancePath: instancePath + "/result/kind",
                schemaPath: "/mapping/applied/properties/result/discriminator",
                keyword: "discriminator",
                params: { error: "tag", tag: "kind", tagValue: tag1 },
                message: 'tag "kind" must be string',
              };
              if (vErrors === null) {
                vErrors = [err17];
              } else {
                vErrors.push(err17);
              }
              errors++;
            }
          } else if (!valid10) {
            const err18 = {
              instancePath: instancePath + "/result",
              schemaPath: "/mapping/applied/properties/result/discriminator",
              keyword: "discriminator",
              params: { type: "object", nullable: false },
              message: "must be object",
            };
            if (vErrors === null) {
              vErrors = [err18];
            } else {
              vErrors.push(err18);
            }
            errors++;
          }
        } else {
          const err19 = {
            instancePath,
            schemaPath: "/mapping/applied/properties/result",
            keyword: "properties",
            params: { error: "missing", missingProperty: "result" },
            message: "must have property 'result'",
          };
          if (vErrors === null) {
            vErrors = [err19];
          } else {
            vErrors.push(err19);
          }
          errors++;
        }
        for (const key2 in data) {
          if (
            key2 !== "resolution" &&
            key2 !== "selection" &&
            key2 !== "result"
          ) {
            const err20 = {
              instancePath:
                instancePath +
                "/" +
                key2.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/applied",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key2 },
              message: "must NOT have additional properties",
            };
            if (vErrors === null) {
              vErrors = [err20];
            } else {
              vErrors.push(err20);
            }
            errors++;
          }
        }
        if (!valid2) {
          const err21 = {
            instancePath,
            schemaPath: "/mapping/applied/properties",
            keyword: "properties",
            params: { type: "object", nullable: false },
            message: "must be object",
          };
          if (vErrors === null) {
            vErrors = [err21];
          } else {
            vErrors.push(err21);
          }
          errors++;
        }
        var valid1 = _errs0 === errors;
        valid0 = valid1;
      } else if (tag0 === "receiptOnly") {
        const _errs14 = errors;
        let valid16 = false;
        valid16 = true;
        if (data.selection !== undefined) {
          let data7 = data.selection;
          let valid18 = false;
          if (data7 && typeof data7 == "object" && !Array.isArray(data7)) {
            valid18 = true;
            if (data7.installationId !== undefined) {
              if (!(typeof data7.installationId == "string")) {
                const err22 = {
                  instancePath: instancePath + "/selection/installationId",
                  schemaPath:
                    "/mapping/receiptOnly/properties/selection/properties/installationId/type",
                  keyword: "type",
                  params: { type: "string", nullable: false },
                  message: "must be string",
                };
                if (vErrors === null) {
                  vErrors = [err22];
                } else {
                  vErrors.push(err22);
                }
                errors++;
              }
            } else {
              const err23 = {
                instancePath: instancePath + "/selection",
                schemaPath:
                  "/mapping/receiptOnly/properties/selection/properties/installationId",
                keyword: "properties",
                params: { error: "missing", missingProperty: "installationId" },
                message: "must have property 'installationId'",
              };
              if (vErrors === null) {
                vErrors = [err23];
              } else {
                vErrors.push(err23);
              }
              errors++;
            }
            if (data7.revision !== undefined) {
              if (!(typeof data7.revision == "string")) {
                const err24 = {
                  instancePath: instancePath + "/selection/revision",
                  schemaPath:
                    "/mapping/receiptOnly/properties/selection/properties/revision/type",
                  keyword: "type",
                  params: { type: "string", nullable: false },
                  message: "must be string",
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
                schemaPath:
                  "/mapping/receiptOnly/properties/selection/properties/revision",
                keyword: "properties",
                params: { error: "missing", missingProperty: "revision" },
                message: "must have property 'revision'",
              };
              if (vErrors === null) {
                vErrors = [err25];
              } else {
                vErrors.push(err25);
              }
              errors++;
            }
            if (data7.owner !== undefined) {
              let data10 = data7.owner;
              let valid20 = false;
              if (
                data10 &&
                typeof data10 == "object" &&
                !Array.isArray(data10)
              ) {
                valid20 = true;
                if (data10.profileId !== undefined) {
                  if (!(typeof data10.profileId == "string")) {
                    const err26 = {
                      instancePath: instancePath + "/selection/owner/profileId",
                      schemaPath:
                        "/mapping/receiptOnly/properties/selection/properties/owner/properties/profileId/type",
                      keyword: "type",
                      params: { type: "string", nullable: false },
                      message: "must be string",
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
                    instancePath: instancePath + "/selection/owner",
                    schemaPath:
                      "/mapping/receiptOnly/properties/selection/properties/owner/properties/profileId",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "profileId" },
                    message: "must have property 'profileId'",
                  };
                  if (vErrors === null) {
                    vErrors = [err27];
                  } else {
                    vErrors.push(err27);
                  }
                  errors++;
                }
                if (data10.generation !== undefined) {
                  if (!(typeof data10.generation == "string")) {
                    const err28 = {
                      instancePath:
                        instancePath + "/selection/owner/generation",
                      schemaPath:
                        "/mapping/receiptOnly/properties/selection/properties/owner/properties/generation/type",
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
                    instancePath: instancePath + "/selection/owner",
                    schemaPath:
                      "/mapping/receiptOnly/properties/selection/properties/owner/properties/generation",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "generation" },
                    message: "must have property 'generation'",
                  };
                  if (vErrors === null) {
                    vErrors = [err29];
                  } else {
                    vErrors.push(err29);
                  }
                  errors++;
                }
                for (const key3 in data10) {
                  if (key3 !== "profileId" && key3 !== "generation") {
                    const err30 = {
                      instancePath:
                        instancePath +
                        "/selection/owner/" +
                        key3.replace(/~/g, "~0").replace(/\//g, "~1"),
                      schemaPath:
                        "/mapping/receiptOnly/properties/selection/properties/owner",
                      keyword: "properties",
                      params: { error: "additional", additionalProperty: key3 },
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
              if (!valid20) {
                const err31 = {
                  instancePath: instancePath + "/selection/owner",
                  schemaPath:
                    "/mapping/receiptOnly/properties/selection/properties/owner/properties",
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
                instancePath: instancePath + "/selection",
                schemaPath:
                  "/mapping/receiptOnly/properties/selection/properties/owner",
                keyword: "properties",
                params: { error: "missing", missingProperty: "owner" },
                message: "must have property 'owner'",
              };
              if (vErrors === null) {
                vErrors = [err32];
              } else {
                vErrors.push(err32);
              }
              errors++;
            }
            for (const key4 in data7) {
              if (
                key4 !== "installationId" &&
                key4 !== "revision" &&
                key4 !== "owner"
              ) {
                const err33 = {
                  instancePath:
                    instancePath +
                    "/selection/" +
                    key4.replace(/~/g, "~0").replace(/\//g, "~1"),
                  schemaPath: "/mapping/receiptOnly/properties/selection",
                  keyword: "properties",
                  params: { error: "additional", additionalProperty: key4 },
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
          if (!valid18) {
            const err34 = {
              instancePath: instancePath + "/selection",
              schemaPath:
                "/mapping/receiptOnly/properties/selection/properties",
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
        } else {
          const err35 = {
            instancePath,
            schemaPath: "/mapping/receiptOnly/properties/selection",
            keyword: "properties",
            params: { error: "missing", missingProperty: "selection" },
            message: "must have property 'selection'",
          };
          if (vErrors === null) {
            vErrors = [err35];
          } else {
            vErrors.push(err35);
          }
          errors++;
        }
        if (data.result !== undefined) {
          let data13 = data.result;
          let valid24 = false;
          if (data13 && typeof data13 == "object" && !Array.isArray(data13)) {
            const tag2 = data13.kind;
            if (tag2 === undefined) {
              const err36 = {
                instancePath: instancePath + "/result",
                schemaPath:
                  "/mapping/receiptOnly/properties/result/discriminator",
                keyword: "discriminator",
                params: { error: "tag", tag: "kind", tagValue: tag2 },
                message: 'tag "kind" must be string',
              };
              if (vErrors === null) {
                vErrors = [err36];
              } else {
                vErrors.push(err36);
              }
              errors++;
            } else if (typeof tag2 == "string") {
              if (tag2 === "committed") {
                const _errs22 = errors;
                var valid25 = _errs22 === errors;
                valid24 = valid25;
              } else if (tag2 === "inkCommitted") {
                const _errs24 = errors;
                var valid26 = _errs24 === errors;
                valid24 = valid26;
              } else if (tag2 === "profileCommitted") {
                const _errs26 = errors;
                var valid27 = _errs26 === errors;
                valid24 = valid27;
              } else {
                const err37 = {
                  instancePath: instancePath + "/result/kind",
                  schemaPath: "/mapping/receiptOnly/properties/result/mapping",
                  keyword: "discriminator",
                  params: { error: "mapping", tag: "kind", tagValue: tag2 },
                  message: 'value of tag "kind" must be in mapping',
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
                instancePath: instancePath + "/result/kind",
                schemaPath:
                  "/mapping/receiptOnly/properties/result/discriminator",
                keyword: "discriminator",
                params: { error: "tag", tag: "kind", tagValue: tag2 },
                message: 'tag "kind" must be string',
              };
              if (vErrors === null) {
                vErrors = [err38];
              } else {
                vErrors.push(err38);
              }
              errors++;
            }
          } else if (!valid24) {
            const err39 = {
              instancePath: instancePath + "/result",
              schemaPath:
                "/mapping/receiptOnly/properties/result/discriminator",
              keyword: "discriminator",
              params: { type: "object", nullable: false },
              message: "must be object",
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
            schemaPath: "/mapping/receiptOnly/properties/result",
            keyword: "properties",
            params: { error: "missing", missingProperty: "result" },
            message: "must have property 'result'",
          };
          if (vErrors === null) {
            vErrors = [err40];
          } else {
            vErrors.push(err40);
          }
          errors++;
        }
        for (const key5 in data) {
          if (
            key5 !== "resolution" &&
            key5 !== "selection" &&
            key5 !== "result"
          ) {
            const err41 = {
              instancePath:
                instancePath +
                "/" +
                key5.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/receiptOnly",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key5 },
              message: "must NOT have additional properties",
            };
            if (vErrors === null) {
              vErrors = [err41];
            } else {
              vErrors.push(err41);
            }
            errors++;
          }
        }
        if (!valid16) {
          const err42 = {
            instancePath,
            schemaPath: "/mapping/receiptOnly/properties",
            keyword: "properties",
            params: { type: "object", nullable: false },
            message: "must be object",
          };
          if (vErrors === null) {
            vErrors = [err42];
          } else {
            vErrors.push(err42);
          }
          errors++;
        }
        var valid15 = _errs14 === errors;
        valid0 = valid15;
      } else if (tag0 === "rejected") {
        const _errs28 = errors;
        let valid30 = false;
        valid30 = true;
        if (data.selection !== undefined) {
          let data14 = data.selection;
          let valid32 = false;
          if (data14 && typeof data14 == "object" && !Array.isArray(data14)) {
            valid32 = true;
            if (data14.installationId !== undefined) {
              if (!(typeof data14.installationId == "string")) {
                const err43 = {
                  instancePath: instancePath + "/selection/installationId",
                  schemaPath:
                    "/mapping/rejected/properties/selection/properties/installationId/type",
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
                instancePath: instancePath + "/selection",
                schemaPath:
                  "/mapping/rejected/properties/selection/properties/installationId",
                keyword: "properties",
                params: { error: "missing", missingProperty: "installationId" },
                message: "must have property 'installationId'",
              };
              if (vErrors === null) {
                vErrors = [err44];
              } else {
                vErrors.push(err44);
              }
              errors++;
            }
            if (data14.revision !== undefined) {
              if (!(typeof data14.revision == "string")) {
                const err45 = {
                  instancePath: instancePath + "/selection/revision",
                  schemaPath:
                    "/mapping/rejected/properties/selection/properties/revision/type",
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
                instancePath: instancePath + "/selection",
                schemaPath:
                  "/mapping/rejected/properties/selection/properties/revision",
                keyword: "properties",
                params: { error: "missing", missingProperty: "revision" },
                message: "must have property 'revision'",
              };
              if (vErrors === null) {
                vErrors = [err46];
              } else {
                vErrors.push(err46);
              }
              errors++;
            }
            if (data14.owner !== undefined) {
              let data17 = data14.owner;
              let valid34 = false;
              if (
                data17 &&
                typeof data17 == "object" &&
                !Array.isArray(data17)
              ) {
                valid34 = true;
                if (data17.profileId !== undefined) {
                  if (!(typeof data17.profileId == "string")) {
                    const err47 = {
                      instancePath: instancePath + "/selection/owner/profileId",
                      schemaPath:
                        "/mapping/rejected/properties/selection/properties/owner/properties/profileId/type",
                      keyword: "type",
                      params: { type: "string", nullable: false },
                      message: "must be string",
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
                    instancePath: instancePath + "/selection/owner",
                    schemaPath:
                      "/mapping/rejected/properties/selection/properties/owner/properties/profileId",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "profileId" },
                    message: "must have property 'profileId'",
                  };
                  if (vErrors === null) {
                    vErrors = [err48];
                  } else {
                    vErrors.push(err48);
                  }
                  errors++;
                }
                if (data17.generation !== undefined) {
                  if (!(typeof data17.generation == "string")) {
                    const err49 = {
                      instancePath:
                        instancePath + "/selection/owner/generation",
                      schemaPath:
                        "/mapping/rejected/properties/selection/properties/owner/properties/generation/type",
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
                    instancePath: instancePath + "/selection/owner",
                    schemaPath:
                      "/mapping/rejected/properties/selection/properties/owner/properties/generation",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "generation" },
                    message: "must have property 'generation'",
                  };
                  if (vErrors === null) {
                    vErrors = [err50];
                  } else {
                    vErrors.push(err50);
                  }
                  errors++;
                }
                for (const key6 in data17) {
                  if (key6 !== "profileId" && key6 !== "generation") {
                    const err51 = {
                      instancePath:
                        instancePath +
                        "/selection/owner/" +
                        key6.replace(/~/g, "~0").replace(/\//g, "~1"),
                      schemaPath:
                        "/mapping/rejected/properties/selection/properties/owner",
                      keyword: "properties",
                      params: { error: "additional", additionalProperty: key6 },
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
              }
              if (!valid34) {
                const err52 = {
                  instancePath: instancePath + "/selection/owner",
                  schemaPath:
                    "/mapping/rejected/properties/selection/properties/owner/properties",
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
            } else {
              const err53 = {
                instancePath: instancePath + "/selection",
                schemaPath:
                  "/mapping/rejected/properties/selection/properties/owner",
                keyword: "properties",
                params: { error: "missing", missingProperty: "owner" },
                message: "must have property 'owner'",
              };
              if (vErrors === null) {
                vErrors = [err53];
              } else {
                vErrors.push(err53);
              }
              errors++;
            }
            for (const key7 in data14) {
              if (
                key7 !== "installationId" &&
                key7 !== "revision" &&
                key7 !== "owner"
              ) {
                const err54 = {
                  instancePath:
                    instancePath +
                    "/selection/" +
                    key7.replace(/~/g, "~0").replace(/\//g, "~1"),
                  schemaPath: "/mapping/rejected/properties/selection",
                  keyword: "properties",
                  params: { error: "additional", additionalProperty: key7 },
                  message: "must NOT have additional properties",
                };
                if (vErrors === null) {
                  vErrors = [err54];
                } else {
                  vErrors.push(err54);
                }
                errors++;
              }
            }
          }
          if (!valid32) {
            const err55 = {
              instancePath: instancePath + "/selection",
              schemaPath: "/mapping/rejected/properties/selection/properties",
              keyword: "properties",
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
        } else {
          const err56 = {
            instancePath,
            schemaPath: "/mapping/rejected/properties/selection",
            keyword: "properties",
            params: { error: "missing", missingProperty: "selection" },
            message: "must have property 'selection'",
          };
          if (vErrors === null) {
            vErrors = [err56];
          } else {
            vErrors.push(err56);
          }
          errors++;
        }
        if (data.result !== undefined) {
          let data20 = data.result;
          let valid38 = false;
          if (data20 && typeof data20 == "object" && !Array.isArray(data20)) {
            const tag3 = data20.kind;
            if (tag3 === undefined) {
              const err57 = {
                instancePath: instancePath + "/result",
                schemaPath: "/mapping/rejected/properties/result/discriminator",
                keyword: "discriminator",
                params: { error: "tag", tag: "kind", tagValue: tag3 },
                message: 'tag "kind" must be string',
              };
              if (vErrors === null) {
                vErrors = [err57];
              } else {
                vErrors.push(err57);
              }
              errors++;
            } else if (typeof tag3 == "string") {
              if (tag3 === "rejected") {
                const _errs36 = errors;
                let valid40 = false;
                valid40 = true;
                if (data20.code !== undefined) {
                  if (!(typeof data20.code == "string")) {
                    const err58 = {
                      instancePath: instancePath + "/result/code",
                      schemaPath:
                        "/mapping/rejected/properties/result/mapping/rejected/properties/code/type",
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
                    instancePath: instancePath + "/result",
                    schemaPath:
                      "/mapping/rejected/properties/result/mapping/rejected/properties/code",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "code" },
                    message: "must have property 'code'",
                  };
                  if (vErrors === null) {
                    vErrors = [err59];
                  } else {
                    vErrors.push(err59);
                  }
                  errors++;
                }
                if (data20.message !== undefined) {
                  if (!(typeof data20.message == "string")) {
                    const err60 = {
                      instancePath: instancePath + "/result/message",
                      schemaPath:
                        "/mapping/rejected/properties/result/mapping/rejected/properties/message/type",
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
                    instancePath: instancePath + "/result",
                    schemaPath:
                      "/mapping/rejected/properties/result/mapping/rejected/properties/message",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "message" },
                    message: "must have property 'message'",
                  };
                  if (vErrors === null) {
                    vErrors = [err61];
                  } else {
                    vErrors.push(err61);
                  }
                  errors++;
                }
                for (const key8 in data20) {
                  if (
                    key8 !== "kind" &&
                    key8 !== "code" &&
                    key8 !== "message"
                  ) {
                    const err62 = {
                      instancePath:
                        instancePath +
                        "/result/" +
                        key8.replace(/~/g, "~0").replace(/\//g, "~1"),
                      schemaPath:
                        "/mapping/rejected/properties/result/mapping/rejected",
                      keyword: "properties",
                      params: { error: "additional", additionalProperty: key8 },
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
                if (!valid40) {
                  const err63 = {
                    instancePath: instancePath + "/result",
                    schemaPath:
                      "/mapping/rejected/properties/result/mapping/rejected/properties",
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
                var valid39 = _errs36 === errors;
                valid38 = valid39;
              } else {
                const err64 = {
                  instancePath: instancePath + "/result/kind",
                  schemaPath: "/mapping/rejected/properties/result/mapping",
                  keyword: "discriminator",
                  params: { error: "mapping", tag: "kind", tagValue: tag3 },
                  message: 'value of tag "kind" must be in mapping',
                };
                if (vErrors === null) {
                  vErrors = [err64];
                } else {
                  vErrors.push(err64);
                }
                errors++;
              }
            } else {
              const err65 = {
                instancePath: instancePath + "/result/kind",
                schemaPath: "/mapping/rejected/properties/result/discriminator",
                keyword: "discriminator",
                params: { error: "tag", tag: "kind", tagValue: tag3 },
                message: 'tag "kind" must be string',
              };
              if (vErrors === null) {
                vErrors = [err65];
              } else {
                vErrors.push(err65);
              }
              errors++;
            }
          } else if (!valid38) {
            const err66 = {
              instancePath: instancePath + "/result",
              schemaPath: "/mapping/rejected/properties/result/discriminator",
              keyword: "discriminator",
              params: { type: "object", nullable: false },
              message: "must be object",
            };
            if (vErrors === null) {
              vErrors = [err66];
            } else {
              vErrors.push(err66);
            }
            errors++;
          }
        } else {
          const err67 = {
            instancePath,
            schemaPath: "/mapping/rejected/properties/result",
            keyword: "properties",
            params: { error: "missing", missingProperty: "result" },
            message: "must have property 'result'",
          };
          if (vErrors === null) {
            vErrors = [err67];
          } else {
            vErrors.push(err67);
          }
          errors++;
        }
        for (const key9 in data) {
          if (
            key9 !== "resolution" &&
            key9 !== "selection" &&
            key9 !== "result"
          ) {
            const err68 = {
              instancePath:
                instancePath +
                "/" +
                key9.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/rejected",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key9 },
              message: "must NOT have additional properties",
            };
            if (vErrors === null) {
              vErrors = [err68];
            } else {
              vErrors.push(err68);
            }
            errors++;
          }
        }
        if (!valid30) {
          const err69 = {
            instancePath,
            schemaPath: "/mapping/rejected/properties",
            keyword: "properties",
            params: { type: "object", nullable: false },
            message: "must be object",
          };
          if (vErrors === null) {
            vErrors = [err69];
          } else {
            vErrors.push(err69);
          }
          errors++;
        }
        var valid29 = _errs28 === errors;
        valid0 = valid29;
      } else {
        const err70 = {
          instancePath: instancePath + "/resolution",
          schemaPath: "/mapping",
          keyword: "discriminator",
          params: { error: "mapping", tag: "resolution", tagValue: tag0 },
          message: 'value of tag "resolution" must be in mapping',
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
        instancePath: instancePath + "/resolution",
        schemaPath: "/discriminator",
        keyword: "discriminator",
        params: { error: "tag", tag: "resolution", tagValue: tag0 },
        message: 'tag "resolution" must be string',
      };
      if (vErrors === null) {
        vErrors = [err71];
      } else {
        vErrors.push(err71);
      }
      errors++;
    }
  } else if (!valid0) {
    const err72 = {
      instancePath,
      schemaPath: "/discriminator",
      keyword: "discriminator",
      params: { type: "object", nullable: false },
      message: "must be object",
    };
    if (vErrors === null) {
      vErrors = [err72];
    } else {
      vErrors.push(err72);
    }
    errors++;
  }
  validate72.errors = vErrors;
  return errors === 0;
}
export const validateInkResult = validate73;
const schema45 = {
  discriminator: "kind",
  mapping: {
    inkCommitted: { properties: { commandId: { type: "string" }, token: {} } },
    rejected: {
      properties: { code: { type: "string" }, message: { type: "string" } },
    },
  },
};
function validate73(
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
      if (tag0 === "inkCommitted") {
        const _errs0 = errors;
        let valid2 = false;
        valid2 = true;
        if (data.commandId !== undefined) {
          if (!(typeof data.commandId == "string")) {
            const err1 = {
              instancePath: instancePath + "/commandId",
              schemaPath: "/mapping/inkCommitted/properties/commandId/type",
              keyword: "type",
              params: { type: "string", nullable: false },
              message: "must be string",
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
            schemaPath: "/mapping/inkCommitted/properties/commandId",
            keyword: "properties",
            params: { error: "missing", missingProperty: "commandId" },
            message: "must have property 'commandId'",
          };
          if (vErrors === null) {
            vErrors = [err2];
          } else {
            vErrors.push(err2);
          }
          errors++;
        }
        for (const key0 in data) {
          if (key0 !== "kind" && key0 !== "commandId" && key0 !== "token") {
            const err3 = {
              instancePath:
                instancePath +
                "/" +
                key0.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/inkCommitted",
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
            schemaPath: "/mapping/inkCommitted/properties",
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
      } else if (tag0 === "rejected") {
        const _errs2 = errors;
        let valid6 = false;
        valid6 = true;
        if (data.code !== undefined) {
          if (!(typeof data.code == "string")) {
            const err5 = {
              instancePath: instancePath + "/code",
              schemaPath: "/mapping/rejected/properties/code/type",
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
            schemaPath: "/mapping/rejected/properties/code",
            keyword: "properties",
            params: { error: "missing", missingProperty: "code" },
            message: "must have property 'code'",
          };
          if (vErrors === null) {
            vErrors = [err6];
          } else {
            vErrors.push(err6);
          }
          errors++;
        }
        if (data.message !== undefined) {
          if (!(typeof data.message == "string")) {
            const err7 = {
              instancePath: instancePath + "/message",
              schemaPath: "/mapping/rejected/properties/message/type",
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
            schemaPath: "/mapping/rejected/properties/message",
            keyword: "properties",
            params: { error: "missing", missingProperty: "message" },
            message: "must have property 'message'",
          };
          if (vErrors === null) {
            vErrors = [err8];
          } else {
            vErrors.push(err8);
          }
          errors++;
        }
        for (const key1 in data) {
          if (key1 !== "kind" && key1 !== "code" && key1 !== "message") {
            const err9 = {
              instancePath:
                instancePath +
                "/" +
                key1.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/rejected",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key1 },
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
        if (!valid6) {
          const err10 = {
            instancePath,
            schemaPath: "/mapping/rejected/properties",
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
        var valid5 = _errs2 === errors;
        valid0 = valid5;
      } else {
        const err11 = {
          instancePath: instancePath + "/kind",
          schemaPath: "/mapping",
          keyword: "discriminator",
          params: { error: "mapping", tag: "kind", tagValue: tag0 },
          message: 'value of tag "kind" must be in mapping',
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
        instancePath: instancePath + "/kind",
        schemaPath: "/discriminator",
        keyword: "discriminator",
        params: { error: "tag", tag: "kind", tagValue: tag0 },
        message: 'tag "kind" must be string',
      };
      if (vErrors === null) {
        vErrors = [err12];
      } else {
        vErrors.push(err12);
      }
      errors++;
    }
  } else if (!valid0) {
    const err13 = {
      instancePath,
      schemaPath: "/discriminator",
      keyword: "discriminator",
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
  validate73.errors = vErrors;
  return errors === 0;
}
