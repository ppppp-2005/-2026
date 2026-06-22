const { profileMock } = require("../../data/profile");

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function skillChoices(skills) {
  return profileMock.resume.skillOptions.map((name) => ({
    name,
    checked: skills.indexOf(name) !== -1
  }));
}

function buildPreview(form) {
  return {
    name: form.name,
    locationLine: `${form.hometown || "籍贯未填"} · 现居${form.currentCity}`,
    experienceLine: `${form.years || "0"}年工作经验`,
    intentLine: `${form.targetRole} · ${form.targetLocation}`,
    salary: form.salary,
    skills: form.skills,
    workTitle: `${form.company || "工作单位未填"} · ${form.role || "岗位未填"}`,
    period: form.period || "时间未填",
    experience: form.experience
  };
}

Page({
  data: {
    resume: clone(profileMock.resume),
    form: clone(profileMock.resume.form),
    skillChoices: skillChoices(profileMock.resume.form.skills),
    dirty: false,
    previewMode: false,
    preview: null,
    errors: [],
    feedback: "输入前说明：内容只在当前页面临时展示，不会保存或上传。"
  },

  onFieldInput(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({
      [`form.${field}`]: event.detail.value,
      dirty: true,
      previewMode: false,
      errors: [],
      feedback: "有未保存的本地修改；可先校验并预览。"
    });
  },

  onSkillsChange(event) {
    const skills = event.detail.value;
    this.setData({
      "form.skills": skills,
      skillChoices: skillChoices(skills),
      dirty: true,
      previewMode: false,
      feedback: "技能已在本页更新，尚未保存。"
    });
  },

  onPreviewTap() {
    const errors = profileMock.resume.requiredFields
      .filter((item) => !String(this.data.form[item.path] || "").trim())
      .map((item) => item.label);

    if (errors.length) {
      this.setData({
        errors,
        previewMode: false,
        feedback: `还不能预览，请补充：${errors.join("、")}。`
      });
      return;
    }

    this.setData({
      errors: [],
      preview: buildPreview(this.data.form),
      previewMode: true,
      feedback: "以下是本机当前输入的预览，没有保存或上传。"
    });
  },

  onEditTap() {
    this.setData({ previewMode: false, feedback: "已返回编辑，当前内容仍未保存。" });
  },

  onUnavailableSaveTap() {
    this.setData({ feedback: "保存功能暂未开放；当前内容不会写入本地存储或后端。" });
  },

  onResetTap() {
    const form = clone(profileMock.resume.form);
    this.setData({
      form,
      skillChoices: skillChoices(form.skills),
      dirty: false,
      previewMode: false,
      preview: null,
      errors: [],
      feedback: "已恢复示例内容，没有写入存储。"
    });
  }
});
