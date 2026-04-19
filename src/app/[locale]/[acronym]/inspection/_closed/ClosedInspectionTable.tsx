"use client";

import { useClosedInspectionList } from "@/dataFetcher/inspection";
import { useScopedI18n } from "@/lib/locales/client";
import { ClosedInspectionSummary } from "@/types/deficiencyTypes";
import { useState } from "react";
import { Button, Table } from "react-bootstrap";
import { ClosedInspectionReportOffcanvas } from "./ClosedInspectionReportOffcanvas";

/**
 * Table of completed (closed) inspections with actions to view report or download XLSX.
 *
 * @param initialData - SSR-prefetched list of closed inspection summaries used as fallback.
 */
export function ClosedInspectionTable({ initialData }: { initialData: ClosedInspectionSummary[] }) {
    const t = useScopedI18n("inspection.closed");
    const { closedInspectionList } = useClosedInspectionList(initialData);
    const [reportInspectionId, setReportInspectionId] = useState<string | null>(null);

    return (
        <div data-testid="div_closedInspectionTable">
            <Table bordered hover responsive>
                <thead>
                    <tr>
                        <th>{t("columns.name")}</th>
                        <th>{t("columns.date")}</th>
                        <th>{t("columns.duration")}</th>
                        <th>{t("columns.activeCadets")}</th>
                        <th>{t("columns.cadetsInspected")}</th>
                        <th>{t("columns.deregisteredCadets")}</th>
                        <th>{t("columns.missingCadets")}</th>
                        <th>{t("columns.uniformComplete")}</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {closedInspectionList?.map((inspection) => (
                        <tr key={inspection.id} data-testid={`row_${inspection.id}`}>
                            <td>{inspection.name}</td>
                            <td>{inspection.date}</td>
                            <td>{`${inspection.timeStart} - ${inspection.timeEnd}`}</td>
                            <td>{inspection.activeCadets}</td>
                            <td>{inspection.cadetsInspected}</td>
                            <td>{inspection.deregisteredCadets}</td>
                            <td>{inspection.missingCadets}</td>
                            <td>{isNaN(inspection.uniformCompletePercent) ? "-" : `${inspection.uniformCompletePercent}%`}</td>
                            <td className="text-nowrap">
                                <Button
                                    variant="outline-primary"
                                    size="sm"
                                    className="me-2"
                                    onClick={() => setReportInspectionId(inspection.id)}
                                    aria-label={t("actions.showReport")}
                                >
                                    {t("actions.showReport")}
                                </Button>
                                <a
                                    href={`/api/inspection/${inspection.id}/report`}
                                    download
                                    className="btn btn-sm btn-outline-secondary"
                                    aria-label={t("actions.downloadXlsx")}
                                >
                                    {t("actions.downloadXlsx")}
                                </a>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
            {reportInspectionId && (
                <ClosedInspectionReportOffcanvas
                    inspectionId={reportInspectionId}
                    onClose={() => setReportInspectionId(null)}
                />
            )}
        </div>
    );
}
