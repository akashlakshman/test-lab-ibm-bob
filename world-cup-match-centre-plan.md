# World Cup 2026 Match Centre — Build Plan

## Top-Level Overview

Build a single-file (or minimal multi-file) plain HTML/CSS/JS web app that renders live
World Cup 2026 data from the OpenLigaDB API with a local JSON fallback. No frameworks,
no build tools, no package manager.

**Approach:**
- One `index.html` entry point that loads `app.js` and `style.css`
- `app.js` fetches the live API first; on failure it falls back to the local
  `data/openligadb-wm26-2026.json` file
- All state lives in a single plain JS object; the UI re-renders tabs on demand
- Five tab panels rendered entirely from match data — no server-side work

**Data facts that shape the design:**
- 72 group-stage matches across 3 phases (`Gruppenphase 1/2/3`)
- 48 teams in 12 groups (A–L); group letter is **not** in the API — it must be
  inferred by clustering teams that share matches within the same `groupOrderID`
  (union-find over match pairings, then sort groups alphabetically by first
  team name to assign letters A–L deterministically)
- Knockout fixtures are **absent** from the current data — the Knockout tab
  must render a placeholder bracket that fills as data becomes available
- `team1.teamIconUrl` values are mix of Wikipedia SVGs and custom PNGs — use
  them directly as `<img src>` with an emoji/letter fallback
- `matchResults` array: `resultTypeID=1` → half-time, `resultTypeID=2` → final score
- `matchIsFinished: false` + empty `matchResults` → upcoming; `false` + non-empty
  results → live (in progress); `true` → finished

---

## Sub-Tasks

---

### Sub-Task 1 — Project Scaffold & Data Layer

**Intent**
Create the file structure and the data-loading module. Everything else depends on
having normalised match data available synchronously after load.

**Expected Outcomes**
- `index.html`, `style.css`, `app.js` exist at the workspace root
- On page load, `app.js` fetches `https://api.openligadb.de/getmatchdata/wm26/2026`
  and wraps it to match the local JSON envelope `{ matches: [...] }`
- On network failure (or if `window.__OPENLIGADB_WM26_MOCK__` is present), it
  falls back to `data/openligadb-wm26-2026.json` via a second `fetch`
- A `normalise(rawMatches)` function derives and attaches:
  - `score` → `{ ht: [n,n], ft: [n,n] }` from `matchResults`
  - `status` → one of `"upcoming" | "live" | "finished"`
  - `groupLetter` → `"A"–"L"` inferred by union-find on match pairings
    (teams that share a match are in the same group; sort the 12 clusters
    alphabetically by the cluster's lowest team name to get stable A–L labels)
- A global `window.APP = { matches, groups, teams }` is populated and the app
  renders for the first time
- A `setInterval` polling every 60 s re-fetches and re-renders if live matches exist

**Todo List**
1. Create `index.html` — standard HTML5 shell, `<link>` to `style.css`,
   `<script src="data/openligadb-wm26-2026.mock.js">` (optional local dev toggle,
   commented out by default), `<script src="app.js">` deferred
2. Create `style.css` — empty file with a `:root` token block (colours only, filled
   in Sub-Task 2)
3. Create `app.js` — implement `fetchData()`, `normalise()`, `inferGroups()`,
   and the top-level `init()` that wires them together
4. Verify in browser console that `window.APP.matches.length === 72` and
   `Object.keys(window.APP.groups).length === 12`

**Relevant Context**
- `data/openligadb-wm26-2026.json` — local fallback, shape: `{ generatedAt, matches: [...] }`
- `data/openligadb-wm26-2026.mock.js` — assigns same envelope to
  `window.__OPENLIGADB_WM26_MOCK__`; load before `app.js` to skip network entirely
- API URL: `https://api.openligadb.de/getmatchdata/wm26/2026` returns a **raw array**
  of match objects (no envelope), so wrap it: `{ matches: data }`
- `matchResults[i].resultTypeID === 2` gives final score
- `matchResults[i].resultTypeID === 1` gives half-time score

**Status:** [ ] pending

---

### Sub-Task 2 — Global Layout & FIFA Dark-Navy Design System

**Intent**
Define the visual design system — colours, typography, tab chrome, and responsive
shell — so all subsequent tabs can drop content into a consistent frame.

**Expected Outcomes**
- Dark navy background (`#0a1628`), gold accent (`#c9a227`), white text
- FIFA-style header with tournament logo text and "WM 2026" badge
- Five tab buttons across the top; active tab has a gold underline indicator
- Tab content area with smooth show/hide (no animation library)
- Mobile-responsive: tabs scroll horizontally on narrow screens; cards stack
- `style.css` fully defines all tokens, layout, and tab chrome

**Todo List**
1. Fill `style.css` `:root` with all design tokens (colours, spacing, font sizes,
   border-radii)
2. Style the `<header>` with tournament branding
3. Style the `<nav class="tabs">` — flex row, gold active indicator, horizontal
   scroll on mobile
4. Style the generic `<section class="tab-panel">` show/hide with
   `.tab-panel.active { display: block }`
5. Style shared components: `.card`, `.badge`, `.flag-img`, `.score-box`,
   `.team-row` — used across all tabs
6. Add a `.skeleton` placeholder style for pre-load state

**Relevant Context**
- No external fonts needed — system font stack is fine
- Flag images come from `teamIconUrl` on each team object; size them to 24×16px
  inline, 32×22px in cards
- Keep CSS under ~350 lines to stay maintainable

**Status:** [ ] pending

---

### Sub-Task 3 — Overview Tab

**Intent**
Landing tab: shows today's / most recent matches in a "match card" layout, a
quick summary of the current group phase, and a "next matches" strip.

**Expected Outcomes**
- "Live Now" section (if any matches have `status === "live"`) rendered first
  with pulsing red dot
- "Today" section showing matches with `matchDateTimeUTC` on today's date
- "Recent Results" section showing last 5 finished matches
- "Upcoming" section showing next 5 future matches
- Each match card shows: team flags + names, score (or kick-off time), match
  status badge, venue city
- If no live/today matches, a sensible empty state is shown

**Todo List**
1. Add `renderOverview()` in `app.js` that partitions `window.APP.matches` into
   live / today / recent / upcoming buckets
2. Build match card HTML as a template string function `matchCard(match)` →
   returns an HTML string; reused in the Matches tab
3. Render sections with headings; skip empty sections
4. Wire tab click for `"Overview"` to call `renderOverview()` and inject into
   `#tab-overview`

**Relevant Context**
- Use `matchDateTimeUTC` (ISO string) for all time comparisons to avoid timezone
  issues; display local time using `Intl.DateTimeFormat` / `Date.toLocaleString()`
  with the user's detected locale — no hardcoded timezone
- Match card is the most-reused component — design it well here

**Status:** [ ] pending

---

### Sub-Task 4 — Matches Tab

**Intent**
Full match list with filter controls: filter by group phase and by group letter.

**Expected Outcomes**
- Dropdown/button filter: "All", "Gruppenphase 1", "Gruppenphase 2", "Gruppenphase 3"
- Secondary filter: group letter A–L (or "All Groups")
- Matches displayed grouped by date, sorted chronologically
- Expanding a match card shows goal scorers and minute markers
- Matches tab is the most data-dense view

**Todo List**
1. Add `renderMatches(phaseFilter, groupFilter)` in `app.js`
2. Build filter bar HTML; wire `change` events to re-call `renderMatches()`
3. Group matches by calendar date and render date-separator headers
4. Reuse `matchCard()` from Sub-Task 3; add a "details" toggle for goal scorers
5. Implement the expand/collapse for goal events using a `<details>` element or
   a click toggle

**Relevant Context**
- 72 matches total; all are group-stage — no knockout fixtures in the data yet
- Group letter filter depends on `match.groupLetter` computed in Sub-Task 1

**Status:** [ ] pending

---

### Sub-Task 5 — Table Tab

**Intent**
Group standings table (points, W/D/L, GF/GA/GD) calculated live from match
results, displayed per group A–L.

**Expected Outcomes**
- One standings table per group, labelled "Group A" through "Group L"
- Columns: Pos, Flag+Team, Pld, W, D, L, GF, GA, GD, Pts
- Rows sorted by Pts desc, then GD desc, then GF desc
- Top 2 highlighted in gold (qualified); 3rd row in muted gold (potential
  third-place qualifiers in WM 2026 format)
- Unplayed matches show 0 stats
- Tables update automatically on data refresh

**Todo List**
1. Add `calcStandings(groupLetter)` in `app.js` → returns sorted array of
   `{ team, pld, w, d, l, gf, ga, gd, pts }`
2. Add `renderTable()` in `app.js` — iterates groups A–L, calls `calcStandings()`
   for each, emits HTML table
3. Highlight qualifying positions with CSS class `.qualifies` (top 2),
   `.third-place` (3rd)
4. Wire Table tab click

**Relevant Context**
- Points: Win=3, Draw=1, Loss=0
- GD = GF − GA
- In WM 2026, 12 groups × top-2 = 24 + 8 best 3rd-place teams = 32 in R-of-32
- Only `matchIsFinished === true` matches count toward standings

**Status:** [ ] pending

---

### Sub-Task 6 — Knockout Tab

**Intent**
Bracket visualisation for the knockout rounds. Data has no knockout matches yet,
so render the WM 2026 R32 bracket pre-seeded with projected group winners and
runners-up from the live standings, with "TBD" for undecided slots.

**Expected Outcomes**
- Visual bracket: Round of 32 (16 matches) → Round of 16 → Quarter-finals →
  Semi-finals → Final
- R32 slots pre-filled with the projected qualifier from each group (e.g. "1A vs 2B")
  using live standings from Sub-Task 5; if a group is complete, the real team
  name + flag appear; if not, the seeding label shows in muted style
- Subsequent rounds show "TBD" until real knockout match data arrives
- Bracket laid out left-to-right with CSS grid/flexbox; CSS border connector lines
- If knockout match data becomes available in the API (groupOrderID > 3),
  the bracket auto-populates from real match data

**Todo List**
1. Define the WM 2026 R32 seeding map as a static JS config (which group
   winner/runner-up plays which — the official FIFA WM 2026 bracket pairings)
2. Add `renderKnockout()` — reads `window.APP.groups` standings to resolve each
   seeding slot to a real team (or keep muted label if group unfinished)
3. Filter matches for groupOrderID > 3 (future knockout data); if found, overlay
   real results onto the bracket
4. CSS bracket layout: each round as a flex column, match boxes vertically
   distributed, CSS border connectors between rounds
5. Wire Knockout tab click

**Relevant Context**
- WM 2026 bracket: 32 teams → 16 matches R32 → 8 R16 → 4 QF → 2 SF → Final + 3rd place
- Current data has only group-stage matches (groupOrderID 1–3); knockout rounds
  will appear as higher groupOrderIDs when available

**Status:** [ ] pending

---

### Sub-Task 7 — Stats Tab

**Intent**
Tournament statistics: top scorers, most goals in a match, goals by group,
and team stats (most goals scored/conceded).

**Expected Outcomes**
- Top 10 Scorers leaderboard: player name, team flag, goals tally, sorted desc
- Goals by Group: mini bar chart (CSS-only, no canvas) showing group goal totals
- Match of the Tournament: highest-scoring finished match
- Team attack/defence stats: most goals for, most goals against

**Todo List**
1. Add `calcStats()` in `app.js` → returns `{ topScorers, groupGoals, topMatch, teamStats }`
   - `topScorers`: reduce over `match.goals` array across all matches;
     aggregate by `goalGetterID`; exclude own goals from the scorer's tally
   - `groupGoals`: sum goals per group letter
   - `topMatch`: max `(score.ft[0] + score.ft[1])` among finished matches
   - `teamStats`: goals for/against per team
2. Add `renderStats()` — emits leaderboard, bar chart, and cards
3. CSS bar chart: `width: calc(var(--val) / var(--max) * 100%)` using inline
   CSS custom properties set from JS
4. Wire Stats tab click

**Relevant Context**
- Own goals (`isOwnGoal: true`) count for the **conceding** team, not the scorer
- `goalGetterName` is the display name; `goalGetterID` is the dedup key
- Only 22 of 72 matches are finished at data snapshot time — stats will be sparse
  early in the tournament

**Status:** [ ] pending

---

### Sub-Task 8 — Polish, Fallback & Final QA

**Intent**
Wire up the local fallback properly, add loading/error states, test offline mode,
and do a final visual pass.

**Expected Outcomes**
- Loading spinner shown while data fetches; replaced by content on success
- Error banner shown if both live fetch and local fallback fail
- The mock.js `<script>` tag toggle is documented in an HTML comment so devs can
  enable offline mode by uncommenting one line
- All 5 tabs render without JS errors in browser console
- Flags load (or show fallback) without broken-image icons
- Page title and `<meta>` tags set correctly
- The app looks coherent at 375px (mobile), 768px (tablet), 1280px (desktop)

**Todo List**
1. Verify `fetchData()` fallback chain: live API → local JSON → error state
2. Add `<div id="loading">` spinner and `<div id="error">` banner; show/hide
   from `app.js`
3. Add `onerror` to all `<img>` flag elements → replace `src` with a
   data-URI letter badge (two-letter shortName on coloured square)
4. Uncomment the mock `<script>` tag, verify all tabs render correctly with
   purely local data, then re-comment
5. Final responsive CSS pass — check tab bar, match cards, standings tables on
   narrow widths
6. Set `<title>WM 2026 Match Centre</title>` and basic Open Graph meta tags

**Relevant Context**
- The mock file path is `data/openligadb-wm26-2026.mock.js` — it must be loaded
  **before** `app.js` for `window.__OPENLIGADB_WM26_MOCK__` to be present
- The live API returns a **raw array**, not the `{ matches: [...] }` envelope —
  handle both shapes in `fetchData()`

**Status:** [ ] pending
