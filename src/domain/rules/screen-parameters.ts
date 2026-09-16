/**
 * Every threshold the screen applies, in one place.
 *
 * They are choices rather than findings, so they travel together, carry their defaults in the
 * open, and are published alongside the ranking they produced.
 */
export interface ScreenParameters {
    /** How many companies the published portfolio holds. */
    positions: number;
    /** Median daily traded value a company's most liquid class must clear, in BRL. */
    liquidityFloor: number;
    /** Turns of trailing operating profit net debt may reach before the company is dropped. */
    netDebtToEbitCap: number;
    /** How old the newest consolidated filing may be, in months. */
    stalenessCap: number;
    /**
     * Whether to re-sort the cheap shortlist by twelve-month momentum.
     *
     * Off by default. It was worth 1.5 points of annual return in the one Brazilian backtest
     * that measured it, which is inside the range where the honest reading is that it might be
     * the fit rather than the effect.
     */
    momentumOverlay: boolean;
    /** How many of the cheapest the momentum overlay re-sorts, when it is on. */
    momentumShortlist: number;
}

/** The published defaults, each argued for in the strategy document. */
export const DEFAULT_PARAMETERS: ScreenParameters = {
    positions: 20,
    liquidityFloor: 1_000_000,
    netDebtToEbitCap: 4,
    stalenessCap: 8,
    momentumOverlay: false,
    momentumShortlist: 40,
};
