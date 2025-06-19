import "./UniformOffcanvasJestHelper";

import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UniformOCStorageUnitRow } from "./UniformOCStorageUnitRow";
import { mockStorageUnits, mockUniform } from "./UniformOffcanvasJestHelper";
import { AuthRole } from "@/lib/AuthRoles";



describe("UniformOCStorageUnitRow", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it("renders not assigned message if no storageUnit", () => {
        render(<UniformOCStorageUnitRow uniform={{ ...mockUniform, storageUnit: null }} onSave={jest.fn()} />);
        expect(screen.getByText("uniformOffcanvas.storageUnit.label.notAssigned")).toBeInTheDocument();
    });

    it("renders storageUnit info if assigned", () => {
        const uniformWithSU = { ...mockUniform, storageUnit: mockStorageUnits[0] };
        render(<UniformOCStorageUnitRow uniform={uniformWithSU} onSave={jest.fn()} />);
        expect(screen.getByText("Kiste 01")).toBeInTheDocument();
        expect(screen.getByText("Desc 1")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /remove/i })).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /add/i })).not.toBeInTheDocument();
        expect(screen.getByRole("button", { name: /switch/i })).toBeInTheDocument();
    });

    it("shows edit UI when switch/add button is clicked", async () => {
        render(<UniformOCStorageUnitRow uniform={{ ...mockUniform, storageUnit: null }} onSave={jest.fn()} />);
        const user = userEvent.setup();
        await user.click(screen.getByRole("button", { name: /add/i }));
        expect(screen.getByRole("textbox")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    });

    describe("add storage unit", () => {
        it("calls addUniformItemToStorageUnit and onSave on save", async () => {
            const { addUniformItemToStorageUnit } = jest.requireMock("@/dal/storageUnit/_index");

            const onSave = jest.fn();
            render(<UniformOCStorageUnitRow uniform={{ ...mockUniform, storageUnit: null }} onSave={onSave} />);
            const user = userEvent.setup();
            await user.click(screen.getByRole("button", { name: /add/i }));
            await user.click(screen.getByRole("textbox"));
            await user.click(screen.getByRole("option", { name: "Kiste 01" }));
            await user.click(screen.getByRole("button", { name: /save/i }));
            expect(onSave).toHaveBeenCalled();
            expect(addUniformItemToStorageUnit).toHaveBeenCalledWith({
                uniformId: mockUniform.id,
                storageUnitId: "su1",
                replaceStorageUnit: false,
            });
        });

        it('calls addUniformItemToStorageUnit with replaceStorageUnit if another is assigned', async () => {
            const { addUniformItemToStorageUnit } = jest.requireMock("@/dal/storageUnit/_index");
            const onSave = jest.fn();

            const user = userEvent.setup();
            const uniformWithSU = { ...mockUniform, storageUnit: mockStorageUnits[1] };
            render(<UniformOCStorageUnitRow uniform={uniformWithSU} onSave={onSave} />);

            await user.click(screen.getByRole("button", { name: /switch/i }));
            await user.click(screen.getByRole("textbox"));
            await user.click(screen.getByRole("option", { name: "Kiste 01" }));
            await user.click(screen.getByRole("button", { name: /save/i }));

            expect(onSave).toHaveBeenCalled();
            expect(addUniformItemToStorageUnit).toHaveBeenCalledWith({
                uniformId: mockUniform.id,
                storageUnitId: "su1",
                replaceStorageUnit: true,
            });

            expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
            expect(screen.queryByRole("button", { name: /save/i })).not.toBeInTheDocument();
            expect(screen.queryByRole("button", { name: /cancel/i })).not.toBeInTheDocument();
        });

        it('does no api call if same storageUnit is selected', async () => {
            const { addUniformItemToStorageUnit } = jest.requireMock("@/dal/storageUnit/_index");
            const onSave = jest.fn();

            const user = userEvent.setup();
            const uniformWithSU = { ...mockUniform, storageUnit: mockStorageUnits[0] };
            render(<UniformOCStorageUnitRow uniform={uniformWithSU} onSave={onSave} />);

            await user.click(screen.getByRole("button", { name: /switch/i }));
            await user.click(screen.getByRole("textbox"));
            await user.click(screen.getByRole("option", { name: "Kiste 01" }));
            await user.click(screen.getByRole("button", { name: /save/i }));

            expect(onSave).not.toHaveBeenCalled();
            expect(addUniformItemToStorageUnit).not.toHaveBeenCalled();

            expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
            expect(screen.queryByRole("button", { name: /save/i })).not.toBeInTheDocument();
            expect(screen.queryByRole("button", { name: /cancel/i })).not.toBeInTheDocument();
        });

        it('calls warningMessage if storageUnit is full', async () => {
            const { simpleWarningModal } = jest.requireMock("../modals/modalProvider").useModal();
            const { addUniformItemToStorageUnit } = jest.requireMock("@/dal/storageUnit/_index");

            const user = userEvent.setup();
            render(<UniformOCStorageUnitRow uniform={{ ...mockUniform, storageUnit: null }} onSave={jest.fn()} />);

            await user.click(screen.getByRole("button", { name: /add/i }));
            await user.click(screen.getByRole("textbox"));
            await user.click(screen.getByRole("option", { name: "Kiste 02" }));
            await user.click(screen.getByRole("button", { name: /save/i }));

            expect(simpleWarningModal).toHaveBeenCalledWith({
                header: "storageUnit.warning.capacity.header",
                message: "storageUnit.warning.capacity.message",
                primaryFunction: expect.any(Function),
            });
            expect(addUniformItemToStorageUnit).not.toHaveBeenCalled();

            await act(async () => {
                await simpleWarningModal.mock.calls[0][0].primaryFunction();
            });

            expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
            expect(screen.queryByRole("button", { name: /save/i })).not.toBeInTheDocument();
            expect(screen.queryByRole("button", { name: /cancel/i })).not.toBeInTheDocument();

            expect(addUniformItemToStorageUnit).toHaveBeenCalledWith({
                uniformId: mockUniform.id,
                storageUnitId: "su2",
                replaceStorageUnit: false,
            });
        });

        it("catches DAL-Exception on save", async () => {
            const { addUniformItemToStorageUnit } = jest.requireMock("@/dal/storageUnit/_index");
            const { toast } = jest.requireMock("react-toastify");
            addUniformItemToStorageUnit.mockRejectedValueOnce(new Error("Test error"));

            const onSave = jest.fn();
            render(<UniformOCStorageUnitRow uniform={{ ...mockUniform, storageUnit: null }} onSave={onSave} />);
            const user = userEvent.setup();
            await user.click(screen.getByRole("button", { name: /add/i }));
            await user.click(screen.getByRole("textbox"));
            await user.click(screen.getByRole("option", { name: "Kiste 01" }));
            await user.click(screen.getByRole("button", { name: /save/i }));

            expect(onSave).not.toHaveBeenCalled();
            expect(screen.getByRole("button", { name: /add/i })).toBeInTheDocument();
            expect(toast.error).toHaveBeenCalledWith("uniformOffcanvas.storageUnit.error.add");
        });
    });
    describe("remove storage unit", () => {
        it("calls removeUniformFromStorageUnit and onSave on remove", async () => {
            const onSave = jest.fn();
            const { removeUniformFromStorageUnit } = jest.requireMock("@/dal/storageUnit/_index");

            const user = userEvent.setup();
            const uniformWithSU = { ...mockUniform, storageUnit: mockStorageUnits[0] };
            render(<UniformOCStorageUnitRow uniform={uniformWithSU} onSave={onSave} />);

            await user.click(screen.getByRole("button", { name: /remove/i }));
            expect(removeUniformFromStorageUnit).toHaveBeenCalledWith({
                storageUnitId: "su1",
                uniformIds: [mockUniform.id],
            });
            expect(onSave).toHaveBeenCalled();
        });
        it("disables remove button if no storageUnit", () => {
            render(<UniformOCStorageUnitRow uniform={{ ...mockUniform, storageUnit: null }} onSave={jest.fn()} />);
            expect(screen.getByRole("button", { name: /remove/i })).toBeDisabled();
        });

        it("catches DAL-Exception on remove", async () => {
            const { removeUniformFromStorageUnit } = jest.requireMock("@/dal/storageUnit/_index");
            const { toast } = jest.requireMock("react-toastify");
            removeUniformFromStorageUnit.mockRejectedValueOnce(new Error("Test error"));

            const onSave = jest.fn();
            const uniformWithSU = { ...mockUniform, storageUnit: mockStorageUnits[0] };
            render(<UniformOCStorageUnitRow uniform={uniformWithSU} onSave={onSave} />);
            const user = userEvent.setup();
            await user.click(screen.getByRole("button", { name: /remove/i }));

            expect(onSave).not.toHaveBeenCalled();
            expect(screen.getByRole("button", { name: /remove/i })).toBeInTheDocument();
            expect(toast.error).toHaveBeenCalledWith("uniformOffcanvas.storageUnit.error.remove");
        });
    });
    describe("authrole", () => {
        afterEach(() => delete global.__ROLE__);

        it("shows buttons if user at least inspector", () => {
            global.__ROLE__ = AuthRole.inspector

            render(<UniformOCStorageUnitRow uniform={{ ...mockUniform, storageUnit: null }} onSave={jest.fn()} />);
            expect(screen.getByRole("button", { name: /add/i })).toBeInTheDocument();
            expect(screen.getByRole("button", { name: /remove/i })).toBeInTheDocument();
        });

        it("does not show button if user is user", () => {
            global.__ROLE__ = AuthRole.user;

            render(<UniformOCStorageUnitRow uniform={{ ...mockUniform, storageUnit: null }} onSave={jest.fn()} />);
            expect(screen.queryByRole("button", { name: /add/i })).not.toBeInTheDocument();
            expect(screen.queryByRole("button", { name: /remove/i })).not.toBeInTheDocument();
        });
    })
});
