import "./StorageunitOC.jestHelper";

import { act, render, screen } from "@testing-library/react";
import { mockStorageUnitWithItems } from "./StorageunitOC.jestHelper";
import { StorageunitOC } from "./StorageunitOC";
import userEvent from "@testing-library/user-event";


describe("StorageunitOC", () => {
    const mockStorageUnit = mockStorageUnitWithItems[0];

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('renders correctly with storage unit', () => {
        render(<StorageunitOC storageUnit={mockStorageUnit} onHide={() => { }} setSelectedStorageUnitId={() => { }} />);

        expect(screen.getByRole('heading', { name: mockStorageUnit.name })).toBeInTheDocument();

        expect(screen.getByText(mockStorageUnit.description as string)).toBeInTheDocument();
        expect(screen.queryByRole('textbox', { name: /name/i })).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: /actions.edit/i })).toBeEnabled();
        expect(screen.getByRole('button', { name: /delete/i })).toBeEnabled();

        expect(screen.getByRole('textbox', { name: /description/i })).toHaveValue(mockStorageUnit.description);
        expect(screen.getByRole('spinbutton', { name: /capacity/i })).toHaveValue(mockStorageUnit.capacity);
        expect(screen.getByRole('switch', { name: /forReserves/i })).not.toBeChecked();
        expect(screen.getByRole("textbox", { name: /description/i })).toBeDisabled();
        expect(screen.getByRole('spinbutton', { name: /capacity/i })).toBeDisabled();
        expect(screen.getByRole('switch', { name: /forReserves/i })).toHaveAttribute("aria-disabled", "true");

        expect(screen.getByText('storageUnit.label.header.uniformlist')).toBeInTheDocument();
        expect(screen.getByText(`${mockStorageUnit.uniformList[0].type.name}-${mockStorageUnit.uniformList[0].number}`)).toBeInTheDocument();
        expect(screen.getByText(`${mockStorageUnit.uniformList[1].type.name}-${mockStorageUnit.uniformList[1].number}`)).toBeInTheDocument();
    });

    it('renders correctly without storage unit', () => {
        render(<StorageunitOC onHide={() => { }} setSelectedStorageUnitId={() => { }} />);

        expect(screen.getByRole('heading', { name: /header.create/ })).toBeInTheDocument();
        expect(screen.queryByText('storageUnit.label.header.uniformlist')).not.toBeInTheDocument();

        expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /delete/i })).toBeDisabled();
        expect(screen.getByRole('button', { name: /actions.edit/i })).toBeDisabled();

        expect(screen.getByRole('textbox', { name: /name/i })).toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: /description/i })).toBeInTheDocument();
        expect(screen.getByRole('spinbutton', { name: /capacity/i })).toBeInTheDocument();
        expect(screen.getByRole('switch', { name: /forReserves/i })).toBeInTheDocument();

        expect(screen.getByRole('textbox', { name: /name/i })).toBeEnabled();
        expect(screen.getByRole('textbox', { name: /description/i })).toBeEnabled();
        expect(screen.getByRole('spinbutton', { name: /capacity/i })).toBeEnabled();
        expect(screen.getByRole('switch', { name: /forReserves/i })).not.toHaveAttribute("aria-disabled", "true");
    });

    it('edits storage unit', async () => {
        const user = userEvent.setup();
        render(<StorageunitOC storageUnit={mockStorageUnit} onHide={() => { }} setSelectedStorageUnitId={() => { }} />);

        const editButton = screen.getByRole('button', { name: /actions.edit/i });
        expect(editButton).toBeEnabled();
        await user.click(editButton);

        const descriptionInput = screen.getByRole('textbox', { name: /description/i });
        const capacityInput = screen.getByRole('spinbutton', { name: /capacity/i });
        const reserveSwitch = screen.getByRole('switch', { name: /forReserves/i });

        expect(descriptionInput).toBeEnabled();
        expect(capacityInput).toBeEnabled();
        expect(reserveSwitch).toBeEnabled();

        await user.clear(descriptionInput);
        await user.type(descriptionInput, 'Updated description');
        await user.clear(capacityInput);
        await user.type(capacityInput, '15');
        await user.click(reserveSwitch);

        expect(descriptionInput).toHaveValue('Updated description');
        expect(capacityInput).toHaveValue(15);
        expect(reserveSwitch).toBeChecked();

        const saveButton = screen.getByRole('button', { name: /save/i });
        expect(saveButton).toBeEnabled();
        await user.click(saveButton);

        expect(screen.getByRole('textbox', { name: /description/i })).toBeDisabled();
        expect(screen.getByRole('spinbutton', { name: /capacity/i })).toBeDisabled();
        expect(screen.getByRole('switch', { name: /forReserves/i })).toHaveAttribute("aria-disabled", "true");
    });

    it('cancel edit mode', async () => {
        const user = userEvent.setup();
        render(<StorageunitOC storageUnit={mockStorageUnit} onHide={() => { }} setSelectedStorageUnitId={() => { }} />);

        const editButton = screen.getByRole('button', { name: /actions.edit/i });
        expect(editButton).toBeEnabled();
        await user.click(editButton);

        expect(screen.getByRole('textbox', { name: /description/i })).toBeEnabled();

        const cancelButton = screen.getByRole('button', { name: /cancel/i });
        expect(cancelButton).toBeInTheDocument();
        await user.click(cancelButton);

        expect(screen.getByRole('textbox', { name: /description/i })).toBeDisabled();
    });

    it('deletes storage unit', async () => {
        const { useModal } = jest.requireMock("@/components/modals/modalProvider");
        const { showMessageModal } = useModal();
        const { deleteStorageUnit } = jest.requireMock("@/dal/storageUnit/_index");

        const user = userEvent.setup();
        const onHideMock = jest.fn();
        render(<StorageunitOC storageUnit={mockStorageUnit} onHide={onHideMock} setSelectedStorageUnitId={() => { }} />);

        const deleteButton = screen.getByRole('button', { name: /delete/i });
        expect(deleteButton).toBeEnabled();
        await user.click(deleteButton);

        expect(deleteStorageUnit).not.toHaveBeenCalled();
        expect(showMessageModal).toHaveBeenCalledWith(
            expect.stringMatching(/storageUnit.warning.delete.header/i),
            expect.stringMatching(/storageUnit.warning.delete.message/i),
            expect.anything(),
            "danger"
        );

        await act(async () => {
            await showMessageModal.mock.calls[0][2][1].function(); // Call the delete function
        });

        expect(deleteStorageUnit).toHaveBeenCalledWith(mockStorageUnit.id);
        expect(onHideMock).toHaveBeenCalled();
    });
});
