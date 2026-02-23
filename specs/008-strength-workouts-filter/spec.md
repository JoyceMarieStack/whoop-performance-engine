# Feature Specification: Strength Workouts Filter

**Feature Branch**: `008-strength-workouts-filter`  
**Created**: 2026-02-22  
**Status**: Draft  
**Input**: User description: "Add a button to return all workouts where sports is weightlifting or strength training."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Filter Workouts to Strength Sessions (Priority: P1)

A connected user selects a date range and clicks a "Strength" button to retrieve only workouts classified as weightlifting or strength training. The filtered JSON is displayed in the output area, showing only matching records.

**Why this priority**: This is the entire feature — a single-action filter that saves the user from manually scanning workout JSON for strength sessions.

**Independent Test**: Connect to WHOOP, select a 14-day range that includes at least one weightlifting session and one non-strength session (e.g., running), click "Strength", and confirm only weightlifting/strength training records appear in the output.

**Acceptance Scenarios**:

1. **Given** the user is connected and a date range is selected, **When** they click the "Strength" button, **Then** the app displays only workout records where the sport type is Weightlifting (sport_id 44) or Functional Fitness (sport_id 71).
2. **Given** the filtered results are displayed, **When** the user clicks "Copy", **Then** the filtered JSON is placed on the clipboard.
3. **Given** the user selects a date range with no strength workouts, **When** they click "Strength", **Then** the app displays an empty result set with a clear indication that no matching records were found.
4. **Given** the user fetches strength workouts, **When** the result contains multiple pages of data, **Then** all pages are followed and the filter applies to the complete dataset.

---

### User Story 2 — Identify Strength Sessions in Fetch All (Priority: P2)

When the user fetches all data, the combined JSON already includes all workouts. The user can then use the dedicated Strength button to see only the strength subset without re-fetching.

**Why this priority**: Convenience — if the user already has all data loaded, having a quick filter avoids a separate API round-trip.

**Independent Test**: Click "Fetch All", note the workouts array contains mixed sport types, then click "Strength" and confirm only strength records appear.

**Acceptance Scenarios**:

1. **Given** the user has previously fetched all data, **When** they click "Strength", **Then** the app fetches and displays only strength workout records for the selected date range.

---

### Edge Cases

- User is not connected and clicks "Strength" — app prompts connection first.
- Date range returns zero workout records at all — app displays an empty result with a clear message.
- Date range returns workouts but none match strength sport IDs — app displays an empty filtered result indicating no strength sessions found.
- WHOOP returns a rate-limit (429) response — app shows a "try again later" message.
- Token has expired — app attempts a silent refresh; if refresh fails, prompts reconnection.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST provide a "Strength" button in the endpoint controls area alongside the existing endpoint buttons.
- **FR-002**: When the user activates the Strength filter, the app MUST retrieve all workouts for the selected date range and return only those where the sport type is Weightlifting (sport_id 44) or Functional Fitness (sport_id 71).
- **FR-003**: The filter MUST apply across all paginated results — the complete workout collection for the period is fetched before filtering.
- **FR-004**: The filtered result MUST be displayed as raw JSON in the same output area used by other endpoints.
- **FR-005**: The filtered result MUST be copyable via the existing one-click copy action.
- **FR-006**: When no workouts match the strength filter, the app MUST display a clear empty-state message.
- **FR-007**: The Strength button MUST follow the same error handling patterns as existing endpoint buttons (auth errors, rate limits, network failures).

### Key Entities

- **Strength Workout**: A Workout record where `sport_id` is 44 (Weightlifting / Strength Trainer) or 71 (Functional Fitness). These are the two WHOOP sport categories that represent resistance/strength-based sessions.
- **Sport ID Mapping**: WHOOP uses integer sport IDs to classify workout types. The authoritative list is maintained in WHOOP developer documentation. This feature targets IDs 44 and 71 as the strength subset.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A connected user can retrieve filtered strength workouts within 5 seconds under normal network conditions.
- **SC-002**: 100% of displayed results contain only workouts matching sport_id 44 or 71 — no non-strength records leak through.
- **SC-003**: The filtered JSON is fully copyable with a single click, identical to existing copy behaviour.
- **SC-004**: When no strength sessions exist in the selected period, the user sees a descriptive empty-state message rather than a raw empty array.

## Assumptions

- The existing Workouts endpoint and pagination infrastructure (from feature 007) provides the data retrieval foundation — this feature adds a filter layer on top.
- Sport IDs 44 (Weightlifting / Strength Trainer) and 71 (Functional Fitness) are the appropriate classification for "weightlifting or strength training" in WHOOP's taxonomy. If additional sport IDs need to be included in the future, the filter criteria should be easy to extend.
- The "Strength" button sits alongside the existing endpoint buttons (Body, Recovery, Sleep, Cycles, Workouts, Fetch All) as a convenience filter, not a replacement for the full Workouts button.
- This is a single-user personal tool — no multi-user considerations apply.
