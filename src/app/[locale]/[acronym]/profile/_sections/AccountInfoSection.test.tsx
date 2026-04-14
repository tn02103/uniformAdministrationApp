import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AccountInfoSection } from "./AccountInfoSection";
import type { OwnProfileData } from "@/dataFetcher/profile";
import { AuthRole } from "@/lib/AuthRoles";

vi.mock("../ChangePasswordModal", () => ({
    ChangePasswordModal: vi.fn(({ onClose }: { onClose: () => void }) => (
        <div data-testid="mock-change-password-modal">
            <button onClick={onClose}>Close Password Modal</button>
        </div>
    )),
}));

const mockProfile: OwnProfileData = {
    id: "user-1",
    name: "Jane Doe",
    username: "janedoe",
    email: "jane@example.com",
    role: AuthRole.inspector,
    active: true,
    twoFAEnabled: false,
    default2FAMethod: null,
    organisation: {
        name: "Alpha Org",
        organisationConfiguration: {
            twoFactorAuthRule: "optional",
        },
    },
    twoFactorApps: [],
    devices: [],
};

describe("AccountInfoSection", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("data display", () => {
        it("renders the section with data-testid", () => {
            render(<AccountInfoSection profile={mockProfile} />);
            expect(screen.getByTestId("section-accountInfo")).toBeInTheDocument();
        });

        it("displays the user's name", () => {
            render(<AccountInfoSection profile={mockProfile} />);
            expect(screen.getByText("Jane Doe")).toBeInTheDocument();
        });

        it("displays the user's username", () => {
            render(<AccountInfoSection profile={mockProfile} />);
            expect(screen.getByText("janedoe")).toBeInTheDocument();
        });

        it("displays the user's email", () => {
            render(<AccountInfoSection profile={mockProfile} />);
            expect(screen.getByText("jane@example.com")).toBeInTheDocument();
        });

        it("displays the organisation name", () => {
            render(<AccountInfoSection profile={mockProfile} />);
            expect(screen.getByText("Alpha Org")).toBeInTheDocument();
        });

        it("displays the change password button", () => {
            render(<AccountInfoSection profile={mockProfile} />);
            expect(
                screen.getByRole("button", { name: "profile.accountInfo.password.changeButton" })
            ).toBeInTheDocument();
        });
    });

    describe("change password modal", () => {
        it("does not render the password modal initially", () => {
            render(<AccountInfoSection profile={mockProfile} />);
            expect(screen.queryByTestId("mock-change-password-modal")).toBeNull();
        });

        it("opens the change-password modal when the button is clicked", async () => {
            const user = userEvent.setup();
            render(<AccountInfoSection profile={mockProfile} />);

            await user.click(
                screen.getByRole("button", { name: "profile.accountInfo.password.changeButton" })
            );

            expect(screen.getByTestId("mock-change-password-modal")).toBeInTheDocument();
        });

        it("closes the change-password modal when modal calls onClose", async () => {
            const user = userEvent.setup();
            render(<AccountInfoSection profile={mockProfile} />);

            await user.click(
                screen.getByRole("button", { name: "profile.accountInfo.password.changeButton" })
            );
            expect(screen.getByTestId("mock-change-password-modal")).toBeInTheDocument();

            await user.click(screen.getByRole("button", { name: "Close Password Modal" }));
            expect(screen.queryByTestId("mock-change-password-modal")).toBeNull();
        });
    });
});
