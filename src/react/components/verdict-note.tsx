import type { VerdictWeight } from '@/data/verdict.ts';
import { VERDICT_QUESTION_LABEL } from '@/data/verdict.ts';
import { useFormat } from '@/react/hooks/view/use-format.ts';
import { useServices } from '@/react/hooks/services/use-services.ts';

export interface VerdictNoteProps {
    ticker: string;
    /** Close of the window the published multiple covers, so a stale reading can say so. */
    earningsThrough: string;
}

const WEIGHT_LABEL: Readonly<Record<VerdictWeight, string>> = {
    clear: 'nada encontrado',
    caution: 'atenção',
    flag: 'alerta',
};

/**
 * What reading the filings behind a company found, when they have been read.
 *
 * It sits below the arithmetic and never above it. A company nobody has read is marked unread
 * rather than left blank, because a blank space next to nineteen filled ones reads as a clean
 * bill of health, and it is not one.
 */
export function VerdictNote({ ticker, earningsThrough }: VerdictNoteProps) {
    const { verdicts } = useServices();
    const format = useFormat();
    const verdict = verdicts.forTicker(ticker);

    if (!verdict) {
        return (
            <p className="verdict verdict--absent">
                As demonstrações desta empresa ainda não foram lidas. O múltiplo acima é aritmética
                completa; o motivo de estar barata é uma pergunta em aberto.
            </p>
        );
    }

    const stale = verdict.earningsThrough !== earningsThrough;

    return (
        <section className="verdict">
            <header className="verdict__header">
                <h4>Leitura das demonstrações</h4>
                <p className="faint">
                    {verdict.model} · {format.date(verdict.reviewedAt)}
                    {stale ? ` · lida sobre o período até ${format.date(verdict.earningsThrough)}` : ''}
                </p>
            </header>

            {stale ? (
                <p className="verdict__stale">
                    Esta leitura é anterior ao período que o múltiplo acima cobre e responde a outros
                    números.
                </p>
            ) : null}

            <ul className="verdict__answers">
                {verdict.answers.map((answer) => (
                    <li key={answer.question} className={`verdict__answer verdict__answer--${answer.weight}`}>
                        <p className="verdict__question">
                            {VERDICT_QUESTION_LABEL[answer.question]}
                            <span className="verdict__weight">{WEIGHT_LABEL[answer.weight]}</span>
                        </p>
                        <p>{answer.finding}</p>
                        <p className="faint verdict__citation">{answer.citation}</p>
                    </li>
                ))}
            </ul>
        </section>
    );
}
