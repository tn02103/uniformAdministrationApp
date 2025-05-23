import { AuthRole } from "@/lib/AuthRoles";
import { StaticData } from "../_playwrightConfig/testData/staticDataLoader";

const staticData = new StaticData(0);
const wrongAssosiation = new StaticData(1);

beforeAll(async () => {
    await staticData.resetData();
    await wrongAssosiation.resetData();
});
afterAll(async () => {
    try {
        await staticData.cleanup.removeAssosiation();
    } catch { };
    try {
        await wrongAssosiation.cleanup.removeAssosiation();
    } catch { };
});
jest.mock('@/lib/ironSession', () => ({

    getIronSession: () => {
        const role = global.__ROLE__ ?? AuthRole.materialManager;
        const assosiation = global.__ASSOSIATION__ ?? staticData.fk_assosiation;
        return {
            user: {
                name: 'VK Verwaltung',
                username: 'mana',
                assosiation: assosiation,
                acronym: staticData.data.assosiation.acronym,
                role: role,
            }
        }
    },
}));

jest.mock('next/cache', () => ({
    unstable_cache: jest.fn(),
    revalidateTag: jest.fn(),
    revalidatePath: jest.fn(),
}));
