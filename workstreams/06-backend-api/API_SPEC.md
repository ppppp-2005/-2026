# 三都职通 API 接口规范 v1.1

> 状态: REVIEW — 已与 `docs/blueprint/backend-design-placeholder.md` 对齐
> 切片: 06-backend-api / api-contract-v1
> 日期: 2026-06-23
> 蓝图参考: `docs/blueprint/backend-design-placeholder.md`

---

## 1. 设计原则

1. **mock 数据即契约参考** — 当前 `data/*.js` 中的字段结构是后端需要返回的字段清单
2. **不清 mock,先定义后替换** — 本规范作为前后端契约,后端开发完成后前端再替换 `wx.request` 的 URL
3. **字段分级** — 每个字段标注:后端(B) / 微信开放能力(W) / 前端计算(F) / 待定(?)
4. **RESTful 风格** — 资源名词复数,HTTP 方法表达操作
5. **版本前缀** — `/api/v1/`
6. **蓝图对齐** — 响应格式、分页、角色命名、幂等键、模块划分均与后端蓝图一致

---

## 2. 通用规范

### 2.1 请求头

```
Content-Type: application/json
Authorization: Bearer <token>       // 登录后携带(opaque bearer token)
X-App-Version: 1.0.0
X-Platform: wechat-miniprogram
X-Request-Id: <uuid>                // 可选,后端生成时优先使用服务端 ID
Idempotency-Key: <uuid>            // 幂等写操作必传(见 §2.6)
```

### 2.2 响应格式

**成功响应 — 单资源:**

```json
{
  "data": { ... }
}
```

**成功响应 — 列表(含分页):**

```json
{
  "data": [ ... ],
  "meta": {
    "nextCursor": "eyJpZCI6MTAwfQ==",
    "hasMore": true
  }
}
```

**成功响应 — 创建(201):**

```json
{
  "data": { ... }
}
```

HTTP 状态码: `200`(读取/更新), `201`(创建), `204`(删除成功无 body)

**错误响应:**

```json
{
  "error": {
    "code": "INVALID_PARAMS",
    "message": "jobId 不能为空",
    "details": [
      { "field": "jobId", "issue": "required" }
    ],
    "requestId": "req-abc123"
  }
}
```

HTTP 状态码: `400`(参数错误), `401`(未认证), `403`(无权限), `404`(资源不存在), `409`(冲突/幂等键重复), `422`(业务校验失败), `429`(限流), `5xx`(服务端错误)

**统一错误码表:**

| 错误码 | HTTP | 含义 |
|---|---|---|
| `UNAUTHORIZED` | 401 | 缺少或无效的 Bearer token |
| `FORBIDDEN` | 403 | 已认证但无权限(角色/资源归属不匹配) |
| `NOT_FOUND` | 404 | 资源不存在 |
| `INVALID_PARAMS` | 400 | 请求参数校验失败 |
| `VALIDATION_FAILED` | 422 | 业务规则校验失败 |
| `CONFLICT_VERSION` | 409 | 乐观并发冲突(版本过期) |
| `IDEMPOTENCY_KEY_REUSED` | 409 | 幂等键已使用但 payload 不同 |
| `RATE_LIMITED` | 429 | 请求频率超限 |
| `INTERNAL_ERROR` | 500 | 服务端内部错误 |

> 生产环境错误响应不暴露堆栈、上游密钥或 session_key。

### 2.3 分页参数

| 参数 | 类型 | 说明 |
|---|---|---|
| cursor | string | 上一页返回的 `nextCursor`,首页不传 |
| limit | int | 每页条数,默认 20,上限 100 |

**分页响应(嵌套在 `meta` 中):**

```json
{
  "data": [ ... ],
  "meta": {
    "nextCursor": "eyJpZCI6MTAwfQ==",
    "hasMore": true
  }
}
```

> cursor 编码完整排序位置(通常 `created_at DESC, id DESC`),客户端不得解析 cursor 内容。首页请求不传 cursor,返回第一页。`hasMore` 为 `false` 时无 `nextCursor` 字段。

### 2.4 字段来源标记

| 标记 | 含义 | 说明 |
|---|---|---|
| B | 后端字段 | 由后端数据库存储和返回 |
| W | 微信开放能力 | 由 `wx.getUserProfile` / `wx.login` 等获取 |
| F | 前端计算 | 由前端根据其他字段计算得出 |
| ? | 待定 | 需要业务确认是否保留或调整 |

### 2.5 角色命名

全文统一使用以下角色标识:

| 角色 | 标识 | 说明 |
|---|---|---|
| 求职者 | `seeker` | 查看岗位、投递、管理简历 |
| 企业方 | `employer` | 发布岗位、管理候选人 |
| 管理员 | `admin` | 审核、管理后台 |

> 角色不替代资源归属检查。employer 访问始终限定在其所属 organization 范围内。

### 2.6 幂等键(Idempotency-Key)规则

幂等键用于防止重复提交,客户端为每个写操作生成 UUID。服务端按 `(actor, method, route, key)` 去重,保留至少 24 小时。

**v1 必须覆盖的接口:**

| 接口 | 幂等键 | 说明 |
|---|---|---|
| `POST /api/v1/jobs/:id/applications` | 必传 | 投递岗位,同一 seeker 对同一 job 只允许一次投递 |
| `POST /api/v1/employer/jobs` | 必传 | 发布岗位,防止重复创建 |
| `PATCH /api/v1/employer/candidates/:id/status` | 必传 | 更新候选人状态,防止重复推进 |

**v1 暂缓但后续必须覆盖:**

| 接口 | 幂等键 | 说明 |
|---|---|---|
| `POST /api/v1/training/sessions/:id/registrations` | 后续必传 | 培训报名,防止重复报名 |
| `POST /api/v1/files/upload-intent` | 后续必传 | 文件上传意图,防止重复创建上传凭证 |

**幂等行为:**
- 相同 key + 相同 payload → 返回原始结果(200)
- 相同 key + 不同 payload → 返回 `409 IDEMPOTENCY_KEY_REUSED`
- 数据库唯一约束是最终重复防护层

---

## 3. 首页 API

### 3.1 获取首页数据

```
GET /api/v1/home
```

**响应:**

```json
{
  "data": {
    "brand": {
      "title": "三都职通",           // B 品牌标题
      "subtitle": "贵州本地就业服务", // B 品牌副标题
      "versionLabel": "演示版"       // B 版本标签
    },
    "header": {
      "title": "找工作、学技能、看政策", // B 页面标题
      "subtitle": "先看信息，再决定去不去" // B 页面副标题
    },
    "entries": [
      {
        "id": "training",            // B 入口ID
        "icon": "training",          // B 图标标识
        "title": "技能培训",          // B 标题
        "description": "学门手艺再去找工作", // B 描述
        "url": "/pages/training/index" // F 前端路由(固定)
      }
    ],
    "services": [
      {
        "id": "policy",              // B 服务ID
        "icon": "policy",            // B 图标标识
        "title": "看政策",            // B 标题
        "description": "就业、培训、创业政策", // B 描述
        "url": "/pages/policy/index"  // F 前端路由(固定)
      }
    ],
    "notice": {
      "title": "使用说明",            // B 通知标题
      "text": "以下为本地示例信息..." // B 通知内容
    }
  }
}
```

**字段来源:**

| 字段路径 | 来源 | 说明 |
|---|---|---|
| brand.* | B | 运营配置,可后台调整 |
| header.* | B | 运营配置 |
| entries[].* | B + F | id/icon/title/description 来自 B,url 前端固定 |
| services[].* | B + F | 同上 |
| notice.* | B | 运营公告 |

---

## 4. 职位 API

### 4.1 获取职位列表

```
GET /api/v1/jobs
```

**查询参数:**

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| keyword | string | 否 | 搜索关键词 |
| zoneId | string | 否 | 区域筛选 |
| cursor | string | 否 | 分页游标,首页不传 |
| limit | int | 否 | 每页条数,默认 20,上限 100 |

**响应:**

```json
{
  "data": {
    "header": {
      "title": "附近职位",           // B 页面标题
      "subtitle": "先看信息，再决定是否联系" // B 副标题
    },
    "searchPlaceholder": "搜索岗位名称或关键词", // B 搜索提示
    "zones": [
      {
        "id": "all",                 // B 区域ID
        "name": "全部区域",           // B 区域名称
        "count": 6                   // B 职位数量
      }
    ],
    "jobs": [
      {
        "id": "job-gz-001",          // B 职位ID
        "title": "设备操作工",        // B 岗位名称
        "company": "贵阳白云区制造厂", // B 企业名称
        "salaryRange": "4500-6000元/月", // F 由 salaryMin/salaryMax 拼接
        "salaryMin": 4500,           // B 最低月薪(数字)
        "salaryMax": 6000,           // B 最高月薪(数字)
        "location": "贵阳市白云区",    // B 工作地点
        "district": "白云区",         // B 区县
        "workTime": "长白班，月休4天", // B 工作时间
        "requirements": "经验不限，入职有人教", // B 岗位要求
        "benefits": ["包工作餐", "可提供住宿"], // B 福利标签
        "headcount": 5,              // B 招聘人数
        "employmentType": "全职",     // B 用工类型
        "updatedAt": "2026-06-20",   // B 更新日期
        "isFavorite": false,         // B 是否收藏(需用户态)
        "contact": {                 // B 联系方式
          "name": "刘主管",
          "phone": "0851-XXXXXXX"
        }
      }
    ]
  },
  "meta": {
    "nextCursor": "...",
    "hasMore": true
  }
}
```

**字段来源:**

| 字段路径 | 来源 | 说明 |
|---|---|---|
| header.* | B | 运营配置 |
| zones[].* | B | 区域字典表 |
| jobs[].id | B | 主键 |
| jobs[].title | B | 岗位名称 |
| jobs[].company | B | 企业名称 |
| jobs[].salaryRange | F | 由 salaryMin/salaryMax 拼接 |
| jobs[].salaryMin/salaryMax | B | 数字,用于筛选排序 |
| jobs[].location/district | B | 地区信息 |
| jobs[].workTime | B | 工作时间描述 |
| jobs[].requirements | B | 岗位要求 |
| jobs[].benefits | B | 福利标签数组 |
| jobs[].headcount | B | 招聘人数 |
| jobs[].employmentType | B | 全职/兼职/实习 |
| jobs[].updatedAt | B | 更新时间 |
| jobs[].isFavorite | B | 用户关联数据 |
| jobs[].contact.* | B | 联系方式 |

### 4.2 获取职位详情

```
GET /api/v1/jobs/:id
```

**响应:** 同 jobs[] 单条 + 扩展字段

```json
{
  "data": {
    "id": "job-gz-001",
    "title": "设备操作工",
    "company": "贵阳白云区制造厂",
    "companyId": "comp-001",       // B 企业ID
    "salaryRange": "4500-6000元/月",
    "salaryMin": 4500,
    "salaryMax": 6000,
    "location": "贵阳市白云区",
    "district": "白云区",
    "workTime": "长白班，月休4天",
    "requirements": "经验不限，入职有人教",
    "benefits": ["包工作餐", "可提供住宿"],
    "headcount": 5,
    "employmentType": "全职",
    "updatedAt": "2026-06-20",
    "description": "详细岗位描述...", // B 岗位详细描述
    "isFavorite": false,
    "contact": {
      "name": "刘主管",
      "phone": "0851-XXXXXXX"
    },
    "companyInfo": {               // B 企业信息扩展
      "name": "贵阳白云区制造厂",
      "industry": "机械制造",
      "size": "100-499人",
      "address": "贵阳市白云区XX路XX号"
    }
  }
}
```

### 4.3 收藏/取消收藏职位

```
POST /api/v1/jobs/:id/favorite    // 收藏
DELETE /api/v1/jobs/:id/favorite  // 取消收藏
```

### 4.4 投递岗位

```
POST /api/v1/jobs/:id/applications
```

**请求头:** `Idempotency-Key: <uuid>` (必传)

**请求体:**

```json
{
  "resumeId": "resume-001"         // B 使用的简历ID(v1 可选,不传则使用当前活跃简历)
}
```

**成功响应(201):**

```json
{
  "data": {
    "id": "app-001",               // B 投递记录ID
    "jobId": "job-gz-001",         // B 岗位ID
    "seekerId": "user-001",        // B 求职者ID
    "status": "submitted",         // B 状态: submitted/viewed/shortlisted/rejected/withdrawn/hired
    "resumeSnapshot": { ... },     // B 不可变简历快照
    "createdAt": "2026-06-23T10:00:00+08:00"
  }
}
```

**错误响应:**

| 场景 | 错误码 | HTTP |
|---|---|---|
| 已投递过该岗位 | `ALREADY_APPLIED` | 409 |
| 幂等键重复但 payload 不同 | `IDEMPOTENCY_KEY_REUSED` | 409 |
| 岗位不存在或已下架 | `NOT_FOUND` | 404 |
| 未登录 | `UNAUTHORIZED` | 401 |

---

## 5. 交流(活动) API

### 5.1 获取活动列表

```
GET /api/v1/events
```

**响应:**

```json
{
  "data": {
    "header": {
      "title": "就业交流",           // B 页面标题
      "subtitle": "招聘会、宣讲会、经验分享" // B 副标题
    },
    "events": [
      {
        "id": "event-gz-001",        // B 活动ID
        "title": "贵阳夏季招聘会",     // B 活动标题
        "dateText": "6月20日",        // B 日期文本
        "timeText": "09:00-15:00",    // B 时间文本
        "location": "贵阳国际人才城",  // B 地点
        "organizer": "贵阳市人社局",   // B 主办方
        "audience": "求职者、企业HR",  // B 面向人群
        "description": "活动详情...",  // B 活动描述
        "status": "upcoming",         // B 状态: upcoming/ongoing/ended
        "isRegistered": false         // B 是否已报名(v1 仅展示,不接真实报名)
      }
    ]
  }
}
```

### 5.2 获取活动详情

```
GET /api/v1/events/:id
```

---

## 6. 消息 API

### 6.1 获取消息列表

```
GET /api/v1/notifications
```

> 路由与蓝图 `/api/v1/notifications/*` 对齐。

**查询参数:**

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| cursor | string | 否 | 分页游标 |
| limit | int | 否 | 每页条数,默认 20 |

**响应:**

```json
{
  "data": {
    "header": {
      "title": "消息中心",           // B 页面标题
      "subtitle": "面试通知、报名提醒、系统公告" // B 副标题
    },
    "notifications": [
      {
        "id": "msg-001",             // B 消息ID
        "type": "interview",          // B 类型: interview/notice/system
        "title": "面试通知",           // B 标题
        "content": "您投递的...",      // B 内容
        "sender": "贵阳白云区制造厂",  // B 发送方
        "sentAt": "2026-06-20T10:00:00+08:00", // B 发送时间
        "isRead": false,             // B 是否已读
        "action": {                  // B 可操作动作
          "type": "navigate",
          "url": "/pages/job-detail/index?id=job-gz-001"
        }
      }
    ],
    "unreadCount": 3               // B 未读数量
  },
  "meta": {
    "nextCursor": "...",
    "hasMore": true
  }
}
```

### 6.2 标记消息已读

```
POST /api/v1/notifications/:id/read
```

### 6.3 归档消息

```
POST /api/v1/notifications/:id/archive
```

---

## 7. 用户/登录 API

### 7.1 微信登录

```
POST /api/v1/auth/wechat
```

> 路由与蓝图 `POST /api/v1/auth/wechat` 对齐。

**请求体:**

```json
{
  "code": "wx_login_code"          // W wx.login 获取的 code
}
```

**响应(200):**

```json
{
  "data": {
    "token": "opaque_token_string",  // B opaque bearer token
    "expiresIn": 7200,              // B token 有效期(秒)
    "user": {
      "id": "user-001",              // B 用户ID
      "unionId": "wx_union_id",      // W 微信 unionId
      "openId": "wx_open_id",        // W 微信 openId
      "nickName": "微信用户",         // W 微信昵称
      "avatarUrl": "https://...",    // W 微信头像
      "role": "seeker",              // B 角色: seeker/employer/admin
      "profile": {
        "realName": "",              // B 真实姓名
        "phone": "",                 // B 手机号(v1 手动填写)
        "idCard": "",                // B 身份证号
        "location": "",              // B 所在地
        "skills": [],                // B 技能标签
        "experience": ""             // B 工作经验
      }
    }
  }
}
```

> 登录轮换当前设备 session;logout 撤销 session。服务端不返回或记录 `session_key`。

### 7.2 获取当前用户信息

```
GET /api/v1/me
```

> 路由与蓝图 `/api/v1/me/*` 对齐。

**响应:** 同 7.1 `user` 对象

### 7.3 更新用户资料

```
PATCH /api/v1/me/profile
```

**请求体:**

```json
{
  "realName": "张三",
  "phone": "13800138000",
  "location": "贵阳市观山湖区",
  "skills": ["电工", "焊接"]
}
```

### 7.4 切换角色

```
POST /api/v1/me/switch-role
```

**请求体:**

```json
{
  "role": "employer"  // seeker / employer
}
```

### 7.5 登出

```
POST /api/v1/auth/logout
```

撤销当前 session token。

---

## 8. 简历 API

### 8.1 获取当前简历

```
GET /api/v1/me/resume
```

**响应:**

```json
{
  "data": {
    "id": "resume-001",             // B 简历ID
    "status": "active",             // B 状态: draft/active/archived
    "realName": "张三",             // B 姓名
    "phone": "13800138000",         // B 手机号
    "age": 28,                      // B 年龄
    "location": "贵阳市观山湖区",    // B 所在地
    "skills": ["电工", "焊接"],      // B 技能标签
    "experience": "3年工厂操作经验",  // B 工作经验
    "education": "高中",            // B 学历
    "jobIntention": "设备操作工",    // B 求职意向
    "updatedAt": "2026-06-23T10:00:00+08:00"
  }
}
```

### 8.2 更新简历

```
PATCH /api/v1/me/resume
```

**请求体:** 同 8.1 可更新字段

**响应:** 更新后的完整简历对象

> v1 不做文件上传,简历信息通过表单字段保存。一个 seeker 可拥有多份简历但只有一份活跃简历。

### 8.3 清空简历

```
DELETE /api/v1/me/resume
```

将当前活跃简历标记为 `archived`。投递记录中引用的简历快照不受影响。

---

## 9. 投递记录 API

### 9.1 获取我的投递列表

```
GET /api/v1/me/applications
```

**查询参数:**

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| cursor | string | 否 | 分页游标 |
| limit | int | 否 | 每页条数,默认 20 |
| status | string | 否 | 筛选状态: submitted/viewed/shortlisted/rejected/withdrawn/hired |

**响应:**

```json
{
  "data": [
    {
      "id": "app-001",               // B 投递ID
      "jobId": "job-gz-001",         // B 岗位ID
      "jobTitle": "设备操作工",       // B 岗位名称
      "company": "贵阳白云区制造厂",  // B 企业名称
      "status": "submitted",         // B 状态
      "statusLabel": "已投递",        // B 状态标签
      "appliedAt": "2026-06-23T10:00:00+08:00", // B 投递时间
      "updatedAt": "2026-06-23T10:00:00+08:00"  // B 最后更新时间
    }
  ],
  "meta": {
    "nextCursor": "...",
    "hasMore": true
  }
}
```

### 9.2 撤回投递

```
POST /api/v1/me/applications/:id/withdraw
```

> 仅 seeker 可撤回自己处于 `submitted`/`viewed`/`shortlisted` 状态的投递。`hired` 状态不可撤回。

**成功响应(200):**

```json
{
  "data": {
    "id": "app-001",
    "status": "withdrawn",
    "withdrawnAt": "2026-06-23T12:00:00+08:00"
  }
}
```

---

## 10. 企业 API

### 10.1 获取企业信息

```
GET /api/v1/employer/organizations/me
```

> 路由与蓝图 `/api/v1/employer/organizations/*` 对齐。

**响应:**

```json
{
  "data": {
    "company": {
      "id": "comp-001",            // B 企业ID
      "name": "贵州黔味食品有限公司", // B 企业名称
      "location": "贵阳市修文县扎佐街道", // B 工作地点
      "industry": "食品加工",       // B 所属行业
      "size": "50-99人",            // B 企业规模
      "contactName": "罗师傅",      // B 联系人
      "contactPhone": "",           // B 联系电话
      "licenseNumber": "",          // B 营业执照号(认证后)
      "isVerified": false           // B 是否已认证
    },
    "summary": {
      "recruitingCount": 3,        // B 招聘中岗位数
      "candidateCount": 6,         // B 候选人总数
      "pendingCount": 3            // B 待查看数
    },
    "jobs": [
      {
        "id": "employer-job-001",  // B 岗位ID
        "title": "食品包装工",      // B 岗位名称
        "salary": "4000至5200元/月", // B 薪资文本
        "location": "贵阳市修文县扎佐街道", // B 工作地点
        "headcount": 8,            // B 招聘人数
        "interestedCount": 3,      // B 感兴趣人数
        "status": "active",         // B 状态: active/paused/closed
        "statusLabel": "招聘中",     // B 状态标签
        "updatedAt": "2026-06-20"  // B 更新时间
      }
    ]
  }
}
```

### 10.2 更新企业资料

```
PATCH /api/v1/employer/organizations/me
```

### 10.3 发布岗位

```
POST /api/v1/employer/jobs
```

**请求头:** `Idempotency-Key: <uuid>` (必传)

**请求体:**

```json
{
  "title": "食品包装工",           // B 岗位名称
  "headcount": 8,                 // B 招聘人数
  "salaryMin": 4000,              // B 最低月薪
  "salaryMax": 5200,              // B 最高月薪
  "location": "贵阳市修文县扎佐街道", // B 工作地点
  "workTime": "长白班，月休4天",   // B 工作时间
  "requirements": "经验不限，入职有人教", // B 岗位要求
  "benefitsText": "包工作餐，可提供住宿" // B 福利(逗号分隔)
}
```

**成功响应(201):**

```json
{
  "data": {
    "id": "employer-job-002",
    "status": "pending_review",
    "createdAt": "2026-06-23T10:00:00+08:00"
  }
}
```

### 10.4 获取候选人列表

```
GET /api/v1/employer/applications
```

> 路由与蓝图 `/api/v1/employer/applications/*` 对齐。

**查询参数:**

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| jobId | string | 否 | 按岗位筛选 |
| status | string | 否 | 状态: submitted/viewed/shortlisted/rejected |
| cursor | string | 否 | 分页游标 |
| limit | int | 否 | 每页条数,默认 20 |

**响应:**

```json
{
  "data": [
    {
      "id": "candidate-001",     // B 候选人ID(即投递记录ID)
      "seekerName": "王师傅",     // B 姓名
      "age": 38,                  // B 年龄(数字)
      "ageText": "38岁",         // F 年龄文本
      "location": "贵阳市修文县",  // B 所在地
      "experience": "做过3年食品包装", // B 工作经验
      "targetJobId": "employer-job-001", // B 目标岗位ID
      "targetJobTitle": "食品包装工", // B 目标岗位名称
      "status": "submitted",      // B 状态
      "statusLabel": "待查看",     // B 状态标签
      "highlights": ["可接受长白班", "住在附近"], // B 亮点标签
      "appliedAt": "2026-06-20T08:00:00+08:00" // B 投递时间
    }
  ],
  "meta": {
    "nextCursor": "...",
    "hasMore": true
  }
}
```

### 10.5 更新候选人状态

```
PATCH /api/v1/employer/applications/:id/status
```

**请求头:** `Idempotency-Key: <uuid>` (必传)

**请求体:**

```json
{
  "status": "reviewed",           // submitted/viewed/shortlisted/rejected/hired
  "remark": "经验合适，安排面试"    // B 备注(可选)
}
```

> 状态转换只能向前推进(蓝图的 forward-only 规则),除了 seeker 侧的 `withdrawn`。

---

## 11. 技能培训 API

### 11.1 获取课程列表

```
GET /api/v1/training/courses
```

**响应:**

```json
{
  "data": {
    "header": {
      "title": "技能培训",           // B 页面标题
      "subtitle": "学门手艺，好找工作" // B 副标题
    },
    "categories": [
      {
        "id": "all",               // B 分类ID
        "name": "全部课程"           // B 分类名称
      }
    ],
    "courses": [
      {
        "id": "course-care-1",     // B 课程ID
        "categoryId": "care",      // B 分类ID
        "title": "养老护理基础班",   // B 课程名称
        "summary": "学照顾老人...",  // B 课程简介
        "schedule": "7月8日开班 · 连上7天", // B 开班时间
        "classTime": "每天 9:00-16:30", // B 上课时间
        "location": "贵阳市观山湖区...", // B 上课地点
        "fee": "符合条件可免费",     // B 费用说明
        "provider": "观山湖区就业培训点", // B 培训机构
        "audience": "想做养老护理的人", // B 面向人群
        "badge": "离家近",           // B 推荐标签
        "tags": ["老师带练", "推荐就业"] // B 特点标签
      }
    ]
  }
}
```

### 11.2 获取班次列表(报名页)

```
GET /api/v1/training/sessions
```

**响应:**

```json
{
  "data": {
    "header": {
      "title": "技能培训报名",       // B 页面标题
      "availableCount": 3,         // B 可报名班次数量
      "availableLabel": "个班次可报名" // B 标签文本
    },
    "sessions": [
      {
        "id": "training-gy-202607-housekeeping", // B 班次ID
        "courseCode": "GZ-GY-JZ-202607", // B 课程编码
        "title": "家政服务与养老护理", // B 课程名称
        "shortTitle": "家政护理",     // B 简称
        "category": "生活服务",       // B 分类
        "summary": "学清洁、做饭...",  // B 简介
        "status": "open",            // B 状态: open/limited/ended
        "statusLabel": "可报名",      // B 状态标签
        "statusHint": "名额充足",     // B 状态提示
        "capacity": {
          "total": 30,               // B 总名额
          "enrolled": 18,            // B 已报名
          "remaining": 12            // F 剩余名额(total-enrolled)
        },
        "schedule": {
          "startDate": "2026-07-06", // B 开始日期
          "endDate": "2026-07-17",   // B 结束日期
          "dateText": "7月6日开班，共10天", // F 日期文本
          "timeText": "每天 09:00-16:30" // B 时间文本
        },
        "venue": {
          "province": "贵州省",       // B 省
          "city": "贵阳市",          // B 市
          "district": "观山湖区",    // B 区县
          "name": "贵阳市公共实训基地", // B 场地名称
          "address": "观山湖区职教路实训楼" // B 详细地址
        },
        "fee": {
          "amount": 0,               // B 金额(0表示免费)
          "currency": "CNY",         // B 货币
          "display": "免费，符合条件可申请补贴" // F 显示文本
        },
        "eligibility": ["年龄18至55周岁", "能正常参加白天培训"], // B 报名条件
        "provider": "贵阳市就业技能培训中心" // B 培训机构
      }
    ]
  }
}
```

> **v1 暂缓:** 培训真实报名接口 `POST /api/v1/training/sessions/:id/registrations` 在 v1 只展示班次,真实报名后续单独切片实现。后续实现时必须携带 `Idempotency-Key`。

---

## 12. 政策 API

### 12.1 获取政策列表

```
GET /api/v1/policies
```

**查询参数:**

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| categoryId | string | 否 | 分类: all/work/training/migrant/business |

**响应:**

```json
{
  "data": {
    "meta": {
      "version": "2026-06",        // B 数据版本
      "updatedAt": "2026年6月",    // B 更新时间
      "sourceNote": "以下为贵州就业政策..." // B 来源说明
    },
    "header": {
      "title": "看政策",            // B 页面标题
      "countLabel": "项政策提醒"    // B 计数标签
    },
    "categories": [
      {
        "id": "all",               // B 分类ID
        "name": "全部政策",         // B 分类名称
        "shortName": "全部",        // B 简称
        "mark": "全"               // B 标记
      }
    ],
    "policies": [
      {
        "id": "migrant-transport",   // B 政策ID
        "categoryId": "migrant",    // B 分类ID
        "categoryName": "外出务工",  // B 分类名称
        "title": "跨省务工交通补助", // B 政策标题
        "summary": "到省外稳定务工...", // B 政策摘要
        "audience": "贵州户籍、跨省务工...", // B 适用人群
        "benefit": "补助金额按务工地点...", // B 补贴内容
        "office": "户籍所在乡镇...", // B 办理地点
        "publishedAt": "2026-03",   // B 发布时间
        "amountLabel": "一次性补助", // B 金额标签
        "tags": ["跨省务工", "先就业后申请"], // B 标签
        "materials": ["身份证和社保卡", "劳动合同"], // B 所需材料
        "steps": ["先向户籍地窗口确认", "准备证明", "提交申请"] // B 办理步骤
      }
    ]
  }
}
```

---

## 13. 用工信息 API

### 13.1 获取用工需求列表

```
GET /api/v1/labor/demands
```

**查询参数:**

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| categoryId | string | 否 | 分类: all/long/short/urgent |

**响应:**

```json
{
  "data": {
    "header": {
      "eyebrow": "贵州本地用工",     // B 眉标
      "title": "近期哪里需要人",     // B 标题
      "demandCount": 6,            // B 需求数量
      "openingCount": 113          // B 总岗位数
    },
    "filters": [
      {
        "id": "all",               // B 筛选ID
        "name": "全部",             // B 名称
        "description": "查看所有信息" // B 描述
      }
    ],
    "demands": [
      {
        "id": "labor-gy-food-01",  // B 需求ID
        "categoryId": "long",      // B 分类ID
        "categoryName": "长期用工",  // B 分类名称
        "title": "食品包装与分拣工", // B 岗位名称
        "employer": "贵阳白云区食品加工企业", // B 雇主
        "people": 18,              // B 招聘人数
        "peopleText": "招18人",    // F 人数文本
        "duration": "6个月以上",    // B 工期
        "location": "贵阳市白云区麦架镇", // B 地点
        "treatment": "4800-6200元/月", // B 待遇
        "treatmentNote": "计件为主...", // B 待遇说明
        "requirements": "18至52岁...", // B 要求
        "benefits": ["包工作餐", "可安排住宿"], // B 福利
        "updatedText": "今日更新",  // B 更新文本
        "contact": {               // B 联系方式
          "name": "王师傅",
          "phone": "0851-XXXXXXX",
          "servicePoint": "白云区就业服务点"
        }
      }
    ]
  }
}
```

---

## 14. 校园招聘 API

### 14.1 获取校园活动列表

```
GET /api/v1/campus/events
```

**响应:**

```json
{
  "data": {
    "meta": {
      "province": "贵州省"          // B 省份
    },
    "header": {
      "title": "毕业找工作，先看时间地点", // B 标题
      "notice": "以下为贵州本地示例信息..." // B 通知
    },
    "events": [
      {
        "id": "event-guiyang-summer-2026", // B 活动ID
        "type": "job-fair",         // B 类型: job-fair/seminar
        "title": "贵阳高校毕业生夏季双选会", // B 标题
        "organizer": "贵阳高校就业服务联合专场", // B 主办方
        "startAt": "2026-06-20T09:00:00+08:00", // B 开始时间
        "endAt": "2026-06-20T15:00:00+08:00", // B 结束时间
        "dateText": "06月20日 周六", // F 日期文本
        "timeText": "09:00-15:00",  // F 时间文本
        "city": "贵阳市",           // B 城市
        "district": "观山湖区",     // B 区县
        "venue": "贵阳国际人才城一楼招聘大厅", // B 地点
        "audience": "2026届毕业生",  // B 面向人群
        "companyCountText": "约80家单位", // B 企业数量
        "status": "open",           // B 状态
        "actionText": "安排已展示"   // B 操作文本
      }
    ]
  }
}
```

### 14.2 获取校园岗位列表

```
GET /api/v1/campus/opportunities
```

**查询参数:**

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| type | string | 否 | 类型: all/graduate/internship |

**响应:**

```json
{
  "data": {
    "opportunities": [
      {
        "id": "opportunity-gy-operations-01", // B 岗位ID
        "type": "graduate",         // B 类型
        "typeLabel": "应届岗位",     // F 类型标签
        "title": "新媒体运营助理",   // B 岗位名称
        "company": "贵州黔途文旅服务有限公司", // B 企业
        "city": "贵阳市",           // B 城市
        "district": "观山湖区",     // B 区县
        "locationText": "贵阳市观山湖区", // F 地点文本
        "salaryText": "4000-5500元/月", // B 薪资文本
        "education": "大专及以上",   // B 学历要求
        "graduationYears": [2025, 2026], // B 毕业年份
        "headcount": 3,            // B 招聘人数
        "deadlineAt": "2026-07-10T23:59:59+08:00", // B 截止日期
        "deadlineText": "07月10日截止", // F 截止文本
        "labels": ["有人带教", "周末双休"], // B 标签
        "actionText": "详情暂未开放" // B 操作文本
      }
    ]
  }
}
```

---

## 15. 返乡就业 API

### 15.1 获取返乡服务数据

```
GET /api/v1/return-home
```

**响应:**

```json
{
  "data": {
    "meta": {
      "dataVersion": "2026-06-18", // B 数据版本
      "sourceLabel": "贵州返乡服务示例信息" // B 来源标签
    },
    "header": {
      "eyebrow": "返乡专区",       // B 眉标
      "title": "回家找工作，办事少跑路", // B 标题
      "notice": "以下为示例信息..." // B 通知
    },
    "categories": [
      {
        "id": "jobs",              // B 分类ID
        "name": "本地岗位",         // B 名称
        "summary": "看工资和地点",   // B 摘要
        "countLabel": "4个示例岗位", // B 计数标签
        "target": "local-jobs"     // B 目标区块
      }
    ],
    "jobFilters": [
      {
        "id": "guiyang",           // B 筛选ID
        "label": "贵阳",            // B 标签
        "regionCode": "520100"     // B 行政区划代码
      }
    ],
    "localJobs": [
      {
        "id": "gz-guiyang-logistics-01", // B 岗位ID
        "regionCode": "520100",    // B 区域代码
        "region": "贵阳",          // B 区域名称
        "district": "观山湖区",    // B 区县
        "title": "仓库分拣员",      // B 岗位名称
        "salary": "4500-6000元/月", // B 薪资
        "company": "观山湖区物流园企业", // B 企业
        "employmentType": "全职",   // B 用工类型
        "hiringCount": 8,          // B 招聘人数
        "summary": "白班为主...",   // B 简介
        "benefits": ["提供工作餐", "月休4天"], // B 福利
        "contactChannel": "当地就业服务站", // B 联系渠道
        "actionText": "岗位咨询",   // B 操作文本
        "feedback": "请联系就业站"  // B 反馈文本
      }
    ],
    "startupSupports": [
      {
        "id": "startup-consulting", // B 支持ID
        "title": "返乡创业咨询",     // B 标题
        "audience": "准备开店...",  // B 面向人群
        "support": "先了解登记...", // B 支持内容
        "servicePlace": "户籍地或创业地政务服务中心", // B 服务地点
        "reminder": "带身份证和创业想法...", // B 提醒
        "actionText": "先去咨询",   // B 操作文本
        "feedback": "先到窗口咨询"  // B 反馈文本
      }
    ],
    "services": [
      {
        "id": "employment-registration", // B 服务ID
        "title": "就业登记与岗位推荐", // B 标题
        "purpose": "登记求职意向...", // B 目的
        "materials": "身份证、联系电话...", // B 所需材料
        "servicePlace": "乡镇便民服务中心", // B 服务地点
        "serviceHours": "工作日办理...", // B 服务时间
        "actionText": "办理提醒",   // B 操作文本
        "feedback": "带身份证咨询"  // B 反馈文本
      }
    ]
  }
}
```

---

## 16. 隐私 API

### 16.1 提交隐私同意

```
POST /api/v1/privacy/consents
```

**请求体:**

```json
{
  "policyVersion": "v1.0",         // B 隐私协议版本
  "consentedAt": "2026-06-23T10:00:00+08:00", // B 同意时间
  "consentItems": ["phone", "profile", "resume"] // B 同意项
}
```

**成功响应(201):**

```json
{
  "data": {
    "id": "consent-001",
    "policyVersion": "v1.0",
    "consentedAt": "2026-06-23T10:00:00+08:00",
    "consentItems": ["phone", "profile", "resume"]
  }
}
```

### 16.2 查询当前隐私同意状态

```
GET /api/v1/privacy/consents/current
```

**响应:**

```json
{
  "data": {
    "policyVersion": "v1.0",
    "consentedAt": "2026-06-23T10:00:00+08:00",
    "consentItems": ["phone", "profile", "resume"],
    "updatedAt": "2026-06-23T10:00:00+08:00"
  }
}
```

---

## 17. 账号 API

### 17.1 注销账号

```
POST /api/v1/me/deactivate
```

> 将用户标记为 `deleted`,保留审计记录。投递/简历快照保留但脱敏。操作需二次确认。

**请求体:**

```json
{
  "reason": "不再使用"             // B 注销原因(可选)
}
```

**成功响应(200):**

```json
{
  "data": {
    "userId": "user-001",
    "status": "deleted",
    "deactivatedAt": "2026-06-23T12:00:00+08:00"
  }
}
```

---

## 18. 后端模块映射

以下将 API 路由组映射到蓝图定义的后端模块(`docs/blueprint/backend-design-placeholder.md`)。

| 蓝图模块 | API 路由组 | 职责 |
|---|---|---|
| `identity-access` | `/api/v1/auth/*` | 微信登录、session 管理、token 轮换/撤销、角色授权策略 |
| `users` | `/api/v1/me/*` (profile/switch-role/deactivate) | 用户生命周期、seeker profile、联系方式、隐私偏好 |
| `organizations` | `/api/v1/employer/organizations/*` | 企业组织、认证状态、成员管理 |
| `jobs` | `/api/v1/jobs/*` (列表/详情/收藏) | 岗位草稿、审核、发布、搜索筛选、公开读取 |
| `resumes` | `/api/v1/me/resume/*` | seeker 简历 CRUD、技能/经验、active/archive 生命周期 |
| `applications` | `/api/v1/jobs/:id/applications`, `/api/v1/me/applications/*`, `/api/v1/employer/applications/*` | 投递提交、不可变简历快照、状态流转、employer 反馈 |
| `notifications` | `/api/v1/notifications/*` | 站内通知、已读/归档操作 |
| `administration` | `/api/v1/admin/*` (v1 暂缓) | 组织/岗位审核、账号管理(v1 采用人工录入) |
| `audit-platform` | 审计日志(内部) | 认证变更、角色授予、审核、岗位发布、投递状态转换、导出/销毁操作的审计记录 |

> v1 暂不实现 `administration` 和 `files` 模块的 API 端点。`files` 模块(文件上传)在 v1 不启用。

---

## 19. 字段汇总表

### 19.1 按来源分类

| 来源 | 字段数量 | 说明 |
|---|---|---|
| B (后端) | ~200+ | 核心数据,需数据库设计和 API 实现 |
| W (微信) | ~5 | openId, unionId, nickName, avatarUrl, gender |
| F (前端计算) | ~20 | salaryRange, dateText, timeText, deadlineText, remaining 等 |
| ? (待定) | 0 | 本版已全部分类 |

### 19.2 核心实体关系

```
User (用户)
  ├── openId, unionId (W)
  ├── nickName, avatarUrl (W)
  ├── role: seeker | employer | admin (B)
  ├── status: active | suspended | deleted (B)
  └── SeekerProfile (B)
        ├── realName, phone, idCard
        ├── location, skills, experience

WechatIdentity (微信身份)
  ├── userId → User (B)
  ├── openId (W)
  └── unionId (W, 可选)

Session (会话)
  ├── userId → User (B)
  ├── tokenHash (B, 不返回原文)
  ├── expiresAt (B)
  └── status: active | revoked | expired (B)

Organization (企业)
  ├── id, name, location, industry
  ├── size, contactName, contactPhone
  ├── licenseNumber, isVerified
  ├── status: pending_review | verified | rejected | suspended
  └── jobs[] (关联)

Job (职位)
  ├── id, organizationId → Organization
  ├── title, salaryMin, salaryMax, location, district
  ├── workTime, requirements, benefits[]
  ├── headcount, employmentType
  ├── status: draft | pending_review | published | paused | closed | rejected
  └── contact: { name, phone }

Resume (简历)
  ├── id, userId → User
  ├── realName, phone, age, location
  ├── skills[], experience, education, jobIntention
  └── status: draft | active | archived

Application (投递)
  ├── id, jobId → Job, seekerId → User
  ├── resumeSnapshot (不可变)
  ├── status: submitted | viewed | shortlisted | rejected | withdrawn | hired
  └── appliedAt, updatedAt

Event (活动)
  ├── id, title, type
  ├── startAt, endAt, location
  ├── organizer, audience, status

TrainingSession (培训班次)
  ├── id, courseCode, title
  ├── status, capacity { total, enrolled }
  ├── schedule { startDate, endDate, timeText }
  ├── venue { province, city, district, name, address }
  ├── fee { amount, currency }
  └── eligibility[]

Policy (政策)
  ├── id, categoryId, title
  ├── summary, audience, benefit
  ├── office, publishedAt
  ├── tags[], materials[], steps[]

Notification (消息)
  ├── id, userId → User, type
  ├── title, content, sender
  ├── sentAt, isRead
  └── status: unread | read | archived

PrivacyConsent (隐私同意)
  ├── id, userId → User
  ├── policyVersion, consentItems[]
  └── consentedAt
```

---

## 20. 微信开放能力字段清单

| 字段 | 来源 API | 用途 | 隐私级别 |
|---|---|---|---|
| openId | `wx.login` | 用户唯一标识(当前小程序) | 低 |
| unionId | `wx.login` + 绑定开放平台 | 跨小程序唯一标识 | 中 |
| nickName | `wx.getUserProfile` | 用户昵称 | 低 |
| avatarUrl | `wx.getUserProfile` | 用户头像 URL | 低 |
| gender | `wx.getUserProfile` | 性别 | 低 |
| phoneNumber | v1 用户手动填写；后续可选 `wx.getPhoneNumber` | 手机号 | 高 |

> `wx.getUserProfile` 已逐步废弃,后续可能需要调整为用户主动填写昵称/头像。

---

## 21. v1 范围决策

第一版目标是让家乡就业小程序先真实跑起来,优先完成岗位发布、岗位浏览、联系/投递、企业和求职者基础管理。以下能力先采用低风险方案,避免过早引入微信授权、文件存储和复杂审核。

| 事项 | v1 决策 | 暂缓原因 | 后续升级条件 |
|---|---|---|---|
| 手机号 | 用户手动填写手机号,后端做格式校验和脱敏展示 | `wx.getPhoneNumber` 需要微信授权、后端解密和更严格隐私说明 | 登录体系稳定、隐私协议完善后再接微信手机号授权 |
| 企业认证 | 先由运营/家人线下确认企业身份,后台录入认证状态 | 营业执照上传涉及文件存储、敏感证照、审核流程和删除机制 | 有明确企业审核人和文件安全方案后再做证照上传 |
| 消息推送 | 先做站内消息,不接微信订阅消息 | 订阅消息需要模板、用户授权、发送限制和审核配置 | 投递/面试通知流程稳定后再接订阅消息 |
| 搜索 | 后端提供简单关键词 + 地区 + 岗位类型筛选,列表接口支持游标分页 | 前端本地筛选无法覆盖真实大量岗位；复杂全文检索第一版成本偏高 | 岗位量明显增加后再升级全文检索或搜索服务 |
| 地图定位 | v1 不接定位,使用县城/乡镇/外省务工等地区筛选 | `wx.getLocation` 涉及定位授权、失败兜底和隐私说明 | 需要"附近岗位"且岗位有准确经纬度后再接 |
| 文件上传 | v1 不上传简历/营业执照,用表单字段替代 | 文件上传需要存储、格式校验、大小限制、敏感信息保护和删除机制 | 简历和企业证照流程成熟后再做上传 |
| 培训报名 | v1 只展示班次列表,真实报名后续单独切片 | 报名涉及名额扣减、退款、通知等完整流程 | 后续 `training-registration-v1` 切片 |
| 活动报名 | v1 只展示活动信息,不接真实报名 | 活动报名规则和流程需单独设计 | 后续 `event-registration-v1` 切片 |

> 这些是当前 API 契约的默认边界。后续若要启用暂缓能力,必须新开独立切片,先更新 API_SPEC.md 和隐私/权限说明,再进入实现。

---

## 22. 删除/撤回策略

| 操作 | 接口 | 行为 | 备注 |
|---|---|---|---|
| 撤回投递 | `POST /api/v1/me/applications/:id/withdraw` | 状态 → `withdrawn`,不可恢复 | 仅 `submitted`/`viewed`/`shortlisted` 可撤回 |
| 清空简历 | `DELETE /api/v1/me/resume` | 状态 → `archived` | 已投递记录中的简历快照不受影响 |
| 注销账号 | `POST /api/v1/me/deactivate` | 用户状态 → `deleted` | 保留审计记录,投递/简历脱敏保留 |
| 取消收藏 | `DELETE /api/v1/jobs/:id/favorite` | 删除收藏记录 | — |

---

## 23. 后续切片规划

| 切片 | 内容 | 依赖 |
|---|---|---|
| backend-foundation-v1 | 数据库设计、服务端框架搭建、JWT 认证 | api-contract-v1 SHIP |
| mock-replacement-v1 | 前端替换 wx.request,对接真实 API | backend-foundation-v1 BUILD |
| wechat-integration-v1 | 微信登录能力完善、可选手机号授权、可选订阅消息 | backend-foundation-v1 BUILD + v1 业务流程稳定 |
| training-registration-v1 | 培训真实报名(含 Idempotency-Key) | backend-foundation-v1 BUILD |
| event-registration-v1 | 活动真实报名 | backend-foundation-v1 BUILD |
| file-upload-v1 | 简历/营业执照文件上传 | backend-foundation-v1 BUILD + 隐私/安全方案就绪 |

---

## 24. 运营/后台管理说明

v1 不提供管理后台 API 端点(`/api/v1/admin/*`)。以下运营操作采用人工方式:

- 企业认证: 运营/家人线下确认,后台直接修改数据库 `isVerified` 状态
- 岗位审核: v1 岗位发布后直接进入 `published` 状态,暂不做审核流程
- 政策/培训信息维护: 运营直接编辑数据库或配置文件
- 候选人管理: 通过企业端 API 完成

> 后续 `administration` 模块实现后,以上操作将迁移到管理 API,并记录审计日志。

---

*文档版本: v1.1*
*最后更新: 2026-06-23*
*维护者: 06-backend-api / api-contract-v1*
