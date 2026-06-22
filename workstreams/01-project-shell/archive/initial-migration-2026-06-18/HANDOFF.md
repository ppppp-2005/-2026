# 01-project-shell HANDOFF

## 当前状态

已完成微信原生小程序基础工程骨架。当前阶段仅提供可运行入口、四个 Tab 页面和基础样式，不包含复杂首页 UI、后端 API、登录、投递、聊天或组件库。

## 新增或修改的关键文件

- `miniprogram/app.json`：配置页面路由、窗口样式和底部 Tab。
- `miniprogram/app.ts`：小程序入口，保留最小 `globalData`。
- `miniprogram/app.js`：微信开发者工具直接运行用的入口文件。
- `miniprogram/app.wxss`：基础全局样式和页面占位样式。
- `miniprogram/sitemap.json`：基础 sitemap 配置。
- `miniprogram/pages/home/index.*`：首页占位页面。
- `miniprogram/pages/jobs/index.*`：职位占位页面。
- `miniprogram/pages/messages/index.*`：消息占位页面。
- `miniprogram/pages/profile/index.*`：我的占位页面。
- `miniprogram/components/README.md`：后续共享组件目录说明。
- `miniprogram/data/README.md`：后续静态 mock 数据目录说明。
- `miniprogram/services/README.md`：后续服务封装目录说明。

## 如何运行或打开

用微信开发者工具导入 `D:\wecaht app\miniprogram` 目录。当前目录内包含 `app.json`，可作为原生小程序入口打开；若总控线程后续需要固定 AppID、编译设置或项目名，可在仓库根目录补充 `project.config.json`。

当前未在本地验证微信开发者工具编译，因为此环境没有直接启动开发者工具。已按微信原生小程序文件结构创建入口和页面，四个 Tab 可从 `app.json` 路由切换。

## 运行兼容说明

微信开发者工具未启用 TypeScript 编译时会查找 `.js` 文件，因此已补充 `app.js` 和四个页面的 `index.js`。当前可直接按 JavaScript 小程序运行；`.ts` 文件暂时保留，后续如果正式启用 TypeScript 编译，再统一清理或配置。

## 给 02-home-ui 的交接

`02-home-ui` 应主要基于以下文件继续：

- `miniprogram/pages/home/index.wxml`
- `miniprogram/pages/home/index.wxss`
- `miniprogram/pages/home/index.ts`
- `miniprogram/pages/home/index.json`
- `miniprogram/app.wxss`

建议仅扩展首页静态 UI 和必要 mock 数据；不要在该阶段接入后端、登录、投递、聊天或第三方组件库。若首页需要静态数据，可在 `miniprogram/data` 下新增 mock 文件，并在交接中说明。

## 统一路由集成（2026-06-18）

本批次仅修改 `miniprogram/app.json` 的 `pages` 数组，新增以下普通页面注册：

- `pages/employer/index`
- `pages/training/index`
- `pages/policy/index`
- `pages/campus/index`
- `pages/labor/index`
- `pages/return-home/index`
- `pages/training-signup/index`

现有四个 Tab（首页、职位、消息、我的）的页面顺序和 `tabBar` 配置保持不变。本批次未修改首页、上述功能页面或其数据文件。

验证结果：`miniprogram/app.json` 已通过 PowerShell `ConvertFrom-Json` 解析；七个页面的 WXML、WXSS、JSON、JS、TS 五件套共 35 个文件均存在。路由现已具备由首页或其他调用方通过 `wx.navigateTo` 打开的注册条件，首页入口接线仍应由对应首页 workstream 完成。
