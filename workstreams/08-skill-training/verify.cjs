const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../..");
const pages = [
  ["training", [["detail-button", "onCourseDetailTap"]]],
  ["policy", [
    ["important-action", "onReminderTap"],
    ["detail-button", "onPolicyDetailTap"],
    ["consult-button", "onConsultTap"]
  ]],
  ["campus", [
    ["event-action", "handleEventAction"],
    ["opportunity-action", "handleOpportunityAction"],
    ["filter-button", "handleFilterTap"]
  ]],
  ["labor", [["contact-button", "onContactTap"]]],
  ["training-signup", [["signup-button", "onSignupTap"]]]
];

function verifyTarget(css, wxml, selector, handler) {
  const block = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .find((match) => match[1].split(",").some((part) => part.trim() === `.${selector}`));
  assert.ok(block, `Missing .${selector} rule`);
  const declarations = block[2];
  const minHeight = declarations.match(/(?:^|\n)\s*min-height:\s*(\d+)rpx\s*;/);
  const height = declarations.match(/(?:^|\n)\s*height:\s*(\d+)rpx\s*;/);
  const padding = declarations.match(/(?:^|\n)\s*padding:\s*(\d+)rpx(?:\s|;)/);
  assert.ok(minHeight && Number(minHeight[1]) >= 88, `.${selector} needs min-height >= 88rpx`);
  assert.ok(!height || Number(height[1]) >= 88, `.${selector} has a low fixed height`);
  assert.ok(padding && Number(padding[1]) > 0, `.${selector} needs vertical padding`);
  assert.match(declarations, /(?:^|\n)\s*box-sizing:\s*border-box\s*;/);
  assert.match(declarations, /(?:^|\n)\s*line-height:\s*1\.[2-9]\s*;/);
  const binding = new RegExp(`<(?:button|view)\\b(?=[^>]*class="[^"]*\\b${selector}\\b)(?=[^>]*bindtap="${handler}")[^>]*>`);
  assert.match(wxml, binding, `Missing .${selector} ${handler} binding`);
}

let targetCount = 0;
for (const [page, targets] of pages) {
  const pageRoot = path.join(root, "miniprogram/pages", page, "index");
  const css = fs.readFileSync(`${pageRoot}.wxss`, "utf8");
  const wxml = fs.readFileSync(`${pageRoot}.wxml`, "utf8");
  for (const [selector, handler] of targets) verifyTarget(css, wxml, selector, handler);
  targetCount += targets.length;
  console.log(`PASS ${page}: ${targets.length} target selector(s)`);
}

assert.equal(targetCount, 9);
console.log("PASS all 9 bindings keep flexible 88rpx touch sizing");
