import "./StorageunitOC.jestHelper";

import { act, getByRole, queryByRole, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mockStorageUnitWithItems } from "./StorageunitOC.jestHelper";
import { StorageunitOCUniformList } from "./StorageunitOCUniformList";
import { AuthRole } from "@/lib/AuthRoles";

const baseStorageUnit = mockStorageUnitWithItems[0];

describe("StorageunitOCUniformList", () => {
    const { addUniformItemToStorageUnit, removeUniformFromStorageUnit } = jest.requireMock("@/dal/storageUnit/_index");
    const { useModal } = jest.requireMock("@/components/modals/modalProvider");
    const { simpleWarningModal } = useModal();
    const { toast } = jest.requireMock("react-toastify");

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("lists all uniform items in the storage unit", () => {
        render(<StorageunitOCUniformList storageUnit={baseStorageUnit} />);
        const rows = screen.getAllByRole('row');
        expect(rows).toHaveLength(baseStorageUnit.uniformList.length + 1); // +1 for header row
        baseStorageUnit.uniformList.forEach((uniform, index) => {
            const row = rows[index + 1]; // +1 for header row
            expect(row).toHaveTextContent(uniform.type.name);
            expect(row).toHaveTextContent(uniform.number.toString());
            expect(row).toHaveTextContent(uniform.size?.name || "");
            expect(row).toHaveTextContent(uniform.generation?.name || "");
        });
    });

    describe("add uniformItems", () => {
        it("allows adding new uniform items", async () => {
            const user = userEvent.setup();
            render(<StorageunitOCUniformList storageUnit={baseStorageUnit} />);
            const autocomplete = screen.getByRole("textbox");

            await user.type(autocomplete, "Uniform 1");
            await user.click(screen.getByRole('option', { name: "Uniform 1" }));

            expect(addUniformItemToStorageUnit).toHaveBeenCalledWith({
                storageUnitId: baseStorageUnit.id,
                uniformId: "1",
            });
        });

        it("disables issued uniform items", async () => {
            const user = userEvent.setup();
            render(<StorageunitOCUniformList storageUnit={baseStorageUnit} />);
            await user.click(screen.getByRole("textbox"));

            const option = screen.getByRole("option", { name: "Uniform 2" });
            expect(option).toHaveAttribute("aria-disabled", "true");

            await user.click(option);
            expect(addUniformItemToStorageUnit).not.toHaveBeenCalled();
            expect(option).toBeInTheDocument();
        });

        it("disables uniform items that are already in a storage unit", async () => {
            const user = userEvent.setup();
            render(<StorageunitOCUniformList storageUnit={baseStorageUnit} />);
            await user.click(screen.getByRole("textbox"));

            const option = screen.getByRole("option", { name: "Uniform 4" });
            expect(option).toHaveAttribute("aria-disabled", "true");

            await user.click(option);
            expect(addUniformItemToStorageUnit).not.toHaveBeenCalled();
            expect(option).toBeInTheDocument();
        });
        it('does not show its own uniformItems', async () => {
            const user = userEvent.setup();
            const mockStorageUnit = {
                ...baseStorageUnit,
                uniformList: [
                    { ...baseStorageUnit.uniformList[0], id: "1" }
                ],
            };
            render(<StorageunitOCUniformList storageUnit={mockStorageUnit} />);
            const autocomplete = screen.getByRole("textbox");
            await user.click(autocomplete);
            const option = screen.queryByRole("option", { name: "Uniform 1" });
            expect(option).not.toBeInTheDocument();
        });

        it("shows a warning when trying to add an item to a full storage unit", async () => {
            const fullUnit = { ...baseStorageUnit, capacity: 1 };

            const user = userEvent.setup();
            render(<StorageunitOCUniformList storageUnit={fullUnit} />);

            await user.click(screen.getByRole("textbox"));
            const option = screen.getByText("Uniform 1");
            await user.click(option);

            expect(simpleWarningModal).toHaveBeenCalled();
            expect(addUniformItemToStorageUnit).not.toHaveBeenCalled();

            await act(async () => {
                await simpleWarningModal.mock.calls[0][0].primaryFunction();
            });
            expect(addUniformItemToStorageUnit).toHaveBeenCalledWith({
                storageUnitId: fullUnit.id,
                uniformId: "1",
            });
        });

        it("catches DAL-Exception", async () => {
            const user = userEvent.setup();
            addUniformItemToStorageUnit.mockRejectedValueOnce(new Error("fail"));

            render(<StorageunitOCUniformList storageUnit={baseStorageUnit} />);
            const autocomplete = screen.getByRole("textbox");

            await user.type(autocomplete, "Uniform 1");
            await user.click(screen.getByRole('option', { name: "Uniform 1" }));

            expect(addUniformItemToStorageUnit).toHaveBeenCalled();
            expect(toast.error).toHaveBeenCalled();
        });
    });

    describe("remove uniformItems", () => {

        it("allows removing uniform items", async () => {
            const user = userEvent.setup();
            render(<StorageunitOCUniformList storageUnit={baseStorageUnit} />);
            const firstRow = screen.getAllByRole('row')[1]; // First row after header
            await user.hover(firstRow);

            const removeButton = getByRole(firstRow, "button", { name: /remove/i });
            await user.click(removeButton);

            expect(removeUniformFromStorageUnit).toHaveBeenCalledWith({
                storageUnitId: baseStorageUnit.id,
                uniformIds: [baseStorageUnit.uniformList[0].id],
            });
        });

        it("catches DAL-Exception", async () => {
            removeUniformFromStorageUnit.mockRejectedValueOnce(new Error("fail"));

            const user = userEvent.setup();
            render(<StorageunitOCUniformList storageUnit={baseStorageUnit} />);
            const firstRow = screen.getAllByRole('row')[1]; // First row after header
            await user.hover(firstRow);

            const removeButton = getByRole(firstRow, "button", { name: /remove/i });
            await user.click(removeButton);

            expect(removeUniformFromStorageUnit).toHaveBeenCalledWith({
                storageUnitId: baseStorageUnit.id,
                uniformIds: [baseStorageUnit.uniformList[0].id],
            });
            expect(toast.error).toHaveBeenCalled();
        });
    });
    describe("role-based access", () => {
        afterEach(() => delete global.__ROLE__);
        it("shows add button for inspector role and above", async () => {
            global.__ROLE__ = AuthRole.inspector; // Mocking global role for test

            const user = userEvent.setup();
            render(<StorageunitOCUniformList storageUnit={baseStorageUnit} />);

            const autocomplete = screen.getByRole("textbox");
            expect(autocomplete).toBeInTheDocument();

            const firstRow = screen.getAllByRole('row')[1]; // First row after header
            await user.hover(firstRow);
            const removeButton = getByRole(firstRow, "button", { name: /remove/i });
            expect(removeButton).toBeInTheDocument();
        });

        it("does not show add button for roles below inspector", async () => {
            global.__ROLE__ = AuthRole.user; // Mocking global role for test

            const user = userEvent.setup();
            render(<StorageunitOCUniformList storageUnit={baseStorageUnit} />);

            const autocomplete = screen.queryByRole("textbox");
            expect(autocomplete).not.toBeInTheDocument();

            const firstRow = screen.getAllByRole('row')[1]; // First row after header
            await user.hover(firstRow);
            const removeButton = queryByRole(firstRow, "button", { name: /remove/i });
            expect(removeButton).not.toBeInTheDocument();
        });
    });
});
