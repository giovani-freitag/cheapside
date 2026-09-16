import { EXCLUSION_LABEL, EXCLUSION_REASONS, EXCLUSION_SUMMARY } from '@/domain/enums/exclusion-reason.ts';
import { useServices } from '@/react/hooks/services/use-services.ts';

/**
 * Everything the screen removed, by reason, with the names one tap away.
 *
 * The removals are most of the screen: three hundred companies are listed and twenty are
 * published. Drawn as bars against each other they answer a question a list of names cannot —
 * which filter is doing the work — and on this exchange the answer is liquidity, by a distance.
 * The names stay, folded, because the tally is the argument and the list is the evidence.
 */
export function ExclusionsView() {
    const { dataset } = useServices();
    const { tally, universeSize, portfolio } = dataset.screen;
    const worst = Math.max(...EXCLUSION_REASONS.map((reason) => tally[reason]), 1);

    return (
        <div className="exclusions">
            <p className="lede">
                {`Das ${String(universeSize)} empresas operacionais listadas na B3, `}
                {`${String(portfolio.length)} chegaram à carteira. Cada uma das outras saiu por um `}
                motivo, e o motivo está aqui.
            </p>

            {EXCLUSION_REASONS.map((reason) => {
                const removed = dataset.excludedBy(reason);

                return (
                    <section key={reason} className="exclusion">
                        <h3 className="exclusion__head">
                            <span>{EXCLUSION_LABEL[reason]}</span>
                            <span className="exclusion__count figure">{tally[reason]}</span>
                        </h3>
                        <span className="exclusion__bar" aria-hidden>
                            <i style={{ width: `${String((tally[reason] / worst) * 100)}%` }} />
                        </span>
                        <p className="exclusion__why">{EXCLUSION_SUMMARY[reason]}</p>
                        {removed.length === 0 ? (
                            <p className="faint">Nenhuma empresa saiu por este filtro nesta apuração.</p>
                        ) : (
                            <details className="exclusion__names">
                                <summary>{`Ver as ${String(removed.length)} empresas`}</summary>
                                <ul className="exclusion__tickers figure">
                                    {removed.map((row) => (
                                        <li key={row.ticker}>
                                            {row.ticker}
                                            <span className="visually-hidden"> — {row.name}</span>
                                        </li>
                                    ))}
                                </ul>
                            </details>
                        )}
                    </section>
                );
            })}
        </div>
    );
}
