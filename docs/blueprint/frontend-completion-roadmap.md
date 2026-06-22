# Frontend Completion Roadmap

## Definition Of Done

前端框架完成必须同时满足：核心求职者与企业流程都有可导航页面；控件和本地状态可体验；mock 数据集中；未接后端的动作在操作前后均诚实说明；JS/TS 镜像、JSON、事件绑定、路由、窄屏和大字体通过复查。

## Delivery Order

| Order | Workstream | Slice | Deliverable |
|---|---|---|---|
| 1 | `04-user-profile` | `profile-frontend-framework-v1` | 我的、演示登录、简历、投递记录、身份视图 |
| 2 | `14-messages` | `messages-frontend-framework-v1` | 消息列表、未读分类、通知与会话详情 |
| 3 | `03-jobs` | `jobs-frontend-flow-v2` | 本地搜索筛选、详情、收藏与投递确认框架 |
| 4 | `05-employer` | `employer-frontend-flow-v2` | 企业资料、岗位表单/预览、候选人管理框架 |
| 5 | `01-project-shell` | `frontend-route-integration-v2` | 统一注册新增普通页面路由 |
| 6 | `07-quality-review` | `frontend-framework-review-v2` | 全量静态、模拟器、窄屏、大字体和真实性验收 |

每个切片必须独立完成 DEFINE、PLAN、BUILD、VERIFY、REVIEW、SHIP，再进入下一项。不要并行修改 `app.json` 或其他共享入口。

## Backend Gate

`06-backend-api` 的架构文档保留，但服务器 BUILD 必须等待上述六项全部 SHIP。前端框架完成不等于真实业务已上线。

