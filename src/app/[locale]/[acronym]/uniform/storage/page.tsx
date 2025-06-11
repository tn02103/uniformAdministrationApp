"use client";

import { TooltipActionButton } from '@/components/Buttons/TooltipIconButton';
import { useStorageUnitsWithUniformItemList } from '@/dataFetcher/storage';
import React, { useState } from 'react';
import { Row, Table } from 'react-bootstrap';
import StorageunitOC from './StorageunitOC';

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
                            <th>
                                <TooltipActionButton
                                    variantKey='create'
                                    disabled={!!selectedUnitId}
                                    onClick={() => setSelectedUnitId('new')} />
                            </th>
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
            {selectedUnitId &&
                <StorageunitOC storageUnit={storageUnits?.find(unit => unit.id === selectedUnitId)} onHide={() => setSelectedUnitId(null)} setSelectedStorageUnitId={setSelectedUnitId} />
            }
        </div>
    );
};

export default StoragePage;
