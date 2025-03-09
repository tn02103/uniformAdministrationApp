import AutocompleteField from "@/components/AutocompleteFormField/AutocompleteField";
import { useModal } from "@/components/modals/modalProvider";
import { addUniformItemToStorageUnit, removeUniformFromStorageUnit, StorageUnitWithUniformItems } from "@/dal/storageUnit/_index";
import { useStorageUnitsWithUniformItemList } from "@/dataFetcher/storage";
import { useUniformLabels } from "@/dataFetcher/uniform";
import CustomException, { ExceptionType } from "@/errors/CustomException";
import { faPlus, faRightToBracket } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { Button, Form, Row, Table } from "react-bootstrap";
import { useForm } from "react-hook-form";

type Props = {
    storageUnit: StorageUnitWithUniformItems
}
export default function UnitsliderUniformList({ storageUnit }: Props) {
    const { register, handleSubmit, watch, reset } = useForm<{ [key: string]: boolean }>();
    const [addUniform, setAddUniform] = useState<'single' | 'multi' | null>(null);

    const { mutate } = useStorageUnitsWithUniformItemList();
    const { uniformLabels } = useUniformLabels();
    const modal = useModal();

    function handleRemove(data: any) {
        console.log(data);
        removeUniformFromStorageUnit({
            storageUnitId: storageUnit.id,
            uniformIds: Object.entries(data).filter(([, value]) => value).map(([key,]) => key),
        }).then((data) => {
            mutate(data);
            reset();
        }).catch(() => {
            console.error('error');
        });
    }

    function handleAdd(uniformId: string | null, options?: {ignoreFull: boolean}) {
        if (!uniformId) return;

        addUniformItemToStorageUnit({
            storageUnitId: storageUnit.id,
            uniformId,
            options
        }).then((data) => {
            if (!(data as any).error) {
                mutate(data as any);
                if (addUniform === 'single') setAddUniform(null);
                return;
            } else {
                const error = (data as any).error as CustomException;
                switch (error.exceptionType) {
                    case ExceptionType.InUseException:
                        modal?.simpleErrorModal({
                            header: 'Uniform bereits in Lagereinheit',
                            message: 'Das Uniformteil ist bereits in der Lagereinheit ' + error.data.storageUnit.name + ' enthalten.',
                        });
                        break;
                    case ExceptionType.UniformIssuedException:
                        modal?.simpleErrorModal({
                            header: 'Uniform ausgegeben',
                            message: `Das Uniformteil ist momentan an ${error.data.owner.firstname} ${error.data.owner.lastname} ausgegeben.`,
                        });
                        break;
                    case ExceptionType.OverCapacityException:
                        modal?.simpleWarningModal({
                            header: 'Lagereinheit voll',
                            message: `In der Lagereinheit sind bereits ${error.data.current} von ${error.data.capacity} Uniformteile. Möchten Sie das Uniformteil trotzdem hinzufügen?`,
                            primaryFunction: () => handleAdd(uniformId, { ignoreFull: true }),
                        })
                        break;
                }
            }
        }).catch(() => {
            console.error('error');
        })
    }

    const someChecked = Object.values(watch()).some((value: boolean) => value === true);

    return (
        <div>
            <form noValidate onSubmit={handleSubmit(handleRemove)}>
                <h5 className="text-center">Uniformitems</h5>
                <Row className="justify-content-evenly">
                    <Button
                        type="button"
                        size="sm"
                        variant="outline-success"
                        className="col-auto border-0"
                        onClick={() => setAddUniform('single')}
                    >
                        hinzufügen<FontAwesomeIcon icon={faPlus} className="ms-2" />
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant="outline-success"
                        className="col-auto border-0"
                        onClick={() => setAddUniform('multi')}
                    >
                        mehrere hinzufügen <FontAwesomeIcon icon={faPlus} className="ms-2" />
                    </Button>
                    <Button size="sm" type="submit" variant="outline-danger" disabled={!someChecked} className="col-auto border-0">
                        entfernen <FontAwesomeIcon icon={faRightToBracket} className="ms-2" />
                    </Button>
                </Row>
                {addUniform &&
                    <div className="my-3">
                        <AutocompleteField
                            label="Uniformteil suchen"
                            options={uniformLabels?.map(d => ({ value: d.id, label: d.label })) ?? []}
                            value={null}
                            placeholder="Jacke-2020"
                            noImplicitChange={true}
                            onChange={handleAdd} />
                    </div>
                }
                <Table hover>
                    <thead>
                        <tr className="border-bottom border-dark">
                            <th></th>
                            <th>Typ</th>
                            <th>Größe</th>
                            <th>Generation</th>
                        </tr>
                    </thead>
                    <tbody>
                        {storageUnit.uniformList.map((uniform) => (
                            <tr key={uniform.id} className="">
                                <td><Form.Check {...register(uniform.id)} /></td>
                                <td>{uniform.type.name}-{uniform.number}</td>
                                <td>{uniform.size?.name}</td>
                                <td>{uniform.generation?.name}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </form>
        </div >
    );
}