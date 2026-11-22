# Running the module tests safely

Follow the acceptance cases in `../TGE Project Docs/Module Test Guide/`.

For step-by-step PowerShell, API, SQL, and browser instructions for AUTH-01 through AUTH-17, see [Authentication manual walkthrough](../TGE%20Project%20Docs/Module%20Test%20Guide/Authentication-Manual-Walkthrough.md).

`npm test` runs all `.test.ts` files under the server and client source trees, including the database-backed authentication lifecycle. It creates and deletes database records. Use a disposable PostgreSQL database, never a shared development or production target.

Test files run one at a time because the integration tests share the same disposable database and create and delete users that other tests may query. After migrations, seed the standard roles and permissions with `npm exec -- tsx scripts/seed-roles.ts` from `server/` before running the suite. CI performs this seed automatically.

The runner requires `TEST_DATABASE_URL` with a localhost/loopback host and a database named `tge_qa_<suffix>`. It accepts no connection query overrides; only the optional `?schema=public` suffix is allowed. It overrides `DATABASE_URL` for the test process and generates a temporary JWT signing key. Local `.env` files cannot override those process values.

1. Create a disposable PostgreSQL database and confirm its host and name.
2. Set `DATABASE_URL` to that disposable target in the current shell. From `database/`, run `npm run db:validate`, `npm run db:generate`, `npm run db:build`, and `npm run db:migrate:deploy`. Check `npx prisma migrate status`.
3. Set `TEST_DATABASE_URL` to the same target. From `server/`, run `npm test`. On Windows PowerShell, use `npm.cmd` if script execution policy blocks `npm.ps1`.
4. Run the runner safety tests from the repository root: `node --test server/scripts/run-tests.test.mjs`.
5. Record the task-level results and redacted evidence. Passing this suite does not complete browser, responsive, accessibility, email delivery, performance, or production deployment checks.
6. Stop/remove the disposable database after all testing that needs it is complete.

The automated lifecycle uses an in-process email adapter; it sends no real password-recovery email. UI invitation and email-delivery acceptance still need their own approved test adapter and fixtures.

Never paste connection credentials, JWTs, passwords, or reset/activation links into test evidence.

## API request limiting

`createApp()` mounts the shared limiter on `/api` before JSON parsing, authentication,
and all routers. Current and future routes under `/api` share a budget of 300 requests
per minute per client IP, including unsuccessful requests. Excess requests receive
HTTP 429 with a JSON message, `Retry-After`, `RateLimit`, and `RateLimit-Policy` headers.
Health checks under `/api` also count toward the budget. CORS preflight requests are
handled before the limiter.

The default store is in memory per application instance; restarting the process
resets its counters. Multiple server instances need a shared store to enforce a
combined limit. Express retains its default `trust proxy: false`: configure only
your actual trusted proxy addresses before deploying behind a reverse proxy, so
client IPs are identified correctly without trusting arbitrary forwarding headers.

Run the database-free limiter regressions from `server/`:

```powershell
node --import tsx --test src/common/middleware/api-rate-limit.middleware.test.ts src/app.module.test.ts
```

These tests verify shared budgets across routes and methods, separate client IPs,
JSON rejection and retry headers, and coverage of routes added after app creation.

## Login navigation browser regression

With the current client source running locally and Google Chrome installed:

```powershell
# From repository root; change the origin if your client uses another port.
$env:QA_CLIENT_ORIGIN = 'http://localhost:3000'
npm.cmd exec --yes --package playwright -- node --test server/scripts/auth-navigation.browser.test.mjs
```

This uses a temporary Playwright installation, mocks all authentication requests, and checks administrator login/logout plus rejected-session behavior. It does not use real credentials or access the database. Test the current source using `npm run dev`, or stop, rebuild, and restart a production client first; `npm start` serves the last build. These checks verify navigation behavior, not real account acceptance or email delivery.
