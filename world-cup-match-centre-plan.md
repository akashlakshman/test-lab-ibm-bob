# World Cup 2026 Match Centre — Build Plan

## Status: ✅ COMPLETE

All eight sub-tasks have been delivered. The app is a plain HTML/CSS/JS multi-page
site with no frameworks, no build tools, and no package managers.

---

## Delivered File Structure

```
/
├── index.html                          root redirect → pages/overview.html
├── world-cup-match-centre-plan.md      this file
│
├── pages/
│   ├── overview.html                   data-page="overview"
│   ├── matches.html                    data-page="matches"
│   ├── table.html                      data-page="table"
│   ├── knockout.html                   data-page="knockout"
│   ├── stats.html                      data-page="stats"
│   └── match.html                      data-page="match" (hospitality detail)
│
├── scripts/
│   ├── app.js                          tab rendering (all 5 tabs)
│   └── match.js                        match detail + hospitality + enquiry form
│
├── styles/
│   ├── main.css                        shared design system
│   └── match.css                       match detail page styles
│
└── data/
    ├── openligadb-wm26-2026.json       local fallback ({ matches: [...] } envelope)
    └── openligadb-wm26-2026.mock.js    sets window.__OPENLIGADB_WM26_MOCK__
```

---

## Architecture Notes

- Each `pages/*.html` file sets `<body data-page="pagename" data-root="../">`.
  `app.js` reads `data-page` to dispatch to one render function; `data-root`
  resolves relative paths for `fetch()` so links work via `file://`.
- **Data loading chain**: mock override → live API (`https://api.openligadb.de/getmatchdata/wm26/2026`)
  → local JSON fallback. Both API (raw array) and local JSON (`{ matches: [...] }` envelope)
  shapes are handled in `extractMatches()`.
- **Group inference**: `teamGroupName` is always `null` in the API. Group letters A–L
  are inferred by union-find on match pairings; 12 clusters of 4 teams sorted
  alphabetically for stable A–L labels.
- **Scores**: `resultTypeID === 2` = full-time; `resultTypeID === 1` = half-time.
- **Knockout tab**: renders WC 2026 R32 bracket structure with TBD placeholders;
  auto-populates when knockout data appears (groupOrderID > 3).
- **Match detail / hospitality**: clicking any match card navigates to
  `pages/match.html?id={matchID}` which loads `match.js` (not `app.js`).
  A static `CITY_INFO` lookup table covers all 16 host cities across USA/Canada/Mexico
  with airport, airlines, hotels (3 tiers), and transport options.
- **Enquiry form**: Formspree-powered (`<form action="https://formspree.io/f/YOUR_FORM_ID">`).
  Replace `YOUR_FORM_ID` with a real Formspree form ID to activate email delivery.
  Hidden fields pre-fill match name, venue, and kick-off time automatically.

---

## Sub-Tasks

### Sub-Task 1 — Project Scaffold & Data Layer ✅
- `index.html` entry point with meta-refresh to `pages/overview.html`
- `extractMatches()` handles both API (raw array) and local JSON (envelope) shapes
- Mock override: load `data/openligadb-wm26-2026.mock.js` before `app.js` to skip network
- `inferGroupLetters()` — union-find algorithm assigns stable A–L group labels
- `calcStandings()` — both-teams guard prevents crash when a team is not in the group set
- 60-second polling re-fetches when live matches are present

### Sub-Task 2 — Global Layout & FIFA Dark-Navy Design System ✅
- Design tokens: deep navy `#020f2a` hero, bright blue `#0a84ff` accent, red `#f43056` live
- FIFA-inspired topbar, tab nav as `<a>` links (works via `file://`), responsive breakpoints
- `styles/main.css` — shared across all tab pages
- `styles/match.css` — match detail page only

### Sub-Task 3 — Overview Tab ✅
- Live Now (pulsing red dot), Today, Recent Results, Upcoming sections
- `matchCard()` renders as `<a href="pages/match.html?id=…">` — clickable to detail page
- Summary stat cards: teams, matches played, goals, avg goals/match

### Sub-Task 4 — Matches Tab ✅
- Phase filter (All / Matchday 1-2-3) + group filter (All / A-L)
- Matches grouped by calendar date with date-separator headers
- `matchRow()` compact row layout; also links to detail page
- Goal scorers listed inline per match

### Sub-Task 5 — Table Tab ✅
- One standings table per group A–L
- Columns: Pos, Flag+Team, Pld, W, D, L, GF, GA, GD, Pts
- Top-2 highlighted as qualifying; 3rd row as potential qualifier
- Points: Win=3, Draw=1, Loss=0; only `matchIsFinished === true` matches count

### Sub-Task 6 — Knockout Tab ✅
- WC 2026 R32 bracket: 16 R32 → 8 R16 → 4 QF → 2 SF → Final + 3rd place
- Slots pre-seeded with official FIFA 2026 bracket pairings (e.g. "1A vs 2B")
- Live standings auto-resolve team names + flags into bracket slots
- "TBD" shown for undecided or no-data slots

### Sub-Task 7 — Stats Tab ✅
- Top Scorers leaderboard (by `goalGetterID`, own goals excluded from scorer's tally)
- Goals by Group — CSS bar chart (no canvas)
- Match of the Tournament card (highest-scoring finished match)
- Team attack stats (most goals scored / most conceded)

### Sub-Task 8 — Polish, Fallback, Hospitality & Final QA ✅
- Loading spinner + error state on all pages
- Flag `onerror` → letter-badge fallback (no broken-image icons)
- Hospitality detail page (`pages/match.html`) with tickets, hotels, transport, flights
- Formspree enquiry form with pre-filled hidden fields
- `#enquire` nav pill in hospitality nav strip (highlighted in blue accent)
- All JS passes `node --check` syntax validation
- Responsive: 375px / 768px / 1280px breakpoints in both CSS files

---

## Pending User Action

1. **Activate Formspree**: visit [formspree.io](https://formspree.io), create a free
   account, create a new form, copy the form ID (e.g. `xpznkqvw`), and replace
   `YOUR_FORM_ID` in `scripts/match.js` line ~412:
   ```html
   action="https://formspree.io/f/YOUR_FORM_ID"
   ```
   Without this step the form submits to a dead URL. The free tier supports 50
   submissions/month; no server required.
