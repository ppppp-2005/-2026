const profileMock = {
  routes: {
    login: "/pages/profile-login/index",
    resume: "/pages/profile-resume/index",
    applications: "/pages/profile-applications/index",
    employer: "/pages/employer/index"
  },
  hub: {
    header: {
      label: "我的",
      title: "求职事情集中看",
      subtitle: "先完善演示资料，再查看简历和投递记录",
      dataLabel: "本地演示"
    },
    identity: {
      name: "求职者演示账号",
      statusLabel: "未登录 · 演示资料",
      note: "这里不读取微信身份，也不保存个人资料。"
    },
    completeness: {
      value: 72,
      label: "演示资料完整度",
      note: "补充工作经历后，预览会更完整。"
    },
    intent: {
      role: "普工 / 包装工",
      location: "贵阳及周边",
      salary: "4500至6000元/月"
    },
    summary: [
      { id: "all", value: "4", label: "演示投递" },
      { id: "pending", value: "1", label: "待查看" },
      { id: "contacted", value: "1", label: "已沟通" }
    ],
    entries: [
      {
        id: "resume",
        title: "我的简历",
        description: "本地编辑、校验和预览",
        actionText: "去完善",
        routeKey: "resume"
      },
      {
        id: "applications",
        title: "投递记录",
        description: "按演示状态筛选查看",
        actionText: "看记录",
        routeKey: "applications"
      }
    ],
    roles: [
      {
        id: "seeker",
        name: "求职者",
        description: "查看本地求职演示",
        available: true
      },
      {
        id: "employer",
        name: "招聘方",
        description: "进入本地招聘演示",
        available: true
      }
    ],
    help: {
      title: "使用说明",
      text: "所有资料、登录和投递状态都是本地示例。真实登录、保存和申请功能暂未开放。"
    }
  },
  login: {
    header: {
      label: "会话体验",
      title: "先知情，再体验",
      subtitle: "只改变本次小程序运行期的前端状态",
      dataLabel: "本地状态演示"
    },
    status: {
      title: "当前未登录",
      text: "没有本地演示会话，也没有读取微信身份。"
    },
    permissions: [
      { id: "identity", name: "微信身份", state: "不读取" },
      { id: "phone", name: "手机号码", state: "不索取" },
      { id: "storage", name: "本地存储", state: "不写入" }
    ],
    disclosures: [
      {
        id: "collect",
        title: "本页会处理什么",
        text: "只处理协议勾选、演示角色和会话状态，用于展示页面流程。"
      },
      {
        id: "notCollect",
        title: "本页不收集什么",
        text: "不收集手机号、身份证号、头像、昵称、定位或真实企业权限。"
      },
      {
        id: "clear",
        title: "何时清除",
        text: "状态仅在内存中；退出演示或重新加载小程序后即清除，不会持久化。"
      },
      {
        id: "sensitive",
        title: "敏感信息提示",
        text: "请勿在本页输入手机号、身份证号、住址等敏感信息。"
      }
    ],
    agreements: [
      {
        id: "terms",
        title: "用户协议",
        summary: "我知晓这是本地前端功能体验。",
        detail: "本体验不创建真实账号，不代表已获得求职或企业服务权限。"
      },
      {
        id: "privacy",
        title: "隐私说明",
        summary: "我知晓本页不收集或持久化个人信息。",
        detail: "勾选与会话仅保存在当前运行内存，退出或重载后清除。"
      }
    ],
    scenarios: [
      { id: "success", name: "成功体验", note: "建立本地已登录状态" },
      { id: "timeout", name: "超时", note: "查看超时反馈" },
      { id: "offline", name: "离线", note: "查看离线反馈" },
      { id: "unauthorized", name: "登录失效", note: "进入已失效状态" }
    ],
    actionText: "体验本地登录",
    expireText: "模拟登录失效",
    logoutText: "退出本地状态"
  },
  resume: {
    header: {
      label: "简历",
      title: "把求职信息写清楚",
      subtitle: "输入只保留在当前页面，退出后不会保存",
      dataLabel: "未保存"
    },
    skillOptions: ["食品包装", "仓库搬运", "设备操作", "质量检查"],
    form: {
      name: "张师傅",
      hometown: "贵州修文",
      currentCity: "贵阳",
      years: "6",
      targetRole: "食品包装工",
      targetLocation: "贵阳及周边",
      salary: "4500至6000元/月",
      skills: ["食品包装", "设备操作"],
      company: "本地食品加工厂",
      role: "包装线操作员",
      period: "2020年至2025年",
      experience: "负责包装线设备操作、成品检查和交接记录。"
    },
    requiredFields: [
      { path: "name", label: "姓名称呼" },
      { path: "currentCity", label: "现居地" },
      { path: "targetRole", label: "期望工种" },
      { path: "targetLocation", label: "期望地点" },
      { path: "salary", label: "期望工资" },
      { path: "experience", label: "工作内容" }
    ]
  },
  applications: {
    header: {
      label: "投递记录",
      title: "每条进度都看明白",
      subtitle: "以下均为演示记录，不代表真实投递",
      dataLabel: "示例数据"
    },
    filters: [
      { id: "all", name: "全部" },
      { id: "pending", name: "待查看" },
      { id: "viewed", name: "已查看" },
      { id: "contacted", name: "已沟通" }
    ],
    records: [
      {
        id: "application-001",
        status: "pending",
        statusLabel: "待查看",
        jobTitle: "食品包装工",
        company: "贵州黔味食品有限公司",
        salary: "4000至5200元/月",
        location: "贵阳市修文县",
        appliedAt: "演示日期 6月18日",
        updateText: "企业尚未查看这条演示记录。",
        nextStep: "无需操作，真实提醒功能暂未开放。"
      },
      {
        id: "application-002",
        status: "viewed",
        statusLabel: "已查看",
        jobTitle: "仓库搬运工",
        company: "贵阳顺达物流服务部",
        salary: "4500至6000元/月",
        location: "贵阳市白云区",
        appliedAt: "演示日期 6月16日",
        updateText: "演示状态显示企业已查看。",
        nextStep: "联系入口暂未开放，请勿等待真实通知。"
      },
      {
        id: "application-003",
        status: "contacted",
        statusLabel: "已沟通",
        jobTitle: "设备操作工",
        company: "龙里山川制造有限公司",
        salary: "5000至6500元/月",
        location: "黔南州龙里县",
        appliedAt: "演示日期 6月12日",
        updateText: "演示状态用于查看已沟通版式。",
        nextStep: "不会拨号或发送消息。"
      },
      {
        id: "application-004",
        status: "closed",
        statusLabel: "已结束",
        jobTitle: "质检辅助工",
        company: "清镇新材加工厂",
        salary: "4200至5400元/月",
        location: "贵阳市清镇市",
        appliedAt: "演示日期 6月8日",
        updateText: "该演示岗位流程已结束。",
        nextStep: "这不是实际申请结果。"
      }
    ]
  }
};

module.exports = {
  profileMock
};
