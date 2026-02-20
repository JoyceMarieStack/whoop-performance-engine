# Implementation Plan: Whoop Recovery Dashboard

**Branch**: `003-whoop-dashboard` | **Date**: 2026-02-20 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/003-whoop-dashboard/spec.md`

## Summary

Build a single-user Node.js web app that authenticates with the Whoop API via OAuth2 Authorization Code Flow and displays the user's latest recovery score, HRV, and resting heart rate on a sleek dashboard. The backend-for-frontend (BFF) server holds the client secret, manages the OAuth flow, persists the refresh token in `.env`, and proxies Whoop API calls. The frontend is static HTML/CSS/JS served by the same Node process — no frontend framework.

## Technical Context

**Language/Version**: Node.js 20 LTS (JavaScript, ESM modules)
**Primary Dependencies**: Express (HTTP server + routing), dotenv (`.env` loading)
**Storage**: `.env` file only — refresh token and access token persisted to disk; no database
**Testing**: Node built-in test runner (`node --test`) + supertest for HTTP integration tests
**Target Platform**: localhost development server (macOS/Linux)
**Project Type**: Web application (BFF + static frontend)
**Performance Goals**: Landing page loads in < 3 seconds; dashboard renders recovery data within 2 seconds of page load
**Constraints**: Single-user only; no backend database; tokens in `.env`; static HTML/CSS/JS frontend
**Scale/Scope**: 2 pages (landing + dashboard), 1 Whoop account, ~6 server routes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
| --------- | ------ | ----- |
| I. OAuth2 Authorization Code Flow (NON-NEGOTIABLE) | PASS | FR-002 mandates Authorization Code Flow; client secret kept server-side in Express BFF; `.env` holds `WHOOP_CLIENT_ID`, `WHOOP_CLIENT_SECRET`; `.env` listed in `.gitignore`; `.env.example` committed with placeholders |
| II. Docs as Code | PASS | Spec + plan live in `specs/003-whoop-dashboard/`; `docs/` directory with Diataxis structure required; Good Docs Project templates used |
| III. Simplicity | PASS | Express server + static HTML/CSS/JS; no frontend framework; no database; minimum routes (~6); YAGNI observed |
| Architecture: BFF pattern | PASS | Single Node process serves static files and proxies OAuth/API calls; client secret never exposed to browser |
| Architecture: Static frontend | PASS | HTML/CSS/JS only; no React, Vue, or similar; constitution requires explicit justification to add a framework |
| Architecture: `.env` for secrets | PASS | All secrets (client ID, client secret, tokens) in `.env`; `.gitignore` includes `.env` |
| Documentation Standards | PASS | `docs/` directory with `tutorials/`, `how-to/`, `reference/`, `explanation/` subdirectories; each doc from Good Docs Project template |

**Gate result: PASS** — No violations. Proceeding to Phase 0.

### Post-Phase 1 Re-Check

All principles re-evaluated after design artifacts (research.md, data-model.md, contracts/, quickstart.md) were produced. **Result: PASS** — no new violations. Specific confirmations:

- OAuth2 Auth Code Flow: research.md documents exact Whoop endpoints; `offline` scope for refresh tokens; OpenAPI contract shows `/auth/whoop` → `/oauth/callback` flow
- Simplicity: flat layout with 1 server file, 2 HTML pages, 1 CSS file, 1 JS file; Express + dotenv as sole dependencies
- `.env` for secrets: data-model.md defines full `.env` schema (static config + dynamic tokens)
- Static frontend: research.md §5 confirms vanilla HTML/CSS/JS with no build step
- BFF pattern: OpenAPI contract shows all Whoop API calls proxied server-side; no direct browser-to-Whoop calls

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
server.js                  # Express app entry point
public/
├── index.html             # Landing page (modern "Connect to Whoop" CTA)
├── dashboard.html         # Recovery dashboard page
├── css/
│   └── styles.css         # Shared styles (modern, minimal aesthetic)
└── js/
    └── dashboard.js       # Client-side fetch for recovery data + rendering

.env                       # Secrets: WHOOP_CLIENT_ID, WHOOP_CLIENT_SECRET, tokens (gitignored)
.env.example               # Placeholder keys (committed)
package.json               # Dependencies: express, dotenv
```

**Structure Decision**: Flat single-project layout. Express serves static files from `public/` and exposes OAuth + API proxy routes. No `src/` or `backend/` folder needed — the app is small enough that `server.js` at root is sufficient. This is the simplest structure that satisfies the constitution's "minimal web page + BFF" constraint.

## Complexity Tracking

No constitution violations detected — this section is intentionally empty.
