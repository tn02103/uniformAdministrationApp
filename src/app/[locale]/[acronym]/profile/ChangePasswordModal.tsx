import { Form } from "@/components/fields/Form";
import { InputFormField } from "@/components/fields/InputFormField";
import { userChangePassword } from "@/dal/auth";
import { InvalidCurrentPasswordError, TooManyRequestsError } from "@/errors/Authentication";
import { useScopedI18n } from "@/lib/locales/client";
import { ChangePasswordFormSchema, ChangePasswordFormType } from "@/zod/auth";
import { Modal } from "react-bootstrap";
import { UseFormReturn } from "react-hook-form";
import { toast } from "react-toastify";

type ChangePasswordModalProps = {
    onClose: () => void;
};

export const ChangePasswordModal = ({ onClose }: ChangePasswordModalProps) => {

    const t = useScopedI18n("profile.changePassword");

    const handleSubmit = async (data: ChangePasswordFormType, form: UseFormReturn<ChangePasswordFormType>) => {
        try {
            await userChangePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword });
            toast.success(t("success"));
            onClose();
        } catch (error) {
            if (error instanceof InvalidCurrentPasswordError) {
                form.setError("currentPassword", { message: t("error.invalidCurrentPassword") });
            } else if (error instanceof TooManyRequestsError) {
                toast.error(t("error.tooManyRequests"));
            } else {
                toast.error(t("error.unknown"));
            }
        }
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
                    <InputFormField
                        name="newPassword"
                        label={t("newPassword")}
                        type="password"
                    />
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
