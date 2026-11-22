# QA document review and test plan

Review date: 2026-11-10 (Africa/Douala).
Repository baseline: `develop`, commit `4244d8d`; local QA changes are uncommitted.
Release assessment: **Blocked — acceptance testing and release dependencies remain open.**

## References reviewed

- `TGE-Authentication-Sprint-Tester-Guide.docx` and `TGE-Public-Pages-Sprint-Tester-Guide.md` in this directory.
- `../TGE Development Standards.docx`.
- `../TGE Database Implementation Plan.docx`.
- `../TGE-006-Environment-Configuration-Plan.docx` and `../TGE-007-Sprint-Workflow-and-Task-Ownership.docx`.
- `../TGE-AUTH-01_Account_Registration_and_Onboarding_Decision_Record.docx`.
- Updated SRS v1.1.0 and SDD v1.2.0 Word documents; authentication, security, performance, compatibility, and deployment sections of the detailed Markdown SRS/SDD.
- Project planning document, public-page backlog, and `../01-Project-Planning/TGE-PUB-01_Public_Page_Scope_and_Content_Contracts.md`.

The guides in this directory define execution and evidence requirements for the existing modules. Broader requirements for future administrative modules are not evidence those modules already exist. Draft documents and unchecked acceptance/approval boxes do not establish stakeholder approval.

## Review findings

1. **Test database confirmation is mandatory.** The AUTH lifecycle suite writes and deletes records and upserts a permission. Do not run it against an unidentified local, shared, or production database. Confirm the target before execution and use disposable fixtures. No database-backed suite has been successfully executed in this review.
2. **Contact and newsletter are intentionally gated.** PUB-11/D7 and PUB-13/D8 expect safe unavailable responses for valid submissions, with no storage or false success. Keep provider, consent, confirmation, unsubscribe, retention, and handling decisions open until approved. Testing the expected 503 behavior does not complete those integrations.
3. **Production content and localization remain acceptance dependencies.** D9 and the dynamic translation contract require approved content, URLs, media, and fallback behavior. Do not fabricate metrics, business sections, speakers, or translations to make visual tests pass.
4. **UI checks are required.** Compare with `TGE UI/Public Pages/` at approximately 390, 768, and 1440 pixels; exercise keyboard navigation, Escape, form feedback, unavailable/empty/loading states, and English/French behavior. SRS compatibility also names Chrome, Edge, Firefox, and Safari. Automated API checks cannot substitute for these checks.
5. **Document versions differ.** Updated SRS FR-EVT-08/10 permits guests, while the older detailed SRS and parts of the contract review retain an audience conflict. Record the discrepancy; verify current guest registration against the updated SRS and tester guide, without assuming every consent/retention decision is closed. The onboarding decision and updated SRS/SDD retain draft/pending approval metadata.
6. **The two public-page tester-guide copies contain the same text.** Their file hashes differ because of file representation/line endings; a text comparison found no differences. Use the Module Test Guide copy for this execution record.
7. **Performance has no numeric acceptance thresholds.** NFR-PERF-01/02 requires acceptable response time and concurrency without specifying a budget, user count, duration, or representative dataset. Collect measured baselines and document the workload; do not invent a production performance pass threshold.
8. **Branch integration requires peer review.** Development Standards requires task branches from `develop`, PRs targeting `develop`, at least one peer approval, and squash merge. Unit tests must isolate business logic from infrastructure. Root ESLint/Prettier configuration, strict TypeScript, and the prohibition on `any` are explicit standards to assess. Local changes alone do not configure remote branch protection or establish release approval.
9. **Deployment needs separate evidence.** HTTPS, secret management, backup/restore, migrations, production configuration, and monitoring must be verified in the actual deployment environment. Neither branch has been certified production-ready.
10. **A referenced source is missing.** The public scope document references `TGE_Authentication_Authorization_Sprint_Backlog.docx`, which was not present in the document inventory. AUTH task coverage is mapped from the supplied authentication tester guide; no missing backlog requirements have been invented.

## Execution sequence

1. Finish document-to-implementation review and record discrepancies.
2. Confirm a non-production test database and approved test email adapter; inspect fixture cleanup and seed behavior before any database writes.
3. Validate schema and migration status, then run server typecheck/build, client lint/build, and isolated regression checks.
4. Run the documented server suite, which also includes the client service, validation, and language tests. There is currently no separate client test script; do not require one in CI while ignoring the actual shared suite.
5. Execute authentication lifecycle, public visibility, registration, membership, contact, and newsletter cases against the confirmed test environment.
6. Execute browser, responsive, keyboard, language, and cross-browser cases with redacted evidence.
7. Review secrets in tracked files/history and logs, dependency findings, permission enforcement, and deployment controls; measure representative performance separately.
8. Retest fixes, record remaining blockers, and submit reviewable changes through the agreed branch workflow. Require successful checks and peer approval before merging to `develop`; promote to `main` only after release acceptance.

## Acceptance traceability

These are pending acceptance results, not completed test claims. `Blocked` means required execution or evidence is still missing. Record individual subcases separately when some checks pass and others fail.

| Task | Required evidence | Status and current reason |
| --- | --- | --- |
| AUTH-01 | Onboarding decision and observed invitation flow agree | Blocked: runtime verification and decision acceptance evidence pending |
| AUTH-02 | Identity/token models, schema validation, migration status | Blocked: confirmed test database and migration evidence pending |
| AUTH-03 | Account creation, role limits, duplicates, one-time activation | Blocked: fixtures/email adapter and execution pending |
| AUTH-04 | Login validation, account statuses, response privacy | Blocked: API and browser execution pending |
| AUTH-05 | HS256, 15-minute expiry, restoration and storage | Blocked: automated and browser verification pending |
| AUTH-06 | Protected/public API authentication behavior | Blocked: execution pending |
| AUTH-07 | Seeded permissions, denial/grant, tampering resistance | Blocked: confirmed test database and role fixtures pending |
| AUTH-08 | Logout revocation, fresh login, expired-session redirect | Blocked: lifecycle and browser execution pending |
| AUTH-09 | Direct portal access, refresh, invalid-session redirects | Blocked: browser execution pending |
| AUTH-10 | All five roles' landing headings/navigation | Blocked: role fixtures and browser execution pending |
| AUTH-11 | Password change validation, credentials and audit event | Blocked: lifecycle and browser execution pending |
| AUTH-12 | Generic recovery, hashed one-time token, expiry/replay | Blocked: confirmed database/email adapter and execution pending |
| AUTH-13 | Expected audit events without credentials or tokens | Blocked: dedicated database execution pending |
| AUTH-14 | Full backend/lifecycle suite | Blocked: sandbox test-runner failure and unconfirmed database |
| AUTH-15 | Client checks and manual authentication states | Blocked: baseline lint failed; build/browser checks pending |
| AUTH-16 | Complete invitation-to-logout lifecycle | Blocked: confirmed database/email adapter/browser execution pending |
| AUTH-17 | Security review, passing checks, peer-approved integration | Blocked: security and integration evidence incomplete |
| PUB-01 | Routes, public contracts, onboarding boundary | Blocked: contract discrepancies and runtime checks pending |
| PUB-02 | Shared shell, navigation, mobile menu, language control | Blocked: browser/design comparison pending |
| PUB-03 | Home/About designs, approved content, preview states | Blocked: visual checks and approved content evidence pending |
| PUB-04 | Published programmes and safe empty/error states | Blocked: API/browser execution pending |
| PUB-05 | Published event details, dates, safe DTO/not-found | Blocked: API/browser execution pending |
| PUB-06 | Approved HTTPS media, host allowlist, alt text, no upload | Blocked: API/browser execution pending |
| PUB-07 | Consent, duplicate/deadline/capacity rules, safe receipt | Blocked: confirmed database, policy evidence and execution pending |
| PUB-08 | Published news, safe unavailable articles, form states | Blocked: API/browser execution pending |
| PUB-09 | Approved active directory, filters/paging, response privacy | Blocked: API/browser execution pending |
| PUB-10 | Approved business details, safe links/not-found, layout | Blocked: API/browser execution pending |
| PUB-11 | Validation and expected 503 without storage | Blocked: tests pending; D7 prevents integration completion |
| PUB-12 | Safe membership receipt without account/enrollment creation | Blocked: confirmed database and API/browser execution pending |
| PUB-13 | Email validation and expected 503 without false success | Blocked: tests pending; D8 prevents integration completion |
| PUB-14 | Full regression, privacy, bilingual/responsive acceptance | Blocked: execution, D7/D8 and content/localization acceptance pending |

Also record bilingual checks: document `lang`, persisted `tge.language`, cross-tab synchronization, translated known errors, default English, and absence of language-induced backend writes.

## Evidence already collected before the document-review pause

- Initial client lint failed loading the Next ESLint configuration. A local compatibility change got past module loading, but lint still fails in the installed TypeScript ESLint rule implementation. This is unresolved.
- Initial server typecheck failed because generated Prisma types lacked token models. Regenerating and rebuilding the database package allowed the subsequent server typecheck to pass. This does not verify database migrations.
- `npm test --prefix server` failed before executing tests because the sandbox's Windows user-information lookup failed in `tsx`. The request to execute outside the sandbox was declined. No passing test count is claimed.
- An offline npm lockfile update was blocked by cache permissions; escalation was declined. The existing installed dependency version was declared directly in the manifest and lockfile, but a clean dependency install has not been verified.
- Local CI, ignore rules, startup environment handling, and safe API error-handler changes exist. They remain uncommitted and unverified against the complete acceptance suite. No push, merge, deployment, or production migration has occurred.

## Result record template

For each executed subcase record: task ID, tester, date/time, commit, environment, browser/device/viewport, role/account status, fixture identifiers, steps, expected result, actual result, Pass/Fail/Blocked, redacted evidence, defect ID, and retest result. Never include passwords, raw JWTs, reset/activation links, provider keys, or connection-string credentials.

## Disposable database execution — 2026-11-10

The user selected a new disposable local PostgreSQL database. Docker container `tge-qa-postgres-20261110` runs PostgreSQL 15, binds only to `127.0.0.1:55432`, and uses temporary in-memory storage with automatic container removal when stopped. Database name: `tge_qa_20261110`. No existing development database was used for this run. Keep this container only while further acceptance checks need it; stop it when testing is complete.

| Check | Result | Evidence and limits |
| --- | --- | --- |
| Prisma schema validation | Pass | All configured schema files validated |
| Fresh migration deployment | Pass | All six committed migrations applied to the empty disposable database |
| Migration status | Pass | Database schema up to date |
| Server/client automated suite | Pass | 40 passed, 0 failed, 0 skipped; includes lifecycle, client contracts, public repository/controller checks, and safe API error responses |
| Disposable target guard | Pass | Six tests reject missing/malformed URLs, remote hosts, ordinary development database names, and query overrides without printing credentials |
| Server typecheck | Pass | `npm run typecheck --prefix server` |
| Server build | Pass | `npm run build --prefix server` |
| Diff whitespace | Pass | `git diff --check` reported no whitespace errors |

The test run outside the sandbox was approved after the sandbox again failed in the test runner's Windows user lookup. The new runner requires an explicit `TEST_DATABASE_URL`, supplies `DATABASE_URL` only to its subprocess, generates a temporary signing key, and discovers source tests rather than maintaining a static file list. CI now uses the same disposable database naming guard. Instructions are in `server/TESTING.md`.

This execution resolves the initial database confirmation and test-runner execution blockers for this run. AUTH-14's automated command passes; complete task acceptance still requires checking coverage against every listed expectation. AUTH-02's validation/migration checks pass on a fresh database. AUTH-04–08 and AUTH-11–13/16 have passing automated subcases, but browser flows, all role/status combinations, real invitation delivery, and complete acceptance evidence remain pending. Public repository/controller checks and PUB-11/13's expected disabled API behavior pass; full public-page acceptance remains pending. Earlier matrix entries describe the pre-execution baseline and must be read with these newer results.

Client lint remains unresolved, and client build/browser/performance/production checks are not claimed by this run. D7/D8 and content/localization acceptance remain open. No branch was pushed or merged, no production migration was run, and neither `develop` nor `main` is certified for release.

## Authentication navigation regression — 2026-11-15

The tester reported repeated navigation between `/login` and `/portal` with a stale sign-in success message. Chrome regression checks reproduced navigation failures against the existing production build. The configured Next.js Cache Components feature preserves page state through Activity, so the prior successful login flag could trigger another portal redirect when login became visible again. The portal redirects back on a failed session check.

The source fix resets transient login/protected-page state when Activity hides a route, waits for session restoration before redirecting, and validates a newly issued token through the session API before saving it or reporting sign-in success. Canceled validation requests no longer clear tokens or redirect another active navigation.

Validation against the current source on a separate local development server: two Chrome browser regressions passed (administrator portal/logout and rejected-session error without a navigation loop); client TypeScript check passed. Authentication requests were mocked; no real account, database, key, or password was used or changed. This validates the navigation fix but does not establish why the real account's session request was rejected. The existing production client requires a rebuild/restart to load changed source; ordinary refresh cannot update an old build. Other browser acceptance checks remain open.

## Follow-up: false invalid-token response — 2026-11-15

Read-only diagnostics of the connection configured for the API identified database `tge_dev` with only the first three migrations applied. `revoked_access_tokens` and `password_reset_tokens` do not exist. The pending migrations are `20261031103000_auth08_revoked_access_tokens`, `20261101120000_auth12_password_recovery`, and `20261104120000_public_event_gallery_registration`. The latter's guest-registration uniqueness prerequisite was checked read-only: zero conflicting groups.

The session middleware queried the missing revocation table and its broad catch returned 401 with an invalid/expired token message, concealing an infrastructure failure. The source now distinguishes JWT validation errors (401) from database/configuration failures, which reach the central error handler and return a generic 500 without internal details. The middleware allows injected dependencies for isolated testing.

Verification: server typecheck/build passed; the new missing-table/configuration regression and the two existing JWT tests passed (three total). No user account, password, key, or database record was changed. Applying the reviewed pending migrations to this existing database awaits explicit confirmation that `tge_dev` is the intended local development/test target; the earlier disposable-database authorization is not treated as permission to migrate it. Restart the API after the migration and retry an actual login/session check before marking the user-reported sign-in defect resolved.

### Authorized migration applied — 2026-11-15

The user explicitly authorized applying the pending migrations to `tge_dev`. All three existing migrations listed above applied successfully to `localhost:5432/tge_dev`. Subsequent Prisma migration status confirms all six migrations are applied and the schema is up to date. Read-only checks confirm that both authentication token tables now exist. No reset, user-account modification, password change, or key change was performed.

A live session API probe used a locally signed token with a randomly generated, confirmed nonexistent user UUID. It returned the expected 401 `Invalid or inactive account.` rather than a token/table failure, demonstrating that the running API can verify the configured signing key and pass the revocation lookup to account validation. No real user's credentials or session were used. The remaining acceptance step is the tester retrying the actual administrator login through the UI; successful real-account sign-in is not claimed by this probe.
