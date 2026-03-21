import { Form } from "@/components/fields/Form";
import { InputFormField } from "@/components/fields/InputFormField";
import { userChangePassword } from "@/dal/auth";
import { SAFormHandler } from "@/lib/SAFormHandler";
import { useScopedI18n } from "@/lib/locales/client";
import { ChangePasswordFormSchema, ChangePasswordFormType } from "@/zod/auth";
import { Modal } from "react-bootstrap";
import { useFormContext, UseFormReturn } from "react-hook-form";
import { toast } from "react-toastify";

type ChangePasswordModalProps = {
    onClose: () => void;
};

export const ChangePasswordModal = ({ onClose }: ChangePasswordModalProps) => {

    const t = useScopedI18n("profile.changePassword");

    const handleSubmit = async (data: ChangePasswordFormType, form: UseFormReturn<ChangePasswordFormType>) => {
        await SAFormHandler(
            userChangePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword }),
            form.setError,
            () => {
                toast.success(t("success"));
                onClose();
            },
            (errResult) => {
                const result = errResult as { error?: { tooManyRequests?: boolean } };
                if (result?.error?.tooManyRequests) {
                    toast.error(t("error.tooManyRequests"));
                } else {
                    toast.error(t("error.unknown"));
                }
            },
        );
    };



    return (
        <Modal show onHide={onClose}>
            <Modal.Header closeButton>
                <Modal.Title>{t("title")}</Modal.Title>
            </Modal.Header>
            <Form<ChangePasswordFormType> onSubmit={handleSubmit} zodSchema={ChangePasswordFormSchema}>
                <Modal.Body>
                    <InputFormField
                        name="currentPassword"
                        label={t("currentPassword")}
                        type="password"
                    />
                    <InitialPasswordInputField />
                    <InputFormField
                        name="confirmPassword"
                        label={t("confirmPassword")}
                        type="password"
                    />
                </Modal.Body>
                <Modal.Footer>
                    <button type="button" className="btn btn-secondary" onClick={onClose}>{t("cancel")}</button>
                    <button type="submit" className="btn btn-primary">{t("submit")}</button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

const InitialPasswordInputField = () => {
    const t = useScopedI18n("profile.changePassword");
    const form = useFormContext<ChangePasswordFormType>();
    const newPassword = form.watch("newPassword") ?? "";
    const fieldState = form.getFieldState("newPassword", form.formState);

    const rules = [
        { label: t("newPasswordError.rules.minLength"), met: newPassword.length >= 8 },
        { label: t("newPasswordError.rules.uppercase"), met: /[A-Z]/.test(newPassword) },
        { label: t("newPasswordError.rules.lowercase"), met: /[a-z]/.test(newPassword) },
        { label: t("newPasswordError.rules.number"), met: /[0-9]/.test(newPassword) },
    ];

    const showRequirements = fieldState.isTouched && fieldState.error?.message === "custom.auth.password.requirements";

    const onChange = () => {
        form.trigger("confirmPassword");
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
