const assert = require("node:assert/strict");
const childProcess = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function compact(source) {
  return source.replace(/\r\n/g, "\n").replace(/\s+/g, " ").trim();
}

function normalizePage(source, isTypeScript) {
  let text = source.replace(/\r\n/g, "\n").trim();
  text = isTypeScript
    ? text
      .replace(/^import \{ homeMock \} from "\.\.\/\.\.\/data\/home";\s*/, "")
      .replace(/function openNavigation\(target: any\)/g, "function openNavigation(target)")
      .replace(/event: \{ currentTarget: \{ dataset: \{ index: number \| string \} \} \}/g, "event")
    : text.replace(/^const \{ homeMock \} = require\("\.\.\/\.\.\/data\/home"\);\s*/, "");
  return compact(text);
}

function normalizeData(source, isTypeScript) {
  let text = source.replace(/\r\n/g, "\n").trim();
  if (isTypeScript) {
    text = text.replace(/^export const homeMock =/, "const homeMock =");
  } else {
    text = text.replace(/\s*module\.exports = \{\s*homeMock\s*\};?\s*$/, "");
  }
  return compact(text);
}

function assertSyntax(relativePath) {
  const result = childProcess.spawnSync(process.execPath, ["--check", path.join(root, relativePath)], {
    encoding: "utf8"
  });
  assert.equal(result.status, 0, result.stderr);
}

const pageJsPath = "miniprogram/pages/home/index.js";
const pageTsPath = "miniprogram/pages/home/index.ts";
const dataJsPath = "miniprogram/data/home.js";
const dataTsPath = "miniprogram/data/home.ts";
const wxmlPath = "miniprogram/pages/home/index.wxml";
const wxssPath = "miniprogram/pages/home/index.wxss";
const pageJs = read(pageJsPath);
const pageTs = read(pageTsPath);
const dataJs = read(dataJsPath);
const dataTs = read(dataTsPath);
const wxml = read(wxmlPath);
const wxss = read(wxssPath);
const appConfig = JSON.parse(read("miniprogram/app.json"));

assertSyntax(pageJsPath);
assertSyntax(dataJsPath);
assert.equal(normalizePage(pageTs, true), normalizePage(pageJs, false), "Home JS/TS page mirror mismatch");
assert.equal(normalizeData(dataTs, true), normalizeData(dataJs, false), "Home JS/TS data mirror mismatch");

const forbiddenApis = /wx\.(?:request|login|getStorage|setStorage|removeStorage|clearStorage|uploadFile|connectSocket)\s*\(/;
assert.doesNotMatch(`${pageJs}\n${pageTs}\n${dataJs}\n${dataTs}`, forbiddenApis);
assert.doesNotMatch(`${pageJs}\n${pageTs}`, /搜索功能暂未开放|已搜索|搜索结果/);

const declaredChangedPaths = [
  pageJsPath,
  pageTsPath,
  wxmlPath,
  wxssPath,
  dataJsPath,
  dataTsPath,
  "workstreams/02-home-ui/STATE.json",
  "workstreams/02-home-ui/SPEC.md",
  "workstreams/02-home-ui/TASKS.md",
  "workstreams/02-home-ui/HANDOFF.md",
  "workstreams/02-home-ui/verify.cjs"
];
for (const changedPath of declaredChangedPaths) {
  const isOwned = changedPath.startsWith("miniprogram/pages/home/") ||
    changedPath === dataJsPath ||
    changedPath === dataTsPath ||
    (changedPath.startsWith("workstreams/02-home-ui/") && !changedPath.includes("/archive/"));
  assert.equal(isOwned, true, `Declared path is outside the allowed scope: ${changedPath}`);
}

let pageDefinition = null;
const navigationCalls = [];
const toasts = [];
global.wx = {
  switchTab(options) {
    navigationCalls.push({ api: "switchTab", options });
  },
  navigateTo(options) {
    navigationCalls.push({ api: "navigateTo", options });
  },
  showToast(options) {
    toasts.push(options);
  }
};
global.Page = (definition) => {
  pageDefinition = definition;
};
const { homeMock } = require(path.join(root, dataJsPath));
require(path.join(root, pageJsPath));

assert.ok(pageDefinition, "Home Page definition was not registered");
const boundHandlers = Array.from(wxml.matchAll(/bindtap="([^"]+)"/g), (match) => match[1]);
for (const handler of boundHandlers) {
  assert.equal(typeof pageDefinition[handler], "function", `Missing WXML handler: ${handler}`);
}
for (const handler of ["onLoginTap", "onSearchTap", "onNewsMoreTap", "onServicesAllTap", "onEntryTap", "onServiceTap"]) {
  assert.ok(boundHandlers.includes(handler), `Handler is not bound in WXML: ${handler}`);
}
assert.match(wxml, /wx:for="\{\{visibleNews\}\}"/);
assert.match(wxml, /wx:for="\{\{visibleServices\}\}"/);
assert.match(wxml, /\{\{newsActionText\}\}/);
assert.match(wxml, /\{\{servicesActionText\}\}/);
assert.doesNotMatch(wxml, /&(?:amp;)?gt;/i, "WXML must not use an escaped entity for the entry arrow");
assert.match(wxml, /<text class="entry-arrow">><\/text>/, "Entry arrow must render as a literal > glyph");
assert.match(wxss, /\.search-box\s*\{[^}]*min-height:\s*92rpx/s);
const sectionMoreRule = wxss.match(/\.section-more\s*\{([^}]*)\}/s);
assert.ok(sectionMoreRule, "Missing section-more style rule");
const sectionMoreMinHeight = sectionMoreRule[1].match(/min-height:\s*(\d+)rpx/);
assert.ok(sectionMoreMinHeight, "Missing section-more minimum touch height");
assert.ok(Number(sectionMoreMinHeight[1]) >= 88, "section-more touch height must not be below 88rpx");
assert.equal(Number(sectionMoreMinHeight[1]), 88, "section-more touch height must be exactly 88rpx");
assert.match(wxss, /\.service-card\s*\{[^}]*min-height:\s*164rpx/s);

const page = Object.assign({}, pageDefinition, {
  data: Object.assign({}, pageDefinition.data),
  setData(patch) {
    Object.assign(this.data, patch);
  }
});
const registeredPages = new Set(appConfig.pages.map((pagePath) => `/${pagePath}`));

assert.equal(homeMock.news.length, 6);
assert.equal(page.data.visibleNews.length, 3);
assert.equal(page.data.newsActionText, "更多");
page.onNewsMoreTap();
assert.equal(page.data.visibleNews.length, homeMock.news.length);
assert.equal(page.data.newsActionText, "收起");
page.onNewsMoreTap();
assert.equal(page.data.visibleNews.length, 3);
assert.equal(page.data.newsActionText, "更多");

assert.equal(homeMock.services.length, 8);
assert.equal(page.data.visibleServices.length, 4);
assert.equal(page.data.servicesActionText, "全部");
page.onServicesAllTap();
assert.equal(page.data.visibleServices.length, homeMock.services.length);
assert.equal(page.data.servicesActionText, "收起");
page.onServicesAllTap();
assert.equal(page.data.visibleServices.length, 4);
assert.equal(page.data.servicesActionText, "全部");

page.onLoginTap();
let navigation = navigationCalls.at(-1);
assert.equal(navigation.api, "navigateTo");
assert.equal(navigation.options.url, "/pages/profile-login/index");
assert.ok(registeredPages.has(navigation.options.url), "Login route must be registered in app.json");
assert.equal(typeof navigation.options.fail, "function");

page.onSearchTap();
navigation = navigationCalls.at(-1);
assert.equal(navigation.api, "switchTab");
assert.equal(navigation.options.url, "/pages/jobs/index");
assert.equal(typeof navigation.options.fail, "function");
navigation.options.fail();
assert.deepEqual(toasts.at(-1), { title: "页面暂时无法打开", icon: "none" });

assert.deepEqual(
  homeMock.quickEntries.map((entry) => entry.id),
  ["jobs", "hire", "training", "policy", "campus", "labor", "return", "signup"]
);
for (let index = 0; index < homeMock.quickEntries.length; index += 1) {
  page.onEntryTap({ currentTarget: { dataset: { index } } });
  navigation = navigationCalls.at(-1);
  assert.equal(navigation.options.url, homeMock.quickEntries[index].route);
}

const expectedServiceTargets = {
  "job-fair": ["tab", "/pages/events/index"],
  "latest-jobs": ["tab", "/pages/jobs/index"],
  "company-zone": ["page", "/pages/employer/index"],
  "hire-worker": ["page", "/pages/employer-job-form/index"],
  "skill-training": ["page", "/pages/training/index"],
  "employment-policy": ["page", "/pages/policy/index"],
  "return-home-service": ["page", "/pages/return-home/index"],
  "training-registration": ["page", "/pages/training-signup/index"]
};
const tabPages = new Set(appConfig.tabBar.list.map((item) => `/${item.pagePath}`));
for (let index = 0; index < homeMock.services.length; index += 1) {
  const service = homeMock.services[index];
  assert.deepEqual([service.type, service.route], expectedServiceTargets[service.id]);
  assert.equal(service.enabled, true);
  assert.ok(registeredPages.has(service.route), `Unregistered service route: ${service.route}`);
  assert.equal(service.type === "tab", tabPages.has(service.route));

  page.onServiceTap({ currentTarget: { dataset: { index } } });
  navigation = navigationCalls.at(-1);
  assert.equal(navigation.api, service.type === "tab" ? "switchTab" : "navigateTo");
  assert.equal(navigation.options.url, service.route);
  assert.equal(typeof navigation.options.fail, "function");
}
navigation.options.fail();
assert.deepEqual(toasts.at(-1), { title: "页面暂时无法打开", icon: "none" });

console.log("PASS home/data JS syntax and JS/TS mirrors");
console.log("PASS WXML handlers, literal entry arrow, preview/expanded states, labels, and 88rpx section action targets");
console.log("PASS search, quick-entry, and all service tab/page navigation with failure feedback");
console.log("PASS registered routes, forbidden API scan, and declared allowed-file scope");
