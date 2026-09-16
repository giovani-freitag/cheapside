import type { Candidate } from '@/domain/entities/candidate.ts';
import type { ExclusionReason } from '@/domain/enums/exclusion-reason.ts';
import type { ScreenParameters } from '@/domain/rules/screen-parameters.ts';
import { RANKABLE_ISSUER_STATUSES } from '@/domain/enums/issuer-status.ts';

export interface ExclusionContext {
    parameters: ScreenParameters;
    /** The moment the screen is being computed, which is what staleness is measured against. */
    asOf: Date;
}

export interface ExclusionRule {
    reason: ExclusionReason;
    excludes(candidate: Candidate, context: ExclusionContext): boolean;
}

/**
 * The filters, in the order they are applied.
 *
 * Order is not cosmetic: a company is reported under the first reason that removes it, so the
 * most fundamental explanation comes first. A bank in judicial recovery is reported as a bank,
 * because that is the reason the screen could never have ranked it either way.
 */
export const EXCLUSION_RULES: readonly ExclusionRule[] = [
    {
        reason: 'financial-statement-shape',
        excludes: (candidate) => !candidate.financials.hasOperatingResultLine,
    },
    {
        reason: 'issuer-not-in-good-standing',
        excludes: (candidate) => !RANKABLE_ISSUER_STATUSES.has(candidate.company.status),
    },
    {
        reason: 'no-recent-statement',
        excludes: (candidate, context) =>
            candidate.financials.balanceSheetAt.monthsSinceClose(context.asOf) > context.parameters.stalenessCap,
    },
    {
        reason: 'no-operating-profit',
        excludes: (candidate) => candidate.multiple === undefined,
    },
    {
        reason: 'illiquid',
        excludes: (candidate, context) => candidate.company.tradableVolume < context.parameters.liquidityFloor,
    },
    {
        reason: 'over-leveraged',
        excludes: (candidate, context) => {
            const multiple = candidate.multiple;
            if (!multiple) return false;

            // Net cash passes whatever the cap is: there is no leverage to be wrong about.
            if (multiple.enterpriseValue.netDebt <= 0) return false;

            return multiple.netDebtToEbit > context.parameters.netDebtToEbitCap;
        },
    },
];

/**
 * The first rule that removes a candidate, or nothing when it survives all of them.
 *
 * @param candidate - The company and its filings.
 * @param context - The thresholds in force and the moment being screened.
 * @returns The reason it was removed, or undefined when it reaches the ranking.
 */
export function firstExclusion(candidate: Candidate, context: ExclusionContext): ExclusionReason | undefined {
    return EXCLUSION_RULES.find((rule) => rule.excludes(candidate, context))?.reason;
}
