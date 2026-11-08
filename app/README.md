# app

The moirai frontend: React + TypeScript (strict) + Vite. It reads chain state, sends signed
instructions and renders the game. It never decides a match outcome.

Scaffold only for now: a router with one placeholder page and the folder structure from CLAUDE.md
section 8 (atoms, molecules, organisms, templates, pages, routes, hooks, lib, theme, test).

## Commands

```sh
pnpm dev          # dev server on localhost:5173
pnpm build        # typecheck + production build into dist/
pnpm lint         # oxlint
pnpm typecheck    # tsc
pnpm test         # vitest (jsdom + React Testing Library)
```

Copy `.env.example` to `.env.local` to point at a different RPC.

## Where to start reading

`src/main.tsx` → `src/routes/router.tsx` → `src/pages/`.
