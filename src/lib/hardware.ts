/**
 * Hardware filter rule (BRIEF): a "Hardware" filter appears automatically
 * once two or more visible projects carry the `hardware` tag.
 */
import { type ProjectStatus, visibleProjects } from './projects';

type Tagged = { data: { status: ProjectStatus; order: number; tags: string[] } };

export const HARDWARE_TAG = 'hardware';
export const HARDWARE_FILTER_MIN = 2;

export function hardwareProjects<T extends Tagged>(entries: readonly T[]): T[] {
  return visibleProjects(entries).filter((e) => e.data.tags.includes(HARDWARE_TAG));
}

export function showHardwareFilter<T extends Tagged>(entries: readonly T[]): boolean {
  return hardwareProjects(entries).length >= HARDWARE_FILTER_MIN;
}
