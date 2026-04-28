import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import CadetReturnUniformModal from "./CadetReturnUniformModal";
import { createReturnProcess } from "@/dal/cadet/returnProcess";
import { returnCadetDirectly } from "@/dal/cadet";
import { useCadetUniformDescriptList, useCadetMaterialMap } from "@/dataFetcher/cadet";
import { toast } from "react-toastify";
import { ReturnProcessTemplateWithItems } from "@/types/returnProcessTypes";

// ---- Mocks ----
vi.mock("@/dal/cadet/returnProcess", () => ({
    createReturnProcess: vi.fn(),
}));
vi.mock("@/dal/cadet", () => ({
    returnCadetDirectly: vi.fn(),
}));
vi.mock("@/dataFetcher/cadet", () => ({
    useCadetUniformDescriptList: vi.fn(),
    useCadetMaterialMap: vi.fn(),
}));
vi.mock("next/navigation", () => ({
    useRouter: vi.fn(() => ({ refresh: vi.fn() })),
}));

// ---- Test data ----
const mockUniformLabels = [
    { id: "uniform-1", description: "Jacke-1" },
    { id: "uniform-2", description: "Hose-1" },
];
const mockMaterialMap = {
    "group-1": [
        { id: "material-1", typename: "Typ1", issued: 2, groupId: "group-1", groupName: "Gruppe1" },
    ],
    "group-2": [
        { id: "material-2", typename: "Typ2", issued: 1, groupId: "group-2", groupName: "Gruppe2" },
    ],
};
const mockTemplate: ReturnProcessTemplateWithItems = {
    id: "template-1",
    name: "Standardprozess",
    defaultProcess: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    checklistItems: [
        { id: "item-1", label: "Ausweis abgeben", sortOrder: 0, },
        { id: "item-2", label: "Schlüssel abgeben", sortOrder: 1 },
    ],
};

const defaultProps = {
    cadetId: "cadet-1",
    returnProcessEnabled: true,
    templates: [mockTemplate],
    onClose: vi.fn(),
};

function setup(props: Partial<typeof defaultProps> = {}) {
    return render(<CadetReturnUniformModal {...defaultProps} {...props} />);
}

describe("<CadetReturnUniformModal />", () => {
    const user = userEvent.setup();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useCadetUniformDescriptList).mockReturnValue({ uniformLabels: mockUniformLabels });
        vi.mocked(useCadetMaterialMap).mockReturnValue({
            materialMap: mockMaterialMap,
            mutate: vi.fn(),
        });
        vi.mocked(createReturnProcess).mockResolvedValue({} as never);
        vi.mocked(returnCadetDirectly).mockResolvedValue(undefined);
    });

    describe("loading state", () => {
        it("shows a spinner when uniform labels are not yet loaded", () => {
            vi.mocked(useCadetUniformDescriptList).mockReturnValue({ uniformLabels: undefined });
            setup();
            // Modal body should show spinner, no form content
            expect(document.querySelector(".spinner-border")).toBeInTheDocument();
            expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
        });

        it("shows a spinner when material map is not yet loaded", () => {
            vi.mocked(useCadetMaterialMap).mockReturnValue({ materialMap: undefined, mutate: vi.fn() });
            setup();
            expect(document.querySelector(".spinner-border")).toBeInTheDocument();
            expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
        });
    });

    describe("step 1 — equipment confirmation", () => {
        it("renders uniform checkboxes checked by default", () => {
            setup();
            const uniformCheckbox1 = screen.getByRole("checkbox", { name: /Jacke-1/i });
            const uniformCheckbox2 = screen.getByRole("checkbox", { name: /Hose-1/i });
            expect(uniformCheckbox1).toBeChecked();
            expect(uniformCheckbox2).toBeChecked();
        });

        it("renders material checkboxes checked by default", () => {
            setup();
            expect(screen.getByRole("checkbox", { name: /Typ1/i })).toBeChecked();
            expect(screen.getByRole("checkbox", { name: /Typ2/i })).toBeChecked();
        });

        it("shows 'Weiter' button when returnProcessEnabled with templates", () => {
            setup();
            expect(screen.getByRole("button", { name: /cadetDetailPage.vereinsaustritt.modal.actions.next/i })).toBeInTheDocument();
        });

        it("shows 'Speichern' button when no process step", () => {
            setup({ returnProcessEnabled: false });
            expect(screen.getByRole("button", { name: /cadetDetailPage.vereinsaustritt.modal.actions.save/i })).toBeInTheDocument();
            expect(screen.queryByRole("button", { name: /cadetDetailPage.vereinsaustritt.modal.actions.next/i })).not.toBeInTheDocument();
        });

        it("shows 'Speichern' button when returnProcessEnabled but no templates", () => {
            setup({ templates: [] });
            expect(screen.getByRole("button", { name: /cadetDetailPage.vereinsaustritt.modal.actions.save/i })).toBeInTheDocument();
        });
    });

    describe("direct save (no process step)", () => {
        it("calls returnCadetDirectly with all checked uniform and material IDs", async () => {
            setup({ returnProcessEnabled: false });

            await user.click(screen.getByRole("button", { name: /cadetDetailPage.vereinsaustritt.modal.actions.save/i }));

            expect(vi.mocked(returnCadetDirectly)).toHaveBeenCalledWith(
                expect.objectContaining({
                    cadetId: "cadet-1",
                    selectedUniformIds: expect.arrayContaining(["uniform-1", "uniform-2"]),
                    selectedMaterialIds: expect.arrayContaining(["material-1", "material-2"]),
                })
            );
        });

        it("calls returnCadetDirectly with only checked items when one uniform is unchecked", async () => {
            setup({ returnProcessEnabled: false });

            await user.click(screen.getByRole("checkbox", { name: /Jacke-1/i }));
            await user.click(screen.getByRole("button", { name: /cadetDetailPage.vereinsaustritt.modal.actions.save/i }));

            const call = vi.mocked(returnCadetDirectly).mock.calls[0][0];
            expect(call.selectedUniformIds).not.toContain("uniform-1");
            expect(call.selectedUniformIds).toContain("uniform-2");
        });

        it("shows success toast and calls onClose after successful direct save", async () => {
            setup({ returnProcessEnabled: false });

            await user.click(screen.getByRole("button", { name: /cadetDetailPage.vereinsaustritt.modal.actions.save/i }));

            expect(vi.mocked(toast).success).toHaveBeenCalled();
            expect(defaultProps.onClose).toHaveBeenCalled();
        });

        it("shows error toast when returnCadetDirectly throws", async () => {
            vi.mocked(returnCadetDirectly).mockRejectedValue(new Error("Network error"));
            setup({ returnProcessEnabled: false });

            await user.click(screen.getByRole("button", { name: /cadetDetailPage.vereinsaustritt.modal.actions.save/i }));

            expect(vi.mocked(toast).error).toHaveBeenCalled();
        });
    });

    describe("two-step flow (with process)", () => {
        it("navigates to step 2 when clicking 'Weiter'", async () => {
            setup();

            await user.click(screen.getByRole("button", { name: /cadetDetailPage.vereinsaustritt.modal.actions.next/i }));

            expect(screen.getByText(/cadetDetailPage.vereinsaustritt.modal.step2.header/i)).toBeInTheDocument();
            expect(screen.getByRole("checkbox", { name: /Ausweis abgeben/i })).toBeInTheDocument();
        });

        it("navigates back to step 1 when clicking 'Zurück'", async () => {
            setup();
            await user.click(screen.getByRole("button", { name: /cadetDetailPage.vereinsaustritt.modal.actions.next/i }));

            await user.click(screen.getByRole("button", { name: /cadetDetailPage.vereinsaustritt.modal.actions.back/i }));

            expect(screen.getByRole("checkbox", { name: /Jacke-1/i })).toBeInTheDocument();
        });

        it("shows 'Start process' as default button when checklist items are not all checked", async () => {
            setup();
            await user.click(screen.getByRole("button", { name: /cadetDetailPage.vereinsaustritt.modal.actions.next/i }));

            // Find the split button primary action — it should be 'startProcess'
            const startProcessBtn = screen.getAllByText(/cadetDetailPage.vereinsaustritt.modal.actions.startProcess/i)[0];
            expect(startProcessBtn).toBeInTheDocument();
        });

        it("shows 'Save as completed' as default button when all checklist items are checked", async () => {
            setup();
            await user.click(screen.getByRole("button", { name: /cadetDetailPage.vereinsaustritt.modal.actions.next/i }));

            // Check all items
            await user.click(screen.getByRole("checkbox", { name: /Ausweis abgeben/i }));
            await user.click(screen.getByRole("checkbox", { name: /Schlüssel abgeben/i }));

            // Primary split button should now be 'saveFinished'
            const saveFinishedBtns = screen.getAllByText(/cadetDetailPage.vereinsaustritt.modal.actions.saveFinished/i);
            expect(saveFinishedBtns.length).toBeGreaterThan(0);
        });

        it("calls createReturnProcess with selected uniform and material IDs when starting process", async () => {
            setup();
            await user.click(screen.getByRole("button", { name: /cadetDetailPage.vereinsaustritt.modal.actions.next/i }));

            // Uncheck one uniform before submitting
            // (step 1 data should already be captured)
            await user.click(screen.getAllByText(/cadetDetailPage.vereinsaustritt.modal.actions.startProcess/i)[0]);

            expect(vi.mocked(createReturnProcess)).toHaveBeenCalledWith(
                expect.objectContaining({
                    cadetId: "cadet-1",
                    returnProcessTemplateId: "template-1",
                    finished: false,
                    selectedUniformIds: expect.arrayContaining(["uniform-1", "uniform-2"]),
                    selectedMaterialIds: expect.arrayContaining(["material-1", "material-2"]),
                })
            );
        });

        it("calls createReturnProcess with finished=true when saving as completed", async () => {
            setup();
            await user.click(screen.getByRole("button", { name: /cadetDetailPage.vereinsaustritt.modal.actions.next/i }));

            // Check all items so the 'saveFinished' button becomes primary
            await user.click(screen.getByRole("checkbox", { name: /Ausweis abgeben/i }));
            await user.click(screen.getByRole("checkbox", { name: /Schlüssel abgeben/i }));

            // Click the primary split button (saveFinished)
            await user.click(screen.getAllByText(/cadetDetailPage.vereinsaustritt.modal.actions.saveFinished/i)[0]);

            expect(vi.mocked(createReturnProcess)).toHaveBeenCalledWith(
                expect.objectContaining({
                    finished: true,
                })
            );
        });

        it("does not pass unchecked uniform IDs to createReturnProcess", async () => {
            setup();

            // Uncheck uniform-1 in step 1 before going to step 2
            await user.click(screen.getByRole("checkbox", { name: /Jacke-1/i }));
            await user.click(screen.getByRole("button", { name: /cadetDetailPage.vereinsaustritt.modal.actions.next/i }));
            await user.click(screen.getAllByText(/cadetDetailPage.vereinsaustritt.modal.actions.startProcess/i)[0]);

            const call = vi.mocked(createReturnProcess).mock.calls[0][0];
            expect(call.selectedUniformIds).not.toContain("uniform-1");
            expect(call.selectedUniformIds).toContain("uniform-2");
        });

        it("shows error toast when createReturnProcess throws", async () => {
            vi.mocked(createReturnProcess).mockRejectedValue(new Error("server error"));
            setup();
            await user.click(screen.getByRole("button", { name: /cadetDetailPage.vereinsaustritt.modal.actions.next/i }));
            await user.click(screen.getAllByText(/cadetDetailPage.vereinsaustritt.modal.actions.startProcess/i)[0]);

            expect(vi.mocked(toast).error).toHaveBeenCalled();
        });
    });
});
