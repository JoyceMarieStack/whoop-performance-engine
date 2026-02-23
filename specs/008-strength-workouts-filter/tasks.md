# Tasks: Strength Workouts Filter

**Input**: Design documents from `/specs/008-strength-workouts-filter/`
**Prerequisites**: plan.md (required), spec.md (required)

## Phase 1: Setup

- [x] T001 Define `STRENGTH_SPORT_IDS` constant array (`[44, 71]`) in `server.js`

---

## Phase 2: User Story 1 — Filter Workouts to Strength Sessions (Priority: P1) — MVP

**Goal**: Connected user clicks "Strength" button, sees only weightlifting/functional fitness workout records for the selected date range.

**Independent Test**: Select a 14-day range with mixed workout types, click "Strength", confirm only sport_id 44/71 records appear. Select a range with no strength workouts and confirm a descriptive empty-state message.

### Implementation for User Story 1

- [x] T002 [US1] Implement `GET /api/workout/strength` route in `server.js` — reuse `whoopFetchAllPages` for `/v2/activity/workout`, filter results to `STRENGTH_SPORT_IDS`, return `{ records }` or empty-state message
- [x] T003 [US1] Add "Strength" button to the `.endpoints` div in `public/index.html`
- [x] T004 [US1] Implement `fetchStrength()` function in `public/index.html` — call `/api/workout/strength?start=…&end=…`, display filtered JSON, handle empty/error states

**Checkpoint**: User Story 1 complete — Strength button returns filtered results, copy works via existing `copyJSON()`.

---

## Phase 3: User Story 2 — Strength After Fetch All (Priority: P2)

**Goal**: After fetching all data, user clicks "Strength" to see only the strength subset without a separate API round-trip concern (the button always fetches fresh from the API for consistency).

**Independent Test**: Click "Fetch All", see mixed workouts in combined JSON, then click "Strength" and confirm only strength records appear.

### Implementation for User Story 2

> No additional implementation required — US2 is satisfied by the Strength button from US1. Clicking "Strength" after "Fetch All" simply fetches and filters workouts for the selected date range, which is the same behaviour as US1.

**Checkpoint**: US2 verified — "Strength" button works independently regardless of prior Fetch All usage.

---

## Phase 4: Polish & Cross-Cutting Concerns

- [x] T005 Verify `node --check server.js` passes after all changes
- [x] T006 Manual smoke test — connect to WHOOP, click Strength with a date range containing mixed workout types, confirm filtering and copy work end-to-end

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (US1)**: Depends on T001 (constant definition)
- **Phase 3 (US2)**: No additional tasks — verified by US1 implementation
- **Phase 4 (Polish)**: Depends on T001–T004 completion

### Within User Story 1

- T002 (backend route) depends on T001 (constant)
- T003 (button HTML) and T004 (JS handler) can be done together but both modify `public/index.html`
- T003 → T004 recommended order (add button, then wire handler)

### Parallel Opportunities

- T003 and T002 can run in parallel (different files)

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Define constant (T001)
2. Complete Phase 2: Backend route (T002) + frontend button & handler (T003, T004)
3. **STOP and VALIDATE**: Strength button returns only sport_id 44/71 records
4. Phase 4: Smoke test

### Total Tasks: 6

- Phase 1 (Setup): 1 task
- Phase 2 (US1 — MVP): 3 tasks
- Phase 3 (US2): 0 tasks (covered by US1)
- Phase 4 (Polish): 2 tasks
