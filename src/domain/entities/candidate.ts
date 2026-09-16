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

    /**
     * Price against the bottom line, shown beside the rank and never used to produce it.
     *
     * It answers a different question from the rank — how the *equity* is priced rather than the
     * enterprise — and the gap between the two is informative: a company cheap on one and dear on
     * the other is telling you where its debt is. Undefined on a loss, where the ratio is noise.
     */
    public get priceToEarnings(): number | undefined {
        const netIncome = this.financials.trailingNetIncome;
        if (netIncome === undefined || netIncome <= 0) return undefined;

        return this.company.marketCapitalisation / netIncome;
    }

    /** Price against book equity, on the same terms: context beside the rank, never inside it. */
    public get priceToBook(): number | undefined {
        const equity = this.financials.shareholdersEquity;
        if (equity <= 0) return undefined;

        return this.company.marketCapitalisation / equity;
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
