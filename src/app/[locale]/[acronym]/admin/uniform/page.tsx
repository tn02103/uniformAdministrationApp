"use client"

import { useI18n } from "@/lib/locales/client";
import { useState } from "react";
import { Col, Row } from "react-bootstrap";
import UniformConfigSizelistDetail from "./_sizelistComponents/sizelistDetail";
import UniformConfigSizelistsList from "./_sizelistComponents/sizelistList";
import UniformConfigTypeGenerationList from "./_typeComponents/generationList";
import UniformConfigTypeDetails from "./_typeComponents/typeDetail";
import UniformConfigTypeList from "./_typeComponents/typeList";
import Title from "@/components/Title";


export default function UniformAdminPage() {
    const t = useI18n();
    const [selectedTypeId, setSelectedTypeId] = useState('');
    const selectedTypeEditableState = useState(false);

    const [selectedSizelistId, setSelectedSizelistId] = useState('');
    const [sizelistEditable, setSizelistEditable] = useState(false);

    return (
        <div className="container-xl content-center rounded">
            <Title text={t('admin.uniform.header')} />
            <Row className="justify-content-center">
                <Col xs={12} md={4} lg={3} className="p-0 my-2 px-md-2">
                    <UniformConfigTypeList
                        selectedTypeId={selectedTypeId}
                        selectType={setSelectedTypeId}
                        selectedEditable={selectedTypeEditableState[0]} />
                </Col>
                <Col xs={12} md={7} lg={4} className="p-0 my-2 px-md-2">
                    <UniformConfigTypeDetails
                        selectedTypeId={selectedTypeId}
                        editableState={selectedTypeEditableState} />
                </Col>
                <Col xs={12} lg={5} className="p-0 my-2 px-lg-2">
                    <UniformConfigTypeGenerationList
                        selectedTypeId={selectedTypeId} />
                </Col>
            </Row>
            <Row className="justify-content-center">
                <Col xs={12} lg={4} xl={3} className="p-0 my-2 px-lg-2">
                    <UniformConfigSizelistsList
                        selectedSizelistId={selectedSizelistId}
                        selectList={setSelectedSizelistId}
                        editable={sizelistEditable}
                    />
                </Col>
                <Col xs={12} lg={8} xl={9} className="p-0 my-2 px-lg-2">
                    <UniformConfigSizelistDetail
                        selectedSizelistId={selectedSizelistId}
                        editable={sizelistEditable}
                        setEditable={setSizelistEditable} />
                </Col>
            </Row>
        </div>
    )
}