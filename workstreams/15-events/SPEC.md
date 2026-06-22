# 15-events SPEC

## Goal

新增轻量“交流 / 活动中心”前端框架，覆盖直播、招聘会、宣讲会和活动详情。页面只使用集中本地示例数据，不冒充真实直播、报名、订阅或通知结果。

## Required UI

- 活动中心：直播、招聘会、宣讲会三类 Tab。
- 状态筛选：全部、进行中、即将开始、已结束。
- 列表状态：loading、normal、empty、error 和 retry。
- 活动详情：类型、状态、时间、地点或线上说明、主办方、适合人群和活动说明。
- 详情可处理有效、缺失和无效 `id`。
- “我感兴趣”和报名说明只改变或说明当前页面状态；操作前后都明确未真实报名、未订阅、不会通知主办方。

## Navigation Contract

- 活动详情使用绝对导航意图 `/pages/event-detail/index?id=...`。
- 当前切片不修改 `miniprogram/app.json`。
- 后续由 `01-project-shell` 注册活动中心为第五 Tab，并注册活动详情普通页面。
- 导航失败只给通用反馈，不猜测失败原因或声称路由缺失。

## Owned Paths

- `miniprogram/pages/events/**`
- `miniprogram/pages/event-detail/**`
- `miniprogram/data/events.js`
- `miniprogram/data/events.ts`
- `workstreams/15-events/**`

## Forbidden

- 不修改 `miniprogram/app.json`、其他页面、其他 workstream 或后端。
- 不实现真实直播播放、登录、报名、订阅消息、网络请求、socket、storage 或上传。
- 不引入第三方海报、Logo、占位图、emoji、手工 SVG 或用 CSS 绘制图形替代资产。

## Acceptance

- 三类活动和四种状态筛选可本地切换，且能出现正常和空结果。
- loading、error、retry 均有明确代码路径和简短中文反馈。
- 详情字段完整；缺失或无效 `id` 不回退到伪造详情。
- JS/TS 镜像、页面 JSON、WXML 事件、禁用 API 和关键真实性文案通过自动验证。
- 视觉沿用绿色、米白、大字和低理解成本卡片，不复制参考系统蓝色海报。
