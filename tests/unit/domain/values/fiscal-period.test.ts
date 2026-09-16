import { describe, expect, it } from 'vitest';
import { DomainError } from '@/domain/errors/domain-error.ts';
import { FiscalPeriod } from '@/domain/values/fiscal-period.ts';
import { aYear, aYearToDate } from '../../../fixtures/companies.ts';

describe('FiscalPeriod', () => {
    it('measures a calendar year as twelve months', () => {
        const period = aYear(2025);

        expect(period.months).toBe(12);
    });

    it('measures a half year to date as six months', () => {
        const period = aYearToDate(2026, 6);

        expect(period.months).toBe(6);
    });

    it('recognises a calendar year as a full year', () => {
        const period = aYear(2025);

        expect(period.isFullYear).toBe(true);
    });

    it('does not mistake nine months for a full year', () => {
        const period = aYearToDate(2026, 9);

        expect(period.isFullYear).toBe(false);
    });

    it('measures staleness against the moment the screen runs', () => {
        const period = aYearToDate(2026, 6);

        const months = period.monthsSinceClose(new Date('2026-09-30T00:00:00Z'));

        expect(months).toBeCloseTo(3, 0);
    });

    it('writes its close the way every source writes it', () => {
        const period = aYearToDate(2026, 6);

        expect(period.closeKey).toBe('2026-06-30');
    });

    it('refuses a window that ends before it starts', () => {
        expect(
            () =>
                new FiscalPeriod({
                    start: new Date('2026-06-30T00:00:00Z'),
                    end: new Date('2026-01-01T00:00:00Z'),
                    kind: 'quarterly',
                }),
        ).toThrow(DomainError);
    });
});
