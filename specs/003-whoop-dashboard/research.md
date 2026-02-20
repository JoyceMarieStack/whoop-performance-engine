# Research: Whoop Recovery Dashboard

**Date**: 2026-02-20
**Feature**: `003-whoop-dashboard`

## 1. Whoop OAuth2 Authorization Code Flow

### Decision

Use Whoop's OAuth2 Authorization Code Flow with the `offline` scope to obtain a refresh token.

### Rationale

The Whoop API mandates OAuth2 Authorization Code Flow for web apps. The `offline` scope is required to receive a refresh token — without it, the user must re-authorize every time the access token expires (1 hour). Since the spec requires persistent login across server restarts, `offline` is essential.

### Endpoints

| Purpose | Method | URL |
| ------- | ------ | --- |
| Authorization | GET | `https://api.prod.whoop.com/oauth/oauth2/auth` |
| Token Exchange | POST | `https://api.prod.whoop.com/oauth/oauth2/token` |
| Token Refresh | POST | `https://api.prod.whoop.com/oauth/oauth2/token` (grant_type=refresh_token) |

### Required Scopes

- `read:recovery` — access recovery score, HRV, resting heart rate
- `offline` — receive and use refresh tokens

### Authorization URL Parameters

- `client_id` — from `.env`
- `redirect_uri` — registered callback URL (e.g., `http://localhost:3000/oauth/callback`)
- `response_type=code`
- `scope=read:recovery offline`
- `state` — CSRF token (minimum 8 characters per Whoop docs)

### Token Exchange Request (POST)

```
grant_type=authorization_code
code=<authorization_code>
redirect_uri=<callback_url>
client_id=<from .env>
client_secret=<from .env>
```

### Token Refresh Request (POST)

```
grant_type=refresh_token
refresh_token=<stored_refresh_token>
client_id=<from .env>
client_secret=<from .env>
scope=offline
```

### Alternatives Considered

- **Implicit Flow**: Does not provide refresh tokens; user must re-authorize every hour. Rejected.
- **Client Credentials Flow**: Not applicable — Whoop requires user authorization for personal data. Rejected.

---

## 2. Whoop Recovery Data API

### Decision

Use `GET /developer/v2/recovery` (collection endpoint) with `limit=1` to fetch the most recent recovery record.

### Rationale

The collection endpoint returns records sorted by sleep start time descending. Fetching with `limit=1` gives us the latest recovery in a single call without needing to know the cycle ID. This is simpler than tracking cycle IDs.

### Endpoint

```
GET https://api.prod.whoop.com/developer/v2/recovery?limit=1
Authorization: Bearer <access_token>
```

### Response Structure

```json
{
  "records": [
    {
      "cycle_id": 93845,
      "sleep_id": "123e4567-e89b-12d3-a456-426614174000",
      "user_id": 10129,
      "created_at": "2022-04-24T11:25:44.774Z",
      "updated_at": "2022-04-24T14:25:44.774Z",
      "score_state": "SCORED",
      "score": {
        "user_calibrating": false,
        "recovery_score": 44,
        "resting_heart_rate": 64,
        "hrv_rmssd_milli": 31.813562,
        "spo2_percentage": 95.6875,
        "skin_temp_celsius": 33.7
      }
    }
  ],
  "next_token": null
}
```

### Key Fields Mapped to Spec Requirements

| Spec Metric | API Field | Unit |
| ----------- | --------- | ---- |
| Recovery Score | `score.recovery_score` | percentage (0–100) |
| HRV | `score.hrv_rmssd_milli` | milliseconds |
| Resting Heart Rate | `score.resting_heart_rate` | bpm |

### Edge Case: `score_state` Values

- `SCORED` — normal; `score` object is present
- `PENDING_SCORE` — sleep not yet scored; `score` is absent
- `UNSCORABLE` — could not be scored; `score` is absent

When `score_state` is not `SCORED`, display a "recovery data not yet available" message per spec edge case requirements.

### Alternatives Considered

- **Cycle-specific endpoint** (`/v2/cycle/{cycleId}/recovery`): Requires knowing the cycle ID first, adding an extra API call. Rejected for simplicity.
- **Fetching multiple records**: Unnecessary — spec only requires the latest recovery. Rejected.

---

## 3. Token Lifecycle & Persistence

### Decision

Persist the refresh token (and access token) in the `.env` file. On startup, attempt to use the stored refresh token to obtain a fresh access token. Refresh tokens are single-use and rotate on each refresh.

### Rationale

Per user clarification: tokens must survive server restarts; no database or keystore. The `.env` file is the only persistence mechanism available. Since Whoop refresh tokens are single-use (each refresh returns a new refresh token), the `.env` file must be updated atomically after every token refresh.

### Token Expiry

| Token | Lifetime |
| ----- | -------- |
| Access Token | 3600 seconds (1 hour) |
| Refresh Token | Long-lived but single-use; rotates on each refresh |

### `.env` Token Variables

```
WHOOP_ACCESS_TOKEN=<current_access_token>
WHOOP_REFRESH_TOKEN=<current_refresh_token>
WHOOP_TOKEN_EXPIRES_AT=<unix_timestamp>
```

### Refresh Strategy

1. On app startup: read `WHOOP_REFRESH_TOKEN` from `.env`
2. If present and valid → call token refresh endpoint → get new access + refresh tokens → write both back to `.env`
3. If absent or refresh fails (401) → require fresh OAuth authorization (show landing page with "Connect to Whoop")
4. During runtime: before each API call, check `WHOOP_TOKEN_EXPIRES_AT`; if expired, refresh first
5. **Critical**: Never attempt concurrent refreshes — refresh tokens are single-use. Use a mutex/lock pattern.

### `.env` Write Strategy

- Read the current `.env` file contents
- Parse and update only the token-related variables
- Write the full file back atomically (write to temp file, then rename)
- If write fails: log warning, continue with current in-memory tokens; user will need to re-authorize on next restart (per spec edge case)

### Alternatives Considered

- **In-memory only**: Tokens lost on restart; user must re-authorize every time. Rejected per user clarification.
- **SQLite/database**: Adds complexity and violates "no backend database" constraint. Rejected.
- **Encrypted file**: Adds complexity without meaningful security benefit for a localhost single-user app. Rejected per Simplicity principle.

---

## 4. Express Server Architecture

### Decision

Single `server.js` entry point using Express. Serves static files from `public/` and exposes ~6 routes.

### Rationale

Express is the standard minimal Node.js HTTP framework. It satisfies the constitution's "lightweight server-side component (BFF)" requirement. No framework beyond Express is needed.

### Route Map

| Method | Path | Purpose |
| ------ | ---- | ------- |
| GET | `/` | Serve landing page (`public/index.html`) or redirect to `/dashboard` if authenticated |
| GET | `/auth/whoop` | Redirect to Whoop authorization URL |
| GET | `/oauth/callback` | Handle Whoop callback, exchange code for tokens, persist to `.env`, redirect to `/dashboard` |
| GET | `/dashboard` | Serve dashboard page (`public/dashboard.html`) or redirect to `/` if not authenticated |
| GET | `/api/recovery` | Proxy: fetch latest recovery from Whoop API, return JSON to frontend |
| GET | `/api/status` | Return authentication status (authenticated or not, no sensitive data) |

### Middleware

- `express.static('public')` for serving HTML/CSS/JS (but explicit routes override for `/` and `/dashboard` to handle auth redirects)
- `dotenv/config` to load `.env` on startup

### Alternatives Considered

- **Fastify**: Slightly faster but more boilerplate; Express is more commonly known and sufficient. Rejected for simplicity.
- **No framework (raw `http`)**: More code for routing, static file serving; no benefit. Rejected.
- **Next.js / Nuxt**: Full framework; violates Simplicity principle. Rejected.

---

## 5. Frontend Design Approach

### Decision

Static HTML/CSS/JS with a modern, dark-themed design using CSS custom properties and minimal animations. No framework.

### Rationale

Constitution mandates static HTML/CSS/JS unless a framework is explicitly justified. The app has exactly 2 pages and minimal interactivity (one button on landing, three metric cards on dashboard). A framework would be unjustified overhead.

### Design Tokens (CSS Custom Properties)

- Dark background with accent colors for metric cards
- Clean sans-serif typography (system font stack)
- Recovery score color-coded: green (67–100), yellow (34–66), red (0–33)
- Responsive layout using CSS Grid or Flexbox
- Subtle transitions on card hover/load

### Landing Page

- Full-viewport hero section
- App title / tagline
- Single prominent "Connect to Whoop" button with hover animation
- Minimal footer or none

### Dashboard Page

- Header with app name
- Three metric cards in a row (responsive to column on mobile):
  - Recovery Score (percentage, color-coded)
  - HRV (milliseconds)
  - Resting Heart Rate (bpm)
- Loading state (spinner or skeleton)
- Error state (message + retry button)
- "No data" state (friendly message)

### Alternatives Considered

- **React/Vue/Svelte**: Overhead for 2 static pages; violates constitution. Rejected.
- **Tailwind CSS**: Adds build step; vanilla CSS is sufficient. Rejected for simplicity.
- **CSS framework (Bootstrap)**: Adds weight; custom CSS is cleaner for a minimal app. Rejected.
