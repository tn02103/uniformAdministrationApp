import { AuthRole } from "@/lib/AuthRoles";
import { User } from "@/types/userTypes";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, type Mock } from "vitest";
import { UserOffcanvas } from "./UserOffcanvas";
import { setTimeout } from "timers/promises";
import { toast } from "react-toastify";

const mockUser: User = {
    id: "user-1",
    name: "John Doe",
    username: "johndoe",
    email: "john@example.com",
    role: AuthRole.user,
    active: true,
};

const mockMutate = vi.fn();
const mockSetSelectedUserId = vi.fn();
const mocksetEditable = vi.fn();

const mockChangeUserPassword = vi.hoisted(() => vi.fn());
const mockUpdateUser = vi.hoisted(() => vi.fn());
const mockDeleteUser = vi.hoisted(() => vi.fn());
const mockCreateUser = vi.hoisted(() => vi.fn());

vi.mock("@/dal/user", () => ({
    changeUserPassword: mockChangeUserPassword,
    updateUser: mockUpdateUser,
    deleteUser: mockDeleteUser,
    createUser: mockCreateUser,
}));

const mockDangerConfirmationModal = vi.fn();
const mockChangeUserPasswordModal = vi.fn();

vi.mock("@/components/modals/modalProvider", () => ({
    useModal: () => ({
        dangerConfirmationModal: mockDangerConfirmationModal,
        changeUserPasswordModal: mockChangeUserPasswordModal,
    }),
}));

describe("<UserOffcanvas />", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockChangeUserPassword.mockResolvedValue(undefined);
        mockUpdateUser.mockResolvedValue(mockUser);
        mockDeleteUser.mockResolvedValue(undefined);
        mockCreateUser.mockResolvedValue(undefined);
    });

    it("renders offcanvas with existing user details", () => {
        render(
            <UserOffcanvas
                user={mockUser}
                editable={false}
                setSelectedUserId={mockSetSelectedUserId}
                setEditable={mocksetEditable}
                mutate={mockMutate}
            />
        );

        expect(screen.getByText(mockUser.name)).toBeInTheDocument();
        expect(screen.getByDisplayValue(mockUser.name)).toBeInTheDocument();
        expect(screen.getByDisplayValue(mockUser.username)).toBeInTheDocument();
        expect(screen.getByDisplayValue(mockUser.email)).toBeInTheDocument();
    });

    it("renders create form when user is null", () => {
        render(
            <UserOffcanvas
                user={null}
                editable={true}
                setSelectedUserId={mockSetSelectedUserId}
                setEditable={mocksetEditable}
                mutate={mockMutate}
            />
        );

        // correct text
        expect(screen.getByRole("heading", { name: "common.actions.create" })).toBeInTheDocument();
        expect(screen.getByLabelText(/label.password/)).toBeInTheDocument();
        // expect inputs to be editable
        expect(screen.getByRole("textbox", { name: /label.name/ })).toHaveValue("");
        expect(screen.getByRole("textbox", { name: /label.username/ })).toHaveValue("");
        expect(screen.getByRole("textbox", { name: /label.email/ })).toHaveValue("");
        expect(screen.getByRole("combobox", { name: /label.role/ })).toHaveValue("1");

        expect(screen.getByLabelText(/label.name/)).toBeEnabled();
        expect(screen.getByLabelText(/label.username/)).toBeEnabled();
        expect(screen.getByLabelText(/label.email/)).toBeEnabled();
        expect(screen.getByLabelText(/label.role/)).toBeEnabled();

        // expect buttons to be disabled
        expect(screen.getByRole("button", { name: "common.actions.create" })).toBeEnabled();
        expect(screen.getByRole("button", { name: "common.actions.cancel" })).toBeEnabled();
    });

    it("updates form fields when user prop changes", () => {
        const { rerender } = render(
            <UserOffcanvas
                user={mockUser}
                editable={false}
                setSelectedUserId={mockSetSelectedUserId}
                setEditable={mocksetEditable}
                mutate={mockMutate}
            />
        );

        expect(screen.queryByDisplayValue(mockUser.name)).toBeInTheDocument();

        rerender(
            <UserOffcanvas
                user={{
                    ...mockUser,
                    name: "Jane Doe",
                    username: "janedoe",
                    email: "jane@example.com"
                }}
                setSelectedUserId={mockSetSelectedUserId}
                setEditable={mocksetEditable}
                editable={false}
                mutate={mockMutate}
            />
        );

        expect(screen.getByDisplayValue("Jane Doe")).toBeInTheDocument();
        expect(screen.getByDisplayValue("janedoe")).toBeInTheDocument();
        expect(screen.getByDisplayValue("jane@example.com")).toBeInTheDocument();
    });

    describe("modal handling", () => {

        it("shows enabled buttons for existing user", () => {
            render(
                <UserOffcanvas
                    user={mockUser}
                    editable={false}
                    setSelectedUserId={mockSetSelectedUserId}
                    setEditable={mocksetEditable}
                    mutate={mockMutate}
                />
            );

            const editButton = screen.getByText("common.actions.edit");
            expect(editButton).toBeInTheDocument();
            expect(editButton).toBeEnabled();

            const deleteButton = screen.getByText("common.actions.delete");
            expect(deleteButton).toBeInTheDocument();
            expect(deleteButton).toBeEnabled();

            const resetPasswordButton = screen.getByRole("button", { name: /resetPassword/ });
            expect(resetPasswordButton).toBeInTheDocument();
            expect(resetPasswordButton).toBeEnabled();

            const reset2FAButton = screen.getByRole("button", { name: /reset2FA/ });
            expect(reset2FAButton).toBeDisabled(); //  TODO: enable when 2FA is implemented
        });

        it("opens delete confirmation modal when delete button is clicked", async () => {
            const user = userEvent.setup();
            render(
                <UserOffcanvas
                    editable={false}
                    user={mockUser}
                    setSelectedUserId={mockSetSelectedUserId}
                    setEditable={mocksetEditable}
                    mutate={mockMutate}
                />
            );

            const deleteButton = screen.getByRole("button", { name: "common.actions.delete" });
            await user.click(deleteButton);

            expect(mockDangerConfirmationModal).toHaveBeenCalled();
        });

        it("opens password change modal when reset password button is clicked", async () => {
            const user = userEvent.setup();
            render(
                <UserOffcanvas
                    user={mockUser}
                    setSelectedUserId={mockSetSelectedUserId}
                    setEditable={mocksetEditable}
                    editable={false}
                    mutate={mockMutate}
                />
            );

            const resetPasswordButton = screen.getByRole("button", { name: /resetPassword/ });
            await user.click(resetPasswordButton);

            expect(mockChangeUserPasswordModal).toHaveBeenCalled();
        });
    });

    describe("edit mode", () => {
        it("switches to edit mode when edit button is clicked", async () => {
            const user = userEvent.setup();
            const { rerender } = render(
                <UserOffcanvas
                    user={mockUser}
                    setSelectedUserId={mockSetSelectedUserId}
                    setEditable={mocksetEditable}
                    mutate={mockMutate}
                    editable={false}
                />
            );
            // expect forminputs to be disabled
            expect(screen.getByRole("textbox", { name: /label.name/ })).toBeDisabled();
            expect(screen.getByRole("textbox", { name: /label.username/ })).toBeDisabled();
            expect(screen.getByRole("textbox", { name: /label.email/ })).toBeDisabled();
            expect(screen.queryByRole("combobox", { name: /label.role/ })).not.toBeInTheDocument();
            expect(screen.getByText(/label.role/)).toBeInTheDocument();

            const editButton = screen.getByRole("button", { name: /actions.edit/ });
            await user.click(editButton);

            expect(mocksetEditable).toHaveBeenCalledWith(true);
            rerender(
                <UserOffcanvas
                    user={mockUser}
                    setSelectedUserId={mockSetSelectedUserId}
                    setEditable={mocksetEditable}
                    mutate={mockMutate}
                    editable={true}
                />
            );

            // expect forminputs to be enabled
            expect(screen.getByRole("textbox", { name: /label.name/ })).toBeEnabled();
            expect(screen.getByRole("textbox", { name: /label.username/ })).toBeEnabled();
            expect(screen.getByRole("textbox", { name: /label.email/ })).toBeEnabled();
            expect(screen.getByRole("combobox", { name: /label.role/ })).toBeEnabled();

            // expect save, cancel button to be enabled
            expect(screen.getByRole("button", { name: /actions.save/ })).toBeEnabled();
            expect(screen.getByRole("button", { name: /actions.cancel/ })).toBeEnabled();
        });

        it("renders form fiels in plaintext when not in edit mode", () => {
            const { rerender } = render(
                <UserOffcanvas
                    user={mockUser}
                    editable={false}
                    setSelectedUserId={mockSetSelectedUserId}
                    setEditable={mocksetEditable}
                    mutate={mockMutate}
                />
            );

            // expect forminputs to have *plaintext in classname
            expect(screen.getByRole("textbox", { name: /label.name/ })).toHaveClass(/plaintext/);
            expect(screen.getByRole("textbox", { name: /label.username/ })).toHaveClass(/plaintext/);
            expect(screen.getByRole("textbox", { name: /label.email/ })).toHaveClass(/plaintext/);

            // toggle to editable
            rerender(
                <UserOffcanvas
                    user={mockUser}
                    setSelectedUserId={mockSetSelectedUserId}
                    setEditable={mocksetEditable}
                    mutate={mockMutate}
                    editable={true}
                />
            );


            // expect forminputs to not have *plaintext in classname
            expect(screen.getByRole("textbox", { name: /label.name/ })).not.toHaveClass(/plaintext/);
            expect(screen.getByRole("textbox", { name: /label.username/ })).not.toHaveClass(/plaintext/);
            expect(screen.getByRole("textbox", { name: /label.email/ })).not.toHaveClass(/plaintext/);
        });

        it("renders role options in select field", () => {
            render(
                <UserOffcanvas
                    user={mockUser}
                    editable={true}
                    setSelectedUserId={mockSetSelectedUserId}
                    setEditable={mocksetEditable}
                    mutate={mockMutate}
                />
            );

            expect(screen.getByRole("option", { name: /common.user.authRole.1/ })).toBeInTheDocument();
            expect(screen.getByRole("option", { name: /common.user.authRole.2/ })).toBeInTheDocument();
            expect(screen.getByRole("option", { name: /common.user.authRole.3/ })).toBeInTheDocument();
            expect(screen.getByRole("option", { name: /common.user.authRole.4/ })).toBeInTheDocument();
        });

        describe("only shows password field when creating a new user", () => {
            it("new user", () => {
                render(
                    <UserOffcanvas
                        user={null}
                        setSelectedUserId={mockSetSelectedUserId}
                        setEditable={mocksetEditable}
                        mutate={mockMutate}
                        editable={true}
                    />
                );

                expect(screen.getByLabelText(/label.password/)).toBeInTheDocument();
            });

            it("existing user", () => {
                render(
                    <UserOffcanvas
                        user={mockUser}
                        setSelectedUserId={mockSetSelectedUserId}
                        setEditable={mocksetEditable}
                        mutate={mockMutate}
                        editable={true}
                    />
                );

                expect(screen.queryByLabelText(/label.password/)).not.toBeInTheDocument();
            });
        });


        it("closes offcanvas when cancel button is clicked for new user", async () => {
            const user = userEvent.setup();
            render(
                <UserOffcanvas
                    user={null}
                    setSelectedUserId={mockSetSelectedUserId}
                    setEditable={mocksetEditable}
                    mutate={mockMutate}
                    editable={true}
                />
            );

            const cancelButton = screen.getByText("common.actions.cancel");
            await user.click(cancelButton);

            expect(mocksetEditable).toHaveBeenCalledWith(false);
            expect(mockSetSelectedUserId).toHaveBeenCalledWith(null);
        });

        it("stays open when cancel button is clicked for existing user", async () => {
            const user = userEvent.setup();
            render(
                <UserOffcanvas
                    user={mockUser}
                    setSelectedUserId={mockSetSelectedUserId}
                    setEditable={mocksetEditable}
                    mutate={mockMutate}
                    editable={true}
                />
            );

            const cancelButton = screen.getByText("common.actions.cancel");
            await user.click(cancelButton);

            expect(mockSetSelectedUserId).toHaveBeenCalledTimes(0);
            expect(mocksetEditable).toHaveBeenCalledWith(false);
        });
    });

    describe("SA handling", () => {

        describe("createUser", () => {
            const fillCreateForm = async (user: ReturnType<typeof userEvent.setup>) => {
                await user.type(screen.getByRole("textbox", { name: /label.name/ }), "Jane Doe");
                await user.type(screen.getByRole("textbox", { name: /label.username/ }), "janedoe");
                await user.type(screen.getByRole("textbox", { name: /label.email/ }), "jane.doe@example.com");
                await user.selectOptions(screen.getByRole("combobox", { name: /label.role/ }), "common.user.authRole.2");
                await user.type(screen.getByLabelText(/label.password/), "Password1");
            };

            it("calls createUser with correct data", async () => {
                const user = userEvent.setup();
                render(
                    <UserOffcanvas
                        editable={true}
                        user={null}
                        setSelectedUserId={mockSetSelectedUserId}
                        setEditable={mocksetEditable}
                        mutate={mockMutate}
                    />
                );

                await fillCreateForm(user);
                await user.click(screen.getByRole("button", { name: /actions.create/ }));

                await waitFor(() => {
                    expect(mockCreateUser).toHaveBeenCalledWith({
                        name: "Jane Doe",
                        username: "janedoe",
                        email: "jane.doe@example.com",
                        role: AuthRole.inspector,
                        active: true,
                        password: "Password1",
                    });
                });
            });

            it("handles unexpected exception", async () => {
                mockCreateUser.mockRejectedValue(new Error("Unexpected error"));
                const user = userEvent.setup();
                render(
                    <UserOffcanvas
                        editable={true}
                        user={null}
                        setSelectedUserId={mockSetSelectedUserId}
                        setEditable={mocksetEditable}
                        mutate={mockMutate}
                    />
                );

                await fillCreateForm(user);
                await user.click(screen.getByRole("button", { name: /actions.create/ }));

                await waitFor(() => {
                    expect(mockCreateUser).toHaveBeenCalled();
                    expect(toast.error).toHaveBeenCalledWith("admin.user.error.create");
                    expect(mocksetEditable).not.toHaveBeenCalled();
                    expect(mockSetSelectedUserId).not.toHaveBeenCalledWith(null);
                    expect(mockMutate).not.toHaveBeenCalled();
                });
            });

            it("handles username duplication error", async () => {
                mockCreateUser.mockResolvedValue({
                    error: { message: "user.username.duplication", formElement: "username" },
                });
                const user = userEvent.setup();
                render(
                    <UserOffcanvas
                        editable={true}
                        user={null}
                        setSelectedUserId={mockSetSelectedUserId}
                        setEditable={mocksetEditable}
                        mutate={mockMutate}
                    />
                );

                await fillCreateForm(user);
                await user.click(screen.getByRole("button", { name: /actions.create/ }));

                await waitFor(() => {
                    expect(mockCreateUser).toHaveBeenCalled();
                    expect(screen.getByRole("alert", { name: "error message username" })).toHaveTextContent("user.username.duplication");
                    expect(screen.getByRole("textbox", { name: /label.username/ })).toHaveClass("is-invalid");
                    expect(mocksetEditable).not.toHaveBeenCalled();
                    expect(mockSetSelectedUserId).not.toHaveBeenCalledWith(null);
                    expect(mockMutate).not.toHaveBeenCalled();
                });
            });

            it("handles email duplication error", async () => {
                mockCreateUser.mockResolvedValue({
                    error: { message: "user.email.duplication", formElement: "email" },
                });
                const user = userEvent.setup();
                render(
                    <UserOffcanvas
                        editable={true}
                        user={null}
                        setSelectedUserId={mockSetSelectedUserId}
                        setEditable={mocksetEditable}
                        mutate={mockMutate}
                    />
                );

                await fillCreateForm(user);
                await user.click(screen.getByRole("button", { name: /actions.create/ }));

                await waitFor(() => {
                    expect(mockCreateUser).toHaveBeenCalled();
                    expect(screen.getByRole("alert", { name: "error message email" })).toHaveTextContent("user.email.duplication");
                    expect(screen.getByRole("textbox", { name: /label.email/ })).toHaveClass("is-invalid");
                    expect(mocksetEditable).not.toHaveBeenCalled();
                    expect(mockSetSelectedUserId).not.toHaveBeenCalledWith(null);
                    expect(mockMutate).not.toHaveBeenCalled();
                });
            });
        });

        describe("updateUser", () => {
            const changeFormValues = async (user: ReturnType<typeof userEvent.setup>) => {
                const nameInput = screen.getByRole("textbox", { name: /label.name/ });
                const emailInput = screen.getByRole("textbox", { name: /label.email/ });
                const roleSelect = screen.getByRole("combobox", { name: /label.role/ });
                await user.clear(nameInput);
                await user.type(nameInput, "John Smith");
                await user.clear(emailInput);
                await user.type(emailInput, "john.smith@example.com");
                await user.selectOptions(roleSelect, "common.user.authRole.4");
            };

            it("calls updateUser with correct data", async () => {
                const user = userEvent.setup();
                mockUpdateUser.mockResolvedValue("success");
                render(
                    <UserOffcanvas
                        editable={true}
                        user={mockUser}
                        setSelectedUserId={mockSetSelectedUserId}
                        setEditable={mocksetEditable}
                        mutate={mockMutate}
                    />
                );

                await changeFormValues(user);
                await user.click(screen.getByRole("button", { name: /actions.save/ }));
                await setTimeout(2000);

                await waitFor(() => {
                    expect(mockUpdateUser).toHaveBeenCalledWith({
                        ...mockUser,
                        name: "John Smith",
                        email: "john.smith@example.com",
                        role: AuthRole.admin,
                    });
                });
            });

            it("handles unexpected exception", async () => {
                mockUpdateUser.mockRejectedValue(new Error("Unexpected error"));
                const user = userEvent.setup();
                render(
                    <UserOffcanvas
                        editable={true}
                        user={mockUser}
                        setSelectedUserId={mockSetSelectedUserId}
                        setEditable={mocksetEditable}
                        mutate={mockMutate}
                    />
                );

                await user.click(screen.getByRole("button", { name: /actions.save/ }));

                await waitFor(() => {
                    expect(mockUpdateUser).toHaveBeenCalled();
                    expect(toast.error).toHaveBeenCalledWith("admin.user.error.save");
                    expect(mocksetEditable).not.toHaveBeenCalled();
                    expect(mockMutate).not.toHaveBeenCalled();
                });
            });

            it("handles username duplication error", async () => {
                mockUpdateUser.mockResolvedValue({
                    error: { message: "user.username.duplication", formElement: "username" },
                });
                const user = userEvent.setup();
                render(
                    <UserOffcanvas
                        editable={true}
                        user={mockUser}
                        setSelectedUserId={mockSetSelectedUserId}
                        setEditable={mocksetEditable}
                        mutate={mockMutate}
                    />
                );

                await user.click(screen.getByRole("button", { name: /actions.save/ }));

                await waitFor(() => {
                    expect(mockUpdateUser).toHaveBeenCalled();
                    expect(screen.getByRole("alert", { name: "error message username" })).toHaveTextContent("user.username.duplication");
                    expect(screen.getByRole("textbox", { name: /label.username/ })).toHaveClass("is-invalid");
                    expect(mocksetEditable).not.toHaveBeenCalled();
                    expect(mockMutate).not.toHaveBeenCalled();
                });
            });

            it("handles email duplication error", async () => {
                mockUpdateUser.mockResolvedValue({
                    error: { message: "user.email.duplication", formElement: "email" },
                });
                const user = userEvent.setup();
                render(
                    <UserOffcanvas
                        editable={true}
                        user={mockUser}
                        setSelectedUserId={mockSetSelectedUserId}
                        setEditable={mocksetEditable}
                        mutate={mockMutate}
                    />
                );

                await user.click(screen.getByRole("button", { name: /actions.save/ }));

                await waitFor(() => {
                    expect(mockUpdateUser).toHaveBeenCalled();
                    expect(screen.getByRole("alert", { name: "error message email" })).toHaveTextContent("user.email.duplication");
                    expect(screen.getByRole("textbox", { name: /label.email/ })).toHaveClass("is-invalid");
                    expect(mocksetEditable).not.toHaveBeenCalled();
                    expect(mockMutate).not.toHaveBeenCalled();
                });
            });
        });

        describe("deleteUser", () => {
            it("calls deleteUser with correct data and handles success", async () => {
                const user = userEvent.setup();
                render(
                    <UserOffcanvas
                        editable={false}
                        user={mockUser}
                        setSelectedUserId={mockSetSelectedUserId}
                        setEditable={mocksetEditable}
                        mutate={mockMutate}
                    />
                );

                await user.click(screen.getByRole("button", { name: "common.actions.delete" }));
                expect(mockDangerConfirmationModal).toHaveBeenCalled();

                await (mockDangerConfirmationModal as unknown as Mock).mock.calls[0][0].dangerOption.function();

                await waitFor(() => {
                    expect(mockDeleteUser).toHaveBeenCalledWith({ id: mockUser.id });
                    expect(mockSetSelectedUserId).toHaveBeenCalledWith(null);
                    expect(mockMutate).toHaveBeenCalled();
                    expect(toast.success).toHaveBeenCalledWith("admin.user.actions.deleted");
                });
            });

            it("handles unexpected exception", async () => {
                mockDeleteUser.mockRejectedValue(new Error("Unexpected error"));
                const user = userEvent.setup();
                render(
                    <UserOffcanvas
                        editable={false}
                        user={mockUser}
                        setSelectedUserId={mockSetSelectedUserId}
                        setEditable={mocksetEditable}
                        mutate={mockMutate}
                    />
                );

                await user.click(screen.getByRole("button", { name: "common.actions.delete" }));
                expect(mockDangerConfirmationModal).toHaveBeenCalled();

                await (mockDangerConfirmationModal as unknown as Mock).mock.calls[0][0].dangerOption.function();

                await waitFor(() => {
                    expect(mockDeleteUser).toHaveBeenCalled();
                    expect(toast.error).toHaveBeenCalledWith("admin.user.error.delete");
                    expect(mockSetSelectedUserId).not.toHaveBeenCalledWith(null);
                    expect(mockMutate).not.toHaveBeenCalled();
                });
            });
        });

        describe("changeUserPassword", () => {
            it("calls changeUserPassword with correct data and handles success", async () => {
                const user = userEvent.setup();
                render(
                    <UserOffcanvas
                        editable={false}
                        user={mockUser}
                        setSelectedUserId={mockSetSelectedUserId}
                        setEditable={mocksetEditable}
                        mutate={mockMutate}
                    />
                );

                await user.click(screen.getByRole("button", { name: /resetPassword/ }));
                expect(mockChangeUserPasswordModal).toHaveBeenCalledWith(
                    expect.any(Function),
                    mockUser.name,
                );

                await (mockChangeUserPasswordModal as unknown as Mock).mock.calls[0][0]("NewPassword1");

                await waitFor(() => {
                    expect(mockChangeUserPassword).toHaveBeenCalledWith({ id: mockUser.id, password: "NewPassword1" });
                    expect(toast.success).toHaveBeenCalledWith("admin.user.actions.passwordReset");
                });
            });

            it("handles unexpected exception", async () => {
                mockChangeUserPassword.mockRejectedValue(new Error("Unexpected error"));
                const user = userEvent.setup();
                render(
                    <UserOffcanvas
                        editable={false}
                        user={mockUser}
                        setSelectedUserId={mockSetSelectedUserId}
                        setEditable={mocksetEditable}
                        mutate={mockMutate}
                    />
                );

                await user.click(screen.getByRole("button", { name: /resetPassword/ }));
                expect(mockChangeUserPasswordModal).toHaveBeenCalled();

                await (mockChangeUserPasswordModal as unknown as Mock).mock.calls[0][0]("NewPassword1");

                await waitFor(() => {
                    expect(mockChangeUserPassword).toHaveBeenCalled();
                    expect(toast.error).toHaveBeenCalledWith("admin.user.error.changePassword");
                });
            });
        });
    });
});
