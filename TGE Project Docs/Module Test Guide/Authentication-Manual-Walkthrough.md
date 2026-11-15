# Authentication manual walkthrough — AUTH-01 through AUTH-17

Prepared 2026-11-15 after reading the complete `TGE-Authentication-Sprint-Tester-Guide.docx`, including its bilingual and evidence sections, and reviewing the current routes, validation, role matrix, scripts, storage keys, and schema. These are instructions for the tester; no cases were executed while preparing this walkthrough.

Use Windows PowerShell 5.1 or PowerShell 7, Docker Desktop, Node.js 24, and the installed project dependencies. Run each block in the indicated terminal. Finish setup first, then follow the task sections. Keep failures as failures; do not skip a failed prerequisite and mark dependent cases passed.

## Environment and terminal separation

- Terminal A: database setup, administrator provisioning, API requests, SQL checks, automated commands, and results.
- Terminal B: the API, using the disposable database and test email credentials.
- Terminal C: the client at `http://localhost:3000`.
- Browser: manual UI checks and an email inbox you control.

Use an approved Resend test configuration and deliverable test mailboxes. The running API currently uses Resend; it has no selectable local SMTP/email-capture adapter. The automated lifecycle's stub is not available to the running application. Dummy provider keys cannot deliver activation/reset messages. If a test sender/mailbox cannot be configured, record the corresponding email-dependent cases as Blocked.

No commands below edit `.env`/`.ENV`, Windows persistent environment settings, or production configuration. The password shown below is deliberately for a new disposable local container only. Do not substitute a production database connection.

### A1. Terminal A — create the disposable database

```powershell
Set-Location 'C:\Users\UPCLASS TELCO\Documents\Professional\Activities\Projects\TGE_MS\tge-management-system'
$qaRepo = (Get-Location).Path
$qaContainer = 'tge-qa-auth-manual'
$qaDb = 'tge_qa_auth_manual'

docker run --detach --rm --name $qaContainer `
  --publish 127.0.0.1:55432:5432 `
  --env POSTGRES_USER=tge_qa `
  --env POSTGRES_PASSWORD=disposable-qa-only `
  --env "POSTGRES_DB=$qaDb" `
  --tmpfs /var/lib/postgresql/data postgres:15
if ($LASTEXITCODE -ne 0) { throw 'Container creation failed; check Docker, the name and port.' }

$qaReady = $false
for ($attempt = 0; $attempt -lt 30; $attempt++) {
  docker exec $qaContainer pg_isready -U tge_qa -d $qaDb *> $null
  if ($LASTEXITCODE -eq 0) { $qaReady = $true; break }
  Start-Sleep -Seconds 1
}
if (-not $qaReady) { throw 'PostgreSQL did not become ready.' }
```

If the name or port is already occupied, inspect the existing container/process. Do not delete an unfamiliar database to free the port.

### A2. Environment block — run separately in both Terminal A and Terminal B

Variables are not shared between already-open terminals. Run this block in each. The server/provisioning process needs a sender and key approved for this manual test. Secret inputs are hidden and are not placed in command history.

```powershell
Set-Location 'C:\Users\UPCLASS TELCO\Documents\Professional\Activities\Projects\TGE_MS\tge-management-system'
$qaRepo = (Get-Location).Path

function Read-QaSecret([string]$Prompt) {
  $secure = Read-Host $Prompt -AsSecureString
  [System.Net.NetworkCredential]::new('', $secure).Password
}

$env:TEST_DATABASE_URL = 'postgresql://tge_qa:disposable-qa-only@127.0.0.1:55432/tge_qa_auth_manual?schema=public'
$env:DATABASE_URL = $env:TEST_DATABASE_URL
$env:JWT_SECRET = [guid]::NewGuid().ToString('N') + [guid]::NewGuid().ToString('N')
$env:NODE_ENV = 'development'
$env:PORT = '4000'
$env:CLIENT_URL = 'http://localhost:3000'
$env:ACTIVATION_URL = 'http://localhost:3000/activate-account'
$env:RESEND_API_KEY = Read-QaSecret 'Approved test Resend API key'
$env:EMAIL_FROM = Read-Host 'Approved test sender address'
```

Each terminal's signing key may differ: only Terminal B signs/verifies manual API tokens. Do not restart that API during a token lifecycle test. `npm test` generates its own independent signing key in its child process.

The first-admin script has been corrected to preserve inherited environment variables. Before running provisioning on another checkout, confirm it does not contain `override: true`; that setting could replace the disposable connection with values from `server/.env`.

### A3. Terminal A — prepare schema and roles

```powershell
Set-Location (Join-Path $qaRepo 'database')
foreach ($script in @('db:validate','db:generate','db:build','db:migrate:deploy')) {
  npm.cmd run $script
  if ($LASTEXITCODE -ne 0) { throw "$script failed" }
}
npx.cmd --no-install prisma migrate status --config prisma7.config.ts
if ($LASTEXITCODE -ne 0) { throw 'Migration status failed' }

Set-Location (Join-Path $qaRepo 'server')
npx.cmd --no-install tsx scripts/seed-roles.ts
if ($LASTEXITCODE -ne 0) { throw 'Role seed failed' }

# Prompts for a real test inbox, first name and last name.
npx.cmd --no-install tsx scripts/provision-first-admin.ts
if ($LASTEXITCODE -ne 0) { throw 'Administrator provisioning failed' }
```

Keep the invitation private. After starting the client/API below, open the invitation and set the administrator's password. Confirm the account was pending before activation; new random bootstrap passwords are deliberately not recoverable. If email delivery failed, resolve the provider configuration and rerun provisioning; it can issue a replacement for the pending administrator.

### B. Terminal B — start API

After running A2 in this terminal:

```powershell
Set-Location (Join-Path $qaRepo 'server')
npm.cmd run dev
```

Leave this terminal running. Do not start another API on port 4000.

### C. Terminal C — start client

```powershell
Set-Location 'C:\Users\UPCLASS TELCO\Documents\Professional\Activities\Projects\TGE_MS\tge-management-system\client'
$env:NEXT_PUBLIC_API_URL = 'http://localhost:4000'
npm.cmd run dev -- --port 3000
```

Use exactly `http://localhost:3000` in the browser; changing to `127.0.0.1` changes the browser origin, storage, and CORS behavior. Confirm the Network panel sends authentication requests to `http://localhost:4000`.

### A4. Terminal A — reusable request and SQL helpers

Return Terminal A to the repository root. These helpers keep non-2xx results inspectable on both PowerShell versions. Do not print complete successful login objects: they contain JWTs.

```powershell
Set-Location $qaRepo
$qaContainer = 'tge-qa-auth-manual'
$qaDb = 'tge_qa_auth_manual'
$qaApi = 'http://localhost:4000'
Add-Type -AssemblyName System.Net.Http

function Invoke-QaApi {
  param(
    [string]$Path,
    [string]$Method = 'GET',
    [object]$Body = $null,
    [string]$Token = ''
  )
  $http = [System.Net.Http.HttpClient]::new()
  $request = [System.Net.Http.HttpRequestMessage]::new(
    [System.Net.Http.HttpMethod]::new($Method), "$qaApi$Path")
  $response = $null
  try {
    if ($Token) {
      $request.Headers.Authorization = [System.Net.Http.Headers.AuthenticationHeaderValue]::new('Bearer', $Token)
    }
    if ($null -ne $Body) {
      $json = ConvertTo-Json -InputObject $Body -Depth 10 -Compress
      $request.Content = [System.Net.Http.StringContent]::new($json, [Text.Encoding]::UTF8, 'application/json')
    }
    $response = $http.SendAsync($request).GetAwaiter().GetResult()
    $text = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
    $parsed = if ($text) { ConvertFrom-Json -InputObject $text } else { $null }
    [pscustomobject]@{ Status = [int]$response.StatusCode; Body = $parsed }
  } finally {
    if ($response) { $response.Dispose() }
    $request.Dispose()
    $http.Dispose()
  }
}

function Invoke-QaSql([string]$Sql) {
  $Sql | docker exec -i $qaContainer psql -X -v ON_ERROR_STOP=1 -U tge_qa -d $qaDb
  if ($LASTEXITCODE -ne 0) { throw 'SQL check failed' }
}

function Connect-QaAccount([string]$Email) {
  $password = Read-QaSecret "Password for $Email"
  $result = Invoke-QaApi '/api/auth/login' 'POST' @{ email=$Email; password=$password }
  if ($result.Status -ne 200) { throw "Login failed: HTTP $($result.Status)" }
  $result.Body.data.accessToken
}

Invoke-QaApi '/api/health'
Invoke-QaSql 'SELECT current_database(), current_user;'
$qaAdminEmail = Read-Host 'Administrator test email used during provisioning'
$qaAdminToken = Connect-QaAccount $qaAdminEmail

# Load role IDs without entering UUIDs by hand.
$qaRoles = @{}
$roleLines = docker exec $qaContainer psql -X -At -F '|' -U tge_qa -d $qaDb -c 'SELECT name,id FROM roles ORDER BY name;'
if ($LASTEXITCODE -ne 0) { throw 'Could not load roles' }
foreach ($line in $roleLines) {
  $parts = $line -split '\|', 2
  $qaRoles[$parts[0]] = $parts[1]
}
$qaRoles.GetEnumerator() | Sort-Object Name | Format-Table Name,Value
```

The database identity must be `tge_qa_auth_manual` / `tge_qa`. Administrator tokens expire after 15 minutes; repeat `$qaAdminToken = Connect-QaAccount $qaAdminEmail` when required. A 401 caused by an expired setup token is not evidence of a role-permission denial.

## AUTH-01 — onboarding decision

Open `TGE-AUTH-01_Account_Registration_and_Onboarding_Decision_Record.docx` in Word. Check administrator-controlled invitations, duplicate user-email prevention, and Pending Activation / Active / Suspended / Deactivated status definitions. Do not treat pending document approval as accepted approval.

In the disposable database, inspect the provisioned administrator before and after email activation:

```powershell
Invoke-QaSql 'SELECT email,status,email_verified_at FROM users ORDER BY created_at;'
```

Expected: before activation `PENDING_ACTIVATION`; after password setup `ACTIVE` and an email verification timestamp. The user sets the password; the invitation must not distribute a password. Repeat this observation for the member created in AUTH-03.

## AUTH-02 — identity and access model

```powershell
Set-Location (Join-Path $qaRepo 'database')
npm.cmd run db:validate
npx.cmd --no-install prisma migrate status --config prisma7.config.ts
Set-Location $qaRepo

Invoke-QaSql '\d users'
Invoke-QaSql '\d roles'
Invoke-QaSql '\d permissions'
Invoke-QaSql '\d role_permissions'
Invoke-QaSql '\d account_activation_tokens'
Invoke-QaSql '\d password_reset_tokens'
Invoke-QaSql '\d revoked_access_tokens'
Get-ChildItem database/prisma/migrations -Directory | Select-Object Name
```

Expected: validation passes, six currently committed migrations are applied, and identity/role/token relations exist. Inspect `database/prisma/models/identity.prisma` and `onboarding.prisma` too. Table descriptions show schema, not raw credential rows.

## AUTH-03 — create account, duplicate, role restrictions, activation

Create a member using a real test mailbox. Use a fresh address or unique mailbox alias for each account.

```powershell
$qaMemberEmail = Read-Host 'New member test inbox'
$qaCreateBody = @{
  firstName = 'QA'; lastName = 'Member'
  email = $qaMemberEmail; roleId = $qaRoles['Member']
}
$qaMember = Invoke-QaApi '/api/auth/accounts/' 'POST' $qaCreateBody $qaAdminToken
$qaMember
```

Expected: 201, `data.status = PENDING_ACTIVATION`, and an invitation email. The response must not contain a password, password hash, activation token, or full user row. If it fails, stop dependent member cases until resolved.

```powershell
# Duplicate: expected 409.
Invoke-QaApi '/api/auth/accounts/' 'POST' $qaCreateBody $qaAdminToken

# Well-formed but nonexistent role: expected 403.
$qaBadRole = @{
  firstName='QA'; lastName='InvalidRole'
  email=('qa-' + [guid]::NewGuid().ToString('N') + '@example.invalid')
  roleId=[guid]::NewGuid().ToString()
}
Invoke-QaApi '/api/auth/accounts/' 'POST' $qaBadRole $qaAdminToken

# Malformed role UUID: expected 400.
$qaBadRole.roleId = 'not-a-uuid'
Invoke-QaApi '/api/auth/accounts/' 'POST' $qaBadRole $qaAdminToken
```

Before activating, try signing in as this pending member: expected 401, including with a guessed password. Open the real invitation, set/confirm a test password, and verify activation succeeds. Reuse the original link: it must be rejected; record the actual response/UI, not a fabricated success.

```powershell
$qaMemberToken = Connect-QaAccount $qaMemberEmail
Invoke-QaApi '/api/auth/session' -Token $qaMemberToken
```

Expected: 200, only `userId` and `roleName` in session data. The no-permission account-creation check is in AUTH-07.

Additional activation coverage: before activating a separate pending account, call the resend endpoint below; its old link must stop working. For expiry, set only that account's unused activation row expiry into the past using the same scoped SQL pattern as AUTH-12, against `account_activation_tokens`, then follow its link. Do not read token hashes to manufacture activation links.

```powershell
Invoke-QaApi '/api/auth/accounts/resend-invitation' 'POST' @{email=$qaPendingEmail} $qaAdminToken
```

Run this only after creating `$qaPendingEmail` in the fixture preparation below. Expected resend: 200; replaced/expired links rejected. A fresh pending invitation lasts 24 hours.

### Prepare remaining role/status fixtures

Use the same actual account-creation endpoint for these fixtures, rather than inserting plaintext passwords into SQL.

```powershell
function New-QaInvitedAccount([string]$Role, [string]$Label) {
  $email = Read-Host "Deliverable test email for $Label"
  $body = @{firstName='QA'; lastName=$Label; email=$email; roleId=$qaRoles[$Role]}
  $result = Invoke-QaApi '/api/auth/accounts/' 'POST' $body $qaAdminToken
  if ($result.Status -ne 201) { throw "Creation failed for $Label : HTTP $($result.Status)" }
  [pscustomobject]@{ Email=$email; UserId=$result.Body.data.userId; Role=$Role }
}
$qaOrg = New-QaInvitedAccount 'Organisation Administrator' 'OrganisationAdmin'
$qaMentor = New-QaInvitedAccount 'Mentor' 'Mentor'
$qaTrainer = New-QaInvitedAccount 'Trainer / Facilitator' 'Trainer'
$qaPending = New-QaInvitedAccount 'Member' 'Pending'
$qaSuspended = New-QaInvitedAccount 'Member' 'Suspended'
$qaDeactivated = New-QaInvitedAccount 'Member' 'Deactivated'
$qaPendingEmail = $qaPending.Email
```

Activate OrganisationAdmin, Mentor, Trainer, Suspended, and Deactivated by email and choose their passwords. Leave Pending unactivated. Then set only the two designated fixture statuses:

```powershell
Invoke-QaSql "UPDATE users SET status='SUSPENDED',updated_at=now() WHERE id='$($qaSuspended.UserId)';"
Invoke-QaSql "UPDATE users SET status='DEACTIVATED',updated_at=now() WHERE id='$($qaDeactivated.UserId)';"
Invoke-QaSql 'SELECT email,status FROM users ORDER BY created_at;'
```

These are controlled fixture changes in the new disposable database, not an account-management API acceptance test. Never run these statements on application/production databases.

## AUTH-04 — login and account status

```powershell
# Expected 400.
Invoke-QaApi '/api/auth/login' 'POST' @{email='invalid';password=''}
# Expected 401 and generic invalid-credentials message.
Invoke-QaApi '/api/auth/login' 'POST' @{email=$qaMemberEmail;password='deliberately-wrong-qa-password'}

$qaMemberPassword = Read-QaSecret 'Current active member test password'
$qaLogin = Invoke-QaApi '/api/auth/login' 'POST' @{email=$qaMemberEmail;password=$qaMemberPassword}
# Print status and field names, not JWT values.
$qaLogin.Status
$qaLogin.Body.PSObject.Properties.Name
$qaLogin.Body.data.PSObject.Properties.Name
$qaMemberToken = $qaLogin.Body.data.accessToken

foreach ($email in @($qaPending.Email,$qaSuspended.Email,$qaDeactivated.Email)) {
  $password = Read-QaSecret "Test password/guess for $email"
  $result = Invoke-QaApi '/api/auth/login' 'POST' @{email=$email;password=$password}
  [pscustomobject]@{Email=$email;Status=$result.Status;Message=$result.Body.message}
}
```

Expected: active 200 with `accessToken` only in data; each inactive status 401. Pending has no user-chosen usable password yet. Also test an unknown email: 401 with the same generic message. Optional non-deleted-policy check: temporarily set the active member's `deleted_at=now()` by its UUID, confirm login/session 401, then restore `deleted_at=NULL` immediately before other tests.

Browser: open `/login`; malformed email/empty password must show validation without a successful request. Wrong credentials show a useful generic error. Valid active credentials reach `/portal`. Inspect response field names without recording the token.

## AUTH-05 — JWT, restoration, storage, expiry

Decode only to inspect metadata; decoding is not signature verification. The subsequent server rejection checks test validation.

```powershell
function ConvertFrom-QaJwtPart([string]$Part) {
  $base64 = $Part.Replace('-','+').Replace('_','/')
  $base64 = $base64.PadRight($base64.Length + ((4 - $base64.Length % 4) % 4), '=')
  [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($base64)) | ConvertFrom-Json
}
$qaParts = $qaMemberToken.Split('.')
$qaHeader = ConvertFrom-QaJwtPart $qaParts[0]
$qaClaims = ConvertFrom-QaJwtPart $qaParts[1]
[pscustomobject]@{
  Algorithm=$qaHeader.alg
  LifetimeSeconds=($qaClaims.exp - $qaClaims.iat)
  Issuer=$qaClaims.iss; Audience=$qaClaims.aud
}
Invoke-QaApi '/api/auth/session'
Invoke-QaApi '/api/auth/session' -Token ($qaMemberToken + 'x')
Invoke-QaApi '/api/auth/session' -Token $qaMemberToken
$qaExpiryToken = $qaMemberToken
$qaExpiryAt = [DateTimeOffset]::FromUnixTimeSeconds([long]$qaClaims.exp)
$qaExpiryAt.LocalDateTime
```

Expected: HS256, 900 seconds, issuer `tge-management-api`, audience `tge-management-client`; missing/altered token 401, valid token 200. Keep `$qaExpiryToken` unchanged. After its displayed expiry, replay it: expected 401. Continue other tasks while time elapses; do not change the server clock or shorten production policy. Restarting the server with a different secret is not an expiry test.

Browser: test login with Remember me clear, then selected, logging out between them. Reload `/login` while valid: it must restore and reach the portal. In DevTools Console, inspect booleans only:

```javascript
({ local: !!localStorage.getItem('tge.accessToken'), session: !!sessionStorage.getItem('tge.accessToken') })
```

Expected: clear = session true/local false; selected = local true/session false. No refresh token. Review `SESSION-LIFECYCLE.md`. Confirm the signing key is server-only without displaying `.env` contents.

## AUTH-06 — authentication middleware/public endpoints

```powershell
Invoke-QaApi '/api/auth/session'                       # 401
Invoke-QaApi '/api/auth/logout' 'POST'                 # 401
Invoke-QaApi '/api/auth/session' -Token 'invalid'      # 401
Invoke-QaApi '/api/auth/logout' 'POST' -Token 'invalid' # 401
Invoke-QaApi '/api/auth/session' -Token $qaMemberToken # 200 while valid

# Public route with invalid input: validation 400, not missing-authentication 401.
Invoke-QaApi '/api/membership-applications/activate' 'POST' @{}
Invoke-QaApi '/api/auth/login' 'POST' @{email=$qaMemberEmail;password='wrong'} # 401 credential rejection
```

Use a fresh secondary token for a valid logout request in AUTH-08; logout intentionally revokes that token. Public activation must not require an Authorization header.

## AUTH-07 — role-based access control

```powershell
Invoke-QaSql @'
SELECT r.name,p.code FROM roles r
JOIN role_permissions rp ON rp.role_id=r.id
JOIN permissions p ON p.id=rp.permission_id
ORDER BY r.name,p.code;
'@

$qaMemberToken = Connect-QaAccount $qaMemberEmail
$qaDeniedBody = @{
  firstName='QA';lastName='Denied'
  email=('qa-' + [guid]::NewGuid().ToString('N') + '@example.invalid')
  roleId=$qaRoles['Member']
}
Invoke-QaApi '/api/auth/accounts/' 'POST' $qaDeniedBody $qaMemberToken # 403
$qaDeniedBody.roleId = $qaRoles['System Administrator']
Invoke-QaApi '/api/auth/accounts/' 'POST' $qaDeniedBody $qaMemberToken # still 403

$qaOrgToken = Connect-QaAccount $qaOrg.Email
Invoke-QaApi '/api/auth/accounts/' 'POST' $qaDeniedBody $qaOrgToken # 403: cannot assign System Administrator
```

Expected: Member lacks `users.manage`; both administrator roles have it. System Administrator can assign all five seeded roles; Organisation Administrator may assign Member, Mentor, and Trainer / Facilitator only. AUTH-03's successful creation proves the permitted path. For an Organisation Administrator permitted-path check, use `New-QaInvitedAccount` with its token temporarily assigned to `$qaAdminToken`, a fresh deliverable mailbox and Member role; then restore/re-login the System Administrator token.

Changing selected `roleId`, browser labels, or adding an unsupported `roleName` field must not grant permission. An extra field may produce validation 400 for an already authorized caller. Inspect the role matrix document; record any discrepancy.

## AUTH-08 — logout/replay and session expiry

```powershell
$qaLogoutToken = Connect-QaAccount $qaMemberEmail
Invoke-QaApi '/api/auth/logout' 'POST' -Token $qaLogoutToken # 200
Invoke-QaApi '/api/auth/session' -Token $qaLogoutToken    # 401
$qaMemberToken = Connect-QaAccount $qaMemberEmail
Invoke-QaApi '/api/auth/session' -Token $qaMemberToken    # 200
```

Browser: sign in, capture the browser token privately in DevTools memory before clicking Sign out:

```javascript
void (window.qaReplayToken = localStorage.getItem('tge.accessToken') ?? sessionStorage.getItem('tge.accessToken'));
```

Click Sign out. Check both storage booleans are false. Without navigating away from the same origin, replay that exact browser token:

```javascript
fetch('http://localhost:4000/api/auth/session', {
  headers: { Authorization: `Bearer ${window.qaReplayToken}` }
}).then(r => console.log(r.status));
```

Expected 401. A token issued separately in PowerShell is a different session and is not revoked by browser logout. After the AUTH-05 expiry time:

```powershell
Invoke-QaApi '/api/auth/session' -Token $qaExpiryToken # 401 only after expiry
```

Let a browser session expire too, then refresh/access a protected route. Expected redirect to `/login`, removed invalid storage, no application crash. Record whether expiry is checked during navigation/refresh or continuously; do not assume a timer exists.

## AUTH-09 — protected frontend routes

Manually navigate to `http://localhost:3000/portal` in a fresh private browser session and refresh: expected `/login`. Sign in and directly load/refresh `/portal`: expected portal. Tamper the saved token in the test browser and reload:

```javascript
localStorage.removeItem('tge.accessToken');
sessionStorage.setItem('tge.accessToken', 'invalid-qa-token');
location.assign('/portal');
```

Expected `/login`, invalid token removed. Also test actual server invalidation by temporarily suspending the member UUID, refreshing the signed-in browser, observing redirect, then restoring ACTIVE in the disposable database. Frontend redirects alone do not establish API authorization; retain AUTH-06/07 evidence.

## AUTH-10 — role-specific landing pages

Sign out fully between accounts and sign in through the browser with each activated role. Navigate directly to `/portal` and refresh. Current role headings are translated through these keys:

| Role | Heading translation key |
| --- | --- |
| System Administrator | `systemAdministration` |
| Organisation Administrator | `administration` |
| Member | `memberPortal` |
| Mentor | `mentorPortal` |
| Trainer / Facilitator | `trainerPortal` |

Expected: all five roles reach `/portal` with their corresponding heading. Check actual available navigation against the approved matrix; do not assume a heading proves complete role-specific features. The current portal implementation is minimal. Log missing required navigation as a defect/gap rather than inventing working administration links.

## AUTH-11 — password change

Browser: open `/change-password` while signed in. Test wrong current password, fewer than eight characters, mismatch if confirmation is present, and valid change. Check loading/feedback.

```powershell
$qaMemberToken = Connect-QaAccount $qaMemberEmail
Invoke-QaApi '/api/auth/password/change' 'POST' @{
  currentPassword='deliberately-wrong';newPassword='another-qa-password'
} $qaMemberToken # 400

$qaOldPassword = Read-QaSecret 'Current member test password'
Invoke-QaApi '/api/auth/password/change' 'POST' @{
  currentPassword=$qaOldPassword;newPassword='short'
} $qaMemberToken # 400

$qaNewPassword = Read-QaSecret 'New member test password, at least 8 characters'
Invoke-QaApi '/api/auth/password/change' 'POST' @{
  currentPassword=$qaOldPassword;newPassword=$qaNewPassword
} $qaMemberToken # 200

$qaOldLogin = Invoke-QaApi '/api/auth/login' 'POST' @{email=$qaMemberEmail;password=$qaOldPassword}
$qaOldLogin.Status # 401
$qaNewLogin = Invoke-QaApi '/api/auth/login' 'POST' @{email=$qaMemberEmail;password=$qaNewPassword}
$qaNewLogin.Status # 200; do not print the complete response
$qaMemberToken = $qaNewLogin.Body.data.accessToken
```

If the browser already changed the password, use that current password here or treat this as a separate second change. Sign out and verify old/new credentials in the browser too. AUTH-13 checks the audit event.

## AUTH-12 — recovery, one-time/reset expiry

```powershell
$qaKnownRecovery = Invoke-QaApi '/api/auth/password/recovery' 'POST' @{email=$qaMemberEmail}
$qaUnknownRecovery = Invoke-QaApi '/api/auth/password/recovery' 'POST' @{
  email=('qa-' + [guid]::NewGuid().ToString('N') + '@example.invalid')
}
$qaKnownRecovery
$qaUnknownRecovery
```

Expected: both 202 and the identical generic message. Unknown accounts receive no email. Delivery failure for the known account is a failure/blocker to investigate, not a privacy-test pass. Open the latest genuine recovery email, reset through `/reset-password`, and verify the new password works. Reusing the same link must fail. Requesting another recovery invalidates older unused reset tokens, so always identify which link is under test.

For an API reset check, request a fresh link, privately copy only its token into the hidden prompt, and do not consume it in the browser first:

```powershell
$qaResetToken = Read-QaSecret 'Token from the newest test recovery email (not the full URL)'
$qaResetPassword = Read-QaSecret 'New reset password, at least 8 characters'

# Compare the token's SHA-256 digest to storage without displaying either value.
$qaSha = [System.Security.Cryptography.SHA256]::Create()
try {
  $qaDigest = $qaSha.ComputeHash([Text.Encoding]::UTF8.GetBytes($qaResetToken))
  $qaResetHash = [BitConverter]::ToString($qaDigest).Replace('-','').ToLowerInvariant()
} finally { $qaSha.Dispose() }
$qaMemberId = $qaMember.Body.data.userId
Invoke-QaSql "SELECT count(*) AS matching_hash_count FROM password_reset_tokens WHERE user_id='$qaMemberId' AND token_hash='$qaResetHash' AND used_at IS NULL;"
# Expected matching_hash_count = 1 for this fresh, unused genuine token.

$qaResetBody = @{token=$qaResetToken;password=$qaResetPassword}
Invoke-QaApi '/api/auth/password/reset' 'POST' $qaResetBody # 200 once
Invoke-QaApi '/api/auth/password/reset' 'POST' $qaResetBody # 400 reused
Invoke-QaApi '/api/auth/password/reset' 'POST' @{
  token=('x' * 64);password=$qaResetPassword
} # 400 altered/invalid
```

For expiry, request another fresh recovery, leave the new link unused, and change only the member's unused reset rows in the disposable database:

```powershell
$qaMemberId = $qaMember.Body.data.userId
Invoke-QaSql "UPDATE password_reset_tokens SET expires_at=now()-interval '1 second' WHERE user_id='$qaMemberId' AND used_at IS NULL;"
```

Follow that newest link: expected 400/safe expired-link UI. Confirm stored metadata without printing hashes:

```powershell
Invoke-QaSql @'
SELECT user_id,length(token_hash) AS hash_length,
       round(extract(epoch FROM (expires_at-created_at))) AS ttl_seconds,
       used_at,expires_at
FROM password_reset_tokens ORDER BY created_at DESC;
'@
```

Fresh, unmodified reset tokens should have 64-character SHA-256 hashes and approximately 3600-second expiry. Rows deliberately expired by SQL will have a different TTL. Raw tokens must not be stored; source inspection or a private in-memory hash comparison is needed to prove more than hash length. Never attach reset URLs/tokens/hash rows to evidence.

## AUTH-13 — audit events and sensitive data

After the preceding actions:

```powershell
Invoke-QaSql @'
SELECT action,count(*) FROM audit_logs
WHERE action IN ('AUTH_LOGIN_SUCCESS','AUTH_LOGIN_FAILURE','AUTH_LOGOUT',
                 'AUTH_PASSWORD_CHANGED','AUTH_PASSWORD_RESET')
GROUP BY action ORDER BY action;
SELECT action,actor_user_id,entity_type,created_at
FROM audit_logs WHERE action LIKE 'AUTH_%'
ORDER BY created_at DESC LIMIT 50;
SELECT action,details FROM audit_logs WHERE action LIKE 'AUTH_%'
ORDER BY created_at DESC LIMIT 50;
'@
```

Inspect `details` privately before capturing evidence. Expected: all five events; known-user actions identify the actor, failed login may have a null actor. No password, hash, JWT or raw recovery/activation token in details, logs, or responses. Row counts alone do not prove sensitive-data exclusion. Confirm AUTH_LOGIN_FAILURE was produced by a syntactically valid wrong-password login, not only schema-invalid input.

## AUTH-14 — manually invoke backend/lifecycle suite

The guide explicitly includes automated commands in this case; manually invoking them complements the manual API/browser cases.

```powershell
Set-Location (Join-Path $qaRepo 'server')
npm.cmd test
$qaBackendExit = $LASTEXITCODE
npm.cmd run build
$qaServerBuildExit = $LASTEXITCODE
Set-Location $qaRepo
node --test server/scripts/run-tests.test.mjs
$qaGuardExit = $LASTEXITCODE
```

Expected: zero exit codes, no failed/skipped required tests, lifecycle fixture cleaned up. Use the current test counts, not a promised historical count. The suite discovers client tests too. The runner requires `TEST_DATABASE_URL` from A2 and generates its own signing key. It does not change the running API's environment. Capture redacted summaries.

## AUTH-15 — frontend validation, feedback and checks

```powershell
Set-Location (Join-Path $qaRepo 'client')
$env:NEXT_PUBLIC_API_URL = 'http://localhost:4000'
npm.cmd run lint
$qaLintExit = $LASTEXITCODE
npm.cmd run build
$qaClientBuildExit = $LASTEXITCODE
Set-Location $qaRepo
```

Stop Terminal C's dev server before the production build to avoid sharing its `.next` output, and restart it afterward. If you want to test the production client, run `npm.cmd start -- --port 3000` from `client/` after a successful build instead. The current lint baseline has previously failed; record actual output and do not mark it passed without a successful rerun.

Browser: repeat malformed/empty/wrong/valid login, Remember me, restoration, logout, and expiry redirect. Use DevTools network throttling to observe disabled loading buttons; restore normal networking afterward. Check inline errors and keyboard submission. OAuth controls, if shown, must be disabled; they are not valid authentication paths. Client service/validation tests are included in AUTH-14's server `npm test`.

## AUTH-16 — complete end-to-end flow

With an administrator token refreshed, create one additional Member through the actual API and a fresh test mailbox. Manually complete: invitation -> activation/password setup -> login -> `/portal` -> change password -> recovery email -> one-time reset -> new-password login -> browser logout -> old browser-token replay 401. Record each transition and its API status. Run AUTH-14's `npm test` again after fixes if needed; do not claim the automated lifecycle alone proves the browser/email flow.

Expected: client, API, email and disposable database agree throughout; no public unrestricted administrator signup; invalid sessions denied. Inspect that the suite removes its own temporary user/role, while manually created fixtures intentionally remain until container cleanup.

## AUTH-17 — security and integration review

```powershell
Set-Location $qaRepo
git status --short
git diff --check
# These should list no real environment files; example files are allowed.
git ls-files -- '*env*' | Where-Object { $_ -match '(?i)(^|/)\.env($|\.)' -and $_ -notmatch '(?i)\.example$' }
git diff --cached --name-only | Where-Object { $_ -match '(?i)(^|/)\.env($|\.)' -and $_ -notmatch '(?i)\.example$' }

# Locations only: inspect privately, without printing potential secret values.
rg -l -i 'console\.|logger\.|password|secret|token|authorization' server/src server/scripts client/src/modules/auth

npm.cmd run typecheck --prefix server
npm.cmd run build --prefix server
npm.cmd run lint --prefix client
# Stop the client dev server before this build.
npm.cmd run build --prefix client
npm.cmd test --prefix server
npm.cmd run db:validate --prefix database
Push-Location database
npx.cmd --no-install prisma migrate status --config prisma7.config.ts
Pop-Location
```

Record each command's exit code immediately; the last command's success does not erase an earlier failure. Inspect the staged diff locally for actual secrets, sensitive logging/DTOs and missing permission guards. Search output is triage, not proof that no secret exists in files/history. Do not paste raw diffs/environment files/provider errors containing secrets into evidence. The `.ENV` case on Windows must also remain ignored/untracked.

Do not merge from this checklist alone. The development standards require a task branch, a reviewed PR targeting `develop`, successful checks, and at least one peer approval before squash merge. Release/promotion to `main` requires its own acceptance. This walkthrough neither creates a PR nor grants peer approval. Preserve unrelated existing document/code edits.

## Required bilingual checks from the end of the Word guide

On the home page select FR; visit login, activation, forgot/reset/change password and portal. Trigger known errors and check French labels/messages. Select EN and verify English returns. Reload, open a second tab and change the language: both tabs should synchronize. Do not repeat a single-use activation link merely to obtain screenshots; use the relevant valid/invalid state intentionally.

Safe DevTools checks:

```javascript
document.documentElement.lang
localStorage.getItem('tge.language')
```

Expected `fr`/`fr` or `en`/`en`. Clear only the preference key, reload and expect default English:

```javascript
localStorage.removeItem('tge.language');
location.reload();
```

Language changes must preserve the route/session, add no locale field to backend requests, and create/update no database record. Record any missing translation or storage/cross-tab failure separately.

## Evidence and results

For each AUTH-01–17 and the bilingual section record Pass / Fail / Blocked, tester/date, commit, test database host/name, role/status, browser/viewport, action, expected/actual outcome, redacted evidence, defect reference and retest result. A partially passed task is not a full Pass. Provider/environment prerequisites are Blocked; behavior contrary to requirements is Fail.

Create a fresh checklist without overwriting the previous report:

```powershell
$qaReport = Join-Path $qaRepo ('TGE Project Docs\Module Test Guide\AUTH-Manual-Results-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.md')
$qaLines = @('# Manual authentication results', '', 'Environment: disposable local PostgreSQL 15', '')
1..17 | ForEach-Object { $qaLines += ('- AUTH-{0:D2}: Not run — add expected/actual result and redacted evidence.' -f $_) }
$qaLines += '- Bilingual checks: Not run.'
$qaLines | Set-Content -LiteralPath $qaReport -Encoding UTF8
```

Do not record passwords, raw JWTs, signing keys, provider keys, reset/activation links or connection credentials. Do not start a full terminal transcript during credential/token handling. Retain only redacted evidence.

## Cleanup after all manual evidence is collected

Stop the API in Terminal B and the client in Terminal C with Ctrl+C. Then in Terminal A:

```powershell
docker stop $qaContainer
if ($LASTEXITCODE -ne 0) { throw 'Disposable container cleanup failed' }
```

`--rm` removes the stopped container and its temporary database. Close the dedicated test terminals to discard their environment variables and in-memory secrets; this avoids removing or overwriting pre-existing variables in an application terminal. Close test browser sessions or remove only `tge.accessToken` from local/session storage and `window.qaReplayToken`. Preserve the completed redacted results.
