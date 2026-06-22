export const trainingMock = {
  header: {
    label: "技能培训",
    title: "学门手艺，好找工作",
    subtitle: "先看学什么、在哪学、要花多少钱"
  },
  notice: {
    title: "报名先问清楚",
    text: "以下是贵州本地示例课程，开班时间和费用以现场确认为准。"
  },
  actions: {
    courseInfoLabel: "开班信息已展示",
    courseInfoToast: "当前信息已在卡片展示"
  },
  categories: [
    { id: "all", name: "全部课程" },
    { id: "care", name: "家政护理" },
    { id: "electric", name: "机械电工" },
    { id: "food", name: "餐饮服务" },
    { id: "local-business", name: "电商手艺" }
  ],
  courses: [
    {
      id: "course-care-1",
      categoryId: "care",
      title: "养老护理基础班",
      summary: "学照顾老人、日常清洁和安全护理。",
      schedule: "7月8日开班 · 连上7天",
      classTime: "每天 9:00-16:30",
      location: "贵阳市观山湖区朱昌镇培训点",
      fee: "符合条件可免费",
      provider: "观山湖区就业培训点",
      audience: "想做养老护理、家政服务的人",
      badge: "离家近",
      tags: ["老师带练", "推荐就业"]
    },
    {
      id: "course-electric-1",
      categoryId: "electric",
      title: "电工基础与安全班",
      summary: "从工具使用学起，重点练接线和用电安全。",
      schedule: "7月15日开班 · 连上12天",
      classTime: "每天 8:30-17:00",
      location: "遵义市汇川区高桥街道培训点",
      fee: "980元/期",
      provider: "汇川区职业技能培训点",
      audience: "想进工厂、物业做电工的人",
      badge: "实操多",
      tags: ["零基础", "工具可借"]
    },
    {
      id: "course-food-1",
      categoryId: "food",
      title: "黔菜烹饪入门班",
      summary: "学家常黔菜、后厨卫生和备菜基本功。",
      schedule: "7月10日开班 · 连上10天",
      classTime: "每天 9:00-16:00",
      location: "安顺市西秀区华西街道培训点",
      fee: "680元/期",
      provider: "西秀区餐饮技能培训点",
      audience: "想进餐馆、食堂后厨工作的人",
      badge: "上手快",
      tags: ["现场做菜", "含基础材料"]
    },
    {
      id: "course-business-1",
      categoryId: "local-business",
      title: "农产品直播带货班",
      summary: "学拍产品、讲卖点和用手机开直播。",
      schedule: "7月18日开班 · 连上5天",
      classTime: "每天 9:30-16:30",
      location: "毕节市七星关区柏杨林街道培训点",
      fee: "300元/期",
      provider: "七星关区电商培训点",
      audience: "想在手机上卖土特产的人",
      badge: "手机教学",
      tags: ["普通话不限", "现场试播"]
    },
    {
      id: "course-craft-1",
      categoryId: "local-business",
      title: "苗绣制作与接单班",
      summary: "学常用针法、做小件产品和计算手工价。",
      schedule: "7月22日开班 · 连上10天",
      classTime: "每天 9:00-16:00",
      location: "黔东南州凯里市洗马河街道培训点",
      fee: "500元/期",
      provider: "凯里市民族手工培训点",
      audience: "想学手艺、在家接手工单的人",
      badge: "可带回家做",
      tags: ["材料已含", "成品可带走"]
    },
    {
      id: "course-machine-1",
      categoryId: "electric",
      title: "挖掘机操作基础班",
      summary: "学设备检查、基础操作和工地安全。",
      schedule: "8月2日开班 · 连上15天",
      classTime: "每天 8:30-17:00",
      location: "六盘水市钟山区双戛街道培训点",
      fee: "1680元/期",
      provider: "钟山区工程机械培训点",
      audience: "想做工程机械操作工作的人",
      badge: "场地实练",
      tags: ["先学安全", "分组练习"]
    }
  ]
};
