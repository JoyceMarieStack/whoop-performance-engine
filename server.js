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
