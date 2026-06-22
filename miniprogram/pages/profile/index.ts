const { profileMock } = require("../../data/profile");
const authSession = require("../../services/auth-session");

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function sessionView(session) {
  if (session.status === "authenticated") {
    return {
      name: session.displayName || "本地演示用户",
      status: `本地已登录 · ${session.role === "employer" ? "招聘方" : "求职者"}`,
      note: "会话只在当前运行内存中，重新加载后会清除。",
      action: "管理本地登录"
    };
  }
  if (session.status === "expired") {
    return {
      name: "本地演示用户",
      status: "登录已失效",
      note: "请重新体验登录；这不代表真实微信账号状态。",
      action: "重新体验登录"
    };
  }
  if (session.status === "loading") {
    return {
      name: "本地演示用户",
      status: "正在建立本地状态",
      note: "请稍候，不要重复提交。",
      action: "查看登录状态"
    };
  }
  return {
    name: "访客",
    status: "未登录 · 本地演示",
    note: "不会读取微信身份，也不会保存个人资料。",
    action: "体验本地登录"
  };
}

Page({
  data: {
    profile: clone(profileMock.hub),
    activeRole: "seeker",
    sessionStatus: "anonymous",
    identityName: "访客",
    identityStatus: "未登录 · 本地演示",
    identityNote: "不会读取微信身份，也不会保存个人资料。",
    loginActionText: "体验本地登录",
    helpExpanded: true,
    interactionNotice: "以下入口均为本地演示页面，不会连接后端。"
  },

  onShow() {
    this.refreshSession();
  },

  refreshSession() {
    const session = authSession.snapshot();
    const view = sessionView(session);
    this.setData({
      activeRole: session.role,
      sessionStatus: session.status,
      identityName: view.name,
      identityStatus: view.status,
      identityNote: view.note,
      loginActionText: view.action
    });
  },

  onLoginTap() {
    this.openProfileRoute("login", this.data.sessionStatus === "expired" ? "重新登录" : "本地登录");
  },

  onEntryTap(event) {
    const routeKey = event.currentTarget.dataset.route;
    const entry = this.data.profile.entries.find((item) => item.routeKey === routeKey);
    this.openProfileRoute(routeKey, entry ? entry.title : "个人中心");
  },

  openProfileRoute(routeKey, label) {
    const route = profileMock.routes[routeKey];

    if (!route) {
      this.setData({ interactionNotice: `${label}入口暂未开放。` });
      return;
    }

    this.setData({ interactionNotice: `正在打开${label}演示页；页面不会连接后端。` });
    wx.navigateTo({
      url: route,
      fail: () => {
        this.setData({
          interactionNotice: `${label}页面暂时无法打开，请稍后重试；本地演示数据未发生变化。`
        });
      }
    });
  },

  onRoleTap(event) {
    const roleId = event.currentTarget.dataset.role;
    const role = this.data.profile.roles.find((item) => item.id === roleId);
    if (!role) return;

    const session = authSession.snapshot();
    if (roleId === "employer" && session.status !== "authenticated") {
      this.setData({
        interactionNotice: session.status === "expired"
          ? "本地登录已失效，请重新体验后再进入招聘方页面。"
          : "请先完成本地登录体验，再进入招聘方页面。"
      });
      this.openProfileRoute("login", "本地登录");
      return;
    }

    authSession.setRole(roleId);
    this.refreshSession();
    if (roleId === "employer") {
      this.setData({
        interactionNotice: "正在进入招聘方本地演示；这不代表拥有真实企业权限。"
      });
      wx.navigateTo({
        url: profileMock.routes.employer,
        fail: () => {
          this.setData({
            interactionNotice: "招聘方页面暂时无法打开；角色仍保留为本地招聘方演示。"
          });
        }
      });
      return;
    }

    this.setData({
      interactionNotice: "已切换为求职者本地演示，不会改变真实账号权限。"
    });
  },

  onHelpTap() {
    this.setData({ helpExpanded: !this.data.helpExpanded });
  }
});
