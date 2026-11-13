/** Maps DEV posts (content/writing.json) to RSS items, newest first. */
type Post = { data: { title: string; url: string; date: Date; summary?: string } };

export type FeedItem = { title: string; link: string; pubDate: Date; description?: string };

export function feedItems(posts: readonly Post[]): FeedItem[] {
  return [...posts]
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime())
    .map((p) => ({
      title: p.data.title,
      link: p.data.url,
      pubDate: p.data.date,
      ...(p.data.summary ? { description: p.data.summary } : {}),
    }));
}
