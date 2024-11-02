import { AuthRole } from "@/lib/AuthRoles";
import { StaticData } from "../_playwrightConfig/testData/staticDataLoader";

const staticData = new StaticData(0);

beforeAll(async () => {
    await staticData.resetData();
});
afterAll(async () => {
    try {
        await staticData.cleanup.removeAssosiation();
    } catch (e) { };
});
jest.mock('@/lib/ironSession', () => ({
    getIronSession: () => ({
        user: {
            name: 'VK Verwaltung',
            username: 'mana',
            assosiation: staticData.data.assosiation.id,
            acronym: staticData.data.assosiation.acronym,
            role: AuthRole.materialManager
        }
    }),
}));

jest.mock('next/cache', () => ({
    unstable_cache: jest.fn((fun: () => any, ...x: any) => fun),
    revalidateTag: jest.fn((...args) => {}),
    revalidatePath: jest.fn((...args) => {}),
}));