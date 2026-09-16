import type { IssuerStatus } from '@/domain/enums/issuer-status.ts';
import { Candidate } from '@/domain/entities/candidate.ts';
import { Cnpj } from '@/domain/values/cnpj.ts';
import { Company } from '@/domain/entities/company.ts';
import { Financials } from '@/domain/entities/financials.ts';
import { FiscalPeriod } from '@/domain/values/fiscal-period.ts';
import { Listing } from '@/domain/entities/listing.ts';
import { TrailingEarnings } from '@/domain/values/trailing-earnings.ts';

export interface CandidateOverrides {
    ticker?: string;
    name?: string;
    status?: IssuerStatus;
    marketCapitalisation?: number;
    tradedValue?: number;
    annualEbit?: number;
    annualNetIncome?: number;
    equity?: number;
    grossDebt?: number;
    cash?: number;
    hasOperatingResultLine?: boolean;
    balanceSheetAt?: string;
    momentum?: number;
}

/** A plain, rankable company, so a test only has to state what it is changing. */
export function aCandidate(overrides: CandidateOverrides = {}): Candidate {
    const ticker = overrides.ticker ?? 'TEST3';
    const close = new Date(`${overrides.balanceSheetAt ?? '2026-06-30'}T00:00:00Z`);

    const company = new Company({
        cnpj: Cnpj.parse('11.111.111/0001-11'),
        cvmCode: '12345',
        legalName: overrides.name ?? 'EMPRESA TESTE S.A.',
        tradingName: overrides.name ?? 'TESTE',
        sector: 'Industrial',
        status: overrides.status ?? 'operational',
        marketCapitalisation: overrides.marketCapitalisation ?? 1_000_000_000,
        listings: [
            new Listing({
                ticker,
                price: 10,
                typicalTradedValue: overrides.tradedValue ?? 5_000_000,
                observations: 1,
            }),
        ],
    });

    const financials = new Financials({
        balanceSheetAt: new FiscalPeriod({ start: close, end: close, kind: 'quarterly' }),
        earnings: new TrailingEarnings({
            annual: {
                period: new FiscalPeriod({
                    start: new Date('2025-01-01T00:00:00Z'),
                    end: new Date('2025-12-31T00:00:00Z'),
                    kind: 'annual',
                }),
                ebit: overrides.annualEbit ?? 200_000_000,
                netIncome: overrides.annualNetIncome ?? 120_000_000,
            },
        }),
        cashAndEquivalents: overrides.cash ?? 100_000_000,
        shortTermInvestments: 0,
        grossDebt: overrides.grossDebt ?? 200_000_000,
        shareholdersEquity: overrides.equity ?? 800_000_000,
        totalAssets: 2_000_000_000,
        hasOperatingResultLine: overrides.hasOperatingResultLine ?? true,
    });

    return new Candidate({
        company,
        financials,
        ...(overrides.momentum === undefined ? {} : { momentum: overrides.momentum }),
    });
}

/** A full-year window, for the many tests that need one and do not care which. */
export function aYear(year: number): FiscalPeriod {
    return new FiscalPeriod({
        start: new Date(`${String(year)}-01-01T00:00:00Z`),
        end: new Date(`${String(year)}-12-31T00:00:00Z`),
        kind: 'annual',
    });
}

/** A year-to-date window ending on the given month, as a quarterly filing reports it. */
export function aYearToDate(year: number, throughMonth: number): FiscalPeriod {
    const month = String(throughMonth).padStart(2, '0');
    const lastDay = new Date(Date.UTC(year, throughMonth, 0)).getUTCDate();

    return new FiscalPeriod({
        start: new Date(`${String(year)}-01-01T00:00:00Z`),
        end: new Date(`${String(year)}-${month}-${String(lastDay)}T00:00:00Z`),
        kind: 'quarterly',
    });
}
