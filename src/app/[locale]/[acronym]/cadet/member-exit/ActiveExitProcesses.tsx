"use client";

import { memberExitProcess } from "@/types/returnProcessTypes";
import { Table } from "@/components/Tables/Table";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import ExitProcessOffcanvas from "./ExitProcessOffcanvas";

export default function ActiveExitProcesses({ memberInExitProcess }: { memberInExitProcess: memberExitProcess[] }) {
    const [openProcessId, setOpenProcessId] = useState<string | null>(null);
    const openProcess = useMemo(() =>
        memberInExitProcess.find(process => process.id === openProcessId),
        [openProcessId, memberInExitProcess]
    );

    return (
        <>
            <h2>Aktive Austrittsprozesse</h2>
            <Table<typeof memberInExitProcess[0]>
                data={memberInExitProcess}
                columns={[
                    { key: "createdAt", label: "Startdatum", render: (date?: Date) => date ? dayjs(date).format("DD.MM.YYYY HH:mm") : "" },
                    { key: "cadet", label: "Name", render: ({ firstname, lastname }) => `${firstname} ${lastname}` },
                    { key: "itemStatuses", label: "Todos", render: (itemStatuses) => ` ${itemStatuses?.filter(item => item.completedAt).length} / ${itemStatuses?.length}` },
                    {
                        key: "cadet.uniformIssued",
                        label: "Unif./ Mat. abgegeben",
                        render: (_, { cadet: { uniformIssued, materialIssued } }) => `
                        ${uniformIssued.length > 0 ? "Nein" : "Ja"} / ${materialIssued.length > 0 ? "Nein" : "Ja"}
                     `,
                    },
                    { key: "template.name", label: "Prozess" },
                ]}
                rowActions={[
                    { actionKey: "open", onClick: (row) => setOpenProcessId(row.id), label: "Details" },
                    // {actionKey: "markComplete", onClick: (row) => console.log("mark complete", row), label: "Als abgeschlossen markieren"},
                ]}
            />
            {openProcess && (
                <ExitProcessOffcanvas process={openProcess} onClose={() => setOpenProcessId(null)} />
            )}
        </>
    );
}
