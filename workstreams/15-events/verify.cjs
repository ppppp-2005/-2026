const assert = require("node:assert/strict");
const childProcess = require("node:child_process");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../..");
const pageBases = [
  "miniprogram/pages/events/index",
  "miniprogram/pages/event-detail/index"
];
const expectedPageFiles = ["index.js", "index.json", "index.ts", "index.wxml", "index.wxss"];
const appJsonHash = "8beb59746c6405f890b0c1847c9dceeb7f85c9b3b6fc65cf55a27396ef416b7d";

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function pageDefinition(relativePath) {
  let definition = null;
  global.Page = (value) => { definition = value; };
  global.wx = new Proxy({}, { get: () => () => {} });
  const fullPath = path.join(root, relativePath);
  delete require.cache[require.resolve(fullPath)];
  require(fullPath);
  return definition;
}

function instantiate(definition) {
  const instance = {
    data: JSON.parse(JSON.stringify(definition.data)),
    setData(next, callback) {
      Object.assign(this.data, next);
      if (callback) callback.call(this);
    }
  };
  for (const [name, value] of Object.entries(definition)) {
    if (typeof value === "function") instance[name] = value.bind(instance);
  }
  return instance;
}

for (const base of pageBases) {
  const result = childProcess.spawnSync(process.execPath, ["--check", path.join(root, `${base}.js`)], {
    encoding: "utf8"
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(read(`${base}.js`), read(`${base}.ts`), `JS/TS mirror mismatch: ${base}`);
  JSON.parse(read(`${base}.json`));

  const definition = pageDefinition(`${base}.js`);
  const handlers = [...read(`${base}.wxml`).matchAll(/(?:bind|catch)[A-Za-z0-9:_-]+="([A-Za-z_$][\w$]*)"/g)]
    .map((match) => match[1]);
  for (const handler of new Set(handlers)) {
    assert.equal(typeof definition[handler], "function", `Missing WXML handler: ${base}#${handler}`);
  }
}

for (const pageName of ["events", "event-detail"]) {
  const directory = path.join(root, "miniprogram/pages", pageName);
  assert.deepEqual(fs.readdirSync(directory).sort(), expectedPageFiles, `Unexpected file in ${pageName}`);
}

const dataJs = read("miniprogram/data/events.js");
const dataTs = read("miniprogram/data/events.ts");
const expectedTs = dataJs
  .replace("const eventsMock =", "export const eventsMock =")
  .replace("function findEventById(id)", "export function findEventById(id)")
  .replace(/\nmodule\.exports = \{ eventsMock, findEventById \};\n$/, "\n");
assert.equal(dataTs.trimEnd(), expectedTs.trimEnd(), "events data JS/TS mirror mismatch");

const { eventsMock, findEventById } = require(path.join(root, "miniprogram/data/events.js"));
assert.deepEqual(eventsMock.typeTabs.map((item) => item.id), ["live", "fair", "talk"]);
assert.deepEqual(eventsMock.statusFilters.map((item) => item.id), ["all", "ongoing", "upcoming", "ended"]);
assert.ok(eventsMock.events.some((item) => item.status === "ongoing"));
assert.ok(eventsMock.events.some((item) => item.status === "upcoming"));
assert.ok(eventsMock.events.some((item) => item.status === "ended"));
assert.equal(findEventById("missing-id"), null);

const eventsDefinition = pageDefinition("miniprogram/pages/events/index.js");
const eventsPage = instantiate(eventsDefinition);
eventsPage.loadEvents();
assert.equal(eventsPage.data.loadState, "normal");
assert.ok(eventsPage.data.visibleEvents.every((item) => item.type === "live"));
eventsPage.onStatusTap({ currentTarget: { dataset: { id: "upcoming" } } });
assert.equal(eventsPage.data.loadState, "empty");
eventsPage.onTypeTap({ currentTarget: { dataset: { id: "fair" } } });
assert.equal(eventsPage.data.loadState, "normal");
eventsPage.onShowAllStatuses();
assert.ok(eventsPage.data.visibleEvents.every((item) => item.type === "fair"));

const originalEvents = eventsMock.events;
eventsMock.events = null;
eventsPage.loadEvents();
assert.equal(eventsPage.data.loadState, "error");
eventsMock.events = originalEvents;
eventsPage.onRetry();
assert.equal(eventsPage.data.loadState, "normal");

const detailDefinition = pageDefinition("miniprogram/pages/event-detail/index.js");
const validDetail = instantiate(detailDefinition);
validDetail.onLoad({ id: "fair-001" });
assert.equal(validDetail.data.loadState, "normal");
assert.equal(validDetail.data.event.typeLabel, "招聘会");

const missingDetail = instantiate(detailDefinition);
missingDetail.onLoad({});
assert.equal(missingDetail.data.loadState, "error");
assert.equal(missingDetail.data.event, null);

const modalCopies = [];
global.wx = {
  showToast() {},
  navigateBack() {},
  showModal(options) {
    modalCopies.push(options.content);
    if (options.success) options.success({ confirm: true });
  }
};
validDetail.onInterestTap();
assert.equal(validDetail.data.isInterested, true);
assert.match(validDetail.data.interestFeedback, /未真实报名/);
assert.match(validDetail.data.interestFeedback, /未订阅/);
assert.match(validDetail.data.interestFeedback, /不会通知主办方/);
validDetail.onInterestTap();
assert.equal(validDetail.data.isInterested, false);
validDetail.onSignupInfoTap();
assert.ok(modalCopies.some((copy) => /不会真实报名/.test(copy) && /不会订阅/.test(copy) && /不会通知主办方/.test(copy)));

const listSource = ["js", "wxml"].map((extension) => read(`miniprogram/pages/events/index.${extension}`)).join("\n");
assert.match(listSource, /loading/);
assert.match(listSource, /normal/);
assert.match(listSource, /empty/);
assert.match(listSource, /error/);
assert.match(listSource, /onRetry/);
assert.match(read("miniprogram/pages/events/index.js"), /\/pages\/event-detail\/index\?id=/);
assert.match(read("miniprogram/pages/events/index.js"), /活动详情暂时无法打开/);
assert.doesNotMatch(read("miniprogram/pages/events/index.js"), /路由|未注册/);

const detailWxml = read("miniprogram/pages/event-detail/index.wxml");
for (const binding of [
  "event.typeLabel",
  "event.statusLabel",
  "event.time",
  "event.location",
  "event.organizer",
  "event.audience",
  "event.description"
]) {
  assert.match(detailWxml, new RegExp(binding.replace(".", "\\.")), `Missing detail binding: ${binding}`);
}

const ownedSource = pageBases.flatMap((base) => ["js", "ts", "wxml", "wxss"].map((extension) => read(`${base}.${extension}`)))
  .concat([dataJs, dataTs])
  .join("\n");
assert.doesNotMatch(ownedSource, /wx\.(?:request|connectSocket|sendSocketMessage|uploadFile|downloadFile|login|getUserProfile|getPhoneNumber|requestSubscribeMessage|setStorage(?:Sync)?|getStorage(?:Sync)?|removeStorage(?:Sync)?|clearStorage(?:Sync)?|requestPayment|makePhoneCall)\s*\(/i);
assert.doesNotMatch(ownedSource, /<image\b|<svg\b|background-image\s*:|url\s*\(|data:image/i);

const appSource = read("miniprogram/app.json");
assert.equal(crypto.createHash("sha256").update(appSource).digest("hex"), appJsonHash, "app.json changed outside approved integration");
const appConfig = JSON.parse(appSource);
assert.equal(appConfig.tabBar.list.length, 5);
assert.equal(appConfig.pages.includes("pages/events/index"), true);
assert.equal(appConfig.pages.includes("pages/event-detail/index"), true);

console.log("PASS events JS syntax, JSON, JS/TS mirrors, and WXML handlers");
console.log("PASS events tabs, status filters, normal/empty/error/retry behavior");
console.log("PASS event detail valid/missing id and honest local interest behavior");
console.log("PASS absolute detail intent, generic failure copy, forbidden APIs, and asset scan");
console.log("PASS owned page inventory and integrated five-tab app.json contract");
