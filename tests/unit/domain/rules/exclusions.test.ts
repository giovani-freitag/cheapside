import { describe, expect, it } from 'vitest';
import { DEFAULT_PARAMETERS } from '@/domain/rules/screen-parameters.ts';
import { firstExclusion } from '@/domain/rules/exclusions.ts';
import { aCandidate } from '../../../fixtures/companies.ts';

const CONTEXT = { parameters: DEFAULT_PARAMETERS, asOf: new Date('2026-09-15T00:00:00Z') };

describe('firstExclusion', () => {
    it('lets a plain profitable company through', () => {
        const reason = firstExclusion(aCandidate(), CONTEXT);

        expect(reason).toBeUndefined();
    });

    it('removes a company whose statement has no operating-profit line', () => {
        const reason = firstExclusion(aCandidate({ hasOperatingResultLine: false }), CONTEXT);

        expect(reason).toBe('financial-statement-shape');
    });

    it('removes a company in judicial recovery', () => {
        const reason = firstExclusion(aCandidate({ status: 'distressed' }), CONTEXT);

        expect(reason).toBe('issuer-not-in-good-standing');
    });

    it('removes a company that has not filed recently enough', () => {
        const reason = firstExclusion(aCandidate({ balanceSheetAt: '2025-03-31' }), CONTEXT);

        expect(reason).toBe('no-recent-statement');
    });

    it('removes a company with no operating profit', () => {
        const reason = firstExclusion(aCandidate({ annualEbit: -1_000_000 }), CONTEXT);

        expect(reason).toBe('no-operating-profit');
    });

    it('removes a company nobody trades', () => {
        const reason = firstExclusion(aCandidate({ tradedValue: 200_000 }), CONTEXT);

        expect(reason).toBe('illiquid');
    });

    it('removes a company whose debt outruns its profit', () => {
        const reason = firstExclusion(
            aCandidate({ annualEbit: 50_000_000, grossDebt: 1_000_000_000, cash: 0 }),
            CONTEXT,
        );

        expect(reason).toBe('over-leveraged');
    });

    it('lets a company with net cash past the leverage cap whatever the cap is', () => {
        const reason = firstExclusion(
            aCandidate({ annualEbit: 1_000_000, grossDebt: 0, cash: 900_000_000 }),
            CONTEXT,
        );

        expect(reason).toBeUndefined();
    });

    it('reports a bank in judicial recovery as a bank', () => {
        const reason = firstExclusion(
            aCandidate({ hasOperatingResultLine: false, status: 'distressed' }),
            CONTEXT,
        );

        expect(reason).toBe('financial-statement-shape');
    });

    it('measures liquidity against the floor in force rather than a constant', () => {
        const reason = firstExclusion(aCandidate({ tradedValue: 200_000 }), {
            ...CONTEXT,
            parameters: { ...DEFAULT_PARAMETERS, liquidityFloor: 100_000 },
        });

        expect(reason).toBeUndefined();
    });
});
