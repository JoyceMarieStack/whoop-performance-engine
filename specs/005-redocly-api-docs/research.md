# Research: Scalar API Documentation Landing Page

**Feature**: 005-redocly-api-docs | **Date**: 2026-02-21

## R1 — Scalar CDN Integration Pattern

**Decision**: Load `@scalar/api-reference` from jsDelivr CDN at `https://cdn.jsdelivr.net/npm/@scalar/api-reference`.

**Rationale**: Scalar publishes a standalone UMD bundle to npm. jsDelivr serves it directly — no npm install, no build step, no bundler. This aligns with the project's zero-build philosophy and the constitution's Simplicity principle.

**Alternatives considered**:
- npm install + import — requires a bundler or `<script type="module">` with bare specifiers (not supported by browsers). Rejected.
- unpkg CDN — works but jsDelivr has better global CDN performance and is the recommended CDN in Scalar's docs. Rejected.
- Pinned version (e.g., `@scalar/api-reference@1.44.25`) — provides reproducibility but prevents automatic security/bug fixes. Deferred: use unpinned for now, pin if stability issues arise.

## R2 — Minimal HTML Integration

**Decision**: Use `Scalar.createApiReference('#app', { url, darkMode })` pattern.

**Rationale**: The CDN bundle exposes a global `Scalar` object. Calling `createApiReference(selector, config)` mounts the full docs UI into the target element. This is the recommended pattern from Scalar's README.

**Minimal HTML**:
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

**Alternatives considered**:
- `<script id="api-reference" data-url="..." type="application/json">` approach (older Scalar pattern) — still works but `createApiReference()` is the current recommended API. Rejected.

## R3 — "Try It" Functionality

**Decision**: Rely on Scalar's built-in "Try It" panel with no proxy.

**Rationale**: The "Try It" / "Test Request" feature is included in the open-source CDN bundle by default. It sends real HTTP requests from the browser via `fetch`. Since the Scalar docs page and BFF API are served from the same Express server (same origin), no CORS headers or proxy are needed.

**Key config options**:
- `hideTestRequestButton: true` — hides "Try It" (we want it visible, so omit this).
- `proxyUrl: '...'` — for cross-origin requests via a proxy (not needed for same-origin). Omit.

**Alternatives considered**:
- Scalar proxy (`https://proxy.scalar.com`) — needed only for cross-origin. Our same-origin setup doesn't require it. Rejected.
- Custom Express CORS middleware — unnecessary since same-origin. Rejected.

## R4 — OpenAPI Spec Serving

**Decision**: Copy and update the OpenAPI spec to `public/openapi.yaml` for static file serving.

**Rationale**: Express already serves `public/` as static files. Placing the spec at `public/openapi.yaml` makes it available at `/openapi.yaml` — the URL Scalar will fetch. The spec is updated to reflect current routes (post-Features 004 and 005).

**Changes needed to the OpenAPI spec**:
1. `/oauth/callback` → `/callback` (corrected in Feature 004)
2. `/dashboard` description → redirect to `/` (corrected in Feature 004)
3. `GET /` description → Scalar API docs page (Feature 005)
4. Add info about the Scalar docs page in the API description

**Alternatives considered**:
- Serve from a dedicated API route (e.g., `GET /api/openapi.yaml`) — adds unnecessary route complexity. Rejected.
- Keep spec only in `specs/` directory — Scalar can't fetch it from there (not in `public/`). Rejected.
- Symlink from `specs/` to `public/` — fragile and platform-dependent. Rejected.

## R5 — Scalar Configuration for This Project

**Decision**: Use minimal configuration: `url`, `darkMode`, `theme`.

**Rationale**: The project is a single-user demo app. Advanced features (auth persistence, hidden clients, custom CSS) aren't needed. Dark mode matches the project's existing aesthetic.

**Selected config**:
```js
{
  url: '/openapi.yaml',
  darkMode: true,
  theme: 'default',
}
```

**Relevant options not used**:
- `persistAuth: true` — not needed; auth is server-side via cookies/tokens, not Scalar's auth UI.
- `forceDarkModeState: 'dark'` — could lock dark mode permanently, but letting users toggle is friendlier.
- `hideModels: false` (default) — keep showing schemas, they're useful.
- `telemetry: true` (default) — anonymous usage tracking; acceptable for a demo app.
- `showSidebar: true` (default) — keep the sidebar for navigation.

**Alternatives considered**:
- Custom CSS to match existing `styles.css` colours — over-engineering for a page replacement. Scalar's defaults are clean. Rejected.
- `layout: 'classic'` — less modern look. `'modern'` (default) is preferred. Rejected.
