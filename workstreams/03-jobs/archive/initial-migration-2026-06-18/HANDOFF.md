# 03-jobs HANDOFF

## 当前状态

`03-jobs` 已接管主控线程误实现的职位页静态 UI，并完成边界审查。

当前职位页仍然是第一阶段静态前端：不接后端、不做真实搜索筛选、不做详情页、不做投递、不接登录校验。页面展示内容全部来自 `miniprogram/data/jobs.js` / `miniprogram/data/jobs.ts` 的 mock 数据。

## 本次审查结论

- 实现范围符合 `03-jobs` 职责：顶部说明、搜索入口、工作专区、基础筛选入口、静态职位卡片和 mock 数据均已覆盖。
- 未发现越界实现：没有新增首页、我的、消息、雇主、登录、后端 API 或真实业务流程。
- 视觉方向基本符合当前产品目标：面向普通工人，信息层级直接，工资、地点、企业和福利标签清楚。
- 已做小范围修正：示例岗位数量不再写死为 `28`，改为跟随 mock 岗位列表；工资补充 `元/月`；列表右侧文案由 `刷新` 改为 `示例`，避免暗示已有真实刷新逻辑。

## 本次修改文件

- `miniprogram/pages/jobs/index.wxml`
  - 职位数量改为读取 `jobs.jobs.length`。
  - 推荐岗位右侧文案改为静态示例标识。
- `miniprogram/data/jobs.js`
  - mock 岗位工资补充 `元/月` 单位。
- `miniprogram/data/jobs.ts`
  - 同步 TypeScript 版本 mock 数据。
- `workstreams/03-jobs/TASKS.md`
  - 记录接管、审查和剩余验收任务。
- `workstreams/03-jobs/HANDOFF.md`
  - 记录接管结果、边界检查和后续验收要求。

## 后续验收

需要用户在微信开发者工具中打开职位 tab，并提供截图给主控线程验收：

- 页面是否能正常显示。
- 首页“找工作”入口点击后是否能切换到职位页；该入口属于 `02-home-ui`，建议首页使用 `wx.switchTab({ url: '/pages/jobs/index' })` 接入。
- 顶部、专区、筛选、提示条、岗位卡片是否没有遮挡或挤压。
- 工资、地点、企业和标签是否醒目易读。
- 底部 tab 与首页整体风格是否协调。

## 后续 API 替换点

后续接 API 时可优先替换 `miniprogram/data/jobs.js` / `miniprogram/data/jobs.ts` 中这些字段：

- `zones`：专区入口名称、说明、颜色和跳转路径。
- `filters`：筛选项及选中状态。
- `jobs`：岗位名称、工资、企业、地点、企业说明、标签和 badge。
