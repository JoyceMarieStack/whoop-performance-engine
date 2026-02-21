# Feature Specification: Single Page Flow

**Feature Branch**: `004-single-page-flow`  
**Created**: 2026-02-21  
**Status**: Draft  
**Input**: User description: "Change the user flow. Once the user has logged in, the user should not be redirected to a new page showing the recovery scores. Once the user has logged in, the users recovery scores should be displayed on landing page. Keep it to a single page application."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Single-Page Recovery View (Priority: P1)

A visitor arrives at the landing page and sees the modern "Connect to Whoop" hero section. They click the button, complete OAuth authorization on Whoop's site, and are redirected back to the **same page**. The landing page now transforms to display their recovery score, HRV, and resting heart rate — all without navigating to a separate dashboard page. The "Connect to Whoop" button is replaced by the recovery metric cards.

**Why this priority**: This is the entire feature. Converting from a two-page flow (landing → dashboard) to a single-page flow is the core change. Everything else depends on this working.

**Independent Test**: Click "Connect to Whoop", authorize on Whoop, confirm the browser returns to `http://localhost:3000/` (not `/dashboard`) and recovery metrics are visible on the same page. Verify the URL never changes to `/dashboard`.

**Acceptance Scenarios**:

1. **Given** a visitor on the landing page, **When** they click "Connect to Whoop" and authorize, **Then** they are redirected back to the landing page (same URL `/`) with their recovery metrics displayed.
2. **Given** an authenticated user visiting `/`, **When** the page loads, **Then** the landing page automatically shows recovery metrics instead of the "Connect to Whoop" button.
3. **Given** a user whose refresh token is stored and still valid, **When** they visit the app, **Then** they see their recovery metrics on the landing page without needing to re-authorize.
4. **Given** any URL path other than `/` (e.g., `/dashboard`), **When** a user navigates there, **Then** they are redirected to `/`.

---

### User Story 2 - State Transitions on Single Page (Priority: P2)

The single page has two visual states: an unauthenticated state (hero + connect button) and an authenticated state (recovery metrics). The page transitions between these states based on the user's authentication status. Loading, error, and no-data states are handled inline on the same page.

**Why this priority**: Once the single-page redirect works (US1), the page needs to gracefully handle all intermediate states — loading data, errors, and missing data — without navigating away.

**Independent Test**: Load the page while authenticated and verify: (1) a loading indicator appears briefly, (2) metrics render, (3) simulate an API error and verify the error message and retry button appear on the same page, (4) verify no-data state shows an appropriate message.

**Acceptance Scenarios**:

1. **Given** an authenticated user on the landing page, **When** recovery data is loading, **Then** a loading indicator is displayed in place of the metric cards.
2. **Given** an authenticated user on the landing page, **When** the Whoop API is unreachable, **Then** a cause-specific error message with a retry button is shown on the same page.
3. **Given** an authenticated user on the landing page, **When** recovery data has not been scored yet, **Then** a "no data available" message is shown on the same page.
4. **Given** an authenticated user whose refresh token has expired, **When** they visit the page, **Then** the page reverts to the unauthenticated state with the "Connect to Whoop" button and an informative message.

---

### User Story 3 - Remove Dashboard Page (Priority: P3)

The separate `/dashboard` route and `dashboard.html` page are removed. All references to the dashboard page are eliminated. The `/dashboard` URL redirects to `/` for backwards compatibility.

**Why this priority**: Cleanup after the core flow change. Removing dead code and ensuring no broken links. Lower priority because the app works correctly even if the old files still exist temporarily.

**Independent Test**: Navigate to `/dashboard` directly — confirm redirect to `/`. Search the codebase for references to `dashboard.html` — confirm none remain (except spec/plan history).

**Acceptance Scenarios**:

1. **Given** a user navigating to `/dashboard`, **When** the page loads, **Then** they are redirected to `/`.
2. **Given** the codebase, **When** inspected, **Then** `dashboard.html` and `dashboard.js` no longer exist under `public/`.
3. **Given** the server routes, **When** inspected, **Then** no route serves `dashboard.html` directly.

---

### Edge Cases

- What happens when the OAuth callback redirects back to `/` with an `?error=` parameter? The page should remain in the unauthenticated state and display the cause-specific error message, same as today.
- What happens if the `/api/recovery` call fails while the page is in the authenticated state? The error and retry button should appear inline, replacing the metric cards area — no navigation away from the page.
- What happens if a user bookmarked `/dashboard` from the old flow? The server should redirect `/dashboard` to `/` so bookmarks don't break.
- What happens if the page is loaded and the token refresh silently fails mid-session? The page should revert to the unauthenticated state with the "Connect to Whoop" button and a message prompting re-authorization.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST serve a single page at `/` that handles both the unauthenticated state (hero + "Connect to Whoop" button) and the authenticated state (recovery metrics).
- **FR-002**: System MUST redirect the OAuth callback to `/` (not `/dashboard`) after successful token exchange.
- **FR-003**: System MUST determine the user's authentication status when `/` is loaded and display the appropriate state (unauthenticated hero or authenticated metrics).
- **FR-004**: System MUST display recovery score, HRV (in milliseconds), and resting heart rate (in bpm) on the landing page when the user is authenticated, with clear labels and units.
- **FR-005**: System MUST show a loading indicator on the landing page while recovery data is being fetched.
- **FR-006**: System MUST show cause-specific error messages with a retry button on the landing page when the Whoop API is unreachable or returns errors, without navigating to a different page.
- **FR-007**: System MUST show a "no data available" message on the landing page when the user's recovery has not been scored yet (PENDING_SCORE/UNSCORABLE).
- **FR-008**: System MUST redirect `/dashboard` to `/` for backwards compatibility.
- **FR-009**: System MUST remove `public/dashboard.html` and `public/js/dashboard.js` from the codebase.
- **FR-010**: System MUST retain all existing OAuth flow behavior (FR-002 through FR-007 and FR-010 through FR-014 from spec 003), except that post-login redirects now target `/` instead of `/dashboard`.
- **FR-011**: System MUST continue to display `?error=` callback errors on the landing page with JavaScript and a `<noscript>` fallback, as specified in the 003 spec.

### Key Entities

- **Page State**: The landing page has one of four mutually exclusive visual states: *unauthenticated* (hero + connect button), *loading* (spinner while fetching recovery data), *authenticated* (recovery metric cards), or *error/no-data* (inline message with optional retry). The state is determined by authentication status and API response.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The application serves only one user-facing page (`/`). No other HTML page is served or navigated to during normal use.
- **SC-002**: After completing OAuth authorization, the user sees their recovery metrics on the landing page within 5 seconds (excluding time on Whoop's authorization screen).
- **SC-003**: The URL bar never shows `/dashboard` during any user flow — it always remains `/` (or `/` with query parameters).
- **SC-004**: A user who bookmarked `/dashboard` is seamlessly redirected to `/` and sees the correct state (metrics if authenticated, connect button if not).
- **SC-005**: All error states (API failure, expired session, denied access, no data) are displayed inline on the landing page without any page navigation.

## Assumptions

- The existing OAuth flow, token persistence, and Whoop API integration from the 003-whoop-dashboard feature remain unchanged. Only the page routing and frontend presentation change.
- The recovery metric cards (HTML/CSS) from `dashboard.html` will be moved into `index.html` rather than rewritten from scratch.
- The `GET /api/recovery` and `GET /api/status` backend routes remain unchanged.
- The `GET /callback` route's redirect target changes from `/dashboard` to `/`.
- The CSS design system (custom properties, dark theme, metric card styles) is preserved.

