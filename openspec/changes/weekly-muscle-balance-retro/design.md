## Context

The app today is a single-file Express server (`server.js`) with no database: WHOOP is the only integration, auth is OAuth2 with tokens persisted to `.env`, and data endpoints (`/api/recovery`, `/api/cycle`, `/api/sleep`, `/api/workout`, `/api/body`) are thin proxies that fetch-and-return on each request. The UI is static HTML (`public/targets.html`) fetching from these JSON endpoints. This change adds a second external integration (Hevy) and a computed analysis on top of both data sources — it should follow the existing "no persistence, fetch-and-compute per request" pattern rather than introducing a database.

## Goals / Non-Goals

**Goals:**
- Fetch Hevy workout data for a given week and roll it up into per-muscle-group volume.
- Correlate that volume against the same week's WHOOP recovery/strain trend.
- Flag muscle groups as under-worked or over-worked using a simple, explainable heuristic.
- Reuse the existing architecture pattern (env-based config, stateless fetch-and-compute endpoints, static HTML page).

**Non-Goals:**
- No database or persisted history beyond what's needed for a trailing 4-week baseline (computed on the fly from Hevy's API, not stored).
- No automatic program/training adjustments — this is a read-only retro, not a coach.
- No statistical/ML modeling of recovery — thresholds are simple, transparent heuristics for v1.
- No push notifications; the retro is viewed on demand, like the existing `/targets` page.

## Decisions

- **Hevy auth via static API key, not OAuth**: Hevy's API is key-based (unlike WHOOP's OAuth2). Store `HEVY_API_KEY` in `.env` alongside the WHOOP vars, sent as a header on each request. Simpler than OAuth and matches what Hevy's API actually supports.
- **Muscle group source = Hevy's own exercise template data**: Pull `primary_muscle_group` (and secondary, if present) from Hevy's exercise templates endpoint rather than hand-maintaining a full exercise→muscle-group table. Reduces ongoing maintenance as the user's exercise list grows. A small local fallback map covers custom exercises Hevy doesn't tag.
- **Volume metric = tonnage (sets × reps × weight), not set count**: Tonnage is more sensitive to intensity changes, which pairs better with WHOOP strain (also intensity-sensitive) than a simple set/rep count would.
- **Week = Monday–Sunday**, matching WHOOP's cycle day boundaries, so the two data sources line up without a separate calendar-alignment step.
- **Trend-relative, not absolute, thresholds**: "Over-worked" = this week's volume above the user's own trailing 4-week average for that muscle group AND recovery trending down; "under-worked" = volume below average AND recovery trending up. Avoids hardcoding thresholds that don't generalize across users/programs.
- **No new persistence layer**: Both Hevy and WHOOP data are fetched fresh per request and joined in memory, consistent with how `/api/whoop/all` already works. Acceptable at single-user scale; avoids a migration/schema decision for v1.
- **New static page `public/retro.html`**, calling a new `GET /api/retro/muscle-balance` endpoint — mirrors the existing `targets.html` + JSON endpoint pattern rather than introducing a new frontend approach.
- **Sets count tracked alongside tonnage per muscle group**: a simple count, not weighted. Tonnage alone doesn't distinguish "1 heavy session" from "3 lighter sessions" for a muscle group, which matters for the 2x/week research threshold — sets count gives a direct frequency signal.
- **Progressive overload = per-exercise tonnage history since a fixed date (2026-01-01), not a rolling window**: shows the full progression for an exercise rather than a short-term snapshot. Overload is inherently an exercise-level phenomenon (e.g. bench press specifically), so rolling it up to muscle-group level would wash out the signal.
- **Workout-completion progress is computed server-side by duplicating the same sport_id classification (44/45=strength, 0/1=cardio) and the 3-strength+1-cardio weekly target already encoded client-side in `targets.html`**: a small duplication rather than a shared module, consistent with this app's existing no-build, single-file style where client and server don't share JS code.
- **The "next workout" recommendation is not a new heuristic**: it resurfaces whichever muscle group(s) are already flagged "under-worked" for the current week into a dedicated field, so the recommendation can never drift from the flagging logic already decided above.

## Risks / Trade-offs

- **Hevy API rate limits or downtime** → Cache the exercise-template→muscle-group mapping in memory for the server's lifetime so it's only fetched once per run, not per request.
- **Recompute cost on every request** (no caching of joined results) → Acceptable given single-user, on-demand usage; revisit if the retro is ever surfaced to multiple users or on a schedule.
- **Heuristic flagging can misfire** for unconventional splits (e.g., a user who deliberately trains one muscle group once a week by design) → Always show raw weekly volume and recovery numbers alongside the flag, so the user can override the heuristic's judgment.
- **Hevy's muscle-group taxonomy is finer-grained than useful** (e.g. "quadriceps", "hamstrings", "glutes" vs. a simple "legs" bucket) → Add a grouping layer that buckets Hevy's categories into ~6 macro groups (chest, back, legs, shoulders, arms, core) for the flagging logic, while still showing the detailed breakdown.

## Migration Plan

Purely additive: new env vars (`HEVY_API_KEY`), new routes, new static page. No changes to existing WHOOP routes or token handling. Rollback is deleting the new routes/files and env vars.

## Open Questions

- Confirm Hevy's public API actually exposes `primary_muscle_group` per exercise template (assumed during design; verify against Hevy's API docs during implementation, and fall back to a local mapping table if not available).
- Should the retro eventually run proactively (e.g., a Sunday-night reminder) rather than purely on-demand? Deferred — v1 is pull-only.
- What counts as "increasing" vs "flat" vs "decreasing" for the per-exercise tonnage trend — a straight first-vs-last comparison, a percentage change threshold, or a trendline slope? Not decided; the classification task is deliberately not scheduled in tasks.md until this is resolved. Raw per-session tonnage history can still be implemented and shown without this decision.
