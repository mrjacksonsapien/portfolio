import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// A picture is referenced without size suffix or extension: `/images/x/name` resolves to `name-960.webp` and `name-1920.webp`.
const image = z.object({ src: z.string(), alt: z.string(), caption: z.string().optional() });

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
    // Showcase layout: banner image path (full-bleed, fades to black) and the gallery shown after the story.
    banner: z.string().optional(),
    gallery: z.array(image).default([]),
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
          animation: z.enum(['regions', 'serializer']).optional(),
          link: z.object({ label: z.string(), href: z.url() }).optional(),
        }),
      )
      .default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { projects };
