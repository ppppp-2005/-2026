const homeMock = {
  brand: {
    title: "家乡就业",
    subtitle: "找工作、招工人、学技能",
    location: "本地就业服务",
    loginText: "登录",
    logoText: "乡"
  },
  searchPlaceholder: "输入工种 / 地点 / 企业",
  ui: {
    entryTitle: "常用服务",
    newsTitle: "最新资讯",
    servicesTitle: "热门服务",
    moreText: "更多",
    allText: "全部",
    collapseText: "收起"
  },
  quickEntries: [
    {
      id: "jobs",
      name: "找工作",
      description: "看附近岗位",
      iconText: "工",
      color: "#1F7A4D",
      bgColor: "#E8F4ED",
      route: "/pages/jobs/index",
      type: "tab",
      enabled: true,
      badge: "常用"
    },
    {
      id: "hire",
      name: "企业招人",
      description: "发布招工信息",
      iconText: "招",
      color: "#2F6FB2",
      bgColor: "#EAF1FA",
      route: "/pages/employer/index",
      type: "page",
      enabled: true,
      badge: "可用"
    },
    {
      id: "training",
      name: "技能培训",
      description: "学门手艺",
      iconText: "技",
      color: "#C7792B",
      bgColor: "#FFF1E2",
      route: "/pages/training/index",
      type: "page",
      enabled: true,
      badge: "可用"
    },
    {
      id: "policy",
      name: "看政策",
      description: "补贴和通知",
      iconText: "政",
      color: "#7A5A2A",
      bgColor: "#F7EEDB",
      route: "/pages/policy/index",
      type: "page",
      enabled: true,
      badge: "可用"
    },
    {
      id: "campus",
      name: "校园招",
      description: "学生就业",
      iconText: "校",
      color: "#4F6F52",
      bgColor: "#EEF5EA",
      route: "/pages/campus/index",
      type: "page",
      enabled: true,
      badge: "可用"
    },
    {
      id: "labor",
      name: "用工信息",
      description: "企业用人",
      iconText: "信",
      color: "#586B8F",
      bgColor: "#EEF2F8",
      route: "/pages/labor/index",
      type: "page",
      enabled: true,
      badge: "可用"
    },
    {
      id: "return",
      name: "返乡专区",
      description: "回乡找机会",
      iconText: "乡",
      color: "#A45F3D",
      bgColor: "#FFF0E8",
      route: "/pages/return-home/index",
      type: "page",
      enabled: true,
      badge: "可用"
    },
    {
      id: "signup",
      name: "培训报名",
      description: "报名学技能",
      iconText: "培",
      color: "#6B5B95",
      bgColor: "#F1EEFA",
      route: "/pages/training-signup/index",
      type: "page",
      enabled: true,
      badge: "可用"
    }
  ],
  news: [
    {
      id: "news-1",
      tag: "招聘会",
      title: "周末乡镇就业服务专场开放预约",
      meta: "6月18日发布"
    },
    {
      id: "news-2",
      tag: "政策",
      title: "返乡务工人员技能提升补贴申领提醒",
      meta: "本周更新"
    },
    {
      id: "news-3",
      tag: "培训",
      title: "电工、焊工、家政培训班开始登记",
      meta: "名额有限"
    },
    {
      id: "news-4",
      tag: "岗位",
      title: "本地制造企业发布一批技术工种示例岗位",
      meta: "今日整理"
    },
    {
      id: "news-5",
      tag: "服务",
      title: "就业服务站开放简历指导与岗位咨询时段",
      meta: "工作日开放"
    },
    {
      id: "news-6",
      tag: "返乡",
      title: "返乡就业专区更新本地企业与培训信息",
      meta: "本月更新"
    }
  ],
  services: [
    {
      id: "job-fair",
      title: "招聘会",
      desc: "查看近期线下专场和报名安排",
      badge: "本周",
      route: "/pages/events/index",
      type: "tab",
      enabled: true
    },
    {
      id: "latest-jobs",
      title: "最新岗位",
      desc: "普工、技工、服务业岗位汇总",
      badge: "更新",
      route: "/pages/jobs/index",
      type: "tab",
      enabled: true
    },
    {
      id: "company-zone",
      title: "企业专区",
      desc: "本地重点企业用工需求展示",
      badge: "推荐",
      route: "/pages/employer/index",
      type: "page",
      enabled: true
    },
    {
      id: "hire-worker",
      title: "企业招人",
      desc: "填写本地示例岗位并预览发布内容",
      badge: "企业",
      route: "/pages/employer-job-form/index",
      type: "page",
      enabled: true
    },
    {
      id: "skill-training",
      title: "技能培训",
      desc: "查看本地示例课程与技能方向",
      badge: "课程",
      route: "/pages/training/index",
      type: "page",
      enabled: true
    },
    {
      id: "employment-policy",
      title: "就业政策",
      desc: "了解补贴与就业服务示例信息",
      badge: "政策",
      route: "/pages/policy/index",
      type: "page",
      enabled: true
    },
    {
      id: "return-home-service",
      title: "返乡专区",
      desc: "汇总返乡就业与本地机会",
      badge: "家乡",
      route: "/pages/return-home/index",
      type: "page",
      enabled: true
    },
    {
      id: "training-registration",
      title: "培训报名",
      desc: "登记本地示例培训意向",
      badge: "报名",
      route: "/pages/training-signup/index",
      type: "page",
      enabled: true
    }
  ]
};

module.exports = {
  homeMock
};
