const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../..");
const projectConfigPath = "project.config.json";
const appJsonPath = "miniprogram/app.json";
const expectedProjectConfig = {
  setting: {
    es6: true,
    postcss: true,
    minified: true,
    uglifyFileName: false,
    enhance: true,
    packNpmRelationList: [],
    babelSetting: {
      ignore: [],
      disablePlugins: [],
      outputPath: ""
    },
    useCompilerPlugins: false,
    minifyWXML: true
  },
  compileType: "miniprogram",
  miniprogramRoot: "miniprogram/",
  simulatorPluginLibVersion: {},
  packOptions: {
    ignore: [],
    include: []
  },
  appid: "wxbed7488fbceab506",
  editorSetting: {}
};
const originalRoutes = [
  "pages/home/index",
  "pages/jobs/index",
  "pages/messages/index",
  "pages/profile/index",
  "pages/employer/index",
  "pages/training/index",
  "pages/policy/index",
  "pages/campus/index",
  "pages/labor/index",
  "pages/return-home/index",
  "pages/training-signup/index",
  "pages/profile-login/index",
  "pages/profile-resume/index",
  "pages/profile-applications/index",
  "pages/message-detail/index",
  "pages/job-detail/index",
  "pages/employer-job-form/index",
  "pages/employer-job-preview/index",
  "pages/employer-candidates/index"
];
const eventRoutes = ["pages/events/index", "pages/event-detail/index"];
const expectedPageOrder = [
  "pages/home/index",
  "pages/events/index",
  "pages/jobs/index",
  "pages/messages/index",
  "pages/profile/index",
  ...originalRoutes.slice(4),
  "pages/event-detail/index"
];
const expectedWindow = {
  navigationBarTitleText: "家乡工人招聘",
  navigationBarBackgroundColor: "#1F7A4D",
  navigationBarTextStyle: "white",
  backgroundColor: "#F6F7F2",
  backgroundTextStyle: "dark"
};
const expectedTabBar = {
  color: "#6B7280",
  selectedColor: "#1F7A4D",
  backgroundColor: "#FFFFFF",
  borderStyle: "black",
  list: [
    { pagePath: "pages/home/index", text: "首页" },
    { pagePath: "pages/events/index", text: "交流" },
    { pagePath: "pages/jobs/index", text: "职位" },
    { pagePath: "pages/messages/index", text: "消息" },
    { pagePath: "pages/profile/index", text: "我的" }
  ]
};
const requiredPageExtensions = [".js", ".json", ".ts", ".wxml", ".wxss"];
const navigationSources = [
  "miniprogram/pages/profile",
  "miniprogram/pages/profile-login",
  "miniprogram/pages/profile-resume",
  "miniprogram/pages/profile-applications",
  "miniprogram/pages/messages",
  "miniprogram/pages/message-detail",
  "miniprogram/pages/jobs",
  "miniprogram/pages/job-detail",
  "miniprogram/pages/employer",
  "miniprogram/pages/employer-job-form",
  "miniprogram/pages/employer-job-preview",
  "miniprogram/pages/employer-candidates",
  "miniprogram/data/profile.js",
  "miniprogram/data/profile.ts",
  "miniprogram/data/employer.js",
  "miniprogram/data/employer.ts"
];
const expectedChangedPaths = [
  "miniprogram/config/environments.js",
  "miniprogram/config/environments.ts",
  "miniprogram/services/README.md",
  "miniprogram/services/errors.js",
  "miniprogram/services/errors.ts",
  "miniprogram/services/mock-runtime.js",
  "miniprogram/services/mock-runtime.ts",
  "miniprogram/services/registry.js",
  "miniprogram/services/registry.ts",
  "miniprogram/services/submission-guard.js",
  "miniprogram/services/submission-guard.ts",
  "miniprogram/services/transport.js",
  "miniprogram/services/transport.ts",
  "workstreams/01-project-shell/SPEC.md",
  "workstreams/01-project-shell/TASKS.md",
  "workstreams/01-project-shell/HANDOFF.md",
  "workstreams/01-project-shell/STATE.json",
  "workstreams/01-project-shell/verify.cjs"
];
const expectedNavigateExpressions = new Map([
  ["miniprogram/pages/profile/index.js", ["route", "profileMock.routes.employer"]],
  ["miniprogram/pages/profile/index.ts", ["route", "profileMock.routes.employer"]],
  ["miniprogram/pages/messages/index.js", ["`${DETAIL_ROUTE}?id=${id}`"]],
  ["miniprogram/pages/messages/index.ts", ["`${DETAIL_ROUTE}?id=${id}`"]],
  ["miniprogram/pages/jobs/index.js", ["`/pages/job-detail/index?id=${id}`"]],
  ["miniprogram/pages/jobs/index.ts", ["`/pages/job-detail/index?id=${id}`"]],
  ["miniprogram/pages/employer/index.js", ["action.url", "`/pages/employer-candidates/index?jobId=${jobId}`"]],
  ["miniprogram/pages/employer/index.ts", ["action.url", "`/pages/employer-candidates/index?jobId=${jobId}`"]],
  ["miniprogram/pages/employer-job-form/index.js", ["`/pages/employer-job-preview/index?snapshot=${snapshot}`"]],
  ["miniprogram/pages/employer-job-form/index.ts", ["`/pages/employer-job-preview/index?snapshot=${snapshot}`"]]
]);

function absolute(relativePath) {
  return path.join(root, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(absolute(relativePath), "utf8");
}

function sourceFiles(relativePath) {
  const fullPath = absolute(relativePath);
  if (fs.statSync(fullPath).isFile()) return [relativePath];

  return fs.readdirSync(fullPath, { withFileTypes: true }).flatMap((entry) => {
    const child = path.posix.join(relativePath.replace(/\\/g, "/"), entry.name);
    if (entry.isDirectory()) return sourceFiles(child);
    return /\.(?:js|ts|wxml)$/.test(entry.name) ? [child] : [];
  });
}

function navigateToExpressions(relativePath) {
  const lines = read(relativePath).split(/\r?\n/);
  const expressions = [];

  for (let index = 0; index < lines.length; index += 1) {
    if (!/wx\.navigateTo\s*\(/.test(lines[index])) continue;

    const nearbyLines = lines.slice(index, index + 7);
    const urlLine = nearbyLines.find((line) => /^\s*url:\s*.+,\s*$/.test(line));
    assert.ok(urlLine, `Unable to identify navigateTo URL expression: ${relativePath}:${index + 1}`);
    expressions.push(urlLine.replace(/^\s*url:\s*/, "").replace(/,\s*$/, "").trim());
  }

  return expressions;
}

const projectConfig = JSON.parse(read(projectConfigPath));
assert.deepEqual(projectConfig, expectedProjectConfig, "Root project configuration changed outside miniprogramRoot");
assert.equal(path.isAbsolute(projectConfig.miniprogramRoot), false, "miniprogramRoot must be project-relative");
const resolvedAppJson = path.resolve(root, projectConfig.miniprogramRoot, "app.json");
assert.equal(resolvedAppJson, absolute(appJsonPath), "Root project must resolve to the integrated miniprogram/app.json");
assert.equal(fs.existsSync(resolvedAppJson), true, "Root project miniprogramRoot does not contain app.json");

const appConfig = JSON.parse(read(appJsonPath));

assert.deepEqual(appConfig.pages, expectedPageOrder, "app.json pages must keep all original routes and place all five tab pages first");
assert.equal(originalRoutes.length, 19, "Original route baseline must contain exactly 19 routes");
assert.deepEqual(
  appConfig.pages.filter((route) => originalRoutes.includes(route)),
  originalRoutes,
  "All 19 original routes must be preserved in their prior relative order"
);
assert.deepEqual(
  appConfig.pages.filter((route) => !originalRoutes.includes(route)),
  eventRoutes,
  "Only the two delivered event routes may be added"
);
assert.equal(new Set(appConfig.pages).size, appConfig.pages.length, "app.json contains duplicate page routes");
assert.deepEqual(appConfig.window, expectedWindow, "The existing window contract changed");
assert.equal(appConfig.style, "v2", "The existing app style contract changed");
assert.equal(appConfig.sitemapLocation, "sitemap.json", "The existing sitemap contract changed");

for (const route of appConfig.pages) {
  for (const extension of requiredPageExtensions) {
    assert.equal(
      fs.existsSync(absolute(`miniprogram/${route}${extension}`)),
      true,
      `Missing page file: miniprogram/${route}${extension}`
    );
  }
}

assert.deepEqual(appConfig.tabBar, expectedTabBar, "The five-item tabBar contract changed");
const tabRoutes = appConfig.tabBar.list.map((item) => item.pagePath);
assert.equal(new Set(tabRoutes).size, 5, "tabBar routes must be unique");
assert.deepEqual(appConfig.pages.slice(0, 5), tabRoutes, "All tab pages must occupy the first five pages entries");
for (const route of tabRoutes) {
  assert.equal(appConfig.pages.includes(route), true, `Tab route is not registered: ${route}`);
}
assert.equal(tabRoutes.includes("pages/event-detail/index"), false, "Event detail must remain an ordinary non-tab page");

const scannedFiles = navigationSources.flatMap(sourceFiles);
const navigateSourceFiles = scannedFiles.filter((file) => /\.(?:js|ts)$/.test(file));
for (const file of navigateSourceFiles) {
  assert.deepEqual(
    navigateToExpressions(file),
    expectedNavigateExpressions.get(file) || [],
    `Unrecognized, relative, or changed navigateTo URL expression: ${file}`
  );
}
for (const file of expectedNavigateExpressions.keys()) {
  assert.equal(navigateSourceFiles.includes(file), true, `Expected navigateTo source was not scanned: ${file}`);
}

const routePattern = /\/pages\/[A-Za-z0-9_-]+\/index/g;
const navigationTargets = new Set();
for (const file of scannedFiles) {
  for (const match of read(file).matchAll(routePattern)) {
    navigationTargets.add(match[0].slice(1));
  }
}
assert.deepEqual(
  [...navigationTargets].sort(),
  ["pages/employer/index", ...originalRoutes.slice(11)].sort(),
  "Delivered module route literals must resolve to exactly the nine integrated ordinary pages"
);
for (const route of navigationTargets) {
  assert.equal(appConfig.pages.includes(route), true, `Navigation target is not registered: /${route}`);
}

const dynamicQueryContracts = [
  {
    producers: ["miniprogram/pages/jobs/index.js", "miniprogram/pages/jobs/index.ts"],
    expression: "`/pages/job-detail/index?id=${id}`",
    consumers: ["miniprogram/pages/job-detail/index.js", "miniprogram/pages/job-detail/index.ts"],
    consumerPattern: /options\s*&&\s*options\.id/
  },
  {
    producers: ["miniprogram/pages/messages/index.js", "miniprogram/pages/messages/index.ts"],
    expression: "`${DETAIL_ROUTE}?id=${id}`",
    consumers: ["miniprogram/pages/message-detail/index.js", "miniprogram/pages/message-detail/index.ts"],
    consumerPattern: /options\s*&&\s*options\.id/
  },
  {
    producers: ["miniprogram/pages/employer/index.js", "miniprogram/pages/employer/index.ts"],
    expression: "`/pages/employer-candidates/index?jobId=${jobId}`",
    consumers: ["miniprogram/pages/employer-candidates/index.js", "miniprogram/pages/employer-candidates/index.ts"],
    consumerPattern: /options\s*&&\s*options\.jobId/
  },
  {
    producers: ["miniprogram/pages/employer-job-form/index.js", "miniprogram/pages/employer-job-form/index.ts"],
    expression: "`/pages/employer-job-preview/index?snapshot=${snapshot}`",
    consumers: ["miniprogram/pages/employer-job-preview/index.js", "miniprogram/pages/employer-job-preview/index.ts"],
    consumerPattern: /(?:options|_loadOptions)\s*&&\s*(?:this\.)?(?:options|_loadOptions)\.snapshot/
  }
];
for (const contract of dynamicQueryContracts) {
  for (const producer of contract.producers) {
    assert.equal(
      navigateToExpressions(producer).includes(contract.expression),
      true,
      `Dynamic query producer changed: ${producer}`
    );
  }
  for (const consumer of contract.consumers) {
    assert.match(read(consumer), contract.consumerPattern, `Dynamic query is not consumed: ${consumer}`);
  }
}
for (const dataFile of ["miniprogram/data/employer.js", "miniprogram/data/employer.ts"]) {
  assert.ok(
    read(dataFile).includes('url: "/pages/employer-job-preview/index?source=example"'),
    `Static example-preview marker changed: ${dataFile}`
  );
}

const allowedPrefixes = [
  "miniprogram/config/",
  "miniprogram/services/",
  "workstreams/01-project-shell/"
];
for (const changedPath of expectedChangedPaths) {
  assert.ok(
    allowedPrefixes.some((prefix) => changedPath.startsWith(prefix)),
    `Expected changed file is outside allowed scope: ${changedPath}`
  );
  assert.equal(fs.existsSync(absolute(changedPath)), true, `Expected changed file missing: ${changedPath}`);
}

JSON.parse(read("workstreams/01-project-shell/STATE.json"));

console.log("PASS app.json JSON, 19 original routes, two event routes, exact order, uniqueness, window, style, and sitemap contracts");
console.log("PASS root project config preserves existing settings and resolves miniprogram/app.json");
console.log("PASS all 21 registered routes have complete page five-file sets");
console.log("PASS five unique tabs, exact 首页/交流/职位/消息/我的 order, first-five placement, and detail exclusion");
console.log(`PASS ${navigateSourceFiles.length} JS/TS sources, all navigateTo expressions, and registered absolute targets`);
console.log("PASS job id, message id, candidate jobId, and preview snapshot producer/consumer contracts");
console.log("PASS service-foundation changed-file declaration is allowed and all declared files exist");

async function verifyServiceFoundation() {
  const {
    ENVIRONMENT_NAMES,
    ENVIRONMENT_PRESETS,
    resolveEnvironment
  } = require(absolute("miniprogram/config/environments.js"));
  const {
    ERROR_KINDS,
    ServiceError,
    normalizeError,
    pageMessageFor
  } = require(absolute("miniprogram/services/errors.js"));
  const { createTransport } = require(absolute("miniprogram/services/transport.js"));
  const { MOCK_SCENARIOS, createMockRuntime } = require(absolute("miniprogram/services/mock-runtime.js"));
  const { createSubmissionGuard } = require(absolute("miniprogram/services/submission-guard.js"));
  const { SERVICE_DOMAINS, createServiceRegistry } = require(absolute("miniprogram/services/registry.js"));

  assert.deepEqual(ENVIRONMENT_NAMES, ["local", "test", "staging", "production"]);
  for (const name of ENVIRONMENT_NAMES) {
    assert.equal(ENVIRONMENT_PRESETS[name].name, name);
    assert.ok(["mock", "api"].includes(ENVIRONMENT_PRESETS[name].dataMode));
    assert.equal(typeof ENVIRONMENT_PRESETS[name].apiBaseUrl, "string");
    assert.ok(ENVIRONMENT_PRESETS[name].timeoutMs > 0);
  }
  assert.equal(resolveEnvironment("local").dataMode, "mock");
  assert.equal(resolveEnvironment("test").dataMode, "mock");
  assert.throws(() => resolveEnvironment("staging"), /API base URL is required/);
  assert.throws(() => resolveEnvironment("production"), /API base URL is required/);
  assert.throws(
    () => resolveEnvironment("staging", { apiBaseUrl: "http://staging.example.invalid" }),
    /must use HTTPS/
  );
  assert.equal(resolveEnvironment("staging", { apiBaseUrl: "https://staging.example.invalid/" }).apiBaseUrl, "https://staging.example.invalid");
  assert.equal(
    resolveEnvironment("test", { dataMode: "api", apiBaseUrl: "http://localhost:3000" }).apiBaseUrl,
    "http://localhost:3000"
  );
  assert.throws(
    () => resolveEnvironment("test", { serviceModes: { jobs: "api" } }),
    /API base URL is required/
  );

  assert.deepEqual(ERROR_KINDS, [
    "validation",
    "offline",
    "timeout",
    "unauthorized",
    "network",
    "server",
    "unknown"
  ]);
  for (const kind of ERROR_KINDS) {
    const message = pageMessageFor(new ServiceError(kind));
    assert.equal(typeof message, "string");
    assert.ok(message.length >= 4, `Missing short page message for ${kind}`);
  }
  assert.equal(normalizeError({ statusCode: 401 }).kind, "unauthorized");
  assert.equal(normalizeError({ statusCode: 503 }).kind, "server");
  assert.equal(normalizeError({ code: "OFFLINE" }).kind, "offline");
  assert.equal(normalizeError({ code: "ETIMEDOUT" }).kind, "timeout");
  assert.equal(normalizeError({ code: "ECONNRESET" }).kind, "network");

  const sent = [];
  const transport = createTransport({
    baseUrl: "https://api.example.invalid/",
    timeoutMs: 50,
    createRequestId: () => "request-fixed",
    getAccessToken: () => "access-token",
    send: async (request) => {
      sent.push(request);
      return { statusCode: 200, data: { ok: true }, headers: { trace: "trace-1" } };
    }
  });
  const transportResult = await transport.request({ method: "POST", path: "/jobs", data: { title: "A" } });
  assert.deepEqual(transportResult.data, { ok: true });
  assert.equal(transportResult.requestId, "request-fixed");
  assert.equal(sent.length, 1);
  assert.equal(sent[0].url, "https://api.example.invalid/jobs");
  assert.equal(sent[0].headers.Authorization, "Bearer access-token");
  assert.equal(sent[0].headers["X-Request-ID"], "request-fixed");

  const timeoutTransport = createTransport({
    baseUrl: "https://api.example.invalid",
    timeoutMs: 10,
    send: () => new Promise(() => {})
  });
  await assert.rejects(timeoutTransport.request({ path: "/slow" }), (error) => error.kind === "timeout");

  let mutationAttempts = 0;
  const failingTransport = createTransport({
    baseUrl: "https://api.example.invalid",
    timeoutMs: 50,
    send: async () => {
      mutationAttempts += 1;
      throw Object.assign(new Error("network down"), { code: "ECONNRESET" });
    }
  });
  await assert.rejects(
    failingTransport.request({ method: "POST", path: "/applications" }),
    (error) => error.kind === "network"
  );
  assert.equal(mutationAttempts, 1, "Mutation transport must not retry automatically");

  const serviceErrorTransport = createTransport({
    baseUrl: "https://api.example.invalid",
    timeoutMs: 50,
    createRequestId: () => "request-service-error",
    send: async () => {
      throw new ServiceError("server", "domain failed", { code: "DOMAIN_FAILURE" });
    }
  });
  await assert.rejects(
    serviceErrorTransport.request({ path: "/domain-failure" }),
    (error) => error.kind === "server"
      && error.code === "DOMAIN_FAILURE"
      && error.requestId === "request-service-error"
  );

  assert.deepEqual(MOCK_SCENARIOS, [
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
  const runtime = createMockRuntime({ fixtures: { "jobs.list": [1, 2, 3, 4, 5] } });
  assert.deepEqual(await runtime.execute("jobs.detail", { data: { id: "job-1" } }), {
    state: "success",
    data: { id: "job-1" },
    delayMs: 0
  });
  const loadingStartedAt = Date.now();
  const loadingStates = [];
  const loadingPromise = runtime.execute("jobs.detail", {
    scenario: "loading",
    delayMs: 15,
    data: { id: "job-1" },
    onStateChange: (state) => loadingStates.push(state)
  });
  assert.deepEqual(loadingStates, ["loading"], "Loading state must be reported before the delay");
  const loading = await loadingPromise;
  assert.deepEqual(loadingStates, ["loading", "success"]);
  assert.equal(loading.state, "success");
  assert.deepEqual(loading.data, { id: "job-1" });
  assert.ok(Date.now() - loadingStartedAt >= 10, "Loading scenario did not apply a real delay");
  assert.equal((await runtime.execute("jobs.list", { scenario: "empty" })).state, "empty");
  for (const [scenario, kind] of [
    ["error", "server"],
    ["timeout", "timeout"],
    ["offline", "offline"],
    ["unauthorized", "unauthorized"]
  ]) {
    await assert.rejects(runtime.execute("jobs.list", { scenario }), (error) => error.kind === kind);
  }
  const firstPage = await runtime.execute("jobs.list", { scenario: "page", page: 1, pageSize: 2 });
  assert.deepEqual(firstPage.items, [1, 2]);
  assert.equal(firstPage.state, "page");
  assert.equal(firstPage.nextPage, 2);
  const endPage = await runtime.execute("jobs.list", { scenario: "end", pageSize: 2 });
  assert.deepEqual(endPage.items, [5]);
  assert.equal(endPage.state, "end");
  assert.equal(endPage.hasMore, false);
  await assert.rejects(
    runtime.execute("jobs.list", { scenario: "page", page: 0, pageSize: 2 }),
    (error) => error.kind === "validation"
  );
  await assert.rejects(
    runtime.execute("jobs.list", { scenario: "page", page: 1, pageSize: 0 }),
    (error) => error.kind === "validation"
  );

  const guard = createSubmissionGuard();
  let releaseMutation;
  let guardedRuns = 0;
  const firstMutation = guard.run("apply:job-1", () => {
    guardedRuns += 1;
    return new Promise((resolve) => { releaseMutation = resolve; });
  });
  await Promise.resolve();
  assert.equal(guard.isPending("apply:job-1"), true);
  await assert.rejects(
    guard.run("apply:job-1", () => { guardedRuns += 1; }),
    (error) => error.code === "DUPLICATE_SUBMISSION"
  );
  assert.equal(guardedRuns, 1);
  releaseMutation("done");
  assert.equal(await firstMutation, "done");
  assert.equal(guard.isPending("apply:job-1"), false);

  const mockRegistry = createServiceRegistry({ environment: resolveEnvironment("local"), mockRuntime: runtime });
  assert.deepEqual(SERVICE_DOMAINS, [
    "auth",
    "users",
    "jobs",
    "resumes",
    "applications",
    "employer",
    "notifications"
  ]);
  for (const domain of SERVICE_DOMAINS) {
    assert.equal(mockRegistry.mode(domain), "mock");
    assert.equal(mockRegistry.get(domain).domain, domain);
  }
  const apiEnvironment = resolveEnvironment("test", {
    apiBaseUrl: "https://api.example.invalid",
    serviceModes: { jobs: "api" }
  });
  const hybridRegistry = createServiceRegistry({ environment: apiEnvironment, transport });
  assert.equal(hybridRegistry.mode("jobs"), "api");
  assert.equal(hybridRegistry.mode("users"), "mock");
  assert.equal(hybridRegistry.get("jobs").mode, "api");
  assert.throws(() => createServiceRegistry({ environment: apiEnvironment }), /injected transport/);
  const typoEnvironment = resolveEnvironment("test", { serviceModes: { jobz: "mock" } });
  assert.throws(
    () => createServiceRegistry({ environment: typoEnvironment }),
    /Unknown serviceModes domain: jobz/
  );

  const mirroredBases = [
    "miniprogram/config/environments",
    "miniprogram/services/errors",
    "miniprogram/services/mock-runtime",
    "miniprogram/services/registry",
    "miniprogram/services/submission-guard",
    "miniprogram/services/transport"
  ];
  for (const base of mirroredBases) {
    assert.equal(read(`${base}.js`), read(`${base}.ts`), `JS/TS mirror drift: ${base}`);
  }

  const runtimeSources = mirroredBases.flatMap((base) => [`${base}.js`, `${base}.ts`]);
  const credentialSources = [...runtimeSources, "miniprogram/services/README.md"];
  const forbiddenApiPattern = /wx\s*\.\s*(?:request|login|setStorage|setStorageSync|getStorage|getStorageSync|connectSocket|uploadFile)\s*\(/;
  const credentialPattern = /(?:appSecret|clientSecret|privateKey|accessToken)\s*[:=]\s*["'][^"']{8,}["']/i;
  for (const source of runtimeSources) {
    assert.doesNotMatch(read(source), forbiddenApiPattern, `Forbidden real WeChat API in ${source}`);
  }
  for (const source of credentialSources) {
    assert.doesNotMatch(read(source), credentialPattern, `Possible committed credential in ${source}`);
  }

  console.log("PASS environment validation, API fail-closed behavior, and four explicit presets");
  console.log("PASS seven normalized errors and short Chinese page-message mapping");
  console.log("PASS injected transport timeout, auth/request ID headers, ServiceError correlation, normalization, and no mutation retry");
  console.log("PASS deterministic mock loading-to-success transitions, other scenarios, page/end states, and zero-value validation");
  console.log("PASS duplicate submission rejection, seven-domain adapter selection, and unknown serviceModes rejection");
  console.log("PASS exact JS/TS mirrors and forbidden API/credential scans");
}

verifyServiceFoundation().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
