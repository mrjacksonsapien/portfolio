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
robloxUrl: https://...  # optional, shows a Roblox icon instead of the GitHub one
layout: showcase      # optional, picture-led page (see architecture.md); default is the standard page
banner: /images/x/header-1920.webp   # showcase only: full-bleed top image fading to black
background: circuit   # showcase only: bubbles (default) | circuit, the canvas fixed behind the page
demo: sgl             # optional, embeds an interactive island (allowed values in content.config.ts)
demoNotes:            # optional, shown in the demo's info popover
  - Plain text note.
story:                # optional illustrated walkthrough, one zigzag row per step
  - title: Step title
    body: Plain text.
    visual: mesh        # optional: mesh | transform | culling | projection | clipping | raster
    visualLabel: Accessible description of the animation.
    link: { label: Text, href: https://... }   # optional
galleryTitle: Heading   # showcase only, default "Gallery"
gallery:              # showcase only: pictures after the story, all open in the lightbox
  - src: /images/x/name     # no size suffix or extension: resolves to name-960.webp and name-1920.webp
    alt: Accessible description.
    caption: Shown in the lightbox.   # optional
    orientation: portrait   # optional, landscape (default) | portrait: tall pictures are shown narrower
draft: false          # true hides it everywhere
---

Markdown body shown on the project page.
```

`story` steps alternate text left / visual right, then the reverse. A step without `visual` is text only. The visuals are SGL-specific (see `architecture.md`).

On a `showcase` project a step can instead have `images` (a list of `src`/`alt`/`caption`/`orientation`) and/or `animation: regions | serializer | shift-register | matrix-scan | captive-portal` (labelled by `visualLabel`) and/or a `video` (`id` of a YouTube video, `title`, optional `poster` picture path like `src`; loads only on click). Steps alternate sides the same way. The outside link next to the title is `robloxUrl` if set, otherwise `repoUrl`.

The home grid, the navbar dropdown and the project page all read this collection.

## Other placeholders to replace

Shared site content (name, description, headline, intro, about text, social links) lives in `src/data/site.ts`. The navbar, hero, footer, about page and layout read from it. Social links appear in both the navbar (icons) and the footer.

## Media

Originals live in `media-src/<project>/`; the site serves resized WebP from `public/images/<project>/`, referenced by absolute path. Folders and the conversion command: `media.md`.
