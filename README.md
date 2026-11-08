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

### 7. Verify

Open a new terminal, then:

```sh
rustc --version && cargo --version
rustup target list --installed   # should include wasm32-unknown-unknown
solana --version
anchor --version
wasm-pack --version
node --version && pnpm --version
```

### 8. Solana CLI: devnet and a wallet keypair

```sh
solana config set --url devnet
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

Build, test and run commands will be added here once the monorepo is scaffolded and the commands
are verified.
