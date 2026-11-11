# 19. Instant visits for panel pages, prefetch for records and forms

Date: 2026-11-10

## Status

Accepted

## Context

Inertia v3 gives a link two ways to feel fast:

- **Prefetch** (`<Link prefetch>`) fetches the page after 75 ms of hover (or on mount, or on
  mousedown) and caches the response for 30 s. A click inside that window renders the real
  page at once. A click with no hover first (touch, keyboard, a quick click) waits a full
  round trip.
- **An instant visit** (`<Link component="…">`) swaps to the target page at once, with only
  the shared props (`HandleInertiaRequests::share`), then sends the request and merges the
  real props in when it answers. The docs: "The target component must be able to render
  without its page-specific props."

They are not alternatives. In `@inertiajs/core` 3.11 the instant swap happens first, and the
request after it looks in the prefetch cache, which ignores `component`, `replace` and
`preserveState` when matching. A click after a finished or in-flight hover prefetch sends
no new page request: measured on the starter's Equipo link (#43), the only request after the
click was the page's deferred `tableData`.

What decides a page is what it shows before its data arrives. Ticket #43's browser walk found
that out the hard way: the first instant links crashed Inicio, Proyectos and Equipo, which
each read their KPI cards (`kpiStats.map`) on first render, while Crear Proyecto, which needs
no data, worked. A filled form has the opposite problem: drawn empty and filled a moment
later, it jumps, and anything typed into the gap is overwritten.

## Decision

Every page is one of three kinds, and its kind decides how its data loads and how links reach
it:

| Kind | Data | Links |
| --- | --- | --- |
| **Panel page**: a frame of independent sections (dashboard, list, report) | every page-specific prop deferred (`Inertia::defer`); each section takes its data as optional and draws its own loading state | instant visit **and** `prefetch` |
| **Record or filled form**: a detail page, an edit page, settings | sent eagerly | `prefetch` only, **never** instant |
| **Empty form**: a create page | none | instant visit and `prefetch` |

Navigation items carry `component` in `resources/js/config/navigation.ts`, and the nav
components pass it to `<Link>`. `resources/js/config/navigation.test.ts` renders the page
each instant item names with the shared props only, and fails if it throws.

The `ErrorBoundary` resets when a visit finishes, not only when the URL changes. Otherwise a
page that throws on the intermediate render keeps its error screen after the real props
arrive at the same URL.

The top progress bar keeps Inertia's defaults. It appears only after its delay, so on a fast
server it is never seen.

**A skeleton covers only what is still loading** (amended at the human walk of #43). Whatever
a section knows before its data arrives renders at once: card titles and icons, a table's
search box and column headers, a chart's title and subtitle, a list's heading. Only the
figures, rows and plot areas pulse. So a section component takes its data prop as optional
and draws the placeholder itself, in place of a `<Deferred>` fallback that blanks the whole
card. A stat card's title and icon belong to the page (`KpiRow` with a `KpiCard` per card),
and the server sends only the figures, matched by `key`. The first build swapped whole cards
for grey boxes; at the walk the screen read as empty until everything arrived.

## Consequences

- Every navigation draws something at once: the frame and skeletons of a panel page, or the
  whole page from a prefetch.
- A new panel page owes a loading state for every section: the data parts pulse, the rest
  renders. The test catches a nav item pointing at
  a page that reads an eager prop on first render.
- Eager props on a panel page are gone, KPI cards included. A section that must be on screen
  in the first paint belongs to a record page.
- Links to records (a row in a list, a detail page) use `prefetch` without `component`. The
  test only covers nav items, so this half of the rule rests on `.ai/rules/pages.md` and on
  review.
- Newer Wayfinder versions can put each route's component name into the route function, so
  that `<Link instant>` needs no hand-written name. The installed `laravel/wayfinder` 0.1.23
  cannot, so the names are hand-written in `navigation.ts` and the test checks them against
  the page list.
