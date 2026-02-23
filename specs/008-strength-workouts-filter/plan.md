# Implementation Plan: Strength Workouts Filter

**Branch**: `008-strength-workouts-filter` | **Date**: 2026-02-22 | **Spec**: `/specs/008-strength-workouts-filter/spec.md`
**Input**: Feature specification from `/specs/008-strength-workouts-filter/spec.md`

## Summary

Add a "Strength" button to the existing dashboard that fetches all workouts for the selected date range and filters server-side to only those where `sport_id` is 44 (Weightlifting) or 71 (Functional Fitness). The filtered JSON is displayed in the same output area and is copyable via the existing clipboard action. This is a small, additive feature — one new Express route and one new button in the frontend.

## Technical Context

**Language/Version**: JavaScript (Node.js 20+, ES modules)  
**Primary Dependencies**: Express 5, dotenv, built-in `fetch`/Node stdlib  
**Storage**: None (read-only filter on existing WHOOP workout data)  
**Testing**: Manual browser testing  
**Target Platform**: Local/dev Node server on macOS + browser UI  
**Project Type**: Web application (single Express backend + static frontend)  
**Constraints**: OAuth2 Authorization Code with client secret; static HTML/CSS/JS only; reuse existing proxy infrastructure  
**Scale/Scope**: Single-user personal usage

## Constitution Check

- **Gate 1 — OAuth2 Authorization Code Flow**: PASS. Reuses existing server-proxied auth — no new auth patterns.
- **Gate 2 — Docs as Code**: N/A. No new documentation scope for this incremental feature.
- **Gate 3 — Simplicity**: PASS. One new route, one new button. No frameworks, no abstractions.

## Project Structure

### Modified Files

```text
server.js              # Add GET /api/workout/strength route (filter by sport_id)
public/index.html      # Add "Strength" button + fetchStrength() handler
```

## Implementation Approach

The backend route (`GET /api/workout/strength`) reuses the existing `whoopFetchAllPages` helper to fetch all workouts, then filters the results array to records matching `sport_id` 44 or 71. The sport IDs are defined as a constant array for easy future extension. The frontend adds a single button that calls a new `fetchStrength()` function following the same pattern as existing endpoint buttons.
