## ADDED Requirements

### Requirement: Hevy API authentication
The system SHALL authenticate to the Hevy API using an API key read from the `HEVY_API_KEY` environment variable, sent as a request header on every Hevy API call.

#### Scenario: Missing Hevy API key at startup
- **WHEN** the server starts and `HEVY_API_KEY` is not set
- **THEN** the server SHALL log a clear error identifying the missing variable and SHALL NOT crash the WHOOP-only functionality (Hevy-dependent routes SHALL return a `503`-class error until configured)

#### Scenario: Valid API key configured
- **WHEN** `HEVY_API_KEY` is set and a Hevy-dependent route is called
- **THEN** the system SHALL include the key on the outbound Hevy API request and proceed with the request

### Requirement: Fetch workouts for a date range
The system SHALL fetch a user's Hevy workouts (exercises, sets, reps, weight) for a given start and end date.

#### Scenario: Successful fetch for a week
- **WHEN** a date range covering a full week is requested
- **THEN** the system SHALL return all workouts logged in Hevy within that range, including per-set exercise name, reps, and weight

#### Scenario: Hevy API error
- **WHEN** the Hevy API returns an error or is unreachable
- **THEN** the system SHALL return a `502`-class error to the caller rather than partial or fabricated data

### Requirement: Map exercises to muscle groups
The system SHALL determine the primary muscle group for each exercise logged in a workout.

#### Scenario: Exercise has a Hevy-provided muscle group
- **WHEN** an exercise's template data from Hevy includes a primary muscle group
- **THEN** the system SHALL use that value to attribute the exercise's volume

#### Scenario: Exercise has no Hevy-provided muscle group
- **WHEN** an exercise's template data does not include a primary muscle group (e.g. a custom user-created exercise)
- **THEN** the system SHALL consult a local fallback mapping, and if no mapping exists, SHALL attribute the exercise's volume to an "unmapped" category rather than dropping it silently
