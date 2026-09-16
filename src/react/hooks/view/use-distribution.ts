import { useMemo } from 'react';
import { useServices } from '@/react/hooks/services/use-services.ts';

/** One bar: how many eligible companies priced inside a one-turn band of the multiple. */
export interface DistributionBin {
    /** Lower edge of the band, in turns of EV/EBIT. */
    from: number;
    count: number;
    /** Whether the whole band sits above the line, and so inside the published portfolio. */
    published: boolean;
}

export interface Distribution {
    bins: readonly DistributionBin[];
    /** The tallest bar, so every bar can be drawn against the same scale. */
    tallest: number;
    /** Upper edge of the horizontal scale, in turns. */
    ceiling: number;
    /** The multiple of the last published position — where the portfolio stops. */
    cut: number;
    /** Where the cut falls along the scale, as a fraction of its width. */
    cutAt: number;
    /** How many companies the chart covers. */
    counted: number;
}

/** Beyond this the bands would be too thin to read, so the last one absorbs the tail. */
const MAX_CEILING = 16;

/**
 * The shape of the eligible list, so the twenty stop being a number without a denominator.
 *
 * The ranking alone cannot answer the question every reader has after reading it — twenty out of
 * how many, and how close was the twenty-first. A histogram of everything that survived the
 * filters answers both at a glance, and it is the only chart on the page that is about the screen
 * rather than about a company.
 */
export function useDistribution(): Distribution {
    const { dataset } = useServices();

    return useMemo(() => {
        const { eligible, portfolio } = dataset.screen;
        const multiples = eligible.map((row) => row.multiple);
        const cut = portfolio.at(-1)?.multiple ?? 0;
        const ceiling = Math.min(Math.ceil(Math.max(...multiples, 1)), MAX_CEILING);
        const counts = new Array<number>(ceiling).fill(0);

        for (const multiple of multiples) {
            const band = Math.min(Math.max(Math.floor(multiple), 0), ceiling - 1);

            counts[band] = (counts[band] ?? 0) + 1;
        }

        return {
            bins: counts.map((count, band) => ({ from: band, count, published: band + 1 <= cut })),
            tallest: Math.max(...counts, 1),
            ceiling,
            cut,
            cutAt: cut / ceiling,
            counted: multiples.length,
        };
    }, [dataset]);
}
