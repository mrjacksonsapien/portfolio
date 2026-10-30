# AGENTS.md (src/)

Folder-specific rules. General rules are in the root `AGENTS.md`.

| Folder | Purpose | Rule |
| --- | --- | --- |
| `pages/` | Routes | Thin: compose layouts and components, fetch content. |
| `layouts/` | Page shells | `BaseLayout.astro` renders the navbar and footer. |
| `components/` | Static `.astro` components | Zero client JS. |
| `islands/` | Interactive Svelte components | One concern per island, hydrated lazily with a `client:*` directive. |
| `content/` | Editable content | Schemas in `content.config.ts`. |
| `styles/` | `tokens.css`, `global.css` | Tokens first, component styles scoped in the component. |

Adding a project: create `src/content/projects/<slug>.md`. The navbar dropdown, the home overview and the `/projects/<slug>` page pick it up automatically.
