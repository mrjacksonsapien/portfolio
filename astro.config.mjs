import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';

// Static output: Cloudflare Pages serves the `dist/` folder as-is.
export default defineConfig({
  output: 'static',
  integrations: [svelte()],
});
