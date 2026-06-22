# 多对话 Workflow

## 总原则

`00-main-control` 是总控线程，只负责产品蓝图、任务拆分、上下文检索、模块协调、验收和状态快照。实质功能开发必须由对应 workstream 子线程完成。

项目按 `DEFINE -> PLAN -> BUILD -> VERIFY -> REVIEW -> SHIP` 推进。每个 SHIP 切片完成后归档当前记录，并为下一切片创建新线程。

## 状态事实源

- `STATE.json`：模块当前阶段、状态、负责人、阻塞、下一步和证据。
- `SPEC.md`：模块稳定范围与验收标准。
- `TASKS.md`：仅保留当前切片任务。
- `HANDOFF.md`：仅保留最新交接摘要。
- `archive/`：已完成任务、旧交接和线程轮换历史。
- `docs/blueprint/decisions.md`：跨模块决策唯一记录。

总览使用自动生成的 `workstreams/00-main-control/STATUS.md`。不得手动复制线程状态到本文件，也不得手动修改生成的状态表或索引。

## 强制流程

1. 总控通过本地索引检索相关状态、决策和代码路径。
2. 新建或选择对应 workstream，并确认四件套完整。
3. 给子线程发送最小上下文包：目标、阶段、精确读取文件、允许范围、禁止范围、依赖和验收条件。
4. 子线程只实现当前切片，并更新自身 `STATE/TASKS/HANDOFF`。
5. 子线程返回精简结果包：结果、变更、验证、风险、阻塞和下一步。
6. 总控校验状态与边界，刷新索引，再安排 VERIFY 和 REVIEW。
7. 通过后执行 SHIP 归档，下一切片使用新线程。

详细上下文包和交接格式见 `.codex/skills/workstream-delegation/references/context-protocol.md`。

## 总控边界

总控可以：

- 更新蓝图、决策、工作流、状态和验收记录。
- 创建、委托、复核和轮换 workstream 线程。
- 运行上下文迁移、校验、刷新、检索和归档脚本。
- 修复阻塞运行或验收的极小配置问题。

总控不可以：

- 直接实现功能页面、模块数据、业务逻辑或后端 API。
- 把完整子线程日志或无关历史加载进主上下文。
- 让多个 workstream 同时拥有同一共享文件。
- 在没有 VERIFY 和 REVIEW 证据时标记 SHIP。

## 代码归属

正式小程序代码统一进入 `miniprogram`。`workstreams` 只保存范围、任务、状态、交接和归档；不得创建重复小程序工程。

共享文件由单一 owner 集成。例如 `app.json` 由项目骨架负责，首页入口由首页 workstream 负责，功能页 owner 不直接修改共享入口。

## 当前状态

不要在本文件维护线程 ID 或完成百分比。读取：

- `workstreams/00-main-control/STATUS.md`
- `node .codex/skills/workstream-delegation/scripts/context.mjs query --query "目标主题"`

