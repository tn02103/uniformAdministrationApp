"use client";
import { Table } from "@/components/Tables/Table";
import { TableColumns, TableRowActions } from "@/components/Tables/TableTypes";
import { useScopedI18n } from "@/lib/locales/client";
import { CadetWithNonNullResignationProcess, CadetWithResignationProcess } from "@/types/resignationProcessTypes";
import { useCallback, useMemo, useState } from "react";
import ResignationProcessOffcanvas from "./ResignationProcessOffcanvas";

export default function FinishedResignations({ finishedExitProcesses }: { finishedExitProcesses: CadetWithResignationProcess[] }) {
    const t = useScopedI18n("resignation.managementOverview");
    const tCommon = useScopedI18n("common");

    const [openProcessMemberId, setOpenProcessMemberId] = useState<string | null>(null);
    const openProcess = useMemo(() =>
        finishedExitProcesses.find(member =>
            member.id === openProcessMemberId
            && member.resignationProcess !== null
        ) as null | CadetWithNonNullResignationProcess,
        [openProcessMemberId, finishedExitProcesses]
    );

    const deleteMember = useCallback((memberId: string) => {
        // TODO delete member 
        // eslint-disable-next-line no-console
        console.log("Delete", memberId);
    }, []);

    const tableColumns: TableColumns<CadetWithResignationProcess>[] = useMemo(() => [
        {
            key: "fullname",
            label: t('tableheaders.cadet')
        },
        {
            key: "resignedAt",
            label: t('tableheaders.exitDate'),
            dataType: "datetime"
        },
        {
            key: "resignationProcess",
            label: t('tableheaders.hasProcess'),
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
            render: (itemStatuses) => {
                if (!itemStatuses) return "";
                return ` ${itemStatuses?.filter(item => item.completedAt).length} / ${itemStatuses?.length}`;
            }
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
    ], [t, tCommon]);

    const tableRowActions: TableRowActions<CadetWithResignationProcess> = useMemo(() => [
        { actionKey: "delete", onClick: (row) => deleteMember(row.id), label: tCommon('actions.delete') },
        { actionKey: "open", onClick: (row) => setOpenProcessMemberId(row.id), label: tCommon('actions.open') },
    ], [deleteMember, setOpenProcessMemberId, tCommon]);

    return (
        <div>
            <h2>{t('headerFinished')}</h2>
            <Table<CadetWithResignationProcess>
                data={finishedExitProcesses}
                columns={tableColumns}
                rowActions={tableRowActions}
                mobileActionBreakpoint="lg"
                getRowId={(row) => row.id}
            />
            {openProcess && (
                <ResignationProcessOffcanvas member={openProcess} onClose={() => setOpenProcessMemberId(null)} editable={false} />
            )}
        </div>
    );
}
