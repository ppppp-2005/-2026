# Frontend Framework Review V2

> Current status (2026-06-20): all P2 findings in this report were repaired, independently reviewed, and re-SHIPped. See `RECHECK.md` for the current verification result. The remainder of this file is the original pre-repair audit record.

## Scope

- Reviewed all files under `miniprogram/**` without modifying product code.
- Reviewed the integrated 19-route app shell, four Tabs, 19 page five-file sets, 31 JavaScript files, 23 JSON files, 19 WXML files, 20 WXSS files, and 11 centralized data module pairs.
- Replayed the existing `01-project-shell`, `03-jobs`, and `05-employer` verification commands.
- Performed static and Node-based behavior checks only. This report does not claim WeChat Developer Tools compilation, simulator rendering, screenshots, clicks, narrow-screen acceptance, or large-font acceptance.

## Commands

```powershell
& 'C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' 'workstreams/01-project-shell/verify.cjs'
& 'C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' 'workstreams/03-jobs/verify.cjs'
& 'C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' 'workstreams/05-employer/verify.cjs'
& 'C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' 'workstreams/07-quality-review/verify.cjs'
& 'C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' '.codex/skills/workstream-delegation/scripts/context.mjs' validate
& 'C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' '.codex/skills/workstream-delegation/scripts/context.mjs' refresh
```

Main-control environment attempts, recorded here as external blocker evidence:

```powershell
D:\微信web开发者工具\cli.bat open --project 'D:\work\wecaht app\miniprogram' --port 9420
D:\微信web开发者工具\cli.bat auto --project 'D:\work\wecaht app\miniprogram' --port 9420 --trust-project
```

- `cli.bat --help` ran and identified Developer Tools 2.01.2510290.
- `open` timed out after 124 seconds without returning.
- `auto --trust-project` remained silent; port 9420 did not listen and no `wechatdevtools` main process appeared, so it was terminated.
- Two Windows Computer Use attempts failed with `windows sandbox failed: runner error: CreateProcessAsUserW failed: 5`.

## Passing Evidence

- `01-project-shell/verify.cjs`: PASS for exact route order, eight integrated routes, five-file sets, shell/Tab contract, 28 navigation sources, absolute targets, and dynamic query producer/consumer contracts.
- `03-jobs/verify.cjs`: PASS for syntax, mirrors, WXML events, forbidden APIs, list states/retry/search/filter/sort, details, session favorites, and honest apply flow.
- `07-quality-review/verify.cjs` before its intentional final gate failure:
  - PASS 19 registered routes, all five-file sets, uniqueness, and four-Tab contract.
  - PASS 31 JavaScript syntax checks and 23 JSON parses.
  - PASS 19 page JS/TS fingerprints, all WXML handlers, app mirror, and 11 data mirrors.
  - PASS 16 absolute navigation targets resolving to registered pages.
  - PASS no actual request, Socket, storage, subscription, upload, download, payment, login, profile, phone, or dialing API calls.
  - PASS no unqualified login/save/favorite/apply/publish/send/auth/contact/notification success copy.
  - PASS page business data is consumed from `miniprogram/data`; the only service note is a future-interface README, not a call site.
  - PASS exercised jobs/detail/candidates loading, normal, empty, error, and retry branches; messages/profile empty templates are present.
  - PASS pre/post honesty copy for demo login, apply, publish preview, send draft, and candidate marking.
- Manual source reading confirms the core risky actions explain the local-only boundary before and after interaction, including `profile-login`, `job-detail`, `employer-job-preview`, `message-detail`, and `employer-candidates`.
- No `position: fixed` rule was found, so there is no static evidence of a custom fixed bottom bar overlay. This is not visual proof against native Tab or keyboard overlap.

## Findings

| Priority | Finding | Evidence | Impact |
|---|---|---|---|
| P0 | None found. | Static and behavior checks above. | - |
| P1 | None found. | Static and behavior checks above. | - |
| P2 | Integrated routes still tell users that project-shell registration is pending; failure callbacks also attribute every navigation error to missing registration. | `miniprogram/pages/profile/index.js:12,38`; `messages/index.js:97`; `jobs/index.js:167`; `employer/index.js:63,78`; `employer/index.wxml:47`; `employer-job-form/index.js:63`, plus TS mirrors. | The statement is false after all 19 routes were registered and hides the real cause of a navigation failure. |
| P2 | Home quick-entry navigation has no user-visible failure handling. | `miniprogram/pages/home/index.js:41` (`switchTab`) and `:48` (`navigateTo`). | A failed entry click can appear inert, violating the navigation-failure feedback requirement. |
| P2 | At least 15 interactive selectors use fixed heights below 88rpx; several are 58-68rpx. | Examples: `campus/index.wxss:237,274`; `policy/index.wxss:122,388,466`; `training/index.wxss:339`; `training-signup/index.wxss:380`; `labor/index.wxss:373`; `message-detail/index.wxss:285`. | Touch targets are below a 44px-equivalent baseline on a 375px-wide device and fixed height raises large-font clipping risk. This is source-evident, while actual clipping still needs simulator verification. |
| P2 | The shipped employer verifier is not replayable after planned route integration. | `workstreams/05-employer/verify.cjs:143` fails with `Deferred route was registered early: pages/employer-job-form/index`. | One explicitly required regression command is red even though the integrated route state is correct. Evidence must be made lifecycle-aware or superseded with a documented post-integration mode. |
| P3 | Small-text and truncation risks remain broad. | Static inventory: 114 font declarations below 24rpx, 9 `nowrap`, 9 `overflow:hidden`; e.g. `home/index.wxss:254-262` caps and ellipsizes an entry badge at 80rpx. | Long Chinese and large system text may truncate or become difficult to read; screenshots are required to distinguish intended scrolling/truncation from defects. |
| P3 | Narrow-screen accommodations are uneven. | Only 7 of 20 WXSS files contain a narrow `@media (max-width: ...)` rule. | rpx and flex layouts may still behave correctly, but source alone cannot establish narrow-screen acceptance. |

`07-quality-review/verify.cjs` exits 1 with 25 raw navigation/integration truth findings: 23 are the JS/TS/WXML manifestations of the first P2 item and 2 are the home navigation calls in the second P2 item.

## Must Fix

1. Replace all post-integration “route pending registration” copy in profile, messages, jobs, employer, and employer job form. Navigation failures must report a generic open failure without asserting an unverified cause, while retaining the local-only business boundary.
2. Add visible `fail` handling to both home quick-entry navigation branches.
3. Replace undersized fixed interactive heights with accessible `min-height`/padding behavior and retest long Chinese plus large system text. Prioritize the 58-68rpx controls listed above.
4. Make `05-employer/verify.cjs` valid in the intended post-integration lifecycle, or add an explicit, documented integrated mode so the required replay command passes.
5. Re-run `07-quality-review/verify.cjs` until it exits 0, then obtain actual Developer Tools compile, route/Tab click, narrow-screen, and large-font evidence.

## Optional Improvements

- Review the 114 sub-24rpx declarations after large-font screenshots and raise low-value metadata sizes where readability is weak.
- Confirm every intentional horizontal `scroll-view` exposes enough visual affordance; keep `nowrap` only inside scrollable regions.
- Revisit the 80rpx ellipsized home badge so short status words remain legible at large text sizes.
- Consider a shared navigation-failure helper only if it removes the repeated stale-cause copy without obscuring page-specific local-only notices.

## Simulator And Visual Gaps

- No successful WeChat Developer Tools compile evidence.
- No simulator startup or console evidence.
- No screenshots for any of the 19 routes.
- No clicks through the four Tabs or 16 absolute navigation targets.
- No verification of dynamic query navigation (`id`, `jobId`, `snapshot`) in the runtime.
- No narrow-device verification, including long Chinese, flex shrink/wrap, horizontal scrolling, input focus/keyboard, modal layout, or native Tab overlap.
- No large-system-font verification for fixed-height buttons/inputs, badges, metadata, dialogs, or textareas.
- No visual verification of loading/empty/error/retry transitions.

These are hard acceptance gaps under the frontend roadmap, not optional polish. Static scanning must not be used to mark them PASS.

## Backend Entry Gate

Backend BUILD remains blocked until all of the following are true:

1. All P2 findings are fixed in their owning product or verification workstreams.
2. `01`, `03`, `05`, and `07` verification commands exit 0 in the integrated tree.
3. WeChat Developer Tools successfully compiles the project with recorded version and command evidence.
4. The four Tabs and all ordinary-page routes are clicked successfully, including dynamic-query routes and user-visible failure behavior.
5. Narrow-screen and large-font screenshots cover core seeker and employer paths, with no clipping, overlap, hidden actions, or unreadable text.
6. Independent REVIEW accepts this workstream, then main control may decide SHIP. This workstream does not self-accept or self-SHIP.

## Scope Integrity

This review wrote only `workstreams/07-quality-review/**`. It did not modify `miniprogram/**`. Main control's before/after product hash remains the authoritative proof of unchanged product scope.
