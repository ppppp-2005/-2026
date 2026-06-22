# Frontend services

Pages depend on domain services and must never call `wx.request`, `wx.login`,
storage, socket, or upload APIs directly. The shared transport accepts an
injected `send(request)` implementation; this repository does not provide a
real WeChat transport yet.

Supported domains are `auth`, `users`, `jobs`, `resumes`, `applications`,
`employer`, and `notifications`. `registry.js` selects a mock or API adapter
for every domain from the validated environment configuration.

## Environments

`local` and `test` default to `dataMode: "mock"`. `staging` and `production`
default to `dataMode: "api"` and fail closed until the deployment injects a
non-secret HTTPS API base URL. `local` and `test` may use HTTP for local test
infrastructure. All four environments include an explicit timeout.

```js
const { resolveEnvironment } = require("../config/environments");

const local = resolveEnvironment("local");
const staging = resolveEnvironment("staging", {
  apiBaseUrl: runtimeConfig.apiBaseUrl
});
```

Per-domain cutover uses `serviceModes`, so an approved service can move to the
API adapter without rewriting a page. Any API-selected domain still requires
an injected base URL and transport.

The injected transport calls `send` with `url`, `method`, `headers`, `data`,
`timeoutMs`, and `requestId`. It expects `{ statusCode, data, headers }` back.
When available, the transport writes the bearer token to `Authorization` and
always writes the generated request ID to `X-Request-ID`.

## Mock scenarios

`createMockRuntime` supports deterministic `success`, delayed `loading`,
`empty`, `error`, `timeout`, `offline`, `unauthorized`, `page`, and `end`
scenarios. Fixtures and delays are passed explicitly; no storage is used.

```js
const { createMockRuntime } = require("./mock-runtime");

const runtime = createMockRuntime({ fixtures: { "jobs.list": jobs } });
const firstPage = await runtime.execute("jobs.list", {
  scenario: "page",
  page: 1,
  pageSize: 10
});
const states = [];
const delayed = await runtime.execute("jobs.list", {
  scenario: "loading",
  delayMs: 300,
  onStateChange: (state) => states.push(state)
});
// states is ["loading", "success"] and delayed.state is "success".
```

Mutations should run through `createSubmissionGuard`. A second execution with
the same key is rejected while the first is pending. Neither the guard nor the
transport retries mutations automatically.
