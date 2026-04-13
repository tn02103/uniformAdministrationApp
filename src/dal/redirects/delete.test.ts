
import { AuthRole } from "@/lib/AuthRoles";
import { revalidatePath } from "next/cache";
import z from "zod";
import { deleteRedirect } from "./index";
import { prismaMock } from '@test-utils/prisma-mock';
import { genericSAValidator } from "@/actions/validations";

describe("deleteRedirect", () => {

    const mockOrganisation = "test-organisation-id";
    const mockId = "961a294a-8ac3-4329-a844-af6b85af5d68";

    beforeAll(() => {
        global.__ROLE__ = AuthRole.admin;
    })
    beforeEach(() => {
        vi.clearAllMocks();

        prismaMock.redirect.findUnique.mockResolvedValue({
            id: mockId,
            organisationId: mockOrganisation,
        });
        prismaMock.redirect.delete.mockResolvedValue({});
    });
    afterAll(() => {
        delete global.__ROLE__;
    });

    it("should delete a redirect successfully", async () => {
        const result = await deleteRedirect(mockId);

        expect(prismaMock.redirect.findUnique).toHaveBeenCalledWith({
            where: { id: mockId },
        });
        expect(prismaMock.redirect.delete).toHaveBeenCalledWith({
            where: { id: mockId },
        });
        expect(revalidatePath).toHaveBeenCalledWith(
            `/[locale]/${mockOrganisation}/app/redirects`,
            "page"
        );
        expect(result).toBeUndefined(); // No error returned on success
    });

    it("should throw an error if the redirect is not found", async () => {
        prismaMock.redirect.findUnique.mockResolvedValue(null);

        await expect(deleteRedirect(mockId)).rejects.toThrow("Redirect not found");
        expect(prismaMock.redirect.delete).not.toHaveBeenCalled();
    });

    it("should throw an error if the redirect does not belong to the association", async () => {
        prismaMock.redirect.findUnique.mockResolvedValue({
            id: mockId,
            organisationId: "different-association-id",
        });

        await expect(deleteRedirect(mockId)).rejects.toThrow(
            "Redirect not found in this association"
        );
        expect(prismaMock.redirect.delete).not.toHaveBeenCalled();
    });

    it("should call genericSAValidator with correct parameters", async () => {
        await deleteRedirect(mockId);

        expect(vi.mocked(genericSAValidator)).toHaveBeenCalledWith(
            AuthRole.admin,
            mockId,
            expect.any(z.ZodType),
            {}
        );
    });
});
