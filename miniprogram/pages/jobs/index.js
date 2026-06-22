const jobsService = require("../../services/jobs");

const ui = jobsService.getUiConfig();

function withFavoriteState(items, favoriteIds) {
  return items.map((job) => Object.assign({}, job, {
    isFavorite: favoriteIds.includes(job.id)
  }));
}

Page({
  data: {
    header: ui.header,
    zones: ui.zones,
    filters: ui.filters,
    sorts: ui.sorts,
    scenarios: ui.scenarios,
    visibleJobs: [],
    query: "",
    activeFilterId: "all",
    activeZoneId: "all",
    activeSortId: "recommended",
    selectedScenario: "normal",
    favoriteCount: 0,
    total: 0,
    page: 0,
    pageSize: 2,
    hasMore: false,
    nextPage: null,
    loadingMore: false,
    pageFeedback: "",
    loadState: "loading",
    errorKind: "",
    stateMessage: "正在异步读取本地示例岗位"
  },

  onLoad() {
    this._requestGeneration = 0;
    return this.loadJobs(true);
  },

  onShow() {
    if (this.data.loadState === "normal") this.refreshFavorites();
  },

  async loadJobs(reset) {
    const shouldReset = reset !== false;
    if (!shouldReset && (this.data.loadingMore || !this.data.hasMore)) return false;
    if (shouldReset) this._requestGeneration = (this._requestGeneration || 0) + 1;
    const generation = this._requestGeneration || 1;
    const page = shouldReset ? 1 : this.data.nextPage;

    this.setData(shouldReset ? {
      visibleJobs: [],
      total: 0,
      page: 0,
      hasMore: false,
      nextPage: null,
      loadingMore: false,
      pageFeedback: "",
      loadState: "loading",
      errorKind: "",
      stateMessage: "正在异步读取本地示例岗位"
    } : { loadingMore: true, pageFeedback: "" });

    try {
      const result = await jobsService.list({
        query: this.data.query,
        filterId: this.data.activeFilterId,
        zoneId: this.data.activeZoneId,
        sortId: this.data.activeSortId,
        page,
        pageSize: this.data.pageSize,
        scenario: this.data.selectedScenario
      });
      if (generation !== this._requestGeneration) return false;
      const visibleJobs = shouldReset
        ? result.items
        : this.data.visibleJobs.concat(result.items);
      this.setData({
        visibleJobs,
        favoriteCount: jobsService.getFavoriteIds().length,
        total: result.total,
        page: result.page,
        hasMore: result.hasMore,
        nextPage: result.nextPage,
        loadingMore: false,
        pageFeedback: "",
        loadState: visibleJobs.length ? "normal" : "empty",
        errorKind: "",
        stateMessage: visibleJobs.length ? "" : "没有找到符合条件的本地示例岗位"
      });
      return true;
    } catch (error) {
      if (generation !== this._requestGeneration) return false;
      this.setData({
        visibleJobs: shouldReset ? [] : this.data.visibleJobs,
        loadingMore: false,
        loadState: shouldReset ? "error" : this.data.loadState,
        errorKind: error && error.kind ? error.kind : "unknown",
        stateMessage: `${jobsService.messageForError(error)}。这是本地状态测试，没有发起真实网络请求。`,
        pageFeedback: shouldReset
          ? ""
          : `${jobsService.messageForError(error)}，可重试加载更多。没有发起真实网络请求。`
      });
      return false;
    }
  },

  refreshFavorites() {
    const favoriteIds = jobsService.getFavoriteIds();
    this.setData({
      visibleJobs: withFavoriteState(this.data.visibleJobs, favoriteIds),
      favoriteCount: favoriteIds.length
    });
  },

  reloadWith(patch) {
    this._requestGeneration = (this._requestGeneration || 0) + 1;
    this.setData(patch, () => this.loadJobs(true));
  },

  onSearchInput(event) {
    this.reloadWith({ query: event.detail.value || "" });
  },

  onClearSearch() {
    this.reloadWith({ query: "" });
  },

  onFilterTap(event) {
    this.reloadWith({ activeFilterId: event.currentTarget.dataset.id });
  },

  onZoneTap(event) {
    const zoneId = event.currentTarget.dataset.id;
    this.reloadWith({
      activeZoneId: this.data.activeZoneId === zoneId ? "all" : zoneId
    });
  },

  onSortTap(event) {
    this.reloadWith({ activeSortId: event.currentTarget.dataset.id });
  },

  onScenarioTap(event) {
    const scenario = event.currentTarget.dataset.scenario;
    if (!this.data.scenarios.some((item) => item.id === scenario)) return;
    this.reloadWith({ selectedScenario: scenario });
  },

  onClearConditions() {
    this.reloadWith({
      query: "",
      activeFilterId: "all",
      activeZoneId: "all",
      activeSortId: "recommended",
      selectedScenario: "normal"
    });
  },

  onLoadMore() {
    return this.loadJobs(false);
  },

  onToggleFavorite(event) {
    const isFavorite = jobsService.toggleFavorite(event.currentTarget.dataset.id);
    this.refreshFavorites();
    wx.showToast({
      title: isFavorite ? "本次打开期间已收藏" : "已取消本地收藏",
      icon: "none"
    });
  },

  onOpenDetail(event) {
    const id = event.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/job-detail/index?id=${id}`,
      fail: () => {
        wx.showModal({
          title: "暂时无法打开详情",
          content: "职位详情页暂时无法打开，请稍后重试。当前没有发起真实业务请求。",
          showCancel: false,
          confirmText: "我知道了"
        });
      }
    });
  },

  onRetry() {
    this.setData({ selectedScenario: "normal" }, () => this.loadJobs(true));
  }
});
