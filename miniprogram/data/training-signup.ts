export const trainingSignupMock = {
  header: {
    label: "技能培训",
    title: "学门手艺，再去找工作",
    subtitle: "先看时间、地点和条件，合适再报名",
    availableCount: 3,
    availableLabel: "个班次可报名"
  },
  notice: {
    title: "报名说明",
    text: "当前仅展示班次，报名功能暂未开放。不会提交身份证、电话或费用。"
  },
  action: {
    note: "当前仅展示班次",
    unavailableToast: "报名功能暂未开放"
  },
  filters: [
    { id: "all", name: "全部班次" },
    { id: "open", name: "可报名" },
    { id: "limited", name: "即将满员" },
    { id: "ended", name: "已结束" }
  ],
  sessions: [
    {
      id: "training-gy-202607-housekeeping",
      courseCode: "GZ-GY-JZ-202607",
      title: "家政服务与养老护理",
      shortTitle: "家政护理",
      category: "生活服务",
      summary: "学清洁、做饭和老人照护，结业后可推荐本地岗位。",
      status: "open",
      statusLabel: "可报名",
      statusHint: "名额充足",
      capacity: {
        total: 30,
        enrolled: 18,
        remaining: 12,
        display: "剩余12名 / 共30名"
      },
      schedule: {
        startDate: "2026-07-06",
        endDate: "2026-07-17",
        dateText: "7月6日开班，共10天",
        timeText: "每天 09:00-16:30"
      },
      venue: {
        province: "贵州省",
        city: "贵阳市",
        district: "观山湖区",
        name: "贵阳市公共实训基地",
        address: "观山湖区职教路实训楼"
      },
      fee: {
        amount: 0,
        currency: "CNY",
        display: "免费，符合条件可申请补贴"
      },
      eligibility: ["年龄18至55周岁", "能正常参加白天培训", "有就业意愿"],
      provider: "贵阳市就业技能培训中心",
      buttonText: "报名暂未开放"
    },
    {
      id: "training-zy-202606-forklift",
      courseCode: "GZ-ZY-CC-202606",
      title: "叉车操作与安全培训",
      shortTitle: "叉车操作",
      category: "工业技能",
      summary: "练习叉车起步、装卸和安全检查，适合想进园区务工的人。",
      status: "limited",
      statusLabel: "即将满员",
      statusHint: "只剩3名",
      capacity: {
        total: 24,
        enrolled: 21,
        remaining: 3,
        display: "剩余3名 / 共24名"
      },
      schedule: {
        startDate: "2026-06-25",
        endDate: "2026-07-03",
        dateText: "6月25日开班，共7天",
        timeText: "每天 08:30-17:00"
      },
      venue: {
        province: "贵州省",
        city: "遵义市",
        district: "汇川区",
        name: "遵义市职业技能实训中心",
        address: "汇川区高坪街道实训园"
      },
      fee: {
        amount: 480,
        currency: "CNY",
        display: "培训费480元，考证费另按规定"
      },
      eligibility: ["年龄18至55周岁", "身体状况适合设备操作", "能全程参加培训"],
      provider: "遵义市职业技能实训中心",
      buttonText: "报名暂未开放"
    },
    {
      id: "training-bj-202607-ecommerce",
      courseCode: "GZ-BJ-DS-202607",
      title: "农产品电商与短视频",
      shortTitle: "农产品电商",
      category: "电商技能",
      summary: "学手机拍摄、商品上架和客服话术，帮助本地农产品网上销售。",
      status: "open",
      statusLabel: "可报名",
      statusHint: "还有名额",
      capacity: {
        total: 35,
        enrolled: 19,
        remaining: 16,
        display: "剩余16名 / 共35名"
      },
      schedule: {
        startDate: "2026-07-13",
        endDate: "2026-07-20",
        dateText: "7月13日开班，共6天",
        timeText: "每天 09:00-16:00"
      },
      venue: {
        province: "贵州省",
        city: "毕节市",
        district: "七星关区",
        name: "七星关区电商服务中心",
        address: "七星关区碧阳街道电商产业园"
      },
      fee: {
        amount: 0,
        currency: "CNY",
        display: "免费，自带能上网的手机"
      },
      eligibility: ["年龄18至50周岁", "会使用微信和手机拍照", "有就业或创业意愿"],
      provider: "七星关区就业服务中心",
      buttonText: "报名暂未开放"
    },
    {
      id: "training-lps-202605-catering",
      courseCode: "GZ-LPS-CY-202605",
      title: "餐饮服务与黔菜基础",
      shortTitle: "餐饮服务",
      category: "餐饮技能",
      summary: "练习备菜、基础黔菜和餐厅服务，结业后对接餐饮岗位。",
      status: "ended",
      statusLabel: "已结束",
      statusHint: "本期已结课",
      capacity: {
        total: 30,
        enrolled: 30,
        remaining: 0,
        display: "本期30名已结课"
      },
      schedule: {
        startDate: "2026-05-11",
        endDate: "2026-05-22",
        dateText: "5月11日开班，已结课",
        timeText: "每天 09:00-17:00"
      },
      venue: {
        province: "贵州省",
        city: "六盘水市",
        district: "钟山区",
        name: "钟山区职业培训学校",
        address: "钟山区红桥新区职教园"
      },
      fee: {
        amount: 0,
        currency: "CNY",
        display: "本期公益培训，免费"
      },
      eligibility: ["年龄18至55周岁", "能适应餐饮工作时间", "有就业意愿"],
      provider: "钟山区职业培训学校",
      buttonText: "查看其他班次"
    }
  ]
};
