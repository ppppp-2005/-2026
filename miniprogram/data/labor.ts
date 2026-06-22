export const laborMock = {
  header: {
    eyebrow: "贵州本地用工",
    title: "近期哪里需要人",
    subtitle: "先看人数、工期、地点和待遇，再决定是否联系",
    demandCount: 6,
    openingCount: 113
  },
  filters: [
    { id: "all", name: "全部", description: "查看所有信息" },
    { id: "long", name: "长期用工", description: "稳定做三个月以上" },
    { id: "short", name: "短期用工", description: "农忙或临时用工" },
    { id: "urgent", name: "紧急用工", description: "近期需要到岗" }
  ],
  safetyTip: {
    title: "联系前先问清",
    text: "问清工资怎么结、吃住谁负责。凡是先交押金、培训费的，先不要转钱。"
  },
  demands: [
    {
      id: "labor-gy-food-01",
      categoryId: "long",
      categoryName: "长期用工",
      title: "食品包装与分拣工",
      employer: "贵阳白云区食品加工企业",
      people: 18,
      peopleText: "招18人",
      duration: "6个月以上",
      location: "贵阳市白云区麦架镇",
      treatment: "4800-6200元/月",
      treatmentNote: "计件为主，包工作餐，可安排住宿",
      requirements: "18至52岁，能适应站班，新手有人带",
      benefits: ["包工作餐", "可安排住宿", "每月结算"],
      updatedText: "今日更新",
      contact: {
        name: "王师傅",
        phone: "0851-XXXXXXX",
        servicePoint: "白云区就业服务点"
      }
    },
    {
      id: "labor-as-clean-02",
      categoryId: "long",
      categoryName: "长期用工",
      title: "景区保洁与秩序维护",
      employer: "安顺西秀区旅游服务企业",
      people: 12,
      peopleText: "招12人",
      duration: "长期，试用1个月",
      location: "安顺市西秀区旧州镇",
      treatment: "3600-4500元/月",
      treatmentNote: "月休4天，提供中餐，节假日有补贴",
      requirements: "男女均可，做事踏实，能接受轮班",
      benefits: ["月休4天", "提供中餐", "节日补贴"],
      updatedText: "昨日更新",
      contact: {
        name: "陈老师",
        phone: "0851-XXXXXXX",
        servicePoint: "西秀区就业服务点"
      }
    },
    {
      id: "labor-zy-chili-03",
      categoryId: "short",
      categoryName: "短期用工",
      title: "辣椒分拣与装袋",
      employer: "遵义播州区农产品合作社",
      people: 30,
      peopleText: "招30人",
      duration: "约15天",
      location: "遵义市播州区虾子镇",
      treatment: "170-200元/天",
      treatmentNote: "按天计工，完工结清，提供午餐",
      requirements: "18至60岁，手脚利落，可连续做满工期",
      benefits: ["完工结清", "提供午餐", "可组队报名"],
      updatedText: "今日更新",
      contact: {
        name: "赵师傅",
        phone: "0851-XXXXXXX",
        servicePoint: "播州区就业服务点"
      }
    },
    {
      id: "labor-bj-tobacco-04",
      categoryId: "short",
      categoryName: "短期用工",
      title: "烤烟分级与扎把",
      employer: "毕节七星关区种植合作社",
      people: 25,
      peopleText: "招25人",
      duration: "约20天",
      location: "毕节市七星关区朱昌镇",
      treatment: "180元/天",
      treatmentNote: "10天结一次，可提供集体住宿",
      requirements: "有烤烟分级经验优先，无经验可现场学",
      benefits: ["10天一结", "可提供住宿", "现场教学"],
      updatedText: "2天前更新",
      contact: {
        name: "周站长",
        phone: "0857-XXXXXXX",
        servicePoint: "七星关区就业服务点"
      }
    },
    {
      id: "labor-qn-logistics-05",
      categoryId: "urgent",
      categoryName: "紧急用工",
      title: "物流装卸与货物分拣",
      employer: "黔南龙里县物流园企业",
      people: 20,
      peopleText: "急招20人",
      duration: "3个月，可续做",
      location: "黔南州龙里县谷脚镇",
      treatment: "220-280元/天",
      treatmentNote: "按班次计薪，每周可预支一次生活费",
      requirements: "20至50岁，身体健康，能接受夜班",
      benefits: ["近期到岗", "提供住宿", "夜班补贴"],
      updatedText: "1小时前更新",
      contact: {
        name: "罗师傅",
        phone: "0854-XXXXXXX",
        servicePoint: "龙里县就业服务点"
      }
    },
    {
      id: "labor-tr-electronics-06",
      categoryId: "urgent",
      categoryName: "紧急用工",
      title: "电子元件装配工",
      employer: "铜仁万山区电子制造企业",
      people: 8,
      peopleText: "急招8人",
      duration: "至少3个月",
      location: "铜仁市万山区产业园",
      treatment: "4500-5800元/月",
      treatmentNote: "计时加加班费，包住，有餐补",
      requirements: "18至45岁，视力正常，可坐班",
      benefits: ["一周内到岗", "包住宿", "有餐补"],
      updatedText: "今日更新",
      contact: {
        name: "杨老师",
        phone: "0856-XXXXXXX",
        servicePoint: "万山区就业服务点"
      }
    }
  ]
};
