# 06-backend-api SPEC

## Current Slice

- Slice: `backend-architecture-v1`
- Lifecycle: `DEFINE -> PLAN`
- Goal: produce a concise, decision-complete backend architecture plan before any backend implementation.

## Locked Architecture

- Node.js + TypeScript modular monolith.
- PostgreSQL transactional database.
- JSON REST API under `/api/v1`.
- Server-side WeChat code exchange; app credentials and WeChat session material remain server-only.
- Cryptographically random opaque sessions with only token hashes persisted.
- `seeker`, `employer`, and `admin` roles plus ownership and organization-scope authorization.
- Private object storage for future uploads.
- Docker-based local, test, staging, and production layouts.

Exact framework, ORM/query builder, cloud vendor, and package versions are validated at BUILD entry and are not PLAN blockers.

## Plan Deliverable

`docs/blueprint/backend-design-placeholder.md` defines:

- Domain modules and ownership boundaries.
- Core entities, relationships, constraints, and lifecycle statuses.
- WeChat authentication, session lifecycle, and authorization flow.
- Endpoint groups and response, error, pagination, concurrency, and idempotency contracts.
- Frontend service boundaries and per-service mock-to-API cutover.
- Validation, security, privacy, file handling, audit, and observability requirements.
- Docker-based environment and deployment layout.
- Phased BUILD, VERIFY, and REVIEW gates.

## Boundaries

- No backend source code, package manifest, migration, credential, database, or live WeChat integration in this slice.
- No mini-program changes or replacement of mock data.
- No online chat, payment, recommendation engine, management UI, or cloud-vendor procurement.

## Acceptance Criteria

- Locked decisions are explicit and do not depend on vendor selection.
- Data, authentication, authorization, API, frontend cutover, security, privacy, audit, and environment contracts are actionable for BUILD planning.
- Each implementation phase has verification evidence and review gates before SHIP.
- Main control reviews and accepts the architecture before creating a BUILD slice.
