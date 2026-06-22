const assert = require("node:assert/strict");
const childProcess = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../..");
const miniRoot = path.join(root, "miniprogram");
const pageExtensions = [".js", ".json", ".ts", ".wxml", ".wxss"];
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

function relative(fullPath) {
  return path.relative(root, fullPath).replace(/\\/g, "/");
}

function absolute(relativePath) {
  return path.join(root, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(absolute(relativePath), "utf8");
}

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const child = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(child) : [child];
  });
}

function lineNumber(source, index) {
  return source.slice(0, index).split(/\r?\n/).length;
}

function uniqueSorted(values) {
  return [...new Set(values)].sort();
}

function hanFingerprint(source) {
  return (source.match(/[\u3400-\u9fff]+/g) || []).sort();
}

function pageFingerprint(source) {
  return {
    methods: uniqueSorted([...source.matchAll(/^  ([A-Za-z_$][\w$]*)\s*\([^\n]*\)\s*\{/gm)].map((match) => match[1])),
    wxCalls: uniqueSorted([...source.matchAll(/wx\.([A-Za-z_$][\w$]*)\s*\(/g)].map((match) => match[1])),
    routes: uniqueSorted(source.match(/\/pages\/[A-Za-z0-9_-]+\/index/g) || []),
    han: hanFingerprint(source)
  };
}

function dataExportNames(jsSource, tsSource) {
  const moduleMatch = jsSource.match(/module\.exports\s*=\s*\{([\s\S]*?)\};\s*$/);
  assert.ok(moduleMatch, "CommonJS data module must end with module.exports");
  const jsNames = uniqueSorted(
    moduleMatch[1]
      .split(",")
      .map((item) => item.trim().split(/\s*:\s*/)[0])
      .filter(Boolean)
  );
  const tsNames = uniqueSorted(
    [...tsSource.matchAll(/\bexport\s+(?:const|function|class)\s+([A-Za-z_$][\w$]*)/g)]
      .map((match) => match[1])
  );
  return { jsNames, tsNames };
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
  const fullPath = absolute(relativePath);
  let definition = null;
  delete require.cache[require.resolve(fullPath)];
  global.Page = (captured) => {
    definition = captured;
  };
  require(fullPath);
  assert.ok(definition, `Page definition was not captured: ${relativePath}`);
  return definition;
}

const allFiles = walk(miniRoot);
const appConfig = JSON.parse(read("miniprogram/app.json"));
assert.equal(new Set(appConfig.pages).size, appConfig.pages.length, "app.json contains duplicate routes");
assert.deepEqual(appConfig.tabBar, expectedTabBar, "Five-item tabBar contract changed");
assert.equal(appConfig.style, "v2", "app style contract changed");
assert.equal(appConfig.sitemapLocation, "sitemap.json", "sitemap contract changed");

for (const route of appConfig.pages) {
  for (const extension of pageExtensions) {
    assert.equal(
      fs.existsSync(path.join(miniRoot, `${route}${extension}`)),
      true,
      `Missing registered-page file: miniprogram/${route}${extension}`
    );
  }
}

const tabRoutes = appConfig.tabBar.list.map((item) => item.pagePath);
for (const tabRoute of tabRoutes) {
  assert.ok(appConfig.pages.includes(tabRoute), `Tab route is not registered: ${tabRoute}`);
}
assert.equal(new Set(tabRoutes).size, 5, "Tab routes must be unique");
console.log(`PASS ${appConfig.pages.length} registered routes, all five-file sets, route uniqueness, and Tab contract`);

const jsFiles = allFiles.filter((file) => file.endsWith(".js"));
for (const file of jsFiles) {
  const result = childProcess.spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  assert.equal(result.status, 0, `${relative(file)}\n${result.stderr}`);
}
const jsonFiles = allFiles.filter((file) => file.endsWith(".json"));
for (const file of jsonFiles) {
  JSON.parse(fs.readFileSync(file, "utf8"));
}
console.log(`PASS ${jsFiles.length} JavaScript syntax checks and ${jsonFiles.length} JSON parses`);

global.wx = new Proxy({}, { get: () => () => {} });
const pageDefinitions = new Map();
for (const route of appConfig.pages) {
  const base = `miniprogram/${route}`;
  const definition = loadPage(`${base}.js`);
  pageDefinitions.set(route, definition);
  const handlers = uniqueSorted(
    [...read(`${base}.wxml`).matchAll(/(?:bind|catch)[A-Za-z0-9:_-]+="([A-Za-z_$][\w$]*)"/g)]
      .map((match) => match[1])
  );
  for (const handler of handlers) {
    assert.equal(typeof definition[handler], "function", `Missing WXML handler: ${base}#${handler}`);
  }
  assert.deepEqual(
    pageFingerprint(read(`${base}.js`)),
    pageFingerprint(read(`${base}.ts`)),
    `JS/TS page mirror fingerprint mismatch: ${base}`
  );
}

assert.equal(
  read("miniprogram/app.js").replace(/\s+/g, " ").trim(),
  read("miniprogram/app.ts").replace(/\s+/g, " ").trim(),
  "app.js/app.ts mirror mismatch"
);

const dataJsFiles = allFiles.filter((file) => /[\\/]data[\\/].+\.js$/.test(file));
for (const jsFile of dataJsFiles) {
  const jsRelative = relative(jsFile);
  const tsRelative = jsRelative.replace(/\.js$/, ".ts");
  assert.ok(fs.existsSync(absolute(tsRelative)), `Missing data TypeScript mirror: ${tsRelative}`);
  const jsSource = read(jsRelative);
  const tsSource = read(tsRelative);
  const { jsNames, tsNames } = dataExportNames(jsSource, tsSource);
  assert.deepEqual(tsNames, jsNames, `Data export mirror mismatch: ${jsRelative}`);
  assert.deepEqual(hanFingerprint(tsSource), hanFingerprint(jsSource), `Data copy mirror mismatch: ${jsRelative}`);
  assert.deepEqual(
    uniqueSorted(tsSource.match(/\/pages\/[A-Za-z0-9_-]+\/index/g) || []),
    uniqueSorted(jsSource.match(/\/pages\/[A-Za-z0-9_-]+\/index/g) || []),
    `Data route mirror mismatch: ${jsRelative}`
  );
}
console.log(`PASS ${appConfig.pages.length} page JS/TS fingerprints, WXML handlers, app mirror, and ${dataJsFiles.length} data mirrors`);

const navigableFiles = allFiles.filter((file) => /\.(?:js|ts|wxml)$/.test(file));
const navigationTargets = new Set();
for (const file of navigableFiles) {
  const source = fs.readFileSync(file, "utf8");
  for (const match of source.matchAll(/\/pages\/[A-Za-z0-9_-]+\/index/g)) {
    navigationTargets.add(match[0].slice(1));
  }
}
for (const target of navigationTargets) {
  assert.ok(appConfig.pages.includes(target), `Absolute navigation target is not registered: /${target}`);
}
console.log(`PASS ${navigationTargets.size} absolute navigation targets resolve to registered pages`);

const executableSource = allFiles
  .filter((file) => /\.(?:js|ts|wxml)$/.test(file))
  .map((file) => fs.readFileSync(file, "utf8"))
  .join("\n");
const forbiddenApi = /wx\.(request|connectSocket|sendSocketMessage|onSocketMessage|closeSocket|uploadFile|downloadFile|login|getUserProfile|getPhoneNumber|requestSubscribeMessage|setStorage(?:Sync)?|getStorage(?:Sync)?|removeStorage(?:Sync)?|clearStorage(?:Sync)?|requestPayment|makePhoneCall)\s*\(/gi;
const forbiddenCalls = uniqueSorted([...executableSource.matchAll(forbiddenApi)].map((match) => match[0]));
assert.deepEqual(forbiddenCalls, [], `Forbidden real-service API calls found: ${forbiddenCalls.join(", ")}`);

const falseSuccess = /(?<!体验本地)登录成功|保存成功|收藏成功|投递成功|发布成功|发送成功|认证成功|联系成功|通知成功/g;
const falseSuccessHits = uniqueSorted([...executableSource.matchAll(falseSuccess)].map((match) => match[0]));
assert.deepEqual(falseSuccessHits, [], `Unqualified success copy found: ${falseSuccessHits.join(", ")}`);

for (const route of appConfig.pages) {
  const pageSource = read(`miniprogram/${route}.js`);
  assert.match(pageSource, /(?:require\("\.\.\/\.\.\/(?:data|services)\/|require\('\.\.\/\.\.\/(?:data|services)\/)/, `Page does not consume centralized data: ${route}`);
}
assert.match(read("miniprogram/services/README.md"), /real WeChat transport yet/i);
console.log("PASS forbidden request/socket/storage/subscription/upload/download/payment/login calls, false-success copy, and mock-data boundary");

assert.match(read("miniprogram/pages/messages/index.wxml"), /!visibleMessages\.length/);
assert.match(read("miniprogram/pages/profile-applications/index.wxml"), /!visibleRecords\.length/);
console.log("PASS messages/profile empty-state WXML branches (behavior covered by owning workstream verify scripts)");

const truthContracts = [
  ["miniprogram/pages/profile-login/index.js", /不会调用微信登录/, /没有创建真实账号/],
  ["miniprogram/pages/job-detail/index.js", /不会真实投递/, /没有发送简历/],
  ["miniprogram/pages/employer-job-preview/index.js", /不会发送到平台/, /没有发布岗位/],
  ["miniprogram/pages/message-detail/index.js", /不会联系招聘方/, /没有保存、发送/],
  ["miniprogram/pages/employer-candidates/index.js", /不会联系、邀约、拒绝或通知/, /没有联系或通知/]
];
for (const [file, beforePattern, afterPattern] of truthContracts) {
  const source = read(file);
  assert.match(source, beforePattern, `Missing pre-action truth boundary: ${file}`);
  assert.match(source, afterPattern, `Missing post-action truth boundary: ${file}`);
}
console.log("PASS login/apply/publish/send/candidate pre-action and post-action truth-boundary copy");

const findings = [];
const staleRoutePattern = /(待[^\n"']*注册|等待项目壳注册|需由项目壳[^\n"']*注册|尚未由项目壳注册|后续统一注册)/g;
for (const file of navigableFiles) {
  const source = fs.readFileSync(file, "utf8");
  for (const match of source.matchAll(staleRoutePattern)) {
    findings.push(`${relative(file)}:${lineNumber(source, match.index)} stale registered-route copy: ${match[0]}`);
  }
}

const navigationCalls = [];
for (const file of jsFiles.filter((item) => item.includes(`${path.sep}pages${path.sep}`))) {
  const source = fs.readFileSync(file, "utf8");
  for (const match of source.matchAll(/wx\.(navigateTo|switchTab)\s*\(\s*\{([\s\S]*?)\n\s*\}\s*\);/g)) {
    navigationCalls.push({
      file: relative(file),
      line: lineNumber(source, match.index),
      api: match[1],
      hasFail: /\bfail\s*:/.test(match[2])
    });
  }
}
for (const call of navigationCalls.filter((item) => !item.hasFail)) {
  findings.push(`${call.file}:${call.line} ${call.api} has no user-visible failure handler`);
}

const wxssFiles = allFiles.filter((file) => file.endsWith(".wxss"));
let fixedControlCount = 0;
let nowrapCount = 0;
let overflowHiddenCount = 0;
let smallFontCount = 0;
let narrowMediaFileCount = 0;
for (const file of wxssFiles) {
  const source = fs.readFileSync(file, "utf8");
  nowrapCount += (source.match(/white-space\s*:\s*nowrap/g) || []).length;
  overflowHiddenCount += (source.match(/overflow\s*:\s*hidden/g) || []).length;
  smallFontCount += [...source.matchAll(/font-size\s*:\s*(\d+)rpx/g)].filter((match) => Number(match[1]) < 24).length;
  if (/@media\s*\(max-width:/.test(source)) narrowMediaFileCount += 1;
  for (const rule of source.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!/(button|action|input|chip|toggle)/i.test(rule[1])) continue;
    const height = rule[2].match(/(?:^|;)\s*height\s*:\s*(\d+)rpx/);
    if (height && Number(height[1]) < 88) fixedControlCount += 1;
  }
}
console.log(`INFO static responsive-risk inventory: ${fixedControlCount} fixed controls below 88rpx, ${smallFontCount} font declarations below 24rpx, ${nowrapCount} nowrap rules, ${overflowHiddenCount} overflow-hidden rules, ${narrowMediaFileCount}/${wxssFiles.length} WXSS files with narrow media rules`);
console.log("INFO this inventory is not a simulator, screenshot, narrow-screen, or large-font PASS");

if (findings.length) {
  console.error(`FAIL ${findings.length} navigation/integration truth findings`);
  for (const finding of findings) console.error(`- ${finding}`);
  process.exitCode = 1;
} else {
  console.log(`PASS ${navigationCalls.length} navigation calls have current, user-visible failure handling`);
}
