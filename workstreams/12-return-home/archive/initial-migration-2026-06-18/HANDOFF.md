# 12-return-home HANDOFF

## 状态

功能线程已完成 BUILD、VERIFY 和自审，等待 `00-main-control` 审核。

## 已完成

- 建立“返乡专区”原生小程序页面，包含本地岗位、创业支持、返乡服务三类内容。
- 提供贵阳、遵义、毕节、黔东南岗位筛选，筛选结果在本页即时更新。
- 为岗位咨询、创业咨询、办理提醒提供短句 toast 反馈。
- 使用贵州地州与区县级示例信息；企业保持通用称呼，并显著标明 mock 数据与政策确认提示。
- 数据按 `header`、`categories`、`jobFilters`、`localJobs`、`startupSupports`、`services` 分组，便于未来用 API 响应替换。

## 文件清单

- `miniprogram/pages/return-home/index.wxml`
- `miniprogram/pages/return-home/index.wxss`
- `miniprogram/pages/return-home/index.json`
- `miniprogram/pages/return-home/index.js`
- `miniprogram/pages/return-home/index.ts`
- `miniprogram/data/return-home.js`
- `miniprogram/data/return-home.ts`
- `workstreams/12-return-home/TASKS.md`
- `workstreams/12-return-home/HANDOFF.md`

## 验证结果

- `node --check miniprogram/pages/return-home/index.js`：通过。
- `node --check miniprogram/data/return-home.js`：通过。
- `index.json` 使用 `JSON.parse` 校验：通过。
- 必需页面与数据文件完整性检查：通过。
- mock 结构检查：本地岗位 4 条、创业支持 3 条、返乡服务 3 条。
- 由于本 workstream 禁止修改 `app.json`，尚未在微信开发者工具中进行已注册路由的端到端预览。

## 代码边界

- 可修改：`miniprogram/pages/return-home/**`、`miniprogram/data/return-home.js`、`miniprogram/data/return-home.ts`、本 workstream 文档。
- 禁止修改：首页、`app.json`、其他页面、后端文件。

## 集成需求

1. 项目骨架线程在 `app.json` 的 `pages` 中注册 `pages/return-home/index`。
2. 首页线程更新 `homeMock.quickEntries` 中 `id: "return"` 的入口：路由设为 `/pages/return-home/index`，启用入口，并使用普通页面导航类型。
3. 首页线程为普通页面入口补充 `wx.navigateTo`；当前 `onEntryTap` 只处理 `type: "tab"`，仅填写 route 仍会显示“功能建设中”。
4. 路由接入后在微信开发者工具预览，复测顶部三类定位、地区筛选和全部 toast。
