import { LabelIconButton } from "@/components/Buttons/LabelIconButton";
import { useModal } from "@/components/modals/modalProvider";
import { deleteStorageUnit, StorageUnitWithUniformItems } from "@/dal/storageUnit/_index";
import { useStorageUnitsWithUniformItemList } from "@/dataFetcher/storage";
import { useI18n } from "@/lib/locales/client";
import { useState } from "react";
import { Offcanvas, Row } from "react-bootstrap";
import { toast } from "react-toastify";
import {StorageunitOCDetailForm} from "./StorageunitOCDetailForm";
import { StorageunitOCHeader } from "./StorageunitOCHeader";
import StorageunitOCUniformList from "./StorageunitOCUniformList";

type Props = {
    storageUnit?: StorageUnitWithUniformItems;
    onHide: () => void;
    setSelectedStorageUnitId: (id: string | null) => void;
}
export default function StorageunitOC({ storageUnit, onHide, setSelectedStorageUnitId }: Props) {
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
        <Offcanvas show={true} onHide={handleOnHide} placement='end' style={{ width: '500px' }}>
            <StorageunitOCHeader storageUnit={storageUnit} />
            <Offcanvas.Body>
                <hr className="mb-0" />
                <Row className="mb-3 justify-content-evenly">
                    <LabelIconButton
                        variantKey="edit"
                        disabled={editable || !storageUnit}
                        onClick={() => setEditable(true)} />
                    <LabelIconButton
                        variantKey="delete"
                        onClick={handleDelete}
                        disabled={!storageUnit || editable}
                    />
                </Row>
                <StorageunitOCDetailForm
                    editable={editable}
                    storageUnit={storageUnit}
                    setEditable={setEditable}
                    setSelectedStorageUnitId={setSelectedStorageUnitId}
                    onHide={onHide}
                />
                {storageUnit && (
                    <>
                        <hr className="mb-0" />
                        <StorageunitOCUniformList storageUnit={storageUnit} />
                    </>
                )}
            </Offcanvas.Body>
        </Offcanvas>
    );
}