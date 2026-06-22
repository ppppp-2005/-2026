# 06-backend-api TASKS

## Phase: BUILD
## Slice: api-contract-v1
## State: active

---

## COMPLETED

- [x] 扫描 miniprogram/data/*.js 全部 10 个 mock 文件
- [x] 提取真实数据字段清单
- [x] 定义 API 接口规范(API_SPEC.md)
- [x] 区分后端字段(B) / 微信开放能力字段(W) / 前端计算字段(F)
- [x] 梳理核心实体关系(User/Job/Company/Candidate/Event/TrainingSession/Policy/Message)
- [x] 定义通用规范(请求头/响应格式/分页/错误码)
- [x] 列出 6 项待确认事项
- [x] 记录 v1 范围建议: 手动手机号、人工企业审核、站内消息、后端简单搜索、暂缓地图定位、暂缓文件上传

---

## IN PROGRESS

- [ ] REVIEW API_SPEC.md 并确认 v1 范围决策
- [ ] 处理 REVIEW 待补清单: 投递、我的投递、简历、培训报名、隐私同意

---

## PENDING

- [ ] SHIP api-contract-v1
- [ ] backend-foundation-v1:数据库设计
- [ ] backend-foundation-v1:服务端框架搭建(Node.js/Python/Go?)
- [ ] backend-foundation-v1:JWT 认证实现
- [ ] backend-foundation-v1:微信登录 code 换 session
- [ ] mock-replacement-v1:前端替换 wx.request 对接真实 API
- [ ] wechat-integration-v1:手机号授权、订阅消息

---

## BLOCKERS

none

---

## NOTES

- 未修改任何 miniprogram 产品代码
- 未清理任何 mock 数据
- 前端框架阶段(07-quality-review)已 SHIP
