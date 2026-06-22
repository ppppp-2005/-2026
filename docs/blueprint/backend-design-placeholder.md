# Backend Architecture v1

## Status And Scope

This document is the decision-complete plan for slice `backend-architecture-v1`. It defines the first real backend boundary without creating server code, migrations, credentials, or live integrations.

In scope: authentication, authorization, users, employers, jobs, resumes, applications, notifications, future file uploads, administration, audit, API contracts, frontend cutover, and environment layout.

Out of scope for this plan: online chat, payments, recommendation algorithms, a management UI, production data migration, and vendor procurement.

## Locked Decisions

- Architecture: Node.js + TypeScript modular monolith, split by domain modules with explicit internal interfaces.
- Database: PostgreSQL as the transactional source of truth.
- API: JSON REST under `/api/v1`.
- Login: the server exchanges the short-lived WeChat login code; WeChat app credentials and returned session material remain server-side.
- Sessions: cryptographically random opaque bearer tokens; only token hashes are persisted.
- Roles: `seeker`, `employer`, and `admin`; roles do not replace resource ownership checks.
- Files: private object storage for future uploads; the database stores metadata and references only.
- Runtime: Docker-based local, test, and deployment layouts.

Exact web framework, ORM/query builder, queue implementation, object-storage provider, cloud vendor, and package versions are implementation-time validation decisions. They must be recorded before BUILD dependencies are installed, but they do not block architecture review.

## System Shape

The first deployment is one API process plus an optional worker process built from the same repository. Modules share one PostgreSQL database but own their tables and may call each other only through exported application services. Background delivery uses a transactional outbox so a business write and its event commit together.

### Modules

- `identity-access`: WeChat identity exchange, sessions, roles, authentication, and authorization policies.
- `users`: user lifecycle, seeker profile, contact details, and privacy preferences.
- `organizations`: employer organizations, verification state, and employer memberships.
- `jobs`: job drafts, moderation, publication, search filters, and public job reads.
- `resumes`: seeker resumes, skills, experience, and active/archive lifecycle.
- `applications`: submission, immutable resume snapshot, workflow transitions, and employer feedback.
- `notifications`: in-app notifications and delivery records; real-time chat is excluded from v1.
- `files`: object metadata, ownership, upload authorization, scanning state, and retention.
- `administration`: organization/job review and account moderation APIs; no admin UI in this slice.
- `audit-platform`: audit records, outbox processing, health checks, request IDs, and operational telemetry.

## Data Model

All primary identifiers are UUIDs exposed as opaque strings. Timestamps are stored in UTC. Mutable records carry `created_at`, `updated_at`, and an integer `version` for optimistic concurrency where relevant.

### Core Entities And Relationships

- `User`: account root; status `active | suspended | deleted`.
- `WechatIdentity`: belongs to one user; unique by WeChat application and `openid`; `unionid` is optional and unique when present.
- `Session`: belongs to one user; stores token hash, expiry, last-use metadata, and status `active | revoked | expired`.
- `UserRole`: joins a user to `seeker | employer | admin`. Seeker may be enabled by normal onboarding; employer/admin grants require controlled workflows.
- `SeekerProfile`: optional one-to-one user profile containing only required personal and contact data.
- `Organization`: employer entity; status `pending_review | verified | rejected | suspended`.
- `OrganizationMember`: joins a user to an organization with membership level `owner | recruiter`; status `invited | active | removed`.
- `Job`: belongs to one organization and its creator; status `draft | pending_review | published | paused | closed | rejected`.
- `Resume`: belongs to one seeker; status `draft | active | archived`; child rows hold skills and work experience.
- `Application`: belongs to one seeker and one job and references an immutable resume snapshot; status `submitted | viewed | shortlisted | rejected | withdrawn | hired`.
- `Notification`: belongs to one user; status `unread | read | archived`; references a business event where applicable.
- `FileObject`: belongs to an uploader and optional domain record; status `pending | ready | quarantined | deleted`.
- `AuditLog`: immutable actor, action, target, request ID, timestamp, and sanitized before/after metadata.
- `OutboxEvent`: records committed domain events; status `pending | processing | delivered | failed`.

One seeker may own multiple resumes but only one may be active. One seeker may apply to a job once, enforced by a unique `(job_id, seeker_user_id)` constraint. Published jobs require a verified organization. Application transitions are forward-only except `withdrawn`, which the seeker may choose before `hired`; employers cannot rewrite seeker-owned resume data.

## Authentication And Authorization

1. The mini program calls `wx.login()` and sends its short-lived code to `POST /api/v1/auth/wechat`.
2. The API exchanges that code with WeChat using server-held `appid` and secret, validates the result, and never returns or logs WeChat `session_key`.
3. In one transaction, the API finds or creates `WechatIdentity` and `User`, then issues at least 256 bits of random session-token entropy.
4. The raw token is returned once. A deterministic cryptographic hash of the token plus expiry and revocation metadata is stored in `Session`.
5. The client sends `Authorization: Bearer <token>`. The API hashes the token, loads an active unexpired session, and attaches the user and role set to the request.
6. Login rotates the current device session; logout revokes it. Passwords and self-issued role claims are not part of this flow.

Authorization evaluates, in order: authenticated user, account status, required role, resource ownership or active organization membership, organization verification, and resource workflow status. `401` means missing/invalid authentication; `403` means an authenticated caller lacks permission. Employer access is always scoped to an organization. Admin actions require an explicit admin role and an audit entry. Phone authorization, if introduced, is exchanged server-side with explicit user consent and is not required for initial login.

## REST Endpoint Groups

- `/api/v1/auth/*`: WeChat login, session refresh/rotation, logout.
- `/api/v1/me/*`: current user, roles, preferences, and seeker profile.
- `/api/v1/jobs/*`: public published-job list and detail.
- `/api/v1/resumes/*`: seeker-owned resume CRUD and activation.
- `/api/v1/applications/*`: seeker submission, list, detail, and withdrawal.
- `/api/v1/employer/organizations/*`: organization profile and membership-scoped operations.
- `/api/v1/employer/jobs/*`: employer job CRUD and review/publication requests.
- `/api/v1/employer/applications/*`: applications for jobs owned by the caller's organization and allowed status transitions.
- `/api/v1/notifications/*`: current-user notification list and read/archive actions.
- `/api/v1/files/*`: future upload intent, completion, and metadata; binary data goes directly to private object storage.
- `/api/v1/admin/*`: organization/job moderation and account actions.
- `/health/live` and `/health/ready`: unauthenticated operational probes outside the versioned business API.

## API Contract

Successful single-resource responses use `{ "data": { ... } }`. List responses use `{ "data": [...], "meta": { "nextCursor": "...", "hasMore": true } }`. Errors use `{ "error": { "code": "STABLE_MACHINE_CODE", "message": "safe message", "details": [], "requestId": "..." } }`; production errors never expose stack traces or upstream secrets.

Dates are ISO 8601 UTC strings, IDs are opaque strings, booleans are booleans, and absent optional values are consistently `null` or omitted according to the endpoint schema. Breaking changes require a new API version; additive fields are allowed within v1.

Cursor pagination is the default for growing collections. `limit` defaults to 20 and is capped at 100. Cursors encode the complete stable sort position, normally `created_at DESC, id DESC`, and clients must not inspect them.

Expected statuses include `200`, `201`, `204`, `400`, `401`, `403`, `404`, `409`, `422`, `429`, and `5xx`. Domain validation uses stable error codes. Updates to versioned records require the current `version`; stale writes return `409 CONFLICT_VERSION`.

`Idempotency-Key` is required for duplicate-sensitive commands, initially application submission and future upload intent creation. Keys are scoped to actor, method, and route for at least 24 hours. Repeating the same key and payload returns the original result; reusing it with a different payload returns `409 IDEMPOTENCY_KEY_REUSED`. The database uniqueness constraint remains the final duplicate guard.

## Frontend Service Boundary And Mock Cutover

Mini-program pages continue to depend on domain service interfaces under `miniprogram/services`; pages must not call `wx.request` or interpret transport errors directly. Service boundaries are `auth`, `users`, `jobs`, `resumes`, `applications`, `employer`, and `notifications`.

Each service has a mock adapter and an API adapter returning the same frontend domain shapes. A shared transport owns base URL, bearer token attachment, request ID handling, timeout/retry policy, and API-error mapping. DTO mappers isolate wire fields from page view models.

Cutover is per service behind environment configuration, not a page rewrite: approve an endpoint contract, add contract fixtures, verify mock/API parity, enable the API adapter in test, run end-to-end checks, then enable it for the target deployment. Mutations are not silently retried unless protected by an idempotency key.

## Validation, Security, Privacy, And Audit

- Validate path, query, headers, and JSON bodies against explicit schemas; reject unknown sensitive fields and enforce length, enum, format, and collection limits.
- Use parameterized database access, transaction boundaries for state changes, least-privilege database roles, and dependency/container scanning in CI.
- Require TLS outside local development. Store secrets in an environment secret facility, never source control or client bundles; rotate compromised session and WeChat credentials.
- Rate-limit login, public search, uploads, and mutations by appropriate IP/session/user keys. Apply request body limits and timeouts.
- Never log raw tokens, login codes, `session_key`, authorization headers, phone numbers, identity documents, or resume bodies. Treat `openid` and IP/device metadata as personal data.
- Collect only product-required personal data, record consent where needed, restrict fields by role, encrypt storage and backups, define retention/deletion before collecting documents, and support account export/deletion workflows.
- Keep object storage private. Use short-lived upload/download authorization, allowlisted MIME types and sizes, checksum verification, malware scanning, quarantine, and orphan cleanup before files become usable.
- Audit authentication changes, role grants, employer membership changes, moderation, job publication, application transitions, exports, and destructive actions. Audit entries are append-only and exclude secrets and full sensitive payloads.
- Emit structured logs, metrics, traces/request IDs, and security alerts with environment-specific retention.

## Environments And Delivery Layout

- `local`: Docker Compose runs API, worker, PostgreSQL, and an object-storage-compatible emulator when file work begins; WeChat exchange is mocked unless explicit sandbox credentials are supplied outside source control.
- `test`: disposable Docker services use migrations from zero, deterministic fixtures, mocked WeChat/object-storage boundaries, and isolated databases per test run where practical.
- `staging`: production-like Docker images and managed dependencies, separate credentials/data, real integration sandbox where available, and deployment smoke tests.
- `production`: the same immutable images, managed PostgreSQL/object storage, secret injection, encrypted backups with restore drills, health checks, monitoring, and controlled rollout/rollback.

Configuration is environment-driven and validated at process startup. Schema migrations are versioned, forward-reviewed artifacts executed by a dedicated deployment step, not automatically by every API replica. The API remains stateless apart from external stores so replicas can scale horizontally.

## BUILD, VERIFY, And REVIEW Gates

### Phase 1: Foundation And Identity

BUILD: select validated framework/ORM versions, scaffold module boundaries and Docker layout, create initial migrations, implement API contract plumbing, WeChat adapter, opaque sessions, roles, audit, and health checks.

VERIFY: type/lint/unit checks; migration up/down and clean-database tests; mocked WeChat integration tests; session expiry/revocation tests; authorization matrix; secret/log redaction checks; container health smoke test.

REVIEW gate: architecture conformance, schema/migration review, threat-model review, and no credential or session material exposed to the client/logs.

### Phase 2: Organizations And Jobs

BUILD: organizations, memberships, moderation, employer job lifecycle, and public job reads with pagination/filtering.

VERIFY: workflow/ownership integration tests, published-only public queries, pagination stability, optimistic concurrency, audit coverage, and service contract fixtures.

REVIEW gate: employer isolation and moderation rules approved; jobs API ready for a test-only frontend cutover.

### Phase 3: Resumes, Applications, And Notifications

BUILD: resume lifecycle, immutable application snapshots, idempotent submission, employer transitions, outbox, and in-app notifications.

VERIFY: duplicate/race tests, state-transition matrix, privacy field-access tests, outbox recovery tests, mock/API parity, and end-to-end seeker/employer flows.

REVIEW gate: data minimization and retention approved; cross-role authorization reviewed; targeted frontend services may cut over.

### Phase 4: Files And Production Readiness

BUILD: only when required, implement private object-storage flow, scanning/quarantine, operational dashboards, backup/restore, and rollout procedures.

VERIFY: upload abuse tests, signed-access expiry, orphan cleanup, load/rate-limit tests, dependency/image scans, restore drill, staging smoke test, and rollback rehearsal.

REVIEW gate: security/privacy/operations sign-off and explicit main-control acceptance before production deployment. Each phase must finish VERIFY and REVIEW before the next feature slice reaches SHIP.
