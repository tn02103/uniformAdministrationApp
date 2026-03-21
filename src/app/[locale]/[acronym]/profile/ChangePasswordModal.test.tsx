import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "react-toastify";
import { userChangePassword } from "@/dal/auth";
import { ChangePasswordModal } from "./ChangePasswordModal";

vi.mock("@/dal/auth", () => ({
    userChangePassword: vi.fn(),
}));

const mockUserChangePassword = vi.mocked(userChangePassword);
const mockToastSuccess = vi.mocked(toast.success);
const mockToastError = vi.mocked(toast.error);

describe("ChangePasswordModal", () => {
    const onClose = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderModal = () => render(<ChangePasswordModal onClose={onClose} />);

    const fillForm = async (
        user: ReturnType<typeof userEvent.setup>,
        currentPassword: string,
        newPassword: string,
        confirmPassword: string,
    ) => {
        await user.type(screen.getByLabelText("profile.changePassword.currentPassword"), currentPassword);
        await user.type(screen.getByLabelText("profile.changePassword.newPassword"), newPassword);
        await user.type(screen.getByLabelText("profile.changePassword.confirmPassword"), confirmPassword);
    };

    it("renders all three password fields", () => {
        renderModal();

        expect(screen.getByLabelText("profile.changePassword.currentPassword")).toBeInTheDocument();
        expect(screen.getByLabelText("profile.changePassword.newPassword")).toBeInTheDocument();
        expect(screen.getByLabelText("profile.changePassword.confirmPassword")).toBeInTheDocument();
    });

    it("renders Cancel and Change Password buttons", () => {
        renderModal();

        expect(screen.getByRole("button", { name: "profile.changePassword.cancel" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "profile.changePassword.submit" })).toBeInTheDocument();
    });

    it("calls onClose when Cancel is clicked", async () => {
        const user = userEvent.setup();
        renderModal();

        await user.click(screen.getByRole("button", { name: "profile.changePassword.cancel" }));

        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("shows required errors when form is submitted empty", async () => {
        const user = userEvent.setup();
        renderModal();

        await user.click(screen.getByRole("button", { name: "profile.changePassword.submit" }));

        await waitFor(() => {
            expect(screen.getAllByText(/string.required/i).length).toBeGreaterThan(0);
        });
        expect(mockUserChangePassword).not.toHaveBeenCalled();
    });

    it("shows password mismatch error when newPassword and confirmPassword differ", async () => {
        const user = userEvent.setup();
        renderModal();

        await fillForm(user, "OldPass1!", "NewPass1!", "DifferentPass1!");
        await user.click(screen.getByRole("button", { name: "profile.changePassword.submit" }));

        await waitFor(() => {
            expect(screen.getByText("custom.auth.password.mismatch")).toBeInTheDocument();
        });
        expect(mockUserChangePassword).not.toHaveBeenCalled();
    });

    it("calls userChangePassword with currentPassword and newPassword on valid submit", async () => {
        const user = userEvent.setup();
        mockUserChangePassword.mockResolvedValue(undefined);
        renderModal();

        await fillForm(user, "OldPass1!", "NewPass1!", "NewPass1!");
        await user.click(screen.getByRole("button", { name: "profile.changePassword.submit" }));

        await waitFor(() => {
            expect(mockUserChangePassword).toHaveBeenCalledWith({
                currentPassword: "OldPass1!",
                newPassword: "NewPass1!",
            });
        });
    });

    it("closes modal and shows success toast on successful submit", async () => {
        const user = userEvent.setup();
        mockUserChangePassword.mockResolvedValue(undefined);
        renderModal();

        await fillForm(user, "OldPass1!", "NewPass1!", "NewPass1!");
        await user.click(screen.getByRole("button", { name: "profile.changePassword.submit" }));

        await waitFor(() => {
            expect(mockToastSuccess).toHaveBeenCalledWith("profile.changePassword.success");
            expect(onClose).toHaveBeenCalledTimes(1);
        });
    });

    it("sets currentPassword field error when server returns InvalidCurrentPasswordError", async () => {
        const user = userEvent.setup();
        mockUserChangePassword.mockResolvedValue({ error: { formElement: "currentPassword", message: "custom.auth.invalidCurrentPassword" } });
        renderModal();

        await fillForm(user, "WrongOldPass1!", "NewPass1!", "NewPass1!");
        await user.click(screen.getByRole("button", { name: "profile.changePassword.submit" }));

        await waitFor(() => {
            expect(screen.getByLabelText("error message currentPassword")).not.toBeEmptyDOMElement();
        });
        expect(onClose).not.toHaveBeenCalled();
    });

    it("shows toast error and does not close when tooManyRequests is returned", async () => {
        const user = userEvent.setup();
        mockUserChangePassword.mockResolvedValue({ error: { tooManyRequests: true } });
        renderModal();

        await fillForm(user, "OldPass1!", "NewPass1!", "NewPass1!");
        await user.click(screen.getByRole("button", { name: "profile.changePassword.submit" }));

        await waitFor(() => {
            expect(mockToastError).toHaveBeenCalledWith("profile.changePassword.error.tooManyRequests");
        });
        expect(onClose).not.toHaveBeenCalled();
    });

    it("shows generic error toast for unexpected errors", async () => {
        const user = userEvent.setup();
        mockUserChangePassword.mockRejectedValue(new Error("Unexpected"));
        renderModal();

        await fillForm(user, "OldPass1!", "NewPass1!", "NewPass1!");
        await user.click(screen.getByRole("button", { name: "profile.changePassword.submit" }));

        await waitFor(() => {
            expect(mockToastError).toHaveBeenCalledWith("profile.changePassword.error.unknown");
        });
        expect(onClose).not.toHaveBeenCalled();
    });

    describe("confirm password mismatch", () => {
        it("shows mismatch error and clears it when newPassword is corrected to match", async () => {
            const user = userEvent.setup();
            renderModal();

            const newPasswordInput = screen.getByLabelText("profile.changePassword.newPassword");
            const confirmError = screen.getByLabelText("error message confirmPassword");

            // Submit with all fields filled but mismatching passwords
            await fillForm(user, "OldPass1!", "NewPass2!", "NewPass1!");
            await user.click(screen.getByRole("button", { name: "profile.changePassword.submit" }));

            await waitFor(() => expect(confirmError).not.toBeEmptyDOMElement());

            // Correct newPassword to match confirmPassword — trigger re-validates confirmPassword
            await user.clear(newPasswordInput);
            await user.type(newPasswordInput, "NewPass1!");

            await waitFor(() => expect(confirmError).toBeEmptyDOMElement());
        });

        it("shows mismatch error and clears it when confirmPassword is corrected to match", async () => {
            const user = userEvent.setup();
            renderModal();

            const confirmPasswordInput = screen.getByLabelText("profile.changePassword.confirmPassword");
            const confirmError = screen.getByLabelText("error message confirmPassword");

            // Submit with all fields filled but mismatching passwords
            await fillForm(user, "OldPass1!", "NewPass1!", "DifferentPass1!");
            await user.click(screen.getByRole("button", { name: "profile.changePassword.submit" }));

            await waitFor(() => expect(confirmError).not.toBeEmptyDOMElement());

            // Correct confirmPassword to match newPassword — reValidateMode onChange re-validates
            await user.clear(confirmPasswordInput);
            await user.type(confirmPasswordInput, "NewPass1!");

            await waitFor(() => expect(confirmError).toBeEmptyDOMElement());
        });
    });

    describe("new password requirements", () => {
        const minLengthRule = "profile.changePassword.newPasswordError.rules.minLength";
        const uppercaseRule = "profile.changePassword.newPasswordError.rules.uppercase";
        const lowercaseRule = "profile.changePassword.newPasswordError.rules.lowercase";
        const numberRule = "profile.changePassword.newPasswordError.rules.number";

        it("does not show requirements before the field is touched", () => {
            renderModal();

            expect(screen.queryByRole("list")).not.toBeInTheDocument();
        });

        it("does not show requirements when field is pristine after other fields are touched", async () => {
            const user = userEvent.setup();
            renderModal();

            await user.type(screen.getByLabelText("profile.changePassword.currentPassword"), "anything");

            expect(screen.queryByRole("list")).not.toBeInTheDocument();
        });

        it("shows all requirements with correct colour when field has invalid value", async () => {
            const user = userEvent.setup();
            renderModal();

            // "abc" satisfies lowercase only
            await user.type(screen.getByLabelText("profile.changePassword.newPassword"), "abc");
            await user.tab();

            await screen.findByRole("list");
            expect(screen.getByText(minLengthRule)).toHaveClass("text-danger");
            expect(screen.getByText(uppercaseRule)).toHaveClass("text-danger");
            expect(screen.getByText(lowercaseRule)).toHaveClass("text-success");
            expect(screen.getByText(numberRule)).toHaveClass("text-danger");
        });

        it("marks a satisfied requirement green while keeping unmet ones red", async () => {
            const user = userEvent.setup();
            renderModal();

            // Type an invalid value and blur to trigger onTouched validation
            const input = screen.getByLabelText("profile.changePassword.newPassword");
            await user.type(input, "abc");
            await user.tab();
            await screen.findByRole("list");

            // Replace with a value satisfying minLength, uppercase and lowercase – but not number
            await user.clear(input);
            await user.type(input, "Abcdefgh");

            await waitFor(() => {
                expect(screen.getByText(minLengthRule)).toHaveClass("text-success");
                expect(screen.getByText(uppercaseRule)).toHaveClass("text-success");
                expect(screen.getByText(lowercaseRule)).toHaveClass("text-success");
                expect(screen.getByText(numberRule)).toHaveClass("text-danger");
            });
        });

        it("hides the requirements list entirely once all requirements are met", async () => {
            const user = userEvent.setup();
            renderModal();

            const input = screen.getByLabelText("profile.changePassword.newPassword");
            await user.type(input, "abc");
            await user.tab();
            await screen.findByRole("list");

            await user.clear(input);
            await user.type(input, "ValidPass1"); // 10 chars, uppercase, lowercase, digit

            await waitFor(() => {
                expect(screen.queryByRole("list")).not.toBeInTheDocument();
            });
        });
    });
});
