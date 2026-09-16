import type { RankedRow } from '@/data/schema.ts';
import { VerdictNote } from '@/react/components/verdict-note.tsx';
import { useFormat } from '@/react/hooks/view/use-format.ts';

export interface WorkingSheetProps {
    row: RankedRow;
    /** Folds the sheet back up from its own foot, since the row header is a screen above by then. */
    onClose: () => void;
}

/**
 * Every number behind one rank, and where it was struck.
 *
 * This is the part of the page that makes the ranking arguable. A reader who thinks a company
 * does not belong at this position is almost always disagreeing with one of these eight figures,
 * and without them in front of them they can only disagree with the conclusion.
 */
export function WorkingSheet({ row, onClose }: WorkingSheetProps) {
    const format = useFormat();

    const scale = Math.max(row.enterpriseValue, row.trailingEbit);

    return (
        <div className="working">
            <div className="versus">
                <Bar label="Custa" value={row.enterpriseValue} scale={scale} text={format.amount(row.enterpriseValue)} />
                <Bar
                    label="Opera"
                    value={row.trailingEbit}
                    scale={scale}
                    text={format.amount(row.trailingEbit)}
                    strong
                />
                <p className="versus__note">
                    {format.multiple(row.multiple)} é quantos anos de lucro operacional, no ritmo dos últimos
                    doze meses, pagam a firma inteira.
                </p>
            </div>

            <div className="working__grid">
                <Line label="Valor de mercado" value={format.amount(row.marketCapitalisation)} />
                <Line label="+ Dívida bruta" value={format.amount(row.grossDebt)} />
                <Line label="− Caixa e equivalentes" value={format.amount(row.cashAndEquivalents)} />
                <Line label="− Aplicações financeiras" value={format.amount(row.shortTermInvestments)} />
                <Line label="= Dívida líquida" value={format.amount(row.netDebt)} emphasis />
                <Line label="= Valor da firma (EV)" value={format.amount(row.enterpriseValue)} emphasis />
                <Line label="EBIT (12 meses)" value={format.amount(row.trailingEbit)} />
                <Line label="EV / EBIT" value={format.multiple(row.multiple)} emphasis />
                <Line label="Earnings yield" value={format.percent(row.earningsYield)} />
                <Line label="Dívida líquida / EBIT" value={format.multiple(row.netDebtToEbit)} />
                <Line
                    label="P/L"
                    value={row.priceToEarnings === undefined ? '—' : format.multiple(row.priceToEarnings)}
                />
                <Line
                    label="P/VP"
                    value={row.priceToBook === undefined ? '—' : format.multiple(row.priceToBook)}
                />
                <Line label="Preço" value={format.price(row.price)} />
                <Line label="Giro típico" value={format.amount(row.medianDailyVolume)} />
            </div>

            <dl className="working__provenance">
                <div>
                    <dt>EBIT acumulado até</dt>
                    <dd>
                        {format.date(row.earningsThrough)}
                        {row.interimAdjusted ? null : ' — exercício fechado, sem trimestre posterior'}
                    </dd>
                </div>
                <div>
                    <dt>Balanço de</dt>
                    <dd>{format.date(row.balanceSheetAt)}</dd>
                </div>
                <div>
                    <dt>CNPJ</dt>
                    <dd className="figure">{row.cnpj}</dd>
                </div>
                <div>
                    <dt>Classes listadas</dt>
                    <dd className="figure">{row.tickers.join(', ')}</dd>
                </div>
            </dl>

            <VerdictNote ticker={row.ticker} earningsThrough={row.earningsThrough} />

            <button type="button" className="working__close" onClick={onClose}>
                {`Fechar a conta de ${row.ticker}`}
            </button>
        </div>
    );
}

/**
 * Two bars on one scale: what the firm costs against what it earns in a year.
 *
 * It is the multiple before the division — a reader sees that the lower bar is nearly as long as
 * the upper one and has understood 0,97× without reading a figure.
 */
function Bar({
    label,
    value,
    scale,
    text,
    strong,
}: {
    label: string;
    value: number;
    scale: number;
    text: string;
    strong?: boolean;
}) {
    return (
        <div className="versus__row">
            <span className="versus__label label">{label}</span>
            <span className="versus__bar" data-strong={strong ?? false} aria-hidden>
                <i style={{ width: `${String(Math.max((value / scale) * 100, 0))}%` }} />
            </span>
            <b className="versus__figure figure">{text}</b>
        </div>
    );
}

function Line({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
    return (
        <div className={emphasis ? 'working__line working__line--strong' : 'working__line'}>
            <span className="working__label">{label}</span>
            <span className="working__value figure">{value}</span>
        </div>
    );
}
