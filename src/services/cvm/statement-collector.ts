import type { StatementRecord } from '@/services/cvm/types.ts';
import type { StatementKind } from '@/domain/enums/statement-kind.ts';
import type { ReportedFigure } from '@/domain/values/trailing-earnings.ts';
import { ACCOUNTS, isNetIncome, isOperatingResult, scaleFactor } from '@/services/cvm/accounts.ts';
import { FiscalPeriod } from '@/domain/values/fiscal-period.ts';

/** Which of the two income-statement lines the screen reads a row is. */
type IncomeLine = 'ebit' | 'netIncome';

/** The figures of one window, while they are still arriving one row at a time. */
interface WindowFigures {
    period: FiscalPeriod;
    ebit?: number;
    netIncome?: number;
}

/** One income statement as filed, reduced to the two lines and their comparative. */
interface IncomeFiling {
    version: number;
    kind: StatementKind;
    current?: WindowFigures;
    /** The same window a year earlier, which every quarterly filing carries beside the current one. */
    comparative?: WindowFigures;
}

/** One balance sheet as filed, reduced to what an enterprise value is built from. */
interface BalanceFiling {
    version: number;
    at: FiscalPeriod;
    cashAndEquivalents: number;
    shortTermInvestments: number;
    currentDebt: number;
    nonCurrentDebt: number;
    shareholdersEquity: number;
    totalAssets: number;
}

/** What every filing row carries, whichever statement it came from. */
interface FilingIdentity {
    /** CNPJ root — the key every source can be joined on. */
    cnpj: string;
    cvmCode: string;
    /** `DT_REFER`: which filing this is, as opposed to which window a figure covers. */
    reference: string;
    version: number;
    /** `ESCALA_MOEDA`: whether the amounts are units or thousands. */
    scale: string;
    /** `ORDEM_EXERC`: whether the figure is the current window or its comparative. */
    order: string;
    account: string;
    amount: string;
}

/** The raw fields one income-statement row contributes. */
export interface IncomeRow extends FilingIdentity {
    /** `DS_CONTA`: which of the three charts of accounts the filer used. */
    description: string;
    periodStart: string;
    periodEnd: string;
    kind: StatementKind;
}

/** The raw fields one balance-sheet row contributes. */
export interface BalanceRow extends FilingIdentity {
    periodEnd: string;
}

interface FilingLookup<T> {
    store: Map<string, Map<string, T>>;
    cnpj: string;
    reference: string;
    version: number;
    create: () => T;
}

/**
 * Folds hundreds of thousands of filing rows into one record per company.
 *
 * Three things make this more than a group-by. Companies refile, so a reference date can appear at
 * several versions and only the highest counts — a later version does not amend the earlier one,
 * it replaces it. A quarterly filing reports the year to date beside the same months of the year
 * before, which is the only place the comparative needed for a trailing sum exists. And from the
 * second quarter on it reports every account twice, once for the quarter and once cumulatively, of
 * which only the cumulative figure can be subtracted from a closed year.
 */
export class StatementCollector {
    private readonly income = new Map<string, Map<string, IncomeFiling>>();
    private readonly balance = new Map<string, Map<string, BalanceFiling>>();
    private readonly cvmCodes = new Map<string, string>();
    private readonly sawOperatingResult = new Set<string>();

    /**
     * Takes one row of an income statement.
     *
     * @param row - The fields read off the CVM table.
     */
    public addIncome(row: IncomeRow): void {
        const line = classify(row);
        if (!line) return;

        this.cvmCodes.set(row.cnpj, row.cvmCode);

        // The operating slot is filled for every filer, including the banks whose 3.05 holds a
        // pre-tax profit, so that such a company still assembles and can be excluded by name.
        // Only a genuine operating line marks it as one the multiple can be defined on.
        if (line === 'ebit' && isOperatingResult(row.description)) this.sawOperatingResult.add(row.cnpj);

        const filing = this.filingFor({
            store: this.income,
            cnpj: row.cnpj,
            reference: row.reference,
            version: row.version,
            create: (): IncomeFiling => ({ version: row.version, kind: row.kind }),
        });
        if (!filing) return;

        const arriving = {
            period: new FiscalPeriod({
                start: parseDate(row.periodStart),
                end: parseDate(row.periodEnd),
                kind: row.kind,
            }),
            line,
            amount: parseAmount(row.amount, row.scale),
        };

        if (row.order === 'ÚLTIMO') filing.current = merge(filing.current, arriving);
        else if (row.order === 'PENÚLTIMO') filing.comparative = merge(filing.comparative, arriving);
    }

    /**
     * Takes one row of either side of a balance sheet.
     *
     * @param row - The fields read off the CVM table.
     */
    public addBalance(row: BalanceRow): void {
        if (row.order !== 'ÚLTIMO') return;

        this.cvmCodes.set(row.cnpj, row.cvmCode);

        const filing = this.filingFor({
            store: this.balance,
            cnpj: row.cnpj,
            reference: row.reference,
            version: row.version,
            create: () => emptyBalance(row),
        });
        if (!filing) return;

        const amount = parseAmount(row.amount, row.scale);

        if (row.account === ACCOUNTS.cash) filing.cashAndEquivalents = amount;
        else if (row.account === ACCOUNTS.shortTermInvestments) filing.shortTermInvestments = amount;
        else if (row.account === ACCOUNTS.currentDebt) filing.currentDebt = amount;
        else if (row.account === ACCOUNTS.nonCurrentDebt) filing.nonCurrentDebt = amount;
        else if (row.account === ACCOUNTS.equity) filing.shareholdersEquity = amount;
        else if (row.account === ACCOUNTS.totalAssets) filing.totalAssets = amount;
    }

    /**
     * Reduces everything collected into one record per company.
     *
     * @returns The records, keyed by CNPJ root.
     */
    public reduce(): Map<string, StatementRecord> {
        const companies = new Set([...this.income.keys(), ...this.balance.keys()]);
        const records = new Map<string, StatementRecord>();

        for (const cnpj of companies) {
            const interim = latestInterim(this.income.get(cnpj));
            const sheet = latestBalance(this.balance.get(cnpj));

            records.set(cnpj, {
                cvmCode: this.cvmCodes.get(cnpj) ?? '',
                annual: latestAnnual(this.income.get(cnpj)),
                currentToDate: settle(interim?.current),
                priorToDate: settle(interim?.comparative),
                balanceSheetAt: sheet?.at,
                cashAndEquivalents: sheet?.cashAndEquivalents ?? 0,
                shortTermInvestments: sheet?.shortTermInvestments ?? 0,
                grossDebt: (sheet?.currentDebt ?? 0) + (sheet?.nonCurrentDebt ?? 0),
                shareholdersEquity: sheet?.shareholdersEquity ?? 0,
                totalAssets: sheet?.totalAssets ?? 0,
                hasOperatingResultLine: this.sawOperatingResult.has(cnpj),
            });
        }

        return records;
    }

    /**
     * The filing a row belongs to, created on first sight and replaced when a later version of the
     * same reference date arrives.
     *
     * Nothing comes back for a row belonging to a superseded version, which is the signal to drop
     * it rather than let it overwrite a field of the version that replaced it.
     */
    private filingFor<T extends { version: number }>(lookup: FilingLookup<T>): T | undefined {
        let byReference = lookup.store.get(lookup.cnpj);
        if (!byReference) {
            byReference = new Map<string, T>();
            lookup.store.set(lookup.cnpj, byReference);
        }

        const existing = byReference.get(lookup.reference);
        if (existing && existing.version > lookup.version) return undefined;
        if (existing && existing.version === lookup.version) return existing;

        const fresh = lookup.create();
        byReference.set(lookup.reference, fresh);

        return fresh;
    }
}

/**
 * Which line a row is, or nothing when it is neither.
 *
 * Account 3.05 always answers for the operating slot, even where its description shows it holds a
 * bank's pre-tax profit. The bottom line is the opposite case: its code moves between layouts —
 * 3.11 for an industrial or a bank, 3.13 for an insurer — so only the description identifies it.
 */
function classify(row: IncomeRow): IncomeLine | undefined {
    if (row.account === ACCOUNTS.operatingResult) return 'ebit';
    if (isNetIncome(row.description)) return 'netIncome';

    return undefined;
}

/** Folds one line into the figures already held for a window, keeping the longer window. */
function merge(
    existing: WindowFigures | undefined,
    arriving: { period: FiscalPeriod; line: IncomeLine; amount: number },
): WindowFigures {
    const { period, line, amount } = arriving;

    if (existing && existing.period.months > period.months) return existing;

    const base = existing && existing.period.months === period.months ? existing : { period };

    return line === 'ebit' ? { ...base, period, ebit: amount } : { ...base, period, netIncome: amount };
}

/** A window becomes a reported figure only once the line the ranking needs has arrived. */
function settle(figures: WindowFigures | undefined): ReportedFigure | undefined {
    if (figures?.ebit === undefined) return undefined;

    const netIncome = figures.netIncome;

    return { period: figures.period, ebit: figures.ebit, ...(netIncome === undefined ? {} : { netIncome }) };
}

function emptyBalance(row: BalanceRow): BalanceFiling {
    const at = parseDate(row.periodEnd);

    return {
        version: row.version,
        at: new FiscalPeriod({ start: at, end: at, kind: 'quarterly' }),
        cashAndEquivalents: 0,
        shortTermInvestments: 0,
        currentDebt: 0,
        nonCurrentDebt: 0,
        shareholdersEquity: 0,
        totalAssets: 0,
    };
}

function latestAnnual(filings: Map<string, IncomeFiling> | undefined): ReportedFigure | undefined {
    if (!filings) return undefined;

    let best: ReportedFigure | undefined;
    for (const filing of filings.values()) {
        const figure = settle(filing.current);
        if (filing.kind !== 'annual' || !figure?.period.isFullYear) continue;
        if (!best || figure.period.end.getTime() > best.period.end.getTime()) best = figure;
    }

    return best;
}

function latestInterim(filings: Map<string, IncomeFiling> | undefined): IncomeFiling | undefined {
    if (!filings) return undefined;

    let best: IncomeFiling | undefined;
    for (const filing of filings.values()) {
        const end = filing.current?.period.end.getTime();
        if (filing.kind !== 'quarterly' || end === undefined) continue;

        const bestEnd = best?.current?.period.end.getTime() ?? -Infinity;
        if (end > bestEnd) best = filing;
    }

    return best;
}

function latestBalance(filings: Map<string, BalanceFiling> | undefined): BalanceFiling | undefined {
    if (!filings) return undefined;

    let best: BalanceFiling | undefined;
    for (const filing of filings.values()) {
        if (!best || filing.at.end.getTime() > best.at.end.getTime()) best = filing;
    }

    return best;
}

function parseDate(value: string): Date {
    return new Date(`${value.trim()}T00:00:00Z`);
}

function parseAmount(value: string, scale: string): number {
    return Number.parseFloat(value) * scaleFactor(scale);
}
