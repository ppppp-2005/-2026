const returnHomeMock = {
  meta: {
    dataVersion: "2026-06-18",
    isMock: true,
    sourceLabel: "贵州返乡服务示例信息"
  },
  header: {
    eyebrow: "返乡专区",
    title: "回家找工作，办事少跑路",
    subtitle: "本地岗位、创业支持、返乡服务，一页看清楚",
    notice: "以下为示例信息，办理前请向当地服务窗口确认。"
  },
  categories: [
    {
      id: "jobs",
      name: "本地岗位",
      summary: "看工资和地点",
      countLabel: "4个示例岗位",
      target: "local-jobs"
    },
    {
      id: "startup",
      name: "创业支持",
      summary: "先问条件再准备",
      countLabel: "3类支持",
      target: "startup-support"
    },
    {
      id: "services",
      name: "返乡服务",
      summary: "材料和地点看清楚",
      countLabel: "3项常用服务",
      target: "return-services"
    }
  ],
  jobFilters: [
    { id: "all", label: "全部", regionCode: "all" },
    { id: "guiyang", label: "贵阳", regionCode: "520100" },
    { id: "zunyi", label: "遵义", regionCode: "520300" },
    { id: "bijie", label: "毕节", regionCode: "520500" },
    { id: "qiandongnan", label: "黔东南", regionCode: "522600" }
  ],
  localJobs: [
    {
      id: "gz-guiyang-logistics-01",
      regionCode: "520100",
      region: "贵阳",
      district: "观山湖区",
      title: "仓库分拣员",
      salary: "4500-6000元/月",
      company: "观山湖区物流园企业",
      employmentType: "全职",
      hiringCount: 8,
      summary: "白班为主，能识字会用手机即可",
      benefits: ["提供工作餐", "月休4天", "上手培训"],
      contactChannel: "当地就业服务站",
      actionText: "岗位咨询",
      feedback: "请联系就业站"
    },
    {
      id: "gz-zunyi-food-01",
      regionCode: "520300",
      region: "遵义",
      district: "汇川区",
      title: "食品包装工",
      salary: "3800-5200元/月",
      company: "汇川区食品加工企业",
      employmentType: "全职",
      hiringCount: 12,
      summary: "流水线包装，入职后有人带",
      benefits: ["包工作餐", "计件工资", "可安排宿舍"],
      contactChannel: "当地就业服务站",
      actionText: "岗位咨询",
      feedback: "请联系就业站"
    },
    {
      id: "gz-bijie-garment-01",
      regionCode: "520500",
      region: "毕节",
      district: "七星关区",
      title: "服装缝纫学徒",
      salary: "3500-5500元/月",
      company: "七星关区服装加工企业",
      employmentType: "全职",
      hiringCount: 10,
      summary: "零基础可学，熟练后按件计薪",
      benefits: ["师傅带教", "离家较近", "熟练后涨薪"],
      contactChannel: "当地就业服务站",
      actionText: "岗位咨询",
      feedback: "请联系就业站"
    },
    {
      id: "gz-qiandongnan-hotel-01",
      regionCode: "522600",
      region: "黔东南",
      district: "凯里市",
      title: "客房服务员",
      salary: "3200-4500元/月",
      company: "凯里市住宿服务企业",
      employmentType: "全职",
      hiringCount: 6,
      summary: "负责客房整理，工作内容有人教",
      benefits: ["轮班安排", "提供工作餐", "月休4天"],
      contactChannel: "当地就业服务站",
      actionText: "岗位咨询",
      feedback: "请联系就业站"
    }
  ],
  startupSupports: [
    {
      id: "startup-consulting",
      title: "返乡创业咨询",
      audience: "准备开店、办合作社或做加工的返乡人员",
      support: "先了解登记、场地、税务和用工要求",
      servicePlace: "户籍地或创业地政务服务中心",
      reminder: "带身份证和创业想法，先咨询再准备材料",
      actionText: "先去咨询",
      feedback: "先到窗口咨询"
    },
    {
      id: "startup-loan",
      title: "创业担保贷款咨询",
      audience: "有经营计划并符合当地条件的创业人员",
      support: "可咨询额度、担保方式、贴息和还款要求",
      servicePlace: "当地人社服务窗口或指定经办机构",
      reminder: "各地条件不同，不要先交中介费",
      actionText: "问清条件",
      feedback: "先问贷款条件"
    },
    {
      id: "startup-subsidy",
      title: "创业补贴咨询",
      audience: "首次创业且正常经营的符合条件人员",
      support: "可咨询一次性创业补贴和场地支持",
      servicePlace: "创业地县级人社服务窗口",
      reminder: "补贴标准和申请时间以当地最新政策为准",
      actionText: "咨询补贴",
      feedback: "先做创业登记"
    }
  ],
  services: [
    {
      id: "employment-registration",
      title: "就业登记与岗位推荐",
      purpose: "登记求职意向，方便工作人员推荐本地岗位",
      materials: "身份证、联系电话、想做的工种",
      servicePlace: "乡镇（街道）便民服务中心或就业服务站",
      serviceHours: "工作日办理，节假日安排请提前电话确认",
      actionText: "办理提醒",
      feedback: "带身份证咨询"
    },
    {
      id: "social-security-transfer",
      title: "社保关系转移咨询",
      purpose: "了解外地参保记录如何转回或接续",
      materials: "身份证、社保卡、原参保地信息",
      servicePlace: "县级政务服务中心人社窗口",
      serviceHours: "可先通过当地人社热线确认是否需要线下办理",
      actionText: "办理提醒",
      feedback: "带好参保凭证"
    },
    {
      id: "skills-training",
      title: "职业技能培训登记",
      purpose: "登记电工、焊工、家政、电商等培训意向",
      materials: "身份证、联系电话、想学的技能",
      servicePlace: "当地就业服务站或人社服务窗口",
      serviceHours: "开班时间按当地通知，先登记不等于已经录取",
      actionText: "登记提醒",
      feedback: "登记培训意向"
    }
  ]
};

module.exports = {
  returnHomeMock
};
