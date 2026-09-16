/** Traded value per ticker on one session, in BRL. */
export interface LiquidityObservation {
    /** Session date, `YYYY-MM-DD`. */
    on: string;
    tradedValue: Readonly<Record<string, number>>;
}

/** The rolling record of turnover the screen measures liquidity against. */
export interface LiquidityHistory {
    observations: readonly LiquidityObservation[];
}

/** How liquid one share class is, and how much evidence that rests on. */
export interface TypicalTurnover {
    /** Median traded value across the observations held, in BRL. */
    value: number;
    /** How many sessions went into the median. One means a single day, and says so. */
    observations: number;
}
