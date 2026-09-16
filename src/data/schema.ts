import type { ExclusionReason } from '@/domain/enums/exclusion-reason.ts';
import type { ScreenParameters } from '@/domain/rules/screen-parameters.ts';

/** Bumped when a field changes meaning, so a stale dataset fails loudly instead of quietly. */
export const SCHEMA_VERSION = 1;

/** Where one of the inputs came from and when, so a wrong number can be traced to a source. */
export interface SourceStamp {
    name: string;
    url: string;
    /** When this source was read, ISO 8601. */
    retrievedAt: string;
    /** What was taken from it, in one line. */
    provides: string;
}

/** One company in the ranking, with every input the multiple was built from. */
export interface RankedRow {
    rank: number;
    /** The most liquid share class, which is the one a position would be taken in. */
    ticker: string;
    /** Every class listed, including the primary one. */
    tickers: readonly string[];
    name: string;
    sector: string;
    cnpj: string;
    price: number;
    medianDailyVolume: number;
    marketCapitalisation: number;
    grossDebt: number;
    cashAndEquivalents: number;
    shortTermInvestments: number;
    netDebt: number;
    enterpriseValue: number;
    trailingEbit: number;
    /** EV/EBIT — the rank key. */
    multiple: number;
    earningsYield: number;
    netDebtToEbit: number;
    /** Close of the twelve-month window the EBIT covers, `YYYY-MM-DD`. */
    earningsThrough: string;
    /** Whether a quarterly filing contributed, or the figure is the last closed year alone. */
    interimAdjusted: boolean;
    /** Close of the balance sheet the debt and cash were read from, `YYYY-MM-DD`. */
    balanceSheetAt: string;
    momentum?: number;
}

/** One company the screen removed, compactly enough to list all of them. */
export interface ExcludedRow {
    ticker: string;
    name: string;
    reason: ExclusionReason;
}

/** The whole published screen, as it is committed to the repository. */
export interface ScreenDataset {
    schemaVersion: number;
    /** When the pipeline ran, ISO 8601. */
    builtAt: string;
    parameters: ScreenParameters;
    sources: readonly SourceStamp[];
    /** How many companies B3 listed before any filter ran. */
    universeSize: number;
    portfolio: readonly RankedRow[];
    /** Everything that survived the filters, cheapest first — the portfolio is its head. */
    eligible: readonly RankedRow[];
    tally: Readonly<Record<ExclusionReason, number>>;
    excluded: readonly ExcludedRow[];
}
