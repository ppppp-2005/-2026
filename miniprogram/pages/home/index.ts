import { homeMock } from "../../data/home";

const NEWS_PREVIEW_COUNT = 3;
const SERVICES_PREVIEW_COUNT = 4;

function showNavigationFailure() {
  wx.showToast({
    title: "页面暂时无法打开",
    icon: "none"
  });
}

function openNavigation(target: any) {
  if (!target || !target.enabled || !target.route) {
    return false;
  }

  if (target.type === "tab") {
    wx.switchTab({
      url: target.route,
      fail: showNavigationFailure
    });
    return true;
  }

  if (target.type === "page") {
    wx.navigateTo({
      url: target.route,
      fail: showNavigationFailure
    });
    return true;
  }

  return false;
}

Page({
  data: {
    home: homeMock,
    visibleNews: homeMock.news.slice(0, NEWS_PREVIEW_COUNT),
    visibleServices: homeMock.services.slice(0, SERVICES_PREVIEW_COUNT),
    isNewsExpanded: false,
    isServicesExpanded: false,
    newsActionText: homeMock.ui.moreText,
    servicesActionText: homeMock.ui.allText
  },

  onLoginTap() {
    wx.navigateTo({
      url: "/pages/profile-login/index",
      fail: showNavigationFailure
    });
  },

  onSearchTap() {
    wx.switchTab({
      url: "/pages/jobs/index",
      fail: showNavigationFailure
    });
  },

  onNewsMoreTap() {
    const isNewsExpanded = !this.data.isNewsExpanded;
    this.setData({
      isNewsExpanded,
      visibleNews: homeMock.news.slice(0, isNewsExpanded ? homeMock.news.length : NEWS_PREVIEW_COUNT),
      newsActionText: isNewsExpanded ? homeMock.ui.collapseText : homeMock.ui.moreText
    });
  },

  onServicesAllTap() {
    const isServicesExpanded = !this.data.isServicesExpanded;
    this.setData({
      isServicesExpanded,
      visibleServices: homeMock.services.slice(
        0,
        isServicesExpanded ? homeMock.services.length : SERVICES_PREVIEW_COUNT
      ),
      servicesActionText: isServicesExpanded ? homeMock.ui.collapseText : homeMock.ui.allText
    });
  },

  onEntryTap(event: { currentTarget: { dataset: { index: number | string } } }) {
    const index = Number(event.currentTarget.dataset.index);
    const entry = homeMock.quickEntries[index];

    if (openNavigation(entry)) {
      return;
    }

    wx.showToast({
      title: "功能建设中",
      icon: "none"
    });
  },

  onServiceTap(event: { currentTarget: { dataset: { index: number | string } } }) {
    const index = Number(event.currentTarget.dataset.index);
    const service = homeMock.services[index];

    if (openNavigation(service)) {
      return;
    }

    wx.showToast({
      title: "功能建设中",
      icon: "none"
    });
  }
});
