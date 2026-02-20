# Tasks: Whoop Recovery Dashboard

**Input**: Design documents from `/specs/003-whoop-dashboard/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/openapi.yaml, quickstart.md

**Tests**: Not requested in the feature specification — test tasks are omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, dependency installation, and configuration files

- [ ] T001 Initialize Node.js project with `npm init` and create package.json with `"type": "module"` for ESM support
- [ ] T002 Install production dependencies: `express` and `dotenv` via npm
- [ ] T003 [P] Create `.env.example` with placeholder keys (`WHOOP_CLIENT_ID`, `WHOOP_CLIENT_SECRET`, `WHOOP_REDIRECT_URI`, `PORT`, `WHOOP_ACCESS_TOKEN`, `WHOOP_REFRESH_TOKEN`, `WHOOP_TOKEN_EXPIRES_AT`) and inline comments at repository root
- [ ] T004 [P] Verify `.env` is listed in `.gitignore` at repository root
- [ ] T005 [P] Create directory structure: `public/`, `public/css/`, `public/js/` at repository root

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core server setup and token management that ALL user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete

- [ ] T006 Create Express server entry point with dotenv config loading, static file serving from `public/`, startup validation (check `WHOOP_CLIENT_ID` and `WHOOP_CLIENT_SECRET` are non-empty; log clear error and exit with non-zero code if missing), and `npm start` script in server.js and package.json
- [ ] T007 Implement `.env` token read/write utility — functions to read current tokens from `process.env`, and atomically write updated tokens back to the `.env` file (read file, update token variables, write to temp file, rename) in server.js
- [ ] T008 Implement token refresh function — call `POST https://api.prod.whoop.com/oauth/oauth2/token` with `grant_type=refresh_token`, persist new access + refresh tokens to `.env` via the write utility, include mutex to prevent concurrent refreshes (refresh tokens are single-use), in server.js
- [ ] T009 Implement `isAuthenticated()` helper — check if `WHOOP_REFRESH_TOKEN` is present and attempt token refresh if access token is expired (with 60s buffer), return boolean, in server.js

**Checkpoint**: Foundation ready — server starts, loads config, can read/write tokens, can refresh tokens

---

## Phase 3: User Story 1 — Connect to Whoop (Priority: P1) MVP

**Goal**: User can click "Connect to Whoop" on the landing page, authorize with Whoop, and be redirected to the dashboard. Returning users with a valid refresh token skip the login flow. Callback errors redirect to landing page with cause-specific messages visible via JS + `<noscript>` fallback.

**Independent Test**: Visit `http://localhost:3000`, click "Connect to Whoop", complete OAuth on Whoop's site, confirm redirect to `/dashboard`. Restart server, revisit — confirm auto-redirect to `/dashboard` without re-login. Deny access on Whoop — confirm redirect to landing page with cause-specific error message visible even with JS disabled.

### Implementation for User Story 1

- [ ] T010 [US1] Implement `GET /auth/whoop` route — generate random state (16 bytes hex), store in module-level variable, redirect to `https://api.prod.whoop.com/oauth/oauth2/auth` with `client_id`, `redirect_uri`, `response_type=code`, `scope=read:recovery offline`, `state` in server.js
- [ ] T011 [US1] Implement `GET /oauth/callback` route — validate `state` parameter, check for `error` query param (denied access → redirect to `/?error=access_denied`), exchange authorization `code` for tokens via `POST https://api.prod.whoop.com/oauth/oauth2/token`, persist tokens to `.env` (overwrites any existing tokens — single-user per FR-014), redirect to `/dashboard` on success, redirect to `/?error=auth_failed` on token exchange failure, redirect to `/?error=invalid_state` on state mismatch, in server.js
- [ ] T012 [US1] Implement `GET /` route — if `isAuthenticated()` returns true, redirect to `/dashboard`; otherwise serve `public/index.html` in server.js
- [ ] T013 [US1] Implement `GET /dashboard` route — if not authenticated, redirect to `/`; otherwise serve `public/dashboard.html` in server.js
- [ ] T014 [US1] Implement `GET /api/status` route — return `{ "authenticated": true/false }` JSON per contracts/openapi.yaml StatusResponse schema in server.js
- [ ] T015 [P] [US1] Create landing page with modern dark-themed design, full-viewport hero section, app title/tagline, prominent "Connect to Whoop" button linking to `/auth/whoop`, JS-powered `?error=` message display with cause-specific messages (access_denied, auth_failed, invalid_state), and a `<noscript>` fallback block displaying a generic error message visible when JS is disabled, per FR-005 and FR-012, in public/index.html
- [ ] T016 [P] [US1] Create shared CSS with custom properties (dark background, accent colors, system font stack), landing page hero styles, button hover animation, responsive layout, error banner styles, and `<noscript>` error fallback styles in public/css/styles.css

**Checkpoint**: Full OAuth login flow works end-to-end. Landing page displays. Returning users auto-redirect to dashboard. Denied access shows cause-specific error on landing page, visible with or without JavaScript.

---

## Phase 4: User Story 2 — View Recovery Metrics (Priority: P2)

**Goal**: Authenticated user sees their latest recovery score, HRV, and resting heart rate displayed on the dashboard with clear labels and units.

**Independent Test**: After logging in, visit `/dashboard` and verify three metric cards display with correct values matching the Whoop app. Check that recovery score is color-coded (green/yellow/red).

### Implementation for User Story 2

- [ ] T017 [US2] Implement `GET /api/recovery` route — refresh access token if expired, fetch `GET https://api.prod.whoop.com/developer/v2/recovery?limit=1` with Bearer token, normalize response to `RecoveryResponse` schema (scoreState, recoveryScore, hrvRmssdMilli, restingHeartRate, createdAt), handle `score_state` values (`PENDING_SCORE`/`UNSCORABLE` → null fields), return JSON in server.js
- [ ] T018 [P] [US2] Create dashboard HTML page with header (app name), three metric card containers (recovery score, HRV, resting heart rate), loading spinner placeholder, error message container, and "no data" message container in public/dashboard.html
- [ ] T019 [P] [US2] Add dashboard-specific CSS — metric card grid layout (3 columns, responsive to single column on mobile), recovery score color-coding (green 67–100, yellow 34–66, red 0–33), card hover transitions, loading spinner animation, typography for metric values and labels in public/css/styles.css
- [ ] T020 [US2] Implement client-side dashboard logic — on page load call `GET /api/recovery`, render metric cards with values and units (recovery score %, HRV ms, resting heart rate bpm), handle `PENDING_SCORE`/`UNSCORABLE` with "data not yet available" message, handle partial data (show available metrics, "data not available" for missing ones) in public/js/dashboard.js

**Checkpoint**: Dashboard displays all three recovery metrics with correct values, units, and color-coding. Handles no-data and partial-data states gracefully.

---

## Phase 5: User Story 3 — Graceful Error Handling (Priority: P3)

**Goal**: When errors occur (API unreachable, expired refresh token, unauthenticated access), the app shows cause-specific, user-friendly messages and provides clear next steps.

**Independent Test**: Stop the server's internet connection and reload the dashboard — verify a friendly error message with a retry button appears. Delete the refresh token from `.env` and restart — verify redirect to landing page. Navigate directly to `/dashboard` in a new browser — verify redirect to landing page.

### Implementation for User Story 3

- [ ] T021 [US3] Add error response handling to `GET /api/recovery` route — return `{ error: "whoop_api_error", message: "Could not retrieve recovery data from Whoop. Please try again later." }` with status 502 when Whoop API is unreachable, return `{ error: "auth_expired", message: "Your session has expired. Please reconnect to Whoop." }` with status 401 when refresh token fails, per contracts/openapi.yaml ErrorResponse schema in server.js
- [ ] T022 [US3] Add error handling to `GET /oauth/callback` — handle invalid/tampered authorization codes (token exchange fails → redirect to `/?error=auth_failed`), handle network errors during token exchange (redirect to `/?error=auth_failed`), in server.js
- [ ] T023 [US3] Implement client-side error handling in dashboard — display cause-specific error message with retry button on API errors (502), redirect to `/` on auth errors (401), show appropriate messages for each error type in public/js/dashboard.js

**Checkpoint**: All error states display cause-specific, human-readable messages. Retry button works for transient errors. Expired sessions redirect to landing page. Startup fails clearly when config is missing.

---

## Phase 6: Alignment & Polish

**Purpose**: Fix spec/contract/implementation misalignments identified during clarification, and final quality improvements

- [ ] T024 [P] Remove stale `400` response from `/oauth/callback` in contracts/openapi.yaml — the server always returns 302 redirects per FR-005; update description to document `?error=` redirect behavior
- [ ] T025 [P] Add `?error=` query parameter documentation to `GET /` route in contracts/openapi.yaml — document that the landing page accepts `error` query param with values `access_denied`, `auth_failed`, `invalid_state`
- [ ] T026 Run quickstart.md validation — follow quickstart.md steps from scratch on a clean checkout in a fresh terminal to confirm accuracy
- [ ] T027 [P] Create `docs/` directory with Diataxis subdirectories (`docs/tutorials/`, `docs/how-to/`, `docs/reference/`, `docs/explanation/`) and a placeholder README in each using Good Docs Project templates, per constitution Documentation Standards

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational — delivers MVP
- **User Story 2 (Phase 4)**: Depends on Foundational and US1 routes (`/dashboard`, `/api/status`)
- **User Story 3 (Phase 5)**: Depends on Foundational; enhances US1 and US2 routes with error paths
- **Alignment & Polish (Phase 6)**: Depends on all user stories being complete

### Within Each User Story

- Server routes before frontend pages that consume them
- HTML structure before CSS and JS that depend on it
- Core implementation before error handling enhancements
- Commit after each task or logical group

### Parallel Opportunities

**Phase 1**: T003, T004, T005 can all run in parallel (different files)

**Phase 3 (US1)**: T015 and T016 can run in parallel with each other (different files), but should follow T010–T014 (routes they depend on)

**Phase 4 (US2)**: T018 and T019 can run in parallel (HTML and CSS are different files)

**Phase 6**: T024, T025, and T027 can run in parallel (different files)

---

## Parallel Example: User Story 1

```text
# Sequential: Server routes first
T010 → T011 → T012 → T013 → T014

# Then parallel: Frontend assets (no server dependencies between them)
T015 + T016 (parallel — different files: index.html and styles.css)
```

## Parallel Example: User Story 2

```text
# Parallel: HTML and CSS can be built simultaneously
T018 + T019 (parallel — different files: dashboard.html and styles.css)

# Sequential: Route must exist before JS consumes it; JS needs HTML structure
T017 → T020
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T005)
2. Complete Phase 2: Foundational (T006–T009)
3. Complete Phase 3: User Story 1 (T010–T016)
4. **STOP and VALIDATE**: Full OAuth flow works; landing page renders; returning users auto-redirect; error messages visible with and without JS
5. Deploy/demo if ready — this is a working MVP

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → **MVP!** (working login + landing page)
3. Add User Story 2 → Test independently → **Recovery data visible** (core value)
4. Add User Story 3 → Test independently → **Production-quality error handling**
5. Alignment & Polish → Contract fixes + docs + quickstart validation
6. Each story adds value without breaking previous stories

---

## Notes

- Total tasks: **27**
- [P] tasks = different files, no dependencies on other tasks in the same batch
- [Story] label maps each task to its user story for traceability
- No test tasks generated — tests were not requested in the feature specification
- Refresh tokens are single-use (rotate on refresh) — T008 must implement a mutex
- The `.env` write in T007 must be atomic (temp file + rename) per research.md
- All Whoop API calls go through the BFF (server.js) — the frontend never calls Whoop directly
- T024–T025 fix alignment gaps between OpenAPI contract and server behavior identified during clarification
- T015 must include `<noscript>` fallback per FR-005/FR-012 clarification
