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
repoUrl: https://...  # optional, shows a GitHub icon on the home card and next to the project title
liveUrl: https://...  # optional
demo: sgl             # optional, embeds an interactive island (allowed values in content.config.ts)
demoNotes:            # optional, shown in the demo's info popover
  - Plain text note.
story:                # optional illustrated walkthrough, one zigzag row per step
  - title: Step title
    body: Plain text.
    visual: mesh        # optional: mesh | transform | culling | projection | clipping | raster
    visualLabel: Accessible description of the animation.
    link: { label: Text, href: https://... }   # optional
draft: false          # true hides it everywhere
---

Markdown body shown on the project page.
```

`story` steps alternate text left / visual right, then the reverse. A step without `visual` is text only. The visuals are SGL-specific (see `architecture.md`).

The home grid, the navbar dropdown and the project page all read this collection.

## Other placeholders to replace

Shared site content (name, description, headline, intro, about text, social links) lives in `src/data/site.ts`. The navbar, hero, footer, about page and layout read from it. Social links appear in both the navbar (icons) and the footer.

## Media

Put images and other static media in `public/` (served as-is) and reference them by absolute path (`/images/x.png`).
