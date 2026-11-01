# Content

Editable content lives in `src/content/` and is typed by `src/content.config.ts`. Components contain no hard-coded content (apart from placeholders to replace).

## Projects

One Markdown file per project: `src/content/projects/<slug>.md`. The file name is the URL slug (`/projects/<slug>`).

```md
---
title: Project name
summary: One or two lines shown on cards.
year: 2026
tags: [web, math]
order: 1            # lower comes first (optional, default 0)
cover: /images/x.png  # optional, file in public/
repoUrl: https://...  # optional
liveUrl: https://...  # optional
draft: false          # true hides it everywhere
---

Markdown body shown on the project page.
```

The home grid, the navbar dropdown and the project page all read this collection.

## Other placeholders to replace

Shared site content (name, description, headline, intro, about text, social links) lives in `src/data/site.ts`. The navbar, hero, footer, about page and layout read from it. Social links appear in both the navbar (icons) and the footer.

## Media

Put images and other static media in `public/` (served as-is) and reference them by absolute path (`/images/x.png`).
