import { runServerActionTest } from "@/dal/_helper/testHelper";

import { StaticData } from "../../../../tests/_playwrightConfig/testData/staticDataLoader";
import { getType, getList } from "./get";
import { UniformType } from "@/types/globalUniformTypes";

const { ids, data } = new StaticData(0);
describe('get', () => {
    it('should be successfull', async () => {
        const { result, success } = await runServerActionTest(getType(ids.uniformTypeIds[0]))
        expect(success).toBeTruthy();
        const type = data.uniformTypes[0];
        expect(result).toEqual(
            expect.objectContaining({
                id: type.id,
                name: type.name,
                issuedDefault: type.issuedDefault,
                sortOrder: type.sortOrder,
                usingSizes: type.usingSizes,
                usingGenerations: type.usingGenerations,
                fk_defaultSizelist: type.fk_defaultSizelist,
            })
        )
        expect(result.uniformGenerationList).toHaveLength(4);
    });
    it('should not return type of different assosiation', async () => {
        const wrongStaticData = new StaticData(1);
        const { result, success } = await runServerActionTest(
            getType(wrongStaticData.ids.uniformTypeIds[0])
        );

        expect(success).toBeTruthy();
        expect(result).toBeNull();
    });
    it('should not return deleted type', async () => {
        const { result, success } = await runServerActionTest(
            getType(ids.uniformTypeIds[4])
        );
        expect(success).toBeTruthy();
        expect(result).toBeNull();
    });
});
describe('getList', () => {
    let result: UniformType[] | undefined;
    beforeAll(async () => {
        const fedback = await runServerActionTest(getList());
        expect(fedback.success).toBeTruthy();
        result = fedback.result;
    })
    it('should have correct sortorder', () => {
        if (!result) return;
        expect(result).toHaveLength(4)
        expect(result[0].id).toEqual(ids.uniformTypeIds[0]);
        expect(result[1].id).toEqual(ids.uniformTypeIds[1]);
        expect(result[2].id).toEqual(ids.uniformTypeIds[2]);
        expect(result[3].id).toEqual(ids.uniformTypeIds[3]);

        expect(result[0].uniformGenerationList[0].id).toEqual(ids.uniformGenerationIds[0]);
        expect(result[0].uniformGenerationList[1].id).toEqual(ids.uniformGenerationIds[1]);
        expect(result[0].uniformGenerationList[2].id).toEqual(ids.uniformGenerationIds[2]);
        expect(result[0].uniformGenerationList[3].id).toEqual(ids.uniformGenerationIds[3]);
    });
    it('no deleted type or generation', async () => {
        expect(result).not.toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: ids.uniformTypeIds[4]
                })
            ])
        );
        expect(result).not.toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    uniformGenerationList: expect.arrayContaining([
                        expect.objectContaining({
                            id: ids.uniformGenerationIds[6]
                        })
                    ])
                })
            ])
        );
    });
    it('type and generations have the correct attributes', async () => {
        if (!result) return;
        expect(Object.keys(result[0])).toStrictEqual(
            expect.arrayContaining([
                "id", "name", "acronym", "issuedDefault", "usingGenerations", "usingSizes", "fk_defaultSizelist", "uniformGenerationList", "sortOrder"
            ])
        );
        expect(Object.keys(result[0].uniformGenerationList[0])).toStrictEqual(
            expect.arrayContaining([
                "id",
                "name",
                "fk_sizelist",
                "outdated",
                "sortOrder",
            ])
        );
    });
});