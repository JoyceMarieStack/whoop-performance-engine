# Feature Specification: Whoop Recovery Dashboard

**Feature Branch**: `003-whoop-dashboard`  
**Created**: 2026-02-20  
**Status**: Draft  
**Input**: User description: "Create a sleek webapp that connects to the Whoop API. The landing page should look modern. It must have a 'connect to whoop' API to login. When the user logins with their Whoop account, the app should redirect to a new page. This page should display the users recovery score, HRV and resting heart rate. The client id and client secret are stored in a .env file. There is no backend database or keystore."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Connect to Whoop (Priority: P1)

A new visitor arrives at the landing page and sees a modern, visually appealing page with a prominent "Connect to Whoop" button. The visitor clicks the button and is redirected to Whoop's login/authorization screen. After authorizing the app with their Whoop credentials, the visitor is redirected back to the application and lands on their personal recovery dashboard.

**Why this priority**: Without authentication there is no access to the Whoop account data. This is the gateway to every other feature; nothing else works until the user can successfully log in.

**Independent Test**: Can be fully tested by clicking "Connect to Whoop", completing login on Whoop's site, and confirming the app redirects to the recovery dashboard. Delivers value by proving the end-to-end login flow works.

**Acceptance Scenarios**:

1. **Given** a visitor on the landing page, **When** they click "Connect to Whoop", **Then** they are redirected to the Whoop authorization screen.
2. **Given** a visitor on the Whoop authorization screen, **When** they approve access, **Then** they are redirected back to the application's recovery dashboard.
3. **Given** a visitor on the Whoop authorization screen, **When** they deny access, **Then** they are redirected back to the landing page with an informative message that access was not granted.
4. **Given** a user whose refresh token is stored in the `.env` file and is still valid, **When** they visit the app, **Then** they are automatically redirected to their recovery dashboard without needing to re-authorize.

---

### User Story 2 - View Recovery Metrics (Priority: P2)

An authenticated user arrives on the recovery dashboard and sees their latest Whoop recovery data displayed in a clean, easy-to-read layout. The dashboard shows three key metrics: recovery score, heart rate variability (HRV), and resting heart rate.

**Why this priority**: Displaying recovery data is the core value proposition of the app. Once authenticated, users need to see their data immediately.

**Independent Test**: Can be fully tested by logging in and verifying that the recovery dashboard displays the correct recovery score, HRV, and resting heart rate values matching the user's Whoop account data.

**Acceptance Scenarios**:

1. **Given** an authenticated user on the recovery dashboard, **When** the page loads, **Then** the user's latest recovery score is displayed.
2. **Given** an authenticated user on the recovery dashboard, **When** the page loads, **Then** the user's latest HRV value is displayed with appropriate units (milliseconds).
3. **Given** an authenticated user on the recovery dashboard, **When** the page loads, **Then** the user's latest resting heart rate is displayed with appropriate units (bpm).
4. **Given** an authenticated user on the recovery dashboard, **When** the Whoop API returns data successfully, **Then** each metric is presented with a clear label and value.

---

### User Story 3 - Graceful Error Handling (Priority: P3)

An authenticated user on the recovery dashboard encounters a situation where data cannot be retrieved (network issue, expired session, Whoop API outage). The app displays a clear, user-friendly error message explaining the issue and suggesting next steps.

**Why this priority**: Error states are inevitable. Handling them gracefully prevents user confusion and maintains trust, but the core happy-path flows take precedence.

**Independent Test**: Can be tested by simulating network failure or an expired session and verifying the app shows a meaningful error message instead of a blank or broken page.

**Acceptance Scenarios**:

1. **Given** an authenticated user, **When** the Whoop API is unreachable, **Then** a user-friendly error message is displayed explaining the data could not be loaded, with an option to retry.
2. **Given** an authenticated user, **When** their refresh token has expired, **Then** the app redirects them to the landing page with the "Connect to Whoop" button, prompting re-authorization.
3. **Given** a visitor who navigates directly to the recovery dashboard URL without logging in, **Then** they are redirected to the landing page.

---

### Edge Cases

- What happens when the user's Whoop account has no recovery data for the current day (e.g., they haven't slept yet)? The dashboard should display a meaningful "no data available" message rather than blank or zero values.
- What happens when the Whoop API returns partial data (e.g., recovery score is present but HRV is missing)? Available metrics should still display; unavailable metrics should show "data not available".
- What happens if the OAuth callback URL receives an invalid or tampered authorization code? The app should redirect the user back to the landing page with a server-rendered error message (no JavaScript dependency for visibility).
- What happens if the client ID or client secret in the `.env` file is missing or invalid? The app should fail gracefully at startup with a clear configuration error message.
- What happens if the stored refresh token in `.env` has expired? The app should redirect the user to the landing page with a message prompting them to reconnect via OAuth.
- What happens if the `.env` file cannot be written to when persisting tokens? The app should log a warning; the current session should still work but the user will need to re-authorize on next restart.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a landing page with a modern, visually appealing design and a prominent "Connect to Whoop" call-to-action.
- **FR-002**: System MUST authenticate users via OAuth2 Authorization Code Flow using the Whoop API, with the client secret kept server-side.
- **FR-003**: System MUST store the client ID and client secret in a `.env` file at the repository root; these values MUST NOT be exposed to the browser.
- **FR-004**: System MUST redirect users to the Whoop authorization screen when they click "Connect to Whoop".
- **FR-005**: System MUST handle the OAuth2 callback, exchange the authorization code for an access token server-side, and redirect the user to the recovery dashboard. On failure (denied access, invalid code, state mismatch), the system MUST redirect to the landing page with an `?error=` query parameter. The landing page MUST display the cause-specific error via JavaScript and include a `<noscript>` fallback so the error is visible without JavaScript.
- **FR-006**: System MUST persist the OAuth2 refresh token (and optionally the access token) in the `.env` file so that the user does not need to re-authorize on every server restart. There is no backend database or keystore.
- **FR-007**: System MUST use the stored refresh token to obtain a fresh access token automatically when the user visits the app, bypassing the OAuth login flow if the refresh token is still valid.
- **FR-008**: System MUST retrieve the authenticated user's latest recovery score, HRV, and resting heart rate from the Whoop API.
- **FR-009**: System MUST display the recovery score, HRV (in milliseconds), and resting heart rate (in bpm) on the recovery dashboard with clear labels.
- **FR-010**: System MUST redirect unauthenticated users to the landing page if they attempt to access the recovery dashboard directly.
- **FR-011**: System MUST display user-friendly, cause-specific error messages when the Whoop API is unreachable, returns errors, or returns incomplete data. Each error type MUST have a distinct message identifying the cause and a clear next step (e.g., "Authorization was denied — please try again" vs. "Could not reach Whoop — please retry").
- **FR-012**: System MUST redirect users back to the landing page with an `?error=` query parameter if they deny authorization on the Whoop login screen. The error message MUST be visible via `<noscript>` fallback when JavaScript is disabled.
- **FR-013**: System MUST NOT include a logout or disconnect button. The user remains connected until the refresh token naturally expires, at which point the app prompts re-authorization.
- **FR-014**: System MUST support only a single Whoop account at a time. If a new user authorizes, the previous account's tokens in `.env` are overwritten.

### Key Entities

- **User Session**: Represents an authenticated user's active session; the refresh token (and optionally access token) are persisted in the `.env` file so the user stays connected across server restarts. Attributes: access token, token expiry, refresh token, user identifier. (Note: refresh token expiry is not exposed by the Whoop API; validity is determined by attempting a refresh — failure indicates expiration.)
- **Recovery Data**: The health metrics retrieved from the Whoop API for one recovery cycle. Attributes: recovery score (percentage), HRV (milliseconds), resting heart rate (bpm), date of recovery.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new user can go from landing page to viewing their recovery metrics in under 60 seconds (excluding time spent on Whoop's authorization screen).
- **SC-002**: The recovery dashboard accurately displays the same recovery score, HRV, and resting heart rate values as shown in the official Whoop app.
- **SC-003**: 95% of users who click "Connect to Whoop" and authorize access are successfully redirected to the recovery dashboard with their data visible.
- **SC-004**: When an error occurs (API outage, expired session, missing data, denied access), 100% of error states display a cause-specific, human-readable message with a clear next step (retry or reconnect). Callback errors on the landing page MUST include a `<noscript>` fallback visible without JavaScript.
- **SC-005**: The landing page loads and is visually complete in under 3 seconds on a standard broadband connection.

## Assumptions

- The Whoop API provides endpoints for OAuth2 Authorization Code Flow and for retrieving recovery data (recovery score, HRV, resting heart rate).
- The user already has an active Whoop account and wearable device collecting data.
- Token storage is file-based: the refresh token (and optionally access token) are written to the `.env` file at the repository root, alongside the client ID and client secret. Tokens survive server restarts and persist until the refresh token expires. This is a single-user application; only one Whoop account can be connected at a time.
- The application consists of two pages: a landing page and a recovery dashboard. No additional pages or navigation are required at this time.
- "Modern" landing page design means a clean, minimal aesthetic with clear typography, adequate whitespace, and a single focused call-to-action — no specific brand guidelines or design system is mandated.
- The `.env.example` file will be committed with placeholder keys to document required environment variables, per the project constitution.

## Clarifications

### Session 2026-02-20

- Q: Where should OAuth tokens be stored? → A: In the `.env` file (not in memory). Refresh token persists until it expires. User must not re-login on every visit/restart.
- Q: What should logout behavior be with persisted tokens? → A: No logout button. User stays connected until refresh token naturally expires.
- Q: Is this a single-user app? → A: Yes, single-user only. One Whoop account at a time; new authorization overwrites previous tokens.
- Q: How should OAuth callback errors be communicated to the user? → A: Redirect to landing page with a server-rendered error message embedded in the HTML response (no JavaScript dependency for error visibility).
- Q: Should error messages be generic or cause-specific? → A: Cause-specific. Each error type gets a distinct message identifying what went wrong and a clear next step (e.g., denied access, token failure, security check failure, API unreachable).
- Q: How should the landing page render callback error messages? → A: JavaScript reads the `?error=` query parameter and displays the cause-specific message. A `<noscript>` fallback ensures error visibility when JavaScript is disabled.
