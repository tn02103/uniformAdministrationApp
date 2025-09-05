import { AuthRole } from "@/lib/AuthRoles";
import { RedirectFormType } from "@/zod/redirect";
import { revalidatePath } from "next/cache";
import { updateRedirect } from "./index";

describe("<Redirect> update", () => {
    const { prisma } = jest.requireMock('@/lib/db');

    const mockOrganisation = "test-organisation-id";
    const mockProps = {
        id: "6630b7d3-b589-4c24-9419-c3994595431e",
        data: {
            code: "updated-code",
            target: "https://updated-example.com",
            active: false,
        } as RedirectFormType,
    };

    beforeAll(() => {
        global.__ROLE__ = AuthRole.admin;
    })
    beforeEach(() => {
        jest.clearAllMocks();

        prisma.redirect.findUnique.mockResolvedValue({
            id: mockProps.id,
            organisationId: mockOrganisation,
        });
        prisma.redirect.findFirst.mockResolvedValue(null);
        prisma.redirect.update.mockResolvedValue({});
    });
    afterAll(() => {
        delete global.__ROLE__;
    });

    it("should update a redirect successfully", async () => {
        const result = await updateRedirect(mockProps);

        expect(prisma.redirect.findUnique).toHaveBeenCalledWith({
            where: { id: mockProps.id },
        });
        expect(prisma.redirect.findFirst).toHaveBeenCalledWith({
            where: {
                code: mockProps.data.code,
                id: { not: mockProps.id },
            },
        });
        expect(prisma.redirect.update).toHaveBeenCalledWith({
            where: { id: mockProps.id },
            data: mockProps.data,
        });
        expect(revalidatePath).toHaveBeenCalledWith(
            `/[locale]/${mockOrganisation}/app/redirects`,
            "page"
        );
        expect(result).toBeUndefined(); // No error returned on success
    });

    it("should return an error if a redirect with the same code already exists", async () => {
        prisma.redirect.findFirst.mockResolvedValue({ id: "duplicate-id" });

        const result = await updateRedirect(mockProps);

        expect(prisma.redirect.findFirst).toHaveBeenCalledWith({
            where: {
                code: mockProps.data.code,
                id: { not: mockProps.id },
            },
        });
        expect(result).toEqual({
            error: {
                message: "common.error.custom.redirect.code.duplicate",
                formElement: "code",
            },
        });
        expect(prisma.redirect.update).not.toHaveBeenCalled();
    });

    it("should throw an error if the redirect is not found", async () => {
        prisma.redirect.findUnique.mockResolvedValue(null);

        await expect(updateRedirect(mockProps)).rejects.toThrow("Redirect not found");
        expect(prisma.redirect.findFirst).not.toHaveBeenCalled();
        expect(prisma.redirect.update).not.toHaveBeenCalled();
    });

    it("should throw an error if the redirect does not belong to the association", async () => {
        prisma.redirect.findUnique.mockResolvedValue({
            id: mockProps.id,
            organisationId: "different-association-id",
        });

        await expect(updateRedirect(mockProps)).rejects.toThrow(
            "Redirect not found in this association"
        );
        expect(prisma.redirect.findFirst).not.toHaveBeenCalled();
        expect(prisma.redirect.update).not.toHaveBeenCalled();
    });

    it("should only allow admin role", async () => {
        const {genericSAValidator} = jest.requireMock("@/actions/validations");
        
        await expect(updateRedirect(mockProps)).resolves.toBeUndefined();

        await expect(genericSAValidator).toHaveBeenCalledWith(
            AuthRole.admin,
            mockProps,
            expect.anything()
        );
    });
});
