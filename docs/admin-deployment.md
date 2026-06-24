# Admin And Deployment Guide

## Current Deployment

Production is on Cloudflare Pages:

- `https://ai-inspiration-generator.pages.dev`
- Project name: `ai-inspiration-generator`
- Deploy command:

```powershell
wrangler pages deploy . --project-name ai-inspiration-generator --branch main
```

The project is static. There is no build command and no output directory.

Vercel files remain in the repo for legacy deployment compatibility, but Cloudflare Pages is the current production path.

## Admin Setup

1. Open the site.
2. Click `管理员`.
3. Log in with the default account:
   - Username: `admin`
   - Password: `124816`
4. Save the DeepSeek shared API key in `AI 设置`.
5. Optionally change:
   - DeepSeek API URL
   - model
   - temperature
   - default article word count
   - style and avoid hints
   - category list
   - OpenRouter and Kie.ai image keys
6. Change the admin password after first setup.

All admin configuration is stored in the current browser's `localStorage`. It is not shared across devices.

## User And Invite Flow

- `游客登录` opens the normal user panel.
- The normal user panel is intentionally compact: login on one side, invite-code registration on the other.
- Users can use the app without seeing quota counts.
- Invite codes are only bound at registration.
- Guests and non-invite registered users use the default quota, currently 10 uses.
- Invite users receive the quota configured on the invite code.
- When quota is exhausted, the app blocks AI calls and shows:

```text
您的使用次数已达上限，如需继续使用，请联系陆同学 AI。联系邮箱：1455234504@qq.com
```

## Admin Data Views

The admin backend is the only place that shows:

- guest default quota
- invite-code quota
- user usage limit
- used count and remaining count
- API call count
- token usage
- invite-code create/copy/edit/delete actions

Do not move these details into the normal user interface.

## Verification Checklist

After UI or account changes:

1. Parse scripts in `index.html` and `plus index.html`.
2. Confirm both files are identical.
3. On mobile, verify the top buttons show separate `游客登录` and `管理员` entries.
4. Confirm the normal user panel does not contain admin settings or usage metrics.
5. Confirm admin login opens the backend and does not replace the normal user identity.
6. Register a user with an invite code and confirm limit exhaustion shows the contact email.
7. Deploy to Cloudflare Pages and verify production contains the new entry IDs:
   - `userAccountBtn`
   - `adminAccountBtn`
