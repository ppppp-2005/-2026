const employerService = require("../../services/employer");

function profileProgress(employer, company) {
  const requiredFields = employer.profileFields.filter((field) => field.required);
  const filled = requiredFields.filter((field) => String(company[field.id] || "").trim()).length;
  return {
    filled,
    total: requiredFields.length,
    percent: Math.round((filled / requiredFields.length) * 100),
    label: filled === requiredFields.length ? "本地示例资料已填完整" : `还差${requiredFields.length - filled}项`
  };
}

function stateTitle(kind) {
  const titles = {
    empty: "暂时没有企业示例数据",
    offline: "当前处于离线状态",
    timeout: "读取企业信息超时",
    server: "企业示例服务暂不可用",
    network: "读取企业信息时网络异常"
  };
  return titles[kind] || "暂时无法显示企业信息";
}

Page({
  data: {
    employer: null,
    companyDraft: {},
    profileProgress: { filled: 0, total: 0, percent: 0, label: "" },
    profileEditing: false,
    demoScenarios: employerService.UI_SCENARIOS,
    demoScenario: "normal",
    loadState: "loading",
    stateTitle: "正在读取企业本地示例",
    stateMessage: "只读取当前内存中的示例数据",
    hasDemoSession: false,
    authPending: false
  },

  onLoad() {
    this.loadDashboard();
  },

  onUnload() {
    this._dashboardRequestId = (this._dashboardRequestId || 0) + 1;
  },

  async loadDashboard() {
    const requestId = (this._dashboardRequestId || 0) + 1;
    this._dashboardRequestId = requestId;
    this.setData({
      loadState: "loading",
      stateTitle: "正在读取企业本地示例",
      stateMessage: "只读取当前内存中的示例数据",
      profileEditing: false
    });
    try {
      const employer = await employerService.getDashboard({ scenario: this.data.demoScenario });
      if (requestId !== this._dashboardRequestId) return;
      if (!employer) {
        this.setData({
          employer: null,
          companyDraft: {},
          loadState: "empty",
          stateTitle: stateTitle("empty"),
          stateMessage: "本地空状态没有资料、岗位或候选人，也没有保存任何内容",
          hasDemoSession: true
        });
        return;
      }
      const companyDraft = Object.assign({}, employer.company);
      this._initialCompany = Object.assign({}, employer.company);
      this.setData({
        employer,
        companyDraft,
        profileProgress: profileProgress(employer, companyDraft),
        loadState: "normal",
        stateTitle: "",
        stateMessage: "",
        hasDemoSession: true
      });
    } catch (error) {
      if (requestId !== this._dashboardRequestId) return;
      const kind = error && error.kind === "unauthorized" ? "unauthorized" : (error && error.kind) || "error";
      this.setData({
        employer: null,
        companyDraft: {},
        loadState: kind,
        stateTitle: kind === "unauthorized" ? "需要企业本地演示身份" : stateTitle(kind),
        stateMessage: employerService.messageForError(error),
        hasDemoSession: kind !== "unauthorized"
      });
    }
  },

  async onStartEmployerDemo() {
    if (this.data.authPending) return;
    this.setData({ authPending: true, stateMessage: "正在进入企业本地演示，不会进行真实登录" });
    try {
      await employerService.startEmployerDemo();
      this.setData({ authPending: false, demoScenario: "normal", hasDemoSession: true });
      await this.loadDashboard();
    } catch (error) {
      this.setData({
        authPending: false,
        loadState: "unauthorized",
        stateMessage: employerService.messageForError(error)
      });
    }
  },

  onRetry() {
    this.setData({ demoScenario: "normal" }, () => this.loadDashboard());
  },

  onScenarioTap(event) {
    const scenario = event.currentTarget.dataset.scenario;
    if (!employerService.UI_SCENARIOS.some((item) => item.id === scenario)) return;
    this.setData({ demoScenario: scenario }, () => this.loadDashboard());
  },

  refreshProfileProgress() {
    if (!this.data.employer) return;
    this.setData({
      profileProgress: profileProgress(this.data.employer, this.data.companyDraft)
    });
  },

  onToggleProfileEdit() {
    this.setData({ profileEditing: !this.data.profileEditing });
  },

  onProfileInput(event) {
    const fieldId = event.currentTarget.dataset.field;
    const isKnownField = this.data.employer && this.data.employer.profileFields.some((field) => field.id === fieldId);
    if (!isKnownField) return;
    const companyDraft = Object.assign({}, this.data.companyDraft, {
      [fieldId]: event.detail.value || ""
    });
    this.setData({ companyDraft }, () => this.refreshProfileProgress());
  },

  onResetProfile() {
    this.setData({
      companyDraft: Object.assign({}, this._initialCompany || {}),
      profileEditing: false
    }, () => this.refreshProfileProgress());
    wx.showToast({ title: "已恢复本地示例", icon: "none" });
  },

  onOpenAction(event) {
    const actionId = event.currentTarget.dataset.id;
    const action = this.data.employer && this.data.employer.actions.find((item) => item.id === actionId);
    if (!action) {
      wx.showToast({ title: "没有找到这个本地入口", icon: "none" });
      return;
    }
    wx.navigateTo({
      url: action.url,
      fail: () => {
        wx.showModal({
          title: "页面暂时无法打开",
          content: "请稍后再试。当前没有保存、发布或发送任何数据。",
          showCancel: false,
          confirmText: "我知道了"
        });
      }
    });
  },

  onOpenJobCandidates(event) {
    const jobId = event.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/employer-candidates/index?jobId=${jobId}`,
      fail: () => {
        wx.showModal({
          title: "页面暂时无法打开",
          content: "请稍后再试。本次操作没有联系或通知任何人。",
          showCancel: false,
          confirmText: "我知道了"
        });
      }
    });
  }
});
