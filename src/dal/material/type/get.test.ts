import { runServerActionTest } from "@/dal/_helper/testHelper";
import { prisma } from "@/lib/db";
import { AdministrationMaterialGroup, MaterialGroup } from "@/types/globalMaterialTypes";
import { StaticData } from "../../../../tests/_playwrightConfig/testData/staticDataLoader";
import { getMaterialAdministrationConfiguration, getMaterialConfiguration } from "./get";

const { ids, cleanup, data } = new StaticData(0);
describe('getMaterialConfiguration', () => {
    const getFunctionResult = () => runServerActionTest<MaterialGroup[]>(getMaterialConfiguration);
    it('should countain the right fields', async () => {
        const { success, result } = await getFunctionResult();
        expect(success).toBeTruthy();
        expect(result).toHaveLength(3);
        expect(Object.keys(result[0])).toStrictEqual([
            "id", "description", "issuedDefault", "multitypeAllowed", "sortOrder", "typeList"
        ]);
        expect(Object.keys(result[0].typeList[0])).toStrictEqual([
            "id", "typename", "sortOrder"
        ]);
        const groups = [data.materialGroups[0], data.materialGroups[1], data.materialGroups[2]];
        expect(result).toEqual(
            expect.arrayContaining(
                groups.map(
                    (group) => expect.objectContaining({
                        id: group.id,
                        issuedDefault: group.issuedDefault,
                        multitypeAllowed: group.multitypeAllowed,
                        description: group.description,
                        sortOrder: group.sortOrder,
                        typeList: expect.arrayContaining(
                            data.materialTypes
                                .filter(t => !t.recdelete && t.fk_materialGroup === group.id)
                                .map(
                                    type => expect.objectContaining({
                                        id: type.id,
                                        typename: type.typename,
                                        sortOrder: type.sortOrder,
                                    })
                                )
                        )
                    })
                )
            )
        );
    });
    it('should not contain deleted Groups', async () => getFunctionResult()
        .then(({ success, result }) => {
            expect(success).toBeTruthy();
            if (!success) return;
            expect(result).not.toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        id: ids.materialGroupIds[3],
                    }),
                ]),
            );
        })
    );

    it('should not contain groups without Materials', async () => {
        try {
            await prisma.material.deleteMany({
                where: { fk_materialGroup: ids.materialGroupIds[4] }
            });
            const { success, result } = await getFunctionResult();
            expect(success).toBeTruthy();
            expect(result).not.toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        id: ids.materialGroupIds[4],
                    }),
                ]),
            );
        } finally {
            await cleanup.materialConfig();
        }
    });
    it('should not contain groups with only deleted Materials', async () => getFunctionResult()
        .then(({ result, success }) => {
            expect(success).toBeTruthy();
            expect(result).not.toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        id: ids.materialGroupIds[4],
                    }),
                ]),
            );
        })
    );
    it('both Material and Groups should be ordered by SortOrder', async () => {
        const { success, result } = await getFunctionResult();
        expect(success).toBeTruthy();
        if (!success) return;
        expect(result.map(g => g.id)).toEqual(
            [ids.materialGroupIds[0], ids.materialGroupIds[1], ids.materialGroupIds[2]]
        );
        expect(result[0].typeList.map(t => t.id)).toEqual(
            [ids.materialIds[0], ids.materialIds[1], ids.materialIds[2], ids.materialIds[3]]
        );
    })
    it('should not contain deleted Materials', async () => {
        const { result, success } = await getFunctionResult();
        expect(success).toBeTruthy();
        expect(result[1].id).toBe(ids.materialGroupIds[1]);
        expect(result[1].typeList).not.toBe(
            expect.arrayContaining([
                expect.objectContaining({
                    id: ids.materialIds[10]
                }),
            ]),
        );
    });
});

describe('getMaterialAdministrationConfiguration', () => {
    const getFunctionResult = () => runServerActionTest<AdministrationMaterialGroup[]>(getMaterialAdministrationConfiguration);
    it('should countain the right fields', async () => {
        const { success, result } = await getFunctionResult();
        expect(success).toBeTruthy();
        expect(result).toHaveLength(4);
        expect(Object.keys(result[0])).toStrictEqual(
            expect.arrayContaining([
                "id", "description", "issuedDefault", "multitypeAllowed", "sortOrder", "typeList"
            ])
        );
        expect(Object.keys(result[0].typeList[0])).toStrictEqual(
            expect.arrayContaining([
                "id", "typename", "sortOrder", "actualQuantity", "targetQuantity", "issuedQuantity"
            ])
        );
        const groups = [data.materialGroups[0], data.materialGroups[1], data.materialGroups[2], data.materialGroups[4]];
        expect(result).toEqual(
            expect.arrayContaining(
                groups.map(
                    (group) => expect.objectContaining({
                        id: group.id,
                        issuedDefault: group.issuedDefault,
                        multitypeAllowed: group.multitypeAllowed,
                        description: group.description,
                        sortOrder: group.sortOrder,
                        typeList: expect.arrayContaining(
                            data.materialTypes
                                .filter(t => !t.recdelete && t.fk_materialGroup === group.id)
                                .map(
                                    type => expect.objectContaining({
                                        id: type.id,
                                        typename: type.typename,
                                        sortOrder: type.sortOrder,
                                        actualQuantity: type.actualQuantity,
                                        targetQuantity: type.targetQuantity,
                                    })
                                )
                        )
                    })
                )
            )
        );
    });
    it('should not contain deleted Groups', async () => getFunctionResult()
        .then(({ success, result }) => {
            expect(success).toBeTruthy();
            if (!success) return;
            expect(result).not.toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        id: ids.materialGroupIds[3],
                    }),
                ]),
            );
        })
    );

    it('should contain groups without Materials', async () => {
        try {
            await prisma.material.deleteMany({
                where: { fk_materialGroup: ids.materialGroupIds[4] }
            });
            const { success, result } = await getFunctionResult();
            expect(success).toBeTruthy();
            expect(result).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        id: ids.materialGroupIds[4],
                    }),
                ]),
            );
        } finally {
           await cleanup.materialConfig();
        }
    });
    it('should contain groups with only deleted Materials', async () => getFunctionResult()
        .then(({ result, success }) => {
            expect(success).toBeTruthy();
            expect(result).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        id: ids.materialGroupIds[4],
                    }),
                ]),
            );
        })
    );
    it('both Material and Groups should be ordered by SortOrder', async () => {
        const { success, result } = await getFunctionResult();
        expect(success).toBeTruthy();
        if (!success) return;
        expect(result.map(g => g.id)).toEqual(
            [ids.materialGroupIds[0], ids.materialGroupIds[1], ids.materialGroupIds[2], ids.materialGroupIds[4]]
        );
        expect(result[0].typeList.map(t => t.id)).toEqual(
            [ids.materialIds[0], ids.materialIds[1], ids.materialIds[2], ids.materialIds[3]]
        );
    })
    it('should not contain deleted Materials', async () => {
        const { result, success } = await getFunctionResult();
        expect(success).toBeTruthy();
        expect(result[1].id).toBe(ids.materialGroupIds[1]);
        expect(result[1].typeList).not.toBe(
            expect.arrayContaining([
                expect.objectContaining({
                    id: ids.materialIds[10]
                }),
            ]),
        );
    });
});
