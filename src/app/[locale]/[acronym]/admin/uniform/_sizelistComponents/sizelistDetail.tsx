import { deleteSizelist, renameSizelist, saveSizelistSizes } from "@/actions/controllers/UniformSizeController";
import { Card, CardBody, CardHeader } from "@/components/card";
import { useModal } from "@/components/modals/modalProvider";
import { useAllUniformSizesList, useUniformSizelist } from "@/dataFetcher/uniformAdmin";
import { SAErrorResponse, SAInUseError } from "@/errors/ServerActionExceptions";
import { Entity } from "@/lib/EntityEnum";
import { useI18n } from "@/lib/locales/client";
import { descriptionValidationPattern } from "@/lib/validations";
import { UniformSize, UniformSizelist } from "@/types/globalUniformTypes";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { Button, Col, Dropdown, DropdownItem, Row } from "react-bootstrap";
import { toast } from "react-toastify";


export default function UniformConfigSizelistDetail({
    selectedSizelistId, editable, setEditable,
}: {
    selectedSizelistId: string;
    editable: boolean;
    setEditable: (b: boolean) => void;
}) {
    const t = useI18n();
    const modal = useModal();
    const [editedSizeslist, setEditedSizeslist] = useState<UniformSize[]>([]);
    const { sizelist: dbSizelist, mutate } = useUniformSizelist(selectedSizelistId);
    const { sizes } = useAllUniformSizesList();

    useEffect(() => {
        if (!editable) {
            setEditedSizeslist(dbSizelist?.uniformSizes ?? []);
        }
    }, [dbSizelist]);
    useEffect(() => {
        setEditedSizeslist(dbSizelist?.uniformSizes ?? []);
    }, [editable]);


    async function handleRename() {
        if (!dbSizelist) return;
        const renameMutation = async ({ input }: { input: string }) => mutate(
            renameSizelist(selectedSizelistId, input)
        ).catch((e) => {
            console.error(e);
            toast.error(t('common.error.actions.save'));
        });

        await modal?.simpleFormModal({
            header: t('admin.uniform.sizelist.renameModal.header'),
            elementLabel: t('common.name'),
            elementValidation: {
                required: {
                    value: true,
                    message: t('common.error.string.required'),
                },
                pattern: {
                    value: descriptionValidationPattern,
                    message: t('common.error.string.noSpecialChars'),
                },
                maxLength: {
                    value: 20,
                    message: t('common.error.string.maxLength', { value: 20 }),
                },
                validate: (value) => !dbSizelist.uniformSizes.find(sl => (sl.id !== dbSizelist.id) && (sl.name === value)) || t('admin.uniform.sizelist.nameDuplicationError')
            },
            defaultValue: { input: dbSizelist.name },
            abort: () => { },
            save: renameMutation,
        })
    }
    async function handleSave() {
        await setEditable(false);
        await mutate(
            saveSizelistSizes(selectedSizelistId, editedSizeslist?.map(s => s.id))
        ).catch(e => {
            console.error(e);
            toast.error(t('common.error.actions.save'));
        });
    }
    function handleDelete() {
        const deleteMutation = () => deleteSizelist(selectedSizelistId).then((response) => {
            if ((response as SAErrorResponse).error) {
                const data = (response as SAInUseError).error.data;
                const entity = (data.entity === Entity.UniformType)
                    ? t('common.uniform.type.type', { count: 1 })
                    : t('common.uniform.generation.label', { count: 1 });

                modal?.simpleErrorModal({
                    header: t('admin.uniform.sizelist.deleteFailure.header'),
                    message: t('admin.uniform.sizelist.deleteFailure.message', { entity, name: data.name }),
                });
                return;
            }

            mutate(response as UniformSizelist[]);
            setEditable(false);
        });

        modal?.simpleWarningModal({
            header: t('admin.uniform.sizelist.deleteWarning.header', { name: dbSizelist?.name }),
            message: <span>
                {t('admin.uniform.sizelist.deleteWarning.message.line1')}<br />
                {t('admin.uniform.sizelist.deleteWarning.message.line2')}
            </span>,
            primaryOption: t('common.actions.delete'),
            primaryFunction: deleteMutation,
        });
    }

    function removeSize(sizeId: string) {
        setEditedSizeslist(prevState => prevState.filter(s => s.id !== sizeId));
    }

    function addSize(size: UniformSize) {
        setEditedSizeslist(prevState => [size, ...prevState]);
    }

    if (!dbSizelist || !editedSizeslist) return (<></>)
    return (
        <Card data-testid="div_sizelist_detail">
            <CardHeader
                title={dbSizelist.name}
                testId="div_header"
                endButton={
                    <Dropdown drop="start" className={`${editable ? "d-none" : ""}`}>
                        <Dropdown.Toggle data-testid="btn_menu" variant="outline-seccondary" className="border-0" id={"Sizelist-dropdown"}>
                            <FontAwesomeIcon icon={faBars} />
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                            <DropdownItem data-testid="btn_menu_rename" onClick={handleRename} className="py-2">{t('common.actions.rename')}</DropdownItem>
                            <DropdownItem data-testid="btn_menu_edit" onClick={() => setEditable(true)} className="py-2">{t('common.actions.edit')}</DropdownItem>
                            <DropdownItem data-testid="btn_menu_delete" onClick={handleDelete} className="py-2">{t('common.actions.delete')}</DropdownItem>
                        </Dropdown.Menu>
                    </Dropdown>
                } />
            <CardBody>
                {editable &&
                    <Row className="justify-content-center m-3">
                        <Col xs={"auto"}>
                            <Button data-testid="btn_cancel" variant="outline-secondary" onClick={() => setEditable(false)}>
                                {t('common.actions.cancel')}
                            </Button>
                        </Col>
                        <Col xs={"auto"}>
                            <Button data-testid="btn_save" variant="outline-primary" onClick={handleSave}>
                                {t('common.actions.save')}
                            </Button>
                        </Col>
                    </Row>
                }
                <fieldset className="m-3 border-1 border border-dark rounded row g-2">
                    <legend className="fs-6 fst-italic">{t('admin.uniform.sizelist.selectedSizes')}</legend>
                    {editable ?
                        editedSizeslist?.sort((a, b) => a.sortOrder - b.sortOrder).map(size =>
                            <Col xs={"3"} md={2} key={size.id}>
                                <Button
                                    size="sm"
                                    variant="light"
                                    className="border-0 rounded-3 p-2 px-3 w-100 bg-body-secondary "
                                    onClick={() => removeSize(size.id)}
                                    data-testid={`btn_selectedSize_${size.id}`}
                                >
                                    {size.name}
                                </Button>
                            </Col>
                        ) :
                        dbSizelist?.uniformSizes.map(size =>
                            <Col xs={"3"} md={2} key={size.id}>
                                <div className="bg-body-secondary rounded px-3 p-2 hoverCol" data-testid={`div_selectedSize_${size.id}`}>
                                    {size.name}
                                </div>
                            </Col>
                        )}
                </fieldset>
                {editable &&
                    <fieldset className="m-3 row g-2 border border-1 border-dark rounded">
                        <legend className="fs-6 fst-italic">{t('admin.uniform.sizelist.otherSizes')}</legend>
                        {sizes?.filter(s => !editedSizeslist.find(si => s.id === si.id)).map(size =>
                            <Col xs={"3"} md={2} key={size.id}>
                                <Button
                                    size="sm"
                                    variant="light"
                                    className="border-0 rounded-3 p-2 px-3 bg-body-secondary w-100"
                                    onClick={() => addSize(size)}
                                    data-testid={`btn_backupSize_${size.id}`}
                                >
                                    {size.name}
                                </Button>
                            </Col>
                        )}
                    </fieldset>
                }
            </CardBody>
        </Card>
    );
}