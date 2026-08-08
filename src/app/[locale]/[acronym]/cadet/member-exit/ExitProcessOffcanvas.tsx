import { ActionButton } from "@/components/Buttons/ActionButton";
import { toast } from "react-toastify";
import { returnUniformItem } from "@/dal/uniform/item/_index";
import dayjs from "@/lib/dayjs";
import { memberExitProcess } from "@/types/returnProcessTypes";
import { faCircleCheck, faCircleXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRouter } from "next/navigation";
import { Button, Offcanvas } from "react-bootstrap";
import { returnMaterial } from "@/actions/controllers/CadetMaterialController";
import { completeReturnChecklistItem, completeReturnProcess } from "@/dal/cadet/memberExits/process";
import { useCallback } from "react";
import { useScopedI18n } from "@/lib/locales/client";


export default function ExitProcessOffcanvas({
    process,
    onClose,
}: {
    process: memberExitProcess;
    onClose?: () => void;
}) {
    const t = useScopedI18n("memberExit.managementOverview.offcanvas");
    const tCommon = useScopedI18n("common");

    const router = useRouter();

    const todoCount = process.itemStatuses.length;
    const completedCount = process.itemStatuses.filter(item => item.completedAt).length;
    const todoStatus = completedCount === todoCount;
    const uniformStatus = process.cadet.uniformIssued.length === 0;
    const materialStatus = process.cadet.materialIssued.length === 0;
    const allCompleted = todoStatus && uniformStatus && materialStatus;


    const handleTaskToggle = useCallback((itemId: string, completed: boolean) => {
        completeReturnChecklistItem({
            returnProcessId: process.id,
            checklistItemId: itemId,
            completed
        }).then(() => {
            router.refresh();
        }).catch(() => {
            toast.error(t('errors.toggleTask'));
        });
    }, [process.id, router]);

    const handleWithdrawUniform = useCallback((uniformId: string) => {
        returnUniformItem({ uniformId, cadetId: process.cadet.id }).then(() => {
            router.refresh();
        }).catch(() => {
            toast.error(t('errors.withdrawUniform'));
        })
    }, [process.cadet.id, router]);

    const handleWithdrawMaterial = useCallback((materialId: string) => {
        returnMaterial(process.cadet.id, materialId).then(() => {
            router.refresh();
        }).catch(() => {
            toast.error(t('errors.withdrawMaterial'));
        })
    }, [process.cadet.id, router]);

    const handleCompleteProcess = useCallback(() => {
        completeReturnProcess({ returnProcessId: process.id }).then(() => {
            router.refresh();
        }).catch(() => {
            toast.error(t('errors.completeProcess'));
        });
    }, [process.id, router]);

    return (
        <Offcanvas show onHide={onClose} placement="end" style={{ width: "500px" }} backdrop={true}>
            <Offcanvas.Header closeButton>
                <Offcanvas.Title>{t('header', { cadet: `${process.cadet.lastname} ${process.cadet.firstname}` })}</Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
                <h2 className="fs-4 text-center">{t('processDetails.header')}</h2>
                <table>
                    <tbody>
                        <tr>
                            <th className="text-end pe-2">{t('processDetails.status')}</th>
                            <td>{process.finished ? t('processDetails.completed') : t('processDetails.inProgress')}</td>
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
                            <td>{process.template.name}</td>
                        </tr>
                        <tr>
                            <th className="text-end pe-2" >{t('processDetails.startedAt')}</th>
                            <td>{dayjs(process.createdAt).format("DD.MM.YYYY HH:mm")}</td>
                        </tr>
                        <tr>
                            <th className="text-end pe-2">{t('processDetails.lastUpdatedAt')}</th>
                            <td>{dayjs(process.updatedAt).format("DD.MM.YYYY HH:mm")}</td>
                        </tr>
                        <tr>
                            <th className="text-end pe-2">{t('processDetails.comment')}</th>
                            <td>{process.inspectorComment || "--"}</td>
                        </tr>
                    </tbody>
                </table>

                <div className="d-flex justify-content-center mt-3">
                    <Button
                        size="sm"
                        onClick={handleCompleteProcess}
                        variant={allCompleted ? "success" : (!uniformStatus || !materialStatus ? "warning" : "primary")}
                    >
                        {t('completeProcess')}
                    </Button>
                </div>
                <h2 className="fs-4 mt-5 text-center">{t('todos.header')}</h2>
                <div>
                    {process.itemStatuses.map(item => (
                        <div className="d-flex align-items-center my-1" key={item.checklistItem.id}>
                            <button
                                className="border-0 bg-transparent"
                                title={item.completedAt ? dayjs(item.completedAt).format("DD.MM.YYYY HH:mm") : ""}
                                onClick={() => handleTaskToggle(item.checklistItem.id, !item.completedAt)}
                            >
                                <FontAwesomeIcon
                                    className={item.completedAt ? "text-success" : "text-danger" + " border-0"}
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
                    {process.cadet.uniformIssued.length > 0 ? (
                        <ul className="p-0">
                            {process.cadet.uniformIssued.map(({ uniform }) => (
                                <li key={uniform.id} className="d-flex align-items-start m-1 fs-6">
                                    <ActionButton variantKey="withdraw" buttonClass="bg-transparent text-danger" onClick={() => handleWithdrawUniform(uniform.id)} />
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
                    {process.cadet.materialIssued.length > 0 ? (
                        <ul className="p-0">
                            {process.cadet.materialIssued.map(({ material }) => (
                                <li key={material.id} className="d-flex align-items-start m-1 fs-6">
                                    <button className="border-0 bg-transparent" onClick={() => handleWithdrawMaterial(material.id)}>
                                        <ActionButton variantKey="withdraw" buttonClass="bg-transparent text-danger" />
                                    </button>
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