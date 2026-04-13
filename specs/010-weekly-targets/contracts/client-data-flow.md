# Client-Side Data Flow: Weekly Targets

No new API endpoints. The page reuses the existing workout proxy.

## Data Flow

```text
targets.html load
  │
  ├─ 1. Compute date range
  │     start = {year}-01-01T00:00:00.000Z
  │     end   = new Date().toISOString()
  │
  ├─ 2. Fetch workouts
  │     GET /api/workout?start={start}&end={end}
  │     Response: { records: Workout[] }
  │
  ├─ 3. Normalize payload
  │     records[] -> workouts[] (canonical client array)
  │
  ├─ 4. Filter
  │     Keep only score_state === "SCORED"
  │
  ├─ 5. Classify each workout
  │     sport_id → SPORT_MAP lookup
  │     No fallback heuristics
  │     Unmapped sport_id => excluded
  │     Output: ClassifiedSession[]
  │
  ├─ 6. Group by ISO week
  │     Key: "{year}-W{weekNum}"
  │     Compute Monday..Sunday range for display
  │
  ├─ 7. Build WeeklySummary[]
  │     Count strength, cardio per week
  │     Determine status:
  │       met only when strengthCount >= 3 and cardioCount >= 1
  │       in-progress for current incomplete week when not met
  │       missed otherwise
  │     Fill empty weeks (0 sessions) between Jan 1 and today
  │
    ├─ 8. Compute scoreboard metrics
    │     Lagging indicator:
    │       metWeeks / completedWeeks and percentage
    │       completedWeeks excludes in-progress week
    │     Recent signal:
    │       metLast4 / last4Total from last 4 completed weeks only
    │     Leading indicator:
    │       current ISO week strength/cardio counts only
    │
    └─ 9. Render UI
      Scoreboard above weekly table with exact metric copy
      Weekly table one row per week, colour-coded
      Expandable detail rows with session list
```

## Existing Endpoint Used

### GET /api/workout

| Parameter | Type   | Required | Description            |
| --------- | ------ | -------- | ---------------------- |
| start     | string | yes      | ISO 8601 datetime      |
| end       | string | yes      | ISO 8601 datetime      |

**Response**:

```json
{
  "records": [
    {
      "sport_id": 44,
      "score_state": "SCORED",
      "score": { "strain": 12.5 },
      "start": "2025-01-06T14:00:00.000Z",
      "end": "2025-01-06T15:30:00.000Z"
    }
  ]
}
```

## Sport Classification Map (Client-Side Constant)

```javascript
const SPORT_MAP = {
  44: { name: 'Weightlifting', category: 'strength' },
  45: { name: 'Weightlifting', category: 'strength' },
  0:  { name: 'Running',       category: 'cardio'   },
  1:  { name: 'Cycling',       category: 'cardio'   },
};
```

Any `sport_id` not in the map defaults to **excluded**.
No strain-based fallback is used.
Unmapped IDs use the API-provided `sport_name` for display.
