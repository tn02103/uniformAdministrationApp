import { getUniformItemHistory } from "@/dal/uniform/item/_index";
import { format } from "date-fns";
import { Col, Row } from "react-bootstrap";
import useSWR from "swr";

type UniformHistoryRowProps = {
    uniformId: string;
}

export default function UniformHistoryRow({ uniformId }: UniformHistoryRowProps) {

    const { data: uniformHistory } = useSWR(
        `uniform.${uniformId}.history`,
        () => getUniformItemHistory(uniformId)
    );
    
    return (
        <Row>
            <Col className="m-0 p-4">
                <Row className="bg-light p-2">
                    <Col xs={4} className="fw-bold text-truncate">Ausgabe:</Col>
                    <Col xs={4} className="fw-bold text-truncate">Rückgabe:</Col>
                    <Col xs={4} className="fw-bold text-truncate">Person:</Col>
                </Row>
                {uniformHistory?.map((issueEntry, index) => (
                    <Row key={index}>
                        <Col>{format(issueEntry.dateIssued, "dd.MM.yyyy")}</Col>
                        <Col>
                            {issueEntry.dateReturned ? format(issueEntry.dateReturned, "dd.MM.yyyy") : ""}
                        </Col>
                        <Col
                            className={issueEntry.cadet.recdelete ? "text-decoration-line-through text-danger" : ""}
                            title={issueEntry.cadet.recdelete ? "Person gelöscht" : ""}
                        >
                            {issueEntry.cadet.firstname} {issueEntry.cadet.lastname}
                        </Col>
                    </Row>
                ))}
            </Col>
        </Row>
    )
}