import type { StatementKind } from '@/domain/enums/statement-kind.ts';
import { DomainError } from '@/domain/errors/domain-error.ts';

const MS_PER_DAY = 86_400_000;
const DAYS_PER_MONTH = 30.44;

export interface FiscalPeriodConfig {
    /** First day the period covers, inclusive. */
    start: Date;
    /** Last day the period covers, inclusive. */
    end: Date;
    kind: StatementKind;
}

/**
 * The window a reported figure covers.
 *
 * A CVM quarterly statement reports the year to date rather than the quarter, so the length of
 * the window is the only thing that says whether a number is three months of profit or nine.
 * Every trailing-twelve-month sum depends on reading that correctly.
 */
export class FiscalPeriod {
    public readonly start: Date;
    public readonly end: Date;
    public readonly kind: StatementKind;

    constructor(config: FiscalPeriodConfig) {
        if (config.end.getTime() < config.start.getTime()) {
            throw new DomainError('Um período fiscal não pode terminar antes de começar.');
        }

        this.start = config.start;
        this.end = config.end;
        this.kind = config.kind;
    }

    /** How many months the window covers, rounded to the nearest whole month. */
    public get months(): number {
        return Math.round((this.end.getTime() - this.start.getTime()) / MS_PER_DAY / DAYS_PER_MONTH);
    }

    /** Whether the window is a full year, which is what a trailing sum can be built on. */
    public get isFullYear(): boolean {
        return this.months >= 11 && this.months <= 13;
    }

    /**
     * How stale the figure is against the moment the screen runs.
     *
     * @param asOf - When the screen is being computed.
     */
    public monthsSinceClose(asOf: Date): number {
        return (asOf.getTime() - this.end.getTime()) / MS_PER_DAY / DAYS_PER_MONTH;
    }

    /** The close date as `YYYY-MM-DD`, which is how every source writes it. */
    public get closeKey(): string {
        return this.end.toISOString().slice(0, 10);
    }
}
