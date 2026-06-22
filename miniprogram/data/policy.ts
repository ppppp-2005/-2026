export const policyMock = {
  meta: {
    version: "mock-2026-06",
    updatedAt: "2026年6月",
    sourceNote: "以下为贵州就业政策演示信息，具体条件和标准以当地人社部门最新通知为准。"
  },
  header: {
    label: "看政策",
    title: "政策看得懂，办事少跑腿",
    subtitle: "先看谁能办、能得到什么，再准备材料",
    countLabel: "项政策提醒"
  },
  reminder: {
    tag: "重点提醒",
    title: "先问清楚，再交材料",
    text: "同一项政策在各县区的条件和标准可能不同。办理前，请先向当地人社服务窗口确认。",
    actionText: "我知道了"
  },
  categories: [
    { id: "all", name: "全部政策", shortName: "全部", mark: "全" },
    { id: "work", name: "找工作", shortName: "就业", mark: "工" },
    { id: "training", name: "学技能", shortName: "培训", mark: "学" },
    { id: "migrant", name: "外出务工", shortName: "务工", mark: "外" },
    { id: "business", name: "自己创业", shortName: "创业", mark: "创" }
  ],
  policies: [
    {
      id: "migrant-transport",
      categoryId: "migrant",
      categoryName: "外出务工",
      title: "跨省务工交通补助",
      summary: "到省外稳定务工，符合条件可申请一次性交通补助。",
      audience: "贵州户籍、跨省务工，并符合当地年度申报条件的人员",
      benefit: "补助金额按务工地点、出行凭证和当地标准核定",
      office: "户籍所在乡镇（街道）人社服务窗口",
      publishedAt: "2026-03",
      amountLabel: "一次性补助",
      tags: ["跨省务工", "先就业后申请", "保留车票"],
      materials: ["身份证和社保卡", "劳动合同或务工证明", "车票、支付记录等出行凭证"],
      steps: ["先向户籍地窗口确认当年条件", "准备务工和出行证明", "按当地要求提交申请"]
    },
    {
      id: "skill-training",
      categoryId: "training",
      categoryName: "学技能",
      title: "职业技能培训补贴",
      summary: "学电工、焊工、家政等实用技能，符合条件可享培训补贴。",
      audience: "登记失业人员、农村转移就业劳动者等重点就业群体",
      benefit: "参加补贴目录内的培训，培训费用按规定补贴；部分人员可享生活费补助",
      office: "常住地或户籍地县级人社部门、定点培训机构",
      publishedAt: "2026-02",
      amountLabel: "培训费按规定补贴",
      tags: ["先查培训目录", "定点机构", "可考技能证"],
      materials: ["身份证和社保卡", "就业创业证或人员类别证明", "培训机构要求的报名材料"],
      steps: ["询问当地可学工种和开班时间", "选择人社部门认可的培训机构", "报名参训并按要求完成考核"]
    },
    {
      id: "flexible-social-security",
      categoryId: "work",
      categoryName: "找工作",
      title: "灵活就业社会保险补贴",
      summary: "自己接活或灵活上班，符合条件并缴纳社保后可申请补贴。",
      audience: "认定的就业困难人员，以及符合条件的离校未就业高校毕业生",
      benefit: "个人先缴纳社会保险费，再按当地标准申请部分补贴",
      office: "就业登记所在地公共就业服务窗口",
      publishedAt: "2026-01",
      amountLabel: "先缴费，再申领",
      tags: ["先做就业登记", "按期缴社保", "留好缴费记录"],
      materials: ["身份证和社保卡", "灵活就业登记证明", "社会保险缴费记录"],
      steps: ["先确认自己是否属于补贴对象", "完成灵活就业登记并正常缴费", "在规定时间内提交补贴申请"]
    },
    {
      id: "public-service-job",
      categoryId: "work",
      categoryName: "找工作",
      title: "乡村公益性岗位支持",
      summary: "暂时难外出、就业困难，可咨询村内保洁、护路等公益岗位。",
      audience: "符合当地认定条件、通过市场渠道较难就业的人员",
      benefit: "获得就近岗位和岗位补贴，具体岗位、期限和标准由当地确定",
      office: "所在村（社区）或乡镇人社服务窗口",
      publishedAt: "2025-12",
      amountLabel: "就近就业",
      tags: ["村内岗位", "困难人员优先", "岗位数量有限"],
      materials: ["身份证和户口簿", "就业困难等相关证明", "村（社区）要求的登记材料"],
      steps: ["到村（社区）询问空缺岗位", "提交人员身份和就业情况材料", "通过审核后按通知上岗"]
    },
    {
      id: "startup-grant",
      categoryId: "business",
      categoryName: "自己创业",
      title: "一次性创业补贴",
      summary: "首次开店或办小微企业，正常经营并符合条件可申请补贴。",
      audience: "首次创办小微企业或从事个体经营，并符合当地政策条件的人员",
      benefit: "审核通过后可享一次性创业补贴，金额以当地当年文件为准",
      office: "创业项目注册地县级公共就业服务机构",
      publishedAt: "2026-03",
      amountLabel: "开业后申请",
      tags: ["首次创业", "正常经营", "查看申报期限"],
      materials: ["身份证和社保卡", "营业执照", "经营场地、经营流水等证明"],
      steps: ["先确认注册时间和经营期限要求", "准备营业执照及经营证明", "向注册地就业服务机构申请"]
    },
    {
      id: "startup-loan",
      categoryId: "business",
      categoryName: "自己创业",
      title: "创业担保贷款支持",
      summary: "创业缺启动资金，可咨询担保贷款和财政贴息支持。",
      audience: "符合条件的个人创业者、小微企业及吸纳重点群体就业的经营主体",
      benefit: "可申请一定额度的创业担保贷款，利息支持和额度按当地规定执行",
      office: "创业所在地人社服务机构或经办银行",
      publishedAt: "2026-04",
      amountLabel: "贷款与贴息支持",
      tags: ["需要审核", "按期还款", "先做项目评估"],
      materials: ["身份证明和营业执照", "创业项目或经营情况材料", "经办机构要求的贷款材料"],
      steps: ["到人社窗口做资格咨询", "准备项目和经营材料", "由经办机构审核贷款申请"]
    }
  ]
};
