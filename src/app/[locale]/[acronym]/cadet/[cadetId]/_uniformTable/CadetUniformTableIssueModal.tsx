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
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { faBoxOpen, faCircleInfo, faRegistered, faTriangleExclamation, faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useMemo, useState } from "react";
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
    const options = useMemo(
        () => uniformLabels
            ?.filter(label => (label.typeId === type.id))
            .map(label => ({
                ...label,
                value: label.id,
                label: label.number.toString(),
            })) ?? [],
        [uniformLabels, type.id]);
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
                            errorMessage={invalidInput ? t('cadetDetailPage.issueModal.error.invalidNumber') : undefined}
                        />
                    </Col>
                </Row>
                {isOwnedByCadet && (
                    <CustomAlert
                        variant="info"
                        icon={faCircleInfo}
                    >
                        {t('cadetDetailPage.issueModal.alert.itemAlreadyOwned')}
                    </CustomAlert>
                )}
                {(selectedItem?.owner && !isOwnedByCadet) && (
                    <CustomAlert
                        variant="danger"
                        icon={faUser}
                    >
                        {t('cadetDetailPage.issueModal.alert.owner.1')}&nbsp;
                        <Link className="alert-link text-decoration-underline" href={`/app/cadet/${selectedItem.owner.id}`} target="_blank">
                            {selectedItem.owner.firstname} {selectedItem.owner.lastname}
                        </Link>
                        &nbsp;{t('cadetDetailPage.issueModal.alert.owner.2')}
                    </CustomAlert>
                )}
                {(selectedItem && !selectedItem?.active) && (
                    <CustomAlert
                        variant="warning"
                        icon={faRegistered}
                    >
                        {t('cadetDetailPage.issueModal.alert.reserve')}
                    </CustomAlert>
                )}
                {(!selectedItem && inputValue && !isOwnedByCadet) && (
                    <Alert variant="warning" className="my-3 d-flex align-items-center p-2">
                        <FontAwesomeIcon icon={faTriangleExclamation} className="me-2 " />
                        <div>
                            {t('cadetDetailPage.issueModal.alert.noItemFound', { number: inputValue })}
                        </div>
                    </Alert>
                )}
                {(selectedItem && selectedItem.storageUnit) && (
                    <CustomAlert
                        variant="secondary"
                        icon={faBoxOpen}
                    >
                        {t('cadetDetailPage.issueModal.alert.storageUnit', { unit: selectedItem.storageUnit.name })}
                    </CustomAlert>
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

const CustomAlert = ({ variant, children, icon }: { variant: string, children: React.ReactNode | string, icon: IconProp}) => (
    <Alert variant={variant} className="my-3 d-flex align-items-center p-2">
        <div className={`px-2`}>
            <FontAwesomeIcon icon={icon} size="lg"/>
        </div>
        <div className={`px-2 border-start border-2 border-${variant}-subtle`}>
            {children}
        </div>
    </Alert>
);

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
                    <FontAwesomeIcon icon={faUser} className="text-danger" />
                }
                {!option.active &&
                    <FontAwesomeIcon icon={faRegistered} className="text-warning" />
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
