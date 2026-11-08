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
      "name": "advanceTurn",
      "docs": [
        "Play the next turn of a running match; the caller gets the crank reward."
      ],
      "discriminator": [
        20,
        108,
        166,
        78,
        43,
        211,
        57,
        29
      ],
      "accounts": [
        {
          "name": "caller",
          "docs": [
            "Whoever advances the match. Receives the crank reward."
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "matchAccount",
          "docs": [
            "The running match."
          ],
          "writable": true
        },
        {
          "name": "vault",
          "docs": [
            "This match's vault: pays the crank reward."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "matchAccount"
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
      "name": "cancelMatch",
      "docs": [
        "Cancel a lobby that didn't fill by its join deadline and refund every player. Pass the",
        "players as remaining accounts, in join order."
      ],
      "discriminator": [
        142,
        136,
        247,
        45,
        92,
        112,
        180,
        83
      ],
      "accounts": [
        {
          "name": "caller",
          "docs": [
            "Whoever cancels. Pays the transaction fee only."
          ],
          "signer": true
        },
        {
          "name": "matchAccount",
          "docs": [
            "The lobby to cancel. `close = creator` sends its rent to the creator when the instruction",
            "succeeds; `has_one = creator` checks the creator account passed is the real one."
          ],
          "writable": true
        },
        {
          "name": "vault",
          "docs": [
            "This match's vault."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "matchAccount"
              }
            ]
          }
        },
        {
          "name": "creator",
          "docs": [
            "The match's creator: receives the rent of both accounts."
          ],
          "writable": true,
          "relations": [
            "matchAccount"
          ]
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "commitPolicy",
      "docs": [
        "Lock in a policy by storing only its hash: sha256(compiled bytes || 32-byte salt)."
      ],
      "discriminator": [
        7,
        133,
        207,
        223,
        174,
        166,
        36,
        223
      ],
      "accounts": [
        {
          "name": "player",
          "signer": true
        },
        {
          "name": "matchAccount",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "commitment",
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
      "name": "createMatch",
      "docs": [
        "Open a lobby: create the Match and its Vault."
      ],
      "discriminator": [
        107,
        2,
        184,
        145,
        70,
        142,
        17,
        165
      ],
      "accounts": [
        {
          "name": "creator",
          "docs": [
            "Opens the lobby and pays the rent for the Match and Vault accounts."
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "matchAccount",
          "docs": [
            "The new match, at `[\"match\", creator, match_id]`."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  116,
                  99,
                  104
                ]
              },
              {
                "kind": "account",
                "path": "creator"
              },
              {
                "kind": "arg",
                "path": "matchId"
              }
            ]
          }
        },
        {
          "name": "vault",
          "docs": [
            "The match's vault: a plain System-owned account at `[\"vault\", match]` that only ever holds",
            "lamports. It comes into existence when the rent deposit below lands in it."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "matchAccount"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "matchId",
          "type": "u64"
        },
        {
          "name": "settings",
          "type": {
            "defined": {
              "name": "matchSettings"
            }
          }
        }
      ]
    },
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
      "name": "fulfillMatchSeed",
      "docs": [
        "VRF oracle callback: builds turn 0 of the game from the seed. Only the VRF program can call it."
      ],
      "discriminator": [
        83,
        228,
        26,
        223,
        146,
        212,
        121,
        53
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
          "name": "matchAccount",
          "docs": [
            "The Match named in the request (`accounts_metas` in `start_match`)."
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
      "name": "joinMatch",
      "docs": [
        "Join an open lobby, paying the entry fee into its vault."
      ],
      "discriminator": [
        244,
        8,
        47,
        130,
        192,
        59,
        179,
        44
      ],
      "accounts": [
        {
          "name": "player",
          "docs": [
            "The joining player. Signs and pays the entry fee."
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "matchAccount",
          "docs": [
            "The lobby to join."
          ],
          "writable": true
        },
        {
          "name": "vault",
          "docs": [
            "This match's vault. The seeds tie it to `match_account`, so a fee can't go anywhere else."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "matchAccount"
              }
            ]
          }
        },
        {
          "name": "profile",
          "docs": [
            "The player's Profile at `[\"profile\", player]`. `init_if_needed` creates it (paid by the",
            "player) the first time this wallet joins any match, and just loads it after that."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "player"
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
      "name": "retryMatchSeed",
      "docs": [
        "Ask the VRF oracle for the map seed again if it hasn't answered in time. Base layer."
      ],
      "discriminator": [
        229,
        157,
        47,
        73,
        150,
        36,
        229,
        236
      ],
      "accounts": [
        {
          "name": "caller",
          "docs": [
            "Whoever starts the match. Pays the oracle request fee."
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "matchAccount",
          "docs": [
            "The lobby to start."
          ],
          "writable": true
        },
        {
          "name": "oracleQueue",
          "docs": [
            "or the localnet test queue), so nobody can point us at a fake one."
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
      "name": "revealPolicy",
      "docs": [
        "Reveal the committed policy: the program checks the hash and the bytes."
      ],
      "discriminator": [
        118,
        121,
        139,
        225,
        21,
        117,
        59,
        69
      ],
      "accounts": [
        {
          "name": "player",
          "signer": true
        },
        {
          "name": "matchAccount",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "policy",
          "type": "bytes"
        },
        {
          "name": "salt",
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
      "name": "settleMatch",
      "docs": [
        "Settle a finished match: pay the pot, update Profiles and the Top 10, close the match. Pass",
        "each player's wallet and Profile, in seat order, as remaining accounts."
      ],
      "discriminator": [
        71,
        124,
        117,
        96,
        191,
        217,
        116,
        24
      ],
      "accounts": [
        {
          "name": "caller",
          "docs": [
            "Whoever settles. Pays for the Top 10 account the very first time any match is settled."
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "matchAccount",
          "docs": [
            "The finished match. Closed at the end, its rent going to the creator."
          ],
          "writable": true
        },
        {
          "name": "vault",
          "docs": [
            "This match's vault: pays the winners."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "matchAccount"
              }
            ]
          }
        },
        {
          "name": "creator",
          "writable": true,
          "relations": [
            "matchAccount"
          ]
        },
        {
          "name": "topTen",
          "docs": [
            "The leaderboard at `[\"top10\"]`, created the first time any match settles."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  111,
                  112,
                  49,
                  48
                ]
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
      "name": "startMatch",
      "docs": [
        "Ask the VRF oracle for the map seed of a full, revealed lobby. Send to the base layer."
      ],
      "discriminator": [
        100,
        246,
        223,
        181,
        176,
        101,
        255,
        19
      ],
      "accounts": [
        {
          "name": "caller",
          "docs": [
            "Whoever starts the match. Pays the oracle request fee."
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "matchAccount",
          "docs": [
            "The lobby to start."
          ],
          "writable": true
        },
        {
          "name": "oracleQueue",
          "docs": [
            "or the localnet test queue), so nobody can point us at a fake one."
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
      "name": "startMatchLocalTest",
      "docs": [
        "Start a match with a chosen seed. Local test validator only (`local-testing` feature)."
      ],
      "discriminator": [
        100,
        232,
        12,
        16,
        13,
        13,
        237,
        187
      ],
      "accounts": [
        {
          "name": "caller",
          "signer": true
        },
        {
          "name": "matchAccount",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "seed",
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
      "name": "match",
      "discriminator": [
        236,
        63,
        169,
        38,
        15,
        56,
        196,
        162
      ]
    },
    {
      "name": "profile",
      "discriminator": [
        184,
        101,
        165,
        188,
        95,
        63,
        127,
        188
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
    },
    {
      "name": "topTen",
      "discriminator": [
        228,
        112,
        71,
        226,
        226,
        203,
        48,
        244
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
    },
    {
      "code": 6003,
      "name": "invalidPlayerCount",
      "msg": "A match needs between 2 and 4 players"
    },
    {
      "code": 6004,
      "name": "unknownWinMetric",
      "msg": "Unknown win metric: use 0 Territory, 1 Wealth, 2 Conquest or 3 Score"
    },
    {
      "code": 6005,
      "name": "unknownPayout",
      "msg": "Unknown payout: use 0 winner takes all or 1 top three"
    },
    {
      "code": 6006,
      "name": "badDeadlines",
      "msg": "Deadlines must be in the future and in order: join, then commit, then reveal"
    },
    {
      "code": 6007,
      "name": "matchNotOpen",
      "msg": "This match is not accepting new players"
    },
    {
      "code": 6008,
      "name": "joinDeadlinePassed",
      "msg": "The join deadline has passed"
    },
    {
      "code": 6009,
      "name": "matchFull",
      "msg": "This match is full"
    },
    {
      "code": 6010,
      "name": "alreadyJoined",
      "msg": "You have already joined this match"
    },
    {
      "code": 6011,
      "name": "joinStillOpen",
      "msg": "Players can still join this match; it can only be cancelled after the join deadline"
    },
    {
      "code": 6012,
      "name": "wrongRefundAccounts",
      "msg": "The refund accounts must be exactly the joined players, in join order"
    },
    {
      "code": 6013,
      "name": "notAPlayer",
      "msg": "You haven't joined this match"
    },
    {
      "code": 6014,
      "name": "commitDeadlinePassed",
      "msg": "The commit deadline has passed"
    },
    {
      "code": 6015,
      "name": "alreadyCommitted",
      "msg": "You have already committed a policy for this match"
    },
    {
      "code": 6016,
      "name": "emptyCommitment",
      "msg": "A commitment can't be all zeros"
    },
    {
      "code": 6017,
      "name": "lobbyNotFull",
      "msg": "Policies can only be revealed once the lobby is full"
    },
    {
      "code": 6018,
      "name": "commitsStillOpen",
      "msg": "Players can still commit: reveal once everyone has committed or the commit deadline has passed"
    },
    {
      "code": 6019,
      "name": "revealDeadlinePassed",
      "msg": "The reveal deadline has passed"
    },
    {
      "code": 6020,
      "name": "notCommitted",
      "msg": "You didn't commit a policy, so there is nothing to reveal"
    },
    {
      "code": 6021,
      "name": "alreadyRevealed",
      "msg": "You have already revealed your policy"
    },
    {
      "code": 6022,
      "name": "wrongPolicyHash",
      "msg": "This policy and salt don't match your commitment"
    },
    {
      "code": 6023,
      "name": "invalidPolicy",
      "msg": "Those bytes are not a valid compiled policy"
    },
    {
      "code": 6024,
      "name": "revealsStillOpen",
      "msg": "Players can still reveal: start once everyone has revealed or the reveal deadline has passed"
    },
    {
      "code": 6025,
      "name": "misalignedMatchState",
      "msg": "The match data in this account is not laid out as expected"
    },
    {
      "code": 6026,
      "name": "localTestingDisabled",
      "msg": "start_match_local_test only works in a build with the local-testing feature"
    },
    {
      "code": 6027,
      "name": "seedRequestNotTimedOut",
      "msg": "The oracle may still deliver the seed: retry once the request has timed out"
    },
    {
      "code": 6028,
      "name": "matchNotRunning",
      "msg": "This match isn't being played"
    },
    {
      "code": 6029,
      "name": "matchOver",
      "msg": "This match is over: no more turns can be played"
    },
    {
      "code": 6030,
      "name": "rewardOverflow",
      "msg": "The crank reward is too large to compute"
    },
    {
      "code": 6031,
      "name": "matchNotFinished",
      "msg": "This match isn't finished: its last turn hasn't been played"
    },
    {
      "code": 6032,
      "name": "wrongSettleAccounts",
      "msg": "Pass each player's wallet and Profile, in seat order, as remaining accounts"
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
      "name": "match",
      "docs": [
        "One match, as plain bytes (3,696 bytes after the discriminator).",
        "",
        "`#[account(zero_copy)]`: Anchor never copies this into a Rust value; instructions read and",
        "write the account's bytes in place through `AccountLoader`. Field order keeps every number on",
        "its natural boundary so there are no hidden padding bytes."
      ],
      "serialization": "bytemuck",
      "repr": {
        "kind": "c"
      },
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "creator",
            "docs": [
              "The wallet that created the lobby. Gets the account rent back when the match is closed."
            ],
            "type": "pubkey"
          },
          {
            "name": "players",
            "docs": [
              "Players in join order; unused slots are the default (all-zero) key."
            ],
            "type": {
              "array": [
                "pubkey",
                4
              ]
            }
          },
          {
            "name": "commitments",
            "docs": [
              "Each player's commitment: sha256(compiled policy bytes || 32-byte salt). All zero = none."
            ],
            "type": {
              "array": [
                {
                  "array": [
                    "u8",
                    32
                  ]
                },
                4
              ]
            }
          },
          {
            "name": "matchId",
            "docs": [
              "The creator's number for this match; part of the address, so one wallet can run many."
            ],
            "type": "u64"
          },
          {
            "name": "entryFeeLamports",
            "docs": [
              "What each player pays to join, in lamports."
            ],
            "type": "u64"
          },
          {
            "name": "joinDeadline",
            "docs": [
              "Unix time (seconds) after which nobody can join."
            ],
            "type": "i64"
          },
          {
            "name": "commitDeadline",
            "docs": [
              "Unix time after which nobody can commit."
            ],
            "type": "i64"
          },
          {
            "name": "revealDeadline",
            "docs": [
              "Unix time after which nobody can reveal; the match can start then."
            ],
            "type": "i64"
          },
          {
            "name": "seedRequestedAt",
            "docs": [
              "Unix time the map seed was last requested from the VRF oracle (0 = never). Lets",
              "`retry_match_seed` ask again if the oracle doesn't answer."
            ],
            "type": "i64"
          },
          {
            "name": "matchState",
            "docs": [
              "The game, a `civ_core::match_state::MatchState` byte for byte (filled at start_match)."
            ],
            "type": {
              "array": [
                "u8",
                1344
              ]
            }
          },
          {
            "name": "policies",
            "docs": [
              "Each player's revealed compiled policy, padded with zeros."
            ],
            "type": {
              "array": [
                {
                  "array": [
                    "u8",
                    499
                  ]
                },
                4
              ]
            }
          },
          {
            "name": "policyLengths",
            "docs": [
              "How many bytes of each `policies` slot are the policy (0 = not revealed)."
            ],
            "type": {
              "array": [
                "u16",
                4
              ]
            }
          },
          {
            "name": "playerCount",
            "docs": [
              "How many players have joined."
            ],
            "type": "u8"
          },
          {
            "name": "maxPlayers",
            "docs": [
              "How many players the lobby waits for (2 to 4)."
            ],
            "type": "u8"
          },
          {
            "name": "status",
            "docs": [
              "A `MatchStatus`, as its byte."
            ],
            "type": "u8"
          },
          {
            "name": "winMetric",
            "docs": [
              "The win metric, as its byte (see `win_metric_from_byte`)."
            ],
            "type": "u8"
          },
          {
            "name": "payout",
            "docs": [
              "A `Payout`, as its byte."
            ],
            "type": "u8"
          },
          {
            "name": "bump",
            "docs": [
              "This account's PDA bump."
            ],
            "type": "u8"
          },
          {
            "name": "vaultBump",
            "docs": [
              "The vault's PDA bump, used to sign transfers out of it."
            ],
            "type": "u8"
          },
          {
            "name": "committedFlags",
            "docs": [
              "Bit i set = player i has committed."
            ],
            "type": "u8"
          },
          {
            "name": "revealedFlags",
            "docs": [
              "Bit i set = player i has revealed."
            ],
            "type": "u8"
          },
          {
            "name": "reserved",
            "docs": [
              "Unused; always zero. Rounds the size up to a multiple of 8."
            ],
            "type": {
              "array": [
                "u8",
                3
              ]
            }
          }
        ]
      }
    },
    {
      "name": "matchSettings",
      "docs": [
        "The lobby's settings, chosen by the creator.",
        "",
        "`AnchorSerialize`/`AnchorDeserialize` let this struct travel as instruction data (Anchor",
        "turns it into bytes in the client and back here), and it shows up as a type in the IDL."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "entryFeeLamports",
            "docs": [
              "What each player pays to join, in lamports."
            ],
            "type": "u64"
          },
          {
            "name": "maxPlayers",
            "docs": [
              "How many players the lobby waits for (2 to 4)."
            ],
            "type": "u8"
          },
          {
            "name": "winMetric",
            "docs": [
              "0 Territory, 1 Wealth, 2 Conquest, 3 Score."
            ],
            "type": "u8"
          },
          {
            "name": "payout",
            "docs": [
              "0 winner takes all, 1 top three (60/30/10)."
            ],
            "type": "u8"
          },
          {
            "name": "joinDeadline",
            "docs": [
              "Unix time after which nobody can join."
            ],
            "type": "i64"
          },
          {
            "name": "commitDeadline",
            "docs": [
              "Unix time after which nobody can commit (after the join deadline)."
            ],
            "type": "i64"
          },
          {
            "name": "revealDeadline",
            "docs": [
              "Unix time after which nobody can reveal (after the commit deadline)."
            ],
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "profile",
      "docs": [
        "A player's rating and history."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "wallet",
            "docs": [
              "The wallet this profile belongs to."
            ],
            "type": "pubkey"
          },
          {
            "name": "elo",
            "docs": [
              "Elo rating (starts at 1,200; see elo.rs)."
            ],
            "type": "u32"
          },
          {
            "name": "matchesPlayed",
            "docs": [
              "Matches settled with this wallet in them."
            ],
            "type": "u32"
          },
          {
            "name": "wins",
            "docs": [
              "Matches this wallet won (tied winners all count as winning)."
            ],
            "type": "u32"
          },
          {
            "name": "winningsLamports",
            "docs": [
              "Total lamports won from pots."
            ],
            "type": "u64"
          },
          {
            "name": "bump",
            "docs": [
              "This account's PDA bump."
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
    },
    {
      "name": "topTen",
      "docs": [
        "The ten best ratings, best first."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "entries",
            "type": {
              "array": [
                {
                  "defined": {
                    "name": "topTenEntry"
                  }
                },
                10
              ]
            }
          },
          {
            "name": "bump",
            "docs": [
              "This account's PDA bump."
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "topTenEntry",
      "docs": [
        "One leaderboard place. An unused place has the default (all-zero) wallet."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "wallet",
            "type": "pubkey"
          },
          {
            "name": "elo",
            "type": "u32"
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
      "name": "matchSeed",
      "docs": [
        "Seed for a Match PDA: `[\"match\", creator, match_id as 8 little-endian bytes]`."
      ],
      "type": "bytes",
      "value": "[109, 97, 116, 99, 104]"
    },
    {
      "name": "profileSeed",
      "docs": [
        "Seed for a wallet's Profile PDA: `[\"profile\", wallet]`."
      ],
      "type": "bytes",
      "value": "[112, 114, 111, 102, 105, 108, 101]"
    },
    {
      "name": "randomSeedSeed",
      "docs": [
        "Seed for the Phase 0 VRF spike RandomSeed PDA: `[\"random_seed\", authority]`."
      ],
      "type": "bytes",
      "value": "[114, 97, 110, 100, 111, 109, 95, 115, 101, 101, 100]"
    },
    {
      "name": "topTenSeed",
      "docs": [
        "Seed for the single TopTen PDA: `[\"top10\"]`."
      ],
      "type": "bytes",
      "value": "[116, 111, 112, 49, 48]"
    },
    {
      "name": "vaultSeed",
      "docs": [
        "Seed for a match's Vault PDA (holds the entry fees): `[\"vault\", match]`."
      ],
      "type": "bytes",
      "value": "[118, 97, 117, 108, 116]"
    }
  ]
};
