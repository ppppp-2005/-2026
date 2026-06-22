const {
  employerMock,
  employerFlowMock,
  cloneLocal,
  filterCandidates,
  validateJobDraft,
  buildJobPreview,
  isValidJobPreviewSnapshot,
  normalizeJobPreview
} = require("../data/employer");
const authSession = require("./auth-session");
const { ServiceError, pageMessageFor } = require("./errors");
const { createMockRuntime, paginate } = require("./mock-runtime");
const { createSubmissionGuard } = require("./submission-guard");

const DEFAULT_DELAY_MS = 90;
const FORM_SUBMISSION_KEY = "employer.prepareJobPreview";
const PREVIEW_CONFIRM_KEY = "employer.confirmPreviewDemo";
const UI_SCENARIOS = Object.freeze([
  { id: "normal", name: "正常" },
  { id: "empty", name: "空数据" },
  { id: "error", name: "服务错误" },
  { id: "timeout", name: "超时" },
  { id: "offline", name: "离线" },
  { id: "unauthorized", name: "身份过期" }
]);
const runtime = createMockRuntime();
const submissionGuard = createSubmissionGuard();

function runtimeScenario(scenario) {
  const selected = scenario || "normal";
  if (!UI_SCENARIOS.some((item) => item.id === selected)) {
    throw new ServiceError("validation", "不支持这个本地测试状态", {
      code: "INVALID_EMPLOYER_SCENARIO"
    });
  }
  return selected === "normal" ? "success" : selected;
}

function requireEmployerSession() {
  const session = authSession.snapshot();
  if (session.status === "expired") {
    throw new ServiceError("unauthorized", "本地演示身份已过期", {
      code: "EMPLOYER_SESSION_EXPIRED"
    });
  }
  if (session.status !== "authenticated") {
    throw new ServiceError("unauthorized", "请先进入企业本地演示", {
      code: "EMPLOYER_DEMO_REQUIRED"
    });
  }
  if (session.role !== "employer") {
    throw new ServiceError("unauthorized", "当前不是企业演示身份", {
      code: "EMPLOYER_ROLE_REQUIRED"
    });
  }
  return session;
}

async function executeRead(operation, fixture, options = {}) {
  requireEmployerSession();
  try {
    return await runtime.execute(operation, {
      scenario: runtimeScenario(options.scenario),
      delayMs: options.delayMs === undefined ? DEFAULT_DELAY_MS : options.delayMs,
      data: fixture
    });
  } catch (error) {
    if (error && error.kind === "unauthorized") authSession.expire();
    throw error;
  }
}

async function startEmployerDemo(options = {}) {
  authSession.setRole("employer");
  const session = authSession.snapshot();
  if (session.status === "authenticated") return session;
  return authSession.demoLogin({
    scenario: options.scenario || "success",
    delayMs: options.delayMs === undefined ? 140 : options.delayMs
  });
}

async function getDashboard(options = {}) {
  const result = await executeRead("employer.getDashboard", employerMock, options);
  return result.data ? cloneLocal(result.data) : null;
}

async function getJobForm(options = {}) {
  const fixture = {
    fields: employerFlowMock.jobFormFields,
    draft: employerFlowMock.initialJobDraft,
    exampleDraft: employerFlowMock.jobExampleDraft,
    honestNote: employerFlowMock.formNotice
  };
  const result = await executeRead("employer.getJobForm", fixture, options);
  return result.data ? cloneLocal(result.data) : null;
}

function parseSnapshot(rawSnapshot) {
  if (!rawSnapshot) return null;
  try {
    return JSON.parse(decodeURIComponent(rawSnapshot));
  } catch (error) {
    try {
      return JSON.parse(rawSnapshot);
    } catch (nestedError) {
      return null;
    }
  }
}

async function getJobPreview(options = {}) {
  const parsed = parseSnapshot(options.snapshot);
  const hasValidSnapshot = isValidJobPreviewSnapshot(parsed);
  const fixture = {
    preview: normalizeJobPreview(parsed),
    honestNote: employerFlowMock.previewNotice,
    loadNote: hasValidSnapshot
      ? "已读取本次表单的本地预览快照"
      : options.snapshot
        ? "快照内容不完整，已改用集中示例数据"
        : "正在使用集中示例数据预览"
  };
  const result = await executeRead("employer.getJobPreview", fixture, options);
  return result.data ? cloneLocal(result.data) : null;
}

async function listCandidates(options = {}) {
  const page = options.page === undefined ? 1 : options.page;
  const pageSize = options.pageSize === undefined ? 3 : options.pageSize;
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1) {
    throw new ServiceError("validation", "页码和每页数量必须是正整数", {
      code: "INVALID_EMPLOYER_PAGINATION"
    });
  }
  const filtered = filterCandidates(
    employerFlowMock.candidates,
    options.statusId || "all",
    options.query || "",
    options.jobId || "all"
  );
  const result = await executeRead("employer.listCandidates", filtered, options);
  const pageResult = paginate(Array.isArray(result.data) ? result.data : [], page, pageSize);
  return Object.freeze({
    filters: cloneLocal(employerFlowMock.candidateFilters),
    jobs: cloneLocal(employerMock.jobs),
    honestNote: employerFlowMock.candidateNotice,
    items: cloneLocal(pageResult.items),
    total: pageResult.total,
    page: pageResult.page,
    pageSize: pageResult.pageSize,
    hasMore: pageResult.hasMore,
    nextPage: pageResult.nextPage
  });
}

async function prepareJobPreview(draft, options = {}) {
  return submissionGuard.run(FORM_SUBMISSION_KEY, async () => {
    requireEmployerSession();
    const errors = validateJobDraft(draft || {});
    if (Object.keys(errors).length) {
      throw new ServiceError("validation", "还有信息需要补充，请查看标红提示。", {
        code: "INVALID_JOB_DRAFT",
        details: { fields: errors }
      });
    }
    await runtime.execute("employer.prepareJobPreview", {
      scenario: runtimeScenario(options.scenario),
      delayMs: options.delayMs === undefined ? 240 : options.delayMs,
      data: null
    });
    return Object.freeze({
      preview: buildJobPreview(draft),
      localOnly: true,
      saved: false,
      submitted: false,
      published: false
    });
  });
}

async function confirmPreviewDemo(options = {}) {
  return submissionGuard.run(PREVIEW_CONFIRM_KEY, async () => {
    requireEmployerSession();
    await runtime.execute("employer.confirmPreviewDemo", {
      scenario: runtimeScenario(options.scenario),
      delayMs: options.delayMs === undefined ? 180 : options.delayMs,
      data: null
    });
    return Object.freeze({
      localOnly: true,
      confirmed: true,
      submitted: false,
      published: false,
      receipt: null
    });
  });
}

async function markCandidateDemo(candidateId, options = {}) {
  requireEmployerSession();
  const candidate = employerFlowMock.candidates.find((item) => item.id === candidateId);
  if (!candidate) {
    throw new ServiceError("validation", "没有找到这个本地示例候选人", {
      code: "CANDIDATE_NOT_FOUND"
    });
  }
  await runtime.execute("employer.markCandidateDemo", {
    scenario: runtimeScenario(options.scenario),
    delayMs: options.delayMs === undefined ? 120 : options.delayMs,
    data: null
  });
  const demoStatusLabel = "本页标记：稍后再看";
  return Object.freeze({ candidateId, demoStatusLabel, localOnly: true, notified: false });
}

function messageForError(error) {
  const messages = {
    EMPLOYER_DEMO_REQUIRED: "请先进入企业本地演示，不会进行真实登录",
    EMPLOYER_SESSION_EXPIRED: "本地演示身份已过期，请重新进入",
    EMPLOYER_ROLE_REQUIRED: "当前是求职者演示身份，请切换到企业本地演示",
    DUPLICATE_SUBMISSION: "操作进行中，请勿重复点击"
  };
  if (messages[error && error.code]) return messages[error.code];
  if (error && error.kind === "unauthorized") return "本地演示身份已过期，请重新进入";
  return pageMessageFor(error);
}

function isPreviewSubmissionPending() {
  return submissionGuard.isPending(FORM_SUBMISSION_KEY);
}

module.exports = {
  UI_SCENARIOS,
  confirmPreviewDemo,
  getDashboard,
  getJobForm,
  getJobPreview,
  isPreviewSubmissionPending,
  listCandidates,
  markCandidateDemo,
  messageForError,
  prepareJobPreview,
  startEmployerDemo
};
