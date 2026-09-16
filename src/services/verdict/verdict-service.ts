import type { Verdict } from '@/data/verdict.ts';

export interface VerdictServiceConfig {
    verdicts: readonly Verdict[];
}

/**
 * The readings of the filings that have been made, and nothing about the ones that have not.
 *
 * The screen is arithmetic and complete; this is prose and partial. Keeping them in separate
 * services keeps the distinction visible at the point of use: a component asking for a rank
 * always gets one, and a component asking for a verdict has to decide what to show when there
 * is none.
 */
export class VerdictService {
    private readonly byTicker: ReadonlyMap<string, Verdict>;

    constructor(config: VerdictServiceConfig) {
        this.byTicker = new Map(config.verdicts.map((verdict) => [verdict.ticker.toUpperCase(), verdict]));
    }

    /**
     * The reading for one company.
     *
     * @param ticker - The share class the rank quotes.
     * @returns The verdict, or nothing when the filings have not been read.
     */
    public forTicker(ticker: string): Verdict | undefined {
        return this.byTicker.get(ticker.toUpperCase());
    }

    /** How many of the published companies have been read. */
    public get count(): number {
        return this.byTicker.size;
    }

    /**
     * Whether a reading is still about the figures on screen.
     *
     * A verdict read against last year's filing is not wrong so much as answering a different
     * question, and the interface says which.
     *
     * @param ticker - The share class the rank quotes.
     * @param earningsThrough - Close of the window the published multiple covers.
     */
    public isCurrent(ticker: string, earningsThrough: string): boolean {
        return this.forTicker(ticker)?.earningsThrough === earningsThrough;
    }
}
