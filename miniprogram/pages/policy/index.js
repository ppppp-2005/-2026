const { policyMock } = require("../../data/policy");

function getPoliciesByCategory(categoryId) {
  if (categoryId === "all") {
    return policyMock.policies;
  }

  return policyMock.policies.filter((item) => item.categoryId === categoryId);
}

Page({
  data: {
    policy: policyMock,
    selectedCategoryId: "all",
    selectedCategoryName: "全部政策",
    visiblePolicies: policyMock.policies,
    expandedPolicyId: ""
  },

  onCategoryTap(event) {
    const { id, name } = event.currentTarget.dataset;
    const visiblePolicies = getPoliciesByCategory(id);

    this.setData({
      selectedCategoryId: id,
      selectedCategoryName: name,
      visiblePolicies,
      expandedPolicyId: ""
    });

    wx.showToast({
      title: `已显示${visiblePolicies.length}项`,
      icon: "none"
    });
  },

  onReminderTap() {
    wx.showToast({
      title: "办理前先向当地窗口确认",
      icon: "none"
    });
  },

  onPolicyDetailTap(event) {
    const { id } = event.currentTarget.dataset;
    const isClosing = this.data.expandedPolicyId === id;

    this.setData({
      expandedPolicyId: isClosing ? "" : id
    });

    wx.showToast({
      title: isClosing ? "已收起办理要点" : "已展开办理要点",
      icon: "none"
    });
  },

  onConsultTap(event) {
    const { office } = event.currentTarget.dataset;

    wx.showModal({
      title: "先确认再办理",
      content: `建议先咨询：${office}\n也可拨打12333了解当地人社服务信息。`,
      showCancel: false,
      confirmText: "知道了"
    });
  }
});
