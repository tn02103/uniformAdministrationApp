"use client";
import { deleteUniformItem, getUniformFormValues, getUniformIssueHistory, saveUniformItem } from "@/actions/uniform/item";
import { useGlobalData } from "@/components/globalDataProvider";
import { AuthRole } from "@/lib/AuthRoles";
import { getUniformSizeList } from "@/lib/uniformHelper";
import { UniformFormData, UniformSizeList, UniformType } from "@/types/globalUniformTypes";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Col, Form, FormSelect, Modal, Pagination, Row } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import useSWR, { mutate } from "swr";
import { useModal } from "../modalProvider";
import TooltipIconButton from "@/components/TooltipIconButton";
import { faTrash } from "@fortawesome/free-solid-svg-icons";

export type UIDModalProps = {
    uniformId: string;
    uniformType: UniformType;
    ownerId: string | null;
    onClose: () => void;
}
export default function UniformItemDetailModal({ uniformId, uniformType, ownerId, onClose }: UIDModalProps) {
    const { register, watch, setValue, getValues, reset, handleSubmit } = useForm<UniformFormData>();
    const modal = useModal();
    const router = useRouter();

    const { sizeLists, userRole } = useGlobalData();
    const { data: uniform } = useSWR(
        `uniform.${uniformId}.formValues`,
        () => getUniformFormValues(uniformId)
    );
    const { data: uniformHistory } = useSWR(
        `uniform.${uniformId}.history`,
        () => getUniformIssueHistory(uniformId)
    )

    const [activeTab, setActiveTab] = useState(0);
    const [editable, setEditable] = useState(false);
    const [sizeList, setSizeList] = useState<UniformSizeList>();

    async function handleDelete() {
        modal?.simpleWarningModal({
            header: `${uniformType.name} ${uniform?.number} löschen`,
            message: `Soll das Uniformteil ${uniformType.name} ${uniform?.number} wirklich gelöscht werden?
             Diese Aktion kann nicht wieder umgekehrt werden`,
            primaryOption: 'löschen',
            type: 'danger',
            primaryFunction: () => {
                deleteUniformItem(uniformId).then(() => {
                    router.back();
                }).catch(() => toast.error('Das Uniformteil konnte nicht gelöscht werden.'));
            },
        });
    }
    async function handleSave(data: UniformFormData) {
        setEditable(false);
        mutate(
            `uniform.${uniformId}.formValues`,
            saveUniformItem(data),
            {
                optimisticData: data
            }
        ).then(() => {
            if (ownerId) {
                mutate(`cadet.${ownerId}.uniform`);
            }
        }).catch((e) => {
            console.error(e);
            reset(uniform);
            toast.error('Das Speichern des Uniformteils ist fehlgeschlagen');
        });
    }

    useEffect(() => {
        const generationId = watch("generation");
        if (generationId) {
            generationChanged(generationId);
        }
    }, [watch("generation")]);

    const generationChanged = async (generationId: string) => {
        const newSizeList = getUniformSizeList({
            generationId,
            type: uniformType,
            sizeLists: sizeLists,
        });

        // no sizeList
        if (!newSizeList) {
            setSizeList(undefined);
            setValue("size", "null", { shouldValidate: true });
            return;
        }
        // same sizeList
        if (sizeList && newSizeList.id === sizeList.id) {
            return;
        }

        // different sizeList
        await setSizeList(newSizeList);
        const oldSize = getValues("size");

        if (newSizeList.uniformSizes.find(s => s.id == oldSize)) {
            setValue("size", oldSize, { shouldValidate: true });
        } else {
            setValue("size", "null", { shouldValidate: true });
        }
        return newSizeList;
    }

    if (!uniform) return (<></>)
    return (
        <Modal data-testid="div_popup" show onHide={onClose}>
            <Modal.Header className="align-center text-center py-2 px-4" data-testid="div_header" closeButton>
                <div className="w-100 fs-3 fw-bold">
                    {uniformType.name}: {uniform.number}
                </div>
            </Modal.Header>
            <Modal.Body className="position-relative m-3 p-0">
                <div className="position-absolute top-0 end-0">
                    <TooltipIconButton
                        icon={faTrash}
                        variant="outline-danger"
                        tooltipText="löschen"
                        testId="btn_delete"
                        onClick={handleDelete}
                    />
                </div>
                {(userRole >= AuthRole.materialManager) &&
                    <Pagination className="justify-content-center">
                        <Pagination.Item className="bg-secondary-subtle" active={activeTab === 0} onClick={() => setActiveTab(0)} disabled={editable}>
                            Details
                        </Pagination.Item>
                        <Pagination.Item className="" active={activeTab === 1} onClick={() => setActiveTab(1)} disabled={editable}>
                            Verlauf
                        </Pagination.Item>
                    </Pagination >
                }
                {(activeTab === 0) &&
                    <>
                        <Form onSubmit={handleSubmit(handleSave)} id="uniform-detail">
                            <Row className="pb-3">
                                <Label>Typ:</Label>
                                <Col xs={6}>{uniformType.name}</Col>
                                <Label>Nummer:</Label>
                                <Col xs={6}>{uniform?.number}</Col>
                                <Label>Status</Label>
                                <Col xs={6}>
                                    {editable
                                        ? <Form.Check type="switch" {...register('active')} label={watch('active') ? "Aktiv" : "Passiv"} />
                                        : uniform.active ? "Aktiv" : "Passiv"}
                                </Col>
                                <Label>Generation:</Label>
                                <Col xs={6}>
                                    {editable
                                        ? <FormSelect
                                            disabled={!editable}
                                            {...register('generation')}
                                        >
                                            <option>K.A.</option>
                                            {uniformType.uniformGenerationList.map((gen) => (
                                                <option key={gen.id} value={gen.id}>{gen.name}</option>
                                            ))}
                                        </FormSelect>
                                        : uniformType.uniformGenerationList.find(g => g.id === uniform.generation)?.name}
                                </Col>
                                <Label>Größe:</Label>
                                <Col xs={6}>
                                    {editable ?
                                        <FormSelect {...register('size')}>
                                            <option>K.A.</option>
                                            {sizeList?.uniformSizes.map((size) => (
                                                <option key={size.id} value={size.id}>{size.name}</option>
                                            ))}
                                        </FormSelect>
                                        : sizeList?.uniformSizes.find(s => s.id === uniform.size)?.name}
                                </Col>
                                <Label>Kommentar:</Label>
                                <Col xs={6}>
                                    <Form.Control disabled={!editable} plaintext={!editable} as={"textarea"} {...register('comment')} />
                                </Col>
                            </Row>
                        </Form>
                    </>
                }
                {(activeTab === 1) && (userRole >= AuthRole.materialManager) && (
                    <div className="m-0 p-4">
                        <Row className="bg-light p-2">
                            <Col xs={4} className="fw-bold text-truncate">Ausgabe:</Col>
                            <Col xs={4} className="fw-bold text-truncate">Rückgabe:</Col>
                            <Col xs={4} className="fw-bold text-truncate">Person:</Col>
                        </Row>
                        {uniformHistory?.map((issueEntry, index) => (
                            <Row key={index}>
                                <Col>{format(issueEntry.dateIssued, "dd.MM.yyyy")}</Col>
                                <Col>{issueEntry.dateReturned ? format(issueEntry.dateReturned, "dd.MM.yyyy") : ""}</Col>
                                <Col className={issueEntry.cadetDeleted ? "text-decoration-line-through text-danger" : ""} title="gelöschte Person">{issueEntry.firstname} {issueEntry.lastname}</Col>
                            </Row>
                        ))}
                    </div>
                )}
            </Modal.Body>
            <Modal.Footer className="justify-content-between">
                <Col xs="auto">
                    {editable ?
                        <Button type="reset" className="col-auto" variant="outline-secondary" onClick={() => { setEditable(false); reset(uniform); }}>
                            Abbrechen
                        </Button>
                        :
                        <Button type="button" variant="outline-secondary" onClick={onClose}>
                            Schließen
                        </Button>
                    }
                </Col>
                <Col xs="auto">
                    {(activeTab === 0) && editable &&
                        <Button type="submit" className="col-auto" variant="outline-primary" form="uniform-detail" >
                            Speichern
                        </Button>
                    }
                    {(activeTab === 0) && !editable &&
                        <Button type="button" className="col-auto" variant="outline-primary" onClick={() => setEditable(true)}>
                            Bearbeiten
                        </Button>
                    }
                </Col>
            </Modal.Footer>
        </Modal>
    )
}

const Label = ({ children }: any) => (
    <Col xs={4} className="text-end fw-bold">
        {children}
    </Col>
)