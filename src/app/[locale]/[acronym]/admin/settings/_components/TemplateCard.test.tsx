import { ReturnChecklistTemplate, ReturnProcessTemplate } from "@/prisma/client";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { TemplateCard } from "./TemplateCard";

vi.mock("@/components/reorderDnD/ReorderableTableBody", () => ({
    ReorderableTableBody: vi.fn(({ items, children }) => (
        <tbody data-testid="reorderable-table-body">
            {items.map((item: ReturnChecklistTemplate) =>
                children({ item, draggableRef: undefined, previewRef: undefined, isDragging: false })
            )}
        </tbody>
    )),
}));

vi.mock("./AddChecklistItemForm", () => ({
    AddChecklistItemForm: vi.fn(({ onSave, templateId }) => (
        <div>
            <button
                data-testid={`add-checklist-item-form-${templateId}`}
                onClick={() => onSave(templateId, "New Item")}
            >
                add-form
            </button>
        </div>
    )),
}));

vi.mock("@/components/fields/InlineEditInputFormField", () => ({
    InlineEditInputFormField: vi.fn(({ value, onSave, disabled }) => (
        <span>
            <span data-testid="inline-edit-value">{value}</span>
            {!disabled && (
                <button data-testid="inline-edit-save" onClick={() => onSave("Renamed")}>
                    save-inline
                </button>
            )}
        </span>
    )),
}));

const checklistItem: ReturnChecklistTemplate = {
    id: "ci-1",
    label: "Check tyres",
    sortOrder: 0,
    fk_assosiation: "assoc-1",
    fk_returnProcessTemplate: "tpl-1",
};

const template: ReturnProcessTemplate & { checklistItems: ReturnChecklistTemplate[] } = {
    id: "tpl-1",
    name: "Standard Process",
    defaultProcess: false,
    fk_assosiation: "assoc-1",
    checklistItems: [checklistItem],
    createdAt: new Date(),
    updatedAt: new Date(),
};

const defaultProps = {
    template,
    isExpanded: false,
    onToggleExpand: vi.fn(),
    onRename: vi.fn(async () => { }),
    onDelete: vi.fn(),
    onToggleDefault: vi.fn(async () => { }),
    onAddChecklistItem: vi.fn(async () => { }),
    onRenameChecklistItem: vi.fn(async () => { }),
    onDeleteChecklistItem: vi.fn(),
    onChecklistSortOrder: vi.fn(async () => { }),
};

describe("<TemplateCard />", () => {
    const user = userEvent.setup();

    afterEach(() => vi.clearAllMocks());

    it("renders the template name", () => {
        render(<TemplateCard {...defaultProps} />);
        expect(screen.getByTestId("inline-edit-value")).toHaveTextContent("Standard Process");
    });

    it("calls onToggleExpand when expand button is clicked", async () => {
        render(<TemplateCard {...defaultProps} />);
        await user.click(screen.getByRole("button", { name: /Standard Process/i }));
        expect(defaultProps.onToggleExpand).toHaveBeenCalledTimes(1);
    });

    it("does not render checklist body when collapsed", () => {
        render(<TemplateCard {...defaultProps} isExpanded={false} />);
        expect(screen.queryByTestId("reorderable-table-body")).not.toBeInTheDocument();
    });

    it("renders checklist items when expanded", () => {
        render(<TemplateCard {...defaultProps} isExpanded={true} />);
        expect(screen.getByText("Check tyres")).toBeInTheDocument();
    });

    it("shows default badge when defaultProcess is true", () => {
        render(<TemplateCard {...defaultProps} template={{ ...template, defaultProcess: true }} />);
        const badges = screen.getAllByLabelText(/admin.settings.returnProcess.defaultProcess/i);
        expect(badges.length).toBeGreaterThanOrEqual(1);
    });

    it("calls onDelete when delete button is clicked", async () => {
        render(<TemplateCard {...defaultProps} />);
        await user.click(screen.getByRole("button", { name: /common.actions.delete/i }));
        expect(defaultProps.onDelete).toHaveBeenCalledWith(template);
    });

    it("calls onToggleDefault when star button is clicked", async () => {
        render(<TemplateCard {...defaultProps} />);
        await user.click(screen.getByRole("button", { name: /admin.settings.returnProcess.defaultProcess/i }));
        expect(defaultProps.onToggleDefault).toHaveBeenCalledWith(template);
    });

    it("enters edit mode for checklist item and calls onRenameChecklistItem on confirm", async () => {
        render(<TemplateCard {...defaultProps} isExpanded={true} />);
        const row = screen.getByTestId(`tr_checklistItem_${checklistItem.id}`);
        const editBtn = within(row).getByTestId(`btn_edit`);
        await user.click(editBtn);
        const input = screen.getByRole("textbox");
        await user.clear(input);
        await user.type(input, "Updated label");
        const saveBtn = within(row).getByTestId(`btn_save`);
        await user.click(saveBtn);
        expect(defaultProps.onRenameChecklistItem).toHaveBeenCalledWith(template.id, checklistItem.id, "Updated label");
    });

    it("cancels edit mode without calling onRenameChecklistItem", async () => {
        render(<TemplateCard {...defaultProps} isExpanded={true} />);
        const row = screen.getByTestId(`tr_checklistItem_${checklistItem.id}`);
        const editBtn = within(row).getByTestId(`btn_edit`);
        await user.click(editBtn);

        const cancelBtn = within(row).getByTestId(`btn_cancel`);
        await user.click(cancelBtn);
        expect(defaultProps.onRenameChecklistItem).not.toHaveBeenCalled();
        expect(screen.getByText("Check tyres")).toBeInTheDocument();
    });

    it("calls onDeleteChecklistItem when delete button is clicked on checklist item", async () => {
        render(<TemplateCard {...defaultProps} isExpanded={true} />);
        const row = screen.getByTestId(`tr_checklistItem_${checklistItem.id}`);
        const deleteBtn = within(row).getByTestId(`btn_delete`);
        await user.click(deleteBtn);
        expect(defaultProps.onDeleteChecklistItem).toHaveBeenCalledWith(template.id, checklistItem.id);
    });

    // ── disabled state ────────────────────────────────────────────────────────

    it("renders with opacity-50 class when disabled", () => {
        render(<TemplateCard {...defaultProps} disabled />);
        expect(screen.getByTestId(`div_returnprocess_${template.id}`)).toHaveClass("opacity-50");
    });

    it("does not render action buttons when disabled", () => {
        render(<TemplateCard {...defaultProps} disabled />);
        expect(screen.queryByRole("button", { name: /common.actions.delete/i })).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /admin.settings.returnProcess.defaultProcess/i })).not.toBeInTheDocument();
    });

    it("expand button is disabled when card is disabled", () => {
        render(<TemplateCard {...defaultProps} disabled />);
        expect(screen.getByRole("button", { name: /Standard Process/i })).toBeDisabled();
    });

    it("does not expand card when disabled, even if isExpanded=true", () => {
        render(<TemplateCard {...defaultProps} disabled isExpanded={true} />);
        expect(screen.queryByTestId("reorderable-table-body")).not.toBeInTheDocument();
    });

    it("does not show inline-edit save button when disabled", () => {
        render(<TemplateCard {...defaultProps} disabled />);
        expect(screen.queryByTestId("inline-edit-save")).not.toBeInTheDocument();
    });
});
