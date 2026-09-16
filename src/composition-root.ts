import type { ScreenDataset } from '@/data/schema.ts';
import { DatasetService } from '@/services/dataset/dataset-service.ts';
import { ThemeService } from '@/services/theme/theme-service.ts';
import { VerdictService } from '@/services/verdict/verdict-service.ts';
import { VERDICTS } from '@/data/verdicts.ts';
import screen from '@/data/generated/screen.json';

export interface Services {
    dataset: DatasetService;
    theme: ThemeService;
    verdicts: VerdictService;
}

/**
 * Builds the services the interface talks to.
 *
 * Both datasets are bundled rather than fetched: the whole site is one screen over data that
 * changed at build time, and a loading state in front of a table that is already in the bundle
 * would be a fiction. The theme is the only service that touches the document, and it is handed
 * the pieces it touches rather than reaching for them.
 */
export function createServices(): Services {
    return {
        dataset: new DatasetService({ dataset: screen as ScreenDataset }),
        theme: new ThemeService({
            storage: window.localStorage,
            root: document.documentElement,
            darkQuery: window.matchMedia('(prefers-color-scheme: dark)'),
        }),
        verdicts: new VerdictService({ verdicts: VERDICTS }),
    };
}
