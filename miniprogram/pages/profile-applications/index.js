const { profileMock } = require("../../data/profile");

function filtersWithCounts(records) {
  return profileMock.applications.filters.map((filter) => ({
    ...filter,
    count: filter.id === "all" ? records.length : records.filter((item) => item.status === filter.id).length
  }));
}

Page({
  data: {
    applications: JSON.parse(JSON.stringify(profileMock.applications)),
    filters: filtersWithCounts(profileMock.applications.records),
    activeFilter: "all",
    visibleRecords: JSON.parse(JSON.stringify(profileMock.applications.records)),
    expandedId: "",
    feedback: "筛选前说明：以下都是本地示例，不代表真实投递进度。"
  },

  onFilterTap(event) {
    const status = event.currentTarget.dataset.status;
    const records = this.data.applications.records;
    const visibleRecords = status === "all" ? records : records.filter((item) => item.status === status);
    this.setData({
      activeFilter: status,
      visibleRecords,
      expandedId: "",
      feedback: `已在本页筛选出${visibleRecords.length}条演示记录。`
    });
  },

  onRecordTap(event) {
    const id = event.currentTarget.dataset.id;
    const expandedId = this.data.expandedId === id ? "" : id;
    this.setData({
      expandedId,
      feedback: expandedId
        ? "已展开演示记录详情；没有发起新的投递。"
        : "已收起演示记录详情。"
    });
  },

  onContactTap() {
    this.setData({ feedback: "联系入口暂未开放；不会拨号、发消息或通知企业。" });
  }
});
