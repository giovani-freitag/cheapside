import { describe, expect, it } from 'vitest';
import type { IssuerRecord, StatementRecord } from '@/services/cvm/types.ts';
import type { ListedIssuer } from '@/services/b3/b3-service.ts';
import type { Quote } from '@/services/quotes/quotes-service.ts';
import { Cnpj } from '@/domain/values/cnpj.ts';
import { FiscalPeriod } from '@/domain/values/fiscal-period.ts';
import { LiquidityService } from '@/services/liquidity/liquidity-service.ts';
import { UniverseService } from '@/services/universe/universe-service.ts';
import { aYear } from '../../../fixtures/companies.ts';

const LISTED_CNPJ = Cnpj.parse('84683374000300');
const FILING_CNPJ = Cnpj.parse('84.683.374/0001-49');

function anIssuer(): ListedIssuer {
    return {
        root: 'TUPY',
        cnpj: LISTED_CNPJ,
        companyName: 'TUPY S.A.',
        tradingName: 'TUPY',
        segment: 'Motores. Compressores e Outros',
    };
}

function aQuote(ticker: string): Quote {
    return {
        ticker,
        root: ticker.slice(0, 4),
        name: 'TUPY S.A.',
        sector: 'Producer Manufacturing',
        price: 20,
        shareVolume: 500_000,
        marketCapitalisation: 2_900_000_000,
    };
}

function aRegistryRecord(): IssuerRecord {
    return {
        cnpj: FILING_CNPJ,
        cvmCode: '16101',
        legalName: 'TUPY S.A.',
        sector: 'Metalurgia e Siderurgia',
        status: 'operational',
    };
}

function aStatementRecord(overrides: Partial<StatementRecord> = {}): StatementRecord {
    const close = new Date('2026-06-30T00:00:00Z');

    return {
        cvmCode: '16101',
        annual: { period: aYear(2025), ebit: 900_000_000 },
        balanceSheetAt: new FiscalPeriod({ start: close, end: close, kind: 'quarterly' }),
        cashAndEquivalents: 1_000_000_000,
        shortTermInvestments: 0,
        grossDebt: 3_000_000_000,
        shareholdersEquity: 3_500_000_000,
        totalAssets: 9_000_000_000,
        hasOperatingResultLine: true,
        ...overrides,
    };
}

function assemble(options: { statements?: Map<string, StatementRecord>; tickers?: string[] } = {}) {
    const tickers = options.tickers ?? ['TUPY3'];
    const liquidity = new LiquidityService({
        history: { observations: [{ on: '2026-09-15', tradedValue: { TUPY3: 10_000_000 } }] },
        window: 60,
    });

    return new UniverseService({ liquidity }).assemble({
        issuers: new Map([['TUPY', anIssuer()]]),
        quotes: new Map(tickers.map((ticker) => [ticker, aQuote(ticker)])),
        registry: new Map([[FILING_CNPJ.root, aRegistryRecord()]]),
        statements: options.statements ?? new Map([[FILING_CNPJ.root, aStatementRecord()]]),
    });
}

describe('UniverseService', () => {
    it('joins a listing to the filings of the same company under a different establishment', () => {
        const universe = assemble();

        expect(universe.candidates).toHaveLength(1);
    });

    it('takes the issuer standing from the registry rather than from the listing', () => {
        const universe = assemble();

        expect(universe.candidates[0]?.company.status).toBe('operational');
    });

    it('values the company once however many classes it lists', () => {
        const universe = assemble({ tickers: ['TUPY3', 'TUPY4'] });

        expect(universe.candidates[0]?.company.marketCapitalisation).toBe(2_900_000_000);
    });

    it('builds the enterprise value from the market and the balance sheet together', () => {
        const universe = assemble();

        expect(universe.candidates[0]?.enterpriseValue.total).toBe(4_900_000_000);
    });

    it('measures liquidity from the recorded sessions rather than from the quote', () => {
        const universe = assemble();

        expect(universe.candidates[0]?.company.tradableVolume).toBe(10_000_000);
    });

    it('sets a company with no filings aside rather than ranking it', () => {
        const universe = assemble({ statements: new Map() });

        expect(universe.preExcluded).toEqual([
            { ticker: 'TUPY3', name: 'TUPY', reason: 'no-recent-statement' },
        ]);
    });

    it('sets aside a company whose filings have no closed year to build a trailing sum on', () => {
        const statements = new Map([[FILING_CNPJ.root, aStatementRecord({ annual: undefined })]]);

        const universe = assemble({ statements });

        expect(universe.candidates).toHaveLength(0);
    });

    it('counts the companies it set aside in the universe it reports', () => {
        const universe = assemble({ statements: new Map() });

        expect(universe.size).toBe(1);
    });
});
