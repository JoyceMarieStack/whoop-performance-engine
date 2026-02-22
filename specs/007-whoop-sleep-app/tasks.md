# Tasks: WHOOP Sleep Web App

**Input**: Design documents from `/specs/007-whoop-sleep-app/`
**Prerequisites**: plan.md (required), spec.md (required)

## Phase 1: Setup

- [x] T001 Update OAuth scope request to include all required WHOOP read scopes in `server.js`

## Phase 2: Backend Proxy Routes

- [x] T002 Implement shared WHOOP proxy helper with auth, pagination, and error handling in `server.js`
- [x] T003 Implement `GET /api/body` proxy route in `server.js`
- [x] T004 [P] Implement `GET /api/recovery` proxy route with date-range support in `server.js`
- [x] T005 [P] Implement `GET /api/sleep` proxy route with date-range support in `server.js`
- [x] T006 [P] Implement `GET /api/cycle` proxy route with date-range support in `server.js`
- [x] T007 [P] Implement `GET /api/workout` proxy route with date-range support in `server.js`
- [x] T008 Implement `GET /api/whoop/all` aggregate route in `server.js`

> **Note**: T002 `buildWhoopUrl` had a critical URL construction bug (F1) fixed post-implementation.
> `new URL(path, WHOOP_BASE)` was stripping `/developer` from the base URL. Fixed to use string concatenation.

## Phase 3: Frontend Dashboard

- [x] T009 Replace `public/index.html` with dashboard UI (date controls, endpoint buttons, JSON display, copy button)

## Phase 4: Polish

- [x] T010 Verify .gitignore and .env.example are complete
