# Feature Specification: Scalar API Documentation Landing Page

**Feature Branch**: `005-redocly-api-docs`  
**Created**: 2026-02-21  
**Status**: Draft  
**Input**: User description: "Add redocly to this project. This should replace the current landing page."

## Clarifications

### Session 2026-02-21

- Q: Which interactive API docs tool should be used? (Redoc has no "Try It" panel) → A: Scalar API Reference — modern open-source docs with built-in "Try It" and dark mode, loaded from CDN.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Interactive API Docs as Landing Page (Priority: P1)

A user visits the application root URL and sees a Scalar-powered interactive API reference instead of the previous hero/dashboard page. The documentation displays all available BFF endpoints with their descriptions, parameters, and response schemas. The user can expand any endpoint and use a "Try It" panel to send a real request and see the JSON response directly in the browser.

**Why this priority**: This is the entire feature — replacing the landing page with Scalar API docs. Without this, nothing else works.

**Independent Test**: Start the server, navigate to `http://localhost:3000/`. Confirm a Scalar-rendered API reference loads showing all endpoints. Click "Try It" on the `/api/recovery` endpoint to send a request and observe the live response.

**Acceptance Scenarios**:

1. **Given** the server is running, **When** the user navigates to `/`, **Then** a Scalar API reference page renders showing all BFF endpoints (`/api/recovery`, `/api/status`, `/auth/whoop`, `/callback`).
2. **Given** the Scalar docs page is loaded, **When** the user expands the `/api/recovery` endpoint, **Then** they see the endpoint description, response schemas (`RecoveryResponse`, `ErrorResponse`), and a "Try It" panel.
3. **Given** the user is authenticated (has previously completed OAuth), **When** they use "Try It" on `/api/recovery`, **Then** they see the live JSON response containing their recovery score, HRV, and resting heart rate.
4. **Given** the user has not authenticated, **When** they use "Try It" on `/api/recovery`, **Then** they see a 401 JSON response with the error message indicating they need to authenticate.
5. **Given** the user is on the docs page, **When** they use "Try It" on `/api/status`, **Then** they see a JSON response with `{"authenticated": true}` or `{"authenticated": false}`.

---

### User Story 2 — OAuth Authentication via Docs (Priority: P2)

The user can initiate OAuth authentication from the docs page. An "Authorize" link or the `/auth/whoop` endpoint in the docs allows them to connect their Whoop account. After completing OAuth, they are redirected back to the docs page and can then successfully call authenticated endpoints via "Try It".

**Why this priority**: Without authentication, the user can only see 401 errors from "Try It". This story enables the full workflow: authenticate, then call the recovery endpoint.

**Independent Test**: From the Scalar docs page, trigger the `/auth/whoop` endpoint (via "Try It" or a visible link). Complete the Whoop OAuth flow. Confirm redirect back to `/`. Use "Try It" on `/api/recovery` and verify it returns real recovery data.

**Acceptance Scenarios**:

1. **Given** the user is on the docs page and not authenticated, **When** they navigate to `/auth/whoop` (via "Try It" or clicking a link), **Then** they are redirected to Whoop's OAuth authorization screen.
2. **Given** the user completes OAuth authorization, **When** Whoop redirects back to the callback URL, **Then** they are returned to the docs landing page at `/`.
3. **Given** the user has just authenticated, **When** they use "Try It" on `/api/recovery`, **Then** they receive their actual recovery data as JSON.

---

### User Story 3 — Updated OpenAPI Specification (Priority: P3)

The OpenAPI specification file accurately reflects the current state of the application routes after Features 004 (single-page flow) and 005 (this feature). Stale route definitions are corrected so the Scalar docs display accurate information.

**Why this priority**: The docs page renders whatever the OpenAPI spec says. If the spec is stale, the documentation misleads users. This story ensures accuracy.

**Independent Test**: Compare every path in the OpenAPI spec against the routes defined in `server.js`. Verify no stale routes remain (e.g., old `/oauth/callback` path, old `/dashboard` serving HTML).

**Acceptance Scenarios**:

1. **Given** the OpenAPI spec is loaded by Scalar, **When** the user views the endpoint list, **Then** all listed paths match the actual server routes.
2. **Given** Feature 004 changed `/oauth/callback` to `/callback` and `/dashboard` to a redirect, **When** reviewing the spec, **Then** these changes are reflected (correct path `/callback`, `/dashboard` shows as redirect).
3. **Given** Feature 005 replaces the landing page, **When** reviewing the `GET /` spec entry, **Then** it describes the Scalar docs page (not the old hero/dashboard HTML).

---

### Edge Cases

- What happens if the user visits `/` with JavaScript disabled? A `<noscript>` message should inform them that JavaScript is required.
- What happens if the OpenAPI spec file fails to load? Scalar displays its own built-in error message in the page body.
- What happens if the user bookmarked `/dashboard`? The existing redirect from `/dashboard` to `/` still works, now landing on the docs page.
- What happens if OAuth errors occur (denied, invalid state)? The callback still redirects to `/?error=...` — the docs page loads normally and the error is available in the URL but does not break the Scalar rendering.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The application MUST serve a Scalar-rendered interactive API reference as the landing page at `GET /`.
- **FR-002**: The Scalar page MUST load the project's OpenAPI specification and display all BFF endpoints with descriptions, parameters, and response schemas.
- **FR-003**: The Scalar "Try It" console MUST allow users to send live requests to any BFF endpoint and view the JSON response inline.
- **FR-004**: The "Try It" console MUST target the same server origin so requests work without CORS or proxy configuration.
- **FR-005**: The OpenAPI specification MUST be served as a static file accessible to the Scalar page.
- **FR-006**: The current landing page (hero section, dashboard metrics, client-side auth/fetch logic) MUST be removed and replaced by the Scalar page.
- **FR-007**: The OAuth flow (`/auth/whoop`, `/callback`) MUST continue to work — the callback MUST redirect back to `/` after authentication.
- **FR-008**: The `/api/recovery` and `/api/status` endpoints MUST remain unchanged in behavior.
- **FR-009**: The OpenAPI specification MUST be updated to reflect current routes: `/callback` (not `/oauth/callback`), `/dashboard` as redirect (not HTML-serving), and `GET /` as the docs page.
- **FR-010**: The docs page MUST be accessible without authentication. Calling authenticated endpoints via "Try It" without prior OAuth returns the standard 401 error response.

### Key Entities

- **OpenAPI Specification**: A YAML file describing all BFF endpoints, request parameters, and response schemas. Served as a static asset so the Scalar page can fetch and render it.
- **Scalar Docs Page**: The new landing page HTML that loads the Scalar open-source bundle and points it at the OpenAPI spec URL.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users see an interactive API reference when they navigate to the application root URL.
- **SC-002**: Users can call the `/api/recovery` endpoint via "Try It" and see the live JSON response within 3 seconds of clicking send.
- **SC-003**: The OpenAPI specification rendered in the docs matches 100% of the current server routes — no stale or missing endpoints.
- **SC-004**: The full authenticate-then-call-endpoint workflow completes in under 60 seconds (OAuth + "Try It" request).
- **SC-005**: No existing API functionality (`/api/recovery`, `/api/status`, `/auth/whoop`, `/callback`) is broken by the landing page replacement.

## Assumptions

- The Scalar open-source standalone JS bundle will be loaded from a CDN (`https://cdn.jsdelivr.net/npm/@scalar/api-reference`) — no npm dependency or build step required.
- Scalar includes built-in dark mode and a modern UI, matching the project's existing dark aesthetic.
- The previous landing page (hero, dashboard metrics, inline JS) is fully replaced. Users who want to see their recovery data will use "Try It" on the `/api/recovery` endpoint instead of the old metric cards.
- The existing dark-themed CSS for the old landing/dashboard page can be removed or left unused — it will not affect the Scalar-rendered page which brings its own styles.
- The OAuth flow remains server-side and unchanged. The only way to authenticate is to visit `/auth/whoop`, complete the Whoop OAuth consent, and be redirected back to `/`.
