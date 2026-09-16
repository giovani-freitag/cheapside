export interface ListingConfig {
    /** The B3 ticker, e.g. `PETR4`. */
    ticker: string;
    /** Last close, in BRL. */
    price: number;
    /** Traded value on a typical session, in BRL. */
    typicalTradedValue: number;
    /** How many observations the typical value was taken over — one is a single session. */
    observations: number;
}

/**
 * One tradable share class of a company.
 *
 * A company is one candidate however many classes it has listed, because enterprise value is a
 * property of the enterprise. The classes stay separate only so far as liquidity: a buyer takes
 * a position in one of them, and it is that one's turnover that constrains them.
 */
export class Listing {
    public readonly ticker: string;
    public readonly price: number;
    public readonly typicalTradedValue: number;
    public readonly observations: number;

    constructor(config: ListingConfig) {
        this.ticker = config.ticker;
        this.price = config.price;
        this.typicalTradedValue = config.typicalTradedValue;
        this.observations = config.observations;
    }
}
