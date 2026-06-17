# Knowledge Base Brainstorm Requirements

## Background

The current product is a free-form brainstorming tool. Users enter a short idea, keyword, topic, or vague direction, and the app asks AI to expand it into content ideas.

The new need comes from an Obsidian-based workflow. The user already stores many notes, topics, arguments, examples, and personal knowledge assets as Markdown files in Obsidian. Instead of brainstorming from an empty prompt, the app should be able to use those local Markdown notes as the source material for content ideation.

This is not meant to replace Obsidian. Obsidian remains the knowledge management tool. This app should become a lightweight idea generator that can optionally read selected Markdown knowledge and brainstorm from it.

## Product Goal

Add an optional knowledge-base mode to the main brainstorming flow.

When no knowledge base is selected, the app keeps the current behavior:

- Free-form idea input.
- AI can brainstorm broadly.
- The flow stays light and fast.

When a knowledge base is selected, the app changes behavior:

- The user can choose local Markdown files, or a folder containing Markdown files.
- The selected Markdown content becomes the source context for brainstorming.
- Generated ideas should be grounded in the selected knowledge base.
- The user can turn off the knowledge base mode and return to free-form brainstorming.

## User Story

As a user who keeps long-term notes in Obsidian, I want to select Markdown files from my local knowledge base before brainstorming, so that generated WeChat article titles, content directions, and creative angles are based on my own accumulated knowledge instead of generic free association.

## First-Version Scope

The first version should focus on a simple and reliable local-file workflow:

- Add a knowledge-base button or icon near the main creator input area.
- Let the user select Markdown files from the local machine.
- Prefer folder selection when the browser supports it, especially for Chrome and Edge.
- Provide a fallback file picker for selecting one or more `.md` files.
- Show the current knowledge-base state in the UI, such as selected file count or active file names.
- Provide a clear action to disable or clear the selected knowledge base.
- Inject selected Markdown content into the AI prompt only when knowledge-base mode is active.
- Keep normal users away from admin-only settings, API keys, usage stats, token counts, and quota counters.

## First-Version Implementation Status

Implemented in `index.html`:

- A `知识库` control was added near the main creator input area.
- Users can select a local knowledge-base folder through a browser file input with `webkitdirectory`.
- Users can also select one or more Markdown files through a normal multi-file picker.
- The app accepts `.md` and `.markdown` files.
- The selected Markdown files are kept only in page memory and are not saved to `localStorage`.
- The UI shows `自由脑暴` when no knowledge base is active and `知识库脑暴` with selected file information when active.
- `关闭知识库` clears the selected files and returns the app to free-form brainstorming.
- Knowledge-base context is injected into the first idea-wall prompt and the later continuation prompts: brief, official-account plan, Xiaohongshu plan, Moments copy, novel structure, and song plan.
- The prompt asks the model to ground ideas in the selected Markdown content and avoid inventing facts not present in the knowledge base.
- The implementation reads at most 80 Markdown files and injects at most about 14000 characters into one prompt.
- When content is too large, the app ranks Markdown sections against the user's input keywords and uses the most relevant snippets first.

## Prompt Behavior

When knowledge-base mode is active, the idea-generation prompt should explicitly tell the model:

- Use the selected Markdown content as the main source.
- Generate ideas that can be traced back to themes, arguments, examples, or concepts in the knowledge base.
- Avoid generic public-internet style brainstorming when the knowledge base already provides stronger material.
- Do not invent knowledge-base facts that are not present in the selected content.

The intended behavior is not pure summarization. The AI can still brainstorm, combine, and reframe ideas, but the source material should come from the selected Markdown knowledge.

## Static-App Constraints

This project has no backend. The implementation must work as a browser-side static app.

Implications:

- Markdown files are read locally in the browser.
- The site itself should not store or upload knowledge-base files to any app server.
- Selected file content is only sent to the configured AI provider as part of the AI request when the user generates content.
- Folder browsing depends on browser support. Chrome and Edge are the primary targets.
- If folder selection is unavailable, the app should still support manual multi-file Markdown selection.

## Content Size Handling

Markdown knowledge bases can be large. The first version should include a practical guardrail:

- Limit the amount of Markdown text injected into one prompt.
- Prefer relevant snippets when possible.
- If the selected content is too large, show a simple status message explaining that only part of the knowledge base will be used.

Future versions can add better retrieval logic, such as keyword matching, tag filtering, note search, backlink awareness, or embedding-based retrieval. These are out of scope for the first version.

The first version now includes lightweight keyword-based snippet selection. More advanced retrieval, tag filters, backlink awareness, and embedding-based retrieval remain future work.

## Online And Offline Knowledge-Base Modes

The product should split knowledge-base behavior into two modes:

- `online`: the public Cloudflare Pages version for friends and normal users.
- `offline`: the downloaded local/computer version for power users who want large local knowledge bases and their own API key.

The two modes may share most UI and generation code, but they should have different account, API-key, quota, and knowledge-base limit behavior.

### Current Limit Baseline

The current implementation uses one shared browser-side limit set:

- Maximum Markdown files read: `80`.
- Maximum knowledge text injected into one prompt: about `14000` characters.
- Maximum section/snippet length: about `1400` characters.
- Oversized knowledge bases are ranked by lightweight keyword matching, then only relevant snippets are injected into the prompt.

This current limit is acceptable for the online version as a default, but it is too small for the intended offline/computer version.

### Online Version Requirements

The online version should remain constrained and friendly for shared/public use.

Required behavior:

- Keep account entry points: `游客登录` and `管理员`.
- Keep normal users away from API keys, model settings, token usage, API-call counts, and quota counters.
- Keep knowledge-base upload limits enabled for normal users.
- Let administrators configure online knowledge-base limits from the admin backend.

Implementation status:

- The online page now keeps `游客登录` and `管理员`.
- The online page shows `下载线下电脑版`.
- The admin backend now exposes online knowledge-base soft limits: enable/disable, folder selection, max files, total read characters, prompt-injection characters, and section characters.
- These limits are still browser-local soft limits because the app remains a pure static page.

Recommended admin settings:

- `onlineKnowledgeMaxFiles`: maximum Markdown files per selection.
- `onlineKnowledgeMaxTotalChars`: maximum total local Markdown characters read into memory.
- `onlineKnowledgeMaxPromptChars`: maximum knowledge characters injected into one model request.
- `onlineKnowledgeMaxSectionChars`: maximum characters per ranked section.
- `onlineKnowledgeAllowFolder`: whether folder selection is enabled.
- `onlineKnowledgeEnabled`: whether normal users can use knowledge-base mode.

Recommended online defaults:

- `onlineKnowledgeMaxFiles`: `80`.
- `onlineKnowledgeMaxPromptChars`: `14000`.
- `onlineKnowledgeMaxSectionChars`: `1400`.

Static-app limitation:

- In the current pure static architecture, admin settings are stored in the current browser's `localStorage`. This means online limit changes are local to that admin browser unless a backend store is added.
- If the product needs one administrator to enforce limits for all online users, a backend configuration store is required, such as Cloudflare Worker + KV/D1.
- Until then, online limit settings should be treated as front-end soft limits.

### Offline / Computer Version Requirements

The offline version is intended for the user's own computer and should prioritize power-user capacity over public-user guardrails.

Required behavior:

- No `游客登录` entry.
- No `管理员` entry.
- No quota UI.
- No invite-code registration.
- No user usage counters.
- Open directly into the creation surface.
- Let the user configure their own text-model API key and model settings locally.
- Let the user configure image API keys locally when needed.
- Knowledge-base mode should not use the small online limit.
- The offline version should preserve local history and export behavior.

Implementation status:

- The first implementation uses the same source file with an offline-mode flag.
- The online page generates a ZIP package containing `AI灵感生成器-线下版.html` and `README-offline.txt`.
- The offline HTML starts with `data-app-mode="offline"`.
- Offline mode hides `游客登录`, `管理员`, invite-code, quota, and usage UI.
- Offline mode opens directly into the creation surface and shows local API-key settings.
- Offline text-model API Key is only saved when the user enables local save.
- Offline mode skips quota checks and usage counting.
- Offline knowledge-base defaults are higher than online: 5000 files, 20000000 read characters, 50000 prompt-injection characters, and 3000 characters per section.

Knowledge-base capacity goal:

- The offline version should remove the small fixed file limit or set it high enough that ordinary Obsidian vaults are not blocked by app policy.
- The app should still avoid sending the whole vault to the model at once.
- The app should read/index many local Markdown files, then select relevant snippets for each generation request.
- The real constraints should be browser memory, local machine performance, selected model context length, and API cost, not an arbitrary 80-file product limit.

Recommended first offline defaults:

- `offlineKnowledgeMaxFiles`: no hard product cap, or a very high safety cap such as `5000`.
- `offlineKnowledgeMaxTotalChars`: high local safety cap, such as `20000000`, with user warning when exceeded.
- `offlineKnowledgeMaxPromptChars`: configurable, default higher than online, such as `50000`.
- `offlineKnowledgeMaxSectionChars`: configurable, such as `3000`.

Important constraint:

- "No limit" must not mean "send all Markdown content to the model." It means the app can read a large vault locally and retrieve relevant snippets before each model call.

### Offline Download Entry

The online version should provide a visible action:

- `下载线下电脑版`

First implementation path:

1. Provide a downloadable offline package, such as a ZIP containing an offline HTML entry and required assets.
2. The user downloads and opens it locally.
3. The offline entry starts in `offline` mode automatically.
4. The offline entry hides login/admin/quota surfaces.
5. The offline entry exposes local API-key settings in the normal creation flow.

Later desktop-app path:

- Package the offline mode as a real desktop app with Electron or Tauri.
- The app should open directly to the creation surface.
- A desktop shell can improve file-system access, larger-vault indexing, local cache persistence, and future local embedding/search.

### Mode Detection

Recommended implementation options:

- `index.html?mode=offline`
- a generated `offline.html`
- a bundled desktop wrapper that injects offline mode at startup

The first implementation should prefer the lowest-risk option: an `offline.html` or ZIP package generated from the same source code with an offline-mode flag.

### Offline API Key Storage

Offline API keys should be stored only on the user's own machine.

Rules:

- Offline text-model API keys may be saved to local browser storage if the user opts in.
- Offline image API keys may be saved locally if the user opts in.
- Offline keys must not be included in exported histories, Base sync packages, Markdown exports, or downloaded offline packages.
- Offline mode should clearly indicate that API requests still go directly from the user's computer to the configured model provider.

## UI Expectations

The knowledge-base control should feel like part of the creation surface, not like an admin feature.

Recommended states:

- `自由脑暴`: no knowledge base selected.
- `知识库脑暴`: one or more Markdown files selected.
- A compact label showing selected file count or current source.
- A clear/remove action to return to free-form brainstorming.

The interface should stay lightweight. Do not add API configuration, model configuration, token usage, or quota information to the normal user flow.

## Full Content Generation Requirement

The next product layer should extend the existing continuation flow from plans/outlines into full draft content.

The intended user journey is:

1. The user selects one or more ideas from the idea wall.
2. The user generates a plan or outline, such as an official-account plan, Xiaohongshu plan, Moments copy direction, novel structure, or song plan.
3. The user clicks the next matching action to turn that plan into a complete draft.
4. The user can then copy or export the generated complete content.

This should not feel like a separate advanced module. It should be a second step inside the existing continuation flow:

- `点子 -> 公众号方案 -> 公众号正文`
- `点子 -> 小红书方案 -> 小红书长文`
- `点子 -> 朋友圈文案方案 -> 朋友圈长文`
- `点子 -> 小说架构 -> 小说正文`
- `点子 -> 作曲方案 -> 完整歌词`

### Single-Idea Actions

In the idea detail panel, each existing generated plan should expose the matching next action:

- `公众号正文`: generate a complete official-account article from the official-account plan.
- `小红书长文`: generate a publishable Xiaohongshu long-form post from the Xiaohongshu plan.
- `朋友圈长文`: generate a longer natural Moments post from the Moments plan.
- `小说正文`: generate a fiction draft from the novel structure.
- `完整歌词`: generate or refine a complete lyric draft from the song plan.

The current implementation uses an automatic completion flow. When the user clicks a complete-draft action and the upstream plan is missing, the app first generates the missing plan, then continues into the complete draft without requiring a second click. This applies to both single-idea and batch actions:

- `公众号正文`: auto-generate the official-account plan first when missing.
- `小红书长文`: auto-generate the Xiaohongshu plan first when missing.
- `朋友圈长文`: auto-generate the Moments copy plan first when missing.
- `小说正文`: auto-generate the novel structure first when missing.
- `完整歌词`: auto-generate the song plan first when missing.

The UI should still explain what is happening with a concise status message, such as `正在补齐公众号方案，然后生成正文...`.

### Batch Actions

Batch generation should preserve the same beginner-friendly mental model:

1. Select ideas.
2. Batch-generate plans/outlines.
3. Batch-generate complete drafts from those plans/outlines.
4. Export.

Recommended batch buttons:

- `批量公众号正文`
- `批量小红书长文`
- `批量朋友圈长文`
- `批量小说正文`
- `批量完整歌词`

These buttons should sit near the existing batch continuation actions, not in a separate unrelated area. The user should understand that they are the next step after generating the matching plan.

### Data Fields

Each idea should store complete drafts separately by content type:

- `officialArticle`
- `xhsArticle`
- `momentsArticle`
- `novelDraft`
- `songDraft`

This keeps display, copy, and export behavior explicit and avoids one ambiguous `fullContent` field.

### Knowledge-Base Inheritance For Complete Drafts

If knowledge-base mode is active, complete draft generation should inherit knowledge-base context, but the output must not visibly read like a knowledge-base excerpt, research note, or paper.

The knowledge base should be treated as an invisible material source:

- Use its concepts, arguments, examples, details, worldview, emotional cues, and expression tendencies.
- Transform those materials into the target content format.
- Keep the final draft natural and coherent in its own genre.
- Avoid obvious pasted sections, mechanical summaries, and paper-like paragraphs.
- Avoid phrases that expose the process, such as `根据知识库`, `从上述材料可知`, `笔记中提到`, or `资料显示`.
- Avoid mixing one dry source-like paragraph into otherwise natural writing.

Genre-specific expectations:

- Official-account articles should be readable, opinionated, structured, and story-aware, not academic.
- Xiaohongshu long posts should be concrete, light, visual, and publishable.
- Moments long posts should sound like a real person, not a formal article or marketing copy.
- Fiction drafts should use the knowledge base as inspiration for setting, conflict, image, or theme, but read like fiction.
- Lyric drafts should use the knowledge base as theme, imagery, or emotion, but read like singable lyrics.

The prompt rule should be explicit: knowledge-base content is source material to absorb and rewrite, not text to quote or paste.

### Export Expectations

Complete drafts should be included in existing copy and export flows:

- Word export should include generated complete drafts.
- Markdown/TXT export should include generated complete drafts.
- Copy-current and copy-selected flows should include complete drafts when present.
- Excel can record whether a complete draft exists, but should avoid dumping very long full text unless the UI explicitly supports it.

## Next-Phase Product Requirements

The next phase should keep the current restrained, easy-to-start style. New capabilities should sit behind lightweight controls, detail panels, or advanced/export areas instead of making the main creation surface feel like an admin console.

### Auto-Complete Full Draft Flow

The preferred behavior is option B:

1. The user clicks a full-draft action, such as `批量公众号正文`.
2. If the required upstream plan already exists, generate the full draft directly.
3. If the required upstream plan is missing, automatically generate that plan first.
4. After the plan is generated successfully, continue into full-draft generation.
5. If only part of the selected batch is missing plans, generate missing plans for those items and then generate drafts for all ready items.

This should reduce the current confusion where users click a full-draft button and feel that it has no reaction because the app only reports a missing upstream plan.

### Local Brainstorm History

Add local history for brainstorm sessions. This history should use browser-side storage and must not require a backend.

The saved session should include the full creative working set:

- Seed idea and basic generation settings.
- Generated ideas.
- Selected state.
- Brief expansions.
- Official-account plans and full articles.
- Xiaohongshu plans and long posts.
- Moments copy plans, variants, and long posts.
- Novel structures and drafts.
- Song plans and full lyrics.
- Image prompts and generated image metadata where practical.

The saved session must not include:

- DeepSeek API keys.
- Image API keys.
- Admin credentials.
- Knowledge-base raw Markdown content.

Knowledge-base mode may save only lightweight metadata, such as `knowledgeBaseActive`, file count, source label, and last used character count. It must not persist the selected Markdown text itself.

Recommended UI:

- A compact `历史` entry near the creation area or export area.
- Save current session automatically after meaningful generation steps.
- Let users restore, rename, delete, and duplicate a session.
- Keep the newest sessions first.

### Search, Filters, And Selected-Only View

Add lightweight controls above the idea wall:

- Search by title, direction, summary, category, platform, and generated content.
- Filter by category.
- Filter by platform.
- Toggle `只看已选`.
- Optionally filter by generation state: `有方案`, `有正文`, `有配图`.

Filtering should only affect the visible idea wall. It should not delete data, reset selected state, or change export contents except when the user explicitly chooses visible-only export in a future version.

### Xiaohongshu Image Prompt Export

Add export support for Xiaohongshu image prompts so users can continue into image generation tools.

The prompt export should be derived from existing idea data:

- Xiaohongshu title and body.
- Image ideas.
- Visual style.
- Cover/use-case settings.
- Existing generated image prompt if the user has edited it.

Recommended export formats:

- Markdown for human review.
- TXT for direct copy.
- CSV or Excel columns for batch image workflows.

This feature should not require generating images. It should work as a text export layer.

### Moments Multi-Style Variants

When generating Moments copy, support three variants in one generation:

- `有趣版`
- `利他版`
- `生活感版`

The variants should be stored explicitly instead of overwriting the existing `moments.copy`. The original concise Moments plan can remain as the default copy, while variants give users comparison choices.

Suggested data shape:

- `moments.copy`
- `moments.variants.funny`
- `moments.variants.useful`
- `moments.variants.lifestyle`

Copy and export flows should include variants when present.

### Lark Base Sync

Lark Base sync starts as an advanced/export feature with a clear boundary because this app is currently static and browser-only.

The implemented first step:

1. The user chooses `导出飞书 Base 同步包` from the advanced/export area.
2. The app reads the current brainstorm session structure.
3. The export logic infers a reasonable Base schema from the app's own structured fields.
4. The app writes a JSON file containing `schema` and `records`.
5. Each record maps one idea into flattened fields for plans, drafts, image data, and generation state.

The next direct-sync step:

1. A browser auth flow or local helper reads the exported package.
2. If a target Base/table exists, compare its fields and create missing fields when permitted.
3. If no target exists, create a new Base/table with the inferred schema.
4. Write one row per idea.

The schema can be automatically inferred from current product data because the app already has stable fields for ideas, plans, drafts, images, and selection state. The sync should infer schema from this structured session data, not from raw knowledge-base Markdown.

Recommended first schema:

- Basic idea fields: id, category, direction, title, summary, angle, audience, platform, score, selected.
- Generation state fields: hasBrief, hasOfficialPlan, hasXhsPlan, hasMomentsPlan, hasNovel, hasSong, hasOfficialArticle, hasXhsArticle, hasMomentsArticle, hasNovelDraft, hasSongDraft.
- Plan fields: officialTitle, officialAbstract, officialCorePoint, officialOutline, xhsTitle, xhsBody, momentsCopy, novelTitle, songTitle.
- Full draft fields: officialArticle, xhsArticle, momentsArticle, novelDraft, songDraft.
- Image fields: imagePrompt, imageUrl, imageProvider, imageModel.
- Metadata fields: sessionTitle, seedIdea, createdAt, updatedAt.

Constraints:

- Do not sync API keys, admin settings, usage counters, or raw knowledge-base Markdown.
- Normal users should not see Feishu auth or sync internals unless they choose the sync action.
- If browser-side Lark auth is not practical, use a local helper or existing CLI workflow as the implementation path.

### Model Provider Expansion

Support Kimi and custom OpenAI-compatible endpoints as admin-only configuration.

Rules:

- Provider, base URL, model name, API key, temperature, and default content settings remain in the admin backend/settings area.
- Normal users continue to see only the lightweight creation flow.
- The main interface must not show API keys, model settings, token usage, API-call counts, or quota counters.
- The generation code should be structured so new providers can reuse the same prompt builders and JSON parsing rules.

### Implementation Status

Implemented in `index.html`:

- The detail panel exposes single-idea actions for `公众号正文`, `小红书长文`, `朋友圈长文`, `小说正文`, and `完整歌词`.
- The batch content group exposes `批量公众号正文`, `批量小红书长文`, `批量朋友圈长文`, `批量小说正文`, and `批量完整歌词`.
- Each complete draft action auto-generates the matching upstream plan when it is missing.
- Complete drafts are stored on each idea with the required fields: `officialArticle`, `xhsArticle`, `momentsArticle`, `novelDraft`, and `songDraft`.
- Complete drafts are displayed in the detail panel and can be edited through the existing edit flow.
- Complete drafts inherit knowledge-base context when knowledge-base mode is active.
- Complete draft prompts explicitly treat knowledge-base content as invisible source material to absorb and rewrite, not text to quote, paste, or expose.
- Copy-current, copy-selected, Word export, Markdown export, and TXT export include generated complete drafts.
- Excel export records whether each complete draft type exists, without dumping long body text into the sheet.
- Complete-draft actions auto-generate missing upstream plans before generating full drafts.
- The idea wall supports search, category filtering, platform filtering, generation-state filtering, and selected-only view.
- Xiaohongshu image prompts can be exported as a Markdown prompt summary for selected ideas.
- Local brainstorm history saves and restores ideas, selections, plans, drafts, image prompts, and lightweight image metadata without storing API keys or raw knowledge-base Markdown.
- Moments copy generation stores three variants: funny, useful, and lifestyle.
- Admin settings support DeepSeek, Kimi, and custom OpenAI-compatible text model endpoints while keeping provider details out of the normal user flow.
- A Lark Base sync package export creates inferred schema and records from selected ideas without syncing API keys, admin settings, usage counters, or raw knowledge-base Markdown.
- The local `sync-to-lark.ps1` helper can consume the JSON sync package, preview it with `-DryRun`, create missing fields with `-EnsureFields`, and batch-create records into an existing Base table via `lark-cli`.

## Future Optimization Roadmap

The following optimizations are all accepted into the product roadmap. They should be implemented in phases while preserving the current restrained, easy-to-start interface. The normal creation surface should remain focused on input, idea selection, continuation, and export. Admin, provider, quota, sync, and indexing complexity should stay behind backend/admin/offline/advanced surfaces.

### Phase 1: Cloud Backend Configuration Center

Priority: highest for the online version.

Problem:

- The online app is currently a static page.
- Admin settings, invite codes, user usage, shared API keys, and online knowledge-base limits are saved in the current browser's `localStorage`.
- This means one administrator cannot reliably enforce settings for all online users.

Goal:

- Add a Cloudflare-based backend configuration layer so online settings become real shared product settings rather than browser-local soft settings.

Recommended architecture:

- Cloudflare Worker as the API layer.
- Cloudflare D1 for structured data such as users, invite codes, quotas, usage, and admin settings.
- Cloudflare KV or D1 for product configuration such as model defaults and online knowledge-base limits.
- Optional Cloudflare Pages Functions if keeping deployment tightly coupled to Pages is simpler.

Required capabilities:

- Store admin settings server-side.
- Store invite codes server-side.
- Store user accounts and usage counters server-side.
- Enforce quota and usage limits server-side.
- Enforce online knowledge-base limits server-side or at least fetch shared limit values from the backend.
- Let the frontend fetch public-safe runtime config without exposing admin-only data.
- Keep normal users away from API keys, model settings, token usage, API-call counts, and quota counters.

API-key handling options:

1. Backend proxy mode:
   - Store shared provider API keys server-side.
   - Browser sends prompt requests to the Worker.
   - Worker calls the model provider.
   - This is better for online shared use because users never receive shared API keys.
2. Frontend direct-call mode:
   - Keep the current direct browser-to-provider call.
   - Use backend only for settings, quota, and invite codes.
   - This is simpler but less secure for shared API keys.

Preferred direction:

- Use backend proxy mode for online shared text generation once the Worker exists.
- Keep offline mode as direct local browser-to-provider calls using the user's own API keys.

Implementation status for first backend step:

- Added Cloudflare Pages Functions endpoints:
  - `GET /api/runtime-config`
  - `GET /api/admin-config`
  - `POST /api/admin-config`
- Added optional KV binding contract: `AI_BRAINSTORM_CONFIG`.
- Added optional account KV binding contract: `AI_BRAINSTORM_ACCOUNTS`.
- Added admin token contract: `AI_BRAINSTORM_ADMIN_TOKEN` or `ADMIN_TOKEN`.
- The public runtime config currently contains only online knowledge-base limits.
- The frontend now calls `/api/runtime-config` in online mode and prefers backend online knowledge-base limits when available.
- Added `/api/account` for backend account status, session restore, login, register, logout, registered-user usage recording, invite management, and user-limit updates.
- The frontend now probes `/api/account?action=status` in online mode. When the account backend is enabled, login/register and registered-user usage recording use the backend API; otherwise the previous browser-local account flow remains active.
- If the backend endpoint, KV binding, or runtime config is unavailable, the frontend falls back to browser-local admin settings.
- Backend AI proxy, stricter server-side guest identity, and secure provider API-key storage remain future backend steps.

### Phase 2: Real Offline Desktop App

Priority: highest for large personal knowledge-base workflows.

Problem:

- The current offline version is a generated HTML package.
- It can hide online account/admin surfaces and use local API keys, but it is still constrained by browser local-file behavior, CDN availability, and browser storage.

Goal:

- Package offline mode as a real desktop app that opens directly into the creation surface and is optimized for large local Markdown knowledge bases.

Recommended shell:

- Tauri is preferred if the goal is a lightweight desktop app.
- Electron is acceptable if web compatibility and packaging speed matter more than binary size.

Required capabilities:

- Open directly in offline mode.
- Hide `游客登录`, `管理员`, invite-code, quota, and usage UI.
- Let the user configure text-model and image-model API keys locally.
- Store API keys in OS-level secure storage when possible.
- Let the user choose one or more local Markdown/Obsidian folders.
- Remember selected knowledge-base folders between sessions.
- Support large-vault scanning and incremental refresh.
- Preserve local history and export behavior.
- Keep the same visual style and core workflow as the web app.

Desktop-specific knowledge-base requirements:

- Read many Markdown files without relying on browser file picker limits.
- Track file path, modified time, size, frontmatter, tags, headings, and links where practical.
- Re-index only changed files after the first scan.
- Provide a clear status for indexing progress and last refresh time.
- Avoid sending raw full vault content to AI providers.

### Phase 3: Local Knowledge-Base Index And Retrieval

Priority: high after offline mode is stable.

Problem:

- The current implementation uses lightweight keyword-based section ranking.
- This is useful but rough for large vaults, synonyms, long-term topic memory, and multi-hop idea discovery.

Goal:

- Upgrade knowledge-base retrieval so the app can use large local Markdown libraries more intelligently without losing the light workflow.

Recommended staged implementation:

1. Better lexical ranking:
   - Include file name, folder path, frontmatter tags, Markdown headings, wikilinks, and body text in scoring.
   - Weight headings and tags higher than body text.
   - Detect exact topic matches, related aliases, and repeated terms.
2. Local search and filters:
   - Add optional filters for folder, tag, file name, and modified time.
   - Let the user search the selected knowledge base before generation.
   - Let the user pin specific notes as required context.
3. Local inverted index:
   - Build a browser/desktop-side index from Markdown sections.
   - Store only local index metadata, never upload it to the app server.
   - Use the index to retrieve relevant sections per generation request.
4. Optional embedding retrieval:
   - Add local or user-provider embedding only after lexical retrieval is stable.
   - Store embeddings locally in the desktop app or browser storage.
   - Make embedding generation explicit because it can cost money and send text to an embedding provider.

Retrieval UI principles:

- Keep the default mode simple: user selects knowledge base, enters idea, generates.
- Put search, filters, and pinned notes behind a compact advanced knowledge panel.
- Show a short "used sources" summary after generation without exposing a complex research interface.

### Phase 4: Project-Based Brainstorm History

Priority: medium-high for repeat use.

Problem:

- Local history exists, but as the app grows, simple session history can become hard to navigate.

Goal:

- Upgrade history into project-style brainstorm records while still staying local-first.

Recommended project fields:

- Project title.
- Seed idea.
- Created time.
- Updated time.
- Generation settings snapshot.
- Knowledge-base metadata only: active state, file count, source label, last used character count.
- Generated idea count.
- Selected idea count.
- Full-draft completion count.
- Image prompt/image generation state.
- Export/sync state where practical.

Required project actions:

- Restore.
- Rename.
- Duplicate.
- Delete.
- Archive.
- Search by project title, seed idea, and generated idea text.

Storage rules:

- Do not save API keys.
- Do not save admin credentials.
- Do not save raw knowledge-base Markdown.
- Keep history local unless a future explicit cloud account system is added.

### Phase 5: Export System Organization

Priority: medium.

Problem:

- Export capabilities are expanding: Excel, Word, Markdown, TXT, PPT outline, Xiaohongshu image prompts, image files, Lark Base package.
- Without grouping, the advanced/export area can become harder to scan.

Goal:

- Organize export actions by user intent without making the main creation flow heavier.

Recommended export groups:

- Content export:
  - Word.
  - Markdown.
  - TXT.
- Data export:
  - Excel.
  - Lark Base sync package.
- Creative-asset export:
  - Xiaohongshu image prompts.
  - PPT outline.
  - Image files.

UX requirements:

- Keep common exports visible.
- Put specialized exports in a compact advanced/export section.
- Preserve existing export behavior.
- Do not add nested cards or heavy admin-style panels.

### Phase 6: Lark Base Semi-Automatic Sync

Priority: medium after export schemas stabilize.

Problem:

- The current Lark Base path exports a JSON package and provides a local PowerShell helper.
- This is safe and practical, but the workflow can be smoother.

Goal:

- Make Lark Base sync feel like a guided local workflow before attempting browser-side OAuth/direct sync.

Recommended next step:

- Keep exporting the JSON sync package from the web app.
- Improve the local helper so it can:
  - Accept a Base URL.
  - Detect or ask for the target table.
  - Preview schema and records with `-DryRun`.
  - Create missing fields with `-EnsureFields`.
  - Batch-create records.
  - Print record counts and created record links after completion.
  - Fail clearly when `lark-cli` is not authenticated or lacks permission.

Future direct-sync option:

- Add browser auth or a local companion process only after the JSON package and CLI workflow are reliable.
- Direct sync must not expose normal users to Feishu auth internals unless they explicitly choose the sync action.

### Phase 7: Documentation Restructure

Priority: medium-low, but useful before the next large implementation round.

Problem:

- The current requirements document includes original requirements, implementation status, future plans, and open questions in one long file.
- This is acceptable for current development, but it will become harder to maintain as backend, desktop, indexing, and sync work expand.

Recommended split:

- `docs/requirements.md`: stable product goals and user-facing requirements.
- `docs/implementation-status.md`: what is currently implemented and where.
- `docs/roadmap.md`: accepted future optimizations and phase priorities.
- `docs/technical-limits.md`: static-app limits, online/offline differences, privacy boundaries, and backend requirements.

Until the split is done:

- Keep this document as the single source of truth.
- Clearly label implementation status versus future requirements.
- Avoid leaving outdated "first version" limits unqualified when later online/offline limits differ.

## Roadmap Priority Summary

Recommended implementation order:

1. Cloud backend configuration center.
2. Real offline desktop app.
3. Local knowledge-base index and retrieval.
4. Project-based brainstorm history.
5. Export system organization.
6. Lark Base semi-automatic sync.
7. Documentation restructure.

Rationale:

- The backend configuration center stabilizes online shared use.
- The desktop app stabilizes the user's large local knowledge-base workflow.
- Retrieval quality matters most after the app can reliably access larger knowledge bases.
- History, export, and sync improvements compound once core online/offline architecture is stable.

## Out Of Scope For First Version

- Full Obsidian vault indexing.
- Obsidian plugin integration.
- Reading Obsidian graph data.
- Cloud synchronization of knowledge-base files.
- Backend storage.
- User account-level knowledge-base management.
- Automatic long-term storage of selected knowledge-base content.
- Persisting raw knowledge-base Markdown in brainstorm history.

## Open Questions

- Should the default picker select a whole folder first, or should it present file selection first for wider browser compatibility?
- Should the AI use the whole selected knowledge base with truncation, or should the app first filter files by the user's input keywords?
- Should the user be able to select multiple named knowledge bases and switch between them, or is one active knowledge source enough for the first version?
- Should knowledge-base mode affect only the first idea wall, or also later steps such as official-account plans, Xiaohongshu plans, Moments copy, novel structures, and song plans?

Current answers for the first implementation:

- The UI exposes both folder selection and multi-file Markdown selection.
- The app uses keyword-based section ranking when the selected content is large.
- Only one active temporary knowledge source is supported.
- Knowledge-base mode affects the idea wall and all later AI continuation steps.
