const { campusMock } = require("../../data/campus");

Page({
  data: {
    campus: campusMock,
    activeFilterId: "all",
    visibleOpportunities: campusMock.opportunities
  },

  handleFilterTap(event) {
    const filterId = event.currentTarget.dataset.id;
    const visibleOpportunities = filterId === "all"
      ? campusMock.opportunities
      : campusMock.opportunities.filter((item) => item.type === filterId);
    const selectedFilter = campusMock.opportunityFilters.find((item) => item.id === filterId);

    this.setData({
      activeFilterId: filterId,
      visibleOpportunities
    });

    wx.showToast({
      title: selectedFilter ? `已筛选${selectedFilter.name}` : "筛选已更新",
      icon: "none"
    });
  },

  handleEventAction() {
    wx.showToast({
      title: "安排已展示",
      icon: "none"
    });
  },

  handleOpportunityAction() {
    wx.showToast({
      title: "详情暂未开放",
      icon: "none"
    });
  }
});
