import { useChangeLocale, useCurrentLocale, useScopedI18n } from "@/lib/locales/client";
import { Button, Col, Form, Modal, Row } from "react-bootstrap";
import { useForm } from "react-hook-form";


export default function ChangeLanguageModal({ onClose }: { onClose: () => void }) {
    const t = useScopedI18n('modals.changeLanguage');
    const changeLocale = useChangeLocale();
    const currentLocale = useCurrentLocale();

    const { handleSubmit, register } = useForm<{ locale: locales }>({ defaultValues: { locale: currentLocale } });


    const locales = ['de', 'en'];
    type locales = 'de' | 'en';

    function onSubmit(data: { locale: locales }) {
        changeLocale(data.locale);
    }

    return (
        <Modal data-testid="div_popup" show={true} onHide={onClose}>
            <Modal.Header data-testid="div_header" closeButton className={`bg-body-secondary fs-5 fw-bold`}>
                {t('header')}
            </Modal.Header>
            <form onSubmit={handleSubmit(onSubmit)}>
                <Modal.Body>
                    <Form.Label>{t('label')}</Form.Label>
                    <Form.Select {...register('locale')}>
                        {locales.map((locale) => (
                            <option key={locale} value={locale}>
                                {t(`options.${locale as locales}`)}
                            </option>
                        ))}
                    </Form.Select>
                </Modal.Body>
                <Modal.Footer>
                    <Row className="justify-content-between">
                        <Col xs={"auto"}>
                            <Button data-testid="btn_cancel" variant="outline-secondary" onClick={onClose}>
                                {t('cancel')}
                            </Button>
                        </Col>
                        <Col xs={"auto"}>
                            <Button data-testid="btn_save" variant="outline-primary" type="submit">
                                {t('change')}
                            </Button>
                        </Col>
                    </Row>
                </Modal.Footer>
            </form>
        </Modal>
    )
}