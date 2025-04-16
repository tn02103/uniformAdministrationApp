import { useI18n } from "@/lib/locales/client";
import { Uniform } from "@/types/globalUniformTypes";
import { Offcanvas, Row } from "react-bootstrap"
import { LabelIconButton } from "../Buttons/LabelIconButton";
import { UniformDetailRow } from "./UniformDetailRow";
import { useState } from "react";
import { UniformFormType } from "@/zod/uniform";

export type UniformOffcanvasProps = {
    uniform: Uniform;
    onClose: () => void;
    onSave: (data: UniformFormType) => void;
}
export const UniformOffcanvas = ({ uniform, onClose, onSave }: UniformOffcanvasProps) => {
    const t = useI18n();
    const [editable, setEditable] = useState(false);

    return (
        <Offcanvas
            show={true}
            onHide={onClose}
            placement="end"
            backdrop={false}
            style={{ width: "500px" }}
            aria-labelledby="offcanvas-uniform-header"
        >
            <Offcanvas.Header closeButton>
                <Offcanvas.Title>
                    <h2 id="offcanvas-uniform-header">
                        {uniform.type.name} {uniform.number}
                    </h2>
                </Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
                <h3>{t('common.details')}</h3>
                <hr className="mb-0" />
                <Row className="justify-content-evenly">
                    <LabelIconButton
                        variantKey="edit"
                        disabled={editable}
                        onClick={() => setEditable(true)}
                    />
                    <LabelIconButton
                        variantKey="delete"
                        disabled={editable}
                        onClick={() => { }}
                    />
                </Row>
                <UniformDetailRow
                    uniform={uniform}
                    editable={editable}
                    setEditable={() => setEditable(!editable)}
                    onSave={onSave}
                />
                <h3>Historie</h3>
                <Row>

                </Row>


            </Offcanvas.Body>
        </Offcanvas>
    );
}