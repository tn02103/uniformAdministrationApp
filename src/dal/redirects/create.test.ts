
import { AuthRole } from "@/lib/AuthRoles";
import { createRedirect } from "./index";
import { RedirectFormSchema, RedirectFormType } from "@/zod/redirect";
import { revalidatePath } from "next/cache";
import { prismaMock } from '@test-utils/prisma-mock';
import { genericSAValidator } from "@/actions/validations";


describe("createRedirect", () => {

    const mockOrganisation = "test-organisation-id";
    const mockProps: RedirectFormType = {
        code: "test-code",
        target: "https://example.com",
        active: true,
    };

    beforeAll(() => {
        global.__ROLE__ = AuthRole.admin;
    })
    beforeEach(() => {
        vi.clearAllMocks();
    });
    afterAll(() => {
        delete global.__ROLE__;
    });

    it("should create a redirect successfully", async () => {
        prismaMock.redirect.findFirst.mockResolvedValue(null);
        prismaMock.redirect.create.mockResolvedValue({});

        const result = await createRedirect(mockProps);

        expect(prismaMock.redirect.findFirst).toHaveBeenCalledWith({
            where: { code: mockProps.code },
        });
        expect(prismaMock.redirect.create).toHaveBeenCalledWith({
            data: {
                ...mockProps,
                organisationId: mockOrganisation,
            },
        });
        expect(revalidatePath).toHaveBeenCalledWith(
            `/[locale]/${mockOrganisation}/app/redirects`,
            "page"
        );
        expect(result).toBeUndefined(); // No error returned on success
    });

    it("should return an error if a redirect with the same code already exists", async () => {
        prismaMock.redirect.findFirst.mockResolvedValue({ id: "existing-id" });

        const result = await createRedirect(mockProps);

        expect(prismaMock.redirect.findFirst).toHaveBeenCalledWith({
            where: { code: mockProps.code },
        });
        expect(result).toEqual({
            error: {
                message: "common.error.custom.redirect.code.duplicate",
                formElement: "code",
            },
        });
        expect(prismaMock.redirect.create).not.toHaveBeenCalled();
    });

    it("should call genericSAValidator with correct parameters", async () => {
        await createRedirect(mockProps);

        expect(vi.mocked(genericSAValidator)).toHaveBeenCalledWith(
            AuthRole.admin,
            mockProps,
            RedirectFormSchema,
            {}
        );
    });
});
