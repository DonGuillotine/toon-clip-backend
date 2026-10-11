# Toon Clip

The frontend for Toon Clip, Toon Central's AI studio for animation and comics.
The API is built separately and is live (`refs/Live-backend-handoff.md`).
Screens it does not back yet run on fixtures and show only in dev mode.

## Run it

```bash
pnpm install
cp .env.example .env.local
pnpm dev          # http://localhost:5050
```

Port 5050 matters: the API only accepts browser origins it has been told
about, and `http://localhost:5050` is the one configured for development. A
deployed frontend's origin has to be added to `TOON_FRONTEND_ORIGINS` on the
API's Render service.

**Dev mode.** The "Dev" switch at the bottom of the sidebar shows the screens
that still run on fixtures (quick create, storyboards, desk, watch, gallery,
audio, comics, characters, profile, tour), each marked "Dev". Off, the app
shows only what the API backs.

**Buying credits** needs a browser wallet (Phantom or Solflare) set to Devnet,
with a little Devnet SOL (faucet.solana.com) and 10 Devnet USDC
(faucet.circle.com).

## Before you call it done

```bash
pnpm check        # lint, typecheck, test, build
```

## Where things are

| Path                      | What                                                                                                               |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `PRODUCT.md`              | What Toon Clip is, who it is for, vocabulary, open decisions                                                       |
| `DESIGN.md`               | The visual system: elevation ladder, radius, colour, type, motion                                                  |
| `AGENTS.md`               | How code is written here, and what lint enforces                                                                   |
| `src/app/`                | Routes. `(app)/` is the shell; `api/v1/` forwards to the live API; the other `api/` routes serve dev-mode fixtures |
| `src/proxy.ts`            | Starts the API session; answers 404 for fixture routes when dev mode is off                                        |
| `src/components/ui/`      | Kit primitives (shadcn on Radix, retokenised)                                                                      |
| `src/components/`         | Shared compositions: `Section`, the shell, comic marks                                                             |
| `src/features/<feature>/` | Schema, fixtures, queries and components per feature                                                               |
| `refs/`                   | The product spec and the original flow mockup                                                                      |
