# Implementation Plan: Scalar API Documentation Landing Page

**Branch**: `005-redocly-api-docs` | **Date**: 2026-02-21 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/005-redocly-api-docs/spec.md`

## Summary

Replace the current landing page (`public/index.html`) with an interactive Scalar API Reference page that loads the project's OpenAPI specification and lets users call any BFF endpoint via a built-in "Try It" panel. The OpenAPI spec will be updated to reflect current routes (post-Feature 004 changes). Scalar is loaded from CDN — no npm dependencies.

## Technical Context

**Language/Version**: Node.js 20 LTS, ESM modules (`"type": "module"`)  
**Primary Dependencies**: Express 5.2.1, dotenv 17.3.1 (existing); @scalar/api-reference CDN bundle (new, no npm install)  
**Storage**: `.env` file for OAuth tokens (unchanged)  
**Testing**: Manual browser testing (no test framework in project)  
**Target Platform**: localhost:3000 (local development)  
**Project Type**: Web — single Express BFF + static frontend  
**Performance Goals**: Docs page loads in < 3 seconds (SC-004)  
**Constraints**: No new npm dependencies (Scalar loaded from CDN per spec assumptions); no build step  
**Scale/Scope**: Single-user demo app, 6 server routes, 1 HTML page

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. OAuth2 Authorization Code Flow | **PASS** | OAuth routes (`/auth/whoop`, `/callback`) unchanged (FR-007, FR-008). `.env` continues to hold secrets. |
| II. Docs as Code | **PASS** | The OpenAPI spec IS the reference documentation, maintained in the repo. Scalar renders it as interactive reference docs — fulfilling the Diataxis "reference" category. |
| III. Simplicity | **PASS** | Replacing a 248-line custom HTML page with a minimal HTML shell + CDN script tag is simpler. No new npm dependencies, no build step, no frameworks added. |
| Architecture: Static frontend | **PASS** | The new `index.html` is a static HTML file with a CDN `<script>` — same pattern as before. |
| Architecture: Backend serves page + OAuth/proxy only | **PASS** | No backend route changes beyond what already exists. `GET /` still serves `index.html`. |
| Architecture: `.env` for secrets | **PASS** | Unchanged. |

**Gate result: PASS** — No violations. Proceeding to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/005-redocly-api-docs/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (updated openapi.yaml)
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
server.js                  # Express BFF — route for GET / unchanged (serves index.html)
public/
├── index.html             # REPLACE: Scalar API Reference page (was hero/dashboard)
├── css/
│   └── styles.css         # CAN DELETE or leave (unused by Scalar)
├── js/                    # Empty directory (was cleaned in Feature 004)
└── openapi.yaml           # NEW: Updated OpenAPI spec served as static asset
```

**Structure Decision**: Same flat structure. The only file change is replacing `public/index.html` content and adding `public/openapi.yaml`. No new directories or project reorganization needed.

## Phase 0: Research (complete)

**Output**: [research.md](research.md)

All unknowns resolved:

| # | Unknown | Decision |
| --- | --- | --- |
| R1 | Scalar CDN integration pattern | Load from `https://cdn.jsdelivr.net/npm/@scalar/api-reference` (unpinned) |
| R2 | Minimal HTML integration | `Scalar.createApiReference('#app', { url, darkMode })` pattern |
| R3 | "Try It" availability | Included in open-source CDN bundle by default — no paid tier needed |
| R4 | Same-origin request behavior | No proxy needed — `fetch` from same origin avoids CORS entirely |
| R5 | Scalar configuration | Minimal: `url`, `darkMode: true`, `theme: 'default'` |

## Phase 1: Design & Contracts (complete)

### Artifacts

- [data-model.md](data-model.md) — Entity reference (no new entities; documents existing schemas)
- [contracts/openapi.yaml](contracts/openapi.yaml) — Updated OpenAPI 3.0.3 spec (v2.0.0) with corrected routes, tags, and response examples
- [quickstart.md](quickstart.md) — Step-by-step implementation guide (4 steps)

### OpenAPI Spec Changes (v1.0.0 → v2.0.0)

| Change | Old | New |
| --- | --- | --- |
| `GET /` | Landing page with redirect | Scalar API Reference docs page |
| `/oauth/callback` | Old callback path | `/callback` (corrected) |
| `/dashboard` | Serves dashboard HTML | Redirect to `/` |
| Tags | None | Documentation, Authentication, Recovery |
| Response examples | None | Added for all JSON endpoints |
| Info description | Brief | Includes Getting Started and Authentication sections |

### Agent Context Update

- Ran `update-agent-context.sh copilot` — updated `.github/agents/copilot-instructions.md`
- Added: Node.js 20 LTS, Express 5.2.1, @scalar/api-reference CDN, `.env` storage

### Constitution Re-check (post-design)

| Principle | Status | Notes |
| --- | --- | --- |
| I. OAuth2 Authorization Code Flow | **PASS** | No OAuth changes. Tokens stay in `.env`. |
| II. Docs as Code | **PASS** | OpenAPI spec in repo, Scalar renders it as interactive reference. |
| III. Simplicity | **PASS** | ~20 lines of HTML + CDN script. No new dependencies. |
| Architecture: Static frontend | **PASS** | Static HTML file, no framework. |
| Architecture: Backend serves page + OAuth/proxy | **PASS** | No backend changes. |
| Architecture: `.env` for secrets | **PASS** | Unchanged. |

**Gate result: PASS** — Design approved. Ready for Phase 2 (task generation via `/speckit.tasks`).
