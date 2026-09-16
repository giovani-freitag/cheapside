import { useMemo } from 'react';

export interface Formatters {
    /** A large amount, abbreviated to the unit a reader can hold in their head. */
    amount: (brl: number) => string;
    /** A share price. */
    price: (brl: number) => string;
    /** A multiple, to two places. */
    multiple: (ratio: number) => string;
    /** A ratio as a percentage. */
    percent: (fraction: number) => string;
    /** A date written out. */
    date: (iso: string) => string;
    /** A date and time, for the build stamp. */
    moment: (iso: string) => string;
}

const LOCALE = 'pt-BR';

/**
 * Number and date formatting, built once.
 *
 * Amounts are abbreviated rather than written in full: an enterprise value of twenty-two billion
 * reais is a quantity a reader compares, not one they read digit by digit, and eleven digits in
 * a table column defeat both.
 */
export function useFormat(): Formatters {
    return useMemo(() => {
        const price = new Intl.NumberFormat(LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const ratio = new Intl.NumberFormat(LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const percent = new Intl.NumberFormat(LOCALE, { style: 'percent', maximumFractionDigits: 1 });
        const day = new Intl.DateTimeFormat(LOCALE, { day: '2-digit', month: 'short', year: 'numeric' });
        const moment = new Intl.DateTimeFormat(LOCALE, { dateStyle: 'medium', timeStyle: 'short' });

        return {
            amount: (brl) => abbreviate(brl),
            price: (brl) => `R$ ${price.format(brl)}`,
            multiple: (value) => `${ratio.format(value)}×`,
            percent: (fraction) => percent.format(fraction),
            date: (iso) => day.format(new Date(iso)),
            moment: (iso) => moment.format(new Date(iso)),
        };
    }, []);
}

function abbreviate(brl: number): string {
    const magnitude = Math.abs(brl);
    const sign = brl < 0 ? '−' : '';

    if (magnitude >= 1e9) return `${sign}R$ ${(magnitude / 1e9).toFixed(1)} bi`;
    if (magnitude >= 1e6) return `${sign}R$ ${(magnitude / 1e6).toFixed(0)} mi`;
    if (magnitude >= 1e3) return `${sign}R$ ${(magnitude / 1e3).toFixed(0)} mil`;

    return `${sign}R$ ${magnitude.toFixed(0)}`;
}
