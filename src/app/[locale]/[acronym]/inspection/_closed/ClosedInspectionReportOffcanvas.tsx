"use client";

import { useClosedInspectionReport } from "@/dataFetcher/inspection";
import { useScopedI18n } from "@/lib/locales/client";
import { Offcanvas, Table } from "react-bootstrap";

type ClosedInspectionReportOffcanvasProps = {
    /** ID of the closed inspection to display the report for. */
    inspectionId: string;
    onClose: () => void;
};

/**
 * Offcanvas panel showing a read-only report for a completed inspection.
 */
export function ClosedInspectionReportOffcanvas({ inspectionId, onClose }: ClosedInspectionReportOffcanvasProps) {
    const t = useScopedI18n("inspection.closed");
    const { inspectionReport } = useClosedInspectionReport(inspectionId);

    const attendanceLabel = (status: "inspected" | "excused" | "missing") =>
        t(`report.attendanceStatus.${status}`);

    return (
        <Offcanvas
            show
            backdrop={false}
            onHide={onClose}
            placement="end"
            scroll
            style={{ width: "600px" }}
            aria-labelledby="offcanvas-closed-inspection-report"
        >
            <Offcanvas.Header closeButton>
                <Offcanvas.Title id="offcanvas-closed-inspection-report">
                    {t("report.title")}
                </Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
                {inspectionReport && (
                    <>
                        <dl className="row mb-3">
                            <dt className="col-sm-4">{t("columns.name")}</dt>
                            <dd className="col-sm-8">{inspectionReport.name}</dd>

                            <dt className="col-sm-4">{t("columns.date")}</dt>
                            <dd className="col-sm-8">{inspectionReport.date}</dd>

                            <dt className="col-sm-4">{t("columns.duration")}</dt>
                            <dd className="col-sm-8">{`${inspectionReport.timeStart} - ${inspectionReport.timeEnd}`}</dd>

                            <dt className="col-sm-4">{t("columns.activeCadets")}</dt>
                            <dd className="col-sm-8">{inspectionReport.activeCadets}</dd>

                            <dt className="col-sm-4">{t("columns.cadetsInspected")}</dt>
                            <dd className="col-sm-8">{inspectionReport.cadetsInspected}</dd>

                            <dt className="col-sm-4">{t("columns.deregisteredCadets")}</dt>
                            <dd className="col-sm-8">{inspectionReport.deregisteredCadets}</dd>

                            <dt className="col-sm-4">{t("report.activeDeficiencies")}</dt>
                            <dd className="col-sm-8">{inspectionReport.activeDeficiencyList?.length ?? 0}</dd>
                        </dl>

                        <h6>{t("report.cadetList")}</h6>
                        <Table size="sm" bordered hover>
                            <thead>
                                <tr>
                                    <th>{t("columns.name")}</th>
                                    <th>{t("report.attendance")}</th>
                                    <th>{t("columns.uniformComplete")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {inspectionReport.cadetList.map((entry) => (
                                    <tr key={entry.cadet.id}>
                                        <td>{`${entry.cadet.lastname}, ${entry.cadet.firstname}`}</td>
                                        <td>{attendanceLabel(entry.attendanceStatus)}</td>
                                        <td>
                                            {entry.attendanceStatus === "inspected"
                                                ? entry.lastInspection?.uniformComplete
                                                    ? "✓"
                                                    : "✗"
                                                : "-"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>

                        <a
                            href={`/api/inspection/${inspectionId}/report`}
                            download
                            className="btn btn-outline-secondary"
                            aria-label={t("actions.downloadXlsx")}
                        >
                            {t("actions.downloadXlsx")}
                        </a>
                    </>
                )}
            </Offcanvas.Body>
        </Offcanvas>
    );
}
