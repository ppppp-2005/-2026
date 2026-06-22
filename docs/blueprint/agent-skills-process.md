# Agent Skills 开发生命周期

## 生命周期

所有功能切片按以下顺序推进：

```text
DEFINE -> PLAN -> BUILD -> VERIFY -> REVIEW -> SHIP
```

- `DEFINE`：在 `SPEC.md` 写清目标、边界和验收标准。
- `PLAN`：在 `TASKS.md` 只保留当前切片的小任务。
- `BUILD`：由对应 workstream 子线程在授权路径内实现。
- `VERIFY`：提供静态检查、测试、微信开发者工具或截图证据。
- `REVIEW`：总控或质量线程检查边界、行为、可维护性和真实性。
- `SHIP`：归档切片、释放旧线程，并允许下一切片开始。

## 上下文要求

- 开始任务前先查询本地索引，不批量读取全部 `HANDOFF.md`。
- 子线程默认不继承完整主对话，只接收当前目标所需信息。
- 子线程结束时更新 `STATE.json`、`TASKS.md` 和 `HANDOFF.md`。
- 详细日志和已完成清单进入 `archive/`。
- 主线程接受交接后运行 `validate` 和 `refresh`。
- 状态冲突、验证不足或越界修改必须退回 owner，不得进入 SHIP。

## 验收门槛

进入下一阶段前必须满足：

1. 当前状态文件通过 schema 与一致性校验。
2. 变更路径属于 workstream 所有权范围。
3. VERIFY 证据可重复执行或人工复核。
4. REVIEW 的 P0/P1 已关闭或明确阻塞。
5. SHIP 前已归档当前切片，下一切片将使用新线程。

当前进度只读取 `workstreams/00-main-control/STATUS.md`，不在生命周期文档中维护易过期的模块状态。

