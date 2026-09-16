import { useCallback, useMemo, useState } from 'react';
import type { RankedRow } from '@/data/schema.ts';
import { useServices } from '@/react/hooks/services/use-services.ts';

/** Which section of the page is open. */
export type ScreenTab = 'portfolio' | 'eligible' | 'excluded' | 'method';

/** The sector choice, where nothing chosen means every sector. */
export const ALL_SECTORS = 'todos';

export interface ScreenView {
    tab: ScreenTab;
    openTab: (tab: ScreenTab) => void;
    /** Every sector present in the eligible list, alphabetically, with the all-sectors choice first. */
    sectors: readonly string[];
    sector: string;
    chooseSector: (sector: string) => void;
    /** The twenty published positions, narrowed to the chosen sector. */
    portfolio: readonly RankedRow[];
    /** Everything that survived the filters past the portfolio, narrowed the same way. */
    runnersUp: readonly RankedRow[];
    /** The ticker whose working is unfolded, if any. */
    openTicker?: string;
    toggleTicker: (ticker: string) => void;
}

/**
 * What the page is showing and what the reader has unfolded.
 *
 * The sector choice narrows what is displayed and never re-ranks: position 7 stays position 7
 * when the others are hidden. A filter that renumbered would be quietly inventing a different
 * screen — one that ranks within a sector — and the reader would have no way to tell.
 *
 * One row's working is open at a time. Two open tables of twelve figures each stop being a
 * comparison and start being a wall.
 */
export function useScreenView(): ScreenView {
    const { dataset } = useServices();
    const [tab, setTab] = useState<ScreenTab>('portfolio');
    const [sector, setSector] = useState<string>(ALL_SECTORS);
    const [openTicker, setOpenTicker] = useState<string>();

    const toggleTicker = useCallback((ticker: string) => {
        setOpenTicker((current) => (current === ticker ? undefined : ticker));
    }, []);

    const sectors = useMemo(() => {
        const present = new Set(dataset.screen.eligible.map((row) => row.sector).filter(Boolean));

        return [ALL_SECTORS, ...[...present].sort((a, b) => a.localeCompare(b, 'pt-BR'))];
    }, [dataset]);

    const rows = useMemo(() => {
        const keep = (row: RankedRow) => sector === ALL_SECTORS || row.sector === sector;

        return {
            portfolio: dataset.screen.portfolio.filter(keep),
            runnersUp: dataset.runnersUp.filter(keep),
        };
    }, [dataset, sector]);

    return {
        tab,
        openTab: setTab,
        sectors,
        sector,
        chooseSector: setSector,
        portfolio: rows.portfolio,
        runnersUp: rows.runnersUp,
        openTicker,
        toggleTicker,
    };
}
