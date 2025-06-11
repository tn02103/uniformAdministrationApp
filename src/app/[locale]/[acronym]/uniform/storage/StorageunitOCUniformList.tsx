import AutocompleteField, { RenderOptionProps } from "@/components/fields/AutocompleteField";
import { useModal } from "@/components/modals/modalProvider";
import { addUniformItemToStorageUnit, removeUniformFromStorageUnit, StorageUnitWithUniformItems } from "@/dal/storageUnit/_index";
import { UniformItemLabel } from "@/dal/uniform/item/_index";
import { useStorageUnitsWithUniformItemList } from "@/dataFetcher/storage";
import { useUniformLabels } from "@/dataFetcher/uniform";
import { useScopedI18n } from "@/lib/locales/client";
import { SAFormHandler } from "@/lib/SAFormHandler";
import { faBoxOpen, faPerson, faTriangleExclamation, faX } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, OverlayTrigger, Table, Tooltip } from "react-bootstrap";

type Props = {
    storageUnit: StorageUnitWithUniformItems
}

type Option = UniformItemLabel & { value: string };
export default function StorageunitOCUniformList({ storageUnit }: Props) {
    const t = useScopedI18n('storageUnit');
    const tCommon = useScopedI18n('common');
    const { mutate } = useStorageUnitsWithUniformItemList();
    const { uniformLabels, mutate: labelMutate } = useUniformLabels();
    const uniformOptions = uniformLabels
        ?.filter(l => !storageUnit.uniformList.some(u => u.id === l.id))
        .map(d => ({ value: d.id, ...d })) ?? [];
    const modal = useModal();

    function handleAdd(uniformId: string | null, options?: { ignoreFull: boolean }) {
        if (!uniformId) return;

        if (!options?.ignoreFull && storageUnit.capacity && storageUnit.uniformList.length >= storageUnit.capacity) {
            modal?.simpleWarningModal({
                header: t('warning.full.header'),
                message: t('warning.full.message'),
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
        )
    }

    return (
        <div>
            <h4 className="text-center">{t('label.headerUT')}</h4>
            <div className="my-3">
                <AutocompleteField<Option>
                    resetOnChange
                    label={t('label.addUT')}
                    options={uniformOptions}
                    value={null}
                    noImplicitChange={true}
                    onChange={handleAdd}
                    renderOption={getRenderOptionFunction({
                        isReserve: t('tooltips.utOptions.isReserve'),
                        owner: t('tooltips.utOptions.owner'),
                        storageUnit: t('tooltips.utOptions.storageUnit'),
                    })}
                    optionDisabled={(option) => !!(option.owner || option.storageUnit)}
                />
            </div>

            <Table hover>
                <thead>
                    <tr className="border-bottom border-dark">
                        <th></th>
                        <th>{tCommon('uniform.type.type', { count: 1 })}</th>
                        <th>{tCommon('uniform.size')}</th>
                        <th>{tCommon('uniform.generation.label', { count: 1 })}</th>
                    </tr>
                </thead>
                <tbody>
                    {storageUnit.uniformList.map((uniform) => (
                        <tr key={uniform.id} className="hoverCol">
                            <td>
                                <Button
                                    variant={"light"}
                                    className="hoverColHidden"
                                    size="sm"
                                    onClick={() => handleRemove(uniform.id)}
                                    aria-label={tCommon('actions.remove')}
                                >
                                    <FontAwesomeIcon icon={faX} className="text-danger" />
                                </Button>
                            </td>
                            <td>{uniform.type.name}-{uniform.number}</td>
                            <td>{uniform.size?.name}</td>
                            <td>{uniform.generation?.name}</td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </div >
    );
}

const getRenderOptionFunction = (translations: { isReserve: string, owner: string, storageUnit: string }) => {
    const render = ({ option, onMouseDown, highlighted, selected }: RenderOptionProps<Option>) => {
        const disabled = !!(option.owner || option.storageUnit);


        const optionElement = (
            <div key={option.value}
                className={`d-flex align-items-center gap-2 p-2 ${highlighted ? 'bg-secondary-subtle' : 'bg-white'} ${disabled ? 'text-danger' : ''}`}
                style={{
                    cursor: disabled ? 'not-allowed' : 'pointer',
                }}
                role="option"
                aria-selected={selected}
                aria-disabled={disabled}
                onMouseDown={onMouseDown}
            >
                <span>{option.label}</span>
                {option.owner &&
                    <FontAwesomeIcon icon={faPerson} className="text-danger" />
                }
                {option.isReserve &&
                    <FontAwesomeIcon icon={faTriangleExclamation} className="text-warning" />
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
