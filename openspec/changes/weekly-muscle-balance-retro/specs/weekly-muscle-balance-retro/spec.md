## ADDED Requirements

### Requirement: Compute weekly muscle-group volume
The system SHALL compute total training volume (sets × reps × weight, summed) per macro muscle group (chest, back, legs, shoulders, arms, core) for a given Monday–Sunday week, using Hevy workout data grouped via the muscle-group mapping.

#### Scenario: Volume computed for a full week
- **WHEN** the retro is requested for a week that has completed Hevy workouts
- **THEN** the system SHALL return total volume per macro muscle group for that week

#### Scenario: No workouts logged for the week
- **WHEN** no Hevy workouts exist for the requested week
- **THEN** the system SHALL return zero volume for every muscle group rather than an error

### Requirement: Track weekly sets per muscle group
The system SHALL count the number of hard sets performed per macro muscle group per week, alongside tonnage, to support frequency-based analysis (e.g. the research-backed ~2x/week-per-muscle threshold for growth).

#### Scenario: Sets counted for a full week
- **WHEN** the retro is requested for a week with completed Hevy workouts
- **THEN** the system SHALL return total set count per macro muscle group for that week, alongside tonnage

#### Scenario: No workouts logged for the week
- **WHEN** no Hevy workouts exist for the requested week
- **THEN** the system SHALL return a set count of zero per muscle group

### Requirement: Track tonnage history per exercise
The system SHALL return per-session tonnage (sets × reps × weight) history for each exercise, starting from January 1, 2026, ordered chronologically, so the user can read their own progressive-overload trend from the raw numbers.

#### Scenario: Exercise history returned
- **WHEN** the history is requested for an exercise with logged sessions since January 1, 2026
- **THEN** the system SHALL return each session's date and tonnage for that exercise, ordered chronologically

#### Scenario: No sessions logged since January 1, 2026
- **WHEN** an exercise has no logged sessions since January 1, 2026
- **THEN** the system SHALL return an empty history for that exercise, not an error

### Requirement (deferred, not implemented): Classify tonnage trend per exercise
A future change MAY classify each exercise's tonnage history as "increasing", "flat", or "decreasing". This is explicitly not implemented yet — what counts as a meaningful change (first-vs-last comparison, percentage threshold, trendline slope, etc.) is an open question (see design.md) that was deliberately left undecided rather than guessed. Do not archive this requirement as current system behavior.

### Requirement: Correlate volume with WHOOP recovery/strain trend
The system SHALL compare each muscle group's current-week volume to the user's trailing 4-week average for that muscle group, and compare the current week's WHOOP recovery trend to the prior week.

#### Scenario: Recovery trending down with rising volume
- **WHEN** a muscle group's current-week volume is above its trailing 4-week average AND WHOOP recovery for the week is trending downward compared to the prior week
- **THEN** the system SHALL mark this as a candidate for over-worked flagging

#### Scenario: Recovery trending up with falling volume
- **WHEN** a muscle group's current-week volume is below its trailing 4-week average AND WHOOP recovery for the week is trending upward compared to the prior week
- **THEN** the system SHALL mark this as a candidate for under-worked flagging

#### Scenario: Insufficient history for a baseline
- **WHEN** fewer than 4 weeks of Hevy workout history exist for a muscle group
- **THEN** the system SHALL compute the average over however many weeks are available and SHALL indicate in the response that the baseline is based on limited data

### Requirement: Flag under-worked and over-worked muscle groups
The system SHALL label each macro muscle group in the weekly retro as "over-worked", "under-worked", or "balanced", based on the volume/recovery correlation, and SHALL include the underlying raw numbers (volume, trailing average, recovery trend) alongside each flag.

#### Scenario: Muscle group flagged over-worked
- **WHEN** a muscle group meets the over-worked candidate condition
- **THEN** the retro SHALL label it "over-worked" and include its raw volume, trailing average, and recovery trend direction

#### Scenario: Muscle group flagged under-worked
- **WHEN** a muscle group meets the under-worked candidate condition
- **THEN** the retro SHALL label it "under-worked" and include its raw volume, trailing average, and recovery trend direction

#### Scenario: Muscle group neither over- nor under-worked
- **WHEN** a muscle group meets neither candidate condition
- **THEN** the retro SHALL label it "balanced"

### Requirement: Surface weekly workout-completion progress
The system SHALL report how many of the week's planned workouts have been completed, reusing the same weekly target definition (3 strength + 1 cardio = 4 sessions) and WHOOP-workout classification already used by the `/targets` page.

#### Scenario: Progress reported mid-week
- **WHEN** the retro is requested partway through the current week
- **THEN** the system SHALL report completed strength and cardio session counts against the 3/1 target, and a total "X of 4 planned workouts completed"

#### Scenario: No progress toward target yet
- **WHEN** no classified strength or cardio workouts have been logged for the current week
- **THEN** the system SHALL report 0 of 4 completed, not an error

### Requirement: Recommend next workout's muscle-group focus
The system SHALL identify which under-worked macro muscle group(s), if any, should be prioritized in the next training session, based on the current week's flags.

#### Scenario: Under-worked muscle groups exist
- **WHEN** one or more muscle groups are flagged "under-worked" for the current week
- **THEN** the system SHALL surface those muscle group(s) as the recommended focus for the next workout

#### Scenario: No under-worked muscle groups
- **WHEN** no muscle groups are flagged "under-worked" for the current week
- **THEN** the system SHALL indicate no specific muscle group needs prioritizing

### Requirement: Present weekly retro view
The system SHALL expose the weekly muscle-balance retro as a JSON API endpoint and a corresponding static HTML page, following the existing `targets.html` pattern.

#### Scenario: User requests the retro page
- **WHEN** a user navigates to the retro page
- **THEN** the system SHALL display each macro muscle group's weekly volume, trend, and flag (over-worked / under-worked / balanced) for the most recently completed week

#### Scenario: Retro displays sets and tonnage history
- **WHEN** a user requests the retro page or API
- **THEN** the response SHALL include weekly set count per muscle group and per-exercise tonnage history, alongside the existing volume/recovery flags

#### Scenario: Retro displays completion progress and next-workout recommendation
- **WHEN** a user requests the retro page or API
- **THEN** the response SHALL include the weekly workout-completion progress (X of 4) and the recommended under-worked muscle group(s) for the next workout

#### Scenario: Underlying data source unavailable
- **WHEN** either the Hevy or WHOOP API call needed to compute the retro fails
- **THEN** the retro page SHALL display an error state identifying which data source failed, rather than showing an incomplete or misleading analysis
