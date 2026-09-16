import { useCallback, useMemo, useState } from 'react';
import type { RankedRow } from '@/data/schema.ts';
import { useServices } from '@/react/hooks/services/use-services.ts';

/** Which section of the page is open. */
export type ScreenTab = 'portfolio' | 'eligible' | 'excluded' | 'method';

export interface ScreenView {
    tab: ScreenTab;
    openTab: (tab: ScreenTab) => void;
    /** The twenty published positions. */
    portfolio: readonly RankedRow[];
    /** Everything that survived the filters past the portfolio. */
    runnersUp: readonly RankedRow[];
    /** The ticker whose working is unfolded, if any. */
    openTicker?: string;
    toggleTicker: (ticker: string) => void;
}

/**
 * What the page is showing and what the reader has unfolded.
 *
 * One row's working is open at a time. Two open tables of nine figures each stop being a
 * comparison and start being a wall, and the reader who wants both has the whole list a tab away.
 */
export function useScreenView(): ScreenView {
    const { dataset } = useServices();
    const [tab, setTab] = useState<ScreenTab>('portfolio');
    const [openTicker, setOpenTicker] = useState<string>();

    const toggleTicker = useCallback((ticker: string) => {
        setOpenTicker((current) => (current === ticker ? undefined : ticker));
    }, []);

    const rows = useMemo(
        () => ({ portfolio: dataset.screen.portfolio, runnersUp: dataset.runnersUp }),
        [dataset],
    );

    return {
        tab,
        openTab: setTab,
        portfolio: rows.portfolio,
        runnersUp: rows.runnersUp,
        openTicker,
        toggleTicker,
    };
}
