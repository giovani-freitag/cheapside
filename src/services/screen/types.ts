import type { Candidate } from '@/domain/entities/candidate.ts';
import type { ExclusionReason } from '@/domain/enums/exclusion-reason.ts';
import type { AcquirersMultiple } from '@/domain/values/acquirers-multiple.ts';
import type { ScreenParameters } from '@/domain/rules/screen-parameters.ts';

/** One company that reached the ranking, with the number that put it there. */
export interface RankedCandidate {
    /** Position in the list, starting at 1. */
    rank: number;
    candidate: Candidate;
    multiple: AcquirersMultiple;
}

/**
 * One company that did not reach it, and why.
 *
 * Identity rather than the whole candidate, because some exclusions are decided before a
 * candidate can be assembled at all — a company with no filings has nothing to assemble from.
 */
export interface ExcludedCompany {
    ticker: string;
    name: string;
    reason: ExclusionReason;
}

export interface ScreenRequest {
    /** Every operating company that could be valued, in any order. */
    candidates: readonly Candidate[];
    /** Companies removed before they could be valued, with the reason already decided. */
    preExcluded: readonly ExcludedCompany[];
    /** The moment being screened, which staleness is measured against. */
    asOf: Date;
}

/** Everything one run of the screen decided. */
export interface ScreenResult {
    asOf: Date;
    parameters: ScreenParameters;
    /** The published portfolio, cheapest first. */
    portfolio: readonly RankedCandidate[];
    /** Everything that survived the filters, cheapest first — the portfolio is its head. */
    eligible: readonly RankedCandidate[];
    excluded: readonly ExcludedCompany[];
    /** How many companies fell to each reason. */
    tally: Readonly<Record<ExclusionReason, number>>;
}
