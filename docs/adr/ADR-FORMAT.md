# ADR Format

ADRs live in `docs/adr/` and use sequential numbering: `0001-slug.md`, `0002-slug.md`.

Create the `docs/adr/` directory lazily — only when the first ADR is needed.

## Template

```md
# {Short title of the decision}

**Status**: Accepted | Draft / Needs evidence | Superseded by ADR-NNNN

{1-3 sentences: context, decision, and why.}
```

An ADR can be a single paragraph. The value is in recording *that* a decision was made and *why*.

## Optional sections

- **Context** — background, what led to this decision
- **Decision** — what was decided
- **Consequences** — downstream effects
- **Evidence** — file paths, commands, or records that support the decision
- **Alternatives considered** — only when rejected alternatives are worth remembering

## Status rules

- **Accepted** — Evidence is required. Must list specific files, commands, code paths, or records.
- **Draft / Needs evidence** — Use when evidence is missing or insufficient.
- **Superseded by ADR-NNNN** — Replaced by a later decision.

If evidence is missing, the ADR must be marked as Draft / Needs evidence. Never mark an ADR as Accepted without evidence.

## When to write an ADR

All three must be true:

1. **Hard to reverse** — changing it later costs real effort
2. **Surprising without context** — a future reader would wonder "why?"
3. **The result of a real trade-off** — there were genuine alternatives

If any is missing, skip it.

## What qualifies

- Architectural shape (monorepo, event sourcing)
- Technology choices with lock-in (database, message bus, auth provider)
- Boundary/scope decisions (what owns what)
- Deliberate deviations from the obvious path
- Constraints not visible in code (compliance, performance SLAs)
- Rejected alternatives when non-obvious
