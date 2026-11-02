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
  components/       Navbar, Footer, Hero, SectionHeading, ProjectCard, ShowcaseProject, Photo, VideoEmbed (static)
  islands/          Starfield.svelte (hero), SilkWaves.svelte (hero), BitGrid.svelte (about), all client:idle; SglDemo.svelte (SGL project page), client:visible; Bubbles or CircuitBackground, Lightbox (client:idle) and Stage (client:visible) on showcase pages
  content/          projects/*.md (see content.md)
  content.config.ts collection schemas
  styles/           tokens.css, global.css
public/             files served as-is
```

## Pages and navigation

- Navbar (in `BaseLayout`): **Home**, **Projects** (dropdown listing every non-draft project), **About me**. The dropdown opens on hover and focus-within (CSS), plus a small inline script for touch (tap toggles `data-open`, outside click and Escape close it).
- Home (`/`): hero and an overview grid of projects.
- Project page (`/projects/<slug>`): generated from the content collection. A project can opt into an interactive island with the `demo` frontmatter field (see `content.md`); `[slug].astro` maps the value to its island. A project with `layout: showcase` is rendered by `ShowcaseProject.astro` instead (see below).
- About (`/about`): presentation page.

## Build

Static output (`output: 'static'`) to `dist/`. See `deployment.md`.

## SGL demo island

`src/islands/SglDemo.svelte` is not bundled with the SGL engine. It imports `sgl.js` at runtime from `https://cdn.jsdelivr.net/gh/mrjacksonsapien/SGL@main/sgl.js`, so the demo follows the `main` branch of the SGL repository automatically (jsDelivr caches branches for up to ~12 hours; purge at `https://www.jsdelivr.com/tools/purge` to force it). If the load fails the island shows a message with a link to the repo. An info button under the viewport shows the `demoNotes` from the project's frontmatter (what differs from stock SGL).

The scene is an island (`src/islands/sgl-island.ts`): terrain, animated waves, a dock with a boat, a shack and a palm tree, built from SGL's `Mesh`, `Vertex` and `Triangle`. `sgl-shapes.ts` holds the geometry primitives (and earlier experiments: cube, pyramid, sphere, character; currently unused).

- **Detail:** `DETAILS.low` / `DETAILS.high` in `sgl-island.ts` set every resolution (about 2,000 vs 7,600 triangles). Switch with the `DETAIL` constant in `SglDemo.svelte`.
- **Resolution:** the canvas renders at 480x360 and is scaled with a CSS transform. SGL maps to the screen with the canvas's CSS size but fills a width x height buffer, so the two must be equal: never stretch the canvas with CSS width/height.
- **Coordinates:** SGL's world is x-left, y-down, z-forward (and `camera.position` is the world position with z negated). Models are built in an intuitive space and converted with `toEngine()`. Triangles are wound so the front face points outward: `(b - a) x (c - a)` away from the solid.
- **Engine overrides:** `createFastRenderer` subclasses `Renderer` and replaces two methods with versions that give the same output: `convertSceneToFlatArrays` (a Map instead of the quadratic `indexOf`) and `clip` (triangles fully inside the view skip it; crossing ones still use SGL's `clip`). Everything else is SGL's own. If SGL's main renames these methods, update `sgl-island.ts`.

Consequences to keep in mind:

- The island depends on this API of SGL: `Camera`, `Scene`, `Renderer` (`convertSceneToFlatArrays`, `clip`, `SIZEOF_*`), `Mesh`, `Vertex`, `Triangle`, `Color`, `Vector3`, `Matrix.multiplyMatrixWithVertex`. If a change on SGL's main breaks them, update the island.
- It runs third-party-hosted code on the site. It is the owner's own repository, but a compromised repo or CDN would run on the portfolio origin.
- `raw.githubusercontent.com` cannot be used: it serves `text/plain` with `nosniff`, which browsers reject for modules.

## SGL story visuals

On a project with `story` steps, `[slug].astro` renders one row per step: text plus an optional `SglStage` island.

- `src/islands/SglStage.svelte`: one small canvas, `client:visible`. Takes `kind` and `label` (accessible description). It owns sizing, the loop, pausing and reduced motion.
- `src/islands/sgl-stages.ts`: the drawing code, one function per `kind` (`mesh`, `transform`, `culling`, `projection`, `clipping`, `raster`). Pure functions of time, drawn in the foreground color at varying opacity. To add a stage: add a function, register it in `stages` and `stillTime`, and add the name to the enum in `content.config.ts`.
- `src/islands/SglPipeline.svelte`: decorative background behind the steps (function boxes, arrows, vertex packets and the matrices applied to them). Sticky and viewport-sized, so its cost does not grow with the page. Remove by deleting it from `[slug].astro`.
- `.reveal` (in `motion.css`) makes each step rise as it scrolls into view where scroll-driven animations are supported.

## Showcase project pages

`layout: showcase` in a project's frontmatter switches `[slug].astro` to `src/components/ShowcaseProject.astro`, a picture-led page (used by Aquamania and the Maze game): a full-bleed `banner` that fades to black right where the title starts, then the title with a Roblox or GitHub link, the Markdown body, one zigzag row per `story` step (text next to tilted pictures, a small animation and/or a video) and a `gallery`. The `background` field picks the canvas fixed behind the page: `bubbles` (Aquamania) or `circuit` (Maze game).

- `Photo.astro`: a tilted screenshot (`rotate` via the `--tilt` custom property, straightens on hover). It is a link to the large image, so it still works without JavaScript.
- `src/islands/Lightbox.svelte` (`client:idle`): one per page. It listens for clicks on any `a[data-lightbox]`, collects them in document order and opens a `<dialog>` viewer with arrows, keyboard (arrows, Home, End, Escape), swipe and a thumbnail carousel at the bottom. The banner is decorative and not part of it. It reads `href` (large image), the inner `<img>` (thumbnail), its `alt` and `data-caption` from the DOM, so a new `Photo` joins the carousel automatically.
- `src/islands/Bubbles.svelte` (`client:idle`): fixed, viewport-sized canvas behind the page. Small bubbles rise and wobble; the pointer pushes them aside and drags them along its movement. Constants at the top tune the density and the pointer feel. Remove by deleting it from `ShowcaseProject.astro`.
- `src/islands/Stage.svelte` + `stages.ts`: same idea as `SglStage`/`sgl-stages.ts` (one canvas with a black background, drawing in a pure function of time, pauses off screen, still frame under reduced motion). `stages.ts` merges the drawing functions of each project: `aqua-stages.ts` (`regions`, `serializer`) and `maze-stages.ts` (`shift-register`, `matrix-scan`, `captive-portal`); `stage-kit.ts` has the shared helpers. To add one: add a function to the project's file, register it in its `stages` and `stillTime`, and add the name to the `animation` enum in `content.config.ts`.
- `src/islands/CircuitBackground.svelte` (`client:idle`): fixed, viewport-sized canvas for the Maze game page. A 1600x900 drawing scaled to fit: ESP32, two 74HC595, joystick and an 8x8 matrix that shows the real game (`ROOM`, `WIFI_FRAMES` and `CHECK` from `maze-stages.ts`, so it matches the hardware). Everything is a pure function of time: traces are polylines, pulses are short bright stretches of them, and each scan step (`STEP_RATE`) sends pulses along the lit rows and the selected column. Constants at the top tune opacity and speed. Remove by deleting it from `ShowcaseProject.astro`.
- `src/components/VideoEmbed.astro`: a click-to-load YouTube player (vertical 9:16). Until the click there is no request to YouTube; it then loads the `youtube-nocookie.com` iframe in place of the poster button. A plain link to YouTube stays below it.
- `Photo` takes `orientation: portrait` for tall pictures (narrower, 3:4 size hint).
- Pictures are in `public/images/<project>/` as `<name>-960.webp` (page and carousel) and `<name>-1920.webp` (viewer), the number being the longest side. Content references them without suffix (`/images/aquamania/sunken-pier`). Originals and the conversion script: `media.md`.
