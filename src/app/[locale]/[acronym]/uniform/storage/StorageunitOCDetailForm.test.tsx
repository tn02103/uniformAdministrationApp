import "./StorageunitOC.jestHelper";

import { getByRole, queryByRole, render, screen } from "@testing-library/react";
import { StorageunitOCDetailForm } from "./StorageunitOCDetailForm";
import userEvent from "@testing-library/user-event";
import { mockStorageUnitWithItems } from "./StorageunitOC.jestHelper";

describe("StorageunitOCDetailForm", () => {
    const { toast } = jest.requireMock("react-toastify");

    const setEditable = jest.fn();
    const setSelectedStorageUnitId = jest.fn();
    const onHide = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should render without storageunit", () => {
       render(
            <StorageunitOCDetailForm
                editable={true}
                storageUnit={undefined}
                setEditable={jest.fn()}
                setSelectedStorageUnitId={jest.fn()}
                onHide={jest.fn()}
            />
        );

        // Check that the form fields are rendered correctly
        expect(screen.getByRole("textbox", { name: /name/i })).toBeInTheDocument();
        expect(screen.getByRole("textbox", { name: /description/i })).toBeInTheDocument();
        expect(screen.getByRole("spinbutton", { name: /capacity/i })).toBeInTheDocument();
        expect(screen.getByRole("switch", { name: /reserve/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();

        // Check that the form fields are disabled
        expect(screen.getByRole("textbox", { name: /name/i })).toBeEnabled();
        expect(screen.getByRole("textbox", { name: /description/i })).toBeEnabled();
        expect(screen.getByRole("spinbutton", { name: /capacity/i })).toBeEnabled();
        expect(screen.getByRole("switch", { name: /reserve/i })).not.toHaveAttribute("aria-disabled", null);

        // Check values of the form fields
        expect(screen.getByRole("textbox", { name: /name/i })).toHaveValue("");
        expect(screen.getByRole("spinbutton", { name: /capacity/i })).toHaveValue(null);
        expect(screen.getByRole("textbox", { name: /description/i })).toHaveValue("");
        expect(screen.getByRole("switch", { name: /reserve/i })).toHaveAttribute("aria-checked", "false");
    });

    it("should render with storageunit", () => {
        render(
            <StorageunitOCDetailForm
                editable={false}
                storageUnit={mockStorageUnitWithItems[0]}
                setEditable={jest.fn()}
                setSelectedStorageUnitId={jest.fn()}
                onHide={jest.fn()}
            />
        );

        // Check that the form fields are rendered correctly
        expect(screen.queryByRole("textbox", { name: /name/i })).toBeNull();
        expect(screen.getByRole("textbox", { name: /description/i })).toBeInTheDocument();
        expect(screen.getByRole("spinbutton", { name: /capacity/i })).toBeInTheDocument();
        expect(screen.getByRole("switch", { name: /reserve/i })).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /save/i })).toBeNull();
        expect(screen.queryByRole("button", { name: /cancel/i })).toBeNull();

        // Check that the form fields are disabled
        expect(screen.getByRole("textbox", { name: /description/i })).toBeDisabled();
        expect(screen.getByRole("spinbutton", { name: /capacity/i })).toBeDisabled();
        expect(screen.getByRole("switch", { name: /reserve/i })).toHaveAttribute("aria-disabled", "true");

        // Check values of the form fields
        expect(screen.getByRole("spinbutton", { name: /capacity/i })).toHaveValue(mockStorageUnitWithItems[0].capacity);
        expect(screen.getByRole("textbox", { name: /description/i })).toHaveValue(mockStorageUnitWithItems[0].description);
        expect(screen.getByRole("switch", { name: /reserve/i })).toHaveAttribute("aria-checked", mockStorageUnitWithItems[0].isReserve.toString());
    });

    describe("editable state", () => {
        it("renders editable state", () => {
            const { container } = render(
                <StorageunitOCDetailForm
                    editable={true}
                    storageUnit={mockStorageUnitWithItems[0]}
                    setEditable={setEditable}
                    setSelectedStorageUnitId={setSelectedStorageUnitId}
                    onHide={onHide}
                />
            );

            const nameInput = queryByRole(container, "textbox", { name: /name/i });
            const capacityInput = getByRole(container, "spinbutton", { name: /capacity/i });
            const descriptionInput = getByRole(container, "textbox", { name: /description/i });
            const reserveSwitch = getByRole(container, "switch", { name: /reserve/i });

            expect(nameInput).toBeNull();
            expect(capacityInput).toBeInTheDocument();
            expect(descriptionInput).toBeInTheDocument();
            expect(reserveSwitch).toBeInTheDocument();

            expect(capacityInput).toBeEnabled();
            expect(descriptionInput).toBeEnabled();
            expect(reserveSwitch).toBeEnabled();
        });
        it("renders non-editable state", () => {
            const { container } = render(
                <StorageunitOCDetailForm
                    editable={false}
                    storageUnit={mockStorageUnitWithItems[0]}
                    setEditable={setEditable}
                    setSelectedStorageUnitId={setSelectedStorageUnitId}
                    onHide={onHide}
                />
            );

            const nameInput = queryByRole(container, "textbox", { name: /name/i });
            const capacityInput = getByRole(container, "spinbutton", { name: /capacity/i });
            const descriptionInput = getByRole(container, "textbox", { name: /description/i });
            const reserveSwitch = getByRole(container, "switch", { name: /reserve/i });

            expect(nameInput).not.toBeInTheDocument();
            expect(capacityInput).toBeInTheDocument();
            expect(descriptionInput).toBeInTheDocument();
            expect(reserveSwitch).toBeInTheDocument();

            expect(capacityInput).toBeDisabled();
            expect(descriptionInput).toBeDisabled();
            expect(reserveSwitch).toHaveAttribute("aria-disabled", "true");
        });
    });

    describe("with storage unit", () => {
        const mockData = {
            id: "19518cad-dd54-44fb-9e31-29ba4ed9b7f9",
            name: "Updated Box 1",
            description: "This is an updated test storage unit.",
            capacity: 15,
            uniformList: [],
        }
        it("should update existing storage unit when unit is provided", async () => {
            const { updateStorageUnit } = jest.requireMock("@/dal/storageUnit/_index");
            updateStorageUnit.mockResolvedValue(mockStorageUnitWithItems.map(item => item.id === mockData.id ? mockData : item));

            const user = userEvent.setup();
            const { container } = render(
                <StorageunitOCDetailForm
                    editable={true}
                    storageUnit={mockStorageUnitWithItems[0]}
                    setEditable={setEditable}
                    setSelectedStorageUnitId={setSelectedStorageUnitId}
                    onHide={onHide}
                />
            );

            expect(queryByRole(container, "textbox", { name: /name/i })).toBeNull();

            const capacityInput = getByRole(container, "spinbutton", { name: /capacity/i });
            const descriptionInput = getByRole(container, "textbox", { name: /description/i });
            const reserveSwitch = getByRole(container, "switch", { name: /reserve/i });

            await user.clear(capacityInput);
            await user.clear(descriptionInput);
            await user.type(capacityInput, mockData.capacity.toString());
            await user.type(descriptionInput, mockData.description);
            await user.click(reserveSwitch);

            await user.click(getByRole(container, "button", { name: /save/i }));

            expect(updateStorageUnit).toHaveBeenCalledWith({
                id: mockData.id,
                data: {
                    description: mockData.description,
                    capacity: mockData.capacity,
                    isReserve: !mockStorageUnitWithItems[0].isReserve,
                },
            });
            expect(setEditable).toHaveBeenCalledWith(false);
            expect(onHide).not.toHaveBeenCalled();
            expect(setSelectedStorageUnitId).not.toHaveBeenCalled();
        });

        it("should cancel editing when cancel button is clicked", async () => {
            const user = userEvent.setup();
            const { container } = render(
                <StorageunitOCDetailForm
                    editable={true}
                    storageUnit={mockStorageUnitWithItems[0]}
                    setEditable={setEditable}
                    setSelectedStorageUnitId={setSelectedStorageUnitId}
                    onHide={onHide}
                />
            );
            const capacityInput = getByRole(container, "spinbutton", { name: /capacity/i });
            const descriptionInput = getByRole(container, "textbox", { name: /description/i });

            await user.clear(capacityInput);
            await user.clear(descriptionInput);
            await user.type(capacityInput, mockData.capacity.toString());
            await user.type(descriptionInput, mockData.description);

            await user.click(getByRole(container, "button", { name: /cancel/i }));

            expect(capacityInput).toHaveValue(mockStorageUnitWithItems[0].capacity);
            expect(descriptionInput).toHaveValue(mockStorageUnitWithItems[0].description);
            expect(setEditable).toHaveBeenCalledWith(false);
            expect(onHide).not.toHaveBeenCalled();
            expect(setSelectedStorageUnitId).not.toHaveBeenCalled();
        });

        it("should catch DAL exceptions on update", async () => {
            const { updateStorageUnit } = jest.requireMock("@/dal/storageUnit/_index");
            updateStorageUnit.mockRejectedValue(new Error("Test error"));

            const user = userEvent.setup();
            const { container } = render(
                <StorageunitOCDetailForm
                    editable={true}
                    storageUnit={mockStorageUnitWithItems[0]}
                    setEditable={setEditable}
                    setSelectedStorageUnitId={setSelectedStorageUnitId}
                    onHide={onHide}
                />
            );

            await user.click(getByRole(container, "button", { name: /save/i }));

            expect(updateStorageUnit).toHaveBeenCalled();
            expect(toast.error).toHaveBeenCalled();

            expect(setEditable).not.toHaveBeenCalled();
            expect(onHide).not.toHaveBeenCalled();
        });
    });

    describe("without storage unit", () => {
        const mockData = {
            id: "new-id",
            name: "New Storage Unit",
            description: "This is a test storage unit.",
            capacity: 20,
            uniformList: [],
        }
        it("should create new storage unit", async () => {
            const { createStorageUnit } = jest.requireMock("@/dal/storageUnit/_index");
            createStorageUnit.mockResolvedValue([...mockStorageUnitWithItems, mockData]);

            const user = userEvent.setup();
            const { container } = render(
                <StorageunitOCDetailForm
                    editable={true}
                    storageUnit={undefined}
                    setEditable={setEditable}
                    setSelectedStorageUnitId={setSelectedStorageUnitId}
                    onHide={onHide}
                />
            );

            await user.type(getByRole(container, "textbox", { name: /name/i }), mockData.name);
            await user.type(getByRole(container, "spinbutton", { name: /capacity/i }), mockData.capacity.toString());
            await user.type(getByRole(container, "textbox", { name: /description/i }), mockData.description);

            await user.click(getByRole(container, "button", { name: /save/i }));

            expect(createStorageUnit).toHaveBeenCalledWith({
                name: mockData.name,
                isReserve: false,
                description: mockData.description,
                capacity: mockData.capacity,
            });
            expect(setEditable).toHaveBeenCalledWith(false);
            expect(setSelectedStorageUnitId).toHaveBeenCalledWith(mockData.id);
            expect(onHide).not.toHaveBeenCalled();
        });

        it("should catch name duplication error on create", async () => {
            const { createStorageUnit } = jest.requireMock("@/dal/storageUnit/_index");
            createStorageUnit.mockResolvedValue({
                error: {
                    formElement: "name",
                    message: "custom.nameDuplication.storageUnit",
                },
            });

            const user = userEvent.setup();
            const { container } = render(
                <StorageunitOCDetailForm
                    editable={true}
                    storageUnit={undefined}
                    setEditable={setEditable}
                    setSelectedStorageUnitId={setSelectedStorageUnitId}
                    onHide={onHide}
                />
            );

            await user.type(getByRole(container, "textbox", { name: /name/i }), mockStorageUnitWithItems[0].name);
            await user.type(getByRole(container, "spinbutton", { name: /capacity/i }), mockData.capacity.toString());
            await user.type(getByRole(container, "textbox", { name: /description/i }), mockData.description);

            await user.click(getByRole(container, "button", { name: /save/i }));
            expect(createStorageUnit).not.toHaveBeenCalled();

            expect(getByRole(container, "alert", { name: /name/i })).toHaveTextContent(/nameDuplication/i);
        });

        it("should call onHide if cancel with no storage unit", async () => {
            const user = userEvent.setup();
            const { container } = render(
                <StorageunitOCDetailForm
                    editable={true}
                    storageUnit={undefined}
                    setEditable={setEditable}
                    setSelectedStorageUnitId={setSelectedStorageUnitId}
                    onHide={onHide}
                />
            );

            await user.click(getByRole(container, "button", { name: /cancel/i }));

            expect(onHide).toHaveBeenCalled();
            expect(setEditable).not.toHaveBeenCalled();
            expect(setSelectedStorageUnitId).not.toHaveBeenCalled();
        });

        it("should catch DAL exceptions on create", async () => {
            const { createStorageUnit } = jest.requireMock("@/dal/storageUnit/_index");
            createStorageUnit.mockRejectedValue(new Error("Test error"));

            const user = userEvent.setup();
            const { container } = render(
                <StorageunitOCDetailForm
                    editable={true}
                    storageUnit={undefined}
                    setEditable={setEditable}
                    setSelectedStorageUnitId={setSelectedStorageUnitId}
                    onHide={onHide}
                />
            );

            await user.type(getByRole(container, "textbox", { name: /name/i }), mockData.name);
            await user.type(getByRole(container, "spinbutton", { name: /capacity/i }), mockData.capacity.toString());
            await user.type(getByRole(container, "textbox", { name: /description/i }), mockData.description);

            await user.click(getByRole(container, "button", { name: /save/i }));

            expect(createStorageUnit).toHaveBeenCalled();
            expect(toast.error).toHaveBeenCalled();

            expect(setEditable).not.toHaveBeenCalled();
            expect(onHide).not.toHaveBeenCalled();
        });
    });
});
