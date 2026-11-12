import { describe, expect, it } from 'vitest';
import { featuredProjects, listedProjects, visibleProjects } from './projects';

type Entry = { id: string; data: { status: 'featured' | 'listed' | 'hidden'; order: number } };

const entry = (id: string, status: Entry['data']['status'], order: number): Entry => ({
  id,
  data: { status, order },
});

describe('project visibility is decided by status alone', () => {
  const entries = [
    entry('socra', 'featured', 2),
    entry('mtds', 'featured', 1),
    entry('alethea', 'hidden', 0),
    entry('emprender', 'listed', 3),
  ];

  it('shows featured and listed projects, never hidden ones, ordered by order', () => {
    expect(visibleProjects(entries).map((e) => e.id)).toEqual(['mtds', 'socra', 'emprender']);
  });

  it('features only featured projects, ordered by order', () => {
    expect(featuredProjects(entries).map((e) => e.id)).toEqual(['mtds', 'socra']);
  });

  it('lists only listed projects, ordered by order', () => {
    expect(listedProjects(entries).map((e) => e.id)).toEqual(['emprender']);
    expect(listedProjects([entry('a', 'featured', 1)])).toEqual([]);
  });

  it('publishes a hidden project when only its status changes', () => {
    const promoted = entries.map((e) => (e.id === 'alethea' ? entry('alethea', 'featured', 0) : e));
    expect(featuredProjects(promoted).map((e) => e.id)).toEqual(['alethea', 'mtds', 'socra']);
  });

  it('does not mutate its input', () => {
    const before = entries.map((e) => e.id);
    visibleProjects(entries);
    expect(entries.map((e) => e.id)).toEqual(before);
  });
});
