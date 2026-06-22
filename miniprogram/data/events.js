const eventsMock = {
  header: {
    label: "本地活动示例",
    title: "交流与活动",
    subtitle: "查看招聘会、直播说明和宣讲会安排。",
    dataLabel: "信息不实时"
  },
  typeTabs: [
    { id: "live", name: "直播" },
    { id: "fair", name: "招聘会" },
    { id: "talk", name: "宣讲会" }
  ],
  statusFilters: [
    { id: "all", name: "全部" },
    { id: "ongoing", name: "进行中" },
    { id: "upcoming", name: "即将开始" },
    { id: "ended", name: "已结束" }
  ],
  events: [
    {
      id: "live-001",
      type: "live",
      typeLabel: "直播",
      status: "ongoing",
      statusLabel: "进行中",
      title: "返乡就业岗位直播说明",
      summary: "集中介绍本地制造、物流和服务业示例岗位。",
      time: "6月20日 15:00-16:00",
      locationLabel: "线上说明",
      location: "活动为线上讲解，本页不提供直播播放入口。",
      organizer: "县就业服务中心",
      audience: ["准备返乡就业的求职者", "希望了解本地岗位的劳动者"],
      description: [
        "活动将按行业介绍本地示例岗位、工作地点和常见应聘准备事项。",
        "当前页面只展示本地示例信息，不提供实时直播、回放或互动功能。"
      ]
    },
    {
      id: "live-002",
      type: "live",
      typeLabel: "直播",
      status: "ended",
      statusLabel: "已结束",
      title: "园区用工政策直播解读",
      summary: "介绍就业服务、岗前准备和常见政策咨询方向。",
      time: "6月18日 19:00-20:00",
      locationLabel: "线上说明",
      location: "活动已结束，本页不提供回放或直播播放入口。",
      organizer: "高新区就业服务站",
      audience: ["园区求职者", "需要了解就业政策的劳动者"],
      description: [
        "活动围绕园区就业服务和常见政策问题提供示例说明。",
        "具体政策与办理要求应以相关部门正式发布渠道为准。"
      ]
    },
    {
      id: "fair-001",
      type: "fair",
      typeLabel: "招聘会",
      status: "upcoming",
      statusLabel: "即将开始",
      title: "夏季重点企业招聘会",
      summary: "面向制造、仓储、餐饮和家政等岗位开展现场交流。",
      time: "6月22日 09:00-12:00",
      locationLabel: "活动地点",
      location: "县人力资源服务中心一楼服务大厅（示例地点）",
      organizer: "县人力资源服务中心",
      audience: ["有近期求职计划的劳动者", "希望现场了解岗位的求职者"],
      description: [
        "现场安排企业岗位介绍和就业服务咨询，页面中的企业与岗位信息均为示例。",
        "是否需要预约、携带材料及入场要求，请以主办方正式渠道为准。"
      ]
    },
    {
      id: "fair-002",
      type: "fair",
      typeLabel: "招聘会",
      status: "ended",
      statusLabel: "已结束",
      title: "返乡人员就业对接会",
      summary: "提供本地企业岗位与就业服务的集中介绍。",
      time: "6月15日 09:30-11:30",
      locationLabel: "活动地点",
      location: "东城便民服务中心二楼（示例地点）",
      organizer: "东城街道就业服务站",
      audience: ["返乡求职人员", "希望就近就业的劳动者"],
      description: [
        "活动用于展示返乡就业对接会的信息结构，不代表仍可到场或补报名。",
        "当前页面不会记录参与情况，也不会向主办方发送任何信息。"
      ]
    },
    {
      id: "talk-001",
      type: "talk",
      typeLabel: "宣讲会",
      status: "upcoming",
      statusLabel: "即将开始",
      title: "智能制造企业岗位宣讲会",
      summary: "介绍生产操作、设备维护和质量检验等岗位。",
      time: "6月24日 14:30-16:00",
      locationLabel: "活动地点",
      location: "职业技能服务中心三楼报告厅（示例地点）",
      organizer: "产业园就业服务专班",
      audience: ["制造业求职者", "职业院校应往届毕业生"],
      description: [
        "宣讲内容包括岗位方向、工作环境和应聘准备建议。",
        "本页不代表企业正式招聘承诺，具体岗位以企业正式发布为准。"
      ]
    },
    {
      id: "talk-002",
      type: "talk",
      typeLabel: "宣讲会",
      status: "ended",
      statusLabel: "已结束",
      title: "高校毕业生求职准备宣讲",
      summary: "围绕简历准备、岗位核实和面试注意事项开展说明。",
      time: "6月17日 15:00-16:30",
      locationLabel: "线上说明",
      location: "活动已结束，本页不提供回放或订阅入口。",
      organizer: "青年就业服务站",
      audience: ["离校未就业高校毕业生", "准备参加校招的求职者"],
      description: [
        "活动提供求职准备和风险核实方面的示例说明。",
        "页面内容不构成岗位推荐，也不会记录用户参加情况。"
      ]
    }
  ]
};

function findEventById(id) {
  return eventsMock.events.find((item) => item.id === id) || null;
}

module.exports = { eventsMock, findEventById };
