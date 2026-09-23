import { updateAssosiationAnonymizationConfig } from "@/dal/assosiation";
import {
    createResignationProcessTemplate,
    deleteResignationProcessTemplate,
    updateResignationProcessTemplate,
} from "@/dal/cadet/resignation/processTemplate";
import { ResignationChecklistItemTemplate, ResignationProcessTemplate } from "@/prisma/client";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { ResignationProcessTemplateSection } from "./ResignationProcessTemplateSection";

vi.mock("@/dal/assosiation", () => ({
    updateAssosiationAnonymizationConfig: vi.fn(),
}));
vi.mock("@/dal/cadet/resignation/processTemplate", () => ({
    createResignationProcessTemplate: vi.fn(),
    deleteResignationProcessTemplate: vi.fn(),
    updateResignationProcessTemplate: vi.fn(),
}));
vi.mock("@/dal/cadet/resignation/process", () => ({
    createResignationChecklistTemplate: vi.fn(),
    deleteResignationChecklistTemplate: vi.fn(),
    updateResignationChecklistTemplate: vi.fn(),
    changeResignationChecklistTemplateSortOrder: vi.fn(),
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

type TemplateWithItems = ResignationProcessTemplate & { checklistItemTemplates: ResignationChecklistItemTemplate[] };

const tpl1: TemplateWithItems = {
    id: "tpl-1",
    name: "Alpha",
    defaultProcess: false,
    fk_assosiation: "assoc-1",
    createdAt: new Date(),
    updatedAt: new Date(),
    checklistItemTemplates: [],
};
const tpl2: TemplateWithItems = {
    id: "tpl-2",
    name: "Beta",
    defaultProcess: true,
    fk_assosiation: "assoc-1",
    createdAt: new Date(),
    updatedAt: new Date(),
    checklistItemTemplates: [],
};

const defaultProps = {
    initialTemplates: [tpl1, tpl2],
    resignationProcessEnabled: true,
};

describe("<ResignationProcessTemplateSection />", () => {
    const user = userEvent.setup();

    beforeEach(() => {
        vi.mocked(updateAssosiationAnonymizationConfig).mockResolvedValue({
            resignationProcessEnabled: true,
            anonymizationMode: "MANUAL",
            anonymizationDelayDays: 0,
        });
        vi.mocked(createResignationProcessTemplate).mockResolvedValue([tpl1, tpl2, {
            ...tpl1,
            id: "tpl-new",
            name: "New Template",
            checklistItemTemplates: [],
        } as any]);
        vi.mocked(deleteResignationProcessTemplate).mockResolvedValue([tpl1]);
        vi.mocked(updateResignationProcessTemplate).mockResolvedValue([{ ...tpl1, name: "Renamed" }, tpl2] as any);
    });

    afterEach(() => vi.clearAllMocks());

    it("renders the section heading", () => {
        render(<ResignationProcessTemplateSection {...defaultProps} />);
        expect(screen.getByRole("heading", { name: /admin.settings.resignationProcess.header/i })).toBeInTheDocument();
    });

    it("renders the resignationProcessEnabled toggle", () => {
        render(<ResignationProcessTemplateSection {...defaultProps} />);
        expect(screen.getByRole("switch")).toBeInTheDocument();
    });

    it("toggle is checked when resignationProcessEnabled=true", () => {
        render(<ResignationProcessTemplateSection {...defaultProps} />);
        expect(screen.getByRole("switch")).toBeChecked();
    });

    it("toggle is unchecked when resignationProcessEnabled=false", () => {
        render(<ResignationProcessTemplateSection {...defaultProps} resignationProcessEnabled={false} />);
        expect(screen.getByRole("switch")).not.toBeChecked();
    });

    it("renders all template cards", () => {
        render(<ResignationProcessTemplateSection {...defaultProps} />);
        expect(screen.getByTestId("template-card-tpl-1")).toBeInTheDocument();
        expect(screen.getByTestId("template-card-tpl-2")).toBeInTheDocument();
    });

    it("passes disabled=false to TemplateCards when resignationProcessEnabled=true", () => {
        render(<ResignationProcessTemplateSection {...defaultProps} />);
        expect(screen.getByTestId("template-card-tpl-1")).toHaveAttribute("data-disabled", "false");
    });

    it("passes disabled=true to TemplateCards when resignationProcessEnabled=false", () => {
        render(<ResignationProcessTemplateSection {...defaultProps} resignationProcessEnabled={false} />);
        expect(screen.getByTestId("template-card-tpl-1")).toHaveAttribute("data-disabled", "true");
    });

    it("calls updateAssosiationAnonymizationConfig when toggle is changed", async () => {
        render(<ResignationProcessTemplateSection {...defaultProps} />);
        await user.click(screen.getByRole("switch"));
        expect(updateAssosiationAnonymizationConfig).toHaveBeenCalledWith({ resignationProcessEnabled: false });
    });

    it("shows success toast after toggle saved", async () => {
        const { toast } = await import("react-toastify");
        render(<ResignationProcessTemplateSection {...defaultProps} />);
        await user.click(screen.getByRole("switch"));
        expect(toast.success).toHaveBeenCalledTimes(1);
    });

    it("shows error toast when toggle save fails", async () => {
        vi.mocked(updateAssosiationAnonymizationConfig).mockRejectedValue(new Error("fail"));
        const { toast } = await import("react-toastify");
        render(<ResignationProcessTemplateSection {...defaultProps} />);
        await user.click(screen.getByRole("switch"));
        expect(toast.error).toHaveBeenCalledTimes(1);
    });

    it("shows 'no templates' message when list is empty", () => {
        render(<ResignationProcessTemplateSection {...defaultProps} initialTemplates={[]} />);
        expect(screen.getByText(/admin.settings.resignationProcess.noTemplates/i)).toBeInTheDocument();
    });

    it("shows add-template button", () => {
        render(<ResignationProcessTemplateSection {...defaultProps} />);
        expect(screen.getByRole("button", { name: /admin.settings.resignationProcess.addTemplate/i })).toBeInTheDocument();
    });

    it("shows CreateTemplateForm when add-template button is clicked", async () => {
        render(<ResignationProcessTemplateSection {...defaultProps} />);
        await user.click(screen.getByRole("button", { name: /admin.settings.resignationProcess.addTemplate/i }));
        expect(screen.getByTestId("create-template-form")).toBeInTheDocument();
    });

    it("hides CreateTemplateForm and adds card on successful create", async () => {
        render(<ResignationProcessTemplateSection {...defaultProps} />);
        await user.click(screen.getByRole("button", { name: /admin.settings.resignationProcess.addTemplate/i }));
        await user.click(screen.getByRole("button", { name: /submit-create/i }));
        expect(screen.queryByTestId("create-template-form")).not.toBeInTheDocument();
        expect(screen.getByTestId("template-card-tpl-new")).toBeInTheDocument();
    });

    it("hides CreateTemplateForm on cancel", async () => {
        render(<ResignationProcessTemplateSection {...defaultProps} />);
        await user.click(screen.getByRole("button", { name: /admin.settings.resignationProcess.addTemplate/i }));
        await user.click(screen.getByRole("button", { name: /cancel-create/i }));
        expect(screen.queryByTestId("create-template-form")).not.toBeInTheDocument();
    });

    it("removes template card after handleDeleteTemplate resolves", async () => {
        const { useModal } = await import("@/components/modals/modalProvider");
        render(<ResignationProcessTemplateSection {...defaultProps} />);
        await user.click(screen.getByRole("button", { name: /delete-tpl-1/i }));
        const { simpleWarningModal } = vi.mocked(useModal)();
        expect(simpleWarningModal).toHaveBeenCalledTimes(1);
        await act(async () => {
            vi.mocked(simpleWarningModal).mock.calls[0][0].primaryFunction();
        });
        expect(deleteResignationProcessTemplate).toHaveBeenCalledWith({ id: "tpl-1" });
    });

    it("renames template after handleRenameTemplate resolves", async () => {
        render(<ResignationProcessTemplateSection {...defaultProps} />);
        await user.click(screen.getByRole("button", { name: /rename-tpl-1/i }));
        expect(updateResignationProcessTemplate).toHaveBeenCalledWith({ id: "tpl-1", name: "Renamed" });
    });
});
