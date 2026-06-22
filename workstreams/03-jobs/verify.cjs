const assert = require("node:assert/strict");
const childProcess = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../..");
const pageBases = [
  "miniprogram/pages/jobs/index",
  "miniprogram/pages/job-detail/index"
];
const jsFiles = [
  "miniprogram/data/jobs.js",
  "miniprogram/services/jobs.js",
  ...pageBases.map((base) => `${base}.js`)
];
const jsonFiles = [
  ...pageBases.map((base) => `${base}.json`),
  "miniprogram/app.json",
  "workstreams/03-jobs/STATE.json"
];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function normalizeDataMirror(source, isTypeScript) {
  let text = source.replace(/\r\n/g, "\n").trim();
  if (isTypeScript) {
    text = text
      .replace(/\bexport\s+(?=(const|function)\b)/g, "")
      .replace(/new Set<string>\(\)/g, "new Set()")
      .replace(/:\s*string/g, "");
  } else {
    text = text.replace(/\nmodule\.exports = \{[\s\S]*?\};\s*$/, "");
  }
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

function loadPage(relativePath) {
  let captured = null;
  const fullPath = path.join(root, relativePath);
  delete require.cache[require.resolve(fullPath)];
  global.Page = (definition) => { captured = definition; };
  require(fullPath);
  return captured;
}

function idEvent(id) {
  return { currentTarget: { dataset: { id } } };
}

function scenarioEvent(scenario) {
  return { currentTarget: { dataset: { scenario } } };
}

function queryEvent(value) {
  return { detail: { value } };
}

function flush() {
  return new Promise((resolve) => setImmediate(resolve));
}

async function rejectsKind(promise, kind) {
  await assert.rejects(promise, (error) => error && error.kind === kind);
}

async function main() {
  for (const file of jsFiles) {
    const result = childProcess.spawnSync(process.execPath, ["--check", path.join(root, file)], { encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
  }
  for (const file of jsonFiles) JSON.parse(read(file));

  const exactMirrorPairs = [
    ["miniprogram/services/jobs.js", "miniprogram/services/jobs.ts"],
    ["miniprogram/pages/jobs/index.js", "miniprogram/pages/jobs/index.ts"],
    ["miniprogram/pages/job-detail/index.js", "miniprogram/pages/job-detail/index.ts"]
  ];
  for (const [jsFile, tsFile] of exactMirrorPairs) {
    assert.equal(read(jsFile), read(tsFile), `Exact JS/TS mirror mismatch: ${jsFile}`);
  }
  assert.equal(
    normalizeDataMirror(read("miniprogram/data/jobs.js"), false),
    normalizeDataMirror(read("miniprogram/data/jobs.ts"), true),
    "Data JS/TS mirror mismatch"
  );

  const ownedSource = [
    ...jsFiles,
    "miniprogram/services/jobs.ts",
    ...pageBases.map((base) => `${base}.ts`),
    ...pageBases.map((base) => `${base}.wxml`)
  ].map(read).join("\n");
  assert.equal(
    /wx\.(request|login|connectSocket|sendSocketMessage|setStorage|getStorage|removeStorage|clearStorage|uploadFile)\s*\(/i.test(ownedSource),
    false,
    "Forbidden request/login/socket/storage/upload API found"
  );
  assert.doesNotMatch(read("miniprogram/pages/jobs/index.js"), /data\/jobs/);
  assert.doesNotMatch(read("miniprogram/pages/job-detail/index.js"), /data\/jobs/);

  const app = JSON.parse(read("miniprogram/app.json"));
  assert.ok(app.pages.includes("pages/jobs/index"));
  assert.ok(app.pages.includes("pages/job-detail/index"));
  for (const base of pageBases) {
    const definition = loadPage(`${base}.js`);
    const handlers = [...read(`${base}.wxml`).matchAll(/(?:bind|catch)[a-z]+="([A-Za-z_$][\w$]*)"/g)]
      .map((match) => match[1]);
    for (const handler of new Set(handlers)) {
      assert.equal(typeof definition[handler], "function", `Missing WXML handler: ${base}#${handler}`);
    }
  }
  assert.match(read("miniprogram/pages/jobs/index.wxss"), /\.scenario-chip\s*\{[\s\S]*?min-height:\s*88rpx/);
  assert.match(read("miniprogram/pages/jobs/index.wxss"), /\.page-action\s*\{[\s\S]*?min-height:\s*88rpx/);
  assert.match(read("miniprogram/pages/jobs/index.wxss"), /\.page-retry\s*\{[\s\S]*?min-height:\s*88rpx/);
  assert.match(read("miniprogram/pages/job-detail/index.wxss"), /\.scenario-chip\s*\{[\s\S]*?min-height:\s*88rpx/);
  assert.match(read("miniprogram/pages/job-detail/index.wxss"), /\.favorite-button,[\s\S]*?min-height:\s*88rpx/);
  assert.doesNotMatch(read("miniprogram/pages/jobs/index.wxss"), /width:\s*[89]\d{2,}rpx/);
  assert.doesNotMatch(read("miniprogram/pages/job-detail/index.wxss"), /width:\s*[89]\d{2,}rpx/);

  const jobsServicePath = path.join(root, "miniprogram/services/jobs.js");
  delete require.cache[require.resolve(jobsServicePath)];
  const jobsService = require(jobsServicePath);
  assert.deepEqual(jobsService.getUiConfig().scenarios.map((item) => item.id), [
    "normal", "empty", "error", "timeout", "offline", "unauthorized"
  ]);

  const first = await jobsService.list({ page: 1, pageSize: 2, delayMs: 0 });
  assert.deepEqual(first.items.map((job) => job.id), ["job-1", "job-2"]);
  assert.deepEqual({ total: first.total, page: first.page, pageSize: first.pageSize, hasMore: first.hasMore, nextPage: first.nextPage }, {
    total: 4, page: 1, pageSize: 2, hasMore: true, nextPage: 2
  });
  const second = await jobsService.list({ page: 2, pageSize: 2, delayMs: 0 });
  assert.deepEqual(second.items.map((job) => job.id), ["job-3", "job-4"]);
  assert.equal(second.hasMore, false);
  assert.equal(second.nextPage, null);
  assert.deepEqual((await jobsService.list({ query: "焊工", page: 1, pageSize: 10, delayMs: 0 })).items.map((job) => job.id), ["job-2"]);
  assert.deepEqual((await jobsService.list({ filterId: "food-home", page: 1, pageSize: 10, delayMs: 0 })).items.map((job) => job.id), ["job-1", "job-4"]);
  assert.deepEqual((await jobsService.list({ zoneId: "urgent", page: 1, pageSize: 10, delayMs: 0 })).items.map((job) => job.id), ["job-1"]);
  assert.deepEqual((await jobsService.list({ sortId: "salary", page: 1, pageSize: 10, delayMs: 0 })).items.map((job) => job.id), ["job-4", "job-1", "job-2", "job-3"]);
  assert.deepEqual((await jobsService.list({ sortId: "distance", page: 1, pageSize: 10, delayMs: 0 })).items.map((job) => job.id), ["job-1", "job-3", "job-2", "job-4"]);
  await rejectsKind(jobsService.list({ page: 0, pageSize: 2, delayMs: 0 }), "validation");
  await rejectsKind(jobsService.list({ page: 1, pageSize: 0, delayMs: 0 }), "validation");
  assert.equal((await jobsService.list({ scenario: "empty", page: 1, pageSize: 2, delayMs: 0 })).total, 0);
  for (const scenario of ["error", "timeout", "offline", "unauthorized"]) {
    const kind = scenario === "error" ? "server" : scenario;
    await rejectsKind(jobsService.list({ scenario, page: 1, pageSize: 2, delayMs: 0 }), kind);
  }

  assert.equal((await jobsService.getById("job-1", { delayMs: 0 })).id, "job-1");
  assert.equal(await jobsService.getById("not-found", { delayMs: 0 }), null);
  await assert.rejects(jobsService.getById("", { delayMs: 0 }), (error) => error.code === "MISSING_JOB_ID");
  await rejectsKind(jobsService.getById("job-1", { scenario: "offline", delayMs: 0 }), "offline");
  assert.equal(jobsService.toggleFavorite("job-1"), true);
  assert.ok(jobsService.getFavoriteIds().includes("job-1"));
  assert.equal(jobsService.toggleFavorite("job-1"), false);

  const applyOne = jobsService.applyDemo("job-1", { delayMs: 20 });
  const applyDuplicate = jobsService.applyDemo("job-1", { delayMs: 20 });
  await assert.rejects(applyDuplicate, (error) => error.code === "DUPLICATE_SUBMISSION");
  const applyResult = await applyOne;
  assert.deepEqual({ localOnly: applyResult.localOnly, submitted: applyResult.submitted }, { localOnly: true, submitted: false });

  const modals = [];
  const navigations = [];
  const toasts = [];
  global.wx = {
    navigateBack() {},
    navigateTo(options) { navigations.push(options); },
    showToast(options) { toasts.push(options); },
    showModal(options) { modals.push(options); }
  };

  const realList = jobsService.list;
  const realGetById = jobsService.getById;
  const realApplyDemo = jobsService.applyDemo;
  jobsService.list = (options) => realList({ ...options, delayMs: 0 });
  jobsService.getById = (id, options) => realGetById(id, { ...options, delayMs: 0 });
  jobsService.applyDemo = (id, options) => realApplyDemo(id, { ...options, delayMs: 0 });

  const jobsPage = instantiate(loadPage("miniprogram/pages/jobs/index.js"));
  const initialPromise = jobsPage.onLoad();
  assert.equal(jobsPage.data.loadState, "loading");
  await initialPromise;
  assert.deepEqual(jobsPage.data.visibleJobs.map((job) => job.id), ["job-1", "job-2"]);
  assert.equal(jobsPage.data.hasMore, true);
  jobsService.list = (options) => options.page === 2
    ? realList({ ...options, scenario: "error", delayMs: 0 })
    : realList({ ...options, delayMs: 0 });
  await jobsPage.onLoadMore();
  assert.equal(jobsPage.data.loadState, "normal");
  assert.match(jobsPage.data.pageFeedback, /可重试加载更多/);
  assert.deepEqual(jobsPage.data.visibleJobs.map((job) => job.id), ["job-1", "job-2"]);
  jobsService.list = (options) => realList({ ...options, delayMs: 0 });
  await jobsPage.onLoadMore();
  assert.deepEqual(jobsPage.data.visibleJobs.map((job) => job.id), ["job-1", "job-2", "job-3", "job-4"]);
  assert.equal(jobsPage.data.hasMore, false);
  assert.equal(jobsPage.data.pageFeedback, "");
  jobsPage.onSearchInput(queryEvent("焊工"));
  await flush();
  assert.deepEqual(jobsPage.data.visibleJobs.map((job) => job.id), ["job-2"]);
  assert.equal(jobsPage.data.page, 1);
  jobsPage.onClearConditions();
  await flush();
  jobsPage.onSortTap(idEvent("salary"));
  await flush();
  assert.deepEqual(jobsPage.data.visibleJobs.map((job) => job.id), ["job-4", "job-1"]);
  assert.equal(jobsPage.data.page, 1);
  for (const scenario of ["empty", "error", "timeout", "offline", "unauthorized"]) {
    jobsPage.onScenarioTap(scenarioEvent(scenario));
    await flush();
    assert.equal(jobsPage.data.loadState, scenario === "empty" ? "empty" : "error");
    if (scenario !== "empty") assert.equal(jobsPage.data.errorKind, scenario === "error" ? "server" : scenario);
  }
  jobsPage.onRetry();
  await flush();
  assert.equal(jobsPage.data.selectedScenario, "normal");
  assert.equal(jobsPage.data.loadState, "normal");

  const pending = [];
  jobsService.list = (options) => new Promise((resolve) => pending.push({ options, resolve }));
  jobsPage.reloadWith({ query: "old" });
  jobsPage.reloadWith({ query: "new" });
  assert.equal(pending.length, 2);
  pending[1].resolve({ items: [{ id: "job-new" }], total: 1, page: 1, pageSize: 2, hasMore: false, nextPage: null });
  await flush();
  pending[0].resolve({ items: [{ id: "job-old" }], total: 1, page: 1, pageSize: 2, hasMore: false, nextPage: null });
  await flush();
  assert.deepEqual(jobsPage.data.visibleJobs.map((job) => job.id), ["job-new"]);
  jobsService.list = (options) => realList({ ...options, delayMs: 0 });

  jobsPage.onToggleFavorite(idEvent("job-1"));
  assert.equal(jobsPage.data.favoriteCount, 1);
  jobsPage.onOpenDetail(idEvent("job-1"));
  assert.equal(navigations[0].url, "/pages/job-detail/index?id=job-1");
  navigations[0].fail();
  assert.match(modals.at(-1).content, /没有发起真实业务请求/);

  const detailDefinition = loadPage("miniprogram/pages/job-detail/index.js");
  const detailPage = instantiate(detailDefinition);
  const detailPromise = detailPage.onLoad({ id: "job-1" });
  assert.equal(detailPage.data.loadState, "loading");
  await detailPromise;
  assert.equal(detailPage.data.job.id, "job-1");
  assert.equal(detailPage.data.isFavorite, true);

  const missingPage = instantiate(detailDefinition);
  await missingPage.onLoad({});
  assert.equal(missingPage.data.loadState, "missing-id");
  const notFoundPage = instantiate(detailDefinition);
  await notFoundPage.onLoad({ id: "not-found" });
  assert.equal(notFoundPage.data.loadState, "not-found");
  for (const scenario of ["error", "timeout", "offline", "unauthorized"]) {
    detailPage.setData({ selectedScenario: scenario });
    await detailPage.loadJob();
    assert.equal(detailPage.data.loadState, "error");
    assert.equal(detailPage.data.errorKind, scenario === "error" ? "server" : scenario);
  }
  detailPage.onRetry();
  await flush();
  assert.equal(detailPage.data.loadState, "normal");

  detailPage.onToggleFavorite();
  assert.equal(detailPage.data.isFavorite, false);
  modals.length = 0;
  detailPage.onApplyTap();
  assert.match(modals[0].content, /不会真实投递/);
  const confirmed = modals[0].success({ confirm: true });
  assert.equal(detailPage.data.applySubmitting, true);
  detailPage.onApplyTap();
  assert.match(toasts.at(-1).title, /请勿重复点击/);
  await confirmed;
  assert.equal(detailPage.data.applySubmitting, false);
  assert.equal(detailPage.data.applyDemoDone, true);
  assert.match(modals[1].content, /没有发送简历/);

  console.log("PASS syntax, JSON, exact JS/TS mirrors, WXML handlers, route and touch targets");
  console.log("PASS service filtering, sorting, pagination, validation and all local scenarios");
  console.log("PASS list async loading, page/end, reset/retry and stale-request protection");
  console.log("PASS detail missing/not-found/service-error states and retry");
  console.log("PASS session favorite and guarded asynchronous local-only apply demo");
  console.log("PASS forbidden API and page-to-service boundary checks");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
