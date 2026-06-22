const employerMock = {
  header: {
    label: "企业招人",
    title: "今天的招聘事情，一页看清",
    subtitle: "这里全部是本地示例。资料、岗位和候选人操作都不会发送到平台。",
    dataLabel: "本地演示"
  },
  company: {
    id: "company-gz-001",
    name: "贵州黔味食品有限公司",
    location: "贵阳市修文县扎佐街道",
    industry: "食品加工",
    size: "50至99人",
    contactName: "罗师傅",
    contactPhone: ""
  },
  profileFields: [
    { id: "name", label: "企业名称", placeholder: "例如：黔味食品厂", required: true, maxlength: 30 },
    { id: "location", label: "工作地点", placeholder: "写到区县或街道", required: true, maxlength: 40 },
    { id: "industry", label: "所属行业", placeholder: "例如：食品加工", required: true, maxlength: 20 },
    { id: "size", label: "企业规模", placeholder: "例如：50至99人", required: true, maxlength: 20 },
    { id: "contactName", label: "招聘联系人", placeholder: "例如：罗师傅", required: true, maxlength: 12 },
    { id: "contactPhone", label: "联系电话", placeholder: "仅在本页演示填写", required: true, maxlength: 20 }
  ],
  profileNotice: "只在本次页面打开期间演示，不会保存、不会认证，也不会上传营业执照或其他文件。",
  summary: [
    { id: "recruiting", value: "3", unit: "个", label: "示例岗位" },
    { id: "candidates", value: "6", unit: "人", label: "示例候选人" },
    { id: "pending", value: "3", unit: "人", label: "待本地查看" }
  ],
  actions: [
    {
      id: "job-form",
      title: "填写岗位",
      text: "填写核心信息并做前端校验",
      buttonText: "开始填写",
      url: "/pages/employer-job-form/index"
    },
    {
      id: "job-preview",
      title: "查看岗位预览",
      text: "使用集中示例数据查看仅预览页面",
      buttonText: "打开预览",
      url: "/pages/employer-job-preview/index?source=example"
    },
    {
      id: "candidates",
      title: "管理候选人",
      text: "体验本地筛选、空状态和异常重试",
      buttonText: "查看候选人",
      url: "/pages/employer-candidates/index"
    }
  ],
  jobs: [
    {
      id: "employer-job-001",
      title: "食品包装工",
      salary: "4000至5200元/月",
      location: "贵阳市修文县扎佐街道",
      headcount: 8,
      interestedCount: 3,
      statusLabel: "招聘中（示例）",
      updatedAt: "本地示例"
    },
    {
      id: "employer-job-002",
      title: "仓库搬运工",
      salary: "4500至6000元/月",
      location: "贵阳市修文县久长街道",
      headcount: 3,
      interestedCount: 2,
      statusLabel: "招聘中（示例）",
      updatedAt: "本地示例"
    },
    {
      id: "employer-job-003",
      title: "酸汤生产普工",
      salary: "4200至5500元/月",
      location: "黔南州龙里县谷脚镇",
      headcount: 6,
      interestedCount: 1,
      statusLabel: "招聘中（示例）",
      updatedAt: "本地示例"
    }
  ]
};

const employerFlowMock = {
  jobFormFields: [
    { id: "title", label: "岗位名称", placeholder: "例如：食品包装工", required: true, maxlength: 24 },
    { id: "headcount", label: "招聘人数", placeholder: "请输入正整数", required: true, inputType: "number", maxlength: 3 },
    { id: "salaryMin", label: "最低月薪（元）", placeholder: "例如：4000", required: true, inputType: "number", maxlength: 6 },
    { id: "salaryMax", label: "最高月薪（元）", placeholder: "例如：5200", required: true, inputType: "number", maxlength: 6 },
    { id: "location", label: "工作地点", placeholder: "写到区县或街道", required: true, maxlength: 40 },
    { id: "workTime", label: "上班安排", placeholder: "例如：长白班，月休4天", required: true, maxlength: 80, multiline: true },
    { id: "requirements", label: "岗位要求", placeholder: "说明经验、身体条件或技能要求", required: true, maxlength: 120, multiline: true },
    { id: "benefitsText", label: "福利待遇", placeholder: "用逗号分开，例如：包工作餐，可提供住宿", required: false, maxlength: 100, multiline: true }
  ],
  initialJobDraft: {
    title: "",
    headcount: "",
    salaryMin: "",
    salaryMax: "",
    location: "贵阳市修文县扎佐街道",
    workTime: "",
    requirements: "",
    benefitsText: ""
  },
  jobExampleDraft: {
    title: "食品包装工",
    headcount: "8",
    salaryMin: "4000",
    salaryMax: "5200",
    location: "贵阳市修文县扎佐街道",
    workTime: "长白班，月休4天",
    requirements: "经验不限，入职有人教",
    benefitsText: "包工作餐，可提供住宿，按月发工资"
  },
  formNotice: "这里只做本地填写和校验，不会保存草稿，也不会提交或发布岗位。",
  previewNotice: "仅预览：这条岗位没有发送到平台，求职者看不到，也不会进入审核。",
  candidateNotice: "以下均为本地示例。查看和标记不会联系、邀约、拒绝或通知任何候选人。",
  candidateFilters: [
    { id: "all", label: "全部" },
    { id: "new", label: "待查看" },
    { id: "reviewed", label: "已看过" },
    { id: "potential", label: "较合适" }
  ],
  candidates: [
    {
      id: "candidate-001",
      name: "王师傅",
      ageText: "38岁",
      location: "贵阳市修文县",
      experience: "做过3年食品包装",
      targetJobId: "employer-job-001",
      targetJobTitle: "食品包装工",
      statusId: "new",
      statusLabel: "待查看（示例）",
      highlights: ["可接受长白班", "住在附近"]
    },
    {
      id: "candidate-002",
      name: "李女士",
      ageText: "32岁",
      location: "贵阳市白云区",
      experience: "有流水线工作经验",
      targetJobId: "employer-job-001",
      targetJobTitle: "食品包装工",
      statusId: "potential",
      statusLabel: "较合适（示例）",
      highlights: ["可尽快到岗", "做事细致"]
    },
    {
      id: "candidate-003",
      name: "赵师傅",
      ageText: "41岁",
      location: "贵阳市修文县",
      experience: "做过仓库装卸和盘点",
      targetJobId: "employer-job-002",
      targetJobTitle: "仓库搬运工",
      statusId: "reviewed",
      statusLabel: "已看过（示例）",
      highlights: ["能上夜班", "有仓库经验"]
    },
    {
      id: "candidate-004",
      name: "陈女士",
      ageText: "35岁",
      location: "黔南州龙里县",
      experience: "做过2年食品生产",
      targetJobId: "employer-job-003",
      targetJobTitle: "酸汤生产普工",
      statusId: "new",
      statusLabel: "待查看（示例）",
      highlights: ["能长期稳定上班"]
    },
    {
      id: "candidate-005",
      name: "周师傅",
      ageText: "29岁",
      location: "贵阳市修文县",
      experience: "希望找稳定普工岗位",
      targetJobId: "employer-job-001",
      targetJobTitle: "食品包装工",
      statusId: "new",
      statusLabel: "待查看（示例）",
      highlights: ["无经验愿意学"]
    },
    {
      id: "candidate-006",
      name: "孙师傅",
      ageText: "44岁",
      location: "贵阳市息烽县",
      experience: "有搬运和叉车辅助经验",
      targetJobId: "employer-job-002",
      targetJobTitle: "仓库搬运工",
      statusId: "reviewed",
      statusLabel: "已看过（示例）",
      highlights: ["可接受轮班"]
    }
  ]
};

function cloneLocal(value) {
  return JSON.parse(JSON.stringify(value));
}

function calculateProfileProgress(company) {
  const requiredFields = employerMock.profileFields.filter((field) => field.required);
  const filled = requiredFields.filter((field) => String(company[field.id] || "").trim()).length;
  return {
    filled,
    total: requiredFields.length,
    percent: Math.round((filled / requiredFields.length) * 100),
    label: filled === requiredFields.length ? "本地示例资料已填完整" : `还差${requiredFields.length - filled}项`
  };
}

function validateJobDraft(draft) {
  const errors = {};
  employerFlowMock.jobFormFields.forEach((field) => {
    if (field.required && !String(draft[field.id] || "").trim()) {
      errors[field.id] = `请填写${field.label}`;
    }
  });

  const headcount = Number(draft.headcount);
  const salaryMin = Number(draft.salaryMin);
  const salaryMax = Number(draft.salaryMax);
  if (draft.headcount && (!Number.isInteger(headcount) || headcount <= 0)) {
    errors.headcount = "招聘人数要填写大于0的整数";
  }
  if (draft.salaryMin && (!Number.isFinite(salaryMin) || salaryMin <= 0)) {
    errors.salaryMin = "最低月薪要填写大于0的数字";
  }
  if (draft.salaryMax && (!Number.isFinite(salaryMax) || salaryMax <= 0)) {
    errors.salaryMax = "最高月薪要填写大于0的数字";
  }
  if (!errors.salaryMin && !errors.salaryMax && salaryMin > salaryMax) {
    errors.salaryMax = "最高月薪不能低于最低月薪";
  }
  return errors;
}

function buildJobPreview(draft) {
  const benefits = String(draft.benefitsText || "")
    .split(/[，,、]/)
    .map((item) => item.trim())
    .filter(Boolean);
  return {
    id: "local-preview",
    title: String(draft.title || "").trim(),
    headcount: Number(draft.headcount),
    salaryMin: Number(draft.salaryMin),
    salaryMax: Number(draft.salaryMax),
    salaryLabel: `${Number(draft.salaryMin)}至${Number(draft.salaryMax)}元/月`,
    location: String(draft.location || "").trim(),
    workTime: String(draft.workTime || "").trim(),
    requirements: String(draft.requirements || "").trim(),
    benefits,
    sourceLabel: "来自本地表单"
  };
}

function getExampleJobPreview() {
  const preview = buildJobPreview(employerFlowMock.jobExampleDraft);
  preview.sourceLabel = "集中示例数据";
  return preview;
}

function isValidJobPreviewSnapshot(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const requiredTextFields = ["title", "salaryLabel", "location", "workTime", "requirements"];
  const hasRequiredText = requiredTextFields.every((field) =>
    typeof value[field] === "string" && value[field].trim()
  );
  const headcount = Number(value.headcount);
  return hasRequiredText && Number.isInteger(headcount) && headcount > 0 && Array.isArray(value.benefits);
}

function normalizeJobPreview(value) {
  if (!isValidJobPreviewSnapshot(value)) {
    return getExampleJobPreview();
  }
  const fallback = getExampleJobPreview();
  const textFields = ["title", "salaryLabel", "location", "workTime", "requirements"];
  const normalized = Object.assign({}, fallback);
  textFields.forEach((field) => {
    if (typeof value[field] === "string" && value[field].trim()) {
      normalized[field] = value[field].trim().slice(0, 160);
    }
  });
  const headcount = Number(value.headcount);
  if (Number.isInteger(headcount) && headcount > 0) {
    normalized.headcount = headcount;
  }
  if (Array.isArray(value.benefits)) {
    normalized.benefits = value.benefits
      .filter((item) => typeof item === "string")
      .map((item) => item.trim().slice(0, 30))
      .filter(Boolean)
      .slice(0, 8);
  }
  normalized.sourceLabel = "来自本地表单";
  return normalized;
}

function filterCandidates(candidates, statusId, query, jobId) {
  const keyword = String(query || "").trim().toLowerCase();
  return candidates.filter((candidate) => {
    const searchable = [candidate.name, candidate.location, candidate.experience, candidate.targetJobTitle]
      .join(" ")
      .toLowerCase();
    const matchesStatus = statusId === "all" || candidate.statusId === statusId;
    const matchesJob = !jobId || jobId === "all" || candidate.targetJobId === jobId;
    return matchesStatus && matchesJob && (!keyword || searchable.includes(keyword));
  });
}

module.exports = {
  employerMock,
  employerFlowMock,
  cloneLocal,
  calculateProfileProgress,
  validateJobDraft,
  buildJobPreview,
  getExampleJobPreview,
  isValidJobPreviewSnapshot,
  normalizeJobPreview,
  filterCandidates
};
