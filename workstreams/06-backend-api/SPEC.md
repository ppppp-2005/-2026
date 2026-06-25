# 06-backend-api SPEC — api-contract-v1

## Current Slice

- Slice: `api-contract-v1`
- Lifecycle: `BUILD → REVIEW`（当前等待 REVIEW，尚未 SHIP）
- Goal: 基于 `miniprogram/data/*.js` mock 数据定义前后端 API 契约，产出可 REVIEW 的 API_SPEC.md

## Deliverable

`API_SPEC.md`（v1.1，~46KB）是本切片的主要交付物，内容覆盖：

- 设计原则：mock 数据即契约参考、不清 mock 先定义后替换、字段分级(B/W/F)、RESTful 风格、`/api/v1/` 版本前缀
- 通用规范：请求头(Authorization: Bearer)、响应格式(`{code, message, data, requestId}`)、分页(`{page, pageSize, total}`)、错误码
- 核心实体：User / Job / Company / Candidate / Event / TrainingSession / Policy / Message
- 接口分组：首页聚合、职位(列表/详情/搜索/收藏)、交流(活动列表/详情)、消息(列表/详情/未读)、用户(登录/角色/资料/投递/简历)、企业(资料/岗位/候选人)、培训(列表/报名/取消/签到)、政策(列表/详情)、用工(劳务列表/详情/报名)、校园(列表/详情/报名)、返乡(列表/详情/报名)

## What Was Done

- [x] 扫描 `miniprogram/data/*.js` 全部 mock 文件，提取真实数据字段清单
- [x] 逐字段标注来源：后端字段(B) / 微信开放能力字段(W) / 前端计算字段(F)
- [x] 定义核心实体关系和数据模型
- [x] 定义通用请求/响应/分页/错误规范
- [x] 产出 `API_SPEC.md` v1.1，完成字段分级和接口路径定义
- [x] 提出 v1 范围决策建议

## V1 范围决策（待确认）

| 决策 | 建议 | 状态 |
|------|------|------|
| 手机号 | 第一版手动填写，暂不接 `wx.getPhoneNumber` | 待确认 |
| 企业认证 | 第一版线下/人工确认，后台录入认证状态 | 待确认 |
| 消息 | 第一版站内消息，暂不接微信订阅消息 | 待确认 |
| 搜索 | 第一版后端简单关键词+地区+类型筛选，支持分页排序 | 待确认 |
| 地图 | 第一版不用定位，用地区筛选 | 待确认 |
| 文件上传 | 第一版不用文件上传，简历和证照先用表单字段替代 | 待确认 |

## REVIEW 结论

以下 5 项在 API_SPEC.md v1.1 中的覆盖情况（本轮已交叉验证）：

| 待补项 | 位置 | 结论 |
|--------|------|------|
| 投递 | §4.4 `POST /api/v1/jobs/:id/applications` + §9 我的投递列表 + §10.4-10.5 employer 侧候选人管理 | ✅ 已完整覆盖 |
| 我的投递 | §9 `GET /api/v1/me/applications` + `POST .../withdraw`（含分页、状态筛选、撤回） | ✅ 已完整覆盖 |
| 简历 | §8 `GET/PATCH/DELETE /api/v1/me/resume`（含完整字段、生命周期） | ✅ 已完整覆盖 |
| 培训报名 | §11.2 + §21 v1 范围决策表 + §23 后续切片规划，明确标注 v1 暂缓，列为 training-registration-v1 | ✅ 有意暂缓，已文档化 |
| 隐私同意 | §16 `POST /api/v1/privacy/consents` + `GET .../current` + §19 核心实体含 PrivacyConsent | ✅ 已完整覆盖 |

**api-contract-v1 内容审阅通过。** 6 项 v1 范围决策全部建议接受。5 个 minor gaps（G1-G5）已在 API_SPEC.md 中修复。当前等待 SHIP gate 签字。

## Boundaries

**本轮不做的：**

- 不写任何后端代码（不启动 Express/Prisma/MySQL）
- 不改任何前端产品代码（miniprogram/ 不动）
- 不清 mock 数据
- 不创建 `.ts` 文件
- 不修改 `snapshot()`、`transport.js`、`data/*.js`

## Acceptance

切片的 SHIP 条件：

1. `API_SPEC.md` 通过 REVIEW（人确认 v1 范围决策）
2. REVIEW 待补清单处理完毕或明确标记为 v2 延后
3. `context.mjs validate` 0 error / 0 warning

SHIP 后下一刀：`backend-foundation-v1`（数据库设计 + 服务端框架搭建）

## References

- 交付物：`workstreams/06-backend-api/API_SPEC.md`
- 任务清单：`workstreams/06-backend-api/TASKS.md`
- 交接记录：`workstreams/06-backend-api/HANDOFF.md`
- 已归档切片：`workstreams/06-backend-api/archive/20260619-backend-architecture-v1/`
