# Tasks: Weekly Training Targets - Scoreboard Update

**Input**: Design documents from `/specs/010-weekly-targets/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/client-data-flow.md, quickstart.md

**Tests**: No automated test framework requested. Validation is manual against WHOOP workout export data.

**Organization**: Tasks are grouped by user story so each story can be implemented and verified independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no blocking dependency)
- **[Story]**: User story label for traceability (`[US1]`, `[US2]`, `[US3]`)
- Every task includes an exact file path

---

## Phase 1: Setup

**Purpose**: Confirm page route and entry point stability before scoreboard changes

- [X] T001 Confirm `GET /targets` serves `public/targets.html` in server.js
- [X] T002 [P] Confirm `Targets` navigation points to `/targets` in public/index.html

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Lock deterministic data pipeline and classification inputs for all metrics

**CRITICAL**: No user story implementation should begin until this phase is complete.

- [X] T003 Lock single-source classifier `classifyWorkout(workout)` in public/targets.html
- [X] T004 Remove any residual narrative-headline helpers and frequency-copy dependencies in public/targets.html
- [X] T005 Ensure `normalizeWorkouts(data)` is the canonical records-to-workouts source in public/targets.html
- [X] T006 Ensure SCORED-only filtering is applied before classification/aggregation in public/targets.html
- [X] T007 Verify strict mapping (`44/45 => strength`, `0/1 => cardio`, other sport_id => excluded) in public/targets.html
- [X] T008 Verify ISO week helper behavior for current-week detection and week labels in public/targets.html
- [X] T009 Verify weekly summary generation uses only classified workouts in public/targets.html

**Checkpoint**: Data pipeline and weekly summaries are deterministic and ready for scoreboard metrics.

---

## Phase 3: User Story 1 - View Weekly Target Status (Priority: P1) MVP

**Goal**: Replace the old headline block with a factual top-of-page 3-metric scoreboard

**Independent Test**: Open `/targets` and verify all three metric rows render above the weekly table with exact labels and correct values.

- [X] T010 [US1] Remove old headline renderer and frequency-based narrative copy in public/targets.html
- [X] T011 [US1] Implement Lagging indicator metric calculation (`metWeeks`, `completedWeeks`, `percentage`) in public/targets.html
- [X] T012 [US1] Implement Recent signal metric calculation (`metLast4`, `last4Total`) in public/targets.html
- [X] T013 [US1] Implement Leading indicator metric calculation from current ISO week only (`strengthCount`, `cardioCount`) in public/targets.html
- [X] T014 [US1] Exclude in-progress current week from Lagging indicator and Recent signal calculations in public/targets.html
- [X] T015 [US1] Render scoreboard section above weekly table with exact labels `Lagging indicator`, `Recent signal`, `Leading indicator` in public/targets.html
- [X] T016 [US1] Render metric text with required factual copy format for all three metrics in public/targets.html
- [X] T017 [US1] Keep existing weekly row status behavior (`met`/`missed`/`in-progress`) unchanged while scoreboard is added in public/targets.html

**Checkpoint**: Scoreboard is visible above table with exact labels and correct calculation scope.

---

## Phase 4: User Story 2 - Understand Session Classification (Priority: P2)

**Goal**: Preserve classification transparency while scoreboard is introduced

**Independent Test**: Expand weeks and verify counted/excluded sessions still match strict classification rules.

- [X] T018 [US2] Verify expandable detail rows still show sport name/date/category after scoreboard update in public/targets.html
- [X] T019 [US2] Verify unknown/unmapped activities (including `sport_id: -1`) remain excluded from counts in public/targets.html
- [X] T020 [US2] Verify debug classification view still renders expected/computed category and ISO week in public/targets.html

**Checkpoint**: Classification evidence remains auditable and consistent with scoreboard counts.

---

## Phase 5: User Story 3 - Chat-Based Explanation (Priority: P3)

**Goal**: Keep explanation flow aligned to corrected weekly summaries and scoreboard-derived facts

**Independent Test**: Click `Explain` and confirm prompt context references corrected weekly and metric facts.

- [X] T021 [US3] Update `buildChatPrompt(summaries, discrepancies)` to use scoreboard-aligned weekly facts in public/targets.html
- [X] T022 [US3] Ensure explain flow passes corrected summaries/discrepancies only in public/targets.html
- [X] T023 [US3] Verify `/api/chat` prompt payload handling remains compatible in server.js

**Checkpoint**: Explanation output is grounded in the same corrected data shown in the dashboard.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Align docs/references and validate final numbers against WHOOP export data

- [X] T024 [P] Update scoreboard requirements and remove narrative headline references in specs/010-weekly-targets/spec.md
- [X] T025 [P] Update scoreboard implementation contract and metric rules in specs/010-weekly-targets/plan.md
- [X] T026 [P] Update scoreboard computation flow in specs/010-weekly-targets/contracts/client-data-flow.md
- [X] T027 [P] Update scoreboard metric entity definitions and no-fallback notes in specs/010-weekly-targets/data-model.md
- [X] T028 [P] Update runbook and expected scoreboard outputs in specs/010-weekly-targets/quickstart.md
- [X] T029 Validate rendered weekly table values against WHOOP workout export baseline in specs/010-weekly-targets/quickstart.md
- [X] T030 Validate Lagging indicator values against completed-week counts from export in specs/010-weekly-targets/quickstart.md
- [X] T031 Validate Recent signal values against last 4 completed weeks from export in specs/010-weekly-targets/quickstart.md
- [X] T032 Validate Leading indicator values against current ISO week totals from export in specs/010-weekly-targets/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies
- **Phase 2 (Foundational)**: Depends on Phase 1 and blocks all user stories
- **Phase 3 (US1, P1)**: Depends on Phase 2
- **Phase 4 (US2, P2)**: Depends on Phase 2 and must remain consistent with US1 counts
- **Phase 5 (US3, P3)**: Depends on Phase 3 metric/summaries contract
- **Phase 6 (Polish)**: Depends on completed implementation in Phases 3-5

### User Story Dependencies

- **US1 (P1)**: MVP scoreboard delivery
- **US2 (P2)**: Independent verification layer on shared classification outputs
- **US3 (P3)**: Dependent on corrected weekly summaries and scoreboard calculations

### Parallel Opportunities

- T001 and T002 can run in parallel
- T024-T028 can run in parallel across documentation files
- T029-T032 can be split by metric category once export data is available

---

## Parallel Example: User Story 1

```bash
Task: "T011 [US1] Implement Lagging indicator metrics in public/targets.html"
Task: "T013 [US1] Implement Leading indicator current-week metrics in public/targets.html"
```

## Parallel Example: User Story 2

```bash
Task: "T018 [US2] Verify detail rows/classification display in public/targets.html"
Task: "T020 [US2] Verify debug classification evidence view in public/targets.html"
```

## Parallel Example: User Story 3

```bash
Task: "T021 [US3] Update chat prompt metrics context in public/targets.html"
Task: "T023 [US3] Verify /api/chat payload compatibility in server.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (T001-T002)
2. Complete Phase 2 (T003-T009)
3. Complete Phase 3 (T010-T017)
4. Validate scoreboard values before moving to P2/P3

### Incremental Delivery

1. Foundation: deterministic classifier + weekly summaries
2. US1: scoreboard replacement and exact metric copy
3. US2: retained classification auditability
4. US3: explanation alignment with corrected metrics
5. Polish: docs/reference cleanup and export-based metric validation
