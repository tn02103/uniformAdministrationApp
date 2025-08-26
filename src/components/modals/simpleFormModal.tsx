import { useI18n } from "@/lib/locales/client";
import { Button, Col, Form, Modal, Row } from "react-bootstrap";
import { RegisterOptions, useForm } from "react-hook-form";

type FormType = {
    input: string
}
export type SimpleFormModalProps = {
    header: string;
    elementLabel: string;
    elementValidation: RegisterOptions<FormType, "input">;
    inputMode?: "search" | "text" | "none" | "tel" | "url" | "email" | "numeric";
    inputPlaceholder?: string,
    type?: string,
    save: ({ }: { input: string }) => Promise<void>;
    abort: () => void;
    defaultValue?: { input: string }
}
const SimpleFormModal = (props: SimpleFormModalProps) => {
    const t = useI18n();
    const { register, handleSubmit, formState: { errors } } = useForm<FormType>({ mode: "onChange", defaultValues: props.defaultValue });

    return (
        <Modal data-testid="div_simpleFormModal" show onHide={props.abort}>
            <Modal.Header data-testid="div_header" closeButton>
                {props.header}
            </Modal.Header>
            <Form onSubmit={handleSubmit(props.save)}>
                <Modal.Body>
                    <Form.Label>{props.elementLabel}</Form.Label>
                    <Form.Control
                        type={props.type}
                        isInvalid={!!errors.input}
                        inputMode={props.inputMode}
                        placeholder={props.inputPlaceholder}
                        {...register("input", props.elementValidation)} />
                    <div data-testid={`err_input`} className="text-danger fs-7">
                        {errors?.input?.message}
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Row className="justify-content-between">
                        <Col xs={"auto"}>
                            <Button data-testid="btn_cancel" variant="outline-secondary" onClick={props.abort}>
                                {t('common.actions.cancel')}
                            </Button>
                        </Col>
                        <Col xs={"auto"}>
                            <Button data-testid="btn_save" variant="outline-primary" type="submit">
                                {t('common.actions.save')}
                            </Button>
                        </Col>
                    </Row>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}

export default SimpleFormModal;
