import { useScopedI18n } from "@/lib/locales/client";
import { useFormContext } from "react-hook-form";
import { InputFormField } from "../fields/InputFormField";

type NewPasswordForm = {
    newPassword: string;
    confirmPassword: string;
};

/**
 * Composite form field pair for entering and confirming a new password.
 *
 * Renders a `newPassword` input followed by a `confirmPassword` input.
 * When `newPassword` has been touched and fails the requirements validation rule,
 * an inline checklist highlights which requirements (min length, uppercase,
 * lowercase, digit) are met or still missing.
 *
 * Must be rendered inside a `react-hook-form` `FormProvider` / `Form` that
 * exposes at least the fields `newPassword` and `confirmPassword`.
 * Touching `newPassword` automatically re-validates `confirmPassword`.
 */
export const NewPasswordFormComponent = () => {
    const t = useScopedI18n("profile.changePassword");

    return (
        <>
            <NewPasswordInputField />
            <InputFormField
                name="confirmPassword"
                label={t("confirmPassword")}
                type="password"
            />
        </>
    );
}

/**
 * Internal password input with an inline password-requirements checklist.
 *
 * Watches the `newPassword` field value and, after the field has been touched
 * with a requirements error, renders a colour-coded list of rules (green = met,
 * red = unmet). 
 * Automatically re-validates `confirmPassword` on every change if `confirmPassword` has been touched.
 *
 * Not exported — consume via `NewPasswordFormComponent`.
 */
const NewPasswordInputField = () => {
    const t = useScopedI18n("profile.changePassword");
    const form = useFormContext<NewPasswordForm>();
    const newPassword = form.watch("newPassword") ?? "";
    const fieldState = form.getFieldState("newPassword", form.formState);
    const confirmPasswordState = form.getFieldState("confirmPassword", form.formState);

    const rules = [
        { label: t("newPasswordError.rules.minLength"), met: newPassword.length >= 8 },
        { label: t("newPasswordError.rules.uppercase"), met: /[A-Z]/.test(newPassword) },
        { label: t("newPasswordError.rules.lowercase"), met: /[a-z]/.test(newPassword) },
        { label: t("newPasswordError.rules.number"), met: /[0-9]/.test(newPassword) },
    ];

    const showRequirements = fieldState.isTouched && fieldState.error?.message === "custom.auth.password.requirements";

    const onChange = () => {
        if (confirmPasswordState.isTouched) {
            form.trigger("confirmPassword");
        }
    };

    return (
        <>
            <InputFormField
                name="newPassword"
                label={t("newPassword")}
                onValueChange={onChange}
                type="password"
                customErrorMessage={showRequirements ? () => undefined : undefined}
            />
            {showRequirements && (
                <div className="fs-7" role="alert">
                    <div>{t("newPasswordError.invalid")}</div>
                    <ul className="mb-0 ps-3">
                        {rules.map((rule, i) => (
                            <li key={i} className={rule.met ? "text-success" : "text-danger"}>{rule.label}</li>
                        ))}
                    </ul>
                </div>
            )}
        </>
    );
}
