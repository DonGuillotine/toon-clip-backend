# Toon Clip design system

Toon Clip is a studio people work in for hours: they write, wait for
generations, compare takes, fix one shot, and go again. The interface is a
night comic: a navy page with a printed dot grid, panels drawn with a 2px
edge, condensed uppercase display type, and one electric green for the action.
The source of truth for the look is `refs/Toon_Clip_Flow_Mockup_v2.html`.

Tokens live in `src/app/globals.css`. Motion values are mirrored in
`src/lib/motion.ts`. `AGENTS.md` covers how to write the code; this file covers
what it should look like and why.

---

## 1. Principles

**Printed, not glowing.** Edges are flat 2px lines. Shadows are hard offsets
with no blur, like a misregistered print. Nothing glows, nothing is frosted
except a tag sitting on art.

**One green, spent on action.** `primary` marks the main action in a view,
the active tab, the active nav item, the balance, and focus. If everything is
green, nothing is.

**Comic marks mean something.** Every comic device in the chrome has a job:

| Device            | Where                                                      | What it means                           |
| ----------------- | ---------------------------------------------------------- | --------------------------------------- |
| Dot grid          | The page behind everything                                 | The paper. Never on a panel.            |
| Kicker tag        | Yellow, tilted 1.5deg, above a page title                  | Where you are, or what kind of thing    |
| Speed lines       | Progress fill, generating shot segment                     | Something is moving right now           |
| Screentone        | Locked shot segment, character roundels                    | Fixed, or a stand-in for art            |
| Focus-line burst  | Magic Prompt on hover, spinning in the dock's queue ring   | A reveal, or work in motion             |
| Fanned cards      | The dock's recent work and cast                            | A deck of your own things, dealt out    |
| Green title words | `Highlight` in a page title                                | The one loud mark on a page             |
| Hand lettering    | Margin notes ("Need a spark? Try one")                     | Gentle guidance, never required reading |
| SFX lettering     | Cover art, the 404 and error screens                       | Illustration and rare moments only      |

A comic mark with no meaning is decoration, and decoration is not allowed in
the chrome.

**Fix, do not redo.** Every generated object (shot, take, frame) is something
you can select, and its state is always visible in words and shape.

---

## 2. Surfaces and edges

There is one theme.

| Token          | Value     | What sits here                                                    |
| -------------- | --------- | ----------------------------------------------------------------- |
| `--canvas`     | `#0a0f1f` | The page, with the dot grid (`--canvas-dot`, 11px pitch)           |
| `--background` | same      | Pages sit straight on the canvas: no inset panel                  |
| `--card`       | `#0f1630` | A panel: `Section`, `Card`, dialogs, menus                        |
| `--muted`      | `#0b1124` | A well inside a panel, recessed back toward the page              |
| `--input`      | `#0b1124` | Fields and selects                                                |
| `--accent`     | `#16204a` | Hover lift for ghost buttons, menu rows and outline buttons       |
| `--bar`        | `#07101f` | The action bar at the foot of a flow                              |

**Edges are 2px.** Every panel and every control is drawn with `border-2`:

| Token            | Value     | Use                                              |
| ---------------- | --------- | ------------------------------------------------ |
| `--border`       | `#22305a` | A panel's edge; fields                           |
| `--rule`         | `#1c2748` | Dividers: the top bar's bottom rule, list rows   |
| `--edge-control` | `#2a3a6b` | Chips, counts, quiet toggles, selects            |
| `foreground`     | paper     | Outline (secondary) buttons                      |
| `primary`        | green     | The active item where a fill would be too loud   |

### The shell

A 72px top bar on the canvas, closed by a 2px `rule`: the wordmark, then text
tabs (active is paper white over a 3px green rule), then on the right the dev
switch, the balance as a green outlined tag, and the account as a yellow
initial square. Fixture-backed destinations fold into a "More" menu in the bar.
Below `lg` the bar shrinks to the wordmark, the balance and a menu button that
opens the drawer. The document scrolls; the bar is sticky.

### Shadows

Three hard offsets, no blur:

| Token          | Value                    | Use                                           |
| -------------- | ------------------------ | --------------------------------------------- |
| `shadow-press` | `4px 4px 0 primary-shade`| Under a green (default) button                |
| `shadow-pop`   | `6px 6px 0 primary`      | The one featured panel in a view              |
| `shadow-ink`   | `4px 4px 0 comic-ink`    | Tooltips, the spot button, marks on art       |

And one soft one, `shadow-overlay`, for things that leave the document flow
(menus, sheets, toasts, the dock), so they read over whatever they cover.

### Hover

Outline and ghost controls lift to `--accent` on hover. Rows in a well lift to
`bg-card`. A green button lightens to `primary-hover`; pressing it lands it on
its shade (translate 2px, shadow off).

### The dock

Recent work, the cast and the generation queue matter on every page, so the
shell folds them into one floating dock on the right edge (bottom right below
`lg`): a vertical pill of three circles, in this order:

1. **Queue:** a progress ring filled to the running job, focus lines spinning
   inside while anything moves, a red dot when something failed. Opens a panel
   with the full queue.
2. **Recent:** the latest cover in a circle with a count. Fans the last four
   storyboards out in an arc, each with its title, age and anything flagged or
   failed, then "All storyboards".
3. **Cast:** the lead character's roundel with a count. Fans the cast out with
   names and looks, then "New character".

A click, tap or Enter opens an item and moves focus in; Escape or a click
outside closes it. Items never open on hover. While an item is open, a radial
scrim (`dock-scrim`, `--scrim`) dims the page around the dock. `Dock`,
`DockItem`, `DockFan` and `FanLabel` live in `src/components/dock/`; each
feature owns its own item.

### Comic art is not chrome

Cover art and character roundels are illustration. They draw with the
`comic-*` tokens (`--comic-ink`, `--comic-paper`, `--comic-spot`,
`--comic-sky`, `--comic-red`, `--comic-blue`, `--comic-tone`).

---

## 3. Radius: print-tight

Corners are small. Nothing in the chrome is a pill except avatars, switches,
dots and progress tracks.

| Token         | px | Role                                            |
| ------------- | -- | ----------------------------------------------- |
| `rounded-2xl` | 8  | A dashed drop zone                              |
| `rounded-xl`  | 6  | A panel (`Section`, `Card`, dialog)             |
| `rounded-lg`  | 6  | Menu and popover panel                          |
| `rounded-md`  | 4  | Buttons, fields, tabs, wells, rows in a menu    |
| `rounded-sm`  | 3  | Swatches, thumbnails inside a row               |
| `rounded-xs`  | 2  | Chips, tags, counts, the avatar square          |

Lint still rejects `rounded-full` on a box past control height
(`design/control-height`).

---

## 4. Colour

| Token              | Value     | Role                                                                     |
| ------------------ | --------- | ------------------------------------------------------------------------ |
| `foreground`       | `#f4f1ea` | Paper white. Body text and titles.                                       |
| `muted-foreground` | `#8c9ac0` | Secondary text, labels, inactive tabs. Clears 4.5:1 on page and panel.   |
| `primary`          | `#3dff9e` | The main action, active tab, focus ring, balance. Ink text on top.       |
| `primary-tint`     | `#0e4a33` | Green highlighter behind words Magic Prompt added                        |
| `spot`             | `#f5b921` | Yellow: kicker tags, the avatar, selected-take tags                      |
| `flag`             | `#ff6b4a` | Flagged: needs a hand; also the Dev badge                                |

### Shot and job states

Status is **a word plus a shape plus a colour**, never colour alone.

| State      | Fill (strip)                | Text tone                | Icon         |
| ---------- | --------------------------- | ------------------------ | ------------ |
| Queued     | `pending`                   | `muted-foreground`       | Clock        |
| Generating | `live` + moving speed lines | `live-foreground`        | Loader       |
| Ready      | `settled`                   | `muted-foreground`       | Check        |
| Flagged    | `flag`                      | `flag-foreground`        | Flag         |
| Locked     | `pending` + screentone      | `muted-foreground`       | Lock         |
| Failed     | `destructive`               | `destructive-foreground` | Circle alert |

`SHOT_STATE_META` in `src/features/storyboards/shot-state.ts` is the single
table. Adding a state is a compile error there until it is designed.

Status badges are outlined tags: the state colour draws the 2px edge and the
word. `destructive` means failed or irreversible. Never use it for "needs
attention"; that is `flag`.

### Browser surfaces

Selection (`spot`), scrollbars (`settled`) and the focus ring (`ring`, the
green) are themed in `globals.css`. `color-scheme` is dark.

---

## 5. Typography

| Face            | Token                     | Use                                                          |
| --------------- | ------------------------- | ------------------------------------------------------------ |
| Anton           | `font-heading`            | Display and labels, always uppercase                         |
| Public Sans     | `font-sans`               | Everything you read                                          |
| Shantell Sans   | `font-letter`             | Margin notes only                                            |
| Dela Gothic One | `font-comic` (via `.sfx`) | SFX lettering in art and rare screens. Never interface text. |

| Role            | Classes                                                                  |
| --------------- | ------------------------------------------------------------------------ |
| Page title      | `font-display text-4xl md:text-5xl` (home: `text-5xl sm:text-7xl`)        |
| Section title   | `font-display text-2xl` (set by `Section`)                               |
| Kicker          | `.kicker` above a title                                                  |
| Button, tab     | `font-label` (Anton caps, tracked); set by the kit                       |
| Meta label      | `font-label text-sm tracking-label text-muted-foreground`                |
| Body            | `text-base`; the prompt composer uses `text-lg` because writing is the job |
| Numbers         | add `.tabular` so figures do not jitter as they change                   |

Every `h1` is `font-display` by default (base layer). Anton has one weight:
never pair it with `font-semibold` or `font-bold`. Copy is written in sentence
case; uppercase is a style, applied by the font utility, not typed.

---

## 6. Space and layout

4px base grid. Use the Tailwind scale, never an arbitrary pixel value.

| Context                       | Value                                                    |
| ----------------------------- | -------------------------------------------------------- |
| Shell padding and section gap | `p-6 gap-6`, `md:p-12 md:gap-10` (set once, in the shell) |
| Content max width             | `max-w-7xl`                                              |
| Top bar                       | `h-18`, `px-12`, 2px bottom `rule`                       |
| Panel                         | `p-4`, 2px `border`                                      |
| Well                          | `p-1.5`, children divided by `gap-1` or less             |

**A frame is never thinner than a seam: `p >= g`, per container, per axis.**
Lint enforces it (`design/containment`).

### Responsive

- **Desktop (lg, 1024px+):** top bar with text tabs.
- **Below lg:** a compact bar with the drawer in a sheet, single column.
- Touch targets are at least 44px: buttons default to `h-11`.

---

## 7. Motion

Rules follow the design-engineering skills in `.agents/skills/`
(`emil-design-eng`, `animate`, `review-animations`). Read them before adding
motion.

| How often it is seen                                   | Decision                                   |
| ------------------------------------------------------ | ------------------------------------------ |
| 100+ times a day (nav, tab switches, keyboard actions) | No animation                               |
| Tens of times (hover, row lift)                        | Colour or opacity only, `--duration-press` |
| Occasionally (menus, sheets, toasts)                   | Standard enter and exit                    |
| Rarely (empty states, a finished export)               | A little delight is allowed                |

| Token                  | Value                             | Use                                |
| ---------------------- | --------------------------------- | ---------------------------------- |
| `--ease-out-strong`    | `cubic-bezier(0.23, 1, 0.32, 1)`  | Enter and exit                     |
| `--ease-in-out-strong` | `cubic-bezier(0.77, 0, 0.175, 1)` | Movement on screen                 |
| `--ease-drawer`        | `cubic-bezier(0.32, 0.72, 0, 1)`  | Sheets                             |
| `--duration-press`     | 140ms                             | Hover, press                       |
| `--duration-tooltip`   | 150ms                             | Tooltips                           |
| `--duration-menu`      | 180ms                             | Menus, the Magic Prompt burst      |
| `--duration-overlay`   | 260ms                             | Sheets, dialogs                    |
| `--duration-slow`      | 400ms                             | Progress fill, cover zoom on hover |

- Animate `transform` and `opacity` only.
- Never enter from `scale(0)`; start at 0.95 or above.
- Never `ease-in` on UI.
- Press feedback is one global `translate(2px, 2px)` on `[data-slot="button"]`
  (the button lands on its offset shade), gated to fine pointers.
- Springs: `{ type: "spring", duration: 0.5, bounce: 0.2 }` at most.
- `prefers-reduced-motion` is handled globally in `globals.css` and by
  `MotionConfig reducedMotion="user"`. Never per component.
- The speed-line animation (`animate-speed`) only runs on things that are
  actually generating.

---

## 8. Components

Primitives live in `src/components/ui/` (shadcn on Radix, retokenised to this
system). Compositions live in `src/components/`. Feature UI lives in
`src/features/<feature>/components/`.

| Component                 | Rule                                                                                                                                                    |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Section`                 | Every titled panel. Display title, content in a recessed well, optional `count` tag and `action`.                                    |
| `Card`                    | A bare panel (`rounded-xl border-2 p-4`) for content that is not a titled section.                                                 |
| `Button`                  | `default` (green on its shade) once per view, `secondary` (paper outline) for the rest, `ghost` in toolbars, `spot` for a creation moment. |
| `Tabs`                    | Text tabs; the active one is a green block.                                                                                         |
| `Badge`                   | Outlined Anton tag. `overlay` on cover art. Status variants pair with a word.                                                       |
| `Progress`                | Thin track, fill with moving speed lines.                                                                                           |
| `Skeleton`                | Matches the final layout's size. Soft pulse on `secondary`. No spinners for page content.                                          |
| `Textarea`                | `field` variant: `input` fill, 2px edge, `rounded-md`; `bare` inside a panel that is already the frame.                            |
| `CoverArt`                | Placeholder storyboard art in screentone and SFX until real takes exist.                                                            |
| `Popover`                 | Overlay panel `rounded-lg border-2 p-1`, rows `rounded-md`. `bare` drops the panel for fans.                                        |
| `Highlight`, `MarginNote` | The two comic marks allowed in chrome copy. One `Highlight` per page.                                                               |

### Patterns

| Pattern            | Rule                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------- |
| Empty state        | One sentence of what goes here, plus one action. Never a bare "No data".              |
| Error in a section | "X did not load." plus a secondary "Try again". Never `error.message`.                |
| Failed generation  | The reason, the refund in credits, and Retry.                                         |
| Cost               | Shown before the action, with the coin icon, in `tabular` figures.                    |
| Not built yet      | `NotBuiltYet`: title, one-sentence purpose from PRODUCT.md, a margin note, back home. |

### Accessibility floor

- Focus ring: 2px `ring` outline with 2px offset, never removed. The composer
  shows it around the whole card when its textarea has keyboard focus.
- Body and placeholder text at least 4.5:1 on every rung.
- Icon-only controls carry an `aria-label`.
- Status is never colour alone (§4).
- Live regions on anything that updates on its own: credit balance, the
  generation queue, cost.

---

## 9. Adding to the system

1. Check `src/components/ui/` and `src/components/` before writing a component.
2. Use tokens. A raw hex, an arbitrary pixel value, or an inline curve is a
   review comment.
3. Need a new surface? It is a panel, a well, or an overlay (§2).
4. Need a comic mark? Name what it means in §1's table first. If it means
   nothing, do not add it.
5. Run `pnpm check` before calling it done, then look at it at desktop and
   mobile widths.

### Not designed yet

Take comparison, the character sheet editor, and the welcome landing from the
mockup (board 1). Design them from these rules and the mockup.
