/**
 * Why a company that is listed on B3 is not in the ranking.
 *
 * Every removal carries one of these and the interface shows the tally, because a screen that
 * silently drops three hundred companies is asking to be taken on faith, which is the one thing
 * a quantitative screen does not have to be.
 *
 * BDRs, ETFs and funds have no reason here: they are not operating companies with filings, so
 * they never enter the universe rather than being removed from it.
 */
export const EXCLUSION_REASONS = [
    'financial-statement-shape',
    'issuer-not-in-good-standing',
    'no-recent-statement',
    'no-operating-profit',
    'illiquid',
    'over-leveraged',
] as const;

export type ExclusionReason = (typeof EXCLUSION_REASONS)[number];

/** What the exclusion means, in one line, for a reader who wants to disagree with it. */
export const EXCLUSION_SUMMARY: Readonly<Record<ExclusionReason, string>> = {
    'financial-statement-shape':
        'Banco, seguradora ou congênere: a demonstração não tem linha de EBIT, e somar a dívida ao valor de mercado não significa nada.',
    'issuer-not-in-good-standing':
        'Em recuperação judicial, falência, liquidação, fase pré-operacional ou com registro suspenso.',
    'no-recent-statement': 'Sem demonstração consolidada recente o bastante para ser lida.',
    'no-operating-profit': 'EBIT dos últimos doze meses não é positivo — o múltiplo não teria sentido.',
    illiquid: 'Giro típico abaixo do piso: o preço do ranking não é negociável no tamanho suposto.',
    'over-leveraged': 'Dívida líquida sobre EBIT acima do teto — barata pelo motivo errado.',
};
