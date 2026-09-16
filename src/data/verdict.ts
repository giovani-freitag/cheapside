/** The three questions a reading of the filings is asked, and only these three. */
export const VERDICT_QUESTIONS = ['earnings-repeatable', 'balance-sheet-as-stated', 'structural-discount'] as const;

export type VerdictQuestion = (typeof VERDICT_QUESTIONS)[number];

/** How the question reads in the interface. */
export const VERDICT_QUESTION_LABEL: Readonly<Record<VerdictQuestion, string>> = {
    'earnings-repeatable': 'O EBIT se repete?',
    'balance-sheet-as-stated': 'O balanço é o que diz ser?',
    'structural-discount': 'Há um motivo estrutural para o desconto?',
};

/** How much weight the finding asks for, which is never a score and never moves the rank. */
export type VerdictWeight = 'clear' | 'caution' | 'flag';

export interface VerdictAnswer {
    question: VerdictQuestion;
    /** What the filings say, in a few sentences. */
    finding: string;
    /** Where in the filing it was found — statement, note number, section. */
    citation: string;
    weight: VerdictWeight;
}

/**
 * One reading of the filings behind a company the screen surfaced.
 *
 * Produced away from the site, committed to the repository, and shown beside the rank as
 * context. It answers why a company might be cheap; it never decides whether it is. A company
 * with no verdict is shown as unread, not as passing.
 */
export interface Verdict {
    ticker: string;
    /** Which model read the filings, so a reader knows whose reading this is. */
    model: string;
    /** When the reading was made, ISO 8601. */
    reviewedAt: string;
    /** The close of the twelve-month window the reading covers, `YYYY-MM-DD`. */
    earningsThrough: string;
    answers: readonly VerdictAnswer[];
}
