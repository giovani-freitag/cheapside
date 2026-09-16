import { DomainError } from '@/domain/errors/domain-error.ts';

const DIGITS = 14;

/**
 * The join key between the three sources, normalised once.
 *
 * CVM writes it punctuated, B3 writes it as bare digits with leading zeros dropped, and nothing
 * else in either dataset identifies the same legal entity across both. Getting this wrong does
 * not raise an error anywhere — it quietly drops companies from the universe — so it is a type.
 */
export class Cnpj {
    private readonly digits: string;

    private constructor(digits: string) {
        this.digits = digits;
    }

    /**
     * Reads a CNPJ in any of the shapes the sources write it in.
     *
     * @param raw - Punctuated, bare, or short of its leading zeros.
     * @returns The normalised number.
     * @throws DomainError when the value holds no usable digits or too many.
     */
    public static parse(raw: string): Cnpj {
        const digits = raw.replace(/\D/g, '');
        if (digits.length === 0 || digits.length > DIGITS) {
            throw new DomainError(`"${raw}" não é um CNPJ.`);
        }

        return new Cnpj(digits.padStart(DIGITS, '0'));
    }

    /** Reads a CNPJ, or reports that it could not, for sources that carry placeholder rows. */
    public static tryParse(raw: string): Cnpj | undefined {
        try {
            return Cnpj.parse(raw);
        } catch {
            return undefined;
        }
    }

    /** The fourteen digits, which identify one establishment of one company. */
    public get key(): string {
        return this.digits;
    }

    /**
     * The first eight digits, which identify the company itself.
     *
     * Establishments of one company share the root and differ in the branch digits, and the
     * sources do not agree on which establishment to name: B3 lists Tupy under its third
     * establishment and the CVM files its statements under its first. Joining on the full number
     * drops such a company from the universe without a word, so the join runs on the root.
     */
    public get root(): string {
        return this.digits.slice(0, 8);
    }

    /** The punctuated form, for display. */
    public toString(): string {
        const d = this.digits;

        return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
    }
}
