import { AuthRole } from "@/lib/AuthRoles";
import { deleteRedirect } from "./index";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

jest.mock("@/lib/db", () => ({
    prisma: {
        redirect: {
            findUnique: jest.fn(),
            delete: jest.fn(),
        },
    },
}));

jest.mock("next/cache", () => ({
    revalidatePath: jest.fn(),
}));

describe("deleteRedirect", () => {
    const mockAssosiation = "mock-association-id";
    const mockId = "961a294a-8ac3-4329-a844-af6b85af5d68";
    
    beforeAll(() => {
        global.__ROLE__ = AuthRole.admin;
        global.__ASSOSIATION__ = mockAssosiation;
    })
    beforeEach(() => {
        jest.clearAllMocks();
    });
    afterAll(() => {
        delete global.__ROLE__;
        delete global.__ASSOSIATION__;
    });

    it("should delete a redirect successfully", async () => {
        (prisma.redirect.findUnique as jest.Mock).mockResolvedValue({
            id: mockId,
            assosiationId: mockAssosiation,
        });
        (prisma.redirect.delete as jest.Mock).mockResolvedValue({});

        const result = await deleteRedirect(mockId);

        expect(prisma.redirect.findUnique).toHaveBeenCalledWith({
            where: { id: mockId },
        });
        expect(prisma.redirect.delete).toHaveBeenCalledWith({
            where: { id: mockId },
        });
        expect(revalidatePath).toHaveBeenCalledWith(
            `/[locale]/${mockAssosiation}/app/redirects`,
            "page"
        );
        expect(result).toBeUndefined(); // No error returned on success
    });

    it("should throw an error if the redirect is not found", async () => {
        (prisma.redirect.findUnique as jest.Mock).mockResolvedValue(null);

        await expect(deleteRedirect(mockId)).rejects.toThrow("Redirect not found");
        expect(prisma.redirect.delete).not.toHaveBeenCalled();
    });

    it("should throw an error if the redirect does not belong to the association", async () => {
        (prisma.redirect.findUnique as jest.Mock).mockResolvedValue({
            id: mockId,
            assosiationId: "different-association-id",
        });

        await expect(deleteRedirect(mockId)).rejects.toThrow(
            "Redirect not found in this association"
        );
        expect(prisma.redirect.delete).not.toHaveBeenCalled();
    });
});
