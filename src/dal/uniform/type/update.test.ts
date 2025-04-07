import { runServerActionTest } from "@/dal/_helper/testHelper";
import { prisma } from "@/lib/db";
import { StaticData } from "../../../../tests/_playwrightConfig/testData/staticDataLoader";
import { update } from "./update";
import { UniformTypeFormType } from "@/zod/uniformConfig";
import { ZodError } from "zod";

const { ids, cleanup } = new StaticData(0);
const defaultProps = {
    id: ids.uniformTypeIds[0],
    data: {
        name: "TestType",
        acronym: "XX",
        issuedDefault: 1,
        usingGenerations: true,
        usingSizes: false,
        fk_defaultSizelist: null,
    }
}
const getProps = (formData: Partial<UniformTypeFormType>) => {
    return {
        ...defaultProps,
        data: {
            ...defaultProps.data,
            ...formData
        }
    }
}
afterEach(async () => {
    await cleanup.uniformTypeConfiguration();
})
describe('<UniformType> update', () => {
    it('should update data in db', async () => {
        const { success, result } = await runServerActionTest(
            update(defaultProps)
        );
        expect(success).toBeTruthy();
        if (!result) return;
        expect(Array.isArray(result)).toBeTruthy();
        expect(result).toHaveLength(4);

        expect(result[0]).toEqual(
            expect.objectContaining(defaultProps.data)
        );
        const dbType = await prisma.uniformType.findUniqueOrThrow({
            where: {
                id: ids.uniformTypeIds[0],
            }
        });
        expect(dbType).toEqual(
            expect.objectContaining(defaultProps.data)
        );
    });
    it('should return error for duplicated Name', async () => {
        const { success, result } = await runServerActionTest(
            update(getProps({ name: 'Typ2' }))
        );

        expect(success).toBeFalsy();
        expect(result.error.formElement).toEqual('name');
        expect(result.error.message).toEqual('custom.uniform.type.nameDuplication');
    });
    it('shold not return error if name stays the same', async () => {
        const { success, result } = await runServerActionTest(
            update(getProps({ name: 'Typ1' }))
        );

        expect(success).toBeTruthy();
        expect(result).toHaveLength(4);
    })
    it('should return error for duplicated Acronym', async () => {
        const { success, result } = await runServerActionTest(
            update(getProps({ acronym: 'AB' }))
        );

        expect(success).toBeFalsy();
        expect(result.error.formElement).toEqual('acronym');
        expect(result.error.message).toEqual('custom.uniform.type.acronymDuplication;name:Typ2');
    });
    it('shold not return error if acronym stays the same', async () => {
        const { success, result } = await runServerActionTest(
            update(getProps({ acronym: 'AA' }))
        );

        expect(success).toBeTruthy();
        expect(result).toHaveLength(4);
    });
    it('should return error if fk_defaultSizelist is null and usinsSizes true', async () => {
        const { success, result } = await runServerActionTest(
            update(getProps({ usingSizes: true, fk_defaultSizelist: null }))
        );

        expect(success).toBeFalsy();
        expect(result instanceof ZodError).toBeTruthy();
        expect(result.errors[0].path[1]).toEqual('fk_defaultSizelist');
        expect(result.errors[0].message).toEqual('string.required');
    });
    it('should not return error if fk_defaultSizelist is not null and usinsSizes true', async () => {
        const { success, result } = await runServerActionTest(
            update(getProps({
                fk_defaultSizelist: ids.sizelistIds[0],
                usingSizes: true,
            }))
        );

        expect(success).toBeTruthy();
        expect(result).toHaveLength(4);
    });
});
