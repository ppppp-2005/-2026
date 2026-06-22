export const jobsMock = {
  header: {
    title: "找个靠谱工作",
    subtitle: "本页都是本地示例岗位，不会自动联系企业",
    searchPlaceholder: "搜索工种、地点或企业"
  },
  zones: [
    { id: "local", title: "本地好岗", desc: "离家近，通勤更省心", mark: "本", color: "#1F7A4D" },
    { id: "outside", title: "外地机会", desc: "先确认吃住和路费", mark: "外", color: "#2F6FB2" },
    { id: "skill", title: "技能工种", desc: "有人带，可学手艺", mark: "技", color: "#C7792B" },
    { id: "urgent", title: "急招岗位", desc: "近期可到岗的示例", mark: "急", color: "#B63A3A" }
  ],
  filters: [
    { id: "all", name: "全部" },
    { id: "food-home", name: "包吃住" },
    { id: "near", name: "离家近" },
    { id: "high-pay", name: "工资高" },
    { id: "learn", name: "可学技术" }
  ],
  sorts: [
    { id: "recommended", name: "推荐优先" },
    { id: "salary", name: "工资从高到低" },
    { id: "distance", name: "距离从近到远" }
  ],
  jobs: [
    {
      id: "job-1",
      title: "设备装配工",
      salary: "6000-8000元/月",
      salaryTop: 8000,
      location: "本地工业园",
      distanceText: "约3公里",
      distanceKm: 3,
      company: "本地制造企业（示例）",
      companyInfo: "工厂示例直招 | 经验不限 | 招5人",
      labels: ["包吃住", "月休4天", "可学技术"],
      filterIds: ["food-home", "near", "learn"],
      zoneId: "local",
      badge: "急招",
      rank: 1,
      description: "负责设备零件装配、简单检查和工位整理。入岗后由班组示范操作。",
      requirements: ["18-50岁，能适应站立作业", "无经验可从基础工序学起", "上岗前需当面确认班次和计薪方式"],
      schedule: "白班为主，忙时可能调整；以当面确认信息为准",
      address: "本地工业园示例区域，不代表真实招聘地址"
    },
    {
      id: "job-2",
      title: "焊工学徒",
      salary: "5500-7500元/月",
      salaryTop: 7500,
      location: "邻县产业园",
      distanceText: "约18公里",
      distanceKm: 18,
      company: "机械加工企业（示例）",
      companyInfo: "有人带教 | 经验不限 | 招3人",
      labels: ["师傅带", "学会涨薪", "包住"],
      filterIds: ["learn"],
      zoneId: "skill",
      badge: "可学",
      rank: 2,
      description: "跟随师傅学习基础焊接、备料和安全检查，先培训再安排上手。",
      requirements: ["愿意学习技能并遵守安全要求", "能接受车间工作环境", "工资变化和培训安排需到场确认"],
      schedule: "长白班示例，具体休息时间未接真实企业信息",
      address: "邻县产业园示例区域，不代表真实招聘地址"
    },
    {
      id: "job-3",
      title: "包装质检员",
      salary: "4800-6500元/月",
      salaryTop: 6500,
      location: "市区食品园",
      distanceText: "约6公里",
      distanceKm: 6,
      company: "食品加工企业（示例）",
      companyInfo: "两班倒示例 | 年龄要求宽 | 招8人",
      labels: ["工作稳定", "有餐补", "上手快"],
      filterIds: ["near"],
      zoneId: "local",
      badge: "稳定",
      rank: 3,
      description: "检查包装外观和日期标识，按要求装箱并记录发现的问题。",
      requirements: ["做事细心，能看清包装标识", "可接受轮班安排", "体检、餐补等条件需线下核实"],
      schedule: "两班倒示例，具体时段以未来真实岗位为准",
      address: "市区食品园示例区域，不代表真实招聘地址"
    },
    {
      id: "job-4",
      title: "外地电子普工",
      salary: "7000-9500元/月",
      salaryTop: 9500,
      location: "浙江专区",
      distanceText: "外地岗位",
      distanceKm: 999,
      company: "电子制造企业（示例）",
      companyInfo: "外地示例岗位 | 包住 | 招20人",
      labels: ["工资高", "包吃住", "统一面试"],
      filterIds: ["food-home", "high-pay"],
      zoneId: "outside",
      badge: "外地",
      rank: 4,
      description: "从事电子零件组装、检查和包装。出发前应核对合同、车费和住宿条件。",
      requirements: ["能接受外地工作和排班", "出发前必须核实收费项目", "不向个人账户支付押金或介绍费"],
      schedule: "排班示例，当前没有接入真实企业班次",
      address: "浙江专区示例，不提供真实集合或工作地址"
    }
  ]
};

const sessionFavoriteJobIds = new Set<string>();

export function findJobById(id: string) {
  return jobsMock.jobs.find((job) => job.id === id) || null;
}

export function getSessionFavoriteJobIds() {
  return Array.from(sessionFavoriteJobIds);
}

export function toggleSessionFavoriteJob(id: string) {
  if (!findJobById(id)) {
    return false;
  }

  if (sessionFavoriteJobIds.has(id)) {
    sessionFavoriteJobIds.delete(id);
    return false;
  }

  sessionFavoriteJobIds.add(id);
  return true;
}
