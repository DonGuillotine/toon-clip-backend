# Toon Clip: working agreements

Four files hold the truth, and they do not overlap:

- **`AGENTS.md`** (this file) covers how to write code here.
- **`PRODUCT.md`** covers what Toon Clip is, who it is for, and what is decided.
- **`DESIGN.md`** covers the visual system: the elevation ladder, colour,
  type, radius, space, motion. Tokens live in `src/app/globals.css`.
- **`README.md`** covers how to run it.

Rules are durable. When a rule changes it changes here first, then the code.
`pnpm lint` enforces most of this file mechanically. The sections that say
"lint catches this" are AST checks that fail the build, not suggestions.

---

## 0. Scope of this repo

This repo is the **frontend only**. Another developer owns the API. We code
against contracts (zod schemas) and serve fixtures until an endpoint exists.
Do not invent backend behaviour in components; when a contract is unknown,
write the schema you expect, mark it `// CONTRACT: unconfirmed`, and list it
in `PRODUCT.md` under open decisions.

---

## 1. Nothing is assembled from primitives

**Never render a native form control.** No `<input>`, `<select>`,
`<textarea>`, `<button>`, `<option>`, `<progress>`, `<meter>`, `<dialog>`,
`<details>`, `<summary>`, `<fieldset>`, `<output>`. Lint catches this.

A raw control does not manage focus, trap it in a portal, wire
`aria-expanded` / `aria-controls`, handle typeahead, or carry this design
system's tokens. The kit in `src/components/ui/` already does all of that.

**The seam.** `src/components/ui/**` is the only directory allowed to render
native elements, and only when wrapping a Radix primitive so the a11y wiring
comes from the library. Everything outside it composes from the kit.

**Before you write a control, in order:**

1. **Search the kit.** `ls src/components/ui/` and read the component.
2. **Search the app.** Shared compositions live in `src/components/`:
   `Section` (every titled panel), `Card`, `NotBuiltYet`, the shell, and the
   comic marks in `src/components/comic/`. If you are about to write a second
   card or panel header, stop and use `Section`.
3. **Add the shadcn component.** `pnpm dlx shadcn@latest add <name>`, then
   retokenise it by hand and read the diff. Generated defaults carry borders,
   `shadow-*` halos, fixed radii on controls and `as` casts; every one of those
   breaks a rule here (DESIGN.md §2 and §3, AGENTS.md §2).
4. **Only then** write something new: in `src/components/ui/` if it is a
   primitive, in `src/components/` or a feature folder if it composes.

**Prefer the library.** Before writing a helper, a state machine, or a
formatter, check whether a maintained library already does it:

| Job                                     | Library                                   |
| --------------------------------------- | ----------------------------------------- |
| Server state, caching, retries, polling | `@tanstack/react-query`                   |
| Shareable view state                    | `nuqs`                                    |
| Cross-cutting client state              | `zustand`                                 |
| Any untrusted shape entering the app    | `zod`                                     |
| Forms and validation                    | `react-hook-form` + `@hookform/resolvers` |
| Dates                                   | `date-fns`                                |
| Class merging                           | `cn()` from `@/lib/utils`                 |
| Accessible primitives                   | `radix-ui`                                |
| Animation                               | `motion`                                  |
| Toasts                                  | `sonner`                                  |
| Icons                                   | `lucide-react`                            |

Hand-rolling one of these is a defect. `useState` + `fetch` + `useEffect`
where a `useQuery` belongs is the most common form of it.

**Exceptions.** A raw element is fine when it carries no interaction: a
`<div>`, a `<span>`, `<ul>`/`<li>` for a real list, `<h2>` for a heading, `<a>`
via `next/link`. If you believe you need a native control outside the kit, add
an inline `eslint-disable-next-line` with a reason. That is a review
conversation, not a private decision.

---

## 2. TypeScript: types are proven, never asserted

`as` (including `as const`), `<T>x`, `!`, `@ts-ignore`, `@ts-nocheck`, and
`any` are banned. Lint catches all of them.

A type assertion is a claim the compiler cannot check. `value as Shot` does
not verify that `value` is a `Shot`; it silences the one tool that was about
to tell you it is not.

| Instead of                    | Do                                                                 |
| ----------------------------- | ------------------------------------------------------------------ |
| `json as Foo`                 | Parse it: `FooSchema.parse(json)` (the boundary in §4)             |
| `x as const`                  | Annotate (`const X: readonly Status[] = [...]`) or use `satisfies` |
| `x as Foo` after narrowing    | A type predicate: `function isFoo(v: unknown): v is Foo`           |
| `x!`                          | Prove it: `if (!x) throw new Error(...)`, or `??` a real default   |
| `x as unknown as Y`           | You have a boundary problem. Parse at the boundary.                |
| `x as any` to fit a signature | The signature is wrong. Fix it or write an adapter.                |
| A third-party type is wrong   | A validating adapter in `src/lib/`, not a cast per call site       |

`satisfies` is encouraged: it checks the value and keeps the narrow type.
`z.infer<typeof Schema>` is the normal way to get a type for anything that
crosses a boundary.

**Unknown input is `unknown` until it is parsed.** A function that accepts
JSON takes `unknown` and returns a parsed type.

**Model states as discriminated unions.** A shot is `queued | generating |
ready | flagged | locked | failed`, not five booleans. Switch on the
discriminant; lint (`switch-exhaustiveness-check`) fails a switch that misses
a case, so adding a state shows you every place that must handle it.

**Compiler settings** (`tsconfig.json`): `strict`, `noUncheckedIndexedAccess`,
`exactOptionalPropertyTypes`, `noImplicitOverride`, `noImplicitReturns`,
`noPropertyAccessFromIndexSignature`, `verbatimModuleSyntax`. Indexing an
array gives `T | undefined` and you handle it. An optional prop is absent, not
`undefined`; if a prop can be explicitly `undefined`, type it `T | undefined`.

**Lint runs type-aware** (`strictTypeChecked`): floating promises, misused
promises, unsafe `any` flow, unnecessary conditions, and non-exhaustive
switches all fail.

Types are declared with `type`, not `interface`. Imports of types use
`import { type X }`.

---

## 3. State has one owner

Every piece of state has exactly one home.

**Default to the URL.** If pasting the address bar into a chat should
reproduce the view, the state belongs in the URL: the open storyboard, the
selected shot, the active tab, the inspector panel, filters, sort, page.

```ts
const [tab, setTab] = useQueryState("tab", parseAsStringLiteral(TABS).withDefault("video"));
const [shot, setShot] = useQueryState("shot", parseAsString);
```

**Server data belongs to TanStack Query.** Components never `fetch`. They
subscribe with `useQuery` to a feature's `queryOptions`. Long-running
generation jobs are polled or streamed through Query, never a hand-rolled
`setInterval`. Lint rejects bare `fetch(` outside the HTTP boundary.

**`useState` is the last resort**, for state that is local and ephemeral: a
hover flag, a drag offset, a draft prompt not yet submitted. If a second
component needs it, it is not local.

**`zustand` is for cross-cutting client state with no server or URL home**:
timeline playhead, multi-select across the board, an undo stack. It is not a
cache (that is Query) and not a router (that is `nuqs`). A store holding
server data is a bug.

**Shared query data must not change a first render.** The shell and the dock
hydrate before the page, so a query they fetch is already cached when a page
component hydrates. If a page component renders data another component also
queries, gate that part on `useHydrated()` (`src/lib/use-hydrated.ts`), or
read it on the server and pass it as a prop (the greeting does this).

**Never copy query data into `useState` to edit it.** Derive from the query,
send changes through a mutation, invalidate.

---

## 4. Data flow

One pipeline. Every feature follows it.

```
fixture / backend  ──►  src/app/api/<feature>/route.ts  ──►  zod parse  ──►  TanStack Query  ──►  component
                        (the only file that knows
                         where bytes come from)
```

- **Schemas are the boundary.** `src/features/<feature>/schema.ts` owns the
  wire contract. Types come from `z.infer`. Responses are parsed, not cast.
- **One HTTP client.** `src/lib/api/client.ts` `request(path, Schema)` fetches
  and parses. Nothing else calls `fetch`.
- **One `queryOptions` per query** in `src/features/<feature>/queries.ts`,
  shared by server prefetch and client hook.
- **Keys are factories** in `src/lib/query/keys.ts`. Never an inline array.
- **Pages prefetch, components subscribe.** A server component calls
  `prefetchQuery` and wraps in `HydrationBoundary`; the client leaf calls
  `useQuery` with the same options.
- **Fixtures live in `src/features/<feature>/mocks.ts`**, are schema-parsed,
  and are imported only by route handlers. When the backend endpoint lands,
  the route handler changes and no component does.
- **Mutations live in `src/features/<feature>/mutations.ts`.** Optimistic
  updates roll back on error. Every mutation invalidates what it affected.
- **`Promise.allSettled`, never `Promise.all`.** Lint catches this.
- **Credits are never computed in the client.** Cost and balance come from the
  API. The UI shows them; it does not derive them.

---

## 5. Components

- **Server components by default.** `"use client"` claims you need state, an
  effect, an event handler, or a browser API. Push it to the leaf.
- **Colocate by feature.** `src/features/<feature>/` holds schema, mocks,
  queries, mutations, and that feature's components. Reusable compositions
  live in `src/components/` (shell in `shell/`, comic marks and cover art in
  `comic/`). Kit primitives live in `src/components/ui/`.
- **Props are explicit, typed, and `readonly`.** No spreading through more
  than one layer.
- **Only serialisable props cross into a client component.** Strings,
  numbers, plain objects, arrays, and rendered elements are fine; functions,
  components (`icon: Sparkles`), class instances, and `Map`/`Set` are not.
  Render the icon in the server parent and pass `icon={<Sparkles />}`.
- **Every route has `loading.tsx`, `error.tsx`, and `not-found.tsx`.** The
  error boundary prop is `retry` (Next 16), never `reset`. `global-error.tsx`
  rebuilds the document itself.
- **Never render a raw failure.** `error.message`, `error.digest`, stack
  traces, `undefined`, and `NaN` are not copy. An error names the problem and
  the recovery.
- **Unknown is a real value.** `null` is not `0` and not `""`. A missing value
  renders as a designed empty state.
- **Generation is slow and can fail.** Every generated item (shot, take,
  frame) has a designed state for queued, in progress, ready, and failed with
  retry. A spinner with no label is not a state.

---

## 6. Styling

`DESIGN.md` is the full system. The short version:

- **No borders, no shadows.** Depth is luminance: L0 canvas, L1 background,
  L2 card, wells back on L1. The one shadow is `shadow-overlay`, for things
  that leave the document flow (menus, sheets, tooltips, toasts). Comic art
  draws with its own `comic-*` tokens and is exempt.
- **Hover lifts one rung** (a row in a well hovers to `bg-card`); it does not
  tint.
- **Concentric radii** from the explicit scale (`xs` 8 to `3xl` 32):
  `r_inner = r_outer - padding`. Use `Section` rather than re-deriving a card.
- **Pills at control height only.** One line at 36px or less is
  `rounded-full`; anything that can grow is a box with a radius from the scale.
  Lint catches the loud half (`design/control-height`).
- **Comic marks must mean something** (DESIGN.md §1). Speed lines mean moving,
  screentone means fixed or stand-in art. No decorative comic texture in chrome.
- **Tokens only.** Colour, radius, spacing, shadow, stroke, and easing come
  from the custom properties in `globals.css`, exposed through Tailwind's
  `@theme`. A raw hex, an arbitrary `[13px]`, or an inline `cubic-bezier` in a
  component is a bug. If a value is missing, add a token.
- **Padding contains the gap.** A container that spaces its children with
  `gap-*` keeps its own padding at or above that value per axis (`p >= g`).
  Lint catches this (`design/containment`).
- **`cn()` for conditional classes.** Later utilities win.
- **Use logical properties** (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`).
  The centring idiom `left-1/2 -translate-x-1/2` stays physical.
- **Variants go through `cva`**, typed with `VariantProps`. No ad-hoc
  conditional class soup for something that has named states.

---

## 7. Motion

- One curve and one duration scale, owned by `src/lib/motion.ts` and mirrored
  in `globals.css` (`ease-out-strong`, `--duration-press` and friends).
  Components do not author transitions inline. DESIGN.md §7 has the table of
  what animates at all.
- Content is visible at rest. A hidden animation state never uses
  `display: none`, so a failed animation leaves content visible.
- **Animate `transform` and `opacity` only.** Never `width`, `height`, `top`,
  or `left`.
- **Never `scale(0)`.** Start at `0.95` or above with opacity.
- Never `ease-in` on something entering.
- `prefers-reduced-motion` is handled globally in two places and never per
  component: the media query in `globals.css` for CSS, and
  `MotionConfig reducedMotion="user"` in `providers.tsx` for Motion.
- **The more often a user sees it, the less it should move.** A timeline
  scrub does not bounce. A finished export can.

---

## 8. Accessibility floor

A component that fails any of these is unfinished.

- Keyboard operable end to end, with a visible focus ring. The timeline has
  keyboard equivalents for every action (see `PRODUCT.md`).
- Text contrast at least 4.5:1, large text 3:1, against the surface it lands on.
- **No meaning by colour alone.** Shot states carry an icon and a word.
- Icon-only controls carry an accessible name.
- Live regions (`aria-live="polite"`) for anything that updates on its own,
  such as generation progress and credit balance.
- Touch targets at least 44px.

---

## 9. Adding a feature

1. `src/features/<feature>/schema.ts`: the zod contract, types via `z.infer`.
2. `src/features/<feature>/mocks.ts`: fixtures, schema-parsed.
3. `src/lib/query/keys.ts`: the key factory.
4. `src/features/<feature>/queries.ts`: one `queryOptions` per query.
5. `src/app/api/<feature>/route.ts`: serves fixtures now, proxies the backend later.
6. `src/features/<feature>/mutations.ts`: writes, with invalidation.
7. Components in `src/features/<feature>/`, client leaves only where needed.
8. The route in `src/app/`, prefetching via `HydrationBoundary`.
9. `loading.tsx`, `error.tsx`, `not-found.tsx`.
10. View state in the URL with `nuqs`.

**Removing or moving a feature** is complete only when nothing carries the old
name: route folder, API route, feature folder, key factory, tests, copy.
`grep -rni "<old name>" src` returns nothing.

---

## 10. Gates

Nothing is done until all of these pass:

```bash
pnpm lint        # --max-warnings=0, includes the AST rules above
pnpm typecheck
pnpm test
pnpm build
```

`pnpm check` runs all four. For a UI change, also look at it in the browser
at desktop and mobile widths and tab through it with the keyboard.

---

## 11. Language

- **Plain words.** Use the product's own terms (sheet, shot, take, frame,
  board, recipe, Magic Prompt) exactly as `PRODUCT.md` defines them. Do not
  invent synonyms.
- **No em dash, anywhere**: not in copy, metadata, `alt` text, comments, or
  docs. Use a comma, a colon, or two sentences. Lint catches it in source.
- Copy is sentence case unless the design system says otherwise for a
  specific display role.
- Error copy names the problem and the recovery. Cost copy names the number.

---

## 12. What lint enforces

Implemented in `eslint.config.mjs` and `eslint/rules/design.mjs`.

| Rule                                                                 | Scope                                                   |
| -------------------------------------------------------------------- | ------------------------------------------------------- |
| No `as`, `as const`, `<T>x`, `!`, `@ts-ignore`, `@ts-nocheck`, `any` | everywhere                                              |
| `strictTypeChecked` + `stylisticTypeChecked`                         | everywhere                                              |
| Exhaustive `switch` over unions                                      | everywhere                                              |
| `type` over `interface`, inline type imports                         | everywhere                                              |
| No native form controls                                              | everywhere except `src/components/ui/**`                |
| No bare `fetch(`                                                     | everywhere except `src/app/api/**` and `src/lib/api/**` |
| No `Promise.all(`                                                    | everywhere                                              |
| No `dangerouslySetInnerHTML`                                         | everywhere                                              |
| No em dash in string literals or JSX text                            | everywhere                                              |
| Padding smaller than the gap, per axis                               | everywhere (`design/containment`)                       |
| `rounded-full` on a box past control height                          | everywhere (`design/control-height`)                    |
| No `console.log`                                                     | everywhere                                              |

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
