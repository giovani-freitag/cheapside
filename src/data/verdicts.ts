import type { Verdict } from '@/data/verdict.ts';

/**
 * Every reading of the filings committed to the repository.
 *
 * They are loaded at build time rather than fetched, so a fork with no verdicts ships a site
 * that works and says nothing, and a fork with fifty ships the same site with fifty readings in
 * it. Adding one is adding a file.
 */
const modules = import.meta.glob<{ default: Verdict }>('./verdicts/*.json', { eager: true });

export const VERDICTS: readonly Verdict[] = Object.values(modules).map((module) => module.default);
