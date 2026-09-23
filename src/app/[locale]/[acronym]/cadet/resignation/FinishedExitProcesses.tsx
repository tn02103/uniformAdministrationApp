"use client";
import { Table } from "@/components/Tables/Table";
import { TableColumns } from "@/components/Tables/TableTypes";
import { useScopedI18n } from "@/lib/locales/client";
import { ResignationProcess } from "@/types/resignationProcessTypes";
import { useMemo, useState } from "react";
import ExitProcessOffcanvas from "./ExitProcessOffcanvas";

export default function FinishedExitProcesses({ finishedExitProcesses }: { finishedExitProcesses: ResignationProcess[] }) {
    const t = useScopedI18n("memberExit.managementOverview");
    const tCommon = useScopedI18n("common");

    const [openProcessId, setOpenProcessId] = useState<string | null>(null);
    const openProcess = useMemo(() =>
        finishedExitProcesses.find(process => process.id === openProcessId),
        [openProcessId, finishedExitProcesses]
    );

    const tableColumns: TableColumns<ResignationProcess>[] = useMemo(() => [
        {
            key: "firstname",
            label: t('tableheaders.cadet'),
            render: (_, row) => `${row.firstname} ${row.lastname}`
        },
        {
            key: "resignedAt",
            label: t('tableheaders.exitDate'),
            dataType: "datetime"
        },
        {
            key: "resignationProcess",
            label: "Prozess",
            visibleBreakpoint: "sm",
            render: (_, row) => row.resignationProcess ? tCommon('yes') : tCommon('no'),
        },
        {
            key: "resignationProcess.createdAt",
            label: t('tableheaders.exitStartDate'), 
            dataType: "datetime", 
            visibleBreakpoint: "lg",
        },
        {
            key: "resignationProcess.checklistItems",
            label: t('tableheaders.todos'),
            visibleBreakpoint: "sm",
            render: (itemStatuses) => ` ${itemStatuses?.filter(item => item.completedAt).length} / ${itemStatuses?.length}`
        },
        {
            visibleBreakpoint: "xl",
            key: "uniformIssued",
            label: t('tableheaders.uniformAndMaterialReturned'),
            render: (_, { uniformIssued, materialIssued }) => `
            ${uniformIssued.length > 0 ? tCommon('no') : tCommon('yes')} / ${materialIssued.length > 0 ? tCommon('no') : tCommon('yes')}
            `,
        },
        {
            key: "resignationProcess.template.name",
            label: t('tableheaders.template'),
            visibleBreakpoint: "md"
        },
    ], []);

    return (
        <div>
            <h2>{t('headerFinished')}</h2>
            <Table<ResignationProcess>
                data={finishedExitProcesses}
                columns={tableColumns}
                rowActions={[
                    { actionKey: "delete", onClick: (row) => console.log("Delete", row.id), label: tCommon('actions.delete') },
                    { actionKey: "open", onClick: (row) => setOpenProcessId(row.id), label: tCommon('actions.open') },
                ]}
                mobileActionBreakpoint="lg"
                getRowId={(row) => row.id}
            />
            {openProcess && (
                <ExitProcessOffcanvas member={openProcess} onClose={() => setOpenProcessId(null)} editable={false} />
            )}
        </div>
    );
}
