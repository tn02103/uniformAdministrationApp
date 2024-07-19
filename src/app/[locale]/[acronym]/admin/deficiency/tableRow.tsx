import { createDeficiencyType, deleteDeficiencyType, saveDeficiencyType } from "@/actions/controllers/DeficiencyTypeController";
import ErrorMessage from "@/components/errorMessage";
import { useModal } from "@/components/modals/modalProvider";
import { TooltipActionButton } from "@/components/TooltipIconButton";
import { useScopedI18n } from "@/lib/locales/client";
import { AdminDeficiencyType } from "@/types/deficiencyTypes";
import { AdminDeficiencytypeFormSchema } from "@/zod/deficiency";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { Button, FormControl, FormSelect } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { z } from "zod";
var moment = require('moment');

const defaultValue: AdminDeficiencytypeFormSchema = {
    name: "",
    dependend: "cadet",
    relation: null,
}

const FormSchema = AdminDeficiencytypeFormSchema.extend({
    relation: z.enum(['cadet', 'uniform', 'material', 'null']).nullable()
});
type FormSchema = z.infer<typeof FormSchema>
export default function DefTypeAdminTableRow({
    type,
    hideNew,
}: {
    type: AdminDeficiencyType | null;
    hideNew: () => void;
}) {
    const { register, reset, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormSchema>({
        values: type ?? defaultValue,
        mode: "onChange",
        resolver: zodResolver(FormSchema)
    });
    const t = useScopedI18n('admin.deficiency');
    const modal = useModal();

    const [editable, setEditable] = useState(!type);
    const formName = `form_deftype_${type ? type.id : "new"}`;


    useEffect(() => {
        if (watch('dependend') !== "cadet") {
            setValue('relation', null);
        }
    }, [watch('dependend')]);



    async function handleSave(data: FormSchema) {
        if (data.relation === "null") data.relation = null;

        if (type) {
            setEditable(false);
            await saveDeficiencyType({ id: type.id, data: data as AdminDeficiencytypeFormSchema }).catch((e) => {
                console.error(e);
                toast.error('Speichern der Daten fehlgeschlagen');
                reset(type);
            });
        } else {
            await createDeficiencyType(data as AdminDeficiencytypeFormSchema).catch((e) => {
                console.error(e);
                toast.error('Erstellen fehlgeschlagen');
                hideNew();
            });
        }
    }
    function handleCancel() {
        if (type) {
            setEditable(false);
            reset(type);
        } else {
            hideNew();
        }
    }
    async function handleDelete() {
        if (!type) return;

        modal?.simpleWarningModal({
            header: '',
            message: '',
            primaryFunction: () => deleteDeficiencyType(type.id).catch((e) => {
                console.error(e);
                toast.error('Das Löschen des Elements ist fehlgeschlagen')
            })
        });
    }

    return (
        <tr className={"align-middle" + (type?.recdelete ? "text-secondary" : "")}>
            <td className="align-middle">
                <FormControl
                    disabled={!editable}
                    plaintext={!editable}
                    isInvalid={!!errors.name}
                    form={formName}
                    className={"w-100" + (type?.recdelete ? "text-secondary" : "")}
                    {...register('name')}
                />
                <ErrorMessage error={errors.name?.message} />
            </td>
            <td className={"align-middle " + (type?.recdelete ? "text-secondary" : "")}>
                {(!editable && type)
                    ? t(`entity.${type.dependend}`)
                    :
                    <FormSelect
                        form={formName}
                        {...register('dependend')}
                        disabled={!!type && (type.active + type.resolved) > 0}
                    >
                        <option value={"cadet"}>{t(`entity.cadet`)}</option>
                        <option value={"uniform"}>{t(`entity.uniform`)}</option>
                    </FormSelect>
                }
            </td>
            <td className={"align-middle " + (type?.recdelete ? "text-secondary d-nonexs d-sm-table-cell" : "")}>
                {(!editable && type)
                    ? (type.relation ? t(`entity.${type.relation}`) : "")
                    :
                    <FormSelect
                        form={formName}
                        {...register('relation')}
                        disabled={(!!type && (type.active + type.resolved) > 0) || watch('dependend') !== "cadet"}
                    >
                        <option value={'null'}>-</option>
                        <option value={"uniform"}>{t(`entity.uniform`)}</option>
                        <option value={"material"}>{t(`entity.material`)}</option>
                    </FormSelect>
                }
            </td>
            {errors.relation?.message}

            {editable &&
                <td colSpan={3} className="align-middle text-end">
                    <form id={formName} onSubmit={handleSubmit(handleSave)}>
                        <Button variant="outline-primary" size="sm" type="submit">
                            Speichern
                        </Button>
                        <Button variant="outline-danger" className="ms-2" size="sm" type="button" onClick={handleCancel}>
                            Abbrechen
                        </Button>
                    </form>
                </td>
            }
            {(!editable && type) &&
                <>
                    <td className={"align-middle d-nonexs d-sm-table-cell " + (type?.recdelete ? "text-secondary" : "")}>{type.active}</td>
                    <td className={"align-middle " + (type?.recdelete ? "text-secondary d-nonexs d-md-table-cell" : "d-nonexs d-sm-table-cell")}>{type.resolved}</td>
                    {(type.recdelete)
                        ? <td className="text-secondary">
                            gelöscht am: <br />
                            {format(type.recdelete, "dd.MM.yyyy")}
                        </td>
                        : <td className="text-end d-nonexs d-md-table-cell">
                            <TooltipActionButton
                                variantKey="edit"
                                onClick={() => setEditable(true)} />
                            <TooltipActionButton
                                variantKey="delete"
                                onClick={handleDelete} />
                        </td>
                    }
                </>
            }
        </tr>
    )
}
