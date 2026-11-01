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
  islands/          Starfield.svelte (hero), BlochSphere.svelte (hero), BitGrid.svelte (about), all client:idle; SglDemo.svelte (SGL project page), client:visible
  content/          projects/*.md (see content.md)
  content.config.ts collection schemas
  styles/           tokens.css, global.css
public/             files served as-is
```

## Pages and navigation

- Navbar (in `BaseLayout`): **Home**, **Projects** (dropdown listing every non-draft project), **About me**. The dropdown opens on hover and focus-within (CSS), plus a small inline script for touch (tap toggles `data-open`, outside click and Escape close it).
- Home (`/`): hero and an overview grid of projects.
- Project page (`/projects/<slug>`): generated from the content collection. A project can opt into an interactive island with the `demo` frontmatter field (see `content.md`); `[slug].astro` maps the value to its island.
- About (`/about`): presentation page.

## Build

Static output (`output: 'static'`) to `dist/`. See `deployment.md`.

## SGL demo island

`src/islands/SglDemo.svelte` is not bundled with the SGL engine. It imports `sgl.js` at runtime from `https://cdn.jsdelivr.net/gh/mrjacksonsapien/SGL@main/sgl.js`, so the demo follows the `main` branch of the SGL repository automatically (jsDelivr caches branches for up to ~12 hours; purge at `https://www.jsdelivr.com/tools/purge` to force it). If the load fails the island shows a message with a link to the repo.

Consequences to keep in mind:

- The island depends on this API of SGL: `Camera`, `Scene`, `Renderer`, `Cube`, `Vector3`, `Scene.add`, `Mesh.act`/`rotation`. If a change on SGL's main breaks them, update the island.
- It runs third-party-hosted code on the site. It is the owner's own repository, but a compromised repo or CDN would run on the portfolio origin.
- `raw.githubusercontent.com` cannot be used: it serves `text/plain` with `nosniff`, which browsers reject for modules.

## SGL story visuals

On a project with `story` steps, `[slug].astro` renders one row per step: text plus an optional `SglStage` island.

- `src/islands/SglStage.svelte`: one small canvas, `client:visible`. Takes `kind` and `label` (accessible description). It owns sizing, the loop, pausing and reduced motion.
- `src/islands/sgl-stages.ts`: the drawing code, one function per `kind` (`mesh`, `transform`, `culling`, `projection`, `clipping`, `raster`). Pure functions of time, drawn in the foreground color at varying opacity. To add a stage: add a function, register it in `stages` and `stillTime`, and add the name to the enum in `content.config.ts`.
- `src/islands/SglPipeline.svelte`: decorative background behind the steps (function boxes, arrows, vertex packets and the matrices applied to them). Sticky and viewport-sized, so its cost does not grow with the page. Remove by deleting it from `[slug].astro`.
- `.reveal` (in `motion.css`) makes each step rise as it scrolls into view where scroll-driven animations are supported.
