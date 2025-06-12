import { runServerActionTest } from "@/dal/_helper/testHelper";
import { prisma } from "@/lib/db";
import { v4 as uuid } from "uuid";
import { create } from "./create";
import { StaticData } from "../../../tests/_playwrightConfig/testData/staticDataLoader";

const { ids, cleanup } = new StaticData(0);
afterEach(async () => {
    await cleanup.storageUnits();
});
const testUnit = {
    name: 'Unit1',
    description: 'For Broken uniformItems',
    capacity: 10,
    isReserve: true,
}

it('should create storage unit', async () => {
    const { success, result } = await runServerActionTest(create(testUnit));
    expect(success).toBeTruthy();
    expect(result).toEqual(
        expect.arrayContaining([
            expect.objectContaining(testUnit)
        ])
    );

    const dbList = await prisma.storageUnit.findMany({
        where: {
            assosiationId: ids.fk_assosiation,
            name: testUnit.name,
        }
    });
    expect(dbList.length).toBe(1);
    expect(dbList).toEqual([
        expect.objectContaining(
            testUnit
        ),
    ]);
});

it('throws soft error if name is duplicated', async () => {
    const{ success, result } = await runServerActionTest(create({
        ...testUnit,
        name: 'Kiste 01'
    }));
    expect(success).toBeFalsy();
    expect(result.error).toBeDefined();
    expect(result.error.formElement).toBe('name');
    expect(result.error.message).toBe('custom.nameDuplication.storageUnit');
});
   
describe('test empty assosiation', () => {
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
    it('should work with no previous units', async () => {
        const { success, result } = await runServerActionTest(create(testUnit));
        expect(success).toBeTruthy();
        expect(result).toStrictEqual([
            expect.objectContaining(testUnit)
        ]);
    });
});

  
