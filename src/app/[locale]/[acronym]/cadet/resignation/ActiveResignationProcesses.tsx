"use client";

import { Table } from "@/components/Tables/Table";
import { TableColumns, TableRowActions } from "@/components/Tables/TableTypes";
import { useScopedI18n } from "@/lib/locales/client";
import { CadetWithNonNullResignationProcess } from "@/types/resignationProcessTypes";
import { useMemo, useState } from "react";
import ResignationProcessOffcanvas from "./ResignationProcessOffcanvas";

export default function ActiveResignationProcesses({ membersWithActiveProcess }: { membersWithActiveProcess: CadetWithNonNullResignationProcess[] }) {
    const t = useScopedI18n("resignation.managementOverview");
    const tCommon = useScopedI18n("common");
    const [openProcessId, setOpenProcessId] = useState<string | null>(null);
    const openProcess = useMemo(() =>
        membersWithActiveProcess.find(process => process.id === openProcessId),
        [openProcessId, membersWithActiveProcess]
    );

    const tableColumns: TableColumns<typeof membersWithActiveProcess[0]>[] = useMemo(() => [
        {
            key: "resignationProcess.createdAt",
            label: t('tableheaders.startDate'),
            dataType: "datetime"
        },
        {
            key: "fullname",
            label: t('tableheaders.cadet'),
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
    ], [t, tCommon]);

    const rowActions: TableRowActions<CadetWithNonNullResignationProcess> = useMemo(() => [
        { actionKey: "open", onClick: (row) => setOpenProcessId(row.id), label: tCommon('actions.open') },
    ], [setOpenProcessId, tCommon]);

    return (
        <>
            <h2>{t('headerActive')}</h2>
            <Table<typeof membersWithActiveProcess[0]>
                data={membersWithActiveProcess}
                columns={tableColumns}
                rowActions={rowActions}
                getRowId={(row) => row.id}
            />
            {openProcess && (
                <ResignationProcessOffcanvas member={openProcess} onClose={() => setOpenProcessId(null)} />
            )}
        </>
    );
}
