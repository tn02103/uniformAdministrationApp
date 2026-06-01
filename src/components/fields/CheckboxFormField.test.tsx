import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormProvider, useForm } from "react-hook-form";
import { CheckboxFormField } from "./CheckboxFormField";

function TestWrapper({ defaultValue = false, disabled = false }: { defaultValue?: boolean; disabled?: boolean }) {
    const form = useForm({ defaultValues: { testField: defaultValue } });
    return (
        <FormProvider {...form}>
            <CheckboxFormField name="testField" label="Test Label" disabled={disabled} formName="test-form" />
        </FormProvider>
    );
}

describe("<CheckboxFormField />", () => {
    it("renders a checkbox with the provided label", () => {
        render(<TestWrapper />);
        expect(screen.getByRole("checkbox", { name: /Test Label/i })).toBeInTheDocument();
    });

    it("is unchecked by default when defaultValue is false", () => {
        render(<TestWrapper defaultValue={false} />);
        expect(screen.getByRole("checkbox", { name: /Test Label/i })).not.toBeChecked();
    });

    it("is checked by default when defaultValue is true", () => {
        render(<TestWrapper defaultValue={true} />);
        expect(screen.getByRole("checkbox", { name: /Test Label/i })).toBeChecked();
    });

    it("toggles to checked when clicked while unchecked", async () => {
        const user = userEvent.setup();
        render(<TestWrapper defaultValue={false} />);
        await user.click(screen.getByRole("checkbox", { name: /Test Label/i }));
        expect(screen.getByRole("checkbox", { name: /Test Label/i })).toBeChecked();
    });

    it("toggles to unchecked when clicked while checked", async () => {
        const user = userEvent.setup();
        render(<TestWrapper defaultValue={true} />);
        await user.click(screen.getByRole("checkbox", { name: /Test Label/i }));
        expect(screen.getByRole("checkbox", { name: /Test Label/i })).not.toBeChecked();
    });

    it("does not toggle when disabled", async () => {
        const user = userEvent.setup({ pointerEventsCheck: 0 });
        render(<TestWrapper defaultValue={false} disabled={true} />);
        const checkbox = screen.getByRole("checkbox", { name: /Test Label/i });
        await user.click(checkbox);
        expect(checkbox).not.toBeChecked();
    });

    it("has aria-disabled when disabled", () => {
        render(<TestWrapper disabled={true} />);
        expect(screen.getByRole("checkbox", { name: /Test Label/i })).toHaveAttribute("aria-disabled", "true");
    });
});
