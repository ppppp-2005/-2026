#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const PHASES = ["DEFINE", "PLAN", "BUILD", "VERIFY", "REVIEW", "SHIP"];
const STATES = ["queued", "active", "waiting", "blocked", "ready_for_review", "accepted", "shipped", "archived"];
const PRIORITIES = ["P0", "P1", "P2", "P3"];
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = path.resolve(SCRIPT_DIR, "../../../..");
const MIGRATION_NAME = "initial-migration-2026-06-18";
let temporaryFileCounter = 0;

const INITIAL_STATES = {
  "00-main-control": initialState({
    title: "总控与上下文治理",
    phase: "BUILD",
    state: "active",
    priority: "P0",
    currentSlice: "context-governance-v1",
    ownerThreadId: "current-main-thread",
    summary: "正在建立持久化记忆、精简交接、本地检索和自动状态快照。",
    nextAction: "完成上下文 CLI、全量迁移、验证和独立前向测试。",
    tags: ["control", "memory", "rag", "workflow"],
    codePaths: [
      ".codex/skills/workstream-delegation/**",
      "docs/blueprint/**",
      "workstreams/00-main-control/**"
    ]
  }),
  "01-project-shell": initialState({
    title: "微信小程序项目骨架",
    phase: "VERIFY",
    state: "waiting",
    priority: "P1",
    currentSlice: "shell-and-route-integration-v1",
    ownerThreadId: "019ed762-0a59-79b3-92f3-3096ae0b71b4",
    summary: "四个 Tab、全局配置、占位页和七条普通页面路由已完成静态集成。",
    nextAction: "在微信开发者工具中编译并验证四个 Tab、十一条路由和返回栈。",
    blockers: ["等待微信开发者工具人工验收"],
    evidence: [qualityEvidence("路由、Tab 和 JSON 静态复查通过")],
    tags: ["shell", "routes", "tabs", "wechat"],
    codePaths: [
      "miniprogram/app.json",
      "miniprogram/app.js",
      "miniprogram/app.ts",
      "miniprogram/app.wxss",
      "miniprogram/project.config.json",
      "miniprogram/project.private.config.json",
      "miniprogram/sitemap.json",
      "miniprogram/pages/messages/**",
      "miniprogram/pages/profile/**"
    ]
  }),
  "02-home-ui": initialState({
    title: "首页静态 UI 与入口",
    phase: "VERIFY",
    state: "waiting",
    priority: "P1",
    currentSlice: "home-eight-entry-integration-v1",
    ownerThreadId: "019ed762-3fb0-7f51-8c02-87adc6010beb",
    summary: "首页静态 UI、八个入口、Tab 与普通页面跳转以及未开放反馈均已完成。",
    nextAction: "在微信开发者工具中验证八个入口、四个提示和窄屏布局。",
    blockers: ["等待微信开发者工具人工验收"],
    dependencies: ["01-project-shell"],
    evidence: [qualityEvidence("首页入口契约、事件绑定和数据镜像复验通过")],
    tags: ["home", "navigation", "ui"],
    codePaths: ["miniprogram/pages/home/**", "miniprogram/data/home.js", "miniprogram/data/home.ts"]
  }),
  "03-jobs": initialState({
    title: "职位页静态 UI",
    phase: "VERIFY",
    state: "waiting",
    priority: "P1",
    currentSlice: "jobs-static-ui-v1",
    ownerThreadId: "019ed795-a34f-7513-bc1e-e38e79391147",
    summary: "职位列表、专区、筛选入口和示例岗位卡片已完成，真实搜索、详情和投递未实现。",
    nextAction: "在微信开发者工具中打开职位 Tab 并完成截图验收。",
    blockers: ["等待职位页人工截图验收"],
    dependencies: ["01-project-shell"],
    evidence: [qualityEvidence("职位页面文件、语法和路由静态检查通过")],
    tags: ["jobs", "listing", "mock"],
    codePaths: ["miniprogram/pages/jobs/**", "miniprogram/data/jobs.js", "miniprogram/data/jobs.ts"]
  }),
  "05-employer": featureState({
    title: "企业招人静态页",
    currentSlice: "employer-static-page-v1",
    ownerThreadId: "019ed96c-f865-7ea1-8f4c-97b9166bd18d",
    summary: "企业状态、在招岗位和未开放操作反馈已完成，真实认证与发布未实现。",
    nextAction: "人工验证企业页布局、入口和未开放提示。",
    tags: ["employer", "recruiting", "mock"],
    codePaths: ["miniprogram/pages/employer/**", "miniprogram/data/employer.js", "miniprogram/data/employer.ts"]
  }),
  "06-backend-api": initialState({
    title: "后端 API 与数据设计",
    phase: "DEFINE",
    state: "queued",
    priority: "P2",
    currentSlice: "backend-design-reserved",
    ownerThreadId: null,
    summary: "后端 workstream 已预留，当前没有服务器、数据库、鉴权或真实 API。",
    nextAction: "前端人工验收后创建新线程并确定技术栈、数据模型和 API 边界。",
    tags: ["backend", "api", "database", "auth"],
    codePaths: ["miniprogram/services/**", "docs/blueprint/backend-design-placeholder.md"]
  }),
  "07-quality-review": initialState({
    title: "质量审查",
    phase: "REVIEW",
    state: "waiting",
    priority: "P0",
    currentSlice: "static-front-end-review-v1",
    ownerThreadId: "019ed97b-e688-7222-b183-6343d9bc58db",
    summary: "静态复查通过且四个 P1 已清零，最终 SHIP 仍等待微信开发者工具人工验证。",
    nextAction: "执行编译、导航、交互、320px 窄屏和大字体人工验收。",
    blockers: ["等待微信开发者工具人工验收"],
    dependencies: [
      "01-project-shell", "02-home-ui", "03-jobs", "05-employer", "08-skill-training",
      "09-policy", "10-campus", "11-labor-info", "12-return-home", "13-training-signup"
    ],
    evidence: [qualityEvidence("P0/P1 清零，24 个事件绑定、8 组数据镜像和全部 JSON 通过")],
    tags: ["quality", "review", "verification"],
    codePaths: ["workstreams/07-quality-review/**"]
  }),
  "08-skill-training": featureState({
    title: "技能培训浏览页",
    currentSlice: "training-static-page-v1",
    ownerThreadId: "019ed96c-ee4e-71b1-9df8-87575cd78956",
    summary: "培训分类、课程卡片和诚实的本地反馈已完成，真实课程详情和报名未实现。",
    nextAction: "人工验证课程筛选、长文本和窄屏布局。",
    tags: ["training", "courses", "mock"],
    codePaths: ["miniprogram/pages/training/**", "miniprogram/data/training.js", "miniprogram/data/training.ts"]
  }),
  "09-policy": featureState({
    title: "就业政策展示页",
    currentSlice: "policy-static-page-v1",
    ownerThreadId: "019ed96c-ff49-7ae0-8dd4-d77b67bbdb13",
    summary: "政策分类、展开内容和示例咨询反馈已完成，权威实时政策接口未实现。",
    nextAction: "人工验证分类、展开收起、弹窗和长文本换行。",
    tags: ["policy", "content", "mock"],
    codePaths: ["miniprogram/pages/policy/**", "miniprogram/data/policy.js", "miniprogram/data/policy.ts"]
  }),
  "10-campus": featureState({
    title: "校园招聘与实习页",
    currentSlice: "campus-static-page-v1",
    ownerThreadId: "019ed96d-18bd-7600-b8ec-0f43628eb567",
    summary: "双选会、岗位、实习筛选和诚实的未开放反馈已完成，详情与投递未实现。",
    nextAction: "人工验证筛选、状态按钮和窄屏标题布局。",
    tags: ["campus", "internship", "jobs", "mock"],
    codePaths: ["miniprogram/pages/campus/**", "miniprogram/data/campus.js", "miniprogram/data/campus.ts"]
  }),
  "11-labor-info": featureState({
    title: "用工信息页",
    currentSlice: "labor-static-page-v1",
    ownerThreadId: "019ed96d-0b84-7c82-a8cf-6582bd281c38",
    summary: "用工分类、需求列表和示例联系弹窗已完成，真实岗位与联系流程未实现。",
    nextAction: "人工验证筛选、联系弹窗和三列事实区域。",
    tags: ["labor", "demand", "contact", "mock"],
    codePaths: ["miniprogram/pages/labor/**", "miniprogram/data/labor.js", "miniprogram/data/labor.ts"]
  }),
  "12-return-home": featureState({
    title: "返乡专区",
    currentSlice: "return-home-static-page-v1",
    ownerThreadId: "019ed96d-0545-7aa1-97d9-a60ff297d773",
    summary: "返乡岗位、创业支持、服务分类和本地反馈已完成，真实办理流程未实现。",
    nextAction: "人工验证地区筛选、三列分类和全部提示。",
    tags: ["return-home", "startup", "services", "mock"],
    codePaths: ["miniprogram/pages/return-home/**", "miniprogram/data/return-home.js", "miniprogram/data/return-home.ts"]
  }),
  "13-training-signup": featureState({
    title: "培训班次与报名状态页",
    currentSlice: "training-signup-static-page-v1",
    ownerThreadId: "019ed96d-1300-7c43-9f07-9c78a382bba9",
    summary: "班次、状态筛选和诚实的报名未开放提示已完成，表单、提交和持久化未实现。",
    nextAction: "人工验证状态筛选、未开放提示和窄屏状态布局。",
    tags: ["training", "signup", "mock"],
    codePaths: [
      "miniprogram/pages/training-signup/**",
      "miniprogram/data/training-signup.js",
      "miniprogram/data/training-signup.ts"
    ]
  })
};

function initialState(overrides) {
  return {
    schemaVersion: 1,
    workstream: "",
    title: "",
    phase: "DEFINE",
    state: "queued",
    priority: "P2",
    currentSlice: "initial-slice",
    ownerThreadId: null,
    summary: "",
    nextAction: "",
    blockers: [],
    dependencies: [],
    evidence: [],
    tags: [],
    codePaths: [],
    updatedAt: "2026-06-18T19:18:00+08:00",
    handoffRef: "HANDOFF.md",
    ...overrides
  };
}

function featureState(overrides) {
  return initialState({
    phase: "VERIFY",
    state: "waiting",
    priority: "P1",
    blockers: ["等待微信开发者工具人工验收"],
    dependencies: ["01-project-shell", "02-home-ui"],
    evidence: [qualityEvidence("页面、路由、数据镜像和事件绑定静态复查通过")],
    ...overrides
  });
}

function qualityEvidence(summary) {
  return {
    kind: "static-review",
    status: "passed",
    summary,
    ref: "workstreams/07-quality-review/HANDOFF.md"
  };
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function slash(value) {
  return value.split(path.sep).join("/");
}

async function readText(file) {
  return readFile(file, "utf8");
}

async function writeTextIfChanged(file, content) {
  await mkdir(path.dirname(file), { recursive: true });
  if (existsSync(file) && await readText(file) === content) return false;
  const temporary = `${file}.tmp-${process.pid}-${temporaryFileCounter++}`;
  try {
    await writeFile(temporary, content, "utf8");
    await rename(temporary, file);
  } catch (error) {
    await rm(temporary, { force: true });
    throw error;
  }
  return true;
}

async function writeJson(file, value) {
  return writeTextIfChanged(file, `${JSON.stringify(value, null, 2)}\n`);
}

async function walkFiles(dir) {
  if (!existsSync(dir)) return [];
  const output = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) output.push(...await walkFiles(full));
    else if (entry.isFile()) output.push(full);
  }
  return output.sort((a, b) => slash(a).localeCompare(slash(b), "en"));
}

async function listWorkstreams(root) {
  const base = path.join(root, "workstreams");
  const entries = await readdir(base, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory() && /^\d{2}-/.test(entry.name))
    .map((entry) => ({ id: entry.name, dir: path.join(base, entry.name) }))
    .sort((a, b) => a.id.localeCompare(b.id, "en"));
}

function firstOpenTask(text) {
  const match = text.match(/^\s*- \[ \]\s+(.+)$/m);
  return match ? match[1].trim() : "由总控确认下一步。";
}

function firstSummary(text) {
  return text.split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line && !line.startsWith("#") && !line.startsWith("-") && !line.startsWith(">"))
    ?? "现有记录已迁移，等待总控确认当前状态。";
}

async function inferState(item) {
  const tasks = await readText(path.join(item.dir, "TASKS.md"));
  const handoff = await readText(path.join(item.dir, "HANDOFF.md"));
  return initialState({
    workstream: item.id,
    title: item.id,
    phase: "VERIFY",
    state: "waiting",
    priority: "P2",
    currentSlice: "migrated-slice",
    summary: firstSummary(handoff),
    nextAction: firstOpenTask(tasks),
    blockers: ["迁移状态需要总控复核"],
    tags: item.id.split("-").slice(1),
    codePaths: []
  });
}

function compactTasks(state) {
  const open = ["shipped", "archived"].includes(state.state)
    ? ""
    : `- [ ] ${state.nextAction}\n`;
  return `# ${state.workstream} TASKS\n\n> 当前任务只保留活跃切片；迁移前的完整清单见 \`archive/${MIGRATION_NAME}/TASKS.md\`。\n\n## Current Slice\n\n- Slice: \`${state.currentSlice}\`\n- Phase: \`${state.phase}\`\n- State: \`${state.state}\`\n${open}\n## Completed Summary\n\n- [x] 迁移前的详细任务已归档。\n`;
}

function compactHandoff(state) {
  const evidence = state.evidence.length
    ? state.evidence.map((item) => `- ${item.status}: ${item.summary}（${item.ref}）`).join("\n")
    : "- 暂无验证证据。";
  const blockers = state.blockers.length ? state.blockers.map((item) => `- ${item}`).join("\n") : "- 无。";
  const paths = state.codePaths.length ? state.codePaths.map((item) => `- \`${item}\``).join("\n") : "- 无功能代码路径。";
  return `# ${state.workstream} HANDOFF\n\n> 仅保留最新交接摘要；迁移前完整记录见 \`archive/${MIGRATION_NAME}/HANDOFF.md\`。\n\n## Result\n\n${state.summary}\n\n- Phase: \`${state.phase}\`\n- State: \`${state.state}\`\n- Slice: \`${state.currentSlice}\`\n\n## Changed Scope\n\n${paths}\n\n## Verification\n\n${evidence}\n\n## Risks And Blockers\n\n${blockers}\n\n## Next Action\n\n${state.nextAction}\n`;
}

async function archiveOriginal(source, destination) {
  const content = await readText(source);
  if (existsSync(destination)) {
    if (await readText(destination) !== content) {
      throw new Error(`Archive collision: ${destination}`);
    }
    return false;
  }
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, content, "utf8");
  return true;
}

async function migrate(root) {
  let migrated = 0;
  for (const item of await listWorkstreams(root)) {
    const stateFile = path.join(item.dir, "STATE.json");
    if (existsSync(stateFile)) continue;
    const archiveDir = path.join(item.dir, "archive", MIGRATION_NAME);
    await archiveOriginal(path.join(item.dir, "TASKS.md"), path.join(archiveDir, "TASKS.md"));
    await archiveOriginal(path.join(item.dir, "HANDOFF.md"), path.join(archiveDir, "HANDOFF.md"));
    const state = { ...(INITIAL_STATES[item.id] ?? await inferState(item)), workstream: item.id };
    await writeJson(stateFile, state);
    await writeTextIfChanged(path.join(item.dir, "TASKS.md"), compactTasks(state));
    await writeTextIfChanged(path.join(item.dir, "HANDOFF.md"), compactHandoff(state));
    migrated += 1;
  }
  console.log(`Migrated ${migrated} workstream(s).`);
  await refresh(root);
}

export function validateState(state, expectedId = state?.workstream) {
  const errors = [];
  const requiredStrings = ["workstream", "title", "phase", "state", "priority", "currentSlice", "summary", "nextAction", "updatedAt", "handoffRef"];
  for (const key of requiredStrings) {
    if (typeof state?.[key] !== "string" || !state[key].trim()) errors.push(`${expectedId}: ${key} must be a non-empty string`);
  }
  if (state?.schemaVersion !== 1) errors.push(`${expectedId}: schemaVersion must be 1`);
  if (state?.workstream !== expectedId) errors.push(`${expectedId}: workstream does not match directory`);
  if (!PHASES.includes(state?.phase)) errors.push(`${expectedId}: invalid phase ${state?.phase}`);
  if (!STATES.includes(state?.state)) errors.push(`${expectedId}: invalid state ${state?.state}`);
  if (!PRIORITIES.includes(state?.priority)) errors.push(`${expectedId}: invalid priority ${state?.priority}`);
  if (!(state?.ownerThreadId === null || typeof state?.ownerThreadId === "string")) errors.push(`${expectedId}: ownerThreadId must be string or null`);
  for (const key of ["blockers", "dependencies", "evidence", "tags", "codePaths"]) {
    if (!Array.isArray(state?.[key])) errors.push(`${expectedId}: ${key} must be an array`);
  }
  for (const key of ["blockers", "dependencies", "tags", "codePaths"]) {
    if (Array.isArray(state?.[key]) && state[key].some((value) => typeof value !== "string" || !value.trim())) {
      errors.push(`${expectedId}: ${key} must contain non-empty strings`);
    }
  }
  if (Array.isArray(state?.dependencies)) {
    if (state.dependencies.includes(expectedId)) errors.push(`${expectedId}: workstream cannot depend on itself`);
    if (new Set(state.dependencies).size !== state.dependencies.length) errors.push(`${expectedId}: dependencies must be unique`);
  }
  if (Array.isArray(state?.evidence)) {
    for (const [index, item] of state.evidence.entries()) {
      if (!item || typeof item !== "object") {
        errors.push(`${expectedId}: evidence[${index}] must be an object`);
        continue;
      }
      for (const key of ["kind", "status", "summary", "ref"]) {
        if (typeof item[key] !== "string" || !item[key].trim()) errors.push(`${expectedId}: evidence[${index}].${key} must be a non-empty string`);
      }
      if (!["passed", "failed", "pending"].includes(item.status)) errors.push(`${expectedId}: evidence[${index}].status is invalid`);
    }
  }
  if (typeof state?.updatedAt === "string" && Number.isNaN(Date.parse(state.updatedAt))) errors.push(`${expectedId}: updatedAt must be an ISO date-time`);
  if (state?.state === "blocked" && state?.blockers?.length === 0) errors.push(`${expectedId}: blocked state requires blockers`);
  if (state?.phase === "SHIP" && !["shipped", "archived"].includes(state?.state)) errors.push(`${expectedId}: SHIP phase requires shipped or archived state`);
  if (["shipped", "archived"].includes(state?.state) && state?.phase !== "SHIP") errors.push(`${expectedId}: shipped/archived state requires SHIP phase`);
  if (["VERIFY", "REVIEW", "SHIP"].includes(state?.phase) && state?.evidence?.length === 0) errors.push(`${expectedId}: ${state.phase} requires verification evidence`);
  return errors;
}

async function loadStates(root) {
  const states = [];
  for (const item of await listWorkstreams(root)) {
    const file = path.join(item.dir, "STATE.json");
    if (!existsSync(file)) throw new Error(`${item.id}: missing STATE.json; run migrate`);
    states.push({ item, state: JSON.parse(await readText(file)) });
  }
  return states;
}

async function validateRepository(root, { quiet = false } = {}) {
  const rows = await loadStates(root);
  const ids = new Set(rows.map(({ item }) => item.id));
  const errors = [];
  const warnings = [];
  const owners = new Map();
  for (const { item, state } of rows) {
    errors.push(...validateState(state, item.id));
    for (const dependency of state.dependencies ?? []) {
      if (!ids.has(dependency)) errors.push(`${item.id}: unknown dependency ${dependency}`);
    }
    if (state.ownerThreadId && !["shipped", "archived"].includes(state.state)) {
      if (owners.has(state.ownerThreadId)) errors.push(`${item.id}: owner thread also assigned to ${owners.get(state.ownerThreadId)}`);
      owners.set(state.ownerThreadId, item.id);
    }
    for (const filename of ["SPEC.md", "TASKS.md", "HANDOFF.md"]) {
      if (!existsSync(path.join(item.dir, filename))) errors.push(`${item.id}: missing ${filename}`);
    }
    const tasks = await readText(path.join(item.dir, "TASKS.md"));
    const openCount = (tasks.match(/^\s*- \[ \]/gm) ?? []).length;
    if (["shipped", "archived"].includes(state.state) && openCount > 0) errors.push(`${item.id}: shipped workstream has open tasks`);
    if (!["shipped", "archived"].includes(state.state) && openCount === 0) errors.push(`${item.id}: active workstream has no open task`);
    for (const filename of ["TASKS.md", "HANDOFF.md"]) {
      const lines = (await readText(path.join(item.dir, filename))).split(/\r?\n/).length;
      if (lines > 80) warnings.push(`${item.id}: ${filename} has ${lines} lines; archive and compact it`);
    }
  }
  if (!quiet) {
    for (const warning of warnings) console.warn(`WARN ${warning}`);
    for (const error of errors) console.error(`ERROR ${error}`);
    console.log(`Validated ${rows.length} workstream(s): ${errors.length} error(s), ${warnings.length} warning(s).`);
  }
  return { errors, warnings, rows };
}

function escapeCell(value) {
  return String(value ?? "").replaceAll("|", "\\|").replace(/\r?\n/g, " ");
}

function statusMarkdown(rows) {
  const updatedAt = rows.map(({ state }) => state.updatedAt).sort().at(-1);
  const lines = [
    "# Workstream Status",
    "",
    "> AUTO-GENERATED by `context.mjs refresh`. Do not edit manually.",
    "",
    `Source snapshot: ${updatedAt}`,
    "",
    "| Workstream | Phase | State | Priority | Owner | Current slice | Blocker | Next action |",
    "|---|---|---|---|---|---|---|---|"
  ];
  for (const { state } of rows) {
    lines.push(`| ${escapeCell(state.workstream)} | ${state.phase} | ${state.state} | ${state.priority} | ${escapeCell(state.ownerThreadId ?? "-")} | ${escapeCell(state.currentSlice)} | ${escapeCell(state.blockers.join("；") || "-")} | ${escapeCell(state.nextAction)} |`);
  }
  lines.push("");
  return lines.join("\n");
}

function patternMatches(relative, pattern) {
  if (pattern.endsWith("/**")) return relative === pattern.slice(0, -3) || relative.startsWith(pattern.slice(0, -2));
  if (!pattern.includes("*")) return relative === pattern;
  const regex = new RegExp(`^${pattern.split("*").map(escapeRegex).join(".*")}$`);
  return regex.test(relative);
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function buildCodeMap(root, rows) {
  const candidates = [
    ...await walkFiles(path.join(root, "miniprogram")),
    ...await walkFiles(path.join(root, "docs", "blueprint")),
    ...await walkFiles(path.join(root, ".codex", "skills", "workstream-delegation"))
  ].filter((file) => !slash(path.relative(root, file)).includes("/context/"));
  const output = [];
  for (const { state } of rows) {
    const files = [];
    for (const file of candidates) {
      const relative = slash(path.relative(root, file));
      if (!state.codePaths.some((pattern) => patternMatches(relative, pattern))) continue;
      const metadata = await stat(file);
      const content = await readFile(file);
      files.push({ path: relative, bytes: metadata.size, sha256: sha256(content) });
    }
    output.push({ workstream: state.workstream, codePaths: state.codePaths, files });
  }
  return output;
}

function artifactFor(relative) {
  if (relative.endsWith("STATE.json")) return "state";
  if (relative.endsWith("SPEC.md")) return "spec";
  if (relative.endsWith("TASKS.md")) return "tasks";
  if (relative.endsWith("HANDOFF.md")) return "handoff";
  if (relative.endsWith("decisions.md")) return "decision";
  if (relative.includes("/archive/")) return "archive";
  return "blueprint";
}

function authorityFor(artifact, current) {
  if (artifact === "state") return 100;
  if (artifact === "decision") return 95;
  if (artifact === "handoff" && current) return 90;
  if (artifact === "spec" && current) return 85;
  if (artifact === "tasks" && current) return 80;
  if (artifact === "blueprint") return 70;
  if (artifact === "code-map") return 60;
  return 20;
}

function chunksForMarkdown(text) {
  const chunks = [];
  let heading = "Document";
  let lines = [];
  const flush = () => {
    const content = lines.join("\n").trim();
    if (content) chunks.push({ heading, content });
  };
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^(#{1,4})\s+(.+)$/);
    if (match) {
      flush();
      heading = match[2].trim();
      lines = [];
    } else {
      lines.push(line);
    }
  }
  flush();
  return chunks;
}

function normalizeContent(value) {
  return value.toLowerCase().replace(/`/g, "").replace(/\s+/g, " ").replace(/[^\p{L}\p{N} ]/gu, "").trim();
}

function shingles(value) {
  const text = normalizeContent(value);
  const words = text.split(" ").filter(Boolean);
  if (words.length > 3) return new Set(words.map((word, index) => words.slice(index, index + 3).join(" ")));
  const compact = text.replaceAll(" ", "");
  return new Set(Array.from({ length: Math.max(0, compact.length - 2) }, (_, index) => compact.slice(index, index + 3)));
}

function similarity(a, b) {
  const left = shingles(a);
  const right = shingles(b);
  if (!left.size || !right.size) return 0;
  let intersection = 0;
  for (const value of left) if (right.has(value)) intersection += 1;
  return intersection / (left.size + right.size - intersection);
}

export function dedupeRecords(records, threshold = 0.86) {
  const ranked = [...records].sort((a, b) => b.authority - a.authority || String(b.updatedAt).localeCompare(String(a.updatedAt)));
  const kept = [];
  const exact = new Set();
  for (const record of ranked) {
    const normalized = normalizeContent(record.content);
    const hash = sha256(normalized);
    if (exact.has(hash)) continue;
    const duplicate = normalized.length >= 100 && kept.some((other) =>
      other.workstream === record.workstream && similarity(other.content, record.content) >= threshold
    );
    if (duplicate) continue;
    exact.add(hash);
    kept.push(record);
  }
  return kept.sort((a, b) => a.path.localeCompare(b.path, "en") || a.heading.localeCompare(b.heading, "en"));
}

async function collectDocumentFiles(root) {
  const files = (await walkFiles(path.join(root, "docs", "blueprint"))).filter((file) => file.endsWith(".md"));
  for (const item of await listWorkstreams(root)) {
    for (const name of ["STATE.json", "SPEC.md", "TASKS.md", "HANDOFF.md"]) files.push(path.join(item.dir, name));
    const archiveDir = path.join(item.dir, "archive");
    files.push(...(await walkFiles(archiveDir)).filter((file) => file.endsWith(".md")));
  }
  return [...new Set(files)].sort((a, b) => slash(a).localeCompare(slash(b), "en"));
}

function workstreamFromPath(relative) {
  const match = relative.match(/^workstreams\/(\d{2}-[^/]+)/);
  return match ? match[1] : "global";
}

async function buildIndex(root, rows, codeMap) {
  const stateById = new Map(rows.map(({ state }) => [state.workstream, state]));
  const records = [];
  for (const file of await collectDocumentFiles(root)) {
    const relative = slash(path.relative(root, file));
    const workstream = workstreamFromPath(relative);
    const state = stateById.get(workstream);
    const artifact = artifactFor(relative);
    const current = !relative.includes("/archive/");
    const text = await readText(file);
    const chunks = artifact === "state"
      ? [{ heading: state?.title ?? workstream, content: [state?.summary, state?.nextAction, ...(state?.blockers ?? [])].filter(Boolean).join("\n") }]
      : chunksForMarkdown(text);
    for (const chunk of chunks) {
      const content = chunk.content.slice(0, 4000);
      const contentHash = sha256(normalizeContent(content));
      records.push({
        id: sha256(`${relative}|${chunk.heading}|${contentHash}`).slice(0, 20),
        workstream,
        artifact,
        current,
        authority: authorityFor(artifact, current),
        title: state?.title ?? path.basename(relative),
        path: relative,
        heading: chunk.heading,
        phase: state?.phase ?? null,
        state: state?.state ?? null,
        tags: state?.tags ?? ["blueprint"],
        updatedAt: state?.updatedAt ?? null,
        content,
        contentHash,
        truncated: chunk.content.length > content.length
      });
    }
  }
  for (const entry of codeMap) {
    const state = stateById.get(entry.workstream);
    const content = entry.files.map((file) => file.path).join("\n") || entry.codePaths.join("\n");
    records.push({
      id: sha256(`code-map|${entry.workstream}|${content}`).slice(0, 20),
      workstream: entry.workstream,
      artifact: "code-map",
      current: true,
      authority: authorityFor("code-map", true),
      title: state?.title ?? entry.workstream,
      path: "workstreams/00-main-control/context/code-map.json",
      heading: `${entry.workstream} code paths`,
      phase: state?.phase ?? null,
      state: state?.state ?? null,
      tags: state?.tags ?? [],
      updatedAt: state?.updatedAt ?? null,
      content,
      contentHash: sha256(normalizeContent(content)),
      truncated: false
    });
  }
  return dedupeRecords(records);
}

async function inputManifest(root, codeMap) {
  const paths = new Set(await collectDocumentFiles(root));
  for (const entry of codeMap) for (const file of entry.files) paths.add(path.join(root, file.path));
  const inputs = [];
  for (const file of [...paths].sort((a, b) => slash(a).localeCompare(slash(b), "en"))) {
    const metadata = await stat(file);
    inputs.push({ path: slash(path.relative(root, file)), bytes: metadata.size, mtimeMs: Math.trunc(metadata.mtimeMs) });
  }
  return { schemaVersion: 1, inputs, fingerprint: sha256(JSON.stringify(inputs)) };
}

async function refresh(root) {
  const result = await validateRepository(root, { quiet: true });
  if (result.errors.length) throw new Error(`Validation failed:\n${result.errors.join("\n")}`);
  const contextDir = path.join(root, "workstreams", "00-main-control", "context");
  const codeMap = await buildCodeMap(root, result.rows);
  const index = await buildIndex(root, result.rows, codeMap);
  await writeTextIfChanged(path.join(root, "workstreams", "00-main-control", "STATUS.md"), statusMarkdown(result.rows));
  await writeJson(path.join(contextDir, "code-map.json"), { schemaVersion: 1, workstreams: codeMap });
  await writeTextIfChanged(path.join(contextDir, "index.jsonl"), `${index.map((record) => JSON.stringify(record)).join("\n")}\n`);
  await writeJson(path.join(contextDir, "manifest.json"), await inputManifest(root, codeMap));
  console.log(`Refreshed status and ${index.length} index record(s).`);
}

function queryTerms(query) {
  const terms = new Set(query.toLowerCase().split(/\s+/).filter(Boolean));
  for (const match of query.toLowerCase().matchAll(/[\p{Script=Han}]{2,}/gu)) {
    for (let index = 0; index < match[0].length - 1; index += 1) terms.add(match[0].slice(index, index + 2));
  }
  return [...terms];
}

export function scoreRecord(record, query) {
  if (!query.trim()) return record.authority / 5 + (record.current ? 5 : 0);
  const exact = query.toLowerCase();
  const title = `${record.title} ${record.heading}`.toLowerCase();
  const tags = record.tags.join(" ").toLowerCase();
  const file = record.path.toLowerCase();
  const content = record.content.toLowerCase();
  let score = content.includes(exact) || title.includes(exact) ? 30 : 0;
  for (const term of queryTerms(query)) {
    if (title.includes(term)) score += 12;
    if (tags.includes(term)) score += 8;
    if (file.includes(term)) score += 6;
    if (content.includes(term)) score += 2;
  }
  if (record.current) score += 5;
  score += record.authority / 5;
  return score;
}

function snippet(record, query) {
  const content = record.content.replace(/\s+/g, " ").trim();
  const terms = queryTerms(query);
  const lower = content.toLowerCase();
  let position = terms.map((term) => lower.indexOf(term)).filter((index) => index >= 0).sort((a, b) => a - b)[0] ?? 0;
  position = Math.max(0, position - 120);
  const value = content.slice(position, position + 520);
  return `${position > 0 ? "..." : ""}${value}${position + 520 < content.length ? "..." : ""}`;
}

async function ensureFresh(root) {
  const manifestFile = path.join(root, "workstreams", "00-main-control", "context", "manifest.json");
  if (!existsSync(manifestFile)) throw new Error("Context index is missing; run refresh.");
  const manifest = JSON.parse(await readText(manifestFile));
  for (const input of manifest.inputs) {
    const file = path.join(root, input.path);
    if (!existsSync(file)) throw new Error(`Context index is stale; missing ${input.path}. Run refresh.`);
    const metadata = await stat(file);
    if (metadata.size !== input.bytes || Math.trunc(metadata.mtimeMs) !== input.mtimeMs) {
      throw new Error(`Context index is stale; changed ${input.path}. Run refresh.`);
    }
  }
}

async function query(root, options) {
  await ensureFresh(root);
  const indexFile = path.join(root, "workstreams", "00-main-control", "context", "index.jsonl");
  const records = (await readText(indexFile)).trim().split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
  const queryText = options.query ?? "";
  const limit = Math.max(1, Number(options.limit ?? 5));
  const ranked = records
    .filter((record) => !options.workstream || record.workstream === options.workstream)
    .filter((record) => !options.phase || record.phase === options.phase)
    .filter((record) => !options.state || record.state === options.state)
    .filter((record) => !options.tag || record.tags.includes(options.tag))
    .map((record) => ({ ...record, score: scoreRecord(record, queryText) }))
    .filter((record) => !queryText || record.score > 10)
    .sort((a, b) => b.score - a.score || b.authority - a.authority || a.path.localeCompare(b.path, "en"));
  const matches = [];
  const perWorkstream = new Map();
  for (const record of ranked) {
    const count = perWorkstream.get(record.workstream) ?? 0;
    if (!options.workstream && count >= 2) continue;
    matches.push(record);
    perWorkstream.set(record.workstream, count + 1);
    if (matches.length >= limit) break;
  }
  if (options.json) {
    console.log(JSON.stringify(matches, null, 2));
    return;
  }
  if (!matches.length) {
    console.log("No relevant context found. Read the exact source file or broaden the query.");
    return;
  }
  for (const match of matches) {
    console.log(`[${match.score.toFixed(1)}] ${match.workstream} | ${match.artifact} | ${match.path}#${match.heading}`);
    console.log(snippet(match, queryText));
    console.log("");
  }
}

function safeSlice(value) {
  if (!/^[a-z0-9][a-z0-9-]{1,63}$/.test(value)) throw new Error("Slice must use lowercase letters, digits, and hyphens.");
  return value;
}

async function archive(root, options) {
  if (!options.workstream || !options.slice) throw new Error("archive requires --workstream and --slice");
  const item = (await listWorkstreams(root)).find((entry) => entry.id === options.workstream);
  if (!item) throw new Error(`Unknown workstream ${options.workstream}`);
  const stateFile = path.join(item.dir, "STATE.json");
  const state = JSON.parse(await readText(stateFile));
  const slice = safeSlice(options.slice);
  const date = (options.date ?? new Date().toISOString().slice(0, 10)).replaceAll("-", "");
  const archiveDir = path.join(item.dir, "archive", `${date}-${slice}`);
  for (const name of ["STATE.json", "TASKS.md", "HANDOFF.md"]) {
    await archiveOriginal(path.join(item.dir, name), path.join(archiveDir, name));
  }
  const shipped = {
    ...state,
    phase: "SHIP",
    state: "shipped",
    currentSlice: slice,
    ownerThreadId: null,
    blockers: [],
    nextAction: "由总控选择下一个切片，并用精简上下文启动新线程。",
    updatedAt: options.updatedAt ?? new Date().toISOString()
  };
  if (!shipped.evidence.length) throw new Error("Cannot SHIP without verification evidence.");
  await writeJson(stateFile, shipped);
  await writeTextIfChanged(path.join(item.dir, "TASKS.md"), compactTasks(shipped));
  await writeTextIfChanged(path.join(item.dir, "HANDOFF.md"), compactHandoff(shipped));
  await refresh(root);
  console.log(`Archived and shipped ${options.workstream}/${slice}.`);
}

async function accept(root, options) {
  const requested = options.workstreams ?? options.workstream;
  if (!requested) throw new Error("accept requires --workstream or --workstreams");
  const ids = [...new Set(requested.split(",").map((value) => value.trim()).filter(Boolean))];
  const items = new Map((await listWorkstreams(root)).map((item) => [item.id, item]));
  const updatedAt = options.updatedAt ?? new Date().toISOString();
  const evidence = {
    kind: options.kind ?? "manual-acceptance",
    status: "passed",
    summary: options.summary ?? "User acceptance passed with no reported defects.",
    ref: options.ref ?? "workstreams/07-quality-review/HANDOFF.md"
  };
  for (const id of ids) {
    const item = items.get(id);
    if (!item) throw new Error(`Unknown workstream ${id}`);
    const stateFile = path.join(item.dir, "STATE.json");
    const state = JSON.parse(await readText(stateFile));
    if (["shipped", "archived"].includes(state.state)) throw new Error(`${id}: already ${state.state}`);
    const evidenceItems = state.evidence.some((entry) => entry.kind === evidence.kind && entry.ref === evidence.ref)
      ? state.evidence
      : [...state.evidence, evidence];
    const accepted = {
      ...state,
      phase: "REVIEW",
      state: "accepted",
      blockers: [],
      evidence: evidenceItems,
      nextAction: options.nextAction ?? "由 00-main-control 执行当前切片的 SHIP 与归档。",
      updatedAt
    };
    await writeJson(stateFile, accepted);
    await writeTextIfChanged(path.join(item.dir, "TASKS.md"), compactTasks(accepted));
    await writeTextIfChanged(path.join(item.dir, "HANDOFF.md"), compactHandoff(accepted));
  }
  await refresh(root);
  console.log(`Accepted ${ids.length} workstream(s).`);
}

function parseOptions(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) throw new Error(`Unexpected argument ${arg}`);
    const key = arg.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    if (key === "json") options.json = true;
    else options[key] = argv[++index];
  }
  return options;
}

function usage() {
  console.log(`Usage:
  node context.mjs migrate [--root PATH]
  node context.mjs validate [--root PATH]
  node context.mjs refresh [--root PATH]
  node context.mjs query [--query TEXT] [--workstream ID] [--phase PHASE] [--state STATE] [--tag TAG] [--limit 5] [--json]
  node context.mjs accept --workstreams ID,ID --summary TEXT --ref PATH [--updated-at ISO]
  node context.mjs archive --workstream ID --slice SLUG [--date YYYY-MM-DD] [--updated-at ISO]`);
}

async function main() {
  const [command, ...rest] = process.argv.slice(2);
  if (!command || ["help", "--help", "-h"].includes(command)) {
    usage();
    return;
  }
  const options = parseOptions(rest);
  const root = path.resolve(options.root ?? DEFAULT_ROOT);
  if (command === "migrate") await migrate(root);
  else if (command === "validate") {
    const result = await validateRepository(root);
    if (result.errors.length) process.exitCode = 1;
  } else if (command === "refresh") await refresh(root);
  else if (command === "query") await query(root, options);
  else if (command === "accept") await accept(root, options);
  else if (command === "archive") await archive(root, options);
  else throw new Error(`Unknown command ${command}`);
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === path.resolve(fileURLToPath(import.meta.url))) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
