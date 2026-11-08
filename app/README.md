# app

The moirai frontend: React + TypeScript (strict) + Vite, styled-components, React Router, TanStack
Query, the Solana wallet adapter and typesafe-i18n. It reads chain state, sends signed instructions
and renders the game. It never decides a match outcome.

Built from the "Moirai: app UI designs" canvas: Lobbies, Create lobby, Lobby (join/commit/reveal),
Policy editor, Simulator, Live match (with a phone layout), Replay, Results, Leaderboard and
Profile.

**What's real:** the map's deposits and cities (civ-core in WASM), the wallet button and balance,
the policy editor's checks, and the `/dev/connection` check against the devnet program. **What's
sample data:** lobbies, matches, players and results (from `src/data`, served through hooks) and
territory growth over turns, until the match program and the turn engine exist. A banner says so.

## Commands

```sh
pnpm dev          # dev server on localhost:5173 (needs `pnpm build:wasm` at the repo root first)
pnpm build        # typecheck + production build into dist/
pnpm lint         # oxlint
pnpm typecheck    # regenerate i18n types, then tsc
pnpm test         # vitest (jsdom + React Testing Library)
pnpm i18n         # regenerate typesafe-i18n types after changing a translation
```

Copy `.env.example` to `.env.local` to point at a different RPC.

## Text and languages

All text is translated with [typesafe-i18n](https://github.com/ivanhofer/typesafe-i18n):

```tsx
const { LL } = useI18nContext();
LL.lobbies.home.title();                      // plain text
LL.lobbies.lobby.action.join({ fee: "0.5 SOL" }); // text with a typed parameter
```

English (`src/i18n/en`) is the source. Spanish and French are draft translations. To add a string:
add it to `en/`, then to `es/` and `fr/` (the typecheck fails until every language has it).
To add a language: create `src/i18n/<code>/` like `es/`, run `pnpm i18n`, and add it to
`LANGUAGE_INFO` in `src/i18n/setup.ts`.

## Folders

| Folder | What lives there |
| --- | --- |
| `components/` | atoms → molecules → organisms → templates (CLAUDE.md section 8) |
| `pages/` | one per route |
| `routes/` | router, layout route and path constants |
| `hooks/` | every data read: chain, engine and sample data |
| `lib/solana`, `lib/engine` | the only code that talks to Solana and to the civ-core WASM |
| `model/` | pure logic (map decoding, policy checks, highlighting, formatting) |
| `data/` | static and sample data |
| `types/` | shared shapes |
| `i18n/`, `theme/` | translations and design tokens |

## Where to start reading

`src/main.tsx` → `src/routes/router.tsx` → `src/pages/LobbiesPage/LobbiesPage.tsx`.
