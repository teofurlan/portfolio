import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { site } from '../data/site';
import { feedItems } from '../lib/feed';

export async function GET(context: APIContext) {
  return rss({
    title: `${site.name}: writing`,
    description: 'Posts by Teo Furlan on DEV: software with AI agents, and hardware.',
    site: context.site ?? site.url,
    items: feedItems(await getCollection('writing')),
  });
}
