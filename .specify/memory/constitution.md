<!--
Sync Impact Report
- Version change: 1.0.0 → 1.1.0 (MINOR — expanded secret management guidance)
- Modified principles:
  - I. OAuth2 Authorization Code Flow — added .env secret storage rules
- Modified sections:
  - Architecture Constraints — added .env and .gitignore requirements
- Added sections: None
- Removed sections: None
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

- The client ID and client secret MUST be stored in a `.env`
  file at the repository root.
- The `.env` file MUST be listed in `.gitignore` and MUST NOT
  be committed to version control.
- A `.env.example` file with placeholder keys (no real values)
  SHOULD be committed to document required variables.

**Rationale**: Organisation architectural standard. The
Authorization Code Flow with a client secret is the only
approved pattern for web applications calling APIs. Secrets
in `.env` keeps credentials out of version history.

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
- A `.env` file MUST hold all secrets; `.gitignore` MUST
  include `.env`.

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
  clarifications).docs: amend constitution to v1.1.0 (add .env secret management rules)
- All pull requests MUST verify compliance with the principles
  above before merge.

**Version**: 1.1.0 | **Ratified**: 2026-02-20 | **Last Amended**: 2026-02-20
