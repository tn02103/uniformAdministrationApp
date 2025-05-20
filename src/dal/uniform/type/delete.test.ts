import { isToday, runServerActionTest } from "@/dal/_helper/testHelper";
import { prisma } from "@/lib/db";
import dayjs from "@/lib/dayjs";
import { StaticData } from "../../../../tests/_playwrightConfig/testData/staticDataLoader";
import { markDeleted } from "./delete";


const { ids, data } = new StaticData(0);
describe('type2', () => {
    const fk_uniformType = ids.uniformTypeIds[1];
    beforeAll(async () => {
        const { success } = await runServerActionTest(
            markDeleted(ids.uniformTypeIds[1])
        );
        expect(success).toBeTruthy();
    });
    afterAll(async () => {
        await new StaticData(0).resetData();
    });

    it('sets DateReturned for all/only unreturned uniformItems', async () => {
        const [unreturned, prevReturned, newReturned] = await prisma.$transaction([
            prisma.uniformIssued.findMany({
                where: {
                    uniform: {
                        fk_uniformType
                    },
                    dateReturned: null,
                },
            }),
            prisma.uniformIssued.findMany({
                where: {
                    uniform: {
                        id: ids.uniformIds[1][13],
                    },
                },
            }),
            prisma.uniformIssued.findMany({
                where: {
                    uniform: {
                        id: ids.uniformIds[1][15],
                    },
                },
            }),
        ]);
        expect(unreturned).toHaveLength(0);
        expect(prevReturned).toHaveLength(1);

        const prevDateReturned = data.uniformIssedEntries.find(i => i.fk_uniform === ids.uniformIds[1][13])?.dateReturned;
        expect(
            dayjs(prevReturned[0].dateReturned).isSame(prevDateReturned, "day")
        ).toBeTruthy();

        expect(newReturned).toHaveLength(1);
        expect(newReturned[0].dateReturned).not.toBeNull();
        expect(isToday(newReturned[0].dateReturned!)).toBeTruthy();
    });


    it('deletes all/only undeleted Generations', async () => {
        const [undeleted, newDeleted, prevDeleted] = await prisma.$transaction([
            prisma.uniformGeneration.findMany({
                where: {
                    fk_uniformType,
                    OR: [
                        { recdelete: null },
                        { recdeleteUser: null },
                    ],
                },
            }),
            prisma.uniformGeneration.findUnique({
                where: {
                    id: ids.uniformGenerationIds[4],
                },
            }),
            prisma.uniformGeneration.findUnique({
                where: {
                    id: ids.uniformGenerationIds[6],
                },
            }),
        ]);

        expect(undeleted).toHaveLength(0);
        expect(newDeleted).not.toBeNull();
        expect(newDeleted?.recdelete).not.toBeNull();
        expect(newDeleted?.recdeleteUser).not.toBeNull();
        expect(isToday(newDeleted!.recdelete!)).toBeTruthy();
        expect(newDeleted?.recdeleteUser).toEqual('mana');

        const prevDeleteDate = data.uniformGenerations[7].recdelete;
        expect(prevDeleted).not.toBeNull();
        expect(prevDeleted?.recdelete).not.toBeNull();
        expect(dayjs(prevDeleted?.recdelete).isSame(prevDeleteDate, 'day')).toBeTruthy();
        expect(prevDeleted?.recdeleteUser).toBe('test4');
    });

    it('it deletes the type', async () => {
        const dbType = await prisma.uniformType.findUnique({
            where: {
                id: ids.uniformTypeIds[1],
            }
        });
        expect(dbType).not.toBeNull();
        expect(dbType?.recdelete).not.toBeNull();
        expect(isToday(dbType!.recdelete!)).toBeTruthy();
        expect(dbType?.recdeleteUser).toEqual('mana');
    });
    it('it moves the other types up', async () => {
        const dbTypeList = await prisma.uniformType.findMany({
            where: {
                fk_assosiation: ids.fk_assosiation,
            },
            orderBy: { name: 'asc' },
        });
        expect(dbTypeList).toHaveLength(5);
        expect(dbTypeList[0].id).toEqual(ids.uniformTypeIds[0]);
        expect(dbTypeList[0].sortOrder).toEqual(0);
        expect(dbTypeList[1].id).toEqual(ids.uniformTypeIds[1]);
        expect(dbTypeList[1].sortOrder).toEqual(1);
        expect(dbTypeList[2].id).toEqual(ids.uniformTypeIds[2]);
        expect(dbTypeList[2].sortOrder).toEqual(1);
        expect(dbTypeList[3].id).toEqual(ids.uniformTypeIds[3]);
        expect(dbTypeList[3].sortOrder).toEqual(2);
        expect(dbTypeList[4].id).toEqual(ids.uniformTypeIds[4]);
        expect(dbTypeList[4].sortOrder).toEqual(2);
    });
});
describe('type1', () => {
    const fk_uniformType = ids.uniformTypeIds[0];
    beforeAll(async () => {
        const { success } = await runServerActionTest(
            markDeleted(ids.uniformTypeIds[0])
        );
        expect(success).toBeTruthy();
    });
    afterAll(async () => {
        await new StaticData(0).resetData();
    });
    it('deletes all/only undeleted uniformItems', async () => {
        const [undeleted, newDeleted, prevDeleted] = await prisma.$transaction([
            prisma.uniform.findMany({
                where: {
                    fk_uniformType,
                    recdelete: null,
                },
            }),
            prisma.uniform.findUnique({
                where: {
                    id: ids.uniformIds[0][0],
                },
            }),
            prisma.uniform.findUnique({
                where: {
                    id: ids.uniformIds[0][30],
                },
            }),
        ]);

        expect(undeleted).toHaveLength(0);
        expect(newDeleted).not.toBeNull();
        expect(newDeleted?.recdelete).not.toBeNull();
        expect(isToday(newDeleted!.recdelete!)).toBeTruthy();
        expect(newDeleted?.recdeleteUser).toEqual('mana');

        expect(prevDeleted).not.toBeNull();
        expect(prevDeleted?.recdelete).not.toBeNull();
        const prevDeleteDate = data.uniformList.find(u => u.id === prevDeleted!.id)?.recdelete;
        expect(prevDeleteDate).not.toBeNull();
        expect(
            dayjs(prevDeleted?.recdelete).isSame(prevDeleteDate)
        ).toBeTruthy();
        expect(prevDeleted?.recdeleteUser).toEqual('test4');
    });

    it('deletes all deficiencies', async () => {
        const [unresolved, prevUnresolved, prevResolved] = await prisma.$transaction([
            prisma.deficiency.findMany({
                where: {
                    uniformDeficiency: {
                        uniform: {
                            fk_uniformType: ids.uniformTypeIds[0],
                        }
                    },
                    dateResolved: null
                }
            }),
            prisma.deficiency.findUnique({
                where: {
                    id: ids.deficiencyIds[1],
                }
            }),
            prisma.deficiency.findUnique({
                where: {
                    id: ids.deficiencyIds[0],
                }
            }),
        ]);

        expect(unresolved).toHaveLength(0);
        expect(prevUnresolved).toBeDefined()
        expect(prevUnresolved!.dateResolved).not.toBeNull();
        expect(isToday(prevUnresolved!.dateResolved!)).toBeTruthy();
        expect(prevResolved).toBeDefined();
        expect(prevResolved!.dateResolved).not.toBeNull();
        expect(isToday(prevResolved!.dateResolved!)).not.toBeTruthy();
    });
});
