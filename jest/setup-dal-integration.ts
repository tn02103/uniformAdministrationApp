import { AuthRole } from "@/lib/AuthRoles";
import { StaticData } from "../tests/_playwrightConfig/testData/staticDataLoader";

// Setup static data for integration tests with real database
const staticData = new StaticData(0);
const wrongAssosiation = new StaticData(1);

beforeAll(async () => {
    await staticData.resetData();
    await wrongAssosiation.resetData();
});

afterAll(async () => {
    try {
        await staticData.cleanup.removeOrganisation();
    } catch { 
        // Ignore cleanup errors
    }
    try {
        await wrongAssosiation.cleanup.removeOrganisation();
    } catch { 
        // Ignore cleanup errors
    }
});

// Mock authentication for DAL integration tests
jest.mock('@/lib/ironSession', () => ({
    getIronSession: () => {
        const role = global.__ROLE__ ?? AuthRole.materialManager;
        const organisationId = global.__ASSOSIATION__ ?? staticData.organisationId;
        return {
            user: {
                name: 'VK Verwaltung',
                username: global.__USERNAME__ ?? 'mana',
                organisationId: organisationId,
                acronym: staticData.data.organisation.acronym,
                role: role,
            }
        }
    },
}));

// Mock Next.js cache functions for DAL integration tests
jest.mock('next/cache', () => ({
    unstable_cache: jest.fn((fn) => fn),
    revalidateTag: jest.fn(),
    revalidatePath: jest.fn(),
}));

// Export static data for use in tests
export { staticData, wrongAssosiation };
