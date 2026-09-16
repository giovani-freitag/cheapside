import { describe, expect, it } from 'vitest';
import type { Verdict } from '@/data/verdict.ts';
import { VerdictService } from '@/services/verdict/verdict-service.ts';

function aVerdict(overrides: Partial<Verdict> = {}): Verdict {
    return {
        ticker: 'ALLD3',
        model: 'claude-opus-5',
        reviewedAt: '2026-09-15',
        earningsThrough: '2026-06-30',
        answers: [
            {
                question: 'earnings-repeatable',
                finding: 'O EBIT de 2025 traz uma reversão de provisão de R$ 340 milhões.',
                citation: 'DFP 2025, nota 24 — Provisões para contingências',
                weight: 'flag',
            },
        ],
        ...overrides,
    };
}

describe('VerdictService', () => {
    it('finds a reading by ticker', () => {
        const service = new VerdictService({ verdicts: [aVerdict()] });

        expect(service.forTicker('ALLD3')?.model).toBe('claude-opus-5');
    });

    it('finds it however the ticker is cased', () => {
        const service = new VerdictService({ verdicts: [aVerdict()] });

        expect(service.forTicker('alld3')).toBeDefined();
    });

    it('reports nothing for a company nobody has read', () => {
        const service = new VerdictService({ verdicts: [aVerdict()] });

        expect(service.forTicker('MGLU3')).toBeUndefined();
    });

    it('counts the readings it holds', () => {
        const service = new VerdictService({ verdicts: [aVerdict(), aVerdict({ ticker: 'MGLU3' })] });

        expect(service.count).toBe(2);
    });

    it('calls a reading current when it covers the published window', () => {
        const service = new VerdictService({ verdicts: [aVerdict()] });

        expect(service.isCurrent('ALLD3', '2026-06-30')).toBe(true);
    });

    it('calls a reading stale when the published window has moved past it', () => {
        const service = new VerdictService({ verdicts: [aVerdict()] });

        expect(service.isCurrent('ALLD3', '2026-09-30')).toBe(false);
    });

    it('calls an absent reading stale rather than current', () => {
        const service = new VerdictService({ verdicts: [] });

        expect(service.isCurrent('ALLD3', '2026-06-30')).toBe(false);
    });
});
