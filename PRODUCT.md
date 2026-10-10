# Product

<!-- impeccable:product-schema 1 -->

The product record for Toon Clip. Read it before building any screen. The
full spec is `refs/Toon_Clip_Design_Document.docx` (v0.3); this file is the
working summary plus everything decided since.

## Platform

web

## Stack

Next.js 16 (App Router, Turbopack), React 19, TypeScript (strict), Tailwind
CSS v4, shadcn/ui on Radix, TanStack Query, nuqs, zustand, zod, Motion. pnpm.
Chosen by the frontend owner.

This repo is the frontend only. A separate developer is building the API.
The frontend codes against zod contracts and serves fixtures until each
endpoint exists (see `AGENTS.md` §0 and §4).

## Who is behind it

- **Toon Central** (tooncentralhub.com): a Nigerian comics and animation
  studio, "Giving Africa a voice". It publishes webtoon-style comics (Hunter,
  City Hero, Konkoh, ODOGWU, OMIMI, Black Star, Afri Divaz) and a vertical
  Shorts feed. Its house art style is **Mafiki**, a blend of traditional
  African art with modern comic and anime looks; its artists are called
  **Marafiki**.
- **Emmanuel "Silver" Ifeanacho**, founder, is the product owner.
- Toon Central is moving from comics into **Series** (episodic animation).
  Toon Clip is the tool that makes Series affordable to produce.
- Toon Clip is being entered in **Colosseum's Crypto World's Fair** hackathon
  (online, Solana ecosystem, submissions due 12 Oct 2026). How crypto shows up
  in the product is an open decision (see below).

## Users

| Persona | Situation | Main need |
| --- | --- | --- |
| Newcomer | Has a story idea, no prompting skill | A good result from a lazy prompt |
| Independent animator or comic artist | Has a style, wants speed | Consistency, per-shot control, PSD export |
| Short-form creator | Posts vertical video | Fast iteration, 9:16, direct upload |
| Contributing creative | Has prompting craft worth sharing | Credit and control over what is shared |

Toon Central's own artists are the first users. The audience skews African
and diaspora creators; many pay in naira, and card payment is not a given.

## Product purpose

An AI studio for animation and comics. It turns a plain idea plus a character
sheet into controlled, editable animation and comic work that does not look
like generic AI output. Silver's bar: "anime-level production quality",
"non-slop", something people want to watch.

Success means a creator goes from idea to a finished, exportable clip they
are proud of, and fixes problems by regenerating one shot rather than
starting over.

## Positioning

Most AI video tools are easy to start and hard to finish well: one generic
result from a short prompt, and no way to fix one bad moment. Toon Clip's
difference:

1. **Magic Prompt** rewrites a lazy prompt into a directed one using rules
   distilled from working creatives, and shows every change with a reason.
2. **Everything is an editable object.** Storyboard, sheet, shot, take, frame,
   layer. Regenerate one shot; every take is kept.
3. **Pro exit.** Layered PSD (character and background separated, organised by
   panel) for artists who keep painting, or finished video for posting.
4. **Character sheet is the source of truth** for consistency across shots.

## Core flow

1. **Tour**: a pre-rendered demo with the sample character **Kaito** and the
   lazy idea "a man battling through an army of soldiers". No credits spent.
2. **Create**: attach a character sheet, describe the idea, optional first and
   last frames.
3. **Improve**: Magic Prompt; accept, edit, try another, or revert.
4. **Generate**: storyboard sheets and shots generate asynchronously.
5. **Refine**: flag, regenerate, compare takes, lock; open the board.
6. **Export**: layered PSD or video.

## Vocabulary

Use these words exactly; do not invent synonyms.

- **Project**: container for related work.
- **Character sheet**: reference images and notes for one character
  (turnarounds, expressions, outfits, palette, voice).
- **Palette**: named colour set. **Style preset**: named look.
- **Storyboard**: ordered sheets for one idea.
- **Sheet**: one clip of 4 to 15 seconds.
- **Shot**: a timeline segment of a sheet.
- **Take**: one generation result for a shot. A shot has many takes and
  exactly one selected take. Regenerating never deletes takes.
- **Frame**: a still image. **First / last frame**: images that anchor the
  start and end of a clip.
- **Layer asset**: separated background or character image for PSD export.
- **Board**: free-form canvas of frames and shots, with groups and pages.
- **Group**: labelled set of tiles on a board.
- **Recipe**: a distilled prompt rule set that Magic Prompt draws on.
- **Credits**: the unit generation is paid in.

## Capabilities and constraints

- **Shot states**: queued, generating, ready, flagged, locked, failed (failed
  refunds credits). Every state is distinguishable without colour.
- **Quick create** tabs: Image, Video, Audio, Composition, Stitch. Video has
  Reference mode (up to 9 images, 3 videos, 3 audio clips, `@` to tag) and
  Frame mode (first and/or last frame).
- **Model capability matrix**: each video model declares what it supports
  (reference, first frame, last frame, audio, durations, resolutions). The UI
  reads it to enable or disable controls. The backend uses Seedance
  (ByteDance) among others; confirm capabilities from the API, never assume.
- **Credits**: cost shown before every generation; insufficient credits shows
  an inline notice and disables Generate; confirmation above a threshold
  (proposed 200); refund on failure.
- **Generation is asynchronous** and slow. Progress, retry, and take history
  are core UI, not polish.
- **Timeline shortcuts** (proposed): Space play, J K L shuttle, S split, F flag,
  L lock, R regenerate, Cmd/Ctrl Z undo, B open board.
- **Responsive**: desktop 1280+ full timeline and inspector; tablet 768 to
  1279 inspector becomes a bottom sheet; mobile single column, timeline becomes
  a shot strip, board is view and select.
- **Non-goals for v1**: full video editor, social network, model training.

### Roadmap (from the spec)

1. Core loop: tour, quick create, Magic Prompt, storyboard from idea,
   timeline with regenerate/takes/lock, video export.
2. Craft tools: board, continuity checks, layered PSD, contributor recipes,
   direct upload.
3. Comics: panel layouts, speech bubbles, page export.

## Brand commitments

- Name: **Toon Clip** (product of Toon Central).
- Silver wants the app to **look "toony"**. The frontend owner agrees with the
  goal but not with how the existing mockup reads; the mockup is not toony
  enough. Finding what "toony" means for this product is the current design
  task, done on the homepage first.
- Toon Central's identity is African storytelling and the Mafiki style. The
  product should feel like it comes from that studio, not from a generic AI
  startup.

## Evidence on hand

- `refs/Toon_Clip_Design_Document.docx`: product spec v0.3. Its behaviour
  rules are authoritative. Its visual tokens (#1E1E1E ground, #D4FF00 lime,
  IBM Plex) are a starting suggestion only and are not adopted.
- `refs/Toon_Clip_Flow_Mockup_v2.html`: 9 wireframe screens (welcome, three
  tour steps, create, timeline, board, export video, export PSD). Use it for
  layout and flow. Its look (navy dot grid, mint accent, condensed display
  type) is **rejected** by the frontend owner as not toony enough.
- No real generated clips, character art, or user testimonials exist yet.
  Demo media is placeholder and must be labelled as sample content. Do not
  invent customers, usage numbers, prices, or model benchmarks.

## Product principles

- **Craft over volume.** Defaults push toward intentional output.
- **Fix, do not redo.** Everything generated is selectable and regenerable alone.
- **Show the reasoning.** Magic Prompt explains each change so users learn.
- **Nothing is lost.** Every regeneration is kept as a take.
- **Cost is visible before commitment.**

## Accessibility & inclusion

Body text 4.5:1; touch targets 44px; visible focus; keyboard equivalents for
every timeline action; captions for dialogue; states never by colour alone;
honour reduced motion. Many users will be on mid-range Android phones and
slower connections: keep pages light and media lazy.

## Open decisions

| Question | Status |
| --- | --- |
| What "toony" looks like | In progress on the homepage; recorded in DESIGN.md when settled |
| Is the homepage a public landing page or the signed-in app home? | Open |
| How crypto appears for the hackathon (credit payments, contributor payouts, provenance) | Open |
| API contracts for each feature | Owned by the backend developer; frontend writes expected schemas marked `CONTRACT: unconfirmed` |
| Platforms for direct upload | Open (spec uses [PLATFORM] placeholders) |
| Contributor compensation | Proposed: credits plus public credit |
