import { ActionButton } from "@/components/Buttons/ActionButton";
import { toast } from "react-toastify";
import { returnUniformItem } from "@/dal/uniform/item";
import dayjs from "@/lib/dayjs";
import { ResignationProcess as memberWithExitProcess } from "@/types/resignationProcessTypes";
import { faCircleCheck, faCircleXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRouter } from "next/navigation";
import { Button, Offcanvas } from "react-bootstrap";
import { returnMaterial } from "@/actions/controllers/CadetMaterialController";
import { completeResignationChecklistItem, completeResignationProcess } from "@/dal/cadet/resignation/process";
import { useCallback } from "react";
import { useScopedI18n } from "@/lib/locales/client";


export default function ExitProcessOffcanvas({
    member,
    onClose,
    editable = true,
}: {
    member: memberWithExitProcess;
    onClose: () => void;
    editable?: boolean;
}) {
    if (!member.resignationProcess || member.resignationProcess === null) {
        return null;
    }
    const t = useScopedI18n("memberExit.managementOverview.offcanvas");
    const tCommon = useScopedI18n("common");

    const router = useRouter();

    const todoCount = member.resignationProcess.checklistItems.length;
    const completedCount = member.resignationProcess.checklistItems.filter(item => item.completedAt).length;
    const todoStatus = completedCount === todoCount;
    const uniformStatus = member.uniformIssued.length === 0;
    const materialStatus = member.materialIssued.length === 0;
    const allCompleted = todoStatus && uniformStatus && materialStatus;


    const handleTaskToggle = useCallback((itemId: string, completed: boolean) => {
        completeResignationChecklistItem({
            resignationProcessId: member.resignationProcess!.id,
            checklistItemId: itemId,
            completed
        }).then(() => {
            router.refresh();
        }).catch(() => {
            toast.error(t('errors.toggleTask'));
        });
    }, [member.resignationProcess!.id, router]);

    const handleWithdrawUniform = useCallback((uniformId: string) => {
        returnUniformItem({ uniformId, cadetId: member.id }).then(() => {
            router.refresh();
        }).catch(() => {
            toast.error(t('errors.withdrawUniform'));
        })
    }, [member.id, router]);

    const handleWithdrawMaterial = useCallback((materialId: string) => {
        returnMaterial(member.id, materialId).then(() => {
            router.refresh();
        }).catch(() => {
            toast.error(t('errors.withdrawMaterial'));
        })
    }, [member.id, router]);

    const handleCompleteProcess = useCallback(() => {
        completeResignationProcess({ resignationProcessId: member.resignationProcess!.id }).then(() => {
            onClose();
            router.refresh();
        }).catch(() => {
            toast.error(t('errors.completeProcess'));
        });
    }, [member.resignationProcess!.id, router]);

    return (
        <Offcanvas show onHide={onClose} placement="end" style={{ width: "500px" }} backdrop={true}>
            <Offcanvas.Header closeButton>
                <Offcanvas.Title>{t('header', { cadet: `${member.lastname} ${member.firstname}` })}</Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
                <h2 className="fs-4 text-center">{t('processDetails.header')}</h2>
                <table>
                    <tbody>
                        <tr>
                            <th className="text-end pe-2">{t('processDetails.status')}</th>
                            <td>{member.resignationProcess.finished ? t('processDetails.completed') : t('processDetails.inProgress')}</td>
                        </tr>
                        <tr>
                            <th className="text-end pe-2">{t('processDetails.todos')}</th>
                            <td>
                                <FontAwesomeIcon icon={todoStatus ? faCircleCheck : faCircleXmark} className={todoStatus ? "text-success" : "text-danger"} />
                                {completedCount} / {todoCount}
                            </td>
                        </tr>
                        <tr>
                            <th className="text-end pe-2">{t('processDetails.uniformReturned')}</th>
                            <td>
                                <FontAwesomeIcon icon={uniformStatus ? faCircleCheck : faCircleXmark} className={uniformStatus ? "text-success" : "text-danger"} />
                                {uniformStatus ? tCommon('yes') : tCommon('no')}
                            </td>
                        </tr>
                        <tr>
                            <th className="text-end pe-2">{t('processDetails.materialReturned')}</th>
                            <td>
                                <FontAwesomeIcon icon={materialStatus ? faCircleCheck : faCircleXmark} className={materialStatus ? "text-success" : "text-danger"} />
                                {materialStatus ? tCommon('yes') : tCommon('no')}
                            </td>
                        </tr>
                        <tr>
                            <th className="text-end pe-2">{t('processDetails.template')}</th>
                            <td>{member.resignationProcess.template.name}</td>
                        </tr>
                        <tr>
                            <th className="text-end pe-2" >{t('processDetails.startedAt')}</th>
                            <td>{dayjs(member.resignationProcess.createdAt).format("DD.MM.YYYY HH:mm")}</td>
                        </tr>
                        <tr>
                            <th className="text-end pe-2">{t('processDetails.lastUpdatedAt')}</th>
                            <td>{dayjs(member.resignationProcess.updatedAt).format("DD.MM.YYYY HH:mm")}</td>
                        </tr>
                        <tr>
                            <th className="text-end pe-2">{t('processDetails.comment')}</th>
                            <td>{member.resignationProcess.inspectorComment || "--"}</td>
                        </tr>
                    </tbody>
                </table>
                {editable && (
                    <div className="d-flex justify-content-center mt-3">
                        <Button
                            size="sm"
                            onClick={handleCompleteProcess}
                            variant={allCompleted ? "success" : (!uniformStatus || !materialStatus ? "warning" : "primary")}
                        >
                            {t('completeProcess')}
                        </Button>
                    </div>
                )}
                <h2 className="fs-4 mt-5 text-center">{t('todos.header')}</h2>
                <div>
                    {member.resignationProcess.checklistItems.map(item => (
                        <div className="d-flex align-items-center my-1" key={item.checklistItem.id}>
                            <button
                                className="border-0 bg-transparent"
                                title={item.completedAt ? dayjs(item.completedAt).format("DD.MM.YYYY HH:mm") : ""}
                                disabled={!editable}
                                onClick={() => handleTaskToggle(item.checklistItem.id, !item.completedAt)}
                            >
                                <FontAwesomeIcon
                                    className={(item.completedAt ? "text-success" : "text-danger") + " border-0" + (!editable ? " opacity-75" : "")}
                                    icon={item.completedAt ? faCircleCheck : faCircleXmark}
                                />
                            </button>
                            <span className="text-end pe-2">{item.checklistItem.label}</span>
                        </div>
                    ))}
                </div>

                <h2 className="fs-4 mt-5 text-center">{t('missingReturns.header')}</h2>
                <h3 className="fs-6 fw-bold mt-2">{t('missingReturns.uniform')}</h3>
                <div>
                    {member.uniformIssued.length > 0 ? (
                        <ul className="p-0">
                            {member.uniformIssued.map(({ uniform }) => (
                                <li key={uniform.id} className="d-flex align-items-start m-1 fs-6">
                                    {editable && (
                                        <ActionButton
                                            variantKey="withdraw"
                                            buttonClass="bg-transparent text-danger"
                                            onClick={() => handleWithdrawUniform(uniform.id)}
                                        />
                                    )}
                                    {uniform.type.name}-{uniform.number}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>{t('missingReturns.uniformComplete')}</p>
                    )}
                </div>
                <h3 className="fs-6 fw-bold mt-2">{t('missingReturns.material')}</h3>
                <div>
                    {member.materialIssued.length > 0 ? (
                        <ul className="p-0">
                            {member.materialIssued.map(({ material }) => (
                                <li key={material.id} className="d-flex align-items-start m-1 fs-6">
                                    {editable && (
                                        <ActionButton
                                            variantKey="withdraw"
                                            onClick={() => handleWithdrawMaterial(material.id)}
                                            buttonClass="bg-transparent text-danger"
                                        />
                                    )}
                                    {material.materialGroup.description} - {material.typename}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>{t('missingReturns.materialComplete')}</p>
                    )}
                </div>
            </Offcanvas.Body>
        </Offcanvas>
    )
}