const { ServiceError, pageMessageFor } = require("./errors");
const { createMockRuntime } = require("./mock-runtime");
const { createSubmissionGuard } = require("./submission-guard");

const SESSION_STATES = Object.freeze([
  "anonymous",
  "loading",
  "authenticated",
  "expired"
]);
const SESSION_ROLES = Object.freeze(["seeker", "employer"]);
const LOGIN_KEY = "auth.demoLogin";
const runtime = createMockRuntime({
  fixtures: {
    [LOGIN_KEY]: {
      displayName: "本地演示用户"
    }
  }
});
const guard = createSubmissionGuard();

let session = createSession();
let generation = 0;

function createSession(overrides = {}) {
  return {
    status: "anonymous",
    role: "seeker",
    displayName: "",
    localOnly: true,
    persistent: false,
    ...overrides
  };
}

function snapshot() {
  return Object.freeze({ ...session, generation });
}

function replaceSession(overrides) {
  const nextSession = createSession({ ...session, ...overrides });
  const changed = Object.keys(session).some((key) => session[key] !== nextSession[key]);
  if (changed) generation += 1;
  session = nextSession;
  return snapshot();
}

async function demoLogin(options = {}) {
  const scenario = options.scenario || "success";
  const delayMs = options.delayMs === undefined ? 180 : options.delayMs;

  return guard.run(LOGIN_KEY, async () => {
    replaceSession({ status: "loading", displayName: "" });
    try {
      const result = await runtime.execute(LOGIN_KEY, {
        scenario: scenario === "success" ? "loading" : scenario,
        delayMs
      });
      const displayName = result.data && result.data.displayName
        ? result.data.displayName
        : "本地演示用户";
      return replaceSession({ status: "authenticated", displayName });
    } catch (error) {
      replaceSession({
        status: error && error.kind === "unauthorized" ? "expired" : "anonymous",
        displayName: ""
      });
      throw error;
    }
  });
}

function expire() {
  return replaceSession({ status: "expired", displayName: "" });
}

function logout() {
  return replaceSession(createSession());
}

function setRole(role) {
  if (!SESSION_ROLES.includes(role)) {
    throw new ServiceError("validation", "不支持这个本地角色", {
      code: "INVALID_DEMO_ROLE"
    });
  }
  return replaceSession({ role });
}

function isLoginPending() {
  return guard.isPending(LOGIN_KEY);
}

function messageForError(error) {
  if (error && error.code === "DUPLICATE_SUBMISSION") {
    return "操作进行中，请勿重复点击";
  }
  return pageMessageFor(error);
}

module.exports = {
  SESSION_ROLES,
  SESSION_STATES,
  demoLogin,
  expire,
  isLoginPending,
  logout,
  messageForError,
  setRole,
  snapshot
};
