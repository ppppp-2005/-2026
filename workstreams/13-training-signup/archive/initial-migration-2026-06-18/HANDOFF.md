# 13-training-signup HANDOFF

## 状态

P1-1 已完成整改并通过本 workstream 的 VERIFY 与 REVIEW，等待 `07-quality-review` 复查。

## 代码边界

- 可修改：`miniprogram/pages/training-signup/**`、`miniprogram/data/training-signup.js`、`miniprogram/data/training-signup.ts`、本 workstream 文档。
- 禁止修改：首页、`app.json`、其他页面、后端文件。

## 集成需求

由项目骨架线程在 `app.json` 注册 `pages/training-signup/index`，首页线程再把“培训报名”入口指向该路由。本 workstream 未修改 `app.json`、首页或其他模块。

## 已实现

- 使用贵州贵阳、遵义、毕节、六盘水就业技能培训 mock 班次。
- 展示班次名额、开班时间、上课时间、地点、费用、报名条件和承办单位。
- 使用绿色、橙色、灰色明确区分“可报名”“即将满员”“已结束”。
- 支持按状态本地筛选，筛选后显示 toast 和结果数量。
- 可用班次按钮在点击前明确显示“报名暂未开放”，旁注说明“当前仅展示班次”。
- 点击可用班次只显示“报名功能暂未开放”toast，不修改状态、不持久化、不提交个人信息。
- 已结束班次按钮会恢复全部班次并提示用户查看其他班次。
- mock 数据保留稳定 ID、ISO 日期、地区、金额、容量和条件字段，便于后续 API 替换。

## 文件清单

- `miniprogram/pages/training-signup/index.wxml`
- `miniprogram/pages/training-signup/index.wxss`
- `miniprogram/pages/training-signup/index.json`
- `miniprogram/pages/training-signup/index.js`
- `miniprogram/pages/training-signup/index.ts`
- `miniprogram/data/training-signup.js`
- `miniprogram/data/training-signup.ts`
- `workstreams/13-training-signup/TASKS.md`
- `workstreams/13-training-signup/HANDOFF.md`

## 验证结果

- `node --check miniprogram/data/training-signup.js`：通过。
- `node --check miniprogram/pages/training-signup/index.js`：通过。
- `index.json` 使用 PowerShell `ConvertFrom-Json`：通过。
- mock 约束检查：4 个班次，包含 `open`、`limited`、`ended` 三种状态，必需业务字段完整。
- P1-1 页面交互桩测试：未开放 toast 不改变页面状态，状态筛选和已结束班次恢复全部列表均通过。
- JS/TS 镜像检查：data 对象深度一致，页面归一化源码一致。
- 误导文案扫描：页面与 training-signup data 中不存在“已记录报名意向”“报名成功”“已保存”“我要报名”“尽快报名”。
- 视觉与资源复核：未使用图片、emoji、ASCII 图标、手绘 SVG 或占位图形。

## 当前限制

- 页面尚未在 `app.json` 注册，因此需完成上述集成后才能从小程序内打开。
- 报名功能暂未开放，不包含表单、状态保存、支付、审核或后端请求。
