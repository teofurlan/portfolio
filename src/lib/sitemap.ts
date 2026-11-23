import { staticRoutes } from '../i18n/routes';

const escapeXml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

/** Bilingual XML sitemap covering every static route and every visible project case study. */
export function sitemapXml(siteUrl: string, projectSlugs: readonly string[]): string {
  const base = siteUrl.replace(/\/+$/, '');
  const pairs: Array<[en: string, es: string]> = [
    ...Object.entries(staticRoutes),
    ...projectSlugs.map((slug): [string, string] => [`/projects/${slug}/`, `/es/proyectos/${slug}/`]),
  ];
  const seen = new Set<string>();
  const urls: string[] = [];

  for (const [enPath, esPath] of pairs) {
    const enHref = escapeXml(`${base}${enPath}`);
    const esHref = escapeXml(`${base}${esPath}`);
    const alternates =
      `<xhtml:link rel="alternate" hreflang="en" href="${enHref}"/>` +
      `<xhtml:link rel="alternate" hreflang="es" href="${esHref}"/>` +
      `<xhtml:link rel="alternate" hreflang="x-default" href="${enHref}"/>`;
    for (const loc of [enHref, esHref]) {
      if (seen.has(loc)) continue;
      seen.add(loc);
      urls.push(`  <url><loc>${loc}</loc>${alternates}</url>`);
    }
  }

  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
    `${urls.join('\n')}\n` +
    `</urlset>\n`
  );
}
