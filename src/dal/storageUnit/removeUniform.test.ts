import { removeUniform } from "./removeUniform";
import { prisma } from "@/lib/db";
import { AuthRole } from "@/lib/AuthRoles";
import { __unsecuredGetUnitsWithUniformItems } from "./get";
import { StaticData } from "../../../tests/_playwrightConfig/testData/staticDataLoader";


const mockUniformId = "123e4567-e89b-12d3-a456-426614174000";
const mockAssociation = { id: "association-id", acronym: 'AA' };

jest.mock("@/lib/db", () => ({
    prisma: {
        uniform: {
            update: jest.fn(),
        },
    },
}));

jest.mock("./get", () => ({
    __unsecuredGetUnitsWithUniformItems: jest.fn(() => [{ id: 'storageUnitId1', name: 'just some storage unit' }]),
}));

jest.mock("@/actions/validations", () => ({
    genericSAValidator: async (role: AuthRole, props: any, schema: Zod.Schema, ob: any) => {
        const assosiation = global.__ASSOSIATION__ ?? mockAssociation.id;
        return [
            {
                name: 'VK Verwaltung',
                username: 'mana',
                assosiation: assosiation,
                acronym: mockAssociation.acronym,
                role: AuthRole.materialManager,
            },
            props,
        ]
    }
}));

it("should remove the uniform from the storage unit and return updated units", async () => {
    (__unsecuredGetUnitsWithUniformItems as jest.Mock).mockResolvedValue(['TestReturnValue'])
    const result = await removeUniform(mockUniformId);

    expect(prisma.uniform.update).toHaveBeenCalledWith({
        where: { id: mockUniformId },
        data: { storageUnitId: null },
    });
    expect(__unsecuredGetUnitsWithUniformItems).toHaveBeenCalledWith(mockAssociation.id);
    expect(result).toEqual(['TestReturnValue']);
});
