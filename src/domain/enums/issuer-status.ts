/** The CVM registry's view of whether an issuer is still a going concern that files statements. */
export const ISSUER_STATUSES = ['operational', 'pre-operational', 'distressed', 'inactive'] as const;

export type IssuerStatus = (typeof ISSUER_STATUSES)[number];

/** Statuses a candidate must hold to reach the ranking. */
export const RANKABLE_ISSUER_STATUSES: ReadonlySet<IssuerStatus> = new Set<IssuerStatus>(['operational']);
