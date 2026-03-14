import 'dotenv/config';
import { vi, beforeAll, afterAll } from 'vitest';
import { AuthRole } from "@/lib/AuthRoles";
import { StaticData } from "../tests/_playwrightConfig/testData/staticDataLoader";

// Mock server-only package to allow server components in test environment
vi.mock('server-only', () => ({}));

// Setup static data for integration tests with real database
const staticData = new StaticData(0);
const wrongAssosiation = new StaticData(1);

beforeAll(async () => {
    await staticData.resetData();
    await wrongAssosiation.resetData();
});

afterAll(async () => {
    try {
        await staticData.cleanup.removeAssosiation();
    } catch {
        // Ignore cleanup errors
    }
    try {
        await wrongAssosiation.cleanup.removeAssosiation();
    } catch {
        // Ignore cleanup errors
    }
});

// Mock authentication for DAL integration tests
vi.mock('@/lib/ironSession', () => ({
    getIronSession: vi.fn(() => {
        const role = global.__ROLE__ ?? AuthRole.materialManager;
        const assosiation = global.__ASSOSIATION__ ?? staticData.fk_assosiation;
        return {
            user: {
                name: 'VK Verwaltung',
                username: global.__USERNAME__ ?? 'mana',
                assosiation: assosiation,
                acronym: staticData.data.assosiation.acronym,
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

// Mock Redis with in-memory ioredis-mock
vi.mock('@/dal/auth/redis', async () => {
    const { default: IORedisMock } = await import('ioredis-mock');
    const redisMock = new IORedisMock();
    return {
        redis: redisMock,
        isRedisAvailable: () => true,
        isRedisConfiguredButUnavailable: () => false,
    };
});

// Export static data for use in tests
export { staticData, wrongAssosiation };
