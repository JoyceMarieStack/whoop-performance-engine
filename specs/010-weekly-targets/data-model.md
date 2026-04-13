# Data Model: Weekly Training Targets

All entities are **client-side computed** — no database, no
persistence. These describe the shape of JavaScript objects created
during page load.

## Workout (from WHOOP API)

Raw record returned by `GET /api/workout`. Only relevant fields
listed.

- Field: `sport_id` | Type: `number` | Activity type (-1, 0, 1, 43, 44, 63, 71, 96, etc.)
- Field: `score_state` | Type: `string` | "SCORED", "PENDING_SCORE", or "UNSCORABLE"
- Field: `score.strain` | Type: `number` | 0-21 scale; present in payload, not used for classification
- Field: `start` | Type: `string` | ISO 8601 datetime (UTC)
- Field: `end` | Type: `string` | ISO 8601 datetime (UTC)

## ClassifiedSession

Workout enriched with a computed category.

- Field: `workout` | Type: `object` | Reference to the original Workout record
- Field: `category` | Type: `string` | "strength", "cardio", or "excluded"
- Field: `sportName` | Type: `string` | Human-readable name (e.g. "Weightlifting")

**Classification rules** (see research.md R1, R2):

- sport_id in {44, 45} → strength
- sport_id in {0, 1} → cardio
- everything else → excluded

## WeeklySummary

One per ISO week from January 1st through today.

- Field: `weekLabel` | Type: `string` | e.g. "2025-W02 (Jan 6 - Jan 12)"
- Field: `isoWeek` | Type: `string` | e.g. "2025-W02"
- Field: `strengthCount` | Type: `number` | Sessions classified as strength this week
- Field: `cardioCount` | Type: `number` | Sessions classified as cardio this week
- Field: `status` | Type: `string` | "met", "missed", or "in-progress"
- Field: `sessions` | Type: `array` | ClassifiedSession[] for this week

**Status logic**:

- `strengthCount >= 3 && cardioCount >= 1` → "met"
- Current (incomplete) week → "in-progress"
- Otherwise → "missed"

## ScoreboardMetrics

Top-level dashboard metrics derived from `WeeklySummary[]`.

- Field: `metWeeks` | Type: `number` | Completed weeks with status `met`
- Field: `completedWeeks` | Type: `number` | All weeks except `in-progress`
- Field: `percentage` | Type: `number` | Rounded `metWeeks / completedWeeks * 100`
- Field: `metLast4` | Type: `number` | Met weeks within last 4 completed weeks
- Field: `last4Total` | Type: `number` | Count of last completed weeks considered (0-4)
- Field: `strengthCount` | Type: `number` | Current ISO week strength count
- Field: `cardioCount` | Type: `number` | Current ISO week cardio count
