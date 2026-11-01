# Architecture

## Approach: islands architecture

Pages are rendered to static HTML at build time by Astro and ship no JavaScript by default. Interactive parts are **islands**: isolated components that hydrate independently, only when needed. This keeps the site fast while allowing rich interactions.

- Static components: `.astro` files in `src/components/`. Never ship client JS.
- Islands: Svelte components in `src/islands/`, embedded in a page or component with a `client:*` directive.

### Choosing a hydration directive

Pick the lightest one that works.

| Directive | Hydrates | Use for |
| --- | --- | --- |
| `client:visible` | When scrolled into view | Default for anything below the fold or decorative (e.g. `Starfield`) |
| `client:idle` | When the browser is idle | Non-critical but above the fold |
| `client:media="(query)"` | When the media query matches | Desktop-only effects |
| `client:load` | Immediately | Only when the interaction is needed at once |

Small behaviors that need no framework can use a plain `<script>` in an `.astro` file.

## Structure

```
src/
  pages/            index.astro, about.astro, projects/[slug].astro
  layouts/          BaseLayout.astro (html shell, navbar, footer)
  components/       Navbar, Footer, Hero, SectionHeading, ProjectCard (static)
  islands/          Starfield.svelte (hero visual, client:idle)
  content/          projects/*.md (see content.md)
  content.config.ts collection schemas
  styles/           tokens.css, global.css
public/             files served as-is
```

## Pages and navigation

- Navbar (in `BaseLayout`): **Home**, **Projects** (dropdown listing every non-draft project), **About me**. The dropdown opens on hover and focus-within (CSS), plus a small inline script for touch (tap toggles `data-open`, outside click and Escape close it).
- Home (`/`): hero and an overview grid of projects.
- Project page (`/projects/<slug>`): generated from the content collection. Project-specific interactive islands are added to the page for that project (not yet implemented).
- About (`/about`): presentation page.

## Build

Static output (`output: 'static'`) to `dist/`. See `deployment.md`.
