# TechOpps design system

The rules every TechOpps screen follows. Tokens live in `src/app/globals.css`; shared components
in `src/components/ui/`. When you add a page, start from an existing one and keep to this file.

## The idea

TechOpps exists to answer one question: **what is due, and what do I do about it?** The visual
identity comes from that: a **runway**. One line for the days ahead, a tick for today, and deadlines
as marks along it. It appears as the logo, as the deadline runway on the dashboard, and as the key
dates timeline on every opportunity.

Everything else stays quiet so the deadlines read first:

- **The chrome is ink and grey.** No brand colour on navigation, cards or headers.
- **Colour is spent on data.** One data hue (runway teal) marks deadlines; amber marks the next
  seven days; red and green mean failure and success. That is the whole palette.
- **Category is a glyph, not a colour.** Eight categories in eight hues was a rainbow that needed
  a caption. Each category now has one grey outline icon and its name.

## Colour roles

| Token | Light | Dark | Used for |
| --- | --- | --- | --- |
| `--background` | `#f2f4f7` | `#0f1113` | Page ground (a cool ledger grey; never pure white or black) |
| `--surface` | `#ffffff` | `#17191d` | Cards, panels, inputs |
| `--surface-2` / `-3` | `#eaedf1` / `#e1e5ea` | `#21242a` / `#2a2e35` | Hover fills, tracks, the active nav item |
| `--border` / `--rule` / `--control` | `#dde1e7` / `#eceff3` / `#c6ccd4` | `#2b2f35` / `#22252b` / `#3d434b` | Card edges / row dividers / input borders |
| `--foreground` | `#0d1015` | `#eef0f3` | Body text, figures |
| `--muted-foreground` / `--faint` | `#5a6270` / `#646b78` | `#adb3bc` / `#959ba4` | Secondary text / meta and placeholders |
| `--primary` | `#12161c` | `#eef0f3` | The one filled button per screen (ink; inverted in dark) |
| `--signal` | `#0a7268` | `#45c2b4` | Deadline marks, the data hue, focus ring |
| `--urgent` / `--urgent-mark` | `#94560a` / `#d99613` | `#f0b54a` / `#e0a335` | Deadlines within 7 days (text / marks) |
| `--danger` / `--ok` | `#c4242a` / `#23784a` | `#f07a80` / `#62c58f` | Failed runs, errors / succeeded, open |

Every text colour reaches **4.5:1** on every surface it sits on, in both themes (checked with a
script during the redesign). Pills use a pale tint with dark text of the same hue (`Badge`).

Do not add: gradients on content, glows, coloured sidebars, violet or indigo accents, a colour per
category or per chart bar, status colour on a zero.

## Type

- **One family:** Schibsted Grotesk (self-hosted through `@fontsource-variable`; the CSP allows only
  local fonts). Weights 400, 500, 600.
- **Sizes:** 12 (meta) · 13 (row details) · 14 (body, the default) · 15 (row titles, card titles) ·
  16 (section titles) · 22-24 (page `h1`) · 28 (opportunity title on desktop). Nothing larger: this
  is an app, not a landing page.
- **Figures:** add the `tabular` class to counts that line up in columns or update (KPIs, tables).
  Do **not** use it on dates: this font's tabular set also widens the comma and colon
  ("18 Nov , 10 : 00").
- Sentence case everywhere. No uppercase tracked labels, no eyebrow labels above headings.

## Space, shape, elevation

- 4px base. Card padding 20px; gap between cards 16px; page gutters 16 / 24 / 32 / 40px by width.
- Pages sit in `PageFrame` (max 72rem). Forms and reading pages use narrower frames.
- Radii: 8px cards, 6px controls, 4px chips, 12px floating panels, full round for filter chips.
- **No shadow on anything at rest.** Cards are separated by a 1px border. Only floating things
  (menus, popovers, the command palette, sheets, dialogs) get `--shadow-float`, via the `floating`
  utility.

## Components

| Need | Use |
| --- | --- |
| Page title row | `PageHeader` (h1 noun, one grey line about the data, real actions only) |
| Panel | `Card`, `CardHeader`, `CardTitle`, `CardMeta`, `CardContent` |
| Headline counts | `Figures` (one container split by hairlines; each cell links to its list) |
| Buttons | `Button`: `default` (ink, once per screen), `secondary`, `outline`, `ghost`, `danger` |
| Fields | `Field`, `Input`, `Select`, `Textarea`, `Label`, `Hint`, `FormMessage` |
| Status | `Badge` tones; `StatusPill` (registration), `TrackingPill` (your status) |
| Choice of a few | `Segmented` (radio group) |
| Menus | `Popover`; modal panels `Sheet` (`right` drawer, `bottom` phone sheet, `center` dialog) |
| Category | `CategoryBadge`, `CategoryIcon` |
| Lists of opportunities | `OpportunityList` + `OpportunityRow` |
| Empty / failed blocks | `EmptyState` (keeps its frame, says what to do) / `ErrorNote` |
| Loading | `Skeleton`: flat blocks at the final size, no shimmer |

Icons: lucide, outline, 16px in navigation and buttons, 14px inline, grey. Never in a tinted square.

## Appearance: Light, Dark, Liquid Glass

- Chosen in **Settings → Appearance** or from **Appearance** at the bottom of the sidebar (phone:
  **More**), or with Ctrl/⌘ K. Stored in `localStorage` (`techopps-appearance`, and
  `techopps-glass-tone` for Glass). Until the user chooses, the system setting applies, and it
  follows changes live.
- An inline script in `<head>` (`APPEARANCE_SCRIPT` in `src/lib/appearance.ts`) sets `data-theme`,
  `data-glass` and `data-appearance` on `<html>` before the first paint, so there is no flash.
  Reading a cookie in the layout instead would make every page dynamic under Cache Components.
- **Dark** is its own palette (charcoal surfaces, lifted data hues), not an inversion.
- **Liquid Glass** keeps the light or dark tokens (its tone can follow the system or be fixed) and
  changes only floating surfaces: the sidebar becomes an inset pane; menus, popovers, the command
  palette, sheets, dialogs and the phone bars become translucent (`backdrop-filter: blur(22px)
  saturate(180%)`, a fine bright edge and an inner highlight). Content cards, lists, tables and
  forms stay opaque for readability. The ground gets two faint fixed colour fields so the glass has
  something to refract.
- Use the classes, not raw colours: `floating` (menus, dialogs), `glass-pane` (the sidebar),
  `glass-bar` (bars over scrolling content). Use the `glass:` variant for small per-mode tweaks.
- **Fallbacks:** without `backdrop-filter` support, or with `prefers-reduced-transparency`, glass
  surfaces turn opaque.

## Motion

Motion is feedback, never decoration. Tokens: `--dur-1` 120ms (hover, press), `--dur-2` 180ms
(menus, filter changes, page fade), `--dur-3` 240ms (sheets, dialogs, appearance change).

- Buttons settle 1px on press; rows and links tint on hover; the bookmark scales when saved.
- Menus pop in from 98%; sheets slide 16-24px; pages fade in (opacity only).
- Changing a filter keeps the old results on screen, dimmed, until the new ones arrive.
- Switching appearance cross-fades colours for 240ms (only while switching, never on load).
- `prefers-reduced-motion` reduces every animation and transition to near zero.

## Responsive

- **Phone (<768px):** a top bar (mark, page, search) and a bottom bar (Home, Discover, Saved,
  Tracking, More). Filters move into a bottom sheet behind a **Filters** button with a count; the
  category chips scroll sideways in their own row. Opportunity rows move the deadline under the title.
- **Tablet (768-1023px):** sidebar visible; filter rail narrows to 14.5rem; dashboard panels stack.
- **Desktop:** sidebar 240px; the canvas caps at 72rem.
- The page never scrolls sideways; wide tables scroll inside their own frame.

## Accessibility

- One `h1` per screen; every panel has a heading; landmarks (`nav`, `main`, `aside`) are labelled.
- Visible 2px focus ring in `--ring` on every control; a skip link to the content.
- Whole-row links use one real link stretched over the row, with the row's other controls above it.
- Icon-only buttons carry a specific accessible name ("Save: Regional Student CTF").
- Radio groups and checkboxes are native inputs (keyboard and screen readers work); dialogs are
  native `<dialog>` (focus is trapped, Escape closes).
- Charts have a text equivalent: the runway's deadlines are listed beside it.

## Honesty rules (from the product)

- Never fabricate missing information: show "Not stated" or a grey dash.
- Never show a number the API did not provide. Zeros print as zeros.
- Sources are never enabled or collected automatically from the interface.
