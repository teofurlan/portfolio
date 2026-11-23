import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { site } from '../data/site';
import { visibleProjects } from '../lib/projects';
import { sitemapXml } from '../lib/sitemap';

export async function GET(context: APIContext) {
  const slugs = visibleProjects(await getCollection('projects')).map((p) => p.id);
  const base = (context.site ?? new URL(site.url)).toString();
  return new Response(sitemapXml(base, slugs), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
