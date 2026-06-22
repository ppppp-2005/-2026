const ERROR_KINDS = Object.freeze([
  "validation",
  "offline",
  "timeout",
  "unauthorized",
  "network",
  "server",
  "unknown"
]);

const PAGE_ERROR_MESSAGES = Object.freeze({
  validation: "请检查填写内容",
  offline: "当前网络不可用",
  timeout: "请求超时，请稍后重试",
  unauthorized: "登录已失效，请重新登录",
  network: "网络异常，请稍后重试",
  server: "服务暂不可用",
  unknown: "操作失败，请稍后重试"
});

class ServiceError extends Error {
  constructor(kind, message, details = {}) {
    const safeKind = ERROR_KINDS.includes(kind) ? kind : "unknown";
    super(message || PAGE_ERROR_MESSAGES[safeKind]);
    this.name = "ServiceError";
    this.kind = safeKind;
    this.code = details.code || safeKind.toUpperCase();
    this.statusCode = details.statusCode || 0;
    this.requestId = details.requestId || "";
    this.retriable = details.retriable === true;
    this.details = details.details || null;
  }
}

function pageMessageFor(error) {
  const kind = error && ERROR_KINDS.includes(error.kind) ? error.kind : "unknown";
  return PAGE_ERROR_MESSAGES[kind];
}

function normalizeError(error, context = {}) {
  if (error instanceof ServiceError) {
    if (!error.requestId && context.requestId) error.requestId = context.requestId;
    return error;
  }

  const statusCode = Number(context.statusCode || (error && (error.statusCode || error.status)) || 0);
  const code = String((error && error.code) || context.code || "").toUpperCase();
  let kind = error && ERROR_KINDS.includes(error.kind) ? error.kind : "unknown";

  if (statusCode === 401 || statusCode === 403) kind = "unauthorized";
  else if (statusCode >= 500) kind = "server";
  else if (statusCode >= 400) kind = "validation";
  else if (code === "OFFLINE" || (error && error.offline === true)) kind = "offline";
  else if (["TIMEOUT", "ETIMEDOUT", "ABORT_ERR"].includes(code) || (error && error.name === "AbortError")) kind = "timeout";
  else if (["NETWORK", "ECONNRESET", "ECONNREFUSED", "ENOTFOUND"].includes(code) || (error && error.name === "TypeError")) kind = "network";

  return new ServiceError(kind, error && error.message, {
    code: code || kind.toUpperCase(),
    statusCode,
    requestId: context.requestId || (error && error.requestId) || "",
    retriable: ["offline", "timeout", "network", "server"].includes(kind),
    details: context.details || null
  });
}

function fromHttpResponse(response, requestId) {
  const statusCode = Number(response && response.statusCode) || 0;
  const payload = response && response.data;
  const message = payload && typeof payload.message === "string" ? payload.message : `HTTP ${statusCode || "error"}`;
  return normalizeError(
    { message, code: payload && payload.code, statusCode },
    { statusCode, requestId, details: payload || null }
  );
}

module.exports = {
  ERROR_KINDS,
  PAGE_ERROR_MESSAGES,
  ServiceError,
  fromHttpResponse,
  normalizeError,
  pageMessageFor
};
