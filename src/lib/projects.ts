/**
 * Project visibility rules. A project's `status` frontmatter field is the only
 * switch: `featured` (home + detail page), `listed` (detail page + list),
 * `hidden` (not built at all).
 */
export type ProjectStatus = 'featured' | 'listed' | 'hidden';

type HasStatus = { data: { status: ProjectStatus; order: number } };

const byOrder = <T extends HasStatus>(a: T, b: T) => a.data.order - b.data.order;

export function visibleProjects<T extends HasStatus>(entries: readonly T[]): T[] {
  return entries.filter((e) => e.data.status !== 'hidden').sort(byOrder);
}

export function featuredProjects<T extends HasStatus>(entries: readonly T[]): T[] {
  return entries.filter((e) => e.data.status === 'featured').sort(byOrder);
}
