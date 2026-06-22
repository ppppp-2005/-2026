# 02-home-ui SPEC

## Current Slice

- Slice: `runtime-arrow-copy-fix-v1`
- Goal: Render a clear quick-entry arrow in the WeChat simulator instead of the literal text `&gt;`.

## Scope

- Replace the escaped arrow entity in the existing home quick-entry card markup with a literal ASCII `>` glyph.
- Preserve the existing layout, styling, handlers, and navigation behavior.
- Add focused verifier coverage that rejects the escaped-entity regression.

## Acceptance

- The quick-entry arrow node contains a literal `>` and no `&gt;` or `&amp;gt;` entity.
- `node workstreams/02-home-ui/verify.cjs` passes.
- Only the home WXML, verifier, and current workstream records change.

## Out Of Scope

- No WXSS redesign, JavaScript/TypeScript, route, backend, API, or other-page changes.
- No REVIEW, acceptance, archive, or SHIP work in this slice thread.
