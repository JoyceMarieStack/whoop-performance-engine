import 'dotenv/config';
import express from 'express';
import { readFileSync, writeFileSync, renameSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import crypto from 'node:crypto';

// ---------------------------------------------------------------------------
// App root & paths
// ---------------------------------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ENV_PATH = join(__dirname, '.env');

// ---------------------------------------------------------------------------
// Configuration (AppConfig entity)
// ---------------------------------------------------------------------------
const CLIENT_ID = process.env.WHOOP_CLIENT_ID;
const CLIENT_SECRET = process.env.WHOOP_CLIENT_SECRET;
const REDIRECT_URI = process.env.WHOOP_REDIRECT_URI || 'http://localhost:3000/callback';
const PORT = Number(process.env.PORT) || 3000;

// Startup validation (T006) — fail fast if credentials are missing
if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    'ERROR: Missing required environment variables.\n' +
    '  WHOOP_CLIENT_ID and WHOOP_CLIENT_SECRET must be set in .env\n' +
    '  Copy .env.example to .env and fill in your Whoop app credentials.'
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// In-memory token cache (TokenStore entity — also persisted in .env)
// ---------------------------------------------------------------------------
let accessToken = process.env.WHOOP_ACCESS_TOKEN || '';
let refreshToken = process.env.WHOOP_REFRESH_TOKEN || '';
let tokenExpiresAt = Number(process.env.WHOOP_TOKEN_EXPIRES_AT) || 0;

// ---------------------------------------------------------------------------
// T007 — .env token read/write utility
// ---------------------------------------------------------------------------

/**
 * Read current tokens from in-memory cache.
 */
function getTokens() {
  return { accessToken, refreshToken, tokenExpiresAt };
}

/**
 * Persist updated tokens to the .env file atomically
 * (write to temp file, then rename) and update the in-memory cache.
 */
function persistTokens(newAccess, newRefresh, newExpiresAt) {
  // Update in-memory cache
  accessToken = newAccess;
  refreshToken = newRefresh;
  tokenExpiresAt = newExpiresAt;

  // Also update process.env so dotenv state stays consistent
  process.env.WHOOP_ACCESS_TOKEN = newAccess;
  process.env.WHOOP_REFRESH_TOKEN = newRefresh;
  process.env.WHOOP_TOKEN_EXPIRES_AT = String(newExpiresAt);

  try {
    const envContent = readFileSync(ENV_PATH, 'utf-8');
    const updated = updateEnvTokens(envContent, newAccess, newRefresh, newExpiresAt);
    const tmpPath = ENV_PATH + '.tmp';
    writeFileSync(tmpPath, updated, 'utf-8');
    renameSync(tmpPath, ENV_PATH);
  } catch (err) {
    console.warn('Warning: Could not persist tokens to .env:', err.message);
    // Continue with in-memory tokens; user will need to re-authorize on next restart
  }
}

/**
 * Update token variables in .env content string, preserving all other lines.
 */
function updateEnvTokens(content, newAccess, newRefresh, newExpiresAt) {
  const tokenMap = {
    WHOOP_ACCESS_TOKEN: newAccess,
    WHOOP_REFRESH_TOKEN: newRefresh,
    WHOOP_TOKEN_EXPIRES_AT: String(newExpiresAt),
  };

  const lines = content.split('\n');
  const seen = new Set();

  const updatedLines = lines.map((line) => {
    for (const [key, value] of Object.entries(tokenMap)) {
      if (line.startsWith(`${key}=`)) {
        seen.add(key);
        return `${key}=${value}`;
      }
    }
    return line;
  });

  // Append any token variables that weren't already in the file
  for (const [key, value] of Object.entries(tokenMap)) {
    if (!seen.has(key)) {
      updatedLines.push(`${key}=${value}`);
    }
  }

  return updatedLines.join('\n');
}

// ---------------------------------------------------------------------------
// T008 — Token refresh function
// ---------------------------------------------------------------------------

let refreshMutex = null; // Mutex to prevent concurrent refreshes

/**
 * Refresh the access token using the stored refresh token.
 * Returns true if successful, false if the refresh token is invalid/expired.
 * Uses a mutex to prevent concurrent refresh attempts (refresh tokens are single-use).
 */
async function refreshAccessToken() {
  // If a refresh is already in progress, wait for it
  if (refreshMutex) {
    return refreshMutex;
  }

  refreshMutex = (async () => {
    try {
      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        scope: 'offline',
      });

      const response = await fetch('https://api.prod.whoop.com/oauth/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });

      if (!response.ok) {
        console.error('Token refresh failed:', response.status, await response.text());
        return false;
      }

      const data = await response.json();
      const expiresAt = Math.floor(Date.now() / 1000) + (data.expires_in || 3600);
      persistTokens(data.access_token, data.refresh_token, expiresAt);
      return true;
    } catch (err) {
      console.error('Token refresh error:', err.message);
      return false;
    } finally {
      refreshMutex = null;
    }
  })();

  return refreshMutex;
}

// ---------------------------------------------------------------------------
// T009 — isAuthenticated() helper
// ---------------------------------------------------------------------------

/**
 * Check if the user is authenticated.
 * If a refresh token exists and the access token is expired, attempts a refresh.
 * Returns true if a valid access token is available.
 */
async function isAuthenticated() {
  if (!refreshToken) {
    return false;
  }

  const now = Math.floor(Date.now() / 1000);
  if (accessToken && tokenExpiresAt > now + 60) {
    // Access token is still valid (with 60s buffer)
    return true;
  }

  // Access token expired or missing — try to refresh
  return refreshAccessToken();
}

// ---------------------------------------------------------------------------
// Express app setup
// ---------------------------------------------------------------------------
const app = express();

// CSRF state for OAuth flow (module-level variable)
let oauthState = '';

// ---------------------------------------------------------------------------
// T012 — GET / (Landing page)
// ---------------------------------------------------------------------------
app.get('/', (_req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

// ---------------------------------------------------------------------------
// GET /targets (Weekly training targets page)
// ---------------------------------------------------------------------------
app.get('/targets', (_req, res) => {
  res.sendFile(join(__dirname, 'public', 'targets.html'));
});

// ---------------------------------------------------------------------------
// GET /data-fetcher (Raw WHOOP data fetcher / API explorer page)
// ---------------------------------------------------------------------------
app.get('/data-fetcher', (_req, res) => {
  res.sendFile(join(__dirname, 'public', 'data-fetcher.html'));
});

// ---------------------------------------------------------------------------
// T010 — GET /auth/whoop (Initiate OAuth)
// ---------------------------------------------------------------------------
app.get('/auth/whoop', (req, res) => {
  oauthState = crypto.randomBytes(16).toString('hex');

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'read:body_measurement read:recovery read:sleep read:cycles read:workout offline',
    state: oauthState,
  });

  res.redirect(`https://api.prod.whoop.com/oauth/oauth2/auth?${params.toString()}`);
});

// ---------------------------------------------------------------------------
// T011 — GET /callback (OAuth callback handler)
// ---------------------------------------------------------------------------
app.get('/callback', async (req, res) => {
  const { code, state, error } = req.query;

  // User denied authorization
  if (error) {
    return res.redirect('/?error=access_denied');
  }

  // Validate CSRF state
  if (!state || state !== oauthState) {
    return res.redirect('/?error=invalid_state');
  }

  // Missing authorization code
  if (!code) {
    return res.redirect('/?error=auth_failed');
  }

  try {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    });

    const response = await fetch('https://api.prod.whoop.com/oauth/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!response.ok) {
      console.error('Token exchange failed:', response.status, await response.text());
      return res.redirect('/?error=auth_failed');
    }

    const data = await response.json();
    const expiresAt = Math.floor(Date.now() / 1000) + (data.expires_in || 3600);

    // Persist tokens — overwrites any existing tokens (single-user per FR-014)
    persistTokens(data.access_token, data.refresh_token, expiresAt);

    // Clear CSRF state after successful use
    oauthState = '';

    res.redirect('/');
  } catch (err) {
    console.error('OAuth callback error:', err.message);
    res.redirect('/?error=auth_failed');
  }
});

// ---------------------------------------------------------------------------
// T013 — GET /dashboard (Backwards-compatible redirect)
// ---------------------------------------------------------------------------
app.get('/dashboard', (_req, res) => {
  res.redirect('/');
});

// ---------------------------------------------------------------------------
// T014 — GET /api/status (Auth status check)
// ---------------------------------------------------------------------------
app.get('/api/status', async (req, res) => {
  const authenticated = await isAuthenticated();
  res.json({ authenticated });
});

// ---------------------------------------------------------------------------
// T017 — GET /api/recovery (Recovery data proxy) [REPLACED by T002-T008]
// ---------------------------------------------------------------------------
// (Legacy single-record route removed — replaced by full proxy routes below)

// ---------------------------------------------------------------------------
// T002 — Shared WHOOP proxy helper with auth, pagination & error handling
// ---------------------------------------------------------------------------
const WHOOP_BASE = 'https://api.prod.whoop.com/developer';

/**
 * Build a WHOOP API URL with query parameters.
 * For collection endpoints: accepts start, end, limit, nextToken.
 */
function buildWhoopUrl(path, query = {}) {
  const url = new URL(`${WHOOP_BASE}${path}`);
  if (query.start) url.searchParams.set('start', query.start);
  if (query.end) url.searchParams.set('end', query.end);
  url.searchParams.set('limit', '25'); // max page size
  if (query.nextToken) url.searchParams.set('nextToken', query.nextToken);
  return url.toString();
}

/**
 * Fetch a single page from the WHOOP API with auth headers.
 * Returns { ok, status, data } or throws on network error.
 */
async function whoopFetch(url) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    return { ok: false, status: res.status, data: null };
  }
  return { ok: true, status: 200, data: await res.json() };
}

/**
 * Fetch all pages of a paginated WHOOP collection endpoint.
 * Returns the full array of records.
 */
async function whoopFetchAllPages(path, query = {}) {
  const allRecords = [];
  let nextToken = query.nextToken || null;
  let firstError = null;

  // First page
  const firstUrl = buildWhoopUrl(path, query);
  const first = await whoopFetch(firstUrl);
  if (!first.ok) return { ok: false, status: first.status, records: [] };

  allRecords.push(...(first.data.records || []));
  nextToken = first.data.next_token || null;

  // Follow pagination
  while (nextToken) {
    const pageUrl = buildWhoopUrl(path, { ...query, nextToken });
    const page = await whoopFetch(pageUrl);
    if (!page.ok) {
      firstError = page;
      break;
    }
    allRecords.push(...(page.data.records || []));
    nextToken = page.data.next_token || null;
  }

  return { ok: true, status: 200, records: allRecords };
}

/**
 * Express middleware: check auth, return 401 JSON if not authenticated.
 */
async function requireAuth(req, res) {
  if (!(await isAuthenticated())) {
    res.status(401).json({
      error: 'auth_expired',
      message: 'Your session has expired. Please reconnect to Whoop.',
    });
    return false;
  }
  return true;
}

/**
 * Map WHOOP error status codes to user-facing error JSON.
 */
function whoopErrorResponse(res, status) {
  if (status === 401) {
    return res.status(401).json({
      error: 'auth_expired',
      message: 'Your session has expired. Please reconnect to Whoop.',
    });
  }
  if (status === 429) {
    return res.status(429).json({
      error: 'rate_limited',
      message: 'Rate limit reached. Please wait a moment and try again.',
    });
  }
  return res.status(502).json({
    error: 'whoop_api_error',
    message: 'Could not retrieve data from Whoop. Please try again later.',
  });
}

// ---------------------------------------------------------------------------
// T003 — GET /api/body (Body measurements proxy)
// ---------------------------------------------------------------------------
app.get('/api/body', async (req, res) => {
  if (!(await requireAuth(req, res))) return;
  try {
    const url = `${WHOOP_BASE}/v2/user/measurement/body`;
    const result = await whoopFetch(url);
    if (!result.ok) return whoopErrorResponse(res, result.status);
    res.json(result.data);
  } catch (err) {
    console.error('Body fetch error:', err.message);
    res.status(502).json({ error: 'whoop_api_error', message: 'Could not retrieve body data.' });
  }
});

// ---------------------------------------------------------------------------
// T004 — GET /api/recovery (Recovery collection proxy with date-range)
// ---------------------------------------------------------------------------
app.get('/api/recovery', async (req, res) => {
  if (!(await requireAuth(req, res))) return;
  try {
    const result = await whoopFetchAllPages('/v2/recovery', {
      start: req.query.start,
      end: req.query.end,
    });
    if (!result.ok) return whoopErrorResponse(res, result.status);
    res.json({ records: result.records });
  } catch (err) {
    console.error('Recovery fetch error:', err.message);
    res.status(502).json({ error: 'whoop_api_error', message: 'Could not retrieve recovery data.' });
  }
});

// ---------------------------------------------------------------------------
// T005 — GET /api/sleep (Sleep collection proxy with date-range)
// ---------------------------------------------------------------------------
app.get('/api/sleep', async (req, res) => {
  if (!(await requireAuth(req, res))) return;
  try {
    const result = await whoopFetchAllPages('/v2/activity/sleep', {
      start: req.query.start,
      end: req.query.end,
    });
    if (!result.ok) return whoopErrorResponse(res, result.status);
    res.json({ records: result.records });
  } catch (err) {
    console.error('Sleep fetch error:', err.message);
    res.status(502).json({ error: 'whoop_api_error', message: 'Could not retrieve sleep data.' });
  }
});

// ---------------------------------------------------------------------------
// T006 — GET /api/cycle (Cycle collection proxy with date-range)
// ---------------------------------------------------------------------------
app.get('/api/cycle', async (req, res) => {
  if (!(await requireAuth(req, res))) return;
  try {
    const result = await whoopFetchAllPages('/v2/cycle', {
      start: req.query.start,
      end: req.query.end,
    });
    if (!result.ok) return whoopErrorResponse(res, result.status);
    res.json({ records: result.records });
  } catch (err) {
    console.error('Cycle fetch error:', err.message);
    res.status(502).json({ error: 'whoop_api_error', message: 'Could not retrieve cycle data.' });
  }
});

// ---------------------------------------------------------------------------
// T007 — GET /api/workout (Workout collection proxy with date-range)
// ---------------------------------------------------------------------------
app.get('/api/workout', async (req, res) => {
  if (!(await requireAuth(req, res))) return;
  try {
    const result = await whoopFetchAllPages('/v2/activity/workout', {
      start: req.query.start,
      end: req.query.end,
    });
    if (!result.ok) return whoopErrorResponse(res, result.status);
    res.json({ records: result.records });
  } catch (err) {
    console.error('Workout fetch error:', err.message);
    res.status(502).json({ error: 'whoop_api_error', message: 'Could not retrieve workout data.' });
  }
});

// ---------------------------------------------------------------------------
// T008 — GET /api/whoop/all (Aggregate: fetch all 5 datasets at once)
// ---------------------------------------------------------------------------
app.get('/api/whoop/all', async (req, res) => {
  if (!(await requireAuth(req, res))) return;

  const { start, end } = req.query;

  try {
    // Fetch all 5 in parallel
    const [bodyResult, recoveryResult, sleepResult, cycleResult, workoutResult] =
      await Promise.all([
        whoopFetch(`${WHOOP_BASE}/v2/user/measurement/body`),
        whoopFetchAllPages('/v2/recovery', { start, end }),
        whoopFetchAllPages('/v2/activity/sleep', { start, end }),
        whoopFetchAllPages('/v2/cycle', { start, end }),
        whoopFetchAllPages('/v2/activity/workout', { start, end }),
      ]);

    // If any critical fetch failed, report the first error
    for (const r of [bodyResult, recoveryResult, sleepResult, cycleResult, workoutResult]) {
      if (!r.ok) return whoopErrorResponse(res, r.status);
    }

    const payload = {
      pull_date: new Date().toISOString().slice(0, 10),
      period: {
        start: start || null,
        end: end || null,
      },
      body: bodyResult.data,
      recovery: recoveryResult.records,
      sleep: sleepResult.records,
      cycles: cycleResult.records,
      workouts: workoutResult.records,
    };

    res.json(payload);
  } catch (err) {
    console.error('Aggregate fetch error:', err.message);
    res.status(502).json({ error: 'whoop_api_error', message: 'Could not retrieve all data.' });
  }
});

// ---------------------------------------------------------------------------
// Hevy integration — config & startup validation
// ---------------------------------------------------------------------------
const HEVY_API_KEY = process.env.HEVY_API_KEY || '';
if (!HEVY_API_KEY) {
  console.warn(
    'WARNING: HEVY_API_KEY is not set — Hevy-dependent routes (muscle balance retro) will return 503 until configured.\n' +
    '  Copy your key into .env (see .env.example).'
  );
}

function requireHevyConfig(res) {
  if (!HEVY_API_KEY) {
    res.status(503).json({
      error: 'hevy_not_configured',
      message: 'HEVY_API_KEY is not set. Add it to .env to enable this feature.',
    });
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Hevy API client
// ---------------------------------------------------------------------------
const HEVY_BASE = 'https://api.hevyapp.com/v1';

async function hevyFetch(path, query = {}) {
  const url = new URL(`${HEVY_BASE}${path}`);
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) url.searchParams.set(key, value);
  }
  const res = await fetch(url.toString(), {
    headers: { 'api-key': HEVY_API_KEY },
  });
  if (!res.ok) {
    return { ok: false, status: res.status, data: null };
  }
  return { ok: true, status: 200, data: await res.json() };
}

/**
 * Fetch Hevy workouts, paginating until either pages run out or a page's
 * workouts are entirely older than `since` (Hevy returns newest first).
 */
async function fetchHevyWorkoutsSince(since) {
  const sinceTime = new Date(since).getTime();
  const allWorkouts = [];
  let page = 1;
  const pageSize = 10;

  while (true) {
    const result = await hevyFetch('/workouts', { page, pageSize });
    if (!result.ok) return { ok: false, status: result.status, workouts: [] };

    const workouts = result.data.workouts || [];
    if (workouts.length === 0) break;

    let hitOlder = false;
    for (const w of workouts) {
      if (new Date(w.start_time).getTime() >= sinceTime) {
        allWorkouts.push(w);
      } else {
        hitOlder = true;
      }
    }

    if (hitOlder || page >= (result.data.page_count || page)) break;
    page++;
  }

  return { ok: true, status: 200, workouts: allWorkouts };
}

// Exercise -> muscle group mapping is cached in memory for the server's
// lifetime, since it only changes when the user adds new exercises in Hevy.
let exerciseMuscleMapCache = null;

// Fallback for custom exercises Hevy doesn't tag with a muscle group.
const FALLBACK_MUSCLE_MAP = {};

const MACRO_GROUP_MAP = {
  chest: 'chest',
  upper_back: 'back', lower_back: 'back', lats: 'back', traps: 'back',
  quadriceps: 'legs', hamstrings: 'legs', glutes: 'legs', calves: 'legs', adductors: 'legs', abductors: 'legs',
  shoulders: 'shoulders',
  biceps: 'arms', triceps: 'arms', forearms: 'arms',
  abdominals: 'core', obliques: 'core',
};
const MACRO_GROUPS = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'unmapped'];

function toMacroGroup(hevyMuscleGroup) {
  if (!hevyMuscleGroup) return 'unmapped';
  return MACRO_GROUP_MAP[hevyMuscleGroup] || 'unmapped';
}

/**
 * Fetch (and cache) exercise_template_id -> primary muscle group from Hevy.
 */
async function getExerciseMuscleMap() {
  if (exerciseMuscleMapCache) return exerciseMuscleMapCache;

  const map = {};
  let page = 1;
  const pageSize = 100;

  while (true) {
    const result = await hevyFetch('/exercise_templates', { page, pageSize });
    if (!result.ok) return null;

    const templates = result.data.exercise_templates || [];
    if (templates.length === 0) break;

    for (const t of templates) {
      map[t.id] = t.primary_muscle_group || FALLBACK_MUSCLE_MAP[t.title?.toLowerCase()] || null;
    }

    if (page >= (result.data.page_count || page)) break;
    page++;
  }

  exerciseMuscleMapCache = map;
  return map;
}

// ---------------------------------------------------------------------------
// Weekly volume computation
// ---------------------------------------------------------------------------

/** Monday 00:00 UTC for the week containing `date`. */
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getUTCDay() || 7; // Sun=0 -> 7
  d.setUTCDate(d.getUTCDate() - day + 1);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

/**
 * Roll up Hevy workouts into per-macro-muscle-group tonnage and set counts
 * for the week starting at `weekStart` (Monday 00:00 UTC).
 */
function computeWeeklyMuscleVolume(workouts, muscleMap, weekStart) {
  const weekEnd = addDays(weekStart, 7);
  const volume = {};
  for (const group of MACRO_GROUPS) volume[group] = { tonnage: 0, sets: 0 };

  for (const workout of workouts) {
    const start = new Date(workout.start_time);
    if (start < weekStart || start >= weekEnd) continue;

    for (const exercise of workout.exercises || []) {
      const macroGroup = toMacroGroup(muscleMap[exercise.exercise_template_id]);
      for (const set of exercise.sets || []) {
        volume[macroGroup].tonnage += (set.reps || 0) * (set.weight_kg || 0);
        volume[macroGroup].sets += 1;
      }
    }
  }

  return volume;
}

/**
 * Per-exercise tonnage history (from whatever workouts were fetched),
 * ordered chronologically.
 */
function computeExerciseTonnageHistory(workouts) {
  const history = {};

  for (const workout of workouts) {
    for (const exercise of workout.exercises || []) {
      const title = exercise.title || `Exercise ${exercise.exercise_template_id}`;
      let tonnage = 0;
      for (const set of exercise.sets || []) {
        tonnage += (set.reps || 0) * (set.weight_kg || 0);
      }
      if (!history[title]) history[title] = [];
      history[title].push({ date: workout.start_time, tonnage });
    }
  }

  for (const title of Object.keys(history)) {
    history[title].sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  return history;
}

function classifyTrend(sessions) {
  if (sessions.length < 2) return 'insufficient data';
  const first = sessions[0].tonnage;
  const last = sessions[sessions.length - 1].tonnage;
  if (last > first) return 'increasing';
  if (last < first) return 'decreasing';
  return 'flat';
}

// ---------------------------------------------------------------------------
// Recovery/strain correlation and flagging
// ---------------------------------------------------------------------------

async function getAverageRecovery(start, end) {
  const result = await whoopFetchAllPages('/v2/recovery', { start, end });
  if (!result.ok) return { ok: false, status: result.status, average: null };
  const scores = result.records
    .map(r => r.score?.recovery_score)
    .filter(s => typeof s === 'number');
  if (scores.length === 0) return { ok: true, status: 200, average: null };
  const average = scores.reduce((a, b) => a + b, 0) / scores.length;
  return { ok: true, status: 200, average };
}

function flagMuscleGroup(currentTonnage, trailingAverage, recoveryTrend) {
  if (trailingAverage === null) return 'balanced'; // no baseline yet — can't judge confidently
  if (currentTonnage > trailingAverage && recoveryTrend === 'down') return 'over-worked';
  if (currentTonnage < trailingAverage && recoveryTrend === 'up') return 'under-worked';
  return 'balanced';
}

// ---------------------------------------------------------------------------
// Weekly workout-completion progress — mirrors the same sport_id
// classification and 3-strength + 1-cardio target used by targets.html.
// ---------------------------------------------------------------------------
const WORKOUT_SPORT_MAP = {
  44: 'strength', 45: 'strength', 123: 'strength',
  0: 'cardio', 1: 'cardio',
};
const WEEKLY_TARGET = { strength: 3, cardio: 1 };

function computeCompletionProgress(workouts, weekStart) {
  const weekEnd = addDays(weekStart, 7);
  let strengthCount = 0;
  let cardioCount = 0;

  for (const w of workouts) {
    if (w.score_state !== 'SCORED') continue;
    const start = new Date(w.start);
    if (start < weekStart || start >= weekEnd) continue;

    const category = WORKOUT_SPORT_MAP[w.sport_id];
    if (category === 'strength') strengthCount++;
    else if (category === 'cardio') cardioCount++;
  }

  const target = WEEKLY_TARGET.strength + WEEKLY_TARGET.cardio;
  const completed = Math.min(strengthCount, WEEKLY_TARGET.strength) + Math.min(cardioCount, WEEKLY_TARGET.cardio);

  return { strengthCount, cardioCount, target, completed };
}

// ---------------------------------------------------------------------------
// Next-workout recommendation — directly resurfaces under-worked flags,
// never a separate heuristic.
// ---------------------------------------------------------------------------
function recommendNextWorkout(muscleGroups) {
  const underWorked = Object.entries(muscleGroups)
    .filter(([, data]) => data.flag === 'under-worked')
    .map(([group]) => group);

  if (underWorked.length === 0) {
    return { muscleGroups: [], message: 'No specific muscle group needs prioritizing — this week looks balanced.' };
  }
  return { muscleGroups: underWorked, message: `Prioritize: ${underWorked.join(', ')}` };
}

// ---------------------------------------------------------------------------
// GET /api/hevy/workouts (Hevy workout data proxy with date-range)
// ---------------------------------------------------------------------------
app.get('/api/hevy/workouts', async (req, res) => {
  if (!requireHevyConfig(res)) return;
  try {
    const start = req.query.start || '2026-01-01T00:00:00.000Z';
    const end = req.query.end ? new Date(req.query.end) : null;

    const result = await fetchHevyWorkoutsSince(start);
    if (!result.ok) {
      return res.status(502).json({ error: 'hevy_api_error', message: 'Could not retrieve workout data from Hevy.' });
    }

    const workouts = end ? result.workouts.filter(w => new Date(w.start_time) <= end) : result.workouts;
    res.json({ workouts });
  } catch (err) {
    console.error('Hevy workouts fetch error:', err.message);
    res.status(502).json({ error: 'hevy_api_error', message: 'Could not retrieve workout data from Hevy.' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/retro/muscle-balance (Weekly muscle balance retro)
// ---------------------------------------------------------------------------
app.get('/api/retro/muscle-balance', async (req, res) => {
  if (!requireHevyConfig(res)) return;
  if (!(await requireAuth(req, res))) return;

  try {
    const now = new Date();
    const currentWeekStart = getWeekStart(now);
    const fixedTrendStart = new Date('2026-01-01T00:00:00.000Z');
    const baselineStart = addDays(currentWeekStart, -28); // current + trailing 4 weeks
    const fetchStart = fixedTrendStart < baselineStart ? fixedTrendStart : baselineStart;

    const [muscleMap, workoutsResult] = await Promise.all([
      getExerciseMuscleMap(),
      fetchHevyWorkoutsSince(fetchStart),
    ]);

    if (!muscleMap || !workoutsResult.ok) {
      return res.status(502).json({
        error: 'hevy_api_error',
        source: 'hevy',
        message: 'Could not retrieve data from Hevy. Please try again later.',
      });
    }

    const currentWeekVolume = computeWeeklyMuscleVolume(workoutsResult.workouts, muscleMap, currentWeekStart);

    // Trailing 4-week average (excludes current week; stops at the fixed start date)
    const trailingWeeks = [];
    for (let i = 1; i <= 4; i++) {
      const weekStart = addDays(currentWeekStart, -7 * i);
      if (weekStart < fixedTrendStart) break;
      trailingWeeks.push(computeWeeklyMuscleVolume(workoutsResult.workouts, muscleMap, weekStart));
    }
    const partialBaseline = trailingWeeks.length < 4;

    const trailingAverages = {};
    for (const group of MACRO_GROUPS) {
      trailingAverages[group] = trailingWeeks.length === 0
        ? null
        : trailingWeeks.reduce((acc, w) => acc + w[group].tonnage, 0) / trailingWeeks.length;
    }

    // Recovery trend: this week's average recovery vs the prior week's
    const priorWeekStart = addDays(currentWeekStart, -7);
    const [currentRecovery, priorRecovery, whoopWorkoutsResult] = await Promise.all([
      getAverageRecovery(currentWeekStart.toISOString(), addDays(currentWeekStart, 7).toISOString()),
      getAverageRecovery(priorWeekStart.toISOString(), currentWeekStart.toISOString()),
      whoopFetchAllPages('/v2/activity/workout', {
        start: currentWeekStart.toISOString(),
        end: addDays(currentWeekStart, 7).toISOString(),
      }),
    ]);

    if (!currentRecovery.ok || !priorRecovery.ok || !whoopWorkoutsResult.ok) {
      return res.status(502).json({
        error: 'whoop_api_error',
        source: 'whoop',
        message: 'Could not retrieve data from Whoop. Please try again later.',
      });
    }

    let recoveryTrend = 'unknown';
    if (currentRecovery.average !== null && priorRecovery.average !== null) {
      if (currentRecovery.average > priorRecovery.average) recoveryTrend = 'up';
      else if (currentRecovery.average < priorRecovery.average) recoveryTrend = 'down';
      else recoveryTrend = 'flat';
    }

    const muscleGroups = {};
    for (const group of MACRO_GROUPS) {
      muscleGroups[group] = {
        tonnage: currentWeekVolume[group].tonnage,
        sets: currentWeekVolume[group].sets,
        trailingAverageTonnage: trailingAverages[group],
        recoveryTrend,
        flag: flagMuscleGroup(currentWeekVolume[group].tonnage, trailingAverages[group], recoveryTrend),
      };
    }

    const exerciseHistory = computeExerciseTonnageHistory(workoutsResult.workouts);
    const exercises = {};
    for (const [title, sessions] of Object.entries(exerciseHistory)) {
      exercises[title] = { sessions, trend: classifyTrend(sessions) };
    }

    const completionProgress = computeCompletionProgress(whoopWorkoutsResult.records, currentWeekStart);
    const recommendation = recommendNextWorkout(muscleGroups);

    res.json({
      weekStart: currentWeekStart.toISOString().slice(0, 10),
      partialBaseline,
      muscleGroups,
      exercises,
      completionProgress,
      recommendation,
    });
  } catch (err) {
    console.error('Muscle balance retro error:', err.message);
    res.status(502).json({ error: 'retro_error', message: 'Could not compute the weekly muscle balance retro.' });
  }
});

// ---------------------------------------------------------------------------
// GET /retro (Weekly muscle balance retro page)
// ---------------------------------------------------------------------------
app.get('/retro', (_req, res) => {
  res.sendFile(join(__dirname, 'public', 'retro.html'));
});

// ---------------------------------------------------------------------------
// POST /api/chat (Stub — coach-like explanation endpoint)
// ---------------------------------------------------------------------------
app.post('/api/chat', express.json(), (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'missing_prompt', message: 'Request body must include a "prompt" field.' });
  }
  // Stub: return a placeholder coach message that references the prompt
  const message = `Great question! Here's a quick summary of your training:\n\n${prompt}\n\nKeep pushing — consistency is what matters most!`;
  res.json({ message });
});

// ---------------------------------------------------------------------------
// Static file serving (after explicit routes so they take priority)
// ---------------------------------------------------------------------------
app.use(express.static(join(__dirname, 'public')));

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`Whoop Recovery Dashboard running at http://localhost:${PORT}`);
  if (refreshToken) {
    console.log('Found existing refresh token — will attempt silent authentication.');
  } else {
    console.log('No refresh token found — visit the app to connect your Whoop account.');
  }
});
