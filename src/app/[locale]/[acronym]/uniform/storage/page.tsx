"use client";
import { TooltipActionButton } from '@/components/TooltipIconButton';
import { StorageUnitWithUniformItems } from '@/dal/storageUnit/get';
import { useStorageUnitsWithUniformItemList } from '@/dataFetcher/storage';
import React, { useState } from 'react';
import { Offcanvas, Row, Table } from 'react-bootstrap';

const StoragePage: React.FC = () => {
    const { storageUnits } = useStorageUnitsWithUniformItemList();
    const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);

    return (
        <div className="container-xl bg-light rounded mt-4">
            <Row className="row pt-2 pb-2">
                <h1 data-testid={"div_pageHeader"} className="text-center">Uniform Lagerverwaltung</h1>
            </Row>
            <Row className="row ps-md-4 pe-md-4">
                <Table striped hover>
                    <thead className="topoffset-nav sticky-top bg-white">
                        <tr className=" ">
                            <th>Name</th>
                            <th>Beschreibung</th>
                            <th>Kapazität</th>
                            <th>Für Reserve</th>
                            <th>Anzahl Uniformteile</th>
                            <th><TooltipActionButton variantKey='create' onClick={() => { console.log('add') }} /></th>
                        </tr>
                    </thead>
                    <tbody>
                        {storageUnits?.map((unit) => (
                            <tr key={unit.id}>
                                <td>{unit.name}</td>
                                <td>{unit.description}</td>
                                <td>{unit.capacity}</td>
                                <td>{unit.isReserve ? 'Ja' : 'Nein'}</td>
                                <td>{unit.uniformList.length}</td>
                                <td>
                                    <TooltipActionButton variantKey='open' onClick={() => { setSelectedUnitId(unit.id) }} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </Row>
            <UnitSlider selectedUnit={storageUnits?.find(unit => unit.id === selectedUnitId)} onHide={() => setSelectedUnitId(null)} />
        </div>
    );
};

const UnitSlider = ({ selectedUnit, onHide }: { selectedUnit: StorageUnitWithUniformItems | undefined, onHide: () => void }) => {

    if (!selectedUnit) return <></>;

    return (
        <Offcanvas show={selectedUnit} onHide={onHide} placement='end'>
            <Offcanvas.Header closeButton>
                <Offcanvas.Title>Offcanvas</Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
                    <div>
                        <h5>Details</h5>
                        <p><strong>Name:</strong> {selectedUnit.name}</p>
                        <p><strong>Beschreibung:</strong> {selectedUnit.description}</p>
                        <p><strong>Kapazität:</strong> {selectedUnit.capacity}</p>
                        <p><strong>Für Reserve:</strong> {selectedUnit.isReserve ? 'Ja' : 'Nein'}</p>
                    </div>
                    <hr />
                    <div>
                        <h5>Uniformteile</h5>
                        <ul>
                            {selectedUnit.uniformList.map((item) => (
                                <li key={item.id}>{item.number}</li>
                            ))}
                        </ul>
                    </div>
            </Offcanvas.Body>
        </Offcanvas>
    )
}

export default StoragePage;
