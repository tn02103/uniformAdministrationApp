import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { CreateTemplateForm } from "./CreateTemplateForm";

describe("<CreateTemplateForm />", () => {
    const user = userEvent.setup();
    const onSave = vi.fn(async () => {});
    const onCancel = vi.fn();

    afterEach(() => vi.clearAllMocks());

    it("renders the template name input", () => {
        render(<CreateTemplateForm onSave={onSave} onCancel={onCancel} />);
        expect(screen.getByLabelText(/admin.settings.returnProcess.templateName/i)).toBeInTheDocument();
    });

    it("renders Create and Cancel buttons", () => {
        render(<CreateTemplateForm onSave={onSave} onCancel={onCancel} />);
        expect(screen.getByRole("button", { name: /common.actions.create/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /common.actions.cancel/i })).toBeInTheDocument();
    });

    it("calls onSave with name and defaultProcess=false on submit", async () => {
        render(<CreateTemplateForm onSave={onSave} onCancel={onCancel} />);
        await user.type(screen.getByLabelText(/admin.settings.returnProcess.templateName/i), "My Template");
        await user.click(screen.getByRole("button", { name: /common.actions.create/i }));
        expect(onSave).toHaveBeenCalledWith(
            expect.objectContaining({ name: "My Template", defaultProcess: false }),
            expect.anything()
        );
    });

    it("does not call onSave when name is empty (required validation)", async () => {
        render(<CreateTemplateForm onSave={onSave} onCancel={onCancel} />);
        await user.click(screen.getByRole("button", { name: /common.actions.create/i }));
        expect(onSave).not.toHaveBeenCalled();
    });

    it("calls onCancel when Cancel button is clicked", async () => {
        render(<CreateTemplateForm onSave={onSave} onCancel={onCancel} />);
        await user.click(screen.getByRole("button", { name: /common.actions.cancel/i }));
        expect(onCancel).toHaveBeenCalledTimes(1);
    });
});
