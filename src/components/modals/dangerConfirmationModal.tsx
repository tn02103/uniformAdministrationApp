import { useScopedI18n } from "@/lib/locales/client";
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ReactNode } from "react";
import { Button, Col, FormControl, FormLabel, Modal, Row } from "react-bootstrap";
import { useForm } from "react-hook-form";

export type DangerConfirmationModalPropType = {
    header: string,
    message: string | ReactNode,
    confirmationText: string,
    cancelOption: {
        option: string,
        function?: () => void,
    },
    dangerOption: {
        option: string,
        function: () => void,
    },
    onClose: () => void,
};

function DangerConfirmationModal({ header, message, confirmationText, onClose, dangerOption, cancelOption }: DangerConfirmationModalPropType) {
    const t = useScopedI18n('modals.dangerConfirmation.confirmation');

    const { register, formState: { errors }, handleSubmit } = useForm<{ confirmation: string }>({ mode: "onTouched" });

    const onSubmit = async (data: { confirmation: string }) => {
        dangerOption.function();
        onClose();
    }

    return (
        <Modal data-testid="div_popup" show={true} onHide={onClose}>
            <Modal.Header data-testid="div_header" closeButton className={`bg-danger bg-gradient fs-5 fw-bold`}>
                {header}
            </Modal.Header>
            <form onSubmit={handleSubmit(onSubmit)}>
                <Modal.Body>
                    <Row>
                        <Col xs={1}>
                            <FontAwesomeIcon icon={faTriangleExclamation} size="xl" className={"text-danger"} />
                        </Col>
                        <Col>
                            <Row>
                                <Col data-testid="div_message">
                                    {message}
                                </Col>
                            </Row>
                            <br /><br />
                            <Row>
                                <Col>
                                    <FormLabel>
                                        <div>{t('label')}</div>
                                        <div data-testid="div_confirmationText">"{confirmationText}"</div></FormLabel>
                                    <FormControl
                                        id="confirmationInput"
                                        isInvalid={!!(errors?.confirmation)}
                                        autoComplete="off"
                                        {...register("confirmation", {
                                            required: {
                                                value: true,
                                                message: t('error.required'),
                                            },
                                            pattern: {
                                                value: new RegExp(`^${confirmationText}$`),
                                                message: t('error.pattern'),
                                            }
                                        })} />
                                    <div data-testid="err_confirmation" className="text-danger fs-7">
                                        {errors?.confirmation?.message}
                                    </div>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer>
                    <Row className="justify-content-between">
                        <Col>
                            <Button
                                variant="outline-seccondary"
                                onClick={() => { onClose(); cancelOption.function ? cancelOption.function() : undefined }}
                                data-testid="btn_cancel"
                            >
                                {cancelOption.option}
                            </Button>
                        </Col>
                        <Col>
                            <Button
                                type="submit"
                                variant="outline-danger"
                                disabled={!!errors.confirmation}
                                data-testid="btn_save"
                            >
                                {dangerOption.option}
                            </Button>
                        </Col>
                    </Row>
                </Modal.Footer>
            </form>
        </Modal>
    )
}

export default DangerConfirmationModal;
