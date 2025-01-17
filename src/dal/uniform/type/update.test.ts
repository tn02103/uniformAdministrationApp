import { runServerActionTest } from "@/dal/_helper/testHelper";
import { prisma } from "@/lib/db";
import { StaticData } from "../../../../tests/_playwrightConfig/testData/staticDataLoader";
import { updateUniformType } from "./update";

const { ids, cleanup } = new StaticData(0);
const defaultProps = {
    id: ids.uniformTypeIds[0],
    name: "TestType",
    acronym: "XX",
    issuedDefault: 1,
    usingGenerations: true,
    usingSizes: false,
    fk_defaultSizelist: null,
}

afterEach(async () => {
    await cleanup.uniformTypeConfiguration();
})
it('should update data in db', async () => {
    const { success, result } = await runServerActionTest(
        () => updateUniformType(defaultProps)
    );
    expect(success).toBeTruthy();
    if (!result) return;
    expect(Array.isArray(result)).toBeTruthy();
    expect(result).toHaveLength(4);

    expect(result[0]).toEqual(
        expect.objectContaining(defaultProps)
    );
    const dbType = await prisma.uniformType.findUniqueOrThrow({
        where: {
            id: ids.uniformTypeIds[0],
        }
    });
    expect(dbType).toEqual(
        expect.objectContaining(defaultProps)
    );
});
it('should return error for duplicated Name', async () => {
    const { success, result } = await runServerActionTest(
        () => updateUniformType({ ...defaultProps, name: 'Typ2' })
    );

    expect(success).toBeFalsy();
    expect(result.error.formElement).toEqual('name');
    expect(result.error.message).toEqual('custom.uniform.type.nameDuplication');
});
it('shold not return error if name stays the same', async () => {
    const { success, result } = await runServerActionTest(
        () => updateUniformType({ ...defaultProps, name: 'Typ1' })
    );

    expect(success).toBeTruthy();
    expect(result).toHaveLength(4);
})
it('should return error for duplicated Acronym', async () => {
    const { success, result } = await runServerActionTest(
        () => updateUniformType({ ...defaultProps, acronym: 'AB' })
    );

    expect(success).toBeFalsy();
    expect(result.error.formElement).toEqual('acronym');
    expect(result.error.message).toEqual('custom.uniform.type.acronymDuplication;name:Typ2');
});
it('shold not return error if acronym stays the same', async () => {
    const { success, result } = await runServerActionTest(
        () => updateUniformType({ ...defaultProps, acronym: 'AA' })
    );

    expect(success).toBeTruthy();
    expect(result).toHaveLength(4);
});
it('should return error if fk_defaultSizelist is null and usinsSizes true', async () => {
    const { success, result } = await runServerActionTest(
        () => updateUniformType({ ...defaultProps, usingSizes: true, fk_defaultSizelist: null })
    );

    expect(success).toBeFalsy();
    expect(result.error.formElement).toEqual('fk_defaultSizelist');
    expect(result.error.message).toEqual('pleaseSelect');
});
it('should not return error if fk_defaultSizelist is not null and usinsSizes true', async () => {
    const { success, result } = await runServerActionTest(
        () => updateUniformType({
            ...defaultProps,
            fk_defaultSizelist: ids.sizelistIds[0],
            usingSizes: true,
        })
    );

    expect(success).toBeTruthy();
    expect(result).toHaveLength(4);
});
