const {
  jobsMock,
  findJobById,
  getSessionFavoriteJobIds,
  toggleSessionFavoriteJob
} = require("../data/jobs");
const { ServiceError, pageMessageFor } = require("./errors");
const { createMockRuntime, paginate } = require("./mock-runtime");
const { createSubmissionGuard } = require("./submission-guard");

const DEFAULT_DELAY_MS = 80;
const APPLY_KEY_PREFIX = "jobs.applyDemo:";
const UI_SCENARIOS = Object.freeze([
  { id: "normal", name: "正常" },
  { id: "empty", name: "空数据" },
  { id: "error", name: "服务错误" },
  { id: "timeout", name: "超时" },
  { id: "offline", name: "离线" },
  { id: "unauthorized", name: "未授权" }
]);
const runtime = createMockRuntime();
const applyGuard = createSubmissionGuard();

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function runtimeScenario(scenario) {
  const selected = scenario || "normal";
  if (!UI_SCENARIOS.some((item) => item.id === selected)) {
    throw new ServiceError("validation", "不支持这个本地测试状态", {
      code: "INVALID_JOBS_SCENARIO"
    });
  }
  return selected === "normal" ? "success" : selected;
}

function searchableText(job) {
  return [job.title, job.location, job.company, job.companyInfo]
    .concat(job.labels || [])
    .join(" ")
    .toLowerCase();
}

function filterAndSortJobs(items, options) {
  const keyword = String(options.query || "").trim().toLowerCase();
  const filterId = options.filterId || "all";
  const zoneId = options.zoneId || "all";
  const sortId = options.sortId || "recommended";
  const filtered = items.filter((job) => {
    const matchesSearch = !keyword || searchableText(job).includes(keyword);
    const matchesFilter = filterId === "all" || (job.filterIds || []).includes(filterId);
    const matchesZone = zoneId === "all" ||
      (zoneId === "urgent" ? job.badge === "急招" : job.zoneId === zoneId);
    return matchesSearch && matchesFilter && matchesZone;
  });

  return filtered.sort((left, right) => {
    if (sortId === "salary") return right.salaryTop - left.salaryTop;
    if (sortId === "distance") return left.distanceKm - right.distanceKm;
    return left.rank - right.rank;
  });
}

function withFavoriteState(items) {
  const favoriteIds = getSessionFavoriteJobIds();
  return items.map((job) => Object.assign({}, clone(job), {
    isFavorite: favoriteIds.includes(job.id)
  }));
}

function getUiConfig() {
  return clone({
    header: jobsMock.header,
    zones: jobsMock.zones,
    filters: jobsMock.filters,
    sorts: jobsMock.sorts,
    scenarios: UI_SCENARIOS
  });
}

async function list(options = {}) {
  const page = options.page === undefined ? 1 : options.page;
  const pageSize = options.pageSize === undefined ? 10 : options.pageSize;
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1) {
    throw new ServiceError("validation", "页码和每页数量必须是正整数", {
      code: "INVALID_PAGINATION"
    });
  }

  const sorted = filterAndSortJobs(jobsMock.jobs.slice(), options);
  const result = await runtime.execute("jobs.list", {
    scenario: runtimeScenario(options.scenario),
    delayMs: options.delayMs === undefined ? DEFAULT_DELAY_MS : options.delayMs,
    data: sorted
  });
  const pageResult = paginate(Array.isArray(result.data) ? result.data : [], page, pageSize);
  return Object.freeze({
    items: withFavoriteState(pageResult.items),
    total: pageResult.total,
    page: pageResult.page,
    pageSize: pageResult.pageSize,
    hasMore: pageResult.hasMore,
    nextPage: pageResult.nextPage
  });
}

async function getById(id, options = {}) {
  if (typeof id !== "string" || !id.trim()) {
    throw new ServiceError("validation", "缺少职位编号", {
      code: "MISSING_JOB_ID"
    });
  }
  const result = await runtime.execute("jobs.getById", {
    scenario: runtimeScenario(options.scenario),
    delayMs: options.delayMs === undefined ? DEFAULT_DELAY_MS : options.delayMs,
    data: findJobById(id.trim())
  });
  return result.data ? clone(result.data) : null;
}

function getFavoriteIds() {
  return getSessionFavoriteJobIds();
}

function toggleFavorite(id) {
  if (!findJobById(id)) {
    throw new ServiceError("validation", "职位不存在，无法收藏", {
      code: "JOB_NOT_FOUND"
    });
  }
  return toggleSessionFavoriteJob(id);
}

async function applyDemo(id, options = {}) {
  if (!findJobById(id)) {
    throw new ServiceError("validation", "职位不存在，无法体验投递", {
      code: "JOB_NOT_FOUND"
    });
  }
  const key = `${APPLY_KEY_PREFIX}${id}`;
  return applyGuard.run(key, async () => {
    await runtime.execute("jobs.applyDemo", {
      scenario: runtimeScenario(options.scenario),
      delayMs: options.delayMs === undefined ? 260 : options.delayMs,
      data: { id }
    });
    return Object.freeze({
      jobId: id,
      localOnly: true,
      submitted: false
    });
  });
}

function isApplyPending(id) {
  return applyGuard.isPending(`${APPLY_KEY_PREFIX}${id}`);
}

function messageForError(error) {
  if (error && error.code === "DUPLICATE_SUBMISSION") {
    return "操作进行中，请勿重复点击";
  }
  return pageMessageFor(error);
}

module.exports = {
  UI_SCENARIOS,
  applyDemo,
  getById,
  getFavoriteIds,
  getUiConfig,
  isApplyPending,
  list,
  messageForError,
  toggleFavorite
};
