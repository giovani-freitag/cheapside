import { EXCLUSION_REASONS, EXCLUSION_SUMMARY } from '@/domain/enums/exclusion-reason.ts';
import { useServices } from '@/react/hooks/services/use-services.ts';

/**
 * Everything the screen removed, by reason, with the names.
 *
 * The removals are most of the screen. Three hundred companies are listed and twenty are
 * published; a reader who cannot see which two hundred and eighty went where, and why, is being
 * asked to trust a filter rather than to check one.
 */
export function ExclusionsView() {
    const { dataset } = useServices();
    const { tally, universeSize, portfolio } = dataset.screen;

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
                        <header className="exclusion__header">
                            <h3>
                                {EXCLUSION_SUMMARY[reason]}
                                <span className="exclusion__count figure">{tally[reason]}</span>
                            </h3>
                        </header>
                        {removed.length === 0 ? (
                            <p className="faint">Nenhuma empresa saiu por este filtro nesta apuração.</p>
                        ) : (
                            <ul className="exclusion__tickers figure">
                                {removed.map((row) => (
                                    <li key={row.ticker} title={row.name}>
                                        {row.ticker}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                );
            })}
        </div>
    );
}
