"use client";

import { useInspectionsByCadet } from "@/dataFetcher/inspection";
import { useScopedI18n } from "@/lib/locales/client";
import { Badge, Spinner, Table } from "react-bootstrap";

type Props = {
    cadetId: string;
};

/**
 * Tab content showing the inspection history for a single cadet.
 *
 * @param cadetId - ID of the cadet whose history is displayed.
 */
export const InspectionHistoryTab = ({ cadetId }: Props) => {
    const t = useScopedI18n("cadetDetailPage.extendedInformation.inspectionHistory");
    const { inspectionHistory } = useInspectionsByCadet(cadetId);

    if (inspectionHistory === undefined) {
        return (
            <div className="d-flex justify-content-center p-3">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">{t("loading")}</span>
                </Spinner>
            </div>
        );
    }

    if (inspectionHistory.length === 0) {
        return <p className="text-center text-muted p-3">{t("empty")}</p>;
    }

    const attendanceBadgeVariant = (state: "inspected" | "excused" | "missing") => {
        switch (state) {
            case "inspected": return "success";
            case "excused": return "warning";
            case "missing": return "secondary";
        }
    };

    const uniformCompleteIcon = (value: boolean | null) => {
        if (value === null) return null;
        return value ? t("uniformComplete.yes") : t("uniformComplete.no");
    };

    return (
        <Table striped hover responsive>
            <thead>
                <tr>
                    <th>{t("columns.date")}</th>
                    <th>{t("columns.attendanceState")}</th>
                    <th>{t("columns.uniformComplete")}</th>
                    <th>{t("columns.unresolved")}</th>
                    <th>{t("columns.resolved")}</th>
                    <th>{t("columns.newlyCreated")}</th>
                </tr>
            </thead>
            <tbody>
                {inspectionHistory.map((row) => (
                    <tr key={row.id}>
                        <td>{row.date}</td>
                        <td>
                            <Badge bg={attendanceBadgeVariant(row.attendanceState)}>
                                {t(`attendanceState.${row.attendanceState}`)}
                            </Badge>
                        </td>
                        <td>{uniformCompleteIcon(row.uniformComplete)}</td>
                        <td>{row.unresolvedCount}</td>
                        <td>{row.resolvedCount}</td>
                        <td>{row.newlyCreatedCount}</td>
                    </tr>
                ))}
            </tbody>
        </Table>
    );
};
