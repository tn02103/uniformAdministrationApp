import { Button, Form, Modal } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { passwordValidationPattern } from "../../lib/validations";
import { useI18n, useScopedI18n } from "@/lib/locales/client";

export type ChangeUserPasswordModalPropType = {
    nameOfUser?: string,
    onClose: () => void,
    save: (password: string) => Promise<any>,
}
type FormType = {
    password: string;
    confirmationPassword: string;
}

const ChangeUserPasswordModal = ({ nameOfUser, onClose, save }: ChangeUserPasswordModalPropType) => {
    const t = useScopedI18n('modals.changePassword');

    const { register, watch, handleSubmit, formState: { errors }, getFieldState } = useForm<FormType>({ mode: "onTouched" });

    async function onSubmit(data: FormType) {
        if (data.password == data.confirmationPassword) {
            save(data.password).then(onClose);
        }
    }

    return (
        <Modal show onHide={onClose} data-testid="div_popup">
            <Modal.Header data-testid="div_header" closeButton>
                {nameOfUser
                    ? t('header.change', { user: nameOfUser })
                    : t('header.create')}
            </Modal.Header>
            <form onSubmit={handleSubmit(onSubmit)}>
                <Modal.Body>
                    <div>
                        {t('requirement.message')}
                        <ul>
                            <li>{t('requirement.1')}</li>
                            <li>{t('requirement.2')}</li>
                            <li>{t('requirement.3')}</li>
                        </ul>
                    </div>
                    <Form.Group>
                        <Form.Label className="mb-0">{t('label.password')}</Form.Label>
                        <Form.Control
                            type="password"
                            isInvalid={!!errors.password}
                            {...register("password", {
                                required: {
                                    value: true,
                                    message: t('error.password.required'),
                                },
                                minLength: {
                                    value: 8,
                                    message: t('error.password.minLength'),
                                },
                                pattern: {
                                    value: passwordValidationPattern,
                                    message: t('error.password.pattern'),
                                },
                            })} />
                        <div data-testid="err_password" className="text-danger fs-7">
                            {errors.password?.message}
                        </div>
                    </Form.Group>
                    <Form.Group>
                        <Form.Label className="mb-0 mt-2">{t('label.confirmation')}</Form.Label>
                        <Form.Control
                            type="password"
                            {...register("confirmationPassword", {
                                required: {
                                    value: true,
                                    message: t('error.confirmation.required'),
                                }
                            })} />
                        <div data-testid="err_confirmationPassword" className="text-danger fs-7">
                            {errors.confirmationPassword?.message}
                        </div>
                    </Form.Group>
                    {(getFieldState("confirmationPassword").isTouched && watch("password") !== watch("confirmationPassword")) &&
                        <div data-testid="err_confirmation" className="text-danger fs-7">
                            {t('error.confirmation.invalid')}
                        </div>
                    }
                </Modal.Body>
                <Modal.Footer>
                    <Button type="submit" variant="outline-primary" data-testid="btn_save">
                        {t('save')}
                    </Button>
                </Modal.Footer>
            </form>
        </Modal>
    )
}

export default ChangeUserPasswordModal;
