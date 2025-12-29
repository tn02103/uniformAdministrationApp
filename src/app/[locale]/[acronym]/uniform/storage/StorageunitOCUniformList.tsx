import { AutocompleteField, RenderOptionProps } from "@/components/fields/AutocompleteField";
import { useGlobalData } from "@/components/globalDataProvider";
import { useModal } from "@/components/modals/modalProvider";
import { TooltipIcon } from "@/components/TooltipIcon";
import { addUniformItemToStorageUnit, removeUniformFromStorageUnit, StorageUnitWithUniformItems } from "@/dal/storageUnit/_index";
import { UniformItemLabel } from "@/dal/uniform/item/_index";
import { useStorageUnitsWithUniformItemList } from "@/dataFetcher/storage";
import { useUniformLabels } from "@/dataFetcher/uniform";
import { AuthRole } from "@/lib/AuthRoles";
import { useScopedI18n } from "@/lib/locales/client";
import { SAFormHandler } from "@/lib/SAFormHandler";
import { faBoxOpen, faRegistered, faUser, faX } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, OverlayTrigger, Table, Tooltip } from "react-bootstrap";

type Props = {
    storageUnit: StorageUnitWithUniformItems
}

type Option = UniformItemLabel & { value: string };
export function StorageunitOCUniformList({ storageUnit }: Props) {
    const t = useScopedI18n('storageUnit');
    const tCommon = useScopedI18n('common');

    const { mutate } = useStorageUnitsWithUniformItemList();
    const { uniformLabels, mutate: labelMutate } = useUniformLabels();
    const { userRole } = useGlobalData();

    const uniformOptions = uniformLabels
        ?.filter(l => !storageUnit.uniformList.some(u => u.id === l.id))
        .map(d => ({ value: d.id, ...d })) ?? [];
    const modal = useModal();

    function handleAdd(uniformId: string | null, options?: { ignoreFull: boolean }) {
        if (!uniformId) return;

        if (!options?.ignoreFull && storageUnit.capacity && storageUnit.uniformList.length >= storageUnit.capacity) {
            modal?.simpleWarningModal({
                header: t('warning.capacity.header'),
                message: t('warning.capacity.message'),
                primaryFunction: () => handleAdd(uniformId, { ignoreFull: true }),
            });
            return;
        }

        SAFormHandler(
            addUniformItemToStorageUnit({
                storageUnitId: storageUnit.id,
                uniformId: uniformId,
            }),
            null,
            (returnData) => {
                mutate(returnData);
                labelMutate();
            },
            t('error.addUT'),
        );
    }

    const handleRemove = async (uniformId: string) => {
        await SAFormHandler(
            removeUniformFromStorageUnit({
                storageUnitId: storageUnit.id,
                uniformIds: [uniformId],
            }),
            null,
            (returnData) => {
                mutate(returnData);
                labelMutate();
            },
            t('error.removeUT'),
        );
    }

    const customFilter = (options: Option[], searchTerm: string) => {
        if (!searchTerm) return options;

        const parts = searchTerm.split(/[-\s]+/).filter(Boolean);
        const isNumber = parts.map(part => !isNaN(Number(part)));
        return options.filter(option => {
            return parts.every((part, index) => {
                if (isNumber[index]) {
                    return String(option.number).includes(part);
                } else {
                    const lowerPart = part.toLowerCase();

                    return (
                        option.type.name.toLocaleLowerCase().includes(lowerPart)
                        || option.type.acronym.toLocaleLowerCase().includes(lowerPart)
                    );
                }
            });
        });
    };

    return (
        <div>
            <h4 className="text-center">{t('label.header.uniformlist')}</h4>
            {(userRole >= AuthRole.inspector) &&
                <div className="my-3">
                    <AutocompleteField<Option>
                        noImplicitChange
                        resetOnChange
                        label={t('label.addUT')}
                        options={uniformOptions}
                        onChange={handleAdd}
                        renderOption={getRenderOptionFunction({
                            isReserve: t('tooltips.utOptions.isReserve'),
                            owner: t('tooltips.utOptions.owner'),
                            storageUnit: t('tooltips.utOptions.storageUnit'),
                        })}
                        isOptionDisabled={(option) => !!(option.owner || option.storageUnit)}
                        customFilter={customFilter}
                    />
                </div>
            }
            <Table hover aria-label="uniformlist">
                <thead>
                    <tr className="border-bottom border-dark">
                        <th></th>
                        <th>{tCommon('uniform.type.type', { count: 1 })}</th>
                        <th>{tCommon('uniform.size')}</th>
                        <th>{tCommon('uniform.generation.label', { count: 1 })}</th>
                    </tr>
                </thead>
                <tbody>
                    {storageUnit.uniformList.map((uniform) => {
                        const isReserve = uniform.isReserve || uniform.generation?.isReserve;
                        return (
                            <tr
                                key={uniform.id}
                                className={`hoverCol align-middle`}
                            >
                                <td>
                                    {(userRole >= AuthRole.inspector) &&
                                        <Button
                                            variant={"light"}
                                            className={(process.env.NEXT_PUBLIC_STAGE !== "TEST") ? "hoverColHidden" : ""}
                                            size="sm"
                                            onClick={() => handleRemove(uniform.id)}
                                            aria-label={tCommon('actions.remove')}
                                        >
                                            <FontAwesomeIcon icon={faX} className="text-danger" />
                                        </Button>
                                    }
                                </td>
                                <td>
                                    <div className="d-flex align-items-left gap-2">
                                        {uniform.type.name}-{uniform.number}
                                        {isReserve && <TooltipIcon icon={faRegistered} tooltipText={tCommon('uniform.state.isReserve')} className="text-secondary my-auto" />}
                                    </div>
                                </td>
                                <td>{uniform.size?.name}</td>
                                <td>{uniform.generation?.name ?? "--"}</td>
                            </tr>
                        )
                    })}
                </tbody>
            </Table>
        </div>
    );
}

const getRenderOptionFunction = (translations: { isReserve: string, owner: string, storageUnit: string }) => {
    const render = ({ option, onMouseDown, highlighted, selected }: RenderOptionProps<Option>) => {
        const disabled = !!(option.owner || option.storageUnit);
        const getTextColor = () => {
            if (option.owner) return 'text-danger';
            if (option.storageUnit) return 'text-danger';
            return '';
        }

        const optionElement = (
            <div key={option.value}
                className={`d-flex align-items-center gap-2 p-2 ${highlighted ? 'bg-secondary-subtle' : 'bg-white'} ${getTextColor()}`}
                style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
                role="option"
                aria-selected={selected}
                aria-disabled={disabled}
                onMouseDown={onMouseDown}
            >
                <span>{option.label}</span>
                {option.owner &&
                    <FontAwesomeIcon icon={faUser} className="text-danger" />
                }
                {option.isReserve &&
                    <FontAwesomeIcon icon={faRegistered} className="text-secondary" />
                }
                {option.storageUnit &&
                    <FontAwesomeIcon icon={faBoxOpen} className="text-danger" />
                }
            </div>
        )

        if (!disabled && !option.isReserve)
            return optionElement;

        return (
            <OverlayTrigger
                delay={{ show: 500, hide: 150 }}
                key={option.value}
                overlay={
                    <Tooltip className="d-none d-lg-inline">
                        <ul className="m-0 p-1 ps-3 text-start">
                            {option.isReserve && <li>{translations.isReserve}</li>}
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
