// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// Written by tools/domain-schema-ts.mjs from schema/domain.schema.json: do not edit.
/** The schema of a domain document, as a constant a consumer reads with json-schema-to-ts `FromSchema` and validates with Ajv 2020. */
export const domainSchema = {
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://openmixer.org/schema/omx-contract/v3/domain.schema.json",
  "title": "omx-contract domain document",
  "description": "A domain document (docs/contract-dir.md, Domains): <contractdir>/<domain>/<last segment>.json, one JSON Schema 2020-12 document of a vocabulary, its words items and range items under components.schemas. GPL-3.0-or-later. What a schema cannot say stays in the reader (src/lib/domain.mts): the prefix rule (an item name starts with the domain's name in upper snake case with its underscore, and never with the prefix of a longer domain of the read); the x-code order (a word's x-code is its place in the oneOf, from 0); a title used twice in one item; x-groups naming a words item of this document and x-group a word of that item; the $id agreeing with the directory the document is in (the domain's name, a nested domain's document being <domain>/<last segment>.json); a name used by two domains; and x-since and x-why, which the reader does not type.",
  "type": "object",
  "required": [
    "$schema",
    "$id",
    "info",
    "components"
  ],
  "additionalProperties": false,
  "properties": {
    "$schema": {
      "const": "https://json-schema.org/draft/2020-12/schema"
    },
    "$id": {
      "description": "The stable id of the domain, the URL every cross-domain reference names.",
      "type": "string",
      "pattern": "^https://openmixer\\.org/contract/[a-z][a-z0-9-]*(/[a-z][a-z0-9-]*)*$"
    },
    "info": {
      "type": "object",
      "required": [
        "title",
        "version",
        "x-owner",
        "x-stability"
      ],
      "additionalProperties": false,
      "properties": {
        "title": {
          "type": "string",
          "minLength": 1
        },
        "version": {
          "description": "The domain's own version.",
          "type": "string",
          "pattern": "^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)$"
        },
        "x-owner": {
          "description": "The package that owns the domain today: metadata, never a path.",
          "type": "string",
          "pattern": "^[a-z][a-z0-9-]*$"
        },
        "x-stability": {
          "description": "The domain's stability level: every document carries it, and there is no default.",
          "enum": [
            "experimental",
            "stable"
          ]
        }
      }
    },
    "components": {
      "type": "object",
      "required": [
        "schemas"
      ],
      "additionalProperties": false,
      "properties": {
        "schemas": {
          "description": "The items of the domain, each named in upper snake case: a words item or a range item.",
          "type": "object",
          "minProperties": 1,
          "propertyNames": {
            "pattern": "^[A-Z][A-Z0-9_]*$"
          },
          "additionalProperties": {
            "oneOf": [
              {
                "$ref": "#/$defs/words"
              },
              {
                "$ref": "#/$defs/range"
              }
            ]
          }
        }
      }
    }
  },
  "$defs": {
    "range": {
      "description": "A range item: its description the item's doc, and one parameter per name under properties, each a minimum and a maximum and optionally a default, a unit and a scale. The loaders read it at run time; nothing is rendered from it. What a schema cannot say stays in the reader: a minimum not above the maximum, a default inside them.",
      "type": "object",
      "required": [
        "description",
        "properties"
      ],
      "additionalProperties": false,
      "properties": {
        "description": {
          "type": "string"
        },
        "x-since": {},
        "x-why": {},
        "type": {
          "const": "object"
        },
        "properties": {
          "type": "object",
          "additionalProperties": {
            "type": "object",
            "required": [
              "minimum",
              "maximum"
            ],
            "additionalProperties": false,
            "properties": {
              "minimum": {
                "type": "number"
              },
              "maximum": {
                "type": "number"
              },
              "default": {
                "type": "number"
              },
              "x-unit": {
                "type": "string"
              },
              "x-scale": {
                "type": "string"
              }
            }
          }
        }
      }
    },
    "words": {
      "description": "A words item: its description the item's doc, a oneOf of one word each in their declared order.",
      "type": "object",
      "required": [
        "description",
        "oneOf"
      ],
      "additionalProperties": false,
      "properties": {
        "description": {
          "type": "string"
        },
        "x-since": {},
        "x-why": {},
        "x-groups": {
          "description": "The name of the words item of this document whose words are the groups of this item's words.",
          "type": "string"
        },
        "x-c-codes": {
          "description": "The item becomes constants, its codes header.",
          "type": "boolean"
        },
        "x-c-xmacro": {
          "description": "The item's codes header also carries an X-macro; only with x-c-codes true.",
          "type": "boolean"
        },
        "oneOf": {
          "type": "array",
          "minItems": 1,
          "items": {
            "$ref": "#/$defs/word"
          }
        }
      },
      "if": {
        "required": [
          "x-c-xmacro"
        ],
        "properties": {
          "x-c-xmacro": {
            "const": true
          }
        }
      },
      "then": {
        "required": [
          "x-c-codes"
        ],
        "properties": {
          "x-c-codes": {
            "const": true
          }
        }
      }
    },
    "word": {
      "type": "object",
      "required": [
        "const",
        "title",
        "x-code"
      ],
      "additionalProperties": false,
      "properties": {
        "const": {
          "description": "The word as written: any string.",
          "type": "string",
          "minLength": 1
        },
        "title": {
          "description": "The word's key, the name of its macro.",
          "type": "string",
          "pattern": "^[A-Za-z][A-Za-z0-9]*$"
        },
        "description": {
          "type": "string"
        },
        "x-code": {
          "description": "The word's code, its place in the order.",
          "type": "integer",
          "minimum": 0
        },
        "x-text": {
          "description": "The English source sentence the catalogs translate.",
          "type": "string"
        },
        "x-group": {
          "description": "A word of the item x-groups names.",
          "type": "string"
        },
        "x-from": {
          "type": "array",
          "minItems": 1,
          "items": {
            "type": "object",
            "required": [
              "$ref",
              "x-term"
            ],
            "additionalProperties": false,
            "properties": {
              "$ref": {
                "type": "string",
                "pattern": "^https://openmixer\\.org/contract/[a-z][a-z0-9-]*(/[a-z][a-z0-9-]*)*#/components/schemas/[A-Z][A-Z0-9_]*$"
              },
              "x-term": {
                "type": "string",
                "minLength": 1
              }
            }
          }
        }
      }
    }
  }
} as const;
