import { InputFormField } from "@/components/fields/InputFormField";
import { NumberInputFormField } from "@/components/fields/NumberInputFormField";
import { SelectFormField } from "@/components/fields/SelectFormField";
import { ToggleFormField } from "@/components/fields/ToggleFormField";
import { ReorderableTableBody } from "@/components/reorderDnD/ReorderableTableBody";
import { useUniformSizelists } from "@/dataFetcher/uniformAdmin";
import { UniformGeneration, UniformType } from "@/types/globalUniformTypes";
import { uniformTypeFormSchema, UniformTypeFormType } from "@/zod/uniformConfig";
import { faBars, faPen, faTrash, IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Button, ButtonProps, Col, Dropdown, Offcanvas, Row, Table } from "react-bootstrap";
import { FormProvider, useForm } from "react-hook-form";

type Props = {
    uniformType: UniformType | null;
    setSelectedTypeId: (id: string | null) => void;
}

export const UniformTypeOffcanvas = ({ uniformType, setSelectedTypeId }: Props) => {
    const form = useForm<UniformTypeFormType>({
        mode: "onChange",
        defaultValues: uniformType ?? undefined,
        resolver: zodResolver(uniformTypeFormSchema),
    });

    const [editable, setEditable] = useState(false);
    const { sizelistList } = useUniformSizelists();
    const sizelistOptions = sizelistList?.map(sl => ({ value: sl.id, label: sl.name })) ?? [];


    return (
        <Offcanvas show={true} onHide={() => setSelectedTypeId(null)} placement="end" backdrop={false} style={{ width: "500px" }}>
            <Offcanvas.Header closeButton>
                <Offcanvas.Title>
                    <h2>{uniformType?.name ?? "Neu erstellen"}</h2>
                </Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
                <h3 className="text-center">Details</h3>
                <hr className="my-0" />
                <Row className="mb-4 justify-content-evenly">
                    <TopButton
                        label="Bearbeiten"
                        icon={faPen}
                        variant="outline-secondary"
                        disabled={editable}
                        onClick={() => setEditable(!editable)}
                    />
                    <TopButton
                        label="Löschen"
                        icon={faTrash}
                        variant="outline-danger"
                        disabled={!editable}
                        onClick={() => console.log("delete")}
                    />
                </Row>
                <form noValidate autoComplete="off" onSubmit={form.handleSubmit(console.log)}>
                    <FormProvider {...form}>
                        <Row>
                            <Col xs={6}>
                                <InputFormField<UniformTypeFormType> name="name" label="Name" required plaintext={!editable} disabled={!editable} />
                            </Col>
                            <Col xs={6}>
                                <InputFormField<UniformTypeFormType> name="acronym" label="Kürzel" placeholder="XX" required plaintext={!editable} disabled={!editable} />
                            </Col>
                            <Col xs={6}>
                                <NumberInputFormField<UniformTypeFormType> name="issuedDefault" label="Anz. ausgegeben" plaintext={!editable} disabled={!editable} />
                            </Col>
                            {form.watch("usingSizes") === true && (
                                <Col xs={6}>
                                    <SelectFormField<UniformTypeFormType> name="fk_defaultSizelist" label="Standard Größenliste" options={sizelistOptions} plaintext={!editable} />
                                </Col>
                            )}
                            <Col xs={12}>
                                <ToggleFormField<UniformTypeFormType> name="usingSizes" label="Nutzt Größen" disabled={!editable} />
                            </Col>
                            <Col xs={12}>
                                <ToggleFormField<UniformTypeFormType> name="usingGenerations" label="Nutzt Generationen" disabled={!editable} />
                            </Col>
                        </Row>
                        {editable && (
                            <Row className="justify-content-evenly mt-2 mb-4">
                                <Button className="col-auto" type="submit" variant="outline-primary">Speichern</Button>
                                <Button className="col-auto" variant="outline-secondary" onClick={() => setEditable(false)}>Abbrechen</Button>
                            </Row>
                        )}
                    </FormProvider>
                </form>
                <h3 className="text-center">Generationen</h3>
                <hr className="my-0" />
                <Row className="justify-content-evenly mb-4">

                </Row>
                <Row>
                    <Table>
                        <thead>
                            <tr>
                                <th>Generation</th>
                                <th>Veraltet</th>
                                <th>Größenliste</th>
                            </tr>
                        </thead>
                        <ReorderableTableBody<UniformGeneration> items={uniformType?.uniformGenerationList ?? []} itemType="UNIFORM_GENERATION" onDragEnd={() => console.log("dragend")}>
                            {({ draggableRef, previewRef, isDragging, item }) => (
                                <tr key={item.id} ref={previewRef} style={isDragging ? { opacity: 0 } : undefined}>
                                    <td>
                                        <span ref={draggableRef} className="p-2">
                                            <FontAwesomeIcon
                                                icon={faBars}
                                                className="text-seccondary"
                                            />
                                        </span>
                                    </td>
                                    <td>{item.name}</td>
                                    <td>{item.outdated ? "Ja" : "Nein"}</td>
                                    <td>{item.sizelist?.name}</td>
                                    <td>
                                        <Dropdown drop="start" className="float-end">
                                            <Dropdown.Toggle
                                                variant="outline-primary"
                                                className="border-0"
                                                id={item.id + "-Editdropdown"}
                                                data-testid="btn_menu"
                                            >
                                                <FontAwesomeIcon icon={faBars} size="sm" />
                                            </Dropdown.Toggle>
                                            <Dropdown.Menu>
                                                <Dropdown.Item
                                                    onClick={() => {
                                                        setEditable(true);
                                                    }}
                                                    data-testid="btn_menu_edit"
                                                >
                                                    Bearbeiten
                                                </Dropdown.Item>
                                                <Dropdown.Item data-testid="btn_menu_password" onClick={() => console.log("change password")}>
                                                    Löschen
                                                </Dropdown.Item>
                                                <Dropdown.Item data-testid="btn_menu_delete" onClick={() => console.log("delete")}>

                                                </Dropdown.Item>
                                            </Dropdown.Menu>
                                        </Dropdown>
                                    </td>
                                </tr>

                            )}
                        </ReorderableTableBody>
                    </Table>
                </Row>
            </Offcanvas.Body>


        </Offcanvas>
    )
}



type TopButtonProp = ButtonProps & {
    label: string;
    icon: IconDefinition;
}
const TopButton = ({ label, icon, ...buttonProps }: TopButtonProp) => {

    return (
        <Button
            className="col-auto border-0"
            {...buttonProps}
        >
            {label} <FontAwesomeIcon icon={icon} size="sm" />
        </Button>
    )
}