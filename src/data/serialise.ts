import type { RankedRow, ScreenDataset, SourceStamp } from '@/data/schema.ts';
import type { RankedCandidate, ScreenResult } from '@/services/screen/types.ts';
import { SCHEMA_VERSION } from '@/data/schema.ts';

export interface SerialiseRequest {
    result: ScreenResult;
    sources: readonly SourceStamp[];
    /** How many listed operating companies existed before any filter ran. */
    universeSize: number;
    /** How far down the eligible list to publish beyond the portfolio itself. */
    eligibleDepth: number;
}

/**
 * Flattens a screen run into the file the site is built from.
 *
 * Every input of every multiple travels with it. The site's whole claim is that a reader can
 * disagree with the ranking rather than take it, and they can only do that if the numbers behind
 * a rank are in front of them.
 *
 * @param request - The run, where its inputs came from, and how much of the tail to keep.
 * @returns The dataset, ready to be written.
 */
export function toDataset(request: SerialiseRequest): ScreenDataset {
    const { result, sources, universeSize, eligibleDepth } = request;

    return {
        schemaVersion: SCHEMA_VERSION,
        builtAt: result.asOf.toISOString(),
        parameters: result.parameters,
        sources,
        universeSize,
        portfolio: result.portfolio.map(toRow),
        eligible: result.eligible.slice(0, eligibleDepth).map(toRow),
        tally: result.tally,
        excluded: [...result.excluded].sort((a, b) => a.ticker.localeCompare(b.ticker)),
    };
}

function toRow(entry: RankedCandidate): RankedRow {
    const { candidate, multiple } = entry;
    const { company, financials } = candidate;
    const enterprise = multiple.enterpriseValue;

    return {
        rank: entry.rank,
        ticker: company.primaryListing.ticker,
        tickers: company.listings.map((listing) => listing.ticker).sort((a, b) => a.localeCompare(b)),
        name: company.tradingName,
        sector: company.sector,
        cnpj: company.cnpj.toString(),
        price: company.primaryListing.price,
        medianDailyVolume: company.tradableVolume,
        marketCapitalisation: enterprise.marketCapitalisation,
        grossDebt: enterprise.grossDebt,
        cashAndEquivalents: enterprise.cashAndEquivalents,
        shortTermInvestments: enterprise.shortTermInvestments,
        netDebt: enterprise.netDebt,
        enterpriseValue: enterprise.total,
        trailingEbit: multiple.trailingEbit,
        multiple: multiple.value,
        earningsYield: multiple.earningsYield,
        netDebtToEbit: multiple.netDebtToEbit,
        earningsThrough: financials.earnings.through.closeKey,
        interimAdjusted: financials.earnings.isInterimAdjusted,
        balanceSheetAt: financials.balanceSheetAt.closeKey,
        ...(candidate.momentum === undefined ? {} : { momentum: candidate.momentum }),
    };
}
