import { DomainError } from '@/domain/errors/domain-error.ts';

export interface QuotesServiceConfig {
    /** The quote-list endpoint, without a trailing slash. */
    baseUrl: string;
}

/** One share class as the market closed it. */
export interface Quote {
    ticker: string;
    /** The four-letter root that joins the quote to an issuer. */
    root: string;
    name: string;
    sector: string;
    /** Last close, in BRL. */
    price: number;
    /** Shares traded on the session. */
    shareVolume: number;
    /**
     * Market capitalisation of the whole company, in BRL.
     *
     * The source reports it per company rather than per class, so every class of one issuer
     * carries the same figure and summing them would value the enterprise twice over.
     */
    marketCapitalisation: number;
}

/**
 * Closing prices and turnover for every share class B3 trades.
 *
 * The list endpoint is the one part of the provider that answers without a token, which is what
 * makes the whole pipeline runnable from a public repository — a token would have to live in the
 * bundle to be reachable from a browser, and in a repository to be reachable from CI.
 */
export class QuotesService {
    private readonly baseUrl: string;

    constructor(config: QuotesServiceConfig) {
        this.baseUrl = config.baseUrl;
    }

    /**
     * Reads the closing quote for every ordinary share class.
     *
     * Fractional-lot tickers are dropped: they end in `F`, quote the same company at a slightly
     * different price, and their turnover is a rounding error that would distort a liquidity
     * floor rather than inform it.
     *
     * @returns One quote per share class, keyed by ticker.
     * @throws DomainError when the provider refuses or answers with nothing.
     */
    public async fetchQuotes(): Promise<Map<string, Quote>> {
        const response = await fetch(`${this.baseUrl}/quote/list`);
        if (!response.ok) {
            throw new DomainError(`O provedor de cotações respondeu ${String(response.status)}.`);
        }

        const payload = (await response.json()) as QuoteListPayload;
        const quotes = new Map<string, Quote>();

        for (const record of payload.stocks ?? []) {
            const ticker = record.stock?.trim().toUpperCase();
            if (!ticker || record.type !== 'stock' || isFractionalLot(ticker)) continue;
            if (typeof record.close !== 'number' || typeof record.market_cap !== 'number') continue;

            quotes.set(ticker, {
                ticker,
                root: ticker.slice(0, 4),
                name: record.name?.trim() ?? ticker,
                sector: record.sector?.trim() ?? '',
                price: record.close,
                shareVolume: record.volume ?? 0,
                marketCapitalisation: record.market_cap,
            });
        }

        if (quotes.size === 0) {
            throw new DomainError('O provedor de cotações devolveu uma lista vazia.');
        }

        return quotes;
    }
}

/** The shape the provider answers with, named only so the parsing above can be read. */
interface QuoteListPayload {
    stocks?: readonly {
        stock?: string;
        name?: string;
        sector?: string | null;
        close?: number;
        volume?: number;
        market_cap?: number | null;
        type?: string;
    }[];
}

function isFractionalLot(ticker: string): boolean {
    return ticker.length > 5 && ticker.endsWith('F');
}
