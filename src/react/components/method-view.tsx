import { useFormat } from '@/react/hooks/view/use-format.ts';
import { useServices } from '@/react/hooks/services/use-services.ts';

/**
 * The thresholds the screen applied and where every number came from.
 *
 * They are published beside the ranking rather than in a document nobody opens, because they are
 * choices. A different liquidity floor gives a different list, and a reader who disagrees with
 * the list is often disagreeing with a line on this page.
 */
export function MethodView() {
    const { dataset } = useServices();
    const format = useFormat();
    const { parameters, sources } = dataset.screen;

    return (
        <div className="method">
            <section>
                <h3>O que a tela faz</h3>
                <p className="muted">
                    Ordena as companhias abertas pelo que a empresa inteira custa contra o que ela opera, e
                    publica as {dataset.screen.portfolio.length} do topo. Sem opinião e sem previsão — e, por
                    isso mesmo, com tudo o que entrou no cálculo aberto para discordância.
                </p>
            </section>

            <section>
                <h3>Os parâmetros</h3>
                <p className="muted">
                    Escolhas, não descobertas. Cada uma muda a lista, e a defesa de cada uma está em{' '}
                    <a href="https://github.com/giovani-freitag/cheapside/blob/main/docs/estrategia.md">
                        docs/estrategia.md
                    </a>
                    .
                </p>
                <dl className="method__parameters">
                    <Parameter label="Posições na carteira" value={String(parameters.positions)} />
                    <Parameter label="Peso por posição" value={`${(100 / parameters.positions).toFixed(0)}%`} />
                    <Parameter label="Rebalanceamento" value="Trimestral" />
                    <Parameter label="Chave de ordenação" value="EV / EBIT (12 meses), crescente" />
                    <Parameter label="Piso de liquidez" value={`${format.amount(parameters.liquidityFloor)} por pregão`} />
                    <Parameter
                        label="Teto de alavancagem"
                        value={`Dívida líquida / EBIT ≤ ${parameters.netDebtToEbitCap.toFixed(1)}`}
                    />
                    <Parameter label="EBIT mínimo" value="Maior que zero" />
                    <Parameter
                        label="Demonstração mais antiga aceita"
                        value={`${String(parameters.stalenessCap)} meses`}
                    />
                    <Parameter
                        label="Sobreposição de momentum"
                        value={parameters.momentumOverlay ? `Ligada, sobre os ${String(parameters.momentumShortlist)} mais baratos` : 'Desligada'}
                    />
                </dl>
            </section>

            <section>
                <h3>De onde vêm os números</h3>
                <ul className="method__sources">
                    {sources.map((source) => (
                        <li key={source.name}>
                            <a href={source.url}>{source.name}</a>
                            <p>{source.provides}</p>
                            <p className="faint">Lido em {format.moment(source.retrievedAt)}</p>
                        </li>
                    ))}
                </ul>
            </section>

            <section>
                <h3>O que isto não é</h3>
                <p className="muted">
                    Não é recomendação de investimento, e não é a afirmação de que barato é bom. As vinte
                    mais baratas de qualquer métrica incluem empresas que estão baratas por merecerem
                    estar.
                </p>
                <p className="muted">
                    Separar umas das outras exige ler as demonstrações — as notas de provisões, as
                    transações com partes relacionadas, o parecer do auditor —, que é prosa e não conta.
                    Essa leitura existe aqui: aparece ao lado da posição quando foi feita, e a empresa
                    fica marcada como não lida quando não foi. O que ela nunca faz é mexer no ranking.
                </p>
            </section>
        </div>
    );
}

function Parameter({ label, value }: { label: string; value: string }) {
    return (
        <div className="method__parameter">
            <dt>{label}</dt>
            <dd className="figure">{value}</dd>
        </div>
    );
}
