# Tasks: Single Page Flow

**Input**: Design documents from `/specs/004-single-page-flow/`
**Prerequisites**: spec.md (user stories and requirements)

**Tests**: Not requested in the feature specification — test tasks are omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: User Story 1 — Single-Page Recovery View (Priority: P1) MVP

**Goal**: After OAuth login, the user is redirected back to `/` (not `/dashboard`) and sees their recovery metrics on the landing page. Authenticated returning users see metrics immediately on `/`.

**Independent Test**: Click "Connect to Whoop", authorize, confirm browser returns to `http://localhost:3000/` with recovery metrics visible. Restart server, revisit — confirm metrics appear on `/` without re-login. URL never shows `/dashboard`.

### Implementation for User Story 1

- [X] T001 [US1] Change the OAuth callback success redirect from `/dashboard` to `/` in server.js (line ~280, `res.redirect('/dashboard')` → `res.redirect('/')`)
- [X] T002 [US1] Change `GET /` route to always serve `index.html` (remove the `isAuthenticated()` redirect to `/dashboard`) in server.js — the page itself will determine what to show client-side
- [X] T003 [US1] Merge dashboard markup into the landing page — add metric cards (recovery score, HRV, resting heart rate), loading spinner, error container, and no-data container from public/dashboard.html into public/index.html, hidden by default with `style="display:none"`
- [X] T004 [US1] Add client-side auth check and state rendering — on page load, call `GET /api/status`; if authenticated, hide the hero section and show the loading state, then call `GET /api/recovery` and render metrics; if unauthenticated, show the hero section with the "Connect to Whoop" button, in a new `<script>` block or inline JS in public/index.html

**Checkpoint**: Full OAuth flow redirects to `/`. Landing page shows metrics when authenticated, hero when not. URL never changes to `/dashboard`.

---

## Phase 2: User Story 2 — State Transitions on Single Page (Priority: P2)

**Goal**: The single page gracefully handles all intermediate states — loading, error, no-data, and expired session — inline without page navigation.

**Independent Test**: While authenticated: (1) verify loading spinner appears briefly, (2) verify metrics render, (3) simulate API error (stop server internet) and verify error + retry button appear inline, (4) verify no-data message for unscored recovery.

### Implementation for User Story 2

- [X] T005 [US2] Implement loading state — show spinner and "Loading your recovery data…" message while `GET /api/recovery` is in flight, hide hero and metric cards during loading, in public/index.html
- [X] T006 [US2] Implement error state with retry — on API error (502), display cause-specific error message and a "Retry" button that re-calls `GET /api/recovery`; on auth error (401), revert to the unauthenticated hero state with a message prompting re-authorization, in public/index.html
- [X] T007 [US2] Implement no-data state — when `scoreState` is `PENDING_SCORE` or `UNSCORABLE`, display "No Recovery Data Yet" message inline, replacing the metric cards area, in public/index.html

**Checkpoint**: All four page states (unauthenticated, loading, authenticated/metrics, error/no-data) work correctly without navigation.

---

## Phase 3: User Story 3 — Remove Dashboard Page (Priority: P3)

**Goal**: The separate dashboard page and route are removed. `/dashboard` redirects to `/` for backwards compatibility.

**Independent Test**: Navigate to `/dashboard` — confirm 302 redirect to `/`. Confirm `public/dashboard.html` and `public/js/dashboard.js` no longer exist.

### Implementation for User Story 3

- [X] T008 [US3] Change `GET /dashboard` route in server.js from serving `dashboard.html` to a simple `res.redirect('/')` (unconditional redirect for backwards compatibility)
- [X] T009 [P] [US3] Delete public/dashboard.html
- [X] T010 [P] [US3] Delete public/js/dashboard.js

**Checkpoint**: `/dashboard` redirects to `/`. No dashboard files remain in `public/`. Codebase cleanup complete.

---

## Dependencies & Execution Order

### Phase Dependencies

- **User Story 1 (Phase 1)**: No dependencies — can start immediately. Delivers MVP.
- **User Story 2 (Phase 2)**: Depends on US1 (T003 and T004 create the HTML structure that US2 enhances). US2 refines the client-side state management.
- **User Story 3 (Phase 3)**: Depends on US1 (callback no longer redirects to `/dashboard`). Can run in parallel with US2.

### Within Each User Story

- Server route changes (T001, T002) before frontend changes (T003, T004)
- HTML structure (T003) before client-side logic (T004)
- T009 and T010 are independent file deletions — can run in parallel

### Parallel Opportunities

**Phase 3 (US3)**: T009 and T010 can run in parallel (independent file deletions)

**Cross-phase**: US3 (Phase 3) can run in parallel with US2 (Phase 2) once US1 is complete

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: US1 (T001–T004)
2. **STOP and VALIDATE**: OAuth flow redirects to `/`, metrics display on landing page, hero shows for unauthenticated users
3. This is a working MVP — the core flow change is done

### Incremental Delivery

1. US1 → Test independently → **MVP!** (single-page flow works)
2. US2 → Test independently → **Polished states** (loading, error, no-data handled gracefully)
3. US3 → Test independently → **Clean codebase** (dead code removed, backwards-compatible redirect)

---

## Notes

- Total tasks: **10**
- No setup/foundational phase needed — this feature modifies an existing working app
- Backend API routes (`GET /api/recovery`, `GET /api/status`) are unchanged
- The CSS in `public/css/styles.css` already contains all needed styles (metric cards, loading spinner, error states) — no CSS changes required
- The client-side JS logic from `public/js/dashboard.js` (fetch, render, error handling) is moved into `public/index.html` inline or adapted in-place
- T003 moves HTML from `dashboard.html` into `index.html`; T004 moves logic from `dashboard.js` into `index.html`
- T009/T010 delete the now-redundant dashboard files after the logic has been migrated
