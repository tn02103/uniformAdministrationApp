import 'dotenv/config';
import { vi, beforeAll, afterAll } from 'vitest';
import { AuthRole } from "@/lib/AuthRoles";
import { prisma } from "@/lib/db";
import { StaticData } from "../tests/_playwrightConfig/testData/staticDataLoader";
import { MAX_FORKS, WRONG_ORG_INDEX } from "./dal-integration-constants";

// Mock server-only package to allow server components in test environment
vi.mock('server-only', () => ({}));

// Each fork worker gets its own isolated org.
// VITEST_POOL_ID is stable per pool slot (always <= maxWorkers), so the same
// slot re-uses the same org index across consecutive file runs within that slot.
// VITEST_WORKER_ID is a global ever-increasing counter and must NOT be used here.
// Wrong org lives at index 0 so it is static and never collides with any worker.
const workerIndex = Number(process.env.VITEST_POOL_ID ?? '1');

const staticData = new StaticData(workerIndex);
const wrongOrganisation = new StaticData(WRONG_ORG_INDEX);

beforeAll(async () => {
    await staticData.resetData();
});

afterAll(async () => {
    try {
        await staticData.cleanup.removeOrganisation();
    } catch { 
        // Ignore cleanup errors
    }
    await prisma.$disconnect();
});

// Mock authentication for DAL integration tests
vi.mock('@/lib/ironSession', () => ({
    getIronSession: vi.fn(() => {
        const role = global.__ROLE__ ?? AuthRole.materialManager;
        const organisationId = global.__ORGANISATION__ ?? staticData.organisationId;
        return {
            user: {
                name: 'VK Verwaltung',
                username: global.__USERNAME__ ?? 'mana',
                organisationId: organisationId,
                acronym: staticData.data.organisation.acronym,
                role: role,
            }
        }
    }),
}));

// Mock Next.js cache functions
vi.mock('next/cache', () => ({
    unstable_cache: vi.fn((fn) => fn),
    revalidateTag: vi.fn(),
    revalidatePath: vi.fn(),
}));

// Export static data for use in tests
export { staticData, wrongOrganisation, MAX_FORKS, WRONG_ORG_INDEX };
