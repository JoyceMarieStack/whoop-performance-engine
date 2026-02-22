<!--
Sync Impact Report
- Version change: 1.1.0 → 2.0.0 (MAJOR — full simplification
  of constitution structure)
- Modified principles:
  - I. OAuth2 Authorization Code Flow — condensed, kept
    NON-NEGOTIABLE
  - II. Docs as Code — retained, shortened
  - III. Simplicity — retained, shortened
- Removed sections:
  - Architecture Constraints (folded into Simplicity principle)
  - Documentation Standards (folded into Docs as Code principle)
- Added sections: None
- Templates requiring updates:
  - .specify/templates/plan-template.md ✅ no changes needed
    (Constitution Check section is dynamically filled)
  - .specify/templates/spec-template.md ✅ no changes needed
  - .specify/templates/tasks-template.md ✅ no changes needed
- Follow-up TODOs: None
-->

# Whoop Performance Engine Constitution

## Core Principles

### I. OAuth2 Authorization Code Flow (NON-NEGOTIABLE)

All API communication MUST use OAuth2 Authorization Code
Flow with a server-held client secret.

- Secrets MUST live in `.env` (excluded via `.gitignore`).
- A `.env.example` with placeholder keys SHOULD be committed.

### II. Docs as Code

Documentation MUST live in the repo under `docs/`, organised
by Diataxis (tutorials, how-to, reference, explanation).

### III. Simplicity

This is a single web page backed by a lightweight server
that proxies authenticated API calls. Nothing more.

- Static HTML/CSS/JS frontend only.
- No frameworks or abstractions beyond what is needed.
- YAGNI: do not add it until you need it.

## Governance

- This constitution supersedes conflicting practices.
- Amendments require a version bump (MAJOR for removals,
  MINOR for additions, PATCH for clarifications).

**Version**: 2.0.0 | **Ratified**: 2026-02-20 | **Last Amended**: 2026-02-22
