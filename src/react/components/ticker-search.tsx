import type { KeyboardEvent } from 'react';
import { useCallback, useId, useState } from 'react';
import { Search } from 'lucide-react';
import type { SearchHit } from '@/react/hooks/view/use-ticker-search.ts';
import { EXCLUSION_LABEL } from '@/domain/enums/exclusion-reason.ts';
import { Dialog } from '@/react/ui/dialog.tsx';
import { useFormat } from '@/react/hooks/view/use-format.ts';
import { useHotkey } from '@/react/hooks/dom/use-hotkey.ts';
import { useTickerSearch } from '@/react/hooks/view/use-ticker-search.ts';

export interface TickerSearchProps {
    /** Opens the company wherever it landed — the portfolio, the tail, or the removals. */
    onPick: (ticker: string) => void;
}

/** What to say about a hit, on the right of its row. */
function placementOf(hit: SearchHit): string {
    if (hit.placement === 'out') return 'fora';

    return `#${String(hit.rank ?? 0)} ${hit.placement === 'portfolio' ? 'na carteira' : 'ficou perto'}`;
}

/** A ranked company answers with its multiple; a removed one answers with the filter instead. */
function figureOf(hit: SearchHit, multiple: (ratio: number) => string): string {
    if (hit.reason !== undefined) return EXCLUSION_LABEL[hit.reason];

    return hit.multiple === undefined ? '—' : multiple(hit.multiple);
}

/**
 * The ticker box, on ⌘K and on a tap.
 *
 * A reader almost never arrives wanting to browse twenty rows; they arrive with a ticker and one
 * question — is it here, and if not, why not. The index covers all three hundred companies so
 * the answer to the second half is a removal reason rather than an empty result, which is the
 * same promise the rest of the page makes.
 */
export function TickerSearch({ onPick }: TickerSearchProps) {
    const search = useTickerSearch();
    const format = useFormat();
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(0);
    const fieldId = useId();
    const listId = useId();

    const show = useCallback(() => {
        setOpen(true);
    }, []);

    useHotkey('k', show);

    const pick = (ticker: string) => {
        setOpen(false);
        search.ask('');
        setActive(0);
        onPick(ticker);
    };

    const walk = (event: KeyboardEvent<HTMLInputElement>) => {
        if (search.hits.length === 0) return;

        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            const step = event.key === 'ArrowDown' ? 1 : search.hits.length - 1;

            setActive((current) => (current + step) % search.hits.length);
        }

        if (event.key === 'Enter') {
            event.preventDefault();
            const chosen = search.hits[active];

            if (chosen) pick(chosen.ticker);
        }
    };

    return (
        <>
            <button type="button" className="find" aria-label="Buscar ticker" onClick={show}>
                <Search size={14} aria-hidden />
                <span className="find__label">Buscar ticker</span>
                <kbd className="find__key">⌘K</kbd>
            </button>

            <Dialog
                open={open}
                onOpenChange={setOpen}
                title="Buscar companhia"
                description={`Procura nas ${String(search.indexed)} companhias lidas, inclusive nas que ficaram de fora.`}
                className="palette"
            >
                <div className="palette__field">
                    <Search size={15} aria-hidden />
                    <label className="visually-hidden" htmlFor={fieldId}>
                        Ticker ou nome da empresa
                    </label>
                    <input
                        id={fieldId}
                        type="text"
                        role="combobox"
                        aria-expanded={search.hits.length > 0}
                        aria-controls={listId}
                        aria-autocomplete="list"
                        aria-activedescendant={
                            search.hits[active] === undefined ? undefined : `${listId}-${String(active)}`
                        }
                        autoComplete="off"
                        spellCheck={false}
                        placeholder="ticker ou empresa"
                        value={search.query}
                        onChange={(event) => {
                            setActive(0);
                            search.ask(event.target.value);
                        }}
                        onKeyDown={walk}
                    />
                </div>

                {search.hits.length === 0 ? (
                    <p className="palette__empty" role="status">
                        Nenhuma companhia com “{search.query.trim()}” entre as {search.indexed} lidas.
                    </p>
                ) : (
                    <ul className="palette__hits" id={listId} role="listbox" aria-label="Companhias encontradas">
                        {search.hits.map((hit, index) => (
                            <li key={hit.ticker} role="presentation">
                                <button
                                    type="button"
                                    className="hit"
                                    id={`${listId}-${String(index)}`}
                                    role="option"
                                    aria-selected={index === active}
                                    tabIndex={-1}
                                    data-active={index === active}
                                    onMouseEnter={() => {
                                        setActive(index);
                                    }}
                                    onClick={() => {
                                        pick(hit.ticker);
                                    }}
                                >
                                    <span className="hit__id">
                                        <span className="hit__ticker figure">{hit.ticker}</span>
                                        <span className="hit__name">{hit.name}</span>
                                    </span>
                                    <span className="hit__state">
                                        <span className="hit__figure figure">
                                            {figureOf(hit, format.multiple)}
                                        </span>
                                        <span className="hit__where" data-placement={hit.placement}>
                                            {placementOf(hit)}
                                        </span>
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}

                <p className="palette__foot" aria-hidden>
                    <span>↑↓ navegar</span>
                    <span>⏎ abrir a conta</span>
                    <span>esc fechar</span>
                </p>
            </Dialog>
        </>
    );
}
