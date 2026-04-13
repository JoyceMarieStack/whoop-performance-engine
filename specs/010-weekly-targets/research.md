# Research: Weekly Training Targets

## Decisions

### R1 — Sport ID Classification Map

**Decision**: Use a hard-coded lookup object in client JS.

| sport_id | Name          | Category |
| -------- | ------------- | -------- |
| 44       | Weightlifting | strength |
| 45       | Weightlifting | strength |
| 0        | Running       | cardio   |
| 1        | Cycling       | cardio   |
| *        | (everything)  | excluded |

**Rationale**: Only Weightlifting counts as strength; only Running
and Cycling count as cardio. Everything else is excluded by default.
Unmapped IDs use the API-provided `sport_name` for display.
This eliminates the need to enumerate excluded IDs — any new sport
WHOOP adds is automatically excluded without a code change.

---

### R2 — Default-to-Excluded Fallback

**Decision**: Any `sport_id` not in SPORT_MAP (including -1)
defaults to **excluded**. No strain-based fallback.

**Rationale**: The user only cares about Weightlifting and
Running/Cycling. Strain-based fallback caused misclassification
of walking, yoga, stretching, and relaxation activities as cardio
(especially when `score` was null, defaulting strain to 0).
Defaulting to excluded is simpler and self-healing.

---

### R3 — ISO 8601 Week Grouping (Monday-Sunday)

**Decision**: Use `Date` arithmetic to compute the ISO week number
and year for each workout's `start` timestamp, then group by
`{year}-W{week}`.

**Rationale**: ISO 8601 weeks start on Monday, which aligns with
common training cycles. JavaScript's `Date.getDay()` returns 0 for
Sunday; shifting by 1 maps Monday=0..Sunday=6 for easy bucket
computation.

**Alternatives considered**:

- Calendar weeks (Sunday-Saturday) — less common in fitness contexts.
- Rolling 7-day windows — more complex, harder to display, and the
  user explicitly asked for week-by-week from January 1st.

---

### R4 — Date Range: January 1st to Today

**Decision**: The client computes `start = {currentYear}-01-01T00:00:00.000Z`
and `end = new Date().toISOString()`, then passes both to
`GET /api/workout?start=...&end=...`.

**Rationale**: The user's requirement is "from January 1st onward".
Using the current year's January 1st as the start gives a natural
year-to-date view. The existing `/api/workout` endpoint already
accepts `start` and `end` query parameters and handles pagination.

**Alternatives considered**:

- Configurable start date — YAGNI for a demo app.
- Last 28 days — does not match the stated requirement.

---

### R5 — Handling the Current (Partial) Week

**Decision**: Detect the current week by comparing the week's end
date (next Sunday) against today. If the week is not yet complete,
render it with a yellow "In Progress" badge instead of red/green.

**Rationale**: Marking an incomplete week as "missed" would be
misleading — the user still has days remaining to meet the target.

**Alternatives considered**:

- Omit the current week entirely — loses visibility into the
  current week's progress.
- Show it as red until met — punishing UX for no reason.

---

### R6 — Existing API Reuse (No New Endpoints)

**Decision**: Reuse `GET /api/workout?start=...&end=...`. All
classification, grouping, and summary logic runs in the browser.

**Rationale**: The existing endpoint already proxies the WHOOP
`/v2/activity/workout` collection with pagination (`whoopFetchAllPages`).
Adding a server endpoint would violate the Simplicity principle and
duplicate logic that only needs to run once per page load.

**Alternatives considered**:

- New `GET /api/targets` endpoint with server-side classification —
  rejected per user directive and constitution Principle III.

---

### R7 — SCORED-Only Filter

**Decision**: Filter workouts client-side: only include records where
`score_state === "SCORED"`.

**Rationale**: `PENDING_SCORE` workouts are not finalized and can
change before scoring completes. `UNSCORABLE` workouts do not provide
reliable scoring metadata for weekly target accounting. Filtering to
SCORED records keeps week totals and status calculations stable and
reproducible.

**Alternatives considered**:

- Include PENDING_SCORE with a "pending" badge — adds UI complexity
  for marginal value in a demo app.
