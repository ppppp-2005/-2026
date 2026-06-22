const messagesService = require("../../services/messages");

const DETAIL_ROUTE = "/pages/message-detail/index";
const PAGE_SIZE = 2;
const CATEGORY_DEFINITIONS = [
  { id: "all", name: "全部" },
  { id: "application", name: "投递反馈" },
  { id: "conversation", name: "招聘沟通" },
  { id: "system", name: "系统通知" }
];
const SCENARIO_OPTIONS = [
  { id: "success", name: "正常" },
  { id: "empty", name: "空状态" },
  { id: "error", name: "服务错误" },
  { id: "timeout", name: "请求超时" },
  { id: "offline", name: "网络离线" },
  { id: "unauthorized", name: "身份失效" },
  { id: "page-error", name: "下页失败" }
];

function deriveState(messages, categoryDefinitions, activeCategory, unreadOnly) {
  const categories = categoryDefinitions.map((category) => {
    const categoryMessages = category.id === "all"
      ? messages
      : messages.filter((message) => message.category === category.id);
    return {
      ...category,
      count: categoryMessages.length,
      unreadCount: categoryMessages.filter((message) => message.unread).length
    };
  });
  const categoryMessages = activeCategory === "all"
    ? messages
    : messages.filter((message) => message.category === activeCategory);
  return {
    categories,
    visibleMessages: unreadOnly
      ? categoryMessages.filter((message) => message.unread)
      : categoryMessages,
    totalUnread: messages.filter((message) => message.unread).length
  };
}

function errorTitle(kind) {
  const titles = {
    offline: "当前网络不可用",
    timeout: "读取消息超时",
    server: "消息服务暂不可用"
  };
  return titles[kind] || "消息读取失败";
}

Page({
  data: {
    messageCenter: {
      header: {
        label: "招聘消息",
        title: "消息中心",
        subtitle: "集中查看投递反馈、招聘沟通和系统通知。"
      }
    },
    allMessages: [],
    categoryDefinitions: CATEGORY_DEFINITIONS,
    categories: deriveState([], CATEGORY_DEFINITIONS, "all", false).categories,
    visibleMessages: [],
    totalUnread: 0,
    activeCategory: "all",
    unreadOnly: false,
    loadState: "loading",
    errorKind: "",
    errorTitle: "",
    errorMessage: "",
    authStatus: "anonymous",
    authPending: false,
    scenarioOptions: SCENARIO_OPTIONS,
    activeScenario: "success",
    page: 0,
    nextPage: 1,
    hasMore: false,
    loadMoreState: "idle",
    pageErrorKind: "",
    pageErrorMessage: "",
    feedback: "消息只在本机演示，不代表企业联系或平台送达。"
  },

  onLoad() {
    this._listRequestToken = 0;
    this._authRequestToken = 0;
    this._nextPageScenario = "success";
    this.loadFirstPage();
  },

  applyView(messages, activeCategory, unreadOnly, feedback) {
    this.setData({
      allMessages: messages,
      activeCategory,
      unreadOnly,
      ...deriveState(messages, this.data.categoryDefinitions, activeCategory, unreadOnly),
      feedback
    });
  },

  async loadFirstPage(options = {}) {
    const scenario = options.scenario || this.data.activeScenario;
    const requestToken = ++this._listRequestToken;
    this.setData({
      loadState: "loading",
      errorKind: "",
      errorTitle: "",
      errorMessage: "",
      pageErrorKind: "",
      pageErrorMessage: "",
      loadMoreState: "idle"
    });
    try {
      const result = await messagesService.listMessages({
        page: 1,
        pageSize: PAGE_SIZE,
        scenario
      });
      if (requestToken !== this._listRequestToken) return false;
      const categoryDefinitions = result.categories;
      const messages = result.items;
      this._nextPageScenario = options.nextPageScenario || "success";
      this.setData({
        messageCenter: { header: result.header },
        categoryDefinitions,
        allMessages: messages,
        ...deriveState(messages, categoryDefinitions, this.data.activeCategory, this.data.unreadOnly),
        loadState: messages.length ? "ready" : "empty",
        authStatus: messagesService.sessionSnapshot().status,
        page: result.page,
        nextPage: result.nextPage || result.page,
        hasMore: result.hasMore,
        feedback: messages.length
          ? "已读取本地演示消息，不会连接企业或服务器。"
          : "本地演示当前没有消息，可切换其他状态继续查看。"
      });
      return true;
    } catch (error) {
      if (requestToken !== this._listRequestToken) return false;
      const unauthorized = error && error.kind === "unauthorized";
      this.setData({
        allMessages: [],
        visibleMessages: [],
        totalUnread: 0,
        loadState: unauthorized ? "unauthorized" : "error",
        authStatus: messagesService.sessionSnapshot().status,
        errorKind: error && error.kind ? error.kind : "unknown",
        errorTitle: unauthorized ? "需要本地演示身份" : errorTitle(error && error.kind),
        errorMessage: messagesService.messageForError(error),
        hasMore: false
      });
      return false;
    }
  },

  async onScenarioTap(event) {
    const scenario = event.currentTarget.dataset.scenario;
    this.setData({ activeScenario: scenario });
    if (scenario === "unauthorized") {
      messagesService.expireLocalDemo();
      await this.loadFirstPage({ scenario: "success" });
      return;
    }
    if (scenario === "page-error") {
      const loaded = await this.loadFirstPage({ scenario: "success", nextPageScenario: "timeout" });
      if (loaded) this.setData({ feedback: "已准备下页失败演示，请点击“加载更多”。" });
      return;
    }
    this._nextPageScenario = "success";
    await this.loadFirstPage({ scenario });
  },

  async onDemoLoginTap() {
    const requestToken = ++this._authRequestToken;
    this.setData({ authPending: true, errorMessage: "正在进入本地演示…" });
    try {
      await messagesService.startLocalDemo();
      if (requestToken !== this._authRequestToken) return;
      this.setData({ authPending: false, activeScenario: "success" });
      await this.loadFirstPage({ scenario: "success" });
    } catch (error) {
      if (requestToken !== this._authRequestToken) return;
      this.setData({
        authPending: false,
        errorMessage: messagesService.messageForError(error)
      });
    }
  },

  onRetryTap() {
    this.setData({ activeScenario: "success" });
    this.loadFirstPage({ scenario: "success" });
  },

  onLoadMore() {
    this.loadNextPage(this._nextPageScenario || "success");
  },

  onRetryLoadMore() {
    this.loadNextPage("success");
  },

  async loadNextPage(scenario) {
    if (!this.data.hasMore || this.data.loadMoreState === "loading") return;
    const requestToken = ++this._listRequestToken;
    const requestedPage = this.data.nextPage;
    this.setData({
      loadMoreState: "loading",
      pageErrorKind: "",
      pageErrorMessage: ""
    });
    try {
      const result = await messagesService.listMessages({
        page: requestedPage,
        pageSize: PAGE_SIZE,
        scenario
      });
      if (requestToken !== this._listRequestToken) return;
      const knownIds = new Set(this.data.allMessages.map((message) => message.id));
      const messages = this.data.allMessages.concat(result.items.filter((message) => !knownIds.has(message.id)));
      this.applyView(messages, this.data.activeCategory, this.data.unreadOnly, "已加载更多本地演示消息。");
      this.setData({
        page: result.page,
        nextPage: result.nextPage || result.page,
        hasMore: result.hasMore,
        loadMoreState: "idle"
      });
      this._nextPageScenario = "success";
    } catch (error) {
      if (requestToken !== this._listRequestToken) return;
      this.setData({
        loadMoreState: "error",
        pageErrorKind: error && error.kind ? error.kind : "unknown",
        pageErrorMessage: messagesService.messageForError(error),
        feedback: "已有消息仍保留；本次下页读取失败，可单独重试。"
      });
    }
  },

  onCategoryTap(event) {
    const category = event.currentTarget.dataset.category;
    const matched = this.data.categoryDefinitions.find((item) => item.id === category);
    this.applyView(
      this.data.allMessages,
      category,
      this.data.unreadOnly,
      `已切换到${matched ? matched.name : "全部"}分类。`
    );
  },

  onUnreadToggle() {
    const unreadOnly = !this.data.unreadOnly;
    this.applyView(
      this.data.allMessages,
      this.data.activeCategory,
      unreadOnly,
      unreadOnly ? "当前只显示本地未读消息。" : "当前显示分类内全部消息。"
    );
  },

  onMarkRead(event) {
    const id = event.currentTarget.dataset.id;
    const messages = this.data.allMessages.map((message) => (
      message.id === id ? { ...message, unread: false } : message
    ));
    this.applyView(messages, this.data.activeCategory, this.data.unreadOnly, "已在本页标为已读，不会同步到服务器。");
  },

  onMarkAllRead() {
    const activeCategory = this.data.activeCategory;
    const messages = this.data.allMessages.map((message) => (
      activeCategory === "all" || message.category === activeCategory
        ? { ...message, unread: false }
        : message
    ));
    this.applyView(messages, activeCategory, this.data.unreadOnly, "当前分类已在本页全部标为已读，不会同步到服务器。");
  },

  onMessageTap(event) {
    const id = event.currentTarget.dataset.id;
    const messages = this.data.allMessages.map((message) => (
      message.id === id ? { ...message, unread: false } : message
    ));
    this.applyView(messages, this.data.activeCategory, this.data.unreadOnly, "已在本页标为已读，正在打开本地演示详情。");
    wx.navigateTo({
      url: `${DETAIL_ROUTE}?id=${id}`,
      fail: () => {
        this.setData({ feedback: "详情页暂时无法打开，请稍后重试；本地已读状态已更新，不会同步到服务器。" });
      }
    });
  }
});
