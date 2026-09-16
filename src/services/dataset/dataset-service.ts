import type { ExcludedRow, RankedRow, ScreenDataset } from '@/data/schema.ts';
import type { ExclusionReason } from '@/domain/enums/exclusion-reason.ts';
import { SCHEMA_VERSION } from '@/data/schema.ts';
import { DomainError } from '@/domain/errors/domain-error.ts';

export interface DatasetServiceConfig {
    dataset: ScreenDataset;
}

/**
 * The published screen, as the interface reads it.
 *
 * The dataset is built in CI and committed, so the site never calls an API and never holds a
 * token — which is what lets it be a static page anyone can fork. The cost is that it is a
 * photograph rather than a window, and the interface says so by putting the build time on it.
 */
export class DatasetService {
    private readonly dataset: ScreenDataset;

    constructor(config: DatasetServiceConfig) {
        if (config.dataset.schemaVersion !== SCHEMA_VERSION) {
            throw new DomainError(
                `O conjunto de dados está na versão ${String(config.dataset.schemaVersion)} e o código lê a ${String(SCHEMA_VERSION)}.`,
            );
        }

        this.dataset = config.dataset;
    }

    /** Everything the screen published, unchanged. */
    public get screen(): ScreenDataset {
        return this.dataset;
    }

    /** When the pipeline last ran. */
    public get builtAt(): Date {
        return new Date(this.dataset.builtAt);
    }

    /**
     * The eligible list past the portfolio, so a reader can see where the line fell.
     *
     * @returns Ranks above the portfolio size, cheapest first.
     */
    public get runnersUp(): readonly RankedRow[] {
        return this.dataset.eligible.slice(this.dataset.portfolio.length);
    }

    /**
     * Everything removed for one reason.
     *
     * @param reason - The filter to list.
     * @returns The companies it removed, by ticker.
     */
    public excludedBy(reason: ExclusionReason): readonly ExcludedRow[] {
        return this.dataset.excluded.filter((row) => row.reason === reason);
    }
}
