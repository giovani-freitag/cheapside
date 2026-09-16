import type { IssuerRecord, StatementRecord } from '@/services/cvm/types.ts';
import type { IssuerStatus } from '@/domain/enums/issuer-status.ts';
import type { StatementKind } from '@/domain/enums/statement-kind.ts';
import type { CvmSource } from '@/services/cvm/cvm-source.ts';
import { ASSET_ACCOUNTS, INCOME_ACCOUNTS, LIABILITY_ACCOUNTS } from '@/services/cvm/accounts.ts';
import { StatementCollector } from '@/services/cvm/statement-collector.ts';
import { CvmTable } from '@/services/cvm/cvm-table.ts';
import { Cnpj } from '@/domain/values/cnpj.ts';

export interface CvmServiceConfig {
    source: CvmSource;
    /** Which years of filings to read, oldest first. */
    years: readonly number[];
}

/** Which of the two filing series a year's archive belongs to. */
const SERIES: Readonly<Record<StatementKind, string>> = { annual: 'dfp', quarterly: 'itr' };

/**
 * Reads the CVM's open-data filings into the figures the screen ranks on.
 *
 * This is the only place in the project that knows the CVM publishes Latin-1 semicolon files in
 * yearly zips, that a quarterly statement reports the year to date rather than the quarter, or
 * that a company which consolidates files twice. Everything downstream sees operating profit,
 * cash, debt and a date.
 */
export class CvmService {
    private readonly source: CvmSource;
    private readonly years: readonly number[];

    constructor(config: CvmServiceConfig) {
        this.source = config.source;
        this.years = config.years;
    }

    /**
     * Reads the issuer registry.
     *
     * @returns Every registered issuer, keyed by CNPJ root.
     */
    public async fetchRegistry(): Promise<Map<string, IssuerRecord>> {
        const text = await this.source.readText('CAD/DADOS/cad_cia_aberta.csv');
        const issuers = new Map<string, IssuerRecord>();
        if (!text) return issuers;

        const table = new CvmTable({ text });
        const columns = {
            cnpj: table.column('CNPJ_CIA'),
            name: table.column('DENOM_SOCIAL'),
            cvmCode: table.column('CD_CVM'),
            sector: table.column('SETOR_ATIV'),
            registration: table.column('SIT'),
            issuer: table.column('SIT_EMISSOR'),
        };

        table.forEachRow((fields) => {
            const cnpj = Cnpj.tryParse(fields[columns.cnpj] ?? '');
            if (!cnpj) return;

            issuers.set(cnpj.root, {
                cnpj,
                cvmCode: normaliseCode(fields[columns.cvmCode] ?? ''),
                legalName: (fields[columns.name] ?? '').trim(),
                sector: (fields[columns.sector] ?? '').trim(),
                status: readStatus(fields[columns.registration] ?? '', fields[columns.issuer] ?? ''),
            });
        });

        return issuers;
    }

    /**
     * Reads every filing in the configured years and reduces it to one record per company.
     *
     * Consolidated statements win outright over individual ones: a company that consolidates is
     * only meaningfully valued on the group, and mixing the two would put a parent's debt
     * against a group's profit.
     *
     * @returns The figures the screen needs, keyed by CNPJ root.
     */
    public async fetchStatements(): Promise<Map<string, StatementRecord>> {
        const consolidated = new StatementCollector();
        const individual = new StatementCollector();

        for (const kind of ['annual', 'quarterly'] as const) {
            for (const year of this.years) {
                await this.readYear({ kind, year, scope: 'con', collector: consolidated });
                await this.readYear({ kind, year, scope: 'ind', collector: individual });
            }
        }

        const records = consolidated.reduce();
        for (const [cnpj, record] of individual.reduce()) {
            if (!records.has(cnpj)) records.set(cnpj, record);
        }

        return records;
    }

    private async readYear(request: {
        kind: StatementKind;
        year: number;
        scope: 'con' | 'ind';
        collector: StatementCollector;
    }): Promise<void> {
        const { kind, year, scope, collector } = request;
        const series = SERIES[kind];
        const archive = `DOC/${series.toUpperCase()}/DADOS/${series}_cia_aberta_${String(year)}.zip`;
        const member = (statement: string) => `${series}_cia_aberta_${statement}_${scope}_${String(year)}.csv`;

        await this.readIncome({ archive, member: member('DRE'), kind, collector });
        await this.readBalance({ archive, member: member('BPA'), accounts: ASSET_ACCOUNTS, collector });
        await this.readBalance({ archive, member: member('BPP'), accounts: LIABILITY_ACCOUNTS, collector });
    }

    private async readIncome(request: {
        archive: string;
        member: string;
        kind: StatementKind;
        collector: StatementCollector;
    }): Promise<void> {
        const text = await this.source.readMember(request.archive, request.member);
        if (!text) return;

        const table = new CvmTable({ text });
        const columns = {
            account: table.column('CD_CONTA'),
            description: table.column('DS_CONTA'),
            cnpj: table.column('CNPJ_CIA'),
            cvmCode: table.column('CD_CVM'),
            reference: table.column('DT_REFER'),
            version: table.column('VERSAO'),
            scale: table.column('ESCALA_MOEDA'),
            order: table.column('ORDEM_EXERC'),
            periodStart: table.column('DT_INI_EXERC'),
            periodEnd: table.column('DT_FIM_EXERC'),
            amount: table.column('VL_CONTA'),
        };

        table.forEachRow((fields) => {
            const account = fields[columns.account] ?? '';
            if (!INCOME_ACCOUNTS.has(account)) return;

            const cnpj = Cnpj.tryParse(fields[columns.cnpj] ?? '');
            if (!cnpj) return;

            request.collector.addIncome({
                cnpj: cnpj.root,
                cvmCode: normaliseCode(fields[columns.cvmCode] ?? ''),
                reference: fields[columns.reference] ?? '',
                version: Number.parseInt(fields[columns.version] ?? '1', 10),
                scale: fields[columns.scale] ?? '',
                order: fields[columns.order] ?? '',
                periodStart: fields[columns.periodStart] ?? '',
                periodEnd: fields[columns.periodEnd] ?? '',
                account,
                description: fields[columns.description] ?? '',
                amount: fields[columns.amount] ?? '0',
                kind: request.kind,
            });
        });
    }

    private async readBalance(request: {
        archive: string;
        member: string;
        accounts: ReadonlySet<string>;
        collector: StatementCollector;
    }): Promise<void> {
        const text = await this.source.readMember(request.archive, request.member);
        if (!text) return;

        const table = new CvmTable({ text });
        const columns = {
            account: table.column('CD_CONTA'),
            cnpj: table.column('CNPJ_CIA'),
            cvmCode: table.column('CD_CVM'),
            reference: table.column('DT_REFER'),
            version: table.column('VERSAO'),
            scale: table.column('ESCALA_MOEDA'),
            order: table.column('ORDEM_EXERC'),
            periodEnd: table.column('DT_FIM_EXERC'),
            amount: table.column('VL_CONTA'),
        };

        table.forEachRow((fields) => {
            const account = fields[columns.account] ?? '';
            if (!request.accounts.has(account)) return;

            const cnpj = Cnpj.tryParse(fields[columns.cnpj] ?? '');
            if (!cnpj) return;

            request.collector.addBalance({
                cnpj: cnpj.root,
                cvmCode: normaliseCode(fields[columns.cvmCode] ?? ''),
                reference: fields[columns.reference] ?? '',
                version: Number.parseInt(fields[columns.version] ?? '1', 10),
                scale: fields[columns.scale] ?? '',
                order: fields[columns.order] ?? '',
                periodEnd: fields[columns.periodEnd] ?? '',
                account,
                amount: fields[columns.amount] ?? '0',
            });
        });
    }
}

/** The registry writes the code bare and the filings zero-pad it; both mean the same issuer. */
function normaliseCode(raw: string): string {
    return raw.trim().replace(/^0+/, '');
}

function readStatus(registration: string, issuer: string): IssuerStatus {
    if (registration.trim().toUpperCase() !== 'ATIVO') return 'inactive';

    const situation = issuer.trim().toUpperCase();
    if (situation === 'FASE OPERACIONAL') return 'operational';
    if (situation === 'FASE PRÉ-OPERACIONAL') return 'pre-operational';
    if (/RECUPERA|FALID|LIQUIDA|PARALISADA/.test(situation)) return 'distressed';

    return 'inactive';
}
