"use client";

import { memberExitProcess } from "@/types/returnProcessTypes";
import { Table, TableColumns } from "@/components/Tables/Table";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import ExitProcessOffcanvas from "./ExitProcessOffcanvas";
import { useScopedI18n } from "@/lib/locales/client";

export default function ActiveExitProcesses({ memberInExitProcess }: { memberInExitProcess: memberExitProcess[] }) {
    const t = useScopedI18n("memberExit.managementOverview.active");
    const tCommon = useScopedI18n("common");
    const [openProcessId, setOpenProcessId] = useState<string | null>(null);
    const openProcess = useMemo(() =>
        memberInExitProcess.find(process => process.id === openProcessId),
        [openProcessId, memberInExitProcess]
    );

    const tableColumnt: TableColumns<typeof memberInExitProcess[0]>[] = useMemo(() => [
        { key: "createdAt", label: t('tableheaders.startDate'), render: (date?: Date) => date ? dayjs(date).format("DD.MM.YYYY HH:mm") : "" },
        { key: "cadet", label: t('tableheaders.cadet'), render: ({ firstname, lastname }) => `${firstname} ${lastname}` },
        { key: "itemStatuses", label: t('tableheaders.todos'), render: (itemStatuses) => ` ${itemStatuses?.filter(item => item.completedAt).length} / ${itemStatuses?.length}` },
        {
            key: "cadet.uniformIssued",
            label: t('tableheaders.uniformAndMaterialReturned'),
            render: (_, { cadet: { uniformIssued, materialIssued } }) => `
                        ${uniformIssued.length > 0 ? tCommon('no') : tCommon('yes')} / ${materialIssued.length > 0 ? tCommon('no') : tCommon('yes')}
                     `,
        },
        { key: "template.name", label: t('tableheaders.template') },
    ], []);

    return (
        <>
            <h2>{t('header')}</h2>
            <Table<typeof memberInExitProcess[0]>
                data={memberInExitProcess}
                columns={tableColumnt}
                rowActions={[
                    { actionKey: "open", onClick: (row) => setOpenProcessId(row.id), label: "Details" },
                ]}
            />
            {openProcess && (
                <ExitProcessOffcanvas process={openProcess} onClose={() => setOpenProcessId(null)} />
            )}
        </>
    );
}
