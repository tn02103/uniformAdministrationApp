import TooltipIconButton from "@/components/Buttons/TooltipIconButton";
import { useI18n } from "@/lib/locales/client";
import { CadetInspectionFormSchema } from "@/zod/deficiency";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { useParams } from "next/navigation";
import { Col, Row } from "react-bootstrap";
import { Control, FieldValues, useFormContext, useWatch } from "react-hook-form";
import { ParamType } from "../../page";
import { DeficiencyFormFields } from "../_sharedComponents/DeficiencyFormFields";


/**
 * Form row for adding a new deficiency during an active inspection.
 *
 * @param index - Position in the newDeficiencyList field array.
 * @param remove - Callback to remove this row from the field array.
 */
export function NewDeficiencyRow({
    index,
    remove,
}: {
    index: number;
    remove: () => void;
}) {
    const t = useI18n();
    const { cadetId }: ParamType = useParams();

    const dateCreated = useWatch<CadetInspectionFormSchema>({
        name: `newDeficiencyList.${index}.dateCreated`,
    });
    const isCreated = !!dateCreated;

    return (
        <div className="position-relative p-0">
            <Row data-testid={`div_newDef_${index}`} className="p-2 m-0 border-top border-1 border-dark ">
                <DeficiencyFormFields
                    namePrefix={`newDeficiencyList.${index}`}
                    cadetId={cadetId}
                    typeSelectDisabled={isCreated}
                />
            </Row>
            <div className="position-absolute end-0 top-0 m-2">
                <TooltipIconButton
                    icon={faTrash}
                    variant="outline-danger"
                    tooltipText={t("common.actions.delete")}
                    iconClass="f"
                    onClick={remove}
                    testId="btn_delete"
                />
            </div>
        </div>
    );
}
