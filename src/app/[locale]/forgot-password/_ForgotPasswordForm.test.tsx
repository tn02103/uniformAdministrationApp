import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ForgotPasswordForm from "./_ForgotPasswordForm";
import { requestPasswordReset } from "@/dal/auth";
import { Organisation } from "@/prisma/client";

vi.mock("@/dal/auth", () => ({
    requestPasswordReset: vi.fn(),
}));

const mockRequestPasswordReset = vi.mocked(requestPasswordReset);

const mockOrganisations: Pick<Organisation, "id" | "name" | "acronym">[] = [
    { id: "00000000-0000-0000-0000-000000000001", name: "Test Org", acronym: "TO" },
    { id: "00000000-0000-0000-0000-000000000002", name: "Other Org", acronym: "OO" },
];

describe("ForgotPasswordForm", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockRequestPasswordReset.mockResolvedValue({ success: true });
    });

    it("renders organisation selector and email input", () => {
        render(<ForgotPasswordForm organisations={mockOrganisations as Organisation[]} />);

        expect(screen.getByRole("combobox", { name: /forgotPassword.label.organisation/i })).toBeInTheDocument();
        expect(screen.getByRole("textbox", { name: /forgotPassword.label.email/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /forgotPassword.label.submit/i })).toBeInTheDocument();
    });

    it("shows success message after form submission regardless of outcome", async () => {
        const user = userEvent.setup();
        render(<ForgotPasswordForm organisations={mockOrganisations as Organisation[]} />);

        const orgSelect = screen.getByRole("combobox", { name: /forgotPassword.label.organisation/i });
        const emailInput = screen.getByRole("textbox", { name: /forgotPassword.label.email/i });
        const submitButton = screen.getByRole("button", { name: /forgotPassword.label.submit/i });

        await user.selectOptions(orgSelect, "00000000-0000-0000-0000-000000000001");
        await user.type(emailInput, "user@example.com");
        await user.click(submitButton);

        await waitFor(() => {
            expect(screen.getByTestId("success-message")).toBeInTheDocument();
        });
        expect(screen.getByTestId("success-message")).toHaveTextContent("forgotPassword.success");
    });

    it("disables submit button while submitting", async () => {
        const user = userEvent.setup();
        // Simulate a delayed response
        mockRequestPasswordReset.mockImplementation(
            () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
        );

        render(<ForgotPasswordForm organisations={mockOrganisations as Organisation[]} />);

        const orgSelect = screen.getByRole("combobox", { name: /forgotPassword.label.organisation/i });
        const emailInput = screen.getByRole("textbox", { name: /forgotPassword.label.email/i });
        const submitButton = screen.getByRole("button", { name: /forgotPassword.label.submit/i });

        await user.selectOptions(orgSelect, "00000000-0000-0000-0000-000000000001");
        await user.type(emailInput, "user@example.com");
        await user.click(submitButton);

        expect(submitButton).toBeDisabled();
    });

    it("shows error message when dal throws an exception", async () => {
        const user = userEvent.setup();
        mockRequestPasswordReset.mockRejectedValue(new Error("Network error"));

        render(<ForgotPasswordForm organisations={mockOrganisations as Organisation[]} />);

        const orgSelect = screen.getByRole("combobox", { name: /forgotPassword.label.organisation/i });
        const emailInput = screen.getByRole("textbox", { name: /forgotPassword.label.email/i });
        const submitButton = screen.getByRole("button", { name: /forgotPassword.label.submit/i });

        await user.selectOptions(orgSelect, "00000000-0000-0000-0000-000000000001");
        await user.type(emailInput, "user@example.com");
        await user.click(submitButton);

        await waitFor(() => {
            expect(screen.getByTestId("error-message")).toBeInTheDocument();
        });
        expect(screen.getByTestId("error-message")).toHaveTextContent("forgotPassword.error.unknown");
    });
});
