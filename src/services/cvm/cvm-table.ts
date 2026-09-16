import { DomainError } from '@/domain/errors/domain-error.ts';

export interface CvmTableConfig {
    /** The whole file, already decoded out of Latin-1. */
    text: string;
}

/**
 * One of the CVM's semicolon-delimited tables, read a row at a time.
 *
 * A year of balance sheets is tens of millions of rows and only a few hundred thousand of them
 * are wanted, so the file is scanned in place rather than split into an array of lines, and rows
 * reach the visitor as raw fields rather than as objects. The caller resolves the columns it
 * needs once, by name, and indexes into each row — which keeps the reading honest about column
 * order without holding the whole file twice over.
 */
export class CvmTable {
    private readonly text: string;
    private readonly columns: ReadonlyMap<string, number>;
    private readonly bodyStart: number;

    constructor(config: CvmTableConfig) {
        this.text = config.text;

        const firstBreak = this.text.indexOf('\n');
        const header = firstBreak === -1 ? this.text : this.text.slice(0, firstBreak);

        this.columns = readHeader(header);
        this.bodyStart = firstBreak === -1 ? this.text.length : firstBreak + 1;
    }

    /**
     * Where a named column sits in every row.
     *
     * @param name - The header as the CVM writes it, e.g. `CD_CONTA`.
     * @returns The zero-based field index.
     * @throws DomainError when the column is absent, which means the file changed shape.
     */
    public column(name: string): number {
        const index = this.columns.get(name);
        if (index === undefined) {
            throw new DomainError(`A coluna "${name}" não existe neste arquivo da CVM.`);
        }

        return index;
    }

    /**
     * Hands every data row to a visitor, header excluded.
     *
     * @param visit - Called once per row with its fields in column order.
     */
    public forEachRow(visit: (fields: readonly string[]) => void): void {
        let cursor = this.bodyStart;

        while (cursor < this.text.length) {
            const lineEnd = this.text.indexOf('\n', cursor);
            const stop = lineEnd === -1 ? this.text.length : lineEnd;
            const line = trimReturn(this.text.slice(cursor, stop));

            if (line.length > 0) visit(line.split(';'));

            cursor = stop + 1;
        }
    }
}

function readHeader(line: string): Map<string, number> {
    const columns = new Map<string, number>();

    trimReturn(line)
        .split(';')
        .forEach((name, index) => columns.set(name.trim(), index));

    return columns;
}

function trimReturn(line: string): string {
    return line.charCodeAt(line.length - 1) === 13 ? line.slice(0, -1) : line;
}
