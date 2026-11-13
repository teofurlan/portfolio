import { z } from 'astro/zod';
import raw from '../../content/resume.json';
import rawEs from '../../content/resume.es.json';
import type { Lang } from '../i18n/ui';

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
      location: z
        .object({ city: z.string().optional(), region: z.string().optional(), countryCode: z.string().optional() })
        .optional(),
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
    projects: z
      .array(
        z.object({
          name: z.string(),
          description: z.string().optional(),
          roles: z.array(z.string()).default([]),
          url: z.url().optional(),
          startDate: date.optional(),
          endDate: date.optional(),
          highlights: z.array(z.string()).default([]),
          keywords: z.array(z.string()).default([]),
          /** Slug of the matching content/projects/<slug>.md, if any. */
          slug: z.string().optional(),
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

/**
 * Spanish companion (content/resume.es.json): only the human text fields, matched
 * to the English entries by position. Strict, so a stray `phone` (or any other
 * non-text field) fails the build. Facts, dates, URLs and keywords always come
 * from the English file.
 */
const text = z.string().optional();
const listOf = <T extends z.ZodRawShape>(shape: T) => z.array(z.object(shape).strict()).default([]);

export const resumeOverlaySchema = z
  .object({
    basics: z.object({ label: text, summary: text }).strict().optional(),
    work: listOf({ name: text, position: text, summary: text, highlights: z.array(z.string()).optional() }),
    projects: listOf({ name: text, description: text, roles: z.array(z.string()).optional(), highlights: z.array(z.string()).optional() }),
    education: listOf({ institution: text, area: text, studyType: text }),
    certificates: listOf({ name: text, issuer: text }),
    skills: listOf({ name: text }),
    languages: listOf({ language: text, fluency: text }),
    meta: z.object({ timeline: listOf({ title: text }) }).strict().default({ timeline: [] }),
  })
  .strict();

export type ResumeOverlay = z.infer<typeof resumeOverlaySchema>;

function overlayList<B extends object, O extends object>(name: string, base: readonly B[], over: readonly O[]): Array<B & O> {
  if (over.length !== base.length) {
    throw new Error(`resume overlay: ${name} has ${over.length} entries, English has ${base.length}`);
  }
  return base.map((b, i) => {
    const o = over[i] as Record<string, unknown>;
    for (const [key, value] of Object.entries(o)) {
      const original = (b as Record<string, unknown>)[key];
      if (Array.isArray(value) && Array.isArray(original) && value.length !== original.length) {
        throw new Error(`resume overlay: ${name}[${i}].${key} has ${value.length} items, English has ${original.length}`);
      }
    }
    return { ...b, ...Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) } as B & O;
  });
}

/** English resume with the translated text fields laid over it, validated again (no phone). */
export function localizeResume(base: Resume, overlayRaw: unknown): Resume {
  const o = resumeOverlaySchema.parse(overlayRaw);
  const merged = {
    ...base,
    basics: { ...base.basics, ...Object.fromEntries(Object.entries(o.basics ?? {}).filter(([, v]) => v !== undefined)) },
    work: overlayList('work', base.work, o.work),
    projects: overlayList('projects', base.projects, o.projects),
    education: overlayList('education', base.education, o.education),
    certificates: overlayList('certificates', base.certificates, o.certificates),
    skills: overlayList('skills', base.skills, o.skills),
    languages: overlayList('languages', base.languages, o.languages),
    meta: { ...base.meta, timeline: overlayList('meta.timeline', base.meta.timeline, o.meta.timeline) },
  };
  return resumeSchema.parse(merged);
}

export const resumes: Record<Lang, Resume> = { en: resume, es: localizeResume(resume, rawEs) };

export const getResume = (lang: Lang = 'en'): Resume => resumes[lang];
