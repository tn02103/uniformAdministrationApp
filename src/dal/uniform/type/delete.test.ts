import { runServerActionTest } from "@/dal/_helper/testHelper";
import { deleteUniformType } from "./delete";
import { StaticData } from "../../../../tests/_playwrightConfig/testData/staticDataLoader";
import { UniformType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { isToday } from "date-fns";
import dayjs from "dayjs";
import exp from "constants";

// it returns all/only unreturned uniformItems
// it deletes all/only undeleted uniformItems
// it deletes all/only undeleted Generations
// it deletes the type
// it moves the other types up
// it deletes all UniformDeficiencies 

const { ids, cleanup, data } = new StaticData(0);
const fk_uniformType = ids.uniformTypeIds[0];
let functionResult: UniformType[] | undefined;

beforeAll(async () => {
    const { result, success } = await runServerActionTest(
        () => deleteUniformType(ids.uniformTypeIds[0])
    );
    expect(success).toBeTruthy();
    functionResult = result;
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
                    id: ids.uniformIds[0][55],
                },
            },
        }),
        prisma.uniformIssued.findMany({
            where: {
                uniform: {
                    id: ids.uniformIds[0][44],
                },
            },
        }),
    ]);
    expect(unreturned).toHaveLength(0);
    expect(prevReturned).toHaveLength(1);

    const prevDateReturned = data.uniformIssedEntries.find(i => i.fk_uniform === ids.uniformIds[0][55])?.dateReturned;
    expect(
        dayjs(prevReturned[0].dateReturned).isSame(prevDateReturned, "day")
    ).toBeTruthy();

    expect(newReturned).toHaveLength(1);
    expect(newReturned[0].dateReturned).not.toBeNull();
    expect(isToday(newReturned[0].dateReturned!)).toBeTruthy();
});
it('deletes all/only undeleted uniformItems', async () => {
    const [undeleted, newDeleted, prevDeleted] = await prisma.$transaction([
        prisma.uniform.findMany({
            where: {
                fk_uniformType,
                OR: [
                    { recdelete: null },
                    { recdeleteUser: null },
                ]
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
    expect(isToday(newDeleted?.recdelete!)).toBeTruthy();
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
                id: ids.uniformGenerationIds[0],
            },
        }),
        prisma.uniformGeneration.findUnique({
            where: {
                id: ids.uniformGenerationIds[7],
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
