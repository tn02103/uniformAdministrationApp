"use client";

import { Table } from "@/components/Tables/Table";
import { TableColumns } from "@/components/Tables/TableTypes";
import { useScopedI18n } from "@/lib/locales/client";
import { ResignationProcess } from "@/types/resignationProcessTypes";
import { useMemo, useState } from "react";
import ExitProcessOffcanvas from "./ExitProcessOffcanvas";

export default function ActiveExitProcesses({ activeExitProcesses }: { activeExitProcesses: ResignationProcess[] }) {
    const t = useScopedI18n("memberExit.managementOverview");
    const tCommon = useScopedI18n("common");
    const [openProcessId, setOpenProcessId] = useState<string | null>(null);
    const openProcess = useMemo(() =>
        activeExitProcesses.find(process => process.id === openProcessId),
        [openProcessId, activeExitProcesses]
    );

    const tableColumns: TableColumns<typeof activeExitProcesses[0]>[] = useMemo(() => [
        {
            key: "resignationProcess.createdAt",
            label: t('tableheaders.startDate'),
            dataType: "datetime"
        },
        {
            key: "firstname",
            label: t('tableheaders.cadet'),
            render: (_, { firstname, lastname }) => `${firstname} ${lastname}`
        },
        {
            key: "resignationProcess.checklistItems",
            label: t('tableheaders.todos'),
            visibleBreakpoint: "sm",
            render: (checklistItems) => ` ${checklistItems?.filter(item => item.completedAt).length} / ${checklistItems?.length}`
        },
        {
            key: "uniformIssued",
            label: t('tableheaders.uniformAndMaterialReturned'),
            visibleBreakpoint: "lg",
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
        <>
            <h2>{t('headerActive')}</h2>
            <Table<typeof activeExitProcesses[0]>
                data={activeExitProcesses}
                columns={tableColumns}
                rowActions={[
                    { actionKey: "open", onClick: (row) => setOpenProcessId(row.id), label: tCommon('actions.open') },
                ]}
                getRowId={(row) => row.id}
            />
            {openProcess && (
                <ExitProcessOffcanvas member={openProcess} onClose={() => setOpenProcessId(null)} />
            )}
        </>
    );
}
