const { ServiceError, fromHttpResponse, normalizeError } = require("./errors");

function createTransport(options) {
  if (!options || typeof options.send !== "function") {
    throw new Error("Transport requires an injected send(request) function");
  }
  const baseUrl = typeof options.baseUrl === "string" ? options.baseUrl.trim().replace(/\/$/, "") : "";
  if (!baseUrl) throw new Error("Transport baseUrl is required");
  if (!Number.isFinite(options.timeoutMs) || options.timeoutMs <= 0) {
    throw new Error("Transport timeoutMs must be a positive number");
  }

  let requestSequence = 0;
  const createRequestId = options.createRequestId || (() => `request-${++requestSequence}`);
  const getAccessToken = options.getAccessToken || (() => "");

  async function request(spec) {
    if (!spec || typeof spec.path !== "string" || !spec.path.startsWith("/")) {
      throw new ServiceError("validation", "Request path must start with /");
    }
    const method = String(spec.method || "GET").toUpperCase();
    const timeoutMs = spec.timeoutMs === undefined ? options.timeoutMs : spec.timeoutMs;
    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
      throw new ServiceError("validation", "Request timeout must be a positive number");
    }

    const requestId = createRequestId();
    const headers = { ...(spec.headers || {}), "X-Request-ID": requestId };
    if (spec.auth !== false) {
      const accessToken = await getAccessToken();
      if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    }

    let timer;
    const timeout = new Promise((resolve, reject) => {
      timer = setTimeout(() => {
        reject(new ServiceError("timeout", "Request timed out", {
          code: "TIMEOUT",
          requestId,
          retriable: true
        }));
      }, timeoutMs);
    });

    try {
      const response = await Promise.race([
        Promise.resolve().then(() => options.send({
          url: `${baseUrl}${spec.path}`,
          method,
          headers,
          data: spec.data,
          timeoutMs,
          requestId
        })),
        timeout
      ]);
      const statusCode = Number(response && response.statusCode) || 0;
      if (statusCode < 200 || statusCode >= 300) {
        throw fromHttpResponse(response, requestId);
      }
      return {
        data: response.data,
        statusCode,
        requestId,
        headers: response.headers || {}
      };
    } catch (error) {
      throw normalizeError(error, { requestId });
    } finally {
      clearTimeout(timer);
    }
  }

  return Object.freeze({ request });
}

module.exports = { createTransport };
