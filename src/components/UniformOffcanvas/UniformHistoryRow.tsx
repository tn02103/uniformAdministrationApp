import { useUniformItemHistory } from "@/dataFetcher/uniform";
import { useI18n } from "@/lib/locales/client";
import { format } from "date-fns";
import { Col, Row } from "react-bootstrap";

type UniformHistoryRowProps = {
    uniformId: string;
}

export function UniformHistoryRow({ uniformId }: UniformHistoryRowProps) {
    const t = useI18n();
    const { history } = useUniformItemHistory(uniformId);

    return (
        <Row>
            <Col className="m-0 p-4" role="list" aria-label={t('uniformOffcanvas.history.header')}>
                <Row className="bg-light p-2">
                    <Col xs={4} className="fw-bold text-truncate">{t('uniformOffcanvas.history.label.dateIssued')}:</Col>
                    <Col xs={4} className="fw-bold text-truncate">{t('uniformOffcanvas.history.label.dateReturned')}:</Col>
                    <Col xs={4} className="fw-bold text-truncate">{t('uniformOffcanvas.history.label.cadet')}:</Col>
                </Row>
                {history?.map((issueEntry, index) => (
                    <Row key={index} role="listitem">
                        <Col aria-label={'dateIssued'}>{format(issueEntry.dateIssued, "dd.MM.yyyy")}</Col>
                        <Col aria-label={'dateReturned'}>
                            {issueEntry.dateReturned ? format(issueEntry.dateReturned, "dd.MM.yyyy") : ""}
                        </Col>
                        <Col
                            aria-label={'person'}
                            className={issueEntry.cadet.recdelete ? "text-decoration-line-through text-danger" : ""}
                            title={issueEntry.cadet.recdelete ? t('uniformOffcanvas.history.title.deleted') : ""}
                        >
                            {issueEntry.cadet.firstname} {issueEntry.cadet.lastname}
                        </Col>
                    </Row>
                ))}
                {history?.length === 0 && (
                    <Row className="text-center text-secondary p-2">
                        <Col>{t('uniformOffcanvas.history.noEntries')}</Col>
                    </Row>
                )}
            </Col>
        </Row>
    )
}