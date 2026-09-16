import type { CSSProperties } from 'react';
import { Fragment, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import type { RankedRow } from '@/data/schema.ts';
import { WorkingSheet } from '@/react/components/working-sheet.tsx';
import { useFormat } from '@/react/hooks/view/use-format.ts';

export interface RankTableProps {
    rows: readonly RankedRow[];
    /** Accessible name, since two tables of the same shape appear on the page. */
    label: string;
    openTicker?: string;
    onToggle: (ticker: string) => void;
}

/**
 * The ranking, with each row's working one click below it.
 *
 * The multiple is the only column that ranks. The two beside it are its numerator and
 * denominator, and P/L and P/VP are there to disagree with it — a company cheap on one and dear
 * on the other is telling the reader where its debt is. As the page narrows the context drops
 * away and the row folds into three lines, but the enterprise value stays under the multiple and
 * the yield bar becomes the rule under the whole row — the ranking drawn to scale, which is the
 * one comparison between rows that a phone still affords.
 */
export function RankTable({ rows, label, openTicker, onToggle }: RankTableProps) {
    const format = useFormat();
    const openRow = useRef<HTMLTableRowElement>(null);
    const best = Math.max(...rows.map((row) => row.earningsYield), 0);

    /* A row opened from somewhere else — the search, say — is usually below the fold. */
    useEffect(() => {
        if (openTicker !== undefined) openRow.current?.scrollIntoView({ block: 'center' });
    }, [openTicker]);

    return (
        <div className="table-scroll">
            <table className="rank-table" role="table">
                <caption className="visually-hidden">{label}</caption>
                <thead role="rowgroup">
                    <tr role="row">
                        <th role="columnheader" scope="col" className="rank-table__rank">
                            #
                        </th>
                        <th role="columnheader" scope="col">Empresa</th>
                        <th role="columnheader" scope="col" className="rank-table__number">
                            EV/EBIT
                        </th>
                        <th role="columnheader" scope="col" className="rank-table__number">
                            EBIT 12m
                        </th>
                        <th role="columnheader" scope="col" className="rank-table__number">
                            Valor da firma
                        </th>
                        <th role="columnheader" scope="col" className="rank-table__number rank-table__extra">
                            P/L
                        </th>
                        <th role="columnheader" scope="col" className="rank-table__number rank-table__extra">
                            P/VP
                        </th>
                        <th role="columnheader" scope="col">
                            <span className="visually-hidden">Abrir a conta</span>
                        </th>
                    </tr>
                </thead>
                <tbody role="rowgroup">
                    {rows.map((row) => {
                        const open = openTicker === row.ticker;
                        const share = { '--yield': `${String((row.earningsYield / best) * 100)}%` } as CSSProperties;

                        return (
                            <Fragment key={row.ticker}>
                                <tr
                                    role="row"
                                    ref={open ? openRow : undefined}
                                    style={share}
                                    className={open ? 'rank-table__row rank-table__row--open' : 'rank-table__row'}
                                >
                                    <td role="cell" className="rank-table__rank figure">{row.rank}</td>
                                    <td role="cell" className="rank-table__company">
                                        <span className="rank-table__ticker figure">{row.ticker}</span>
                                        <span className="rank-table__name">{row.name}</span>
                                        <span className="rank-table__yield" aria-hidden>
                                            <i style={{ width: 'var(--yield)' }} />
                                        </span>
                                        <span className="rank-table__sector faint">
                                            <span className="rank-table__share">
                                                {format.percent(row.earningsYield)} sobre o preço ·{' '}
                                            </span>
                                            {row.sector}
                                        </span>
                                    </td>
                                    <td role="cell" className="rank-table__number figure rank-table__multiple">
                                        {format.multiple(row.multiple)}
                                    </td>
                                    <td role="cell" className="rank-table__number figure rank-table__ebit">
                                        {format.amount(row.trailingEbit)}
                                    </td>
                                    <td role="cell" className="rank-table__number figure rank-table__ev">
                                        {format.amount(row.enterpriseValue)}
                                    </td>
                                    <td role="cell" className="rank-table__number figure rank-table__extra">
                                        {row.priceToEarnings === undefined ? '—' : format.multiple(row.priceToEarnings)}
                                    </td>
                                    <td role="cell" className="rank-table__number figure rank-table__extra">
                                        {row.priceToBook === undefined ? '—' : format.multiple(row.priceToBook)}
                                    </td>
                                    <td role="cell" className="rank-table__toggle">
                                        <button
                                            type="button"
                                            aria-expanded={open}
                                            onClick={() => {
                                                onToggle(row.ticker);
                                            }}
                                        >
                                            <ChevronDown size={16} aria-hidden />
                                            <span className="visually-hidden">
                                                {open ? `Fechar a conta de ${row.ticker}` : `Ver a conta de ${row.ticker}`}
                                            </span>
                                        </button>
                                    </td>
                                </tr>
                                {open ? (
                                    <tr role="row" className="rank-table__working">
                                        <td role="cell" colSpan={8}>
                                            <WorkingSheet
                                                row={row}
                                                onClose={() => {
                                                    onToggle(row.ticker);
                                                }}
                                            />
                                        </td>
                                    </tr>
                                ) : null}
                            </Fragment>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
