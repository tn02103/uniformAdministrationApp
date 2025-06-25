import { AuthRole } from "@/lib/AuthRoles";
import { createRedirect } from "./index";
import { prisma } from "@/lib/db";
import { RedirectFormType } from "@/zod/redirect";
import { revalidatePath } from "next/cache";

jest.mock("@/lib/db", () => ({
    prisma: {
        redirect: {
            findFirst: jest.fn(),
            create: jest.fn(),
        },
    },
}));

jest.mock("next/cache", () => ({
    revalidatePath: jest.fn(),
}));

describe("createRedirect", () => {
    const mockAssosiation = "mock-association-id";
    const mockProps: RedirectFormType = {
        code: "test-code",
        target: "https://example.com",
        active: true,
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

    it("should create a redirect successfully", async () => {
        (prisma.redirect.findFirst as jest.Mock).mockResolvedValue(null);
        (prisma.redirect.create as jest.Mock).mockResolvedValue({});

        const result = await createRedirect(mockProps);

        expect(prisma.redirect.findFirst).toHaveBeenCalledWith({
            where: { code: mockProps.code },
        });
        expect(prisma.redirect.create).toHaveBeenCalledWith({
            data: {
                ...mockProps,
                assosiationId: mockAssosiation,
            },
        });
        expect(revalidatePath).toHaveBeenCalledWith(
            `/[locale]/${mockAssosiation}/app/redirects`,
            "page"
        );
        expect(result).toBeUndefined(); // No error returned on success
    });

    it("should return an error if a redirect with the same code already exists", async () => {
        (prisma.redirect.findFirst as jest.Mock).mockResolvedValue({ id: "existing-id" });

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

    it("should throw an error if validation fails", async () => {
        const invalidProps = { ...mockProps, code: "" }; // Invalid code

        await expect(createRedirect(invalidProps)).rejects.toThrow();
        expect(prisma.redirect.findFirst).not.toHaveBeenCalled();
        expect(prisma.redirect.create).not.toHaveBeenCalled();
    });
});
