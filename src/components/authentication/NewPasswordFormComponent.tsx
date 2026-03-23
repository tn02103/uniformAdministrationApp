import { useScopedI18n } from "@/lib/locales/client";
import { useFormContext } from "react-hook-form";
import { InputFormField } from "../fields/InputFormField";

type NewPasswordForm = {
    newPassword: string;
    confirmPassword: string;
};
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
