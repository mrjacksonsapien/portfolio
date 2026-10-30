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
    draft: z.boolean().default(false),
  }),
});

export const collections = { projects };
