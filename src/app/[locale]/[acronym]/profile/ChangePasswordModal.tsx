import { NewPasswordFormComponent } from "@/components/authentication/NewPasswordFormComponent";
import { Form } from "@/components/fields/Form";
import { InputFormField } from "@/components/fields/InputFormField";
import { userChangePassword } from "@/dal/auth";
import { SAFormHandler } from "@/lib/SAFormHandler";
import { useScopedI18n } from "@/lib/locales/client";
import { SelfServiceChangePasswordFormSchema, SelfServiceChangePasswordFormType } from "@/zod/auth";
import { Modal } from "react-bootstrap";
import { UseFormReturn } from "react-hook-form";
import { toast } from "react-toastify";

type ChangePasswordModalProps = {
    onClose: () => void;
};

/**
 * Modal dialog that lets an authenticated user change their own password.
 *
 * Renders a Bootstrap modal containing the current-password field and the
 * shared `NewPasswordFormComponent`. On submit it calls the `userChangePassword`
 * server action and:
 * - shows a success toast and closes the modal on success;
 * - shows a "too many requests" toast when the rate limit is exceeded;
 * - shows a generic error toast for any other failure.
 *
 * @param onClose - Callback invoked when the modal should be dismissed
 *   (Cancel button click or after a successful password change).
 */
export const ChangePasswordModal = ({ onClose }: ChangePasswordModalProps) => {

    const t = useScopedI18n("profile.changePassword");

    const handleSubmit = async (data: SelfServiceChangePasswordFormType, form: UseFormReturn<SelfServiceChangePasswordFormType>) => {
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
            <Form<SelfServiceChangePasswordFormType> onSubmit={handleSubmit} zodSchema={SelfServiceChangePasswordFormSchema}>
                <Modal.Body>
                    <InputFormField
                        name="currentPassword"
                        label={t("currentPassword")}
                        type="password"
                    />
                    <NewPasswordFormComponent />
                </Modal.Body>
                <Modal.Footer>
                    <button type="button" className="btn btn-secondary" onClick={onClose}>{t("cancel")}</button>
                    <button type="submit" className="btn btn-primary">{t("submit")}</button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};
