import { describe, expect, it } from 'vitest';
import type { ScreenDataset } from '@/data/schema.ts';
import { DEFAULT_PARAMETERS } from '@/domain/rules/screen-parameters.ts';
import { DatasetService } from '@/services/dataset/dataset-service.ts';
import { DomainError } from '@/domain/errors/domain-error.ts';
import { SCHEMA_VERSION } from '@/data/schema.ts';
import published from '@/data/generated/screen.json';

function aDataset(overrides: Partial<ScreenDataset> = {}): ScreenDataset {
    const rows = Array.from({ length: 5 }, (_, index) => ({
        ...(published as ScreenDataset).portfolio[0],
        rank: index + 1,
        ticker: `T${String(index)}3`,
    }));

    return {
        schemaVersion: SCHEMA_VERSION,
        builtAt: '2026-09-15T12:00:00.000Z',
        parameters: { ...DEFAULT_PARAMETERS, positions: 3 },
        sources: [],
        universeSize: 300,
        portfolio: rows.slice(0, 3),
        eligible: rows,
        tally: {
            'financial-statement-shape': 17,
            'issuer-not-in-good-standing': 18,
            'no-recent-statement': 8,
            'no-operating-profit': 45,
            illiquid: 72,
            'over-leveraged': 35,
        },
        excluded: [
            { ticker: 'ITUB4', name: 'ITAUUNIBANCO', reason: 'financial-statement-shape' },
            { ticker: 'AMER3', name: 'AMERICANAS', reason: 'issuer-not-in-good-standing' },
        ],
        ...overrides,
    };
}

describe('DatasetService', () => {
    it('hands the published screen through unchanged', () => {
        const service = new DatasetService({ dataset: aDataset() });

        expect(service.screen.universeSize).toBe(300);
    });

    it('reads the build stamp as a moment', () => {
        const service = new DatasetService({ dataset: aDataset() });

        expect(service.builtAt.toISOString()).toBe('2026-09-15T12:00:00.000Z');
    });

    it('separates the tail from the portfolio at the portfolio size', () => {
        const service = new DatasetService({ dataset: aDataset() });

        expect(service.runnersUp.map((row) => row.ticker)).toEqual(['T33', 'T43']);
    });

    it('lists what one filter removed', () => {
        const service = new DatasetService({ dataset: aDataset() });

        expect(service.excludedBy('financial-statement-shape').map((row) => row.ticker)).toEqual(['ITUB4']);
    });

    it('refuses a dataset written by a different version of the schema', () => {
        expect(() => new DatasetService({ dataset: aDataset({ schemaVersion: 99 }) })).toThrow(DomainError);
    });

    it('reads the dataset that is actually committed', () => {
        const service = new DatasetService({ dataset: published as ScreenDataset });

        expect(service.screen.portfolio.length).toBeGreaterThan(0);
    });
});
