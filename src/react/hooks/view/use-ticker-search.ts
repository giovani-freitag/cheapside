import { useMemo, useState } from 'react';
import type { ExclusionReason } from '@/domain/enums/exclusion-reason.ts';
import { useServices } from '@/react/hooks/services/use-services.ts';

/** Where a company ended up: published, eligible but below the line, or removed by a filter. */
export type Placement = 'portfolio' | 'near' | 'out';

export interface SearchHit {
    ticker: string;
    name: string;
    placement: Placement;
    /** Position in the eligible ranking, for anything that was ranked at all. */
    rank?: number;
    multiple?: number;
    /** Which filter removed it, for anything that was not. */
    reason?: ExclusionReason;
}

export interface TickerSearch {
    query: string;
    ask: (query: string) => void;
    /** What matches, cheapest first, capped at what a palette can show without scrolling. */
    hits: readonly SearchHit[];
    /** How many companies the index covers, matched or not. */
    indexed: number;
}

const SHOWN = 8;

/** Folds accents and case away, so "petrobras" finds PETROBRÁS. */
function fold(value: string): string {
    return value
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toUpperCase();
}

/**
 * Search over every listed company, not only the published twenty.
 *
 * A reader arrives with a ticker in mind, and the honest answer is as often "it was removed, for
 * this reason" as it is a position. Indexing only the portfolio would let the page answer the
 * easy third of the question and stay silent on the rest, which is the opposite of what the
 * screen claims to do. The whole index is already in the bundle, so the search costs no request.
 */
export function useTickerSearch(): TickerSearch {
    const { dataset } = useServices();
    const [query, setQuery] = useState('');

    const index = useMemo(() => {
        const { portfolio, eligible, excluded } = dataset.screen;
        const published = new Set(portfolio.map((row) => row.ticker));

        const ranked: SearchHit[] = eligible.map((row) => ({
            ticker: row.ticker,
            name: row.name,
            placement: published.has(row.ticker) ? 'portfolio' : 'near',
            rank: row.rank,
            multiple: row.multiple,
        }));

        const removed: SearchHit[] = excluded.map((row) => ({
            ticker: row.ticker,
            name: row.name,
            placement: 'out',
            reason: row.reason,
        }));

        return [...ranked, ...removed];
    }, [dataset]);

    const hits = useMemo(() => {
        const needle = fold(query.trim());

        if (needle === '') return index.slice(0, SHOWN);

        return index
            .filter((hit) => fold(hit.ticker).includes(needle) || fold(hit.name).includes(needle))
            .slice(0, SHOWN);
    }, [index, query]);

    return { query, ask: setQuery, hits, indexed: index.length };
}
