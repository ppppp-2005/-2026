# 06-backend-api HANDOFF

## RESULT

`api-contract-v1` 已完成 API 契约草案: 已扫描 `miniprogram/data/*.js` mock 数据,整理真实数据字段,并生成 `API_SPEC.md` 作为前后端契约。前端框架已 SHIP,但本切片尚未 SHIP,等待 REVIEW。

## CHANGED

- `API_SPEC.md`: 新增 API 规范 v1.0,覆盖首页、职位、交流、消息、用户、企业、培训、政策、用工、校园、返乡等模块。
- `STATE.json`: 进入 `BUILD / active / api-contract-v1`。
- `TASKS.md`: 记录当前切片完成项和后续任务。
- `HANDOFF.md`: 压缩为最新交接摘要。
- 未修改 `miniprogram/**`,未清理 mock 数据,未启动后端实现。

## VERIFY

- `API_SPEC.md` 已标注字段来源: 后端字段(B)、微信字段(W)、前端计算字段(F)。
- 已列出核心实体: User, Job, Company, Candidate, Event, TrainingSession, Policy, Message。
- 已定义通用响应、分页、错误格式和 RESTful 路径。

## V1 DECISIONS

- 手机号: 第一版手动填写,暂不接 `wx.getPhoneNumber`。
- 企业认证: 第一版线下/人工确认,后台录入认证状态,暂不上传营业执照。
- 消息: 第一版站内消息,暂不接微信订阅消息。
- 搜索: 第一版后端简单关键词 + 地区 + 类型筛选,支持分页排序。
- 地图: 第一版不用定位,用地区筛选。
- 文件: 第一版不用文件上传,简历和证照先用表单字段替代。

## RISKS

- `wx.getUserProfile` 已逐步弱化,昵称/头像后续可能要改为用户主动填写。
- 手机号、证照、简历属于敏感信息,进入实现前必须补隐私协议和数据保护策略。
- API 契约尚未 REVIEW/SHIP,后端不要开始 BUILD。

## BLOCKERS

none

## NEXT

1. REVIEW `API_SPEC.md` 和 v1 决策。
2. 修正发现的问题后运行 `context.mjs refresh` + `validate`。
3. REVIEW 通过后 `accept/archive` 使 `api-contract-v1` SHIP。
4. 再进入 `backend-foundation-v1`。
