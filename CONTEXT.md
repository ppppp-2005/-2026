# 三都职通小程序 (Sandu Job)

求职招聘类微信小程序。前端用原生框架 + mock 数据驱动，后端为 Express + Prisma + MySQL。采用 workstream 多线程协作模型，遵循 DEFINE → PLAN → BUILD → VERIFY → REVIEW → SHIP 生命周期。

## 语言

**workstream**：
项目的工作单元。每个 workstream 有独立目录 `workstreams/<编号>-<名称>/`，含 STATE.json、SPEC.md、TASKS.md、HANDOFF.md。当前共 16 个 workstream（00-15），全部已 SHIP。
_Avoid_: 模块、功能线、feature branch

**切片 (slice)**：
workstream 内的子任务单元。一个 workstream 可包含多个切片（如 backend-foundation-v1、mock-replacement-v1、demo-cleanup-v1），每个切片独立走完整生命周期。
_Avoid_: sprint、迭代、phase

**环境降级 (degradation)**：
当后端不可用时，小程序从 api 模式自动回退到 mock 模式。由 app.js 启动时探测 `/health/live` 触发，降级后保持 anonymous 状态，页面不白屏。
_Avoid_: fallback、回退、降级回退

**mock 替换 (mock replacement)**：
将 auth-session.js 中的登录/登出/角色切换从纯内存 mock 改为走后端 API，同时保留 mock 模式作为降级兜底。对应切片 mock-replacement-v1。
_Avoid_: 切真 API、去 mock

**演示清理 (demo cleanup)**：
全局清除小程序前端所有"演示""demo"硬编码文案（~194 处），并将 data/*.js 中的 mock 数据数组清空。对应切片 demo-cleanup-v1。
_Avoid_: 去演示、清 demo、文案替换

**求职者 (seeker)**：
用户角色之一。可浏览职位、投递、查看消息。
_Avoid_: 候选人（candidate 在招聘方语境下才用）

**招聘方 (employer)**：
用户角色之一。可管理企业资料、填写岗位、预览、查看候选人。
_Avoid_: 企业用户、HR、招聘者

**角色切换 (role switching)**：
用户在求职者和招聘方之间切换身份。mock 模式下走内存切换，api 模式下 POST /me/switch-role。
_Avoid_: 身份切换、模式切换

**本地演示登录 (demo login)**：
mock 模式下的登录方式。不调微信 wx.login，不请求后端，纯内存状态。用于前端开发调试。
_Avoid_: 假登录、模拟登录

**候选人 (candidate)**：
招聘方视角下的求职者。招聘方可筛选、标记候选人状态。
_Avoid_: 求职者（求职者视角用 seeker）

**企业表单校验 (job form validation)**：
招聘方填写岗位时前端触发的校验规则。校验字段含岗位名称、人数、薪资范围、地点、上班安排、要求、福利。由 employer.js 中的 validateJobDraft() 执行。
_Avoid_: 表单验证、岗位校验

**防重复提交 (submission guard)**：
防止用户快速多次点击提交按钮的机制。由 submission-guard.js 实现，基于操作键（如 employer.prepareJobPreview）去重。
_Avoid_: 防抖、节流、去重提交

**红线 (red line)**：
绝对不可修改的文件或代码区域。例如：data/*.js 是红线（不可改 mock 数据结构）、transport.js 核心逻辑是红线（不可改请求机制）、backend/ 冻结后是红线。
_Avoid_: 禁区、不可碰区域

**闸门 (gate)**：
生命周期阶段之间的准入检查点。每个阶段有明确的进入/退出条件，条件未满足不得进入下一阶段。SPECIFY → PLAN → TASKS → IMPLEMENT 每个环节都需人确认。
_Avoid_: checkpoint、关卡、审批点

**证据驱动交付 (evidence-driven delivery)**：
本项目的默认工作方法论。任何"完成"声明必须有可验证证据（测试通过、真机截图、console 日志）。静态分析不等于验收。
_Avoid_: EDD、证据驱动

**上下文治理 (context governance)**：
控制 Agent 上下文窗口大小的规则体系。子 Agent 只接收最小上下文包，不继承完整主对话。STATE.json 为状态源，STATUS.md 为只读生成物。
_Avoid_: context 管理、上下文管理

**本地环境 (local environment)**：
前端纯 mock 模式，不请求任何后端。用于独立前端开发。
_Avoid_: mock 环境

**本地开发环境 (local-dev environment)**：
前端优先走 api 模式，后端不可用时自动降级为 mock。用于前后端联调。
_Avoid_: dev 环境、开发环境
