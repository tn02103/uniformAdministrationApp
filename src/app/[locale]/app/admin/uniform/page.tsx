"use client"

import { useState } from "react";
import { Col, Row } from "react-bootstrap";
import UniformConfigTypeDetails from "./typeDetail";
import UniformConfigTypeList from "./typeList";
import UniformConfigTypeGenerationList from "./generationList";
import { useI18n } from "@/lib/locales/client";


export default function UniformAdminPage() {
    const t = useI18n();
    const [selectedTypeId, setSelectedTypeId] = useState('');
    const selectedTypeEditableState = useState(false);
    console.log(selectedTypeId);

    return (
        <div className="container-xl content-center bg-light rounded">
            <h1 className="text-center">
                {t('admin.uniform.header')}
            </h1>
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
                    {/*<UniformConfigSizeListsList
                        sizeLists={sizeLists}
                        editable={sizeListEditable}
                        selectedSizeListId={selectedSizeListId}
                        select={setSelectedSizeListId}
                        add={createSizeList}
                    />*/}
                </Col>
                <Col xs={12} lg={8} xl={9} className="p-0 my-2 px-lg-2">
                    {/*<UniformConfigSizeListDetail
                        editable={sizeListEditable}
                        sizeList={sizeLists?.find(sl => sl.id === selectedSizeListId)}
                        allSizesList={allSizesList}
                        edit={() => setSizeListEditable(true)}
                        save={saveSizeList}
                        cancel={() => setSizeListEditable(false)}
                        rename={renameSizeList}
                        delete={deleteSizeList} />*/}
                </Col>
            </Row>
        </div>
    )
}