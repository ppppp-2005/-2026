const campusMock = {
  meta: {
    source: "local-mock",
    updatedAt: "2026-06-18T08:00:00+08:00",
    province: "贵州省"
  },
  header: {
    label: "校园招",
    title: "毕业找工作，先看时间地点",
    subtitle: "双选会、应届岗位、实习机会都放在这里",
    notice: "以下为贵州本地示例信息，请以主办方和企业最新通知为准。"
  },
  events: [
    {
      id: "event-guiyang-summer-2026",
      type: "job-fair",
      title: "贵阳高校毕业生夏季双选会",
      organizer: "贵阳高校就业服务联合专场（示例）",
      startAt: "2026-06-20T09:00:00+08:00",
      endAt: "2026-06-20T15:00:00+08:00",
      dateText: "06月20日 周六",
      timeText: "09:00-15:00",
      city: "贵阳市",
      district: "观山湖区",
      venue: "贵阳国际人才城一楼招聘大厅",
      audience: "2026届毕业生、离校未就业毕业生",
      companyCountText: "约80家单位",
      status: "open",
      actionText: "安排已展示"
    },
    {
      id: "event-qingzhen-equipment-2026",
      type: "job-fair",
      title: "贵州装备制造类校园专场",
      organizer: "清镇职教城校园招聘专场（示例）",
      startAt: "2026-06-25T10:00:00+08:00",
      endAt: "2026-06-25T14:30:00+08:00",
      dateText: "06月25日 周四",
      timeText: "10:00-14:30",
      city: "贵阳市",
      district: "清镇市",
      venue: "清镇职教城公共实训中心",
      audience: "机械、电气、汽修等专业毕业生",
      companyCountText: "约45家单位",
      status: "open",
      actionText: "安排已展示"
    }
  ],
  opportunityFilters: [
    { id: "all", name: "全部机会" },
    { id: "graduate", name: "应届岗位" },
    { id: "internship", name: "实习机会" }
  ],
  opportunities: [
    {
      id: "opportunity-gy-operations-01",
      type: "graduate",
      typeLabel: "应届岗位",
      title: "新媒体运营助理",
      company: "贵州黔途文旅服务有限公司（示例）",
      city: "贵阳市",
      district: "观山湖区",
      locationText: "贵阳市观山湖区",
      salaryText: "4000-5500元/月",
      education: "大专及以上",
      graduationYears: [2025, 2026],
      headcount: 3,
      deadlineAt: "2026-07-10T23:59:59+08:00",
      deadlineText: "07月10日截止",
      labels: ["有人带教", "周末双休", "会基础电脑"],
      actionText: "详情暂未开放"
    },
    {
      id: "opportunity-qz-production-02",
      type: "graduate",
      typeLabel: "应届岗位",
      title: "生产技术储备员",
      company: "贵州山地装备制造有限公司（示例）",
      city: "贵阳市",
      district: "清镇市",
      locationText: "贵阳市清镇市",
      salaryText: "4500-6500元/月",
      education: "大专及以上",
      graduationYears: [2025, 2026],
      headcount: 8,
      deadlineAt: "2026-07-15T23:59:59+08:00",
      deadlineText: "07月15日截止",
      labels: ["机械相关", "包工作餐", "技能培训"],
      actionText: "详情暂未开放"
    },
    {
      id: "opportunity-kl-food-intern-03",
      type: "internship",
      typeLabel: "实习机会",
      title: "食品检验实习生",
      company: "贵州苗岭食品科技有限公司（示例）",
      city: "黔东南州",
      district: "凯里市",
      locationText: "黔东南州凯里市",
      salaryText: "120-150元/天",
      education: "大专及以上",
      graduationYears: [2026, 2027],
      headcount: 4,
      deadlineAt: "2026-07-05T23:59:59+08:00",
      deadlineText: "07月05日截止",
      labels: ["食品专业", "实习证明", "可转正"],
      actionText: "详情暂未开放"
    },
    {
      id: "opportunity-zy-ecommerce-intern-04",
      type: "internship",
      typeLabel: "实习机会",
      title: "电商客服实习生",
      company: "遵义茶云电商服务有限公司（示例）",
      city: "遵义市",
      district: "新蒲新区",
      locationText: "遵义市新蒲新区",
      salaryText: "100-130元/天",
      education: "中专及以上",
      graduationYears: [2026, 2027],
      headcount: 6,
      deadlineAt: "2026-07-08T23:59:59+08:00",
      deadlineText: "07月08日截止",
      labels: ["普通话清楚", "提供培训", "实习证明"],
      actionText: "详情暂未开放"
    }
  ]
};

module.exports = {
  campusMock
};
