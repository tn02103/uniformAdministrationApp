import { getActiveResignationProcessList, getResignedMemberlist } from "@/dal/cadet/resignation/process";
import { getScopedI18n } from "@/lib/locales/config";
import ActiveExitProcesses from "./ActiveExitProcesses";
import FinishedExitProcesses from "./FinishedExitProcesses";

export default async function MemberExitsPage() {
    const t = await getScopedI18n("memberExit.managementOverview");
    const activeExitProcesses = await getActiveResignationProcessList();


    const exitedMembers = await getResignedMemberlist();
    return (
        <div className="container-lg content-center bg-light rounded px-md-3 px-xl-5 p-0">
            <div className="row pt-2 pb-2 m-0">
                <h1 data-testid="div_cadetListHeader" className="text-center">{t('header')}</h1>

            </div>
            <ActiveExitProcesses activeExitProcesses={activeExitProcesses} />
            <FinishedExitProcesses finishedExitProcesses={exitedMembers} />
            {false &&<div style={{height: "200px"}}></div>}
        </div>
    );
}
