const { eventsMock } = require("../../data/events");

function filterEvents(events, typeId, statusId) {
  return events.filter((item) => {
    const matchesType = item.type === typeId;
    const matchesStatus = statusId === "all" || item.status === statusId;
    return matchesType && matchesStatus;
  });
}

Page({
  data: {
    header: eventsMock.header,
    typeTabs: eventsMock.typeTabs,
    statusFilters: eventsMock.statusFilters,
    allEvents: [],
    visibleEvents: [],
    activeTypeId: "live",
    activeStatusId: "all",
    loadState: "loading",
    stateMessage: "正在整理本地示例活动"
  },

  onLoad() {
    this.loadEvents();
  },

  loadEvents() {
    this.setData({
      loadState: "loading",
      stateMessage: "正在整理本地示例活动"
    });

    try {
      if (!eventsMock || !Array.isArray(eventsMock.events)) {
        throw new Error("Invalid local events data");
      }
      this.setData({ allEvents: eventsMock.events.slice() }, () => this.applyFilters());
    } catch (error) {
      this.setData({
        visibleEvents: [],
        loadState: "error",
        stateMessage: "示例活动暂时无法显示，请重试"
      });
    }
  },

  applyFilters() {
    try {
      const visibleEvents = filterEvents(
        this.data.allEvents,
        this.data.activeTypeId,
        this.data.activeStatusId
      );
      this.setData({
        visibleEvents,
        loadState: visibleEvents.length ? "normal" : "empty",
        stateMessage: visibleEvents.length ? "" : "这个分类下暂时没有对应状态的示例活动"
      });
    } catch (error) {
      this.setData({
        visibleEvents: [],
        loadState: "error",
        stateMessage: "筛选示例活动时出了问题，请重试"
      });
    }
  },

  onTypeTap(event) {
    this.setData({
      activeTypeId: event.currentTarget.dataset.id
    }, () => this.applyFilters());
  },

  onStatusTap(event) {
    this.setData({
      activeStatusId: event.currentTarget.dataset.id
    }, () => this.applyFilters());
  },

  onShowAllStatuses() {
    this.setData({ activeStatusId: "all" }, () => this.applyFilters());
  },

  onOpenDetail(event) {
    const id = event.currentTarget.dataset.id;
    if (!id) {
      wx.showToast({
        title: "活动信息不完整",
        icon: "none"
      });
      return;
    }

    wx.navigateTo({
      url: `/pages/event-detail/index?id=${encodeURIComponent(id)}`,
      fail: () => {
        wx.showModal({
          title: "暂时无法打开详情",
          content: "活动详情暂时无法打开，请稍后重试。当前没有发起真实业务请求。",
          showCancel: false,
          confirmText: "我知道了"
        });
      }
    });
  },

  onRetry() {
    this.loadEvents();
  }
});
