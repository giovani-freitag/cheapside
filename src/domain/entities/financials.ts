import type { FiscalPeriod } from '@/domain/values/fiscal-period.ts';
import type { TrailingEarnings } from '@/domain/values/trailing-earnings.ts';

export interface FinancialsConfig {
    /** The window the balance-sheet figures were struck on. */
    balanceSheetAt: FiscalPeriod;
    earnings: TrailingEarnings;
    cashAndEquivalents: number;
    shortTermInvestments: number;
    /** Loans, debentures and lease financing, current plus non-current. */
    grossDebt: number;
    shareholdersEquity: number;
    totalAssets: number;
    /**
     * Whether the filings behind this carried account 3.05 at all.
     *
     * Banks and insurers do not: their income statement starts at financial intermediation
     * revenue and never reaches an operating profit line.
     */
    hasOperatingResultLine: boolean;
}

/**
 * Everything the screen reads off a company's filings.
 *
 * Amounts are BRL at full scale — the CVM publishes most of them in thousands, and the
 * conversion happens once, at the parser, so nothing downstream has to remember.
 */
export class Financials {
    public readonly balanceSheetAt: FiscalPeriod;
    public readonly earnings: TrailingEarnings;
    public readonly cashAndEquivalents: number;
    public readonly shortTermInvestments: number;
    public readonly grossDebt: number;
    public readonly shareholdersEquity: number;
    public readonly totalAssets: number;
    public readonly hasOperatingResultLine: boolean;

    constructor(config: FinancialsConfig) {
        this.balanceSheetAt = config.balanceSheetAt;
        this.earnings = config.earnings;
        this.cashAndEquivalents = config.cashAndEquivalents;
        this.shortTermInvestments = config.shortTermInvestments;
        this.grossDebt = config.grossDebt;
        this.shareholdersEquity = config.shareholdersEquity;
        this.totalAssets = config.totalAssets;
        this.hasOperatingResultLine = config.hasOperatingResultLine;
    }

    /** Trailing operating profit, the denominator of the rank. */
    public get trailingEbit(): number {
        return this.earnings.ebit;
    }

    /** Trailing bottom line. Context only — nothing is ranked on it. */
    public get trailingNetIncome(): number | undefined {
        return this.earnings.netIncome;
    }
}
