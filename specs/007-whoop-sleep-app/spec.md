# Feature Specification: WHOOP Sleep Web App

**Feature Branch**: `007-whoop-sleep-app`  
**Created**: 2026-02-22  
**Status**: Draft  
**Input**: User description: "Create a modern sleep web application. Implement the openapi.yml. Create a super simple front end to interact with the whoop API. The user wants to be able to see the resulting JSON so they can copy it."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Connect and Pull WHOOP Data (Priority: P1)

A user opens the web app, connects their WHOOP account, selects a date range, and retrieves their body, recovery, sleep, cycle, and workout data. The raw JSON response is displayed on screen so the user can review and copy it.

**Why this priority**: Without data retrieval there is nothing to display. This is the core value of the entire application.

**Independent Test**: Open the app, authenticate with WHOOP, choose a 7-day window, tap each data category, and confirm the JSON appears in a readable, copyable area.

**Acceptance Scenarios**:

1. **Given** the user is not yet connected, **When** they click "Connect to Whoop", **Then** they are taken through the OAuth2 authorization flow and returned to the app in a connected state.
2. **Given** the user is connected, **When** they request body measurements, **Then** the raw JSON response is displayed on screen.
3. **Given** the user is connected and selects a date range, **When** they request recovery, sleep, cycle, or workout data, **Then** the matching JSON records (including pagination) are displayed on screen.
4. **Given** a response contains a pagination token, **When** data is fetched, **Then** the system follows all pages automatically and returns the combined result.

---

### User Story 2 — Copy JSON to Clipboard (Priority: P2)

After data is displayed, the user copies the full JSON to their clipboard with a single action so they can paste it into another tool.

**Why this priority**: Copying is the stated end-goal — the user wants the JSON for use elsewhere. Without a copy action the user must manually select text.

**Independent Test**: Retrieve any dataset, click "Copy JSON", and paste into a text editor to confirm the full payload was captured.

**Acceptance Scenarios**:

1. **Given** JSON data is displayed on screen, **When** the user clicks the copy button, **Then** the complete JSON text is placed on the system clipboard.
2. **Given** JSON data is displayed, **When** the user clicks copy, **Then** a brief confirmation (e.g., "Copied!") is shown.

---

### User Story 3 — Fetch All Data at Once (Priority: P3)

The user retrieves all five WHOOP datasets for a date range in a single action and receives one combined JSON object ready to copy.

**Why this priority**: Convenience — avoids five separate clicks when the user wants the full weekly data pull.

**Independent Test**: Click "Fetch All", confirm the combined JSON contains body, recovery, sleep, cycles, and workouts for the chosen period.

**Acceptance Scenarios**:

1. **Given** the user is connected and selects a date range, **When** they click "Fetch All", **Then** a single combined JSON object containing all five datasets is displayed.
2. **Given** the combined data is displayed, **When** the user clicks copy, **Then** the full combined JSON is placed on the clipboard.

---

### Edge Cases

- User is not connected and attempts to fetch data — app prompts connection first.
- Date range returns zero records — app displays an empty result with a clear message.
- WHOOP returns a rate-limit (429) response — app shows a "try again later" message.
- Token has expired — app attempts a silent refresh; if refresh fails, prompts reconnection.
- Response includes only unscored records — app still displays the raw JSON as returned.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST authenticate users via OAuth2 Authorization Code Flow with a server-held client secret.
- **FR-002**: The app MUST provide controls to select a date range (start/end) for collection queries, defaulting to the last 7 days.
- **FR-003**: The app MUST allow the user to fetch each WHOOP dataset individually: body measurements, recovery, sleep, cycles, and workouts.
- **FR-004**: The app MUST automatically follow pagination tokens to return full result sets for collection endpoints.
- **FR-005**: The app MUST display the raw JSON response in a readable, scrollable text area.
- **FR-006**: The app MUST provide a one-click copy action that places the displayed JSON on the system clipboard.
- **FR-007**: The app MUST provide a "Fetch All" action that retrieves all five datasets for the selected period and combines them into a single JSON object.
- **FR-008**: The app MUST show clear feedback when an API call fails (unauthorised, rate-limited, or network error).
- **FR-009**: The app MUST attempt a silent token refresh when the access token expires, and prompt reconnection only if the refresh fails.

### Key Entities

- **Body Measurement**: Height, weight, and max heart rate for the connected user.
- **Recovery Record**: Daily recovery indicator with score state, recovery score, HRV, resting HR, SpO2, and skin temperature.
- **Sleep Record**: Sleep period with stage durations, sleep need breakdown, performance, consistency, and efficiency metrics.
- **Cycle Record**: Physiological day with strain, energy expenditure, and heart-rate summary.
- **Workout Record**: Individual workout session with activity type, strain, HR metrics, calories, and zone durations.
- **Combined Payload**: Single JSON envelope containing pull date, period, and all five datasets.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A connected user can retrieve and view JSON for any single WHOOP dataset within 5 seconds under normal network conditions.
- **SC-002**: 100% of displayed JSON payloads can be copied to the clipboard with a single click.
- **SC-003**: The "Fetch All" action returns a combined JSON object containing all five datasets for the selected date range.
- **SC-004**: 100% of authorisation and rate-limit errors result in a visible, understandable message to the user.
- **SC-005**: The app works as a single static page with no additional frameworks or build steps beyond what is already in the project.

## Assumptions

- The existing Express server and OAuth2 flow in `server.js` provide the authentication foundation; this feature extends that server with proxy routes and a new frontend page.
- The OpenAPI specification at `public/openapi.yaml` is the authoritative contract for WHOOP endpoint shapes and scopes.
- This is a single-user personal tool — no multi-user or session management is required.
- The frontend is static HTML/CSS/JS served by the Express backend, consistent with the project constitution.
