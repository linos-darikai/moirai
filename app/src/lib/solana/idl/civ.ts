/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/civ.json`.
 */
export type Civ = {
  "address": "GPdm56hssFExZrtGspZprjbfecXbRKYtAJGQ4X1ysNkc",
  "metadata": {
    "name": "civ",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "docs": [
    "`#[program]` marks this module as the list of instructions the program accepts.",
    "`#[ephemeral]` (MagicBlock SDK, must come before `#[program]`) adds the hidden instruction the",
    "Delegation Program calls to hand a delegated account back when it is undelegated."
  ],
  "instructions": [
    {
      "name": "createRandomSeed",
      "docs": [
        "Create the caller's empty RandomSeed (VRF spike)."
      ],
      "discriminator": [
        100,
        221,
        211,
        34,
        215,
        134,
        220,
        68
      ],
      "accounts": [
        {
          "name": "authority",
          "docs": [
            "The wallet creating the account. Pays the rent."
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "randomSeed",
          "docs": [
            "The new RandomSeed at `[\"random_seed\", authority]`. `init` fails if it already exists."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  97,
                  110,
                  100,
                  111,
                  109,
                  95,
                  115,
                  101,
                  101,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "delegateCounter",
      "docs": [
        "Hand the caller's Counter to an Ephemeral Rollup. Send to the base layer."
      ],
      "discriminator": [
        191,
        73,
        158,
        84,
        28,
        42,
        192,
        253
      ],
      "accounts": [
        {
          "name": "authority",
          "docs": [
            "The counter's owner. Pays for the delegation bookkeeping accounts."
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "bufferCounter",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  117,
                  102,
                  102,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "counter"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                228,
                171,
                165,
                107,
                225,
                169,
                57,
                206,
                15,
                6,
                17,
                18,
                138,
                75,
                158,
                154,
                223,
                151,
                1,
                86,
                95,
                73,
                40,
                132,
                15,
                40,
                163,
                55,
                141,
                205,
                73,
                37
              ]
            }
          }
        },
        {
          "name": "delegationRecordCounter",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  108,
                  101,
                  103,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "counter"
              }
            ],
            "program": {
              "kind": "account",
              "path": "delegationProgram"
            }
          }
        },
        {
          "name": "delegationMetadataCounter",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  108,
                  101,
                  103,
                  97,
                  116,
                  105,
                  111,
                  110,
                  45,
                  109,
                  101,
                  116,
                  97,
                  100,
                  97,
                  116,
                  97
                ]
              },
              {
                "kind": "account",
                "path": "counter"
              }
            ],
            "program": {
              "kind": "account",
              "path": "delegationProgram"
            }
          }
        },
        {
          "name": "counter",
          "docs": [
            "`UncheckedAccount` (not `Account<Counter>`) because delegation reassigns its owner; `del`",
            "marks it as the account to delegate. Only the authority's own PDA can match these seeds."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  117,
                  110,
                  116,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "ownerProgram",
          "address": "GPdm56hssFExZrtGspZprjbfecXbRKYtAJGQ4X1ysNkc"
        },
        {
          "name": "delegationProgram",
          "address": "DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "fulfillRandomSeed",
      "docs": [
        "VRF oracle callback: stores the randomness. Only the VRF program can call it."
      ],
      "discriminator": [
        213,
        22,
        200,
        86,
        168,
        133,
        241,
        78
      ],
      "accounts": [
        {
          "name": "vrfProgramIdentity",
          "docs": [
            "Scoped VRF identity PDA, bound to this program. Its presence as a signer proves",
            "the callback was issued by the VRF program for this program."
          ],
          "signer": true
        },
        {
          "name": "randomSeed",
          "docs": [
            "The RandomSeed named in the request (`accounts_metas` in `request_random_seed`)."
          ],
          "writable": true
        }
      ],
      "args": [
        {
          "name": "randomness",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "increment",
      "docs": [
        "Add one to the caller's Counter (hello-world). Works on the base layer and in the rollup."
      ],
      "discriminator": [
        11,
        18,
        104,
        9,
        104,
        174,
        59,
        33
      ],
      "accounts": [
        {
          "name": "authority",
          "docs": [
            "The wallet that owns the counter."
          ],
          "signer": true,
          "relations": [
            "counter"
          ]
        },
        {
          "name": "counter",
          "docs": [
            "The caller's Counter. `seeds` + `bump = counter.bump` re-derive the PDA with the stored bump,",
            "and `has_one = authority` checks `counter.authority == authority`, so nobody else's wallet",
            "can change it."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  117,
                  110,
                  116,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "initialize",
      "docs": [
        "Create the caller's Counter (hello-world)."
      ],
      "discriminator": [
        175,
        175,
        109,
        31,
        13,
        152,
        155,
        237
      ],
      "accounts": [
        {
          "name": "authority",
          "docs": [
            "The wallet creating the counter. It signs the transaction and pays the rent."
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "counter",
          "docs": [
            "The new Counter. Its address is a PDA derived from `[\"counter\", authority]`, so each wallet",
            "has exactly one and anyone can find it. `init` fails if it already exists."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  117,
                  110,
                  116,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "docs": [
            "Needed because creating an account is done by the built-in System Program."
          ],
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "processUndelegation",
      "discriminator": [
        196,
        28,
        41,
        206,
        48,
        37,
        51,
        167
      ],
      "accounts": [
        {
          "name": "baseAccount",
          "writable": true
        },
        {
          "name": "buffer",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  110,
                  100,
                  101,
                  108,
                  101,
                  103,
                  97,
                  116,
                  101,
                  45,
                  98,
                  117,
                  102,
                  102,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "baseAccount"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                181,
                183,
                0,
                225,
                242,
                87,
                58,
                192,
                204,
                6,
                34,
                1,
                52,
                74,
                207,
                151,
                184,
                53,
                6,
                235,
                140,
                229,
                25,
                152,
                204,
                98,
                126,
                24,
                147,
                128,
                167,
                62
              ]
            }
          }
        },
        {
          "name": "payer",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "accountSeeds",
          "type": {
            "vec": "bytes"
          }
        }
      ]
    },
    {
      "name": "requestRandomSeed",
      "docs": [
        "Ask the VRF oracle for randomness for the caller's RandomSeed (VRF spike)."
      ],
      "discriminator": [
        46,
        129,
        94,
        86,
        216,
        148,
        45,
        226
      ],
      "accounts": [
        {
          "name": "authority",
          "docs": [
            "The seed's owner. Pays the oracle request fee."
          ],
          "writable": true,
          "signer": true,
          "relations": [
            "randomSeed"
          ]
        },
        {
          "name": "randomSeed",
          "docs": [
            "The caller's RandomSeed."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  97,
                  110,
                  100,
                  111,
                  109,
                  95,
                  115,
                  101,
                  101,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "oracleQueue",
          "docs": [
            "queues (devnet/mainnet, or the localnet test queue), so nobody can point us at a fake one."
          ],
          "writable": true
        },
        {
          "name": "programIdentity",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  100,
                  101,
                  110,
                  116,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "vrfProgram",
          "address": "Vrf1RNUjXmQGjmQrQLvJHs9SNkvDJEsRVFPkfSQUwGz"
        },
        {
          "name": "slotHashes",
          "address": "SysvarS1otHashes111111111111111111111111111"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "undelegateCounter",
      "docs": [
        "Commit the Counter back to Solana and end the delegation. Send to the rollup."
      ],
      "discriminator": [
        160,
        10,
        117,
        157,
        44,
        10,
        180,
        179
      ],
      "accounts": [
        {
          "name": "authority",
          "docs": [
            "The counter's owner. Pays for the commit."
          ],
          "writable": true,
          "signer": true,
          "relations": [
            "counter"
          ]
        },
        {
          "name": "counter",
          "docs": [
            "The caller's Counter, as the ER sees it (owned by this program inside the rollup)."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  117,
                  110,
                  116,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "magicProgram",
          "address": "Magic11111111111111111111111111111111111111"
        },
        {
          "name": "magicContext",
          "writable": true,
          "address": "MagicContext1111111111111111111111111111111"
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "counter",
      "discriminator": [
        255,
        176,
        4,
        245,
        188,
        253,
        124,
        25
      ]
    },
    {
      "name": "randomSeed",
      "discriminator": [
        184,
        242,
        128,
        97,
        11,
        189,
        144,
        172
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "counterOverflow",
      "msg": "The counter cannot go any higher"
    },
    {
      "code": 6001,
      "name": "seedAlreadyRequested",
      "msg": "Randomness has already been requested or delivered for this seed"
    },
    {
      "code": 6002,
      "name": "seedNotRequested",
      "msg": "This seed is not waiting for randomness (it was never requested, or already filled)"
    }
  ],
  "types": [
    {
      "name": "counter",
      "docs": [
        "A tiny account that stores who owns it and a number they can increase.",
        "",
        "`#[account]` tells Anchor this struct is stored on chain (it handles saving and loading).",
        "`#[derive(InitSpace)]` makes Anchor work out how many bytes the struct needs (`Counter::INIT_SPACE`)."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "docs": [
              "The wallet that created this counter and is allowed to increase it."
            ],
            "type": "pubkey"
          },
          {
            "name": "count",
            "docs": [
              "How many times `increment` has been called. Starts at 0."
            ],
            "type": "u64"
          },
          {
            "name": "bump",
            "docs": [
              "The PDA bump, stored so later instructions reuse it instead of searching again."
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "randomSeed",
      "docs": [
        "One wallet's spike seed, at the PDA `[\"random_seed\", authority]`."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "docs": [
              "The wallet that created this account and may request randomness for it."
            ],
            "type": "pubkey"
          },
          {
            "name": "seed",
            "docs": [
              "The 32 random bytes from the VRF oracle. All zeros until `status` is `Fulfilled`."
            ],
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "status",
            "docs": [
              "Where the request is: Idle, Requested or Fulfilled."
            ],
            "type": {
              "defined": {
                "name": "seedStatus"
              }
            }
          },
          {
            "name": "fulfilledSlot",
            "docs": [
              "Slot in which the oracle's callback landed (0 until fulfilled). Useful to measure latency."
            ],
            "type": "u64"
          },
          {
            "name": "bump",
            "docs": [
              "The PDA bump, stored so later instructions reuse it."
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "seedStatus",
      "docs": [
        "Where a seed request is in its life. Like a TypeScript union of string literals."
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "idle"
          },
          {
            "name": "requested"
          },
          {
            "name": "fulfilled"
          }
        ]
      }
    }
  ],
  "constants": [
    {
      "name": "counterSeed",
      "docs": [
        "Seed for the Phase 0 hello-world Counter PDA: `[\"counter\", authority]`.",
        "`#[constant]` also exports the value into the IDL, so the app can read the same seed."
      ],
      "type": "bytes",
      "value": "[99, 111, 117, 110, 116, 101, 114]"
    },
    {
      "name": "randomSeedSeed",
      "docs": [
        "Seed for the Phase 0 VRF spike RandomSeed PDA: `[\"random_seed\", authority]`."
      ],
      "type": "bytes",
      "value": "[114, 97, 110, 100, 111, 109, 95, 115, 101, 101, 100]"
    }
  ]
};
