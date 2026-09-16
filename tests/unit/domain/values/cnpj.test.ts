import { describe, expect, it } from 'vitest';
import { Cnpj } from '@/domain/values/cnpj.ts';
import { DomainError } from '@/domain/errors/domain-error.ts';

describe('Cnpj', () => {
    it('reads a punctuated number', () => {
        const cnpj = Cnpj.parse('33.000.167/0001-01');

        expect(cnpj.key).toBe('33000167000101');
    });

    it('reads the same number written bare', () => {
        const cnpj = Cnpj.parse('33000167000101');

        expect(cnpj.key).toBe('33000167000101');
    });

    it('restores leading zeros the sources drop', () => {
        const cnpj = Cnpj.parse('5351887000186');

        expect(cnpj.key).toBe('05351887000186');
    });

    it('gives two establishments of one company the same root', () => {
        const listed = Cnpj.parse('84683374000300');
        const filing = Cnpj.parse('84.683.374/0001-49');

        expect(listed.root).toBe(filing.root);
    });

    it('gives two different companies different roots', () => {
        const tupy = Cnpj.parse('84683374000300');
        const dohler = Cnpj.parse('84683408000103');

        expect(tupy.root).not.toBe(dohler.root);
    });

    it('writes itself back punctuated', () => {
        const cnpj = Cnpj.parse('33000167000101');

        expect(cnpj.toString()).toBe('33.000.167/0001-01');
    });

    it('refuses a value with no digits', () => {
        expect(() => Cnpj.parse('n/a')).toThrow(DomainError);
    });

    it('refuses a value with too many digits', () => {
        expect(() => Cnpj.parse('330001670001011')).toThrow(DomainError);
    });

    it('reports rather than throws on a placeholder row', () => {
        const cnpj = Cnpj.tryParse('');

        expect(cnpj).toBeUndefined();
    });
});
