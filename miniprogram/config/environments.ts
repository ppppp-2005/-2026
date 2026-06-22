const ENVIRONMENT_NAMES = Object.freeze(["local", "test", "staging", "production"]);
const DATA_MODES = Object.freeze(["mock", "api"]);

const ENVIRONMENT_PRESETS = Object.freeze({
  local: Object.freeze({
    name: "local",
    dataMode: "mock",
    apiBaseUrl: "",
    timeoutMs: 5000
  }),
  test: Object.freeze({
    name: "test",
    dataMode: "mock",
    apiBaseUrl: "",
    timeoutMs: 3000
  }),
  staging: Object.freeze({
    name: "staging",
    dataMode: "api",
    apiBaseUrl: "",
    timeoutMs: 8000
  }),
  production: Object.freeze({
    name: "production",
    dataMode: "api",
    apiBaseUrl: "",
    timeoutMs: 8000
  })
});

function validateEnvironmentConfig(input) {
  if (!input || !ENVIRONMENT_NAMES.includes(input.name)) {
    throw new Error(`Unsupported environment: ${input && input.name ? input.name : "missing"}`);
  }
  if (!DATA_MODES.includes(input.dataMode)) {
    throw new Error(`Unsupported dataMode: ${input.dataMode}`);
  }
  if (!Number.isFinite(input.timeoutMs) || input.timeoutMs <= 0) {
    throw new Error("timeoutMs must be a positive number");
  }

  const serviceModes = Object.freeze({ ...(input.serviceModes || {}) });
  for (const [domain, mode] of Object.entries(serviceModes)) {
    if (!DATA_MODES.includes(mode)) {
      throw new Error(`Unsupported adapter mode for ${domain}: ${mode}`);
    }
  }

  const needsApi = input.dataMode === "api" || Object.values(serviceModes).includes("api");
  const apiBaseUrl = typeof input.apiBaseUrl === "string" ? input.apiBaseUrl.trim().replace(/\/$/, "") : "";
  if (needsApi && !apiBaseUrl) {
    throw new Error(`API base URL is required for ${input.name} in api mode`);
  }
  if (apiBaseUrl && !/^https?:\/\/[^\s]+$/.test(apiBaseUrl)) {
    throw new Error("apiBaseUrl must be an absolute HTTP(S) URL");
  }
  if (["staging", "production"].includes(input.name) && apiBaseUrl && !apiBaseUrl.startsWith("https://")) {
    throw new Error(`${input.name} apiBaseUrl must use HTTPS`);
  }

  return Object.freeze({
    name: input.name,
    dataMode: input.dataMode,
    apiBaseUrl,
    timeoutMs: input.timeoutMs,
    serviceModes
  });
}

function resolveEnvironment(name = "local", overrides = {}) {
  const preset = ENVIRONMENT_PRESETS[name];
  if (!preset) {
    throw new Error(`Unsupported environment: ${name}`);
  }
  return validateEnvironmentConfig({
    ...preset,
    ...overrides,
    name,
    serviceModes: { ...(overrides.serviceModes || {}) }
  });
}

module.exports = {
  DATA_MODES,
  ENVIRONMENT_NAMES,
  ENVIRONMENT_PRESETS,
  resolveEnvironment,
  validateEnvironmentConfig
};
