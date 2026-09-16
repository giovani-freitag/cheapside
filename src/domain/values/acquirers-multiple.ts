import type { EnterpriseValue } from '@/domain/values/enterprise-value.ts';
import { DomainError } from '@/domain/errors/domain-error.ts';

export interface AcquirersMultipleConfig {
    enterpriseValue: EnterpriseValue;
    /** Operating profit over the trailing twelve months, in BRL. Must be positive. */
    trailingEbit: number;
}

/**
 * Enterprise value over operating profit — the one number the ranking sorts on.
 *
 * It is capital-structure neutral, unlike P/E, and it charges depreciation, unlike EV/EBITDA.
 * Both of those are the reason it is here rather than either of them.
 */
export class AcquirersMultiple {
    public readonly enterpriseValue: EnterpriseValue;
    public readonly trailingEbit: number;

    constructor(config: AcquirersMultipleConfig) {
        if (config.trailingEbit <= 0) {
            throw new DomainError('O múltiplo não é definido sobre EBIT não positivo.');
        }

        this.enterpriseValue = config.enterpriseValue;
        this.trailingEbit = config.trailingEbit;
    }

    /** How many years of current operating profit the whole enterprise costs. */
    public get value(): number {
        return this.enterpriseValue.total / this.trailingEbit;
    }

    /** The same fact read the other way round, as the yield an acquirer would buy. */
    public get earningsYield(): number {
        return this.trailingEbit / this.enterpriseValue.total;
    }

    /**
     * Turns of net debt the operating profit carries.
     *
     * EBIT rather than the conventional EBITDA, because depreciation and amortisation are not a
     * standardised account in the CVM dataset and reconstructing them from the cash-flow
     * statement means matching free-text line descriptions across two thousand filers. A ratio
     * on a figure the source actually publishes beats a better ratio on one guessed at.
     */
    public get netDebtToEbit(): number {
        return this.enterpriseValue.netDebt / this.trailingEbit;
    }
}
