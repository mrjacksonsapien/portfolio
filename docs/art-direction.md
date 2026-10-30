# Art direction

Inspiration: `docs/inspiration/` (dark space scene, sparse monospace metadata, large condensed display type mixed with an italic serif accent, one luminous focal object).

## Vibe

Digital, programming and math, set in space. Quiet, precise and minimal, with a single point of visual interest.

## Color

- Background: pure black (`--color-bg`).
- Text: white (`--color-fg`), with muted and faint variants for secondary text, and hairline borders (`--color-line`).
- No other colors in the UI. Color comes only from focal visuals (e.g. a glowing orb or starfield).

## Typography

| Role | Font | Token |
| --- | --- | --- |
| Body, metadata, code feel | JetBrains Mono | `--font-mono` |
| Big headlines | Bebas Neue, uppercase | `--font-display` |
| Accent words | Instrument Serif italic | `--font-accent` |

Fonts are self-hosted through `@fontsource`. Metadata is small (`--text-xs`) and muted. Headlines mix display and accent (`<span class="accent">Word</span> TITLE`).

## Layout

- Sparse, generous negative space, content aligned on a grid with small labels in the corners.
- Thin 1px borders instead of filled boxes.
- Numbered section labels (`01 / Projects`).

## Motion

Subtle and slow. Interactive and animated visuals are lazy-loaded islands. Respect `prefers-reduced-motion` (already disabled globally in `global.css`).

## Rules

- Use tokens from `src/styles/tokens.css`. Add a token before adding a magic value.
- Keep contrast high and focus states visible.
