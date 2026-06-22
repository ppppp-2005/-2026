import { laborMock } from "../../data/labor";

const ALL_CATEGORY_ID = "all";

type CategoryTapEvent = {
  currentTarget: {
    dataset: {
      categoryId: string;
    };
  };
};

type ContactTapEvent = {
  currentTarget: {
    dataset: {
      demandId: string;
    };
  };
};

function getDemandsByCategory(categoryId: string) {
  if (categoryId === ALL_CATEGORY_ID) {
    return laborMock.demands;
  }

  return laborMock.demands.filter((item) => item.categoryId === categoryId);
}

Page({
  data: {
    labor: laborMock,
    activeCategoryId: ALL_CATEGORY_ID,
    visibleDemands: laborMock.demands,
    resultLabel: `共 ${laborMock.demands.length} 条用工信息`
  },

  onCategoryTap(event: CategoryTapEvent) {
    const categoryId = event.currentTarget.dataset.categoryId;
    const category = laborMock.filters.find((item) => item.id === categoryId);

    if (!category) {
      return;
    }

    const visibleDemands = getDemandsByCategory(categoryId);

    this.setData({
      activeCategoryId: categoryId,
      visibleDemands,
      resultLabel: `共 ${visibleDemands.length} 条用工信息`
    });

    wx.showToast({
      title: categoryId === ALL_CATEGORY_ID ? "已显示全部用工" : `已筛选${category.name}`,
      icon: "none"
    });
  },

  onContactTap(event: ContactTapEvent) {
    const demandId = event.currentTarget.dataset.demandId;
    const demand = laborMock.demands.find((item) => item.id === demandId);

    if (!demand) {
      wx.showToast({
        title: "暂未找到联系信息",
        icon: "none"
      });
      return;
    }

    wx.showModal({
      title: "联系提示",
      content: `${demand.contact.name}：${demand.contact.phone}\n服务点：${demand.contact.servicePoint}\n当前为示例信息，请到服务点核实后再联系。`,
      showCancel: false,
      confirmText: "我知道了"
    });
  }
});
