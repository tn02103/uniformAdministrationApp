import { genericSAValidatiorV2, genericSAValidator } from "@/actions/validations";
import { AuthRole } from "@/lib/AuthRoles";
import { StaticData } from "../../_playwrightConfig/testData/staticDataLoader";
import { z } from "zod";

const staticData = new StaticData(0);
describe('genericSAValidatorV2', () => {
    it('validate correct role', async () => {
        const result = await genericSAValidatiorV2(AuthRole.materialManager, true, {});
        expect(result).toEqual({
            name: 'VK Verwaltung',
            username: 'mana',
            assosiation: staticData.data.assosiation.id,
            acronym: staticData.data.assosiation.acronym,
            role: AuthRole.materialManager
        });
    });
    it('validate unauthorized exeption genericSAValidatorV2', async () => {
        const error = await genericSAValidatiorV2(AuthRole.admin, true, {})
            .catch((error) => error);

        expect(error.message).toBe('user does not have required role 4');
        expect(error.exceptionType).toBe(4);
    });
    it('validate typevalidation genericSAValidatorV2', async () => {
        const error = await genericSAValidatiorV2(AuthRole.inspector, false, {})
            .catch((error) => error);

        expect(error.message).toBe('Typevalidation failed');
        expect(error.exceptionType).toBeUndefined();
    });
});
describe('genericSAValidator', () => {
    it('validate correct role', async () => {
        const result = await genericSAValidator(AuthRole.materialManager, "somestring", z.string(), {});
        expect(result[0]).toEqual("somestring");
        expect(result[1]).toEqual({
            name: 'VK Verwaltung',
            username: 'mana',
            assosiation: staticData.data.assosiation.id,
            acronym: staticData.data.assosiation.acronym,
            role: AuthRole.materialManager
        });
    });
    it('validate unauthorized exeption', async () => {
        const error = await genericSAValidator(AuthRole.admin, "somestring", z.string(), {})
            .catch((error) => error);

        expect(error.message).toBe('user does not have required role 4');
        expect(error.exceptionType).toBe(4);
    });
    it('validate typevalidation', async () => {
        const error = await genericSAValidator(AuthRole.inspector, 983, z.string(), {})
            .catch((error) => error);

        expect(error.issues[0].code).toBe('invalid_type');
        expect(error.issues[0].message).toBe('Expected string, received number');
    });
});
