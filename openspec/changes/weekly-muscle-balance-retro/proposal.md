## Why

Right now the app surfaces WHOOP recovery, strain, sleep, and cycle data, and a weekly training target page, but nothing connects *what muscle groups were actually trained* to *how recovered the body was*. Without that link, it's easy to keep hammering a muscle group that's already overworked (rising strain, falling recovery) while a neglected group goes untouched for weeks. A weekly retro that cross-references Hevy set/volume data per muscle group against WHOOP recovery/strain trends lets the user correct imbalances before each new week starts, instead of noticing them after an injury or plateau.

## What Changes

- Add a Hevy API client to fetch workout history (exercises, sets, reps, weight) for a given week.
- Add a muscle-group mapping for exercises (e.g. chest, back, legs, shoulders, arms, core) so per-workout volume can be rolled up by muscle group.
- Compute weekly volume per muscle group from Hevy data.
- Correlate each muscle group's weekly volume against WHOOP recovery and strain trends for that week.
- Flag muscle groups as **under-worked** (low volume, recovery trending up/high — capacity to do more) or **over-worked** (high volume, recovery trending down/low — needs rest).
- Surface the retro as a new page/endpoint the user checks before planning the upcoming week.
- Persist a Hevy API key/config alongside the existing WHOOP OAuth config (new env vars, following the existing `.env` pattern).

## Capabilities

### New Capabilities
- `hevy-integration`: Authenticated client for the Hevy API — fetching workouts/exercises/sets for a date range, and mapping exercises to muscle groups.
- `weekly-muscle-balance-retro`: Computes per-muscle-group weekly training volume, correlates it with WHOOP recovery/strain, and flags under- and over-worked muscle groups for the upcoming week.

### Modified Capabilities
(none — no existing specs cover Hevy data or muscle-group analysis)

## Impact

- **Code**: `server.js` (new routes, e.g. `GET /api/hevy/workouts`, `GET /api/retro/muscle-balance`), new Hevy client module, new muscle-group mapping data, new `public/*.html` page for the retro view.
- **Config**: New env vars for Hevy API credentials in `.env.example` / `.env`, following the existing WHOOP token pattern.
- **External dependency**: Hevy API (new third-party integration alongside WHOOP).
- **Existing WHOOP endpoints** (`/api/recovery`, `/api/cycle`) are read, not modified — this change is additive.
