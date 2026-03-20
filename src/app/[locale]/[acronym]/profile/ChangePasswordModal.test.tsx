import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "react-toastify";
import { userChangePassword } from "@/dal/auth";
import { InvalidCurrentPasswordError, TooManyRequestsError } from "@/errors/Authentication";
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
            expect(screen.getByText(/string.passwordMismatch/i)).toBeInTheDocument();
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

    it("sets currentPassword field error when InvalidCurrentPasswordError is thrown", async () => {
        const user = userEvent.setup();
        mockUserChangePassword.mockRejectedValue(new InvalidCurrentPasswordError());
        renderModal();

        await fillForm(user, "WrongOldPass1!", "NewPass1!", "NewPass1!");
        await user.click(screen.getByRole("button", { name: "profile.changePassword.submit" }));

        await waitFor(() => {
            expect(screen.getByText("profile.changePassword.error.invalidCurrentPassword")).toBeInTheDocument();
        });
        expect(onClose).not.toHaveBeenCalled();
    });

    it("shows toast error and does not close when TooManyRequestsError is thrown", async () => {
        const user = userEvent.setup();
        mockUserChangePassword.mockRejectedValue(new TooManyRequestsError());
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
});
