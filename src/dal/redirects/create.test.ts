import { AuthRole } from "@/lib/AuthRoles";
import { createRedirect } from "./index";
import { RedirectFormSchema, RedirectFormType } from "@/zod/redirect";
import { revalidatePath } from "next/cache";


describe("createRedirect", () => {
    const { prisma } = jest.requireMock('@/lib/db');

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
        jest.clearAllMocks();
    });
    afterAll(() => {
        delete global.__ROLE__;
    });

    it("should create a redirect successfully", async () => {
        prisma.redirect.findFirst.mockResolvedValue(null);
        prisma.redirect.create.mockResolvedValue({});

        const result = await createRedirect(mockProps);

        expect(prisma.redirect.findFirst).toHaveBeenCalledWith({
            where: { code: mockProps.code },
        });
        expect(prisma.redirect.create).toHaveBeenCalledWith({
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
        prisma.redirect.findFirst.mockResolvedValue({ id: "existing-id" });

        const result = await createRedirect(mockProps);

        expect(prisma.redirect.findFirst).toHaveBeenCalledWith({
            where: { code: mockProps.code },
        });
        expect(result).toEqual({
            error: {
                message: "common.error.custom.redirect.code.duplicate",
                formElement: "code",
            },
        });
        expect(prisma.redirect.create).not.toHaveBeenCalled();
    });

    it("should call genericSAValidator with correct parameters", async () => {
        const { genericSAValidator } = jest.requireMock("@/actions/validations");
        await createRedirect(mockProps);

        expect(genericSAValidator).toHaveBeenCalledWith(
            AuthRole.admin,
            mockProps,
            RedirectFormSchema,
            {}
        );
    });
});
