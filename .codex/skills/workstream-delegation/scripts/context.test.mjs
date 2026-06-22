import assert from "node:assert/strict";
import test from "node:test";

import { dedupeRecords, scoreRecord, validateState } from "./context.mjs";

function record(overrides = {}) {
  return {
    workstream: "13-training-signup",
    artifact: "handoff",
    current: true,
    authority: 90,
    title: "培训报名",
    path: "workstreams/13-training-signup/HANDOFF.md",
    heading: "Result",
    tags: ["training", "signup"],
    updatedAt: "2026-06-18T19:18:00+08:00",
    content: "当前仅展示培训班次，报名功能暂未开放，不会提交个人信息。",
    ...overrides
  };
}

test("dedupe keeps the newest authoritative exact record", () => {
  const old = record({ artifact: "archive", authority: 20, current: false });
  const current = record();
  const output = dedupeRecords([old, current]);
  assert.equal(output.length, 1);
  assert.equal(output[0].authority, 90);
});

test("dedupe removes near-identical records in one workstream", () => {
  const current = record({ content: "当前仅展示培训班次，报名功能暂未开放，不会提交身份证、电话或费用。" });
  const repeated = record({ authority: 20, current: false, content: "当前仅展示培训班次；报名功能暂未开放，不会提交身份证、电话或费用。" });
  assert.equal(dedupeRecords([current, repeated]).length, 1);
});

test("validation rejects missing fields and phase conflicts", () => {
  const errors = validateState({
    schemaVersion: 1,
    workstream: "bad",
    title: "Bad",
    phase: "SHIP",
    state: "active",
    priority: "P1",
    currentSlice: "slice",
    ownerThreadId: null,
    summary: "summary",
    nextAction: "next",
    blockers: [],
    dependencies: [],
    evidence: [],
    tags: [],
    codePaths: [],
    updatedAt: "2026-06-18T00:00:00Z",
    handoffRef: "HANDOFF.md"
  }, "bad");
  assert.ok(errors.some((error) => error.includes("SHIP phase")));
  assert.ok(errors.some((error) => error.includes("verification evidence")));
});

test("validation rejects a missing required status field", () => {
  const errors = validateState({
    schemaVersion: 1,
    workstream: "missing",
    title: "Missing",
    phase: "DEFINE",
    state: "queued",
    priority: "P2",
    currentSlice: "slice",
    ownerThreadId: null,
    nextAction: "next",
    blockers: [],
    dependencies: [],
    evidence: [],
    tags: [],
    codePaths: [],
    updatedAt: "2026-06-18T00:00:00Z",
    handoffRef: "HANDOFF.md"
  }, "missing");
  assert.ok(errors.some((error) => error.includes("summary must be a non-empty string")));
});

test("query scoring favors relevant current summaries", () => {
  const relevant = scoreRecord(record(), "培训 报名未开放");
  const unrelated = scoreRecord(record({ title: "项目骨架", tags: ["shell"], content: "四个 Tab 和页面路由。" }), "培训 报名未开放");
  assert.ok(relevant > unrelated);
});
