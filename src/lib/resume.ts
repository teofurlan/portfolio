import { z } from 'astro/zod';
import raw from '../../content/resume.json';

/**
 * Subset of the JSON Resume schema (https://jsonresume.org/schema) that the
 * site renders. content/resume.json is derived from inputs/cv/resume.tex in P1;
 * the CV is authoritative. Never add a phone number: the file is public.
 */
const date = z.string().regex(/^\d{4}(-\d{2})?(-\d{2})?$/, 'ISO date: YYYY, YYYY-MM or YYYY-MM-DD');

export const resumeSchema = z
  .object({
    // strict: unknown keys (e.g. `phone`) fail the build instead of being published.
    basics: z.object({
      name: z.string(),
      label: z.string().optional(),
      email: z.email(),
      url: z.url(),
      summary: z.string().optional(),
      location: z.object({ city: z.string().optional(), countryCode: z.string().optional() }).optional(),
      profiles: z.array(z.object({ network: z.string(), username: z.string(), url: z.url() })).default([]),
    }).strict(),
    work: z
      .array(
        z.object({
          name: z.string(),
          position: z.string(),
          url: z.url().optional(),
          startDate: date,
          endDate: date.optional(),
          summary: z.string().optional(),
          highlights: z.array(z.string()).default([]),
        }),
      )
      .default([]),
    education: z
      .array(
        z.object({
          institution: z.string(),
          area: z.string().optional(),
          studyType: z.string().optional(),
          startDate: date.optional(),
          endDate: date.optional(),
        }),
      )
      .default([]),
    /** 3–5 courses or certificates relevant to the positioning, with verification links. */
    certificates: z
      .array(z.object({ name: z.string(), issuer: z.string(), date: date.optional(), url: z.url().optional() }))
      .max(5)
      .default([]),
    skills: z.array(z.object({ name: z.string(), keywords: z.array(z.string()).default([]) })).default([]),
    languages: z.array(z.object({ language: z.string(), fluency: z.string().optional() })).default([]),
    /** Site-only extension: 4–6 milestones for the About timeline. */
    meta: z
      .object({
        timeline: z
          .array(z.object({ year: z.number().int(), title: z.string(), photo: z.string().optional() }))
          .default([]),
      })
      .default({ timeline: [] }),
  });

export type Resume = z.infer<typeof resumeSchema>;

export const resume: Resume = resumeSchema.parse(raw);
