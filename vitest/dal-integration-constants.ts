/**
 * Shared constants for parallel DAL integration test execution.
 *
 * MAX_FORKS controls both the Vitest fork pool size and the org-index layout:
 *   - Wrong org (static): index 0  — never changes, safe to reference anywhere
 *   - Worker orgs:        VITEST_POOL_ID → indices 1 .. MAX_FORKS  (POOL_ID is 1-indexed)
 *
 * Increase MAX_FORKS to utilise more CPU cores; the org indices scale automatically.
 */
export const MAX_FORKS = 8;
export const WRONG_ORG_INDEX = 0;

