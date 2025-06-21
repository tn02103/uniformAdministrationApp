import "./StorageunitOC.jestHelper";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mockStorageUnitWithItems } from "./StorageunitOC.jestHelper";
import { StorageunitOCHeader } from "./StorageunitOCHeader";
import { AuthRole } from "@/lib/AuthRoles";


describe("StorageunitOCHeader", () => {
    const mockStorageUnit = mockStorageUnitWithItems[0];
    const { updateStorageUnit } = jest.requireMock("@/dal/storageUnit/_index");
    const { toast } = jest.requireMock("react-toastify");

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('shows create new title when no storage unit is provided', () => {
        render(<StorageunitOCHeader storageUnit={null} />);
        expect(screen.getByText(/header.create/)).toBeInTheDocument();
    });

    it('shows storage unit name when provided', () => {
        render(<StorageunitOCHeader storageUnit={mockStorageUnit} />);
        expect(screen.getByText(mockStorageUnit.name)).toBeInTheDocument();
    });

    it('allows editing and canceling the storage unit name', async () => {
        const user = userEvent.setup();
        render(<StorageunitOCHeader storageUnit={mockStorageUnit} />);
        expect(screen.getByText(mockStorageUnit.name)).toBeInTheDocument();

        const editButton = screen.getByRole("button", { name: /edit/i });
        await user.click(editButton);

        const nameField = screen.getByRole("textbox", { name: /name/i });
        await user.clear(nameField);
        await user.type(nameField, "New Storage Unit Name");
        expect(nameField).toHaveValue("New Storage Unit Name");

        const cancelButton = screen.getByRole('button', { name: /cancel/i });
        await user.click(cancelButton);

        expect(nameField).not.toBeInTheDocument();
        expect(screen.getByText(mockStorageUnit.name)).toBeInTheDocument();
        expect(updateStorageUnit).not.toHaveBeenCalled();
    });

    it('saves the new storage unit name', async () => {
        const user = userEvent.setup();
        render(<StorageunitOCHeader storageUnit={mockStorageUnit} />);
        expect(screen.getByText(mockStorageUnit.name)).toBeInTheDocument();

        const editButton = screen.getByRole("button", { name: /edit/i });
        await user.click(editButton);

        const nameField = screen.getByRole("textbox", { name: /name/i });
        await user.clear(nameField);
        await user.type(nameField, "Updated Storage");
        expect(nameField).toHaveValue("Updated Storage");

        const saveButton = screen.getByRole('button', { name: /save/i });
        await user.click(saveButton);

        expect(updateStorageUnit).toHaveBeenCalledWith({
            id: mockStorageUnit.id,
            data: { name: "Updated Storage" }
        });
    });

    it("catches DAL-Exception on save", async () => {
        const user = userEvent.setup();
        const error = new Error("Database error");
        updateStorageUnit.mockRejectedValueOnce(error);

        render(<StorageunitOCHeader storageUnit={mockStorageUnit} />);
        expect(screen.getByText(mockStorageUnit.name)).toBeInTheDocument();

        const editButton = screen.getByRole("button", { name: /edit/i });
        await user.click(editButton);

        const nameField = screen.getByRole("textbox", { name: /name/i });
        await user.clear(nameField);
        await user.type(nameField, "Error Test");

        const saveButton = screen.getByRole('button', { name: /save/i });
        await user.click(saveButton);

        expect(updateStorageUnit).toHaveBeenCalledWith({
            id: mockStorageUnit.id,
            data: { name: "Error Test" }
        });
        expect(toast.error).toHaveBeenCalled();
    });

    it("catches name duplication error", async () => {
        const user = userEvent.setup();

        render(<StorageunitOCHeader storageUnit={mockStorageUnit} />);
        expect(screen.getByText(mockStorageUnit.name)).toBeInTheDocument();

        const editButton = screen.getByRole("button", { name: /edit/i });
        await user.click(editButton);

        const nameField = screen.getByRole("textbox", { name: /name/i });
        await user.clear(nameField);
        await user.type(nameField, mockStorageUnitWithItems[1].name);

        const saveButton = screen.getByRole('button', { name: /save/i });
        await user.click(saveButton);

        expect(screen.getByRole("alert", { name: /name/i })).toHaveTextContent(/nameDuplication/);
        expect(updateStorageUnit).not.toHaveBeenCalled();

        await user.clear(nameField);
        await user.type(nameField, mockStorageUnit.name);
        await user.click(saveButton);
        expect(screen.queryByRole("alert", { name: /name/i })).not.toBeInTheDocument();
        expect(updateStorageUnit).toHaveBeenCalled();
    });

    describe("role-based access", () => {

        afterEach(() => delete global.__ROLE__);

        it("shows edit button for inspector role and above", () => {
            global.__ROLE__ = AuthRole.inspector; // Mocking global role for test
            render(<StorageunitOCHeader storageUnit={mockStorageUnit} />);
            expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument();
        });

        it("does not show edit button for roles below inspector", () => {
            global.__ROLE__ = AuthRole.user; // Mocking global role for test
            render(<StorageunitOCHeader storageUnit={mockStorageUnit} />);
            expect(screen.queryByRole("button", { name: /edit/i })).not.toBeInTheDocument();
        });
    });
});
