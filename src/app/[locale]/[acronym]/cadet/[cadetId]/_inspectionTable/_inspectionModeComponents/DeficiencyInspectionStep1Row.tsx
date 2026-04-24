import { ToggleFormField } from "@/components/fields/ToggleFormField";
import { useScopedI18n } from "@/lib/locales/client";
import { CadetInspectionFormSchema, OldDeficiencyFormSchema } from "@/zod/deficiency";
import { Col, Row } from "react-bootstrap";
import { useWatch } from "react-hook-form";
import { DeficiencyReadDisplay } from "../_sharedComponents/DeficiencyReadDisplay";

/** Step-1 resolve toggle — must be rendered inside a FormProvider for the inspection form. */
function ResolvedCheckbox({ index }: { index: number }) {
    const tDef = useScopedI18n('common.deficiency');
    const resolved = useWatch({ name: `oldDeficiencyList.${index}.resolved` });
    const toggleText = resolved ? tDef('resolved.true') : tDef('resolved.false');

    return (
        <Col xs={12} xl={12} className={`justify-content-center ${resolved ? "text-success" : "text-danger"}`}>
            <ToggleFormField<CadetInspectionFormSchema>
                name={`oldDeficiencyList.${index}.resolved`}
                label=""
                toggleText={toggleText}
                formName="cadetInspectionForm"
            />
        </Col>
    );
}

/**
 * Displays a deficiency row during inspection step 1.
 *
 * Renders a resolve toggle above the read-only deficiency data.
 * Must be rendered inside a FormProvider for the cadet inspection form.
 *
 * @param deficiency - The deficiency form data.
 * @param index - Position in the oldDeficiencyList field array (used for the resolve toggle).
 */
export function DeficiencyInspectionStep1Row({
    deficiency,
    index,
}: {
    deficiency: OldDeficiencyFormSchema;
    index: number;
}) {
    return (
        <Row
            className="p-1 m-0 position-relative border-bottom border-1 py-3"
            data-testid={`div_olddef_${deficiency.id}`}
        >
            <ResolvedCheckbox index={index} />
            <DeficiencyReadDisplay deficiency={deficiency} />
        </Row>
    );
}
