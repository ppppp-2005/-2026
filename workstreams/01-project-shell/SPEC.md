# 01-project-shell SPEC

## Responsibility

Maintain the shared Mini Program shell and frontend service foundation.

## Current Slice

- Slice: `frontend-service-foundation-v1`
- Goal: provide backend-independent environment, error, transport, mock, submission, and adapter-selection contracts for future domain services.
- Lifecycle: DEFINE -> PLAN -> BUILD -> VERIFY; stop at `ready_for_review`.

## Boundaries

- Changes are limited to `miniprogram/services/**`, `miniprogram/config/**`, and `workstreams/01-project-shell/**` outside old archives.
- Do not change `app.js`, `app.ts`, `app.json`, pages, data, backend, or database code.
- Do not call real WeChat request, login, storage, socket, or upload APIs.
- Do not implement real domain endpoints or accept, archive, review, or ship this slice.

## Acceptance

- `local`, `test`, `staging`, and `production` explicitly define data mode, API base URL, and timeout; API mode without a base URL fails closed.
- Errors normalize to validation/offline/timeout/unauthorized/network/server/unknown with short Chinese page messages.
- An injected transport owns timeout, bearer/request ID headers, and error normalization without calling `wx.request`.
- Deterministic mocks cover success/loading-to-success delay/empty/error/timeout/offline/unauthorized and validated page/end pagination.
- A submission guard rejects duplicate in-flight mutations and transport never retries mutations automatically.
- A registry selects mock/API adapters for auth/users/jobs/resumes/applications/employer/notifications and rejects unknown service-mode keys.
- JS/TS mirrors match exactly; README documents page and environment boundaries.
- `verify.cjs`, context validation, and context refresh pass before handoff at `VERIFY / ready_for_review`.
