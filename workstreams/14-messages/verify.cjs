const assert = require("node:assert/strict");
const childProcess = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../..");
const pageBases = [
  "miniprogram/pages/messages/index",
  "miniprogram/pages/message-detail/index"
];
const serviceBase = "miniprogram/services/messages";

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function uniqueSorted(values) {
  return [...new Set(values)].sort();
}

function fingerprint(source) {
  return {
    methods: uniqueSorted([...source.matchAll(/^  ([A-Za-z_$][\w$]*)\s*\([^\n]*\)\s*\{/gm)].map((match) => match[1])),
    wxCalls: uniqueSorted([...source.matchAll(/wx\.([A-Za-z_$][\w$]*)\s*\(/g)].map((match) => match[1])),
    routes: uniqueSorted(source.match(/\/pages\/[A-Za-z0-9_-]+\/index/g) || []),
    copy: (source.match(/[\u3400-\u9fff]+/g) || []).sort()
  };
}

for (const base of pageBases) {
  const result = childProcess.spawnSync(process.execPath, ["--check", path.join(root, `${base}.js`)], {
    encoding: "utf8"
  });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(fingerprint(read(`${base}.js`)), fingerprint(read(`${base}.ts`)), `JS/TS mirror mismatch: ${base}`);
  assert.equal(read(`${base}.js`), read(`${base}.ts`), `JS/TS exact mirror mismatch: ${base}`);

  let definition = null;
  global.Page = (value) => { definition = value; };
  global.wx = new Proxy({}, { get: () => () => {} });
  const fullPath = path.join(root, `${base}.js`);
  delete require.cache[require.resolve(fullPath)];
  require(fullPath);
  for (const handler of uniqueSorted([...read(`${base}.wxml`).matchAll(/(?:bind|catch)[A-Za-z0-9:_-]+="([A-Za-z_$][\w$]*)"/g)].map((match) => match[1]))) {
    assert.equal(typeof definition[handler], "function", `Missing WXML handler: ${base}#${handler}`);
  }
}

const serviceCheck = childProcess.spawnSync(process.execPath, ["--check", path.join(root, `${serviceBase}.js`)], {
  encoding: "utf8"
});
assert.equal(serviceCheck.status, 0, serviceCheck.stderr);
assert.equal(read(`${serviceBase}.js`), read(`${serviceBase}.ts`), `JS/TS exact mirror mismatch: ${serviceBase}`);

for (const base of pageBases) {
  assert.doesNotMatch(read(`${base}.js`), /require\(["']\.\.\/\.\.\/data\/messages["']\)/, `${base} must read through services/messages`);
  assert.match(read(`${base}.js`), /require\(["']\.\.\/\.\.\/services\/messages["']\)/);
}

const messagesSource = ["js", "ts", "wxml"].map((extension) => read(`miniprogram/pages/messages/index.${extension}`)).join("\n");
assert.doesNotMatch(messagesSource, /\u5f85[^\n"']*\u6ce8\u518c|\u7b49\u5f85\u9879\u76ee\u58f3\u6ce8\u518c|\u672a\u6ce8\u518c/);
assert.match(read("miniprogram/pages/messages/index.js"), /\u8be6\u60c5\u9875\u6682\u65f6\u65e0\u6cd5\u6253\u5f00/);
assert.match(read("miniprogram/pages/messages/index.js"), /\u672c\u5730\u5df2\u8bfb\u72b6\u6001\u5df2\u66f4\u65b0/);

const detailStyle = read("miniprogram/pages/message-detail/index.wxss");
const sendRule = [...detailStyle.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
  .filter((match) => match[1].split(",").map((item) => item.trim()).includes(".send-button"))
  .map((match) => match[2])
  .join("\n");
const minHeight = sendRule.match(/(?:^|;)\s*min-height\s*:\s*(\d+)rpx/);
assert.ok(minHeight && Number(minHeight[1]) >= 88, ".send-button needs min-height >= 88rpx");
assert.doesNotMatch(sendRule, /(?:^|;)\s*height\s*:\s*\d+rpx/, ".send-button must not use fixed height");
assert.match(sendRule, /box-sizing\s*:\s*border-box/);
assert.match(sendRule, /padding\s*:/);
assert.match(read("miniprogram/pages/message-detail/index.wxml"), /<button[^>]*class="[^"]*\bsend-button\b[^"]*"[^>]*bindtap="onSendTap"/);

function styleRule(source, selector) {
  return [...source.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter((match) => match[1].split(",").map((item) => item.trim()).includes(selector))
    .map((match) => match[2])
    .join("\n");
}

const messagesStyle = read("miniprogram/pages/messages/index.wxss");
for (const [source, selector] of [
  [messagesStyle, ".scenario-chip"],
  [messagesStyle, ".state-button"],
  [messagesStyle, ".load-more-button"],
  [messagesStyle, ".category-chip"],
  [messagesStyle, ".unread-toggle"],
  [messagesStyle, ".mark-all"],
  [messagesStyle, ".read-action"],
  [detailStyle, ".scenario-chip"],
  [detailStyle, ".state-button"],
  [detailStyle, ".send-button"]
]) {
  const rule = styleRule(source, selector);
  const target = rule.match(/(?:^|;)\s*min-height\s*:\s*(\d+)rpx/);
  assert.ok(target && Number(target[1]) >= 88, `${selector} needs min-height >= 88rpx`);
}

const listPageSource = read("miniprogram/pages/messages/index.js");
const detailPageSource = read("miniprogram/pages/message-detail/index.js");
for (const state of ["loading", "empty", "error", "timeout", "offline", "unauthorized"]) {
  assert.match(`${listPageSource}\n${detailPageSource}`, new RegExp(`\\b${state}\\b`), `Missing visible state: ${state}`);
}
assert.match(listPageSource, /requestToken\s*!==\s*this\._listRequestToken/, "List needs stale request protection");
assert.match(detailPageSource, /requestToken\s*!==\s*this\._detailRequestToken/, "Detail needs stale request protection");
assert.match(listPageSource, /onRetryLoadMore/);
assert.match(read("miniprogram/pages/messages/index.wxml"), /pageErrorMessage/);
assert.match(detailPageSource, /sendState:\s*"duplicate"/);
assert.match(detailPageSource, /draftGeneration\s*!==\s*this\._draftGeneration/, "Draft validation needs stale outcome protection");
assert.match(read("miniprogram/pages/message-detail/index.wxml"), /仅校验草稿，不会发送/);

const serviceSource = read(`${serviceBase}.js`);
assert.equal((serviceSource.match(/requireAuthenticated\(session\)/g) || []).length, 3, "Every protected async service result needs post-await auth validation");
assert.match(serviceSource, /session\.generation\s*!==\s*expectedSession\.generation/, "Session equality must include generation for ABA protection");

const ownedSource = [
  ...pageBases.flatMap((base) => ["js", "ts", "wxml"].map((extension) => read(`${base}.${extension}`))),
  read(`${serviceBase}.js`),
  read(`${serviceBase}.ts`)
].join("\n");
assert.doesNotMatch(ownedSource, /wx\.(?:request|connectSocket|sendSocketMessage|uploadFile|downloadFile|login|getUserProfile|getPhoneNumber|requestSubscribeMessage|setStorage(?:Sync)?|getStorage(?:Sync)?|removeStorage(?:Sync)?|clearStorage(?:Sync)?|requestPayment|makePhoneCall)\s*\(/i);

async function verifyServiceBehavior() {
  const servicePath = path.join(root, `${serviceBase}.js`);
  delete require.cache[require.resolve(servicePath)];
  const messagesService = require(servicePath);

  messagesService.expireLocalDemo();
  await assert.rejects(
    messagesService.listMessages({ delayMs: 0 }),
    (error) => error.kind === "unauthorized" && error.code === "SESSION_EXPIRED"
  );

  const session = await messagesService.startLocalDemo({ delayMs: 0 });
  assert.equal(session.status, "authenticated");
  assert.equal(session.localOnly, true);
  assert.equal(session.persistent, false);

  const pendingListAfterExpiry = messagesService.listMessages({ delayMs: 30 });
  setTimeout(() => messagesService.expireLocalDemo(), 5);
  await assert.rejects(
    pendingListAfterExpiry,
    (error) => error.kind === "unauthorized" && error.code === "SESSION_EXPIRED"
  );
  await messagesService.startLocalDemo({ delayMs: 0 });

  const pendingDetailAfterExpiry = messagesService.getMessageDetail("conversation-001", { delayMs: 30 });
  setTimeout(() => messagesService.expireLocalDemo(), 5);
  await assert.rejects(
    pendingDetailAfterExpiry,
    (error) => error.kind === "unauthorized" && error.code === "SESSION_EXPIRED"
  );
  await messagesService.startLocalDemo({ delayMs: 0 });

  const pendingDraftAfterExpiry = messagesService.validateDraft("conversation-001", "想了解班次", { delayMs: 30 });
  setTimeout(() => messagesService.expireLocalDemo(), 5);
  await assert.rejects(
    pendingDraftAfterExpiry,
    (error) => error.kind === "unauthorized" && error.code === "SESSION_EXPIRED"
  );
  await messagesService.startLocalDemo({ delayMs: 0 });

  async function expectIdenticalReloginAbaRejected(operation) {
    const before = messagesService.sessionSnapshot();
    const pending = operation();
    await new Promise((resolve) => setTimeout(resolve, 5));
    messagesService.expireLocalDemo();
    await messagesService.startLocalDemo({ delayMs: 0 });
    const after = messagesService.sessionSnapshot();
    assert.equal(after.status, before.status);
    assert.equal(after.role, before.role);
    assert.equal(after.displayName, before.displayName);
    assert.ok(after.generation > before.generation);
    await assert.rejects(
      pending,
      (error) => error.kind === "unauthorized" && error.code === "SESSION_CHANGED"
    );
  }

  await expectIdenticalReloginAbaRejected(() => messagesService.listMessages({ delayMs: 40 }));
  await expectIdenticalReloginAbaRejected(() => messagesService.getMessageDetail("conversation-001", { delayMs: 40 }));
  await expectIdenticalReloginAbaRejected(() => messagesService.validateDraft("conversation-001", "想了解休息安排", { delayMs: 40 }));

  const firstPage = await messagesService.listMessages({ page: 1, pageSize: 2, delayMs: 0 });
  assert.equal(firstPage.items.length, 2);
  assert.equal(firstPage.hasMore, true);
  assert.equal(firstPage.nextPage, 2);
  const secondPage = await messagesService.listMessages({ page: 2, pageSize: 2, delayMs: 0 });
  assert.equal(secondPage.items.length, 2);
  assert.equal(secondPage.hasMore, false);
  assert.equal(new Set(firstPage.items.concat(secondPage.items).map((item) => item.id)).size, 4);

  const emptyPage = await messagesService.listMessages({ scenario: "empty", delayMs: 0 });
  assert.equal(emptyPage.items.length, 0);
  for (const [scenario, kind] of [["error", "server"], ["timeout", "timeout"], ["offline", "offline"], ["unauthorized", "unauthorized"]]) {
    await assert.rejects(
      messagesService.listMessages({ scenario, delayMs: 0 }),
      (error) => error.kind === kind,
      `Expected ${scenario} to map to ${kind}`
    );
  }

  const detail = await messagesService.getMessageDetail("conversation-001", { delayMs: 0 });
  assert.equal(detail.state, "success");
  assert.equal(detail.detail.kind, "conversation");
  const missingDetail = await messagesService.getMessageDetail("missing", { delayMs: 0 });
  assert.equal(missingDetail.state, "empty");
  assert.equal(missingDetail.detail, null);

  await assert.rejects(
    messagesService.validateDraft("conversation-001", "   ", { delayMs: 0 }),
    (error) => error.kind === "validation" && error.code === "DRAFT_REQUIRED"
  );
  const firstDraftCheck = messagesService.validateDraft("conversation-001", "想了解工作时间", { delayMs: 30 });
  await assert.rejects(
    messagesService.validateDraft("conversation-001", "重复点击", { delayMs: 0 }),
    (error) => error.code === "DUPLICATE_SUBMISSION"
  );
  const draftResult = await firstDraftCheck;
  assert.deepEqual(draftResult, {
    state: "validated",
    localOnly: true,
    saved: false,
    sent: false
  });

  let detailPageDefinition = null;
  global.Page = (value) => { detailPageDefinition = value; };
  const detailPagePath = path.join(root, "miniprogram/pages/message-detail/index.js");
  delete require.cache[require.resolve(detailPagePath)];
  require(detailPagePath);
  const detailPage = {
    ...detailPageDefinition,
    data: JSON.parse(JSON.stringify(detailPageDefinition.data)),
    setData(update) {
      Object.assign(this.data, update);
    }
  };
  detailPage._draftGeneration = 1;
  Object.assign(detailPage.data, {
    detail: { id: "conversation-001" },
    draft: "想了解工作时间",
    draftLength: 8,
    loadState: "ready",
    sendPending: false,
    sendState: "idle"
  });
  const pendingPageDraft = detailPage.onSendTap();
  detailPage.onDraftInput({ detail: { value: "   " } });
  await pendingPageDraft;
  assert.equal(detailPage.data.draft, "   ");
  assert.equal(detailPage.data.sendPending, false);
  assert.equal(detailPage.data.sendState, "validation-error");
  assert.doesNotMatch(detailPage.data.feedback, /本地校验完成/);
  assert.match(detailPage.data.feedback, /忽略旧校验结果/);
  messagesService.expireLocalDemo();
}

verifyServiceBehavior().then(() => {
  console.log("PASS messages service auth, pagination, empty, errors, and detail states");
  console.log("PASS guarded draft validation remains memory-only and never sent");
  console.log("PASS post-await auth expiry, identical-relogin ABA, and stale draft regressions");
  console.log("PASS messages JS syntax, exact JS/TS mirrors, and WXML handlers");
  console.log("PASS messages stale-request, retry, page-failure, and 88rpx checks");
  console.log("PASS messages forbidden real-service API scan");
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
