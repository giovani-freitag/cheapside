import type { IssuerStatus } from '@/domain/enums/issuer-status.ts';
import type { Cnpj } from '@/domain/values/cnpj.ts';
import type { FiscalPeriod } from '@/domain/values/fiscal-period.ts';
import type { ReportedFigure } from '@/domain/values/trailing-earnings.ts';

/** One issuer as the CVM's registry describes it. */
export interface IssuerRecord {
    cnpj: Cnpj;
    cvmCode: string;
    legalName: string;
    /** The registry's own sector label, kept for display. */
    sector: string;
    status: IssuerStatus;
}

/**
 * Everything one issuer's filings say, reduced to the figures the screen needs.
 *
 * The three earnings windows are what a trailing-twelve-month sum is built from: the last closed
 * year, the current year to date, and the same months of the year before as the same quarterly
 * filing reports them.
 */
export interface StatementRecord {
    cvmCode: string;
    annual?: ReportedFigure;
    currentToDate?: ReportedFigure;
    priorToDate?: ReportedFigure;
    balanceSheetAt?: FiscalPeriod;
    cashAndEquivalents: number;
    shortTermInvestments: number;
    grossDebt: number;
    shareholdersEquity: number;
    totalAssets: number;
    /** False for banks and insurers, whose income statement has no operating-profit line. */
    hasOperatingResultLine: boolean;
}
