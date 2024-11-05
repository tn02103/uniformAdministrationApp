import { TooltipActionButton } from "@/components/TooltipIconButton";
import { useScopedI18n } from "@/lib/locales/client";
import { PlannedInspectionType } from "@/types/inspectionTypes";
import dayjs from "dayjs";
import { Button, Col } from "react-bootstrap";

type ButtonColumnPropType = {
    handleCancel: () => void;
    handleEdit: () => void;
    handleDelete: () => void;
    handleStart: () => void;
    handleFinish: () => void;
    editable: boolean;
    inspection: PlannedInspectionType | null;
    nameDuplicationError: boolean
};
export function ButtonColumn({ editable, inspection, nameDuplicationError, handleCancel, handleEdit, handleDelete, handleStart, handleFinish }: ButtonColumnPropType) {
    const t = useScopedI18n('common.actions');
    if (editable || !inspection) {
        return (
            <Col>
                <Button
                    type="submit"
                    variant="outline-primary"
                    className="mx-2"
                    disabled={nameDuplicationError}
                    aria-label="save"
                >
                    {t('save')}
                </Button>
                <Button type="button" variant="outline-danger" onClick={handleCancel} aria-label="cancel">
                    {t('cancel')}
                </Button>
            </Col>
        );
    }

    const isToday = dayjs().isSame(inspection.date, "day");
    if (inspection.timeStart) {
        if (inspection.timeEnd) {
            return (
                <Col>
                    <Button data-testid="btn_restart" onClick={handleStart} aria-label="restart inspection">
                        {t('restart')}
                    </Button>
                </Col>
            );
        } else {
            return (
                <Col>
                    <Button
                        variant={isToday ? "success" : "warning"}
                        size="sm"
                        data-testid="btn_complete"
                        onClick={handleFinish}
                        aria-label="finish inspection"
                    >
                        {t('finish')}
                    </Button>
                </Col>
            );
        }
    }
    return (
        <Col>
            <TooltipActionButton variantKey="edit" onClick={handleEdit} />
            <TooltipActionButton variantKey="delete" onClick={handleDelete} />
            {isToday &&
                <TooltipActionButton variantKey="startInspection" onClick={handleStart} iconClass="fs-6" />
            }
        </Col>
    )
}
