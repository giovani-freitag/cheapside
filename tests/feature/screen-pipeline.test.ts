import { describe, expect, it } from 'vitest';
import type { IssuerRecord, StatementRecord } from '@/services/cvm/types.ts';
import type { ListedIssuer } from '@/services/b3/b3-service.ts';
import type { Quote } from '@/services/quotes/quotes-service.ts';
import { Cnpj } from '@/domain/values/cnpj.ts';
import { DEFAULT_PARAMETERS } from '@/domain/rules/screen-parameters.ts';
import { FiscalPeriod } from '@/domain/values/fiscal-period.ts';
import { LiquidityService } from '@/services/liquidity/liquidity-service.ts';
import { SCHEMA_VERSION } from '@/data/schema.ts';
import { ScreenService } from '@/services/screen/screen-service.ts';
import { UniverseService } from '@/services/universe/universe-service.ts';
import { aYear, aYearToDate } from '../fixtures/companies.ts';
import { toDataset } from '@/data/serialise.ts';

const AS_OF = new Date('2026-09-15T00:00:00Z');

interface Sketch {
    root: string;
    cnpj: string;
    /** The CNPJ the filings were made under, when it differs from the listed establishment. */
    filingCnpj?: string;
    marketCapitalisation: number;
    annualEbit: number;
    currentEbit?: number;
    priorEbit?: number;
    grossDebt: number;
    cash: number;
    tradedValue: number;
    status?: IssuerRecord['status'];
    hasOperatingResultLine?: boolean;
    balanceSheetAt?: string;
}

/** A market small enough to reason about, shaped like the one the pipeline really reads. */
const MARKET: readonly Sketch[] = [
    {
        root: 'BARA',
        cnpj: '11111111000111',
        marketCapitalisation: 400_000_000,
        annualEbit: 200_000_000,
        currentEbit: 110_000_000,
        priorEbit: 90_000_000,
        grossDebt: 100_000_000,
        cash: 100_000_000,
        tradedValue: 8_000_000,
    },
    {
        root: 'MEIO',
        cnpj: '22222222000122',
        marketCapitalisation: 2_000_000_000,
        annualEbit: 200_000_000,
        grossDebt: 0,
        cash: 0,
        tradedValue: 8_000_000,
    },
    {
        root: 'BANK',
        cnpj: '33333333000133',
        marketCapitalisation: 300_000_000,
        annualEbit: 400_000_000,
        grossDebt: 0,
        cash: 0,
        tradedValue: 50_000_000,
        hasOperatingResultLine: false,
    },
    {
        root: 'RECU',
        cnpj: '44444444000144',
        marketCapitalisation: 100_000_000,
        annualEbit: 200_000_000,
        grossDebt: 0,
        cash: 0,
        tradedValue: 9_000_000,
        status: 'distressed',
    },
    {
        root: 'SECO',
        cnpj: '55555555000155',
        marketCapitalisation: 100_000_000,
        annualEbit: 300_000_000,
        grossDebt: 0,
        cash: 0,
        tradedValue: 40_000,
    },
    {
        root: 'DEVE',
        cnpj: '66666666000166',
        marketCapitalisation: 200_000_000,
        annualEbit: 100_000_000,
        grossDebt: 900_000_000,
        cash: 0,
        tradedValue: 6_000_000,
    },
    {
        root: 'PERD',
        cnpj: '77777777000177',
        marketCapitalisation: 500_000_000,
        annualEbit: -50_000_000,
        grossDebt: 0,
        cash: 0,
        tradedValue: 6_000_000,
    },
    {
        root: 'MUDO',
        cnpj: '88888888000388',
        filingCnpj: '88888888000188',
        marketCapitalisation: 1_500_000_000,
        annualEbit: 250_000_000,
        grossDebt: 0,
        cash: 0,
        tradedValue: 7_000_000,
    },
];

function run() {
    const issuers = new Map<string, ListedIssuer>();
    const quotes = new Map<string, Quote>();
    const registry = new Map<string, IssuerRecord>();
    const statements = new Map<string, StatementRecord>();
    const tradedValue: Record<string, number> = {};

    for (const sketch of MARKET) {
        const listed = Cnpj.parse(sketch.cnpj);
        const filing = Cnpj.parse(sketch.filingCnpj ?? sketch.cnpj);
        const ticker = `${sketch.root}3`;
        const close = new Date(`${sketch.balanceSheetAt ?? '2026-06-30'}T00:00:00Z`);

        issuers.set(sketch.root, {
            root: sketch.root,
            cnpj: listed,
            companyName: `${sketch.root} S.A.`,
            tradingName: sketch.root,
            segment: 'Diversos',
        });

        quotes.set(ticker, {
            ticker,
            root: sketch.root,
            name: `${sketch.root} S.A.`,
            sector: 'Diversos',
            price: 10,
            shareVolume: sketch.tradedValue / 10,
            marketCapitalisation: sketch.marketCapitalisation,
        });

        registry.set(filing.root, {
            cnpj: filing,
            cvmCode: sketch.root,
            legalName: `${sketch.root} S.A.`,
            sector: 'Diversos',
            status: sketch.status ?? 'operational',
        });

        statements.set(filing.root, {
            cvmCode: sketch.root,
            annual: { period: aYear(2025), ebit: sketch.annualEbit },
            ...(sketch.currentEbit === undefined
                ? {}
                : { currentToDate: { period: aYearToDate(2026, 6), ebit: sketch.currentEbit } }),
            ...(sketch.priorEbit === undefined
                ? {}
                : { priorToDate: { period: aYearToDate(2025, 6), ebit: sketch.priorEbit } }),
            balanceSheetAt: new FiscalPeriod({ start: close, end: close, kind: 'quarterly' }),
            cashAndEquivalents: sketch.cash,
            shortTermInvestments: 0,
            grossDebt: sketch.grossDebt,
            shareholdersEquity: 1_000_000_000,
            totalAssets: 2_000_000_000,
            hasOperatingResultLine: sketch.hasOperatingResultLine ?? true,
        });

        tradedValue[ticker] = sketch.tradedValue;
    }

    const liquidity = new LiquidityService({
        history: { observations: [{ on: '2026-09-15', tradedValue }] },
        window: 60,
    });
    const universe = new UniverseService({ liquidity }).assemble({ issuers, quotes, registry, statements });
    const result = new ScreenService({ parameters: { ...DEFAULT_PARAMETERS, positions: 3 } }).run({
        candidates: universe.candidates,
        preExcluded: universe.preExcluded,
        asOf: AS_OF,
    });

    return { universe, result };
}

describe('the screen end to end', () => {
    it('counts every listed operating company as the universe', () => {
        const { universe } = run();

        expect(universe.size).toBe(MARKET.length);
    });

    it('publishes the cheapest companies in order', () => {
        const { result } = run();

        expect(result.portfolio.map((entry) => entry.candidate.company.primaryListing.ticker)).toEqual([
            'BARA3',
            'MUDO3',
            'MEIO3',
        ]);
    });

    it('prices the enterprise on trailing earnings rather than the closed year alone', () => {
        const { result } = run();

        expect(result.portfolio[0]?.multiple.trailingEbit).toBe(220_000_000);
    });

    it('removes a bank because its statement has no operating profit', () => {
        const { result } = run();

        expect(result.excluded).toContainEqual({
            ticker: 'BANK3',
            name: 'BANK',
            reason: 'financial-statement-shape',
        });
    });

    it('removes a company in judicial recovery however cheap it looks', () => {
        const { result } = run();

        expect(result.tally['issuer-not-in-good-standing']).toBe(1);
    });

    it('removes a company nobody can buy at the price it quotes', () => {
        const { result } = run();

        expect(result.tally.illiquid).toBe(1);
    });

    it('removes a company whose debt outruns its profit', () => {
        const { result } = run();

        expect(result.tally['over-leveraged']).toBe(1);
    });

    it('removes a company with no operating profit to divide by', () => {
        const { result } = run();

        expect(result.tally['no-operating-profit']).toBe(1);
    });

    it('accounts for every company either in the ranking or in an exclusion', () => {
        const { universe, result } = run();

        expect(result.eligible.length + result.excluded.length).toBe(universe.size);
    });

    it('serialises a dataset the interface can read', () => {
        const { universe, result } = run();

        const dataset = toDataset({ result, sources: [], universeSize: universe.size, eligibleDepth: 100 });

        expect(dataset.schemaVersion).toBe(SCHEMA_VERSION);
    });

    it('carries every input of a multiple into the published row', () => {
        const { universe, result } = run();

        const dataset = toDataset({ result, sources: [], universeSize: universe.size, eligibleDepth: 100 });

        expect(dataset.portfolio[0]).toMatchObject({
            ticker: 'BARA3',
            marketCapitalisation: 400_000_000,
            grossDebt: 100_000_000,
            cashAndEquivalents: 100_000_000,
            netDebt: 0,
            enterpriseValue: 400_000_000,
            trailingEbit: 220_000_000,
            earningsThrough: '2026-06-30',
            interimAdjusted: true,
        });
    });
});
