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


export default function ExitProcessOffcanvas({
    process,
    onClose,
}: {
    process: memberExitProcess;
    onClose?: () => void;
}) {
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
            toast.error("Fehler beim Aktualisieren des ToDos. Bitte versuchen Sie es erneut.");
        });
    }, [process.id, router]);

    const handleWithdrawUniform = useCallback((uniformId: string) => {
        returnUniformItem({ uniformId, cadetId: process.cadet.id }).then(() => {
            router.refresh();
        }).catch(() => {
            toast.error("Fehler beim Zurückgeben des Uniformteils. Bitte versuchen Sie es erneut.");
        })
    }, [process.cadet.id, router]);

    const handleWithdrawMaterial = useCallback((materialId: string) => {
        returnMaterial(process.cadet.id, materialId).then(() => {
            router.refresh();
        }).catch(() => {
            toast.error("Fehler beim Zurückgeben des Materials. Bitte versuchen Sie es erneut.");
        })
    }, [process.cadet.id, router]);

    const handleCompleteProcess = useCallback(() => {
        completeReturnProcess({ returnProcessId: process.id }).then(() => {
            router.refresh();
        }).catch(() => {
            toast.error("Fehler beim Abschließen des Austrittsprozesses. Bitte versuchen Sie es erneut.");
        });
    }, [process.id, router]);

    return (
        <Offcanvas show onHide={onClose} placement="end" style={{ width: "500px" }} backdrop={true}>
            <Offcanvas.Header closeButton>
                <Offcanvas.Title>Austritt: {process.cadet.lastname} {process.cadet.firstname}</Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
                <h2 className="fs-4 text-center">Processdetails</h2>
                <table>
                    <tbody>
                        <tr>
                            <th className="text-end pe-2">Status:</th>
                            <td>{process.finished ? "Abgeschlossen" : "Aktiv"}</td>
                        </tr>
                        <tr>
                            <th className="text-end pe-2">ToDos:</th>
                            <td>
                                <FontAwesomeIcon icon={todoStatus ? faCircleCheck : faCircleXmark} className={todoStatus ? "text-success" : "text-danger"} />
                                {completedCount} / {todoCount}
                            </td>
                        </tr>
                        <tr>
                            <th className="text-end pe-2">Uniform abgegeben:</th>
                            <td>
                                <FontAwesomeIcon icon={uniformStatus ? faCircleCheck : faCircleXmark} className={uniformStatus ? "text-success" : "text-danger"} />
                                {uniformStatus ? "Ja" : "Nein"}
                            </td>
                        </tr>
                        <tr>
                            <th className="text-end pe-2">Material abgegeben:</th>
                            <td>
                                <FontAwesomeIcon icon={materialStatus ? faCircleCheck : faCircleXmark} className={materialStatus ? "text-success" : "text-danger"} />
                                {materialStatus ? "Ja" : "Nein"}
                            </td>
                        </tr>
                        <tr>
                            <th className="text-end pe-2">Template:</th>
                            <td>{process.template.name}</td>
                        </tr>
                        <tr>
                            <th className="text-end pe-2" >Gestartet am:</th>
                            <td>{dayjs(process.createdAt).format("DD.MM.YYYY HH:mm")}</td>
                        </tr>
                        <tr>
                            <th className="text-end pe-2">Zuletzt verändert am:</th>
                            <td>{dayjs(process.updatedAt).format("DD.MM.YYYY HH:mm")}</td>
                        </tr>
                        <tr>
                            <th className="text-end pe-2">Kommentar:</th>
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
                        Prozess abschließen
                    </Button>
                </div>
                <h2 className="fs-4 mt-5 text-center">Todos</h2>
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

                <h2 className="fs-4 mt-5 text-center">Nicht zurückgegeben</h2>
                <h3 className="fs-6 fw-bold mt-2">Uniformteile</h3>
                <div>
                    {process.cadet.uniformIssued.length > 0 ? (
                        <ul className="p-0">
                            {process.cadet.uniformIssued.map(({ uniform }) => (
                                <li key={uniform.id} className="d-flex align-items-start m-1 fs-6">
                                    <ActionButton variantKey="withdraw" buttonClass="bg-transparent text-danger" onClick={() => handleWithdrawUniform(uniform.id)} title="Uniformteil zurückgeben" />
                                    {uniform.type.name}-{uniform.number}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>Alle Uniformteile zurückgegeben.</p>
                    )}
                </div>
                <h3 className="fs-6 fw-bold mt-2">Material</h3>
                <div>
                    {process.cadet.materialIssued.length > 0 ? (
                        <ul className="p-0">
                            {process.cadet.materialIssued.map(({ material }) => (
                                <li key={material.id} className="d-flex align-items-start m-1 fs-6">
                                    <button className="border-0 bg-transparent" onClick={() => handleWithdrawMaterial(material.id)} title="Material zurückgeben">
                                        <ActionButton variantKey="withdraw" buttonClass="bg-transparent text-danger" />
                                    </button>
                                    {material.materialGroup.description} - {material.typename}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>Alles Material zurückgegeben.</p>
                    )}
                </div>
            </Offcanvas.Body>
        </Offcanvas>
    )
}