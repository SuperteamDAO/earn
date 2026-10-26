import type { UserApplicationResponse } from '../constants/userApplication';

// The viewer's application to a grant, as the grant page loads it
// (src/server/grant-pages.ts `mine`).
export type GrantApplicationWithTranchesAndUser = UserApplicationResponse;
