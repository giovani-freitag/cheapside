import type { Candidate } from '@/domain/entities/candidate.ts';
import type { ExclusionReason } from '@/domain/enums/exclusion-reason.ts';
import type { ExcludedCompany, RankedCandidate, ScreenRequest, ScreenResult } from '@/services/screen/types.ts';
import type { ScreenParameters } from '@/domain/rules/screen-parameters.ts';
import { EXCLUSION_REASONS } from '@/domain/enums/exclusion-reason.ts';
import { firstExclusion } from '@/domain/rules/exclusions.ts';
import { DomainError } from '@/domain/errors/domain-error.ts';

export interface ScreenServiceConfig {
    parameters: ScreenParameters;
}

/**
 * Turns a universe of companies into a ranked portfolio and a list of everything left out.
 *
 * The exclusions are a first-class output rather than a side effect. A screen that publishes
 * twenty names and says nothing about the three hundred it discarded is asking to be trusted,
 * and being trusted is exactly what a quantitative screen is supposed to make unnecessary.
 */
export class ScreenService {
    private readonly parameters: ScreenParameters;

    constructor(config: ScreenServiceConfig) {
        this.parameters = config.parameters;
    }

    /**
     * Runs the screen over a universe of companies.
     *
     * @param request - The candidates, the exclusions already decided, and the moment screened.
     * @returns The portfolio, the full eligible list, and every exclusion with its reason.
     * @throws DomainError when the parameters ask for a portfolio of no companies.
     */
    public run(request: ScreenRequest): ScreenResult {
        if (this.parameters.positions < 1) {
            throw new DomainError('Uma carteira precisa de pelo menos uma posição.');
        }

        const context = { parameters: this.parameters, asOf: request.asOf };
        const survivors: Candidate[] = [];
        const excluded: ExcludedCompany[] = [...request.preExcluded];

        for (const candidate of request.candidates) {
            const reason = firstExclusion(candidate, context);
            if (reason) excluded.push(identify(candidate, reason));
            else survivors.push(candidate);
        }

        const eligible = rankByMultiple(survivors);

        return {
            asOf: request.asOf,
            parameters: this.parameters,
            portfolio: this.selectPortfolio(eligible),
            eligible,
            excluded,
            tally: tally(excluded),
        };
    }

    /**
     * The published positions, after the optional momentum re-sort.
     *
     * With the overlay off this is simply the cheapest N. With it on, the cheapest shortlist is
     * re-sorted by twelve-month momentum and the strongest are taken — the cheap-and-still-
     * falling end of the list is where the value traps concentrate.
     */
    private selectPortfolio(eligible: readonly RankedCandidate[]): RankedCandidate[] {
        const { positions, momentumOverlay, momentumShortlist } = this.parameters;
        if (!momentumOverlay) return eligible.slice(0, positions).map(renumber);

        const shortlist = [...eligible.slice(0, momentumShortlist)];
        shortlist.sort((a, b) => (b.candidate.momentum ?? -Infinity) - (a.candidate.momentum ?? -Infinity));

        return shortlist.slice(0, positions).map(renumber);
    }
}

function identify(candidate: Candidate, reason: ExclusionReason): ExcludedCompany {
    return {
        ticker: candidate.company.primaryListing.ticker,
        name: candidate.company.tradingName,
        reason,
    };
}

function rankByMultiple(survivors: readonly Candidate[]): RankedCandidate[] {
    const valued = survivors.flatMap((candidate) => {
        const multiple = candidate.multiple;

        return multiple ? [{ candidate, multiple }] : [];
    });

    valued.sort((a, b) => a.multiple.value - b.multiple.value);

    return valued.map((entry, index) => ({ rank: index + 1, ...entry }));
}

function renumber(entry: RankedCandidate, index: number): RankedCandidate {
    return { ...entry, rank: index + 1 };
}

function tally(excluded: readonly ExcludedCompany[]): Record<ExclusionReason, number> {
    const counts = Object.fromEntries(EXCLUSION_REASONS.map((reason) => [reason, 0])) as Record<
        ExclusionReason,
        number
    >;

    for (const entry of excluded) counts[entry.reason] += 1;

    return counts;
}
