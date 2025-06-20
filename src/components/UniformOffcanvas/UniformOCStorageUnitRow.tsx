import { addUniformItemToStorageUnit, removeUniformFromStorageUnit } from "@/dal/storageUnit/_index";
import { useStorageUnitsWithUniformItemList } from "@/dataFetcher/storage";
import { AuthRole } from "@/lib/AuthRoles";
import { useI18n } from "@/lib/locales/client";
import { SAFormHandler } from "@/lib/SAFormHandler";
import { UniformWithOwner } from "@/types/globalUniformTypes";
import { faRightLeft, faPlus, faRightToBracket } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import { Row, Col } from "react-bootstrap";
import { LabelIconButton } from "../Buttons/LabelIconButton";
import { TooltipActionButton } from "../Buttons/TooltipIconButton";
import AutocompleteField from "../fields/AutocompleteField";
import { useGlobalData } from "../globalDataProvider";
import { useModal } from "../modals/modalProvider";

export const UniformOCStorageUnitRow = ({ uniform, onSave }: { uniform: UniformWithOwner, onSave: () => void; }) => {
    const t = useI18n();
    const modal = useModal();

    const [editable, setEditable] = useState(false);
    const [value, setValue] = useState<string | null>(null);
    const { userRole } = useGlobalData();

    const { storageUnits } = useStorageUnitsWithUniformItemList();
    const storageUnitOptions = storageUnits?.map(su => ({
        value: su.id,
        label: su.name
    })) ?? [];

    const handleSaveStorageUnit = (ignoreFull: boolean = false) => {
        if (!value) return;
        
        // If the uniform is already assigned to the selected storage unit do nothing
        if (uniform.storageUnit && uniform.storageUnit.id === value) {
            setEditable(false);
            setValue(null);
            return;
        }

        // Check if the selected storage unit is full
        const storageUnit = storageUnits?.find(su => su.id === value);
        if (!storageUnit) return;
        if (!ignoreFull && storageUnit.capacity && storageUnit.capacity <= storageUnit.uniformList.length) {
            modal?.simpleWarningModal({
                header: t('storageUnit.warning.capacity.header'),
                message: t('storageUnit.warning.capacity.message'),
                primaryFunction: () => {
                    handleSaveStorageUnit(true);
                }
            });
            return;
        }

        SAFormHandler(
            addUniformItemToStorageUnit({
                uniformId: uniform.id,
                storageUnitId: value,
                replaceStorageUnit: !!uniform.storageUnit
            }),
            null,
            () => {
                setEditable(false);
                setValue(null);
                onSave();
            },
            t('uniformOffcanvas.storageUnit.error.add'),
        );
    };

    const handleRemoveStorageUnit = () => {
        if (!uniform.storageUnit) return;

        SAFormHandler(
            removeUniformFromStorageUnit({
                storageUnitId: uniform.storageUnit.id,
                uniformIds: [uniform.id],
            }),
            null,
            () => {
                setEditable(false);
                setValue(null);
                onSave();
            },
            t('uniformOffcanvas.storageUnit.error.remove'),
        );
    }

    let content;
    if (editable) {
        content = (
            <>
                <Row className="mt-2 mb-4 justify-content-center">
                    <Col xs={"auto"} className="mb-2">
                        <AutocompleteField
                            options={storageUnitOptions}
                            label={t('uniformOffcanvas.storageUnit.label.add')}
                            placeholder={t('uniformOffcanvas.storageUnit.placeholder.add')}
                            onChange={setValue}
                            value={value}
                        />
                    </Col>
                    <Col xs={"auto"} className="mb-2">
                        <TooltipActionButton
                            variantKey="save"
                            disabled={!value}
                            onClick={() => handleSaveStorageUnit()} />
                        <TooltipActionButton
                            variantKey="cancel"
                            onClick={() => setEditable(false)}
                        />
                    </Col>
                </Row>
            </>
        );
    } else if (uniform.storageUnit) {
        content = (
            <Row className="mt-2 mb-4">
                <Col>
                    <div className="fw-bold">
                        {t('common.name')}
                    </div>
                    <p>
                        {uniform.storageUnit.name}
                    </p>
                </Col>
                <Col>
                    <div className="fw-bold">
                        {t('common.description')}
                    </div>
                    <p>
                        {uniform.storageUnit.description}
                    </p>
                </Col>
            </Row>
        );
    } else {
        content = (
            <p className="text-secondary text-center mt-4">
                {t('uniformOffcanvas.storageUnit.label.notAssigned')}
            </p>
        );
    }

    return (
        <>
            <h4>{t('common.storageUnit')}</h4>
            <hr className="mb-0 mt-4" />
            {(userRole > AuthRole.user) &&
                <Row className="justify-content-evenly">
                    <LabelIconButton
                        label={uniform.storageUnit ? t('uniformOffcanvas.storageUnit.label.button.switch') : t('uniformOffcanvas.storageUnit.label.button.add')}
                        icon={uniform.storageUnit ? faRightLeft : faPlus}
                        buttonVariant="outline-secondary"
                        onClick={() => { setEditable(true); setValue(null); }}
                    />
                    <LabelIconButton
                        label={t('uniformOffcanvas.storageUnit.label.button.remove')}
                        icon={faRightToBracket}
                        disabled={!uniform.storageUnit}
                        buttonVariant="outline-danger"
                        onClick={handleRemoveStorageUnit}
                    />
                </Row>
            }
            {content}
        </>
    );
}
