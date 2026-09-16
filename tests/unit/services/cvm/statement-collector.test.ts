import { describe, expect, it } from 'vitest';
import type { BalanceRow, IncomeRow } from '@/services/cvm/statement-collector.ts';
import { StatementCollector } from '@/services/cvm/statement-collector.ts';

const OPERATING = 'Resultado Antes do Resultado Financeiro e dos Tributos';
const BANK = 'Resultado Antes dos Tributos sobre o Lucro';

function anIncomeRow(overrides: Partial<IncomeRow> = {}): IncomeRow {
    return {
        cnpj: '11111111',
        cvmCode: '12345',
        reference: '2026-06-30',
        version: 1,
        scale: 'MIL',
        order: 'ÚLTIMO',
        account: '3.05',
        description: OPERATING,
        amount: '100000',
        periodStart: '2026-01-01',
        periodEnd: '2026-06-30',
        kind: 'quarterly',
        ...overrides,
    };
}

function aBalanceRow(overrides: Partial<BalanceRow> = {}): BalanceRow {
    return {
        cnpj: '11111111',
        cvmCode: '12345',
        reference: '2026-06-30',
        version: 1,
        scale: 'MIL',
        order: 'ÚLTIMO',
        account: '1.01.01',
        amount: '50000',
        periodEnd: '2026-06-30',
        ...overrides,
    };
}

describe('StatementCollector', () => {
    it('converts a figure filed in thousands into reais', () => {
        const collector = new StatementCollector();

        collector.addIncome(anIncomeRow({ amount: '111661' }));

        expect(collector.reduce().get('11111111')?.currentToDate?.ebit).toBe(111_661_000);
    });

    it('keeps the year to date rather than the quarter filed beside it', () => {
        const collector = new StatementCollector();

        collector.addIncome(anIncomeRow({ amount: '111661', periodStart: '2026-01-01' }));
        collector.addIncome(anIncomeRow({ amount: '63592', periodStart: '2026-04-01' }));

        expect(collector.reduce().get('11111111')?.currentToDate?.ebit).toBe(111_661_000);
    });

    it('keeps the year to date whichever order the rows arrive in', () => {
        const collector = new StatementCollector();

        collector.addIncome(anIncomeRow({ amount: '63592', periodStart: '2026-04-01' }));
        collector.addIncome(anIncomeRow({ amount: '111661', periodStart: '2026-01-01' }));

        expect(collector.reduce().get('11111111')?.currentToDate?.ebit).toBe(111_661_000);
    });

    it('files the comparative window separately from the current one', () => {
        const collector = new StatementCollector();

        collector.addIncome(anIncomeRow({ amount: '111661' }));
        collector.addIncome(
            anIncomeRow({
                order: 'PENÚLTIMO',
                amount: '79067',
                periodStart: '2025-01-01',
                periodEnd: '2025-06-30',
            }),
        );

        expect(collector.reduce().get('11111111')?.priorToDate?.ebit).toBe(79_067_000);
    });

    it('takes the closed year off an annual filing', () => {
        const collector = new StatementCollector();

        collector.addIncome(
            anIncomeRow({
                kind: 'annual',
                reference: '2025-12-31',
                amount: '503782',
                periodStart: '2025-01-01',
                periodEnd: '2025-12-31',
            }),
        );

        expect(collector.reduce().get('11111111')?.annual?.ebit).toBe(503_782_000);
    });

    it('replaces a filing when a later version of it arrives', () => {
        const collector = new StatementCollector();

        collector.addIncome(anIncomeRow({ version: 1, amount: '100000' }));
        collector.addIncome(anIncomeRow({ version: 2, amount: '120000' }));

        expect(collector.reduce().get('11111111')?.currentToDate?.ebit).toBe(120_000_000);
    });

    it('ignores a superseded version arriving after the one that replaced it', () => {
        const collector = new StatementCollector();

        collector.addIncome(anIncomeRow({ version: 2, amount: '120000' }));
        collector.addIncome(anIncomeRow({ version: 1, amount: '100000' }));

        expect(collector.reduce().get('11111111')?.currentToDate?.ebit).toBe(120_000_000);
    });

    it('marks a company whose 3.05 is an operating profit', () => {
        const collector = new StatementCollector();

        collector.addIncome(anIncomeRow());

        expect(collector.reduce().get('11111111')?.hasOperatingResultLine).toBe(true);
    });

    it('does not mark a bank that files a pre-tax profit at the same code', () => {
        const collector = new StatementCollector();

        collector.addIncome(anIncomeRow({ description: BANK }));

        expect(collector.reduce().get('11111111')?.hasOperatingResultLine).toBe(false);
    });

    it('sums current and non-current borrowings into one gross debt', () => {
        const collector = new StatementCollector();

        collector.addBalance(aBalanceRow({ account: '2.01.04', amount: '300000' }));
        collector.addBalance(aBalanceRow({ account: '2.02.01', amount: '700000' }));

        expect(collector.reduce().get('11111111')?.grossDebt).toBe(1_000_000_000);
    });

    it('reads the balance sheet from the newest filing', () => {
        const collector = new StatementCollector();

        collector.addBalance(aBalanceRow({ reference: '2026-03-31', periodEnd: '2026-03-31', amount: '10' }));
        collector.addBalance(aBalanceRow({ reference: '2026-06-30', periodEnd: '2026-06-30', amount: '20' }));

        expect(collector.reduce().get('11111111')?.cashAndEquivalents).toBe(20_000);
    });

    it('ignores the comparative column of a balance sheet', () => {
        const collector = new StatementCollector();

        collector.addBalance(aBalanceRow({ amount: '20' }));
        collector.addBalance(aBalanceRow({ order: 'PENÚLTIMO', amount: '9999' }));

        expect(collector.reduce().get('11111111')?.cashAndEquivalents).toBe(20_000);
    });

    it('ignores accounts it was not asked for', () => {
        const collector = new StatementCollector();

        collector.addIncome(anIncomeRow({ account: '3.01', amount: '9999999' }));

        expect(collector.reduce().get('11111111')).toBeUndefined();
    });
});
