import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

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
          link: z.object({ label: z.string(), href: z.url() }).optional(),
        }),
      )
      .default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { projects };
