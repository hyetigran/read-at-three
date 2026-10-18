"use strict";
export const validatePublicationEnvelope = validate57;
const schema29 = {
  properties: {
    formatVersion: { type: "uint32" },
    body: {
      properties: {
        courseId: { type: "string" },
        releaseId: { type: "string" },
        contentSchemaVersion: { type: "uint32" },
        requiredEngineCapabilities: { elements: { type: "string" } },
        lessonIds: { elements: { type: "string" } },
        curriculum: {
          properties: {
            path: { type: "string" },
            sha256: { type: "string" },
            byteLength: { type: "uint32" },
            mediaType: {
              enum: [
                "application/json",
                "image/svg+xml",
                "image/png",
                "image/webp",
                "audio/mpeg",
                "audio/ogg",
              ],
            },
          },
        },
        assets: {
          elements: {
            properties: {
              path: { type: "string" },
              sha256: { type: "string" },
              byteLength: { type: "uint32" },
              mediaType: {
                enum: [
                  "application/json",
                  "image/svg+xml",
                  "image/png",
                  "image/webp",
                  "audio/mpeg",
                  "audio/ogg",
                ],
              },
              assetId: { type: "string" },
            },
          },
        },
        sourceReviewManifestHash: { type: "string" },
        compatibilityMappings: {
          elements: {
            properties: {
              fromReleaseId: { type: "string" },
              fromLessonId: { type: "string" },
              toLessonId: { type: "string" },
            },
          },
        },
        progressMappings: {
          elements: {
            properties: {
              fromReleaseId: { type: "string" },
              fromLessonId: { type: "string" },
              toLessonId: { type: "string" },
            },
          },
        },
      },
    },
    packageHash: { type: "string" },
    signingKeyId: { type: "string" },
    signature: { type: "string" },
  },
};
const func0 = Object.prototype.hasOwnProperty;
function validate57(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {},
) {
  let vErrors = null;
  let errors = 0;
  let valid0 = false;
  if (data && typeof data == "object" && !Array.isArray(data)) {
    valid0 = true;
    var valid1;
    if (data.formatVersion !== undefined) {
      let data0 = data.formatVersion;
      const _errs0 = errors;
      if (!(
        typeof data0 == "number" &&
        isFinite(data0) &&
        !(data0 % 1) &&
        data0 >= 0 &&
        data0 <= 4294967295
      )) {
        validate57.errors = [
          {
            instancePath: instancePath + "/formatVersion",
            schemaPath: "/properties/formatVersion/type",
            keyword: "type",
            params: { type: "uint32", nullable: false },
            message: "must be uint32",
          },
        ];
        return false;
      }
      var valid1 = _errs0 === errors;
    } else {
      valid1 = false;
      validate57.errors = [
        {
          instancePath,
          schemaPath: "/properties/formatVersion",
          keyword: "properties",
          params: { error: "missing", missingProperty: "formatVersion" },
          message: "must have property 'formatVersion'",
        },
      ];
      return false;
    }
    if (valid1) {
      if (data.body !== undefined) {
        let data1 = data.body;
        const _errs1 = errors;
        let valid2 = false;
        if (data1 && typeof data1 == "object" && !Array.isArray(data1)) {
          valid2 = true;
          var valid3;
          if (data1.courseId !== undefined) {
            const _errs2 = errors;
            if (!(typeof data1.courseId == "string")) {
              validate57.errors = [
                {
                  instancePath: instancePath + "/body/courseId",
                  schemaPath: "/properties/body/properties/courseId/type",
                  keyword: "type",
                  params: { type: "string", nullable: false },
                  message: "must be string",
                },
              ];
              return false;
            }
            var valid3 = _errs2 === errors;
          } else {
            valid3 = false;
            validate57.errors = [
              {
                instancePath: instancePath + "/body",
                schemaPath: "/properties/body/properties/courseId",
                keyword: "properties",
                params: { error: "missing", missingProperty: "courseId" },
                message: "must have property 'courseId'",
              },
            ];
            return false;
          }
          if (valid3) {
            if (data1.releaseId !== undefined) {
              const _errs3 = errors;
              if (!(typeof data1.releaseId == "string")) {
                validate57.errors = [
                  {
                    instancePath: instancePath + "/body/releaseId",
                    schemaPath: "/properties/body/properties/releaseId/type",
                    keyword: "type",
                    params: { type: "string", nullable: false },
                    message: "must be string",
                  },
                ];
                return false;
              }
              var valid3 = _errs3 === errors;
            } else {
              valid3 = false;
              validate57.errors = [
                {
                  instancePath: instancePath + "/body",
                  schemaPath: "/properties/body/properties/releaseId",
                  keyword: "properties",
                  params: { error: "missing", missingProperty: "releaseId" },
                  message: "must have property 'releaseId'",
                },
              ];
              return false;
            }
            if (valid3) {
              if (data1.contentSchemaVersion !== undefined) {
                let data4 = data1.contentSchemaVersion;
                const _errs4 = errors;
                if (!(
                  typeof data4 == "number" &&
                  isFinite(data4) &&
                  !(data4 % 1) &&
                  data4 >= 0 &&
                  data4 <= 4294967295
                )) {
                  validate57.errors = [
                    {
                      instancePath: instancePath + "/body/contentSchemaVersion",
                      schemaPath:
                        "/properties/body/properties/contentSchemaVersion/type",
                      keyword: "type",
                      params: { type: "uint32", nullable: false },
                      message: "must be uint32",
                    },
                  ];
                  return false;
                }
                var valid3 = _errs4 === errors;
              } else {
                valid3 = false;
                validate57.errors = [
                  {
                    instancePath: instancePath + "/body",
                    schemaPath:
                      "/properties/body/properties/contentSchemaVersion",
                    keyword: "properties",
                    params: {
                      error: "missing",
                      missingProperty: "contentSchemaVersion",
                    },
                    message: "must have property 'contentSchemaVersion'",
                  },
                ];
                return false;
              }
              if (valid3) {
                if (data1.requiredEngineCapabilities !== undefined) {
                  let data5 = data1.requiredEngineCapabilities;
                  const _errs5 = errors;
                  let valid4 = false;
                  if (!valid4) {
                    if (Array.isArray(data5)) {
                      var valid5 = true;
                      const len0 = data5.length;
                      for (let i0 = 0; i0 < len0; i0++) {
                        const _errs6 = errors;
                        if (!(typeof data5[i0] == "string")) {
                          validate57.errors = [
                            {
                              instancePath:
                                instancePath +
                                "/body/requiredEngineCapabilities/" +
                                i0,
                              schemaPath:
                                "/properties/body/properties/requiredEngineCapabilities/elements/type",
                              keyword: "type",
                              params: { type: "string", nullable: false },
                              message: "must be string",
                            },
                          ];
                          return false;
                        }
                        var valid5 = _errs6 === errors;
                        if (!valid5) {
                          break;
                        }
                      }
                      valid4 = valid5;
                    } else {
                      validate57.errors = [
                        {
                          instancePath:
                            instancePath + "/body/requiredEngineCapabilities",
                          schemaPath:
                            "/properties/body/properties/requiredEngineCapabilities/elements",
                          keyword: "elements",
                          params: { type: "array", nullable: false },
                          message: "must be array",
                        },
                      ];
                      return false;
                    }
                  }
                  var valid3 = _errs5 === errors;
                } else {
                  valid3 = false;
                  validate57.errors = [
                    {
                      instancePath: instancePath + "/body",
                      schemaPath:
                        "/properties/body/properties/requiredEngineCapabilities",
                      keyword: "properties",
                      params: {
                        error: "missing",
                        missingProperty: "requiredEngineCapabilities",
                      },
                      message:
                        "must have property 'requiredEngineCapabilities'",
                    },
                  ];
                  return false;
                }
                if (valid3) {
                  if (data1.lessonIds !== undefined) {
                    let data7 = data1.lessonIds;
                    const _errs7 = errors;
                    let valid6 = false;
                    if (!valid6) {
                      if (Array.isArray(data7)) {
                        var valid7 = true;
                        const len1 = data7.length;
                        for (let i1 = 0; i1 < len1; i1++) {
                          const _errs8 = errors;
                          if (!(typeof data7[i1] == "string")) {
                            validate57.errors = [
                              {
                                instancePath:
                                  instancePath + "/body/lessonIds/" + i1,
                                schemaPath:
                                  "/properties/body/properties/lessonIds/elements/type",
                                keyword: "type",
                                params: { type: "string", nullable: false },
                                message: "must be string",
                              },
                            ];
                            return false;
                          }
                          var valid7 = _errs8 === errors;
                          if (!valid7) {
                            break;
                          }
                        }
                        valid6 = valid7;
                      } else {
                        validate57.errors = [
                          {
                            instancePath: instancePath + "/body/lessonIds",
                            schemaPath:
                              "/properties/body/properties/lessonIds/elements",
                            keyword: "elements",
                            params: { type: "array", nullable: false },
                            message: "must be array",
                          },
                        ];
                        return false;
                      }
                    }
                    var valid3 = _errs7 === errors;
                  } else {
                    valid3 = false;
                    validate57.errors = [
                      {
                        instancePath: instancePath + "/body",
                        schemaPath: "/properties/body/properties/lessonIds",
                        keyword: "properties",
                        params: {
                          error: "missing",
                          missingProperty: "lessonIds",
                        },
                        message: "must have property 'lessonIds'",
                      },
                    ];
                    return false;
                  }
                  if (valid3) {
                    if (data1.curriculum !== undefined) {
                      let data9 = data1.curriculum;
                      const _errs9 = errors;
                      let valid8 = false;
                      if (
                        data9 &&
                        typeof data9 == "object" &&
                        !Array.isArray(data9)
                      ) {
                        valid8 = true;
                        var valid9;
                        if (data9.path !== undefined) {
                          const _errs10 = errors;
                          if (!(typeof data9.path == "string")) {
                            validate57.errors = [
                              {
                                instancePath:
                                  instancePath + "/body/curriculum/path",
                                schemaPath:
                                  "/properties/body/properties/curriculum/properties/path/type",
                                keyword: "type",
                                params: { type: "string", nullable: false },
                                message: "must be string",
                              },
                            ];
                            return false;
                          }
                          var valid9 = _errs10 === errors;
                        } else {
                          valid9 = false;
                          validate57.errors = [
                            {
                              instancePath: instancePath + "/body/curriculum",
                              schemaPath:
                                "/properties/body/properties/curriculum/properties/path",
                              keyword: "properties",
                              params: {
                                error: "missing",
                                missingProperty: "path",
                              },
                              message: "must have property 'path'",
                            },
                          ];
                          return false;
                        }
                        if (valid9) {
                          if (data9.sha256 !== undefined) {
                            const _errs11 = errors;
                            if (!(typeof data9.sha256 == "string")) {
                              validate57.errors = [
                                {
                                  instancePath:
                                    instancePath + "/body/curriculum/sha256",
                                  schemaPath:
                                    "/properties/body/properties/curriculum/properties/sha256/type",
                                  keyword: "type",
                                  params: { type: "string", nullable: false },
                                  message: "must be string",
                                },
                              ];
                              return false;
                            }
                            var valid9 = _errs11 === errors;
                          } else {
                            valid9 = false;
                            validate57.errors = [
                              {
                                instancePath: instancePath + "/body/curriculum",
                                schemaPath:
                                  "/properties/body/properties/curriculum/properties/sha256",
                                keyword: "properties",
                                params: {
                                  error: "missing",
                                  missingProperty: "sha256",
                                },
                                message: "must have property 'sha256'",
                              },
                            ];
                            return false;
                          }
                          if (valid9) {
                            if (data9.byteLength !== undefined) {
                              let data12 = data9.byteLength;
                              const _errs12 = errors;
                              if (!(
                                typeof data12 == "number" &&
                                isFinite(data12) &&
                                !(data12 % 1) &&
                                data12 >= 0 &&
                                data12 <= 4294967295
                              )) {
                                validate57.errors = [
                                  {
                                    instancePath:
                                      instancePath +
                                      "/body/curriculum/byteLength",
                                    schemaPath:
                                      "/properties/body/properties/curriculum/properties/byteLength/type",
                                    keyword: "type",
                                    params: { type: "uint32", nullable: false },
                                    message: "must be uint32",
                                  },
                                ];
                                return false;
                              }
                              var valid9 = _errs12 === errors;
                            } else {
                              valid9 = false;
                              validate57.errors = [
                                {
                                  instancePath:
                                    instancePath + "/body/curriculum",
                                  schemaPath:
                                    "/properties/body/properties/curriculum/properties/byteLength",
                                  keyword: "properties",
                                  params: {
                                    error: "missing",
                                    missingProperty: "byteLength",
                                  },
                                  message: "must have property 'byteLength'",
                                },
                              ];
                              return false;
                            }
                            if (valid9) {
                              if (data9.mediaType !== undefined) {
                                let data13 = data9.mediaType;
                                const _errs13 = errors;
                                if (!(
                                  typeof data13 == "string" &&
                                  (data13 === "application/json" ||
                                    data13 === "image/svg+xml" ||
                                    data13 === "image/png" ||
                                    data13 === "image/webp" ||
                                    data13 === "audio/mpeg" ||
                                    data13 === "audio/ogg")
                                )) {
                                  validate57.errors = [
                                    {
                                      instancePath:
                                        instancePath +
                                        "/body/curriculum/mediaType",
                                      schemaPath:
                                        "/properties/body/properties/curriculum/properties/mediaType/enum",
                                      keyword: "enum",
                                      params: {
                                        allowedValues:
                                          schema29.properties.body.properties
                                            .curriculum.properties.mediaType
                                            .enum,
                                      },
                                      message:
                                        "must be equal to one of the allowed values",
                                    },
                                  ];
                                  return false;
                                }
                                var valid9 = _errs13 === errors;
                              } else {
                                valid9 = false;
                                validate57.errors = [
                                  {
                                    instancePath:
                                      instancePath + "/body/curriculum",
                                    schemaPath:
                                      "/properties/body/properties/curriculum/properties/mediaType",
                                    keyword: "properties",
                                    params: {
                                      error: "missing",
                                      missingProperty: "mediaType",
                                    },
                                    message: "must have property 'mediaType'",
                                  },
                                ];
                                return false;
                              }
                              if (valid9) {
                                for (const key0 in data9) {
                                  if (
                                    key0 !== "path" &&
                                    key0 !== "sha256" &&
                                    key0 !== "byteLength" &&
                                    key0 !== "mediaType"
                                  ) {
                                    validate57.errors = [
                                      {
                                        instancePath:
                                          instancePath +
                                          "/body/curriculum/" +
                                          key0
                                            .replace(/~/g, "~0")
                                            .replace(/\//g, "~1"),
                                        schemaPath:
                                          "/properties/body/properties/curriculum",
                                        keyword: "properties",
                                        params: {
                                          error: "additional",
                                          additionalProperty: key0,
                                        },
                                        message:
                                          "must NOT have additional properties",
                                      },
                                    ];
                                    return false;
                                    break;
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                      if (!valid8) {
                        validate57.errors = [
                          {
                            instancePath: instancePath + "/body/curriculum",
                            schemaPath:
                              "/properties/body/properties/curriculum/properties",
                            keyword: "properties",
                            params: { type: "object", nullable: false },
                            message: "must be object",
                          },
                        ];
                        return false;
                      }
                      var valid3 = _errs9 === errors;
                    } else {
                      valid3 = false;
                      validate57.errors = [
                        {
                          instancePath: instancePath + "/body",
                          schemaPath: "/properties/body/properties/curriculum",
                          keyword: "properties",
                          params: {
                            error: "missing",
                            missingProperty: "curriculum",
                          },
                          message: "must have property 'curriculum'",
                        },
                      ];
                      return false;
                    }
                    if (valid3) {
                      if (data1.assets !== undefined) {
                        let data14 = data1.assets;
                        const _errs14 = errors;
                        let valid11 = false;
                        if (!valid11) {
                          if (Array.isArray(data14)) {
                            var valid12 = true;
                            const len2 = data14.length;
                            for (let i2 = 0; i2 < len2; i2++) {
                              let data15 = data14[i2];
                              const _errs15 = errors;
                              let valid13 = false;
                              if (
                                data15 &&
                                typeof data15 == "object" &&
                                !Array.isArray(data15)
                              ) {
                                valid13 = true;
                                var valid14;
                                if (data15.path !== undefined) {
                                  const _errs16 = errors;
                                  if (!(typeof data15.path == "string")) {
                                    validate57.errors = [
                                      {
                                        instancePath:
                                          instancePath +
                                          "/body/assets/" +
                                          i2 +
                                          "/path",
                                        schemaPath:
                                          "/properties/body/properties/assets/elements/properties/path/type",
                                        keyword: "type",
                                        params: {
                                          type: "string",
                                          nullable: false,
                                        },
                                        message: "must be string",
                                      },
                                    ];
                                    return false;
                                  }
                                  var valid14 = _errs16 === errors;
                                } else {
                                  valid14 = false;
                                  validate57.errors = [
                                    {
                                      instancePath:
                                        instancePath + "/body/assets/" + i2,
                                      schemaPath:
                                        "/properties/body/properties/assets/elements/properties/path",
                                      keyword: "properties",
                                      params: {
                                        error: "missing",
                                        missingProperty: "path",
                                      },
                                      message: "must have property 'path'",
                                    },
                                  ];
                                  return false;
                                }
                                if (valid14) {
                                  if (data15.sha256 !== undefined) {
                                    const _errs17 = errors;
                                    if (!(typeof data15.sha256 == "string")) {
                                      validate57.errors = [
                                        {
                                          instancePath:
                                            instancePath +
                                            "/body/assets/" +
                                            i2 +
                                            "/sha256",
                                          schemaPath:
                                            "/properties/body/properties/assets/elements/properties/sha256/type",
                                          keyword: "type",
                                          params: {
                                            type: "string",
                                            nullable: false,
                                          },
                                          message: "must be string",
                                        },
                                      ];
                                      return false;
                                    }
                                    var valid14 = _errs17 === errors;
                                  } else {
                                    valid14 = false;
                                    validate57.errors = [
                                      {
                                        instancePath:
                                          instancePath + "/body/assets/" + i2,
                                        schemaPath:
                                          "/properties/body/properties/assets/elements/properties/sha256",
                                        keyword: "properties",
                                        params: {
                                          error: "missing",
                                          missingProperty: "sha256",
                                        },
                                        message: "must have property 'sha256'",
                                      },
                                    ];
                                    return false;
                                  }
                                  if (valid14) {
                                    if (data15.byteLength !== undefined) {
                                      let data18 = data15.byteLength;
                                      const _errs18 = errors;
                                      if (!(
                                        typeof data18 == "number" &&
                                        isFinite(data18) &&
                                        !(data18 % 1) &&
                                        data18 >= 0 &&
                                        data18 <= 4294967295
                                      )) {
                                        validate57.errors = [
                                          {
                                            instancePath:
                                              instancePath +
                                              "/body/assets/" +
                                              i2 +
                                              "/byteLength",
                                            schemaPath:
                                              "/properties/body/properties/assets/elements/properties/byteLength/type",
                                            keyword: "type",
                                            params: {
                                              type: "uint32",
                                              nullable: false,
                                            },
                                            message: "must be uint32",
                                          },
                                        ];
                                        return false;
                                      }
                                      var valid14 = _errs18 === errors;
                                    } else {
                                      valid14 = false;
                                      validate57.errors = [
                                        {
                                          instancePath:
                                            instancePath + "/body/assets/" + i2,
                                          schemaPath:
                                            "/properties/body/properties/assets/elements/properties/byteLength",
                                          keyword: "properties",
                                          params: {
                                            error: "missing",
                                            missingProperty: "byteLength",
                                          },
                                          message:
                                            "must have property 'byteLength'",
                                        },
                                      ];
                                      return false;
                                    }
                                    if (valid14) {
                                      if (data15.mediaType !== undefined) {
                                        let data19 = data15.mediaType;
                                        const _errs19 = errors;
                                        if (!(
                                          typeof data19 == "string" &&
                                          (data19 === "application/json" ||
                                            data19 === "image/svg+xml" ||
                                            data19 === "image/png" ||
                                            data19 === "image/webp" ||
                                            data19 === "audio/mpeg" ||
                                            data19 === "audio/ogg")
                                        )) {
                                          validate57.errors = [
                                            {
                                              instancePath:
                                                instancePath +
                                                "/body/assets/" +
                                                i2 +
                                                "/mediaType",
                                              schemaPath:
                                                "/properties/body/properties/assets/elements/properties/mediaType/enum",
                                              keyword: "enum",
                                              params: {
                                                allowedValues:
                                                  schema29.properties.body
                                                    .properties.assets.elements
                                                    .properties.mediaType.enum,
                                              },
                                              message:
                                                "must be equal to one of the allowed values",
                                            },
                                          ];
                                          return false;
                                        }
                                        var valid14 = _errs19 === errors;
                                      } else {
                                        valid14 = false;
                                        validate57.errors = [
                                          {
                                            instancePath:
                                              instancePath +
                                              "/body/assets/" +
                                              i2,
                                            schemaPath:
                                              "/properties/body/properties/assets/elements/properties/mediaType",
                                            keyword: "properties",
                                            params: {
                                              error: "missing",
                                              missingProperty: "mediaType",
                                            },
                                            message:
                                              "must have property 'mediaType'",
                                          },
                                        ];
                                        return false;
                                      }
                                      if (valid14) {
                                        if (data15.assetId !== undefined) {
                                          const _errs20 = errors;
                                          if (
                                            !(typeof data15.assetId == "string")
                                          ) {
                                            validate57.errors = [
                                              {
                                                instancePath:
                                                  instancePath +
                                                  "/body/assets/" +
                                                  i2 +
                                                  "/assetId",
                                                schemaPath:
                                                  "/properties/body/properties/assets/elements/properties/assetId/type",
                                                keyword: "type",
                                                params: {
                                                  type: "string",
                                                  nullable: false,
                                                },
                                                message: "must be string",
                                              },
                                            ];
                                            return false;
                                          }
                                          var valid14 = _errs20 === errors;
                                        } else {
                                          valid14 = false;
                                          validate57.errors = [
                                            {
                                              instancePath:
                                                instancePath +
                                                "/body/assets/" +
                                                i2,
                                              schemaPath:
                                                "/properties/body/properties/assets/elements/properties/assetId",
                                              keyword: "properties",
                                              params: {
                                                error: "missing",
                                                missingProperty: "assetId",
                                              },
                                              message:
                                                "must have property 'assetId'",
                                            },
                                          ];
                                          return false;
                                        }
                                        if (valid14) {
                                          for (const key1 in data15) {
                                            if (
                                              key1 !== "path" &&
                                              key1 !== "sha256" &&
                                              key1 !== "byteLength" &&
                                              key1 !== "mediaType" &&
                                              key1 !== "assetId"
                                            ) {
                                              validate57.errors = [
                                                {
                                                  instancePath:
                                                    instancePath +
                                                    "/body/assets/" +
                                                    i2 +
                                                    "/" +
                                                    key1
                                                      .replace(/~/g, "~0")
                                                      .replace(/\//g, "~1"),
                                                  schemaPath:
                                                    "/properties/body/properties/assets/elements",
                                                  keyword: "properties",
                                                  params: {
                                                    error: "additional",
                                                    additionalProperty: key1,
                                                  },
                                                  message:
                                                    "must NOT have additional properties",
                                                },
                                              ];
                                              return false;
                                              break;
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                              if (!valid13) {
                                validate57.errors = [
                                  {
                                    instancePath:
                                      instancePath + "/body/assets/" + i2,
                                    schemaPath:
                                      "/properties/body/properties/assets/elements/properties",
                                    keyword: "properties",
                                    params: { type: "object", nullable: false },
                                    message: "must be object",
                                  },
                                ];
                                return false;
                              }
                              var valid12 = _errs15 === errors;
                              if (!valid12) {
                                break;
                              }
                            }
                            valid11 = valid12;
                          } else {
                            validate57.errors = [
                              {
                                instancePath: instancePath + "/body/assets",
                                schemaPath:
                                  "/properties/body/properties/assets/elements",
                                keyword: "elements",
                                params: { type: "array", nullable: false },
                                message: "must be array",
                              },
                            ];
                            return false;
                          }
                        }
                        var valid3 = _errs14 === errors;
                      } else {
                        valid3 = false;
                        validate57.errors = [
                          {
                            instancePath: instancePath + "/body",
                            schemaPath: "/properties/body/properties/assets",
                            keyword: "properties",
                            params: {
                              error: "missing",
                              missingProperty: "assets",
                            },
                            message: "must have property 'assets'",
                          },
                        ];
                        return false;
                      }
                      if (valid3) {
                        if (data1.sourceReviewManifestHash !== undefined) {
                          const _errs21 = errors;
                          if (
                            !(typeof data1.sourceReviewManifestHash == "string")
                          ) {
                            validate57.errors = [
                              {
                                instancePath:
                                  instancePath +
                                  "/body/sourceReviewManifestHash",
                                schemaPath:
                                  "/properties/body/properties/sourceReviewManifestHash/type",
                                keyword: "type",
                                params: { type: "string", nullable: false },
                                message: "must be string",
                              },
                            ];
                            return false;
                          }
                          var valid3 = _errs21 === errors;
                        } else {
                          valid3 = false;
                          validate57.errors = [
                            {
                              instancePath: instancePath + "/body",
                              schemaPath:
                                "/properties/body/properties/sourceReviewManifestHash",
                              keyword: "properties",
                              params: {
                                error: "missing",
                                missingProperty: "sourceReviewManifestHash",
                              },
                              message:
                                "must have property 'sourceReviewManifestHash'",
                            },
                          ];
                          return false;
                        }
                        if (valid3) {
                          if (data1.compatibilityMappings !== undefined) {
                            let data22 = data1.compatibilityMappings;
                            const _errs22 = errors;
                            let valid16 = false;
                            if (!valid16) {
                              if (Array.isArray(data22)) {
                                var valid17 = true;
                                const len3 = data22.length;
                                for (let i3 = 0; i3 < len3; i3++) {
                                  let data23 = data22[i3];
                                  const _errs23 = errors;
                                  let valid18 = false;
                                  if (
                                    data23 &&
                                    typeof data23 == "object" &&
                                    !Array.isArray(data23)
                                  ) {
                                    valid18 = true;
                                    var valid19;
                                    if (data23.fromReleaseId !== undefined) {
                                      const _errs24 = errors;
                                      if (
                                        !(
                                          typeof data23.fromReleaseId ==
                                          "string"
                                        )
                                      ) {
                                        validate57.errors = [
                                          {
                                            instancePath:
                                              instancePath +
                                              "/body/compatibilityMappings/" +
                                              i3 +
                                              "/fromReleaseId",
                                            schemaPath:
                                              "/properties/body/properties/compatibilityMappings/elements/properties/fromReleaseId/type",
                                            keyword: "type",
                                            params: {
                                              type: "string",
                                              nullable: false,
                                            },
                                            message: "must be string",
                                          },
                                        ];
                                        return false;
                                      }
                                      var valid19 = _errs24 === errors;
                                    } else {
                                      valid19 = false;
                                      validate57.errors = [
                                        {
                                          instancePath:
                                            instancePath +
                                            "/body/compatibilityMappings/" +
                                            i3,
                                          schemaPath:
                                            "/properties/body/properties/compatibilityMappings/elements/properties/fromReleaseId",
                                          keyword: "properties",
                                          params: {
                                            error: "missing",
                                            missingProperty: "fromReleaseId",
                                          },
                                          message:
                                            "must have property 'fromReleaseId'",
                                        },
                                      ];
                                      return false;
                                    }
                                    if (valid19) {
                                      if (data23.fromLessonId !== undefined) {
                                        const _errs25 = errors;
                                        if (
                                          !(
                                            typeof data23.fromLessonId ==
                                            "string"
                                          )
                                        ) {
                                          validate57.errors = [
                                            {
                                              instancePath:
                                                instancePath +
                                                "/body/compatibilityMappings/" +
                                                i3 +
                                                "/fromLessonId",
                                              schemaPath:
                                                "/properties/body/properties/compatibilityMappings/elements/properties/fromLessonId/type",
                                              keyword: "type",
                                              params: {
                                                type: "string",
                                                nullable: false,
                                              },
                                              message: "must be string",
                                            },
                                          ];
                                          return false;
                                        }
                                        var valid19 = _errs25 === errors;
                                      } else {
                                        valid19 = false;
                                        validate57.errors = [
                                          {
                                            instancePath:
                                              instancePath +
                                              "/body/compatibilityMappings/" +
                                              i3,
                                            schemaPath:
                                              "/properties/body/properties/compatibilityMappings/elements/properties/fromLessonId",
                                            keyword: "properties",
                                            params: {
                                              error: "missing",
                                              missingProperty: "fromLessonId",
                                            },
                                            message:
                                              "must have property 'fromLessonId'",
                                          },
                                        ];
                                        return false;
                                      }
                                      if (valid19) {
                                        if (data23.toLessonId !== undefined) {
                                          const _errs26 = errors;
                                          if (
                                            !(
                                              typeof data23.toLessonId ==
                                              "string"
                                            )
                                          ) {
                                            validate57.errors = [
                                              {
                                                instancePath:
                                                  instancePath +
                                                  "/body/compatibilityMappings/" +
                                                  i3 +
                                                  "/toLessonId",
                                                schemaPath:
                                                  "/properties/body/properties/compatibilityMappings/elements/properties/toLessonId/type",
                                                keyword: "type",
                                                params: {
                                                  type: "string",
                                                  nullable: false,
                                                },
                                                message: "must be string",
                                              },
                                            ];
                                            return false;
                                          }
                                          var valid19 = _errs26 === errors;
                                        } else {
                                          valid19 = false;
                                          validate57.errors = [
                                            {
                                              instancePath:
                                                instancePath +
                                                "/body/compatibilityMappings/" +
                                                i3,
                                              schemaPath:
                                                "/properties/body/properties/compatibilityMappings/elements/properties/toLessonId",
                                              keyword: "properties",
                                              params: {
                                                error: "missing",
                                                missingProperty: "toLessonId",
                                              },
                                              message:
                                                "must have property 'toLessonId'",
                                            },
                                          ];
                                          return false;
                                        }
                                        if (valid19) {
                                          for (const key2 in data23) {
                                            if (
                                              key2 !== "fromReleaseId" &&
                                              key2 !== "fromLessonId" &&
                                              key2 !== "toLessonId"
                                            ) {
                                              validate57.errors = [
                                                {
                                                  instancePath:
                                                    instancePath +
                                                    "/body/compatibilityMappings/" +
                                                    i3 +
                                                    "/" +
                                                    key2
                                                      .replace(/~/g, "~0")
                                                      .replace(/\//g, "~1"),
                                                  schemaPath:
                                                    "/properties/body/properties/compatibilityMappings/elements",
                                                  keyword: "properties",
                                                  params: {
                                                    error: "additional",
                                                    additionalProperty: key2,
                                                  },
                                                  message:
                                                    "must NOT have additional properties",
                                                },
                                              ];
                                              return false;
                                              break;
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }
                                  if (!valid18) {
                                    validate57.errors = [
                                      {
                                        instancePath:
                                          instancePath +
                                          "/body/compatibilityMappings/" +
                                          i3,
                                        schemaPath:
                                          "/properties/body/properties/compatibilityMappings/elements/properties",
                                        keyword: "properties",
                                        params: {
                                          type: "object",
                                          nullable: false,
                                        },
                                        message: "must be object",
                                      },
                                    ];
                                    return false;
                                  }
                                  var valid17 = _errs23 === errors;
                                  if (!valid17) {
                                    break;
                                  }
                                }
                                valid16 = valid17;
                              } else {
                                validate57.errors = [
                                  {
                                    instancePath:
                                      instancePath +
                                      "/body/compatibilityMappings",
                                    schemaPath:
                                      "/properties/body/properties/compatibilityMappings/elements",
                                    keyword: "elements",
                                    params: { type: "array", nullable: false },
                                    message: "must be array",
                                  },
                                ];
                                return false;
                              }
                            }
                            var valid3 = _errs22 === errors;
                          } else {
                            valid3 = false;
                            validate57.errors = [
                              {
                                instancePath: instancePath + "/body",
                                schemaPath:
                                  "/properties/body/properties/compatibilityMappings",
                                keyword: "properties",
                                params: {
                                  error: "missing",
                                  missingProperty: "compatibilityMappings",
                                },
                                message:
                                  "must have property 'compatibilityMappings'",
                              },
                            ];
                            return false;
                          }
                          if (valid3) {
                            if (data1.progressMappings !== undefined) {
                              let data27 = data1.progressMappings;
                              const _errs27 = errors;
                              let valid21 = false;
                              if (!valid21) {
                                if (Array.isArray(data27)) {
                                  var valid22 = true;
                                  const len4 = data27.length;
                                  for (let i4 = 0; i4 < len4; i4++) {
                                    let data28 = data27[i4];
                                    const _errs28 = errors;
                                    let valid23 = false;
                                    if (
                                      data28 &&
                                      typeof data28 == "object" &&
                                      !Array.isArray(data28)
                                    ) {
                                      valid23 = true;
                                      var valid24;
                                      if (data28.fromReleaseId !== undefined) {
                                        const _errs29 = errors;
                                        if (
                                          !(
                                            typeof data28.fromReleaseId ==
                                            "string"
                                          )
                                        ) {
                                          validate57.errors = [
                                            {
                                              instancePath:
                                                instancePath +
                                                "/body/progressMappings/" +
                                                i4 +
                                                "/fromReleaseId",
                                              schemaPath:
                                                "/properties/body/properties/progressMappings/elements/properties/fromReleaseId/type",
                                              keyword: "type",
                                              params: {
                                                type: "string",
                                                nullable: false,
                                              },
                                              message: "must be string",
                                            },
                                          ];
                                          return false;
                                        }
                                        var valid24 = _errs29 === errors;
                                      } else {
                                        valid24 = false;
                                        validate57.errors = [
                                          {
                                            instancePath:
                                              instancePath +
                                              "/body/progressMappings/" +
                                              i4,
                                            schemaPath:
                                              "/properties/body/properties/progressMappings/elements/properties/fromReleaseId",
                                            keyword: "properties",
                                            params: {
                                              error: "missing",
                                              missingProperty: "fromReleaseId",
                                            },
                                            message:
                                              "must have property 'fromReleaseId'",
                                          },
                                        ];
                                        return false;
                                      }
                                      if (valid24) {
                                        if (data28.fromLessonId !== undefined) {
                                          const _errs30 = errors;
                                          if (
                                            !(
                                              typeof data28.fromLessonId ==
                                              "string"
                                            )
                                          ) {
                                            validate57.errors = [
                                              {
                                                instancePath:
                                                  instancePath +
                                                  "/body/progressMappings/" +
                                                  i4 +
                                                  "/fromLessonId",
                                                schemaPath:
                                                  "/properties/body/properties/progressMappings/elements/properties/fromLessonId/type",
                                                keyword: "type",
                                                params: {
                                                  type: "string",
                                                  nullable: false,
                                                },
                                                message: "must be string",
                                              },
                                            ];
                                            return false;
                                          }
                                          var valid24 = _errs30 === errors;
                                        } else {
                                          valid24 = false;
                                          validate57.errors = [
                                            {
                                              instancePath:
                                                instancePath +
                                                "/body/progressMappings/" +
                                                i4,
                                              schemaPath:
                                                "/properties/body/properties/progressMappings/elements/properties/fromLessonId",
                                              keyword: "properties",
                                              params: {
                                                error: "missing",
                                                missingProperty: "fromLessonId",
                                              },
                                              message:
                                                "must have property 'fromLessonId'",
                                            },
                                          ];
                                          return false;
                                        }
                                        if (valid24) {
                                          if (data28.toLessonId !== undefined) {
                                            const _errs31 = errors;
                                            if (
                                              !(
                                                typeof data28.toLessonId ==
                                                "string"
                                              )
                                            ) {
                                              validate57.errors = [
                                                {
                                                  instancePath:
                                                    instancePath +
                                                    "/body/progressMappings/" +
                                                    i4 +
                                                    "/toLessonId",
                                                  schemaPath:
                                                    "/properties/body/properties/progressMappings/elements/properties/toLessonId/type",
                                                  keyword: "type",
                                                  params: {
                                                    type: "string",
                                                    nullable: false,
                                                  },
                                                  message: "must be string",
                                                },
                                              ];
                                              return false;
                                            }
                                            var valid24 = _errs31 === errors;
                                          } else {
                                            valid24 = false;
                                            validate57.errors = [
                                              {
                                                instancePath:
                                                  instancePath +
                                                  "/body/progressMappings/" +
                                                  i4,
                                                schemaPath:
                                                  "/properties/body/properties/progressMappings/elements/properties/toLessonId",
                                                keyword: "properties",
                                                params: {
                                                  error: "missing",
                                                  missingProperty: "toLessonId",
                                                },
                                                message:
                                                  "must have property 'toLessonId'",
                                              },
                                            ];
                                            return false;
                                          }
                                          if (valid24) {
                                            for (const key3 in data28) {
                                              if (
                                                key3 !== "fromReleaseId" &&
                                                key3 !== "fromLessonId" &&
                                                key3 !== "toLessonId"
                                              ) {
                                                validate57.errors = [
                                                  {
                                                    instancePath:
                                                      instancePath +
                                                      "/body/progressMappings/" +
                                                      i4 +
                                                      "/" +
                                                      key3
                                                        .replace(/~/g, "~0")
                                                        .replace(/\//g, "~1"),
                                                    schemaPath:
                                                      "/properties/body/properties/progressMappings/elements",
                                                    keyword: "properties",
                                                    params: {
                                                      error: "additional",
                                                      additionalProperty: key3,
                                                    },
                                                    message:
                                                      "must NOT have additional properties",
                                                  },
                                                ];
                                                return false;
                                                break;
                                              }
                                            }
                                          }
                                        }
                                      }
                                    }
                                    if (!valid23) {
                                      validate57.errors = [
                                        {
                                          instancePath:
                                            instancePath +
                                            "/body/progressMappings/" +
                                            i4,
                                          schemaPath:
                                            "/properties/body/properties/progressMappings/elements/properties",
                                          keyword: "properties",
                                          params: {
                                            type: "object",
                                            nullable: false,
                                          },
                                          message: "must be object",
                                        },
                                      ];
                                      return false;
                                    }
                                    var valid22 = _errs28 === errors;
                                    if (!valid22) {
                                      break;
                                    }
                                  }
                                  valid21 = valid22;
                                } else {
                                  validate57.errors = [
                                    {
                                      instancePath:
                                        instancePath + "/body/progressMappings",
                                      schemaPath:
                                        "/properties/body/properties/progressMappings/elements",
                                      keyword: "elements",
                                      params: {
                                        type: "array",
                                        nullable: false,
                                      },
                                      message: "must be array",
                                    },
                                  ];
                                  return false;
                                }
                              }
                              var valid3 = _errs27 === errors;
                            } else {
                              valid3 = false;
                              validate57.errors = [
                                {
                                  instancePath: instancePath + "/body",
                                  schemaPath:
                                    "/properties/body/properties/progressMappings",
                                  keyword: "properties",
                                  params: {
                                    error: "missing",
                                    missingProperty: "progressMappings",
                                  },
                                  message:
                                    "must have property 'progressMappings'",
                                },
                              ];
                              return false;
                            }
                            if (valid3) {
                              for (const key4 in data1) {
                                if (
                                  !func0.call(
                                    schema29.properties.body.properties,
                                    key4,
                                  )
                                ) {
                                  validate57.errors = [
                                    {
                                      instancePath:
                                        instancePath +
                                        "/body/" +
                                        key4
                                          .replace(/~/g, "~0")
                                          .replace(/\//g, "~1"),
                                      schemaPath: "/properties/body",
                                      keyword: "properties",
                                      params: {
                                        error: "additional",
                                        additionalProperty: key4,
                                      },
                                      message:
                                        "must NOT have additional properties",
                                    },
                                  ];
                                  return false;
                                  break;
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
        if (!valid2) {
          validate57.errors = [
            {
              instancePath: instancePath + "/body",
              schemaPath: "/properties/body/properties",
              keyword: "properties",
              params: { type: "object", nullable: false },
              message: "must be object",
            },
          ];
          return false;
        }
        var valid1 = _errs1 === errors;
      } else {
        valid1 = false;
        validate57.errors = [
          {
            instancePath,
            schemaPath: "/properties/body",
            keyword: "properties",
            params: { error: "missing", missingProperty: "body" },
            message: "must have property 'body'",
          },
        ];
        return false;
      }
      if (valid1) {
        if (data.packageHash !== undefined) {
          const _errs32 = errors;
          if (!(typeof data.packageHash == "string")) {
            validate57.errors = [
              {
                instancePath: instancePath + "/packageHash",
                schemaPath: "/properties/packageHash/type",
                keyword: "type",
                params: { type: "string", nullable: false },
                message: "must be string",
              },
            ];
            return false;
          }
          var valid1 = _errs32 === errors;
        } else {
          valid1 = false;
          validate57.errors = [
            {
              instancePath,
              schemaPath: "/properties/packageHash",
              keyword: "properties",
              params: { error: "missing", missingProperty: "packageHash" },
              message: "must have property 'packageHash'",
            },
          ];
          return false;
        }
        if (valid1) {
          if (data.signingKeyId !== undefined) {
            const _errs33 = errors;
            if (!(typeof data.signingKeyId == "string")) {
              validate57.errors = [
                {
                  instancePath: instancePath + "/signingKeyId",
                  schemaPath: "/properties/signingKeyId/type",
                  keyword: "type",
                  params: { type: "string", nullable: false },
                  message: "must be string",
                },
              ];
              return false;
            }
            var valid1 = _errs33 === errors;
          } else {
            valid1 = false;
            validate57.errors = [
              {
                instancePath,
                schemaPath: "/properties/signingKeyId",
                keyword: "properties",
                params: { error: "missing", missingProperty: "signingKeyId" },
                message: "must have property 'signingKeyId'",
              },
            ];
            return false;
          }
          if (valid1) {
            if (data.signature !== undefined) {
              const _errs34 = errors;
              if (!(typeof data.signature == "string")) {
                validate57.errors = [
                  {
                    instancePath: instancePath + "/signature",
                    schemaPath: "/properties/signature/type",
                    keyword: "type",
                    params: { type: "string", nullable: false },
                    message: "must be string",
                  },
                ];
                return false;
              }
              var valid1 = _errs34 === errors;
            } else {
              valid1 = false;
              validate57.errors = [
                {
                  instancePath,
                  schemaPath: "/properties/signature",
                  keyword: "properties",
                  params: { error: "missing", missingProperty: "signature" },
                  message: "must have property 'signature'",
                },
              ];
              return false;
            }
            if (valid1) {
              for (const key5 in data) {
                if (
                  key5 !== "formatVersion" &&
                  key5 !== "body" &&
                  key5 !== "packageHash" &&
                  key5 !== "signingKeyId" &&
                  key5 !== "signature"
                ) {
                  validate57.errors = [
                    {
                      instancePath:
                        instancePath +
                        "/" +
                        key5.replace(/~/g, "~0").replace(/\//g, "~1"),
                      schemaPath: "",
                      keyword: "properties",
                      params: { error: "additional", additionalProperty: key5 },
                      message: "must NOT have additional properties",
                    },
                  ];
                  return false;
                  break;
                }
              }
            }
          }
        }
      }
    }
  }
  if (!valid0) {
    validate57.errors = [
      {
        instancePath,
        schemaPath: "/properties",
        keyword: "properties",
        params: { type: "object", nullable: false },
        message: "must be object",
      },
    ];
    return false;
  }
  validate57.errors = vErrors;
  return errors === 0;
}
