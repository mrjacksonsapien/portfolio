import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// A picture is referenced without size suffix or extension: `/images/x/name` resolves to `name-960.webp` and `name-1920.webp`.
// `orientation: portrait` is for phone-style pictures (3:4 or taller); they are shown narrower than landscape ones.
const image = z.object({
  src: z.string(),
  alt: z.string(),
  caption: z.string().optional(),
  orientation: z.enum(['landscape', 'portrait']).default('landscape'),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    year: z.number(),
    tags: z.array(z.string()).default([]),
    order: z.number().default(0),
    cover: z.string().optional(),
    repoUrl: z.url().optional(),
    liveUrl: z.url().optional(),
    robloxUrl: z.url().optional(),
    // 'showcase' renders the picture-led page (banner, tilted photos, lightbox, bubbles); see docs/architecture.md.
    layout: z.enum(['default', 'showcase']).default('default'),
    // Showcase layout: the decorative canvas fixed behind the page.
    background: z.enum(['bubbles', 'circuit']).default('bubbles'),
    // Showcase layout: banner image path (full-bleed, fades to black) and the gallery shown after the story.
    banner: z.string().optional(),
    gallery: z.array(image).default([]),
    galleryTitle: z.string().default('Gallery'),
    demo: z.enum(['sgl']).optional(),
    // Short notes shown in the demo's info popover (what was changed in the engine for the embedded render).
    demoNotes: z.array(z.string()).default([]),
    // Optional illustrated walkthrough shown after the body, one zigzag row per step.
    story: z
      .array(
        z.object({
          title: z.string(),
          body: z.string(),
          visual: z.enum(['mesh', 'transform', 'culling', 'projection', 'clipping', 'raster']).optional(),
          visualLabel: z.string().optional(),
          // Showcase layout: pictures and/or a small animation shown next to the text.
          images: z.array(image).default([]),
          animation: z.enum(['regions', 'serializer', 'shift-register', 'matrix-scan', 'captive-portal']).optional(),
          // Showcase layout: a YouTube video (id from the URL) that loads on click; `poster` is a local picture path like the gallery's `src`.
          video: z.object({ id: z.string(), title: z.string(), poster: z.string().optional() }).optional(),
          link: z.object({ label: z.string(), href: z.url() }).optional(),
        }),
      )
      .default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { projects };
