import { describe, expect, it } from 'vitest';
import { isNetIncome, isOperatingResult, scaleFactor } from '@/services/cvm/accounts.ts';

describe('isOperatingResult', () => {
    it('recognises the line an industrial company files at 3.05', () => {
        expect(isOperatingResult('Resultado Antes do Resultado Financeiro e dos Tributos')).toBe(true);
    });

    it('rejects the pre-tax profit a bank files at the same code', () => {
        expect(isOperatingResult('Resultado Antes dos Tributos sobre o Lucro')).toBe(false);
    });

    it('rejects the same bank line however it is capitalised', () => {
        expect(isOperatingResult('Resultado antes dos Tributos sobre o Lucro')).toBe(false);
    });

    it('rejects the residual line an insurer files there', () => {
        expect(isOperatingResult('Outras Receitas e Despesas Operacionais')).toBe(false);
    });

    it('reads the line with its accents stripped', () => {
        expect(isOperatingResult('RESULTADO ANTES DO RESULTADO FINANCEIRO E DOS TRIBUTOS')).toBe(true);
    });
});

describe('scaleFactor', () => {
    it('reads a figure filed in thousands as thousands', () => {
        expect(scaleFactor('MIL')).toBe(1_000);
    });

    it('reads a figure filed in units as units', () => {
        expect(scaleFactor('UNIDADE')).toBe(1);
    });
});

describe('isNetIncome', () => {
    it('recognises the bottom line an industrial files at 3.11', () => {
        expect(isNetIncome('Lucro/Prejuízo Consolidado do Período')).toBe(true);
    });

    it('recognises the wordier form a bank files', () => {
        expect(isNetIncome('Lucro ou Prejuízo Líquido Consolidado do Período')).toBe(true);
    });

    it('rejects the subtotal that sits above it', () => {
        expect(isNetIncome('Resultado Líquido das Operações Continuadas')).toBe(false);
    });

    it('rejects the operating line entirely', () => {
        expect(isNetIncome('Resultado Antes do Resultado Financeiro e dos Tributos')).toBe(false);
    });

    it('reads the line with its accents stripped', () => {
        expect(isNetIncome('LUCRO/PREJUIZO CONSOLIDADO DO PERIODO')).toBe(true);
    });
});
