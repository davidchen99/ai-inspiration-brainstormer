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

## UI Expectations

The knowledge-base control should feel like part of the creation surface, not like an admin feature.

Recommended states:

- `自由脑暴`: no knowledge base selected.
- `知识库脑暴`: one or more Markdown files selected.
- A compact label showing selected file count or current source.
- A clear/remove action to return to free-form brainstorming.

The interface should stay lightweight. Do not add API configuration, model configuration, token usage, or quota information to the normal user flow.

## Out Of Scope For First Version

- Full Obsidian vault indexing.
- Obsidian plugin integration.
- Reading Obsidian graph data.
- Cloud synchronization of knowledge-base files.
- Backend storage.
- User account-level knowledge-base management.
- Automatic long-term storage of selected knowledge-base content.

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
