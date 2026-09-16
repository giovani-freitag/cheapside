import { useDistribution } from '@/react/hooks/view/use-distribution.ts';
import { useFormat } from '@/react/hooks/view/use-format.ts';

/**
 * Where the published positions fall inside everything that survived the filters.
 *
 * Twenty is a number without a denominator until the reader can see the crowd it came out of and
 * how thin the line between the twentieth and the twenty-first is. The bars left of the line are
 * the portfolio; the tail to the right is what the same filters kept and the ranking did not.
 */
export function DistributionChart() {
    const distribution = useDistribution();
    const format = useFormat();
    const ticks = [0, distribution.ceiling / 3, (distribution.ceiling / 3) * 2, distribution.ceiling];

    return (
        <figure className="distribution">
            <figcaption className="distribution__head">
                <span className="label">Onde a carteira cai</span>
                <span className="label">{distribution.counted} elegíveis</span>
            </figcaption>

            <div className="distribution__plot">
                <div className="distribution__bars" aria-hidden>
                    {distribution.bins.map((bin) => (
                        <span
                            key={bin.from}
                            className="distribution__bar"
                            data-published={bin.published}
                            style={{ height: `${String((bin.count / distribution.tallest) * 100)}%` }}
                        />
                    ))}
                </div>
                <span
                    className="distribution__cut"
                    style={{ left: `${String(distribution.cutAt * 100)}%` }}
                    aria-hidden
                >
                    <span className="distribution__cut-label figure">corte {format.multiple(distribution.cut)}</span>
                </span>
            </div>

            <div className="distribution__axis figure" aria-hidden>
                {ticks.map((tick) => (
                    <span key={tick}>{`${tick.toFixed(0)}×`}</span>
                ))}
            </div>

            <p className="distribution__legend">
                Cada barra é uma faixa de 1× de EV/EBIT entre as {distribution.counted} elegíveis mais
                baratas. À esquerda da linha, a carteira, que para em {format.multiple(distribution.cut)}; a
                barra mais alta tem {distribution.tallest} companhias.
            </p>
        </figure>
    );
}
