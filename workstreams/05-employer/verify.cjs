const assert = require("node:assert/strict");
const childProcess = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../..");
const pageBases = [
  "miniprogram/pages/employer/index",
  "miniprogram/pages/employer-job-form/index",
  "miniprogram/pages/employer-job-preview/index",
  "miniprogram/pages/employer-candidates/index"
];
const serviceBase = "miniprogram/services/employer";
const jsFiles = [
  `${serviceBase}.js`,
  "miniprogram/data/employer.js",
  ...pageBases.map((base) => `${base}.js`)
];
const declaredChangedPaths = [
  `${serviceBase}.js`,
  `${serviceBase}.ts`,
  ...pageBases.flatMap((base) => [`${base}.js`, `${base}.ts`, `${base}.wxml`, `${base}.wxss`]),
  "workstreams/05-employer/SPEC.md",
  "workstreams/05-employer/TASKS.md",
  "workstreams/05-employer/HANDOFF.md",
  "workstreams/05-employer/STATE.json",
  "workstreams/05-employer/verify.cjs"
];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function normalizeDataMirror(source, isTypeScript) {
  let text = source.replace(/\r\n/g, "\n").trim();
  if (isTypeScript) text = text.replace(/\bexport\s+(?=(const|function)\b)/g, "");
  else text = text.replace(/\nmodule\.exports = \{[\s\S]*?\};\s*$/, "");
  return text.replace(/\s+/g, " ").trim();
}

function instantiate(definition) {
  const page = Object.assign({}, definition);
  page.data = structuredClone(definition.data);
  page.setData = function setData(patch, callback) {
    Object.assign(this.data, patch);
    if (callback) callback();
  };
  return page;
}

function eventWithId(id) {
  return { currentTarget: { dataset: { id } } };
}

function inputEvent(value, field) {
  return {
    detail: { value },
    currentTarget: { dataset: field ? { field } : {} }
  };
}

function loadPage(relativePath) {
  const fullPath = path.join(root, relativePath);
  let definition = null;
  delete require.cache[require.resolve(fullPath)];
  global.Page = (captured) => {
    definition = captured;
  };
  require(fullPath);
  return definition;
}

function minHeightForClass(css, className) {
  let best = 0;
  for (const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selectors = match[1].split(",").map((item) => item.trim());
    if (!selectors.includes(`.${className}`)) continue;
    const height = match[2].match(/min-height:\s*(\d+)rpx/);
    if (height) best = Math.max(best, Number(height[1]));
  }
  return best;
}

async function rejectCode(promise, code) {
  await assert.rejects(promise, (error) => error && error.code === code);
}

(async () => {
  for (const file of jsFiles) {
    const result = childProcess.spawnSync(process.execPath, ["--check", path.join(root, file)], { encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
  }
  for (const file of [...pageBases.map((base) => `${base}.json`), "workstreams/05-employer/STATE.json"]) {
    JSON.parse(read(file));
  }

  const allowedPrefixes = [
    "miniprogram/pages/employer/",
    "miniprogram/pages/employer-job-form/",
    "miniprogram/pages/employer-job-preview/",
    "miniprogram/pages/employer-candidates/",
    "workstreams/05-employer/"
  ];
  const allowedExactPaths = [`${serviceBase}.js`, `${serviceBase}.ts`];
  for (const changedPath of declaredChangedPaths) {
    assert.ok(
      allowedExactPaths.includes(changedPath) || allowedPrefixes.some((prefix) => changedPath.startsWith(prefix)),
      `Declared change is outside allowed scope: ${changedPath}`
    );
    assert.ok(fs.existsSync(path.join(root, changedPath)), `Declared changed file missing: ${changedPath}`);
  }

  for (const base of [serviceBase, ...pageBases]) {
    assert.equal(read(`${base}.js`), read(`${base}.ts`), `Exact JS/TS mirror mismatch: ${base}`);
  }
  assert.equal(
    normalizeDataMirror(read("miniprogram/data/employer.js"), false),
    normalizeDataMirror(read("miniprogram/data/employer.ts"), true),
    "Employer data JS/TS mirror mismatch"
  );

  const ownedSource = [
    `${serviceBase}.js`,
    `${serviceBase}.ts`,
    ...pageBases.flatMap((base) => [`${base}.js`, `${base}.ts`, `${base}.wxml`]),
    "miniprogram/data/employer.js",
    "miniprogram/data/employer.ts"
  ].map(read).join("\n");
  assert.equal(
    /wx\.(request|connectSocket|sendSocketMessage|setStorage|getStorage|removeStorage|clearStorage|requestSubscribeMessage|uploadFile|chooseImage|chooseMedia)\s*\(/i.test(ownedSource),
    false,
    "Forbidden request/socket/storage/subscription/upload API found"
  );
  for (const base of pageBases) {
    assert.equal(read(`${base}.js`).includes("data/employer"), false, `${base} bypasses employer service`);
    assert.ok(read(`${base}.js`).includes("services/employer"), `${base} missing employer service boundary`);
  }

  const appConfig = JSON.parse(read("miniprogram/app.json"));
  const employerRoutes = [
    "pages/employer-job-form/index",
    "pages/employer-job-preview/index",
    "pages/employer-candidates/index"
  ];
  const registered = employerRoutes.filter((route) => appConfig.pages.includes(route));
  assert.ok(registered.length === 0 || registered.length === employerRoutes.length, "Employer routes are partially registered");
  assert.equal(/(?:路由待|待统一注册|尚未由项目壳注册|需由项目壳.*注册|后续统一注册)/.test(ownedSource), false);

  for (const base of pageBases) {
    const definition = loadPage(`${base}.js`);
    const handlers = [...read(`${base}.wxml`).matchAll(/(?:bind|catch)[a-z]+="([A-Za-z_$][\w$]*)"/g)]
      .map((match) => match[1]);
    for (const handler of new Set(handlers)) {
      assert.equal(typeof definition[handler], "function", `Missing WXML handler: ${base}#${handler}`);
    }
    const css = read(`${base}.wxss`);
    for (const tag of read(`${base}.wxml`).matchAll(/<(button|input|textarea)\b([^>]*)>/g)) {
      const classMatch = tag[2].match(/class="([^"]+)"/);
      assert.ok(classMatch, `Interactive element without class in ${base}`);
      const staticClasses = classMatch[1].split(/\s+/).filter((name) => /^[a-z][\w-]*$/i.test(name));
      assert.ok(
        staticClasses.some((name) => minHeightForClass(css, name) >= 88),
        `Touch target below 88rpx in ${base}: ${tag[0]}`
      );
    }
  }

  const dashboardWxml = read("miniprogram/pages/employer/index.wxml");
  const formWxml = read("miniprogram/pages/employer-job-form/index.wxml");
  const previewWxml = read("miniprogram/pages/employer-job-preview/index.wxml");
  const candidatesWxml = read("miniprogram/pages/employer-candidates/index.wxml");
  for (const state of ["normal", "empty", "error", "timeout", "offline", "unauthorized"]) {
    assert.ok(read(`${serviceBase}.js`).includes(`id: "${state}"`), `Missing employer service scenario: ${state}`);
  }
  assert.ok(dashboardWxml.includes("loadState === 'loading'"));
  assert.ok(dashboardWxml.includes("loadState === 'unauthorized'"));
  assert.ok(formWxml.includes("data-scenario=\"{{item.id}}\""));
  assert.ok(previewWxml.includes("data-scenario=\"{{item.id}}\""));
  assert.ok(candidatesWxml.includes("loadState === 'empty'"));
  assert.ok(candidatesWxml.includes("继续读取本地示例"));
  assert.ok(candidatesWxml.includes("onRetryPage"));

  const authSession = require(path.join(root, "miniprogram/services/auth-session.js"));
  const { ServiceError } = require(path.join(root, "miniprogram/services/errors.js"));
  const employerService = require(path.join(root, `${serviceBase}.js`));
  authSession.logout();
  await rejectCode(employerService.getDashboard({ delayMs: 0 }), "EMPLOYER_DEMO_REQUIRED");
  authSession.setRole("seeker");
  await authSession.demoLogin({ delayMs: 0 });
  await rejectCode(employerService.getDashboard({ delayMs: 0 }), "EMPLOYER_ROLE_REQUIRED");
  await employerService.startEmployerDemo({ delayMs: 0 });
  assert.equal(authSession.snapshot().role, "employer");
  assert.ok(await employerService.getDashboard({ delayMs: 0 }));
  assert.equal(await employerService.getDashboard({ scenario: "empty", delayMs: 0 }), null);
  for (const [scenario, kind] of [["error", "server"], ["timeout", "timeout"], ["offline", "offline"]]) {
    await assert.rejects(
      employerService.getDashboard({ scenario, delayMs: 0 }),
      (error) => error && error.kind === kind
    );
  }
  await assert.rejects(
    employerService.getDashboard({ scenario: "unauthorized", delayMs: 0 }),
    (error) => error && error.kind === "unauthorized"
  );
  assert.equal(authSession.snapshot().status, "expired");
  await employerService.startEmployerDemo({ delayMs: 0 });

  const firstPage = await employerService.listCandidates({ page: 1, pageSize: 3, delayMs: 0 });
  const secondPage = await employerService.listCandidates({ page: 2, pageSize: 3, delayMs: 0 });
  assert.equal(firstPage.items.length, 3);
  assert.equal(firstPage.hasMore, true);
  assert.equal(secondPage.items.length, 3);
  assert.equal(secondPage.hasMore, false);
  const filtered = await employerService.listCandidates({ query: "仓库", pageSize: 3, delayMs: 0 });
  assert.deepEqual(filtered.items.map((item) => item.id), ["candidate-003", "candidate-006"]);

  const form = await employerService.getJobForm({ delayMs: 0 });
  await assert.rejects(
    employerService.prepareJobPreview(form.draft, { delayMs: 0 }),
    (error) => Boolean(error && error.code === "INVALID_JOB_DRAFT" && error.details.fields.title)
  );
  const invalidSalary = Object.assign({}, form.exampleDraft, { salaryMax: "3000" });
  await assert.rejects(
    employerService.prepareJobPreview(invalidSalary, { delayMs: 0 }),
    (error) => Boolean(error && error.details.fields.salaryMax.includes("不能低于"))
  );
  const pendingPreview = employerService.prepareJobPreview(form.exampleDraft, { delayMs: 25 });
  await rejectCode(employerService.prepareJobPreview(form.exampleDraft, { delayMs: 25 }), "DUPLICATE_SUBMISSION");
  const prepared = await pendingPreview;
  assert.deepEqual(
    [prepared.localOnly, prepared.saved, prepared.submitted, prepared.published],
    [true, false, false, false]
  );

  const maliciousSnapshot = encodeURIComponent(JSON.stringify({
    title: "夜班包装工",
    headcount: 2,
    salaryLabel: "5000至6000元/月",
    location: "贵阳市",
    workTime: "夜班",
    requirements: "能适应夜班",
    benefits: [],
    sourceLabel: "已发布到平台"
  }));
  const previewResult = await employerService.getJobPreview({ snapshot: maliciousSnapshot, delayMs: 0 });
  assert.equal(previewResult.preview.sourceLabel, "来自本地表单");
  assert.equal(JSON.stringify(previewResult).includes("已发布到平台"), false);
  const confirmed = await employerService.confirmPreviewDemo({ delayMs: 0 });
  assert.equal(confirmed.localOnly, true);
  assert.equal(confirmed.published, false);
  assert.equal(confirmed.receipt, null);

  const modals = [];
  const toasts = [];
  const navigations = [];
  global.wx = {
    navigateBack() {},
    showToast(options) { toasts.push(options); },
    showModal(options) { modals.push(options); },
    navigateTo(options) {
      navigations.push(options.url);
      if (options.fail) options.fail({ errMsg: "local route test" });
    }
  };

  let page = instantiate(loadPage("miniprogram/pages/employer/index.js"));
  await page.loadDashboard();
  assert.equal(page.data.loadState, "normal");
  assert.equal(page.data.profileProgress.filled, 5);
  page.onProfileInput(inputEvent("13800002608", "contactPhone"));
  assert.equal(page.data.profileProgress.percent, 100);
  page.setData({ demoScenario: "offline" });
  await page.loadDashboard();
  assert.equal(page.data.loadState, "offline");
  page.setData({ demoScenario: "normal" });
  await page.loadDashboard();
  modals.length = 0;
  page.onOpenAction(eventWithId("job-form"));
  assert.equal(navigations.at(-1), "/pages/employer-job-form/index");
  assert.ok(modals[0].content.includes("没有保存、发布或发送"));

  const originalGetDashboard = employerService.getDashboard;
  const baseDashboard = await originalGetDashboard({ delayMs: 0 });
  const pendingReads = [];
  employerService.getDashboard = () => new Promise((resolve) => pendingReads.push(resolve));
  page = instantiate(loadPage("miniprogram/pages/employer/index.js"));
  const staleFirst = page.loadDashboard();
  const staleSecond = page.loadDashboard();
  const latestDashboard = structuredClone(baseDashboard);
  latestDashboard.company.name = "最新企业示例";
  pendingReads[1](latestDashboard);
  await Promise.resolve();
  const staleDashboard = structuredClone(baseDashboard);
  staleDashboard.company.name = "过期企业示例";
  pendingReads[0](staleDashboard);
  await Promise.all([staleFirst, staleSecond]);
  assert.equal(page.data.companyDraft.name, "最新企业示例");
  employerService.getDashboard = originalGetDashboard;

  page = instantiate(loadPage("miniprogram/pages/employer-job-form/index.js"));
  await page.loadForm();
  for (const [scenario, expectedState] of [["empty", "empty"], ["error", "server"], ["timeout", "timeout"], ["offline", "offline"]]) {
    page.setData({ demoScenario: scenario });
    await page.loadForm();
    assert.equal(page.data.loadState, expectedState, `Form scenario did not expose ${expectedState}`);
  }
  await page.onRetry();
  assert.equal(page.data.demoScenario, "normal");
  assert.equal(page.data.loadState, "normal");
  await page.onPreviewTap();
  assert.ok(page.data.errors.title);
  page.onUseExample();
  page.data.draft.salaryMax = "3000";
  await page.onPreviewTap();
  assert.ok(page.data.errors.salaryMax.includes("不能低于"));
  page.onUseExample();
  modals.length = 0;
  await page.onPreviewTap();
  assert.ok(navigations.at(-1).startsWith("/pages/employer-job-preview/index?snapshot="));
  assert.ok(modals[0].content.includes("没有保存、提交或发布"));
  page.setData({ submitting: true });
  await page.onPreviewTap();
  assert.ok(page.data.submissionMessage.includes("请勿重复点击"));

  page = instantiate(loadPage("miniprogram/pages/employer-job-preview/index.js"));
  page._loadOptions = { snapshot: maliciousSnapshot };
  await page.loadPreview();
  assert.equal(page.data.preview.sourceLabel, "来自本地表单");
  for (const [scenario, expectedState] of [["empty", "empty"], ["error", "server"], ["timeout", "timeout"], ["offline", "offline"]]) {
    page.setData({ demoScenario: scenario });
    await page.loadPreview();
    assert.equal(page.data.loadState, expectedState, `Preview scenario did not expose ${expectedState}`);
  }
  await page.onRetry();
  assert.equal(page.data.demoScenario, "normal");
  assert.equal(page.data.loadState, "normal");
  modals.length = 0;
  page.onConfirmPreview();
  assert.ok(modals[0].content.includes("不会发送到平台"));
  await modals[0].success({ confirm: true });
  assert.equal(page.data.confirmedLocally, true);
  assert.ok(modals[1].content.includes("没有发布岗位"));
  assert.ok(modals[1].content.includes("没有发送任何数据或生成企业回执"));

  page = instantiate(loadPage("miniprogram/pages/employer-candidates/index.js"));
  await page.loadCandidates();
  assert.equal(page.data.visibleCandidates.length, 3);
  assert.equal(page.data.hasMore, true);
  const originalListCandidates = employerService.listCandidates;
  const appendPages = [];
  let failAppend = true;
  employerService.listCandidates = async (options) => {
    appendPages.push(options.page);
    if (options.page === 2 && failAppend) {
      failAppend = false;
      throw new ServiceError("timeout", "Mock append timeout", {
        code: "MOCK_APPEND_TIMEOUT",
        retriable: true
      });
    }
    return originalListCandidates(Object.assign({}, options, { delayMs: 0 }));
  };
  await page.loadCandidates(true);
  assert.equal(page.data.loadState, "normal", "Append failure replaced the full-page state");
  assert.equal(page.data.visibleCandidates.length, 3, "Append failure hid page-1 candidates");
  assert.equal(page.data.page, 1, "Append failure advanced the committed page");
  assert.equal(page.data.failedAppendPage, 2);
  assert.ok(page.data.pageError.includes("超时"));
  await page.onRetryPage();
  assert.deepEqual(appendPages, [2, 2], "Append retry did not target the failed page");
  assert.equal(page.data.visibleCandidates.length, 6);
  assert.equal(page.data.hasMore, false);
  assert.equal(page.data.pageError, "");
  employerService.listCandidates = originalListCandidates;

  page.setData({ activeStatusId: "all", activeJobId: "all", query: "", demoScenario: "normal" });
  await page.loadCandidates();
  const originalStartEmployerDemo = employerService.startEmployerDemo;
  const raceCalls = [];
  let resolveEmployerDemo;
  employerService.startEmployerDemo = () => new Promise((resolve) => {
    resolveEmployerDemo = resolve;
  });
  employerService.listCandidates = async (options) => {
    raceCalls.push(`${options.page}/${options.statusId}`);
    if (options.page === 2 && options.statusId === "all") {
      throw new ServiceError("unauthorized", "Mock expired append", {
        code: "MOCK_EXPIRED_APPEND"
      });
    }
    return originalListCandidates(Object.assign({}, options, { delayMs: 0 }));
  };
  await page.loadCandidates(true);
  assert.equal(page.data.pageErrorKind, "unauthorized");
  const staleAuthRetry = page.onRetryPage();
  const currentFilterLoad = page.onStatusFilterTap(eventWithId("new"));
  await currentFilterLoad;
  resolveEmployerDemo({ status: "authenticated", role: "employer" });
  await staleAuthRetry;
  assert.deepEqual(raceCalls, ["2/all", "1/new"], "Stale auth continuation issued page 2 for the new filter");
  assert.equal(page.data.activeStatusId, "new");
  assert.equal(page.data.page, 1);
  assert.equal(page.data.visibleCandidates.length, 3);
  assert.equal(page.data.failedAppendPage, 0);
  employerService.listCandidates = originalListCandidates;
  employerService.startEmployerDemo = originalStartEmployerDemo;

  page.setData({ activeStatusId: "all", activeJobId: "all", query: "", demoScenario: "normal" });
  await page.loadCandidates();
  const rejectionCalls = [];
  let authAttemptCount = 0;
  let rejectStaleAuth;
  let resolveCurrentAuth;
  employerService.startEmployerDemo = () => new Promise((resolve, reject) => {
    authAttemptCount += 1;
    if (authAttemptCount === 1) rejectStaleAuth = reject;
    else resolveCurrentAuth = resolve;
  });
  employerService.listCandidates = async (options) => {
    rejectionCalls.push(`${options.page}/${options.statusId}`);
    if (options.page === 2 && options.statusId === "all") {
      throw new ServiceError("unauthorized", "Mock expired append", { code: "MOCK_EXPIRED_APPEND" });
    }
    if (options.page === 1 && options.statusId === "new") {
      throw new ServiceError("unauthorized", "Mock unauthorized filter", { code: "MOCK_UNAUTHORIZED_FILTER" });
    }
    return originalListCandidates(Object.assign({}, options, { delayMs: 0 }));
  };
  await page.loadCandidates(true);
  const rejectedStaleRetry = page.onRetryPage();
  await page.onStatusFilterTap(eventWithId("new"));
  assert.equal(page.data.loadState, "unauthorized");
  assert.equal(page.data.authPending, false, "Filter invalidation left stale auth pending");
  const currentDemoEntry = page.onStartEmployerDemo();
  assert.equal(page.data.authPending, true, "Unauthorized demo entry was not usable after invalidation");
  rejectStaleAuth(new ServiceError("unauthorized", "Stale auth rejected", { code: "STALE_AUTH_REJECTED" }));
  await rejectedStaleRetry;
  assert.equal(page.data.authPending, true, "Stale auth rejection cleared the newer auth owner");
  resolveCurrentAuth({ status: "authenticated", role: "employer" });
  await currentDemoEntry;
  assert.equal(page.data.authPending, false);
  assert.equal(authAttemptCount, 2);
  assert.deepEqual(rejectionCalls.slice(0, 2), ["2/all", "1/new"]);
  employerService.listCandidates = originalListCandidates;
  employerService.startEmployerDemo = originalStartEmployerDemo;

  page.setData({ activeStatusId: "new", query: "", activeJobId: "all" });
  await page.loadCandidates();
  assert.equal(page.data.visibleCandidates.length, 3);
  page.setData({ activeStatusId: "all", query: "仓库" });
  await page.loadCandidates();
  assert.deepEqual(page.data.visibleCandidates.map((item) => item.id), ["candidate-003", "candidate-006"]);
  page.setData({ query: "", demoScenario: "timeout" });
  await page.loadCandidates();
  assert.equal(page.data.loadState, "timeout");
  page.setData({ demoScenario: "normal" });
  await page.loadCandidates();
  page.onToggleCandidate(eventWithId("candidate-001"));
  assert.equal(page.data.expandedCandidateId, "candidate-001");
  modals.length = 0;
  page.onDemoMark(eventWithId("candidate-001"));
  assert.ok(modals[0].content.includes("不会联系、邀约、拒绝或通知"));
  await modals[0].success({ confirm: true });
  assert.ok(page.data.visibleCandidates[0].demoStatusLabel.includes("本页标记"));
  assert.ok(modals[1].content.includes("没有联系或通知"));
  const freshCandidates = await employerService.listCandidates({ pageSize: 3, delayMs: 0 });
  assert.equal(Boolean(freshCandidates.items[0].demoStatusLabel), false, "Candidate mark leaked beyond the page");

  for (const phrase of ["不会保存", "不会认证", "不会发布", "求职者看不到", "不会联系"]) {
    assert.ok(ownedSource.includes(phrase), `Missing honest boundary copy: ${phrase}`);
  }

  console.log(`PASS syntax, JSON, owned paths, employer route lifecycle (${registered.length ? "registered" : "unregistered"})`);
  console.log("PASS exact service/page JS-TS mirrors, data mirror, WXML handlers, >=88rpx targets, and forbidden API boundary");
  console.log("PASS async employer service states, anonymous/expired/role guards, retry copy, and stale dashboard protection");
  console.log("PASS reachable form/preview empty-server-timeout-offline states and normal retry");
  console.log("PASS candidate pagination, append retry, auth-generation guard, and owned authPending cleanup");
  console.log("PASS form validation and duplicate single-flight rejection");
  console.log("PASS trusted local preview, no publish/receipt claim, and local-only candidate mark");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
