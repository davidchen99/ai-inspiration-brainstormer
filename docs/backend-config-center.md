# Backend Configuration Center

This document describes the first backend step for the online Cloudflare Pages version.

## Purpose

The static app still works without a backend, but online shared use needs server-side configuration so one administrator can enforce settings for all users.

The first backend step adds Cloudflare Pages Functions:

- `GET /api/runtime-config`
- `GET /api/admin-config`
- `POST /api/admin-config`
- `GET /api/account`
- `POST /api/account`

## Current Scope

Implemented now:

- Public runtime config for online knowledge-base limits.
- Admin config read/write endpoint protected by an environment admin token.
- Account backend API for status, session, login, register, logout, usage recording, and admin account data operations.
- Optional Cloudflare KV storage.
- Safe fallback to default config when KV is not bound.

Not implemented yet:

- Server-side user accounts.
- Backend AI model proxy.
- Server-side encrypted provider API key storage.

## Cloudflare Bindings

Recommended Pages project bindings:

- KV namespace binding: `AI_BRAINSTORM_CONFIG`
- KV namespace binding: `AI_BRAINSTORM_ACCOUNTS`
- Environment variable: `AI_BRAINSTORM_ADMIN_TOKEN`

If `AI_BRAINSTORM_CONFIG` is missing:

- `GET /api/runtime-config` still returns default public config.
- `POST /api/admin-config` returns `CONFIG_KV_NOT_BOUND`.

If `AI_BRAINSTORM_ACCOUNTS` is missing:

- `GET /api/account?action=status` reports the account backend as disabled.
- Login, register, usage recording, and admin account operations return `ACCOUNT_KV_NOT_BOUND`.
- The frontend falls back to browser-local account data.

If `AI_BRAINSTORM_ADMIN_TOKEN` is missing:

- `GET /api/admin-config` and `POST /api/admin-config` return `ADMIN_TOKEN_NOT_CONFIGURED`.

## Runtime Config Shape

```json
{
  "version": 1,
  "onlineKnowledge": {
    "enabled": true,
    "allowFolder": true,
    "maxFiles": 80,
    "maxTotalChars": 1000000,
    "maxPromptChars": 14000,
    "maxSectionChars": 1400
  }
}
```

The public endpoint returns only safe runtime config. It must not include API keys, admin credentials, user usage data, raw knowledge-base Markdown, or invite-code internals.

## Admin API

Read current config:

```powershell
Invoke-RestMethod `
  -Uri "https://ai-inspiration-generator.pages.dev/api/admin-config" `
  -Headers @{ Authorization = "Bearer $env:AI_BRAINSTORM_ADMIN_TOKEN" }
```

## Account API

Check whether the account backend is enabled:

```powershell
Invoke-RestMethod "https://ai-inspiration-generator.pages.dev/api/account?action=status"
```

Register:

```powershell
Invoke-RestMethod `
  -Uri "https://ai-inspiration-generator.pages.dev/api/account" `
  -Method Post `
  -ContentType "application/json" `
  -Body (@{
    action = "register"
    username = "demo"
    password = "demo-password"
    inviteCode = ""
  } | ConvertTo-Json)
```

Login:

```powershell
$login = Invoke-RestMethod `
  -Uri "https://ai-inspiration-generator.pages.dev/api/account" `
  -Method Post `
  -ContentType "application/json" `
  -Body (@{
    action = "login"
    username = "demo"
    password = "demo-password"
  } | ConvertTo-Json)
```

Record usage:

```powershell
Invoke-RestMethod `
  -Uri "https://ai-inspiration-generator.pages.dev/api/account" `
  -Method Post `
  -ContentType "application/json" `
  -Headers @{ Authorization = "Bearer $($login.token)" } `
  -Body (@{
    action = "record-usage"
    apiCalls = 1
    tokens = 1200
  } | ConvertTo-Json)
```

Admin account data:

```powershell
$admin = Invoke-RestMethod `
  -Uri "https://ai-inspiration-generator.pages.dev/api/account" `
  -Method Post `
  -ContentType "application/json" `
  -Body (@{
    action = "login"
    username = "admin"
    password = "124816"
  } | ConvertTo-Json)

Invoke-RestMethod `
  -Uri "https://ai-inspiration-generator.pages.dev/api/account?action=admin-store" `
  -Headers @{ Authorization = "Bearer $($admin.token)" }
```

Account API notes:

- The initial backend admin account is `admin` / `124816`.
- Passwords are stored as salted SHA-256 hashes in KV, not as plaintext.
- Session tokens are opaque random tokens stored in KV with a 30-day TTL.
- The frontend uses the backend account API only when `AI_BRAINSTORM_ACCOUNTS` is bound and status reports `enabled: true`.
- Offline mode never calls the account backend.

Write config:

```powershell
$body = @{
  onlineKnowledge = @{
    enabled = $true
    allowFolder = $true
    maxFiles = 80
    maxTotalChars = 1000000
    maxPromptChars = 14000
    maxSectionChars = 1400
  }
} | ConvertTo-Json -Depth 5

Invoke-RestMethod `
  -Uri "https://ai-inspiration-generator.pages.dev/api/admin-config" `
  -Method Post `
  -ContentType "application/json" `
  -Headers @{ Authorization = "Bearer $env:AI_BRAINSTORM_ADMIN_TOKEN" } `
  -Body $body
```

## Frontend Behavior

The frontend calls `/api/runtime-config` on page load in online mode.

- If the endpoint succeeds, online knowledge-base limits prefer the backend runtime config.
- If the endpoint fails, the app falls back to browser-local admin settings.
- Offline mode and `file:` mode do not call the backend config endpoint.

The frontend also calls `/api/account?action=status` on page load in online mode.

- If the account backend is enabled, user login/register and registered-user usage recording use the backend API.
- If the account backend is unavailable, existing browser-local account behavior remains active.
- Guest usage still has a local fallback until a stricter server-side guest identity model is added.

## Next Backend Steps

1. Bind `AI_BRAINSTORM_ACCOUNTS` in Cloudflare Pages and migrate current online invite codes/users if needed.
2. Add backend model proxy for online shared text generation.
3. Move shared provider API keys out of browser storage.
4. Add stricter server-side guest usage identity if public guest limits need stronger enforcement.
