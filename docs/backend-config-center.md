# Backend Configuration Center

This document describes the first backend step for the online Cloudflare Pages version.

## Purpose

The static app still works without a backend, but online shared use needs server-side configuration so one administrator can enforce settings for all users.

The first backend step adds Cloudflare Pages Functions:

- `GET /api/runtime-config`
- `GET /api/admin-config`
- `POST /api/admin-config`

## Current Scope

Implemented now:

- Public runtime config for online knowledge-base limits.
- Admin config read/write endpoint protected by an environment admin token.
- Optional Cloudflare KV storage.
- Safe fallback to default config when KV is not bound.

Not implemented yet:

- Server-side user accounts.
- Server-side invite-code enforcement.
- Server-side usage counters.
- Backend AI model proxy.
- Server-side encrypted provider API key storage.

## Cloudflare Bindings

Recommended Pages project bindings:

- KV namespace binding: `AI_BRAINSTORM_CONFIG`
- Environment variable: `AI_BRAINSTORM_ADMIN_TOKEN`

If `AI_BRAINSTORM_CONFIG` is missing:

- `GET /api/runtime-config` still returns default public config.
- `POST /api/admin-config` returns `CONFIG_KV_NOT_BOUND`.

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

## Next Backend Steps

1. Add server-side invite-code and user quota storage.
2. Add server-side usage counting.
3. Add backend model proxy for online shared text generation.
4. Move shared provider API keys out of browser storage.
