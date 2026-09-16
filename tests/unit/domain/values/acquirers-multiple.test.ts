import { describe, expect, it } from 'vitest';
import { AcquirersMultiple } from '@/domain/values/acquirers-multiple.ts';
import { DomainError } from '@/domain/errors/domain-error.ts';
import { EnterpriseValue } from '@/domain/values/enterprise-value.ts';

function anEnterprise(overrides: Partial<ConstructorParameters<typeof EnterpriseValue>[0]> = {}) {
    return new EnterpriseValue({
        marketCapitalisation: 1_000_000_000,
        grossDebt: 400_000_000,
        cashAndEquivalents: 100_000_000,
        shortTermInvestments: 50_000_000,
        ...overrides,
    });
}

describe('EnterpriseValue', () => {
    it('nets cash and investments off the debt', () => {
        const enterprise = anEnterprise();

        expect(enterprise.netDebt).toBe(250_000_000);
    });

    it('adds net debt to the market capitalisation', () => {
        const enterprise = anEnterprise();

        expect(enterprise.total).toBe(1_250_000_000);
    });

    it('reports net cash as a negative net debt', () => {
        const enterprise = anEnterprise({ grossDebt: 20_000_000 });

        expect(enterprise.netDebt).toBe(-130_000_000);
    });
});

describe('AcquirersMultiple', () => {
    it('reads the enterprise against the operating profit', () => {
        const multiple = new AcquirersMultiple({ enterpriseValue: anEnterprise(), trailingEbit: 250_000_000 });

        expect(multiple.value).toBe(5);
    });

    it('reads the same fact back as a yield', () => {
        const multiple = new AcquirersMultiple({ enterpriseValue: anEnterprise(), trailingEbit: 250_000_000 });

        expect(multiple.earningsYield).toBeCloseTo(0.2, 10);
    });

    it('counts the turns of net debt the profit carries', () => {
        const multiple = new AcquirersMultiple({ enterpriseValue: anEnterprise(), trailingEbit: 125_000_000 });

        expect(multiple.netDebtToEbit).toBe(2);
    });

    it('refuses to be defined over a loss', () => {
        expect(
            () => new AcquirersMultiple({ enterpriseValue: anEnterprise(), trailingEbit: -1 }),
        ).toThrow(DomainError);
    });

    it('refuses to be defined over a break-even', () => {
        expect(() => new AcquirersMultiple({ enterpriseValue: anEnterprise(), trailingEbit: 0 })).toThrow(
            DomainError,
        );
    });
});
