# Implementation Plan: User Steps Display

**Branch**: `009-user-steps` | **Date**: 2026-02-22 | **Spec**: `/specs/009-user-steps/spec.md`
**Input**: Feature specification from `/specs/009-user-steps/spec.md`

## Summary

Add manual step-count tracking to the dashboard. The WHOOP API does not provide step data, so the app lets the user enter a daily step count via a form, persists it in a local JSON file, and surfaces it through a "Steps" button and the existing "Fetch All" payload. Two new Express routes (POST for saving, GET for retrieval), a step-entry form in the HTML, and minor modifications to the aggregate route.

## Technical Context

**Language/Version**: JavaScript (Node.js 20+, ES modules)
**Primary Dependencies**: Express 5, dotenv, built-in `fs`/`path`/Node stdlib
**Storage**: Local JSON file (`data/steps.json`) — simple key-value by date
**Testing**: Manual browser testing
**Target Platform**: Local/dev Node server on macOS + browser UI
**Project Type**: Web application (single Express backend + static frontend)
**Constraints**: OAuth2 Authorization Code with client secret; static HTML/CSS/JS only; step operations require WHOOP auth for consistency
**Scale/Scope**: Single-user personal usage

## Constitution Check

- **Gate 1 — OAuth2 Authorization Code Flow**: PASS. All step routes use existing `requireAuth` middleware.
- **Gate 2 — Docs as Code**: N/A. No new documentation scope.
- **Gate 3 — Simplicity**: PASS. One JSON file, two routes, one form. No frameworks, no databases.

## Project Structure

### New Files

```text
data/steps.json        # Persistent storage for step entries (created at startup if missing)
```

### Modified Files

```text
server.js              # Add step persistence helpers, POST /api/steps, GET /api/steps routes; modify /api/whoop/all to include steps
public/index.html      # Add step entry form (date picker + numeric input + Save button); add "Steps" retrieval button + fetchSteps() handler
.gitignore             # Add data/ directory to prevent committing personal step data
```

## Key Decisions

- **JSON file storage**: A `data/steps.json` file is the simplest persistence that survives restarts. Object keyed by ISO date string (e.g., `{ "2026-02-22": { "steps": 8500, "updated": "..." } }`).
- **Auth required**: Per FR-010, step operations require WHOOP auth — reuse existing `requireAuth` middleware on both routes.
- **One entry per date**: PUT-style semantics on POST — saving for the same date overwrites. No delete endpoint needed.
- **Date range filtering**: GET route accepts `start` and `end` query params, filters stored entries to matching date range, returns sorted array.

## Implementation Approach

1. Create `data/` directory and seed `steps.json` if it doesn't exist on server startup.
2. Add helper functions to read/write the steps file (synchronous or async, using existing `readFileSync`/`writeFileSync` pattern already in server.js for `.env` persistence).
3. `POST /api/steps` — accepts `{ date, steps }`, validates non-negative integer, writes to file.
4. `GET /api/steps` — reads file, filters by `start`/`end` params, returns sorted array.
5. Modify `GET /api/whoop/all` — add a `steps` field to the combined payload.
6. Frontend: add step entry form above or below the date controls, add "Steps" button alongside existing endpoint buttons.
