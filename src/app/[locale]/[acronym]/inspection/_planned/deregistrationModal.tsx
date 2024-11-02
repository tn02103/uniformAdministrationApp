import { updateCadetRegistrationForInspection } from "@/dal/inspection/planned/updateDeregistration";
import { usePlannedInspectionList } from "@/dataFetcher/inspection";
import { CadetLabel } from "@/types/globalCadetTypes";
import { PlannedInspectionType } from "@/types/inspectionTypes";
import { faX } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import dayjs from "dayjs";
import { useState } from "react";
import { Button, Col, Form, Modal, ModalBody, ModalFooter, ModalHeader, Row } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";

export default function DeregistrationModal({
    inspection,
    cadetList,
    onHide
}: {
    inspection: PlannedInspectionType;
    cadetList: CadetLabel[];
    onHide: () => void;
}) {
    const { register, watch, setValue } = useForm<{ searchParam: string }>();
    const [showList, setShowList] = useState(false);
    const { mutate } = usePlannedInspectionList();

    function filterFunktion(cadet: CadetLabel) {
        const searchParam = watch('searchParam')?.toLocaleLowerCase();

        return (
            !searchParam
            || searchParam.length === 0
            || cadet.firstname.concat(cadet.lastname).toLowerCase().replaceAll(" ", "").includes(searchParam)
            || cadet.lastname.concat(cadet.firstname).toLowerCase().replaceAll(" ", "").includes(searchParam)
        )
    }

    function handleDeregister(cadetId: string) {
        const deregister = !inspection.deregistrations.some(ci => ci.fk_cadet === cadetId)
        updateCadetRegistrationForInspection({
            cadetId,
            inspectionId: inspection.id,
            deregister
        }).then(() => {
            mutate();
        }).catch(e => {
            console.error(e);
            if (deregister) {
                toast.error('Die Person konnte nicht von der Inspektion abgemeldet werden');
            } else {
                toast.error('Die Abmeldung der Person konnte nicht zurückgenommen werden');
            }
        })
    }

    return (
        <Modal show={true} onHide={onHide} data-testid="div_popup">
            <ModalHeader closeButton className="text-center" data-testid="div_header">
                <h3 className="text-center">Abmeldungen</h3>
            </ModalHeader>
            <ModalBody data-testid="div_body">
                <div className="position-relativ w-auto">
                    <div className="input-group flex">
                        <Form.Control {...register('searchParam')} onFocus={() => setShowList(true)} onBlur={async () => { window.setTimeout(() => setShowList(false), 250) }} />
                    </div>
                    <div>
                        <div style={{ display: "contents" }} className={showList ? "" : "d-none"} data-testid="div_select_cadetlist">
                            <div className="position-absolute bg-white border border-1 d-flex flex-column w-50 "  >
                                {cadetList.filter(filterFunktion).map((cadet) =>
                                    <Button
                                        key={cadet.id}
                                        onClick={() => handleDeregister(cadet.id)}
                                        variant="light"
                                        className="rounded-0 text-start row p-0 m-0"
                                        data-testid={`btn_select_cadet_${cadet.id}`}
                                    >
                                        <Row className="p-2">
                                            <Col xs={1}>
                                                {inspection.deregistrations.some(ci => ci.fk_cadet === cadet.id) &&
                                                    <FontAwesomeIcon icon={faX} className="text-danger" />
                                                }
                                            </Col>
                                            <Col xs={8}>
                                                {cadet.lastname} {cadet.firstname}
                                            </Col>
                                        </Row>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div data-testid="div_deregistered">
                    {inspection.deregistrations.map(({ cadet, date }) =>
                        <div key={cadet.id} className=" border-top border-dark p-1 row" data-testid={`div_deregistered_${cadet.id}`}>
                            <Col data-testid="div_name">
                                {cadet.lastname} {cadet.firstname}
                            </Col>
                            <Col data-testid="div_date">
                                am {dayjs(date).format('DD.MM.YYYY')}
                            </Col>
                        </div>
                    )}
                </div>
            </ModalBody>
            <ModalFooter>
            </ModalFooter>
        </Modal>
    )
}
