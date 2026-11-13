/** Project data per language: English entries with the Spanish translated fields laid over them. */
import { getCollection, type CollectionEntry } from 'astro:content';
import type { Lang } from '../../i18n/ui';
import { mergeProject } from '../../lib/i18n-content';
import { visibleProjects } from '../../lib/projects';

export type Project = CollectionEntry<'projects'>;

/** All projects (hidden included) in `lang`; hidden ones are never translated. */
export async function getProjects(lang: Lang): Promise<Project[]> {
  const all = await getCollection('projects');
  if (lang === 'en') return all;
  const es = await getCollection('projectsEs');
  return all.map((p) => {
    const tr = es.find((e) => e.id === p.id);
    if (!tr) {
      if (p.data.status !== 'hidden') throw new Error(`Missing Spanish case study content/projects-es/${p.id}.md`);
      return p;
    }
    return mergeProject(p, tr);
  });
}

/** The entry that holds the Markdown body to render for `slug` in `lang`. */
export async function getBodyEntry(lang: Lang, slug: string) {
  const entry =
    lang === 'es'
      ? (await getCollection('projectsEs')).find((e) => e.id === slug)
      : (await getCollection('projects')).find((e) => e.id === slug);
  if (!entry) throw new Error(`No ${lang} case study for ${slug}`);
  return entry;
}

export async function getVisibleSlugs(lang: Lang): Promise<string[]> {
  return visibleProjects(await getProjects(lang)).map((p) => p.id);
}
