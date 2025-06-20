import { AutocompleteField, RenderOptionProps } from "@/components/fields/AutocompleteField";
import { issueUniformItem } from "@/dal/uniform/item/_index";
import { ItemLabel } from "@/dal/uniform/item/get";
import { useCadetUniformMap } from "@/dataFetcher/cadet";
import { useUniformLabels } from "@/dataFetcher/uniform";
import { useI18n } from "@/lib/locales/client";
import { SAFormHandler } from "@/lib/SAFormHandler";
import { CadetUniformMap } from "@/types/globalCadetTypes";
import { UniformType, UniformWithOwner } from "@/types/globalUniformTypes";
import { uniformNumberSchema } from "@/zod/uniform";
import { faBoxOpen, faCircleInfo, faPerson, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useState } from "react";
import { Alert, Button, Col, Modal, OverlayTrigger, Row, Tooltip } from "react-bootstrap";

export type CadetUniformTableIssueModalProps = {
    cadetId: string;
    type: UniformType;
    itemToReplace?: {
        id: string;
        number: number;
    };
    onClose: () => void;
};
type AutocompleteOption = ItemLabel & { value: string };
export const CadetUniformTableIssueModal = ({ cadetId, type, itemToReplace, onClose }: CadetUniformTableIssueModalProps) => {
    const t = useI18n();

    const { map, mutate } = useCadetUniformMap(cadetId);
    const { uniformLabels } = useUniformLabels();

    const [selectedItem, setSelectedItem] = useState<AutocompleteOption | null>(null);
    const [inputValue, setInputValue] = useState<number | null>(null);
    const [invalidInput, setInvalidInput] = useState(false);

    const issuedItemList: UniformWithOwner[] = map?.[type.id] ?? [];
    const options = uniformLabels
        ?.filter(label => (label.typeId === type.id))
        .map(label => ({
            ...label,
            value: label.id,
            label: label.number.toString(),
        })) ?? [];
    const isOwnedByCadet = !!inputValue && !!issuedItemList.some(item => item.number === inputValue);

    const handleIssue = () => {
        if (!inputValue) return;

        SAFormHandler(
            issueUniformItem({
                cadetId: cadetId,
                number: inputValue,
                uniformTypeId: type.id,
                idToReplace: itemToReplace?.id,
                options: {
                    ignoreInactive: (!!selectedItem && !selectedItem.active),
                    force: !!(selectedItem && selectedItem.owner),
                    create: !selectedItem,
                }
            }),
            null,
            (returnData) => {
                mutate(returnData as CadetUniformMap);
                onClose();
            },
            t('cadetDetailPage.issueModal.error.issueFailed'),
        );
    }

    const getErrorMessage = () => {
        if (selectedItem) {
            return undefined;
        }
        if (invalidInput) {
            return t('cadetDetailPage.issueModal.error.invalidNumber');
        }
        if (inputValue === null) {
            return t('common.error.string.required');
        }
        return undefined
    }

    return (
        <Modal show onHide={onClose}>
            <Modal.Header closeButton>
                <Modal.Title role="heading">
                    {itemToReplace
                        ? t('cadetDetailPage.issueModal.header.replace', { type: type.name, number: itemToReplace.number })
                        : t("cadetDetailPage.issueModal.header.add", { type: type.name })
                    }
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Row>
                    <Col>
                        <AutocompleteField<AutocompleteOption>
                            label={t('cadetDetailPage.issueModal.input.label')}
                            value={selectedItem?.value ?? null}
                            options={options}
                            renderOption={getRenderOptionFunction({
                                isReserve: t('cadetDetailPage.issueModal.option.isReserve'),
                                owner: t('cadetDetailPage.issueModal.option.owner'),
                                storageUnit: t('cadetDetailPage.issueModal.option.storageUnit'),
                            }, issuedItemList)}
                            isOptionDisabled={(option) => issuedItemList.some(item => item.number === option.number)}
                            onChange={(value) => {
                                const selected = options.find(option => option.value === value);
                                setSelectedItem(selected ?? null);
                            }}
                            onInputChange={(value) => {
                                const zodValue = uniformNumberSchema.safeParse(+value);
                                if (zodValue.success) {
                                    setInputValue(zodValue.data);
                                    setInvalidInput(false);
                                }
                                else {
                                    setInputValue(null);
                                    setInvalidInput(true);
                                }
                            }}
                            errorMessage={getErrorMessage()}
                        />
                    </Col>
                </Row>
                {isOwnedByCadet && (
                    <Alert variant="info" className="my-3 d-flex align-items-center p-2">
                        <FontAwesomeIcon icon={faCircleInfo} className="me-2 text-info" />
                        <div>
                            {t('cadetDetailPage.issueModal.alert.itemAlreadyOwned')}
                        </div>
                    </Alert>
                )}
                {(selectedItem?.owner && !isOwnedByCadet) && (
                    <Alert variant="danger" className="my-3 d-flex align-items-center p-2">
                        <FontAwesomeIcon icon={faTriangleExclamation} className="me-2 " />
                        <div>
                            {t('cadetDetailPage.issueModal.alert.owner.1')}&nbsp;
                            <Link className="alert-link text-decoration-underline" href={`/app/cadet/${selectedItem.owner.id}`} target="_blank">
                                {selectedItem.owner.firstname} {selectedItem.owner.lastname}
                            </Link>
                            &nbsp;{t('cadetDetailPage.issueModal.alert.owner.2')}
                        </div>
                    </Alert>
                )}
                {(selectedItem && !selectedItem?.active) && (
                    <Alert variant="warning" className="my-3 d-flex align-items-center p-2">
                        <FontAwesomeIcon icon={faTriangleExclamation} className="me-2 " />
                        <div>
                            Uniformteil ist als Reserve markiert
                        </div>
                    </Alert>
                )}
                {(!selectedItem && inputValue && !isOwnedByCadet) && (
                    <Alert variant="warning" className="my-3 d-flex align-items-center p-2">
                        <FontAwesomeIcon icon={faTriangleExclamation} className="me-2 " />
                        <div>
                            {t('cadetDetailPage.issueModal.alert.noItemFound', { number: inputValue })}
                        </div>
                    </Alert>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button
                    type="button"
                    variant="secondary" data-dismiss="modal"
                    onClick={onClose}
                >
                    {t('common.actions.cancel')}
                </Button>
                <Button
                    type="button"
                    variant={(selectedItem?.owner && !isOwnedByCadet) ? "danger" : "primary"}
                    disabled={!selectedItem && !inputValue || isOwnedByCadet}
                    onClick={handleIssue}
                >
                    {(selectedItem?.owner && !isOwnedByCadet)
                        ? t('cadetDetailPage.issueModal.button.changeOwner')
                        : (!selectedItem && inputValue && !isOwnedByCadet)
                            ? t('cadetDetailPage.issueModal.button.create')
                            : itemToReplace
                                ? t('cadetDetailPage.issueModal.button.replace')
                                : t('cadetDetailPage.issueModal.button.issue')
                    }
                </Button>
            </Modal.Footer>
        </Modal>
    )
}


const getRenderOptionFunction = (translations: { isReserve: string, owner: string, storageUnit: string }, issuedItemList: UniformWithOwner[]) => {
    const render = ({ option, onMouseDown, highlighted, selected }: RenderOptionProps<AutocompleteOption>) => {
        const disabled = issuedItemList.some(item => item.number === option.number);

        let textColor = ""
        if (disabled) {
            textColor = "text-secondary";
        } else if (option.owner) {
            textColor = "text-danger";
        } else if (!option.active) {
            textColor = "text-warning";
        }

        const optionElement = (
            <div key={option.value}
                className={`d-flex align-items-center gap-1 p-2 ${highlighted ? 'bg-secondary-subtle' : 'bg-white'} ${textColor}`}
                style={{
                    cursor: disabled ? 'not-allowed' : 'pointer',
                }}
                role="option"
                aria-selected={selected}
                aria-disabled={disabled}
                onMouseDown={onMouseDown}
            >
                <span>{option.number}</span>
                {option.owner &&
                    <FontAwesomeIcon icon={faPerson} className="text-danger" />
                }
                {!option.active &&
                    <FontAwesomeIcon icon={faTriangleExclamation} className="text-warning" />
                }
                {option.storageUnit &&
                    <FontAwesomeIcon icon={faBoxOpen} className="text-secondary" />
                }
            </div>
        )

        if (!option.owner && !option.storageUnit && option.active)
            return optionElement;

        return (
            <OverlayTrigger
                delay={{ show: 500, hide: 150 }}
                key={option.value}
                overlay={
                    <Tooltip className="d-none d-lg-inline">
                        <ul className="m-0 p-1 ps-3 text-start">
                            {option.active || <li>{translations.isReserve}</li>}
                            {option.owner && <li>{translations.owner}{option.owner.firstname} {option.owner.lastname}</li>}
                            {option.storageUnit && <li>{translations.storageUnit}<span style={{ "whiteSpace": "nowrap" }}>&quot;{option.storageUnit.name}&quot;</span></li>}
                        </ul>
                    </Tooltip>
                }
            >
                {optionElement}
            </OverlayTrigger>
        );
    }
    return render;
}
