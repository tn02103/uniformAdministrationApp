import { TooltipActionButton } from "@/components/Buttons/TooltipIconButton";
import { useScopedI18n } from "@/lib/locales/client";
import { PlannedInspectionType } from "@/types/inspectionTypes";
import dayjs from "dayjs";
import { Button } from "react-bootstrap";

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
export function InspectionButtonColumn({ editable, inspection, nameDuplicationError, handleCancel, handleEdit, handleDelete, handleStart, handleFinish }: ButtonColumnPropType) {
    const t = useScopedI18n('common.actions');
    if (editable || !inspection) {
        return (
            <>
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
            </>
        );
    }

    const isToday = dayjs().isSame(inspection.date, "day");
    if (inspection.timeStart) {
        if (inspection.timeEnd) {
            return (
                <>
                    <Button data-testid="btn_restart" onClick={handleStart} aria-label="restart inspection" size="sm">
                        {t('restart')}
                    </Button>
                </>
            );
        } else {
            return (
                <>
                    <Button
                        variant={isToday ? "success" : "warning"}
                        size="sm"
                        data-testid="btn_complete"
                        onClick={handleFinish}
                        aria-label="finish inspection"
                    >
                        {t('finish')}
                    </Button>
                </>
            );
        }
    }
    return (
        <>
            <TooltipActionButton variantKey="edit" onClick={handleEdit} />
            <TooltipActionButton variantKey="delete" onClick={handleDelete} />
            {isToday &&
                <TooltipActionButton variantKey="startInspection" onClick={handleStart} iconClass="fs-6" />
            }
        </>
    )
}
