# Feature Specification: User Steps Display

**Feature Branch**: `009-user-steps`  
**Created**: 2026-02-22  
**Status**: Draft  
**Input**: User description: "The user steps should be returned. Suggest where to include this."

## Data Source Constraint

The WHOOP API does **not** provide step count data. The project's OpenAPI spec explicitly notes: *"Step count (source: phone Health app / Google Fit) — Not available from Whoop API."* This feature therefore requires the user to manually enter their daily step count, which the app stores and returns alongside WHOOP data.

## Placement Recommendation

Steps data should be included in two places:

1. **New "Steps" input section** — a simple form below the existing date-range controls where the user enters a daily step count for a given date. This keeps data entry separate from data retrieval buttons.
2. **"Fetch All" combined payload** — when the user clicks "Fetch All", the combined JSON should include a `steps` array alongside body, recovery, sleep, cycles, and workouts, so the user gets a complete picture when copying data for external analysis.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Record Daily Step Count (Priority: P1)

A user enters their daily step count for a specific date and saves it. The step entry persists so it can be retrieved later.

**Why this priority**: Without the ability to record steps, there is no data to display. This is the foundation of the entire feature.

**Independent Test**: Open the app, enter a step count for today's date, click "Save", refresh the page, and confirm the saved value persists.

**Acceptance Scenarios**:

1. **Given** the user is on the dashboard, **When** they enter a step count for a date and click "Save", **Then** the step entry is stored and a confirmation message is shown.
2. **Given** the user enters an invalid step count (negative number, non-numeric text), **When** they click "Save", **Then** the app shows a validation error and does not save.
3. **Given** the user saves steps for a date that already has an entry, **When** they click "Save", **Then** the previous value is overwritten with the new count.

---

### User Story 2 — View Steps for a Date Range (Priority: P2)

A user clicks a "Steps" button to retrieve all saved step entries for the selected date range, displayed as JSON in the output area so they can copy it.

**Why this priority**: Viewing previously entered steps completes the read/write cycle and lets the user include step data in their analysis workflow.

**Independent Test**: Enter steps for 3 different dates, select a date range covering those dates, click "Steps", and confirm all 3 entries appear in the JSON output.

**Acceptance Scenarios**:

1. **Given** the user has saved step entries, **When** they select a date range and click "Steps", **Then** the app displays a JSON array of step records for that period.
2. **Given** no step entries exist for the selected range, **When** they click "Steps", **Then** the app shows a clear empty-state message.
3. **Given** the step results are displayed, **When** the user clicks "Copy", **Then** the full JSON is placed on the clipboard.

---

### User Story 3 — Include Steps in Fetch All (Priority: P3)

When the user clicks "Fetch All", the combined JSON includes a `steps` array alongside all WHOOP datasets, giving a complete data snapshot for external tools.

**Why this priority**: Convenience — avoids a separate click to get steps when pulling all data at once.

**Independent Test**: Enter steps for several dates, click "Fetch All" covering those dates, and confirm the combined JSON contains a `steps` field with the saved entries.

**Acceptance Scenarios**:

1. **Given** the user has saved step entries within the selected period, **When** they click "Fetch All", **Then** the combined JSON includes a `steps` array with matching records.
2. **Given** no step entries exist for the selected range, **When** they click "Fetch All", **Then** the `steps` field is an empty array (the rest of the WHOOP data still returns normally).

---

### Edge Cases

- User enters 0 steps — valid entry, saved as-is (rest day or no data).
- User enters a very large step count (e.g., 999,999) — accepted; no upper-bound validation needed for a personal tool.
- User saves steps for a future date — accepted; no calendar restriction for a personal tool.
- Server restarts — saved step data must persist across restarts.
- User is not connected to WHOOP but wants to enter steps — step entry should work independently of WHOOP authentication since step data is local.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST provide a step entry form on the dashboard with a date picker and a numeric step count input.
- **FR-002**: The app MUST save step entries so they persist across server restarts.
- **FR-003**: The app MUST validate that the step count is a non-negative integer before saving.
- **FR-004**: The app MUST allow updating an existing step entry by saving a new value for the same date.
- **FR-005**: The app MUST provide a "Steps" button in the endpoint controls area that retrieves saved step entries for the selected date range.
- **FR-006**: The step results MUST be displayed as raw JSON in the same output area used by other endpoints.
- **FR-007**: The step results MUST be copyable via the existing one-click copy action.
- **FR-008**: When no step entries exist for the selected range, the app MUST display a clear empty-state message.
- **FR-009**: The "Fetch All" combined payload MUST include a `steps` array containing step entries for the selected date range.
- **FR-010**: Step entry and retrieval MUST require WHOOP authentication, consistent with all other dashboard actions.

### Key Entities

- **Step Entry**: A record containing a date and a step count. One entry per date. Keyed by date (ISO format, e.g., "2026-02-22"). Attributes: date, step count, timestamp of last update.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can save a step entry and retrieve it within 2 seconds.
- **SC-002**: 100% of saved step entries persist across server restarts.
- **SC-003**: Saved step entries appear in the "Fetch All" combined payload alongside WHOOP data.
- **SC-004**: Step data is displayable and copyable using the same JSON output and copy mechanism as WHOOP endpoints.

## Assumptions

- Step data is stored locally on the server (not in the WHOOP API). A simple JSON file provides sufficient persistence for a single-user personal tool.
- The step entry form defaults to today's date for quick daily logging.
- One step entry per date — saving again for the same date overwrites the previous value.
- The "Steps" button sits alongside other endpoint buttons (Body, Recovery, Sleep, Cycles, Workouts, Strength, Fetch All) in the controls area.
- Step operations require WHOOP authentication to maintain consistency with the existing dashboard pattern where all actions require a connected session.
