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
      } else if (tag0 === "read") {
        const _errs8 = errors;
        let valid19 = false;
        valid19 = true;
        if (data.id !== undefined) {
          if (!(typeof data.id == "string")) {
            const err20 = {
              instancePath: instancePath + "/id",
              schemaPath: "/mapping/read/properties/id/type",
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
            schemaPath: "/mapping/read/properties/id",
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
        if (data.input !== undefined) {
          let data5 = data.input;
          let valid21 = false;
          if (data5 && typeof data5 == "object" && !Array.isArray(data5)) {
            valid21 = true;
            if (data5.selection !== undefined) {
              let data6 = data5.selection;
              let valid23 = false;
              if (data6 && typeof data6 == "object" && !Array.isArray(data6)) {
                valid23 = true;
                if (data6.installationId !== undefined) {
                  if (!(typeof data6.installationId == "string")) {
                    const err22 = {
                      instancePath:
                        instancePath + "/input/selection/installationId",
                      schemaPath:
                        "/mapping/read/properties/input/properties/selection/properties/installationId/type",
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
                    vErrors = [err23];
                  } else {
                    vErrors.push(err23);
                  }
                  errors++;
                }
                if (data6.revision !== undefined) {
                  if (!(typeof data6.revision == "string")) {
                    const err24 = {
                      instancePath: instancePath + "/input/selection/revision",
                      schemaPath:
                        "/mapping/read/properties/input/properties/selection/properties/revision/type",
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
                    instancePath: instancePath + "/input/selection",
                    schemaPath:
                      "/mapping/read/properties/input/properties/selection/properties/revision",
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
                if (data6.owner !== undefined) {
                  let data9 = data6.owner;
                  let valid25 = false;
                  if (
                    data9 &&
                    typeof data9 == "object" &&
                    !Array.isArray(data9)
                  ) {
                    valid25 = true;
                    if (data9.profileId !== undefined) {
                      if (!(typeof data9.profileId == "string")) {
                        const err26 = {
                          instancePath:
                            instancePath + "/input/selection/owner/profileId",
                          schemaPath:
                            "/mapping/read/properties/input/properties/selection/properties/owner/properties/profileId/type",
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
                        vErrors = [err27];
                      } else {
                        vErrors.push(err27);
                      }
                      errors++;
                    }
                    if (data9.generation !== undefined) {
                      if (!(typeof data9.generation == "string")) {
                        const err28 = {
                          instancePath:
                            instancePath + "/input/selection/owner/generation",
                          schemaPath:
                            "/mapping/read/properties/input/properties/selection/properties/owner/properties/generation/type",
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
                        vErrors = [err29];
                      } else {
                        vErrors.push(err29);
                      }
                      errors++;
                    }
                    for (const key4 in data9) {
                      if (key4 !== "profileId" && key4 !== "generation") {
                        const err30 = {
                          instancePath:
                            instancePath +
                            "/input/selection/owner/" +
                            key4.replace(/~/g, "~0").replace(/\//g, "~1"),
                          schemaPath:
                            "/mapping/read/properties/input/properties/selection/properties/owner",
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
                  if (!valid25) {
                    const err31 = {
                      instancePath: instancePath + "/input/selection/owner",
                      schemaPath:
                        "/mapping/read/properties/input/properties/selection/properties/owner/properties",
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
                    instancePath: instancePath + "/input/selection",
                    schemaPath:
                      "/mapping/read/properties/input/properties/selection/properties/owner",
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
                for (const key5 in data6) {
                  if (
                    key5 !== "installationId" &&
                    key5 !== "revision" &&
                    key5 !== "owner"
                  ) {
                    const err33 = {
                      instancePath:
                        instancePath +
                        "/input/selection/" +
                        key5.replace(/~/g, "~0").replace(/\//g, "~1"),
                      schemaPath:
                        "/mapping/read/properties/input/properties/selection",
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
              }
              if (!valid23) {
                const err34 = {
                  instancePath: instancePath + "/input/selection",
                  schemaPath:
                    "/mapping/read/properties/input/properties/selection/properties",
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
                instancePath: instancePath + "/input",
                schemaPath:
                  "/mapping/read/properties/input/properties/selection",
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
            if (data5.target !== undefined) {
              let data12 = data5.target;
              let valid29 = false;
              if (
                data12 &&
                typeof data12 == "object" &&
                !Array.isArray(data12)
              ) {
                const tag2 = data12.kind;
                if (tag2 === undefined) {
                  const err36 = {
                    instancePath: instancePath + "/input/target",
                    schemaPath:
                      "/mapping/read/properties/input/properties/target/discriminator",
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
                  if (tag2 === "cursor") {
                    const _errs18 = errors;
                    let valid31 = false;
                    valid31 = true;
                    for (const key6 in data12) {
                      if (key6 !== "kind") {
                        const err37 = {
                          instancePath:
                            instancePath +
                            "/input/target/" +
                            key6.replace(/~/g, "~0").replace(/\//g, "~1"),
                          schemaPath:
                            "/mapping/read/properties/input/properties/target/mapping/cursor",
                          keyword: "properties",
                          params: {
                            error: "additional",
                            additionalProperty: key6,
                          },
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
                    if (!valid31) {
                      const err38 = {
                        instancePath: instancePath + "/input/target",
                        schemaPath:
                          "/mapping/read/properties/input/properties/target/mapping/cursor/properties",
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
                    var valid30 = _errs18 === errors;
                    valid29 = valid30;
                  } else if (tag2 === "accepted") {
                    const _errs19 = errors;
                    let valid35 = false;
                    valid35 = true;
                    for (const key7 in data12) {
                      if (key7 !== "kind" && key7 !== "receipt") {
                        const err39 = {
                          instancePath:
                            instancePath +
                            "/input/target/" +
                            key7.replace(/~/g, "~0").replace(/\//g, "~1"),
                          schemaPath:
                            "/mapping/read/properties/input/properties/target/mapping/accepted",
                          keyword: "properties",
                          params: {
                            error: "additional",
                            additionalProperty: key7,
                          },
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
                    if (!valid35) {
                      const err40 = {
                        instancePath: instancePath + "/input/target",
                        schemaPath:
                          "/mapping/read/properties/input/properties/target/mapping/accepted/properties",
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
                    var valid34 = _errs19 === errors;
                    valid29 = valid34;
                  } else {
                    const err41 = {
                      instancePath: instancePath + "/input/target/kind",
                      schemaPath:
                        "/mapping/read/properties/input/properties/target/mapping",
                      keyword: "discriminator",
                      params: { error: "mapping", tag: "kind", tagValue: tag2 },
                      message: 'value of tag "kind" must be in mapping',
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
                    instancePath: instancePath + "/input/target/kind",
                    schemaPath:
                      "/mapping/read/properties/input/properties/target/discriminator",
                    keyword: "discriminator",
                    params: { error: "tag", tag: "kind", tagValue: tag2 },
                    message: 'tag "kind" must be string',
                  };
                  if (vErrors === null) {
                    vErrors = [err42];
                  } else {
                    vErrors.push(err42);
                  }
                  errors++;
                }
              } else if (!valid29) {
                const err43 = {
                  instancePath: instancePath + "/input/target",
                  schemaPath:
                    "/mapping/read/properties/input/properties/target/discriminator",
                  keyword: "discriminator",
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
            } else {
              const err44 = {
                instancePath: instancePath + "/input",
                schemaPath: "/mapping/read/properties/input/properties/target",
                keyword: "properties",
                params: { error: "missing", missingProperty: "target" },
                message: "must have property 'target'",
              };
              if (vErrors === null) {
                vErrors = [err44];
              } else {
                vErrors.push(err44);
              }
              errors++;
            }
            for (const key8 in data5) {
              if (key8 !== "selection" && key8 !== "target") {
                const err45 = {
                  instancePath:
                    instancePath +
                    "/input/" +
                    key8.replace(/~/g, "~0").replace(/\//g, "~1"),
                  schemaPath: "/mapping/read/properties/input",
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
          }
          if (!valid21) {
            const err46 = {
              instancePath: instancePath + "/input",
              schemaPath: "/mapping/read/properties/input/properties",
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
        } else {
          const err47 = {
            instancePath,
            schemaPath: "/mapping/read/properties/input",
            keyword: "properties",
            params: { error: "missing", missingProperty: "input" },
            message: "must have property 'input'",
          };
          if (vErrors === null) {
            vErrors = [err47];
          } else {
            vErrors.push(err47);
          }
          errors++;
        }
        for (const key9 in data) {
          if (key9 !== "kind" && key9 !== "id" && key9 !== "input") {
            const err48 = {
              instancePath:
                instancePath +
                "/" +
                key9.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/read",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key9 },
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
        if (!valid19) {
          const err49 = {
            instancePath,
            schemaPath: "/mapping/read/properties",
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
        var valid18 = _errs8 === errors;
        valid0 = valid18;
      } else if (tag0 === "readWork") {
        const _errs20 = errors;
        let valid41 = false;
        valid41 = true;
        if (data.id !== undefined) {
          if (!(typeof data.id == "string")) {
            const err50 = {
              instancePath: instancePath + "/id",
              schemaPath: "/mapping/readWork/properties/id/type",
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
            instancePath,
            schemaPath: "/mapping/readWork/properties/id",
            keyword: "properties",
            params: { error: "missing", missingProperty: "id" },
            message: "must have property 'id'",
          };
          if (vErrors === null) {
            vErrors = [err51];
          } else {
            vErrors.push(err51);
          }
          errors++;
        }
        if (data.input !== undefined) {
          let data14 = data.input;
          let valid43 = false;
          if (data14 && typeof data14 == "object" && !Array.isArray(data14)) {
            valid43 = true;
            if (data14.selection !== undefined) {
              let data15 = data14.selection;
              let valid45 = false;
              if (
                data15 &&
                typeof data15 == "object" &&
                !Array.isArray(data15)
              ) {
                valid45 = true;
                if (data15.installationId !== undefined) {
                  if (!(typeof data15.installationId == "string")) {
                    const err52 = {
                      instancePath:
                        instancePath + "/input/selection/installationId",
                      schemaPath:
                        "/mapping/readWork/properties/input/properties/selection/properties/installationId/type",
                      keyword: "type",
                      params: { type: "string", nullable: false },
                      message: "must be string",
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
                    vErrors = [err53];
                  } else {
                    vErrors.push(err53);
                  }
                  errors++;
                }
                if (data15.revision !== undefined) {
                  if (!(typeof data15.revision == "string")) {
                    const err54 = {
                      instancePath: instancePath + "/input/selection/revision",
                      schemaPath:
                        "/mapping/readWork/properties/input/properties/selection/properties/revision/type",
                      keyword: "type",
                      params: { type: "string", nullable: false },
                      message: "must be string",
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
                    instancePath: instancePath + "/input/selection",
                    schemaPath:
                      "/mapping/readWork/properties/input/properties/selection/properties/revision",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "revision" },
                    message: "must have property 'revision'",
                  };
                  if (vErrors === null) {
                    vErrors = [err55];
                  } else {
                    vErrors.push(err55);
                  }
                  errors++;
                }
                if (data15.owner !== undefined) {
                  let data18 = data15.owner;
                  let valid47 = false;
                  if (
                    data18 &&
                    typeof data18 == "object" &&
                    !Array.isArray(data18)
                  ) {
                    valid47 = true;
                    if (data18.profileId !== undefined) {
                      if (!(typeof data18.profileId == "string")) {
                        const err56 = {
                          instancePath:
                            instancePath + "/input/selection/owner/profileId",
                          schemaPath:
                            "/mapping/readWork/properties/input/properties/selection/properties/owner/properties/profileId/type",
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
                        vErrors = [err57];
                      } else {
                        vErrors.push(err57);
                      }
                      errors++;
                    }
                    if (data18.generation !== undefined) {
                      if (!(typeof data18.generation == "string")) {
                        const err58 = {
                          instancePath:
                            instancePath + "/input/selection/owner/generation",
                          schemaPath:
                            "/mapping/readWork/properties/input/properties/selection/properties/owner/properties/generation/type",
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
                        vErrors = [err59];
                      } else {
                        vErrors.push(err59);
                      }
                      errors++;
                    }
                    for (const key10 in data18) {
                      if (key10 !== "profileId" && key10 !== "generation") {
                        const err60 = {
                          instancePath:
                            instancePath +
                            "/input/selection/owner/" +
                            key10.replace(/~/g, "~0").replace(/\//g, "~1"),
                          schemaPath:
                            "/mapping/readWork/properties/input/properties/selection/properties/owner",
                          keyword: "properties",
                          params: {
                            error: "additional",
                            additionalProperty: key10,
                          },
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
                  }
                  if (!valid47) {
                    const err61 = {
                      instancePath: instancePath + "/input/selection/owner",
                      schemaPath:
                        "/mapping/readWork/properties/input/properties/selection/properties/owner/properties",
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
                } else {
                  const err62 = {
                    instancePath: instancePath + "/input/selection",
                    schemaPath:
                      "/mapping/readWork/properties/input/properties/selection/properties/owner",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "owner" },
                    message: "must have property 'owner'",
                  };
                  if (vErrors === null) {
                    vErrors = [err62];
                  } else {
                    vErrors.push(err62);
                  }
                  errors++;
                }
                for (const key11 in data15) {
                  if (
                    key11 !== "installationId" &&
                    key11 !== "revision" &&
                    key11 !== "owner"
                  ) {
                    const err63 = {
                      instancePath:
                        instancePath +
                        "/input/selection/" +
                        key11.replace(/~/g, "~0").replace(/\//g, "~1"),
                      schemaPath:
                        "/mapping/readWork/properties/input/properties/selection",
                      keyword: "properties",
                      params: {
                        error: "additional",
                        additionalProperty: key11,
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
              if (!valid45) {
                const err64 = {
                  instancePath: instancePath + "/input/selection",
                  schemaPath:
                    "/mapping/readWork/properties/input/properties/selection/properties",
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
            } else {
              const err65 = {
                instancePath: instancePath + "/input",
                schemaPath:
                  "/mapping/readWork/properties/input/properties/selection",
                keyword: "properties",
                params: { error: "missing", missingProperty: "selection" },
                message: "must have property 'selection'",
              };
              if (vErrors === null) {
                vErrors = [err65];
              } else {
                vErrors.push(err65);
              }
              errors++;
            }
            if (data14.runId !== undefined) {
              if (!(typeof data14.runId == "string")) {
                const err66 = {
                  instancePath: instancePath + "/input/runId",
                  schemaPath:
                    "/mapping/readWork/properties/input/properties/runId/type",
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
                instancePath: instancePath + "/input",
                schemaPath:
                  "/mapping/readWork/properties/input/properties/runId",
                keyword: "properties",
                params: { error: "missing", missingProperty: "runId" },
                message: "must have property 'runId'",
              };
              if (vErrors === null) {
                vErrors = [err67];
              } else {
                vErrors.push(err67);
              }
              errors++;
            }
            for (const key12 in data14) {
              if (key12 !== "selection" && key12 !== "runId") {
                const err68 = {
                  instancePath:
                    instancePath +
                    "/input/" +
                    key12.replace(/~/g, "~0").replace(/\//g, "~1"),
                  schemaPath: "/mapping/readWork/properties/input",
                  keyword: "properties",
                  params: { error: "additional", additionalProperty: key12 },
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
          }
          if (!valid43) {
            const err69 = {
              instancePath: instancePath + "/input",
              schemaPath: "/mapping/readWork/properties/input/properties",
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
        } else {
          const err70 = {
            instancePath,
            schemaPath: "/mapping/readWork/properties/input",
            keyword: "properties",
            params: { error: "missing", missingProperty: "input" },
            message: "must have property 'input'",
          };
          if (vErrors === null) {
            vErrors = [err70];
          } else {
            vErrors.push(err70);
          }
          errors++;
        }
        for (const key13 in data) {
          if (key13 !== "kind" && key13 !== "id" && key13 !== "input") {
            const err71 = {
              instancePath:
                instancePath +
                "/" +
                key13.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/readWork",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key13 },
              message: "must NOT have additional properties",
            };
            if (vErrors === null) {
              vErrors = [err71];
            } else {
              vErrors.push(err71);
            }
            errors++;
          }
        }
        if (!valid41) {
          const err72 = {
            instancePath,
            schemaPath: "/mapping/readWork/properties",
            keyword: "properties",
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
        var valid40 = _errs20 === errors;
        valid0 = valid40;
      } else if (tag0 === "readInk") {
        const _errs30 = errors;
        let valid54 = false;
        valid54 = true;
        if (data.id !== undefined) {
          if (!(typeof data.id == "string")) {
            const err73 = {
              instancePath: instancePath + "/id",
              schemaPath: "/mapping/readInk/properties/id/type",
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
            instancePath,
            schemaPath: "/mapping/readInk/properties/id",
            keyword: "properties",
            params: { error: "missing", missingProperty: "id" },
            message: "must have property 'id'",
          };
          if (vErrors === null) {
            vErrors = [err74];
          } else {
            vErrors.push(err74);
          }
          errors++;
        }
        if (data.input !== undefined) {
          let data23 = data.input;
          let valid56 = false;
          if (data23 && typeof data23 == "object" && !Array.isArray(data23)) {
            valid56 = true;
            if (data23.selection !== undefined) {
              let data24 = data23.selection;
              let valid58 = false;
              if (
                data24 &&
                typeof data24 == "object" &&
                !Array.isArray(data24)
              ) {
                valid58 = true;
                if (data24.installationId !== undefined) {
                  if (!(typeof data24.installationId == "string")) {
                    const err75 = {
                      instancePath:
                        instancePath + "/input/selection/installationId",
                      schemaPath:
                        "/mapping/readInk/properties/input/properties/selection/properties/installationId/type",
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
                    vErrors = [err76];
                  } else {
                    vErrors.push(err76);
                  }
                  errors++;
                }
                if (data24.revision !== undefined) {
                  if (!(typeof data24.revision == "string")) {
                    const err77 = {
                      instancePath: instancePath + "/input/selection/revision",
                      schemaPath:
                        "/mapping/readInk/properties/input/properties/selection/properties/revision/type",
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
                    instancePath: instancePath + "/input/selection",
                    schemaPath:
                      "/mapping/readInk/properties/input/properties/selection/properties/revision",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "revision" },
                    message: "must have property 'revision'",
                  };
                  if (vErrors === null) {
                    vErrors = [err78];
                  } else {
                    vErrors.push(err78);
                  }
                  errors++;
                }
                if (data24.owner !== undefined) {
                  let data27 = data24.owner;
                  let valid60 = false;
                  if (
                    data27 &&
                    typeof data27 == "object" &&
                    !Array.isArray(data27)
                  ) {
                    valid60 = true;
                    if (data27.profileId !== undefined) {
                      if (!(typeof data27.profileId == "string")) {
                        const err79 = {
                          instancePath:
                            instancePath + "/input/selection/owner/profileId",
                          schemaPath:
                            "/mapping/readInk/properties/input/properties/selection/properties/owner/properties/profileId/type",
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
                        vErrors = [err80];
                      } else {
                        vErrors.push(err80);
                      }
                      errors++;
                    }
                    if (data27.generation !== undefined) {
                      if (!(typeof data27.generation == "string")) {
                        const err81 = {
                          instancePath:
                            instancePath + "/input/selection/owner/generation",
                          schemaPath:
                            "/mapping/readInk/properties/input/properties/selection/properties/owner/properties/generation/type",
                          keyword: "type",
                          params: { type: "string", nullable: false },
                          message: "must be string",
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
                        vErrors = [err82];
                      } else {
                        vErrors.push(err82);
                      }
                      errors++;
                    }
                    for (const key14 in data27) {
                      if (key14 !== "profileId" && key14 !== "generation") {
                        const err83 = {
                          instancePath:
                            instancePath +
                            "/input/selection/owner/" +
                            key14.replace(/~/g, "~0").replace(/\//g, "~1"),
                          schemaPath:
                            "/mapping/readInk/properties/input/properties/selection/properties/owner",
                          keyword: "properties",
                          params: {
                            error: "additional",
                            additionalProperty: key14,
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
                  if (!valid60) {
                    const err84 = {
                      instancePath: instancePath + "/input/selection/owner",
                      schemaPath:
                        "/mapping/readInk/properties/input/properties/selection/properties/owner/properties",
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
                    instancePath: instancePath + "/input/selection",
                    schemaPath:
                      "/mapping/readInk/properties/input/properties/selection/properties/owner",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "owner" },
                    message: "must have property 'owner'",
                  };
                  if (vErrors === null) {
                    vErrors = [err85];
                  } else {
                    vErrors.push(err85);
                  }
                  errors++;
                }
                for (const key15 in data24) {
                  if (
                    key15 !== "installationId" &&
                    key15 !== "revision" &&
                    key15 !== "owner"
                  ) {
                    const err86 = {
                      instancePath:
                        instancePath +
                        "/input/selection/" +
                        key15.replace(/~/g, "~0").replace(/\//g, "~1"),
                      schemaPath:
                        "/mapping/readInk/properties/input/properties/selection",
                      keyword: "properties",
                      params: {
                        error: "additional",
                        additionalProperty: key15,
                      },
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
              }
              if (!valid58) {
                const err87 = {
                  instancePath: instancePath + "/input/selection",
                  schemaPath:
                    "/mapping/readInk/properties/input/properties/selection/properties",
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
            } else {
              const err88 = {
                instancePath: instancePath + "/input",
                schemaPath:
                  "/mapping/readInk/properties/input/properties/selection",
                keyword: "properties",
                params: { error: "missing", missingProperty: "selection" },
                message: "must have property 'selection'",
              };
              if (vErrors === null) {
                vErrors = [err88];
              } else {
                vErrors.push(err88);
              }
              errors++;
            }
            for (const key16 in data23) {
              if (key16 !== "selection" && key16 !== "token") {
                const err89 = {
                  instancePath:
                    instancePath +
                    "/input/" +
                    key16.replace(/~/g, "~0").replace(/\//g, "~1"),
                  schemaPath: "/mapping/readInk/properties/input",
                  keyword: "properties",
                  params: { error: "additional", additionalProperty: key16 },
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
          }
          if (!valid56) {
            const err90 = {
              instancePath: instancePath + "/input",
              schemaPath: "/mapping/readInk/properties/input/properties",
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
        } else {
          const err91 = {
            instancePath,
            schemaPath: "/mapping/readInk/properties/input",
            keyword: "properties",
            params: { error: "missing", missingProperty: "input" },
            message: "must have property 'input'",
          };
          if (vErrors === null) {
            vErrors = [err91];
          } else {
            vErrors.push(err91);
          }
          errors++;
        }
        for (const key17 in data) {
          if (key17 !== "kind" && key17 !== "id" && key17 !== "input") {
            const err92 = {
              instancePath:
                instancePath +
                "/" +
                key17.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/readInk",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key17 },
              message: "must NOT have additional properties",
            };
            if (vErrors === null) {
              vErrors = [err92];
            } else {
              vErrors.push(err92);
            }
            errors++;
          }
        }
        if (!valid54) {
          const err93 = {
            instancePath,
            schemaPath: "/mapping/readInk/properties",
            keyword: "properties",
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
        var valid53 = _errs30 === errors;
        valid0 = valid53;
      } else if (tag0 === "readPracticeControls") {
        const _errs39 = errors;
        let valid67 = false;
        valid67 = true;
        if (data.id !== undefined) {
          if (!(typeof data.id == "string")) {
            const err94 = {
              instancePath: instancePath + "/id",
              schemaPath: "/mapping/readPracticeControls/properties/id/type",
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
            instancePath,
            schemaPath: "/mapping/readPracticeControls/properties/id",
            keyword: "properties",
            params: { error: "missing", missingProperty: "id" },
            message: "must have property 'id'",
          };
          if (vErrors === null) {
            vErrors = [err95];
          } else {
            vErrors.push(err95);
          }
          errors++;
        }
        if (data.input !== undefined) {
          let data31 = data.input;
          let valid69 = false;
          if (data31 && typeof data31 == "object" && !Array.isArray(data31)) {
            valid69 = true;
            if (data31.selection !== undefined) {
              let data32 = data31.selection;
              let valid71 = false;
              if (
                data32 &&
                typeof data32 == "object" &&
                !Array.isArray(data32)
              ) {
                valid71 = true;
                if (data32.installationId !== undefined) {
                  if (!(typeof data32.installationId == "string")) {
                    const err96 = {
                      instancePath:
                        instancePath + "/input/selection/installationId",
                      schemaPath:
                        "/mapping/readPracticeControls/properties/input/properties/selection/properties/installationId/type",
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
                      "/mapping/readPracticeControls/properties/input/properties/selection/properties/installationId",
                    keyword: "properties",
                    params: {
                      error: "missing",
                      missingProperty: "installationId",
                    },
                    message: "must have property 'installationId'",
                  };
                  if (vErrors === null) {
                    vErrors = [err97];
                  } else {
                    vErrors.push(err97);
                  }
                  errors++;
                }
                if (data32.revision !== undefined) {
                  if (!(typeof data32.revision == "string")) {
                    const err98 = {
                      instancePath: instancePath + "/input/selection/revision",
                      schemaPath:
                        "/mapping/readPracticeControls/properties/input/properties/selection/properties/revision/type",
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
                    instancePath: instancePath + "/input/selection",
                    schemaPath:
                      "/mapping/readPracticeControls/properties/input/properties/selection/properties/revision",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "revision" },
                    message: "must have property 'revision'",
                  };
                  if (vErrors === null) {
                    vErrors = [err99];
                  } else {
                    vErrors.push(err99);
                  }
                  errors++;
                }
                if (data32.owner !== undefined) {
                  let data35 = data32.owner;
                  let valid73 = false;
                  if (
                    data35 &&
                    typeof data35 == "object" &&
                    !Array.isArray(data35)
                  ) {
                    valid73 = true;
                    if (data35.profileId !== undefined) {
                      if (!(typeof data35.profileId == "string")) {
                        const err100 = {
                          instancePath:
                            instancePath + "/input/selection/owner/profileId",
                          schemaPath:
                            "/mapping/readPracticeControls/properties/input/properties/selection/properties/owner/properties/profileId/type",
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
                          "/mapping/readPracticeControls/properties/input/properties/selection/properties/owner/properties/profileId",
                        keyword: "properties",
                        params: {
                          error: "missing",
                          missingProperty: "profileId",
                        },
                        message: "must have property 'profileId'",
                      };
                      if (vErrors === null) {
                        vErrors = [err101];
                      } else {
                        vErrors.push(err101);
                      }
                      errors++;
                    }
                    if (data35.generation !== undefined) {
                      if (!(typeof data35.generation == "string")) {
                        const err102 = {
                          instancePath:
                            instancePath + "/input/selection/owner/generation",
                          schemaPath:
                            "/mapping/readPracticeControls/properties/input/properties/selection/properties/owner/properties/generation/type",
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
                        vErrors = [err103];
                      } else {
                        vErrors.push(err103);
                      }
                      errors++;
                    }
                    for (const key18 in data35) {
                      if (key18 !== "profileId" && key18 !== "generation") {
                        const err104 = {
                          instancePath:
                            instancePath +
                            "/input/selection/owner/" +
                            key18.replace(/~/g, "~0").replace(/\//g, "~1"),
                          schemaPath:
                            "/mapping/readPracticeControls/properties/input/properties/selection/properties/owner",
                          keyword: "properties",
                          params: {
                            error: "additional",
                            additionalProperty: key18,
                          },
                          message: "must NOT have additional properties",
                        };
                        if (vErrors === null) {
                          vErrors = [err104];
                        } else {
                          vErrors.push(err104);
                        }
                        errors++;
                      }
                    }
                  }
                  if (!valid73) {
                    const err105 = {
                      instancePath: instancePath + "/input/selection/owner",
                      schemaPath:
                        "/mapping/readPracticeControls/properties/input/properties/selection/properties/owner/properties",
                      keyword: "properties",
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
                } else {
                  const err106 = {
                    instancePath: instancePath + "/input/selection",
                    schemaPath:
                      "/mapping/readPracticeControls/properties/input/properties/selection/properties/owner",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "owner" },
                    message: "must have property 'owner'",
                  };
                  if (vErrors === null) {
                    vErrors = [err106];
                  } else {
                    vErrors.push(err106);
                  }
                  errors++;
                }
                for (const key19 in data32) {
                  if (
                    key19 !== "installationId" &&
                    key19 !== "revision" &&
                    key19 !== "owner"
                  ) {
                    const err107 = {
                      instancePath:
                        instancePath +
                        "/input/selection/" +
                        key19.replace(/~/g, "~0").replace(/\//g, "~1"),
                      schemaPath:
                        "/mapping/readPracticeControls/properties/input/properties/selection",
                      keyword: "properties",
                      params: {
                        error: "additional",
                        additionalProperty: key19,
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
              if (!valid71) {
                const err108 = {
                  instancePath: instancePath + "/input/selection",
                  schemaPath:
                    "/mapping/readPracticeControls/properties/input/properties/selection/properties",
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
            } else {
              const err109 = {
                instancePath: instancePath + "/input",
                schemaPath:
                  "/mapping/readPracticeControls/properties/input/properties/selection",
                keyword: "properties",
                params: { error: "missing", missingProperty: "selection" },
                message: "must have property 'selection'",
              };
              if (vErrors === null) {
                vErrors = [err109];
              } else {
                vErrors.push(err109);
              }
              errors++;
            }
            for (const key20 in data31) {
              if (key20 !== "selection" && key20 !== "binding") {
                const err110 = {
                  instancePath:
                    instancePath +
                    "/input/" +
                    key20.replace(/~/g, "~0").replace(/\//g, "~1"),
                  schemaPath: "/mapping/readPracticeControls/properties/input",
                  keyword: "properties",
                  params: { error: "additional", additionalProperty: key20 },
                  message: "must NOT have additional properties",
                };
                if (vErrors === null) {
                  vErrors = [err110];
                } else {
                  vErrors.push(err110);
                }
                errors++;
              }
            }
          }
          if (!valid69) {
            const err111 = {
              instancePath: instancePath + "/input",
              schemaPath:
                "/mapping/readPracticeControls/properties/input/properties",
              keyword: "properties",
              params: { type: "object", nullable: false },
              message: "must be object",
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
            instancePath,
            schemaPath: "/mapping/readPracticeControls/properties/input",
            keyword: "properties",
            params: { error: "missing", missingProperty: "input" },
            message: "must have property 'input'",
          };
          if (vErrors === null) {
            vErrors = [err112];
          } else {
            vErrors.push(err112);
          }
          errors++;
        }
        for (const key21 in data) {
          if (key21 !== "kind" && key21 !== "id" && key21 !== "input") {
            const err113 = {
              instancePath:
                instancePath +
                "/" +
                key21.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/readPracticeControls",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key21 },
              message: "must NOT have additional properties",
            };
            if (vErrors === null) {
              vErrors = [err113];
            } else {
              vErrors.push(err113);
            }
            errors++;
          }
        }
        if (!valid67) {
          const err114 = {
            instancePath,
            schemaPath: "/mapping/readPracticeControls/properties",
            keyword: "properties",
            params: { type: "object", nullable: false },
            message: "must be object",
          };
          if (vErrors === null) {
            vErrors = [err114];
          } else {
            vErrors.push(err114);
          }
          errors++;
        }
        var valid66 = _errs39 === errors;
        valid0 = valid66;
      } else if (tag0 === "execute") {
        const _errs48 = errors;
        let valid80 = false;
        valid80 = true;
        if (data.id !== undefined) {
          if (!(typeof data.id == "string")) {
            const err115 = {
              instancePath: instancePath + "/id",
              schemaPath: "/mapping/execute/properties/id/type",
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
            instancePath,
            schemaPath: "/mapping/execute/properties/id",
            keyword: "properties",
            params: { error: "missing", missingProperty: "id" },
            message: "must have property 'id'",
          };
          if (vErrors === null) {
            vErrors = [err116];
          } else {
            vErrors.push(err116);
          }
          errors++;
        }
        if (data.operation !== undefined) {
          let data39 = data.operation;
          let valid82 = false;
          if (data39 && typeof data39 == "object" && !Array.isArray(data39)) {
            const tag3 = data39.kind;
            if (tag3 === undefined) {
              const err117 = {
                instancePath: instancePath + "/operation",
                schemaPath:
                  "/mapping/execute/properties/operation/discriminator",
                keyword: "discriminator",
                params: { error: "tag", tag: "kind", tagValue: tag3 },
                message: 'tag "kind" must be string',
              };
              if (vErrors === null) {
                vErrors = [err117];
              } else {
                vErrors.push(err117);
              }
              errors++;
            } else if (typeof tag3 == "string") {
              if (tag3 === "teaching") {
                const _errs51 = errors;
                let valid84 = false;
                valid84 = true;
                if (data39.selection !== undefined) {
                  let data40 = data39.selection;
                  let valid86 = false;
                  if (
                    data40 &&
                    typeof data40 == "object" &&
                    !Array.isArray(data40)
                  ) {
                    valid86 = true;
                    if (data40.installationId !== undefined) {
                      if (!(typeof data40.installationId == "string")) {
                        const err118 = {
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
                          vErrors = [err118];
                        } else {
                          vErrors.push(err118);
                        }
                        errors++;
                      }
                    } else {
                      const err119 = {
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
                        vErrors = [err119];
                      } else {
                        vErrors.push(err119);
                      }
                      errors++;
                    }
                    if (data40.revision !== undefined) {
                      if (!(typeof data40.revision == "string")) {
                        const err120 = {
                          instancePath:
                            instancePath + "/operation/selection/revision",
                          schemaPath:
                            "/mapping/execute/properties/operation/mapping/teaching/properties/selection/properties/revision/type",
                          keyword: "type",
                          params: { type: "string", nullable: false },
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
                        vErrors = [err121];
                      } else {
                        vErrors.push(err121);
                      }
                      errors++;
                    }
                    if (data40.owner !== undefined) {
                      let data43 = data40.owner;
                      let valid88 = false;
                      if (
                        data43 &&
                        typeof data43 == "object" &&
                        !Array.isArray(data43)
                      ) {
                        valid88 = true;
                        if (data43.profileId !== undefined) {
                          if (!(typeof data43.profileId == "string")) {
                            const err122 = {
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
                              vErrors = [err122];
                            } else {
                              vErrors.push(err122);
                            }
                            errors++;
                          }
                        } else {
                          const err123 = {
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
                            vErrors = [err123];
                          } else {
                            vErrors.push(err123);
                          }
                          errors++;
                        }
                        if (data43.generation !== undefined) {
                          if (!(typeof data43.generation == "string")) {
                            const err124 = {
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
                              vErrors = [err124];
                            } else {
                              vErrors.push(err124);
                            }
                            errors++;
                          }
                        } else {
                          const err125 = {
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
                            vErrors = [err125];
                          } else {
                            vErrors.push(err125);
                          }
                          errors++;
                        }
                        for (const key22 in data43) {
                          if (key22 !== "profileId" && key22 !== "generation") {
                            const err126 = {
                              instancePath:
                                instancePath +
                                "/operation/selection/owner/" +
                                key22.replace(/~/g, "~0").replace(/\//g, "~1"),
                              schemaPath:
                                "/mapping/execute/properties/operation/mapping/teaching/properties/selection/properties/owner",
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
                      if (!valid88) {
                        const err127 = {
                          instancePath:
                            instancePath + "/operation/selection/owner",
                          schemaPath:
                            "/mapping/execute/properties/operation/mapping/teaching/properties/selection/properties/owner/properties",
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
                        instancePath: instancePath + "/operation/selection",
                        schemaPath:
                          "/mapping/execute/properties/operation/mapping/teaching/properties/selection/properties/owner",
                        keyword: "properties",
                        params: { error: "missing", missingProperty: "owner" },
                        message: "must have property 'owner'",
                      };
                      if (vErrors === null) {
                        vErrors = [err128];
                      } else {
                        vErrors.push(err128);
                      }
                      errors++;
                    }
                    for (const key23 in data40) {
                      if (
                        key23 !== "installationId" &&
                        key23 !== "revision" &&
                        key23 !== "owner"
                      ) {
                        const err129 = {
                          instancePath:
                            instancePath +
                            "/operation/selection/" +
                            key23.replace(/~/g, "~0").replace(/\//g, "~1"),
                          schemaPath:
                            "/mapping/execute/properties/operation/mapping/teaching/properties/selection",
                          keyword: "properties",
                          params: {
                            error: "additional",
                            additionalProperty: key23,
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
                  if (!valid86) {
                    const err130 = {
                      instancePath: instancePath + "/operation/selection",
                      schemaPath:
                        "/mapping/execute/properties/operation/mapping/teaching/properties/selection/properties",
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
                    instancePath: instancePath + "/operation",
                    schemaPath:
                      "/mapping/execute/properties/operation/mapping/teaching/properties/selection",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "selection" },
                    message: "must have property 'selection'",
                  };
                  if (vErrors === null) {
                    vErrors = [err131];
                  } else {
                    vErrors.push(err131);
                  }
                  errors++;
                }
                for (const key24 in data39) {
                  if (
                    key24 !== "kind" &&
                    key24 !== "selection" &&
                    key24 !== "command"
                  ) {
                    const err132 = {
                      instancePath:
                        instancePath +
                        "/operation/" +
                        key24.replace(/~/g, "~0").replace(/\//g, "~1"),
                      schemaPath:
                        "/mapping/execute/properties/operation/mapping/teaching",
                      keyword: "properties",
                      params: {
                        error: "additional",
                        additionalProperty: key24,
                      },
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
                if (!valid84) {
                  const err133 = {
                    instancePath: instancePath + "/operation",
                    schemaPath:
                      "/mapping/execute/properties/operation/mapping/teaching/properties",
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
                var valid83 = _errs51 === errors;
                valid82 = valid83;
              } else if (tag3 === "ink") {
                const _errs58 = errors;
                let valid94 = false;
                valid94 = true;
                if (data39.selection !== undefined) {
                  let data46 = data39.selection;
                  let valid96 = false;
                  if (
                    data46 &&
                    typeof data46 == "object" &&
                    !Array.isArray(data46)
                  ) {
                    valid96 = true;
                    if (data46.installationId !== undefined) {
                      if (!(typeof data46.installationId == "string")) {
                        const err134 = {
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
                          vErrors = [err134];
                        } else {
                          vErrors.push(err134);
                        }
                        errors++;
                      }
                    } else {
                      const err135 = {
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
                        vErrors = [err135];
                      } else {
                        vErrors.push(err135);
                      }
                      errors++;
                    }
                    if (data46.revision !== undefined) {
                      if (!(typeof data46.revision == "string")) {
                        const err136 = {
                          instancePath:
                            instancePath + "/operation/selection/revision",
                          schemaPath:
                            "/mapping/execute/properties/operation/mapping/ink/properties/selection/properties/revision/type",
                          keyword: "type",
                          params: { type: "string", nullable: false },
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
                        vErrors = [err137];
                      } else {
                        vErrors.push(err137);
                      }
                      errors++;
                    }
                    if (data46.owner !== undefined) {
                      let data49 = data46.owner;
                      let valid98 = false;
                      if (
                        data49 &&
                        typeof data49 == "object" &&
                        !Array.isArray(data49)
                      ) {
                        valid98 = true;
                        if (data49.profileId !== undefined) {
                          if (!(typeof data49.profileId == "string")) {
                            const err138 = {
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
                              vErrors = [err138];
                            } else {
                              vErrors.push(err138);
                            }
                            errors++;
                          }
                        } else {
                          const err139 = {
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
                            vErrors = [err139];
                          } else {
                            vErrors.push(err139);
                          }
                          errors++;
                        }
                        if (data49.generation !== undefined) {
                          if (!(typeof data49.generation == "string")) {
                            const err140 = {
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
                              vErrors = [err140];
                            } else {
                              vErrors.push(err140);
                            }
                            errors++;
                          }
                        } else {
                          const err141 = {
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
                            vErrors = [err141];
                          } else {
                            vErrors.push(err141);
                          }
                          errors++;
                        }
                        for (const key25 in data49) {
                          if (key25 !== "profileId" && key25 !== "generation") {
                            const err142 = {
                              instancePath:
                                instancePath +
                                "/operation/selection/owner/" +
                                key25.replace(/~/g, "~0").replace(/\//g, "~1"),
                              schemaPath:
                                "/mapping/execute/properties/operation/mapping/ink/properties/selection/properties/owner",
                              keyword: "properties",
                              params: {
                                error: "additional",
                                additionalProperty: key25,
                              },
                              message: "must NOT have additional properties",
                            };
                            if (vErrors === null) {
                              vErrors = [err142];
                            } else {
                              vErrors.push(err142);
                            }
                            errors++;
                          }
                        }
                      }
                      if (!valid98) {
                        const err143 = {
                          instancePath:
                            instancePath + "/operation/selection/owner",
                          schemaPath:
                            "/mapping/execute/properties/operation/mapping/ink/properties/selection/properties/owner/properties",
                          keyword: "properties",
                          params: { type: "object", nullable: false },
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
                        instancePath: instancePath + "/operation/selection",
                        schemaPath:
                          "/mapping/execute/properties/operation/mapping/ink/properties/selection/properties/owner",
                        keyword: "properties",
                        params: { error: "missing", missingProperty: "owner" },
                        message: "must have property 'owner'",
                      };
                      if (vErrors === null) {
                        vErrors = [err144];
                      } else {
                        vErrors.push(err144);
                      }
                      errors++;
                    }
                    for (const key26 in data46) {
                      if (
                        key26 !== "installationId" &&
                        key26 !== "revision" &&
                        key26 !== "owner"
                      ) {
                        const err145 = {
                          instancePath:
                            instancePath +
                            "/operation/selection/" +
                            key26.replace(/~/g, "~0").replace(/\//g, "~1"),
                          schemaPath:
                            "/mapping/execute/properties/operation/mapping/ink/properties/selection",
                          keyword: "properties",
                          params: {
                            error: "additional",
                            additionalProperty: key26,
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
                  if (!valid96) {
                    const err146 = {
                      instancePath: instancePath + "/operation/selection",
                      schemaPath:
                        "/mapping/execute/properties/operation/mapping/ink/properties/selection/properties",
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
                    instancePath: instancePath + "/operation",
                    schemaPath:
                      "/mapping/execute/properties/operation/mapping/ink/properties/selection",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "selection" },
                    message: "must have property 'selection'",
                  };
                  if (vErrors === null) {
                    vErrors = [err147];
                  } else {
                    vErrors.push(err147);
                  }
                  errors++;
                }
                for (const key27 in data39) {
                  if (
                    key27 !== "kind" &&
                    key27 !== "selection" &&
                    key27 !== "command"
                  ) {
                    const err148 = {
                      instancePath:
                        instancePath +
                        "/operation/" +
                        key27.replace(/~/g, "~0").replace(/\//g, "~1"),
                      schemaPath:
                        "/mapping/execute/properties/operation/mapping/ink",
                      keyword: "properties",
                      params: {
                        error: "additional",
                        additionalProperty: key27,
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
                if (!valid94) {
                  const err149 = {
                    instancePath: instancePath + "/operation",
                    schemaPath:
                      "/mapping/execute/properties/operation/mapping/ink/properties",
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
                var valid93 = _errs58 === errors;
                valid82 = valid93;
              } else {
                const err150 = {
                  instancePath: instancePath + "/operation/kind",
                  schemaPath: "/mapping/execute/properties/operation/mapping",
                  keyword: "discriminator",
                  params: { error: "mapping", tag: "kind", tagValue: tag3 },
                  message: 'value of tag "kind" must be in mapping',
                };
                if (vErrors === null) {
                  vErrors = [err150];
                } else {
                  vErrors.push(err150);
                }
                errors++;
              }
            } else {
              const err151 = {
                instancePath: instancePath + "/operation/kind",
                schemaPath:
                  "/mapping/execute/properties/operation/discriminator",
                keyword: "discriminator",
                params: { error: "tag", tag: "kind", tagValue: tag3 },
                message: 'tag "kind" must be string',
              };
              if (vErrors === null) {
                vErrors = [err151];
              } else {
                vErrors.push(err151);
              }
              errors++;
            }
          } else if (!valid82) {
            const err152 = {
              instancePath: instancePath + "/operation",
              schemaPath: "/mapping/execute/properties/operation/discriminator",
              keyword: "discriminator",
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
            instancePath,
            schemaPath: "/mapping/execute/properties/operation",
            keyword: "properties",
            params: { error: "missing", missingProperty: "operation" },
            message: "must have property 'operation'",
          };
          if (vErrors === null) {
            vErrors = [err153];
          } else {
            vErrors.push(err153);
          }
          errors++;
        }
        for (const key28 in data) {
          if (key28 !== "kind" && key28 !== "id" && key28 !== "operation") {
            const err154 = {
              instancePath:
                instancePath +
                "/" +
                key28.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/execute",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key28 },
              message: "must NOT have additional properties",
            };
            if (vErrors === null) {
              vErrors = [err154];
            } else {
              vErrors.push(err154);
            }
            errors++;
          }
        }
        if (!valid80) {
          const err155 = {
            instancePath,
            schemaPath: "/mapping/execute/properties",
            keyword: "properties",
            params: { type: "object", nullable: false },
            message: "must be object",
          };
          if (vErrors === null) {
            vErrors = [err155];
          } else {
            vErrors.push(err155);
          }
          errors++;
        }
        var valid79 = _errs48 === errors;
        valid0 = valid79;
      } else if (tag0 === "administer") {
        const _errs65 = errors;
        let valid105 = false;
        valid105 = true;
        if (data.id !== undefined) {
          if (!(typeof data.id == "string")) {
            const err156 = {
              instancePath: instancePath + "/id",
              schemaPath: "/mapping/administer/properties/id/type",
              keyword: "type",
              params: { type: "string", nullable: false },
              message: "must be string",
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
            instancePath,
            schemaPath: "/mapping/administer/properties/id",
            keyword: "properties",
            params: { error: "missing", missingProperty: "id" },
            message: "must have property 'id'",
          };
          if (vErrors === null) {
            vErrors = [err157];
          } else {
            vErrors.push(err157);
          }
          errors++;
        }
        for (const key29 in data) {
          if (key29 !== "kind" && key29 !== "id" && key29 !== "command") {
            const err158 = {
              instancePath:
                instancePath +
                "/" +
                key29.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/administer",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key29 },
              message: "must NOT have additional properties",
            };
            if (vErrors === null) {
              vErrors = [err158];
            } else {
              vErrors.push(err158);
            }
            errors++;
          }
        }
        if (!valid105) {
          const err159 = {
            instancePath,
            schemaPath: "/mapping/administer/properties",
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
        var valid104 = _errs65 === errors;
        valid0 = valid104;
      } else if (tag0 === "readDeparture") {
        const _errs67 = errors;
        let valid109 = false;
        valid109 = true;
        if (data.id !== undefined) {
          if (!(typeof data.id == "string")) {
            const err160 = {
              instancePath: instancePath + "/id",
              schemaPath: "/mapping/readDeparture/properties/id/type",
              keyword: "type",
              params: { type: "string", nullable: false },
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
            instancePath,
            schemaPath: "/mapping/readDeparture/properties/id",
            keyword: "properties",
            params: { error: "missing", missingProperty: "id" },
            message: "must have property 'id'",
          };
          if (vErrors === null) {
            vErrors = [err161];
          } else {
            vErrors.push(err161);
          }
          errors++;
        }
        if (data.selection !== undefined) {
          let data54 = data.selection;
          let valid111 = false;
          if (data54 && typeof data54 == "object" && !Array.isArray(data54)) {
            valid111 = true;
            if (data54.installationId !== undefined) {
              if (!(typeof data54.installationId == "string")) {
                const err162 = {
                  instancePath: instancePath + "/selection/installationId",
                  schemaPath:
                    "/mapping/readDeparture/properties/selection/properties/installationId/type",
                  keyword: "type",
                  params: { type: "string", nullable: false },
                  message: "must be string",
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
                instancePath: instancePath + "/selection",
                schemaPath:
                  "/mapping/readDeparture/properties/selection/properties/installationId",
                keyword: "properties",
                params: { error: "missing", missingProperty: "installationId" },
                message: "must have property 'installationId'",
              };
              if (vErrors === null) {
                vErrors = [err163];
              } else {
                vErrors.push(err163);
              }
              errors++;
            }
            if (data54.revision !== undefined) {
              if (!(typeof data54.revision == "string")) {
                const err164 = {
                  instancePath: instancePath + "/selection/revision",
                  schemaPath:
                    "/mapping/readDeparture/properties/selection/properties/revision/type",
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
                instancePath: instancePath + "/selection",
                schemaPath:
                  "/mapping/readDeparture/properties/selection/properties/revision",
                keyword: "properties",
                params: { error: "missing", missingProperty: "revision" },
                message: "must have property 'revision'",
              };
              if (vErrors === null) {
                vErrors = [err165];
              } else {
                vErrors.push(err165);
              }
              errors++;
            }
            if (data54.owner !== undefined) {
              let data57 = data54.owner;
              let valid113 = false;
              if (
                data57 &&
                typeof data57 == "object" &&
                !Array.isArray(data57)
              ) {
                valid113 = true;
                if (data57.profileId !== undefined) {
                  if (!(typeof data57.profileId == "string")) {
                    const err166 = {
                      instancePath: instancePath + "/selection/owner/profileId",
                      schemaPath:
                        "/mapping/readDeparture/properties/selection/properties/owner/properties/profileId/type",
                      keyword: "type",
                      params: { type: "string", nullable: false },
                      message: "must be string",
                    };
                    if (vErrors === null) {
                      vErrors = [err166];
                    } else {
                      vErrors.push(err166);
                    }
                    errors++;
                  }
                } else {
                  const err167 = {
                    instancePath: instancePath + "/selection/owner",
                    schemaPath:
                      "/mapping/readDeparture/properties/selection/properties/owner/properties/profileId",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "profileId" },
                    message: "must have property 'profileId'",
                  };
                  if (vErrors === null) {
                    vErrors = [err167];
                  } else {
                    vErrors.push(err167);
                  }
                  errors++;
                }
                if (data57.generation !== undefined) {
                  if (!(typeof data57.generation == "string")) {
                    const err168 = {
                      instancePath:
                        instancePath + "/selection/owner/generation",
                      schemaPath:
                        "/mapping/readDeparture/properties/selection/properties/owner/properties/generation/type",
                      keyword: "type",
                      params: { type: "string", nullable: false },
                      message: "must be string",
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
                    instancePath: instancePath + "/selection/owner",
                    schemaPath:
                      "/mapping/readDeparture/properties/selection/properties/owner/properties/generation",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "generation" },
                    message: "must have property 'generation'",
                  };
                  if (vErrors === null) {
                    vErrors = [err169];
                  } else {
                    vErrors.push(err169);
                  }
                  errors++;
                }
                for (const key30 in data57) {
                  if (key30 !== "profileId" && key30 !== "generation") {
                    const err170 = {
                      instancePath:
                        instancePath +
                        "/selection/owner/" +
                        key30.replace(/~/g, "~0").replace(/\//g, "~1"),
                      schemaPath:
                        "/mapping/readDeparture/properties/selection/properties/owner",
                      keyword: "properties",
                      params: {
                        error: "additional",
                        additionalProperty: key30,
                      },
                      message: "must NOT have additional properties",
                    };
                    if (vErrors === null) {
                      vErrors = [err170];
                    } else {
                      vErrors.push(err170);
                    }
                    errors++;
                  }
                }
              }
              if (!valid113) {
                const err171 = {
                  instancePath: instancePath + "/selection/owner",
                  schemaPath:
                    "/mapping/readDeparture/properties/selection/properties/owner/properties",
                  keyword: "properties",
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
                instancePath: instancePath + "/selection",
                schemaPath:
                  "/mapping/readDeparture/properties/selection/properties/owner",
                keyword: "properties",
                params: { error: "missing", missingProperty: "owner" },
                message: "must have property 'owner'",
              };
              if (vErrors === null) {
                vErrors = [err172];
              } else {
                vErrors.push(err172);
              }
              errors++;
            }
            for (const key31 in data54) {
              if (
                key31 !== "installationId" &&
                key31 !== "revision" &&
                key31 !== "owner"
              ) {
                const err173 = {
                  instancePath:
                    instancePath +
                    "/selection/" +
                    key31.replace(/~/g, "~0").replace(/\//g, "~1"),
                  schemaPath: "/mapping/readDeparture/properties/selection",
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
          }
          if (!valid111) {
            const err174 = {
              instancePath: instancePath + "/selection",
              schemaPath:
                "/mapping/readDeparture/properties/selection/properties",
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
        } else {
          const err175 = {
            instancePath,
            schemaPath: "/mapping/readDeparture/properties/selection",
            keyword: "properties",
            params: { error: "missing", missingProperty: "selection" },
            message: "must have property 'selection'",
          };
          if (vErrors === null) {
            vErrors = [err175];
          } else {
            vErrors.push(err175);
          }
          errors++;
        }
        for (const key32 in data) {
          if (key32 !== "kind" && key32 !== "id" && key32 !== "selection") {
            const err176 = {
              instancePath:
                instancePath +
                "/" +
                key32.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/readDeparture",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key32 },
              message: "must NOT have additional properties",
            };
            if (vErrors === null) {
              vErrors = [err176];
            } else {
              vErrors.push(err176);
            }
            errors++;
          }
        }
        if (!valid109) {
          const err177 = {
            instancePath,
            schemaPath: "/mapping/readDeparture/properties",
            keyword: "properties",
            params: { type: "object", nullable: false },
            message: "must be object",
          };
          if (vErrors === null) {
            vErrors = [err177];
          } else {
            vErrors.push(err177);
          }
          errors++;
        }
        var valid108 = _errs67 === errors;
        valid0 = valid108;
      } else if (tag0 === "recoverInk") {
        const _errs75 = errors;
        let valid119 = false;
        valid119 = true;
        if (data.id !== undefined) {
          if (!(typeof data.id == "string")) {
            const err178 = {
              instancePath: instancePath + "/id",
              schemaPath: "/mapping/recoverInk/properties/id/type",
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
            instancePath,
            schemaPath: "/mapping/recoverInk/properties/id",
            keyword: "properties",
            params: { error: "missing", missingProperty: "id" },
            message: "must have property 'id'",
          };
          if (vErrors === null) {
            vErrors = [err179];
          } else {
            vErrors.push(err179);
          }
          errors++;
        }
        if (data.recoveryId !== undefined) {
          if (!(typeof data.recoveryId == "string")) {
            const err180 = {
              instancePath: instancePath + "/recoveryId",
              schemaPath: "/mapping/recoverInk/properties/recoveryId/type",
              keyword: "type",
              params: { type: "string", nullable: false },
              message: "must be string",
            };
            if (vErrors === null) {
              vErrors = [err180];
            } else {
              vErrors.push(err180);
            }
            errors++;
          }
        } else {
          const err181 = {
            instancePath,
            schemaPath: "/mapping/recoverInk/properties/recoveryId",
            keyword: "properties",
            params: { error: "missing", missingProperty: "recoveryId" },
            message: "must have property 'recoveryId'",
          };
          if (vErrors === null) {
            vErrors = [err181];
          } else {
            vErrors.push(err181);
          }
          errors++;
        }
        if (data.operation !== undefined) {
          let data62 = data.operation;
          let valid121 = false;
          if (data62 && typeof data62 == "object" && !Array.isArray(data62)) {
            const tag4 = data62.kind;
            if (tag4 === undefined) {
              const err182 = {
                instancePath: instancePath + "/operation",
                schemaPath:
                  "/mapping/recoverInk/properties/operation/discriminator",
                keyword: "discriminator",
                params: { error: "tag", tag: "kind", tagValue: tag4 },
                message: 'tag "kind" must be string',
              };
              if (vErrors === null) {
                vErrors = [err182];
              } else {
                vErrors.push(err182);
              }
              errors++;
            } else if (typeof tag4 == "string") {
              if (tag4 === "teaching") {
                const _errs79 = errors;
                let valid123 = false;
                valid123 = true;
                if (data62.selection !== undefined) {
                  let data63 = data62.selection;
                  let valid125 = false;
                  if (
                    data63 &&
                    typeof data63 == "object" &&
                    !Array.isArray(data63)
                  ) {
                    valid125 = true;
                    if (data63.installationId !== undefined) {
                      if (!(typeof data63.installationId == "string")) {
                        const err183 = {
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
                          vErrors = [err183];
                        } else {
                          vErrors.push(err183);
                        }
                        errors++;
                      }
                    } else {
                      const err184 = {
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
                        vErrors = [err184];
                      } else {
                        vErrors.push(err184);
                      }
                      errors++;
                    }
                    if (data63.revision !== undefined) {
                      if (!(typeof data63.revision == "string")) {
                        const err185 = {
                          instancePath:
                            instancePath + "/operation/selection/revision",
                          schemaPath:
                            "/mapping/recoverInk/properties/operation/mapping/teaching/properties/selection/properties/revision/type",
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
                        vErrors = [err186];
                      } else {
                        vErrors.push(err186);
                      }
                      errors++;
                    }
                    if (data63.owner !== undefined) {
                      let data66 = data63.owner;
                      let valid127 = false;
                      if (
                        data66 &&
                        typeof data66 == "object" &&
                        !Array.isArray(data66)
                      ) {
                        valid127 = true;
                        if (data66.profileId !== undefined) {
                          if (!(typeof data66.profileId == "string")) {
                            const err187 = {
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
                              vErrors = [err187];
                            } else {
                              vErrors.push(err187);
                            }
                            errors++;
                          }
                        } else {
                          const err188 = {
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
                            vErrors = [err188];
                          } else {
                            vErrors.push(err188);
                          }
                          errors++;
                        }
                        if (data66.generation !== undefined) {
                          if (!(typeof data66.generation == "string")) {
                            const err189 = {
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
                              vErrors = [err189];
                            } else {
                              vErrors.push(err189);
                            }
                            errors++;
                          }
                        } else {
                          const err190 = {
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
                            vErrors = [err190];
                          } else {
                            vErrors.push(err190);
                          }
                          errors++;
                        }
                        for (const key33 in data66) {
                          if (key33 !== "profileId" && key33 !== "generation") {
                            const err191 = {
                              instancePath:
                                instancePath +
                                "/operation/selection/owner/" +
                                key33.replace(/~/g, "~0").replace(/\//g, "~1"),
                              schemaPath:
                                "/mapping/recoverInk/properties/operation/mapping/teaching/properties/selection/properties/owner",
                              keyword: "properties",
                              params: {
                                error: "additional",
                                additionalProperty: key33,
                              },
                              message: "must NOT have additional properties",
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
                      if (!valid127) {
                        const err192 = {
                          instancePath:
                            instancePath + "/operation/selection/owner",
                          schemaPath:
                            "/mapping/recoverInk/properties/operation/mapping/teaching/properties/selection/properties/owner/properties",
                          keyword: "properties",
                          params: { type: "object", nullable: false },
                          message: "must be object",
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
                        instancePath: instancePath + "/operation/selection",
                        schemaPath:
                          "/mapping/recoverInk/properties/operation/mapping/teaching/properties/selection/properties/owner",
                        keyword: "properties",
                        params: { error: "missing", missingProperty: "owner" },
                        message: "must have property 'owner'",
                      };
                      if (vErrors === null) {
                        vErrors = [err193];
                      } else {
                        vErrors.push(err193);
                      }
                      errors++;
                    }
                    for (const key34 in data63) {
                      if (
                        key34 !== "installationId" &&
                        key34 !== "revision" &&
                        key34 !== "owner"
                      ) {
                        const err194 = {
                          instancePath:
                            instancePath +
                            "/operation/selection/" +
                            key34.replace(/~/g, "~0").replace(/\//g, "~1"),
                          schemaPath:
                            "/mapping/recoverInk/properties/operation/mapping/teaching/properties/selection",
                          keyword: "properties",
                          params: {
                            error: "additional",
                            additionalProperty: key34,
                          },
                          message: "must NOT have additional properties",
                        };
                        if (vErrors === null) {
                          vErrors = [err194];
                        } else {
                          vErrors.push(err194);
                        }
                        errors++;
                      }
                    }
                  }
                  if (!valid125) {
                    const err195 = {
                      instancePath: instancePath + "/operation/selection",
                      schemaPath:
                        "/mapping/recoverInk/properties/operation/mapping/teaching/properties/selection/properties",
                      keyword: "properties",
                      params: { type: "object", nullable: false },
                      message: "must be object",
                    };
                    if (vErrors === null) {
                      vErrors = [err195];
                    } else {
                      vErrors.push(err195);
                    }
                    errors++;
                  }
                } else {
                  const err196 = {
                    instancePath: instancePath + "/operation",
                    schemaPath:
                      "/mapping/recoverInk/properties/operation/mapping/teaching/properties/selection",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "selection" },
                    message: "must have property 'selection'",
                  };
                  if (vErrors === null) {
                    vErrors = [err196];
                  } else {
                    vErrors.push(err196);
                  }
                  errors++;
                }
                for (const key35 in data62) {
                  if (
                    key35 !== "kind" &&
                    key35 !== "selection" &&
                    key35 !== "command"
                  ) {
                    const err197 = {
                      instancePath:
                        instancePath +
                        "/operation/" +
                        key35.replace(/~/g, "~0").replace(/\//g, "~1"),
                      schemaPath:
                        "/mapping/recoverInk/properties/operation/mapping/teaching",
                      keyword: "properties",
                      params: {
                        error: "additional",
                        additionalProperty: key35,
                      },
                      message: "must NOT have additional properties",
                    };
                    if (vErrors === null) {
                      vErrors = [err197];
                    } else {
                      vErrors.push(err197);
                    }
                    errors++;
                  }
                }
                if (!valid123) {
                  const err198 = {
                    instancePath: instancePath + "/operation",
                    schemaPath:
                      "/mapping/recoverInk/properties/operation/mapping/teaching/properties",
                    keyword: "properties",
                    params: { type: "object", nullable: false },
                    message: "must be object",
                  };
                  if (vErrors === null) {
                    vErrors = [err198];
                  } else {
                    vErrors.push(err198);
                  }
                  errors++;
                }
                var valid122 = _errs79 === errors;
                valid121 = valid122;
              } else if (tag4 === "ink") {
                const _errs86 = errors;
                let valid133 = false;
                valid133 = true;
                if (data62.selection !== undefined) {
                  let data69 = data62.selection;
                  let valid135 = false;
                  if (
                    data69 &&
                    typeof data69 == "object" &&
                    !Array.isArray(data69)
                  ) {
                    valid135 = true;
                    if (data69.installationId !== undefined) {
                      if (!(typeof data69.installationId == "string")) {
                        const err199 = {
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
                          vErrors = [err199];
                        } else {
                          vErrors.push(err199);
                        }
                        errors++;
                      }
                    } else {
                      const err200 = {
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
                        vErrors = [err200];
                      } else {
                        vErrors.push(err200);
                      }
                      errors++;
                    }
                    if (data69.revision !== undefined) {
                      if (!(typeof data69.revision == "string")) {
                        const err201 = {
                          instancePath:
                            instancePath + "/operation/selection/revision",
                          schemaPath:
                            "/mapping/recoverInk/properties/operation/mapping/ink/properties/selection/properties/revision/type",
                          keyword: "type",
                          params: { type: "string", nullable: false },
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
                        vErrors = [err202];
                      } else {
                        vErrors.push(err202);
                      }
                      errors++;
                    }
                    if (data69.owner !== undefined) {
                      let data72 = data69.owner;
                      let valid137 = false;
                      if (
                        data72 &&
                        typeof data72 == "object" &&
                        !Array.isArray(data72)
                      ) {
                        valid137 = true;
                        if (data72.profileId !== undefined) {
                          if (!(typeof data72.profileId == "string")) {
                            const err203 = {
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
                              vErrors = [err203];
                            } else {
                              vErrors.push(err203);
                            }
                            errors++;
                          }
                        } else {
                          const err204 = {
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
                            vErrors = [err204];
                          } else {
                            vErrors.push(err204);
                          }
                          errors++;
                        }
                        if (data72.generation !== undefined) {
                          if (!(typeof data72.generation == "string")) {
                            const err205 = {
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
                              vErrors = [err205];
                            } else {
                              vErrors.push(err205);
                            }
                            errors++;
                          }
                        } else {
                          const err206 = {
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
                            vErrors = [err206];
                          } else {
                            vErrors.push(err206);
                          }
                          errors++;
                        }
                        for (const key36 in data72) {
                          if (key36 !== "profileId" && key36 !== "generation") {
                            const err207 = {
                              instancePath:
                                instancePath +
                                "/operation/selection/owner/" +
                                key36.replace(/~/g, "~0").replace(/\//g, "~1"),
                              schemaPath:
                                "/mapping/recoverInk/properties/operation/mapping/ink/properties/selection/properties/owner",
                              keyword: "properties",
                              params: {
                                error: "additional",
                                additionalProperty: key36,
                              },
                              message: "must NOT have additional properties",
                            };
                            if (vErrors === null) {
                              vErrors = [err207];
                            } else {
                              vErrors.push(err207);
                            }
                            errors++;
                          }
                        }
                      }
                      if (!valid137) {
                        const err208 = {
                          instancePath:
                            instancePath + "/operation/selection/owner",
                          schemaPath:
                            "/mapping/recoverInk/properties/operation/mapping/ink/properties/selection/properties/owner/properties",
                          keyword: "properties",
                          params: { type: "object", nullable: false },
                          message: "must be object",
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
                        instancePath: instancePath + "/operation/selection",
                        schemaPath:
                          "/mapping/recoverInk/properties/operation/mapping/ink/properties/selection/properties/owner",
                        keyword: "properties",
                        params: { error: "missing", missingProperty: "owner" },
                        message: "must have property 'owner'",
                      };
                      if (vErrors === null) {
                        vErrors = [err209];
                      } else {
                        vErrors.push(err209);
                      }
                      errors++;
                    }
                    for (const key37 in data69) {
                      if (
                        key37 !== "installationId" &&
                        key37 !== "revision" &&
                        key37 !== "owner"
                      ) {
                        const err210 = {
                          instancePath:
                            instancePath +
                            "/operation/selection/" +
                            key37.replace(/~/g, "~0").replace(/\//g, "~1"),
                          schemaPath:
                            "/mapping/recoverInk/properties/operation/mapping/ink/properties/selection",
                          keyword: "properties",
                          params: {
                            error: "additional",
                            additionalProperty: key37,
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
                  if (!valid135) {
                    const err211 = {
                      instancePath: instancePath + "/operation/selection",
                      schemaPath:
                        "/mapping/recoverInk/properties/operation/mapping/ink/properties/selection/properties",
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
                    instancePath: instancePath + "/operation",
                    schemaPath:
                      "/mapping/recoverInk/properties/operation/mapping/ink/properties/selection",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "selection" },
                    message: "must have property 'selection'",
                  };
                  if (vErrors === null) {
                    vErrors = [err212];
                  } else {
                    vErrors.push(err212);
                  }
                  errors++;
                }
                for (const key38 in data62) {
                  if (
                    key38 !== "kind" &&
                    key38 !== "selection" &&
                    key38 !== "command"
                  ) {
                    const err213 = {
                      instancePath:
                        instancePath +
                        "/operation/" +
                        key38.replace(/~/g, "~0").replace(/\//g, "~1"),
                      schemaPath:
                        "/mapping/recoverInk/properties/operation/mapping/ink",
                      keyword: "properties",
                      params: {
                        error: "additional",
                        additionalProperty: key38,
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
                if (!valid133) {
                  const err214 = {
                    instancePath: instancePath + "/operation",
                    schemaPath:
                      "/mapping/recoverInk/properties/operation/mapping/ink/properties",
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
                var valid132 = _errs86 === errors;
                valid121 = valid132;
              } else {
                const err215 = {
                  instancePath: instancePath + "/operation/kind",
                  schemaPath:
                    "/mapping/recoverInk/properties/operation/mapping",
                  keyword: "discriminator",
                  params: { error: "mapping", tag: "kind", tagValue: tag4 },
                  message: 'value of tag "kind" must be in mapping',
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
                instancePath: instancePath + "/operation/kind",
                schemaPath:
                  "/mapping/recoverInk/properties/operation/discriminator",
                keyword: "discriminator",
                params: { error: "tag", tag: "kind", tagValue: tag4 },
                message: 'tag "kind" must be string',
              };
              if (vErrors === null) {
                vErrors = [err216];
              } else {
                vErrors.push(err216);
              }
              errors++;
            }
          } else if (!valid121) {
            const err217 = {
              instancePath: instancePath + "/operation",
              schemaPath:
                "/mapping/recoverInk/properties/operation/discriminator",
              keyword: "discriminator",
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
        } else {
          const err218 = {
            instancePath,
            schemaPath: "/mapping/recoverInk/properties/operation",
            keyword: "properties",
            params: { error: "missing", missingProperty: "operation" },
            message: "must have property 'operation'",
          };
          if (vErrors === null) {
            vErrors = [err218];
          } else {
            vErrors.push(err218);
          }
          errors++;
        }
        for (const key39 in data) {
          if (
            key39 !== "kind" &&
            key39 !== "id" &&
            key39 !== "recoveryId" &&
            key39 !== "operation"
          ) {
            const err219 = {
              instancePath:
                instancePath +
                "/" +
                key39.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/recoverInk",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key39 },
              message: "must NOT have additional properties",
            };
            if (vErrors === null) {
              vErrors = [err219];
            } else {
              vErrors.push(err219);
            }
            errors++;
          }
        }
        if (!valid119) {
          const err220 = {
            instancePath,
            schemaPath: "/mapping/recoverInk/properties",
            keyword: "properties",
            params: { type: "object", nullable: false },
            message: "must be object",
          };
          if (vErrors === null) {
            vErrors = [err220];
          } else {
            vErrors.push(err220);
          }
          errors++;
        }
        var valid118 = _errs75 === errors;
        valid0 = valid118;
      } else if (tag0 === "recoverTeaching") {
        const _errs93 = errors;
        let valid144 = false;
        valid144 = true;
        if (data.id !== undefined) {
          if (!(typeof data.id == "string")) {
            const err221 = {
              instancePath: instancePath + "/id",
              schemaPath: "/mapping/recoverTeaching/properties/id/type",
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
            instancePath,
            schemaPath: "/mapping/recoverTeaching/properties/id",
            keyword: "properties",
            params: { error: "missing", missingProperty: "id" },
            message: "must have property 'id'",
          };
          if (vErrors === null) {
            vErrors = [err222];
          } else {
            vErrors.push(err222);
          }
          errors++;
        }
        if (data.recoveryId !== undefined) {
          if (!(typeof data.recoveryId == "string")) {
            const err223 = {
              instancePath: instancePath + "/recoveryId",
              schemaPath: "/mapping/recoverTeaching/properties/recoveryId/type",
              keyword: "type",
              params: { type: "string", nullable: false },
              message: "must be string",
            };
            if (vErrors === null) {
              vErrors = [err223];
            } else {
              vErrors.push(err223);
            }
            errors++;
          }
        } else {
          const err224 = {
            instancePath,
            schemaPath: "/mapping/recoverTeaching/properties/recoveryId",
            keyword: "properties",
            params: { error: "missing", missingProperty: "recoveryId" },
            message: "must have property 'recoveryId'",
          };
          if (vErrors === null) {
            vErrors = [err224];
          } else {
            vErrors.push(err224);
          }
          errors++;
        }
        if (data.operation !== undefined) {
          let data77 = data.operation;
          let valid146 = false;
          if (data77 && typeof data77 == "object" && !Array.isArray(data77)) {
            const tag5 = data77.kind;
            if (tag5 === undefined) {
              const err225 = {
                instancePath: instancePath + "/operation",
                schemaPath:
                  "/mapping/recoverTeaching/properties/operation/discriminator",
                keyword: "discriminator",
                params: { error: "tag", tag: "kind", tagValue: tag5 },
                message: 'tag "kind" must be string',
              };
              if (vErrors === null) {
                vErrors = [err225];
              } else {
                vErrors.push(err225);
              }
              errors++;
            } else if (typeof tag5 == "string") {
              if (tag5 === "teaching") {
                const _errs97 = errors;
                let valid148 = false;
                valid148 = true;
                if (data77.selection !== undefined) {
                  let data78 = data77.selection;
                  let valid150 = false;
                  if (
                    data78 &&
                    typeof data78 == "object" &&
                    !Array.isArray(data78)
                  ) {
                    valid150 = true;
                    if (data78.installationId !== undefined) {
                      if (!(typeof data78.installationId == "string")) {
                        const err226 = {
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
                          vErrors = [err226];
                        } else {
                          vErrors.push(err226);
                        }
                        errors++;
                      }
                    } else {
                      const err227 = {
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
                        vErrors = [err227];
                      } else {
                        vErrors.push(err227);
                      }
                      errors++;
                    }
                    if (data78.revision !== undefined) {
                      if (!(typeof data78.revision == "string")) {
                        const err228 = {
                          instancePath:
                            instancePath + "/operation/selection/revision",
                          schemaPath:
                            "/mapping/recoverTeaching/properties/operation/mapping/teaching/properties/selection/properties/revision/type",
                          keyword: "type",
                          params: { type: "string", nullable: false },
                          message: "must be string",
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
                        vErrors = [err229];
                      } else {
                        vErrors.push(err229);
                      }
                      errors++;
                    }
                    if (data78.owner !== undefined) {
                      let data81 = data78.owner;
                      let valid152 = false;
                      if (
                        data81 &&
                        typeof data81 == "object" &&
                        !Array.isArray(data81)
                      ) {
                        valid152 = true;
                        if (data81.profileId !== undefined) {
                          if (!(typeof data81.profileId == "string")) {
                            const err230 = {
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
                              vErrors = [err230];
                            } else {
                              vErrors.push(err230);
                            }
                            errors++;
                          }
                        } else {
                          const err231 = {
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
                            vErrors = [err231];
                          } else {
                            vErrors.push(err231);
                          }
                          errors++;
                        }
                        if (data81.generation !== undefined) {
                          if (!(typeof data81.generation == "string")) {
                            const err232 = {
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
                              vErrors = [err232];
                            } else {
                              vErrors.push(err232);
                            }
                            errors++;
                          }
                        } else {
                          const err233 = {
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
                            vErrors = [err233];
                          } else {
                            vErrors.push(err233);
                          }
                          errors++;
                        }
                        for (const key40 in data81) {
                          if (key40 !== "profileId" && key40 !== "generation") {
                            const err234 = {
                              instancePath:
                                instancePath +
                                "/operation/selection/owner/" +
                                key40.replace(/~/g, "~0").replace(/\//g, "~1"),
                              schemaPath:
                                "/mapping/recoverTeaching/properties/operation/mapping/teaching/properties/selection/properties/owner",
                              keyword: "properties",
                              params: {
                                error: "additional",
                                additionalProperty: key40,
                              },
                              message: "must NOT have additional properties",
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
                      if (!valid152) {
                        const err235 = {
                          instancePath:
                            instancePath + "/operation/selection/owner",
                          schemaPath:
                            "/mapping/recoverTeaching/properties/operation/mapping/teaching/properties/selection/properties/owner/properties",
                          keyword: "properties",
                          params: { type: "object", nullable: false },
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
                        instancePath: instancePath + "/operation/selection",
                        schemaPath:
                          "/mapping/recoverTeaching/properties/operation/mapping/teaching/properties/selection/properties/owner",
                        keyword: "properties",
                        params: { error: "missing", missingProperty: "owner" },
                        message: "must have property 'owner'",
                      };
                      if (vErrors === null) {
                        vErrors = [err236];
                      } else {
                        vErrors.push(err236);
                      }
                      errors++;
                    }
                    for (const key41 in data78) {
                      if (
                        key41 !== "installationId" &&
                        key41 !== "revision" &&
                        key41 !== "owner"
                      ) {
                        const err237 = {
                          instancePath:
                            instancePath +
                            "/operation/selection/" +
                            key41.replace(/~/g, "~0").replace(/\//g, "~1"),
                          schemaPath:
                            "/mapping/recoverTeaching/properties/operation/mapping/teaching/properties/selection",
                          keyword: "properties",
                          params: {
                            error: "additional",
                            additionalProperty: key41,
                          },
                          message: "must NOT have additional properties",
                        };
                        if (vErrors === null) {
                          vErrors = [err237];
                        } else {
                          vErrors.push(err237);
                        }
                        errors++;
                      }
                    }
                  }
                  if (!valid150) {
                    const err238 = {
                      instancePath: instancePath + "/operation/selection",
                      schemaPath:
                        "/mapping/recoverTeaching/properties/operation/mapping/teaching/properties/selection/properties",
                      keyword: "properties",
                      params: { type: "object", nullable: false },
                      message: "must be object",
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
                    instancePath: instancePath + "/operation",
                    schemaPath:
                      "/mapping/recoverTeaching/properties/operation/mapping/teaching/properties/selection",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "selection" },
                    message: "must have property 'selection'",
                  };
                  if (vErrors === null) {
                    vErrors = [err239];
                  } else {
                    vErrors.push(err239);
                  }
                  errors++;
                }
                for (const key42 in data77) {
                  if (
                    key42 !== "kind" &&
                    key42 !== "selection" &&
                    key42 !== "command"
                  ) {
                    const err240 = {
                      instancePath:
                        instancePath +
                        "/operation/" +
                        key42.replace(/~/g, "~0").replace(/\//g, "~1"),
                      schemaPath:
                        "/mapping/recoverTeaching/properties/operation/mapping/teaching",
                      keyword: "properties",
                      params: {
                        error: "additional",
                        additionalProperty: key42,
                      },
                      message: "must NOT have additional properties",
                    };
                    if (vErrors === null) {
                      vErrors = [err240];
                    } else {
                      vErrors.push(err240);
                    }
                    errors++;
                  }
                }
                if (!valid148) {
                  const err241 = {
                    instancePath: instancePath + "/operation",
                    schemaPath:
                      "/mapping/recoverTeaching/properties/operation/mapping/teaching/properties",
                    keyword: "properties",
                    params: { type: "object", nullable: false },
                    message: "must be object",
                  };
                  if (vErrors === null) {
                    vErrors = [err241];
                  } else {
                    vErrors.push(err241);
                  }
                  errors++;
                }
                var valid147 = _errs97 === errors;
                valid146 = valid147;
              } else if (tag5 === "ink") {
                const _errs104 = errors;
                let valid158 = false;
                valid158 = true;
                if (data77.selection !== undefined) {
                  let data84 = data77.selection;
                  let valid160 = false;
                  if (
                    data84 &&
                    typeof data84 == "object" &&
                    !Array.isArray(data84)
                  ) {
                    valid160 = true;
                    if (data84.installationId !== undefined) {
                      if (!(typeof data84.installationId == "string")) {
                        const err242 = {
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
                          vErrors = [err242];
                        } else {
                          vErrors.push(err242);
                        }
                        errors++;
                      }
                    } else {
                      const err243 = {
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
                        vErrors = [err243];
                      } else {
                        vErrors.push(err243);
                      }
                      errors++;
                    }
                    if (data84.revision !== undefined) {
                      if (!(typeof data84.revision == "string")) {
                        const err244 = {
                          instancePath:
                            instancePath + "/operation/selection/revision",
                          schemaPath:
                            "/mapping/recoverTeaching/properties/operation/mapping/ink/properties/selection/properties/revision/type",
                          keyword: "type",
                          params: { type: "string", nullable: false },
                          message: "must be string",
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
                        vErrors = [err245];
                      } else {
                        vErrors.push(err245);
                      }
                      errors++;
                    }
                    if (data84.owner !== undefined) {
                      let data87 = data84.owner;
                      let valid162 = false;
                      if (
                        data87 &&
                        typeof data87 == "object" &&
                        !Array.isArray(data87)
                      ) {
                        valid162 = true;
                        if (data87.profileId !== undefined) {
                          if (!(typeof data87.profileId == "string")) {
                            const err246 = {
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
                              vErrors = [err246];
                            } else {
                              vErrors.push(err246);
                            }
                            errors++;
                          }
                        } else {
                          const err247 = {
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
                            vErrors = [err247];
                          } else {
                            vErrors.push(err247);
                          }
                          errors++;
                        }
                        if (data87.generation !== undefined) {
                          if (!(typeof data87.generation == "string")) {
                            const err248 = {
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
                              vErrors = [err248];
                            } else {
                              vErrors.push(err248);
                            }
                            errors++;
                          }
                        } else {
                          const err249 = {
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
                            vErrors = [err249];
                          } else {
                            vErrors.push(err249);
                          }
                          errors++;
                        }
                        for (const key43 in data87) {
                          if (key43 !== "profileId" && key43 !== "generation") {
                            const err250 = {
                              instancePath:
                                instancePath +
                                "/operation/selection/owner/" +
                                key43.replace(/~/g, "~0").replace(/\//g, "~1"),
                              schemaPath:
                                "/mapping/recoverTeaching/properties/operation/mapping/ink/properties/selection/properties/owner",
                              keyword: "properties",
                              params: {
                                error: "additional",
                                additionalProperty: key43,
                              },
                              message: "must NOT have additional properties",
                            };
                            if (vErrors === null) {
                              vErrors = [err250];
                            } else {
                              vErrors.push(err250);
                            }
                            errors++;
                          }
                        }
                      }
                      if (!valid162) {
                        const err251 = {
                          instancePath:
                            instancePath + "/operation/selection/owner",
                          schemaPath:
                            "/mapping/recoverTeaching/properties/operation/mapping/ink/properties/selection/properties/owner/properties",
                          keyword: "properties",
                          params: { type: "object", nullable: false },
                          message: "must be object",
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
                        instancePath: instancePath + "/operation/selection",
                        schemaPath:
                          "/mapping/recoverTeaching/properties/operation/mapping/ink/properties/selection/properties/owner",
                        keyword: "properties",
                        params: { error: "missing", missingProperty: "owner" },
                        message: "must have property 'owner'",
                      };
                      if (vErrors === null) {
                        vErrors = [err252];
                      } else {
                        vErrors.push(err252);
                      }
                      errors++;
                    }
                    for (const key44 in data84) {
                      if (
                        key44 !== "installationId" &&
                        key44 !== "revision" &&
                        key44 !== "owner"
                      ) {
                        const err253 = {
                          instancePath:
                            instancePath +
                            "/operation/selection/" +
                            key44.replace(/~/g, "~0").replace(/\//g, "~1"),
                          schemaPath:
                            "/mapping/recoverTeaching/properties/operation/mapping/ink/properties/selection",
                          keyword: "properties",
                          params: {
                            error: "additional",
                            additionalProperty: key44,
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
                  if (!valid160) {
                    const err254 = {
                      instancePath: instancePath + "/operation/selection",
                      schemaPath:
                        "/mapping/recoverTeaching/properties/operation/mapping/ink/properties/selection/properties",
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
                    instancePath: instancePath + "/operation",
                    schemaPath:
                      "/mapping/recoverTeaching/properties/operation/mapping/ink/properties/selection",
                    keyword: "properties",
                    params: { error: "missing", missingProperty: "selection" },
                    message: "must have property 'selection'",
                  };
                  if (vErrors === null) {
                    vErrors = [err255];
                  } else {
                    vErrors.push(err255);
                  }
                  errors++;
                }
                for (const key45 in data77) {
                  if (
                    key45 !== "kind" &&
                    key45 !== "selection" &&
                    key45 !== "command"
                  ) {
                    const err256 = {
                      instancePath:
                        instancePath +
                        "/operation/" +
                        key45.replace(/~/g, "~0").replace(/\//g, "~1"),
                      schemaPath:
                        "/mapping/recoverTeaching/properties/operation/mapping/ink",
                      keyword: "properties",
                      params: {
                        error: "additional",
                        additionalProperty: key45,
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
                if (!valid158) {
                  const err257 = {
                    instancePath: instancePath + "/operation",
                    schemaPath:
                      "/mapping/recoverTeaching/properties/operation/mapping/ink/properties",
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
                var valid157 = _errs104 === errors;
                valid146 = valid157;
              } else {
                const err258 = {
                  instancePath: instancePath + "/operation/kind",
                  schemaPath:
                    "/mapping/recoverTeaching/properties/operation/mapping",
                  keyword: "discriminator",
                  params: { error: "mapping", tag: "kind", tagValue: tag5 },
                  message: 'value of tag "kind" must be in mapping',
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
                instancePath: instancePath + "/operation/kind",
                schemaPath:
                  "/mapping/recoverTeaching/properties/operation/discriminator",
                keyword: "discriminator",
                params: { error: "tag", tag: "kind", tagValue: tag5 },
                message: 'tag "kind" must be string',
              };
              if (vErrors === null) {
                vErrors = [err259];
              } else {
                vErrors.push(err259);
              }
              errors++;
            }
          } else if (!valid146) {
            const err260 = {
              instancePath: instancePath + "/operation",
              schemaPath:
                "/mapping/recoverTeaching/properties/operation/discriminator",
              keyword: "discriminator",
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
        } else {
          const err261 = {
            instancePath,
            schemaPath: "/mapping/recoverTeaching/properties/operation",
            keyword: "properties",
            params: { error: "missing", missingProperty: "operation" },
            message: "must have property 'operation'",
          };
          if (vErrors === null) {
            vErrors = [err261];
          } else {
            vErrors.push(err261);
          }
          errors++;
        }
        for (const key46 in data) {
          if (
            key46 !== "kind" &&
            key46 !== "id" &&
            key46 !== "recoveryId" &&
            key46 !== "operation"
          ) {
            const err262 = {
              instancePath:
                instancePath +
                "/" +
                key46.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/recoverTeaching",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key46 },
              message: "must NOT have additional properties",
            };
            if (vErrors === null) {
              vErrors = [err262];
            } else {
              vErrors.push(err262);
            }
            errors++;
          }
        }
        if (!valid144) {
          const err263 = {
            instancePath,
            schemaPath: "/mapping/recoverTeaching/properties",
            keyword: "properties",
            params: { type: "object", nullable: false },
            message: "must be object",
          };
          if (vErrors === null) {
            vErrors = [err263];
          } else {
            vErrors.push(err263);
          }
          errors++;
        }
        var valid143 = _errs93 === errors;
        valid0 = valid143;
      } else if (tag0 === "recoverAdministration") {
        const _errs111 = errors;
        let valid169 = false;
        valid169 = true;
        if (data.id !== undefined) {
          if (!(typeof data.id == "string")) {
            const err264 = {
              instancePath: instancePath + "/id",
              schemaPath: "/mapping/recoverAdministration/properties/id/type",
              keyword: "type",
              params: { type: "string", nullable: false },
              message: "must be string",
            };
            if (vErrors === null) {
              vErrors = [err264];
            } else {
              vErrors.push(err264);
            }
            errors++;
          }
        } else {
          const err265 = {
            instancePath,
            schemaPath: "/mapping/recoverAdministration/properties/id",
            keyword: "properties",
            params: { error: "missing", missingProperty: "id" },
            message: "must have property 'id'",
          };
          if (vErrors === null) {
            vErrors = [err265];
          } else {
            vErrors.push(err265);
          }
          errors++;
        }
        if (data.recoveryId !== undefined) {
          if (!(typeof data.recoveryId == "string")) {
            const err266 = {
              instancePath: instancePath + "/recoveryId",
              schemaPath:
                "/mapping/recoverAdministration/properties/recoveryId/type",
              keyword: "type",
              params: { type: "string", nullable: false },
              message: "must be string",
            };
            if (vErrors === null) {
              vErrors = [err266];
            } else {
              vErrors.push(err266);
            }
            errors++;
          }
        } else {
          const err267 = {
            instancePath,
            schemaPath: "/mapping/recoverAdministration/properties/recoveryId",
            keyword: "properties",
            params: { error: "missing", missingProperty: "recoveryId" },
            message: "must have property 'recoveryId'",
          };
          if (vErrors === null) {
            vErrors = [err267];
          } else {
            vErrors.push(err267);
          }
          errors++;
        }
        for (const key47 in data) {
          if (
            key47 !== "kind" &&
            key47 !== "id" &&
            key47 !== "recoveryId" &&
            key47 !== "command"
          ) {
            const err268 = {
              instancePath:
                instancePath +
                "/" +
                key47.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/recoverAdministration",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key47 },
              message: "must NOT have additional properties",
            };
            if (vErrors === null) {
              vErrors = [err268];
            } else {
              vErrors.push(err268);
            }
            errors++;
          }
        }
        if (!valid169) {
          const err269 = {
            instancePath,
            schemaPath: "/mapping/recoverAdministration/properties",
            keyword: "properties",
            params: { type: "object", nullable: false },
            message: "must be object",
          };
          if (vErrors === null) {
            vErrors = [err269];
          } else {
            vErrors.push(err269);
          }
          errors++;
        }
        var valid168 = _errs111 === errors;
        valid0 = valid168;
      } else if (tag0 === "reconcileRecovery") {
        const _errs114 = errors;
        let valid173 = false;
        valid173 = true;
        if (data.id !== undefined) {
          if (!(typeof data.id == "string")) {
            const err270 = {
              instancePath: instancePath + "/id",
              schemaPath: "/mapping/reconcileRecovery/properties/id/type",
              keyword: "type",
              params: { type: "string", nullable: false },
              message: "must be string",
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
            instancePath,
            schemaPath: "/mapping/reconcileRecovery/properties/id",
            keyword: "properties",
            params: { error: "missing", missingProperty: "id" },
            message: "must have property 'id'",
          };
          if (vErrors === null) {
            vErrors = [err271];
          } else {
            vErrors.push(err271);
          }
          errors++;
        }
        if (data.recoveryId !== undefined) {
          if (!(typeof data.recoveryId == "string")) {
            const err272 = {
              instancePath: instancePath + "/recoveryId",
              schemaPath:
                "/mapping/reconcileRecovery/properties/recoveryId/type",
              keyword: "type",
              params: { type: "string", nullable: false },
              message: "must be string",
            };
            if (vErrors === null) {
              vErrors = [err272];
            } else {
              vErrors.push(err272);
            }
            errors++;
          }
        } else {
          const err273 = {
            instancePath,
            schemaPath: "/mapping/reconcileRecovery/properties/recoveryId",
            keyword: "properties",
            params: { error: "missing", missingProperty: "recoveryId" },
            message: "must have property 'recoveryId'",
          };
          if (vErrors === null) {
            vErrors = [err273];
          } else {
            vErrors.push(err273);
          }
          errors++;
        }
        for (const key48 in data) {
          if (
            key48 !== "kind" &&
            key48 !== "id" &&
            key48 !== "recoveryId" &&
            key48 !== "choice"
          ) {
            const err274 = {
              instancePath:
                instancePath +
                "/" +
                key48.replace(/~/g, "~0").replace(/\//g, "~1"),
              schemaPath: "/mapping/reconcileRecovery",
              keyword: "properties",
              params: { error: "additional", additionalProperty: key48 },
              message: "must NOT have additional properties",
            };
            if (vErrors === null) {
              vErrors = [err274];
            } else {
              vErrors.push(err274);
            }
            errors++;
          }
        }
        if (!valid173) {
          const err275 = {
            instancePath,
            schemaPath: "/mapping/reconcileRecovery/properties",
            keyword: "properties",
            params: { type: "object", nullable: false },
            message: "must be object",
          };
          if (vErrors === null) {
            vErrors = [err275];
          } else {
            vErrors.push(err275);
          }
          errors++;
        }
        var valid172 = _errs114 === errors;
        valid0 = valid172;
      } else {
        const err276 = {
          instancePath: instancePath + "/kind",
          schemaPath: "/mapping",
          keyword: "discriminator",
          params: { error: "mapping", tag: "kind", tagValue: tag0 },
          message: 'value of tag "kind" must be in mapping',
        };
        if (vErrors === null) {
          vErrors = [err276];
        } else {
          vErrors.push(err276);
        }
        errors++;
      }
    } else {
      const err277 = {
        instancePath: instancePath + "/kind",
        schemaPath: "/discriminator",
        keyword: "discriminator",
        params: { error: "tag", tag: "kind", tagValue: tag0 },
        message: 'tag "kind" must be string',
      };
      if (vErrors === null) {
        vErrors = [err277];
      } else {
        vErrors.push(err277);
      }
      errors++;
    }
  } else if (!valid0) {
    const err278 = {
      instancePath,
      schemaPath: "/discriminator",
      keyword: "discriminator",
      params: { type: "object", nullable: false },
      message: "must be object",
    };
    if (vErrors === null) {
      vErrors = [err278];
    } else {
      vErrors.push(err278);
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
