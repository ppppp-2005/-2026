const { ServiceError } = require("./errors");

const MOCK_SCENARIOS = Object.freeze([
  "success",
  "loading",
  "empty",
  "error",
  "timeout",
  "offline",
  "unauthorized",
  "page",
  "end"
]);

function wait(delayMs) {
  if (!delayMs) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

function paginate(items, page = 1, pageSize = 10) {
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1) {
    throw new ServiceError("validation", "page and pageSize must be positive integers");
  }
  const source = Array.isArray(items) ? items : [];
  const start = (page - 1) * pageSize;
  const pageItems = source.slice(start, start + pageSize);
  const hasMore = start + pageItems.length < source.length;
  return Object.freeze({
    state: hasMore ? "page" : "end",
    items: pageItems,
    page,
    pageSize,
    total: source.length,
    hasMore,
    nextPage: hasMore ? page + 1 : null
  });
}

function createMockRuntime(options = {}) {
  const fixtures = Object.freeze({ ...(options.fixtures || {}) });
  const defaultScenario = options.scenario || "success";
  const defaultDelayMs = options.delayMs || 0;
  if (!MOCK_SCENARIOS.includes(defaultScenario)) {
    throw new Error(`Unsupported mock scenario: ${defaultScenario}`);
  }

  async function execute(operation, execution = {}) {
    const scenario = execution.scenario || defaultScenario;
    if (!MOCK_SCENARIOS.includes(scenario)) {
      throw new ServiceError("validation", `Unsupported mock scenario: ${scenario}`);
    }
    const delayMs = execution.delayMs === undefined ? defaultDelayMs : execution.delayMs;
    if (!Number.isFinite(delayMs) || delayMs < 0) {
      throw new ServiceError("validation", "Mock delay must be zero or greater");
    }
    if (execution.onStateChange !== undefined && typeof execution.onStateChange !== "function") {
      throw new ServiceError("validation", "onStateChange must be a function");
    }

    const fixture = execution.data === undefined ? fixtures[operation] : execution.data;
    if (scenario === "loading") {
      if (execution.onStateChange) execution.onStateChange("loading");
      await wait(delayMs);
      if (execution.onStateChange) execution.onStateChange("success");
      return Object.freeze({ state: "success", data: fixture === undefined ? null : fixture, delayMs });
    }

    await wait(delayMs);
    if (scenario === "success") {
      return Object.freeze({ state: "success", data: fixture === undefined ? null : fixture, delayMs });
    }
    if (scenario === "empty") {
      return Object.freeze({ state: "empty", data: Array.isArray(fixture) ? [] : null, delayMs });
    }
    if (scenario === "page" || scenario === "end") {
      const items = Array.isArray(fixture) ? fixture : [];
      const pageSize = execution.pageSize === undefined || execution.pageSize === null ? 10 : execution.pageSize;
      if (!Number.isInteger(pageSize) || pageSize < 1) return paginate(items, 1, pageSize);
      const finalPage = Math.max(1, Math.ceil(items.length / pageSize));
      const requestedPage = execution.page === undefined || execution.page === null ? 1 : execution.page;
      const page = scenario === "end" ? finalPage : requestedPage;
      return paginate(items, page, pageSize);
    }

    const kind = scenario === "error" ? "server" : scenario;
    throw new ServiceError(kind, `Mock ${scenario}`, {
      code: `MOCK_${scenario.toUpperCase()}`,
      retriable: ["error", "timeout", "offline"].includes(scenario)
    });
  }

  return Object.freeze({ execute, fixtures });
}

module.exports = { MOCK_SCENARIOS, createMockRuntime, paginate };
