## 1. Hevy integration setup

- [x] 1.1 Add `HEVY_API_KEY` to `.env.example` and document it alongside the WHOOP vars
- [x] 1.2 Add startup validation: warn (not crash) if `HEVY_API_KEY` is missing, and make Hevy-dependent routes return a `503`-class error until configured
- [x] 1.3 Create a Hevy API client module (base URL, auth header, fetch helper with pagination if needed)

## 2. Hevy data fetching

- [x] 2.1 Implement fetching workouts (exercises, sets, reps, weight) for a given date range
- [x] 2.2 Implement fetching exercise templates and extracting `primary_muscle_group` per exercise
- [x] 2.3 Add local fallback muscle-group mapping for exercises Hevy doesn't tag, plus an "unmapped" bucket for anything still unresolved
- [x] 2.4 Add a macro muscle-group grouping layer (chest, back, legs, shoulders, arms, core) on top of Hevy's finer-grained categories
- [x] 2.5 Add `GET /api/hevy/workouts` route wiring the above together, with `502`-class error handling for Hevy API failures

## 3. Weekly volume computation

- [x] 3.1 Implement week boundary helper (Monday–Sunday) consistent with WHOOP cycle days
- [x] 3.2 Implement per-macro-muscle-group tonnage computation (sets × reps × weight) for a given week
- [x] 3.3 Handle the zero-workouts-in-week case (return zero volume, not an error)
- [x] 3.4 Implement per-macro-muscle-group weekly set count alongside tonnage

## 4. Recovery/strain correlation and flagging

- [x] 4.1 Implement trailing 4-week average volume per muscle group (fewer weeks if history is limited; flag when baseline is partial)
- [x] 4.2 Implement WHOOP recovery trend comparison (current week vs. prior week) reusing the existing `/api/recovery` and `/api/cycle` data
- [x] 4.3 Implement the over-worked / under-worked / balanced flagging logic per the design's heuristic
- [x] 4.4 Ensure raw numbers (volume, trailing average, recovery trend direction) are included alongside each flag

## 5. Progressive overload tracking

- [x] 5.1 Implement per-exercise tonnage-per-session history extraction from Hevy data, starting from 2026-01-01

## 6. Retro endpoint and page

- [x] 6.1 Add `GET /api/retro/muscle-balance` endpoint that joins Hevy volume + WHOOP recovery/strain and returns the flagged weekly retro, including weekly sets per muscle group and per-exercise tonnage history
- [x] 6.2 Add error handling that identifies which upstream data source (Hevy or WHOOP) failed, rather than returning a partial/misleading result
- [x] 6.3 Add `public/retro.html` following the existing `targets.html` pattern, rendering per-muscle-group volume, sets, trend, and flag, plus per-exercise tonnage history
- [x] 6.4 Wire up a `GET /retro` route in `server.js` serving the new page
- [x] 6.5 Compute weekly workout-completion progress (X of 4) server-side, reusing the same sport_id classification and 3+1 target as `targets.html`
- [x] 6.6 Compute the next-workout recommendation field from the current week's under-worked muscle group flags
- [x] 6.7 Render completion progress and next-workout recommendation on `public/retro.html`

## 7. Verification

- [x] 7.1 Manually verify the retro against a week with known Hevy workouts and WHOOP recovery data (user confirmed "all looks good" after checking `/retro` against actual Hevy log)
- [x] 7.2 Verify behavior when Hevy has no workouts logged for the week (tested in isolation with an empty workout list — confirmed zero volume, no error)
- [x] 7.3 Verify behavior when `HEVY_API_KEY` is missing or invalid (tested live — missing key returns 503, invalid key returns 502)
- [x] 7.4 Verify behavior with fewer than 4 weeks of Hevy history (partial baseline) (tested in isolation with a synthetic short history — confirmed `partialBaseline: true`)
- [x] 7.5 Verify weekly set count per muscle group against known Hevy workouts (user confirmed "all looks good" after checking `/retro` against actual Hevy log)
- [x] 7.6 Verify per-exercise tonnage history returns correctly for an exercise logged since 2026-01-01 (user confirmed "all looks good" after checking `/retro` against actual Hevy log)
- [x] 7.7 Verify workout-completion progress matches the count shown on `/targets` for the same week (found and fixed a real bug: WHOOP sport_id 123 "weightlifting_msk" wasn't in either classification map, undercounting a real session; retro now correctly shows 2/4 matching Hevy's 2 logged workouts, and the same fix was applied to targets.html)
- [x] 7.8 Verify the next-workout recommendation matches whichever muscle group(s) are flagged under-worked in the table (confirmed: recommendation and table agree — chest, legs, core)
