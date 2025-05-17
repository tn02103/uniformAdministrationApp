"use client";

import { useScopedI18n } from "@/lib/locales/client";
import { PlannedInspectionType } from "@/types/inspectionTypes";
import dayjs from "@/lib/dayjs";
import { Badge } from "react-bootstrap";

export function InspectionBadge({ inspection }: { inspection: PlannedInspectionType | null }): React.ReactNode {
    const t = useScopedI18n('inspection.planned.badge');
    if (!inspection) {
        return <Badge pill bg="success" data-testid="lbl_badge">{t('new')}</Badge>
    }

    if (inspection.timeStart) {
        if (inspection.timeEnd) {
            return <Badge pill bg="success" data-testid="lbl_badge">{t('finished')}</Badge>
        }
        if (dayjs().isSame(inspection?.date, "day")) {
            return <Badge pill bg="success" data-testid="lbl_badge">{t('active')}</Badge>
        } else {
            return <Badge pill bg="warning" data-testid="lbl_badge">{t('unfinished')}</Badge>
        }
    } else if (dayjs().isAfter(inspection?.date, "day")) {
        return <Badge pill bg="danger" data-testid="lbl_badge">{t('expired')}</Badge>
    }

    return (
        <Badge pill bg="secondary" data-testid="lbl_badge">{t('planned')}</Badge>
    )
}
