// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// Written by tools/domain-schema-ts.mjs from schema/domain.schema.json: do not edit.
/** The schema of a domain document, as a constant a consumer reads with json-schema-to-ts `FromSchema` and validates with Ajv 2020. */
export const domainSchema = {
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://openmixer.org/schema/omx-contract/v3/domain.schema.json",
  "title": "omx-contract domain document",
  "description": "A domain document (docs/contract-dir.md, Domains): <contractdir>/<domain>/<last segment>.json, one JSON Schema 2020-12 document of a vocabulary, its words items, range items, sheets and scalars under components.schemas. GPL-3.0-or-later. What a schema cannot say stays in the reader (src/lib/domain.mts): the prefix rule (an item name starts with the domain's name in upper snake case with its underscore, and never with the prefix of a longer domain of the read); the x-code order (a word's x-code is its place in the oneOf, from 0); a title used twice in one item; x-groups naming a words item of this document and x-group a word of that item; x-dimensions and x-dimension likewise; a set's x-default being one of its words; the $id agreeing with the directory the document is in (the domain's name, a nested domain's document being <domain>/<last segment>.json); a name used by two domains; a word's x-args being exactly the placeholders of its x-text, each once (and present when the x-text has any); and x-since and x-why, which the reader does not type.",
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
        },
        "x-requires": {
          "description": "The packages (or domains) the domain's words take terms from, each with its floor: the requires every data file rebuilt from the domain carries, after the schema floor (docs/contract-dir.md, \"Domains\").",
          "type": "object",
          "propertyNames": {
            "pattern": "^[a-z][a-z0-9-]*(/[a-z][a-z0-9-]*)*$"
          },
          "additionalProperties": {
            "type": "string",
            "pattern": "^>= (0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)$"
          }
        }
      }
    },
    "x-render": {
      "description": "The render block of the data file the root's x-file names, as render --with-domain rebuilds it (docs/render.md).",
      "type": "object"
    },
    "x-file": {
      "description": "The data path of the file that carried x-render.",
      "type": "string",
      "pattern": "\\.json$"
    },
    "components": {
      "type": "object",
      "required": [
        "schemas"
      ],
      "additionalProperties": false,
      "properties": {
        "schemas": {
          "description": "The items of the domain, each named in upper snake case: a words item, a range item, a sheet or a scalar.",
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
              },
              {
                "$ref": "#/$defs/sheet"
              },
              {
                "$ref": "#/$defs/scalar"
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
        "x-dimensions": {
          "description": "The name of the words item of this document whose words are the dimensions of this item's words (a unit list's: what each unit measures); the data form's dimensions.",
          "type": "string"
        },
        "x-default": {
          "description": "A set's default: one of its words; the data form's default. Only on x-kind set.",
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
        "x-kind": {
          "description": "The data item it rebuilds (docs/render.md): a codes item (the default), each code keyed by its word's x-name, a words item, each word keyed by its title, or a set, its words the ids in order and x-default its default.",
          "enum": [
            "codes",
            "words",
            "set"
          ]
        },
        "x-file": {
          "description": "The data path the item came from.",
          "type": "string",
          "pattern": "\\.json$"
        },
        "x-source": {
          "description": "The data item's source, verbatim.",
          "type": "object"
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
    "sheet": {
      "description": "A data sheet render --with-domain rebuilds (docs/render.md): no words, read nowhere else.",
      "type": "object",
      "required": [
        "description",
        "x-kind",
        "x-file",
        "x-value"
      ],
      "additionalProperties": false,
      "properties": {
        "description": {
          "type": "string"
        },
        "x-since": {},
        "x-why": {},
        "x-kind": {
          "const": "sheet"
        },
        "x-file": {
          "type": "string",
          "pattern": "\\.json$"
        },
        "x-source": {
          "type": "object"
        },
        "x-value": {
          "description": "The data sheet's value, verbatim.",
          "type": "object"
        },
        "x-docs": {
          "description": "The data sheet's docs, verbatim.",
          "type": "object"
        }
      }
    },
    "scalar": {
      "description": "A single value: its description the item's doc, x-value the value, x-unit its unit (an empty string for none). The runtime readers serve it (omx_domain_scalar, Domain.scalar); with an x-file, render --with-domain also rebuilds it as a data scalar (docs/render.md).",
      "type": "object",
      "required": [
        "description",
        "x-kind",
        "x-unit",
        "x-value"
      ],
      "additionalProperties": false,
      "properties": {
        "description": {
          "type": "string"
        },
        "x-since": {},
        "x-why": {},
        "x-kind": {
          "const": "scalar"
        },
        "x-file": {
          "type": "string",
          "pattern": "\\.json$"
        },
        "x-source": {
          "type": "object"
        },
        "x-unit": {
          "description": "The scalar's unit, the data form's unit.",
          "type": "string"
        },
        "x-value": {
          "description": "The scalar's value: a number, or true or false.",
          "oneOf": [
            {
              "type": "number"
            },
            {
              "type": "boolean"
            }
          ]
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
        "x-args": {
          "description": "The ordered names of the x-text's {name} placeholders, stored: each placeholder once and no other name; the data form's args.",
          "type": "array",
          "items": {
            "type": "string",
            "pattern": "^[a-z][A-Za-z0-9]*$"
          },
          "uniqueItems": true
        },
        "x-group": {
          "description": "A word of the item x-groups names.",
          "type": "string"
        },
        "x-symbol": {
          "description": "A unit word's symbol as written (`%`, `\"\"`, `dB/oct`), the one a wire word cannot spell; the data form's symbol.",
          "type": "string"
        },
        "x-dimension": {
          "description": "A word of the item x-dimensions names: what the unit measures; the data form's dimension.",
          "type": "string"
        },
        "x-name": {
          "description": "The code's key in the data item it rebuilds, the macro stem (docs/render.md).",
          "type": "string",
          "pattern": "^[A-Za-z][A-Za-z0-9]*$"
        },
        "x-from": {
          "description": "What the word is taken from: a term of a terms item, or a word of a words item of another domain (or its own), by its $ref (the domain id and the item) and x-term (the term's key, or the target word's title). A package or domain other than omx-contract, the document's own and its owner is declared in info.x-requires.",
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
                "description": "The term's key in a terms item, or the title of the target word in a words item.",
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
