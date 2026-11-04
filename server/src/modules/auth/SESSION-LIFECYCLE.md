# Authentication token and session lifecycle

## Access-token policy

The API issues a signed HS256 JWT after credential verification. Tokens have a fixed 15-minute lifetime and carry the user ID as `sub`. Verification restricts the accepted algorithm and requires the configured issuer and audience. The signing secret is read from `JWT_SECRET`; the API refuses to issue or verify tokens when the secret is missing or shorter than 32 characters. The secret must remain in server environment configuration and must not be committed or sent to the client.

## Client storage and restoration

The client keeps the Bearer access token in `sessionStorage` by default. Selecting “Remember me” stores it in `localStorage` instead. On loading the login experience, the client sends the saved token to `GET /api/auth/session`. It treats the session as restored only when the API confirms the token and the account is still active. Invalid or expired tokens are removed from both browser stores. Session storage is cleared when the tab's browser session ends; local storage persists until removed or the token expires.

Browser storage is accessible to JavaScript running on the same origin. Keep the client protected against script injection and never log or expose access tokens.

## Invalidation

The API checks the user's current account status and deletion state during authenticated requests. Suspending, deactivating, or deleting an account therefore invalidates its access immediately, even before the JWT expires. An otherwise valid token expires after 15 minutes and is then rejected by JWT verification.

The server stores only revoked JWT IDs, never raw tokens. Logout revokes the current token ID, and subsequent requests reject it immediately. Expired revocation rows may be deleted after their token expiry. There is no refresh token; users sign in again after expiry.

## Session validation API

`GET /api/auth/session` accepts the existing `Authorization: Bearer <token>` contract. It returns only the authenticated user ID and role name after JWT and account-status validation. Missing, invalid, expired, suspended, deactivated, or deleted accounts receive HTTP 401.
