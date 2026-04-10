import 'dotenv/config';
import { prisma } from '@/lib/db';
import { StaticData } from '../tests/_playwrightConfig/testData/staticDataLoader';
import { WRONG_ORG_INDEX } from './dal-integration-constants';

/**
 * Vitest globalSetup — runs once in the main process before any worker starts.
 *
 * Responsible for the wrong-org (index 0) lifecycle only.
 * Each worker manages its own org (indices 1..MAX_FORKS) via setup-dal-integration.ts.
 */
export async function setup() {
    const wrongOrg = new StaticData(WRONG_ORG_INDEX);
    await wrongOrg.resetData();
}

export async function teardown() {
    try {
        const wrongOrg = new StaticData(WRONG_ORG_INDEX);
        await wrongOrg.cleanup.removeOrganisation();
    } catch {
        // Ignore cleanup errors — the org may already be gone
    }
    await prisma.$disconnect();
}
