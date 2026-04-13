# Quickstart: Weekly Training Targets

## Prerequisites

- Node.js 18+
- `.env` file with `WHOOP_CLIENT_ID` and `WHOOP_CLIENT_SECRET`
- Authenticated session (complete OAuth flow at `http://localhost:3000`)

## What Gets Built

1. **`public/targets.html`** — New page with all client-side logic
   (classification, grouping, rendering).
2. **`server.js`** — Add one route: `GET /targets` serving
   `targets.html`.
3. **`public/index.html`** — Add "Targets" nav link in the header.

## How to Run

```bash
npm start
# Open http://localhost:3000
# Authenticate via WHOOP OAuth
# Click "Targets" in the nav bar
```

## How It Works

1. `targets.html` loads and fetches
   `GET /api/workout?start=2025-01-01T00:00:00.000Z&end={now}`.
2. API `records[]` are normalized to a canonical client
   `workouts[]` array.
3. Client JS filters to SCORED workouts only.
4. Each workout is classified by sport_id mapping only:
   - strength: 44, 45
   - cardio: 0, 1
   - excluded: everything else
   No strain-based fallback is used.
5. Workouts are grouped into ISO weeks (Mon-Sun).
6. A 3-metric scoreboard renders above the weekly table:
   - Lagging indicator: Completed weeks - {metWeeks} / {completedWeeks} ({percentage}%)
   - Recent signal: Last 4 completed weeks - {metLast4} / {last4Total}
   - Leading indicator: This week - {strengthCount} / 3 strength · {cardioCount} / 1 cardio
7. A table renders one row per week with colour-coded status:
   green (met), red (missed), yellow (in-progress).
8. Clicking a row expands it to show individual sessions.

## Validation Baseline (Current WHOOP Export)

Use this baseline for reconciliation and discrepancy checks.

### Weekly Expected Totals

| Week | Strength | Cardio | Expected Status |
| ---- | -------- | ------ | --------------- |
| 2026-W01 | 1 | 1 | MISSED |
| 2026-W02 | 2 | 1 | MISSED |
| 2026-W03 | 1 | 1 | MISSED |
| 2026-W04 | 1 | 2 | MISSED |
| 2026-W05 | 2 | 2 | MISSED |
| 2026-W06 | 2 | 1 | MISSED |
| 2026-W07 | 3 | 0 | MISSED |
| 2026-W08 | 3 | 1 | MET |
| 2026-W09 | 3 | 0 | MISSED |
| 2026-W10 | 3 | 0 | MISSED |
| 2026-W11 | 3 | 0 | MISSED |
| 2026-W12 | 0 | 0 | MISSED |
| 2026-W13 | 2 | 3 | MISSED |
| 2026-W14 | 2 | 2 | MISSED |
| 2026-W15 | 1 | 1 | IN-PROGRESS |

### Known Week Guardrails

- `2026-W03`: no cardio overcount; expected `strength=1`, `cardio=1`, status `MISSED`.
- `2026-W05`: unknown activity (`sport_id=-1`, `sport_name=activity`) must be excluded; expected status `MISSED`.
- `2026-W10`: restorative-yoga and stretching must be excluded; expected `strength=3`, `cardio=0`, status `MISSED`.

### Scoreboard Expected Values

- Lagging indicator: `Completed weeks - 1 / 14 (7%)`
- Recent signal: `Last 4 completed weeks - 0 / 4`
- Leading indicator: `This week - 1 / 3 strength · 1 / 1 cardio`

### Validation Run (2026-04-09)

- Source: live `GET /api/workout` export window from `2026-01-01` to now.
- Result: `baselineMismatchesCount = 0` (all expected weekly totals/status matched).
- Guardrails:
  - `2026-W03` matched `strength=1`, `cardio=1`, `status=MISSED`
  - `2026-W05` matched `strength=2`, `cardio=2`, `status=MISSED`
  - `2026-W10` matched `strength=3`, `cardio=0`, `status=MISSED`
- Scoreboard values matched expected output:
  - `Completed weeks - 1 / 14 (7%)`
  - `Last 4 completed weeks - 0 / 4`
  - `This week - 1 / 3 strength · 1 / 1 cardio`

If rendered values differ from this baseline, the discrepancy report
must show the ISO week and expected vs actual totals.

## Key Files

| File                 | Role                             |
| -------------------- | -------------------------------- |
| `public/targets.html`| All UI + client logic            |
| `server.js`          | Serves targets.html at /targets  |
| `public/index.html`  | Nav link to /targets             |
| `public/openapi.yaml`| Workout schema reference         |
