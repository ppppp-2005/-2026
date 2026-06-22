const employerService = require("../../services/employer");

function stateTitle(kind) {
  const titles = {
    empty: "本地岗位预览暂无内容",
    offline: "当前处于离线状态",
    timeout: "读取岗位预览超时",
    server: "岗位预览示例服务暂不可用",
    network: "读取岗位预览时网络异常"
  };
  return titles[kind] || "岗位预览暂时无法显示";
}

Page({
  data: {
    preview: null,
    honestNote: "仅预览：这条岗位没有发送到平台，求职者看不到，也不会进入审核。",
    loadNote: "正在读取本地预览",
    loadState: "loading",
    stateTitle: "正在读取本地预览",
    stateMessage: "只读取当前页面参数和集中示例",
    demoScenarios: employerService.UI_SCENARIOS,
    demoScenario: "normal",
    authPending: false,
    confirming: false,
    confirmedLocally: false,
    confirmationMessage: ""
  },

  onLoad(options) {
    this._loadOptions = options || {};
    this.loadPreview();
  },

  onUnload() {
    this._previewRequestId = (this._previewRequestId || 0) + 1;
    this._confirmationRequestId = (this._confirmationRequestId || 0) + 1;
  },

  async loadPreview() {
    const requestId = (this._previewRequestId || 0) + 1;
    this._previewRequestId = requestId;
    this.setData({ loadState: "loading", stateTitle: "正在读取本地预览", stateMessage: "只读取当前页面参数和集中示例" });
    try {
      const result = await employerService.getJobPreview({
        snapshot: this._loadOptions && this._loadOptions.snapshot,
        scenario: this.data.demoScenario
      });
      if (requestId !== this._previewRequestId) return;
      if (!result) {
        this.setData({ loadState: "empty", stateTitle: stateTitle("empty"), stateMessage: "当前本地状态没有可显示内容，也没有发布任何岗位" });
        return;
      }
      this.setData({
        preview: result.preview,
        honestNote: result.honestNote,
        loadNote: result.loadNote,
        loadState: "normal",
        stateMessage: ""
      });
    } catch (error) {
      if (requestId !== this._previewRequestId) return;
      const kind = error && error.kind === "unauthorized" ? "unauthorized" : (error && error.kind) || "error";
      this.setData({
        preview: null,
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
      await this.loadPreview();
    } catch (error) {
      this.setData({ authPending: false, stateMessage: employerService.messageForError(error) });
    }
  },

  onRetry() {
    this.setData({ demoScenario: "normal" });
    return this.loadPreview();
  },

  onScenarioTap(event) {
    const scenario = event.currentTarget.dataset.scenario;
    if (!employerService.UI_SCENARIOS.some((item) => item.id === scenario)) return;
    this.setData({ demoScenario: scenario });
    return this.loadPreview();
  },

  onConfirmPreview() {
    if (this.data.confirming) {
      this.setData({ confirmationMessage: "本地确认正在进行，请勿重复点击" });
      return;
    }
    wx.showModal({
      title: "确认预览内容（不发布）",
      content: "继续只会完成本页确认。岗位不会发送到平台，不会进入审核，求职者也看不到。",
      confirmText: "确认本地预览",
      cancelText: "继续检查",
      success: async (result) => {
        if (!result.confirm || this.data.confirming) return;
        const requestId = (this._confirmationRequestId || 0) + 1;
        this._confirmationRequestId = requestId;
        this.setData({ confirming: true, confirmationMessage: "正在完成本页确认，不会发布或生成企业回执" });
        try {
          await employerService.confirmPreviewDemo();
          if (requestId !== this._confirmationRequestId) return;
          this.setData({ confirming: false, confirmedLocally: true, confirmationMessage: "" });
          wx.showModal({
            title: "仅完成本地确认",
            content: "没有发布岗位，也没有发送任何数据或生成企业回执。求职者仍然看不到这条预览。",
            showCancel: false,
            confirmText: "我知道了"
          });
        } catch (error) {
          if (requestId !== this._confirmationRequestId) return;
          this.setData({ confirming: false, confirmationMessage: employerService.messageForError(error) });
        }
      }
    });
  },

  onBackToEdit() {
    wx.navigateBack({ delta: 1 });
  }
});
