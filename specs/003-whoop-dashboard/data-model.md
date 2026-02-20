# Data Model: Whoop Recovery Dashboard

**Date**: 2026-02-20
**Feature**: `003-whoop-dashboard`

## Entities

### TokenStore

Represents the OAuth2 tokens persisted in the `.env` file.

| Field | Type | Description |
| ----- | ---- | ----------- |
| accessToken | string (nullable) | Current Whoop API access token |
| refreshToken | string (nullable) | Current Whoop API refresh token (single-use, rotates on refresh) |
| tokenExpiresAt | integer (nullable) | Unix timestamp (seconds) when access token expires |

**Storage**: `.env` file variables `WHOOP_ACCESS_TOKEN`, `WHOOP_REFRESH_TOKEN`, `WHOOP_TOKEN_EXPIRES_AT`

**Lifecycle**:

- Written after successful OAuth callback (initial authorization)
- Updated after every token refresh (both access and refresh tokens rotate)
- Cleared conceptually when refresh token expires and refresh fails (values become stale; user must re-authorize)

**Validation Rules**:

- `accessToken` must be non-empty to make API calls
- `refreshToken` must be non-empty to perform silent re-authentication
- `tokenExpiresAt` must be a positive Unix timestamp

---

### AppConfig

Represents the static configuration loaded from `.env` at startup.

| Field | Type | Description |
| ----- | ---- | ----------- |
| clientId | string (required) | Whoop API client ID |
| clientSecret | string (required) | Whoop API client secret |
| redirectUri | string (required) | OAuth callback URL (e.g., `http://localhost:3000/oauth/callback`) |
| port | integer (default: 3000) | Server listen port |

**Storage**: `.env` file variables `WHOOP_CLIENT_ID`, `WHOOP_CLIENT_SECRET`, `WHOOP_REDIRECT_URI`, `PORT`

**Validation Rules**:

- `clientId` and `clientSecret` must be present and non-empty at startup; fail fast with clear error if missing
- `redirectUri` must be a valid URL

---

### RecoveryData

Represents the health metrics retrieved from the Whoop API for one recovery cycle.

| Field | Type | Description |
| ----- | ---- | ----------- |
| cycleId | integer | Whoop cycle identifier |
| scoreState | enum: SCORED, PENDING_SCORE, UNSCORABLE | Whether the recovery has been scored |
| recoveryScore | float (nullable) | Recovery percentage (0–100); null when not SCORED |
| hrvRmssdMilli | float (nullable) | Heart rate variability in milliseconds; null when not SCORED |
| restingHeartRate | float (nullable) | Resting heart rate in bpm; null when not SCORED |
| createdAt | ISO 8601 datetime | When the recovery record was created |

**Source**: Whoop API `GET /developer/v2/recovery?limit=1`

**State Transitions**:

```text
PENDING_SCORE → SCORED       (normal: sleep scored)
PENDING_SCORE → UNSCORABLE   (abnormal: insufficient data)
```

When `scoreState` is not `SCORED`, the `recoveryScore`, `hrvRmssdMilli`, and `restingHeartRate` fields are null. The UI must show a "data not yet available" state.

---

## Relationships

```text
AppConfig (static, loaded once at startup)
    │
    └── used by OAuth flow to build authorization URL and exchange tokens
            │
            ▼
TokenStore (mutable, persisted in .env)
    │
    └── used to authenticate Whoop API calls
            │
            ▼
RecoveryData (read-only, fetched from Whoop API per request)
```

## `.env` File Schema

```env
# Static configuration (set by user, never modified by app)
WHOOP_CLIENT_ID=your_client_id_here
WHOOP_CLIENT_SECRET=your_client_secret_here
WHOOP_REDIRECT_URI=http://localhost:3000/oauth/callback
PORT=3000

# Dynamic tokens (managed by app, written after OAuth flow)
WHOOP_ACCESS_TOKEN=
WHOOP_REFRESH_TOKEN=
WHOOP_TOKEN_EXPIRES_AT=
```
