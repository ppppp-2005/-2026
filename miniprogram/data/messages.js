const messageMock = {
  header: {
    label: "招聘消息",
    title: "消息中心",
    subtitle: "集中查看投递反馈、招聘沟通和系统通知。",
    dataLabel: "本地演示"
  },
  categories: [
    { id: "all", name: "全部" },
    { id: "application", name: "投递反馈" },
    { id: "conversation", name: "招聘沟通" },
    { id: "system", name: "系统通知" }
  ],
  messages: [
    {
      id: "application-001",
      category: "application",
      categoryLabel: "投递反馈",
      kind: "notification",
      title: "叉车工岗位已查看简历",
      preview: "企业已查看你的本地演示简历，可继续留意后续消息。",
      time: "今天 09:20",
      unread: true,
      job: {
        title: "仓储叉车工",
        company: "安和物流园",
        salary: "6500-7800元/月",
        location: "临港产业园"
      },
      timeline: [
        { id: "a1", time: "6月18日 16:40", label: "已投递", content: "本地演示简历已加入岗位投递记录。" },
        { id: "a2", time: "今天 09:20", label: "已查看", content: "企业已查看演示简历，后续进度以正式服务为准。" }
      ]
    },
    {
      id: "conversation-001",
      category: "conversation",
      categoryLabel: "招聘沟通",
      kind: "conversation",
      title: "安和物流园招聘负责人",
      preview: "请问你近期方便到园区了解工作吗？",
      time: "昨天 18:30",
      unread: true,
      job: {
        title: "仓储叉车工",
        company: "安和物流园",
        salary: "6500-7800元/月",
        location: "临港产业园"
      },
      conversation: [
        { id: "c1", side: "recruiter", speaker: "招聘负责人", time: "昨天 18:22", content: "你好，我们看到了你的演示求职信息。" },
        { id: "c2", side: "recruiter", speaker: "招聘负责人", time: "昨天 18:30", content: "请问你近期方便到园区了解工作吗？" }
      ]
    },
    {
      id: "system-001",
      category: "system",
      categoryLabel: "系统通知",
      kind: "notification",
      title: "完善求职意向提醒",
      preview: "补充期望工种和工作地点，方便后续匹配岗位。",
      time: "6月17日",
      unread: true,
      timeline: [
        { id: "s1", time: "6月17日 10:00", label: "资料提醒", content: "当前为本地演示资料，不会自动上传或同步。" },
        { id: "s2", time: "6月17日 10:01", label: "建议操作", content: "可前往“我的”查看并补充本地求职意向。" }
      ]
    },
    {
      id: "application-002",
      category: "application",
      categoryLabel: "投递反馈",
      kind: "notification",
      title: "装配操作工投递记录已更新",
      preview: "演示记录当前处于待查看状态。",
      time: "6月16日",
      unread: false,
      job: {
        title: "装配操作工",
        company: "新桥智能制造",
        salary: "5800-7200元/月",
        location: "高新区"
      },
      timeline: [
        { id: "a3", time: "6月16日 14:10", label: "已记录", content: "已生成本地演示投递记录，没有向企业发送资料。" }
      ]
    }
  ]
};

module.exports = { messageMock };
