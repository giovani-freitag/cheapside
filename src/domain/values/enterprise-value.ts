export interface EnterpriseValueConfig {
    /** Every share class at its own last price, summed. All amounts here are BRL. */
    marketCapitalisation: number;
    /** Loans, debentures and lease financing, current and non-current, before netting. */
    grossDebt: number;
    cashAndEquivalents: number;
    shortTermInvestments: number;
}

/**
 * What it would cost to buy the whole business, components kept.
 *
 * The components survive the sum because the interface shows them: a reader who thinks the
 * screen is wrong about a company is almost always disagreeing with one of these four numbers,
 * and a bare enterprise value gives them nothing to point at.
 */
export class EnterpriseValue {
    public readonly marketCapitalisation: number;
    public readonly grossDebt: number;
    public readonly cashAndEquivalents: number;
    public readonly shortTermInvestments: number;

    constructor(config: EnterpriseValueConfig) {
        this.marketCapitalisation = config.marketCapitalisation;
        this.grossDebt = config.grossDebt;
        this.cashAndEquivalents = config.cashAndEquivalents;
        this.shortTermInvestments = config.shortTermInvestments;
    }

    /** Debt net of everything the company could repay it with today. */
    public get netDebt(): number {
        return this.grossDebt - this.cashAndEquivalents - this.shortTermInvestments;
    }

    /** Market capitalisation plus net debt: the enterprise, not the equity. */
    public get total(): number {
        return this.marketCapitalisation + this.netDebt;
    }
}
