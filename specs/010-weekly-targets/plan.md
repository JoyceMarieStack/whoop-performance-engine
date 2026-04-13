# Implementation Plan: Weekly Training Targets

**Branch**: `010-weekly-targets` | **Date**: 2026-04-09 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/010-weekly-targets/spec.md`

## Summary

Replace the previous single narrative headline with a factual 3-metric
scoreboard rendered above the weekly table. The scoreboard must show
lagging indicator, recent signal, and leading indicator using exact copy,
with all metrics computed from the corrected classification pipeline only:
workouts array, SCORED workouts only, strict sport_id mapping
(44/45 strength, 0/1 cardio, all others excluded), and deterministic ISO
week grouping.

## Technical Context

**Language/Version**: Node.js 18+ (server), vanilla ES2020 JavaScript (client)
**Primary Dependencies**: Express server, browser Fetch API
**Storage**: N/A (no persistence, client-side derived metrics)
**Testing**: Manual browser verification plus export reconciliation checks
**Target Platform**: Modern desktop browsers (Chrome, Safari, Firefox)
**Project Type**: Single project (Express + static HTML/CSS/JS)
**Performance Goals**: Scoreboard and weekly table visible under 3s after API response
**Constraints**: OAuth2 flow unchanged, no framework adoption, no heuristic classifier fallback
**Scale/Scope**: Single Targets page update in `public/targets.html`

## Scoreboard Contract (Authoritative)

- Remove narrative/frequency headline generation from UI logic.
- Render a top metrics section above the weekly table with exactly three entries.
- Titles must be exactly: Lagging indicator, Recent signal, Leading indicator.
- Metric copy must be exactly:

- Lagging indicator: Completed weeks - {metWeeks} / {completedWeeks} ({percentage}%)
- Recent signal: Last 4 completed weeks - {metLast4} / {last4Total}
- Leading indicator: This week - {strengthCount} / 3 strength · {cardioCount} / 1 cardio

- completedWeeks excludes the in-progress current ISO week.
- Recent signal uses only the last 4 completed weeks.
- Leading indicator always uses current ISO week values, even when incomplete.

## Calculation and Classification Rules

- All metric calculations are derived from normalized workouts array only.
- Only workouts with `score_state === "SCORED"` are eligible.
- Classification mapping is strict and exclusive:

- strength: sport_id 44, 45
- cardio: sport_id 0, 1
- excluded: any other sport_id

- Weekly status remains unchanged:

- met when strengthCount >= 3 and cardioCount >= 1
- missed when completed week fails target
- in-progress for current ISO week unless target already met

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Verdict | Evidence |
| --- | --- | --- | --- |
| I | OAuth2 Authorization Code Flow | PASS | No authentication or token handling changes are required. |
| II | Docs as Code | PASS | Planning and design updates remain in specs and docs paths under version control. |
| III | Simplicity | PASS | Single-page UI update only, no framework or architecture expansion. |

**Gate result**: PASS

## Project Structure

### Documentation (this feature)

```text
specs/010-weekly-targets/
├── plan.md
├── spec.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── client-data-flow.md
└── tasks.md
```

### Source Code (repository root)

```text
server.js
public/
├── index.html
├── targets.html
└── openapi.yaml
docs/
└── ...
```

**Structure Decision**: Keep all scoreboard rendering and metric
calculation logic in `public/targets.html`, leveraging existing fetch,
classification, and weekly summary functions without introducing new
server endpoints.

## Phase 0 Research Plan

No unresolved technical unknowns remain for this scope. Existing project
choices and strict classification rules are already defined and accepted.
Research output remains valid with no additional dependency evaluation needed.

## Phase 1 Design Plan

- Update view model to expose scoreboard metrics alongside weekly summaries.
- Include metWeeks, completedWeeks, percentage.
- Include metLast4, last4Total.
- Include currentWeekStrength, currentWeekCardio.
- Replace old headline render function with scoreboard renderer.
- Ensure scoreboard values are sourced from corrected weekly summaries only.
- Preserve existing status badges and row coloring behavior for met/missed/in-progress.
- Keep language factual and dashboard-style, with no narrative encouragement copy.

## Post-Design Constitution Re-Check

| # | Principle | Verdict | Evidence |
| --- | --- | --- | --- |
| I | OAuth2 Authorization Code Flow | PASS | UI-only changes; OAuth2 implementation untouched. |
| II | Docs as Code | PASS | Plan reflects implementation and remains repo-tracked. |
| III | Simplicity | PASS | Metrics section is a small extension of existing page rendering. |

**Post-design gate result**: PASS

## Complexity Tracking

No constitution violations requiring justification.
