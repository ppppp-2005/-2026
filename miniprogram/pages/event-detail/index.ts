const { findEventById } = require("../../data/events");

Page({
  data: {
    eventId: "",
    event: null,
    loadState: "loading",
    stateMessage: "正在读取本地示例活动",
    isInterested: false,
    interestFeedback: "当前未报名、未订阅，也不会通知主办方。标记前会再次说明。"
  },

  onLoad(options) {
    this.setData({ eventId: (options && options.id) || "" }, () => this.loadEvent());
  },

  loadEvent() {
    this.setData({
      event: null,
      loadState: "loading",
      stateMessage: "正在读取本地示例活动",
      isInterested: false,
      interestFeedback: "当前未报名、未订阅，也不会通知主办方。标记前会再次说明。"
    });

    try {
      const event = findEventById(this.data.eventId);
      if (!event) {
        this.setData({
          loadState: "error",
          stateMessage: "没有找到这个示例活动，可能是链接参数不完整"
        });
        return;
      }

      this.setData({
        event,
        loadState: "normal",
        stateMessage: ""
      });
    } catch (error) {
      this.setData({
        event: null,
        loadState: "error",
        stateMessage: "示例活动详情暂时无法显示"
      });
    }
  },

  onInterestTap() {
    if (this.data.isInterested) {
      this.setData({
        isInterested: false,
        interestFeedback: "已取消本页标记；此前也未真实报名、未订阅或通知主办方。"
      });
      wx.showToast({
        title: "已取消本页标记",
        icon: "none"
      });
      return;
    }

    wx.showModal({
      title: "仅做本页标记",
      content: "不会真实报名，不会订阅提醒，也不会通知主办方。确认在本页标记为感兴趣吗？",
      confirmText: "本页标记",
      cancelText: "先不操作",
      success: (result) => {
        if (!result.confirm) {
          return;
        }

        this.setData({
          isInterested: true,
          interestFeedback: "本页已标记感兴趣，但未真实报名、未订阅提醒，也不会通知主办方。"
        });
        wx.showModal({
          title: "未真实报名",
          content: "只更新了当前页面显示，没有报名、订阅或通知主办方。",
          showCancel: false,
          confirmText: "我知道了"
        });
      }
    });
  },

  onSignupInfoTap() {
    wx.showModal({
      title: "报名说明",
      content: "当前仅展示报名说明，不会提交报名信息，不会订阅提醒，也不会通知主办方。请以主办方正式渠道为准。",
      showCancel: false,
      confirmText: "我知道了"
    });
  },

  onRetry() {
    this.loadEvent();
  },

  onBack() {
    wx.navigateBack({ delta: 1 });
  }
});
