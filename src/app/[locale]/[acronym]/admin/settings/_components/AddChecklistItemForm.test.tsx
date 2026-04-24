import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { AddChecklistItemForm } from "./AddChecklistItemForm";

// AddChecklistItemForm uses the <Form> component which wraps react-hook-form.
// Render it inside a minimal <table> to avoid DOM nesting warnings (<tr> outside <tbody>).
const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <table>
        <tbody>{children}</tbody>
    </table>
);

describe("<AddChecklistItemForm />", () => {
    const user = userEvent.setup();
    const onSave = vi.fn(async () => {});
    const templateId = "tpl-1";

    afterEach(() => vi.clearAllMocks());

    it("renders the label input", () => {
        render(<AddChecklistItemForm templateId={templateId} onSave={onSave} />, { wrapper: Wrapper });
        expect(screen.getByLabelText(/admin.settings.returnProcess.addItemLabel/i)).toBeInTheDocument();
    });

    it("renders the submit button", () => {
        render(<AddChecklistItemForm templateId={templateId} onSave={onSave} />, { wrapper: Wrapper });
        expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("calls onSave with templateId and trimmed label on submit", async () => {
        render(<AddChecklistItemForm templateId={templateId} onSave={onSave} />, { wrapper: Wrapper });
        await user.type(screen.getByLabelText(/admin.settings.returnProcess.addItemLabel/i), "  New Item  ");
        await user.click(screen.getByRole("button"));
        expect(onSave).toHaveBeenCalledWith(templateId, "New Item");
    });

    it("does not call onSave when label is empty/whitespace only", async () => {
        render(<AddChecklistItemForm templateId={templateId} onSave={onSave} />, { wrapper: Wrapper });
        await user.type(screen.getByLabelText(/admin.settings.returnProcess.addItemLabel/i), "   ");
        await user.click(screen.getByRole("button"));
        expect(onSave).not.toHaveBeenCalled();
    });

    it("resets the input after successful submit", async () => {
        render(<AddChecklistItemForm templateId={templateId} onSave={onSave} />, { wrapper: Wrapper });
        const input = screen.getByLabelText(/admin.settings.returnProcess.addItemLabel/i);
        await user.type(input, "Some item");
        await user.click(screen.getByRole("button"));
        expect(input).toHaveValue("");
    });
});
