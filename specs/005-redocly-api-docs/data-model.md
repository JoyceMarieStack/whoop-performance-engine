# Data Model: Scalar API Documentation Landing Page

**Feature**: 005-redocly-api-docs | **Date**: 2026-02-21

## Overview

Feature 005 introduces no new data entities. The existing schemas from Feature 003 are preserved unchanged. This document records the unchanged entities for completeness and notes the one new static asset.

## Entities

### RecoveryResponse (unchanged)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| scoreState | string (enum: SCORED, PENDING_SCORE, UNSCORABLE) | yes | Whether the recovery has been scored |
| recoveryScore | number, nullable | no | Recovery percentage (0-100) |
| hrvRmssdMilli | number, nullable | no | HRV RMSSD in milliseconds |
| restingHeartRate | number, nullable | no | Resting heart rate in BPM |
| createdAt | string (date-time), nullable | no | When the record was created |

### StatusResponse (unchanged)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| authenticated | boolean | yes | Whether valid tokens are present |

### ErrorResponse (unchanged)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| error | string | yes | Machine-readable error code |
| message | string | yes | Human-readable error message |

## Static Assets

### OpenAPI Specification (`public/openapi.yaml`)

- **New file**: Updated copy of the OpenAPI spec from Feature 003, corrected for current routes.
- **Served at**: `/openapi.yaml` (via Express static middleware).
- **Consumed by**: Scalar API Reference on the landing page.
- **Source of truth**: `public/openapi.yaml` in the repo root. The copy in `specs/005-redocly-api-docs/contracts/openapi.yaml` is the planning artifact.

## State Transitions

No state transitions are introduced. The OAuth flow state machine is unchanged.

## Validation Rules

No new validation rules. The OpenAPI spec defines response schemas that Scalar displays — but validation is handled by Express route handlers (unchanged).

## Relationships

```
Scalar Docs Page (index.html)
  └── fetches → /openapi.yaml (static file)
        └── describes → BFF API routes
              ├── GET /api/recovery → RecoveryResponse | ErrorResponse
              ├── GET /api/status → StatusResponse
              ├── GET /auth/whoop → 302 redirect
              └── GET /callback → 302 redirect
```
