import dayjs from "@/lib/dayjs";
import { useScopedI18n } from "@/lib/locales/client";
import { Col, Row } from "react-bootstrap";

/** Minimum shape accepted by DeficiencyReadDisplay. Compatible with both Deficiency and OldDeficiencyFormSchema. */
export type DeficiencyDisplayData = {
    description: string;
    typeName: string;
    dateCreated?: Date | string | null;
    comment?: string | null;
};

/**
 * Read-only display of a deficiency's core fields.
 *
 * Returns Col fragments — must be placed inside a Bootstrap Row.
 *
 * @param deficiency - The deficiency data to render.
 * @param compact - When true, hides dateCreated and comment (used in inspection step 2).
 */
export function DeficiencyReadDisplay({
    deficiency,
    compact = false,
}: {
    deficiency: DeficiencyDisplayData;
    compact?: boolean;
}) {
    const tCom = useScopedI18n('common');

    return (
        <>
            <Col xs={6} sm={4} className="pt-1">
                <Row>
                    <Col className="fs-8 fw-bold fst-italic align-bottom">
                        {tCom('description')}
                    </Col>
                </Row>
                <Row className="align-top">
                    <Col data-testid="div_description" className="align-text-top">
                        {deficiency.description}
                    </Col>
                </Row>
            </Col>
            <Col xs={6} sm={4} className="pt-1">
                <Row>
                    <Col className="fs-8 fw-bold fst-italic">
                        {tCom('type')}
                    </Col>
                </Row>
                <Row>
                    <Col data-testid="div_type">
                        {deficiency.typeName}
                    </Col>
                </Row>
            </Col>
            {!compact && (
                <Col xs={6} sm={4} className="pt-1">
                    <Row>
                        <Col className="fs-8 fw-bold fst-italic">
                            {tCom('dates.created')}
                        </Col>
                    </Row>
                    <Row>
                        <Col data-testid="div_created">
                            {deficiency.dateCreated ? dayjs(deficiency.dateCreated).format('DD.MM.YYYY') : ''}
                        </Col>
                    </Row>
                </Col>
            )}
            {!compact && (
                <Col xs="12" className="pt-2">
                    <Row>
                        <Col className="fs-8 fw-bold fst-italic">
                            {tCom('comment')}
                        </Col>
                    </Row>
                    <Row>
                        <Col data-testid="div_comment">
                            {deficiency.comment}
                        </Col>
                    </Row>
                </Col>
            )}
        </>
    );
}
