import { TooltipActionButton } from "@/components/Buttons/TooltipIconButton";
import dayjs from "@/lib/dayjs";
import { prisma } from "@/lib/db";
import { Table as BootstrapTable } from "react-bootstrap";
import type { Get, Paths } from "type-fest";
import { Table} from "@/components/Tables/Table";
import { memberExitProcessArgs } from "@/types/returnProcessTypes";
import { getActiveReturnProcessList } from "@/dal/cadet/memberExits/process/get";
import ActiveExitProcesses from "./ActiveExitProcesses";


export default async function MemberExitsPage() {

    const memberInExitProcess = await getActiveReturnProcessList();


    const cadets = await prisma.cadet.findMany({
        where: {
            status: "RETURNED",
        },
        orderBy: [
            { returnStartedAt: "desc" },
        ],
        include: {
            returnProcess: {
                include: {
                    itemStatuses: true,
                    template: true,
                },
            },
            uniformIssued: {
                where: {
                    dateReturned: null
                },
            },
            materialIssued: {
                where: {
                    dateReturned: null
                },
            },
        },
    });

    return (
        <div className="container-lg content-center bg-light rounded px-md-3 px-xl-5 p-0">
            <div className="row pt-2 pb-2 m-0">
                <h1 data-testid="div_cadetListHeader" className="text-center">Austritte</h1>

            </div>
            <ActiveExitProcesses memberInExitProcess={memberInExitProcess} />

            <h2>Ausgetretene Mitglieder</h2>
            <BootstrapTable striped bordered hover responsive className="mt-3">
                <thead>
                    <tr>
                        <th>Vorname</th>
                        <th>Nachname</th>
                        <th>Status</th>
                        <th>Abgabedatum</th>
                        <th>Uniform abgegeben</th>
                        <th>Material abgegeben</th>
                        <th>Abgabe vollständig</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {cadets.map(cadet => (
                        <tr key={cadet.id}>
                            <td>{cadet.firstname}</td>
                            <td>{cadet.lastname}</td>
                            <td>{cadet.status}</td>
                            <td>{cadet.returnStartedAt?.toLocaleDateString()}</td>
                            <td>{cadet.returnProcess?.template?.name}</td>
                            <td>{cadet.uniformIssued.length > 0 ? "Nein" : "Ja"}</td>
                            <td>{cadet.materialIssued.length > 0 ? "Nein" : "Ja"}</td>
                            <td>Details</td>
                        </tr>
                    ))}
                </tbody>
            </BootstrapTable>
        </div>
    );
}
