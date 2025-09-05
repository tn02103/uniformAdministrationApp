import { AuthRole } from "@/lib/AuthRoles";
import { getRedirectsByOrganisation } from ".";
import { cleanData } from "../_helper/testHelper";


describe('getRedirects', () => {

    beforeAll(() => {
        global.__ROLE__ = AuthRole.admin;
    });
    beforeEach(() => {
        jest.clearAllMocks();
    });
    afterAll(() => {
        delete global.__ROLE__;
    });

    it('should return redirects successfully', async () => {
        const redirects = await getRedirectsByOrganisation();

        expect(redirects).toBeDefined();
        expect(redirects).toHaveLength(4);

        expect(cleanData(redirects, ["id"])).toMatchSnapshot();
    });
});