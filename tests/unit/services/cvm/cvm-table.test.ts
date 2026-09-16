import { describe, expect, it } from 'vitest';
import { CvmTable } from '@/services/cvm/cvm-table.ts';
import { DomainError } from '@/domain/errors/domain-error.ts';

const FILE = [
    'CNPJ_CIA;DT_REFER;CD_CONTA;VL_CONTA;ST_CONTA_FIXA',
    '07.175.725/0001-60;2026-06-30;3.05;1848752.0000000000;S',
    '84.683.374/0001-49;2026-06-30;3.05;-42000.0000000000;S',
    '',
].join('\r\n');

describe('CvmTable', () => {
    it('finds a column by the name the CVM writes', () => {
        const table = new CvmTable({ text: FILE });

        expect(table.column('VL_CONTA')).toBe(3);
    });

    it('refuses a column the file does not have', () => {
        const table = new CvmTable({ text: FILE });

        expect(() => table.column('DS_CONTA')).toThrow(DomainError);
    });

    it('hands over every data row and no header', () => {
        const table = new CvmTable({ text: FILE });
        const rows: (readonly string[])[] = [];

        table.forEachRow((fields) => {
            rows.push(fields);
        });

        expect(rows).toHaveLength(2);
    });

    it('strips the carriage return off the last field of a row', () => {
        const table = new CvmTable({ text: FILE });
        const last: string[] = [];

        table.forEachRow((fields) => {
            last.push(fields[4] ?? '');
        });

        expect(last).toEqual(['S', 'S']);
    });

    it('reads an amount without the newline attached', () => {
        const table = new CvmTable({ text: FILE });
        const amounts: number[] = [];

        table.forEachRow((fields) => {
            amounts.push(Number.parseFloat(fields[3] ?? ''));
        });

        expect(amounts).toEqual([1848752, -42000]);
    });

    it('holds no rows for a file that is only a header', () => {
        const table = new CvmTable({ text: 'CNPJ_CIA;VL_CONTA\n' });
        const rows: (readonly string[])[] = [];

        table.forEachRow((fields) => {
            rows.push(fields);
        });

        expect(rows).toEqual([]);
    });
});
