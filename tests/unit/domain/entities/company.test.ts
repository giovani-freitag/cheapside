import { describe, expect, it } from 'vitest';
import { Cnpj } from '@/domain/values/cnpj.ts';
import { Company } from '@/domain/entities/company.ts';
import { DomainError } from '@/domain/errors/domain-error.ts';
import { Listing } from '@/domain/entities/listing.ts';

function aListing(ticker: string, tradedValue: number): Listing {
    return new Listing({ ticker, price: 10, typicalTradedValue: tradedValue, observations: 3 });
}

function aCompany(listings: readonly Listing[]): Company {
    return new Company({
        cnpj: Cnpj.parse('33.000.167/0001-01'),
        cvmCode: '9512',
        legalName: 'PETROLEO BRASILEIRO S.A. PETROBRAS',
        tradingName: 'PETROBRAS',
        sector: 'Energy Minerals',
        status: 'operational',
        marketCapitalisation: 663_000_000_000,
        listings,
    });
}

describe('Company', () => {
    it('quotes the class that actually trades', () => {
        const company = aCompany([aListing('PETR3', 500_000_000), aListing('PETR4', 2_300_000_000)]);

        expect(company.primaryListing.ticker).toBe('PETR4');
    });

    it('measures liquidity on the class a buyer would use', () => {
        const company = aCompany([aListing('PETR3', 500_000_000), aListing('PETR4', 2_300_000_000)]);

        expect(company.tradableVolume).toBe(2_300_000_000);
    });

    it('values two share classes at one market capitalisation', () => {
        const company = aCompany([aListing('PETR3', 500_000_000), aListing('PETR4', 2_300_000_000)]);

        expect(company.marketCapitalisation).toBe(663_000_000_000);
    });

    it('refuses a company with nothing listed', () => {
        expect(() => aCompany([])).toThrow(DomainError);
    });
});
