# Project Decisions

This file is the canonical global decision log. Record only decisions that affect more than one workstream.

| ID | Date | Decision | Applies To | Replaces |
|---|---|---|---|---|
| D-001 | 2026-06-18 | `00-main-control` coordinates and reviews; feature code belongs to dedicated workstream threads. | All workstreams | - |
| D-002 | 2026-06-18 | The current product slice uses mock data and does not claim real login, submission, payment, publishing, or backend behavior. | Frontend workstreams | - |
| D-003 | 2026-06-18 | Current status stays distributed in `STATE.json`; the main status table and retrieval index are generated views. | All workstreams | Manual status duplication |
| D-004 | 2026-06-18 | Child threads rotate after each SHIP and receive targeted context instead of the full main conversation. | All child threads | Long-lived module threads |
| D-005 | 2026-06-18 | Context retrieval is local and deterministic: metadata, keywords, freshness, authority, and duplicate suppression; no embeddings or external service. | Main control | Full-history reads |
| D-006 | 2026-06-19 | The accepted static frontend batch is SHIP; the next slice is backend architecture DEFINE/PLAN before real login, profile, application, publishing, or messaging implementation. | Product roadmap | More mock-only pages |
| D-007 | 2026-06-19 | Complete the profile, messages, jobs flow, employer flow, route integration, and frontend quality slices before starting backend BUILD; keep backend architecture v1 as a deferred reference. | Product roadmap | D-006 implementation order |
