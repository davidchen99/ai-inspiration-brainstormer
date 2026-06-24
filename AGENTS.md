# Agent Notes

## Project Shape

- This is a static single-page app. The production entry is `index.html`; `plus index.html` is a local backup and must stay byte-for-byte aligned with `index.html` after functional edits.
- There is no build step and no backend. Browser-side data is stored in `localStorage`.
- Assets live in `assets/` and `image/`; PWA files are `manifest.json` and `service-worker.js`.

## Current Product Rules

- The top account area has two separate buttons: `游客登录` for user login/register and `管理员` for admin login/backend.
- Normal users must not see API keys, model settings, token usage, API-call counts, or quota counters.
- Admin-only settings include DeepSeek shared API key, model/default content settings, image API keys, invite codes, default guest quota, user usage, and token/API-call stats.
- Default admin credentials are `admin` / `124816`; admin password can be changed in the backend.
- Guest and non-invite registered users default to 10 uses. Invite codes can grant higher limits, such as 20 uses.
- When a user hits the limit, show the contact message with `1455234504@qq.com`.

## Editing Rules

- Keep the user flow light. Avoid putting admin/config/status details back into the main creation surface.
- If `index.html` changes, copy it to `plus index.html` before finishing.
- If behavior changes, update `README.md` and relevant docs in `docs/`.

## Verification

- Parse inline scripts:
  `node -e "...new Function(script)..."`
- Check mobile and interaction with Playwright when changing UI.
- Deploy to Cloudflare Pages with:
  `wrangler pages deploy . --project-name ai-inspiration-generator --branch main`
