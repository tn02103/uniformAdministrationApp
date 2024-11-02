

import { AuthRole } from "@/lib/AuthRoles";
import { StaticData } from "../_playwrightConfig/testData/staticDataLoader";

const staticData = new StaticData(0);

beforeAll(async () => {
    await staticData.resetData();
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