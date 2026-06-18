# Knowledge Base Brainstorm Requirements

## Background

The current product is a free-form brainstorming tool. Users enter a short idea, keyword, topic, or vague direction, and the app asks AI to expand it into content ideas.

The new need comes from an Obsidian-based workflow. The user already stores many notes, topics, arguments, examples, and personal knowledge assets as Markdown files in Obsidian. Instead of brainstorming from an empty prompt, the app should be able to use those local Markdown notes as the source material for content ideation.

This is not meant to replace Obsidian. Obsidian remains the knowledge management tool. This app should become a lightweight idea generator that can optionally read selected Markdown knowledge and brainstorm from it.

## Confirmed Product Positioning

The confirmed product positioning is:

```text
Knowledge-base-driven batch content brainstorming and production tool.
```

In Chinese product language:

```text
知识库驱动的批量内容脑暴与生产工具。
```

The product is not a generic writing toolbox and should not drift into a loose collection of unrelated generators. Its core value is to help the user turn their own knowledge, notes, ideas, and topics into a batch of selectable content assets, then continue those assets into text, images, and videos.

The primary user flow is:

```text
脑暴 -> 选择 -> 文字 -> 图片/视频 -> 导出
Brainstorm -> Select -> Text -> Image/Video -> Export
```

This flow is the product backbone. New features should attach to one of these stages instead of appearing as independent feature piles.

Core capabilities:

- Free-form brainstorming from a short idea.
- Knowledge-base brainstorming from local Markdown / Obsidian notes.
- Idea-wall display for scanning, filtering, comparing, and selecting many ideas.
- Batch continuation from selected ideas into text plans and drafts.
- Extension from text into image prompts, generated images, video scripts, and video task packages.
- Export and workflow handoff for files, Lark Base, and local video generation.

Primary content tracks:

- Official-account content.
- Xiaohongshu content.
- Moments copy.
- Video-account scripts and local video task packages.
- Image generation and image prompt export.

Extension content tracks:

- Fiction.
- Lyrics / song planning.
- PPT outlines.
- Lark Base advanced sync.

The extension tracks should be retained, but they should not compete with the main product flow. Their UI placement should remain in advanced, export, or secondary areas.

Product experience principle:

- Core flow smoothness is more important than adding more generators.
- The normal user surface should stay restrained and easy to start.
- Admin settings, provider settings, quotas, backend details, and local-service details should stay out of the main creation flow unless the user explicitly opens them.
- Every batch action should make its status visible. If a button is disabled, busy, waiting on selection, or blocked by missing prerequisites, the user should understand why.

## Product Goal

The broader product goal is to support a smooth batch content production flow from knowledge and ideas to text, images, video tasks, and export.

Knowledge-base mode is a core input mode in this broader flow, not a side feature. It lets the user's existing Markdown / Obsidian knowledge assets become the source material for brainstorming and later content generation.

When no knowledge base is selected, the app keeps the current behavior:

- Free-form idea input.
- AI can brainstorm broadly.
- The flow stays light and fast.

When a knowledge base is selected, the app changes behavior:

- The user can choose local Markdown files, or a folder containing Markdown files.
- The selected Markdown content becomes the source context for brainstorming.
- Generated ideas should be grounded in the selected knowledge base.
- The user can turn off the knowledge base mode and return to free-form brainstorming.

After ideas are generated, the user should be able to:

- Scan and compare a batch of ideas in the idea wall.
- Select promising ideas.
- Generate text plans and drafts for selected ideas.
- Continue selected ideas into image or video assets.
- Export or hand off the generated assets to downstream tools.

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

## Core Flow Experience Requirements

The confirmed core flow is:

```text
脑暴 -> 选择 -> 文字 -> 图片/视频 -> 导出
Brainstorm -> Select -> Text -> Image/Video -> Export
```

Each stage has a clear product job:

1. `脑暴`: Generate a batch of idea directions from free input or selected knowledge-base material.
2. `选择`: Let the user scan, filter, compare, and select useful ideas from the idea wall.
3. `文字`: Turn selected ideas into platform-specific plans and complete text drafts.
4. `图片/视频`: Turn selected text assets into image prompts, generated images, video scripts, or video task packages.
5. `导出`: Save, copy, sync, or hand off selected assets to downstream workflows.

Product requirements:

- The UI should make the current stage and next useful action clear.
- The idea wall should display generation states such as brief, plan, draft, image, and video script.
- Batch operations should be based on selected ideas, and the selected count should remain visible near batch controls.
- The app should avoid making users guess whether an action is generating, waiting, blocked, or complete.
- If a downstream action needs an upstream plan, either auto-generate the missing upstream plan or clearly explain what is missing.
- Export actions should describe the target outcome in user language, while technical formats can be explained in secondary text.

### Action Hierarchy

The current product has many useful actions. The next UI optimization should organize them by user intent instead of presenting every action as a flat button list.

Recommended primary action groups:

1. `生成方案`
   - Continue selected ideas into platform plans.
   - Examples: official-account plan, Xiaohongshu plan, Moments copy, video-account script.
2. `生成正文`
   - Continue existing plans into complete text drafts.
   - Examples: official-account article, Xiaohongshu long post, Moments long post.
3. `生成图片/视频`
   - Continue text assets into visual or video assets.
   - Examples: image prompt, generated image, video-account script, video task package.
4. `导出结果`
   - Copy, save, sync, or hand off selected assets.
   - Examples: Word, Markdown, TXT, Excel, image prompts, Lark Base package, video task package.
5. `高级扩展`
   - Retain lower-frequency capabilities without letting them dominate the primary flow.
   - Examples: fiction, lyrics, PPT outline, advanced sync helpers.

Requirements:

- Main-line actions should appear before extension actions.
- The user should not need to understand implementation terms such as `package`, `schema`, or `Base records` before choosing an action.
- Technical names can remain in secondary text or downloaded filenames, but visible buttons should emphasize outcomes.
- The detail panel and batch panel should use the same grouping logic so users do not learn two different mental models.
- If an action depends on selection, show the selected count and provide a clear path to selecting items.

Recommended label direction:

- Prefer `生成公众号方案` over `批量转公众号` when clarity is more important than compactness.
- Prefer `生成公众号正文` over ambiguous `长文` labels when the target platform is known.
- Prefer `交给本地视频生成器` or `导出视频任务包` with a short explanation over a purely technical label.

### Idea Wall As Workbench

The idea wall should be treated as the product's central workbench, not just a generated-result list.

The idea wall should support four jobs:

1. Scan many ideas quickly.
2. Compare which ideas are worth continuing.
3. Select a batch for processing.
4. Understand which assets already exist for each idea.

Required card state indicators:

- Brief generated.
- Platform plan generated.
- Complete draft generated.
- Image prompt or image generated.
- Video script generated.
- Export or sync readiness where practical.

Required selection behavior:

- Selection state must remain stable while filtering, searching, and changing layout density.
- Batch actions should operate on selected ideas, not merely visible ideas, unless a future explicit `visible-only` mode is added.
- When no ideas are selected, batch controls should show a clear message and offer a low-friction path such as `全选当前结果`.
- When filters are active, the user should understand whether `全选` applies to all ideas or only the current visible filtered set.

Recommended future workbench improvements:

- Add `全选当前筛选结果` beside existing select/clear controls.
- Add a compact asset-status row on each card.
- Add quick filters such as `缺正文`, `缺图片`, `缺视频脚本`, and `已完成`.
- Add per-card next-step hint, such as `可生成正文`, `可生成配图`, or `可导出视频`.

### Post-Task Guidance And Retry

Batch generation should not end with a dead status message. It should guide the user to the next useful step.

After successful tasks:

- After plan generation, suggest generating the matching complete draft.
- After complete draft generation, suggest exporting documents or generating images.
- After video-script generation, suggest exporting the video task package or later sending to the local video generator.
- After image generation, suggest exporting images or continuing with another selected batch.

After partial failures:

- Preserve successful results.
- Show the number of failed items.
- List failed item titles where practical.
- Provide a `重试失败项` path in a future implementation.
- Avoid making the user restart the whole batch when only a few items failed.

Recommended retry behavior:

```text
批量生成完成。成功 8，失败 2。
可继续：导出已成功结果 / 重试失败项
```

### Batch Task Feedback

Batch task progress is the first-priority experience optimization for the next development phase.

Problem:

- Batch text actions can take time.
- Buttons may become disabled while the app is working.
- Without visible progress, users can feel that a click had no effect.

Required behavior:

- All batch text generation actions should share one visible batch-task status component.
- The component should show task type, current item, total count, completed count, failed count, skipped count, and current idea title when available.
- The status should appear quickly after the user clicks a batch action.
- Disabled buttons should be paired with a visible explanation, such as `正在生成`, `先选择点子`, or `缺少前置方案`.
- When a batch task finishes, show a concise completion summary and the next natural action.
- If a batch task partially fails, preserve successful results and show which items failed.
- Batch image generation already has a stronger progress model; text and video-script generation should follow the same product pattern.

Recommended status copy:

```text
正在批量生成视频号脚本：3 / 10
当前点子：AI 工具选题如何变成短视频
成功 2，失败 0，跳过 0
```

### Feature Layering

Main-line features:

- Knowledge-base / free-form brainstorming.
- Idea wall scanning, filtering, and selection.
- Official-account, Xiaohongshu, Moments, and video-account script generation.
- Complete text drafts for the main text platforms.
- Image prompts and image generation.
- Video task package export.
- Common document and file exports.

Extension features:

- Fiction.
- Lyrics and song planning.
- PPT outlines.
- Lark Base advanced sync.

Rules:

- Extension features should remain available, but they should not crowd the primary user path.
- Extension features should live in advanced, export, or secondary sections.
- The first screen should continue to feel like a simple creator, not a control center.
- Adding new capability should not add new visual complexity to the main input surface unless it directly improves the core flow.

### Knowledge Base As Core Input

Knowledge-base mode is a core product input mode.

The app should communicate:

- Whether the current brainstorm is free-form or knowledge-base-driven.
- How many Markdown files are selected.
- How much knowledge context is used in the current generation.
- That raw Markdown is not saved in browser history.
- That only relevant snippets should be sent to the AI provider for each generation request.

Future UI improvement:

- Show a lightweight knowledge-use summary after generation.
- Include file count, approximate used characters, and top matched file names when practical.
- Keep this summary compact so it improves trust without turning the main UI into a technical log.

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

## Batch Video Generation Requirement

The product should add a new large module for batch short-video generation by connecting the brainstorm app with the local `moneypriturbo` / automatic video workflow.

The strategic positioning is:

- The brainstorm app is the content production and task-planning center.
- `moneypriturbo` / `autocut-workflow` is the local video rendering engine.
- The two systems should be connected through structured tasks, not by copying all video-rendering code into the online brainstorm page.

### Background

The brainstorm app can already generate ideas, plans, long drafts, Xiaohongshu content, Moments copy, image prompts, and export packages. The next opportunity is to turn selected ideas into short-video scripts and then render videos through the existing local video-generation workflow.

The related local workflow lives at:

```text
C:\Users\lenovo\Desktop\chen vibe coding\自动写作工作流\自动写视频号工作流07版（codex）--html网页\20260605氛围剪辑\autocut-workflow
```

The local workflow already has:

- A local Node web server.
- API endpoints such as `/api/state`, `/api/draft`, `/api/run`, `/api/jobs/:id`, and `/api/history`.
- A simple web console.
- Voice selection.
- Voice-style selection.
- Video-style selection.
- Output directory selection.
- Progress tracking.
- History records.
- MP4 preview.
- Local rendering through Python, PowerShell, FFmpeg, and browser-based rendering.

### Feasibility Decision

The integration is feasible, but it should be local-first.

Do not try to run the video rendering workflow inside Cloudflare Pages or Cloudflare Functions. The video workflow depends on:

- Node.js local process.
- Python scripts.
- PowerShell.
- FFmpeg.
- Local file-system access.
- Long-running render tasks.
- D-drive output folders.
- MiMo TTS API key.
- Pexels API key.
- Local browser/frame rendering.

These are not suitable for the online static app runtime.

Preferred architecture:

```text
Brainstorm app
-> generate video-ready scripts and task packages
-> send or export tasks to local moneypriturbo/autocut service
-> local service generates voice, B-roll, timeline, render frames, and MP4
-> video status and output path return to the brainstorm app when connected locally
```

### Product Goal

Add a new `批量视频` capability so the user can:

1. Generate many content ideas in the brainstorm app.
2. Select promising ideas.
3. Convert selected ideas into short-video scripts.
4. Export or send those scripts to the local video-generation engine.
5. Generate one MP4 per selected idea.
6. Track task progress and output locations.

The user-facing mental model should remain simple:

```text
点子
-> 视频号脚本
-> 本地生成视频
-> 预览 / 打开文件夹
```

### Scope Boundary

The brainstorm app should not duplicate the video engine's rendering pipeline.

The brainstorm app should own:

- Video idea selection.
- Video-script generation.
- Script editing.
- Batch task packaging.
- Sending tasks to a local video service when available.
- Displaying task state returned by the local service.
- Exporting task packages for manual import.

The local video engine should own:

- Voice synthesis.
- B-roll keyword expansion and download.
- Timeline construction.
- Subtitle timing.
- HTML video template rendering.
- FFmpeg and browser rendering.
- MP4 output.
- Local output folder management.
- Local render logs.

### First Implementation: Task Package Export

The safest first step is to add export support instead of direct service calls.

New brainstorm app actions:

- `生成视频号脚本`
- `批量生成视频号脚本`
- `导出视频任务包`

Current implementation status:

- The brainstorm page now has single-item `视频号脚本`, batch `批量视频号脚本`, and `导出视频任务包` actions.
- Video scripts are saved on each idea as a separate `videoScript` content type.
- Video scripts can be edited in the detail edit form.
- Copy, Word, Markdown, TXT, Excel, and Feishu Base exports include video script fields.
- The exported video task package targets `moneypriturbo/autocut-workflow` and intentionally excludes API keys, admin settings, usage data, and raw knowledge-base Markdown.
- Direct local service connection, queue polling, MP4 preview, and output-folder controls remain later phases.

The task package should be a JSON file that `moneypriturbo` can later import or run through a helper script.

Recommended package shape:

```json
{
  "version": 1,
  "exportedAt": "2026-06-17T00:00:00.000Z",
  "source": "ai-inspiration-generator",
  "defaults": {
    "voiceName": "冰糖",
    "voiceStyle": "自然清晰",
    "videoStyle": "知识讲解",
    "outputRoot": "D:\\自动剪辑输出\\氛围剪辑"
  },
  "tasks": [
    {
      "id": "idea-1",
      "title": "短视频标题",
      "sourceText": "完整口播文案",
      "hook": "开头钩子",
      "voiceName": "冰糖",
      "voiceStyle": "自然清晰",
      "videoStyle": "知识讲解",
      "outputRoot": "D:\\自动剪辑输出\\氛围剪辑",
      "sourceIdea": {
        "category": "AI工具",
        "direction": "选题方向",
        "summary": "一句话简介",
        "platform": "视频号"
      }
    }
  ]
}
```

Rules:

- Do not include API keys.
- Do not include admin settings.
- Do not include raw knowledge-base Markdown.
- Do not include user quota or usage data.
- The package may include lightweight metadata that helps trace a task back to the selected idea.

### Second Implementation: Local Service Connection

After task package export works, add an optional local connection to the video engine.

Potential local service:

```text
http://127.0.0.1:3000
```

Useful existing endpoints:

- `GET /api/state`: read available voices, voice styles, video styles, key status, current job, history, and schedule.
- `POST /api/draft`: clean text and create lines/clips.
- `POST /api/run`: start a video generation job.
- `GET /api/jobs/:id`: read job status.
- `GET /api/jobs/:id/video`: preview generated MP4.
- `POST /api/jobs/:id/cancel`: stop a job.
- `POST /api/jobs/:id/open-folder`: open output folder.

Required changes before direct browser connection:

- Add CORS support to the local video service.
- Keep the service bound to `127.0.0.1`.
- Add an optional local access token to prevent arbitrary web pages from controlling local file and render operations.
- Add an endpoint to accept a batch task queue or add one job at a time.
- Make error messages clear when the local service is not running.

Brainstorm app UI for local connection:

- `连接本地视频生成器`
- Connection status: `未连接` / `已连接` / `服务未启动`
- Local service URL, default `http://127.0.0.1:3000`.
- Optional local token field in offline/local settings.
- `发送到本地视频生成器`
- `查看视频队列`

### Third Implementation: Queue-Based Batch Generation

The current local workflow should be treated as a single-render worker.

The video engine currently rejects concurrent runs when a job is already running. Therefore, the brainstorm app should not submit many tasks as simultaneous render calls.

Required batch behavior:

1. Convert selected ideas into video tasks.
2. Put tasks into a queue.
3. Submit one task at a time to the local video service.
4. Poll job status until done, failed, or canceled.
5. Continue to the next task.
6. Store per-task output path, video URL, final status, and error message.

Recommended task states:

- `pending`
- `queued`
- `running`
- `done`
- `failed`
- `canceled`
- `skipped`

The UI should show:

- Total tasks.
- Current task.
- Done count.
- Failed count.
- Remaining count.
- Current stage and progress when available.
- A stop button that stops the current local job and pauses the queue.

### Fourth Implementation: Desktop Integration

The final product shape should be a local desktop app or local launcher that can start both systems together:

- Brainstorm offline mode.
- Local video generation service.
- Shared local settings.
- Output directory management.
- Video task queue.

This can be built later with Tauri or Electron.

The desktop wrapper should:

- Start the local video service automatically.
- Open the brainstorm app in offline/local mode.
- Keep video API keys local.
- Store local service token securely where possible.
- Expose one user-facing app instead of two separate browser tabs.

### Video Script Generation

The brainstorm app should add a separate content type for short-video scripts. It should not directly reuse long-form official-account articles as video scripts.

Reason:

- Official-account articles are too long and structured for reading.
- Xiaohongshu long posts are visual but not always spoken-word friendly.
- A video script needs a strong hook, short sentences, oral rhythm, and clear segment pacing.

Recommended target:

- 60-120 seconds per video by default.
- 300-700 Chinese characters depending on speaking speed.
- Clear beginning, middle, and ending.
- One main point per video.
- Natural spoken language.
- Strong opening hook within the first 3 seconds.
- Ending call-to-action when appropriate.

Recommended script fields:

- `videoTitle`
- `videoHook`
- `videoVoiceover`
- `videoOutline`
- `videoStyle`
- `voiceName`
- `voiceStyle`
- `brollKeywords`
- `estimatedDuration`
- `callToAction`

Suggested idea-level data shape:

```js
{
  videoScript: {
    videoTitle: "",
    videoHook: "",
    videoVoiceover: "",
    videoOutline: [],
    videoStyle: "知识讲解",
    voiceName: "冰糖",
    voiceStyle: "自然清晰",
    brollKeywords: [],
    estimatedDuration: 90,
    callToAction: ""
  },
  videoTask: {
    status: "pending",
    jobId: "",
    videoUrl: "",
    outputFolder: "",
    error: "",
    updatedAt: ""
  }
}
```

### Knowledge-Base Inheritance

If knowledge-base mode is active, video-script generation should inherit knowledge-base context, but it must not sound like a note summary or article excerpt.

Rules:

- Use the knowledge base as invisible source material.
- Convert knowledge into spoken short-video structure.
- Avoid phrases such as `根据知识库`, `笔记里提到`, or `资料显示`.
- Prefer concrete examples, short sentences, and oral transitions.
- If the knowledge base is insufficient, generate a script from the selected idea and mark the source confidence lower internally.

### UI Placement

The new video module should sit near existing batch continuation and export tools, not on the first screen.

Recommended placements:

- Single idea detail:
  - `视频号脚本`
  - `生成视频`
- Batch area:
  - A new group: `批量视频`
  - Buttons:
    - `批量生成视频脚本`
    - `导出视频任务包`
    - `发送到本地视频生成器`
    - `停止视频队列`

The first screen should remain focused on entering an idea and generating the idea wall.

### Online And Offline Behavior

Online version:

- Can generate video scripts.
- Can export video task packages.
- Can optionally connect to `http://127.0.0.1:3000` if browser security and local service CORS allow it.
- Must not imply Cloudflare is rendering video.
- Must show a clear local-service requirement before sending tasks.

Offline/local version:

- Can generate video scripts.
- Can export task packages.
- Can connect to local video service more naturally.
- Should be the preferred mode for real batch video generation.
- Can later become a desktop app that starts the video engine automatically.

### Dependencies And Environment

The local video engine requires:

- Node.js 22+.
- Python 3.11+.
- FFmpeg.
- PowerShell on Windows.
- MiMo API key for TTS.
- Pexels API key for B-roll when using Pexels downloads.
- Enough local disk space for frames, assets, logs, and MP4 output.

The brainstorm app should detect or communicate missing requirements through the local video service status instead of trying to validate everything itself.

### Security And Privacy

Security rules:

- Do not send local output paths to the public app server unless the user explicitly syncs metadata.
- Do not include MiMo or Pexels API keys in brainstorm exports.
- Do not expose local service control to arbitrary web pages.
- Keep the local service bound to `127.0.0.1`.
- Add a local token before allowing cross-origin browser requests from the brainstorm app.

Privacy rules:

- Video scripts may be exported locally.
- Generated videos remain on the user's machine.
- Raw knowledge-base Markdown must not be included in video task packages.
- Task package exports may include only selected idea metadata and generated video scripts.

### Initial Implementation Status

The first brainstorm-app integration step is implemented.

Existing external capability:

- The local `autocut-workflow` already has a usable web console and local API surface for video generation.
- It supports source text, voice, voice style, video style, output root, progress, history, preview, stop, and folder opening.

Implemented in the brainstorm app:

- Video-script fields and prompts.
- Single-idea `视频号脚本` action.
- Batch `批量视频号脚本` action.
- `导出视频任务包` as the first integration path.
- Video-script display and editing in the detail panel.
- Video-script inclusion in copy, Word, Markdown, TXT, Excel, and Lark Base exports.

Next accepted step:

- Keep the user flow smooth before adding direct local rendering controls.
- Add a local video-generator connection only after script generation and task package export feel reliable.
- When direct connection is added, it should feel like a natural continuation of `视频号脚本 -> 本地生成视频`, not a separate technical console.

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

### Phase 0: Core Flow Smoothness And Batch Feedback

Priority: highest for user experience.

Problem:

- The product already has many useful capabilities, but users can feel uncertain when batch actions take time or when buttons become disabled.
- The product's main value depends on moving smoothly through `脑暴 -> 选择 -> 文字 -> 图片/视频 -> 导出`.
- If this core path feels unclear, adding more generators or integrations will make the product feel heavier instead of stronger.

Goal:

- Make the existing core flow feel responsive, understandable, and confidence-building.
- Preserve the current restrained style while making batch work visibly traceable.

Required improvements:

- Add one shared batch-task status component for text and video-script generation.
- Show task type, selected count, current item, total items, success count, failure count, skipped count, and current idea title.
- Show status immediately after clicking a batch action.
- Explain disabled buttons or missing prerequisites in the batch area.
- Keep successful partial results when some items fail.
- Add a concise completion summary and next-step hint, such as `可以继续生成配图` or `可以导出视频任务包`.
- Keep extension features available but visually secondary.

Next UI refinement requirements:

- Reorganize batch actions into intent-based groups: `生成方案`, `生成正文`, `生成图片/视频`, `导出结果`, and `高级扩展`.
- Make button labels more outcome-oriented while preserving compact wording where space is limited.
- Add `全选当前筛选结果` so users can quickly move from browsing to batch processing.
- Clarify whether selection actions affect all ideas or only currently visible filtered ideas.
- Add stronger asset-state indicators on idea cards so users can see which ideas have text, image, and video assets.
- Add next-step hints after generation, such as `可生成正文`, `可生成配图`, `可导出视频任务包`, or `可导出文档`.
- Add a future `重试失败项` path for partial batch failures.
- Keep fiction, lyrics, PPT, and advanced sync available but lower in visual priority.

Success criteria:

- Users should not feel that a click had no reaction.
- Users should understand which selected idea is being processed.
- Users should understand what to do after a batch task finishes.
- The first screen should remain simple and should not expose admin/provider/internal details.
- New users should be able to identify the main path without reading documentation.
- Power users should still be able to access extension features without those features crowding the main path.

Implementation status:

- A shared batch-task status panel has been added to the batch area.
- Batch text and video-script generation now show task type, total count, progress, success, failure, skipped count, and next-step guidance.
- Auto-complete full-draft preparation now reports when upstream plans are being generated or when items are skipped.
- Batch action hints now explain whether buttons are locked by an active task or waiting for selected ideas.
- Batch actions are now grouped by intent: `生成方案`, `生成正文`, `生成图片/视频`, `导出结果`, and `高级扩展`.
- `全选当前筛选结果` is implemented for moving from filtered browsing into batch processing.
- Idea cards now show compact asset-state indicators for plan, draft, image, and video script.
- Idea cards now show a next-step hint such as continuing expansion, generating plans, generating drafts, generating images, generating video scripts, or exporting.

Remaining Phase 0 work:

- Failed-item retry has not been implemented yet.
- Extension features are still present in the same broad batch area and should be visually down-ranked in a future UI pass.
- Detail-panel action grouping can still be aligned with the new batch-panel grouping.
- Failed-item titles and retry paths can be made more explicit for partial batch failures.

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

### Phase 5: Batch Video Generation Integration

Priority: high for expanding the product from text generation to video production.

Problem:

- The brainstorm app can generate strong ideas and copy, but it does not yet turn them into short videos.
- The local `moneypriturbo` / `autocut-workflow` can generate MP4 videos, but it needs ready-to-use video scripts and structured task input.
- Directly merging the full video-rendering pipeline into the online static app is not appropriate because video rendering is local, long-running, and file-system heavy.

Goal:

- Let the brainstorm app generate and manage batch video tasks while the local video engine renders the final MP4 files.

Recommended staged implementation:

1. Video script generation:
   - Add `视频号脚本` as a new content type.
   - Generate short spoken scripts from selected ideas.
   - Store `videoTitle`, `videoHook`, `videoVoiceover`, `videoOutline`, `videoStyle`, `voiceName`, `voiceStyle`, `brollKeywords`, and estimated duration.
2. Video task package export:
   - Add `导出视频任务包`.
   - Export selected video scripts as JSON tasks compatible with the local video workflow.
   - Do not include API keys, admin settings, quota data, or raw knowledge-base Markdown.
3. Local service connection:
   - Add optional connection to `http://127.0.0.1:3000`.
   - Read local video service state.
   - Send one selected task to `/api/run`.
   - Poll `/api/jobs/:id`.
4. Batch queue:
   - Submit tasks one by one.
   - Show queue state, current task, success count, failure count, and stop controls.
   - Store returned job id, video URL, output folder, status, and error message.
5. Desktop integration:
   - Later, let a desktop app start both the brainstorm offline mode and the local video engine.

Accepted first step:

- Build video-script generation and video task package export before attempting direct local service control.

### Phase 6: Export System Organization

Priority: medium.

Problem:

- Export capabilities are expanding: Excel, Word, Markdown, TXT, PPT outline, Xiaohongshu image prompts, image files, Lark Base package, and video task package.
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
  - Video task package.

UX requirements:

- Keep common exports visible.
- Put specialized exports in a compact advanced/export section.
- Preserve existing export behavior.
- Do not add nested cards or heavy admin-style panels.

### Phase 7: Lark Base Semi-Automatic Sync

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

### Phase 8: Documentation Restructure

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

1. Core flow smoothness and batch task feedback.
2. Cloud backend configuration center.
3. Real offline desktop app.
4. Local knowledge-base index and retrieval.
5. Project-based brainstorm history.
6. Batch video generation integration.
7. Export system organization.
8. Lark Base semi-automatic sync.
9. Documentation restructure.

Rationale:

- Core flow smoothness protects the product's main value: fast movement from brainstorming to selected text, image/video assets, and export.
- The backend configuration center stabilizes online shared use.
- The desktop app stabilizes the user's large local knowledge-base workflow.
- Retrieval quality matters most after the app can reliably access larger knowledge bases.
- Project history gives batch video tasks a place to persist.
- Batch video generation expands the product from text output to publishable media while reusing the existing local video engine.
- Export and sync improvements compound once core online/offline architecture and media task flow are stable.

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
