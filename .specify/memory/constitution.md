<!--
Sync Impact Report
- Version change: N/A → 1.0.0 (initial ratification)
- Added principles:
  - I. OAuth2 Authorization Code Flow
  - II. Docs as Code
  - III. Simplicity
- Added sections:
  - Architecture Constraints
  - Documentation Standards
  - Governance
- Removed sections: None (initial version)
- Templates requiring updates:
  - .specify/templates/plan-template.md ✅ no changes needed
  - .specify/templates/spec-template.md ✅ no changes needed
  - .specify/templates/tasks-template.md ✅ no changes needed
- Follow-up TODOs: None
-->

# Whoop Performance Engine Constitution

## Core Principles

### I. OAuth2 Authorization Code Flow (NON-NEGOTIABLE)

All web-to-API communication MUST authenticate using the
OAuth2 Authorization Code Flow with a client secret.

- The web application MUST NOT use implicit grants, resource
  owner password credentials, or client-credentials-only flows
  for user-facing requests.
- A server-side component MUST hold the client secret; it MUST
  NOT be exposed to the browser.
- Token refresh MUST be handled server-side.

**Rationale**: Organisation architectural standard. The
Authorization Code Flow with a client secret is the only
approved pattern for web applications calling APIs.

### II. Docs as Code

Developer documentation MUST be maintained as code inside the
repository and follow two organisational standards:

- Documentation structure MUST follow the Diataxis framework
  (tutorials, how-to guides, reference, explanation).
- Documentation content MUST use templates from the
  Good Docs Project.
- Documentation MUST be reviewed in pull requests alongside
  the code it describes.

**Rationale**: Organisation architectural standard. Docs as
code ensures documentation stays current, reviewable, and
versioned with the source.

### III. Simplicity

The application is a minimal web page that calls an API.

- Features MUST be limited to rendering the page and making
  authenticated API calls.
- No additional frameworks, abstractions, or capabilities
  beyond what is required to fulfil the above.
- YAGNI: do not add functionality until it is needed.

**Rationale**: A minimal surface area reduces maintenance
burden, security exposure, and cognitive load.

## Architecture Constraints

- The project is a single web page with a lightweight
  server-side component (backend-for-frontend) that holds the
  OAuth2 client secret and proxies API calls.
- The frontend MUST be static HTML/CSS/JS unless a framework
  is explicitly justified and approved.
- The backend MUST serve only the page and the OAuth2 /
  token-proxy endpoints.

## Documentation Standards

- A `docs/` directory MUST exist at the repository root.
- Content MUST be organised into Diataxis categories:
  `docs/tutorials/`, `docs/how-to/`, `docs/reference/`,
  `docs/explanation/`.
- Each document MUST start from a Good Docs Project template.

## Governance

- This constitution supersedes conflicting practices.
- Amendments require a pull request with a clear rationale and
  version bump per semantic versioning (MAJOR for principle
  removal/redefinition, MINOR for additions, PATCH for
  clarifications).
- All pull requests MUST verify compliance with the principles
  above before merge.

**Version**: 1.0.0 | **Ratified**: 2026-02-20 | **Last Amended**: 2026-02-20
