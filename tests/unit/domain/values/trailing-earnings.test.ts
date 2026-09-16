import { describe, expect, it } from 'vitest';
import { DomainError } from '@/domain/errors/domain-error.ts';
import { TrailingEarnings } from '@/domain/values/trailing-earnings.ts';
import { aYear, aYearToDate } from '../../../fixtures/companies.ts';

describe('TrailingEarnings', () => {
    it('falls back to the closed year when no quarterly filing is newer', () => {
        const earnings = new TrailingEarnings({ annual: { period: aYear(2025), ebit: 503_782_000 } });

        expect(earnings.ebit).toBe(503_782_000);
    });

    it('says when the figure is the closed year alone', () => {
        const earnings = new TrailingEarnings({ annual: { period: aYear(2025), ebit: 503_782_000 } });

        expect(earnings.isInterimAdjusted).toBe(false);
    });

    it('rolls the closed year forward by the quarters that superseded it', () => {
        const earnings = new TrailingEarnings({
            annual: { period: aYear(2025), ebit: 503_782_000 },
            currentToDate: { period: aYearToDate(2026, 6), ebit: 111_661_000 },
            priorToDate: { period: aYearToDate(2025, 6), ebit: 79_067_000 },
        });

        expect(earnings.ebit).toBe(536_376_000);
    });

    it('ends the window where the newest quarterly filing ends', () => {
        const earnings = new TrailingEarnings({
            annual: { period: aYear(2025), ebit: 503_782_000 },
            currentToDate: { period: aYearToDate(2026, 6), ebit: 111_661_000 },
            priorToDate: { period: aYearToDate(2025, 6), ebit: 79_067_000 },
        });

        expect(earnings.through.closeKey).toBe('2026-06-30');
    });

    it('covers exactly twelve months once a quarter has been folded in', () => {
        const earnings = new TrailingEarnings({
            annual: { period: aYear(2025), ebit: 503_782_000 },
            currentToDate: { period: aYearToDate(2026, 9), ebit: 150_000_000 },
            priorToDate: { period: aYearToDate(2025, 9), ebit: 120_000_000 },
        });

        expect(earnings.through.isFullYear).toBe(true);
    });

    it('discards a pair whose windows do not match rather than subtracting them', () => {
        const earnings = new TrailingEarnings({
            annual: { period: aYear(2025), ebit: 503_782_000 },
            currentToDate: { period: aYearToDate(2026, 6), ebit: 111_661_000 },
            priorToDate: { period: aYearToDate(2025, 3), ebit: 37_610_000 },
        });

        expect(earnings.ebit).toBe(503_782_000);
    });

    it('ignores a quarterly filing older than the closed year', () => {
        const earnings = new TrailingEarnings({
            annual: { period: aYear(2025), ebit: 503_782_000 },
            currentToDate: { period: aYearToDate(2025, 6), ebit: 79_067_000 },
            priorToDate: { period: aYearToDate(2024, 6), ebit: 60_000_000 },
        });

        expect(earnings.isInterimAdjusted).toBe(false);
    });

    it('carries a loss through the arithmetic unchanged', () => {
        const earnings = new TrailingEarnings({
            annual: { period: aYear(2025), ebit: -40_000_000 },
            currentToDate: { period: aYearToDate(2026, 6), ebit: -10_000_000 },
            priorToDate: { period: aYearToDate(2025, 6), ebit: -25_000_000 },
        });

        expect(earnings.ebit).toBe(-25_000_000);
    });

    it('refuses a base that is not a closed year', () => {
        expect(() => new TrailingEarnings({ annual: { period: aYearToDate(2026, 6), ebit: 1 } })).toThrow(
            DomainError,
        );
    });
});
