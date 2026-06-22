import { trainingSignupMock } from "../../data/training-signup";

function getSessionsByStatus(status: string) {
  if (status === "all") {
    return trainingSignupMock.sessions;
  }

  return trainingSignupMock.sessions.filter((session) => session.status === status);
}

Page({
  data: {
    trainingSignup: trainingSignupMock,
    activeStatus: "all",
    visibleSessions: trainingSignupMock.sessions
  },

  onStatusFilterTap(event: WechatMiniprogram.BaseEvent) {
    const { status } = event.currentTarget.dataset;
    const selectedFilter = trainingSignupMock.filters.find((filter) => filter.id === status);

    if (!selectedFilter) {
      return;
    }

    this.setData({
      activeStatus: status,
      visibleSessions: getSessionsByStatus(status)
    });

    wx.showToast({
      title: `已显示${selectedFilter.name}`,
      icon: "none",
      duration: 1200
    });
  },

  onSignupTap(event: WechatMiniprogram.BaseEvent) {
    const { sessionId } = event.currentTarget.dataset;
    const session = trainingSignupMock.sessions.find((item) => item.id === sessionId);

    if (!session) {
      return;
    }

    if (session.status === "ended") {
      this.setData({
        activeStatus: "all",
        visibleSessions: trainingSignupMock.sessions
      });
      wx.showToast({
        title: "本期已结束，已显示其他班次",
        icon: "none",
        duration: 1800
      });
      return;
    }

    wx.showToast({
      title: trainingSignupMock.action.unavailableToast,
      icon: "none",
      duration: 1800
    });
  }
});
