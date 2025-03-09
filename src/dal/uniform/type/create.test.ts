import { runServerActionTest } from "@/dal/_helper/testHelper"
import { create } from "./create"
import { prisma } from "@/lib/db";
import { StaticData } from "../../../../tests/_playwrightConfig/testData/staticDataLoader";
import { v4 as uuid } from "uuid";

const { ids, cleanup } = new StaticData(0);
afterEach(async () => {
    await cleanup.uniformTypeConfiguration();
})
it('should create two types correctly', async () => {
    const result1 = await runServerActionTest(create());

    // create fist type
    expect(result1.success).toBeTruthy();
    expect(result1.result).toEqual(
        expect.objectContaining({
            name: 'Typ5',
            acronym: 'AE',
            issuedDefault: 1,
            usingGenerations: true,
            usingSizes: false,
            fk_defaultSizelist: null,
            sortOrder: 4,
        })
    );

    // creat seccond type
    // create fist type
    const result2 = await runServerActionTest(create());
    expect(result2.success).toBeTruthy();
    expect(result2.result).toEqual(
        expect.objectContaining({
            name: 'Typ6',
            acronym: 'AF',
            issuedDefault: 1,
            usingGenerations: true,
            usingSizes: false,
            fk_defaultSizelist: null,
            sortOrder: 5,
        })
    );

    const dbList = await prisma.uniformType.findMany({
        where: { fk_assosiation: ids.fk_assosiation }
    });
    expect(dbList.length).toBe(7);
    expect(dbList).toEqual(
        expect.arrayContaining([
            expect.objectContaining({
                id: result1.result.id
            }),
            expect.objectContaining({
                id: result2.result.id
            }),
        ])
    );
});

describe('test', () => {
    const fk_assosiation = uuid();
    beforeEach(async () => {
        global.__ASSOSIATION__ = fk_assosiation
        await prisma.assosiation.create({
            data: {
                name: 'empty',
                id: fk_assosiation,
                acronym: 'XX'
            }
        });
    });
    afterEach(async () => {
        delete global.__ASSOSIATION__;
        await prisma.uniformType.deleteMany({
            where: {
                fk_assosiation
            }
        });
        await prisma.assosiation.delete({
            where: { id: fk_assosiation }
        })
    });
    it('should work with no previous types', async () => {

        const { success, result } = await runServerActionTest(create());
        expect(success).toBeTruthy();
        expect(result).toEqual(
            expect.objectContaining({
                name: "Typ1",
                acronym: 'AA',
                sortOrder: 0,
            })
        );
    });
});
