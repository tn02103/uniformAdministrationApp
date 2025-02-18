import { runServerActionTest } from "@/dal/_helper/testHelper";
import { ExceptionType } from "@/errors/CustomException";
import { prisma } from "@/lib/db";
import dayjs from "dayjs";
import { StaticData } from "../../../../tests/_playwrightConfig/testData/staticDataLoader";
import { issue } from "./issue";


const { ids, cleanup } = new StaticData(0);
const defaultProps = {
    number: 1110,
    cadetId: ids.cadetIds[0],
    uniformTypeId: ids.uniformTypeIds[0],
    options: {}
}
const today = new Date()
today.setUTCHours(0, 0, 0, 0);

afterEach(async () => cleanup.uniform());

it('issues item if all is well', async () => {
    const { success, result } = await runServerActionTest(
        () => issue(defaultProps)
    );
    expect(success);
    expect(result[ids.uniformTypeIds[0]]).toHaveLength(5);

    const dbIssuedEntry = await prisma.uniformIssued.findFirst({
        where: {
            uniform: {
                number: 1110
            },
            fk_cadet: ids.cadetIds[0],
        }
    });
    expect(dbIssuedEntry).not.toBeNull();
    expect(dbIssuedEntry!.dateIssued).toEqual(today);
});
it('returns soft NullValueException when item doesnt exist', async () => {
    const { success, result } = await runServerActionTest(
        () => issue({
            ...defaultProps,
            number: 99999
        })
    );
    expect(success).toBeFalsy();
    expect(result.error.exceptionType).toEqual(ExceptionType.NullValueException);
    expect(result.error.data).toStrictEqual({
        number: 99999,
        type: ids.uniformTypeIds[0],
        element: 'uniform',
        id: undefined
    });
});
it('creates new item if none exists and option.create is true', async () => {
    const { success, result } = await runServerActionTest(
        () => issue({
            ...defaultProps,
            number: 99999,
            options: { create: true }
        })
    );

    expect(success).toBeTruthy();
    expect(result[ids.uniformTypeIds[0]]).toHaveLength(5);

    const dbItem = await prisma.uniform.findFirst({
        where: {
            number: 99999,
            fk_uniformType: ids.uniformTypeIds[0],
        },
        include: { issuedEntries: true }
    });
    expect(dbItem).not.toBeNull();
    expect(dbItem!.issuedEntries).toHaveLength(1);
    expect(dbItem!.issuedEntries[0].fk_cadet).toEqual(ids.cadetIds[0])
    expect(dayjs().isSame(dbItem!.issuedEntries[0].dateIssued, "day")).toBeTruthy();
});
it('returns soft UniformInactiveException if item is a reserve', async () => {
    const { success, result } = await runServerActionTest(
        () => issue({
            ...defaultProps,
            number: 1109
        })
    );
    expect(success).toBeFalsy();
    expect(result.error.exceptionType).toEqual(ExceptionType.InactiveException);
});
it('ignores item as reserve if option.ignoreInactive is true', async () => {
    const { success, result } = await runServerActionTest(
        () => issue({
            ...defaultProps,
            number: 1109,
            options: { ignoreInactive: true }
        })
    );
    expect(success).toBeTruthy();
    expect(result[ids.uniformTypeIds[0]]).toHaveLength(5);
});
it('returns soft UniformIssuedException if item is issued', async () => {
    const { success, result } = await runServerActionTest(
        () => issue({
            ...defaultProps,
            number: 1100
        })
    );
    expect(success).toBeFalsy();
    expect(result.error.exceptionType).toEqual(ExceptionType.UniformIssuedException);
    expect(result.error.data).toStrictEqual({
        uniform: {
            id: ids.uniformIds[0][0],
            number: 1100,
        },
        owner: {
            active: true,
            comment: "initial-comment",
            firstname: "Maik",
            id: ids.cadetIds[5],
            lastname: "Finkel",
        },
    });
});
it('returns item to previous owner if option.force is true', async () => {
    const { success, result } = await runServerActionTest(
        () => issue({
            ...defaultProps,
            number: 1100,
            options: { force: true }
        })
    );
    expect(success).toBeTruthy();
    expect(result[ids.uniformTypeIds[0]]).toHaveLength(5);

    const [dbMaik, issuedEntries] = await prisma.$transaction([
        prisma.cadet.findUnique({
            where: {
                id: ids.cadetIds[5],
            }
        }),
        prisma.uniformIssued.findMany({
            where: {
                fk_uniform: ids.uniformIds[0][0],
            },
            orderBy: { dateIssued: "asc" }
        }),
    ]);
    expect(dbMaik).not.toBeUndefined();
    expect(dbMaik?.comment).toEqual('initial-comment<<Das Uniformteil Typ1 1100 wurde Antje Fried Überschrieben>>');

    expect(issuedEntries).toHaveLength(2);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    expect(issuedEntries[0]).toEqual(
        expect.objectContaining({
            dateReturned: today,
        }),
    );
    expect(issuedEntries[1]).toEqual(
        expect.objectContaining({
            dateIssued: today,
            dateReturned: null,
        }),
    );
});
it('returns item of idToReplace', async () => {
    const { success, result } = await runServerActionTest(
        () => issue({
            ...defaultProps,
            idToReplace: ids.uniformIds[0][42]
        })
    );
    expect(success).toBeTruthy();
    expect(result[ids.uniformTypeIds[0]]).toHaveLength(4);
    expect(result[ids.uniformTypeIds[0]]).toEqual(
        expect.arrayContaining([
            expect.objectContaining({
                id: ids.uniformIds[0][10],
            })
        ])
    );
    expect(result[ids.uniformTypeIds[0]]).not.toEqual(
        expect.arrayContaining([
            expect.objectContaining({
                id: ids.uniformIds[0][42]
            })
        ])
    );

    const [dbIssued, dbReturnd] = await prisma.$transaction([
        prisma.uniformIssued.findFirst({
            where: {
                fk_uniform: ids.uniformIds[0][10],
                fk_cadet: ids.cadetIds[0],
            },
        }),
        prisma.uniformIssued.findFirst({
            where: {
                fk_uniform: ids.uniformIds[0][42],
                fk_cadet: ids.cadetIds[0],
            },
        }),
    ]);
    console.log("🚀 ~ it ~ dbIssued, dbReturnd:", dbIssued, dbReturnd)

    expect(dbIssued).not.toBeNull();
    expect(dbIssued!.dateIssued).toEqual(today);
    expect(dbIssued!.dateReturned).toBeNull();
    expect(dbReturnd).not.toBeNull();
    expect(dbReturnd!.dateIssued).toStrictEqual(new Date('2023-08-13T00:00:00.000Z'));
    expect(dbReturnd!.dateReturned).toEqual(today);
});
it('fails if idToReplace of different Type', async () => {
    const { success, result } = await runServerActionTest(
        () => issue({
            ...defaultProps,
            idToReplace: ids.uniformIds[3][10]
        })
    );
    expect(success).toBeFalsy();
    expect(result.exceptionType).toBe(ExceptionType.SaveDataException);
});
it('fails if idToReplace issued to different Person', async () => {
    const { success, result } = await runServerActionTest(
        () => issue({
            ...defaultProps,
            idToReplace: ids.uniformIds[0][86]
        })
    );
    expect(success).toBeFalsy();
    expect(result.exceptionType).toBe(ExceptionType.SaveDataException);
});
it('fails if idToReplace is not issued', async () => {
    const { success, result } = await runServerActionTest(
        () => issue({
            ...defaultProps,
            idToReplace: ids.uniformIds[0][11]
        })
    );
    expect(success).toBeFalsy();
    expect(result.exceptionType).toBe(ExceptionType.SaveDataException);
});
