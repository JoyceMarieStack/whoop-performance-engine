# whoop-performance-engine Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-20

## Active Technologies
- Node.js 20 LTS, ESM modules (`"type": "module"`) + Express 5.2.1, dotenv 17.3.1 (existing); @scalar/api-reference CDN bundle (new, no npm install) (005-redocly-api-docs)
- `.env` file for OAuth tokens (unchanged) (005-redocly-api-docs)

- Node.js 20 LTS (JavaScript, ESM modules) + Express (HTTP server + routing), dotenv (`.env` loading) (003-whoop-dashboard)

## Project Structure

```text
src/
tests/
```

## Commands

npm test && npm run lint

## Code Style

Node.js 20 LTS (JavaScript, ESM modules): Follow standard conventions

## Recent Changes
- 005-redocly-api-docs: Added Node.js 20 LTS, ESM modules (`"type": "module"`) + Express 5.2.1, dotenv 17.3.1 (existing); @scalar/api-reference CDN bundle (new, no npm install)

- 003-whoop-dashboard: Added Node.js 20 LTS (JavaScript, ESM modules) + Express (HTTP server + routing), dotenv (`.env` loading)

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
