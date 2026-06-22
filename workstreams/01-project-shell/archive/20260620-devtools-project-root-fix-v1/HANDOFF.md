# 01-project-shell HANDOFF

> 仅保留最新交接摘要；迁移前完整记录见 `archive/initial-migration-2026-06-18/HANDOFF.md`。

## Result

Root project.config.json now declares miniprogramRoot so repository-root imports resolve the integrated miniprogram/app.json without changing existing project settings.

- Phase: `REVIEW`
- State: `accepted`
- Slice: `devtools-project-root-fix-v1`

## Changed Scope

- `project.config.json`
- `workstreams/01-project-shell/**`

## Verification

- passed: Root project JSON, exact miniprogramRoot, existing settings, resolved app.json, and all prior shell contracts pass verify.cjs.（workstreams/01-project-shell/verify.cjs）
- passed: Context validation and refresh pass after the current-slice handoff update.（workstreams/01-project-shell/HANDOFF.md）
- passed: 根 project.config.json 增加 miniprogramRoot 后路径解析与原壳契约复验通过。（workstreams/01-project-shell/HANDOFF.md）

## Risks And Blockers

- 无。

## Next Action

由 00-main-control 执行当前切片的 SHIP 与归档。
