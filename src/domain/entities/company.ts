import type { IssuerStatus } from '@/domain/enums/issuer-status.ts';
import type { Cnpj } from '@/domain/values/cnpj.ts';
import type { Listing } from '@/domain/entities/listing.ts';
import { DomainError } from '@/domain/errors/domain-error.ts';

export interface CompanyConfig {
    cnpj: Cnpj;
    /** The CVM registration number, which is how the filings address the company. */
    cvmCode: string;
    /** Corporate name as the registry writes it. */
    legalName: string;
    /** The short name B3 trades it under. */
    tradingName: string;
    /** The sector label, kept for display rather than for filtering. */
    sector: string;
    status: IssuerStatus;
    /** Every share class, valued together, quoted one at a time. */
    marketCapitalisation: number;
    listings: readonly Listing[];
}

/**
 * One legal entity, with every share class B3 lists for it.
 *
 * The screen ranks companies rather than tickers. A company with an ON and a PN class appears
 * once, at one market capitalisation covering both — the two classes are two claims on the same
 * enterprise, and adding their values would count that enterprise twice.
 */
export class Company {
    public readonly cnpj: Cnpj;
    public readonly cvmCode: string;
    public readonly legalName: string;
    public readonly tradingName: string;
    public readonly sector: string;
    public readonly status: IssuerStatus;
    public readonly marketCapitalisation: number;
    public readonly listings: readonly Listing[];

    constructor(config: CompanyConfig) {
        if (config.listings.length === 0) {
            throw new DomainError(`A empresa ${config.tradingName} não tem nenhuma classe listada.`);
        }

        this.cnpj = config.cnpj;
        this.cvmCode = config.cvmCode;
        this.legalName = config.legalName;
        this.tradingName = config.tradingName;
        this.sector = config.sector;
        this.status = config.status;
        this.marketCapitalisation = config.marketCapitalisation;
        this.listings = config.listings;
    }

    /** The class a position would actually be taken in, and the one the table quotes. */
    public get primaryListing(): Listing {
        return this.listings.reduce((best, listing) =>
            listing.typicalTradedValue > best.typicalTradedValue ? listing : best,
        );
    }

    /** Turnover of the class a buyer would use, which is the only one that constrains them. */
    public get tradableVolume(): number {
        return this.primaryListing.typicalTradedValue;
    }
}
