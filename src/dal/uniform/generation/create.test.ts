import { runServerActionTest } from "@/dal/_helper/testHelper";
import { create } from "./create";
import { StaticData } from "../../../../tests/_playwrightConfig/testData/staticDataLoader";
import { ExceptionType } from "@/errors/CustomException";
import { prisma } from "@/lib/db";

const { ids, cleanup } = new StaticData(0);
const wrongStaticData = new StaticData(1);
const defaultProps = {
    name: "New Gen",
    outdated: true,
    fk_sizelist: ids.sizelistIds[0],
    uniformTypeId: ids.uniformTypeIds[0],
}

afterEach(async () => cleanup.uniformTypeConfiguration());

// creates correctly -> sortOrder is set
it('should create the generation', async () => {
    const { success, result } = await runServerActionTest(
        create(defaultProps)
    );
    expect(success).toBeTruthy();
    expect(result[0].uniformGenerationList).toHaveLength(5);
    expect(result[0].uniformGenerationList[4]).toEqual(
        expect.objectContaining({
            fk_sizelist: defaultProps.fk_sizelist,
            name: defaultProps.name,
            outdated: true,
            sortOrder: 4,
        }),
    );
    const dbData = await prisma.uniformGeneration.findFirst({
        where: {
            name: defaultProps.name,
        }
    });
    expect(dbData).not.toBeNull();
    expect(dbData).toEqual(
        expect.objectContaining({
            fk_sizelist: defaultProps.fk_sizelist,
            name: defaultProps.name,
            outdated: true,
            sortOrder: 4,
        }),
    );
});
it('should throw error for fk_sizeList null while using sizes', async () => {
    const { success, result } = await runServerActionTest(
        create({
            ...defaultProps,
            fk_sizelist: null
        }),
    );
    expect(success).toBeFalsy();
    expect(result.exceptionType).toEqual(ExceptionType.SaveDataException);
    expect(result.message).toMatch(/fk_sizelist is required for this uniformType/);

    const dbData = await prisma.uniformGeneration.findFirst({
        where: {
            name: defaultProps.name
        }
    });
    expect(dbData).toBeNull();
});
it('should throw error for invalid fk_sizelist', async () => {
    const { success, result } = await runServerActionTest(
        create({
            ...defaultProps,
            fk_sizelist: ids.cadetIds[0],
        }),
    );
    expect(success).toBeFalsy();
    const dbData = await prisma.uniformGeneration.findFirst({
        where: {
            name: defaultProps.name
        }
    });
    expect(dbData).toBeNull();
});
it('should throw error for wrong assosiation of fk_sizelist', async () => {
    const { success } = await runServerActionTest(
        create({
            ...defaultProps,
            fk_sizelist: wrongStaticData.ids.sizelistIds[0],
        }),
    );
    expect(success).toBeFalsy();

    const dbData = await prisma.uniformGeneration.findFirst({
        where: {
            name: defaultProps.name
        }
    });
    expect(dbData).toBeNull();
});
it('should succeed with fk_sizelist null when not using sizes', async () => {
    const { success } = await runServerActionTest(
        create({
            ...defaultProps,
            fk_sizelist: null,
            uniformTypeId: ids.uniformTypeIds[1],
        }),
    );
    expect(success).toBeTruthy();

    const dbData = await prisma.uniformGeneration.findFirst({
        where: {
            name: defaultProps.name
        }
    });
    expect(dbData).not.toBeNull();
});
it('should set fk_sizelist null when not using sizes', async () => {
    const { success, result } = await runServerActionTest(
        create({
            ...defaultProps,
            uniformTypeId: ids.uniformTypeIds[1],
        }),
    );
    expect(success).toBeTruthy();
    expect(result[1].uniformGenerationList[2].fk_sizelist).toBeNull();

    const dbData = await prisma.uniformGeneration.findFirst({
        where: {
            name: defaultProps.name
        }
    });
    expect(dbData).not.toBeNull();
    expect(dbData!.fk_sizelist).toBeNull();
});
it('should throw error if uniformType is from different Assosiation', async () => {
    const { success } = await runServerActionTest(
        create({
            ...defaultProps,
            uniformTypeId: wrongStaticData.ids.uniformTypeIds[0],
        }),
    );
    expect(success).toBeFalsy();

    const dbData = await prisma.uniformGeneration.findFirst({
        where: {
            name: defaultProps.name
        }
    });
    expect(dbData).toBeNull();
});

it('should throw error if uniformType is not using generations', async () => {
    const { success, result } = await runServerActionTest(
        create({
            ...defaultProps,
            uniformTypeId: ids.uniformTypeIds[2],
        }),
    );
    expect(success).toBeFalsy();
    expect(result.exceptionType).toEqual(ExceptionType.SaveDataException);
    expect(result.message).toMatch(/generations are not activated for uniformType/);

    const dbData = await prisma.uniformGeneration.findFirst({
        where: {
            name: defaultProps.name
        }
    });
    expect(dbData).toBeNull();
});
it('should return soft error for nameDuplication', async () => {
    const { success, result } = await runServerActionTest(
        create({
            ...defaultProps,
            name: 'Generation1-1',
        }),
    );
    expect(success).toBeFalsy();
    expect(result.error).toBeDefined();
    expect(result.error.formElement).toEqual('name');
    expect(result.error.message).toEqual('custom.uniform.generation.nameDuplication');

    const dbData = await prisma.uniformGeneration.findFirst({
        where: {
            name: defaultProps.name
        }
    });
    expect(dbData).toBeNull();
});
it('should succed with name of deleted generation', async () => {
    const { success } = await runServerActionTest(
        create({
            ...defaultProps,
            name: 'Generation1-5'
        }),
    );
    expect(success).toBeTruthy();
});
