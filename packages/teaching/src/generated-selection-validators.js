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
    profileCommitted: { properties: {}, additionalProperties: true },
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
        var valid1 = _errs0 === errors;
        valid0 = valid1;
      } else if (tag0 === "rejected") {
        const _errs2 = errors;
        let valid3 = false;
        valid3 = true;
        if (data.code !== undefined) {
          if (!(typeof data.code == "string")) {
            const err1 = {
              instancePath: instancePath + "/code",
              schemaPath: "/mapping/rejected/properties/code/type",
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
            schemaPath: "/mapping/rejected/properties/code",
            keyword: "properties",
            params: { error: "missing", missingProperty: "code" },
            message: "must have property 'code'",
          };
          if (vErrors === null) {
            vErrors = [err2];
          } else {
            vErrors.push(err2);
          }
          errors++;
        }
        if (data.message !== undefined) {
          if (!(typeof data.message == "string")) {
            const err3 = {
              instancePath: instancePath + "/message",
              schemaPath: "/mapping/rejected/properties/message/type",
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
            schemaPath: "/mapping/rejected/properties/message",
            keyword: "properties",
            params: { error: "missing", missingProperty: "message" },
            message: "must have property 'message'",
          };
          if (vErrors === null) {
            vErrors = [err4];
          } else {
            vErrors.push(err4);
          }
          errors++;
        }
        for (const key0 in data) {
          if (key0 !== "kind" && key0 !== "code" && key0 !== "message") {
            const err5 = {
              instancePath:
                instancePath +
                "/" +
                key0.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/rejected",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key0 },
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
        if (!valid3) {
          const err6 = {
            instancePath,
            schemaPath: "/mapping/rejected/properties",
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
        var valid2 = _errs2 === errors;
        valid0 = valid2;
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
  validate64.errors = vErrors;
  return errors === 0;
}
export const validateSelectedWorkerRequest = validate65;
const schema37 = {
  discriminator: "kind",
  mapping: {
    openRecovery: {
      properties: {
        id: { type: "string" },
        content: {},
        preparation: {
          discriminator: "kind",
          mapping: {
            unavailable: {
              properties: { reason: { enum: ["missing", "invalid"] } },
            },
            available: { properties: { package: {} } },
          },
        },
        opening: {},
      },
    },
    readDirectory: { properties: { id: { type: "string" } } },
    readDiagnostics: { properties: { id: { type: "string" } } },
    recordDiagnostic: {
      properties: {
        id: { type: "string" },
        event: {
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
        if (data.preparation !== undefined) {
          let data1 = data.preparation;
          let valid4 = false;
          if (data1 && typeof data1 == "object" && !Array.isArray(data1)) {
            const tag1 = data1.kind;
            if (tag1 === undefined) {
              const err3 = {
                instancePath: instancePath + "/preparation",
                schemaPath:
                  "/mapping/openRecovery/properties/preparation/discriminator",
                keyword: "discriminator",
                params: { error: "tag", tag: "kind", tagValue: tag1 },
                message: 'tag "kind" must be string',
              };
              if (vErrors === null) {
                vErrors = [err3];
              } else {
                vErrors.push(err3);
              }
              errors++;
            } else if (typeof tag1 == "string") {
              if (tag1 === "unavailable") {
                const _errs3 = errors;
                let valid6 = false;
                valid6 = true;
                if (data1.reason !== undefined) {
                  let data2 = data1.reason;
                  if (!(
                    typeof data2 == "string" &&
                    (data2 === "missing" || data2 === "invalid")
                  )) {
                    const err4 = {
                      instancePath: instancePath + "/preparation/reason",
                      schemaPath:
                        "/mapping/openRecovery/properties/preparation/mapping/unavailable/properties/reason/enum",
                      keyword: "enum",
                      params: {
                        allowedValues:
                          schema37.mapping.openRecovery.properties.preparation
                            .mapping.unavailable.properties.reason.enum,
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
                    instancePath: instancePath + "/preparation",
                    schemaPath:
                      "/mapping/openRecovery/properties/preparation/mapping/unavailable/properties/reason",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "reason" },
                    message: "must have property 'reason'",
                  };
                  if (vErrors === null) {
                    vErrors = [err5];
                  } else {
                    vErrors.push(err5);
                  }
                  errors++;
                }
                for (const key0 in data1) {
                  if (key0 !== "kind" && key0 !== "reason") {
                    const err6 = {
                      instancePath:
                        instancePath +
                        "/preparation/" +
                        key0.replace(/~/g, "~0").replace(/\//g, "~1"),
                      schemaPath:
                        "/mapping/openRecovery/properties/preparation/mapping/unavailable",
                      keyword: "properties",
                      params: { error: "additional", additionalProperty: key0 },
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
                if (!valid6) {
                  const err7 = {
                    instancePath: instancePath + "/preparation",
                    schemaPath:
                      "/mapping/openRecovery/properties/preparation/mapping/unavailable/properties",
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
                var valid5 = _errs3 === errors;
                valid4 = valid5;
              } else if (tag1 === "available") {
                const _errs5 = errors;
                let valid10 = false;
                valid10 = true;
                for (const key1 in data1) {
                  if (key1 !== "kind" && key1 !== "package") {
                    const err8 = {
                      instancePath:
                        instancePath +
                        "/preparation/" +
                        key1.replace(/~/g, "~0").replace(/\//g, "~1"),
                      schemaPath:
                        "/mapping/openRecovery/properties/preparation/mapping/available",
                      keyword: "properties",
                      params: { error: "additional", additionalProperty: key1 },
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
                if (!valid10) {
                  const err9 = {
                    instancePath: instancePath + "/preparation",
                    schemaPath:
                      "/mapping/openRecovery/properties/preparation/mapping/available/properties",
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
                var valid9 = _errs5 === errors;
                valid4 = valid9;
              } else {
                const err10 = {
                  instancePath: instancePath + "/preparation/kind",
                  schemaPath:
                    "/mapping/openRecovery/properties/preparation/mapping",
                  keyword: "discriminator",
                  params: { error: "mapping", tag: "kind", tagValue: tag1 },
                  message: 'value of tag "kind" must be in mapping',
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
                instancePath: instancePath + "/preparation/kind",
                schemaPath:
                  "/mapping/openRecovery/properties/preparation/discriminator",
                keyword: "discriminator",
                params: { error: "tag", tag: "kind", tagValue: tag1 },
                message: 'tag "kind" must be string',
              };
              if (vErrors === null) {
                vErrors = [err11];
              } else {
                vErrors.push(err11);
              }
              errors++;
            }
          } else if (!valid4) {
            const err12 = {
              instancePath: instancePath + "/preparation",
              schemaPath:
                "/mapping/openRecovery/properties/preparation/discriminator",
              keyword: "discriminator",
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
            schemaPath: "/mapping/openRecovery/properties/preparation",
            keyword: "properties",
            params: { error: "missing", missingProperty: "preparation" },
            message: "must have property 'preparation'",
          };
          if (vErrors === null) {
            vErrors = [err13];
          } else {
            vErrors.push(err13);
          }
          errors++;
        }
        for (const key2 in data) {
          if (
            key2 !== "kind" &&
            key2 !== "id" &&
            key2 !== "content" &&
            key2 !== "preparation" &&
            key2 !== "opening"
          ) {
            const err14 = {
              instancePath:
                instancePath +
                "/" +
                key2.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/openRecovery",
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
        if (!valid2) {
          const err15 = {
            instancePath,
            schemaPath: "/mapping/openRecovery/properties",
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
        var valid1 = _errs0 === errors;
        valid0 = valid1;
      } else if (tag0 === "readDirectory") {
        const _errs6 = errors;
        let valid15 = false;
        valid15 = true;
        if (data.id !== undefined) {
          if (!(typeof data.id == "string")) {
            const err16 = {
              instancePath: instancePath + "/id",
              schemaPath: "/mapping/readDirectory/properties/id/type",
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
            instancePath,
            schemaPath: "/mapping/readDirectory/properties/id",
            keyword: "properties",
            params: { error: "missing", missingProperty: "id" },
            message: "must have property 'id'",
          };
          if (vErrors === null) {
            vErrors = [err17];
          } else {
            vErrors.push(err17);
          }
          errors++;
        }
        for (const key3 in data) {
          if (key3 !== "kind" && key3 !== "id") {
            const err18 = {
              instancePath:
                instancePath +
                "/" +
                key3.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/readDirectory",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key3 },
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
        if (!valid15) {
          const err19 = {
            instancePath,
            schemaPath: "/mapping/readDirectory/properties",
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
        var valid14 = _errs6 === errors;
        valid0 = valid14;
      } else if (tag0 === "readDiagnostics") {
        const _errs8 = errors;
        let valid19 = false;
        valid19 = true;
        if (data.id !== undefined) {
          if (!(typeof data.id == "string")) {
            const err20 = {
              instancePath: instancePath + "/id",
              schemaPath: "/mapping/readDiagnostics/properties/id/type",
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
            instancePath,
            schemaPath: "/mapping/readDiagnostics/properties/id",
            keyword: "properties",
            params: { error: "missing", missingProperty: "id" },
            message: "must have property 'id'",
          };
          if (vErrors === null) {
            vErrors = [err21];
          } else {
            vErrors.push(err21);
          }
          errors++;
        }
        for (const key4 in data) {
          if (key4 !== "kind" && key4 !== "id") {
            const err22 = {
              instancePath:
                instancePath +
                "/" +
                key4.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/readDiagnostics",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key4 },
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
        if (!valid19) {
          const err23 = {
            instancePath,
            schemaPath: "/mapping/readDiagnostics/properties",
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
        var valid18 = _errs8 === errors;
        valid0 = valid18;
      } else if (tag0 === "recordDiagnostic") {
        const _errs10 = errors;
        let valid23 = false;
        valid23 = true;
        if (data.id !== undefined) {
          if (!(typeof data.id == "string")) {
            const err24 = {
              instancePath: instancePath + "/id",
              schemaPath: "/mapping/recordDiagnostic/properties/id/type",
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
            instancePath,
            schemaPath: "/mapping/recordDiagnostic/properties/id",
            keyword: "properties",
            params: { error: "missing", missingProperty: "id" },
            message: "must have property 'id'",
          };
          if (vErrors === null) {
            vErrors = [err25];
          } else {
            vErrors.push(err25);
          }
          errors++;
        }
        if (data.event !== undefined) {
          let data6 = data.event;
          let valid25 = false;
          if (data6 && typeof data6 == "object" && !Array.isArray(data6)) {
            valid25 = true;
            if (data6.category !== undefined) {
              let data7 = data6.category;
              if (!(
                typeof data7 == "string" &&
                (data7 === "storage-unavailable" ||
                  data7 === "storage-corrupt" ||
                  data7 === "quota" ||
                  data7 === "write-failed" ||
                  data7 === "read-failed" ||
                  data7 === "recovery" ||
                  data7 === "unsupported" ||
                  data7 === "timing")
              )) {
                const err26 = {
                  instancePath: instancePath + "/event/category",
                  schemaPath:
                    "/mapping/recordDiagnostic/properties/event/properties/category/enum",
                  keyword: "enum",
                  params: {
                    allowedValues:
                      schema37.mapping.recordDiagnostic.properties.event
                        .properties.category.enum,
                  },
                  message: "must be equal to one of the allowed values",
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
                instancePath: instancePath + "/event",
                schemaPath:
                  "/mapping/recordDiagnostic/properties/event/properties/category",
                keyword: "properties",
                params: { error: "missing", missingProperty: "category" },
                message: "must have property 'category'",
              };
              if (vErrors === null) {
                vErrors = [err27];
              } else {
                vErrors.push(err27);
              }
              errors++;
            }
            if (data6.operation !== undefined) {
              let data8 = data6.operation;
              if (!(
                typeof data8 == "string" &&
                (data8 === "startup" ||
                  data8 === "read" ||
                  data8 === "teaching" ||
                  data8 === "ink" ||
                  data8 === "administration" ||
                  data8 === "support")
              )) {
                const err28 = {
                  instancePath: instancePath + "/event/operation",
                  schemaPath:
                    "/mapping/recordDiagnostic/properties/event/properties/operation/enum",
                  keyword: "enum",
                  params: {
                    allowedValues:
                      schema37.mapping.recordDiagnostic.properties.event
                        .properties.operation.enum,
                  },
                  message: "must be equal to one of the allowed values",
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
                instancePath: instancePath + "/event",
                schemaPath:
                  "/mapping/recordDiagnostic/properties/event/properties/operation",
                keyword: "properties",
                params: { error: "missing", missingProperty: "operation" },
                message: "must have property 'operation'",
              };
              if (vErrors === null) {
                vErrors = [err29];
              } else {
                vErrors.push(err29);
              }
              errors++;
            }
            if (data6.count !== undefined) {
              let data9 = data6.count;
              if (!(
                typeof data9 == "number" &&
                isFinite(data9) &&
                !(data9 % 1) &&
                data9 >= 0 &&
                data9 <= 4294967295
              )) {
                const err30 = {
                  instancePath: instancePath + "/event/count",
                  schemaPath:
                    "/mapping/recordDiagnostic/properties/event/properties/count/type",
                  keyword: "type",
                  params: { type: "uint32", nullable: false },
                  message: "must be uint32",
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
                instancePath: instancePath + "/event",
                schemaPath:
                  "/mapping/recordDiagnostic/properties/event/properties/count",
                keyword: "properties",
                params: { error: "missing", missingProperty: "count" },
                message: "must have property 'count'",
              };
              if (vErrors === null) {
                vErrors = [err31];
              } else {
                vErrors.push(err31);
              }
              errors++;
            }
            if (data6.durationMs !== undefined) {
              let data10 = data6.durationMs;
              if (!(
                typeof data10 == "number" &&
                isFinite(data10) &&
                !(data10 % 1) &&
                data10 >= 0 &&
                data10 <= 4294967295
              )) {
                const err32 = {
                  instancePath: instancePath + "/event/durationMs",
                  schemaPath:
                    "/mapping/recordDiagnostic/properties/event/properties/durationMs/type",
                  keyword: "type",
                  params: { type: "uint32", nullable: false },
                  message: "must be uint32",
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
                instancePath: instancePath + "/event",
                schemaPath:
                  "/mapping/recordDiagnostic/properties/event/properties/durationMs",
                keyword: "properties",
                params: { error: "missing", missingProperty: "durationMs" },
                message: "must have property 'durationMs'",
              };
              if (vErrors === null) {
                vErrors = [err33];
              } else {
                vErrors.push(err33);
              }
              errors++;
            }
            for (const key5 in data6) {
              if (
                key5 !== "category" &&
                key5 !== "operation" &&
                key5 !== "count" &&
                key5 !== "durationMs"
              ) {
                const err34 = {
                  instancePath:
                    instancePath +
                    "/event/" +
                    key5.replace(/~/g, "~0").replace(/\//g, "~1"),
                  schemaPath: "/mapping/recordDiagnostic/properties/event",
                  keyword: "properties",
                  params: { error: "additional", additionalProperty: key5 },
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
          if (!valid25) {
            const err35 = {
              instancePath: instancePath + "/event",
              schemaPath:
                "/mapping/recordDiagnostic/properties/event/properties",
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
            schemaPath: "/mapping/recordDiagnostic/properties/event",
            keyword: "properties",
            params: { error: "missing", missingProperty: "event" },
            message: "must have property 'event'",
          };
          if (vErrors === null) {
            vErrors = [err36];
          } else {
            vErrors.push(err36);
          }
          errors++;
        }
        for (const key6 in data) {
          if (key6 !== "kind" && key6 !== "id" && key6 !== "event") {
            const err37 = {
              instancePath:
                instancePath +
                "/" +
                key6.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/recordDiagnostic",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key6 },
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
        if (!valid23) {
          const err38 = {
            instancePath,
            schemaPath: "/mapping/recordDiagnostic/properties",
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
        var valid22 = _errs10 === errors;
        valid0 = valid22;
      } else if (tag0 === "read") {
        const _errs17 = errors;
        let valid30 = false;
        valid30 = true;
        if (data.id !== undefined) {
          if (!(typeof data.id == "string")) {
            const err39 = {
              instancePath: instancePath + "/id",
              schemaPath: "/mapping/read/properties/id/type",
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
            schemaPath: "/mapping/read/properties/id",
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
          let valid32 = false;
          if (data12 && typeof data12 == "object" && !Array.isArray(data12)) {
            valid32 = true;
            if (data12.selection !== undefined) {
              let data13 = data12.selection;
              let valid34 = false;
              if (
                data13 &&
                typeof data13 == "object" &&
                !Array.isArray(data13)
              ) {
                valid34 = true;
                if (data13.installationId !== undefined) {
                  if (!(typeof data13.installationId == "string")) {
                    const err41 = {
                      instancePath:
                        instancePath + "/input/selection/installationId",
                      schemaPath:
                        "/mapping/read/properties/input/properties/selection/properties/installationId/type",
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
                      "/mapping/read/properties/input/properties/selection/properties/installationId",
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
                        "/mapping/read/properties/input/properties/selection/properties/revision/type",
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
                      "/mapping/read/properties/input/properties/selection/properties/revision",
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
                  let valid36 = false;
                  if (
                    data16 &&
                    typeof data16 == "object" &&
                    !Array.isArray(data16)
                  ) {
                    valid36 = true;
                    if (data16.profileId !== undefined) {
                      if (!(typeof data16.profileId == "string")) {
                        const err45 = {
                          instancePath:
                            instancePath + "/input/selection/owner/profileId",
                          schemaPath:
                            "/mapping/read/properties/input/properties/selection/properties/owner/properties/profileId/type",
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
                          "/mapping/read/properties/input/properties/selection/properties/owner/properties/profileId",
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
                            "/mapping/read/properties/input/properties/selection/properties/owner/properties/generation/type",
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
                          "/mapping/read/properties/input/properties/selection/properties/owner/properties/generation",
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
                    for (const key7 in data16) {
                      if (key7 !== "profileId" && key7 !== "generation") {
                        const err49 = {
                          instancePath:
                            instancePath +
                            "/input/selection/owner/" +
                            key7.replace(/~/g, "~0").replace(/\//g, "~1"),
                          schemaPath:
                            "/mapping/read/properties/input/properties/selection/properties/owner",
                          keyword: "properties",
                          params: {
                            error: "additional",
                            additionalProperty: key7,
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
                  if (!valid36) {
                    const err50 = {
                      instancePath: instancePath + "/input/selection/owner",
                      schemaPath:
                        "/mapping/read/properties/input/properties/selection/properties/owner/properties",
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
                      "/mapping/read/properties/input/properties/selection/properties/owner",
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
                for (const key8 in data13) {
                  if (
                    key8 !== "installationId" &&
                    key8 !== "revision" &&
                    key8 !== "owner"
                  ) {
                    const err52 = {
                      instancePath:
                        instancePath +
                        "/input/selection/" +
                        key8.replace(/~/g, "~0").replace(/\//g, "~1"),
                      schemaPath:
                        "/mapping/read/properties/input/properties/selection",
                      keyword: "properties",
                      params: { error: "additional", additionalProperty: key8 },
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
              if (!valid34) {
                const err53 = {
                  instancePath: instancePath + "/input/selection",
                  schemaPath:
                    "/mapping/read/properties/input/properties/selection/properties",
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
                  "/mapping/read/properties/input/properties/selection",
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
            if (data12.target !== undefined) {
              let data19 = data12.target;
              let valid40 = false;
              if (
                data19 &&
                typeof data19 == "object" &&
                !Array.isArray(data19)
              ) {
                const tag2 = data19.kind;
                if (tag2 === undefined) {
                  const err55 = {
                    instancePath: instancePath + "/input/target",
                    schemaPath:
                      "/mapping/read/properties/input/properties/target/discriminator",
                    keyword: "discriminator",
                    params: { error: "tag", tag: "kind", tagValue: tag2 },
                    message: 'tag "kind" must be string',
                  };
                  if (vErrors === null) {
                    vErrors = [err55];
                  } else {
                    vErrors.push(err55);
                  }
                  errors++;
                } else if (typeof tag2 == "string") {
                  if (tag2 === "cursor") {
                    const _errs27 = errors;
                    let valid42 = false;
                    valid42 = true;
                    for (const key9 in data19) {
                      if (key9 !== "kind") {
                        const err56 = {
                          instancePath:
                            instancePath +
                            "/input/target/" +
                            key9.replace(/~/g, "~0").replace(/\//g, "~1"),
                          schemaPath:
                            "/mapping/read/properties/input/properties/target/mapping/cursor",
                          keyword: "properties",
                          params: {
                            error: "additional",
                            additionalProperty: key9,
                          },
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
                    if (!valid42) {
                      const err57 = {
                        instancePath: instancePath + "/input/target",
                        schemaPath:
                          "/mapping/read/properties/input/properties/target/mapping/cursor/properties",
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
                    var valid41 = _errs27 === errors;
                    valid40 = valid41;
                  } else if (tag2 === "accepted") {
                    const _errs28 = errors;
                    let valid46 = false;
                    valid46 = true;
                    for (const key10 in data19) {
                      if (key10 !== "kind" && key10 !== "receipt") {
                        const err58 = {
                          instancePath:
                            instancePath +
                            "/input/target/" +
                            key10.replace(/~/g, "~0").replace(/\//g, "~1"),
                          schemaPath:
                            "/mapping/read/properties/input/properties/target/mapping/accepted",
                          keyword: "properties",
                          params: {
                            error: "additional",
                            additionalProperty: key10,
                          },
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
                    if (!valid46) {
                      const err59 = {
                        instancePath: instancePath + "/input/target",
                        schemaPath:
                          "/mapping/read/properties/input/properties/target/mapping/accepted/properties",
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
                    var valid45 = _errs28 === errors;
                    valid40 = valid45;
                  } else {
                    const err60 = {
                      instancePath: instancePath + "/input/target/kind",
                      schemaPath:
                        "/mapping/read/properties/input/properties/target/mapping",
                      keyword: "discriminator",
                      params: { error: "mapping", tag: "kind", tagValue: tag2 },
                      message: 'value of tag "kind" must be in mapping',
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
                    instancePath: instancePath + "/input/target/kind",
                    schemaPath:
                      "/mapping/read/properties/input/properties/target/discriminator",
                    keyword: "discriminator",
                    params: { error: "tag", tag: "kind", tagValue: tag2 },
                    message: 'tag "kind" must be string',
                  };
                  if (vErrors === null) {
                    vErrors = [err61];
                  } else {
                    vErrors.push(err61);
                  }
                  errors++;
                }
              } else if (!valid40) {
                const err62 = {
                  instancePath: instancePath + "/input/target",
                  schemaPath:
                    "/mapping/read/properties/input/properties/target/discriminator",
                  keyword: "discriminator",
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
                instancePath: instancePath + "/input",
                schemaPath: "/mapping/read/properties/input/properties/target",
                keyword: "properties",
                params: { error: "missing", missingProperty: "target" },
                message: "must have property 'target'",
              };
              if (vErrors === null) {
                vErrors = [err63];
              } else {
                vErrors.push(err63);
              }
              errors++;
            }
            for (const key11 in data12) {
              if (key11 !== "selection" && key11 !== "target") {
                const err64 = {
                  instancePath:
                    instancePath +
                    "/input/" +
                    key11.replace(/~/g, "~0").replace(/\//g, "~1"),
                  schemaPath: "/mapping/read/properties/input",
                  keyword: "properties",
                  params: { error: "additional", additionalProperty: key11 },
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
          if (!valid32) {
            const err65 = {
              instancePath: instancePath + "/input",
              schemaPath: "/mapping/read/properties/input/properties",
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
            schemaPath: "/mapping/read/properties/input",
            keyword: "properties",
            params: { error: "missing", missingProperty: "input" },
            message: "must have property 'input'",
          };
          if (vErrors === null) {
            vErrors = [err66];
          } else {
            vErrors.push(err66);
          }
          errors++;
        }
        for (const key12 in data) {
          if (key12 !== "kind" && key12 !== "id" && key12 !== "input") {
            const err67 = {
              instancePath:
                instancePath +
                "/" +
                key12.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/read",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key12 },
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
        if (!valid30) {
          const err68 = {
            instancePath,
            schemaPath: "/mapping/read/properties",
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
        var valid29 = _errs17 === errors;
        valid0 = valid29;
      } else if (tag0 === "readWork") {
        const _errs29 = errors;
        let valid52 = false;
        valid52 = true;
        if (data.id !== undefined) {
          if (!(typeof data.id == "string")) {
            const err69 = {
              instancePath: instancePath + "/id",
              schemaPath: "/mapping/readWork/properties/id/type",
              keyword: "type",
              params: { type: "string", nullable: false },
              message: "must be string",
            };
            if (vErrors === null) {
              vErrors = [err69];
            } else {
              vErrors.push(err69);
            }
            errors++;
          }
        } else {
          const err70 = {
            instancePath,
            schemaPath: "/mapping/readWork/properties/id",
            keyword: "properties",
            params: { error: "missing", missingProperty: "id" },
            message: "must have property 'id'",
          };
          if (vErrors === null) {
            vErrors = [err70];
          } else {
            vErrors.push(err70);
          }
          errors++;
        }
        if (data.input !== undefined) {
          let data21 = data.input;
          let valid54 = false;
          if (data21 && typeof data21 == "object" && !Array.isArray(data21)) {
            valid54 = true;
            if (data21.selection !== undefined) {
              let data22 = data21.selection;
              let valid56 = false;
              if (
                data22 &&
                typeof data22 == "object" &&
                !Array.isArray(data22)
              ) {
                valid56 = true;
                if (data22.installationId !== undefined) {
                  if (!(typeof data22.installationId == "string")) {
                    const err71 = {
                      instancePath:
                        instancePath + "/input/selection/installationId",
                      schemaPath:
                        "/mapping/readWork/properties/input/properties/selection/properties/installationId/type",
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
                    vErrors = [err72];
                  } else {
                    vErrors.push(err72);
                  }
                  errors++;
                }
                if (data22.revision !== undefined) {
                  if (!(typeof data22.revision == "string")) {
                    const err73 = {
                      instancePath: instancePath + "/input/selection/revision",
                      schemaPath:
                        "/mapping/readWork/properties/input/properties/selection/properties/revision/type",
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
                    instancePath: instancePath + "/input/selection",
                    schemaPath:
                      "/mapping/readWork/properties/input/properties/selection/properties/revision",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "revision" },
                    message: "must have property 'revision'",
                  };
                  if (vErrors === null) {
                    vErrors = [err74];
                  } else {
                    vErrors.push(err74);
                  }
                  errors++;
                }
                if (data22.owner !== undefined) {
                  let data25 = data22.owner;
                  let valid58 = false;
                  if (
                    data25 &&
                    typeof data25 == "object" &&
                    !Array.isArray(data25)
                  ) {
                    valid58 = true;
                    if (data25.profileId !== undefined) {
                      if (!(typeof data25.profileId == "string")) {
                        const err75 = {
                          instancePath:
                            instancePath + "/input/selection/owner/profileId",
                          schemaPath:
                            "/mapping/readWork/properties/input/properties/selection/properties/owner/properties/profileId/type",
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
                        vErrors = [err76];
                      } else {
                        vErrors.push(err76);
                      }
                      errors++;
                    }
                    if (data25.generation !== undefined) {
                      if (!(typeof data25.generation == "string")) {
                        const err77 = {
                          instancePath:
                            instancePath + "/input/selection/owner/generation",
                          schemaPath:
                            "/mapping/readWork/properties/input/properties/selection/properties/owner/properties/generation/type",
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
                        vErrors = [err78];
                      } else {
                        vErrors.push(err78);
                      }
                      errors++;
                    }
                    for (const key13 in data25) {
                      if (key13 !== "profileId" && key13 !== "generation") {
                        const err79 = {
                          instancePath:
                            instancePath +
                            "/input/selection/owner/" +
                            key13.replace(/~/g, "~0").replace(/\//g, "~1"),
                          schemaPath:
                            "/mapping/readWork/properties/input/properties/selection/properties/owner",
                          keyword: "properties",
                          params: {
                            error: "additional",
                            additionalProperty: key13,
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
                  if (!valid58) {
                    const err80 = {
                      instancePath: instancePath + "/input/selection/owner",
                      schemaPath:
                        "/mapping/readWork/properties/input/properties/selection/properties/owner/properties",
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
                    instancePath: instancePath + "/input/selection",
                    schemaPath:
                      "/mapping/readWork/properties/input/properties/selection/properties/owner",
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
                for (const key14 in data22) {
                  if (
                    key14 !== "installationId" &&
                    key14 !== "revision" &&
                    key14 !== "owner"
                  ) {
                    const err82 = {
                      instancePath:
                        instancePath +
                        "/input/selection/" +
                        key14.replace(/~/g, "~0").replace(/\//g, "~1"),
                      schemaPath:
                        "/mapping/readWork/properties/input/properties/selection",
                      keyword: "properties",
                      params: {
                        error: "additional",
                        additionalProperty: key14,
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
              if (!valid56) {
                const err83 = {
                  instancePath: instancePath + "/input/selection",
                  schemaPath:
                    "/mapping/readWork/properties/input/properties/selection/properties",
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
                instancePath: instancePath + "/input",
                schemaPath:
                  "/mapping/readWork/properties/input/properties/selection",
                keyword: "properties",
                params: { error: "missing", missingProperty: "selection" },
                message: "must have property 'selection'",
              };
              if (vErrors === null) {
                vErrors = [err84];
              } else {
                vErrors.push(err84);
              }
              errors++;
            }
            if (data21.runId !== undefined) {
              if (!(typeof data21.runId == "string")) {
                const err85 = {
                  instancePath: instancePath + "/input/runId",
                  schemaPath:
                    "/mapping/readWork/properties/input/properties/runId/type",
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
                instancePath: instancePath + "/input",
                schemaPath:
                  "/mapping/readWork/properties/input/properties/runId",
                keyword: "properties",
                params: { error: "missing", missingProperty: "runId" },
                message: "must have property 'runId'",
              };
              if (vErrors === null) {
                vErrors = [err86];
              } else {
                vErrors.push(err86);
              }
              errors++;
            }
            for (const key15 in data21) {
              if (key15 !== "selection" && key15 !== "runId") {
                const err87 = {
                  instancePath:
                    instancePath +
                    "/input/" +
                    key15.replace(/~/g, "~0").replace(/\//g, "~1"),
                  schemaPath: "/mapping/readWork/properties/input",
                  keyword: "properties",
                  params: { error: "additional", additionalProperty: key15 },
                  message: "must NOT have additional properties",
                };
                if (vErrors === null) {
                  vErrors = [err87];
                } else {
                  vErrors.push(err87);
                }
                errors++;
              }
            }
          }
          if (!valid54) {
            const err88 = {
              instancePath: instancePath + "/input",
              schemaPath: "/mapping/readWork/properties/input/properties",
              keyword: "properties",
              params: { type: "object", nullable: false },
              message: "must be object",
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
            instancePath,
            schemaPath: "/mapping/readWork/properties/input",
            keyword: "properties",
            params: { error: "missing", missingProperty: "input" },
            message: "must have property 'input'",
          };
          if (vErrors === null) {
            vErrors = [err89];
          } else {
            vErrors.push(err89);
          }
          errors++;
        }
        for (const key16 in data) {
          if (key16 !== "kind" && key16 !== "id" && key16 !== "input") {
            const err90 = {
              instancePath:
                instancePath +
                "/" +
                key16.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/readWork",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key16 },
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
        if (!valid52) {
          const err91 = {
            instancePath,
            schemaPath: "/mapping/readWork/properties",
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
        var valid51 = _errs29 === errors;
        valid0 = valid51;
      } else if (tag0 === "readInk") {
        const _errs39 = errors;
        let valid65 = false;
        valid65 = true;
        if (data.id !== undefined) {
          if (!(typeof data.id == "string")) {
            const err92 = {
              instancePath: instancePath + "/id",
              schemaPath: "/mapping/readInk/properties/id/type",
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
            instancePath,
            schemaPath: "/mapping/readInk/properties/id",
            keyword: "properties",
            params: { error: "missing", missingProperty: "id" },
            message: "must have property 'id'",
          };
          if (vErrors === null) {
            vErrors = [err93];
          } else {
            vErrors.push(err93);
          }
          errors++;
        }
        if (data.input !== undefined) {
          let data30 = data.input;
          let valid67 = false;
          if (data30 && typeof data30 == "object" && !Array.isArray(data30)) {
            valid67 = true;
            if (data30.selection !== undefined) {
              let data31 = data30.selection;
              let valid69 = false;
              if (
                data31 &&
                typeof data31 == "object" &&
                !Array.isArray(data31)
              ) {
                valid69 = true;
                if (data31.installationId !== undefined) {
                  if (!(typeof data31.installationId == "string")) {
                    const err94 = {
                      instancePath:
                        instancePath + "/input/selection/installationId",
                      schemaPath:
                        "/mapping/readInk/properties/input/properties/selection/properties/installationId/type",
                      keyword: "type",
                      params: { type: "string", nullable: false },
                      message: "must be string",
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
                      "/mapping/readInk/properties/input/properties/selection/properties/installationId",
                    keyword: "properties",
                    params: {
                      error: "missing",
                      missingProperty: "installationId",
                    },
                    message: "must have property 'installationId'",
                  };
                  if (vErrors === null) {
                    vErrors = [err95];
                  } else {
                    vErrors.push(err95);
                  }
                  errors++;
                }
                if (data31.revision !== undefined) {
                  if (!(typeof data31.revision == "string")) {
                    const err96 = {
                      instancePath: instancePath + "/input/selection/revision",
                      schemaPath:
                        "/mapping/readInk/properties/input/properties/selection/properties/revision/type",
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
                    instancePath: instancePath + "/input/selection",
                    schemaPath:
                      "/mapping/readInk/properties/input/properties/selection/properties/revision",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "revision" },
                    message: "must have property 'revision'",
                  };
                  if (vErrors === null) {
                    vErrors = [err97];
                  } else {
                    vErrors.push(err97);
                  }
                  errors++;
                }
                if (data31.owner !== undefined) {
                  let data34 = data31.owner;
                  let valid71 = false;
                  if (
                    data34 &&
                    typeof data34 == "object" &&
                    !Array.isArray(data34)
                  ) {
                    valid71 = true;
                    if (data34.profileId !== undefined) {
                      if (!(typeof data34.profileId == "string")) {
                        const err98 = {
                          instancePath:
                            instancePath + "/input/selection/owner/profileId",
                          schemaPath:
                            "/mapping/readInk/properties/input/properties/selection/properties/owner/properties/profileId/type",
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
                        vErrors = [err99];
                      } else {
                        vErrors.push(err99);
                      }
                      errors++;
                    }
                    if (data34.generation !== undefined) {
                      if (!(typeof data34.generation == "string")) {
                        const err100 = {
                          instancePath:
                            instancePath + "/input/selection/owner/generation",
                          schemaPath:
                            "/mapping/readInk/properties/input/properties/selection/properties/owner/properties/generation/type",
                          keyword: "type",
                          params: { type: "string", nullable: false },
                          message: "must be string",
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
                        vErrors = [err101];
                      } else {
                        vErrors.push(err101);
                      }
                      errors++;
                    }
                    for (const key17 in data34) {
                      if (key17 !== "profileId" && key17 !== "generation") {
                        const err102 = {
                          instancePath:
                            instancePath +
                            "/input/selection/owner/" +
                            key17.replace(/~/g, "~0").replace(/\//g, "~1"),
                          schemaPath:
                            "/mapping/readInk/properties/input/properties/selection/properties/owner",
                          keyword: "properties",
                          params: {
                            error: "additional",
                            additionalProperty: key17,
                          },
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
                  }
                  if (!valid71) {
                    const err103 = {
                      instancePath: instancePath + "/input/selection/owner",
                      schemaPath:
                        "/mapping/readInk/properties/input/properties/selection/properties/owner/properties",
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
                } else {
                  const err104 = {
                    instancePath: instancePath + "/input/selection",
                    schemaPath:
                      "/mapping/readInk/properties/input/properties/selection/properties/owner",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "owner" },
                    message: "must have property 'owner'",
                  };
                  if (vErrors === null) {
                    vErrors = [err104];
                  } else {
                    vErrors.push(err104);
                  }
                  errors++;
                }
                for (const key18 in data31) {
                  if (
                    key18 !== "installationId" &&
                    key18 !== "revision" &&
                    key18 !== "owner"
                  ) {
                    const err105 = {
                      instancePath:
                        instancePath +
                        "/input/selection/" +
                        key18.replace(/~/g, "~0").replace(/\//g, "~1"),
                      schemaPath:
                        "/mapping/readInk/properties/input/properties/selection",
                      keyword: "properties",
                      params: {
                        error: "additional",
                        additionalProperty: key18,
                      },
                      message: "must NOT have additional properties",
                    };
                    if (vErrors === null) {
                      vErrors = [err105];
                    } else {
                      vErrors.push(err105);
                    }
                    errors++;
                  }
                }
              }
              if (!valid69) {
                const err106 = {
                  instancePath: instancePath + "/input/selection",
                  schemaPath:
                    "/mapping/readInk/properties/input/properties/selection/properties",
                  keyword: "properties",
                  params: { type: "object", nullable: false },
                  message: "must be object",
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
                instancePath: instancePath + "/input",
                schemaPath:
                  "/mapping/readInk/properties/input/properties/selection",
                keyword: "properties",
                params: { error: "missing", missingProperty: "selection" },
                message: "must have property 'selection'",
              };
              if (vErrors === null) {
                vErrors = [err107];
              } else {
                vErrors.push(err107);
              }
              errors++;
            }
            for (const key19 in data30) {
              if (key19 !== "selection" && key19 !== "token") {
                const err108 = {
                  instancePath:
                    instancePath +
                    "/input/" +
                    key19.replace(/~/g, "~0").replace(/\//g, "~1"),
                  schemaPath: "/mapping/readInk/properties/input",
                  keyword: "properties",
                  params: { error: "additional", additionalProperty: key19 },
                  message: "must NOT have additional properties",
                };
                if (vErrors === null) {
                  vErrors = [err108];
                } else {
                  vErrors.push(err108);
                }
                errors++;
              }
            }
          }
          if (!valid67) {
            const err109 = {
              instancePath: instancePath + "/input",
              schemaPath: "/mapping/readInk/properties/input/properties",
              keyword: "properties",
              params: { type: "object", nullable: false },
              message: "must be object",
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
            instancePath,
            schemaPath: "/mapping/readInk/properties/input",
            keyword: "properties",
            params: { error: "missing", missingProperty: "input" },
            message: "must have property 'input'",
          };
          if (vErrors === null) {
            vErrors = [err110];
          } else {
            vErrors.push(err110);
          }
          errors++;
        }
        for (const key20 in data) {
          if (key20 !== "kind" && key20 !== "id" && key20 !== "input") {
            const err111 = {
              instancePath:
                instancePath +
                "/" +
                key20.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/readInk",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key20 },
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
        if (!valid65) {
          const err112 = {
            instancePath,
            schemaPath: "/mapping/readInk/properties",
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
        var valid64 = _errs39 === errors;
        valid0 = valid64;
      } else if (tag0 === "readPracticeControls") {
        const _errs48 = errors;
        let valid78 = false;
        valid78 = true;
        if (data.id !== undefined) {
          if (!(typeof data.id == "string")) {
            const err113 = {
              instancePath: instancePath + "/id",
              schemaPath: "/mapping/readPracticeControls/properties/id/type",
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
            instancePath,
            schemaPath: "/mapping/readPracticeControls/properties/id",
            keyword: "properties",
            params: { error: "missing", missingProperty: "id" },
            message: "must have property 'id'",
          };
          if (vErrors === null) {
            vErrors = [err114];
          } else {
            vErrors.push(err114);
          }
          errors++;
        }
        if (data.input !== undefined) {
          let data38 = data.input;
          let valid80 = false;
          if (data38 && typeof data38 == "object" && !Array.isArray(data38)) {
            valid80 = true;
            if (data38.selection !== undefined) {
              let data39 = data38.selection;
              let valid82 = false;
              if (
                data39 &&
                typeof data39 == "object" &&
                !Array.isArray(data39)
              ) {
                valid82 = true;
                if (data39.installationId !== undefined) {
                  if (!(typeof data39.installationId == "string")) {
                    const err115 = {
                      instancePath:
                        instancePath + "/input/selection/installationId",
                      schemaPath:
                        "/mapping/readPracticeControls/properties/input/properties/selection/properties/installationId/type",
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
                    vErrors = [err116];
                  } else {
                    vErrors.push(err116);
                  }
                  errors++;
                }
                if (data39.revision !== undefined) {
                  if (!(typeof data39.revision == "string")) {
                    const err117 = {
                      instancePath: instancePath + "/input/selection/revision",
                      schemaPath:
                        "/mapping/readPracticeControls/properties/input/properties/selection/properties/revision/type",
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
                    instancePath: instancePath + "/input/selection",
                    schemaPath:
                      "/mapping/readPracticeControls/properties/input/properties/selection/properties/revision",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "revision" },
                    message: "must have property 'revision'",
                  };
                  if (vErrors === null) {
                    vErrors = [err118];
                  } else {
                    vErrors.push(err118);
                  }
                  errors++;
                }
                if (data39.owner !== undefined) {
                  let data42 = data39.owner;
                  let valid84 = false;
                  if (
                    data42 &&
                    typeof data42 == "object" &&
                    !Array.isArray(data42)
                  ) {
                    valid84 = true;
                    if (data42.profileId !== undefined) {
                      if (!(typeof data42.profileId == "string")) {
                        const err119 = {
                          instancePath:
                            instancePath + "/input/selection/owner/profileId",
                          schemaPath:
                            "/mapping/readPracticeControls/properties/input/properties/selection/properties/owner/properties/profileId/type",
                          keyword: "type",
                          params: { type: "string", nullable: false },
                          message: "must be string",
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
                        vErrors = [err120];
                      } else {
                        vErrors.push(err120);
                      }
                      errors++;
                    }
                    if (data42.generation !== undefined) {
                      if (!(typeof data42.generation == "string")) {
                        const err121 = {
                          instancePath:
                            instancePath + "/input/selection/owner/generation",
                          schemaPath:
                            "/mapping/readPracticeControls/properties/input/properties/selection/properties/owner/properties/generation/type",
                          keyword: "type",
                          params: { type: "string", nullable: false },
                          message: "must be string",
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
                        vErrors = [err122];
                      } else {
                        vErrors.push(err122);
                      }
                      errors++;
                    }
                    for (const key21 in data42) {
                      if (key21 !== "profileId" && key21 !== "generation") {
                        const err123 = {
                          instancePath:
                            instancePath +
                            "/input/selection/owner/" +
                            key21.replace(/~/g, "~0").replace(/\//g, "~1"),
                          schemaPath:
                            "/mapping/readPracticeControls/properties/input/properties/selection/properties/owner",
                          keyword: "properties",
                          params: {
                            error: "additional",
                            additionalProperty: key21,
                          },
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
                  }
                  if (!valid84) {
                    const err124 = {
                      instancePath: instancePath + "/input/selection/owner",
                      schemaPath:
                        "/mapping/readPracticeControls/properties/input/properties/selection/properties/owner/properties",
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
                } else {
                  const err125 = {
                    instancePath: instancePath + "/input/selection",
                    schemaPath:
                      "/mapping/readPracticeControls/properties/input/properties/selection/properties/owner",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "owner" },
                    message: "must have property 'owner'",
                  };
                  if (vErrors === null) {
                    vErrors = [err125];
                  } else {
                    vErrors.push(err125);
                  }
                  errors++;
                }
                for (const key22 in data39) {
                  if (
                    key22 !== "installationId" &&
                    key22 !== "revision" &&
                    key22 !== "owner"
                  ) {
                    const err126 = {
                      instancePath:
                        instancePath +
                        "/input/selection/" +
                        key22.replace(/~/g, "~0").replace(/\//g, "~1"),
                      schemaPath:
                        "/mapping/readPracticeControls/properties/input/properties/selection",
                      keyword: "properties",
                      params: {
                        error: "additional",
                        additionalProperty: key22,
                      },
                      message: "must NOT have additional properties",
                    };
                    if (vErrors === null) {
                      vErrors = [err126];
                    } else {
                      vErrors.push(err126);
                    }
                    errors++;
                  }
                }
              }
              if (!valid82) {
                const err127 = {
                  instancePath: instancePath + "/input/selection",
                  schemaPath:
                    "/mapping/readPracticeControls/properties/input/properties/selection/properties",
                  keyword: "properties",
                  params: { type: "object", nullable: false },
                  message: "must be object",
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
                instancePath: instancePath + "/input",
                schemaPath:
                  "/mapping/readPracticeControls/properties/input/properties/selection",
                keyword: "properties",
                params: { error: "missing", missingProperty: "selection" },
                message: "must have property 'selection'",
              };
              if (vErrors === null) {
                vErrors = [err128];
              } else {
                vErrors.push(err128);
              }
              errors++;
            }
            for (const key23 in data38) {
              if (key23 !== "selection" && key23 !== "binding") {
                const err129 = {
                  instancePath:
                    instancePath +
                    "/input/" +
                    key23.replace(/~/g, "~0").replace(/\//g, "~1"),
                  schemaPath: "/mapping/readPracticeControls/properties/input",
                  keyword: "properties",
                  params: { error: "additional", additionalProperty: key23 },
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
          if (!valid80) {
            const err130 = {
              instancePath: instancePath + "/input",
              schemaPath:
                "/mapping/readPracticeControls/properties/input/properties",
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
            instancePath,
            schemaPath: "/mapping/readPracticeControls/properties/input",
            keyword: "properties",
            params: { error: "missing", missingProperty: "input" },
            message: "must have property 'input'",
          };
          if (vErrors === null) {
            vErrors = [err131];
          } else {
            vErrors.push(err131);
          }
          errors++;
        }
        for (const key24 in data) {
          if (key24 !== "kind" && key24 !== "id" && key24 !== "input") {
            const err132 = {
              instancePath:
                instancePath +
                "/" +
                key24.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/readPracticeControls",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key24 },
              message: "must NOT have additional properties",
            };
            if (vErrors === null) {
              vErrors = [err132];
            } else {
              vErrors.push(err132);
            }
            errors++;
          }
        }
        if (!valid78) {
          const err133 = {
            instancePath,
            schemaPath: "/mapping/readPracticeControls/properties",
            keyword: "properties",
            params: { type: "object", nullable: false },
            message: "must be object",
          };
          if (vErrors === null) {
            vErrors = [err133];
          } else {
            vErrors.push(err133);
          }
          errors++;
        }
        var valid77 = _errs48 === errors;
        valid0 = valid77;
      } else if (tag0 === "execute") {
        const _errs57 = errors;
        let valid91 = false;
        valid91 = true;
        if (data.id !== undefined) {
          if (!(typeof data.id == "string")) {
            const err134 = {
              instancePath: instancePath + "/id",
              schemaPath: "/mapping/execute/properties/id/type",
              keyword: "type",
              params: { type: "string", nullable: false },
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
            instancePath,
            schemaPath: "/mapping/execute/properties/id",
            keyword: "properties",
            params: { error: "missing", missingProperty: "id" },
            message: "must have property 'id'",
          };
          if (vErrors === null) {
            vErrors = [err135];
          } else {
            vErrors.push(err135);
          }
          errors++;
        }
        if (data.operation !== undefined) {
          let data46 = data.operation;
          let valid93 = false;
          if (data46 && typeof data46 == "object" && !Array.isArray(data46)) {
            const tag3 = data46.kind;
            if (tag3 === undefined) {
              const err136 = {
                instancePath: instancePath + "/operation",
                schemaPath:
                  "/mapping/execute/properties/operation/discriminator",
                keyword: "discriminator",
                params: { error: "tag", tag: "kind", tagValue: tag3 },
                message: 'tag "kind" must be string',
              };
              if (vErrors === null) {
                vErrors = [err136];
              } else {
                vErrors.push(err136);
              }
              errors++;
            } else if (typeof tag3 == "string") {
              if (tag3 === "teaching") {
                const _errs60 = errors;
                let valid95 = false;
                valid95 = true;
                if (data46.selection !== undefined) {
                  let data47 = data46.selection;
                  let valid97 = false;
                  if (
                    data47 &&
                    typeof data47 == "object" &&
                    !Array.isArray(data47)
                  ) {
                    valid97 = true;
                    if (data47.installationId !== undefined) {
                      if (!(typeof data47.installationId == "string")) {
                        const err137 = {
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
                          vErrors = [err137];
                        } else {
                          vErrors.push(err137);
                        }
                        errors++;
                      }
                    } else {
                      const err138 = {
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
                        vErrors = [err138];
                      } else {
                        vErrors.push(err138);
                      }
                      errors++;
                    }
                    if (data47.revision !== undefined) {
                      if (!(typeof data47.revision == "string")) {
                        const err139 = {
                          instancePath:
                            instancePath + "/operation/selection/revision",
                          schemaPath:
                            "/mapping/execute/properties/operation/mapping/teaching/properties/selection/properties/revision/type",
                          keyword: "type",
                          params: { type: "string", nullable: false },
                          message: "must be string",
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
                        vErrors = [err140];
                      } else {
                        vErrors.push(err140);
                      }
                      errors++;
                    }
                    if (data47.owner !== undefined) {
                      let data50 = data47.owner;
                      let valid99 = false;
                      if (
                        data50 &&
                        typeof data50 == "object" &&
                        !Array.isArray(data50)
                      ) {
                        valid99 = true;
                        if (data50.profileId !== undefined) {
                          if (!(typeof data50.profileId == "string")) {
                            const err141 = {
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
                              vErrors = [err141];
                            } else {
                              vErrors.push(err141);
                            }
                            errors++;
                          }
                        } else {
                          const err142 = {
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
                            vErrors = [err142];
                          } else {
                            vErrors.push(err142);
                          }
                          errors++;
                        }
                        if (data50.generation !== undefined) {
                          if (!(typeof data50.generation == "string")) {
                            const err143 = {
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
                              vErrors = [err143];
                            } else {
                              vErrors.push(err143);
                            }
                            errors++;
                          }
                        } else {
                          const err144 = {
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
                            vErrors = [err144];
                          } else {
                            vErrors.push(err144);
                          }
                          errors++;
                        }
                        for (const key25 in data50) {
                          if (key25 !== "profileId" && key25 !== "generation") {
                            const err145 = {
                              instancePath:
                                instancePath +
                                "/operation/selection/owner/" +
                                key25.replace(/~/g, "~0").replace(/\//g, "~1"),
                              schemaPath:
                                "/mapping/execute/properties/operation/mapping/teaching/properties/selection/properties/owner",
                              keyword: "properties",
                              params: {
                                error: "additional",
                                additionalProperty: key25,
                              },
                              message: "must NOT have additional properties",
                            };
                            if (vErrors === null) {
                              vErrors = [err145];
                            } else {
                              vErrors.push(err145);
                            }
                            errors++;
                          }
                        }
                      }
                      if (!valid99) {
                        const err146 = {
                          instancePath:
                            instancePath + "/operation/selection/owner",
                          schemaPath:
                            "/mapping/execute/properties/operation/mapping/teaching/properties/selection/properties/owner/properties",
                          keyword: "properties",
                          params: { type: "object", nullable: false },
                          message: "must be object",
                        };
                        if (vErrors === null) {
                          vErrors = [err146];
                        } else {
                          vErrors.push(err146);
                        }
                        errors++;
                      }
                    } else {
                      const err147 = {
                        instancePath: instancePath + "/operation/selection",
                        schemaPath:
                          "/mapping/execute/properties/operation/mapping/teaching/properties/selection/properties/owner",
                        keyword: "properties",
                        params: { error: "missing", missingProperty: "owner" },
                        message: "must have property 'owner'",
                      };
                      if (vErrors === null) {
                        vErrors = [err147];
                      } else {
                        vErrors.push(err147);
                      }
                      errors++;
                    }
                    for (const key26 in data47) {
                      if (
                        key26 !== "installationId" &&
                        key26 !== "revision" &&
                        key26 !== "owner"
                      ) {
                        const err148 = {
                          instancePath:
                            instancePath +
                            "/operation/selection/" +
                            key26.replace(/~/g, "~0").replace(/\//g, "~1"),
                          schemaPath:
                            "/mapping/execute/properties/operation/mapping/teaching/properties/selection",
                          keyword: "properties",
                          params: {
                            error: "additional",
                            additionalProperty: key26,
                          },
                          message: "must NOT have additional properties",
                        };
                        if (vErrors === null) {
                          vErrors = [err148];
                        } else {
                          vErrors.push(err148);
                        }
                        errors++;
                      }
                    }
                  }
                  if (!valid97) {
                    const err149 = {
                      instancePath: instancePath + "/operation/selection",
                      schemaPath:
                        "/mapping/execute/properties/operation/mapping/teaching/properties/selection/properties",
                      keyword: "properties",
                      params: { type: "object", nullable: false },
                      message: "must be object",
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
                    instancePath: instancePath + "/operation",
                    schemaPath:
                      "/mapping/execute/properties/operation/mapping/teaching/properties/selection",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "selection" },
                    message: "must have property 'selection'",
                  };
                  if (vErrors === null) {
                    vErrors = [err150];
                  } else {
                    vErrors.push(err150);
                  }
                  errors++;
                }
                for (const key27 in data46) {
                  if (
                    key27 !== "kind" &&
                    key27 !== "selection" &&
                    key27 !== "command"
                  ) {
                    const err151 = {
                      instancePath:
                        instancePath +
                        "/operation/" +
                        key27.replace(/~/g, "~0").replace(/\//g, "~1"),
                      schemaPath:
                        "/mapping/execute/properties/operation/mapping/teaching",
                      keyword: "properties",
                      params: {
                        error: "additional",
                        additionalProperty: key27,
                      },
                      message: "must NOT have additional properties",
                    };
                    if (vErrors === null) {
                      vErrors = [err151];
                    } else {
                      vErrors.push(err151);
                    }
                    errors++;
                  }
                }
                if (!valid95) {
                  const err152 = {
                    instancePath: instancePath + "/operation",
                    schemaPath:
                      "/mapping/execute/properties/operation/mapping/teaching/properties",
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
                var valid94 = _errs60 === errors;
                valid93 = valid94;
              } else if (tag3 === "ink") {
                const _errs67 = errors;
                let valid105 = false;
                valid105 = true;
                if (data46.selection !== undefined) {
                  let data53 = data46.selection;
                  let valid107 = false;
                  if (
                    data53 &&
                    typeof data53 == "object" &&
                    !Array.isArray(data53)
                  ) {
                    valid107 = true;
                    if (data53.installationId !== undefined) {
                      if (!(typeof data53.installationId == "string")) {
                        const err153 = {
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
                          vErrors = [err153];
                        } else {
                          vErrors.push(err153);
                        }
                        errors++;
                      }
                    } else {
                      const err154 = {
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
                        vErrors = [err154];
                      } else {
                        vErrors.push(err154);
                      }
                      errors++;
                    }
                    if (data53.revision !== undefined) {
                      if (!(typeof data53.revision == "string")) {
                        const err155 = {
                          instancePath:
                            instancePath + "/operation/selection/revision",
                          schemaPath:
                            "/mapping/execute/properties/operation/mapping/ink/properties/selection/properties/revision/type",
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
                        vErrors = [err156];
                      } else {
                        vErrors.push(err156);
                      }
                      errors++;
                    }
                    if (data53.owner !== undefined) {
                      let data56 = data53.owner;
                      let valid109 = false;
                      if (
                        data56 &&
                        typeof data56 == "object" &&
                        !Array.isArray(data56)
                      ) {
                        valid109 = true;
                        if (data56.profileId !== undefined) {
                          if (!(typeof data56.profileId == "string")) {
                            const err157 = {
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
                              vErrors = [err157];
                            } else {
                              vErrors.push(err157);
                            }
                            errors++;
                          }
                        } else {
                          const err158 = {
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
                            vErrors = [err158];
                          } else {
                            vErrors.push(err158);
                          }
                          errors++;
                        }
                        if (data56.generation !== undefined) {
                          if (!(typeof data56.generation == "string")) {
                            const err159 = {
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
                              vErrors = [err159];
                            } else {
                              vErrors.push(err159);
                            }
                            errors++;
                          }
                        } else {
                          const err160 = {
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
                            vErrors = [err160];
                          } else {
                            vErrors.push(err160);
                          }
                          errors++;
                        }
                        for (const key28 in data56) {
                          if (key28 !== "profileId" && key28 !== "generation") {
                            const err161 = {
                              instancePath:
                                instancePath +
                                "/operation/selection/owner/" +
                                key28.replace(/~/g, "~0").replace(/\//g, "~1"),
                              schemaPath:
                                "/mapping/execute/properties/operation/mapping/ink/properties/selection/properties/owner",
                              keyword: "properties",
                              params: {
                                error: "additional",
                                additionalProperty: key28,
                              },
                              message: "must NOT have additional properties",
                            };
                            if (vErrors === null) {
                              vErrors = [err161];
                            } else {
                              vErrors.push(err161);
                            }
                            errors++;
                          }
                        }
                      }
                      if (!valid109) {
                        const err162 = {
                          instancePath:
                            instancePath + "/operation/selection/owner",
                          schemaPath:
                            "/mapping/execute/properties/operation/mapping/ink/properties/selection/properties/owner/properties",
                          keyword: "properties",
                          params: { type: "object", nullable: false },
                          message: "must be object",
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
                        instancePath: instancePath + "/operation/selection",
                        schemaPath:
                          "/mapping/execute/properties/operation/mapping/ink/properties/selection/properties/owner",
                        keyword: "properties",
                        params: { error: "missing", missingProperty: "owner" },
                        message: "must have property 'owner'",
                      };
                      if (vErrors === null) {
                        vErrors = [err163];
                      } else {
                        vErrors.push(err163);
                      }
                      errors++;
                    }
                    for (const key29 in data53) {
                      if (
                        key29 !== "installationId" &&
                        key29 !== "revision" &&
                        key29 !== "owner"
                      ) {
                        const err164 = {
                          instancePath:
                            instancePath +
                            "/operation/selection/" +
                            key29.replace(/~/g, "~0").replace(/\//g, "~1"),
                          schemaPath:
                            "/mapping/execute/properties/operation/mapping/ink/properties/selection",
                          keyword: "properties",
                          params: {
                            error: "additional",
                            additionalProperty: key29,
                          },
                          message: "must NOT have additional properties",
                        };
                        if (vErrors === null) {
                          vErrors = [err164];
                        } else {
                          vErrors.push(err164);
                        }
                        errors++;
                      }
                    }
                  }
                  if (!valid107) {
                    const err165 = {
                      instancePath: instancePath + "/operation/selection",
                      schemaPath:
                        "/mapping/execute/properties/operation/mapping/ink/properties/selection/properties",
                      keyword: "properties",
                      params: { type: "object", nullable: false },
                      message: "must be object",
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
                    instancePath: instancePath + "/operation",
                    schemaPath:
                      "/mapping/execute/properties/operation/mapping/ink/properties/selection",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "selection" },
                    message: "must have property 'selection'",
                  };
                  if (vErrors === null) {
                    vErrors = [err166];
                  } else {
                    vErrors.push(err166);
                  }
                  errors++;
                }
                for (const key30 in data46) {
                  if (
                    key30 !== "kind" &&
                    key30 !== "selection" &&
                    key30 !== "command"
                  ) {
                    const err167 = {
                      instancePath:
                        instancePath +
                        "/operation/" +
                        key30.replace(/~/g, "~0").replace(/\//g, "~1"),
                      schemaPath:
                        "/mapping/execute/properties/operation/mapping/ink",
                      keyword: "properties",
                      params: {
                        error: "additional",
                        additionalProperty: key30,
                      },
                      message: "must NOT have additional properties",
                    };
                    if (vErrors === null) {
                      vErrors = [err167];
                    } else {
                      vErrors.push(err167);
                    }
                    errors++;
                  }
                }
                if (!valid105) {
                  const err168 = {
                    instancePath: instancePath + "/operation",
                    schemaPath:
                      "/mapping/execute/properties/operation/mapping/ink/properties",
                    keyword: "properties",
                    params: { type: "object", nullable: false },
                    message: "must be object",
                  };
                  if (vErrors === null) {
                    vErrors = [err168];
                  } else {
                    vErrors.push(err168);
                  }
                  errors++;
                }
                var valid104 = _errs67 === errors;
                valid93 = valid104;
              } else {
                const err169 = {
                  instancePath: instancePath + "/operation/kind",
                  schemaPath: "/mapping/execute/properties/operation/mapping",
                  keyword: "discriminator",
                  params: { error: "mapping", tag: "kind", tagValue: tag3 },
                  message: 'value of tag "kind" must be in mapping',
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
                instancePath: instancePath + "/operation/kind",
                schemaPath:
                  "/mapping/execute/properties/operation/discriminator",
                keyword: "discriminator",
                params: { error: "tag", tag: "kind", tagValue: tag3 },
                message: 'tag "kind" must be string',
              };
              if (vErrors === null) {
                vErrors = [err170];
              } else {
                vErrors.push(err170);
              }
              errors++;
            }
          } else if (!valid93) {
            const err171 = {
              instancePath: instancePath + "/operation",
              schemaPath: "/mapping/execute/properties/operation/discriminator",
              keyword: "discriminator",
              params: { type: "object", nullable: false },
              message: "must be object",
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
            instancePath,
            schemaPath: "/mapping/execute/properties/operation",
            keyword: "properties",
            params: { error: "missing", missingProperty: "operation" },
            message: "must have property 'operation'",
          };
          if (vErrors === null) {
            vErrors = [err172];
          } else {
            vErrors.push(err172);
          }
          errors++;
        }
        for (const key31 in data) {
          if (key31 !== "kind" && key31 !== "id" && key31 !== "operation") {
            const err173 = {
              instancePath:
                instancePath +
                "/" +
                key31.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/execute",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key31 },
              message: "must NOT have additional properties",
            };
            if (vErrors === null) {
              vErrors = [err173];
            } else {
              vErrors.push(err173);
            }
            errors++;
          }
        }
        if (!valid91) {
          const err174 = {
            instancePath,
            schemaPath: "/mapping/execute/properties",
            keyword: "properties",
            params: { type: "object", nullable: false },
            message: "must be object",
          };
          if (vErrors === null) {
            vErrors = [err174];
          } else {
            vErrors.push(err174);
          }
          errors++;
        }
        var valid90 = _errs57 === errors;
        valid0 = valid90;
      } else if (tag0 === "administer") {
        const _errs74 = errors;
        let valid116 = false;
        valid116 = true;
        if (data.id !== undefined) {
          if (!(typeof data.id == "string")) {
            const err175 = {
              instancePath: instancePath + "/id",
              schemaPath: "/mapping/administer/properties/id/type",
              keyword: "type",
              params: { type: "string", nullable: false },
              message: "must be string",
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
            instancePath,
            schemaPath: "/mapping/administer/properties/id",
            keyword: "properties",
            params: { error: "missing", missingProperty: "id" },
            message: "must have property 'id'",
          };
          if (vErrors === null) {
            vErrors = [err176];
          } else {
            vErrors.push(err176);
          }
          errors++;
        }
        for (const key32 in data) {
          if (key32 !== "kind" && key32 !== "id" && key32 !== "command") {
            const err177 = {
              instancePath:
                instancePath +
                "/" +
                key32.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/administer",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key32 },
              message: "must NOT have additional properties",
            };
            if (vErrors === null) {
              vErrors = [err177];
            } else {
              vErrors.push(err177);
            }
            errors++;
          }
        }
        if (!valid116) {
          const err178 = {
            instancePath,
            schemaPath: "/mapping/administer/properties",
            keyword: "properties",
            params: { type: "object", nullable: false },
            message: "must be object",
          };
          if (vErrors === null) {
            vErrors = [err178];
          } else {
            vErrors.push(err178);
          }
          errors++;
        }
        var valid115 = _errs74 === errors;
        valid0 = valid115;
      } else if (tag0 === "readDeparture") {
        const _errs76 = errors;
        let valid120 = false;
        valid120 = true;
        if (data.id !== undefined) {
          if (!(typeof data.id == "string")) {
            const err179 = {
              instancePath: instancePath + "/id",
              schemaPath: "/mapping/readDeparture/properties/id/type",
              keyword: "type",
              params: { type: "string", nullable: false },
              message: "must be string",
            };
            if (vErrors === null) {
              vErrors = [err179];
            } else {
              vErrors.push(err179);
            }
            errors++;
          }
        } else {
          const err180 = {
            instancePath,
            schemaPath: "/mapping/readDeparture/properties/id",
            keyword: "properties",
            params: { error: "missing", missingProperty: "id" },
            message: "must have property 'id'",
          };
          if (vErrors === null) {
            vErrors = [err180];
          } else {
            vErrors.push(err180);
          }
          errors++;
        }
        if (data.selection !== undefined) {
          let data61 = data.selection;
          let valid122 = false;
          if (data61 && typeof data61 == "object" && !Array.isArray(data61)) {
            valid122 = true;
            if (data61.installationId !== undefined) {
              if (!(typeof data61.installationId == "string")) {
                const err181 = {
                  instancePath: instancePath + "/selection/installationId",
                  schemaPath:
                    "/mapping/readDeparture/properties/selection/properties/installationId/type",
                  keyword: "type",
                  params: { type: "string", nullable: false },
                  message: "must be string",
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
                instancePath: instancePath + "/selection",
                schemaPath:
                  "/mapping/readDeparture/properties/selection/properties/installationId",
                keyword: "properties",
                params: { error: "missing", missingProperty: "installationId" },
                message: "must have property 'installationId'",
              };
              if (vErrors === null) {
                vErrors = [err182];
              } else {
                vErrors.push(err182);
              }
              errors++;
            }
            if (data61.revision !== undefined) {
              if (!(typeof data61.revision == "string")) {
                const err183 = {
                  instancePath: instancePath + "/selection/revision",
                  schemaPath:
                    "/mapping/readDeparture/properties/selection/properties/revision/type",
                  keyword: "type",
                  params: { type: "string", nullable: false },
                  message: "must be string",
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
                instancePath: instancePath + "/selection",
                schemaPath:
                  "/mapping/readDeparture/properties/selection/properties/revision",
                keyword: "properties",
                params: { error: "missing", missingProperty: "revision" },
                message: "must have property 'revision'",
              };
              if (vErrors === null) {
                vErrors = [err184];
              } else {
                vErrors.push(err184);
              }
              errors++;
            }
            if (data61.owner !== undefined) {
              let data64 = data61.owner;
              let valid124 = false;
              if (
                data64 &&
                typeof data64 == "object" &&
                !Array.isArray(data64)
              ) {
                valid124 = true;
                if (data64.profileId !== undefined) {
                  if (!(typeof data64.profileId == "string")) {
                    const err185 = {
                      instancePath: instancePath + "/selection/owner/profileId",
                      schemaPath:
                        "/mapping/readDeparture/properties/selection/properties/owner/properties/profileId/type",
                      keyword: "type",
                      params: { type: "string", nullable: false },
                      message: "must be string",
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
                    instancePath: instancePath + "/selection/owner",
                    schemaPath:
                      "/mapping/readDeparture/properties/selection/properties/owner/properties/profileId",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "profileId" },
                    message: "must have property 'profileId'",
                  };
                  if (vErrors === null) {
                    vErrors = [err186];
                  } else {
                    vErrors.push(err186);
                  }
                  errors++;
                }
                if (data64.generation !== undefined) {
                  if (!(typeof data64.generation == "string")) {
                    const err187 = {
                      instancePath:
                        instancePath + "/selection/owner/generation",
                      schemaPath:
                        "/mapping/readDeparture/properties/selection/properties/owner/properties/generation/type",
                      keyword: "type",
                      params: { type: "string", nullable: false },
                      message: "must be string",
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
                    instancePath: instancePath + "/selection/owner",
                    schemaPath:
                      "/mapping/readDeparture/properties/selection/properties/owner/properties/generation",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "generation" },
                    message: "must have property 'generation'",
                  };
                  if (vErrors === null) {
                    vErrors = [err188];
                  } else {
                    vErrors.push(err188);
                  }
                  errors++;
                }
                for (const key33 in data64) {
                  if (key33 !== "profileId" && key33 !== "generation") {
                    const err189 = {
                      instancePath:
                        instancePath +
                        "/selection/owner/" +
                        key33.replace(/~/g, "~0").replace(/\//g, "~1"),
                      schemaPath:
                        "/mapping/readDeparture/properties/selection/properties/owner",
                      keyword: "properties",
                      params: {
                        error: "additional",
                        additionalProperty: key33,
                      },
                      message: "must NOT have additional properties",
                    };
                    if (vErrors === null) {
                      vErrors = [err189];
                    } else {
                      vErrors.push(err189);
                    }
                    errors++;
                  }
                }
              }
              if (!valid124) {
                const err190 = {
                  instancePath: instancePath + "/selection/owner",
                  schemaPath:
                    "/mapping/readDeparture/properties/selection/properties/owner/properties",
                  keyword: "properties",
                  params: { type: "object", nullable: false },
                  message: "must be object",
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
                instancePath: instancePath + "/selection",
                schemaPath:
                  "/mapping/readDeparture/properties/selection/properties/owner",
                keyword: "properties",
                params: { error: "missing", missingProperty: "owner" },
                message: "must have property 'owner'",
              };
              if (vErrors === null) {
                vErrors = [err191];
              } else {
                vErrors.push(err191);
              }
              errors++;
            }
            for (const key34 in data61) {
              if (
                key34 !== "installationId" &&
                key34 !== "revision" &&
                key34 !== "owner"
              ) {
                const err192 = {
                  instancePath:
                    instancePath +
                    "/selection/" +
                    key34.replace(/~/g, "~0").replace(/\//g, "~1"),
                  schemaPath: "/mapping/readDeparture/properties/selection",
                  keyword: "properties",
                  params: { error: "additional", additionalProperty: key34 },
                  message: "must NOT have additional properties",
                };
                if (vErrors === null) {
                  vErrors = [err192];
                } else {
                  vErrors.push(err192);
                }
                errors++;
              }
            }
          }
          if (!valid122) {
            const err193 = {
              instancePath: instancePath + "/selection",
              schemaPath:
                "/mapping/readDeparture/properties/selection/properties",
              keyword: "properties",
              params: { type: "object", nullable: false },
              message: "must be object",
            };
            if (vErrors === null) {
              vErrors = [err193];
            } else {
              vErrors.push(err193);
            }
            errors++;
          }
        } else {
          const err194 = {
            instancePath,
            schemaPath: "/mapping/readDeparture/properties/selection",
            keyword: "properties",
            params: { error: "missing", missingProperty: "selection" },
            message: "must have property 'selection'",
          };
          if (vErrors === null) {
            vErrors = [err194];
          } else {
            vErrors.push(err194);
          }
          errors++;
        }
        for (const key35 in data) {
          if (key35 !== "kind" && key35 !== "id" && key35 !== "selection") {
            const err195 = {
              instancePath:
                instancePath +
                "/" +
                key35.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/readDeparture",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key35 },
              message: "must NOT have additional properties",
            };
            if (vErrors === null) {
              vErrors = [err195];
            } else {
              vErrors.push(err195);
            }
            errors++;
          }
        }
        if (!valid120) {
          const err196 = {
            instancePath,
            schemaPath: "/mapping/readDeparture/properties",
            keyword: "properties",
            params: { type: "object", nullable: false },
            message: "must be object",
          };
          if (vErrors === null) {
            vErrors = [err196];
          } else {
            vErrors.push(err196);
          }
          errors++;
        }
        var valid119 = _errs76 === errors;
        valid0 = valid119;
      } else if (tag0 === "recoverInk") {
        const _errs84 = errors;
        let valid130 = false;
        valid130 = true;
        if (data.id !== undefined) {
          if (!(typeof data.id == "string")) {
            const err197 = {
              instancePath: instancePath + "/id",
              schemaPath: "/mapping/recoverInk/properties/id/type",
              keyword: "type",
              params: { type: "string", nullable: false },
              message: "must be string",
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
            instancePath,
            schemaPath: "/mapping/recoverInk/properties/id",
            keyword: "properties",
            params: { error: "missing", missingProperty: "id" },
            message: "must have property 'id'",
          };
          if (vErrors === null) {
            vErrors = [err198];
          } else {
            vErrors.push(err198);
          }
          errors++;
        }
        if (data.recoveryId !== undefined) {
          if (!(typeof data.recoveryId == "string")) {
            const err199 = {
              instancePath: instancePath + "/recoveryId",
              schemaPath: "/mapping/recoverInk/properties/recoveryId/type",
              keyword: "type",
              params: { type: "string", nullable: false },
              message: "must be string",
            };
            if (vErrors === null) {
              vErrors = [err199];
            } else {
              vErrors.push(err199);
            }
            errors++;
          }
        } else {
          const err200 = {
            instancePath,
            schemaPath: "/mapping/recoverInk/properties/recoveryId",
            keyword: "properties",
            params: { error: "missing", missingProperty: "recoveryId" },
            message: "must have property 'recoveryId'",
          };
          if (vErrors === null) {
            vErrors = [err200];
          } else {
            vErrors.push(err200);
          }
          errors++;
        }
        if (data.operation !== undefined) {
          let data69 = data.operation;
          let valid132 = false;
          if (data69 && typeof data69 == "object" && !Array.isArray(data69)) {
            const tag4 = data69.kind;
            if (tag4 === undefined) {
              const err201 = {
                instancePath: instancePath + "/operation",
                schemaPath:
                  "/mapping/recoverInk/properties/operation/discriminator",
                keyword: "discriminator",
                params: { error: "tag", tag: "kind", tagValue: tag4 },
                message: 'tag "kind" must be string',
              };
              if (vErrors === null) {
                vErrors = [err201];
              } else {
                vErrors.push(err201);
              }
              errors++;
            } else if (typeof tag4 == "string") {
              if (tag4 === "teaching") {
                const _errs88 = errors;
                let valid134 = false;
                valid134 = true;
                if (data69.selection !== undefined) {
                  let data70 = data69.selection;
                  let valid136 = false;
                  if (
                    data70 &&
                    typeof data70 == "object" &&
                    !Array.isArray(data70)
                  ) {
                    valid136 = true;
                    if (data70.installationId !== undefined) {
                      if (!(typeof data70.installationId == "string")) {
                        const err202 = {
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
                          vErrors = [err202];
                        } else {
                          vErrors.push(err202);
                        }
                        errors++;
                      }
                    } else {
                      const err203 = {
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
                        vErrors = [err203];
                      } else {
                        vErrors.push(err203);
                      }
                      errors++;
                    }
                    if (data70.revision !== undefined) {
                      if (!(typeof data70.revision == "string")) {
                        const err204 = {
                          instancePath:
                            instancePath + "/operation/selection/revision",
                          schemaPath:
                            "/mapping/recoverInk/properties/operation/mapping/teaching/properties/selection/properties/revision/type",
                          keyword: "type",
                          params: { type: "string", nullable: false },
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
                        vErrors = [err205];
                      } else {
                        vErrors.push(err205);
                      }
                      errors++;
                    }
                    if (data70.owner !== undefined) {
                      let data73 = data70.owner;
                      let valid138 = false;
                      if (
                        data73 &&
                        typeof data73 == "object" &&
                        !Array.isArray(data73)
                      ) {
                        valid138 = true;
                        if (data73.profileId !== undefined) {
                          if (!(typeof data73.profileId == "string")) {
                            const err206 = {
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
                              vErrors = [err206];
                            } else {
                              vErrors.push(err206);
                            }
                            errors++;
                          }
                        } else {
                          const err207 = {
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
                            vErrors = [err207];
                          } else {
                            vErrors.push(err207);
                          }
                          errors++;
                        }
                        if (data73.generation !== undefined) {
                          if (!(typeof data73.generation == "string")) {
                            const err208 = {
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
                              vErrors = [err208];
                            } else {
                              vErrors.push(err208);
                            }
                            errors++;
                          }
                        } else {
                          const err209 = {
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
                            vErrors = [err209];
                          } else {
                            vErrors.push(err209);
                          }
                          errors++;
                        }
                        for (const key36 in data73) {
                          if (key36 !== "profileId" && key36 !== "generation") {
                            const err210 = {
                              instancePath:
                                instancePath +
                                "/operation/selection/owner/" +
                                key36.replace(/~/g, "~0").replace(/\//g, "~1"),
                              schemaPath:
                                "/mapping/recoverInk/properties/operation/mapping/teaching/properties/selection/properties/owner",
                              keyword: "properties",
                              params: {
                                error: "additional",
                                additionalProperty: key36,
                              },
                              message: "must NOT have additional properties",
                            };
                            if (vErrors === null) {
                              vErrors = [err210];
                            } else {
                              vErrors.push(err210);
                            }
                            errors++;
                          }
                        }
                      }
                      if (!valid138) {
                        const err211 = {
                          instancePath:
                            instancePath + "/operation/selection/owner",
                          schemaPath:
                            "/mapping/recoverInk/properties/operation/mapping/teaching/properties/selection/properties/owner/properties",
                          keyword: "properties",
                          params: { type: "object", nullable: false },
                          message: "must be object",
                        };
                        if (vErrors === null) {
                          vErrors = [err211];
                        } else {
                          vErrors.push(err211);
                        }
                        errors++;
                      }
                    } else {
                      const err212 = {
                        instancePath: instancePath + "/operation/selection",
                        schemaPath:
                          "/mapping/recoverInk/properties/operation/mapping/teaching/properties/selection/properties/owner",
                        keyword: "properties",
                        params: { error: "missing", missingProperty: "owner" },
                        message: "must have property 'owner'",
                      };
                      if (vErrors === null) {
                        vErrors = [err212];
                      } else {
                        vErrors.push(err212);
                      }
                      errors++;
                    }
                    for (const key37 in data70) {
                      if (
                        key37 !== "installationId" &&
                        key37 !== "revision" &&
                        key37 !== "owner"
                      ) {
                        const err213 = {
                          instancePath:
                            instancePath +
                            "/operation/selection/" +
                            key37.replace(/~/g, "~0").replace(/\//g, "~1"),
                          schemaPath:
                            "/mapping/recoverInk/properties/operation/mapping/teaching/properties/selection",
                          keyword: "properties",
                          params: {
                            error: "additional",
                            additionalProperty: key37,
                          },
                          message: "must NOT have additional properties",
                        };
                        if (vErrors === null) {
                          vErrors = [err213];
                        } else {
                          vErrors.push(err213);
                        }
                        errors++;
                      }
                    }
                  }
                  if (!valid136) {
                    const err214 = {
                      instancePath: instancePath + "/operation/selection",
                      schemaPath:
                        "/mapping/recoverInk/properties/operation/mapping/teaching/properties/selection/properties",
                      keyword: "properties",
                      params: { type: "object", nullable: false },
                      message: "must be object",
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
                    instancePath: instancePath + "/operation",
                    schemaPath:
                      "/mapping/recoverInk/properties/operation/mapping/teaching/properties/selection",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "selection" },
                    message: "must have property 'selection'",
                  };
                  if (vErrors === null) {
                    vErrors = [err215];
                  } else {
                    vErrors.push(err215);
                  }
                  errors++;
                }
                for (const key38 in data69) {
                  if (
                    key38 !== "kind" &&
                    key38 !== "selection" &&
                    key38 !== "command"
                  ) {
                    const err216 = {
                      instancePath:
                        instancePath +
                        "/operation/" +
                        key38.replace(/~/g, "~0").replace(/\//g, "~1"),
                      schemaPath:
                        "/mapping/recoverInk/properties/operation/mapping/teaching",
                      keyword: "properties",
                      params: {
                        error: "additional",
                        additionalProperty: key38,
                      },
                      message: "must NOT have additional properties",
                    };
                    if (vErrors === null) {
                      vErrors = [err216];
                    } else {
                      vErrors.push(err216);
                    }
                    errors++;
                  }
                }
                if (!valid134) {
                  const err217 = {
                    instancePath: instancePath + "/operation",
                    schemaPath:
                      "/mapping/recoverInk/properties/operation/mapping/teaching/properties",
                    keyword: "properties",
                    params: { type: "object", nullable: false },
                    message: "must be object",
                  };
                  if (vErrors === null) {
                    vErrors = [err217];
                  } else {
                    vErrors.push(err217);
                  }
                  errors++;
                }
                var valid133 = _errs88 === errors;
                valid132 = valid133;
              } else if (tag4 === "ink") {
                const _errs95 = errors;
                let valid144 = false;
                valid144 = true;
                if (data69.selection !== undefined) {
                  let data76 = data69.selection;
                  let valid146 = false;
                  if (
                    data76 &&
                    typeof data76 == "object" &&
                    !Array.isArray(data76)
                  ) {
                    valid146 = true;
                    if (data76.installationId !== undefined) {
                      if (!(typeof data76.installationId == "string")) {
                        const err218 = {
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
                          vErrors = [err218];
                        } else {
                          vErrors.push(err218);
                        }
                        errors++;
                      }
                    } else {
                      const err219 = {
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
                        vErrors = [err219];
                      } else {
                        vErrors.push(err219);
                      }
                      errors++;
                    }
                    if (data76.revision !== undefined) {
                      if (!(typeof data76.revision == "string")) {
                        const err220 = {
                          instancePath:
                            instancePath + "/operation/selection/revision",
                          schemaPath:
                            "/mapping/recoverInk/properties/operation/mapping/ink/properties/selection/properties/revision/type",
                          keyword: "type",
                          params: { type: "string", nullable: false },
                          message: "must be string",
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
                        vErrors = [err221];
                      } else {
                        vErrors.push(err221);
                      }
                      errors++;
                    }
                    if (data76.owner !== undefined) {
                      let data79 = data76.owner;
                      let valid148 = false;
                      if (
                        data79 &&
                        typeof data79 == "object" &&
                        !Array.isArray(data79)
                      ) {
                        valid148 = true;
                        if (data79.profileId !== undefined) {
                          if (!(typeof data79.profileId == "string")) {
                            const err222 = {
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
                              vErrors = [err222];
                            } else {
                              vErrors.push(err222);
                            }
                            errors++;
                          }
                        } else {
                          const err223 = {
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
                            vErrors = [err223];
                          } else {
                            vErrors.push(err223);
                          }
                          errors++;
                        }
                        if (data79.generation !== undefined) {
                          if (!(typeof data79.generation == "string")) {
                            const err224 = {
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
                              vErrors = [err224];
                            } else {
                              vErrors.push(err224);
                            }
                            errors++;
                          }
                        } else {
                          const err225 = {
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
                            vErrors = [err225];
                          } else {
                            vErrors.push(err225);
                          }
                          errors++;
                        }
                        for (const key39 in data79) {
                          if (key39 !== "profileId" && key39 !== "generation") {
                            const err226 = {
                              instancePath:
                                instancePath +
                                "/operation/selection/owner/" +
                                key39.replace(/~/g, "~0").replace(/\//g, "~1"),
                              schemaPath:
                                "/mapping/recoverInk/properties/operation/mapping/ink/properties/selection/properties/owner",
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
                      if (!valid148) {
                        const err227 = {
                          instancePath:
                            instancePath + "/operation/selection/owner",
                          schemaPath:
                            "/mapping/recoverInk/properties/operation/mapping/ink/properties/selection/properties/owner/properties",
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
                        instancePath: instancePath + "/operation/selection",
                        schemaPath:
                          "/mapping/recoverInk/properties/operation/mapping/ink/properties/selection/properties/owner",
                        keyword: "properties",
                        params: { error: "missing", missingProperty: "owner" },
                        message: "must have property 'owner'",
                      };
                      if (vErrors === null) {
                        vErrors = [err228];
                      } else {
                        vErrors.push(err228);
                      }
                      errors++;
                    }
                    for (const key40 in data76) {
                      if (
                        key40 !== "installationId" &&
                        key40 !== "revision" &&
                        key40 !== "owner"
                      ) {
                        const err229 = {
                          instancePath:
                            instancePath +
                            "/operation/selection/" +
                            key40.replace(/~/g, "~0").replace(/\//g, "~1"),
                          schemaPath:
                            "/mapping/recoverInk/properties/operation/mapping/ink/properties/selection",
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
                  }
                  if (!valid146) {
                    const err230 = {
                      instancePath: instancePath + "/operation/selection",
                      schemaPath:
                        "/mapping/recoverInk/properties/operation/mapping/ink/properties/selection/properties",
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
                } else {
                  const err231 = {
                    instancePath: instancePath + "/operation",
                    schemaPath:
                      "/mapping/recoverInk/properties/operation/mapping/ink/properties/selection",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "selection" },
                    message: "must have property 'selection'",
                  };
                  if (vErrors === null) {
                    vErrors = [err231];
                  } else {
                    vErrors.push(err231);
                  }
                  errors++;
                }
                for (const key41 in data69) {
                  if (
                    key41 !== "kind" &&
                    key41 !== "selection" &&
                    key41 !== "command"
                  ) {
                    const err232 = {
                      instancePath:
                        instancePath +
                        "/operation/" +
                        key41.replace(/~/g, "~0").replace(/\//g, "~1"),
                      schemaPath:
                        "/mapping/recoverInk/properties/operation/mapping/ink",
                      keyword: "properties",
                      params: {
                        error: "additional",
                        additionalProperty: key41,
                      },
                      message: "must NOT have additional properties",
                    };
                    if (vErrors === null) {
                      vErrors = [err232];
                    } else {
                      vErrors.push(err232);
                    }
                    errors++;
                  }
                }
                if (!valid144) {
                  const err233 = {
                    instancePath: instancePath + "/operation",
                    schemaPath:
                      "/mapping/recoverInk/properties/operation/mapping/ink/properties",
                    keyword: "properties",
                    params: { type: "object", nullable: false },
                    message: "must be object",
                  };
                  if (vErrors === null) {
                    vErrors = [err233];
                  } else {
                    vErrors.push(err233);
                  }
                  errors++;
                }
                var valid143 = _errs95 === errors;
                valid132 = valid143;
              } else {
                const err234 = {
                  instancePath: instancePath + "/operation/kind",
                  schemaPath:
                    "/mapping/recoverInk/properties/operation/mapping",
                  keyword: "discriminator",
                  params: { error: "mapping", tag: "kind", tagValue: tag4 },
                  message: 'value of tag "kind" must be in mapping',
                };
                if (vErrors === null) {
                  vErrors = [err234];
                } else {
                  vErrors.push(err234);
                }
                errors++;
              }
            } else {
              const err235 = {
                instancePath: instancePath + "/operation/kind",
                schemaPath:
                  "/mapping/recoverInk/properties/operation/discriminator",
                keyword: "discriminator",
                params: { error: "tag", tag: "kind", tagValue: tag4 },
                message: 'tag "kind" must be string',
              };
              if (vErrors === null) {
                vErrors = [err235];
              } else {
                vErrors.push(err235);
              }
              errors++;
            }
          } else if (!valid132) {
            const err236 = {
              instancePath: instancePath + "/operation",
              schemaPath:
                "/mapping/recoverInk/properties/operation/discriminator",
              keyword: "discriminator",
              params: { type: "object", nullable: false },
              message: "must be object",
            };
            if (vErrors === null) {
              vErrors = [err236];
            } else {
              vErrors.push(err236);
            }
            errors++;
          }
        } else {
          const err237 = {
            instancePath,
            schemaPath: "/mapping/recoverInk/properties/operation",
            keyword: "properties",
            params: { error: "missing", missingProperty: "operation" },
            message: "must have property 'operation'",
          };
          if (vErrors === null) {
            vErrors = [err237];
          } else {
            vErrors.push(err237);
          }
          errors++;
        }
        for (const key42 in data) {
          if (
            key42 !== "kind" &&
            key42 !== "id" &&
            key42 !== "recoveryId" &&
            key42 !== "operation"
          ) {
            const err238 = {
              instancePath:
                instancePath +
                "/" +
                key42.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/recoverInk",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key42 },
              message: "must NOT have additional properties",
            };
            if (vErrors === null) {
              vErrors = [err238];
            } else {
              vErrors.push(err238);
            }
            errors++;
          }
        }
        if (!valid130) {
          const err239 = {
            instancePath,
            schemaPath: "/mapping/recoverInk/properties",
            keyword: "properties",
            params: { type: "object", nullable: false },
            message: "must be object",
          };
          if (vErrors === null) {
            vErrors = [err239];
          } else {
            vErrors.push(err239);
          }
          errors++;
        }
        var valid129 = _errs84 === errors;
        valid0 = valid129;
      } else if (tag0 === "recoverTeaching") {
        const _errs102 = errors;
        let valid155 = false;
        valid155 = true;
        if (data.id !== undefined) {
          if (!(typeof data.id == "string")) {
            const err240 = {
              instancePath: instancePath + "/id",
              schemaPath: "/mapping/recoverTeaching/properties/id/type",
              keyword: "type",
              params: { type: "string", nullable: false },
              message: "must be string",
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
            instancePath,
            schemaPath: "/mapping/recoverTeaching/properties/id",
            keyword: "properties",
            params: { error: "missing", missingProperty: "id" },
            message: "must have property 'id'",
          };
          if (vErrors === null) {
            vErrors = [err241];
          } else {
            vErrors.push(err241);
          }
          errors++;
        }
        if (data.recoveryId !== undefined) {
          if (!(typeof data.recoveryId == "string")) {
            const err242 = {
              instancePath: instancePath + "/recoveryId",
              schemaPath: "/mapping/recoverTeaching/properties/recoveryId/type",
              keyword: "type",
              params: { type: "string", nullable: false },
              message: "must be string",
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
            instancePath,
            schemaPath: "/mapping/recoverTeaching/properties/recoveryId",
            keyword: "properties",
            params: { error: "missing", missingProperty: "recoveryId" },
            message: "must have property 'recoveryId'",
          };
          if (vErrors === null) {
            vErrors = [err243];
          } else {
            vErrors.push(err243);
          }
          errors++;
        }
        if (data.operation !== undefined) {
          let data84 = data.operation;
          let valid157 = false;
          if (data84 && typeof data84 == "object" && !Array.isArray(data84)) {
            const tag5 = data84.kind;
            if (tag5 === undefined) {
              const err244 = {
                instancePath: instancePath + "/operation",
                schemaPath:
                  "/mapping/recoverTeaching/properties/operation/discriminator",
                keyword: "discriminator",
                params: { error: "tag", tag: "kind", tagValue: tag5 },
                message: 'tag "kind" must be string',
              };
              if (vErrors === null) {
                vErrors = [err244];
              } else {
                vErrors.push(err244);
              }
              errors++;
            } else if (typeof tag5 == "string") {
              if (tag5 === "teaching") {
                const _errs106 = errors;
                let valid159 = false;
                valid159 = true;
                if (data84.selection !== undefined) {
                  let data85 = data84.selection;
                  let valid161 = false;
                  if (
                    data85 &&
                    typeof data85 == "object" &&
                    !Array.isArray(data85)
                  ) {
                    valid161 = true;
                    if (data85.installationId !== undefined) {
                      if (!(typeof data85.installationId == "string")) {
                        const err245 = {
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
                          vErrors = [err245];
                        } else {
                          vErrors.push(err245);
                        }
                        errors++;
                      }
                    } else {
                      const err246 = {
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
                        vErrors = [err246];
                      } else {
                        vErrors.push(err246);
                      }
                      errors++;
                    }
                    if (data85.revision !== undefined) {
                      if (!(typeof data85.revision == "string")) {
                        const err247 = {
                          instancePath:
                            instancePath + "/operation/selection/revision",
                          schemaPath:
                            "/mapping/recoverTeaching/properties/operation/mapping/teaching/properties/selection/properties/revision/type",
                          keyword: "type",
                          params: { type: "string", nullable: false },
                          message: "must be string",
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
                        vErrors = [err248];
                      } else {
                        vErrors.push(err248);
                      }
                      errors++;
                    }
                    if (data85.owner !== undefined) {
                      let data88 = data85.owner;
                      let valid163 = false;
                      if (
                        data88 &&
                        typeof data88 == "object" &&
                        !Array.isArray(data88)
                      ) {
                        valid163 = true;
                        if (data88.profileId !== undefined) {
                          if (!(typeof data88.profileId == "string")) {
                            const err249 = {
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
                              vErrors = [err249];
                            } else {
                              vErrors.push(err249);
                            }
                            errors++;
                          }
                        } else {
                          const err250 = {
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
                            vErrors = [err250];
                          } else {
                            vErrors.push(err250);
                          }
                          errors++;
                        }
                        if (data88.generation !== undefined) {
                          if (!(typeof data88.generation == "string")) {
                            const err251 = {
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
                              vErrors = [err251];
                            } else {
                              vErrors.push(err251);
                            }
                            errors++;
                          }
                        } else {
                          const err252 = {
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
                            vErrors = [err252];
                          } else {
                            vErrors.push(err252);
                          }
                          errors++;
                        }
                        for (const key43 in data88) {
                          if (key43 !== "profileId" && key43 !== "generation") {
                            const err253 = {
                              instancePath:
                                instancePath +
                                "/operation/selection/owner/" +
                                key43.replace(/~/g, "~0").replace(/\//g, "~1"),
                              schemaPath:
                                "/mapping/recoverTeaching/properties/operation/mapping/teaching/properties/selection/properties/owner",
                              keyword: "properties",
                              params: {
                                error: "additional",
                                additionalProperty: key43,
                              },
                              message: "must NOT have additional properties",
                            };
                            if (vErrors === null) {
                              vErrors = [err253];
                            } else {
                              vErrors.push(err253);
                            }
                            errors++;
                          }
                        }
                      }
                      if (!valid163) {
                        const err254 = {
                          instancePath:
                            instancePath + "/operation/selection/owner",
                          schemaPath:
                            "/mapping/recoverTeaching/properties/operation/mapping/teaching/properties/selection/properties/owner/properties",
                          keyword: "properties",
                          params: { type: "object", nullable: false },
                          message: "must be object",
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
                        instancePath: instancePath + "/operation/selection",
                        schemaPath:
                          "/mapping/recoverTeaching/properties/operation/mapping/teaching/properties/selection/properties/owner",
                        keyword: "properties",
                        params: { error: "missing", missingProperty: "owner" },
                        message: "must have property 'owner'",
                      };
                      if (vErrors === null) {
                        vErrors = [err255];
                      } else {
                        vErrors.push(err255);
                      }
                      errors++;
                    }
                    for (const key44 in data85) {
                      if (
                        key44 !== "installationId" &&
                        key44 !== "revision" &&
                        key44 !== "owner"
                      ) {
                        const err256 = {
                          instancePath:
                            instancePath +
                            "/operation/selection/" +
                            key44.replace(/~/g, "~0").replace(/\//g, "~1"),
                          schemaPath:
                            "/mapping/recoverTeaching/properties/operation/mapping/teaching/properties/selection",
                          keyword: "properties",
                          params: {
                            error: "additional",
                            additionalProperty: key44,
                          },
                          message: "must NOT have additional properties",
                        };
                        if (vErrors === null) {
                          vErrors = [err256];
                        } else {
                          vErrors.push(err256);
                        }
                        errors++;
                      }
                    }
                  }
                  if (!valid161) {
                    const err257 = {
                      instancePath: instancePath + "/operation/selection",
                      schemaPath:
                        "/mapping/recoverTeaching/properties/operation/mapping/teaching/properties/selection/properties",
                      keyword: "properties",
                      params: { type: "object", nullable: false },
                      message: "must be object",
                    };
                    if (vErrors === null) {
                      vErrors = [err257];
                    } else {
                      vErrors.push(err257);
                    }
                    errors++;
                  }
                } else {
                  const err258 = {
                    instancePath: instancePath + "/operation",
                    schemaPath:
                      "/mapping/recoverTeaching/properties/operation/mapping/teaching/properties/selection",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "selection" },
                    message: "must have property 'selection'",
                  };
                  if (vErrors === null) {
                    vErrors = [err258];
                  } else {
                    vErrors.push(err258);
                  }
                  errors++;
                }
                for (const key45 in data84) {
                  if (
                    key45 !== "kind" &&
                    key45 !== "selection" &&
                    key45 !== "command"
                  ) {
                    const err259 = {
                      instancePath:
                        instancePath +
                        "/operation/" +
                        key45.replace(/~/g, "~0").replace(/\//g, "~1"),
                      schemaPath:
                        "/mapping/recoverTeaching/properties/operation/mapping/teaching",
                      keyword: "properties",
                      params: {
                        error: "additional",
                        additionalProperty: key45,
                      },
                      message: "must NOT have additional properties",
                    };
                    if (vErrors === null) {
                      vErrors = [err259];
                    } else {
                      vErrors.push(err259);
                    }
                    errors++;
                  }
                }
                if (!valid159) {
                  const err260 = {
                    instancePath: instancePath + "/operation",
                    schemaPath:
                      "/mapping/recoverTeaching/properties/operation/mapping/teaching/properties",
                    keyword: "properties",
                    params: { type: "object", nullable: false },
                    message: "must be object",
                  };
                  if (vErrors === null) {
                    vErrors = [err260];
                  } else {
                    vErrors.push(err260);
                  }
                  errors++;
                }
                var valid158 = _errs106 === errors;
                valid157 = valid158;
              } else if (tag5 === "ink") {
                const _errs113 = errors;
                let valid169 = false;
                valid169 = true;
                if (data84.selection !== undefined) {
                  let data91 = data84.selection;
                  let valid171 = false;
                  if (
                    data91 &&
                    typeof data91 == "object" &&
                    !Array.isArray(data91)
                  ) {
                    valid171 = true;
                    if (data91.installationId !== undefined) {
                      if (!(typeof data91.installationId == "string")) {
                        const err261 = {
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
                          vErrors = [err261];
                        } else {
                          vErrors.push(err261);
                        }
                        errors++;
                      }
                    } else {
                      const err262 = {
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
                        vErrors = [err262];
                      } else {
                        vErrors.push(err262);
                      }
                      errors++;
                    }
                    if (data91.revision !== undefined) {
                      if (!(typeof data91.revision == "string")) {
                        const err263 = {
                          instancePath:
                            instancePath + "/operation/selection/revision",
                          schemaPath:
                            "/mapping/recoverTeaching/properties/operation/mapping/ink/properties/selection/properties/revision/type",
                          keyword: "type",
                          params: { type: "string", nullable: false },
                          message: "must be string",
                        };
                        if (vErrors === null) {
                          vErrors = [err263];
                        } else {
                          vErrors.push(err263);
                        }
                        errors++;
                      }
                    } else {
                      const err264 = {
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
                        vErrors = [err264];
                      } else {
                        vErrors.push(err264);
                      }
                      errors++;
                    }
                    if (data91.owner !== undefined) {
                      let data94 = data91.owner;
                      let valid173 = false;
                      if (
                        data94 &&
                        typeof data94 == "object" &&
                        !Array.isArray(data94)
                      ) {
                        valid173 = true;
                        if (data94.profileId !== undefined) {
                          if (!(typeof data94.profileId == "string")) {
                            const err265 = {
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
                              vErrors = [err265];
                            } else {
                              vErrors.push(err265);
                            }
                            errors++;
                          }
                        } else {
                          const err266 = {
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
                            vErrors = [err266];
                          } else {
                            vErrors.push(err266);
                          }
                          errors++;
                        }
                        if (data94.generation !== undefined) {
                          if (!(typeof data94.generation == "string")) {
                            const err267 = {
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
                              vErrors = [err267];
                            } else {
                              vErrors.push(err267);
                            }
                            errors++;
                          }
                        } else {
                          const err268 = {
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
                            vErrors = [err268];
                          } else {
                            vErrors.push(err268);
                          }
                          errors++;
                        }
                        for (const key46 in data94) {
                          if (key46 !== "profileId" && key46 !== "generation") {
                            const err269 = {
                              instancePath:
                                instancePath +
                                "/operation/selection/owner/" +
                                key46.replace(/~/g, "~0").replace(/\//g, "~1"),
                              schemaPath:
                                "/mapping/recoverTeaching/properties/operation/mapping/ink/properties/selection/properties/owner",
                              keyword: "properties",
                              params: {
                                error: "additional",
                                additionalProperty: key46,
                              },
                              message: "must NOT have additional properties",
                            };
                            if (vErrors === null) {
                              vErrors = [err269];
                            } else {
                              vErrors.push(err269);
                            }
                            errors++;
                          }
                        }
                      }
                      if (!valid173) {
                        const err270 = {
                          instancePath:
                            instancePath + "/operation/selection/owner",
                          schemaPath:
                            "/mapping/recoverTeaching/properties/operation/mapping/ink/properties/selection/properties/owner/properties",
                          keyword: "properties",
                          params: { type: "object", nullable: false },
                          message: "must be object",
                        };
                        if (vErrors === null) {
                          vErrors = [err270];
                        } else {
                          vErrors.push(err270);
                        }
                        errors++;
                      }
                    } else {
                      const err271 = {
                        instancePath: instancePath + "/operation/selection",
                        schemaPath:
                          "/mapping/recoverTeaching/properties/operation/mapping/ink/properties/selection/properties/owner",
                        keyword: "properties",
                        params: { error: "missing", missingProperty: "owner" },
                        message: "must have property 'owner'",
                      };
                      if (vErrors === null) {
                        vErrors = [err271];
                      } else {
                        vErrors.push(err271);
                      }
                      errors++;
                    }
                    for (const key47 in data91) {
                      if (
                        key47 !== "installationId" &&
                        key47 !== "revision" &&
                        key47 !== "owner"
                      ) {
                        const err272 = {
                          instancePath:
                            instancePath +
                            "/operation/selection/" +
                            key47.replace(/~/g, "~0").replace(/\//g, "~1"),
                          schemaPath:
                            "/mapping/recoverTeaching/properties/operation/mapping/ink/properties/selection",
                          keyword: "properties",
                          params: {
                            error: "additional",
                            additionalProperty: key47,
                          },
                          message: "must NOT have additional properties",
                        };
                        if (vErrors === null) {
                          vErrors = [err272];
                        } else {
                          vErrors.push(err272);
                        }
                        errors++;
                      }
                    }
                  }
                  if (!valid171) {
                    const err273 = {
                      instancePath: instancePath + "/operation/selection",
                      schemaPath:
                        "/mapping/recoverTeaching/properties/operation/mapping/ink/properties/selection/properties",
                      keyword: "properties",
                      params: { type: "object", nullable: false },
                      message: "must be object",
                    };
                    if (vErrors === null) {
                      vErrors = [err273];
                    } else {
                      vErrors.push(err273);
                    }
                    errors++;
                  }
                } else {
                  const err274 = {
                    instancePath: instancePath + "/operation",
                    schemaPath:
                      "/mapping/recoverTeaching/properties/operation/mapping/ink/properties/selection",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "selection" },
                    message: "must have property 'selection'",
                  };
                  if (vErrors === null) {
                    vErrors = [err274];
                  } else {
                    vErrors.push(err274);
                  }
                  errors++;
                }
                for (const key48 in data84) {
                  if (
                    key48 !== "kind" &&
                    key48 !== "selection" &&
                    key48 !== "command"
                  ) {
                    const err275 = {
                      instancePath:
                        instancePath +
                        "/operation/" +
                        key48.replace(/~/g, "~0").replace(/\//g, "~1"),
                      schemaPath:
                        "/mapping/recoverTeaching/properties/operation/mapping/ink",
                      keyword: "properties",
                      params: {
                        error: "additional",
                        additionalProperty: key48,
                      },
                      message: "must NOT have additional properties",
                    };
                    if (vErrors === null) {
                      vErrors = [err275];
                    } else {
                      vErrors.push(err275);
                    }
                    errors++;
                  }
                }
                if (!valid169) {
                  const err276 = {
                    instancePath: instancePath + "/operation",
                    schemaPath:
                      "/mapping/recoverTeaching/properties/operation/mapping/ink/properties",
                    keyword: "properties",
                    params: { type: "object", nullable: false },
                    message: "must be object",
                  };
                  if (vErrors === null) {
                    vErrors = [err276];
                  } else {
                    vErrors.push(err276);
                  }
                  errors++;
                }
                var valid168 = _errs113 === errors;
                valid157 = valid168;
              } else {
                const err277 = {
                  instancePath: instancePath + "/operation/kind",
                  schemaPath:
                    "/mapping/recoverTeaching/properties/operation/mapping",
                  keyword: "discriminator",
                  params: { error: "mapping", tag: "kind", tagValue: tag5 },
                  message: 'value of tag "kind" must be in mapping',
                };
                if (vErrors === null) {
                  vErrors = [err277];
                } else {
                  vErrors.push(err277);
                }
                errors++;
              }
            } else {
              const err278 = {
                instancePath: instancePath + "/operation/kind",
                schemaPath:
                  "/mapping/recoverTeaching/properties/operation/discriminator",
                keyword: "discriminator",
                params: { error: "tag", tag: "kind", tagValue: tag5 },
                message: 'tag "kind" must be string',
              };
              if (vErrors === null) {
                vErrors = [err278];
              } else {
                vErrors.push(err278);
              }
              errors++;
            }
          } else if (!valid157) {
            const err279 = {
              instancePath: instancePath + "/operation",
              schemaPath:
                "/mapping/recoverTeaching/properties/operation/discriminator",
              keyword: "discriminator",
              params: { type: "object", nullable: false },
              message: "must be object",
            };
            if (vErrors === null) {
              vErrors = [err279];
            } else {
              vErrors.push(err279);
            }
            errors++;
          }
        } else {
          const err280 = {
            instancePath,
            schemaPath: "/mapping/recoverTeaching/properties/operation",
            keyword: "properties",
            params: { error: "missing", missingProperty: "operation" },
            message: "must have property 'operation'",
          };
          if (vErrors === null) {
            vErrors = [err280];
          } else {
            vErrors.push(err280);
          }
          errors++;
        }
        for (const key49 in data) {
          if (
            key49 !== "kind" &&
            key49 !== "id" &&
            key49 !== "recoveryId" &&
            key49 !== "operation"
          ) {
            const err281 = {
              instancePath:
                instancePath +
                "/" +
                key49.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/recoverTeaching",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key49 },
              message: "must NOT have additional properties",
            };
            if (vErrors === null) {
              vErrors = [err281];
            } else {
              vErrors.push(err281);
            }
            errors++;
          }
        }
        if (!valid155) {
          const err282 = {
            instancePath,
            schemaPath: "/mapping/recoverTeaching/properties",
            keyword: "properties",
            params: { type: "object", nullable: false },
            message: "must be object",
          };
          if (vErrors === null) {
            vErrors = [err282];
          } else {
            vErrors.push(err282);
          }
          errors++;
        }
        var valid154 = _errs102 === errors;
        valid0 = valid154;
      } else if (tag0 === "recoverAdministration") {
        const _errs120 = errors;
        let valid180 = false;
        valid180 = true;
        if (data.id !== undefined) {
          if (!(typeof data.id == "string")) {
            const err283 = {
              instancePath: instancePath + "/id",
              schemaPath: "/mapping/recoverAdministration/properties/id/type",
              keyword: "type",
              params: { type: "string", nullable: false },
              message: "must be string",
            };
            if (vErrors === null) {
              vErrors = [err283];
            } else {
              vErrors.push(err283);
            }
            errors++;
          }
        } else {
          const err284 = {
            instancePath,
            schemaPath: "/mapping/recoverAdministration/properties/id",
            keyword: "properties",
            params: { error: "missing", missingProperty: "id" },
            message: "must have property 'id'",
          };
          if (vErrors === null) {
            vErrors = [err284];
          } else {
            vErrors.push(err284);
          }
          errors++;
        }
        if (data.recoveryId !== undefined) {
          if (!(typeof data.recoveryId == "string")) {
            const err285 = {
              instancePath: instancePath + "/recoveryId",
              schemaPath:
                "/mapping/recoverAdministration/properties/recoveryId/type",
              keyword: "type",
              params: { type: "string", nullable: false },
              message: "must be string",
            };
            if (vErrors === null) {
              vErrors = [err285];
            } else {
              vErrors.push(err285);
            }
            errors++;
          }
        } else {
          const err286 = {
            instancePath,
            schemaPath: "/mapping/recoverAdministration/properties/recoveryId",
            keyword: "properties",
            params: { error: "missing", missingProperty: "recoveryId" },
            message: "must have property 'recoveryId'",
          };
          if (vErrors === null) {
            vErrors = [err286];
          } else {
            vErrors.push(err286);
          }
          errors++;
        }
        for (const key50 in data) {
          if (
            key50 !== "kind" &&
            key50 !== "id" &&
            key50 !== "recoveryId" &&
            key50 !== "command"
          ) {
            const err287 = {
              instancePath:
                instancePath +
                "/" +
                key50.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/recoverAdministration",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key50 },
              message: "must NOT have additional properties",
            };
            if (vErrors === null) {
              vErrors = [err287];
            } else {
              vErrors.push(err287);
            }
            errors++;
          }
        }
        if (!valid180) {
          const err288 = {
            instancePath,
            schemaPath: "/mapping/recoverAdministration/properties",
            keyword: "properties",
            params: { type: "object", nullable: false },
            message: "must be object",
          };
          if (vErrors === null) {
            vErrors = [err288];
          } else {
            vErrors.push(err288);
          }
          errors++;
        }
        var valid179 = _errs120 === errors;
        valid0 = valid179;
      } else if (tag0 === "reconcileRecovery") {
        const _errs123 = errors;
        let valid184 = false;
        valid184 = true;
        if (data.id !== undefined) {
          if (!(typeof data.id == "string")) {
            const err289 = {
              instancePath: instancePath + "/id",
              schemaPath: "/mapping/reconcileRecovery/properties/id/type",
              keyword: "type",
              params: { type: "string", nullable: false },
              message: "must be string",
            };
            if (vErrors === null) {
              vErrors = [err289];
            } else {
              vErrors.push(err289);
            }
            errors++;
          }
        } else {
          const err290 = {
            instancePath,
            schemaPath: "/mapping/reconcileRecovery/properties/id",
            keyword: "properties",
            params: { error: "missing", missingProperty: "id" },
            message: "must have property 'id'",
          };
          if (vErrors === null) {
            vErrors = [err290];
          } else {
            vErrors.push(err290);
          }
          errors++;
        }
        if (data.recoveryId !== undefined) {
          if (!(typeof data.recoveryId == "string")) {
            const err291 = {
              instancePath: instancePath + "/recoveryId",
              schemaPath:
                "/mapping/reconcileRecovery/properties/recoveryId/type",
              keyword: "type",
              params: { type: "string", nullable: false },
              message: "must be string",
            };
            if (vErrors === null) {
              vErrors = [err291];
            } else {
              vErrors.push(err291);
            }
            errors++;
          }
        } else {
          const err292 = {
            instancePath,
            schemaPath: "/mapping/reconcileRecovery/properties/recoveryId",
            keyword: "properties",
            params: { error: "missing", missingProperty: "recoveryId" },
            message: "must have property 'recoveryId'",
          };
          if (vErrors === null) {
            vErrors = [err292];
          } else {
            vErrors.push(err292);
          }
          errors++;
        }
        for (const key51 in data) {
          if (
            key51 !== "kind" &&
            key51 !== "id" &&
            key51 !== "recoveryId" &&
            key51 !== "choice"
          ) {
            const err293 = {
              instancePath:
                instancePath +
                "/" +
                key51.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/reconcileRecovery",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key51 },
              message: "must NOT have additional properties",
            };
            if (vErrors === null) {
              vErrors = [err293];
            } else {
              vErrors.push(err293);
            }
            errors++;
          }
        }
        if (!valid184) {
          const err294 = {
            instancePath,
            schemaPath: "/mapping/reconcileRecovery/properties",
            keyword: "properties",
            params: { type: "object", nullable: false },
            message: "must be object",
          };
          if (vErrors === null) {
            vErrors = [err294];
          } else {
            vErrors.push(err294);
          }
          errors++;
        }
        var valid183 = _errs123 === errors;
        valid0 = valid183;
      } else {
        const err295 = {
          instancePath: instancePath + "/kind",
          schemaPath: "/mapping",
          keyword: "discriminator",
          params: { error: "mapping", tag: "kind", tagValue: tag0 },
          message: 'value of tag "kind" must be in mapping',
        };
        if (vErrors === null) {
          vErrors = [err295];
        } else {
          vErrors.push(err295);
        }
        errors++;
      }
    } else {
      const err296 = {
        instancePath: instancePath + "/kind",
        schemaPath: "/discriminator",
        keyword: "discriminator",
        params: { error: "tag", tag: "kind", tagValue: tag0 },
        message: 'tag "kind" must be string',
      };
      if (vErrors === null) {
        vErrors = [err296];
      } else {
        vErrors.push(err296);
      }
      errors++;
    }
  } else if (!valid0) {
    const err297 = {
      instancePath,
      schemaPath: "/discriminator",
      keyword: "discriminator",
      params: { type: "object", nullable: false },
      message: "must be object",
    };
    if (vErrors === null) {
      vErrors = [err297];
    } else {
      vErrors.push(err297);
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
    diagnostics: {
      properties: {
        id: { type: "string" },
        value: {
          properties: {
            persistence: { enum: ["durable", "memoryOnly"] },
            ring: {},
          },
        },
        metadata: {
          properties: {
            versions: {
              properties: {
                application: { type: "string" },
                database: { type: "uint32" },
                inkCodec: { type: "uint8" },
              },
            },
            capabilities: {
              properties: {
                opfs: { type: "boolean" },
                storeLock: { type: "boolean" },
                sqliteBigInt: { type: "boolean" },
              },
            },
          },
        },
      },
    },
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
      } else if (tag0 === "diagnostics") {
        const _errs2 = errors;
        let valid6 = false;
        valid6 = true;
        if (data.id !== undefined) {
          if (!(typeof data.id == "string")) {
            const err5 = {
              instancePath: instancePath + "/id",
              schemaPath: "/mapping/diagnostics/properties/id/type",
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
            schemaPath: "/mapping/diagnostics/properties/id",
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
        if (data.value !== undefined) {
          let data2 = data.value;
          let valid8 = false;
          if (data2 && typeof data2 == "object" && !Array.isArray(data2)) {
            valid8 = true;
            if (data2.persistence !== undefined) {
              let data3 = data2.persistence;
              if (!(
                typeof data3 == "string" &&
                (data3 === "durable" || data3 === "memoryOnly")
              )) {
                const err7 = {
                  instancePath: instancePath + "/value/persistence",
                  schemaPath:
                    "/mapping/diagnostics/properties/value/properties/persistence/enum",
                  keyword: "enum",
                  params: {
                    allowedValues:
                      schema38.mapping.diagnostics.properties.value.properties
                        .persistence.enum,
                  },
                  message: "must be equal to one of the allowed values",
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
                instancePath: instancePath + "/value",
                schemaPath:
                  "/mapping/diagnostics/properties/value/properties/persistence",
                keyword: "properties",
                params: { error: "missing", missingProperty: "persistence" },
                message: "must have property 'persistence'",
              };
              if (vErrors === null) {
                vErrors = [err8];
              } else {
                vErrors.push(err8);
              }
              errors++;
            }
            for (const key1 in data2) {
              if (key1 !== "persistence" && key1 !== "ring") {
                const err9 = {
                  instancePath:
                    instancePath +
                    "/value/" +
                    key1.replace(/~/g, "~0").replace(/\//g, "~1"),
                  schemaPath: "/mapping/diagnostics/properties/value",
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
          }
          if (!valid8) {
            const err10 = {
              instancePath: instancePath + "/value",
              schemaPath: "/mapping/diagnostics/properties/value/properties",
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
            instancePath,
            schemaPath: "/mapping/diagnostics/properties/value",
            keyword: "properties",
            params: { error: "missing", missingProperty: "value" },
            message: "must have property 'value'",
          };
          if (vErrors === null) {
            vErrors = [err11];
          } else {
            vErrors.push(err11);
          }
          errors++;
        }
        if (data.metadata !== undefined) {
          let data4 = data.metadata;
          let valid11 = false;
          if (data4 && typeof data4 == "object" && !Array.isArray(data4)) {
            valid11 = true;
            if (data4.versions !== undefined) {
              let data5 = data4.versions;
              let valid13 = false;
              if (data5 && typeof data5 == "object" && !Array.isArray(data5)) {
                valid13 = true;
                if (data5.application !== undefined) {
                  if (!(typeof data5.application == "string")) {
                    const err12 = {
                      instancePath:
                        instancePath + "/metadata/versions/application",
                      schemaPath:
                        "/mapping/diagnostics/properties/metadata/properties/versions/properties/application/type",
                      keyword: "type",
                      params: { type: "string", nullable: false },
                      message: "must be string",
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
                    instancePath: instancePath + "/metadata/versions",
                    schemaPath:
                      "/mapping/diagnostics/properties/metadata/properties/versions/properties/application",
                    keyword: "properties",
                    params: {
                      error: "missing",
                      missingProperty: "application",
                    },
                    message: "must have property 'application'",
                  };
                  if (vErrors === null) {
                    vErrors = [err13];
                  } else {
                    vErrors.push(err13);
                  }
                  errors++;
                }
                if (data5.database !== undefined) {
                  let data7 = data5.database;
                  if (!(
                    typeof data7 == "number" &&
                    isFinite(data7) &&
                    !(data7 % 1) &&
                    data7 >= 0 &&
                    data7 <= 4294967295
                  )) {
                    const err14 = {
                      instancePath:
                        instancePath + "/metadata/versions/database",
                      schemaPath:
                        "/mapping/diagnostics/properties/metadata/properties/versions/properties/database/type",
                      keyword: "type",
                      params: { type: "uint32", nullable: false },
                      message: "must be uint32",
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
                    instancePath: instancePath + "/metadata/versions",
                    schemaPath:
                      "/mapping/diagnostics/properties/metadata/properties/versions/properties/database",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "database" },
                    message: "must have property 'database'",
                  };
                  if (vErrors === null) {
                    vErrors = [err15];
                  } else {
                    vErrors.push(err15);
                  }
                  errors++;
                }
                if (data5.inkCodec !== undefined) {
                  let data8 = data5.inkCodec;
                  if (!(
                    typeof data8 == "number" &&
                    isFinite(data8) &&
                    !(data8 % 1) &&
                    data8 >= 0 &&
                    data8 <= 255
                  )) {
                    const err16 = {
                      instancePath:
                        instancePath + "/metadata/versions/inkCodec",
                      schemaPath:
                        "/mapping/diagnostics/properties/metadata/properties/versions/properties/inkCodec/type",
                      keyword: "type",
                      params: { type: "uint8", nullable: false },
                      message: "must be uint8",
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
                    instancePath: instancePath + "/metadata/versions",
                    schemaPath:
                      "/mapping/diagnostics/properties/metadata/properties/versions/properties/inkCodec",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "inkCodec" },
                    message: "must have property 'inkCodec'",
                  };
                  if (vErrors === null) {
                    vErrors = [err17];
                  } else {
                    vErrors.push(err17);
                  }
                  errors++;
                }
                for (const key2 in data5) {
                  if (
                    key2 !== "application" &&
                    key2 !== "database" &&
                    key2 !== "inkCodec"
                  ) {
                    const err18 = {
                      instancePath:
                        instancePath +
                        "/metadata/versions/" +
                        key2.replace(/~/g, "~0").replace(/\//g, "~1"),
                      schemaPath:
                        "/mapping/diagnostics/properties/metadata/properties/versions",
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
              if (!valid13) {
                const err19 = {
                  instancePath: instancePath + "/metadata/versions",
                  schemaPath:
                    "/mapping/diagnostics/properties/metadata/properties/versions/properties",
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
                instancePath: instancePath + "/metadata",
                schemaPath:
                  "/mapping/diagnostics/properties/metadata/properties/versions",
                keyword: "properties",
                params: { error: "missing", missingProperty: "versions" },
                message: "must have property 'versions'",
              };
              if (vErrors === null) {
                vErrors = [err20];
              } else {
                vErrors.push(err20);
              }
              errors++;
            }
            if (data4.capabilities !== undefined) {
              let data9 = data4.capabilities;
              let valid16 = false;
              if (data9 && typeof data9 == "object" && !Array.isArray(data9)) {
                valid16 = true;
                if (data9.opfs !== undefined) {
                  if (!(typeof data9.opfs == "boolean")) {
                    const err21 = {
                      instancePath:
                        instancePath + "/metadata/capabilities/opfs",
                      schemaPath:
                        "/mapping/diagnostics/properties/metadata/properties/capabilities/properties/opfs/type",
                      keyword: "type",
                      params: { type: "boolean", nullable: false },
                      message: "must be boolean",
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
                    instancePath: instancePath + "/metadata/capabilities",
                    schemaPath:
                      "/mapping/diagnostics/properties/metadata/properties/capabilities/properties/opfs",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "opfs" },
                    message: "must have property 'opfs'",
                  };
                  if (vErrors === null) {
                    vErrors = [err22];
                  } else {
                    vErrors.push(err22);
                  }
                  errors++;
                }
                if (data9.storeLock !== undefined) {
                  if (!(typeof data9.storeLock == "boolean")) {
                    const err23 = {
                      instancePath:
                        instancePath + "/metadata/capabilities/storeLock",
                      schemaPath:
                        "/mapping/diagnostics/properties/metadata/properties/capabilities/properties/storeLock/type",
                      keyword: "type",
                      params: { type: "boolean", nullable: false },
                      message: "must be boolean",
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
                    instancePath: instancePath + "/metadata/capabilities",
                    schemaPath:
                      "/mapping/diagnostics/properties/metadata/properties/capabilities/properties/storeLock",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "storeLock" },
                    message: "must have property 'storeLock'",
                  };
                  if (vErrors === null) {
                    vErrors = [err24];
                  } else {
                    vErrors.push(err24);
                  }
                  errors++;
                }
                if (data9.sqliteBigInt !== undefined) {
                  if (!(typeof data9.sqliteBigInt == "boolean")) {
                    const err25 = {
                      instancePath:
                        instancePath + "/metadata/capabilities/sqliteBigInt",
                      schemaPath:
                        "/mapping/diagnostics/properties/metadata/properties/capabilities/properties/sqliteBigInt/type",
                      keyword: "type",
                      params: { type: "boolean", nullable: false },
                      message: "must be boolean",
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
                    instancePath: instancePath + "/metadata/capabilities",
                    schemaPath:
                      "/mapping/diagnostics/properties/metadata/properties/capabilities/properties/sqliteBigInt",
                    keyword: "properties",
                    params: {
                      error: "missing",
                      missingProperty: "sqliteBigInt",
                    },
                    message: "must have property 'sqliteBigInt'",
                  };
                  if (vErrors === null) {
                    vErrors = [err26];
                  } else {
                    vErrors.push(err26);
                  }
                  errors++;
                }
                for (const key3 in data9) {
                  if (
                    key3 !== "opfs" &&
                    key3 !== "storeLock" &&
                    key3 !== "sqliteBigInt"
                  ) {
                    const err27 = {
                      instancePath:
                        instancePath +
                        "/metadata/capabilities/" +
                        key3.replace(/~/g, "~0").replace(/\//g, "~1"),
                      schemaPath:
                        "/mapping/diagnostics/properties/metadata/properties/capabilities",
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
              if (!valid16) {
                const err28 = {
                  instancePath: instancePath + "/metadata/capabilities",
                  schemaPath:
                    "/mapping/diagnostics/properties/metadata/properties/capabilities/properties",
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
            } else {
              const err29 = {
                instancePath: instancePath + "/metadata",
                schemaPath:
                  "/mapping/diagnostics/properties/metadata/properties/capabilities",
                keyword: "properties",
                params: { error: "missing", missingProperty: "capabilities" },
                message: "must have property 'capabilities'",
              };
              if (vErrors === null) {
                vErrors = [err29];
              } else {
                vErrors.push(err29);
              }
              errors++;
            }
            for (const key4 in data4) {
              if (key4 !== "versions" && key4 !== "capabilities") {
                const err30 = {
                  instancePath:
                    instancePath +
                    "/metadata/" +
                    key4.replace(/~/g, "~0").replace(/\//g, "~1"),
                  schemaPath: "/mapping/diagnostics/properties/metadata",
                  keyword: "properties",
                  params: { error: "additional", additionalProperty: key4 },
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
          if (!valid11) {
            const err31 = {
              instancePath: instancePath + "/metadata",
              schemaPath: "/mapping/diagnostics/properties/metadata/properties",
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
            instancePath,
            schemaPath: "/mapping/diagnostics/properties/metadata",
            keyword: "properties",
            params: { error: "missing", missingProperty: "metadata" },
            message: "must have property 'metadata'",
          };
          if (vErrors === null) {
            vErrors = [err32];
          } else {
            vErrors.push(err32);
          }
          errors++;
        }
        for (const key5 in data) {
          if (
            key5 !== "kind" &&
            key5 !== "id" &&
            key5 !== "value" &&
            key5 !== "metadata"
          ) {
            const err33 = {
              instancePath:
                instancePath +
                "/" +
                key5.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/diagnostics",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key5 },
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
        if (!valid6) {
          const err34 = {
            instancePath,
            schemaPath: "/mapping/diagnostics/properties",
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
        var valid5 = _errs2 === errors;
        valid0 = valid5;
      } else if (tag0 === "application") {
        const _errs15 = errors;
        let valid22 = false;
        valid22 = true;
        if (data.id !== undefined) {
          if (!(typeof data.id == "string")) {
            const err35 = {
              instancePath: instancePath + "/id",
              schemaPath: "/mapping/application/properties/id/type",
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
            schemaPath: "/mapping/application/properties/id",
            keyword: "properties",
            params: { error: "missing", missingProperty: "id" },
            message: "must have property 'id'",
          };
          if (vErrors === null) {
            vErrors = [err36];
          } else {
            vErrors.push(err36);
          }
          errors++;
        }
        for (const key6 in data) {
          if (key6 !== "kind" && key6 !== "id" && key6 !== "value") {
            const err37 = {
              instancePath:
                instancePath +
                "/" +
                key6.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/application",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key6 },
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
        if (!valid22) {
          const err38 = {
            instancePath,
            schemaPath: "/mapping/application/properties",
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
        var valid21 = _errs15 === errors;
        valid0 = valid21;
      } else if (tag0 === "work") {
        const _errs17 = errors;
        let valid26 = false;
        valid26 = true;
        if (data.id !== undefined) {
          if (!(typeof data.id == "string")) {
            const err39 = {
              instancePath: instancePath + "/id",
              schemaPath: "/mapping/work/properties/id/type",
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
            schemaPath: "/mapping/work/properties/id",
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
        for (const key7 in data) {
          if (key7 !== "kind" && key7 !== "id" && key7 !== "value") {
            const err41 = {
              instancePath:
                instancePath +
                "/" +
                key7.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/work",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key7 },
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
        if (!valid26) {
          const err42 = {
            instancePath,
            schemaPath: "/mapping/work/properties",
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
        var valid25 = _errs17 === errors;
        valid0 = valid25;
      } else if (tag0 === "practiceControls") {
        const _errs19 = errors;
        let valid30 = false;
        valid30 = true;
        if (data.id !== undefined) {
          if (!(typeof data.id == "string")) {
            const err43 = {
              instancePath: instancePath + "/id",
              schemaPath: "/mapping/practiceControls/properties/id/type",
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
            schemaPath: "/mapping/practiceControls/properties/id",
            keyword: "properties",
            params: { error: "missing", missingProperty: "id" },
            message: "must have property 'id'",
          };
          if (vErrors === null) {
            vErrors = [err44];
          } else {
            vErrors.push(err44);
          }
          errors++;
        }
        for (const key8 in data) {
          if (key8 !== "kind" && key8 !== "id" && key8 !== "value") {
            const err45 = {
              instancePath:
                instancePath +
                "/" +
                key8.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/practiceControls",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key8 },
              message: "must NOT have additional properties",
            };
            if (vErrors === null) {
              vErrors = [err45];
            } else {
              vErrors.push(err45);
            }
            errors++;
          }
        }
        if (!valid30) {
          const err46 = {
            instancePath,
            schemaPath: "/mapping/practiceControls/properties",
            keyword: "properties",
            params: { type: "object", nullable: false },
            message: "must be object",
          };
          if (vErrors === null) {
            vErrors = [err46];
          } else {
            vErrors.push(err46);
          }
          errors++;
        }
        var valid29 = _errs19 === errors;
        valid0 = valid29;
      } else if (tag0 === "execution") {
        const _errs21 = errors;
        let valid34 = false;
        valid34 = true;
        if (data.id !== undefined) {
          if (!(typeof data.id == "string")) {
            const err47 = {
              instancePath: instancePath + "/id",
              schemaPath: "/mapping/execution/properties/id/type",
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
            instancePath,
            schemaPath: "/mapping/execution/properties/id",
            keyword: "properties",
            params: { error: "missing", missingProperty: "id" },
            message: "must have property 'id'",
          };
          if (vErrors === null) {
            vErrors = [err48];
          } else {
            vErrors.push(err48);
          }
          errors++;
        }
        for (const key9 in data) {
          if (key9 !== "kind" && key9 !== "id" && key9 !== "value") {
            const err49 = {
              instancePath:
                instancePath +
                "/" +
                key9.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/execution",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key9 },
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
        if (!valid34) {
          const err50 = {
            instancePath,
            schemaPath: "/mapping/execution/properties",
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
        var valid33 = _errs21 === errors;
        valid0 = valid33;
      } else if (tag0 === "profileReceipt") {
        const _errs23 = errors;
        let valid38 = false;
        valid38 = true;
        if (data.id !== undefined) {
          if (!(typeof data.id == "string")) {
            const err51 = {
              instancePath: instancePath + "/id",
              schemaPath: "/mapping/profileReceipt/properties/id/type",
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
            instancePath,
            schemaPath: "/mapping/profileReceipt/properties/id",
            keyword: "properties",
            params: { error: "missing", missingProperty: "id" },
            message: "must have property 'id'",
          };
          if (vErrors === null) {
            vErrors = [err52];
          } else {
            vErrors.push(err52);
          }
          errors++;
        }
        for (const key10 in data) {
          if (key10 !== "kind" && key10 !== "id" && key10 !== "value") {
            const err53 = {
              instancePath:
                instancePath +
                "/" +
                key10.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/profileReceipt",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key10 },
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
        if (!valid38) {
          const err54 = {
            instancePath,
            schemaPath: "/mapping/profileReceipt/properties",
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
        var valid37 = _errs23 === errors;
        valid0 = valid37;
      } else if (tag0 === "departure") {
        const _errs25 = errors;
        let valid42 = false;
        valid42 = true;
        if (data.id !== undefined) {
          if (!(typeof data.id == "string")) {
            const err55 = {
              instancePath: instancePath + "/id",
              schemaPath: "/mapping/departure/properties/id/type",
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
            schemaPath: "/mapping/departure/properties/id",
            keyword: "properties",
            params: { error: "missing", missingProperty: "id" },
            message: "must have property 'id'",
          };
          if (vErrors === null) {
            vErrors = [err56];
          } else {
            vErrors.push(err56);
          }
          errors++;
        }
        for (const key11 in data) {
          if (key11 !== "kind" && key11 !== "id" && key11 !== "value") {
            const err57 = {
              instancePath:
                instancePath +
                "/" +
                key11.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/departure",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key11 },
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
        if (!valid42) {
          const err58 = {
            instancePath,
            schemaPath: "/mapping/departure/properties",
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
        var valid41 = _errs25 === errors;
        valid0 = valid41;
      } else if (tag0 === "inkSnapshot") {
        const _errs27 = errors;
        let valid46 = false;
        valid46 = true;
        if (data.id !== undefined) {
          if (!(typeof data.id == "string")) {
            const err59 = {
              instancePath: instancePath + "/id",
              schemaPath: "/mapping/inkSnapshot/properties/id/type",
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
            instancePath,
            schemaPath: "/mapping/inkSnapshot/properties/id",
            keyword: "properties",
            params: { error: "missing", missingProperty: "id" },
            message: "must have property 'id'",
          };
          if (vErrors === null) {
            vErrors = [err60];
          } else {
            vErrors.push(err60);
          }
          errors++;
        }
        for (const key12 in data) {
          if (key12 !== "kind" && key12 !== "id" && key12 !== "value") {
            const err61 = {
              instancePath:
                instancePath +
                "/" +
                key12.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/inkSnapshot",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key12 },
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
        if (!valid46) {
          const err62 = {
            instancePath,
            schemaPath: "/mapping/inkSnapshot/properties",
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
        var valid45 = _errs27 === errors;
        valid0 = valid45;
      } else if (tag0 === "inventory") {
        const _errs29 = errors;
        let valid50 = false;
        valid50 = true;
        if (data.id !== undefined) {
          if (!(typeof data.id == "string")) {
            const err63 = {
              instancePath: instancePath + "/id",
              schemaPath: "/mapping/inventory/properties/id/type",
              keyword: "type",
              params: { type: "string", nullable: false },
              message: "must be string",
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
            instancePath,
            schemaPath: "/mapping/inventory/properties/id",
            keyword: "properties",
            params: { error: "missing", missingProperty: "id" },
            message: "must have property 'id'",
          };
          if (vErrors === null) {
            vErrors = [err64];
          } else {
            vErrors.push(err64);
          }
          errors++;
        }
        for (const key13 in data) {
          if (key13 !== "kind" && key13 !== "id" && key13 !== "value") {
            const err65 = {
              instancePath:
                instancePath +
                "/" +
                key13.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/inventory",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key13 },
              message: "must NOT have additional properties",
            };
            if (vErrors === null) {
              vErrors = [err65];
            } else {
              vErrors.push(err65);
            }
            errors++;
          }
        }
        if (!valid50) {
          const err66 = {
            instancePath,
            schemaPath: "/mapping/inventory/properties",
            keyword: "properties",
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
        var valid49 = _errs29 === errors;
        valid0 = valid49;
      } else if (tag0 === "inkRecovery") {
        const _errs31 = errors;
        let valid54 = false;
        valid54 = true;
        if (data.id !== undefined) {
          if (!(typeof data.id == "string")) {
            const err67 = {
              instancePath: instancePath + "/id",
              schemaPath: "/mapping/inkRecovery/properties/id/type",
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
            instancePath,
            schemaPath: "/mapping/inkRecovery/properties/id",
            keyword: "properties",
            params: { error: "missing", missingProperty: "id" },
            message: "must have property 'id'",
          };
          if (vErrors === null) {
            vErrors = [err68];
          } else {
            vErrors.push(err68);
          }
          errors++;
        }
        for (const key14 in data) {
          if (key14 !== "kind" && key14 !== "id" && key14 !== "value") {
            const err69 = {
              instancePath:
                instancePath +
                "/" +
                key14.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/inkRecovery",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key14 },
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
        if (!valid54) {
          const err70 = {
            instancePath,
            schemaPath: "/mapping/inkRecovery/properties",
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
        var valid53 = _errs31 === errors;
        valid0 = valid53;
      } else if (tag0 === "teachingRecovery") {
        const _errs33 = errors;
        let valid58 = false;
        valid58 = true;
        if (data.id !== undefined) {
          if (!(typeof data.id == "string")) {
            const err71 = {
              instancePath: instancePath + "/id",
              schemaPath: "/mapping/teachingRecovery/properties/id/type",
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
            instancePath,
            schemaPath: "/mapping/teachingRecovery/properties/id",
            keyword: "properties",
            params: { error: "missing", missingProperty: "id" },
            message: "must have property 'id'",
          };
          if (vErrors === null) {
            vErrors = [err72];
          } else {
            vErrors.push(err72);
          }
          errors++;
        }
        for (const key15 in data) {
          if (key15 !== "kind" && key15 !== "id" && key15 !== "value") {
            const err73 = {
              instancePath:
                instancePath +
                "/" +
                key15.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/teachingRecovery",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key15 },
              message: "must NOT have additional properties",
            };
            if (vErrors === null) {
              vErrors = [err73];
            } else {
              vErrors.push(err73);
            }
            errors++;
          }
        }
        if (!valid58) {
          const err74 = {
            instancePath,
            schemaPath: "/mapping/teachingRecovery/properties",
            keyword: "properties",
            params: { type: "object", nullable: false },
            message: "must be object",
          };
          if (vErrors === null) {
            vErrors = [err74];
          } else {
            vErrors.push(err74);
          }
          errors++;
        }
        var valid57 = _errs33 === errors;
        valid0 = valid57;
      } else if (tag0 === "administrationRecovery") {
        const _errs35 = errors;
        let valid62 = false;
        valid62 = true;
        if (data.id !== undefined) {
          if (!(typeof data.id == "string")) {
            const err75 = {
              instancePath: instancePath + "/id",
              schemaPath: "/mapping/administrationRecovery/properties/id/type",
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
            instancePath,
            schemaPath: "/mapping/administrationRecovery/properties/id",
            keyword: "properties",
            params: { error: "missing", missingProperty: "id" },
            message: "must have property 'id'",
          };
          if (vErrors === null) {
            vErrors = [err76];
          } else {
            vErrors.push(err76);
          }
          errors++;
        }
        for (const key16 in data) {
          if (key16 !== "kind" && key16 !== "id" && key16 !== "value") {
            const err77 = {
              instancePath:
                instancePath +
                "/" +
                key16.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/administrationRecovery",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key16 },
              message: "must NOT have additional properties",
            };
            if (vErrors === null) {
              vErrors = [err77];
            } else {
              vErrors.push(err77);
            }
            errors++;
          }
        }
        if (!valid62) {
          const err78 = {
            instancePath,
            schemaPath: "/mapping/administrationRecovery/properties",
            keyword: "properties",
            params: { type: "object", nullable: false },
            message: "must be object",
          };
          if (vErrors === null) {
            vErrors = [err78];
          } else {
            vErrors.push(err78);
          }
          errors++;
        }
        var valid61 = _errs35 === errors;
        valid0 = valid61;
      } else if (tag0 === "reconciled") {
        const _errs37 = errors;
        let valid66 = false;
        valid66 = true;
        if (data.id !== undefined) {
          if (!(typeof data.id == "string")) {
            const err79 = {
              instancePath: instancePath + "/id",
              schemaPath: "/mapping/reconciled/properties/id/type",
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
            instancePath,
            schemaPath: "/mapping/reconciled/properties/id",
            keyword: "properties",
            params: { error: "missing", missingProperty: "id" },
            message: "must have property 'id'",
          };
          if (vErrors === null) {
            vErrors = [err80];
          } else {
            vErrors.push(err80);
          }
          errors++;
        }
        for (const key17 in data) {
          if (key17 !== "kind" && key17 !== "id" && key17 !== "value") {
            const err81 = {
              instancePath:
                instancePath +
                "/" +
                key17.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/reconciled",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key17 },
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
        if (!valid66) {
          const err82 = {
            instancePath,
            schemaPath: "/mapping/reconciled/properties",
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
        var valid65 = _errs37 === errors;
        valid0 = valid65;
      } else if (tag0 === "failed") {
        const _errs39 = errors;
        let valid70 = false;
        valid70 = true;
        if (data.id !== undefined) {
          if (!(typeof data.id == "string")) {
            const err83 = {
              instancePath: instancePath + "/id",
              schemaPath: "/mapping/failed/properties/id/type",
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
            schemaPath: "/mapping/failed/properties/id",
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
        if (data.message !== undefined) {
          if (!(typeof data.message == "string")) {
            const err85 = {
              instancePath: instancePath + "/message",
              schemaPath: "/mapping/failed/properties/message/type",
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
            instancePath,
            schemaPath: "/mapping/failed/properties/message",
            keyword: "properties",
            params: { error: "missing", missingProperty: "message" },
            message: "must have property 'message'",
          };
          if (vErrors === null) {
            vErrors = [err86];
          } else {
            vErrors.push(err86);
          }
          errors++;
        }
        for (const key18 in data) {
          if (key18 !== "kind" && key18 !== "id" && key18 !== "message") {
            const err87 = {
              instancePath:
                instancePath +
                "/" +
                key18.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/failed",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key18 },
              message: "must NOT have additional properties",
            };
            if (vErrors === null) {
              vErrors = [err87];
            } else {
              vErrors.push(err87);
            }
            errors++;
          }
        }
        if (!valid70) {
          const err88 = {
            instancePath,
            schemaPath: "/mapping/failed/properties",
            keyword: "properties",
            params: { type: "object", nullable: false },
            message: "must be object",
          };
          if (vErrors === null) {
            vErrors = [err88];
          } else {
            vErrors.push(err88);
          }
          errors++;
        }
        var valid69 = _errs39 === errors;
        valid0 = valid69;
      } else {
        const err89 = {
          instancePath: instancePath + "/kind",
          schemaPath: "/mapping",
          keyword: "discriminator",
          params: { error: "mapping", tag: "kind", tagValue: tag0 },
          message: 'value of tag "kind" must be in mapping',
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
        instancePath: instancePath + "/kind",
        schemaPath: "/discriminator",
        keyword: "discriminator",
        params: { error: "tag", tag: "kind", tagValue: tag0 },
        message: 'tag "kind" must be string',
      };
      if (vErrors === null) {
        vErrors = [err90];
      } else {
        vErrors.push(err90);
      }
      errors++;
    }
  } else if (!valid0) {
    const err91 = {
      instancePath,
      schemaPath: "/discriminator",
      keyword: "discriminator",
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
