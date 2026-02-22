# Quickstart: Scalar API Documentation Landing Page

**Feature**: 005-redocly-api-docs | **Date**: 2026-02-21

## What Changes

Replace the current landing page with an interactive Scalar API Reference. Users visit `/` and see live API docs with a "Try It" panel for calling endpoints.

## Files to Change

| File | Action | Description |
|------|--------|-------------|
| `public/index.html` | **Replace** | Replace 248-line hero/dashboard page with ~20-line Scalar HTML shell |
| `public/openapi.yaml` | **Create** | Updated OpenAPI spec served as static asset for Scalar to fetch |
| `public/css/styles.css` | **Delete** | Unused after Scalar replacement (Scalar brings its own styles) |
| `server.js` | **No change** | All routes remain unchanged; `GET /` already serves `public/index.html` |

## Implementation Steps

### Step 1: Create `public/openapi.yaml`

Copy the updated OpenAPI spec from `specs/005-redocly-api-docs/contracts/openapi.yaml` to `public/openapi.yaml`. This is the spec Scalar will render.

Key updates from the old spec:
- `/oauth/callback` → `/callback`
- `/dashboard` → redirect description
- `GET /` → docs page description
- Added `tags` for grouping (Documentation, Authentication, Recovery)
- Added response `example` values for better "Try It" experience

### Step 2: Replace `public/index.html`

Replace the entire file with:

```html
<!doctype html>
<html>
  <head>
    <title>Whoop Performance Engine — API Reference</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <noscript>JavaScript is required to view this API reference.</noscript>
    <div id="app"></div>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
    <script>
      Scalar.createApiReference('#app', {
        url: '/openapi.yaml',
        darkMode: true,
      })
    </script>
  </body>
</html>
```

### Step 3: Delete `public/css/styles.css`

Remove the unused CSS file. Scalar provides its own styling.

### Step 4: Verify

1. `node server.js`
2. Open `http://localhost:3000/`
3. Confirm Scalar docs render with all endpoints
4. Click "Try It" on `/api/status` — should return `{"authenticated": false}`
5. Navigate to `/auth/whoop` to authenticate
6. Return to `/` and "Try It" on `/api/recovery` — should return live data

## No Server Changes Required

Express `GET /` already serves `public/index.html` via static middleware. The Scalar page is a static HTML file — no new routes, no new dependencies, no build step.
