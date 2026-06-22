const employerService = require("../../services/employer");

function stateTitle(kind) {
  const titles = {
    empty: "本地岗位表单暂无字段",
    offline: "当前处于离线状态",
    timeout: "读取岗位表单超时",
    server: "岗位表单示例服务暂不可用",
    network: "读取岗位表单时网络异常"
  };
  return titles[kind] || "岗位表单暂时无法显示";
}

Page({
  data: {
    fields: [],
    draft: {},
    errors: {},
    errorSummary: "",
    honestNote: "这里只做本地填写和校验，不会保存草稿，也不会提交或发布岗位。",
    loadState: "loading",
    stateTitle: "正在准备表单",
    stateMessage: "正在读取本地岗位表单",
    demoScenarios: employerService.UI_SCENARIOS,
    demoScenario: "normal",
    authPending: false,
    submitting: false,
    submissionMessage: ""
  },

  onLoad() {
    this.loadForm();
  },

  onUnload() {
    this._formRequestId = (this._formRequestId || 0) + 1;
    this._submissionRequestId = (this._submissionRequestId || 0) + 1;
  },

  async loadForm() {
    const requestId = (this._formRequestId || 0) + 1;
    this._formRequestId = requestId;
    this.setData({ loadState: "loading", stateTitle: "正在准备表单", stateMessage: "正在读取本地岗位表单" });
    try {
      const form = await employerService.getJobForm({ scenario: this.data.demoScenario });
      if (requestId !== this._formRequestId) return;
      if (!form) {
        this.setData({ loadState: "empty", stateTitle: stateTitle("empty"), stateMessage: "当前本地状态没有可用字段，也没有保存任何表单内容" });
        return;
      }
      this._initialDraft = Object.assign({}, form.draft);
      this._exampleDraft = Object.assign({}, form.exampleDraft);
      this.setData({
        fields: form.fields,
        draft: Object.assign({}, form.draft),
        honestNote: form.honestNote,
        loadState: "normal",
        stateMessage: ""
      });
    } catch (error) {
      if (requestId !== this._formRequestId) return;
      const kind = error && error.kind === "unauthorized" ? "unauthorized" : (error && error.kind) || "error";
      this.setData({
        loadState: kind,
        stateTitle: kind === "unauthorized" ? "需要企业本地演示身份" : stateTitle(kind),
        stateMessage: employerService.messageForError(error)
      });
    }
  },

  async onStartEmployerDemo() {
    if (this.data.authPending) return;
    this.setData({ authPending: true, stateMessage: "正在进入企业本地演示，不会进行真实登录" });
    try {
      await employerService.startEmployerDemo();
      this.setData({ authPending: false, demoScenario: "normal" });
      await this.loadForm();
    } catch (error) {
      this.setData({ authPending: false, stateMessage: employerService.messageForError(error) });
    }
  },

  onRetry() {
    this.setData({ demoScenario: "normal" });
    return this.loadForm();
  },

  onScenarioTap(event) {
    const scenario = event.currentTarget.dataset.scenario;
    if (!employerService.UI_SCENARIOS.some((item) => item.id === scenario)) return;
    this.setData({ demoScenario: scenario });
    return this.loadForm();
  },

  onFieldInput(event) {
    const fieldId = event.currentTarget.dataset.field;
    const isKnownField = this.data.fields.some((field) => field.id === fieldId);
    if (!isKnownField || this.data.submitting) return;
    const draft = Object.assign({}, this.data.draft, {
      [fieldId]: event.detail.value || ""
    });
    const errors = Object.assign({}, this.data.errors);
    delete errors[fieldId];
    this.setData({ draft, errors, errorSummary: "", submissionMessage: "" });
  },

  onUseExample() {
    if (this.data.submitting) return;
    this.setData({
      draft: Object.assign({}, this._exampleDraft || {}),
      errors: {},
      errorSummary: "",
      submissionMessage: ""
    });
    wx.showToast({ title: "已填入本地示例", icon: "none" });
  },

  onReset() {
    if (this.data.submitting) return;
    this.setData({
      draft: Object.assign({}, this._initialDraft || {}),
      errors: {},
      errorSummary: "",
      submissionMessage: ""
    });
  },

  async onPreviewTap() {
    if (this.data.submitting) {
      this.setData({ submissionMessage: "正在生成本地预览，请勿重复点击" });
      return;
    }
    const requestId = (this._submissionRequestId || 0) + 1;
    this._submissionRequestId = requestId;
    this.setData({ submitting: true, errors: {}, errorSummary: "", submissionMessage: "正在生成本地预览，不会提交或发布" });
    try {
      const result = await employerService.prepareJobPreview(this.data.draft);
      if (requestId !== this._submissionRequestId) return;
      this.setData({ submitting: false, submissionMessage: "" });
      const snapshot = encodeURIComponent(JSON.stringify(result.preview));
      wx.navigateTo({
        url: `/pages/employer-job-preview/index?snapshot=${snapshot}`,
        fail: () => {
          wx.showModal({
            title: "页面暂时无法打开",
            content: "表单校验已通过，但预览页面暂时无法打开。岗位没有保存、提交或发布。",
            showCancel: false,
            confirmText: "我知道了"
          });
        }
      });
    } catch (error) {
      if (requestId !== this._submissionRequestId) return;
      const fieldErrors = error && error.details && error.details.fields;
      this.setData({
        submitting: false,
        errors: fieldErrors || {},
        errorSummary: fieldErrors ? "还有信息需要补充，请查看标红提示。" : employerService.messageForError(error),
        submissionMessage: ""
      });
    }
  }
});
