"use client"

import TooltipIconButton from "@/components/TooltipIconButton";
import { useGlobalData } from "@/components/globalDataProvider";
import { useModal } from "@/components/modals/modalProvider";
import { ExceptionType } from "@/errors/CustomException";
import { AuthRole } from "@/lib/AuthRoles";
import { useI18n, useScopedI18n } from "@/lib/locales/client";
import { CadetUniformMap } from "@/types/globalCadetTypes";
import { Uniform, UniformType } from "@/types/globalUniformTypes";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { useParams } from "next/navigation";
import { toast } from "react-toastify";
import useSWR from "swr";
import UniformRow from "./uniformRow";
import { useCadetUniformMap } from "@/dataFetcher/cadet";
import { IssueUniformItemDataType, SAErrorResponseType, issueUniformItem } from "@/actions/controllers/CadetUniformController";



type PropType = {
    uniformMap: CadetUniformMap,
}
const CadetUniformTable = ({ ...props }: PropType) => {
    const t = useI18n();
    const modalT = useScopedI18n('modals.messageModal.uniform');
    const modal = useModal();
    const { cadetId, locale }: { cadetId: string, locale: string } = useParams();

    const { typeList, userRole } = useGlobalData();

    const { map, mutate: keyedMutator, error } = useCadetUniformMap(cadetId, props.uniformMap);
    if (error)
        throw error;

    const handleIssuedErrors = (error: SAErrorResponseType["error"], data: IssueUniformItemDataType) => {
        switch (error.exceptionType) {
            case ExceptionType.UniformIssuedException:
                modal?.showMessageModal(
                    modalT('issuedException.header'),
                    `${modalT('issuedException.message', {
                        firstname: error.data?.owner?.firstname,
                        lastname: error.data?.owner?.lastname,
                    })} 
                        ${!error.data.owner.active ? modalT('issuedException.ownerInactive') : ""}`,
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
                            function: () => { window.open(`/${locale}/app/cadet/${error.data.owner.id}`, "_blank") },
                            closeOnAction: false,
                            testId: "btn_openCadet"
                        },
                        {
                            type: "outline-danger",
                            option: modalT('issuedException.option.changeOwner'),
                            function: () => { issueMutation({ ...data, options: { ...data.options, force: true } }) },
                            testId: "btn_save"
                        }
                    ],
                    "error");
                break;
            case ExceptionType.InactiveException:
                modal?.simpleYesNoModal({
                    type: "error",
                    header: modalT('inactiveException.header'),
                    message: modalT('inactiveException.message', { number: data.number }),
                    primaryOption: t('common.actions.issue'),
                    primaryFunction: () => issueMutation({ ...data, options: { ...data.options, ignoreInactive: true } }),
                });
                break;
            case ExceptionType.NullValueException:
                modal?.simpleYesNoModal({
                    type: "error",
                    header: modalT('nullValueException.header'),
                    message: modalT('nullValueException.message', { number: error.data.number }),
                    primaryOption: modalT('nullValueException.createOption'),
                    primaryFunction: () => issueMutation({ ...data, options: { ...data.options, create: true } }),
                });
                break;
            default:
                throw new Error("Unknown Server Error");
        }
    }

    const issueMutation = (data: IssueUniformItemDataType) => {
        issueUniformItem(data)
            .then((result) => {
                if (!result.error) {
                    keyedMutator(result as CadetUniformMap);
                    return;
                } else {
                    const error = (result as SAErrorResponseType).error;
                    handleIssuedErrors(error, data);
                    return;
                }
            }).catch((e) => {
                console.log(e);
                toast.error(modalT('issueUnknown'));
            });
    }

    const openIssueModal = (type: UniformType, itemToReplace?: Uniform) => modal?.simpleFormModal({
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
        save: (data) => issueMutation({
            number: +data.input,
            uniformTypeId: type.id,
            idToReplace: itemToReplace?.id,
            cadetId,
            options: { force: false, ignoreInactive: false, create: false }
        }),
        abort: () => { }
    });


    return (
        <>
            {typeList.map((type) => {
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
                                    />);
                            })}
                        </div>
                    </div>
                )
            })}
        </>
    )
}

export default CadetUniformTable;
