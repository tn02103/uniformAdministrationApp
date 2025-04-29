"use client"

import TooltipIconButton, { TooltipActionButton } from "@/components/Buttons/TooltipIconButton"
import { createRedirect, deleteRedirect, updateRedirect } from "@/dal/redirects"
import { useI18n } from "@/lib/locales/client"
import { RedirectFormSchema, RedirectFormType } from "@/zod/redirect"
import { faCheck, faCopy, faX } from "@fortawesome/free-solid-svg-icons"
import { zodResolver } from "@hookform/resolvers/zod"
import { Redirect } from "@prisma/client"
import { useState } from "react"
import { FormCheck, FormControl, Table } from "react-bootstrap"
import { useForm } from "react-hook-form"
import { toast } from "react-toastify"

export type RedirectTableProps = {
    redirects: Redirect[];
}
export const RedirectTable = ({ redirects }: RedirectTableProps) => {
    const t = useI18n();
    const [showCreateRow, setShowCreateRow] = useState(false);
    const [isARowEditable, setIsARowEditable] = useState(false);

    return (
        <Table>
            <thead>
                <tr>
                    <th>{t('redirects.code')}</th>
                    <th>{t('redirects.target')}</th>
                    <th>{t('redirects.active')}</th>
                    <th>
                        <TooltipActionButton
                            variantKey="create"
                            disabled={isARowEditable}
                            onClick={() => {
                                setShowCreateRow(true);
                                setIsARowEditable(true);
                            }}
                        />
                    </th>
                </tr>
            </thead>
            <tbody>
                {showCreateRow && (
                    <RedirectTableRow
                        redirect={null}
                        closeNewRow={() => setShowCreateRow(false)}
                        isARowEditable={isARowEditable}
                        setIsARowEditable={setIsARowEditable}
                    />
                )}
                {redirects.map((redirect) => (
                    <RedirectTableRow
                        key={redirect.id}
                        redirect={redirect}
                        isARowEditable={isARowEditable}
                        setIsARowEditable={setIsARowEditable} />
                ))}
            </tbody>
        </Table>
    );
}

type RedirectTableRowProps = {
    redirect: Redirect | null;
    closeNewRow?: () => void;
    isARowEditable: boolean;
    setIsARowEditable: (value: boolean) => void;
}
const RedirectTableRow = ({ redirect, closeNewRow, isARowEditable, setIsARowEditable }: RedirectTableRowProps) => {
    const t = useI18n();
    const form = useForm<RedirectFormType>({
        mode: "onTouched",
        defaultValues: redirect || {
            code: "",
            target: "",
            active: true,
        },
        resolver: zodResolver(RedirectFormSchema),
    });

    const [isEditable, setIsEditable] = useState(!redirect);


    const handleSave = async (data: RedirectFormType) => {
        if (!redirect) {
            return handleCreate(data);
        }

        await updateRedirect({
            id: redirect.id,
            data
        }).catch(() => {
            toast.error(t('common.error.unknown'));
        });
    }

    const handleCreate = async (data: RedirectFormType) => {
        await createRedirect(data).catch(() => {
            toast.error(t('common.error.unknown'));
        });
    }

    const handleDelete = async () => {
        if (!redirect) return;
        await deleteRedirect(redirect.id).catch(() => {
            toast.error(t('common.error.unknown'));
        });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://uniformadmin.com";

    return (
        <tr aria-label={redirect ? redirect.code : 'new'}>
            <td className="col-2">
                <div className=" d-flex flex-row">
                    {!isEditable && (
                        <TooltipIconButton
                            buttonSize="sm"
                            icon={faCopy}
                            variant="outline-secondary"
                            buttonClass="border-0 me-2"
                            tooltipText={t('redirects.sourceUrl')}
                            aria-label={t('redirects.sourceUrl')}
                            testId="btn_copy"
                            onClick={() => { navigator.clipboard.writeText(`${baseUrl}/api/redirects?code=${redirect?.code}`) }}
                        />
                    )}
                    <FormControl
                        plaintext={!isEditable}
                        disabled={!isEditable}
                        aria-label={t('redirects.code')}
                        {...form.register('code')} />
                </div>
            </td>
            <td className="col-6">
                <FormControl
                    {...form.register('target')}
                    type="url"
                    plaintext={!isEditable}
                    disabled={!isEditable}
                    aria-label={t('redirects.target')}
                    placeholder={t('redirects.targetPlaceholder')}
                />
            </td>
            <td>
                {(isEditable || !redirect) ? (
                    <FormCheck
                        {...form.register('active')}
                        type="switch"
                        aria-label={t('redirects.active')}
                        label={form.watch('active') ? t('redirects.activeLabel.true') : t('redirects.activeLabel.false')}
                    />
                ) : redirect.active ? t('redirects.activeLabel.true') : t('redirects.activeLabel.false')}
            </td>
            {isEditable ? (
                <td className="col-1">
                    <form id={`form_redirect_${redirect?.id ?? 'new'}`} onSubmit={form.handleSubmit(handleSave)} noValidate autoComplete="off">
                        <TooltipIconButton
                            icon={faX}
                            variant="outline-danger"
                            buttonClass="border-0"
                            tooltipText={t('common.actions.cancel')}
                            aria-label={t('common.actions.cancel')}
                            testId="btn_cancel"
                            onClick={() => {
                                if (redirect) {
                                    setIsEditable(false);
                                    form.reset(redirect);
                                } else {
                                    closeNewRow?.();
                                }
                                setIsARowEditable(false);
                            }} />
                        <TooltipIconButton
                            icon={faCheck}
                            variant="outline-success"
                            buttonClass="border-0"
                            tooltipText={redirect ? t('common.actions.save') : t('common.actions.create')}
                            aria-label={redirect ? t('common.actions.save') : t('common.actions.create')}
                            testId="btn_save"
                            buttonType="submit"
                            onClick={() => { }} />
                    </form>
                </td>
            ) : (
                <td className="col-1">
                    <TooltipActionButton
                        variantKey="edit"
                        onClick={() => {
                            setIsEditable(true);
                            setIsARowEditable(true);
                        }}
                        disabled={isARowEditable}
                    />
                    <TooltipActionButton
                        variantKey="delete"
                        onClick={handleDelete}
                        disabled={isARowEditable}
                    />
                </td>
            )}
        </tr>
    )
};
