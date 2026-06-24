# Agent Runbook — 三都职通小程序

> 任何 Agent（Hermes、Trae、Claude、子 Agent）进入本项目后，先读此文件。
> 详细规则见引用路径，本文件只提炼最关键的执行规则。

---

## 1. 项目协作模型

| 角色 | 实体 | 职责 | 边界 |
|------|------|------|------|
| 人（你） | 用户 | 最终决策者、每个闸门确认人 | 不写代码 |
| 军师 | Hermes（00-main-control） | 分析需求 → SPEC/PLAN/TASKS → 审查 → 验收决策 | 不写产品代码 |
| 建造者 | Trae / 子 Agent | 按 SPEC+TASKS 执行 BUILD，走 TDD，出证据 | 不改规划文件 |
| 验收员 | Verifier 子 Agent | 只验证不修复，出 PASS/FAIL/BLOCKER + 截图 | 不改任何产品代码 |

**协作流程**：军师出规划 → 人确认 → 交给 Trae → Trae 执行 → Verifier/Claude 验收 → 军师复核 → 人确认。

详见 `agents/strategist.md`、`agents/builder.md`、`agents/verifier.md`。

---

## 2. 标准工作流（SPECIFY → SHIP）

```
SPECIFY → PLAN → TASKS → BUILD → VERIFY → REVIEW → SHIP
   ↑        ↑       ↑        ↑        ↑         ↑       ↑
  列出      技术    2-5min   Track A   Track B   军师    归档
  假设      设计    任务     TDD      真机验收   审查    切片
  人确认    人审阅  人批准   出证据    出证据    人确认
```

**闸门规则**：每个箭头都是硬闸门，未获人确认不得进入下一阶段。

---

## 3. Workstream 规则

每个 workstream 位于 `workstreams/<编号>-<名称>/`，核心文件：

| 文件 | 作用 | 谁写 |
|------|------|------|
| `STATE.json` | 状态机（phase/state/currentSlice/evidence） | 军师 |
| `SPEC-*.md` | 切片规格（范围 In/Out、验证标准） | 军师 |
| `PLAN-*.md` | 实现方案（架构决策、依赖顺序） | 军师 |
| `TASKS-*.md` | 任务清单（F1-F10，每个 2-5 分钟） | 军师 |
| `HANDOFF.md` | 交接记录、红线清单 | 军师 |

- 读取状态：`context.mjs validate`
- 状态源：`STATE.json`（非 `STATUS.md`，后者是生成的只读物）
- 切完一个切片 → 归档 → 新切片用新线程

详见 `.codex/skills/workstream-delegation/SKILL.md`。

---

## 4. 证据驱动交付

**核心原则**：没有证据 = 没完成。

- 静态分析（grep、node --check、代码审查）≠ 真机验收
- 任何"完成"声明必须有可验证证据（测试通过、截图、console 日志）
- 验收员只验证不修复，发现缺陷退回 owning workstream
- 无法驱动真机 → 立即报 blocker，给 A/B 方案，不硬刚 GUI

详见 `.codex/skills/evidence-driven-delivery/SKILL.md`。

---

## 5. 红线（绝对不可碰）

| 红线 | 范围 | 来源 |
|------|------|------|
| `data/*.js` | mock 数据文件，不可改结构 | HANDOFF.md |
| `transport.js` 核心逻辑 | 请求机制不可改（只能加回调参数） | HANDOFF.md / workstream 红线清单 |
| `snapshot()` | 保持同步，不可改 async | ADR 0003 |
| `backend/` | 若当前 workstream 标明 backend 已冻结，或当前 SPEC/TASKS 未授权 backend 改动，则不得修改 | HANDOFF.md |
| `.ts` 新文件 | 不可创建，有效代码一律 `.js` | ADR 0002 |
| `STATE.json` 语义修改 | 需人批准才能改 | strategist.md |
| `.agent-sources/` | vendored 上游，不可修改 | AGENTS.md |

发现需要动红线 → 停下来，问人。

---

## 6. STATE.json 修改规则

- 格式修正（schema 合规、validate 通过）：军师可直接修
- 语义修改（dependencies/tags/phase/codePaths/summary）：必须人批准
- 修改后必须 `context.mjs validate` 通过（0 error / 0 warning）

---

## 7. ADR 规则

- `Accepted` ADR 必须有 Evidence（具体文件路径/命令/记录）
- 没证据 → 只能标 `Draft / Needs evidence`
- 三个条件全满足才写 ADR：难逆转、无上下文会困惑、有真实权衡

详见 `docs/adr/ADR-FORMAT.md`。

---

## 8. CONTEXT.md 的作用

项目术语表。定义本项目的领域语言（workstream、切片、环境降级、mock 替换等）。

- 每个术语有 1-2 句定义 + `_Avoid_` 列出不用的同义词
- 子 Agent 开局应读此文件，避免重新猜测项目术语
- 术语冲突时以 CONTEXT.md 为准

---

## 9. 汇报格式

### Trae / Builder BUILD 汇报

```
RESULT     — 一句话结论
CHANGED    — 改了哪些文件（路径 + 改动）
VERIFY     — 验证方法（命令、输出、exit code）
FINDINGS   — 新发现的 bug 或问题
BLOCKERS   — 阻断项（如实报，不伪造）
NEXT       — 建议下一步
```

### Verifier 验收汇报

```
RESULT          — PASS / FAIL / BLOCKED
VERIFY          — 验证了哪些项
RUNTIME EVIDENCE — 截图路径、console 摘要（必填）
FINDINGS        — 缺陷：文件/页面/复现步骤/截图/严重级别
RISKS           — 仅静态发现、未复现的风险
BLOCKERS        — 阻断项
NEXT            — 退回哪个 workstream
```

严重级别：blocker > critical > major > minor。

---

## 10. 遇到 Blocker 怎么处理

1. **立即停下来**，不硬刚
2. 记录到 BLOCKERS：什么卡住了、尝试了什么、为什么不 work
3. 提供 A/B 方案让人选择
4. **禁止**：伪造完成、GUI 自动化硬刚微信开发者工具、修改 IDE 配置文件
5. 真机探不通 → 报 blocker，提供选项 A（人开服务端口，下轮自动验）或 B（人手动跑清单）

---

## 11. 技能加载规则

项目遵循意图→技能映射。按任务类型选择正确的上游技能和项目技能：

| 任务类型 | 必读技能 |
|----------|----------|
| 开始任何工作 | `AGENTS.md` → `ADDYOSMANI-AGENT-SKILLS.md` |
| 规划 | `spec-driven-development` → `planning-and-task-breakdown` |
| 构建 | `evidence-driven-delivery`（Track A）→ `incremental-implementation` → `test-driven-development` |
| 验收 | `evidence-driven-delivery`（Track B） |
| 审查 | `code-review-and-quality` |
| 委托 | `workstream-delegation` |

详见 `docs/agent-rules/ADDYOSMANI-AGENT-SKILLS.md`。

---

## 12. 快速检查清单（Agent 开局自检）

- [ ] 读了 `AGENT-RUNBOOK.md`（本文件）
- [ ] 读了 `CONTEXT.md`（术语表）
- [ ] 确认了自己的角色（strategist / builder / verifier）
- [ ] 读了对应 persona 文件（`agents/<role>.md`）
- [ ] 确认了当前切片的 SPEC + TASKS
- [ ] 确认了红线清单
- [ ] 跑了 `context.mjs validate`
- [ ] 知道遇到 blocker 该停下来

---

## Open Questions / Conflicts

_当前未发现现有规则之间的冲突。如后续发现矛盾，以 AGENTS.md > 本文件 > 各 persona 文件的优先级裁决。_
