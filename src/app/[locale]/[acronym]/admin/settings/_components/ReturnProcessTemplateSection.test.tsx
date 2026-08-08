import { updateAssosiationAnonymizationConfig } from "@/dal/assosiation";
import {
    createReturnProcessTemplate,
    deleteReturnProcessTemplate,
    updateReturnProcessTemplate,
} from "@/dal/cadet/memberExits/processTemplate";
import { ReturnChecklistTemplate, ReturnProcessTemplate } from "@/prisma/client";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { ReturnProcessTemplateSection } from "./ReturnProcessTemplateSection";

vi.mock("@/dal/assosiation", () => ({
    updateAssosiationAnonymizationConfig: vi.fn(),
}));
vi.mock("@/dal/cadet/returnProcessTemplate", () => ({
    createReturnProcessTemplate: vi.fn(),
    deleteReturnProcessTemplate: vi.fn(),
    updateReturnProcessTemplate: vi.fn(),
}));
vi.mock("@/dal/cadet/returnChecklistTemplate", () => ({
    createReturnChecklistTemplate: vi.fn(),
    deleteReturnChecklistTemplate: vi.fn(),
    updateReturnChecklistTemplate: vi.fn(),
    changeReturnChecklistTemplateSortOrder: vi.fn(),
}));

// Render TemplateCard as a simple stub so we can assert disabled/enabled state
vi.mock("./TemplateCard", () => ({
    TemplateCard: vi.fn(({ template, disabled, onDelete, onToggleDefault, onRename }) => (
        <div data-testid={`template-card-${template.id}`} data-disabled={String(disabled)}>
            <span>{template.name}</span>
            {!disabled && (
                <>
                    <button onClick={() => onDelete(template)}>delete-{template.id}</button>
                    <button onClick={() => onToggleDefault(template)}>toggle-default-{template.id}</button>
                    <button onClick={() => onRename(template.id, "Renamed")}>rename-{template.id}</button>
                </>
            )}
        </div>
    )),
}));

vi.mock("./CreateTemplateForm", () => ({
    CreateTemplateForm: vi.fn(({ onSave, onCancel }) => (
        <div data-testid="create-template-form">
            <button onClick={() => onSave({ name: "New Template", defaultProcess: false })}>submit-create</button>
            <button onClick={onCancel}>cancel-create</button>
        </div>
    )),
}));

type TemplateWithItems = ReturnProcessTemplate & { checklistItems: ReturnChecklistTemplate[] };

const tpl1: TemplateWithItems = {
    id: "tpl-1",
    name: "Alpha",
    defaultProcess: false,
    fk_assosiation: "assoc-1",
    createdAt: new Date(),
    updatedAt: new Date(),
    checklistItems: [],
};
const tpl2: TemplateWithItems = {
    id: "tpl-2",
    name: "Beta",
    defaultProcess: true,
    fk_assosiation: "assoc-1",
    createdAt: new Date(),
    updatedAt: new Date(),
    checklistItems: [],
};

const defaultProps = {
    initialTemplates: [tpl1, tpl2],
    returnProcessEnabled: true,
};

describe("<ReturnProcessTemplateSection />", () => {
    const user = userEvent.setup();

    beforeEach(() => {
        vi.mocked(updateAssosiationAnonymizationConfig).mockResolvedValue({
            returnProcessEnabled: true,
            anonymizationMode: "MANUAL",
            anonymizationDelayDays: 0,
        });
        vi.mocked(createReturnProcessTemplate).mockResolvedValue([tpl1, tpl2, {
            ...tpl1,
            id: "tpl-new",
            name: "New Template",
            checklistItems: [],
        } as any]);
        vi.mocked(deleteReturnProcessTemplate).mockResolvedValue([tpl1]);
        vi.mocked(updateReturnProcessTemplate).mockResolvedValue([{ ...tpl1, name: "Renamed" }, tpl2] as any);
    });

    afterEach(() => vi.clearAllMocks());

    it("renders the section heading", () => {
        render(<ReturnProcessTemplateSection {...defaultProps} />);
        expect(screen.getByRole("heading", { name: /admin.settings.returnProcess.header/i })).toBeInTheDocument();
    });

    it("renders the returnProcessEnabled toggle", () => {
        render(<ReturnProcessTemplateSection {...defaultProps} />);
        expect(screen.getByRole("switch")).toBeInTheDocument();
    });

    it("toggle is checked when returnProcessEnabled=true", () => {
        render(<ReturnProcessTemplateSection {...defaultProps} />);
        expect(screen.getByRole("switch")).toBeChecked();
    });

    it("toggle is unchecked when returnProcessEnabled=false", () => {
        render(<ReturnProcessTemplateSection {...defaultProps} returnProcessEnabled={false} />);
        expect(screen.getByRole("switch")).not.toBeChecked();
    });

    it("renders all template cards", () => {
        render(<ReturnProcessTemplateSection {...defaultProps} />);
        expect(screen.getByTestId("template-card-tpl-1")).toBeInTheDocument();
        expect(screen.getByTestId("template-card-tpl-2")).toBeInTheDocument();
    });

    it("passes disabled=false to TemplateCards when returnProcessEnabled=true", () => {
        render(<ReturnProcessTemplateSection {...defaultProps} />);
        expect(screen.getByTestId("template-card-tpl-1")).toHaveAttribute("data-disabled", "false");
    });

    it("passes disabled=true to TemplateCards when returnProcessEnabled=false", () => {
        render(<ReturnProcessTemplateSection {...defaultProps} returnProcessEnabled={false} />);
        expect(screen.getByTestId("template-card-tpl-1")).toHaveAttribute("data-disabled", "true");
    });

    it("calls updateAssosiationAnonymizationConfig when toggle is changed", async () => {
        render(<ReturnProcessTemplateSection {...defaultProps} />);
        await user.click(screen.getByRole("switch"));
        expect(updateAssosiationAnonymizationConfig).toHaveBeenCalledWith({ returnProcessEnabled: false });
    });

    it("shows success toast after toggle saved", async () => {
        const { toast } = await import("react-toastify");
        render(<ReturnProcessTemplateSection {...defaultProps} />);
        await user.click(screen.getByRole("switch"));
        expect(toast.success).toHaveBeenCalledTimes(1);
    });

    it("shows error toast when toggle save fails", async () => {
        vi.mocked(updateAssosiationAnonymizationConfig).mockRejectedValue(new Error("fail"));
        const { toast } = await import("react-toastify");
        render(<ReturnProcessTemplateSection {...defaultProps} />);
        await user.click(screen.getByRole("switch"));
        expect(toast.error).toHaveBeenCalledTimes(1);
    });

    it("shows 'no templates' message when list is empty", () => {
        render(<ReturnProcessTemplateSection {...defaultProps} initialTemplates={[]} />);
        expect(screen.getByText(/admin.settings.returnProcess.noTemplates/i)).toBeInTheDocument();
    });

    it("shows add-template button", () => {
        render(<ReturnProcessTemplateSection {...defaultProps} />);
        expect(screen.getByRole("button", { name: /admin.settings.returnProcess.addTemplate/i })).toBeInTheDocument();
    });

    it("shows CreateTemplateForm when add-template button is clicked", async () => {
        render(<ReturnProcessTemplateSection {...defaultProps} />);
        await user.click(screen.getByRole("button", { name: /admin.settings.returnProcess.addTemplate/i }));
        expect(screen.getByTestId("create-template-form")).toBeInTheDocument();
    });

    it("hides CreateTemplateForm and adds card on successful create", async () => {
        render(<ReturnProcessTemplateSection {...defaultProps} />);
        await user.click(screen.getByRole("button", { name: /admin.settings.returnProcess.addTemplate/i }));
        await user.click(screen.getByRole("button", { name: /submit-create/i }));
        expect(screen.queryByTestId("create-template-form")).not.toBeInTheDocument();
        expect(screen.getByTestId("template-card-tpl-new")).toBeInTheDocument();
    });

    it("hides CreateTemplateForm on cancel", async () => {
        render(<ReturnProcessTemplateSection {...defaultProps} />);
        await user.click(screen.getByRole("button", { name: /admin.settings.returnProcess.addTemplate/i }));
        await user.click(screen.getByRole("button", { name: /cancel-create/i }));
        expect(screen.queryByTestId("create-template-form")).not.toBeInTheDocument();
    });

    it("removes template card after handleDeleteTemplate resolves", async () => {
        const { useModal } = await import("@/components/modals/modalProvider");
        render(<ReturnProcessTemplateSection {...defaultProps} />);
        await user.click(screen.getByRole("button", { name: /delete-tpl-1/i }));
        const { simpleWarningModal } = vi.mocked(useModal)();
        expect(simpleWarningModal).toHaveBeenCalledTimes(1);
        await act(async () => {
            vi.mocked(simpleWarningModal).mock.calls[0][0].primaryFunction();
        });
        expect(deleteReturnProcessTemplate).toHaveBeenCalledWith({ id: "tpl-1" });
    });

    it("renames template after handleRenameTemplate resolves", async () => {
        render(<ReturnProcessTemplateSection {...defaultProps} />);
        await user.click(screen.getByRole("button", { name: /rename-tpl-1/i }));
        expect(updateReturnProcessTemplate).toHaveBeenCalledWith({ id: "tpl-1", name: "Renamed" });
    });
});
