"use client"

import { useGlobalData } from "@/components/globalDataProvider";
import { useModal } from "@/components/modals/modalProvider";
import { Uniform, UniformFormData, UniformSizeList, UniformType } from "@/types/globalUniformTypes";
import { format } from "date-fns";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Col, Form, FormSelect, FormText, Pagination, Row } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import UniformRow from "../../cadet/[cadetId]/_uniformTable/uniformRow";
import { getUniformSizeList } from "@/lib/uniformHelper";
import { deleteUniformItem, getUniformFormValues, saveUniformItem } from "@/actions/uniform/item";
import { AuthRole } from "@/lib/AuthRoles";
import useSWR, { mutate } from "swr";

export type IssuedEntryType = {
    dateIssued: Date;
    dateReturned: Date | null;
    cadetDeleted: boolean;
    firstname: string;
    lastname: string;
    cadetId: string;
}


export default function UniformDetailUIBorder({
    uniform: initialData,
    uniformHistory,
    uniformType,
}: {
    uniform: UniformFormData;
    uniformHistory: IssuedEntryType[];
    uniformType: UniformType;
}) {
    const { register, watch, setValue, getValues, reset, handleSubmit } = useForm<UniformFormData>({ defaultValues: initialData });
    const modal = useModal();
    const router = useRouter();

    const { sizeLists, userRole } = useGlobalData();
    const { uniformId }: { uniformId: string } = useParams();
    const { data: uniform } = useSWR(
        `uniform.${uniformId}.formValues`,
        () => getUniformFormValues(uniformId),
        { fallbackData: initialData }
    );

    const [activeTab, setActiveTab] = useState(0);
    const [editable, setEditable] = useState(false);
    const [sizeList, setSizeList] = useState<UniformSizeList>();

    async function handleDelete() {
        modal?.simpleWarningModal({
            header: `${uniformType.name} ${uniform.number} löschen`,
            message: `Soll das Uniformteil ${uniformType.name} ${uniform.number} wirklich gelöscht werden?
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
        const filterKey = (key: any) => {
            if (typeof key !== "string") return false;
            if (key.startsWith(`uniform.${uniformId}`)) return true;
            if (uniformHistory.find(h => h.dateReturned === null)) {
                return key.startsWith(`cadet.${uniformHistory.find(h => h.dateReturned === null)?.cadetId}.uniform`);
            }
        }
        setEditable(false);
        mutate(
            `uniform.${uniformId}.formValues`,
            saveUniformItem(data),
            {
                optimisticData: data
            }
        ).then(() => {
            if (uniformHistory.find(h => h.dateReturned === null)) {
                mutate(`cadet.${uniformHistory.find(h => h.dateReturned === null)?.cadetId}.uniform`);
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

    return (
        <>
            <Row className="row pt-2 pb-2">
                <h1 data-testid={"div_pageHeader"} className="text-center">{uniformType.name}: {uniform.number}</h1>
            </Row>
            {(userRole >= AuthRole.materialManager) &&
                <Pagination className="justify-content-center bg-secondary-subtle p-2">
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
                    <Form onSubmit={handleSubmit(handleSave)}>
                        <Row className="pb-3">
                            <Label>Typ:</Label>
                            <Col xs={8}>{uniformType.name}</Col>
                            <Label>Nummer:</Label>
                            <Col xs={8}>{uniform.number}</Col>
                            <Label>Status</Label>
                            <Col xs={8}>
                                {editable
                                    ? <Form.Check type="switch" {...register('active')} label={watch('active') ? "Aktiv" : "Passiv"} />
                                    : uniform.active ? "Aktiv" : "Passiv"}
                            </Col>
                            <Label>Generation:</Label>
                            <Col xs={8}>
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
                            <Col xs={8}>
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
                            <Col xs={8}>
                                <Form.Control disabled={!editable} plaintext={!editable} as={"textarea"} {...register('comment')} />
                            </Col>
                        </Row>
                        {editable &&
                            <Row className="m-0 p-0 justify-content-around pb-4">
                                <Button type="reset" className="col-auto" variant="outline-secondary" onClick={() => { setEditable(false); reset(uniform); }}>
                                    Abbrechen
                                </Button>
                                <Button type="submit" className="col-auto" variant="outline-primary">
                                    Speichern
                                </Button>
                            </Row>
                        }
                    </Form>
                    {(!editable) && (userRole >= AuthRole.inspector) &&
                        <Row className="m-0 p-0 justify-content-around pb-4">
                            {(userRole >= AuthRole.materialManager) &&
                                <Button type="button" className="col-auto" variant="outline-danger" onClick={handleDelete}>
                                    Löschen
                                </Button>
                            }
                            <Button type="button" className="col-auto" variant="outline-primary" onClick={() => setEditable(true)}>
                                Bearbeiten
                            </Button>
                        </Row>
                    }
                </>
            }
            {(activeTab === 1) && (userRole >= AuthRole.materialManager) && (
                <div className="m-0 p-4">
                    <Row className="bg-light p-2">
                        <Col xs={4} className="fw-bold text-truncate">Ausgabedatum:</Col>
                        <Col xs={4} className="fw-bold text-truncate">Rückgabedatum:</Col>
                        <Col xs={4} className="fw-bold text-truncate">Besitzer:</Col>
                    </Row>
                    {uniformHistory.map((issueEntry, index) => (
                        <Row key={index}>
                            <Col>{format(issueEntry.dateIssued, "dd.MM.yyyy")}</Col>
                            <Col>{issueEntry.dateReturned ? format(issueEntry.dateReturned, "dd.MM.yyyy") : ""}</Col>
                            <Col className={issueEntry.cadetDeleted ? "text-decoration-line-through text-danger" : ""} title="gelöschte Person">{issueEntry.firstname} {issueEntry.lastname}</Col>
                        </Row>
                    ))}
                </div>
            )}
        </>
    )
}

const Label = ({ children }: any) => (
    <Col xs={4} className="text-end fw-bold">
        {children}
    </Col>
)