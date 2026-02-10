import { AuthRole } from "@/lib/AuthRoles";
import { StaticData } from "../tests/_playwrightConfig/testData/staticDataLoader";

// Mock server-only package to allow server components in Jest environment
jest.mock('server-only', () => ({}));

// Setup static data for integration tests with real database
const staticData = new StaticData(0);
const wrongOrganisation = new StaticData(1);

beforeAll(async () => {
    await staticData.resetData();
    await wrongOrganisation.resetData();
});

afterAll(async () => {
    try {
        await staticData.cleanup.removeOrganisation();
    } catch { 
        // Ignore cleanup errors
    }
    try {
        await wrongOrganisation.cleanup.removeOrganisation();
    } catch { 
        // Ignore cleanup errors
    }
});

// Mock authentication for DAL integration tests
jest.mock('@/lib/ironSession', () => ({
    getIronSession: jest.fn(() => {
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

// Mock Next.js cache functions for DAL integration tests
jest.mock('next/cache', () => ({
    unstable_cache: jest.fn((fn) => fn),
    revalidateTag: jest.fn(),
    revalidatePath: jest.fn(),
}));

// Export static data for use in tests
export { staticData, wrongOrganisation };
