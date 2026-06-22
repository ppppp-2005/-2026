const jobsService = require("../../services/jobs");

Page({
  data: {
    jobId: "",
    job: null,
    scenarios: jobsService.getUiConfig().scenarios,
    selectedScenario: "normal",
    loadState: "loading",
    errorKind: "",
    stateMessage: "正在异步读取本地示例岗位详情",
    isFavorite: false,
    applyDemoDone: false,
    applySubmitting: false
  },

  onLoad(options) {
    this._requestGeneration = 0;
    this.setData({ jobId: (options && options.id) || "" });
    return this.loadJob();
  },

  onShow() {
    if (this.data.loadState === "normal") this.refreshFavorite();
  },

  async loadJob() {
    const generation = (this._requestGeneration || 0) + 1;
    this._requestGeneration = generation;
    this.setData({
      job: null,
      loadState: "loading",
      errorKind: "",
      stateMessage: "正在异步读取本地示例岗位详情"
    });

    try {
      const job = await jobsService.getById(this.data.jobId, {
        scenario: this.data.selectedScenario
      });
      if (generation !== this._requestGeneration) return false;
      if (!job) {
        this.setData({
          loadState: "not-found",
          stateMessage: "没有找到这个本地示例岗位，可能已使用不存在的职位编号。"
        });
        return false;
      }
      this.setData({ job, loadState: "normal", stateMessage: "" });
      this.refreshFavorite();
      return true;
    } catch (error) {
      if (generation !== this._requestGeneration) return false;
      if (error && error.code === "MISSING_JOB_ID") {
        this.setData({
          loadState: "missing-id",
          errorKind: "validation",
          stateMessage: "链接中缺少职位编号，请返回职位列表重新选择。"
        });
      } else {
        this.setData({
          loadState: "error",
          errorKind: error && error.kind ? error.kind : "unknown",
          stateMessage: `${jobsService.messageForError(error)}。这是本地状态测试，没有发起真实网络请求。`
        });
      }
      return false;
    }
  },

  refreshFavorite() {
    this.setData({
      isFavorite: jobsService.getFavoriteIds().includes(this.data.jobId)
    });
  },

  onScenarioTap(event) {
    const scenario = event.currentTarget.dataset.scenario;
    if (!this.data.scenarios.some((item) => item.id === scenario) || this.data.applySubmitting) return;
    this.setData({ selectedScenario: scenario }, () => this.loadJob());
  },

  onToggleFavorite() {
    const isFavorite = jobsService.toggleFavorite(this.data.jobId);
    this.setData({ isFavorite });
    wx.showToast({
      title: isFavorite ? "本次打开期间已收藏" : "已取消本地收藏",
      icon: "none"
    });
  },

  onApplyTap() {
    if (this.data.applySubmitting || jobsService.isApplyPending(this.data.jobId)) {
      wx.showToast({ title: "操作进行中，请勿重复点击", icon: "none" });
      return;
    }
    wx.showModal({
      title: "确认体验投递步骤",
      content: "这是本地前端演示，不会真实投递，企业也不会收到简历。确认继续体验吗？",
      confirmText: "继续演示",
      cancelText: "先不操作",
      success: async (result) => {
        if (!result.confirm || this.data.applySubmitting) return;
        this.setData({ applySubmitting: true });
        try {
          await jobsService.applyDemo(this.data.jobId);
          this.setData({ applyDemoDone: true });
          wx.showModal({
            title: "未真实投递",
            content: "仅完成本地演示确认。没有发送简历，也没有联系企业。",
            showCancel: false,
            confirmText: "我知道了"
          });
        } catch (error) {
          wx.showModal({
            title: "演示步骤未完成",
            content: `${jobsService.messageForError(error)}。没有发送简历，也没有联系企业。`,
            showCancel: false,
            confirmText: "我知道了"
          });
        } finally {
          this.setData({ applySubmitting: false });
        }
      }
    });
  },

  onRetry() {
    this.setData({ selectedScenario: "normal" }, () => this.loadJob());
  },

  onBack() {
    wx.navigateBack({ delta: 1 });
  }
});
