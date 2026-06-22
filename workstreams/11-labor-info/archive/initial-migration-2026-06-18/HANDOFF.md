# 11-labor-info HANDOFF

## 状态

BUILD 与 VERIFY 已完成，等待 `00-main-control` 主线程复核和集成。

## 代码边界

- 可修改：`miniprogram/pages/labor/**`、`miniprogram/data/labor.js`、`miniprogram/data/labor.ts`、本 workstream 文档。
- 禁止修改：首页、`app.json`、其他页面、后端文件。

本次实现严格在上述允许范围内完成，未修改 `app.json`、首页、其他页面、其他 data 文件或后端。

## 已完成

- 新增“用工信息”原生小程序页面，沿用绿色、米白、低圆角和大字短句的项目视觉语言。
- 提供全部、长期用工、短期用工、紧急用工四种前端筛选，筛选后即时更新列表和结果数量，并显示 toast。
- 使用 6 条贵州本地就业 mock 需求，覆盖贵阳、安顺、遵义、毕节、黔南、铜仁，共 113 人。
- 每条需求明确展示人数、工期、地点、待遇、要求与吃住结算信息。
- 联系咨询按钮使用弹窗展示脱敏示例电话和就业服务点，不触发真实拨号；页面提供防押金、防培训费提醒。
- mock 数据与页面逻辑分离，后续可用同结构 API 响应替换 `laborMock`。

## 文件清单

- `miniprogram/pages/labor/index.wxml`
- `miniprogram/pages/labor/index.wxss`
- `miniprogram/pages/labor/index.json`
- `miniprogram/pages/labor/index.js`
- `miniprogram/pages/labor/index.ts`
- `miniprogram/data/labor.js`
- `miniprogram/data/labor.ts`
- `workstreams/11-labor-info/TASKS.md`
- `workstreams/11-labor-info/HANDOFF.md`

## 验证结果

- `node --check miniprogram/pages/labor/index.js`：通过。
- `node --check miniprogram/data/labor.js`：通过。
- `miniprogram/pages/labor/index.json` JSON 解析：通过。
- 数据合计校验：6 条需求、113 人；长期、短期、紧急各 2 条，通过。
- JS/TS mock 数据一致性检查：通过。
- 需求必填字段检查：通过。
- 当前 workstream 未注册路由，无法在微信开发者工具中做实际页面渲染验收；需集成后由主线程或质量线程完成视觉复核。

## 集成需求

1. 由 `01-project-shell` 在 `app.json` 注册路由 `pages/labor/index`。
2. 由 `02-home-ui` 将首页“用工信息”入口指向 `/pages/labor/index`，并使用页面跳转方式打开。
3. 集成后在微信开发者工具中验证四类筛选、联系弹窗、长文本换行和不同屏幕宽度布局。
