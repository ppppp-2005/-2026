const { messageMock } = require("../data/messages");
const authSession = require("./auth-session");
const { ServiceError, pageMessageFor } = require("./errors");
const { createMockRuntime, paginate } = require("./mock-runtime");
const { createSubmissionGuard } = require("./submission-guard");

const LIST_OPERATION = "notifications.listMessages";
const DETAIL_OPERATION = "notifications.getMessageDetail";
const DRAFT_OPERATION = "notifications.validateDraft";
const runtime = createMockRuntime();
const draftGuard = createSubmissionGuard();

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function requireAuthenticated(expectedSession) {
  const session = authSession.snapshot();
  if (session.status !== "authenticated") {
    throw new ServiceError("unauthorized", "Local demo session is unavailable", {
      code: session.status === "expired" ? "SESSION_EXPIRED" : "SESSION_ANONYMOUS"
    });
  }
  if (expectedSession && (
    session.generation !== expectedSession.generation
    || session.role !== expectedSession.role
    || session.displayName !== expectedSession.displayName
    || session.localOnly !== expectedSession.localOnly
    || session.persistent !== expectedSession.persistent
  )) {
    throw new ServiceError("unauthorized", "Local demo session changed", {
      code: "SESSION_CHANGED"
    });
  }
  return session;
}

function scenarioForRead(scenario) {
  return scenario === "success" ? "loading" : scenario;
}

async function listMessages(options = {}) {
  const session = requireAuthenticated();
  const page = options.page === undefined ? 1 : options.page;
  const pageSize = options.pageSize === undefined ? 2 : options.pageSize;
  const scenario = options.scenario || "success";
  const result = await runtime.execute(LIST_OPERATION, {
    scenario: scenarioForRead(scenario),
    delayMs: options.delayMs === undefined ? 180 : options.delayMs,
    data: clone(messageMock.messages)
  });
  requireAuthenticated(session);
  const pageResult = paginate(Array.isArray(result.data) ? result.data : [], page, pageSize);
  return Object.freeze({
    ...pageResult,
    header: clone(messageMock.header),
    categories: clone(messageMock.categories)
  });
}

async function getMessageDetail(id, options = {}) {
  const session = requireAuthenticated();
  const scenario = options.scenario || "success";
  const detail = messageMock.messages.find((message) => message.id === id) || null;
  const result = await runtime.execute(DETAIL_OPERATION, {
    scenario: scenarioForRead(scenario),
    delayMs: options.delayMs === undefined ? 160 : options.delayMs,
    data: detail ? clone(detail) : null
  });
  requireAuthenticated(session);
  return Object.freeze({
    state: result.data ? "success" : "empty",
    detail: result.data ? clone(result.data) : null
  });
}

async function validateDraft(id, text, options = {}) {
  const session = requireAuthenticated();
  const draft = typeof text === "string" ? text.trim() : "";
  if (!draft) {
    throw new ServiceError("validation", "Draft text is required", {
      code: "DRAFT_REQUIRED"
    });
  }
  const key = `${DRAFT_OPERATION}:${id || "unknown"}`;
  return draftGuard.run(key, async () => {
    await runtime.execute(DRAFT_OPERATION, {
      scenario: scenarioForRead(options.scenario || "success"),
      delayMs: options.delayMs === undefined ? 320 : options.delayMs,
      data: { length: draft.length }
    });
    requireAuthenticated(session);
    return Object.freeze({
      state: "validated",
      localOnly: true,
      saved: false,
      sent: false
    });
  });
}

function messageForError(error) {
  if (error && error.code === "SESSION_ANONYMOUS") return "请先进入本地演示，再查看消息。";
  if (error && error.code === "SESSION_EXPIRED") return "本地演示身份已失效，请重新进入。";
  if (error && error.code === "SESSION_CHANGED") return "本地演示身份已变化，请重新操作。";
  if (error && error.code === "DRAFT_REQUIRED") return "请先输入非空内容，草稿不会发送。";
  if (error && error.code === "DUPLICATE_SUBMISSION") return "正在校验草稿，请勿重复点击。";
  return pageMessageFor(error);
}

module.exports = {
  expireLocalDemo: authSession.expire,
  getMessageDetail,
  listMessages,
  messageForError,
  sessionSnapshot: authSession.snapshot,
  startLocalDemo: authSession.demoLogin,
  validateDraft
};
