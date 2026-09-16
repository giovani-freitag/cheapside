import { describe, expect, it } from 'vitest';
import { DEFAULT_PARAMETERS } from '@/domain/rules/screen-parameters.ts';
import { DomainError } from '@/domain/errors/domain-error.ts';
import { ScreenService } from '@/services/screen/screen-service.ts';
import { aCandidate } from '../../../fixtures/companies.ts';

const AS_OF = new Date('2026-09-15T00:00:00Z');

/** Market capitalisation is the only lever a test needs to set a multiple precisely. */
function atMultiple(ticker: string, multiple: number) {
    const ebit = 100_000_000;

    return aCandidate({
        ticker,
        annualEbit: ebit,
        grossDebt: 0,
        cash: 0,
        marketCapitalisation: ebit * multiple,
    });
}

function screen(parameters = DEFAULT_PARAMETERS) {
    return new ScreenService({ parameters });
}

describe('ScreenService', () => {
    it('ranks the cheapest company first', () => {
        const result = screen().run({
            candidates: [atMultiple('DEAR3', 12), atMultiple('CHEAP3', 3), atMultiple('MID3', 7)],
            preExcluded: [],
            asOf: AS_OF,
        });

        expect(result.eligible[0]?.candidate.company.primaryListing.ticker).toBe('CHEAP3');
    });

    it('numbers the ranking from one', () => {
        const result = screen().run({
            candidates: [atMultiple('DEAR3', 12), atMultiple('CHEAP3', 3)],
            preExcluded: [],
            asOf: AS_OF,
        });

        expect(result.eligible.map((entry) => entry.rank)).toEqual([1, 2]);
    });

    it('publishes only as many positions as the parameters ask for', () => {
        const candidates = Array.from({ length: 30 }, (_, index) =>
            atMultiple(`T${String(index)}3`, index + 1),
        );

        const result = screen({ ...DEFAULT_PARAMETERS, positions: 5 }).run({
            candidates,
            preExcluded: [],
            asOf: AS_OF,
        });

        expect(result.portfolio).toHaveLength(5);
    });

    it('keeps the whole eligible list behind the portfolio', () => {
        const candidates = Array.from({ length: 30 }, (_, index) =>
            atMultiple(`T${String(index)}3`, index + 1),
        );

        const result = screen({ ...DEFAULT_PARAMETERS, positions: 5 }).run({
            candidates,
            preExcluded: [],
            asOf: AS_OF,
        });

        expect(result.eligible).toHaveLength(30);
    });

    it('reports a removed company under the reason that removed it', () => {
        const result = screen().run({
            candidates: [aCandidate({ ticker: 'BANK4', hasOperatingResultLine: false })],
            preExcluded: [],
            asOf: AS_OF,
        });

        expect(result.excluded).toEqual([
            { ticker: 'BANK4', name: 'TESTE', reason: 'financial-statement-shape' },
        ]);
    });

    it('counts exclusions decided before a candidate could be assembled', () => {
        const result = screen().run({
            candidates: [atMultiple('CHEAP3', 3)],
            preExcluded: [{ ticker: 'GONE3', name: 'SUMIDA', reason: 'no-recent-statement' }],
            asOf: AS_OF,
        });

        expect(result.tally['no-recent-statement']).toBe(1);
    });

    it('starts every reason at zero so a filter that caught nothing still reports', () => {
        const result = screen().run({ candidates: [atMultiple('CHEAP3', 3)], preExcluded: [], asOf: AS_OF });

        expect(result.tally.illiquid).toBe(0);
    });

    it('leaves the ranking alone when the momentum overlay is off', () => {
        const result = screen({ ...DEFAULT_PARAMETERS, positions: 2, momentumShortlist: 3 }).run({
            candidates: [
                aCandidate({ ticker: 'A3', annualEbit: 100_000_000, grossDebt: 0, cash: 0, marketCapitalisation: 300_000_000, momentum: -0.5 }),
                aCandidate({ ticker: 'B3', annualEbit: 100_000_000, grossDebt: 0, cash: 0, marketCapitalisation: 400_000_000, momentum: 0.9 }),
                aCandidate({ ticker: 'C3', annualEbit: 100_000_000, grossDebt: 0, cash: 0, marketCapitalisation: 500_000_000, momentum: 0.1 }),
            ],
            preExcluded: [],
            asOf: AS_OF,
        });

        expect(result.portfolio.map((entry) => entry.candidate.company.primaryListing.ticker)).toEqual([
            'A3',
            'B3',
        ]);
    });

    it('re-sorts the cheap shortlist by momentum when the overlay is on', () => {
        const result = screen({
            ...DEFAULT_PARAMETERS,
            positions: 2,
            momentumShortlist: 3,
            momentumOverlay: true,
        }).run({
            candidates: [
                aCandidate({ ticker: 'A3', annualEbit: 100_000_000, grossDebt: 0, cash: 0, marketCapitalisation: 300_000_000, momentum: -0.5 }),
                aCandidate({ ticker: 'B3', annualEbit: 100_000_000, grossDebt: 0, cash: 0, marketCapitalisation: 400_000_000, momentum: 0.9 }),
                aCandidate({ ticker: 'C3', annualEbit: 100_000_000, grossDebt: 0, cash: 0, marketCapitalisation: 500_000_000, momentum: 0.1 }),
            ],
            preExcluded: [],
            asOf: AS_OF,
        });

        expect(result.portfolio.map((entry) => entry.candidate.company.primaryListing.ticker)).toEqual([
            'B3',
            'C3',
        ]);
    });

    it('refuses to publish a portfolio of no companies', () => {
        expect(() =>
            screen({ ...DEFAULT_PARAMETERS, positions: 0 }).run({
                candidates: [],
                preExcluded: [],
                asOf: AS_OF,
            }),
        ).toThrow(DomainError);
    });
});
