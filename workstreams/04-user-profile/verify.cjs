const assert = require("node:assert/strict");
const childProcess = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../..");
const pageBases = [
  "miniprogram/pages/profile/index",
  "miniprogram/pages/profile-login/index",
  "miniprogram/pages/profile-resume/index",
  "miniprogram/pages/profile-applications/index"
];
const authBase = "miniprogram/services/auth-session";

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function uniqueSorted(values) {
  return [...new Set(values)].sort();
}

function fingerprint(source) {
  return {
    methods: uniqueSorted([...source.matchAll(/^  (?:async )?([A-Za-z_$][\w$]*)\s*\([^\n]*\)\s*\{/gm)].map((match) => match[1])),
    wxCalls: uniqueSorted([...source.matchAll(/wx\.([A-Za-z_$][\w$]*)\s*\(/g)].map((match) => match[1])),
    routes: uniqueSorted(source.match(/\/pages\/[A-Za-z0-9_-]+\/index/g) || []),
    copy: (source.match(/[\u3400-\u9fff]+/g) || []).sort()
  };
}

function declarationsFor(source, selector) {
  return [...source.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter((match) => match[1].split(",").map((item) => item.trim()).includes(selector))
    .map((match) => match[2])
    .join("\n");
}

function loadPage(base, wxOverrides = {}) {
  let definition = null;
  global.Page = (value) => { definition = value; };
  global.wx = {
    navigateTo() {},
    showModal() {},
    showToast() {},
    ...wxOverrides
  };
  const fullPath = path.join(root, `${base}.js`);
  delete require.cache[require.resolve(fullPath)];
  require(fullPath);
  assert.ok(definition, `Page definition not found: ${base}`);
  const instance = {
    ...definition,
    data: JSON.parse(JSON.stringify(definition.data)),
    setData(values, callback) {
      Object.assign(this.data, values);
      if (typeof callback === "function") callback();
    }
  };
  return instance;
}

function assertFlexibleTarget(base, selector) {
  const declarations = declarationsFor(read(`${base}.wxss`), selector);
  const minHeight = declarations.match(/(?:^|;)\s*min-height\s*:\s*(\d+)rpx/);
  assert.ok(minHeight && Number(minHeight[1]) >= 88, `${base} ${selector} needs min-height >= 88rpx`);
  assert.doesNotMatch(declarations, /(?:^|;)\s*height\s*:\s*\d+rpx/, `${base} ${selector} must not use fixed height`);
  assert.match(declarations, /box-sizing\s*:\s*border-box/);
  assert.match(declarations, /padding\s*:/);
  const className = selector.slice(1);
  assert.match(read(`${base}.wxml`), new RegExp(`<button[\\s\\S]*?class="[^"]*\\b${className}\\b[^"]*"[\\s\\S]*?(?:bind|catch)tap="`));
}

async function verify() {
  for (const base of [...pageBases, authBase]) {
    const result = childProcess.spawnSync(process.execPath, ["--check", path.join(root, `${base}.js`)], {
      encoding: "utf8"
    });
    assert.equal(result.status, 0, result.stderr);
  }

  for (const base of pageBases) {
    assert.deepEqual(fingerprint(read(`${base}.js`)), fingerprint(read(`${base}.ts`)), `JS/TS mirror mismatch: ${base}`);
    const definition = loadPage(base);
    for (const handler of uniqueSorted([...read(`${base}.wxml`).matchAll(/(?:bind|catch)[A-Za-z0-9:_-]+="([A-Za-z_$][\w$]*)"/g)].map((match) => match[1]))) {
      assert.equal(typeof definition[handler], "function", `Missing WXML handler: ${base}#${handler}`);
    }
  }
  assert.equal(read(`${authBase}.js`), read(`${authBase}.ts`), "auth-session JS/TS must be exact mirrors");
  assert.deepEqual(
    fingerprint(read("miniprogram/data/profile.js")),
    fingerprint(read("miniprogram/data/profile.ts")),
    "profile data JS/TS mirror mismatch"
  );

  const authSource = read(`${authBase}.js`);
  assert.match(authSource, /createMockRuntime/);
  assert.match(authSource, /createSubmissionGuard/);
  assert.match(authSource, /persistent:\s*false/);
  const authPath = path.join(root, `${authBase}.js`);
  delete require.cache[require.resolve(authPath)];
  const authSession = require(authPath);
  assert.equal(require(authPath), authSession, "auth-session must be a module singleton");
  assert.deepEqual([...authSession.SESSION_STATES], ["anonymous", "loading", "authenticated", "expired"]);
  assert.deepEqual([...authSession.SESSION_ROLES], ["seeker", "employer"]);

  const initialSnapshot = authSession.logout();
  assert.deepEqual(initialSnapshot, {
    status: "anonymous",
    role: "seeker",
    displayName: "",
    localOnly: true,
    persistent: false,
    generation: 0
  });
  assert.ok(Object.isFrozen(initialSnapshot));
  assert.equal(Number.isInteger(initialSnapshot.generation), true);
  assert.equal(Object.getOwnPropertyDescriptor(initialSnapshot, "generation").writable, false);
  const firstLogin = authSession.demoLogin({ delayMs: 25 });
  await Promise.resolve();
  assert.equal(authSession.snapshot().status, "loading");
  assert.equal(authSession.snapshot().generation, 1);
  await assert.rejects(
    authSession.demoLogin({ delayMs: 0 }),
    (error) => error.code === "DUPLICATE_SUBMISSION" && authSession.messageForError(error).includes("请勿重复")
  );
  await firstLogin;
  assert.equal(authSession.snapshot().status, "authenticated");
  assert.equal(authSession.snapshot().generation, 2);
  const employerSession = authSession.setRole("employer");
  assert.equal(authSession.snapshot().role, "employer");
  assert.equal(employerSession.generation, 3);
  assert.equal(authSession.setRole("employer").generation, employerSession.generation);
  const expiredSession = authSession.expire();
  assert.equal(authSession.snapshot().status, "expired");
  assert.equal(expiredSession.generation, 4);
  const loggedOutSession = authSession.logout();
  assert.equal(authSession.snapshot().status, "anonymous");
  assert.equal(loggedOutSession.generation, 5);
  await assert.rejects(Promise.resolve().then(() => authSession.setRole("admin")), /不支持这个本地角色/);

  for (const [scenario, expectedStatus, expectedMessage] of [
    ["timeout", "anonymous", "请求超时"],
    ["offline", "anonymous", "当前网络不可用"],
    ["unauthorized", "expired", "登录已失效"]
  ]) {
    authSession.logout();
    await assert.rejects(
      authSession.demoLogin({ scenario, delayMs: 0 }),
      (error) => authSession.messageForError(error).includes(expectedMessage)
    );
    assert.equal(authSession.snapshot().status, expectedStatus, `${scenario} state mismatch`);
  }

  authSession.logout();
  const authenticatedBeforeAba = await authSession.demoLogin({ delayMs: 0 });
  const expiredDuringAba = authSession.expire();
  assert.equal(expiredDuringAba.generation, authenticatedBeforeAba.generation + 1);
  const identicalRelogin = authSession.demoLogin({ delayMs: 0 });
  await Promise.resolve();
  assert.equal(authSession.snapshot().generation, expiredDuringAba.generation + 1);
  const authenticatedAfterAba = await identicalRelogin;
  const { generation: beforeGeneration, ...beforeVisibleFields } = authenticatedBeforeAba;
  const { generation: afterGeneration, ...afterVisibleFields } = authenticatedAfterAba;
  assert.deepEqual(afterVisibleFields, beforeVisibleFields);
  assert.equal(afterGeneration, expiredDuringAba.generation + 2);
  assert.ok(afterGeneration > beforeGeneration);

  authSession.logout();
  const loginPage = loadPage("miniprogram/pages/profile-login/index");
  loginPage.onShow();
  loginPage.onAgreementsChange({ detail: { value: ["terms"] } });
  assert.equal(loginPage.data.allAgreed, false);
  loginPage.onAgreementsChange({ detail: { value: ["terms", "privacy"] } });
  assert.equal(loginPage.data.allAgreed, true);
  const pageLogin = loginPage.onDemoLoginTap();
  await Promise.resolve();
  assert.equal(loginPage.data.submitting, true);
  assert.equal(loginPage.data.sessionStatus, "loading");
  await loginPage.onDemoLoginTap();
  assert.match(loginPage.data.feedback, /请勿重复/);
  await pageLogin;
  assert.equal(loginPage.data.submitting, false);
  assert.equal(loginPage.data.sessionStatus, "authenticated");
  loginPage.onExpireTap();
  assert.equal(loginPage.data.sessionStatus, "expired");
  loginPage.onLogoutTap();
  assert.equal(loginPage.data.sessionStatus, "anonymous");
  assert.equal(loginPage.data.allAgreed, false);

  authSession.logout();
  const anonymousNavigations = [];
  const anonymousProfile = loadPage("miniprogram/pages/profile/index", {
    navigateTo(options) { anonymousNavigations.push(options.url); }
  });
  anonymousProfile.onShow();
  assert.equal(anonymousProfile.data.sessionStatus, "anonymous");
  anonymousProfile.onRoleTap({ currentTarget: { dataset: { role: "employer" } } });
  assert.equal(anonymousNavigations.at(-1), "/pages/profile-login/index");
  assert.equal(authSession.snapshot().role, "seeker");

  await authSession.demoLogin({ delayMs: 0 });
  const authenticatedNavigations = [];
  const authenticatedProfile = loadPage("miniprogram/pages/profile/index", {
    navigateTo(options) { authenticatedNavigations.push(options.url); }
  });
  authenticatedProfile.onShow();
  assert.equal(authenticatedProfile.data.sessionStatus, "authenticated");
  authenticatedProfile.onRoleTap({ currentTarget: { dataset: { role: "employer" } } });
  assert.equal(authenticatedNavigations.at(-1), "/pages/employer/index");
  assert.equal(authSession.snapshot().role, "employer");
  authenticatedProfile.onShow();
  assert.equal(authenticatedProfile.data.activeRole, "employer");
  authSession.expire();
  authenticatedProfile.onShow();
  assert.equal(authenticatedProfile.data.sessionStatus, "expired");
  assert.match(authenticatedProfile.data.loginActionText, /重新体验/);

  const profileSource = ["js", "ts", "wxml"].map((extension) => read(`miniprogram/pages/profile/index.${extension}`)).join("\n");
  assert.doesNotMatch(profileSource, /待[^\n"']*注册|等待项目壳注册|未注册/);
  assert.match(read("miniprogram/pages/profile/index.js"), /页面暂时无法打开/);
  assert.match(read("miniprogram/data/profile.js"), /employer:\s*"\/pages\/employer\/index"/);

  const loginSource = [
    read("miniprogram/data/profile.js"),
    read("miniprogram/pages/profile-login/index.js"),
    read("miniprogram/pages/profile-login/index.wxml")
  ].join("\n");
  assert.match(loginSource, /用户协议/);
  assert.match(loginSource, /隐私说明/);
  assert.match(loginSource, /不收集手机号、身份证号、头像、昵称、定位/);
  assert.match(loginSource, /退出演示或重新加载小程序后即清除/);
  assert.match(loginSource, /请勿在本页输入手机号、身份证号、住址等敏感信息/);
  assert.match(read("miniprogram/pages/profile-login/index.wxml"), /disabled="\{\{submitting \|\| !allAgreed\}\}"/);
  assert.match(read("miniprogram/pages/profile-login/index.wxml"), /item\.id === 'privacy' && privacyExpanded/);

  const touchTargets = [
    ["miniprogram/pages/profile/index", ".login-button"],
    ["miniprogram/pages/profile-applications/index", ".contact-button"],
    ["miniprogram/pages/profile-login/index", ".primary-button"],
    ["miniprogram/pages/profile-login/index", ".secondary-button"],
    ["miniprogram/pages/profile-login/index", ".text-button"],
    ["miniprogram/pages/profile-login/index", ".scenario-button"],
    ["miniprogram/pages/profile-login/index", ".detail-button"],
    ["miniprogram/pages/profile-resume/index", ".primary-button"],
    ["miniprogram/pages/profile-resume/index", ".secondary-button"],
    ["miniprogram/pages/profile-resume/index", ".text-button"]
  ];
  for (const [base, selector] of touchTargets) assertFlexibleTarget(base, selector);
  const roleTarget = declarationsFor(read("miniprogram/pages/profile/index.wxss"), ".role-card");
  assert.match(roleTarget, /min-height\s*:\s*(?:8[8-9]|9\d|1\d\d)rpx/);

  const ownedSource = [
    ...pageBases.flatMap((base) => ["js", "ts", "wxml"].map((extension) => read(`${base}.${extension}`))),
    read(`${authBase}.js`),
    read(`${authBase}.ts`),
    read("miniprogram/data/profile.js"),
    read("miniprogram/data/profile.ts")
  ].join("\n");
  assert.doesNotMatch(ownedSource, /wx\.(?:request|connectSocket|sendSocketMessage|uploadFile|downloadFile|login|getUserProfile|getPhoneNumber|requestSubscribeMessage|setStorage(?:Sync)?|getStorage(?:Sync)?|removeStorage(?:Sync)?|clearStorage(?:Sync)?|requestPayment|makePhoneCall)\s*\(/i);
  assert.doesNotMatch(ownedSource, /(?:1[3-9]\d{9})|(?:\d{17}[\dXx])/);
  assert.doesNotMatch(loginSource, /绝对安全|永久保存|保证通过|法律认证/);

  console.log("PASS profile JS syntax, JS/TS mirrors, and WXML handlers");
  console.log("PASS auth-session singleton transitions, generation ABA guard, and error scenarios");
  console.log("PASS dual-agreement gate, login events, expiry, and logout");
  console.log("PASS profile onShow recovery and seeker/employer navigation");
  console.log("PASS 10 flexible 88rpx button targets and profile role targets");
  console.log("PASS forbidden APIs, sensitive literals, and misleading legal-copy scan");
}

verify().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
