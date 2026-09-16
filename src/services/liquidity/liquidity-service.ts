import type { LiquidityHistory, LiquidityObservation, TypicalTurnover } from '@/services/liquidity/types.ts';

export interface LiquidityServiceConfig {
    /** What has been recorded so far, oldest observation first. */
    history: LiquidityHistory;
    /** How many observations to keep. Older ones fall off the back. */
    window: number;
}

/**
 * How much of a share class trades on a typical session, built up one run at a time.
 *
 * The strategy asks for a median over sixty sessions and the free quote source publishes one
 * day. Rather than pretend a single session is a median, the pipeline keeps the sessions it has
 * seen and takes the median of those — thin at first, and honest about being thin, because each
 * figure carries the number of observations behind it.
 *
 * The median, not the mean: one block trade should not qualify a stock for a month.
 */
export class LiquidityService {
    private readonly history: LiquidityHistory;
    private readonly window: number;

    constructor(config: LiquidityServiceConfig) {
        this.history = config.history;
        this.window = config.window;
    }

    /**
     * Adds a session's turnover to the record.
     *
     * A session already recorded is replaced rather than repeated, so re-running the pipeline on
     * the same day does not let one session outvote the others.
     *
     * @param observation - Traded value per ticker on one session.
     * @returns The history with the observation folded in and the window trimmed.
     */
    public observe(observation: LiquidityObservation): LiquidityHistory {
        const kept = this.history.observations.filter((existing) => existing.on !== observation.on);

        return { observations: [...kept, observation].slice(-this.window) };
    }

    /**
     * What a share class trades on a typical session.
     *
     * @param ticker - The share class to measure.
     * @returns The median traded value and how many sessions it was taken over.
     */
    public typical(ticker: string): TypicalTurnover {
        const values = this.history.observations
            .map((observation) => observation.tradedValue[ticker])
            .filter((value): value is number => typeof value === 'number');

        return { value: median(values), observations: values.length };
    }
}

function median(values: readonly number[]): number {
    if (values.length === 0) return 0;

    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 1) return sorted[middle] ?? 0;

    return ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2;
}
