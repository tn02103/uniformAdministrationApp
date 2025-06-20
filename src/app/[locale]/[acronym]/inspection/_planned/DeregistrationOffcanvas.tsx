import { AutocompleteField } from "@/components/fields/AutocompleteField";
import { updateCadetRegistrationForInspection } from "@/dal/inspection";
import { usePlannedInspectionList } from "@/dataFetcher/inspection";
import { useScopedI18n } from "@/lib/locales/client";
import { CadetLabel } from "@/types/globalCadetTypes";
import { PlannedInspectionType } from "@/types/inspectionTypes";
import { faX } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { format } from "date-fns";
import { useMemo } from "react";
import { Button, Offcanvas, Table } from "react-bootstrap";
import { toast } from "react-toastify";

type DeregistrationOffcanvasProps = {
    inspection: PlannedInspectionType;
    cadetList: CadetLabel[];
    onClose: () => void;
}
export const DeregistrationOffcanvas = ({ inspection, cadetList, onClose }: DeregistrationOffcanvasProps) => {
    const { mutate } = usePlannedInspectionList();
    const t = useScopedI18n('inspection.planned');

    const options = useMemo(() => {
        return cadetList.filter(c =>
            !inspection.deregistrations.some(d => d.fk_cadet === c.id)
        ).map(c => ({
            value: c.id, label: `${c.firstname} ${c.lastname}`
        })).sort((a, b) => a.label.localeCompare(b.label));
    }, [cadetList, inspection.deregistrations]);

    const handleAdd = (value: string | null) => {
        if (value) {
            const cadet = cadetList.find(c => c.id === value);
            if (!cadet) return;

            updateCadetRegistrationForInspection({
                cadetId: value,
                inspectionId: inspection.id,
                deregister: true
            }).then(() => {
                mutate();
            }).catch(() => {
                toast.error(t('errors.deregistration', cadet));
            });
        }
    }

    const handleRemove = (cadet: CadetLabel) => {
        updateCadetRegistrationForInspection({
            cadetId: cadet.id,
            inspectionId: inspection.id,
            deregister: false
        }).then(() => {
            mutate();
        }).catch(() => {
            toast.error(t('errors.register', cadet));
        });
    }

    return (
        <Offcanvas
            show
            backdrop={false}
            onHide={onClose}
            placement="end"
            scroll={true}
            style={{ width: "450px" }}
            aria-labelledby="offcanvas-inspection-deregistration"
        >
            <Offcanvas.Header closeButton>
                <Offcanvas.Title id="offcanvas-inspection-deregistration">
                    {t('deregistration.header', { name: inspection.name })}
                </Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
                <div className="row justify-content-between mb-3">
                    <div className="col-auto">
                        <AutocompleteField
                            resetOnChange
                            label={t('deregistration.label.add')}
                            options={options}
                            onChange={handleAdd}
                        />
                    </div>
                </div>
                <Table>
                    <thead>
                        <tr>
                            <th></th>
                            <th>{t('deregistration.label.person')}</th>
                            <th>{t('deregistration.label.date')}</th>
                        </tr>
                    </thead>
                    <tbody data-testid="deregistration-table-body" role="rowgroup" aria-label="body">
                        {inspection.deregistrations.map((dereg) => (
                            <tr key={dereg.fk_cadet} className="hoverCol">
                                <td>
                                    <Button
                                        variant={"light"}
                                        className="hoverColHidden"
                                        size="sm"
                                        onClick={() => handleRemove(dereg.cadet)}
                                        aria-label={t('deregistration.label.remove')}
                                    >
                                        <FontAwesomeIcon icon={faX} className="text-danger" />
                                    </Button>
                                </td>
                                <td>{dereg.cadet.firstname} {dereg.cadet.lastname}</td>
                                <td>{format(dereg.date, 'dd.MM.yyyy HH:mm')}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </Offcanvas.Body>
        </Offcanvas >
    );
}
