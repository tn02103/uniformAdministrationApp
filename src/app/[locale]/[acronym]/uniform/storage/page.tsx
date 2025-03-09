"use client";
import { TooltipActionButton } from '@/components/TooltipIconButton';
import { useStorageUnitsWithUniformItemList } from '@/dataFetcher/storage';
import React, { useState } from 'react';
import { Row, Table } from 'react-bootstrap';
import Unitslider from './Unitslider';

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
                <Unitslider storageUnit={storageUnits?.find(unit => unit.id === selectedUnitId)} onHide={() => setSelectedUnitId(null)} setSelectedStorageUnitId={setSelectedUnitId} />
            }
        </div>
    );
};

/*
const UnitSlider = ({ selectedUnit, onHide }: { selectedUnit?: StorageUnitWithUniformItems, onHide: () => void }) => {
    const { register, formState: { errors }, setError } = useForm<StorageUnitFormType>({
        mode: "onTouched",
        resolver: zodResolver(storageUnitFormSchema)
    });
   const { mutate } = useStorageUnitsWithUniformItemList();
     const t = useI18n();


    const handleUpdate = (data: StorageUnitFormType) => {
        if (!selectedUnit) return handleCreate(data);

        SAFormHandler(updateStorageUnit({ id: selectedUnit.id, data }), setError).then(({ success, data }) => {
            if (success) {
                mutate(data);
                // DO something here
            }
        }).catch(() => {
            toast.error(t('common.error.actions.save'));
        });
    }
    const handleDelete = () => {
        if (!selectedUnit) return;
        deleteStorageUnit(selectedUnit.id).then((data) => {
            mutate(data);
            onHide();
        }).catch(() => {
            toast.error(t('common.error.actions.delete'));
        });
    }
    const handleCreate = (data: StorageUnitFormType) => {
        SAFormHandler(createStorageUnit(data), setError).then(({ success, data }) => {
            if (success) {
                mutate(data);
                // set selectedStorageUnit
            }
        }).catch(() => {
            toast.error(t('common.error.actions.create'));
        });
    }
    const handleRemoveUniform = (uniformIds: string[]) => {
        if (!selectedUnit) return;

        removeUniformFromStorageUnit({ storageUnitId: selectedUnit.id, uniformIds }).then((data) => {
            mutate(data);
            // do stuff
        }).catch(() => {
            toast.error('Unexpected error');
        });
    }

    if (!selectedUnit) {
        return null;
    }
    return (
        <Offcanvas show={selectedUnit} onHide={onHide} placement='end'>
            <Offcanvas.Header closeButton>
                <Offcanvas.Title>Offcanvas</Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
                <div>
                    <h5>Details</h5>
                    <p>
                        <strong>Name:</strong>
                        <FormGroup>
                            <FormControl {...register('name')} />
                            <ErrorMessage testId='err_name' error={errors.name?.message} />
                        </FormGroup>
                    </p>
                    <p>
                        <strong>Beschreibung:</strong>
                        <FormGroup>
                            <FormControl {...register('description')} />
                            <ErrorMessage testId='err_description' error={errors.description?.message} />
                        </FormGroup>
                    </p>
                    <p>
                        <strong>Kapazität:</strong>
                        <FormGroup>
                            <FormControl {...register('capacity')} />
                            <ErrorMessage testId='err_capacity' error={errors.capacity?.message} />
                        </FormGroup>
                    </p>
                    <p>
                        <Form.Check {...register('isReserve')} label={"UT als Reserve markieren:"} />
                    </p>
                </div>
                <hr />
               
                <hr></hr>
                <div>
                    <h5>Uniformteile</h5>
                    <ul>
                        {selectedUnit.uniformList.map((item) => (
                            <li key={item.id}>{item.number}</li>
                        ))}
                    </ul>
                </div>
            </Offcanvas.Body>
        </Offcanvas >
    )
}
*/
export default StoragePage;
