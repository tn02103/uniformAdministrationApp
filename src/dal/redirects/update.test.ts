import { AuthRole } from "@/lib/AuthRoles";
import { updateRedirect } from "./index";
import { prisma } from "@/lib/db";
import { RedirectFormType } from "@/zod/redirect";
import { revalidatePath } from "next/cache";

jest.mock("@/lib/db", () => ({
    prisma: {
        redirect: {
            findUnique: jest.fn(),
            findFirst: jest.fn(),
            update: jest.fn(),
        },
    },
}));

jest.mock("next/cache", () => ({
    revalidatePath: jest.fn(),
}));

describe("updateRedirect", () => {
    const mockAssosiation = "mock-association-id";
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
        global.__ASSOSIATION__ = mockAssosiation;
    })
    beforeEach(() => {
        jest.clearAllMocks();
    });
    afterAll(() => {
        delete global.__ROLE__;
        delete global.__ASSOSIATION__;
    });

    it("should update a redirect successfully", async () => {
        (prisma.redirect.findUnique as jest.Mock).mockResolvedValue({
            id: mockProps.id,
            assosiationId: mockAssosiation,
        });
        (prisma.redirect.findFirst as jest.Mock).mockResolvedValue(null);
        (prisma.redirect.update as jest.Mock).mockResolvedValue({});

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
            `/[locale]/${mockAssosiation}/app/redirects`,
            "page"
        );
        expect(result).toBeUndefined(); // No error returned on success
    });

    it("should return an error if a redirect with the same code already exists", async () => {
        (prisma.redirect.findUnique as jest.Mock).mockResolvedValue({
            id: mockProps.id,
            assosiationId: mockAssosiation,
        });
        (prisma.redirect.findFirst as jest.Mock).mockResolvedValue({ id: "duplicate-id" });

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
        (prisma.redirect.findUnique as jest.Mock).mockResolvedValue(null);

        await expect(updateRedirect(mockProps)).rejects.toThrow("Redirect not found");
        expect(prisma.redirect.findFirst).not.toHaveBeenCalled();
        expect(prisma.redirect.update).not.toHaveBeenCalled();
    });

    it("should throw an error if the redirect does not belong to the association", async () => {
        (prisma.redirect.findUnique as jest.Mock).mockResolvedValue({
            id: mockProps.id,
            assosiationId: "different-association-id",
        });

        await expect(updateRedirect(mockProps)).rejects.toThrow(
            "Redirect not found in this association"
        );
        expect(prisma.redirect.findFirst).not.toHaveBeenCalled();
        expect(prisma.redirect.update).not.toHaveBeenCalled();
    });
});
