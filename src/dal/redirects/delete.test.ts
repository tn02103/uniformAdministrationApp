
import { AuthRole } from "@/lib/AuthRoles";
import { revalidatePath } from "next/cache";
import z from "zod";
import { deleteRedirect } from "./index";
import { prismaMock } from '@test-utils/prisma-mock';
import { genericSAValidator } from "@/actions/validations";

describe("deleteRedirect", () => {
    const mockPrisma = prismaMock;

    const mockAssosiation = "test-assosiation-id";
    const mockId = "961a294a-8ac3-4329-a844-af6b85af5d68";

    beforeAll(() => {
        global.__ROLE__ = AuthRole.admin;
    })
    beforeEach(() => {
        vi.clearAllMocks();

        mockPrisma.redirect.findUnique.mockResolvedValue({
            id: mockId,
            assosiationId: mockAssosiation,
        });
        mockPrisma.redirect.delete.mockResolvedValue({});
    });
    afterAll(() => {
        delete global.__ROLE__;
    });

    it("should delete a redirect successfully", async () => {
        const result = await deleteRedirect(mockId);

        expect(mockPrisma.redirect.findUnique).toHaveBeenCalledWith({
            where: { id: mockId },
        });
        expect(mockPrisma.redirect.delete).toHaveBeenCalledWith({
            where: { id: mockId },
        });
        expect(revalidatePath).toHaveBeenCalledWith(
            `/[locale]/${mockAssosiation}/app/redirects`,
            "page"
        );
        expect(result).toBeUndefined(); // No error returned on success
    });

    it("should throw an error if the redirect is not found", async () => {
        mockPrisma.redirect.findUnique.mockResolvedValue(null);

        await expect(deleteRedirect(mockId)).rejects.toThrow("Redirect not found");
        expect(mockPrisma.redirect.delete).not.toHaveBeenCalled();
    });

    it("should throw an error if the redirect does not belong to the association", async () => {
        mockPrisma.redirect.findUnique.mockResolvedValue({
            id: mockId,
            assosiationId: "different-association-id",
        });

        await expect(deleteRedirect(mockId)).rejects.toThrow(
            "Redirect not found in this association"
        );
        expect(mockPrisma.redirect.delete).not.toHaveBeenCalled();
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
