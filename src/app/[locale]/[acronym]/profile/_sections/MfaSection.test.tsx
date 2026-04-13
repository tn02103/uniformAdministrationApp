import React from "react";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "react-toastify";
import { useModal } from "@/components/modals/modalProvider";
import { removeMfaApp, setDefaultMfaMethod, toggleUserMfa } from "@/dal/auth/index";
import { MfaSection } from "./MfaSection";
import type { OwnProfileData } from "@/dataFetcher/profile";
import { AuthRole } from "@/lib/AuthRoles";

vi.mock("@/dal/auth/index", () => ({
    removeMfaApp: vi.fn(),
    setDefaultMfaMethod: vi.fn(),
    toggleUserMfa: vi.fn(),
}));

vi.mock("../AddTwoFactorAppModal", () => ({
    AddTwoFactorAppModal: vi.fn(({ onClose }: { onClose: () => void }) => (
        <div data-testid="mock-add-totp-modal">
            <button onClick={onClose}>Close Add Modal</button>
        </div>
    )),
}));

const mockMutate = vi.fn();

const baseProfile: OwnProfileData = {
    id: "user-1",
    name: "Test User",
    username: "testuser",
    email: "test@example.com",
    role: AuthRole.user,
    active: true,
    twoFAEnabled: true,
    default2FAMethod: "email",
    organisation: {
        name: "Test Org",
        organisationConfiguration: {
            twoFactorAuthRule: "optional",
        },
    },
    twoFactorApps: [
        { id: "app-1", appName: "My Authenticator", verifiedAt: new Date("2024-01-15") },
        { id: "app-2", appName: "Backup App", verifiedAt: new Date("2024-03-01") },
    ],
    devices: [],
};

describe("MfaSection", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(removeMfaApp).mockResolvedValue({success: true});
        vi.mocked(setDefaultMfaMethod).mockResolvedValue(undefined);
        vi.mocked(toggleUserMfa).mockResolvedValue(undefined);
        mockMutate.mockResolvedValue(undefined);
    });

    describe("rendering", () => {
        it("renders the section with data-testid", () => {
            render(<MfaSection profile={baseProfile} mutate={mockMutate} />);
            expect(screen.getByTestId("section-mfa")).toBeInTheDocument();
        });

        it("renders all TOTP app names in the list", () => {
            render(<MfaSection profile={baseProfile} mutate={mockMutate} />);
            // Each app name appears in both the list and the select options
            expect(screen.getAllByText("My Authenticator").length).toBeGreaterThanOrEqual(1);
            expect(screen.getAllByText("Backup App").length).toBeGreaterThanOrEqual(1);
        });

        it("renders verified date for each app", () => {
            render(<MfaSection profile={baseProfile} mutate={mockMutate} />);
            // verifiedAt dates should be displayed
            expect(screen.getByText(new Date("2024-01-15").toLocaleDateString())).toBeInTheDocument();
        });

        it("shows 'no apps' message when twoFactorApps is empty", () => {
            const profile = { ...baseProfile, twoFactorApps: [] };
            render(<MfaSection profile={profile} mutate={mockMutate} />);
            expect(screen.getByText("profile.twoFactor.apps.noApps")).toBeInTheDocument();
        });

        it("shows disable toggle button when 2FA is enabled and rule is optional", () => {
            render(<MfaSection profile={baseProfile} mutate={mockMutate} />);
            expect(screen.getByRole("button", { name: /profile\.twoFactor\.disableToggle/i })).toBeInTheDocument();
        });

        it("shows enable toggle button when 2FA is disabled and rule is optional", () => {
            const profile = { ...baseProfile, twoFAEnabled: false };
            render(<MfaSection profile={profile} mutate={mockMutate} />);
            expect(screen.getByRole("button", { name: /profile\.twoFactor\.enableToggle/i })).toBeInTheDocument();
        });

        it("hides toggle when twoFactorAuthRule is required", () => {
            const profile = {
                ...baseProfile,
                organisation: {
                    name: "Test Org",
                    organisationConfiguration: { twoFactorAuthRule: "required"},
                },
            } as OwnProfileData;
            render(<MfaSection profile={profile} mutate={mockMutate} />);
            expect(screen.queryByRole("button", { name: /disable|enable|deactivate|activate/i })).toBeNull();
        });

        it("hides toggle when twoFactorAuthRule is administrators and user is admin", () => {
            const profile = {
                ...baseProfile,
                role: AuthRole.admin,
                organisation: {
                    name: "Test Org",
                    organisationConfiguration: { twoFactorAuthRule: "administrators"},
                },
            } as OwnProfileData;
            render(<MfaSection profile={profile} mutate={mockMutate} />);
            expect(screen.queryByRole("button", { name: /disable|enable|deactivate|activate/i })).toBeNull();
        });

        it("renders the add app button", () => {
            render(<MfaSection profile={baseProfile} mutate={mockMutate} />);
            expect(screen.getByRole("button", { name: "profile.twoFactor.apps.addNew" })).toBeInTheDocument();
        });
    });

    describe("toggle 2FA", () => {
        it("calls toggleUserMfa with enabled=false when disabling (2FA currently on)", async () => {
            const user = userEvent.setup();
            const { simpleWarningModal } = vi.mocked(useModal)();
            render(<MfaSection profile={baseProfile} mutate={mockMutate} />);

            await user.click(screen.getByRole("button", { name: /profile\.twoFactor\.disableToggle/i }));

            expect(simpleWarningModal).toHaveBeenCalledTimes(1);
            await act(async () => {
                await vi.mocked(simpleWarningModal).mock.calls[0][0].primaryFunction();
            });

            expect(toggleUserMfa).toHaveBeenCalledWith({ enabled: false });
            expect(mockMutate).toHaveBeenCalled();
        });

        it("calls toggleUserMfa with enabled=true directly when enabling (no modal)", async () => {
            const user = userEvent.setup();
            const profile = { ...baseProfile, twoFAEnabled: false };
            render(<MfaSection profile={profile} mutate={mockMutate} />);

            await user.click(screen.getByRole("button", { name: /profile\.twoFactor\.enableToggle/i }));

            expect(toggleUserMfa).toHaveBeenCalledWith({ enabled: true });
            expect(mockMutate).toHaveBeenCalled();
        });

        it("shows error toast when toggleUserMfa throws", async () => {
            const user = userEvent.setup();
            const profile = { ...baseProfile, twoFAEnabled: false };
            vi.mocked(toggleUserMfa).mockRejectedValue(new Error("Network error"));
            render(<MfaSection profile={profile} mutate={mockMutate} />);

            await user.click(screen.getByRole("button", { name: /profile\.twoFactor\.enableToggle/i }));

            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith("profile.twoFactor.errors.toggleFailed");
            });
        });
    });

    describe("remove app", () => {
        it("opens warning modal when delete button is clicked", async () => {
            const user = userEvent.setup();
            const { simpleWarningModal } = vi.mocked(useModal)();
            render(<MfaSection profile={baseProfile} mutate={mockMutate} />);

            const listItems = screen.getAllByRole("listitem");
            const appItem = listItems.find((li) => within(li).queryByText("My Authenticator") !== null);
            const deleteBtn = within(appItem!).getByRole("button");
            await user.click(deleteBtn);

            expect(simpleWarningModal).toHaveBeenCalledTimes(1);
        });

        it("calls removeMfaApp with the correct appId on confirmation", async () => {
            const user = userEvent.setup();
            const { simpleWarningModal } = vi.mocked(useModal)();
            render(<MfaSection profile={baseProfile} mutate={mockMutate} />);

            const listItems2 = screen.getAllByRole("listitem");
            const appItem2 = listItems2.find((li) => within(li).queryByText("My Authenticator") !== null);
            const deleteBtn2 = within(appItem2!).getByRole("button");
            await user.click(deleteBtn2);

            await act(async () => {
                await vi.mocked(simpleWarningModal).mock.calls[0][0].primaryFunction();
            });

            expect(removeMfaApp).toHaveBeenCalledWith({ appId: "app-1" });
            expect(mockMutate).toHaveBeenCalled();
        });

        it("shows error toast when removeMfaApp throws", async () => {
            const user = userEvent.setup();
            const { simpleWarningModal } = vi.mocked(useModal)();
            vi.mocked(removeMfaApp).mockRejectedValue(new Error("Server error"));
            render(<MfaSection profile={baseProfile} mutate={mockMutate} />);

            const listItems3 = screen.getAllByRole("listitem");
            const appItem3 = listItems3.find((li) => within(li).queryByText("My Authenticator") !== null);
            const deleteBtn3 = within(appItem3!).getByRole("button");
            await user.click(deleteBtn3);

            await act(async () => {
                await vi.mocked(simpleWarningModal).mock.calls[0][0].primaryFunction();
            });

            expect(toast.error).toHaveBeenCalledWith("profile.twoFactor.errors.removeFailed");
        });
    });

    describe("default method", () => {
        it("calls setDefaultMfaMethod when select value changes", async () => {
            const user = userEvent.setup();
            render(<MfaSection profile={baseProfile} mutate={mockMutate} />);

            const select = screen.getByRole("combobox");
            await user.selectOptions(select, "app-1");

            expect(setDefaultMfaMethod).toHaveBeenCalledWith({ method: "app-1" });
            expect(mockMutate).toHaveBeenCalled();
        });

        it("shows error toast when setDefaultMfaMethod throws", async () => {
            const user = userEvent.setup();
            vi.mocked(setDefaultMfaMethod).mockRejectedValue(new Error("Server error"));
            render(<MfaSection profile={baseProfile} mutate={mockMutate} />);

            const select = screen.getByRole("combobox");
            await user.selectOptions(select, "app-1");

            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith("profile.twoFactor.errors.defaultMethodFailed");
            });
        });
    });

    describe("add app modal", () => {
        it("opens AddTwoFactorAppModal when add button is clicked", async () => {
            const user = userEvent.setup();
            render(<MfaSection profile={baseProfile} mutate={mockMutate} />);

            expect(screen.queryByTestId("mock-add-totp-modal")).toBeNull();

            await user.click(screen.getByRole("button", { name: "profile.twoFactor.apps.addNew" }));

            expect(screen.getByTestId("mock-add-totp-modal")).toBeInTheDocument();
        });

        it("closes AddTwoFactorAppModal and mutates when modal closes", async () => {
            const user = userEvent.setup();
            render(<MfaSection profile={baseProfile} mutate={mockMutate} />);

            await user.click(screen.getByRole("button", { name: "profile.twoFactor.apps.addNew" }));
            expect(screen.getByTestId("mock-add-totp-modal")).toBeInTheDocument();

            await user.click(screen.getByRole("button", { name: "Close Add Modal" }));

            expect(screen.queryByTestId("mock-add-totp-modal")).toBeNull();
            expect(mockMutate).toHaveBeenCalled();
        });
    });
});
