import { describe, expect, it } from 'vitest';
import { LiquidityService } from '@/services/liquidity/liquidity-service.ts';
import type { LiquidityHistory } from '@/services/liquidity/types.ts';

function aHistory(...values: number[]): LiquidityHistory {
    return {
        observations: values.map((value, index) => ({
            on: `2026-09-${String(index + 1).padStart(2, '0')}`,
            tradedValue: { TEST3: value },
        })),
    };
}

describe('LiquidityService', () => {
    it('takes the middle observation of an odd number of sessions', () => {
        const service = new LiquidityService({ history: aHistory(1, 100, 5), window: 60 });

        expect(service.typical('TEST3').value).toBe(5);
    });

    it('averages the middle pair of an even number of sessions', () => {
        const service = new LiquidityService({ history: aHistory(1, 3, 5, 7), window: 60 });

        expect(service.typical('TEST3').value).toBe(4);
    });

    it('says how many sessions the figure rests on', () => {
        const service = new LiquidityService({ history: aHistory(1, 3, 5), window: 60 });

        expect(service.typical('TEST3').observations).toBe(3);
    });

    it('is not moved by one block trade', () => {
        const service = new LiquidityService({ history: aHistory(1, 2, 3, 4, 900_000_000), window: 60 });

        expect(service.typical('TEST3').value).toBe(3);
    });

    it('reports nothing for a ticker it has never seen', () => {
        const service = new LiquidityService({ history: aHistory(1, 2, 3), window: 60 });

        expect(service.typical('OTHER3')).toEqual({ value: 0, observations: 0 });
    });

    it('adds a session to the record', () => {
        const service = new LiquidityService({ history: aHistory(1), window: 60 });

        const updated = service.observe({ on: '2026-09-02', tradedValue: { TEST3: 9 } });

        expect(updated.observations).toHaveLength(2);
    });

    it('replaces a session already recorded rather than repeating it', () => {
        const service = new LiquidityService({ history: aHistory(1), window: 60 });

        const updated = service.observe({ on: '2026-09-01', tradedValue: { TEST3: 9 } });

        expect(updated.observations).toEqual([{ on: '2026-09-01', tradedValue: { TEST3: 9 } }]);
    });

    it('drops the oldest session once the window is full', () => {
        const service = new LiquidityService({ history: aHistory(1, 2, 3), window: 3 });

        const updated = service.observe({ on: '2026-09-04', tradedValue: { TEST3: 4 } });

        expect(updated.observations.map((entry) => entry.on)).toEqual([
            '2026-09-02',
            '2026-09-03',
            '2026-09-04',
        ]);
    });
});
