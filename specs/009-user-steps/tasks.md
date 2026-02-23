# Tasks: User Steps Display

**Input**: Design documents from `/specs/009-user-steps/`
**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Tests**: Not requested — no test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create data directory and step persistence helpers

- [x] T001 Create `data/` directory, seed empty `data/steps.json` on startup in `server.js`
- [x] T002 [P] Add `data/` to `.gitignore`
- [x] T003 Add `loadSteps()` and `saveSteps()` helper functions in `server.js`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Express middleware and JSON body parsing required before step routes

- [x] T004 Add `express.json()` middleware to `server.js` (required for POST body parsing)

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 — Record Daily Step Count (Priority: P1) 🎯 MVP

**Goal**: User enters a daily step count for a specific date and saves it persistently.

**Independent Test**: Open dashboard, enter a step count for today, click "Save", refresh, confirm the entry persists in `data/steps.json`.

### Implementation for User Story 1

- [x] T005 [US1] Implement `POST /api/steps` route with validation (non-negative integer, date required) in `server.js`
- [x] T006 [US1] Add step entry form (date picker defaulting to today + numeric input + Save button) in `public/index.html`
- [x] T007 [US1] Add `saveSteps()` JS handler in `public/index.html` to POST to `/api/steps` and show confirmation/error

**Checkpoint**: User can save step entries that persist across restarts

---

## Phase 4: User Story 2 — View Steps for a Date Range (Priority: P2)

**Goal**: User clicks "Steps" button to retrieve saved step entries for the selected date range as JSON.

**Independent Test**: Save steps for 3 dates, select date range covering them, click "Steps", confirm all 3 appear in JSON output.

### Implementation for User Story 2

- [x] T008 [US2] Implement `GET /api/steps` route with `start`/`end` query params and date-range filtering in `server.js`
- [x] T009 [US2] Add "Steps" button to endpoint controls area in `public/index.html`
- [x] T010 [US2] Add `fetchSteps()` JS handler in `public/index.html` to call `GET /api/steps` and display JSON output

**Checkpoint**: User can save and view steps independently

---

## Phase 5: User Story 3 — Include Steps in Fetch All (Priority: P3)

**Goal**: "Fetch All" combined payload includes a `steps` array alongside WHOOP data.

**Independent Test**: Save steps for several dates, click "Fetch All", confirm combined JSON contains a `steps` field.

### Implementation for User Story 3

- [x] T011 [US3] Modify `GET /api/whoop/all` route in `server.js` to include `steps` array in combined payload

**Checkpoint**: All user stories independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validation and final checks

- [x] T012 Run `node --check server.js` syntax validation
- [x] T013 Manual smoke test: save steps, view steps, fetch all — verify end-to-end

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2)
- **User Story 2 (Phase 4)**: Depends on Foundational (Phase 2); reads data written by US1 routes
- **User Story 3 (Phase 5)**: Depends on Foundational (Phase 2); reads step data from helpers created in Setup
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Phase 2 — no dependencies on other stories
- **User Story 2 (P2)**: Can start after Phase 2 — reads same step data, but independent route and button
- **User Story 3 (P3)**: Can start after Phase 2 — modifies existing route, adds step data to payload

### Within Each User Story

- Backend route before frontend handler (route must exist for fetch to succeed)
- Core implementation before integration

### Parallel Opportunities

- T001 and T002 can run in parallel (different files)
- T006, T007 are frontend-only and can be written in parallel with T005 (different files)
- T009, T010 are frontend-only and can be written in parallel with T008 (different files)

---

## Parallel Example: User Story 1

```bash
# Backend and frontend can be developed in parallel for US1:
Task T005: "Implement POST /api/steps route in server.js"
Task T006: "Add step entry form in public/index.html"       # [P] different file
Task T007: "Add saveSteps() JS handler in public/index.html" # depends on T006 (same file)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T003)
2. Complete Phase 2: Foundational (T004)
3. Complete Phase 3: User Story 1 (T005–T007)
4. **STOP and VALIDATE**: Save a step entry, restart server, confirm persistence
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → data infrastructure ready
2. Add User Story 1 → save steps → validate (MVP!)
3. Add User Story 2 → view steps as JSON → validate
4. Add User Story 3 → steps in Fetch All → validate
5. Each story adds value without breaking previous stories
