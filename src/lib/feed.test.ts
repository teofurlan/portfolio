import { describe, expect, it } from 'vitest';
import { feedItems } from './feed';

const post = (id: string, date: string, url = `https://dev.to/teo_furlan/${id}`) => ({
  id,
  data: { title: `Post ${id}`, url, date: new Date(date) },
});

describe('feedItems', () => {
  it('returns no items for no posts', () => {
    expect(feedItems([])).toEqual([]);
  });

  it('orders newest first and keeps links and titles unchanged', () => {
    const items = feedItems([post('a', '2026-10-12'), post('c', '2026-10-30'), post('b', '2026-10-19')]);
    expect(items.map((i) => i.link)).toEqual([
      'https://dev.to/teo_furlan/c',
      'https://dev.to/teo_furlan/b',
      'https://dev.to/teo_furlan/a',
    ]);
    expect(items[0]).toMatchObject({ title: 'Post c' });
    expect(items[0].pubDate).toBeInstanceOf(Date);
    expect(items[0].pubDate.toISOString().slice(0, 10)).toBe('2026-10-30');
  });

  it('does not mutate the input', () => {
    const input = [post('a', '2026-10-12'), post('b', '2026-10-19')];
    const before = input.map((p) => p.id);
    feedItems(input);
    expect(input.map((p) => p.id)).toEqual(before);
  });
});
