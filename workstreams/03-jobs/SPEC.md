# 03-jobs SPEC

## Current Slice

- Slice: `jobs-service-states-pagination-v1`
- Goal: move jobs list/detail reads behind an asynchronous local jobs service with explicit states, pagination, stale-request protection, and guarded demo application behavior.

## Slice Scope

- Add `miniprogram/services/jobs.{js,ts}` as the only page-facing jobs read boundary.
- Use shared mock runtime, error mapping, and submission guard primitives.
- Preserve search, filters, sorting, session-only favorites, and the existing detail route.
- Cover local-only normal, empty, error, timeout, offline, and unauthorized scenarios.
- Add reset-on-condition-change pagination and reject stale list responses.
- Keep all behavior local-only: no request, login, storage, socket, upload, or real application behavior.

## In Scope

- Search mock jobs by title, location, company, and labels.
- Filter by common worker needs and job zone, and sort by recommendation, pay, or distance.
- Show loading, normal, empty, error, timeout, offline, unauthorized, retry, page, and end states.
- Provide a complete job detail page backed by the shared mock data through the service.
- Keep favorites only in module memory for the current mini-program session.
- Show an explicit confirmation before the apply demo and an explicit local-only result afterward.
- Keep the existing green, off-white, large-type visual language.

## Out Of Scope

- Real job, login, favorite, application, contact, request, socket, upload, or backend behavior.
- Persistent favorites or application records.
- Route registration in `app.json`; `01-project-shell` owns shared route integration.
- Changes outside owned jobs pages, jobs data/service files, and this workstream folder.

## Acceptance

- `jobs.list` filters and sorts before paginating, validates paging input, and returns paging metadata.
- The list starts asynchronously, appends pages, shows the end state, resets on condition changes, and ignores stale responses.
- Local state controls cover normal, empty, error, timeout, offline, and unauthorized; retry restores normal mode with current conditions.
- Detail reads through `jobs.getById` and distinguishes missing id, not found, and service errors.
- Favorites remain in memory and are accessed by page code only through the jobs service.
- Confirmed `applyDemo` is asynchronous and guarded against duplicate submission; all copy remains explicit that no real application is sent.
- JS/TS mirrors, service/page execution, WXML handlers, route, touch targets, forbidden APIs, and owned scope are verified.
