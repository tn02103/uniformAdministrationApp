import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { useModal } from "@/components/modals/modalProvider";
import { toast } from "react-toastify";
import { AuthRole } from "@/lib/AuthRoles";
import { User } from "@/types/userTypes";
import { UserOffcanvasTwoFASection } from "./UserOffcanvasTwoFASection";

// --- DAL mocks ---
const mockAdminRemoveTwoFactorApp = vi.hoisted(() => vi.fn());
const mockAdminDisableUserTwoFA = vi.hoisted(() => vi.fn());

vi.mock("@/dal/auth", () => ({
    adminRemoveTwoFactorApp: mockAdminRemoveTwoFactorApp,
    adminDisableUserTwoFA: mockAdminDisableUserTwoFA,
    adminGetUserTwoFactorApps: vi.fn(),
}));

// --- DataFetcher mock ---
const mockMutateApps = vi.fn();
vi.mock("@/dataFetcher/user", () => ({
    useUserTwoFactorApps: vi.fn(() => ({ apps: [], mutate: mockMutateApps })),
    useUserList: vi.fn(),
}));

import * as dataFetcher from "@/dataFetcher/user";

const mockMutateUser = vi.fn();

const baseUser: User = {
    id: "user-1",
    name: "John Doe",
    username: "johndoe",
    email: "john@example.com",
    role: AuthRole.user,
    active: true,
    twoFAEnabled: false,
    default2FAMethod: null,
};

const {
    simpleYesNoModal: mockSimpleYesNoModal,
} = vi.mocked(useModal)();

describe("<UserOffcanvasTwoFASection />", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(dataFetcher.useUserTwoFactorApps).mockReturnValue({ apps: [], mutate: mockMutateApps });
        mockAdminRemoveTwoFactorApp.mockResolvedValue({ success: true as const });
        mockAdminDisableUserTwoFA.mockResolvedValue({ success: true as const });
    });

    it("renders section title and disabled status when 2FA is off", () => {
        render(<UserOffcanvasTwoFASection user={baseUser} mutateUser={mockMutateUser} />);

        expect(screen.getByText(/admin.user.twoFA.sectionTitle/)).toBeInTheDocument();
        expect(screen.getByText(/admin.user.twoFA.statusDisabled/)).toBeInTheDocument();
    });

    it("renders enabled status when 2FA is on", () => {
        const user = { ...baseUser, twoFAEnabled: true };
        render(<UserOffcanvasTwoFASection user={user} mutateUser={mockMutateUser} />);

        expect(screen.getByText(/admin.user.twoFA.statusEnabled/)).toBeInTheDocument();
    });

    it("renders empty state when no apps are registered", () => {
        vi.mocked(dataFetcher.useUserTwoFactorApps).mockReturnValue({ apps: [], mutate: mockMutateApps });

        render(<UserOffcanvasTwoFASection user={baseUser} mutateUser={mockMutateUser} />);

        expect(screen.getByText(/admin.user.twoFA.noApps/)).toBeInTheDocument();
    });

    it("renders loading skeleton when apps are undefined", () => {
        vi.mocked(dataFetcher.useUserTwoFactorApps).mockReturnValue({ apps: undefined, mutate: mockMutateApps });

        render(<UserOffcanvasTwoFASection user={baseUser} mutateUser={mockMutateUser} />);

        // No apps list and no empty state — skeleton placeholders rendered instead
        expect(screen.queryByText(/admin.user.twoFA.noApps/)).not.toBeInTheDocument();
    });

    it("renders each app with its name, verification badge, and remove button", () => {
        const apps = [
            { id: "app-1", appName: "Authenticator", createdAt: new Date(), verifiedAt: new Date() },
            { id: "app-2", appName: "Aegis", createdAt: new Date(), verifiedAt: null },
        ];
        vi.mocked(dataFetcher.useUserTwoFactorApps).mockReturnValue({ apps, mutate: mockMutateApps });

        render(<UserOffcanvasTwoFASection user={baseUser} mutateUser={mockMutateUser} />);

        expect(screen.getByText("Authenticator")).toBeInTheDocument();
        expect(screen.getByText("Aegis")).toBeInTheDocument();
        expect(screen.getAllByRole("button", { name: /admin.user.twoFA.removeApp/ })).toHaveLength(2);
        expect(screen.getByText(/admin.user.twoFA.appVerified/)).toBeInTheDocument();
        expect(screen.getByText(/admin.user.twoFA.appUnverified/)).toBeInTheDocument();
    });

    it("calls simpleYesNoModal when remove button is clicked", async () => {
        const user = userEvent.setup();
        const apps = [{ id: "app-1", appName: "Authenticator", createdAt: new Date(), verifiedAt: new Date() }];
        vi.mocked(dataFetcher.useUserTwoFactorApps).mockReturnValue({ apps, mutate: mockMutateApps });

        render(<UserOffcanvasTwoFASection user={baseUser} mutateUser={mockMutateUser} />);

        await user.click(screen.getByRole("button", { name: /admin.user.twoFA.removeApp/ }));

        expect(mockSimpleYesNoModal).toHaveBeenCalledOnce();
    });

    it("calls adminRemoveTwoFactorApp and mutates after confirmation", async () => {
        const apps = [{ id: "app-1", appName: "Authenticator", createdAt: new Date(), verifiedAt: new Date() }];
        vi.mocked(dataFetcher.useUserTwoFactorApps).mockReturnValue({ apps, mutate: mockMutateApps });
        const user = userEvent.setup();

        // Capture and invoke the primaryFunction directly
        vi.mocked(mockSimpleYesNoModal).mockImplementation(({ primaryFunction }: { primaryFunction: () => void }) => {
            primaryFunction();
        });

        render(<UserOffcanvasTwoFASection user={baseUser} mutateUser={mockMutateUser} />);

        await user.click(screen.getByRole("button", { name: /admin.user.twoFA.removeApp/ }));

        await waitFor(() => {
            expect(mockAdminRemoveTwoFactorApp).toHaveBeenCalledWith({ userId: "user-1", appId: "app-1" });
            expect(mockMutateApps).toHaveBeenCalled();
            expect(toast.success).toHaveBeenCalled();
        });
    });

    it("shows toast error when adminRemoveTwoFactorApp fails", async () => {
        const apps = [{ id: "app-1", appName: "Authenticator", createdAt: new Date(), verifiedAt: new Date() }];
        vi.mocked(dataFetcher.useUserTwoFactorApps).mockReturnValue({ apps, mutate: mockMutateApps });
        mockAdminRemoveTwoFactorApp.mockRejectedValue(new Error("fail"));

        const user = userEvent.setup();
        vi.mocked(mockSimpleYesNoModal).mockImplementation(({ primaryFunction }: { primaryFunction: () => void }) => {
            primaryFunction();
        });

        render(<UserOffcanvasTwoFASection user={baseUser} mutateUser={mockMutateUser} />);

        await user.click(screen.getByRole("button", { name: /admin.user.twoFA.removeApp/ }));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalled();
        });
    });

    it("shows force disable button only when 2FA is enabled", () => {
        render(<UserOffcanvasTwoFASection user={baseUser} mutateUser={mockMutateUser} />);
        expect(screen.queryByRole("button", { name: /admin.user.twoFA.forceDisable/ })).not.toBeInTheDocument();

        const enabledUser = { ...baseUser, twoFAEnabled: true };
        render(<UserOffcanvasTwoFASection user={enabledUser} mutateUser={mockMutateUser} />);
        expect(screen.getByRole("button", { name: /admin.user.twoFA.forceDisable/ })).toBeInTheDocument();
    });

    it("calls simpleYesNoModal when force disable button is clicked", async () => {
        const user = userEvent.setup();
        const enabledUser = { ...baseUser, twoFAEnabled: true };

        render(<UserOffcanvasTwoFASection user={enabledUser} mutateUser={mockMutateUser} />);

        await user.click(screen.getByRole("button", { name: /admin.user.twoFA.forceDisable/ }));

        expect(vi.mocked(mockSimpleYesNoModal)).toHaveBeenCalledOnce();
    });

    it("calls adminDisableUserTwoFA and mutates user after force disable confirmation", async () => {
        const enabledUser = { ...baseUser, twoFAEnabled: true };
        const user = userEvent.setup();

        vi.mocked(mockSimpleYesNoModal).mockImplementation(({ primaryFunction }: { primaryFunction: () => void }) => {
            primaryFunction();
        });

        render(<UserOffcanvasTwoFASection user={enabledUser} mutateUser={mockMutateUser} />);

        await user.click(screen.getByRole("button", { name: /admin.user.twoFA.forceDisable/ }));

        await waitFor(() => {
            expect(mockAdminDisableUserTwoFA).toHaveBeenCalledWith({ userId: "user-1" });
            expect(mockMutateUser).toHaveBeenCalled();
            expect(toast.success).toHaveBeenCalled();
        });
    });

    it("shows toast error when adminDisableUserTwoFA fails", async () => {
        const enabledUser = { ...baseUser, twoFAEnabled: true };
        mockAdminDisableUserTwoFA.mockRejectedValue(new Error("fail"));

        const user = userEvent.setup();
        vi.mocked(mockSimpleYesNoModal).mockImplementation(({ primaryFunction }: { primaryFunction: () => void }) => {
            primaryFunction();
        });

        render(<UserOffcanvasTwoFASection user={enabledUser} mutateUser={mockMutateUser} />);

        await user.click(screen.getByRole("button", { name: /admin.user.twoFA.forceDisable/ }));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalled();
        });
    });
});
