/** Shared domain vocabulary. Framework- and storage-free; every layer may import it. */
export type Principal = Readonly<{ issuer: string; subject: string }>;
/** Records with list and create endpoints. */
export type Kind = 'memberships' | 'notices' | 'events';
/** Records with the draft/publish/cancel lifecycle. */
export type ManagedKind = 'notices' | 'events';
export type MutationAction = 'patch' | 'publish' | 'cancel';
/** Last row of the previous page: timestamp sort key (UTC, microseconds) and id. */
export type CursorKey = Readonly<{ sort?: string; id: string }>;
