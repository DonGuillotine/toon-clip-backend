# Toon Clip

The frontend for Toon Clip, Toon Central's AI studio for animation and comics.
The API is built separately; until each endpoint exists, route handlers in
`src/app/api/` serve schema-parsed fixtures.

## Run it

```bash
pnpm install
pnpm dev          # http://localhost:3000 (pass -p to change the port)
```

## Before you call it done

```bash
pnpm check        # lint, typecheck, test, build
```

## Where things are

| Path                      | What                                                                    |
| ------------------------- | ----------------------------------------------------------------------- |
| `PRODUCT.md`              | What Toon Clip is, who it is for, vocabulary, open decisions            |
| `DESIGN.md`               | The visual system: elevation ladder, radius, colour, type, motion       |
| `AGENTS.md`               | How code is written here, and what lint enforces                        |
| `src/app/`                | Routes. `(app)/` is the signed-in shell; `api/` is the fixture boundary |
| `src/components/ui/`      | Kit primitives (shadcn on Radix, retokenised)                           |
| `src/components/`         | Shared compositions: `Section`, the shell, comic marks                  |
| `src/features/<feature>/` | Schema, fixtures, queries and components per feature                    |
| `refs/`                   | The product spec and the original flow mockup                           |
