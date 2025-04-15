"use client"
import { useState } from "react";
import { Row, Col } from "react-bootstrap";
import UniformConfigSizelistDetail from "./sizelistDetail";
import UniformConfigSizelistsList from "./sizelistList";


export default function UniformSizelistConfigurationWrapper() {
    const [selectedSizelistId, setSelectedSizelistId] = useState('');
    const [sizelistEditable, setSizelistEditable] = useState(false);

    return (
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
    );
};
