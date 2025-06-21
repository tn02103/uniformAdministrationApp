"use client";

import { TooltipActionButton } from '@/components/Buttons/TooltipIconButton';
import { useStorageUnitsWithUniformItemList } from '@/dataFetcher/storage';
import React, { useState } from 'react';
import { Row, Table } from 'react-bootstrap';
import { StorageunitOC } from './StorageunitOC';
import { useI18n } from '@/lib/locales/client';
import { useGlobalData } from '@/components/globalDataProvider';
import { AuthRole } from '@/lib/AuthRoles';

const StoragePage: React.FC = () => {
    const t = useI18n();
    const { storageUnits } = useStorageUnitsWithUniformItemList();
    const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
    const { userRole } = useGlobalData();

    return (
        <div className="container-xl bg-light rounded mt-4">
            <Row className="row pt-2 pb-2">
                <h1 data-testid={"div_pageHeader"} className="text-center">{t('storageUnit.label.header.page')}</h1>
            </Row>
            <Row className="row ps-md-4 pe-md-4">
                <Table striped hover>
                    <thead className="topoffset-nav sticky-top bg-white">
                        <tr className=" ">
                            <th>{t('storageUnit.label.details.name')}</th>
                            <th className='d-none d-md-table-cell'>{t('storageUnit.label.details.description')}</th>
                            <th className='d-none d-sm-table-cell'>{t('storageUnit.label.details.capacity')}</th>
                            <th className='d-none d-sm-table-cell'>{t('storageUnit.label.details.forReserves')}</th>
                            <th>{t('storageUnit.label.details.uniformCount')}</th>
                            <th>
                                {userRole >= AuthRole.inspector &&
                                    <TooltipActionButton
                                        variantKey='create'
                                        disabled={!!selectedUnitId}
                                        onClick={() => setSelectedUnitId('new')} />
                                }
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {storageUnits?.map((unit) => (
                            <tr key={unit.id}>
                                <td>{unit.name}</td>
                                <td className='d-none d-md-table-cell text-truncate' style={{maxWidth: "200px"}}>{unit.description}</td>
                                <td className='d-none d-sm-table-cell'>{unit.capacity ?? " -- "}</td>
                                <td className='d-none d-sm-table-cell'>{unit.isReserve ? 'Ja' : 'Nein'}</td>
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
