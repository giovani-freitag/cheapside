import { describe, expect, it } from 'vitest';
import { aCandidate } from '../../../fixtures/companies.ts';

describe('Candidate', () => {
    it('prices the equity against the bottom line', () => {
        const candidate = aCandidate({ marketCapitalisation: 600_000_000, annualNetIncome: 120_000_000 });

        expect(candidate.priceToEarnings).toBe(5);
    });

    it('refuses to price equity against a loss', () => {
        const candidate = aCandidate({ annualNetIncome: -10_000_000 });

        expect(candidate.priceToEarnings).toBeUndefined();
    });

    it('refuses to price equity against a break-even', () => {
        const candidate = aCandidate({ annualNetIncome: 0 });

        expect(candidate.priceToEarnings).toBeUndefined();
    });

    it('prices the equity against book value', () => {
        const candidate = aCandidate({ marketCapitalisation: 400_000_000, equity: 800_000_000 });

        expect(candidate.priceToBook).toBe(0.5);
    });

    it('refuses to price against negative book value', () => {
        const candidate = aCandidate({ equity: -50_000_000 });

        expect(candidate.priceToBook).toBeUndefined();
    });

    it('reads the enterprise across market and balance sheet together', () => {
        const candidate = aCandidate({
            marketCapitalisation: 1_000_000_000,
            grossDebt: 300_000_000,
            cash: 100_000_000,
        });

        expect(candidate.enterpriseValue.total).toBe(1_200_000_000);
    });

    it('keeps the context multiples out of the rank key', () => {
        const candidate = aCandidate({
            marketCapitalisation: 1_000_000_000,
            annualNetIncome: 1,
            annualEbit: 200_000_000,
            grossDebt: 0,
            cash: 0,
        });

        expect(candidate.multiple?.value).toBe(5);
    });
});
