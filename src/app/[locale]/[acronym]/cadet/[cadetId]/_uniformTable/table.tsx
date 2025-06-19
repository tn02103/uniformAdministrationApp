"use client"

import TooltipIconButton from "@/components/Buttons/TooltipIconButton";
import { useGlobalData } from "@/components/globalDataProvider";
import { useModal } from "@/components/modals/modalProvider";
import { SAErrorResponseType } from "@/dal/_index";
import { issueUniformItem, IssueUniformItemDataType } from "@/dal/uniform/item/_index";
import { useCadetUniformMap } from "@/dataFetcher/cadet";
import { useUniformTypeList } from "@/dataFetcher/uniformAdmin";
import { ExceptionType } from "@/errors/CustomException";
import { UniformIssuedExceptionData } from "@/errors/SaveDataException";
import { AuthRole } from "@/lib/AuthRoles";
import { useI18n, useScopedI18n } from "@/lib/locales/client";
import { CadetUniformMap } from "@/types/globalCadetTypes";
import { UniformWithOwner, UniformType } from "@/types/globalUniformTypes";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";
import UniformRow from "./uniformRow";
import { NullValueException } from "@/errors/LoadDataException";

type PropType = {
    uniformMap: CadetUniformMap,
}
const CadetUniformTable = ({ ...props }: PropType) => {
    const t = useI18n();
    const modalT = useScopedI18n('modals.messageModal.uniform');
    const modal = useModal();
    const { cadetId, locale }: { cadetId: string, locale: string } = useParams();

    const { userRole } = useGlobalData();
    const { typeList } = useUniformTypeList();
    const { map, mutate: keyedMutator, error } = useCadetUniformMap(cadetId, props.uniformMap);
    const [openUniformId, setOpenUniformId] = useState<string | null>(null);

    if (error)
        throw error;

    const handleIssuedErrors = (error: SAErrorResponseType["error"], data: IssueUniformItemDataType, typename: string) => {
        switch (error.exceptionType) {
            case ExceptionType.UniformIssuedException:
                const errorData: UniformIssuedExceptionData = error.data as UniformIssuedExceptionData;
                modal?.showMessageModal(
                    modalT('issuedException.header'),
                    `${modalT('issuedException.message', {
                        type: typename,
                        number: errorData.uniform.number,
                        firstname: errorData.owner?.firstname,
                        lastname: errorData.owner?.lastname,
                    })} 
                        ${!errorData.owner.active ? modalT('issuedException.ownerInactive') : ""}`,
                    [
                        {
                            type: "outline-secondary",
                            option: t('common.actions.cancel'),
                            function: () => { },
                            testId: "btn_cancel"
                        },
                        {
                            type: "outline-primary",
                            option: modalT('issuedException.option.openCadet'),
                            function: () => { window.open(`/${locale}/app/cadet/${errorData.owner.id}`, "_blank") },
                            closeOnAction: false,
                            testId: "btn_openCadet"
                        },
                        {
                            type: "outline-danger",
                            option: modalT('issuedException.option.changeOwner'),
                            function: () => { issueMutation({ ...data, options: { ...data.options, force: true } }, typename) },
                            testId: "btn_save"
                        }
                    ],
                    "error");
                break;
            case ExceptionType.InactiveException:
                modal?.simpleYesNoModal({
                    type: "error",
                    header: modalT('inactiveException.header'),
                    message: modalT('inactiveException.message', { number: data.number, type: typename }),
                    primaryOption: t('common.actions.issue'),
                    primaryFunction: () => issueMutation({ ...data, options: { ...data.options, ignoreInactive: true } }, typename),
                });
                break;
            case ExceptionType.NullValueException:
                modal?.simpleYesNoModal({
                    type: "error",
                    header: modalT('nullValueException.header'),
                    message: modalT('nullValueException.message', { number: (error.data as NullValueException["data"]).number, type: typename }),
                    primaryOption: modalT('nullValueException.createOption'),
                    primaryFunction: () => issueMutation({ ...data, options: { ...data.options, create: true } }, typename),
                });
                break;
            default:
                throw new Error("Unknown Server Error");
        }
    }

    const issueMutation = async (data: IssueUniformItemDataType, typename: string) => {
        await issueUniformItem(data)
            .then((result) => {
                if (!result.error) {
                    keyedMutator(result as CadetUniformMap);
                    return;
                } else {
                    const error = (result as SAErrorResponseType).error;
                    handleIssuedErrors(error, data, typename);
                    return;
                }
            }).catch((e) => {
                console.error(e);
                toast.error(modalT('issueUnknown'));
            });
    }

    const openIssueModal = (type: UniformType, itemToReplace?: UniformWithOwner) => modal?.simpleFormModal({
        header: itemToReplace ? modalT('replace.header', { type: type.name, number: itemToReplace.number }) : modalT('issue.header', { type: type.name }),
        elementLabel: t('common.uniform.number'),
        elementValidation: {
            valueAsNumber: true,
            required: {
                value: true,
                message: t('common.error.uniform.number.required'),
            },
            max: {
                value: 9999999,
                message: t('common.error.uniform.number.maxLength'),
            },
            min: {
                value: 0,
                message: t('common.error.uniform.number.min'),
            },
            validate: (value) => Number.isInteger(value) || t('common.error.number.pattern'),
        },
        inputMode: "numeric",
        save: async (data) => issueMutation({
            number: +data.input,
            uniformTypeId: type.id,
            idToReplace: itemToReplace?.id,
            cadetId,
            options: { force: false, ignoreInactive: false, create: false }
        }, type.name),
        abort: () => { }
    });


    return (
        <>
            {typeList?.map((type) => {
                const items = map?.[type.id] ?? [];
                return (
                    <div data-testid={`div_utype_${type.id}`} key={"typeRow" + type.id} className="col-12">
                        <div style={{ background: "#f2f2f2" }} className="row m-0 border-top border-bottom border-dark border-1 py-1 ">
                            <div data-testid={"div_name"} className="col-2 col-md-1 fw-bold">{type.name}</div>
                            <div data-testid={"div_uitems_amount"} className={`col-4 col-sm-2 col-xl-1 ${(items.length < type.issuedDefault) ? "text-orange-500" : "fw-light"}`}>
                                ({items?.length} {t('common.of')} {type.issuedDefault})
                            </div>
                            {(userRole >= AuthRole.inspector) &&
                                <div className="col-1">
                                    <TooltipIconButton
                                        testId={`btn_issue`}
                                        variant="outline-success"
                                        buttonSize="sm"
                                        tooltipText={t('common.actions.issue_item', { item: type.name })}
                                        icon={faPlus}
                                        onClick={() => openIssueModal(type)}
                                    />
                                </div>
                            }
                        </div>
                        <div data-testid="div_itemList">
                            {items?.map((uniform) => {
                                return (
                                    <UniformRow
                                        key={"uniformItemRow" + uniform.id}
                                        uniform={uniform}
                                        uniformType={type}
                                        replaceItem={() => openIssueModal(type, uniform)}
                                        openUniformId={openUniformId}
                                        setOpenUniformId={setOpenUniformId}
                                    />
                                );
                            })}
                        </div>
                    </div>
                )
            })}
        </>
    )
}

export default CadetUniformTable;
