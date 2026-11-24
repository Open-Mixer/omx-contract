// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Pau Aliagas <linuxnow@gmail.com>
// Written by tools/domain-schema-ts.mjs from schema/domain.schema.json: do not edit.
/** The schema of a domain document, as a constant a consumer reads with json-schema-to-ts `FromSchema` and validates with Ajv 2020. */
export const domainSchema = {
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://openmixer.org/schema/omx-contract/v3/domain.schema.json",
  "title": "omx-contract domain document",
  "description": "A domain document (docs/contract-dir.md, Domains): <contractdir>/<domain>/<last segment>.json, one JSON Schema 2020-12 document of a vocabulary, its words items, range items, sheets, scalars, terms items and map items under components.schemas. GPL-3.0-or-later. What a schema cannot say stays in the reader (src/lib/domain.mts): the prefix rule (an item name starts with the domain's name in upper snake case with its underscore, and never with the prefix of a longer domain of the read); the x-code order (a word's x-code is its place in the oneOf, from 0); a title used twice in one item; x-groups naming a words item of this document and x-group a word of that item; x-dimensions and x-dimension likewise; a set's x-default being one of its words; the $id agreeing with the directory the document is in (the domain's name, a nested domain's document being <domain>/<last segment>.json); a name used by two domains; a word's x-args being exactly the placeholders of its x-text, each once (and present when the x-text has any); a map row's const being its title and the outcome and cover rules a schema states again by name; a map row's term link resolving to a term of a terms item of the map's format, which the read of all the data checks (validate, rule map-term); and x-since and x-why, which the reader does not type.",
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
          "description": "The packages (or domains) the domain's words take terms from, by name, in ascending order and each once, no version: the requires every data file rebuilt from the domain carries (docs/contract-dir.md, \"Domains\"). A map of floors and an empty list are refused (the devel wave 2026-11-24): a domain that refers to nothing has none.",
          "type": "array",
          "items": {
            "type": "string",
            "pattern": "^[a-z][a-z0-9-]*(/[a-z][a-z0-9-]*)*$"
          },
          "uniqueItems": true,
          "minItems": 1
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
          "description": "The items of the domain, each named in upper snake case: a words item, a range item, a sheet, a scalar, a terms item or a map item.",
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
              },
              {
                "$ref": "#/$defs/terms"
              },
              {
                "$ref": "#/$defs/map"
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
        "x-units": {
          "description": "V28 (#189): the name of the words item of this document whose words are the units its words' x-figure-unit names; the data form's units.",
          "type": "string"
        },
        "x-bases": {
          "description": "V28 (#189): the name of the words item of this document whose words are the bases its words' x-basis names; the data form's bases.",
          "type": "string"
        },
        "x-extension": {
          "description": "V28 (#189): the data form's extension, verbatim: the carriers (CLAP extension id, LV2 prefix and namespace) of a resource-hint item.",
          "type": "object"
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
          "description": "The data item it rebuilds (docs/render.md): a codes item (the default), each code keyed by its word's x-name, a words item, each word keyed by its title, a set, its words the ids in order and x-default its default, or a verbs item, each word a verb keyed by its title.",
          "enum": [
            "codes",
            "words",
            "set",
            "verbs"
          ]
        },
        "x-file": {
          "description": "The data path the item came from.",
          "type": "string",
          "pattern": "\\.json$"
        },
        "x-source": {
          "$ref": "#/$defs/source"
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
          "$ref": "#/$defs/source"
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
          "$ref": "#/$defs/source"
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
    "terms": {
      "description": "A terms item (3.21.0): a format's terms as one specification or header states them, rebuilt as the data form's terms item; the runtime readers serve it as words, the words the term keys.",
      "type": "object",
      "required": [
        "description",
        "x-kind",
        "x-format",
        "x-spec",
        "x-version",
        "oneOf"
      ],
      "additionalProperties": false,
      "properties": {
        "description": {
          "type": "string"
        },
        "x-since": {},
        "x-why": {},
        "x-kind": {
          "const": "terms"
        },
        "x-file": {
          "type": "string",
          "pattern": "\\.json$"
        },
        "x-source": {
          "$ref": "#/$defs/source"
        },
        "x-format": {
          "description": "The format, the data form's format (lv2, clap).",
          "type": "string"
        },
        "x-spec": {
          "description": "The specification's URI or the header's path, the data form's spec.",
          "type": "string"
        },
        "x-version": {
          "description": "The specification's version, the data form's version.",
          "type": "string"
        },
        "x-deprecated": {
          "const": true
        },
        "oneOf": {
          "type": "array",
          "minItems": 1,
          "items": {
            "$ref": "#/$defs/term"
          }
        }
      }
    },
    "map": {
      "description": "A map item (omx-contract#191, owner ruling 2026-11-23): one format's mapping table, every field a scan of the format reads, each a row keyed by its source field; rebuilt as the data form's formatMap item (docs/descriptors.md), whose rows validate checks. The runtime readers serve it as words, the words the source keys.",
      "type": "object",
      "required": [
        "description",
        "x-kind",
        "x-format",
        "oneOf"
      ],
      "additionalProperties": false,
      "properties": {
        "description": {
          "type": "string"
        },
        "x-since": {},
        "x-why": {},
        "x-kind": {
          "const": "map"
        },
        "x-file": {
          "type": "string",
          "pattern": "\\.json$"
        },
        "x-source": {
          "$ref": "#/$defs/source"
        },
        "x-format": {
          "description": "The format whose fields the rows map (lv2, clap), the data form's format.",
          "type": "string"
        },
        "oneOf": {
          "type": "array",
          "minItems": 1,
          "items": {
            "$ref": "#/$defs/mapRow"
          }
        }
      }
    },
    "mapRow": {
      "description": "One row of a map: const and title its source key, the field as the format names it (units:unit, clap_param_info.min_value, omx_clap_panel_display.meter_ids[0]); x-code its place; exactly one outcome, x-word, x-extension or x-dropped; exactly one cover, x-term or x-from; description its doc. The data form's row is { term, from, word, extension, dropped, doc }.",
      "type": "object",
      "required": [
        "const",
        "title",
        "x-code"
      ],
      "additionalProperties": false,
      "properties": {
        "const": {
          "type": "string",
          "pattern": "^[A-Za-z_][A-Za-z0-9_]*(\\[[0-9]+\\])?([.:#/][A-Za-z0-9_][A-Za-z0-9_-]*(\\[[0-9]+\\])?)*$"
        },
        "title": {
          "type": "string",
          "minLength": 1
        },
        "description": {
          "type": "string"
        },
        "x-code": {
          "type": "integer",
          "minimum": 0
        },
        "x-term": {
          "description": "The term link, <TERMS item>#<term>: the term of a terms item of the map's format (an x-kind terms item, its x-spec the standard) the field is; the data form's term.",
          "type": "string",
          "pattern": "^[A-Z][A-Z0-9_]*#[A-Za-z0-9][A-Za-z0-9._/+-]*$"
        },
        "x-from": {
          "description": "For a field no terms item holds: where it is defined, a link <path>#<symbol>[.<field>] or an http(s) URL; the data form's from.",
          "type": "string",
          "minLength": 1
        },
        "x-word": {
          "description": "The outcome descriptor word: the word the field becomes, the transform that converts it and that transform's data, the lookup sub-table values (a code token or unit IRI to its value; a unit's value is a PARAM_UNITS id spelled as its standard symbol, plugin-hostd#215 decision 2) or factor. Never code. The data form's word, verbatim.",
          "type": "object",
          "required": [
            "word",
            "transform"
          ],
          "additionalProperties": false,
          "properties": {
            "word": {
              "type": "string",
              "pattern": "^[a-z][A-Za-z0-9]*(\\[\\])?(\\.[a-z][A-Za-z0-9]*(\\[\\])?)*$"
            },
            "transform": {
              "type": "string",
              "pattern": "^[a-z][a-z0-9]*(-[a-z0-9]+)*$"
            },
            "values": {
              "type": "object",
              "additionalProperties": {
                "anyOf": [
                  {
                    "type": "string"
                  },
                  {
                    "type": "number"
                  },
                  {
                    "type": "boolean"
                  }
                ]
              },
              "minProperties": 1
            },
            "factor": {
              "type": "number"
            }
          },
          "not": {
            "required": [
              "values",
              "factor"
            ],
            "properties": {
              "values": true,
              "factor": true
            }
          }
        },
        "x-extension": {
          "description": "The outcome extension passthrough: the field is carried in the descriptor's extension bag; the data form's extension.",
          "const": true
        },
        "x-dropped": {
          "description": "The outcome dropped-with-ruling: the field is read and dropped, by the ruling named (a plugin unit with no standard id is such a row, plugin-hostd#215 decision 2); the data form's dropped.",
          "type": "object",
          "required": [
            "ruling"
          ],
          "additionalProperties": false,
          "properties": {
            "ruling": {
              "type": "string",
              "minLength": 1
            }
          }
        }
      },
      "oneOf": [
        {
          "required": [
            "x-word"
          ],
          "properties": {
            "x-word": true
          }
        },
        {
          "required": [
            "x-extension"
          ],
          "properties": {
            "x-extension": true
          }
        },
        {
          "required": [
            "x-dropped"
          ],
          "properties": {
            "x-dropped": true
          }
        }
      ],
      "allOf": [
        {
          "oneOf": [
            {
              "required": [
                "x-term"
              ],
              "properties": {
                "x-term": true
              }
            },
            {
              "required": [
                "x-from"
              ],
              "properties": {
                "x-from": true
              }
            }
          ]
        }
      ]
    },
    "term": {
      "description": "One term: const and title its key (the data form's key, which may hold . / + -), x-code its place, x-term the term as the data form writes it.",
      "type": "object",
      "required": [
        "const",
        "title",
        "x-code",
        "x-term"
      ],
      "additionalProperties": false,
      "properties": {
        "const": {
          "type": "string",
          "minLength": 1
        },
        "title": {
          "type": "string",
          "minLength": 1
        },
        "x-code": {
          "type": "integer",
          "minimum": 0
        },
        "x-term": {
          "type": "object"
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
        "x-uri": {
          "description": "The absolute URI a format spells the word as, of any scheme (`http://lv2plug.in/ns/extensions/units#db`, `urn:openmixer:unit#dBoct`); the data form's uri.",
          "type": "string",
          "pattern": "^[A-Za-z][A-Za-z0-9+.-]*:[^\\s]+$"
        },
        "x-dimension": {
          "description": "A word of the item x-dimensions names: what the unit measures; the data form's dimension.",
          "type": "string"
        },
        "x-figure-unit": {
          "description": "V28 (#189): a word of the item x-units names, the unit the hint's figure is in; the data form's figureUnit.",
          "type": "string"
        },
        "x-basis": {
          "description": "V28 (#189): a word of the item x-bases names, how the hint's figure is known; the data form's basis.",
          "type": "string"
        },
        "x-format": {
          "description": "A verb's format, the line as mod-host's protocol_add_command takes it; the data form's format. Only on a verb.",
          "type": "string"
        },
        "x-reply": {
          "description": "A verb's reply as the protocol writes it; the data form's reply. Only on a verb.",
          "type": "string"
        },
        "x-codes": {
          "description": "The refusals a verb answers, each { ref: <ITEM>.<name> }; the data form's codes. Only on a verb.",
          "type": "array",
          "items": {
            "type": "object",
            "required": [
              "ref"
            ],
            "additionalProperties": false,
            "properties": {
              "ref": {
                "type": "string"
              }
            }
          }
        },
        "x-implemented-by": {
          "description": "What each host owes a verb, by host; the data form's implementedBy. Only on a verb.",
          "type": "object",
          "additionalProperties": {
            "enum": [
              "required",
              "optional",
              "unsupported"
            ]
          }
        },
        "x-since": {
          "description": "The version a verb came in; the data form's since. Only on a verb.",
          "type": "string"
        },
        "x-resp": {
          "description": "A reply code's number, the n of resp <n>; the data form's resp. Only on a code.",
          "type": "integer",
          "maximum": -1
        },
        "x-transient": {
          "description": "A reply code that says nothing about the plugin or the request; the data form's transient. Only on a code.",
          "type": "boolean"
        },
        "x-leaves-no-mark": {
          "description": "A refusal that leaves no mark on the plugin, no verdict and no history; the data form's leavesNoMark. Only on a code.",
          "type": "boolean"
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
    },
    "source": {
      "type": "object",
      "description": "Where a definition comes from and where it is implemented (docs/contract-dir.md): from, the provenance, a link compared to the whole value or a map from a field path of the value to a link; impl, the connector; at, <package>@<version> of links outside the owner's tree. A link may carry its own at ({ link, at }), which stands for it in place of the source's.",
      "properties": {
        "from": {
          "oneOf": [
            {
              "$ref": "#/$defs/oneLink"
            },
            {
              "type": "object",
              "propertyNames": {
                "pattern": "^[A-Za-z0-9_]+(\\.[A-Za-z0-9_]+)*$"
              },
              "additionalProperties": {
                "$ref": "#/$defs/oneLink"
              },
              "minProperties": 1
            }
          ]
        },
        "impl": {
          "$ref": "#/$defs/links"
        },
        "at": {
          "$ref": "#/$defs/at"
        }
      },
      "minProperties": 1,
      "additionalProperties": false
    },
    "links": {
      "oneOf": [
        {
          "$ref": "#/$defs/oneLink"
        },
        {
          "type": "array",
          "items": {
            "$ref": "#/$defs/oneLink"
          },
          "minItems": 1,
          "uniqueItems": true
        }
      ]
    },
    "oneLink": {
      "oneOf": [
        {
          "$ref": "#/$defs/link"
        },
        {
          "$ref": "#/$defs/linkAt"
        }
      ]
    },
    "linkAt": {
      "type": "object",
      "description": "One link with its own at: <package>@<version> of the tree it lies in, in place of the source's (an impl in the owner's tree beside a from in the console's, at the commit it was imported from).",
      "properties": {
        "link": {
          "$ref": "#/$defs/link"
        },
        "at": {
          "$ref": "#/$defs/at"
        }
      },
      "required": [
        "link",
        "at"
      ],
      "additionalProperties": false
    },
    "link": {
      "type": "string",
      "description": "<path>#<symbol>[.<field>|[<key>]]...: a path relative to the owner's root, a symbol defined there (enum X and struct X name a tag), and selectors into its value.",
      "pattern": "^[A-Za-z0-9_+.-]+(/[A-Za-z0-9_+.-]+)*#((enum|struct|union) )?[A-Za-z_][A-Za-z0-9_]*(\\.[A-Za-z_][A-Za-z0-9_]*|\\[[A-Za-z0-9_.-]+\\])*$"
    },
    "at": {
      "type": "string",
      "pattern": "^[a-z][a-z0-9]*(-[a-z0-9]+)*@[A-Za-z0-9._+-]+$"
    }
  }
} as const;
