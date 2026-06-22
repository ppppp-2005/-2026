const { profileMock } = require("../../data/profile");
const authSession = require("../../services/auth-session");

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function viewFor(session) {
  if (session.status === "loading") {
    return {
      title: "正在建立本地状态",
      text: "只在内存中更新，请勿重复点击。"
    };
  }
  if (session.status === "authenticated") {
    return {
      title: "本地已登录",
      text: `当前角色：${session.role === "employer" ? "招聘方" : "求职者"}。重新加载后会清除。`
    };
  }
  if (session.status === "expired") {
    return {
      title: "本地登录已失效",
      text: "可重新体验登录；这不代表真实账号状态。"
    };
  }
  return {
    title: "当前未登录",
    text: "没有本地演示会话，也没有读取微信身份。"
  };
}

Page({
  data: {
    login: clone(profileMock.login),
    termsAgreed: false,
    privacyAgreed: false,
    allAgreed: false,
    termsExpanded: false,
    privacyExpanded: false,
    selectedScenario: "success",
    submitting: false,
    sessionStatus: "anonymous",
    statusTitle: profileMock.login.status.title,
    statusText: profileMock.login.status.text,
    feedback: "本页是本地状态演示，不会调用微信登录或写入存储。"
  },

  onShow() {
    this.refreshSession();
  },

  refreshSession(feedback) {
    const session = authSession.snapshot();
    const view = viewFor(session);
    this.setData({
      sessionStatus: session.status,
      statusTitle: view.title,
      statusText: view.text,
      ...(feedback ? { feedback } : {})
    });
  },

  onAgreementsChange(event) {
    const values = Array.isArray(event.detail.value) ? event.detail.value : [];
    const termsAgreed = values.includes("terms");
    const privacyAgreed = values.includes("privacy");
    this.setData({
      termsAgreed,
      privacyAgreed,
      allAgreed: termsAgreed && privacyAgreed,
      feedback: termsAgreed && privacyAgreed
        ? "两项说明均已知情，可体验本地登录。"
        : "请分别阅读并勾选用户协议和隐私说明。"
    });
  },

  onAgreementDetailTap(event) {
    const agreementId = event.currentTarget.dataset.id;
    if (agreementId === "terms") {
      this.setData({ termsExpanded: !this.data.termsExpanded });
    } else if (agreementId === "privacy") {
      this.setData({ privacyExpanded: !this.data.privacyExpanded });
    }
  },

  onScenarioTap(event) {
    const scenario = event.currentTarget.dataset.scenario;
    const isKnown = this.data.login.scenarios.some((item) => item.id === scenario);
    if (!isKnown || this.data.submitting) return;
    this.setData({
      selectedScenario: scenario,
      feedback: scenario === "success"
        ? "将体验本地登录成功。"
        : `将模拟${this.data.login.scenarios.find((item) => item.id === scenario).name}反馈。`
    });
  },

  async onDemoLoginTap() {
    if (!this.data.allAgreed) {
      this.setData({ feedback: "请先同时勾选用户协议和隐私说明。" });
      return;
    }
    if (this.data.submitting || authSession.isLoginPending()) {
      this.setData({ feedback: "操作进行中，请勿重复点击。" });
      return;
    }

    this.setData({
      submitting: true,
      sessionStatus: "loading",
      statusTitle: "正在建立本地状态",
      statusText: "只在内存中更新，请勿重复点击。",
      feedback: "正在体验，请稍候。"
    });
    try {
      await authSession.demoLogin({
        scenario: this.data.selectedScenario,
        delayMs: 260
      });
      this.refreshSession("本地登录状态已建立；没有创建真实账号。退出或重载后会清除。");
    } catch (error) {
      this.refreshSession(`${authSession.messageForError(error)}。本次没有写入任何资料。`);
    } finally {
      this.setData({ submitting: false });
    }
  },

  onExpireTap() {
    if (authSession.snapshot().status !== "authenticated") {
      this.refreshSession("当前没有可设为失效的本地登录。");
      return;
    }
    authSession.expire();
    this.refreshSession("已模拟登录失效，可重新体验。没有影响真实账号。");
  },

  onLogoutTap() {
    authSession.logout();
    this.setData({
      termsAgreed: false,
      privacyAgreed: false,
      allAgreed: false,
      selectedScenario: "success"
    });
    this.refreshSession("已退出并清除本次内存状态；当前未登录。");
  }
});
