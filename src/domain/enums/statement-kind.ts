/**
 * Which of the CVM's two filings a figure came from.
 *
 * They differ in more than cadence: a DFP is audited and an ITR is reviewed, and only the DFP
 * closes a year, which is what makes the trailing-twelve-month arithmetic possible at all.
 */
export const STATEMENT_KINDS = ['annual', 'quarterly'] as const;

export type StatementKind = (typeof STATEMENT_KINDS)[number];
