const { validateEnvironmentConfig } = require("../config/environments");
const { createMockRuntime } = require("./mock-runtime");

const SERVICE_DOMAINS = Object.freeze([
  "auth",
  "users",
  "jobs",
  "resumes",
  "applications",
  "employer",
  "notifications"
]);

function createMockAdapter(domain, runtime) {
  return Object.freeze({
    domain,
    mode: "mock",
    execute(operation, input) {
      return runtime.execute(`${domain}.${operation}`, input);
    }
  });
}

function createApiAdapter(domain, transport) {
  if (!transport || typeof transport.request !== "function") {
    throw new Error(`API adapter for ${domain} requires an injected transport`);
  }
  return Object.freeze({
    domain,
    mode: "api",
    execute(operation, requestSpec) {
      if (!operation) return Promise.reject(new Error("API operation name is required"));
      return transport.request(requestSpec);
    }
  });
}

function createServiceRegistry(options) {
  if (!options || !options.environment) throw new Error("Service registry requires an environment");
  const environment = validateEnvironmentConfig(options.environment);
  const unknownModeDomains = Object.keys(environment.serviceModes).filter(
    (domain) => !SERVICE_DOMAINS.includes(domain)
  );
  if (unknownModeDomains.length > 0) {
    throw new Error(`Unknown serviceModes domain: ${unknownModeDomains.join(", ")}`);
  }
  const runtime = options.mockRuntime || createMockRuntime();
  const mockAdapters = options.mockAdapters || {};
  const apiAdapters = options.apiAdapters || {};
  const entries = {};
  const modes = {};

  for (const domain of SERVICE_DOMAINS) {
    const mode = environment.serviceModes[domain] || environment.dataMode;
    modes[domain] = mode;
    entries[domain] = mode === "mock"
      ? (mockAdapters[domain] || createMockAdapter(domain, runtime))
      : (apiAdapters[domain] || createApiAdapter(domain, options.transport));
  }

  return Object.freeze({
    domains: SERVICE_DOMAINS,
    environment,
    get(domain) {
      if (!SERVICE_DOMAINS.includes(domain)) throw new Error(`Unknown service domain: ${domain}`);
      return entries[domain];
    },
    mode(domain) {
      if (!SERVICE_DOMAINS.includes(domain)) throw new Error(`Unknown service domain: ${domain}`);
      return modes[domain];
    }
  });
}

module.exports = {
  SERVICE_DOMAINS,
  createApiAdapter,
  createMockAdapter,
  createServiceRegistry
};
