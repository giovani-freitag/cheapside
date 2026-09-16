import type { Company } from '@/domain/entities/company.ts';
import type { Financials } from '@/domain/entities/financials.ts';
import { AcquirersMultiple } from '@/domain/values/acquirers-multiple.ts';
import { EnterpriseValue } from '@/domain/values/enterprise-value.ts';

export interface CandidateConfig {
    company: Company;
    financials: Financials;
    /**
     * Price change over the twelve months ending one month ago, as a fraction.
     *
     * The most recent month is skipped because short-horizon reversal runs the other way to
     * momentum and would cancel part of it. Absent when the price history is too short.
     */
    momentum?: number;
}

/**
 * A company paired with its filings, ready to be ranked or to be told why it will not be.
 *
 * Assembling the pair is the pipeline's job; deciding whether the pair can be valued is this
 * one's, and it answers by returning nothing rather than by returning a meaningless number.
 */
export class Candidate {
    public readonly company: Company;
    public readonly financials: Financials;
    public readonly momentum?: number;

    constructor(config: CandidateConfig) {
        this.company = config.company;
        this.financials = config.financials;
        this.momentum = config.momentum;
    }

    /** What buying the whole business would cost today. */
    public get enterpriseValue(): EnterpriseValue {
        return new EnterpriseValue({
            marketCapitalisation: this.company.marketCapitalisation,
            grossDebt: this.financials.grossDebt,
            cashAndEquivalents: this.financials.cashAndEquivalents,
            shortTermInvestments: this.financials.shortTermInvestments,
        });
    }

    /** The rank key, or nothing when operating profit will not support one. */
    public get multiple(): AcquirersMultiple | undefined {
        if (this.financials.trailingEbit <= 0) return undefined;

        return new AcquirersMultiple({
            enterpriseValue: this.enterpriseValue,
            trailingEbit: this.financials.trailingEbit,
        });
    }
}
