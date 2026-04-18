import TooltipIconButton from "@/components/Buttons/TooltipIconButton";
import { useI18n } from "@/lib/locales/client";
import { CadetInspectionFormSchema } from "@/zod/deficiency";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { useParams } from "next/navigation";
import { Col, Row } from "react-bootstrap";
import { Control, FieldValues, useFormContext, useWatch } from "react-hook-form";
import { ParamType } from "../page";
import { DeficiencyFormFields } from "./DeficiencyFormFields";


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
    const { control } = useFormContext<CadetInspectionFormSchema>();
    const { cadetId }: ParamType = useParams();

    const dateCreated = useWatch<CadetInspectionFormSchema>({
        name: `newDeficiencyList.${index}.dateCreated`,
    });
    const isCreated = !!dateCreated;

    return (
        <Row data-testid={`div_newDef_${index}`} className="p-2 m-0 border-top border-1 border-dark">
            <DeficiencyFormFields
                control={control as unknown as Control<FieldValues>}
                namePrefix={`newDeficiencyList.${index}`}
                cadetId={cadetId}
                disabled={isCreated}
            />
            <Col xs={1} className="align-self-end p-0 pb-2 d-sm-none" align="right">
                <TooltipIconButton
                    icon={faTrash}
                    variant="outline-danger"
                    tooltipText={t("common.actions.delete")}
                    onClick={remove}
                    testId="btn_delete_mobile"
                />
            </Col>
            <Col xs={"1"} className="d-none d-sm-inline align-self-end p-0 pb-2 pe-3" align="right">
                <TooltipIconButton
                    icon={faTrash}
                    variant="outline-danger"
                    tooltipText={t("common.actions.delete")}
                    onClick={remove}
                    testId="btn_delete"
                />
            </Col>
        </Row>
    );
}
