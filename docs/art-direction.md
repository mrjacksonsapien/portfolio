# Art direction

Inspiration: `docs/inspiration/` (dark space scene, sparse monospace metadata, large condensed display type mixed with a bold monospace accent, one luminous focal object).

## Vibe

Digital, programming and math, set in space. Quiet, precise and minimal, with a single point of visual interest per page. The owner is a systems programmer who sees computer science, mathematics and science through an artistic lens: the art is the machinery itself (bits, stars, quantum states), drawn precisely and slowly.

## Color

- Background: pure black (`--color-bg`).
- Text: white (`--color-fg`), with muted and faint variants for secondary text, and hairline borders (`--color-line`).
- No other colors in the UI. Color comes only from focal visuals (e.g. a glowing orb or starfield).
- Decorative visuals are drawn in `--color-fg` at low opacity so text always stands out. Content comes first: if a background competes with text, dim the background.

## Typography

| Role | Font | Token |
| --- | --- | --- |
| Body, metadata, code feel | JetBrains Mono | `--font-mono` |
| Big headlines | Bebas Neue, uppercase | `--font-display` |

- Fonts are self-hosted through `@fontsource`. Metadata is small (`--text-xs`) and muted.
- Headlines mix display and accent (`<span class="accent">Word</span> TITLE`). The accent (`.accent`) is bold JetBrains Mono with tight letter-spacing, smaller than the display line.
- No italic and no serif anywhere. Anything that would be "italic" uses the programming font instead.
- Section headings (`SectionHeading.astro`) are set in the accent style.

## Layout

- Sparse, generous negative space, content aligned on a grid with small labels in the corners.
- Thin 1px borders instead of filled boxes (cards, footer line, dropdown).
- Numbered section labels (`01 / Projects`).
- The navbar holds the brand, Home, a Projects dropdown, About me, then GitHub and LinkedIn icons. The same links are in the footer, both read from `src/data/site.ts`.

## Motion

Subtle, slow and precise, as if things are being constructed. Everything respects `prefers-reduced-motion` (animations and transitions are disabled globally in `global.css`, and view transitions in `motion.css`). All timings live in `src/styles/motion.css` and in the `--d` (delay, seconds) variable set on each element.

- **Page transitions:** cross-document View Transitions (pure CSS, progressive enhancement). The old page fades out (0.3s), then the new one fades in (0.5s). The navbar keeps its own transition name so it stays in place. Browsers without support navigate normally.
- **Load-in text:**
  - `.type`: characters appear one at a time, like typing. Set `--n` to the character count.
  - `.wipe`: text is drawn in from left to right in one sweep.
  - `.rise`: fade, lift and de-blur. Stagger siblings by increasing `--d`.
- **Hero order:** accent line types in, then the display line wipes in, then the intro rises.
- **Canvases** fade in slowly (2s) as the page settles.
- Animated visuals are lazy-loaded islands (`client:idle`), pause when off screen or when the tab is hidden, and draw one still frame under reduced motion.

## Decorative visuals

Each one is a separate, self-contained island that can be removed on its own. Removal is always: delete the import and the tag in the page or component, then delete the island file.

| Visual | Where | Description | Remove from |
| --- | --- | --- | --- |
| `Starfield.svelte` | Hero | Slowly drifting, twinkling stars with a faint pointer parallax. | `src/components/Hero.astro` |
| `BlochSphere.svelte` | Hero, over the starfield | Giant wireframe Bloch sphere (outline, equator, meridians, axes, labelled basis states) with a precessing state vector. Sits right of the text on wide screens, centered on narrow ones. | `src/components/Hero.astro` |
| `SglPipeline.svelte` | SGL project page, behind the story steps | Faint flow of function boxes, arrows, vertex packets and the real matrices applied to them, like a trace of the rendering pipeline. Stays fixed while scrolling. | `src/pages/projects/[slug].astro` |
| `BitGrid.svelte` | About page | Faint grid of `0`/`1` in the mono font where random bits flip constantly and briefly light up, like a view of memory. | `src/pages/about.astro` |

Notes:

- The about page has no starfield on purpose; the bit grid is its only background.
- The bit grid stays very dim at rest (about 4% opacity) so the text stands out. The `--bitgrid-extend` custom property on the wrapper in `about.astro` makes the grid grow past the page into the footer's top margin, so it reaches the footer without moving it. The wrapper's `min-height: 70dvh` sets where the footer sits; keep it.

## Rules

- Use tokens from `src/styles/tokens.css`. Add a token before adding a magic value.
- Keep contrast high and focus states visible.
- Site-wide text and links come from `src/data/site.ts`, not from components (see `content.md`).
