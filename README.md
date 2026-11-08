# moirai

An on-chain bot-arena strategy game built on Solana and React. Players write YAML policies for AI
civilizations, pay an entry fee, and their bots compete for territory and resources on a shared map
for 60 turns. A Solana program runs every policy, holds the prize pool, pays the winner and keeps
the leaderboard.

See [docs/PLAN.md](docs/PLAN.md) for the full plan, and [docs/decisions/](docs/decisions/) for
decisions made since.

## Toolchain

These are the pinned versions. Anchor and Solana are pinned to what the MagicBlock Ephemeral
Rollups and VRF SDKs are tested against; don't upgrade them without checking compatibility first.

| Tool | Version | Notes |
| --- | --- | --- |
| Rust (rustup) | stable (1.99.1) | plus the `wasm32-unknown-unknown` target |
| Solana CLI (Agave) | 3.1.14 | |
| Anchor CLI (via AVM) | 1.0.2 | |
| Node.js | 24.22.2 (LTS) | pinned in `.node-version` |
| pnpm | 12.18.0 | via corepack |
| wasm-pack | 0.15.1 | |
| GitHub CLI `gh` | any | optional |

## Installation

These steps are for macOS (Apple Silicon or Intel). On Windows, install WSL2 (Ubuntu) and run
everything inside it. On Linux/WSL, first install the build dependencies:

```sh
sudo apt-get update
sudo apt-get install -y build-essential pkg-config libudev-dev llvm libclang-dev protobuf-compiler libssl-dev
```

### 1. Build tools (macOS)

```sh
xcode-select --install   # skip if Xcode or the Command Line Tools are already installed
```

### 2. Rust

```sh
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
. "$HOME/.cargo/env"
rustup target add wasm32-unknown-unknown
```

### 3. Solana CLI (Agave)

```sh
sh -c "$(curl -sSfL https://release.anza.xyz/v3.1.14/install)"
```

The installer adds Solana to your PATH in `~/.zprofile` / `~/.profile`. Restart your terminal, or
run this in the current one:

```sh
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
```

### 4. Anchor CLI via AVM

```sh
cargo install --git https://github.com/solana-foundation/anchor --tag v1.0.2 avm --force --locked
avm install 1.0.2
avm use 1.0.2
```

This compiles from source and takes a few minutes. Ignore AVM's "new version available" notice;
we are pinned to 1.0.2 on purpose.

### 5. wasm-pack

```sh
cargo install wasm-pack --version 0.15.1 --locked
```

### 6. Node.js and pnpm

Use a Node version manager. These steps use [fnm](https://github.com/Schniz/fnm); nvm works too.
The repo's `.node-version` pins Node 24.

```sh
# in the repo root
fnm install          # reads .node-version
fnm use
corepack enable pnpm
corepack prepare pnpm@12.18.0 --activate
```

With `eval "$(fnm env --use-on-cd --shell zsh)"` in your `~/.zshrc`, fnm switches Node
automatically when you `cd` into the repo.

### 7. Surfpool (local validator for `anchor test`)

Anchor 1.0 runs tests on [Surfpool](https://github.com/solana-foundation/surfpool) by default.

```sh
curl -sL https://run.surfpool.run/ | bash   # installs to ~/.local/bin and adds it to your PATH
```

Don't use `cargo install surfpool`: that crates.io name belongs to an unrelated crate.

### 8. Verify

Open a new terminal, then:

```sh
rustc --version && cargo --version
rustup target list --installed   # should include wasm32-unknown-unknown
solana --version
anchor --version
surfpool --version
wasm-pack --version
node --version && pnpm --version
```

### 9. Solana CLI: devnet and a wallet keypair

```sh
solana config set --url https://rpc.magicblock.app/devnet   # devnet via MagicBlock's RPC (see "Devnet" below)
solana-keygen new --outfile ~/.config/solana/id.json   # only if you don't already have one
```

`solana-keygen new` prints a seed phrase. **Write it down offline and never commit it, paste it
anywhere or share it.** Then fund the wallet with devnet SOL:

```sh
solana address
solana airdrop 2
```

If the airdrop is rate-limited, use the web faucet at <https://faucet.solana.com> with the address
printed by `solana address`.

## Development

### Repo layout

| Folder | What it is |
| --- | --- |
| `crates/civ-core` | All game rules, plain Rust, no Solana dependencies |
| `crates/civ-wasm` | wasm-bindgen wrapper so the browser can run civ-core |
| `crates/civ-cli` | Runs local matches between YAML bots |
| `programs/civ` | The Anchor (Solana) program |
| `app` | React + TypeScript + Vite frontend |
| `tests` | Anchor integration tests (TypeScript, mocha) |
| `scripts/crank` | Calls `advance_turn` (Phase 3) |
| `policies` | Sample YAML bots (Phase 1) |

### Commands

Run from the repo root:

```sh
pnpm install                          # JS dependencies for app, tests and scripts

cargo build --workspace               # build all Rust crates
cargo test --workspace                # test all Rust crates
cargo run -p civ-cli                  # run the local match runner
pnpm build:wasm                       # build civ-wasm into crates/civ-wasm/pkg

anchor build                          # build the program (+ IDL and TS types in target/)
pnpm sync:idl                         # copy that IDL + types into the app (after every anchor build)
anchor test                           # build, start a local Surfpool validator, run tests/

pnpm dev                              # app dev server on localhost:5173
pnpm lint && pnpm typecheck && pnpm test
```

Add `--validator legacy` to `anchor test` to use `solana-test-validator` instead of Surfpool.
Deploying is covered in the Devnet section below.

## Devnet

| | |
| --- | --- |
| Program ID | `GPdm56hssFExZrtGspZprjbfecXbRKYtAJGQ4X1ysNkc` (deployed 2026-11-08: hello-world Counter) |
| Cluster | devnet only (never mainnet) |
| RPC we use | `https://rpc.magicblock.app/devnet` |
| Explorer | [program on Solana Explorer](https://explorer.solana.com/address/GPdm56hssFExZrtGspZprjbfecXbRKYtAJGQ4X1ysNkc?cluster=devnet) |

### Which RPC, and why

We use **MagicBlock's devnet RPC** (`https://rpc.magicblock.app/devnet`) for deploying, the CLI and
the app. It is real Solana devnet (same genesis hash as `api.devnet.solana.com`), just less
congested. The public `api.devnet.solana.com` rate-limits hard (HTTP 429): a 147 KB deploy needs
about 150 write transactions, and through the public RPC it stalled at 0% and then failed with
`Data writes to account failed: Max retries exceeded`. It's also the base-layer RPC MagicBlock's
docs use, so it fits the Ephemeral Rollups work in Phase 3.

Point the Solana CLI at it once:

```sh
solana config set --url https://rpc.magicblock.app/devnet
```

The app reads `VITE_SOLANA_RPC_URL` (see `app/.env.example`, which defaults to the same RPC).

### Deploy the program

```sh
anchor build
solana program deploy target/deploy/civ.so \
  --program-id target/deploy/civ-keypair.json \
  --url https://rpc.magicblock.app/devnet \
  --max-sign-attempts 50 --with-compute-unit-price 10000
solana program show GPdm56hssFExZrtGspZprjbfecXbRKYtAJGQ4X1ysNkc --url https://rpc.magicblock.app/devnet
```

- The first deploy costs about 1 SOL of rent (for a 147 KB program). Redeploying the same program ID
  is an upgrade and reuses it.
- `--max-sign-attempts 50` lets the CLI re-send dropped writes instead of giving up;
  `--with-compute-unit-price 10000` adds a tiny priority fee so writes land sooner.
- `target/deploy/civ-keypair.json` is the program's keypair. It's gitignored; never commit it.

### If a deploy fails or you stop it

The upload goes into a temporary **buffer** account that holds the SOL. Get it back with:

```sh
solana program show --buffers --url https://rpc.magicblock.app/devnet
solana program close --buffers --url https://rpc.magicblock.app/devnet
```

Then run the deploy again.
