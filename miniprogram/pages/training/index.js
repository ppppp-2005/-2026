const { trainingMock } = require("../../data/training");

function filterCourses(categoryId) {
  if (categoryId === "all") {
    return trainingMock.courses;
  }

  return trainingMock.courses.filter((course) => course.categoryId === categoryId);
}

Page({
  data: {
    training: trainingMock,
    activeCategoryId: "all",
    activeCategoryName: "全部课程",
    filteredCourses: trainingMock.courses
  },

  onCategoryTap(event) {
    const categoryId = String(event.currentTarget.dataset.categoryId || "all");
    const category = trainingMock.categories.find((item) => item.id === categoryId);

    if (!category || categoryId === this.data.activeCategoryId) {
      return;
    }

    this.setData({
      activeCategoryId: categoryId,
      activeCategoryName: category.name,
      filteredCourses: filterCourses(categoryId)
    });

    wx.showToast({
      title: `已选${category.name}`,
      icon: "none"
    });
  },

  onCourseDetailTap(event) {
    const courseId = String(event.currentTarget.dataset.courseId || "");
    const course = trainingMock.courses.find((item) => item.id === courseId);

    if (!course) {
      return;
    }

    wx.showToast({
      title: trainingMock.actions.courseInfoToast,
      icon: "none",
      duration: 2200
    });
  }
});
