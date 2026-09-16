import { ExclusionsView } from '@/react/components/exclusions-view.tsx';
import { MethodView } from '@/react/components/method-view.tsx';
import { RankTable } from '@/react/components/rank-table.tsx';
import { SectorPicker } from '@/react/components/sector-picker.tsx';
import { TabPanel, Tabs } from '@/react/ui/tabs.tsx';
import { ThemePicker } from '@/react/components/theme-picker.tsx';
import { Wordmark } from '@/react/components/wordmark.tsx';
import { useFormat } from '@/react/hooks/view/use-format.ts';
import { useScreenView } from '@/react/hooks/view/use-screen-view.ts';
import { useServices } from '@/react/hooks/services/use-services.ts';

/** The whole page: the ranking, the tail, the removals, and the method behind all three. */
export function AppShell() {
    const { dataset, verdicts } = useServices();
    const view = useScreenView();
    const format = useFormat();
    const screen = dataset.screen;
    const excluded = screen.excluded.length;

    return (
        <>
            <header className="masthead">
                <div className="shell masthead__inner">
                    <div className="masthead__plate">
                        <h1>
                            <Wordmark />
                        </h1>
                        <p className="masthead__tagline">
                            As {screen.portfolio.length} empresas mais baratas da B3 por EV/EBIT, com a conta
                            à mostra.
                        </p>
                    </div>
                    <div className="masthead__aside">
                        <p className="label masthead__dateline">
                            Apuração de {format.date(screen.builtAt)}
                            <br />
                            {screen.universeSize} companhias lidas
                        </p>
                        <ThemePicker />
                    </div>
                </div>
            </header>

            <main className="shell">
                <p className="lede lede--opening">
                    Uma tela quantitativa: ordena as companhias abertas pelo que a empresa inteira custa
                    contra o que ela opera, e publica as {screen.portfolio.length} do topo. Sem opinião e
                    sem previsão — e, por isso mesmo, com tudo o que entrou no cálculo aberto para
                    discordância.
                </p>

                <Tabs
                    label="Seções"
                    value={view.tab}
                    onValueChange={view.openTab}
                    tabs={[
                        { value: 'portfolio', label: 'A carteira', badge: screen.portfolio.length },
                        { value: 'eligible', label: 'Quem ficou perto', badge: view.runnersUp.length },
                        { value: 'excluded', label: 'O que ficou de fora', badge: excluded },
                        { value: 'method', label: 'O método' },
                    ]}
                >
                    <TabPanel value="portfolio">
                        <SectorPicker
                            sectors={view.sectors}
                            value={view.sector}
                            onChange={view.chooseSector}
                            showing={view.portfolio.length}
                            noun="na carteira"
                        />
                        <RankTable
                            label="As empresas mais baratas por EV/EBIT"
                            rows={view.portfolio}
                            openTicker={view.openTicker}
                            onToggle={view.toggleTicker}
                        />
                        <p className="note">
                            Pesos iguais, {(100 / screen.parameters.positions).toFixed(0)}% em cada.
                            {verdicts.count === 0
                                ? ' Nenhuma das demonstrações foi lida ainda: o número é completo, o motivo não.'
                                : ` ${String(verdicts.count)} das demonstrações já foram lidas.`}
                        </p>
                    </TabPanel>

                    <TabPanel value="eligible">
                        <p className="lede">
                            Passaram por todos os filtros e ficaram fora da carteira só por ordem. É aqui que
                            se vê onde a linha caiu.
                        </p>
                        <SectorPicker
                            sectors={view.sectors}
                            value={view.sector}
                            onChange={view.chooseSector}
                            showing={view.runnersUp.length}
                            noun="nesta lista"
                        />
                        <RankTable
                            label="Empresas elegíveis fora da carteira"
                            rows={view.runnersUp}
                            openTicker={view.openTicker}
                            onToggle={view.toggleTicker}
                        />
                    </TabPanel>

                    <TabPanel value="excluded">
                        <ExclusionsView />
                    </TabPanel>

                    <TabPanel value="method">
                        <MethodView />
                    </TabPanel>
                </Tabs>
            </main>

            <footer className="footer">
                <div className="shell footer__inner">
                    <p>
                        Apurado em {format.moment(screen.builtAt)} · versão {__APP_VERSION__}
                    </p>
                    <p>
                        <a href={__APP_REPOSITORY__}>Código e dados</a> · Não é recomendação de investimento
                    </p>
                </div>
            </footer>
        </>
    );
}
