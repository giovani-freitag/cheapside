import { Fragment } from 'react';
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
 * on the other is telling the reader where its debt is. Both context pairs drop out as the page
 * narrows, because everything they hold is repeated in the fold.
 */
export function RankTable({ rows, label, openTicker, onToggle }: RankTableProps) {
    const format = useFormat();

    return (
        <div className="table-scroll">
            <table className="rank-table">
                <caption className="visually-hidden">{label}</caption>
                <thead>
                    <tr>
                        <th scope="col" className="rank-table__rank">
                            #
                        </th>
                        <th scope="col">Empresa</th>
                        <th scope="col" className="rank-table__number">
                            EV/EBIT
                        </th>
                        <th scope="col" className="rank-table__number rank-table__wide">
                            EBIT 12m
                        </th>
                        <th scope="col" className="rank-table__number rank-table__wide">
                            Valor da firma
                        </th>
                        <th scope="col" className="rank-table__number rank-table__extra">
                            P/L
                        </th>
                        <th scope="col" className="rank-table__number rank-table__extra">
                            P/VP
                        </th>
                        <th scope="col">
                            <span className="visually-hidden">Abrir a conta</span>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => {
                        const open = openTicker === row.ticker;

                        return (
                            <Fragment key={row.ticker}>
                                <tr className={open ? 'rank-table__row rank-table__row--open' : 'rank-table__row'}>
                                    <td className="rank-table__rank figure">{row.rank}</td>
                                    <td>
                                        <span className="rank-table__ticker figure">{row.ticker}</span>
                                        <span className="rank-table__name">{row.name}</span>
                                        <span className="rank-table__sector faint">{row.sector}</span>
                                    </td>
                                    <td className="rank-table__number figure rank-table__multiple">
                                        {format.multiple(row.multiple)}
                                    </td>
                                    <td className="rank-table__number figure rank-table__wide">{format.amount(row.trailingEbit)}</td>
                                    <td className="rank-table__number figure rank-table__wide">
                                        {format.amount(row.enterpriseValue)}
                                    </td>
                                    <td className="rank-table__number figure rank-table__extra">
                                        {row.priceToEarnings === undefined ? '—' : format.multiple(row.priceToEarnings)}
                                    </td>
                                    <td className="rank-table__number figure rank-table__extra">
                                        {row.priceToBook === undefined ? '—' : format.multiple(row.priceToBook)}
                                    </td>
                                    <td className="rank-table__toggle">
                                        <button
                                            type="button"
                                            aria-expanded={open}
                                            onClick={() => {
                                                onToggle(row.ticker);
                                            }}
                                        >
                                            <ChevronDown size={16} aria-hidden />
                                            <span className="visually-hidden">
                                                {`Ver a conta de ${row.ticker}`}
                                            </span>
                                        </button>
                                    </td>
                                </tr>
                                {open ? (
                                    <tr className="rank-table__working">
                                        <td colSpan={8}>
                                            <WorkingSheet row={row} />
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
