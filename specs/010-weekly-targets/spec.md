# Feature Specification: Weekly Training Targets

**Feature Branch**: `010-weekly-targets`
**Created**: 2025-04-09
**Status**: Draft
**Input**: User description: "Add a target breakdown page showing whether
the user hit 3 strength + 1 cardio per ISO week, from January 1st onward,
with chat-based explanations."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Weekly Target Status (Priority: P1)

As a user, I navigate to the Targets page and see a week-by-week
breakdown from January 1st of the current year through today. Each
ISO week (Monday-Sunday) shows how many strength sessions and cardio
sessions were logged, compared to the target of 3 strength + 1 cardio.
Weeks that meet the target are visually marked green; weeks that miss
are marked red.

**Why this priority**: Core value — without this view the feature has
no purpose.

**Independent Test**: Authenticate, click "Targets" in the nav, verify
the table renders with accurate week rows and colour coding, then
validate displayed counts week-by-week against a WHOOP workouts JSON
export for the same date range.

**Acceptance Scenarios**:

1. **Given** the user is authenticated, **When** they visit `/targets`,
   **Then** a table displays one row per ISO week from Jan 1 to today.
2. **Given** a week has >= 3 strength + >= 1 cardio sessions,
   **When** that week's row renders, **Then** it is coloured green.
3. **Given** a week has < 3 strength or < 1 cardio sessions,
   **When** that week's row renders, **Then** it is coloured red.
4. **Given** the current week is incomplete (today is mid-week),
   **When** it renders, **Then** it is marked as "In Progress" rather
   than red.
5. **Given** the weekly summaries are computed, **When** the page
  renders, **Then** a 3-metric scoreboard appears above the table
  with exact copy: "Lagging indicator: Completed weeks — {metWeeks}
  / {completedWeeks} ({percentage}%)"; "Recent signal: Last 4
  completed weeks — {metLast4} / {last4Total}"; "Leading indicator:
  This week — {strengthCount} / 3 strength · {cardioCount} / 1 cardio".
6. **Given** a WHOOP workouts JSON export for Jan 1 to today,
   **When** weekly counts are recomputed from that export,
   **Then** each displayed week's strength count, cardio count,
   and met/missed/in-progress status exactly match the recomputed
   values.

---

### User Story 2 - Understand Session Classification (Priority: P2)

As a user, I can see which workouts were counted as strength, cardio,
or excluded for each week, so I understand how the totals were derived.

**Why this priority**: Builds trust — users need to verify the system
classified their activities correctly.

**Independent Test**: Expand or click a week row and verify the listed
workouts match the user's WHOOP history.

**Acceptance Scenarios**:

1. **Given** a week row exists, **When** the user expands it,
   **Then** individual workouts appear with their sport name, date,
   and classification (strength / cardio / excluded).
2. **Given** a workout has `sport_id` 44 or 45 (Weightlifting),
   **When** classified, **Then** it shows as "Strength".
3. **Given** a workout has `sport_id` 0 (Running) or 1 (Cycling),
   **When** classified, **Then** it shows as "Cardio".
4. **Given** a workout has any other `sport_id`, **When**
   classified, **Then** it is excluded from counts and displays
   with the API-provided `sport_name`.
5. **Given** a workout has `sport_id` -1 and `sport_name` "activity",
  **When** classified, **Then** it is excluded from both strength
  and cardio counts.
6. **Given** workouts such as walking, yoga/restorative-yoga,
  stretching, recovery/relaxation, swimming, or stadium-steps,
  **When** classified and they are not explicitly mapped,
  **Then** they are excluded from counts.

---

### User Story 3 - Chat-Based Explanation (Priority: P3)

As a user, I can click a button to get a coach-like natural-language
summary of my training pattern, highlighting missed weeks and
offering encouragement, powered by a new `POST /api/chat` endpoint.

**Why this priority**: Nice-to-have — primary value is the visual
breakdown; chat adds a coaching layer.

**Independent Test**: Load the Targets page, click "Explain", and
verify a chat response appears that references the user's actual
weekly data.

**Acceptance Scenarios**:

1. **Given** the weekly summary data is loaded, **When** the user
   clicks "Explain", **Then** a request is sent to the chat endpoint
   with the weekly summary as context.
2. **Given** the chat responds, **When** the response renders,
   **Then** it contains references to specific weeks and targets.

---

### Edge Cases

- **Timezone boundaries**: A workout starting at 23:50 Monday in the
  user's zone may have a UTC timestamp on Tuesday. Use the workout's
  `start` timestamp as-is (UTC) for week assignment; document this
  as a known simplification.
- **Unmapped sport IDs**: Any `sport_id` not in SPORT_MAP
  (i.e. not Weightlifting, Running, or Cycling) defaults to
  excluded and displays the API-provided `sport_name`.
- **Unknown activity records**: Generic activity entries
  (`sport_id: -1`, `sport_name: "activity"`) are excluded by
  default and never inferred as strength/cardio.
- **Wellness / low-intent activities**: Walking, yoga,
  restorative-yoga, stretching, recovery/relaxation, swimming,
  and stadium-steps are excluded unless explicitly mapped.
- **Duplicate / multiple workouts per day**: Count each scored
  workout independently; two strength sessions on the same day both
  count toward the weekly total.
- **Sparse history**: Weeks with zero workouts still appear in the
  table, showing 0/3 strength and 0/1 cardio.
- **Incomplete current week**: The current (partial) week is rendered
  with an "In Progress" badge instead of a red fail state.
- **Unscored workouts**: Only `score_state === "SCORED"` workouts
  are counted. PENDING_SCORE and UNSCORABLE are ignored.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Page MUST fetch workouts via existing
  `GET /api/workout?start=<Jan1>&end=<today>`.
- **FR-002**: Page MUST classify each scored workout as strength,
  cardio, or excluded using sport_id mapping only.
- **FR-002a**: Classification MUST NOT use strain-based fallback or
  any heuristic inference for unmapped activities.
- **FR-002b**: Any unmapped or unknown `sport_id` (including `-1`)
  MUST default to excluded.
- **FR-002c**: Only `sport_id` 44/45 count as strength and only
  `sport_id` 0/1 count as cardio.
- **FR-003**: Page MUST group workouts into ISO 8601 weeks
  (Monday-Sunday).
- **FR-004**: Page MUST display one row per week with strength count,
  cardio count, and met/missed/in-progress status.
- **FR-004a**: Page MUST display a 3-metric scoreboard above the table
  using factual, non-pithy language only and these exact labels:
  Lagging indicator, Recent signal, Leading indicator.
- **FR-004b**: Scoreboard copy MUST be exactly:
  - Lagging indicator: Completed weeks — {metWeeks} / {completedWeeks} ({percentage}%)
  - Recent signal: Last 4 completed weeks — {metLast4} / {last4Total}
  - Leading indicator: This week — {strengthCount} / 3 strength · {cardioCount} / 1 cardio
- **FR-004c**: Completed weeks MUST exclude the in-progress current week.
- **FR-004d**: Recent signal MUST use only the last 4 completed weeks.
- **FR-004e**: Leading indicator MUST use the current ISO week only.
- **FR-004f**: Weekly status and scoreboard metrics MUST be derived
  only from corrected weekly strength/cardio counts after exclusion
  rules are applied.
- **FR-005**: Page MUST visually distinguish met (green), missed
  (red), and in-progress (yellow) weeks.
- **FR-006**: Page MUST allow expanding a week to see individual
  workout details.
- **FR-007**: Page MUST handle zero-workout weeks by showing 0/3
  and 0/1.
- **FR-008**: Page MUST filter out workouts where
  `score_state !== "SCORED"`.
- **FR-009**: Server MUST serve `public/targets.html` at
  `GET /targets`.
- **FR-010**: Landing page MUST include a nav link to `/targets`.

### Key Entities *(client-side computed, no persistence)*

- **Workout**: Raw record from WHOOP API (sport_id, score, start,
  end, score_state).
- **ClassifiedSession**: Workout enriched with a `category` field
  (strength / cardio / excluded).
- **WeeklySummary**: Week label, strength count, cardio count,
  status (met / missed / in-progress), list of classified sessions.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Authenticated user sees the targets table within
  3 seconds of page load.
- **SC-002**: Classification matches a manual count of the user's
  WHOOP workouts JSON export for at least the most recent 4 weeks,
  including week-by-week strength/cardio totals and status.
- **SC-003**: All edge cases (zero weeks, partial week, excluded
  sports, unknown activities defaulting to excluded) render
  correctly on first load.
