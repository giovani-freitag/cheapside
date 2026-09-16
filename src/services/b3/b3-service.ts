import { Cnpj } from '@/domain/values/cnpj.ts';
import { DomainError } from '@/domain/errors/domain-error.ts';

export interface B3ServiceConfig {
    /** The listed-companies endpoint, without a trailing slash. */
    baseUrl: string;
    /**
     * How many records a page asks for.
     *
     * The service returns an empty page above roughly 150 rather than an error, so this stays
     * well below that: a silent empty page would look like the end of the list.
     */
    pageSize?: number;
}

/** One issuer as B3 lists it, reduced to the identity the screen needs. */
export interface ListedIssuer {
    /** The four-letter root every one of the issuer's tickers starts with, e.g. `PETR`. */
    root: string;
    cnpj: Cnpj;
    companyName: string;
    tradingName: string;
    /** B3's own sector label for the issuer. */
    segment: string;
}

/**
 * B3's registry of listed issuers, which is the bridge between tickers and filings.
 *
 * Nothing else joins the two worlds. Quotes arrive under a ticker and filings arrive under a
 * CNPJ, and only this registry says that `PETR4` and `33.000.167/0001-01` are the same company.
 */
export class B3Service {
    private readonly baseUrl: string;
    private readonly pageSize: number;

    constructor(config: B3ServiceConfig) {
        this.baseUrl = config.baseUrl;
        this.pageSize = config.pageSize ?? 120;
    }

    /**
     * Reads the whole registry.
     *
     * @returns Every listed issuer, keyed by its four-letter ticker root.
     * @throws DomainError when a page cannot be read, since a partial registry silently drops
     *         companies from the universe rather than failing.
     */
    public async fetchIssuers(): Promise<Map<string, ListedIssuer>> {
        const issuers = new Map<string, ListedIssuer>();
        const first = await this.page(1);
        const pages = first.page.totalPages ?? 1;

        collect(first.results, issuers);

        for (let number = 2; number <= pages; number += 1) {
            collect((await this.page(number)).results, issuers);
        }

        return issuers;
    }

    private async page(number: number): Promise<B3Page> {
        const query = { language: 'pt-br', pageNumber: number, pageSize: this.pageSize };
        const encoded = base64(JSON.stringify(query));
        const response = await fetch(`${this.baseUrl}/${encoded}`);

        if (!response.ok) {
            throw new DomainError(`A B3 respondeu ${String(response.status)} para a página ${String(number)}.`);
        }

        return (await response.json()) as B3Page;
    }
}

/** The shape B3's proxy answers with, named only so the parsing below can be read. */
interface B3Page {
    page: { totalPages: number | null };
    results: readonly {
        issuingCompany?: string;
        companyName?: string;
        tradingName?: string;
        cnpj?: string;
        segment?: string;
        status?: string;
    }[];
}

function collect(results: B3Page['results'], into: Map<string, ListedIssuer>): void {
    for (const record of results) {
        const root = record.issuingCompany?.trim().toUpperCase();
        const cnpj = record.cnpj ? Cnpj.tryParse(record.cnpj) : undefined;

        // Placeholder rows carry a CNPJ of `0`, which parses to a number no company holds.
        if (!root || !cnpj || record.cnpj === '0') continue;

        into.set(root, {
            root,
            cnpj,
            companyName: record.companyName?.trim() ?? root,
            tradingName: record.tradingName?.trim() ?? root,
            segment: record.segment?.trim() ?? '',
        });
    }
}

function base64(value: string): string {
    const bytes = new TextEncoder().encode(value);
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);

    return btoa(binary);
}
