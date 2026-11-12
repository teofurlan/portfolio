import { describe, expect, it } from 'vitest';
import { hardwareProjects, showHardwareFilter } from './hardware';

type P = { id: string; data: { status: 'featured' | 'listed' | 'hidden'; order: number; tags: string[] } };
const p = (id: string, status: P['data']['status'], tags: string[], order = 1): P => ({ id, data: { status, order, tags } });

describe('showHardwareFilter', () => {
  it('is false with no hardware projects', () => {
    expect(showHardwareFilter([p('socra', 'featured', ['ai'])])).toBe(false);
  });

  it('is false with one hardware project (today: mtds only)', () => {
    expect(showHardwareFilter([p('socra', 'featured', ['ai']), p('mtds', 'featured', ['hardware', 'robotics'])])).toBe(false);
  });

  it('is true with two visible hardware projects', () => {
    expect(showHardwareFilter([p('mtds', 'featured', ['hardware']), p('arm2', 'listed', ['hardware'])])).toBe(true);
  });

  it('does not count hidden hardware projects', () => {
    expect(showHardwareFilter([p('mtds', 'featured', ['hardware']), p('secret', 'hidden', ['hardware'])])).toBe(false);
  });

  it('lists visible hardware projects in order without mutating input', () => {
    const input = [p('b', 'listed', ['hardware'], 2), p('a', 'featured', ['hardware'], 1), p('h', 'hidden', ['hardware'], 0)];
    const copy = structuredClone(input);
    expect(hardwareProjects(input).map((x) => x.id)).toEqual(['a', 'b']);
    expect(input).toEqual(copy);
  });
});
