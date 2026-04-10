import { AuthRole } from "@/lib/AuthRoles";
import { getRedirectsByOrganisation } from ".";
import { cleanData, cleanDataV2 } from "../_helper/testHelper";


describe('getRedirects', () => {

    beforeAll(() => {
        global.__ROLE__ = AuthRole.admin;
    });
    afterAll(() => {
        delete global.__ROLE__;
    });

    it('should return redirects successfully', async () => {
        const redirects = await getRedirectsByOrganisation();

        expect(redirects).toBeDefined();
        expect(redirects).toHaveLength(4);

        const cleaned = cleanDataV2(redirects);
        // 'code' contains the org index suffix (e.g. "homepage1") and is not a UUID;
        // strip it so the snapshot is stable across parallel workers.
        cleanData(cleaned, ['code']);
        expect(cleaned).toMatchSnapshot();
    });
});