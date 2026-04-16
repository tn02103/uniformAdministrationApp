import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { z } from "zod";
import { Form } from "@/components/fields/Form";
import { NewPasswordFormComponent } from "./NewPasswordFormComponent";
import { passwordValidationPattern } from "@/lib/validations";

const TestSchema = z.object({
    newPassword: z.string().regex(passwordValidationPattern, "custom.auth.password.requirements"),
    confirmPassword: z.string().min(1, "string.required"),
}).superRefine((data, ctx) => {
    if (data.newPassword !== data.confirmPassword) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "custom.auth.password.mismatch",
            path: ["confirmPassword"],
        });
    }
});
type TestFormType = z.infer<typeof TestSchema>;

const renderForm = (onSubmit = vi.fn()) =>
    render(
        <Form<TestFormType> onSubmit={onSubmit} zodSchema={TestSchema}>
            <NewPasswordFormComponent />
            <button type="submit">Submit</button>
        </Form>
    );

const newPasswordLabel = "profile.changePassword.newPassword";
const confirmPasswordLabel = "profile.changePassword.confirmPassword";
const minLengthRule = "profile.changePassword.newPasswordError.rules.minLength";
const uppercaseRule = "profile.changePassword.newPasswordError.rules.uppercase";
const lowercaseRule = "profile.changePassword.newPasswordError.rules.lowercase";
const numberRule = "profile.changePassword.newPasswordError.rules.number";

describe("NewPasswordFormComponent", () => {
    it("renders both newPassword and confirmPassword fields", () => {
        renderForm();

        expect(screen.getByLabelText(newPasswordLabel)).toBeInTheDocument();
        expect(screen.getByLabelText(confirmPasswordLabel)).toBeInTheDocument();
    });

    describe("password requirements list", () => {
        it("does not show requirements before the field is touched", () => {
            renderForm();

            expect(screen.queryByRole("list")).not.toBeInTheDocument();
        });

        it("shows requirements when field is touched with an invalid value", async () => {
            const user = userEvent.setup();
            renderForm();

            await user.type(screen.getByLabelText(newPasswordLabel), "abc");
            await user.tab();

            await expect(screen.getByRole("list")).toBeInTheDocument();
        });

        it("shows unmet rules in red and met rules in green", async () => {
            const user = userEvent.setup();
            renderForm();

            // "abc" satisfies lowercase only
            await user.type(screen.getByLabelText(newPasswordLabel), "abc");
            await user.tab();

            await expect(screen.getByRole("list")).toBeInTheDocument();
            expect(screen.getByText(minLengthRule)).toHaveClass("text-danger");
            expect(screen.getByText(uppercaseRule)).toHaveClass("text-danger");
            expect(screen.getByText(lowercaseRule)).toHaveClass("text-success");
            expect(screen.getByText(numberRule)).toHaveClass("text-danger");
        });

        it("hides the requirements list once all rules are met", async () => {
            const user = userEvent.setup();
            renderForm();

            const input = screen.getByLabelText(newPasswordLabel);
            await user.type(input, "abc");
            await user.tab();
            await expect(screen.getByRole("list")).toBeInTheDocument();

            await user.clear(input);
            await user.type(input, "ValidPass1");

            await waitFor(() => {
                expect(screen.queryByRole("list")).not.toBeInTheDocument();
            });
        });
    });

    describe("confirmPassword cross-validation triggered by newPassword", () => {
        it("does not show confirmPassword error when confirmPassword has not been touched", async () => {
            const user = userEvent.setup();
            renderForm();

            await user.type(screen.getByLabelText(newPasswordLabel), "ValidPass1");           
            expect(screen.queryByText("custom.auth.password.mismatch")).not.toBeInTheDocument();
        });

        it("shows confirmPassword mismatch error when confirmPassword is touched and passwords differ", async () => {
            const user = userEvent.setup();
            renderForm();
            
            await user.type(screen.getByLabelText(newPasswordLabel), "ValidPass1");
            await user.type(screen.getByLabelText(confirmPasswordLabel), "DifferentPass1");
            await user.click(screen.getByRole("button", { name: "Submit" }));
            
            expect(screen.getByText("custom.auth.password.mismatch")).toBeInTheDocument();
        });

        it("clears confirmPassword error when newPassword is updated to match", async () => {
            const user = userEvent.setup();
            renderForm();

            const newPasswordInput = screen.getByLabelText(newPasswordLabel);

            await user.type(newPasswordInput, "ValidPass1");
            await user.type(screen.getByLabelText(confirmPasswordLabel), "DifferentPass1");
            await user.click(screen.getByRole("button", { name: "Submit" }));

            await expect(screen.getByText("custom.auth.password.mismatch")).toBeInTheDocument();
           
            await user.clear(newPasswordInput);
            await user.type(newPasswordInput, "DifferentPass1");

            await expect(screen.queryByText("custom.auth.password.mismatch")).not.toBeInTheDocument();
        });

        it("clears confirmPassword error when confirmPassword is corrected to match", async () => {
            const user = userEvent.setup();
            renderForm();

            const confirmPasswordInput = screen.getByLabelText(confirmPasswordLabel);
            const confirmError = screen.getByLabelText("error message confirmPassword");

            await user.type(screen.getByLabelText(newPasswordLabel), "ValidPass1");
            await user.type(confirmPasswordInput, "DifferentPass1");
            await user.click(screen.getByRole("button", { name: "Submit" }));

            await waitFor(() => expect(confirmError).not.toBeEmptyDOMElement());

            await user.clear(confirmPasswordInput);
            await user.type(confirmPasswordInput, "ValidPass1");

            await waitFor(() => expect(confirmError).toBeEmptyDOMElement());
        });
    });

    describe("form data shape", () => {
        it("passes data under newPassword and confirmPassword keys", async () => {
            const onSubmit = vi.fn();
            const user = userEvent.setup();
            renderForm(onSubmit);

            await user.type(screen.getByLabelText(newPasswordLabel), "ValidPass1");
            await user.type(screen.getByLabelText(confirmPasswordLabel), "ValidPass1");
            await user.click(screen.getByRole("button", { name: "Submit" }));

            await waitFor(() => {
                expect(onSubmit).toHaveBeenCalledWith(
                    expect.objectContaining({
                        newPassword: "ValidPass1",
                        confirmPassword: "ValidPass1",
                    }),
                    expect.anything(),
                );
            });
        });
    });
});
