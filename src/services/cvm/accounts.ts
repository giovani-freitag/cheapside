/**
 * The standardised account codes the screen reads.
 *
 * The CVM fixes the top levels of the chart of accounts across every filer — the codes marked
 * `ST_CONTA_FIXA = S` — and leaves the leaves to the company. Everything here is a fixed code,
 * which is why a line can be found by number rather than by matching free text.
 */
export const ACCOUNTS = {
    /** Resultado Antes do Resultado Financeiro e dos Tributos. Operating profit, i.e. EBIT. */
    operatingResult: '3.05',
    /** Lucro/Prejuízo Consolidado do Período, where an industrial or a bank files it. */
    netIncome: '3.11',
    /** The same line, where the insurance layout pushes it one row down. */
    netIncomeAlternate: '3.13',
    /** Caixa e Equivalentes de Caixa. */
    cash: '1.01.01',
    /** Aplicações Financeiras, current. */
    shortTermInvestments: '1.01.02',
    /** Empréstimos e Financiamentos, current. */
    currentDebt: '2.01.04',
    /** Empréstimos e Financiamentos, non-current. */
    nonCurrentDebt: '2.02.01',
    /** Patrimônio Líquido Consolidado. */
    equity: '2.03',
    /** Ativo Total. */
    totalAssets: '1',
} as const;

/** The codes wanted from the income statement. */
export const INCOME_ACCOUNTS: ReadonlySet<string> = new Set([
    ACCOUNTS.operatingResult,
    ACCOUNTS.netIncome,
    ACCOUNTS.netIncomeAlternate,
]);

/** The codes wanted from the asset side of the balance sheet. */
export const ASSET_ACCOUNTS: ReadonlySet<string> = new Set([
    ACCOUNTS.cash,
    ACCOUNTS.shortTermInvestments,
    ACCOUNTS.totalAssets,
]);

/** The codes wanted from the liability side of the balance sheet. */
export const LIABILITY_ACCOUNTS: ReadonlySet<string> = new Set([
    ACCOUNTS.currentDebt,
    ACCOUNTS.nonCurrentDebt,
    ACCOUNTS.equity,
]);

/**
 * Whether account 3.05 is an operating profit rather than something else at the same number.
 *
 * The CVM standardises the code but not the layout. Three charts of accounts put a line at 3.05:
 * industrial and commercial companies put operating profit there, banks and brokers put pre-tax
 * profit — which is after their financial result, not before it — and insurers put a residual
 * operating line. Reading the description is the only way to tell them apart, and the difference
 * is the whole reason a screen ranking on EV/EBIT must not contain a bank.
 *
 * @param description - `DS_CONTA` as filed.
 * @returns True when the figure is the operating profit the multiple needs.
 */
export function isOperatingResult(description: string): boolean {
    return normalise(description).includes('ANTES DO RESULTADO FINANCEIRO');
}

/**
 * Whether a line is the bottom line rather than a subtotal above it.
 *
 * The same ambiguity as the operating result, one code further down: an industrial and a bank
 * both file the consolidated profit at 3.11, while the insurance layout puts a subtotal there and
 * the real figure at 3.13. Reading the description settles it for all three.
 *
 * @param description - `DS_CONTA` as filed.
 * @returns True when the figure is the period's consolidated profit.
 */
export function isNetIncome(description: string): boolean {
    const text = normalise(description);

    return text.includes('LUCRO') && text.includes('CONSOLIDADO DO PERIODO');
}

function normalise(description: string): string {
    return description
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toUpperCase();
}

/**
 * How many reais one unit of a reported figure is worth.
 *
 * Most filers report in thousands and a few in units, and the scale is a column rather than a
 * convention, so it is read rather than assumed.
 */
export function scaleFactor(escalaMoeda: string): number {
    return escalaMoeda.trim().toUpperCase() === 'MIL' ? 1_000 : 1;
}
