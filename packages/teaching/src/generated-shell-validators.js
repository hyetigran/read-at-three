"use strict";
export const validateShellDescriptor = validate57;
const schema29 = {
  properties: {
    formatVersion: { type: "uint32" },
    body: {
      properties: {
        formatVersion: { type: "uint32" },
        applicationVersion: { type: "string" },
        bootstrapPolicyVersion: { type: "uint32" },
        mode: { enum: ["fixture", "publication"] },
        serviceWorker: {
          properties: {
            path: { type: "string" },
            sha256: { type: "string" },
            byteLength: { type: "uint32" },
            mediaType: { type: "string" },
          },
        },
        navigation: {
          properties: {
            path: { type: "string" },
            sha256: { type: "string" },
            byteLength: { type: "uint32" },
            mediaType: { type: "string" },
          },
        },
        resources: {
          elements: {
            properties: {
              path: { type: "string" },
              sha256: { type: "string" },
              byteLength: { type: "uint32" },
              mediaType: { type: "string" },
            },
          },
        },
      },
    },
    buildHash: { type: "string" },
    signingKeyId: { type: "string" },
    signature: { type: "string" },
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
          if (data1.formatVersion !== undefined) {
            let data2 = data1.formatVersion;
            const _errs2 = errors;
            if (!(
              typeof data2 == "number" &&
              isFinite(data2) &&
              !(data2 % 1) &&
              data2 >= 0 &&
              data2 <= 4294967295
            )) {
              validate57.errors = [
                {
                  instancePath: instancePath + "/body/formatVersion",
                  schemaPath: "/properties/body/properties/formatVersion/type",
                  keyword: "type",
                  params: { type: "uint32", nullable: false },
                  message: "must be uint32",
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
                schemaPath: "/properties/body/properties/formatVersion",
                keyword: "properties",
                params: { error: "missing", missingProperty: "formatVersion" },
                message: "must have property 'formatVersion'",
              },
            ];
            return false;
          }
          if (valid3) {
            if (data1.applicationVersion !== undefined) {
              const _errs3 = errors;
              if (!(typeof data1.applicationVersion == "string")) {
                validate57.errors = [
                  {
                    instancePath: instancePath + "/body/applicationVersion",
                    schemaPath:
                      "/properties/body/properties/applicationVersion/type",
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
                  schemaPath: "/properties/body/properties/applicationVersion",
                  keyword: "properties",
                  params: {
                    error: "missing",
                    missingProperty: "applicationVersion",
                  },
                  message: "must have property 'applicationVersion'",
                },
              ];
              return false;
            }
            if (valid3) {
              if (data1.bootstrapPolicyVersion !== undefined) {
                let data4 = data1.bootstrapPolicyVersion;
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
                      instancePath:
                        instancePath + "/body/bootstrapPolicyVersion",
                      schemaPath:
                        "/properties/body/properties/bootstrapPolicyVersion/type",
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
                      "/properties/body/properties/bootstrapPolicyVersion",
                    keyword: "properties",
                    params: {
                      error: "missing",
                      missingProperty: "bootstrapPolicyVersion",
                    },
                    message: "must have property 'bootstrapPolicyVersion'",
                  },
                ];
                return false;
              }
              if (valid3) {
                if (data1.mode !== undefined) {
                  let data5 = data1.mode;
                  const _errs5 = errors;
                  if (!(
                    typeof data5 == "string" &&
                    (data5 === "fixture" || data5 === "publication")
                  )) {
                    validate57.errors = [
                      {
                        instancePath: instancePath + "/body/mode",
                        schemaPath: "/properties/body/properties/mode/enum",
                        keyword: "enum",
                        params: {
                          allowedValues:
                            schema29.properties.body.properties.mode.enum,
                        },
                        message: "must be equal to one of the allowed values",
                      },
                    ];
                    return false;
                  }
                  var valid3 = _errs5 === errors;
                } else {
                  valid3 = false;
                  validate57.errors = [
                    {
                      instancePath: instancePath + "/body",
                      schemaPath: "/properties/body/properties/mode",
                      keyword: "properties",
                      params: { error: "missing", missingProperty: "mode" },
                      message: "must have property 'mode'",
                    },
                  ];
                  return false;
                }
                if (valid3) {
                  if (data1.serviceWorker !== undefined) {
                    let data6 = data1.serviceWorker;
                    const _errs6 = errors;
                    let valid4 = false;
                    if (
                      data6 &&
                      typeof data6 == "object" &&
                      !Array.isArray(data6)
                    ) {
                      valid4 = true;
                      var valid5;
                      if (data6.path !== undefined) {
                        const _errs7 = errors;
                        if (!(typeof data6.path == "string")) {
                          validate57.errors = [
                            {
                              instancePath:
                                instancePath + "/body/serviceWorker/path",
                              schemaPath:
                                "/properties/body/properties/serviceWorker/properties/path/type",
                              keyword: "type",
                              params: { type: "string", nullable: false },
                              message: "must be string",
                            },
                          ];
                          return false;
                        }
                        var valid5 = _errs7 === errors;
                      } else {
                        valid5 = false;
                        validate57.errors = [
                          {
                            instancePath: instancePath + "/body/serviceWorker",
                            schemaPath:
                              "/properties/body/properties/serviceWorker/properties/path",
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
                      if (valid5) {
                        if (data6.sha256 !== undefined) {
                          const _errs8 = errors;
                          if (!(typeof data6.sha256 == "string")) {
                            validate57.errors = [
                              {
                                instancePath:
                                  instancePath + "/body/serviceWorker/sha256",
                                schemaPath:
                                  "/properties/body/properties/serviceWorker/properties/sha256/type",
                                keyword: "type",
                                params: { type: "string", nullable: false },
                                message: "must be string",
                              },
                            ];
                            return false;
                          }
                          var valid5 = _errs8 === errors;
                        } else {
                          valid5 = false;
                          validate57.errors = [
                            {
                              instancePath:
                                instancePath + "/body/serviceWorker",
                              schemaPath:
                                "/properties/body/properties/serviceWorker/properties/sha256",
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
                        if (valid5) {
                          if (data6.byteLength !== undefined) {
                            let data9 = data6.byteLength;
                            const _errs9 = errors;
                            if (!(
                              typeof data9 == "number" &&
                              isFinite(data9) &&
                              !(data9 % 1) &&
                              data9 >= 0 &&
                              data9 <= 4294967295
                            )) {
                              validate57.errors = [
                                {
                                  instancePath:
                                    instancePath +
                                    "/body/serviceWorker/byteLength",
                                  schemaPath:
                                    "/properties/body/properties/serviceWorker/properties/byteLength/type",
                                  keyword: "type",
                                  params: { type: "uint32", nullable: false },
                                  message: "must be uint32",
                                },
                              ];
                              return false;
                            }
                            var valid5 = _errs9 === errors;
                          } else {
                            valid5 = false;
                            validate57.errors = [
                              {
                                instancePath:
                                  instancePath + "/body/serviceWorker",
                                schemaPath:
                                  "/properties/body/properties/serviceWorker/properties/byteLength",
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
                          if (valid5) {
                            if (data6.mediaType !== undefined) {
                              const _errs10 = errors;
                              if (!(typeof data6.mediaType == "string")) {
                                validate57.errors = [
                                  {
                                    instancePath:
                                      instancePath +
                                      "/body/serviceWorker/mediaType",
                                    schemaPath:
                                      "/properties/body/properties/serviceWorker/properties/mediaType/type",
                                    keyword: "type",
                                    params: { type: "string", nullable: false },
                                    message: "must be string",
                                  },
                                ];
                                return false;
                              }
                              var valid5 = _errs10 === errors;
                            } else {
                              valid5 = false;
                              validate57.errors = [
                                {
                                  instancePath:
                                    instancePath + "/body/serviceWorker",
                                  schemaPath:
                                    "/properties/body/properties/serviceWorker/properties/mediaType",
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
                            if (valid5) {
                              for (const key0 in data6) {
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
                                        "/body/serviceWorker/" +
                                        key0
                                          .replace(/~/g, "~0")
                                          .replace(/\//g, "~1"),
                                      schemaPath:
                                        "/properties/body/properties/serviceWorker",
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
                    if (!valid4) {
                      validate57.errors = [
                        {
                          instancePath: instancePath + "/body/serviceWorker",
                          schemaPath:
                            "/properties/body/properties/serviceWorker/properties",
                          keyword: "properties",
                          params: { type: "object", nullable: false },
                          message: "must be object",
                        },
                      ];
                      return false;
                    }
                    var valid3 = _errs6 === errors;
                  } else {
                    valid3 = false;
                    validate57.errors = [
                      {
                        instancePath: instancePath + "/body",
                        schemaPath: "/properties/body/properties/serviceWorker",
                        keyword: "properties",
                        params: {
                          error: "missing",
                          missingProperty: "serviceWorker",
                        },
                        message: "must have property 'serviceWorker'",
                      },
                    ];
                    return false;
                  }
                  if (valid3) {
                    if (data1.navigation !== undefined) {
                      let data11 = data1.navigation;
                      const _errs11 = errors;
                      let valid7 = false;
                      if (
                        data11 &&
                        typeof data11 == "object" &&
                        !Array.isArray(data11)
                      ) {
                        valid7 = true;
                        var valid8;
                        if (data11.path !== undefined) {
                          const _errs12 = errors;
                          if (!(typeof data11.path == "string")) {
                            validate57.errors = [
                              {
                                instancePath:
                                  instancePath + "/body/navigation/path",
                                schemaPath:
                                  "/properties/body/properties/navigation/properties/path/type",
                                keyword: "type",
                                params: { type: "string", nullable: false },
                                message: "must be string",
                              },
                            ];
                            return false;
                          }
                          var valid8 = _errs12 === errors;
                        } else {
                          valid8 = false;
                          validate57.errors = [
                            {
                              instancePath: instancePath + "/body/navigation",
                              schemaPath:
                                "/properties/body/properties/navigation/properties/path",
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
                        if (valid8) {
                          if (data11.sha256 !== undefined) {
                            const _errs13 = errors;
                            if (!(typeof data11.sha256 == "string")) {
                              validate57.errors = [
                                {
                                  instancePath:
                                    instancePath + "/body/navigation/sha256",
                                  schemaPath:
                                    "/properties/body/properties/navigation/properties/sha256/type",
                                  keyword: "type",
                                  params: { type: "string", nullable: false },
                                  message: "must be string",
                                },
                              ];
                              return false;
                            }
                            var valid8 = _errs13 === errors;
                          } else {
                            valid8 = false;
                            validate57.errors = [
                              {
                                instancePath: instancePath + "/body/navigation",
                                schemaPath:
                                  "/properties/body/properties/navigation/properties/sha256",
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
                          if (valid8) {
                            if (data11.byteLength !== undefined) {
                              let data14 = data11.byteLength;
                              const _errs14 = errors;
                              if (!(
                                typeof data14 == "number" &&
                                isFinite(data14) &&
                                !(data14 % 1) &&
                                data14 >= 0 &&
                                data14 <= 4294967295
                              )) {
                                validate57.errors = [
                                  {
                                    instancePath:
                                      instancePath +
                                      "/body/navigation/byteLength",
                                    schemaPath:
                                      "/properties/body/properties/navigation/properties/byteLength/type",
                                    keyword: "type",
                                    params: { type: "uint32", nullable: false },
                                    message: "must be uint32",
                                  },
                                ];
                                return false;
                              }
                              var valid8 = _errs14 === errors;
                            } else {
                              valid8 = false;
                              validate57.errors = [
                                {
                                  instancePath:
                                    instancePath + "/body/navigation",
                                  schemaPath:
                                    "/properties/body/properties/navigation/properties/byteLength",
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
                            if (valid8) {
                              if (data11.mediaType !== undefined) {
                                const _errs15 = errors;
                                if (!(typeof data11.mediaType == "string")) {
                                  validate57.errors = [
                                    {
                                      instancePath:
                                        instancePath +
                                        "/body/navigation/mediaType",
                                      schemaPath:
                                        "/properties/body/properties/navigation/properties/mediaType/type",
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
                                var valid8 = _errs15 === errors;
                              } else {
                                valid8 = false;
                                validate57.errors = [
                                  {
                                    instancePath:
                                      instancePath + "/body/navigation",
                                    schemaPath:
                                      "/properties/body/properties/navigation/properties/mediaType",
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
                              if (valid8) {
                                for (const key1 in data11) {
                                  if (
                                    key1 !== "path" &&
                                    key1 !== "sha256" &&
                                    key1 !== "byteLength" &&
                                    key1 !== "mediaType"
                                  ) {
                                    validate57.errors = [
                                      {
                                        instancePath:
                                          instancePath +
                                          "/body/navigation/" +
                                          key1
                                            .replace(/~/g, "~0")
                                            .replace(/\//g, "~1"),
                                        schemaPath:
                                          "/properties/body/properties/navigation",
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
                      if (!valid7) {
                        validate57.errors = [
                          {
                            instancePath: instancePath + "/body/navigation",
                            schemaPath:
                              "/properties/body/properties/navigation/properties",
                            keyword: "properties",
                            params: { type: "object", nullable: false },
                            message: "must be object",
                          },
                        ];
                        return false;
                      }
                      var valid3 = _errs11 === errors;
                    } else {
                      valid3 = false;
                      validate57.errors = [
                        {
                          instancePath: instancePath + "/body",
                          schemaPath: "/properties/body/properties/navigation",
                          keyword: "properties",
                          params: {
                            error: "missing",
                            missingProperty: "navigation",
                          },
                          message: "must have property 'navigation'",
                        },
                      ];
                      return false;
                    }
                    if (valid3) {
                      if (data1.resources !== undefined) {
                        let data16 = data1.resources;
                        const _errs16 = errors;
                        let valid10 = false;
                        if (!valid10) {
                          if (Array.isArray(data16)) {
                            var valid11 = true;
                            const len0 = data16.length;
                            for (let i0 = 0; i0 < len0; i0++) {
                              let data17 = data16[i0];
                              const _errs17 = errors;
                              let valid12 = false;
                              if (
                                data17 &&
                                typeof data17 == "object" &&
                                !Array.isArray(data17)
                              ) {
                                valid12 = true;
                                var valid13;
                                if (data17.path !== undefined) {
                                  const _errs18 = errors;
                                  if (!(typeof data17.path == "string")) {
                                    validate57.errors = [
                                      {
                                        instancePath:
                                          instancePath +
                                          "/body/resources/" +
                                          i0 +
                                          "/path",
                                        schemaPath:
                                          "/properties/body/properties/resources/elements/properties/path/type",
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
                                  var valid13 = _errs18 === errors;
                                } else {
                                  valid13 = false;
                                  validate57.errors = [
                                    {
                                      instancePath:
                                        instancePath + "/body/resources/" + i0,
                                      schemaPath:
                                        "/properties/body/properties/resources/elements/properties/path",
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
                                if (valid13) {
                                  if (data17.sha256 !== undefined) {
                                    const _errs19 = errors;
                                    if (!(typeof data17.sha256 == "string")) {
                                      validate57.errors = [
                                        {
                                          instancePath:
                                            instancePath +
                                            "/body/resources/" +
                                            i0 +
                                            "/sha256",
                                          schemaPath:
                                            "/properties/body/properties/resources/elements/properties/sha256/type",
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
                                    var valid13 = _errs19 === errors;
                                  } else {
                                    valid13 = false;
                                    validate57.errors = [
                                      {
                                        instancePath:
                                          instancePath +
                                          "/body/resources/" +
                                          i0,
                                        schemaPath:
                                          "/properties/body/properties/resources/elements/properties/sha256",
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
                                  if (valid13) {
                                    if (data17.byteLength !== undefined) {
                                      let data20 = data17.byteLength;
                                      const _errs20 = errors;
                                      if (!(
                                        typeof data20 == "number" &&
                                        isFinite(data20) &&
                                        !(data20 % 1) &&
                                        data20 >= 0 &&
                                        data20 <= 4294967295
                                      )) {
                                        validate57.errors = [
                                          {
                                            instancePath:
                                              instancePath +
                                              "/body/resources/" +
                                              i0 +
                                              "/byteLength",
                                            schemaPath:
                                              "/properties/body/properties/resources/elements/properties/byteLength/type",
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
                                      var valid13 = _errs20 === errors;
                                    } else {
                                      valid13 = false;
                                      validate57.errors = [
                                        {
                                          instancePath:
                                            instancePath +
                                            "/body/resources/" +
                                            i0,
                                          schemaPath:
                                            "/properties/body/properties/resources/elements/properties/byteLength",
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
                                    if (valid13) {
                                      if (data17.mediaType !== undefined) {
                                        const _errs21 = errors;
                                        if (
                                          !(typeof data17.mediaType == "string")
                                        ) {
                                          validate57.errors = [
                                            {
                                              instancePath:
                                                instancePath +
                                                "/body/resources/" +
                                                i0 +
                                                "/mediaType",
                                              schemaPath:
                                                "/properties/body/properties/resources/elements/properties/mediaType/type",
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
                                        var valid13 = _errs21 === errors;
                                      } else {
                                        valid13 = false;
                                        validate57.errors = [
                                          {
                                            instancePath:
                                              instancePath +
                                              "/body/resources/" +
                                              i0,
                                            schemaPath:
                                              "/properties/body/properties/resources/elements/properties/mediaType",
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
                                      if (valid13) {
                                        for (const key2 in data17) {
                                          if (
                                            key2 !== "path" &&
                                            key2 !== "sha256" &&
                                            key2 !== "byteLength" &&
                                            key2 !== "mediaType"
                                          ) {
                                            validate57.errors = [
                                              {
                                                instancePath:
                                                  instancePath +
                                                  "/body/resources/" +
                                                  i0 +
                                                  "/" +
                                                  key2
                                                    .replace(/~/g, "~0")
                                                    .replace(/\//g, "~1"),
                                                schemaPath:
                                                  "/properties/body/properties/resources/elements",
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
                              }
                              if (!valid12) {
                                validate57.errors = [
                                  {
                                    instancePath:
                                      instancePath + "/body/resources/" + i0,
                                    schemaPath:
                                      "/properties/body/properties/resources/elements/properties",
                                    keyword: "properties",
                                    params: { type: "object", nullable: false },
                                    message: "must be object",
                                  },
                                ];
                                return false;
                              }
                              var valid11 = _errs17 === errors;
                              if (!valid11) {
                                break;
                              }
                            }
                            valid10 = valid11;
                          } else {
                            validate57.errors = [
                              {
                                instancePath: instancePath + "/body/resources",
                                schemaPath:
                                  "/properties/body/properties/resources/elements",
                                keyword: "elements",
                                params: { type: "array", nullable: false },
                                message: "must be array",
                              },
                            ];
                            return false;
                          }
                        }
                        var valid3 = _errs16 === errors;
                      } else {
                        valid3 = false;
                        validate57.errors = [
                          {
                            instancePath: instancePath + "/body",
                            schemaPath: "/properties/body/properties/resources",
                            keyword: "properties",
                            params: {
                              error: "missing",
                              missingProperty: "resources",
                            },
                            message: "must have property 'resources'",
                          },
                        ];
                        return false;
                      }
                      if (valid3) {
                        for (const key3 in data1) {
                          if (
                            key3 !== "formatVersion" &&
                            key3 !== "applicationVersion" &&
                            key3 !== "bootstrapPolicyVersion" &&
                            key3 !== "mode" &&
                            key3 !== "serviceWorker" &&
                            key3 !== "navigation" &&
                            key3 !== "resources"
                          ) {
                            validate57.errors = [
                              {
                                instancePath:
                                  instancePath +
                                  "/body/" +
                                  key3.replace(/~/g, "~0").replace(/\//g, "~1"),
                                schemaPath: "/properties/body",
                                keyword: "properties",
                                params: {
                                  error: "additional",
                                  additionalProperty: key3,
                                },
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
        if (data.buildHash !== undefined) {
          const _errs22 = errors;
          if (!(typeof data.buildHash == "string")) {
            validate57.errors = [
              {
                instancePath: instancePath + "/buildHash",
                schemaPath: "/properties/buildHash/type",
                keyword: "type",
                params: { type: "string", nullable: false },
                message: "must be string",
              },
            ];
            return false;
          }
          var valid1 = _errs22 === errors;
        } else {
          valid1 = false;
          validate57.errors = [
            {
              instancePath,
              schemaPath: "/properties/buildHash",
              keyword: "properties",
              params: { error: "missing", missingProperty: "buildHash" },
              message: "must have property 'buildHash'",
            },
          ];
          return false;
        }
        if (valid1) {
          if (data.signingKeyId !== undefined) {
            const _errs23 = errors;
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
            var valid1 = _errs23 === errors;
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
              const _errs24 = errors;
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
              var valid1 = _errs24 === errors;
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
              for (const key4 in data) {
                if (
                  key4 !== "formatVersion" &&
                  key4 !== "body" &&
                  key4 !== "buildHash" &&
                  key4 !== "signingKeyId" &&
                  key4 !== "signature"
                ) {
                  validate57.errors = [
                    {
                      instancePath:
                        instancePath +
                        "/" +
                        key4.replace(/~/g, "~0").replace(/\//g, "~1"),
                      schemaPath: "",
                      keyword: "properties",
                      params: { error: "additional", additionalProperty: key4 },
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
