import { FiscalPeriod } from '@/domain/values/fiscal-period.ts';
import { DomainError } from '@/domain/errors/domain-error.ts';

/** One reported figure and the window it covers. */
export interface ReportedFigure {
    period: FiscalPeriod;
    /** Operating profit for the window, in BRL. */
    ebit: number;
}

export interface TrailingEarningsConfig {
    /** The most recent closed financial year. */
    annual: ReportedFigure;
    /** The current year to date, when a quarterly filing is newer than the annual one. */
    currentToDate?: ReportedFigure;
    /** The same months of the previous year, as the same quarterly filing reports them. */
    priorToDate?: ReportedFigure;
}

/**
 * Twelve months of operating profit, assembled from filings that never report twelve months.
 *
 * A CVM quarterly statement reports the year to date, not the quarter, and carries the previous
 * year's matching window beside it. That comparative is what makes the arithmetic possible: the
 * closed year, minus the part of it already superseded, plus the part of this year that replaced
 * it. Using the closed year alone instead would leave the multiple reading a figure up to
 * fifteen months old, which on a cyclical is the difference between cheap and expensive.
 */
export class TrailingEarnings {
    public readonly ebit: number;
    public readonly through: FiscalPeriod;
    /** Whether a quarterly filing contributed, or the figure is simply the last closed year. */
    public readonly isInterimAdjusted: boolean;

    constructor(config: TrailingEarningsConfig) {
        if (!config.annual.period.isFullYear) {
            throw new DomainError('A base de um cálculo de doze meses precisa ser um exercício completo.');
        }

        const interim = readInterim(config);
        if (!interim) {
            this.ebit = config.annual.ebit;
            this.through = config.annual.period;
            this.isInterimAdjusted = false;

            return;
        }

        this.ebit = config.annual.ebit - interim.prior.ebit + interim.current.ebit;
        this.through = new FiscalPeriod({
            start: shiftYears(interim.current.period.end, -1),
            end: interim.current.period.end,
            kind: 'quarterly',
        });
        this.isInterimAdjusted = true;
    }
}

/**
 * The quarterly pair, once it has been checked for the assumptions the subtraction rests on.
 *
 * A pair that does not line up is discarded rather than repaired: falling back to the closed
 * year gives a figure that is merely old, while subtracting mismatched windows gives one that is
 * wrong, and only the second kind is invisible downstream.
 */
function readInterim(config: TrailingEarningsConfig): { current: ReportedFigure; prior: ReportedFigure } | undefined {
    const { annual, currentToDate, priorToDate } = config;
    if (!currentToDate || !priorToDate) return undefined;

    const sameWindow = currentToDate.period.months === priorToDate.period.months;
    const newerThanAnnual = currentToDate.period.end.getTime() > annual.period.end.getTime();
    const comparativeMatchesAnnual = priorToDate.period.end.getTime() <= annual.period.end.getTime();

    if (!sameWindow || !newerThanAnnual || !comparativeMatchesAnnual) return undefined;
    if (currentToDate.period.isFullYear) return undefined;

    return { current: currentToDate, prior: priorToDate };
}

function shiftYears(date: Date, years: number): Date {
    const shifted = new Date(date.getTime());
    shifted.setUTCFullYear(shifted.getUTCFullYear() + years);

    return shifted;
}
