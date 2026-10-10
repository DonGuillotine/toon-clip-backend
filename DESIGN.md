# Toon Clip design system

Toon Clip is a studio people work in for hours: they write, wait for
generations, compare takes, fix one shot, and go again. So the interface is a
calm, ordinary product UI. The comic language belongs to the work (the
creator's clips and characters) and to the few moments where something is
actually happening. Everything else stays out of the way.

Tokens live in `src/app/globals.css`. Motion values are mirrored in
`src/lib/motion.ts`. `AGENTS.md` covers how to write the code; this file covers
what it should look like and why.

---

## 1. Principles

**Calm chrome, loud work.** The UI is neutral greys, one ink colour and plain
type. Colour and comic texture are spent on the creator's content and on state.
If a flourish would be seen a hundred times a day, it gets cut.

**Comic marks mean something.** Every comic device in the chrome has a job:

| Device            | Where                                                        | What it means                           |
| ----------------- | ------------------------------------------------------------ | --------------------------------------- |
| Speed lines       | Progress fill, generating shot segment                       | Something is moving right now           |
| Screentone        | Locked shot segment, character roundels                      | Fixed, or a stand-in for art            |
| Focus-line burst  | Magic Prompt on hover; spinning inside the dock's queue ring | A reveal, or work in motion             |
| Fanned cards      | The dock's recent work and cast                              | A deck of your own things, dealt out    |
| Highlighter swipe | The creator's name in the page title, the logo               | The one loud mark on a page             |
| Hand lettering    | Margin notes ("Need a spark? Try one")                       | Gentle guidance, never required reading |
| SFX lettering     | Cover art, the 404 and error screens                         | Illustration and rare moments only      |

A comic mark with no meaning is decoration, and decoration is not allowed in
the chrome.

**Depth is luminance.** No borders, no shadows, no dividers (§2).

**Fix, do not redo.** Every generated object (shot, take, frame) is something
you can select, and its state is always visible in words and shape.

---

## 2. Surfaces: elevation is luminance

**There are no borders and no shadows in this UI.** Every edge, every
separation, every sense of depth comes from a step in background lightness. If
you reach for `border`, `ring`, `divide-*` or `shadow`, the answer is a tonal
step instead. `--border` is `transparent` on purpose.

### The ladder

| Rung   | Token          | Value                    | What sits here                                                       |
| ------ | -------------- | ------------------------ | -------------------------------------------------------------------- |
| **L0** | `--canvas`     | `oklch(0.953 0.003 270)` | App chrome: the rail, the mobile top bar. Furthest back.             |
| **L1** | `--background` | `oklch(0.979 0.002 270)` | The inset main panel and the page inside it.                         |
| **L2** | `--card`       | `oklch(1 0 0)`           | Content surfaces: sections, the prompt composer. Nearest the viewer. |
| **L1** | `--muted`      | same as L1               | Wells recessed inside a card. Reused on purpose.                     |

Each step is about 0.025 L: the smallest gap that still reads as an edge on an
uncalibrated laptop screen.

**Recessed always means toward the canvas.** A well is darker than its card.
That keeps the model the same everywhere and will hold when a dark theme lands.

### The shell

The rail sits on L0 with no edge of its own. On desktop, the page lives in an
inset panel (L1, `rounded-3xl`, 8px in from the window) and that one-rung step
is the only separation. The panel is the scroll container, so the rail never
moves. On mobile the inset goes away: an L0 top bar sits over an L1 page.

### The control tier

Controls sit off the ladder so they read as slots on any rung:

| Token                               | Use                                                                        |
| ----------------------------------- | -------------------------------------------------------------------------- |
| `--input`                           | Text fields. Darker than every surface, so a field never vanishes into L1. |
| `--secondary` / `--secondary-hover` | Tonal buttons, the tab track, chips.                                       |
| `--accent`                          | Hover tint for ghost buttons and menu rows.                                |

Do not use `--muted` for a field. It is L1, and a field on L1 disappears.

### Hover lifts

Rows and tiles inside a well rest on L1 and hover to `bg-card` (L2): they rise
one rung instead of tinting. Nav rows on the L0 rail hover to L1 and the active
row sits at L2. The gesture is the same language as the ladder.

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
outside closes it. Items never open on hover: the dock is on every page, and
content springing out as the pointer passes would be noise. While an item is
open, a radial scrim (`dock-scrim`, `--scrim`) dims the page around the dock so
the fan reads cleanly. Fans are bare:
no panel behind them, and each label and card is its own overlay surface.
`Dock`, `DockItem`, `DockFan` and `FanLabel` live in `src/components/dock/`;
each feature owns its own item.

The dock floats over the page, so it is an overlay and carries the shadow. Its
thickness is control height, so it is a pill even though it is tall.

### The one exception

Overlays (dropdown menus, popovers, sheets, tooltips, toasts, the dock and its fans) leave the document flow, so
no background step can separate them from what they cover. They get
`--shadow-overlay`, the only shadow in the system: real offset, soft blur,
never a zero-offset halo. Nothing else may use it.

### Comic art is not chrome

Cover art and character roundels are illustration. They draw with the
`comic-*` tokens (`--comic-ink`, `--comic-paper`, `--comic-spot`,
`--comic-sky`, `--comic-tone`), and their ink lines are part of the drawing. The
no-border rule applies to interface surfaces, not to drawings.

---

## 3. Radius: concentric, and pills at control height

**Rule 1: anything one line at control height is `rounded-full`.** Buttons,
tabs, badges, chips, nav rows, avatars, progress tracks. At 36px or less a
fixed radius reads as a squircle fighting the cap height.

**The test is the box, not the element's name.** A textarea, a menu panel, a
row inside a menu, a card, a well, and anything that can wrap past one line is
a box and takes a step from the scale. Lint enforces the loud half
(`design/control-height`): `rounded-full` on anything with a min height past
36px, content sizing, or scrolling fails.

**Rule 2: nested containers are concentric.**

```
r_inner = r_outer - padding
```

| Token         | px  | Role                                              |
| ------------- | --- | ------------------------------------------------- |
| `rounded-3xl` | 32  | The inset shell panel                             |
| `rounded-xl`  | 24  | Card                                              |
| `rounded-lg`  | 20  | Menu and popover panel                            |
| `rounded-md`  | 16  | Well inside a card, text field, menu row          |
| `rounded-sm`  | 12  | Row or tile inside a well                         |
| `rounded-xs`  | 8   | Deepest nesting: a cover inside a tile, a key cap |

The stacks in use:

```
Section   r=24 (rounded-xl), p-2 (8)
└ Well    r=16 (rounded-md), p-1 (4)
  └ Tile  r=12 (rounded-sm), p-1 (4)
    └ Cover r=8 (rounded-xs)

Menu      r=20 (rounded-lg), p-1 (4)
└ Row     r=16 (rounded-md)

Field     r=16 (rounded-md)     multi-line; never a pill
```

`Section` (`src/components/section.tsx`) derives the first stack once. Use it
for every titled panel instead of rebuilding a card. If you need a new depth,
subtract the padding; do not pick a radius that looks about right.

---

## 4. Colour

The chrome is neutral, slightly cool grey (hue 270, chroma under 0.01). Three
accents carry all the meaning:

| Token              | Role                                                                 |
| ------------------ | -------------------------------------------------------------------- |
| `primary`          | Ink. The main action in a view (Generate, Try again). One per view.  |
| `spot`             | Highlighter yellow. The page's one loud mark, selection, the avatar. |
| `muted-foreground` | Secondary text, labels, timestamps. Clears 4.5:1 on L0, L1 and L2.   |

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

The `*-foreground` tones are for text and clear 4.5:1 on L2. The plain fills
(`live`, `flag`, `destructive`) are for marks and tints (`bg-flag/12`) and must
not carry body text.

`destructive` means failed or irreversible. Never use it for "needs attention";
that is `flag`.

### Browser surfaces

Selection (`spot`), caret and `accent-color` (ink), scrollbars (`settled`) and
the focus ring (`ring`, a clear blue) are themed in `globals.css`. Do not
revert them to browser defaults.

---

## 5. Typography

| Face            | Token                     | Use                                                          |
| --------------- | ------------------------- | ------------------------------------------------------------ |
| Geist           | `font-sans`               | Everything you read and click                                |
| Shantell Sans   | `font-letter`             | Margin notes only                                            |
| Dela Gothic One | `font-comic` (via `.sfx`) | SFX lettering in art and rare screens. Never interface text. |

| Role            | Classes                                                                          |
| --------------- | -------------------------------------------------------------------------------- |
| Page title      | `text-3xl sm:text-4xl font-semibold tracking-tight` (home), `text-2xl` elsewhere |
| Section heading | `text-sm font-medium`                                                            |
| Body            | `text-sm`; the prompt composer uses `text-lg` because writing is the job         |
| Meta            | `text-xs text-muted-foreground`                                                  |
| Numbers         | add `.tabular` so figures do not jitter as they change                           |

`tracking-tight` on anything `text-2xl` or larger. Never go below `text-xs`.
Copy is sentence case.

---

## 6. Space and layout

4px base grid. Use the Tailwind scale, never an arbitrary pixel value.

| Context                       | Value                                                                               |
| ----------------------------- | ----------------------------------------------------------------------------------- |
| Shell padding and section gap | `p-4 gap-4`, `md:p-8 md:gap-8` (set once, in the shell)                             |
| Content max width             | `max-w-6xl`; the home composer narrows to `max-w-2xl` and sits centred in the panel |
| Section header                | `px-3 pt-1.5 pb-2.5` on the card                                                    |
| Well                          | `p-1`, children divided by `gap-1` or less                                          |
| Rail width                    | `w-64`                                                                              |

**A frame is never thinner than a seam: `p >= g`, per container, per axis.** A
container that spaces its children with `gap-*` keeps its own padding at or
above that gap. Lint enforces it (`design/containment`). It cannot see across
files: content placed in a `Section` well divides by `gap-1` or `gap-0.5`.

Grids go `1 -> 2 -> 4` columns for storyboard tiles and `1 -> 12-column split`
for side-by-side sections at `lg`.

### Responsive

- **Desktop (lg, 1024px+):** rail plus inset panel.
- **Below lg:** L0 top bar with the drawer in a sheet, credits as a chip,
  single column. Mode tabs fill the width and drop their icons.
- Touch targets are at least 44px where the control is the main thing on a row.

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
- Press feedback is one global `scale(0.97)` on `[data-slot="button"]`, gated to
  fine pointers.
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
| `Section`                 | Every titled panel. Heading on L2, content in an L1 well, optional `count` pill and `action`.                                                           |
| `Card`                    | A bare L2 surface (`rounded-xl p-2`) for content that is not a titled section, such as the composer and error screens.                                  |
| `Button`                  | `default` (ink) once per view, `secondary` (tonal) for the rest, `ghost` in toolbars, `spot` for a creation moment. All `rounded-full`.                 |
| `Tabs`                    | Segmented: tonal track, active segment lifts to L2.                                                                                                     |
| `Badge`                   | Pill. `overlay` on cover art (frosted, no surface step exists there). Status variants pair with a word.                                                 |
| `Progress`                | Thin track, ink-blue fill with moving speed lines.                                                                                                      |
| `Skeleton`                | Matches the final layout's size. Soft pulse on `secondary`. No spinners for page content.                                                               |
| `Textarea`                | `field` variant on `input`, `rounded-md`; `bare` inside a card that is already the frame.                                                               |
| `CoverArt`                | Placeholder storyboard art in screentone and SFX until real takes exist. Composed for 320 x 200: draw it at that size and scale it down for thumbnails. |
| `Popover`                 | Overlay panel `rounded-lg p-1`, rows `rounded-md`. `bare` drops the panel for fans.                                                                     |
| `Highlight`, `MarginNote` | The two comic marks allowed in chrome copy. One `Highlight` per page.                                                                                   |

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
3. Need a new surface? Place it on the ladder. If it does not fit a rung, it is
   probably an overlay or a well.
4. Need a comic mark? Name what it means in §1's table first. If it means
   nothing, do not add it.
5. Run `pnpm check` before calling it done, then look at it at desktop and
   mobile widths.

### Not designed yet

Dark theme (the ladder is built to invert cleanly: recessed stays toward the
canvas), the timeline editor, the board, take comparison, export screens, the
character sheet editor, and the onboarding tour. Design them from these rules.
