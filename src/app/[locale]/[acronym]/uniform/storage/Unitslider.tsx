import { deleteStorageUnit, StorageUnitWithUniformItems } from "@/dal/storageUnit/_index";
import { useState } from "react";
import { Col, Offcanvas, Row } from "react-bootstrap";
import UnitsliderDetailForm from "./UnitsliderDetailForm";
import UnitsliderUniformList from "./UnitsliderUniformList";
import { TooltipActionButton } from "@/components/TooltipIconButton";
import { toast } from "react-toastify";
import { useStorageUnitsWithUniformItemList } from "@/dataFetcher/storage";
import { useI18n } from "@/lib/locales/client";
import { useModal } from "@/components/modals/modalProvider";

type Props = {
    storageUnit?: StorageUnitWithUniformItems;
    onHide: () => void;
    setSelectedStorageUnitId: (id: string | null) => void;
}
export default function Unitslider({ storageUnit, onHide, setSelectedStorageUnitId }: Props) {

    const [editable, setEditable] = useState(!storageUnit);
    const { mutate } = useStorageUnitsWithUniformItemList();
    const t = useI18n();
    const modal = useModal();

    const handleOnHide = () => {
        if (editable) {
            modal?.showMessageModal(
                'Änderungen verwerfen?',
                'Möchten Sie die Änderungen verwerfen?',
                [
                    { option: 'Abbrechen', function: () => { }, type: 'secondary', testId: 'btn_no' },
                    { option: 'Verwerfen', function: onHide, type: 'danger', testId: 'btn_yes' },
                ],
                'warning',
            );
        } else {
            onHide();
        }
    }

    const handleDelete = () => {
        if (!storageUnit) return;

        const deleteMutation = () => deleteStorageUnit(storageUnit.id).then((data) => {
            mutate(data);
            onHide();
        }).catch(() => {
            toast.error(t('common.error.actions.delete'));
        });

        modal?.showMessageModal(
            'Löschen',
            'Möchten Sie den Eintrag wirklich löschen?',
            [
                { option: 'Abbrechen', function: () => { }, type: 'secondary', testId: 'btn_no' },
                { option: 'Löschen', function: deleteMutation, type: 'danger', testId: 'btn_yes' },
            ],
            'danger'
        );
    }
    
    return (
        <Offcanvas show={true} onHide={handleOnHide} placement='end'>
            <Offcanvas.Header closeButton>
                <Offcanvas.Title>{storageUnit?.name ?? "Neu anlegen"}</Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
                {(editable || !storageUnit) ? <UnitsliderDetailForm storageUnit={storageUnit} setEditable={setEditable} setSelectedStorageUnitId={setSelectedStorageUnitId} />
                    : <div>
                        <Row>
                            <Col xs={"auto"} className="fw-bold fs-5 ">{storageUnit.name}</Col>
                            <Col xs={"auto"}>({storageUnit.uniformList.length}/{storageUnit.capacity})</Col>
                            <Col xs={"auto"}>
                                <TooltipActionButton variantKey="edit" onClick={() => setEditable(true)} />
                                <TooltipActionButton variantKey="delete" onClick={handleDelete} />
                            </Col>
                            <Col xs={12}>{storageUnit.description}</Col>
                        </Row>
                    </div>
                }
                <hr />
                {storageUnit && <UnitsliderUniformList storageUnit={storageUnit} />}
            </Offcanvas.Body>
        </Offcanvas>
    );
}