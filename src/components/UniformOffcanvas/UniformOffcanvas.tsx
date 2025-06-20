import { deleteUniformItem } from "@/dal/uniform/item/_index";
import { AuthRole } from "@/lib/AuthRoles";
import { useI18n } from "@/lib/locales/client";
import { UniformType, UniformWithOwner } from "@/types/globalUniformTypes";
import { useState } from "react";
import { Offcanvas, Row } from "react-bootstrap";
import { toast } from "react-toastify";
import { LabelIconButton } from "../Buttons/LabelIconButton";
import { useGlobalData } from "../globalDataProvider";
import { useModal } from "../modals/modalProvider";
import { UniformDeficiencyRow } from "./UniformDeficiencyRow";
import { UniformDetailRow } from "./UniformDetailRow";
import { UniformHistoryRow } from "./UniformHistoryRow";
import { UniformOCOwnerRow } from "./UniformOCOwnerRow";
import { UniformOCStorageUnitRow } from "./UniformOCStorageUnitRow";

export type UniformOffcanvasProps = {
    uniform: UniformWithOwner;
    uniformType: UniformType;
    onClose: () => void;
    onSave: () => void;
}
export const UniformOffcanvas = ({ uniform, uniformType, onClose, onSave }: UniformOffcanvasProps) => {
    const t = useI18n();
    const [editable, setEditable] = useState(false);
    const modal = useModal();
    const { userRole } = useGlobalData();

    const handleDelete = () => {
        const deleteAction = () => deleteUniformItem(uniform.id)
            .then(() => {
                toast.success(t('uniformOffcanvas.deleteAction.success'));
                onSave();
                onClose();
            }).catch(() =>
                toast.error(t('uniformOffcanvas.deleteAction.failed'))
            );

        modal?.simpleWarningModal({
            header: t('uniformOffcanvas.deleteAction.header', { type: uniform.type.name, number: uniform.number }),
            message: (
                <p>
                    {t('uniformOffcanvas.deleteAction.message.one', { type: uniform.type.name, number: uniform.number })}<br />
                    {t('uniformOffcanvas.deleteAction.message.two')}
                </p>
            ),
            primaryOption: t('common.actions.delete'),
            type: 'danger',
            primaryFunction: deleteAction,
        });
    }

    return (
        <Offcanvas
            show={true}
            onHide={onClose}
            placement="end"
            backdrop={true}
            scroll={false}
            style={{ width: "576px" }}
            aria-labelledby="offcanvas-uniform-header"
        >
            <Offcanvas.Header closeButton>
                <Offcanvas.Title>
                    <h3 id="offcanvas-uniform-header">
                        {uniform.type.name}: <b>{uniform.number}</b>
                    </h3>
                </Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
                <h4>{t('common.details')}</h4>
                <hr className="mb-0" />
                {userRole > AuthRole.user && (
                    <Row className="justify-content-evenly">
                        <LabelIconButton
                            variantKey="edit"
                            disabled={editable}
                            onClick={() => setEditable(true)}
                        />
                        <LabelIconButton
                            variantKey="delete"
                            disabled={editable}
                            onClick={handleDelete}
                        />
                    </Row>
                )}
                <UniformDetailRow
                    uniform={uniform}
                    uniformType={uniformType}
                    editable={editable}
                    setEditable={() => setEditable(!editable)}
                    onSave={onSave}
                />
                {(uniform.issuedEntries.length > 0) && (
                    <UniformOCOwnerRow
                        uniform={uniform}
                    />
                )}
                {(uniform.issuedEntries.length === 0) && (
                    <UniformOCStorageUnitRow
                        uniform={uniform}
                        onSave={onSave}
                    />
                )}
                {userRole > AuthRole.user && (
                    <>
                        <h4>{t('uniformOffcanvas.deficiency.header')}</h4>
                        <hr className="mb-0" />
                        <UniformDeficiencyRow uniformId={uniform.id} />
                        <h4 className="mt-4">{t('uniformOffcanvas.history.header')}</h4>
                        <hr className="mb-0" />
                        <UniformHistoryRow uniformId={uniform.id} />
                    </>
                )}
                <div className="h-50"></div>
            </Offcanvas.Body>
        </Offcanvas>
    );
}
