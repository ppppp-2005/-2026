# 08-skill-training HANDOFF

## 状态

功能线程已完成 BUILD 与 VERIFY；`07-quality-review` P1-3 已修复并自检通过，等待质量线程复查。

## 代码边界

- 可修改：`miniprogram/pages/training/**`、`miniprogram/data/training.js`、`miniprogram/data/training.ts`、本 workstream 文档。
- 禁止修改：首页、`app.json`、其他页面、后端文件。

## 已实现

- 沿用现有绿色、米白、8rpx 低圆角和大字短句视觉语言。
- 提供 5 个培训分类和 6 门贵州本地就业示例课程。
- 每门课程直接展示时间、上课时段、地点、适合人群和费用。
- 分类点击会在前端筛选课程并更新数量；开班信息按钮明确说明卡片已展示当前信息。
- mock 数据与页面逻辑分离，字段结构可由后续 API 返回直接替换。

## P1-3 整改

- 原误导性按钮文案改为“开班信息已展示”，点击前不再暗示会打开详情。
- toast 统一为“当前信息已在卡片展示”，不虚构新页面、展开内容或已完成操作。
- 按钮与 toast 文案集中在 `trainingMock.actions`，WXML、JS 与 TS 使用同一份 mock 字段。
- 未新增详情页、弹窗、后端调用或其他模块改动。

## 文件清单

- `miniprogram/pages/training/index.wxml`
- `miniprogram/pages/training/index.wxss`
- `miniprogram/pages/training/index.json`
- `miniprogram/pages/training/index.js`
- `miniprogram/pages/training/index.ts`
- `miniprogram/data/training.js`
- `miniprogram/data/training.ts`
- `workstreams/08-skill-training/TASKS.md`
- `workstreams/08-skill-training/HANDOFF.md`

## 验证结果

- `node --check miniprogram/pages/training/index.js`：通过。
- `node --check miniprogram/data/training.js`：通过。
- 页面 JSON 解析、WXML 标签闭合和 tap 处理器绑定检查：通过。
- JS/TS mock 数据一致性、分类覆盖和课程必填字段检查：通过。
- 分类筛选与开班信息 toast 的 Node 模拟交互：通过。
- 7 个实现文件 UTF-8 内容检查：通过。
- P1-3 修复后再次运行页面与 data JS 的 `node --check`：通过。
- `training.js` / `training.ts` 深度镜像与诚实文案契约检查：通过。
- 点击开班信息按钮的 toast 模拟检查：通过。
- training 实现范围内误导性旧文案扫描：无残留。
- 当前环境没有 `tsc`，未单独执行 TypeScript 编译。
- 按工作边界未修改 `app.json`，因此未在微信开发者工具中做集成路由预览；注册后需由 REVIEW 阶段补做视觉检查。

## 集成需求

1. `01-project-shell` 在 `app.json` 的 `pages` 中注册 `pages/training/index`。
2. `02-home-ui` 将 `homeMock.quickEntries` 中 `id: "training"` 的入口更新为 `route: "/pages/training/index"`、`type: "page"`、`enabled: true`，并更新入口徽标。
3. `02-home-ui` 在首页点击处理器中为 `type: "page"` 增加 `wx.navigateTo` 分支。
4. `00-main-control` 集成后在微信开发者工具中检查分类横向滚动、课程卡窄屏换行、筛选数量和详情 toast。
