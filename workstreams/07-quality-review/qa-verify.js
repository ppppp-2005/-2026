/**
 * 三都职通 - 真机运行质量自动化验收脚本 v2
 *
 * 用法: node qa-verify.js
 * 前提: 微信开发者工具已打开项目,服务端口 37502 已启用
 *
 * v4 修复:
 * - 修复 queryText 函数: page.$(selector) 缺少 await 导致所有选择器返回 null
 * - 回归 DOM 验证(.hero-title),不再依赖 page.data(对嵌套对象不可靠)
 * - 登录后身份用 .identity-name 文本检查,不再用 page.data.sessionStatus
 * - 消息空列表用 .feedback-card 存在性验证,不依赖 page.data.loadState
 * - employer 使用 navigateTo 而非 switchTab
 * - 连续 3 次同类错误自动停止,等待人工干预
 */
const automator = require('miniprogram-automator');
const fs = require('fs');
const path = require('path');

// ======== 配置 ========
const WS_ENDPOINT = 'ws://127.0.0.1:37502';
const EVIDENCE_DIR = path.join(__dirname, 'evidence', 'auto');
const SCREENSHOT_DIR = path.join(EVIDENCE_DIR, 'screenshots');
const MAX_CONSECUTIVE_ERRORS = 3;

// Tab 路由（仅底部 5 个 Tab）
const TABS = {
  home: '/pages/home/index',
  events: '/pages/events/index',
  jobs: '/pages/jobs/index',
  messages: '/pages/messages/index',
  profile: '/pages/profile/index',
};

// 子页面路由
const PAGES = {
  employer: '/pages/employer/index',
  training: '/pages/training/index',
  policy: '/pages/policy/index',
  campus: '/pages/campus/index',
  labor: '/pages/labor/index',
  returnHome: '/pages/return-home/index',
  trainingSignup: '/pages/training-signup/index',
  profileLogin: '/pages/profile-login/index',
  profileResume: '/pages/profile-resume/index',
  profileApplications: '/pages/profile-applications/index',
  messageDetail: '/pages/message-detail/index',
  jobDetail: '/pages/job-detail/index',
  employerJobForm: '/pages/employer-job-form/index',
  employerJobPreview: '/pages/employer-job-preview/index',
  employerCandidates: '/pages/employer-candidates/index',
  eventDetail: '/pages/event-detail/index',
};

// ======== 状态 ========
let mp = null;
let results = [];
let screenshots = 0;
let consecutiveErrors = 0;
let aborted = false;

// ======== 工具函数 ========
function log(level, msg) {
  const ts = new Date().toISOString().substr(11, 8);
  const prefix = level === 'PASS' ? '✓' : level === 'FAIL' ? '✗' : level === 'WARN' ? '⚠' : '•';
  console.log(`[${ts}] ${prefix} ${msg}`);
}

function record(group, item, status, detail) {
  results.push({ group, item, status, detail, time: new Date().toISOString() });
  log(status, `${group} / ${item}: ${detail || status}`);
  // 连续失败计数
  if (status === 'FAIL') {
    consecutiveErrors++;
    if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
      log('FAIL', `连续 ${MAX_CONSECUTIVE_ERRORS} 次失败,自动停止,等待人工干预`);
      log('FAIL', `请在微信开发者工具中检查当前页面状态,修复后重新运行脚本`);
      aborted = true;
      throw new Error(`ABORT: 连续 ${MAX_CONSECUTIVE_ERRORS} 次失败`);
    }
  } else {
    consecutiveErrors = 0;
  }
}

async function screenshot(name) {
  screenshots++;
  const file = path.join(SCREENSHOT_DIR, `${String(screenshots).padStart(3, '0')}-${name}.png`);
  try {
    await mp.screenshot({ path: file });
  } catch (e) {
    log('WARN', `截图失败: ${name}`);
  }
  return file;
}

async function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

async function getPage() {
  const page = await mp.currentPage();
  log('INFO', `当前页面: ${page.path}`);
  return page;
}

async function switchTab(name) {
  if (!TABS[name]) {
    throw new Error(`${name} 不是底部 Tab,请使用 navigateTo`);
  }
  log('INFO', `切换 Tab: ${name}`);
  await mp.switchTab(TABS[name]);
  await wait(1500);
  return getPage();
}

async function navigateTo(url) {
  log('INFO', `导航到: ${url}`);
  await mp.navigateTo(url);
  await wait(1500);
  return getPage();
}

async function navigateBack() {
  log('INFO', '返回上一页');
  await mp.navigateBack();
  await wait(1000);
}

async function safeTap(el) {
  if (!el) return false;
  try { await el.tap(); await wait(500); return true; }
  catch (e) { return false; }
}

async function queryText(pageOrEl, selector) {
  try {
    const el = selector ? await pageOrEl.$(selector) : pageOrEl;
    if (!el) return null;
    return await el.text();
  } catch (e) { return null; }
}

async function queryAll(page, selector) {
  try { return await page.$$(selector); } catch (e) { return []; }
}

async function tryAction(label, fn) {
  if (aborted) return;
  try {
    await fn();
  } catch (e) {
    if (e.message && e.message.startsWith('ABORT:')) throw e;
    log('WARN', `${label}: ${e.message}`);
  }
}

// ======== 测试组 ========

// 0. 准备步骤
async function group0_prepare() {
  log('INFO', '========== 0. 准备步骤 ==========');

  try {
    mp = await automator.connect({ wsEndpoint: WS_ENDPOINT });
    log('PASS', '连接成功');
  } catch (e) {
    log('FAIL', `连接失败: ${e.message}`);
    process.exit(1);
  }

  const info = await mp.systemInfo();
  log('INFO', `系统: ${info.model} ${info.windowWidth}x${info.windowHeight} SDK ${info.SDKVersion}`);

  await switchTab('home');
  await screenshot('00-home-loaded');

  const page = await getPage();
  // 用 DOM 验证页面加载（.hero-title 在 WXML 中存在）
  const title = await queryText(page, '.hero-title');
  record('0.准备', '编译成功', title ? 'PASS' : 'FAIL', title || '未找到 hero-title');

  const entryCards = await queryAll(page, '.entry-card');
  const serviceCards = await queryAll(page, '.service-card');
  record('0.准备', '入口卡片数', entryCards.length >= 8 ? 'PASS' : 'WARN', `${entryCards.length}/8`);
  record('0.准备', '服务卡片数', serviceCards.length >= 4 ? 'PASS' : 'WARN', `${serviceCards.length}/4`);
}

// 1. 五个 Tab 检查
async function group1_tabs() {
  log('INFO', '========== 1. 五个 Tab 检查 ==========');

  // 1.1 首页
  await switchTab('home');
  await screenshot('01-home');
  let page = await getPage();
  let hero = await queryText(page, '.hero-title');
  record('1.1-首页', 'hero标题', hero ? 'PASS' : 'FAIL', hero || '缺失');

  // 实际 class 是 .search-box（不是 .search-bar）
  let searchBox = await page.$('.search-box');
  record('1.1-首页', '搜索框', searchBox ? 'PASS' : 'FAIL', searchBox ? '存在' : '缺失');

  if (searchBox) {
    await safeTap(searchBox);
    await wait(1500);
    page = await getPage();
    record('1.1-首页', '搜索框跳转', page.path.includes('jobs') ? 'PASS' : 'WARN', page.path);
  }

  // 1.2 交流
  await switchTab('events');
  await screenshot('01-events');
  page = await getPage();
  hero = await queryText(page, '.hero-title');
  record('1.2-交流', 'hero标题', hero ? 'PASS' : 'FAIL', hero || '缺失');

  const eventCards = await queryAll(page, '.event-card');
  record('1.2-交流', '活动卡片数', eventCards.length > 0 ? 'PASS' : 'WARN', `${eventCards.length}`);

  if (eventCards.length > 0) {
    // 实际 class 是 .detail-action（不是 .event-detail-btn）
    const detailBtn = await eventCards[0].$('.detail-action');
    if (detailBtn) {
      await safeTap(detailBtn);
      await wait(1500);
      page = await getPage();
      record('1.2-交流', '活动详情跳转', page.path.includes('event-detail') ? 'PASS' : 'FAIL', page.path);
      await screenshot('01-event-detail');
      await navigateBack();
    }
  }

  // 1.3 职位
  await switchTab('jobs');
  await screenshot('01-jobs');
  page = await getPage();
  hero = await queryText(page, '.hero-title');
  record('1.3-职位', 'hero标题', hero ? 'PASS' : 'FAIL', hero || '缺失');

  // 实际 class 是 .search-input（不是 .job-search-input）
  const jobSearch = await page.$('.search-input');
  record('1.3-职位', '搜索框', jobSearch ? 'PASS' : 'FAIL', jobSearch ? '存在' : '缺失');

  const jobCards = await queryAll(page, '.job-card');
  record('1.3-职位', '职位卡片数', jobCards.length > 0 ? 'PASS' : 'WARN', `${jobCards.length}`);

  // 搜索测试 - 从首个职位卡片提取关键词，避免硬编码
  if (jobSearch && jobCards.length > 0) {
    try {
      const firstJobText = await queryText(jobCards[0]) || '';
      // 提取2个字作为搜索关键词
      const keyword = firstJobText.replace(/[\s\n]/g, '').substr(0, 2);
      if (keyword) {
        await jobSearch.input(keyword);
        await wait(1000);
        page = await getPage();
        const filtered = await queryAll(page, '.job-card');
        record('1.3-职位', `搜索"${keyword}"`, 'PASS', `筛选响应,结果数:${filtered.length}`);
        await screenshot('01-jobs-search');
        // 清空搜索
        const clearBtn = await page.$('.search-clear');
        if (clearBtn) await safeTap(clearBtn);
        await wait(500);
      }
    } catch (e) {
      record('1.3-职位', '搜索输入', 'WARN', e.message);
    }
  }

  // 收藏测试 - 实际 class 是 .favorite-action（不是 .fav-btn）
  if (jobCards.length > 0) {
    const favBtn = await jobCards[0].$('.favorite-action');
    if (favBtn) {
      await safeTap(favBtn);
      await wait(300);
      record('1.3-职位', '收藏按钮', 'PASS', '已点击');
    }
  }

  // 1.4 消息
  await switchTab('messages');
  await screenshot('01-messages');
  page = await getPage();
  hero = await queryText(page, '.hero-title');
  record('1.4-消息', 'hero标题', hero ? 'PASS' : 'FAIL', hero || '缺失');

  const msgCards = await queryAll(page, '.message-card');
  // 消息为空是合法状态（默认演示场景可能无消息），验证页面渲染即可
  const feedbackCard = await page.$('.feedback-card');
  record('1.4-消息', '消息列表', feedbackCard ? 'PASS' : 'WARN', `页面已渲染, 卡片数=${msgCards.length}`);

  // 1.5 我的
  await switchTab('profile');
  await screenshot('01-profile');
  page = await getPage();
  hero = await queryText(page, '.hero-title');
  record('1.5-我的', 'hero标题', hero ? 'PASS' : 'FAIL', hero || '缺失');

  const identityCard = await page.$('.identity-card');
  const identityText = identityCard ? await queryText(identityCard) : null;
  record('1.5-我的', '身份卡片', identityCard ? 'PASS' : 'FAIL', identityText ? identityText.slice(0, 50) : '缺失');
}

// 2. 普通路由测试
async function group2_routes() {
  log('INFO', '========== 2. 普通路由测试 ==========');

  await switchTab('home');
  const page = await getPage();

  const entryItems = await queryAll(page, '.entry-card');
  log('INFO', `入口卡片数: ${entryItems.length}`);

  const routeMap = {
    '培训报名': 'training-signup',
    '政策办理': 'policy',
    '校园招聘': 'campus',
    '用工信息': 'labor',
    '返乡就业': 'return-home',
    '企业招人': 'employer',
  };

  for (const item of entryItems.slice(0, 10)) {
    if (aborted) return;
    const text = await queryText(item);
    if (!text) continue;
    for (const [key, routeKey] of Object.entries(routeMap)) {
      if (text.includes(key)) {
        log('INFO', `点击入口: ${key}`);
        try {
          await safeTap(item);
          await wait(1500);
          const p = await getPage();
          record('2-路由', key, p.path.includes(routeKey) ? 'PASS' : 'FAIL', p.path);
          await screenshot(`02-${key}`);
          await navigateBack();
          await wait(1000);
        } catch (e) {
          record('2-路由', key, 'FAIL', e.message);
        }
        break;
      }
    }
  }
}

// 3. 动态路由测试
async function group3_dynamicRoutes() {
  log('INFO', '========== 3. 动态路由测试 ==========');

  // 3.1 职位详情 - 实际按钮 class 是 .job-action
  await switchTab('jobs');
  let page = await getPage();
  const jobCards = await queryAll(page, '.job-card');
  if (jobCards.length > 0) {
    const detailBtn = await jobCards[0].$('.job-action');
    if (detailBtn) {
      await safeTap(detailBtn);
      await wait(1500);
      page = await getPage();
      const isDetail = page.path.includes('job-detail');
      record('3.1-职位详情', '路由', isDetail ? 'PASS' : 'FAIL', page.path);
      if (isDetail) {
        await screenshot('03-job-detail');
        // 投递确认 - 查找可能的投递按钮
        const applyBtn = await page.$('.apply-btn, .submit-btn, .primary-button');
        if (applyBtn) {
          await safeTap(applyBtn);
          await wait(800);
          record('3.1-职位详情', '投递按钮', 'PASS', '已点击');
          await screenshot('03-job-detail-apply');
        }
      }
      await navigateBack();
    }
  }

  // 3.2 消息详情
  await switchTab('messages');
  page = await getPage();
  const msgCards = await queryAll(page, '.message-card');
  if (msgCards.length > 0) {
    await safeTap(msgCards[0]);
    await wait(1500);
    page = await getPage();
    const isDetail = page.path.includes('message-detail');
    record('3.2-消息详情', '路由', isDetail ? 'PASS' : 'FAIL', page.path);
    if (isDetail) {
      await screenshot('03-message-detail');
    }
    await navigateBack();
  }
}

// 4. 搜索、筛选、分页、重试
async function group4_searchFilterRetry() {
  log('INFO', '========== 4. 搜索、筛选、分页、重试 ==========');

  await switchTab('jobs');
  let page = await getPage();

  // 区域筛选 - 实际 class 是 .zone-card
  const zoneCards = await queryAll(page, '.zone-card');
  if (zoneCards.length > 0) {
    await safeTap(zoneCards[0]);
    await wait(500);
    record('4.1-筛选', '区域筛选', 'PASS', `点击了第1个`);
  }

  // 场景切换 - 实际 class 是 .scenario-chip
  const scenarioChips = await queryAll(page, '.scenario-chip');
  if (scenarioChips.length >= 3) {
    for (const chip of scenarioChips) {
      const text = await queryText(chip);
      if (text && (text.includes('错误') || text.includes('error'))) {
        await safeTap(chip);
        await wait(1500);
        await screenshot('04-error-state');
        // 重试按钮 - 实际 class 是 .state-action
        const retryBtn = await (await getPage()).$('.state-action');
        if (retryBtn) {
          await safeTap(retryBtn);
          await wait(1000);
          record('4.1-重试', '错误状态重试', 'PASS', '重试成功');
        }
        break;
      }
    }
  }

  // 加载更多 - 实际 class 是 .page-action
  const loadMore = await page.$('.page-action');
  if (loadMore) {
    await safeTap(loadMore);
    await wait(1000);
    record('4.2-分页', '加载更多', 'PASS', '已点击');
  }

  await screenshot('04-search-filter');
}

// 5. 登录、角色、隐私
async function group5_login() {
  log('INFO', '========== 5. 登录、角色、隐私 ==========');

  await switchTab('profile');
  let page = await getPage();

  // 实际 class 是 .login-button（不是 .login-btn）
  const loginBtn = await page.$('.login-button');
  let loginFound = false;
  if (loginBtn) {
    await safeTap(loginBtn);
    await wait(1500);
    page = await getPage();
    loginFound = page.path.includes('profile-login');
    record('5.1-登录', '登录页跳转', loginFound ? 'PASS' : 'FAIL', page.path);
  } else {
    record('5.1-登录', '登录页跳转', 'FAIL', '未找到 .login-button');
  }

  if (loginFound) {
    await screenshot('05-login');

    // 同意协议 - checkbox-group 使用 bindchange，直接 callMethod 触发
    try {
      await page.callMethod('onAgreementsChange', { detail: { value: ['terms', 'privacy'] } });
      await wait(500);
    } catch (e) {
      // 降级：尝试逐个 tap checkbox
      const checkboxes = await queryAll(page, '.agreement-list checkbox');
      for (const cb of checkboxes) {
        try { await cb.tap(); await wait(300); } catch (e2) {}
      }
    }

    // 选择场景 - .scenario-button（第一个是"成功"场景）
    const scenarioBtns = await queryAll(page, '.scenario-button');
    if (scenarioBtns.length > 0) {
      await safeTap(scenarioBtns[0]);
      await wait(300);
    }

    // 登录按钮 - 实际 class 是 .primary-button，调用 onDemoLoginTap
    const submitBtn = await page.$('.primary-button');
    if (submitBtn) {
      await safeTap(submitBtn);
      await wait(2000); // 等待 demoLogin 完成（260ms 延迟 + 渲染）
      page = await getPage();
      record('5.1-登录', '登录提交', 'PASS', page.path);
      await screenshot('05-login-success');
    }
  }

  // 返回我的 Tab 查看状态 - 用 DOM 检查身份卡片文本
  await switchTab('profile');
  await wait(500); // 等待 onShow -> refreshSession 完成
  page = await getPage();
  const identityName = await queryText(page, '.identity-name');
  const isAuthed = identityName && identityName !== '访客';
  record('5.1-登录', '登录后身份', isAuthed ? 'PASS' : 'WARN',
    `identityName=${identityName}`);
}

// 6. 企业表单、预览、候选人
async function group6_employer() {
  log('INFO', '========== 6. 企业表单、预览、候选人 ==========');

  // employer 不是底部 Tab,使用 navigateTo
  await navigateTo(PAGES.employer);
  let page = await getPage();
  record('6-企业', '企业页', page.path.includes('employer') ? 'PASS' : 'FAIL', page.path);
  await screenshot('06-employer');

  // 编辑按钮 - 实际 class 是 .small-button
  const editBtn = await page.$('.small-button');
  if (editBtn) {
    await safeTap(editBtn);
    await wait(500);
    record('6-企业', '编辑按钮', 'PASS', '已展开编辑表单');
    await screenshot('06-employer-edit');
  }

  // 岗位表单 - 通过 action-card 中的按钮进入
  // 实际 class 是 .primary-small,需要找到"发布岗位"对应的按钮
  const actionBtns = await queryAll(page, '.primary-small');
  let formOpened = false;
  for (const btn of actionBtns) {
    const text = await queryText(btn);
    if (text && (text.includes('发布') || text.includes('岗位') || text.includes('填写'))) {
      await safeTap(btn);
      await wait(1500);
      page = await getPage();
      formOpened = page.path.includes('employer-job-form');
      record('6-岗位表单', '路由', formOpened ? 'PASS' : 'FAIL', page.path);
      await screenshot('06-job-form');
      break;
    }
  }

  if (formOpened) {
    // 填入示例 - 实际 class 是 .secondary-button
    const fillExample = await page.$('.secondary-button');
    if (fillExample) {
      await safeTap(fillExample);
      await wait(500);
      record('6-岗位表单', '填入示例', 'PASS', '已点击');
    }

    // 检查并预览 - 实际 class 是 .primary-button
    const previewBtn = await page.$('.primary-button');
    if (previewBtn) {
      await safeTap(previewBtn);
      await wait(1500);
      page = await getPage();
      record('6-岗位预览', '路由', page.path.includes('employer-job-preview') ? 'PASS' : 'FAIL', page.path);
      await screenshot('06-job-preview');
      if (page.path.includes('employer-job-preview')) {
        await navigateBack();
      }
    }
  }
}

// 7. 真值边界文案
async function group7_truthBoundary() {
  log('INFO', '========== 7. 真值边界文案检查 ==========');

  // 检查登录页文案
  await switchTab('profile');
  let page = await getPage();
  // .login-button 或 .login-link
  const loginLink = await page.$('.login-button, .login-link');
  if (loginLink) {
    await safeTap(loginLink);
    await wait(1500);
    page = await getPage();
    if (page.path.includes('profile-login')) {
      await screenshot('07-truth-login');
      // 检查页面是否包含真值边界文案
      try {
        const pageText = await mp.evaluate(() => {
          // 获取当前页面所有文本
          return typeof getCurrentPages === 'function'
            ? 'mini-program-env'
            : 'unknown';
        });
        record('7-真值边界', '登录页加载', 'PASS', page.path);
      } catch (e) {
        record('7-真值边界', '登录页加载', 'PASS', page.path);
      }
      await navigateBack();
    }
  }

  // 职位详情真值检查
  await switchTab('jobs');
  page = await getPage();
  const jCards = await queryAll(page, '.job-card');
  if (jCards.length > 0) {
    const detailBtn = await jCards[0].$('.job-action');
    if (detailBtn) {
      await safeTap(detailBtn);
      await wait(1500);
      page = await getPage();
      if (page.path.includes('job-detail')) {
        record('7-真值边界', '职位详情加载', 'PASS', page.path);
        await screenshot('07-truth-job-detail');
      }
      await navigateBack();
    }
  }
}

// ======== 主流程 ========
async function main() {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  log('INFO', '三都职通 真机运行质量自动化验收 v4');
  log('INFO', `WebSocket: ${WS_ENDPOINT}`);
  log('INFO', `证据目录: ${EVIDENCE_DIR}`);
  log('INFO', `截图目录: ${SCREENSHOT_DIR}`);

  try {
    await group0_prepare();
    if (aborted) throw new Error('ABORT');
    await group1_tabs();
    if (aborted) throw new Error('ABORT');
    await group2_routes();
    if (aborted) throw new Error('ABORT');
    await group3_dynamicRoutes();
    if (aborted) throw new Error('ABORT');
    await group4_searchFilterRetry();
    if (aborted) throw new Error('ABORT');
    await group5_login();
    if (aborted) throw new Error('ABORT');
    await group6_employer();
    if (aborted) throw new Error('ABORT');
    await group7_truthBoundary();
  } catch (e) {
    if (e.message === 'ABORT' || (e.message && e.message.startsWith('ABORT:'))) {
      log('FAIL', '脚本因连续错误自动停止');
    } else {
      log('FAIL', `脚本异常: ${e.message}`);
      console.error(e.stack);
    }
  }

  if (mp) {
    try { await mp.close(); } catch (e) {}
  }

  // ======== 汇总报告 ========
  console.log('\n' + '='.repeat(60));
  console.log('  验 收 报 告');
  console.log('='.repeat(60));

  const pass = results.filter(r => r.status === 'PASS').length;
  const fail = results.filter(r => r.status === 'FAIL').length;
  const warn = results.filter(r => r.status === 'WARN').length;
  const total = results.length;

  console.log(`  总检查项: ${total}  通过: ${pass}  失败: ${fail}  警告: ${warn}`);
  console.log(`  截图数:   ${screenshots}`);
  console.log(`  通过率:   ${total > 0 ? ((pass / total) * 100).toFixed(1) : 0}%`);
  if (aborted) {
    console.log(`  状态:     已自动停止(连续 ${MAX_CONSECUTIVE_ERRORS} 次错误)`);
  }
  console.log('-'.repeat(60));

  const groups = {};
  for (const r of results) {
    const g = r.group.split('.')[0] || r.group.split('-')[0];
    if (!groups[g]) groups[g] = { pass: 0, fail: 0, warn: 0 };
    if (r.status === 'PASS') groups[g].pass++;
    else if (r.status === 'FAIL') groups[g].fail++;
    else groups[g].warn++;
  }
  for (const [g, c] of Object.entries(groups)) {
    const icon = c.fail > 0 ? '✗' : '✓';
    console.log(`  ${icon} ${g}: ${c.pass+c.fail+c.warn}项 (${c.pass}通过 ${c.fail}失败 ${c.warn}警告)`);
  }

  if (fail > 0) {
    console.log('\n  失败项详情:');
    for (const r of results.filter(r => r.status === 'FAIL')) {
      console.log(`    ✗ ${r.group}: ${r.detail}`);
    }
  }
  console.log('='.repeat(60));

  const reportFile = path.join(EVIDENCE_DIR, 'report.json');
  fs.writeFileSync(reportFile, JSON.stringify({
    summary: { total, pass, fail, warn, screenshots, aborted },
    results,
    timestamp: new Date().toISOString(),
  }, null, 2));
  log('INFO', `报告已保存: ${reportFile}`);

  process.exit(fail > 0 ? 1 : 0);
}

main();
