const messagesService = require("../../services/messages");

const SCENARIO_OPTIONS = [
  { id: "success", name: "正常" },
  { id: "empty", name: "空状态" },
  { id: "error", name: "服务错误" },
  { id: "timeout", name: "请求超时" },
  { id: "offline", name: "网络离线" },
  { id: "unauthorized", name: "身份失效" }
];

function errorTitle(kind) {
  const titles = {
    offline: "当前网络不可用",
    timeout: "读取详情超时",
    server: "消息详情暂不可用"
  };
  return titles[kind] || "详情读取失败";
}

Page({
  data: {
    detail: null,
    viewKind: "",
    loadState: "loading",
    errorKind: "",
    errorTitle: "",
    errorMessage: "",
    authPending: false,
    scenarioOptions: SCENARIO_OPTIONS,
    activeScenario: "success",
    draft: "",
    draftLength: 0,
    sendPending: false,
    sendState: "idle",
    feedback: "当前为本地演示详情，不会连接企业或消息服务。"
  },

  onLoad(options) {
    this._detailRequestToken = 0;
    this._authRequestToken = 0;
    this._draftGeneration = 0;
    this._requestedId = options && options.id ? options.id : "";
    this.loadDetail();
  },

  async loadDetail(options = {}) {
    const scenario = options.scenario || this.data.activeScenario;
    const requestToken = ++this._detailRequestToken;
    this.setData({
      loadState: "loading",
      errorKind: "",
      errorTitle: "",
      errorMessage: ""
    });
    try {
      const result = await messagesService.getMessageDetail(this._requestedId, { scenario });
      if (requestToken !== this._detailRequestToken) return;
      if (!result.detail) {
        this.setData({
          detail: null,
          viewKind: "",
          loadState: "empty",
          feedback: "未找到这条本地演示消息，没有读取任何远程记录。"
        });
        return;
      }
      const detail = result.detail;
      detail.unread = false;
      this.setData({
        detail,
        viewKind: detail.kind,
        loadState: "ready",
        feedback: "已打开本地演示详情，不代表消息已在服务器端读过。"
      });
    } catch (error) {
      if (requestToken !== this._detailRequestToken) return;
      const unauthorized = error && error.kind === "unauthorized";
      this.setData({
        detail: null,
        viewKind: "",
        loadState: unauthorized ? "unauthorized" : "error",
        errorKind: error && error.kind ? error.kind : "unknown",
        errorTitle: unauthorized ? "需要本地演示身份" : errorTitle(error && error.kind),
        errorMessage: messagesService.messageForError(error)
      });
    }
  },

  async onScenarioTap(event) {
    const scenario = event.currentTarget.dataset.scenario;
    this.setData({ activeScenario: scenario });
    if (scenario === "unauthorized") {
      messagesService.expireLocalDemo();
      await this.loadDetail({ scenario: "success" });
      return;
    }
    await this.loadDetail({ scenario });
  },

  async onDemoLoginTap() {
    const requestToken = ++this._authRequestToken;
    this.setData({ authPending: true, errorMessage: "正在进入本地演示…" });
    try {
      await messagesService.startLocalDemo();
      if (requestToken !== this._authRequestToken) return;
      this.setData({ authPending: false, activeScenario: "success" });
      await this.loadDetail({ scenario: "success" });
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
    this.loadDetail({ scenario: "success" });
  },

  onDraftInput(event) {
    const draft = event.detail.value;
    this._draftGeneration = (this._draftGeneration || 0) + 1;
    this.setData({
      draft,
      draftLength: draft.length,
      sendState: "idle",
      feedback: draft.trim()
        ? "草稿只保留在当前页面，尚未发送。"
        : "请输入非空内容；这里不能真实发送消息。"
    });
  },

  async onSendTap() {
    if (this.data.sendPending) {
      this.setData({
        sendState: "duplicate",
        feedback: "正在校验草稿，请勿重复点击；没有发送消息。"
      });
      return;
    }
    if (!this.data.draft.trim()) {
      this.setData({
        sendState: "validation-error",
        feedback: "请先输入非空内容。这里不能真实发送消息。"
      });
      return;
    }
    const draft = this.data.draft;
    const draftGeneration = this._draftGeneration || 0;
    const detailId = this.data.detail ? this.data.detail.id : "";
    this.setData({
      sendPending: true,
      sendState: "validating",
      feedback: "正在本地校验草稿，不会联系招聘方。"
    });
    try {
      const result = await messagesService.validateDraft(detailId, draft);
      if (
        draftGeneration !== this._draftGeneration
        || draft !== this.data.draft
        || detailId !== (this.data.detail ? this.data.detail.id : "")
      ) {
        this.setData({
          sendPending: false,
          sendState: this.data.draft.trim() ? "idle" : "validation-error",
          feedback: this.data.draft.trim()
            ? "草稿已变化，已忽略旧校验结果；请重新校验。"
            : "草稿已变化且当前为空，已忽略旧校验结果；没有发送消息。"
        });
        return;
      }
      this.setData({
        sendPending: false,
        sendState: result.sent ? "unexpected" : "validated",
        feedback: "本地校验完成；草稿仍在本页，没有保存、发送或产生送达状态。"
      });
    } catch (error) {
      const unauthorized = error && error.kind === "unauthorized";
      if (unauthorized) {
        this.setData({
          sendPending: false,
          sendState: "error",
          loadState: "unauthorized",
          errorTitle: "需要本地演示身份",
          errorMessage: messagesService.messageForError(error),
          feedback: `${messagesService.messageForError(error)} 没有发送消息。`
        });
        return;
      }
      if (
        draftGeneration !== this._draftGeneration
        || draft !== this.data.draft
        || detailId !== (this.data.detail ? this.data.detail.id : "")
      ) {
        this.setData({
          sendPending: false,
          sendState: this.data.draft.trim() ? "idle" : "validation-error",
          feedback: "草稿已变化，已忽略旧校验状态；没有发送消息。"
        });
        return;
      }
      this.setData({
        sendPending: false,
        sendState: error && error.code === "DUPLICATE_SUBMISSION" ? "duplicate" : "error",
        loadState: this.data.loadState,
        errorTitle: this.data.errorTitle,
        errorMessage: this.data.errorMessage,
        feedback: `${messagesService.messageForError(error)} 没有发送消息。`
      });
    }
  }
});
