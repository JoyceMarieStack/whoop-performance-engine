# Tasks: Scalar API Documentation Landing Page

**Input**: Design documents from `/specs/005-redocly-api-docs/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: Not requested — no test tasks included.

**Organization**: Tasks grouped by user story (US1, US2, US3) per spec.md priorities.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story (US1, US2, US3)
- Exact file paths included in every task description

---

## Phase 1: Setup

**Purpose**: No new project initialization needed — the project already exists with Express, static serving, and all routes. This phase is intentionally empty.

*(No tasks — project structure is already in place from Features 003/004.)*

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create the updated OpenAPI spec as a static asset. This MUST be complete before the Scalar landing page can render anything meaningful.

**⚠️ CRITICAL**: The Scalar page (US1) fetches `/openapi.yaml` — this file must exist first.

- [X] T001 Create updated OpenAPI specification at public/openapi.yaml from specs/005-redocly-api-docs/contracts/openapi.yaml
- [X] T002 [P] Delete unused stylesheet at public/css/styles.css

**Checkpoint**: `public/openapi.yaml` accessible at `http://localhost:3000/openapi.yaml` — verify with `curl http://localhost:3000/openapi.yaml`.

---

## Phase 3: User Story 1 — Interactive API Docs as Landing Page (Priority: P1) 🎯 MVP

**Goal**: Replace the current landing page with an interactive Scalar API Reference that renders all BFF endpoints with "Try It" panels.

**Independent Test**: Start the server (`node server.js`), navigate to `http://localhost:3000/`. Confirm Scalar renders all endpoints (`/api/recovery`, `/api/status`, `/auth/whoop`, `/callback`, `/dashboard`, `/`). Click "Try It" on `/api/status` and verify JSON response `{"authenticated": false}`.

### Implementation for User Story 1

- [X] T003 [US1] Replace public/index.html with Scalar API Reference HTML shell (load @scalar/api-reference from CDN, point to /openapi.yaml, enable dark mode, add noscript fallback)

**Checkpoint**: User Story 1 complete — `http://localhost:3000/` shows Scalar API docs with all endpoints and working "Try It" panels.

---

## Phase 4: User Story 2 — OAuth Authentication via Docs (Priority: P2)

**Goal**: Verify the existing OAuth flow works seamlessly with the new Scalar landing page — users authenticate via `/auth/whoop` and return to the docs page at `/`.

**Independent Test**: From the Scalar docs page, navigate to `/auth/whoop`. Complete OAuth. Confirm redirect back to `/` (Scalar docs). Use "Try It" on `/api/recovery` and verify live recovery data appears.

### Implementation for User Story 2

- [X] T004 [US2] Verify OAuth callback redirect targets `/` in server.js (line ~270 success redirect and line ~260 error redirect) — no code change expected, confirm and document

**Checkpoint**: Full authenticate-then-call workflow works: `/auth/whoop` → Whoop OAuth → `/callback` → `/` (Scalar docs) → "Try It" on `/api/recovery` returns live data.

---

## Phase 5: User Story 3 — Updated OpenAPI Specification (Priority: P3)

**Goal**: Ensure every path in the OpenAPI spec matches the actual server routes — no stale or missing endpoints.

**Independent Test**: Compare every `paths:` entry in `public/openapi.yaml` against route definitions in `server.js`. Verify: `/callback` (not `/oauth/callback`), `/dashboard` described as redirect, `GET /` described as Scalar docs page.

### Implementation for User Story 3

- [X] T005 [US3] Validate public/openapi.yaml paths match server.js routes — run comparison and fix any discrepancies
- [X] T006 [P] [US3] Verify OpenAPI response examples match actual API responses by calling /api/status and /api/recovery via curl and comparing to spec examples

**Checkpoint**: 100% route parity between `public/openapi.yaml` and `server.js`.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Cleanup and final validation.

- [X] T007 [P] Remove empty public/js/ directory (cleaned in Feature 004, no longer needed)
- [X] T008 Run quickstart.md validation — start server, verify all 4 steps from specs/005-redocly-api-docs/quickstart.md pass
- [ ] T009 Commit all changes on branch 005-redocly-api-docs

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Empty — no work needed
- **Foundational (Phase 2)**: No dependencies — can start immediately. BLOCKS User Story 1 (Scalar needs `/openapi.yaml`)
- **User Story 1 (Phase 3)**: Depends on T001 (OpenAPI spec must exist for Scalar to render)
- **User Story 2 (Phase 4)**: Depends on T003 (Scalar page must exist to test OAuth redirect back to docs)
- **User Story 3 (Phase 5)**: Depends on T001 (spec must exist to validate). Can run in parallel with US1/US2
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Foundational (T001). This IS the MVP.
- **User Story 2 (P2)**: Depends on US1 (T003) — needs the Scalar page to verify redirect behavior.
- **User Story 3 (P3)**: Depends on Foundational (T001) — can start after spec is created. Independent of US1/US2.

### Within Each User Story

- US1: Single task (T003) — replace `index.html`
- US2: Single task (T004) — verify existing redirect behavior
- US3: T005 then T006 (validate spec, then verify examples)

### Parallel Opportunities

- T001 and T002 can run in parallel (different files)
- T005 and T006 can run in parallel within US3
- T007 can run in parallel with T008

---

## Parallel Example: Foundational Phase

```text
# Launch together (different files, no dependencies):
Task T001: Create public/openapi.yaml
Task T002: Delete public/css/styles.css
```

## Parallel Example: User Story 3

```text
# Launch together (read-only validation tasks):
Task T005: Validate OpenAPI paths match server.js
Task T006: Verify response examples via curl
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational (T001, T002) — create OpenAPI spec, delete unused CSS
2. Complete Phase 3: User Story 1 (T003) — replace `index.html` with Scalar
3. **STOP and VALIDATE**: Visit `http://localhost:3000/`, confirm Scalar renders, test "Try It"
4. This is a deployable MVP — users can browse and call all API endpoints

### Incremental Delivery

1. T001 + T002 → Foundation ready (OpenAPI spec served)
2. T003 → US1 complete → **MVP deployed** (Scalar docs as landing page)
3. T004 → US2 complete → OAuth-to-docs flow verified
4. T005 + T006 → US3 complete → Spec accuracy confirmed
5. T007 + T008 + T009 → Polish → Feature complete and committed

---

## Notes

- Total tasks: **9**
- This is a small feature — the heavy lifting is in 3 key files: `public/openapi.yaml` (new), `public/index.html` (replace), `public/css/styles.css` (delete)
- No server.js changes required — `GET /` already serves `public/index.html` via static middleware
- No npm dependencies — Scalar loaded from CDN
- Commit after each phase for clean git history
