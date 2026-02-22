# Implementation Plan: WHOOP Sleep Web App

**Branch**: `007-whoop-sleep-app` | **Date**: 2026-02-22 | **Spec**: `/specs/007-whoop-sleep-app/spec.md`
**Input**: Feature specification from `/specs/007-whoop-sleep-app/spec.md`

## Summary

Build a simple frontend dashboard and the backend proxy routes needed to interact with all five WHOOP API endpoints (body, recovery, sleep, cycle, workout) plus an aggregate "Fetch All" route. The frontend is a single static HTML page with date-range controls, per-endpoint fetch buttons, a "Fetch All" button, a JSON display area, and a copy-to-clipboard action. The backend extends the existing Express server with proxy routes that handle pagination automatically.

## Technical Context

**Language/Version**: JavaScript (Node.js 20+, ES modules)  
**Primary Dependencies**: Express 5, dotenv, built-in `fetch`/Node stdlib  
**Storage**: `.env` file for secrets/token persistence + in-memory token cache (no database)  
**Testing**: Manual browser testing  
**Target Platform**: Local/dev Node server on macOS + browser UI  
**Project Type**: Web application (single Express backend + static frontend)  
**Constraints**: OAuth2 Authorization Code with client secret; static HTML/CSS/JS only; preserve BFF architecture  
**Scale/Scope**: Single-user personal usage

## Constitution Check

- **Gate 1 — OAuth2 Authorization Code Flow**: PASS. All WHOOP API calls are proxied through the Express backend which holds the client secret.
- **Gate 2 — Docs as Code**: PASS. Existing docs structure is maintained.
- **Gate 3 — Simplicity**: PASS. Static HTML/CSS/JS only. No build tools, no frameworks.

## Project Structure

### Source Code (repository root)

```text
server.js              # Express backend — add proxy routes + aggregate route
public/
├── index.html         # Replace Scalar API reference with dashboard UI
└── openapi.yaml       # Unchanged
```
