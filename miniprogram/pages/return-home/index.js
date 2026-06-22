const { returnHomeMock } = require("../../data/return-home");

Page({
  data: {
    returnHome: returnHomeMock,
    activeCategory: "jobs",
    activeRegion: "all",
    visibleLocalJobs: returnHomeMock.localJobs
  },

  onCategoryTap(event) {
    const categoryId = event.currentTarget.dataset.id;
    const target = event.currentTarget.dataset.target;

    if (!categoryId || !target) {
      return;
    }

    this.setData({
      activeCategory: categoryId
    });

    wx.pageScrollTo({
      selector: `#${target}`,
      duration: 300
    });
  },

  onJobFilterTap(event) {
    const regionCode = String(event.currentTarget.dataset.regionCode || "all");
    const filter = returnHomeMock.jobFilters.find(
      (item) => item.regionCode === regionCode
    );
    const visibleLocalJobs = regionCode === "all"
      ? returnHomeMock.localJobs
      : returnHomeMock.localJobs.filter(
        (item) => item.regionCode === regionCode
      );

    this.setData({
      activeRegion: regionCode,
      visibleLocalJobs
    });

    wx.showToast({
      title: regionCode === "all" ? "已显示全部" : `已筛选${filter ? filter.label : "地区"}`,
      icon: "none"
    });
  },

  onActionTap(event) {
    const feedback = event.currentTarget.dataset.feedback || "请到窗口咨询";

    wx.showToast({
      title: feedback,
      icon: "none"
    });
  }
});
