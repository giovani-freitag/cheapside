import { describe, expect, it } from 'vitest';
import type { MarketSnapshot } from '@/data/snapshot.ts';
import type { Universe } from '@/services/universe/universe-service.ts';
import { DEFAULT_PARAMETERS } from '@/domain/rules/screen-parameters.ts';
import { ScreenService } from '@/services/screen/screen-service.ts';
import { SNAPSHOT_VERSION, fromSnapshot, toSnapshot } from '@/data/snapshot.ts';
import { aCandidate } from '../fixtures/companies.ts';
import { toDataset } from '@/data/serialise.ts';

const CAPTURED_AT = '2026-09-15T12:00:00.000Z';

function aUniverse(): Universe {
    const candidates = [
        aCandidate({ ticker: 'CHEAP3', name: 'BARATA', marketCapitalisation: 300_000_000 }),
        aCandidate({ ticker: 'DEAR3', name: 'CARA', marketCapitalisation: 3_000_000_000 }),
        aCandidate({ ticker: 'BANK4', name: 'BANCO', hasOperatingResultLine: false }),
    ];

    return { candidates, unreadable: [], preExcluded: [], size: candidates.length };
}

function capture(universe: Universe): MarketSnapshot {
    return toSnapshot(universe, { capturedAt: CAPTURED_AT, sources: [] });
}

function screen(universe: Universe) {
    return new ScreenService({ parameters: DEFAULT_PARAMETERS }).run({
        candidates: universe.candidates,
        preExcluded: universe.preExcluded,
        asOf: new Date(CAPTURED_AT),
    });
}

describe('the snapshot', () => {
    it('stamps the version the reader will check', () => {
        const snapshot = capture(aUniverse());

        expect(snapshot.snapshotVersion).toBe(SNAPSHOT_VERSION);
    });

    it('keeps every company the join produced', () => {
        const snapshot = capture(aUniverse());

        expect(snapshot.companies).toHaveLength(3);
    });

    it('survives a trip through JSON, which is how it is actually stored', () => {
        const snapshot = JSON.parse(JSON.stringify(capture(aUniverse()))) as MarketSnapshot;

        const restored = fromSnapshot(snapshot);

        expect(restored.candidates).toHaveLength(3);
    });

    it('produces the same ranking after the round trip', () => {
        const original = screen(aUniverse());
        const restored = screen(fromSnapshot(JSON.parse(JSON.stringify(capture(aUniverse()))) as MarketSnapshot));

        expect(restored.portfolio.map((entry) => entry.candidate.company.primaryListing.ticker)).toEqual(
            original.portfolio.map((entry) => entry.candidate.company.primaryListing.ticker),
        );
    });

    it('produces the same exclusions after the round trip', () => {
        const original = screen(aUniverse());
        const restored = screen(fromSnapshot(JSON.parse(JSON.stringify(capture(aUniverse()))) as MarketSnapshot));

        expect(restored.tally).toEqual(original.tally);
    });

    it('produces a byte-identical dataset after the round trip', () => {
        const meta = { sources: [], universeSize: 3, eligibleDepth: 100 };
        const original = toDataset({ result: screen(aUniverse()), ...meta });
        const restored = toDataset({
            result: screen(fromSnapshot(JSON.parse(JSON.stringify(capture(aUniverse()))) as MarketSnapshot)),
            ...meta,
        });

        expect(JSON.stringify(restored)).toBe(JSON.stringify(original));
    });

    it('keeps the full CNPJ rather than the root it joined on', () => {
        const snapshot = capture(aUniverse());

        expect(snapshot.companies[0]?.cnpj).toBe('11111111000111');
    });

    it('brings a company with no readable filings back as an exclusion', () => {
        const company = aCandidate({ ticker: 'SEMDF3', name: 'SEM DEMONSTRACAO' }).company;
        const universe: Universe = { candidates: [], unreadable: [company], preExcluded: [], size: 1 };

        const restored = fromSnapshot(JSON.parse(JSON.stringify(capture(universe))) as MarketSnapshot);

        expect(restored.preExcluded).toEqual([
            { ticker: 'SEMDF3', name: 'SEM DEMONSTRACAO', reason: 'no-recent-statement' },
        ]);
    });

    it('does not turn an unreadable company into a candidate', () => {
        const company = aCandidate({ ticker: 'SEMDF3' }).company;
        const universe: Universe = { candidates: [], unreadable: [company], preExcluded: [], size: 1 };

        const restored = fromSnapshot(JSON.parse(JSON.stringify(capture(universe))) as MarketSnapshot);

        expect(restored.candidates).toEqual([]);
    });

    it('re-screens under different parameters without touching a source', () => {
        const restored = fromSnapshot(JSON.parse(JSON.stringify(capture(aUniverse()))) as MarketSnapshot);

        const tighter = new ScreenService({
            parameters: { ...DEFAULT_PARAMETERS, positions: 1 },
        }).run({ candidates: restored.candidates, preExcluded: restored.preExcluded, asOf: new Date(CAPTURED_AT) });

        expect(tighter.portfolio).toHaveLength(1);
    });
});
