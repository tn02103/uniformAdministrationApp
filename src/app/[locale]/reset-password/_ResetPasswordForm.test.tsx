import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ResetPasswordForm from "./_ResetPasswordForm";
import { executePasswordReset } from "@/dal/auth";

vi.mock("@/dal/auth", () => ({
    executePasswordReset: vi.fn(),
}));

vi.mock("next/link", () => ({
    default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) =>
        <a href={href} {...props}>{children}</a>,
}));

const mockExecutePasswordReset = vi.mocked(executePasswordReset);

const defaultProps = {
    token: "test-raw-token-abc123",
    locale: "de",
};

// Labels come from NewPasswordFormComponent (profile.changePassword scope)
const newPasswordLabel = "profile.changePassword.newPassword";
const confirmPasswordLabel = "profile.changePassword.confirmPassword";

describe("ResetPasswordForm", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockExecutePasswordReset.mockResolvedValue({ success: true });
    });

    it("renders new password and confirm password fields and submit button", () => {
        render(<ResetPasswordForm {...defaultProps} />);

        expect(screen.getByLabelText(newPasswordLabel)).toBeInTheDocument();
        expect(screen.getByLabelText(confirmPasswordLabel)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /resetPassword.label.submit/i })).toBeInTheDocument();
    });

    it("shows success message and login link on successful reset", async () => {
        const user = userEvent.setup();
        render(<ResetPasswordForm {...defaultProps} />);

        await user.type(screen.getByLabelText(newPasswordLabel), "NewPass1");
        await user.type(screen.getByLabelText(confirmPasswordLabel), "NewPass1");
        await user.click(screen.getByRole("button", { name: /resetPassword.label.submit/i }));

        await waitFor(() => {
            expect(screen.getByTestId("success-message")).toBeInTheDocument();
        });
        expect(screen.getByTestId("success-message")).toHaveTextContent("resetPassword.success");
    });

    it("shows tokenInvalid error when server returns tokenInvalid", async () => {
        mockExecutePasswordReset.mockResolvedValue({ success: false, error: "tokenInvalid" });
        const user = userEvent.setup();
        render(<ResetPasswordForm {...defaultProps} />);

        await user.type(screen.getByLabelText(newPasswordLabel), "NewPass1");
        await user.type(screen.getByLabelText(confirmPasswordLabel), "NewPass1");
        await user.click(screen.getByRole("button", { name: /resetPassword.label.submit/i }));

        await waitFor(() => {
            expect(screen.getByTestId("error-message")).toBeInTheDocument();
        });
        expect(screen.getByTestId("error-message")).toHaveTextContent("resetPassword.error.tokenInvalid");
    });

    it("disables the submit button while submitting", async () => {
        mockExecutePasswordReset.mockImplementation(
            () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
        );
        const user = userEvent.setup();
        render(<ResetPasswordForm {...defaultProps} />);

        const submitButton = screen.getByRole("button", { name: /resetPassword.label.submit/i });
        await user.type(screen.getByLabelText(newPasswordLabel), "NewPass1");
        await user.type(screen.getByLabelText(confirmPasswordLabel), "NewPass1");
        await user.click(submitButton);

        expect(submitButton).toBeDisabled();
    });
});
