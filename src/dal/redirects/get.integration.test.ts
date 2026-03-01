import { AuthRole } from "@/lib/AuthRoles";
import { getRedirectsByAssosiation } from ".";
import { cleanData } from "../_helper/testHelper";


describe('getRedirects', () => {

    beforeAll(() => {
        global.__ROLE__ = AuthRole.admin;
    });
    afterAll(() => {
        delete global.__ROLE__;
    });

    it('should return redirects successfully', async () => {
        const redirects = await getRedirectsByAssosiation();

        expect(redirects).toBeDefined();
        expect(redirects).toHaveLength(4);

        expect(cleanData(redirects, ["id"])).toMatchSnapshot();
    });
});