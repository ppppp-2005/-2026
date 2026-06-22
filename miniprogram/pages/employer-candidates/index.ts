const employerService = require("../../services/employer");

function stateTitle(kind) {
  const titles = {
    offline: "当前处于离线状态",
    timeout: "读取候选人超时",
    server: "候选人示例服务暂不可用",
    network: "读取候选人时网络异常"
  };
  return titles[kind] || "暂时无法显示候选人";
}

function filterSnapshot(data) {
  return JSON.stringify([data.activeStatusId, data.activeJobId, data.query, data.demoScenario]);
}

Page({
  data: {
    filters: [],
    jobs: [],
    honestNote: "以下均为本地示例。查看和标记不会联系、邀约、拒绝或通知任何候选人。",
    visibleCandidates: [],
    activeStatusId: "all",
    activeJobId: "all",
    query: "",
    demoScenarios: employerService.UI_SCENARIOS,
    demoScenario: "normal",
    loadState: "loading",
    stateTitle: "正在读取本地示例",
    stateMessage: "正在整理本地示例候选人",
    authPending: false,
    expandedCandidateId: "",
    page: 0,
    hasMore: false,
    loadingMore: false,
    pageFeedback: "",
    pageError: "",
    pageErrorKind: "",
    failedAppendPage: 0,
    total: 0,
    markingCandidateId: ""
  },

  _beginAuthAttempt(kind, retryGeneration = 0) {
    const owner = {
      id: (this._authAttemptId || 0) + 1,
      kind,
      retryGeneration
    };
    this._authAttemptId = owner.id;
    this._authPendingOwner = owner;
    this.setData({ authPending: true });
    return owner;
  },

  _ownsAuthAttempt(owner) {
    return this._authPendingOwner === owner;
  },

  _clearAuthAttempt(owner, patch = {}) {
    if (!this._ownsAuthAttempt(owner)) return false;
    this._authPendingOwner = null;
    this.setData(Object.assign({}, patch, { authPending: false }));
    return true;
  },

  onLoad(options) {
    this.setData({ activeJobId: (options && options.jobId) || "all" }, () => this.loadCandidates());
  },

  onUnload() {
    this._candidateRequestId = (this._candidateRequestId || 0) + 1;
    this._markRequestId = (this._markRequestId || 0) + 1;
  },

  async loadCandidates(append = false, requestedPage = 0) {
    if (!append) {
      this._filterGeneration = (this._filterGeneration || 0) + 1;
      this._appendRetryGeneration = (this._appendRetryGeneration || 0) + 1;
      this._failedAppendContext = null;
      const authOwner = this._authPendingOwner;
      if (
        authOwner &&
        authOwner.kind === "append-retry" &&
        authOwner.retryGeneration < this._appendRetryGeneration
      ) this._clearAuthAttempt(authOwner);
    }
    const requestId = (this._candidateRequestId || 0) + 1;
    this._candidateRequestId = requestId;
    const page = append ? (requestedPage || this.data.page + 1) : 1;
    if (append) {
      this.setData({
        loadingMore: true,
        pageFeedback: `正在读取第${page}页本地示例`,
        pageError: "",
        pageErrorKind: "",
        failedAppendPage: 0
      });
      this._failedAppendContext = null;
    } else {
      this.setData({
        loadState: "loading",
        stateTitle: "正在读取本地示例",
        stateMessage: "正在整理本地示例候选人",
        visibleCandidates: [],
        expandedCandidateId: "",
        page: 0,
        hasMore: false,
        pageFeedback: "",
        pageError: "",
        pageErrorKind: "",
        failedAppendPage: 0
      });
      this._failedAppendContext = null;
    }
    try {
      const result = await employerService.listCandidates({
        page,
        pageSize: 3,
        statusId: this.data.activeStatusId,
        jobId: this.data.activeJobId,
        query: this.data.query,
        scenario: this.data.demoScenario
      });
      if (requestId !== this._candidateRequestId) return;
      const visibleCandidates = append
        ? this.data.visibleCandidates.concat(result.items)
        : result.items;
      this.setData({
        filters: result.filters,
        jobs: result.jobs,
        honestNote: result.honestNote,
        visibleCandidates,
        loadState: visibleCandidates.length ? "normal" : "empty",
        stateTitle: visibleCandidates.length ? "" : "没有可显示的示例候选人",
        stateMessage: visibleCandidates.length ? "" : "当前本地条件下没有示例候选人",
        page: result.page,
        hasMore: result.hasMore,
        total: result.total,
        loadingMore: false,
        pageFeedback: "",
        pageError: "",
        pageErrorKind: "",
        failedAppendPage: 0
      });
    } catch (error) {
      if (requestId !== this._candidateRequestId) return;
      const kind = error && error.kind === "unauthorized" ? "unauthorized" : (error && error.kind) || "error";
      if (append && this.data.visibleCandidates.length) {
        this._failedAppendContext = {
          page,
          filterGeneration: this._filterGeneration || 0,
          filterSnapshot: filterSnapshot(this.data)
        };
        this.setData({
          loadingMore: false,
          pageFeedback: stateTitle(kind),
          pageError: employerService.messageForError(error),
          pageErrorKind: kind,
          failedAppendPage: page
        });
        return;
      }
      this.setData({
        visibleCandidates: [],
        loadState: kind,
        stateTitle: kind === "unauthorized" ? "需要企业本地演示身份" : stateTitle(kind),
        stateMessage: employerService.messageForError(error),
        loadingMore: false,
        hasMore: false
      });
    }
  },

  async onStartEmployerDemo() {
    if (this.data.authPending) return;
    const authOwner = this._beginAuthAttempt("page-entry");
    this.setData({ stateMessage: "正在进入企业本地演示，不会进行真实登录" });
    try {
      await employerService.startEmployerDemo();
      if (!this._clearAuthAttempt(authOwner, { demoScenario: "normal" })) return;
      await this.loadCandidates();
    } catch (error) {
      this._clearAuthAttempt(authOwner, { stateMessage: employerService.messageForError(error) });
    }
  },

  onScenarioTap(event) {
    const scenario = event.currentTarget.dataset.scenario;
    if (!employerService.UI_SCENARIOS.some((item) => item.id === scenario)) return;
    this.setData({ demoScenario: scenario }, () => this.loadCandidates());
  },

  onRetry() {
    this.setData({ demoScenario: "normal" }, () => this.loadCandidates());
  },

  onSearchInput(event) {
    this.setData({ query: event.detail.value || "" });
    return this.loadCandidates();
  },

  onStatusFilterTap(event) {
    this.setData({ activeStatusId: event.currentTarget.dataset.id });
    return this.loadCandidates();
  },

  onJobFilterTap(event) {
    this.setData({ activeJobId: event.currentTarget.dataset.id });
    return this.loadCandidates();
  },

  onClearFilters() {
    this.setData({
      activeStatusId: "all",
      activeJobId: "all",
      query: "",
      demoScenario: "normal"
    });
    return this.loadCandidates();
  },

  onLoadMore() {
    if (!this.data.hasMore || this.data.loadingMore) return;
    return this.loadCandidates(true);
  },

  async onRetryPage() {
    const retryContext = this._failedAppendContext;
    if (!retryContext || !retryContext.page || this.data.loadingMore) return;
    const retryGeneration = (this._appendRetryGeneration || 0) + 1;
    this._appendRetryGeneration = retryGeneration;
    if (this.data.pageErrorKind === "unauthorized") {
      const authOwner = this._beginAuthAttempt("append-retry", retryGeneration);
      this.setData({ pageFeedback: "正在重新进入企业本地演示" });
      try {
        await employerService.startEmployerDemo();
      } catch (error) {
        if (!this._ownsAuthAttempt(authOwner)) return;
        this._clearAuthAttempt(authOwner, {
          pageFeedback: stateTitle("unauthorized"),
          pageError: employerService.messageForError(error)
        });
        return;
      }
      if (
        retryGeneration !== this._appendRetryGeneration ||
        retryContext.filterGeneration !== this._filterGeneration ||
        retryContext.filterSnapshot !== filterSnapshot(this.data)
      ) {
        this._clearAuthAttempt(authOwner);
        return;
      }
      if (!this._clearAuthAttempt(authOwner)) return;
    }
    if (
      retryGeneration !== this._appendRetryGeneration ||
      retryContext.filterGeneration !== this._filterGeneration ||
      retryContext.filterSnapshot !== filterSnapshot(this.data)
    ) return;
    this.setData({ demoScenario: "normal" });
    return this.loadCandidates(true, retryContext.page);
  },

  onToggleCandidate(event) {
    const candidateId = event.currentTarget.dataset.id;
    this.setData({
      expandedCandidateId: this.data.expandedCandidateId === candidateId ? "" : candidateId
    });
  },

  onDemoMark(event) {
    const candidateId = event.currentTarget.dataset.id;
    if (this.data.markingCandidateId) return;
    wx.showModal({
      title: "体验本页标记",
      content: "确认后只会在本页显示“稍后再看”。不会联系、邀约、拒绝或通知候选人。",
      confirmText: "仅本页标记",
      cancelText: "取消",
      success: async (result) => {
        if (!result.confirm || this.data.markingCandidateId) return;
        const requestId = (this._markRequestId || 0) + 1;
        this._markRequestId = requestId;
        this.setData({ markingCandidateId: candidateId });
        try {
          const mark = await employerService.markCandidateDemo(candidateId);
          if (requestId !== this._markRequestId) return;
          const visibleCandidates = this.data.visibleCandidates.map((candidate) =>
            candidate.id === candidateId
              ? Object.assign({}, candidate, { demoStatusLabel: mark.demoStatusLabel })
              : candidate
          );
          this.setData({ visibleCandidates, markingCandidateId: "" });
          wx.showModal({
            title: "仅本页演示",
            content: "标记没有保存，也没有联系或通知候选人。离开页面后不会保留。",
            showCancel: false,
            confirmText: "我知道了"
          });
        } catch (error) {
          if (requestId !== this._markRequestId) return;
          this.setData({ markingCandidateId: "", stateMessage: employerService.messageForError(error) });
          wx.showToast({ title: employerService.messageForError(error), icon: "none" });
        }
      }
    });
  }
});
