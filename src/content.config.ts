import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

const MEDIA_KINDS = ['photo', 'render', 'diagram', 'screenshot'] as const;

/**
 * Case studies. One Markdown file per project in content/projects/<slug>.md;
 * the body holds the case study (problem, constraints, decision, result,
 * what I'd change). `status` alone publishes or hides it (src/lib/projects.ts).
 * Media paths are relative to the Markdown file, e.g.
 * ../../media/projects/<slug>/2026-05_render-cad-model_01.png
 */
const projects = defineCollection({
  loader: glob({ pattern: '*.md', base: './content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      summary: z.string(),
      status: z.enum(['featured', 'listed', 'hidden']),
      order: z.number().int(),
      role: z.string(),
      /** Team size; 1 means solo. */
      team: z.number().int().positive(),
      /** What Teo personally owned. Required so team projects never blur it. */
      ownership: z.string(),
      stack: z.array(z.string()).default([]),
      /** e.g. "hardware", "ai". Drives the automatic Hardware filter. */
      tags: z.array(z.string()).default([]),
      links: z
        .object({
          repo: z.url().optional(),
          demo: z.url().optional(),
          post: z.url().optional(),
        })
        .default({}),
      media: z
        .array(
          z.discriminatedUnion('kind', [
            z.object({
              kind: z.enum(MEDIA_KINDS),
              src: image(),
              alt: z.string(),
              caption: z.string().optional(),
            }),
            z.object({
              kind: z.literal('video'),
              /** Path under public/ or an absolute URL; videos skip the image pipeline. */
              src: z.string(),
              poster: image().optional(),
              alt: z.string(),
              caption: z.string().optional(),
            }),
          ]),
        )
        .default([]),
      year: z.number().int(),
    }),
});

/**
 * Spanish case studies, one per visible project: content/projects-es/<slug>.md
 * with the same slug as the English file. Only translated fields live here
 * (strict: status, order, tags, stack, links, media, team and year are read
 * from the English entry, never duplicated). The body is the translated case
 * study. Hidden projects have no Spanish file and no Spanish route.
 */
const projectsEs = defineCollection({
  loader: glob({ pattern: '*.md', base: './content/projects-es' }),
  schema: z
    .object({
      title: z.string(),
      summary: z.string(),
      role: z.string(),
      ownership: z.string(),
    })
    .strict(),
});

/** DEV articles for the Writing section and its RSS feed. */
const writing = defineCollection({
  loader: file('./content/writing.json'),
  schema: z.object({
    title: z.string(),
    url: z.url(),
    date: z.coerce.date(),
    summary: z.string().optional(),
    /** Project slug the post belongs to, if any (e.g. hidden projects that appear only via their post). */
    project: z.string().optional(),
  }),
});

export const collections = { projects, projectsEs, writing };
