# 10-campus HANDOFF

## 状态

功能实现与 P1-4 误导性交互整改已完成，等待质量审查线程复查。

## 代码边界

- 可修改：`miniprogram/pages/campus/**`、`miniprogram/data/campus.js`、`miniprogram/data/campus.ts`、本 workstream 文档。
- 禁止修改：首页、`app.json`、其他页面、后端文件。

## 集成需求

集成路由保持 `pages/campus/index` 不变。本次 P1-4 整改未修改 `app.json`、首页或其他模块。

## 已完成内容

- 新增近期双选会区域，直接显示日期、时段、区县、场地和适合人群。
- 新增应届岗位与实习机会列表，可在“全部机会”“应届岗位”“实习机会”之间本地筛选。
- 使用贵州省贵阳、清镇、凯里、遵义等地的示例 mock 信息，并在页面明显标注示例属性。
- mock 数据保留 ISO 时间、城市、区县、学历、届别、人数、截止时间和状态字段，便于后续替换为 API 返回值。
- 双选会按钮在点击前明确显示“安排已展示”，点击后 toast 使用相同文案。
- 岗位和实习按钮在点击前明确显示“详情暂未开放”，点击后 toast 使用相同文案。
- 筛选按钮同时更新列表并显示筛选反馈。

## P1-4 整改说明

- 已移除会暗示存在后续内容的“查看安排”“了解岗位”“了解实习”。
- 当前不新增活动或岗位详情页，不模拟已完成的详情操作。
- mock 的 `actionText` 与页面 JS/TS 的 toast 文案保持一致，用户点击前后收到相同信息。

## 文件清单

- `miniprogram/pages/campus/index.wxml`
- `miniprogram/pages/campus/index.wxss`
- `miniprogram/pages/campus/index.json`
- `miniprogram/pages/campus/index.js`
- `miniprogram/pages/campus/index.ts`
- `miniprogram/data/campus.js`
- `miniprogram/data/campus.ts`
- `workstreams/10-campus/TASKS.md`
- `workstreams/10-campus/HANDOFF.md`

## 验证结果

- `node --check miniprogram/data/campus.js`：通过。
- `node --check miniprogram/pages/campus/index.js`：通过。
- `node --check miniprogram/data/campus.ts`：通过。
- `node --check miniprogram/pages/campus/index.ts`：通过。
- data 镜像检查：通过；Node 直接加载 `campus.js` 与 `campus.ts` 后，`campusMock` 深度一致。
- Page 镜像检查：通过；`index.js` 与 `index.ts` 的 Page 方法集合及两条整改 toast 文案一致。
- P1-4 行为检查：通过；活动操作实际 toast 为“安排已展示”，岗位和实习操作实际 toast 为“详情暂未开放”。
- 旧文案检查：通过；页面代码和 mock 中不再包含“查看安排”“了解岗位”“了解实习”“时间地点已显示”“详情功能待接入”。
- `miniprogram/pages/campus/index.json`：JSON 解析通过。
- 页面五件套与数据 JS/TS 文件：均已存在。
- 未运行微信开发者工具真机或模拟器预览，需由质量审查线程继续完成视觉验收。
