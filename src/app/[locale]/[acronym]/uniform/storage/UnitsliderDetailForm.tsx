import ErrorMessage from "@/components/errorMessage";
import { createStorageUnit, StorageUnitWithUniformItems, updateStorageUnit } from "@/dal/storageUnit/_index";
import { useStorageUnitsWithUniformItemList } from "@/dataFetcher/storage";
import { SAFormHandler } from "@/lib/SAFormHandler";
import { t } from "@/lib/test";
import { StorageUnitFormType, storageUnitFormSchema } from "@/zod/storage";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Col, Form, FormControl, FormGroup, FormLabel } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";


type Props = {
    storageUnit?: StorageUnitWithUniformItems;
    setEditable: (editable: boolean) => void;
    setSelectedStorageUnitId: (id: string | null) => void;
}

export default function UnitsliderDetailForm({ storageUnit, setEditable, setSelectedStorageUnitId }: Props) {
    const { register, handleSubmit, formState: { errors }, watch, setError } = useForm<StorageUnitFormType>({
        mode: "onTouched",
        resolver: zodResolver(storageUnitFormSchema),
        defaultValues: storageUnit,
    });
    const { mutate } = useStorageUnitsWithUniformItemList();

    const handleUpdate = (data: StorageUnitFormType) => {
        if (!storageUnit) return handleCreate(data);

        SAFormHandler(updateStorageUnit({ id: storageUnit.id, data }), setError).then(({ success, data }) => {
            if (success) {
                mutate(data);
                setEditable(false);
            }
        }).catch(() => {
            toast.error(t('common.error.actions.save'));
        });
    }
    const handleCreate = (data: StorageUnitFormType) => {
        SAFormHandler<typeof createStorageUnit>(createStorageUnit(data), setError).then(({ success, data: returnData }) => {
            if (success && Array.isArray(returnData)) {
                mutate(returnData);
                setEditable(false);
                setSelectedStorageUnitId(returnData.find(u => u.name === data.name)?.id ?? null);
            }
        }).catch(() => {
            toast.error(t('common.error.actions.create'));
        });
    }
    function handleCancel() {
        if(storageUnit) {
            setEditable(false);
        } else {
            setSelectedStorageUnitId(null);
        }
    }

    return (
        <div>
            <form noValidate onSubmit={handleSubmit(handleUpdate)}>
                <h5 className="text-center">{watch('name')}</h5>
                <FormGroup className="mb-3">
                    <FormLabel>Name:</FormLabel>
                    <FormControl {...register('name')} />
                    <ErrorMessage testId='err_name' error={errors.name?.message} />
                </FormGroup>
                <FormGroup className="mb-3">
                    <FormLabel>Beschreibung:</FormLabel>
                    <FormControl {...register('description')} isInvalid={!!errors.description}/>
                    <ErrorMessage testId='err_description' error={errors.description?.message} />
                </FormGroup>
                <FormGroup className="mb-3">
                    <FormLabel>Kapazität:</FormLabel>
                    <FormControl {...register('capacity', {valueAsNumber: true})} isInvalid={!!errors.capacity}/>
                    <ErrorMessage testId='err_capacity' error={errors.capacity?.message} />
                </FormGroup>
                <Form.Check className="my-3" {...register('isReserve')} label={"UT als Reserve markieren:"} />
                <Col className="d-flex justify-content-end mt-3">
                    <Button type="button" size="sm" variant="outline-danger" className="m-1" onClick={handleCancel}>Abbrechen</Button>
                    <Button type="submit" size="sm" variant="outline-primary" className="m-1" >Speichern</Button>
                </Col>
            </form>
        </div>
    );
}