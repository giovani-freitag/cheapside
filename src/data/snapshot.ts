import type { IssuerStatus } from '@/domain/enums/issuer-status.ts';
import type { ReportedFigure } from '@/domain/values/trailing-earnings.ts';
import type { SourceStamp } from '@/data/schema.ts';
import type { StatementKind } from '@/domain/enums/statement-kind.ts';
import type { Universe } from '@/services/universe/universe-service.ts';
import { Candidate } from '@/domain/entities/candidate.ts';
import { Cnpj } from '@/domain/values/cnpj.ts';
import { Company } from '@/domain/entities/company.ts';
import { Financials } from '@/domain/entities/financials.ts';
import { FiscalPeriod } from '@/domain/values/fiscal-period.ts';
import { Listing } from '@/domain/entities/listing.ts';
import { asExclusion } from '@/services/universe/universe-service.ts';
import { TrailingEarnings } from '@/domain/values/trailing-earnings.ts';

/** Bumped when a field changes meaning, so a stale capture fails loudly instead of quietly. */
export const SNAPSHOT_VERSION = 1;

/** One reported window, with its dates written the way JSON can carry them. */
export interface SnapshotFigure {
    start: string;
    end: string;
    kind: StatementKind;
    ebit: number;
    netIncome?: number;
}

export interface SnapshotFinancials {
    balanceSheetAt: string;
    annual: SnapshotFigure;
    currentToDate?: SnapshotFigure;
    priorToDate?: SnapshotFigure;
    cashAndEquivalents: number;
    shortTermInvestments: number;
    grossDebt: number;
    shareholdersEquity: number;
    totalAssets: number;
    hasOperatingResultLine: boolean;
}

export interface SnapshotListing {
    ticker: string;
    price: number;
    typicalTradedValue: number;
    observations: number;
}

export interface SnapshotCompany {
    /** The full fourteen digits. Only its root was used to join the sources. */
    cnpj: string;
    cvmCode: string;
    legalName: string;
    tradingName: string;
    sector: string;
    status: IssuerStatus;
    marketCapitalisation: number;
    listings: readonly SnapshotListing[];
    /** Absent for a company with no filings the screen could read. */
    financials?: SnapshotFinancials;
}

/**
 * Every input the screen reads, joined and normalised, before a single filter has run.
 *
 * This is the expensive half of the pipeline frozen to a file: three sources, two hundred
 * megabytes of archives, and a join on three keys that do not match. Keeping it means a change of
 * threshold, a new filter, or a different portfolio size is a second of arithmetic instead of
 * another round trip to a public service that owes this project nothing.
 *
 * It is committed rather than cached, because it is also the record of what the sources said on
 * the day — a screen that is reproducible only while the upstream data is unchanged is not
 * reproducible.
 */
export interface MarketSnapshot {
    snapshotVersion: number;
    /** When the sources were read, ISO 8601. */
    capturedAt: string;
    sources: readonly SourceStamp[];
    companies: readonly SnapshotCompany[];
}

/**
 * Freezes an assembled universe into the file the screen is recomputed from.
 *
 * @param universe - Everything the join produced, candidates and unusable alike.
 * @param meta - When the sources were read and which they were.
 * @returns The snapshot, ready to be written.
 */
export function toSnapshot(
    universe: Universe,
    meta: { capturedAt: string; sources: readonly SourceStamp[] },
): MarketSnapshot {
    const ranked = universe.candidates.map((candidate) => fromCompany(candidate.company, candidate.financials));
    const rest = universe.unreadable.map((company) => fromCompany(company));

    return {
        snapshotVersion: SNAPSHOT_VERSION,
        capturedAt: meta.capturedAt,
        sources: meta.sources,
        companies: [...ranked, ...rest].sort((a, b) => a.cnpj.localeCompare(b.cnpj)),
    };
}

/**
 * Rebuilds the universe from a snapshot, with no network and no parsing.
 *
 * A company without filings comes back as an exclusion rather than a candidate, exactly as it
 * would have on the day — the reason is derived here rather than stored, so it cannot drift away
 * from the rule that produces it.
 *
 * @param snapshot - A capture written by `toSnapshot`.
 * @returns The candidates, the companies that could not become one, and the universe size.
 */
export function fromSnapshot(snapshot: MarketSnapshot): Universe {
    const candidates: Candidate[] = [];
    const unreadable: Company[] = [];

    for (const record of snapshot.companies) {
        const company = toCompany(record);

        if (record.financials) {
            candidates.push(new Candidate({ company, financials: toFinancials(record.financials) }));
        } else {
            unreadable.push(company);
        }
    }

    return {
        candidates,
        unreadable,
        preExcluded: unreadable.map(asExclusion),
        size: snapshot.companies.length,
    };
}

function fromCompany(company: Company, financials?: Financials): SnapshotCompany {
    return {
        cnpj: company.cnpj.key,
        cvmCode: company.cvmCode,
        legalName: company.legalName,
        tradingName: company.tradingName,
        sector: company.sector,
        status: company.status,
        marketCapitalisation: company.marketCapitalisation,
        listings: company.listings.map((listing) => ({
            ticker: listing.ticker,
            price: listing.price,
            typicalTradedValue: listing.typicalTradedValue,
            observations: listing.observations,
        })),
        ...(financials ? { financials: fromFinancials(financials) } : {}),
    };
}

function fromFinancials(financials: Financials): SnapshotFinancials {
    const source = financials.earnings.source;

    return {
        balanceSheetAt: financials.balanceSheetAt.closeKey,
        annual: fromFigure(source.annual),
        ...(source.currentToDate ? { currentToDate: fromFigure(source.currentToDate) } : {}),
        ...(source.priorToDate ? { priorToDate: fromFigure(source.priorToDate) } : {}),
        cashAndEquivalents: financials.cashAndEquivalents,
        shortTermInvestments: financials.shortTermInvestments,
        grossDebt: financials.grossDebt,
        shareholdersEquity: financials.shareholdersEquity,
        totalAssets: financials.totalAssets,
        hasOperatingResultLine: financials.hasOperatingResultLine,
    };
}

function fromFigure(figure: ReportedFigure): SnapshotFigure {
    return {
        start: figure.period.start.toISOString().slice(0, 10),
        end: figure.period.end.toISOString().slice(0, 10),
        kind: figure.period.kind,
        ebit: figure.ebit,
        ...(figure.netIncome === undefined ? {} : { netIncome: figure.netIncome }),
    };
}

function toCompany(record: SnapshotCompany): Company {
    return new Company({
        cnpj: Cnpj.parse(record.cnpj),
        cvmCode: record.cvmCode,
        legalName: record.legalName,
        tradingName: record.tradingName,
        sector: record.sector,
        status: record.status,
        marketCapitalisation: record.marketCapitalisation,
        listings: record.listings.map((listing) => new Listing(listing)),
    });
}

function toFinancials(record: SnapshotFinancials): Financials {
    const close = parseDay(record.balanceSheetAt);

    return new Financials({
        balanceSheetAt: new FiscalPeriod({ start: close, end: close, kind: 'quarterly' }),
        earnings: new TrailingEarnings({
            annual: toFigure(record.annual),
            ...(record.currentToDate ? { currentToDate: toFigure(record.currentToDate) } : {}),
            ...(record.priorToDate ? { priorToDate: toFigure(record.priorToDate) } : {}),
        }),
        cashAndEquivalents: record.cashAndEquivalents,
        shortTermInvestments: record.shortTermInvestments,
        grossDebt: record.grossDebt,
        shareholdersEquity: record.shareholdersEquity,
        totalAssets: record.totalAssets,
        hasOperatingResultLine: record.hasOperatingResultLine,
    });
}

function toFigure(figure: SnapshotFigure): ReportedFigure {
    return {
        period: new FiscalPeriod({
            start: parseDay(figure.start),
            end: parseDay(figure.end),
            kind: figure.kind,
        }),
        ebit: figure.ebit,
        ...(figure.netIncome === undefined ? {} : { netIncome: figure.netIncome }),
    };
}

function parseDay(value: string): Date {
    return new Date(`${value}T00:00:00Z`);
}
