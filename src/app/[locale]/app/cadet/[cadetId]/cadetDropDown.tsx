"use client";
import { deleteCadet } from "@/actions/cadet/delete";
import { useGlobalData } from "@/components/globalDataProvider";
import { useModal } from "@/components/modals/modalProvider";
import { useI18n } from "@/lib/locales/client";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useParams, useRouter } from "next/navigation";
import { Dropdown, DropdownItem } from "react-bootstrap";
import { toast } from "react-toastify";

export default function CadetDropDown({
    firstname, lastname
}: {
    firstname: string,
    lastname: string,
}) {
    const t = useI18n();
    const router = useRouter();
    const modal = useModal();

    const { useBeta } = useGlobalData();
    const { cadetId }: { cadetId: string } = useParams();

    function handleDeleteCadet() {
        modal?.simpleWarningModal({
            header: t('cadetDetailPage.delete.header'),
            message: t('cadetDetailPage.delete.message', { firstname, lastname }),
            primaryOption: t('common.actions.delete'),
            primaryFunction: () => deleteCadet(cadetId).then(() => {
                router.push('/app/cadet');
            }).catch((e) => {
                console.error(e);
                toast.error(t('cadetDetailPage.delete.error'));
            })
        });
    }

    return (
        <Dropdown drop="start">
            <Dropdown.Toggle variant="outline-primary" className="border-0" id={"Cadetdropdown"} data-testid={"btn_cadet_menu"}>
                <FontAwesomeIcon icon={faBars} />
            </Dropdown.Toggle>
            <Dropdown.Menu>
                <Dropdown.Item onClick={handleDeleteCadet} data-testid={"btn_cadet_menu_delete"}>
                    {t('common.actions.delete')}
                </Dropdown.Item>
                {useBeta &&
                    <DropdownItem onClick={() => window.open(`/api/cadet/${cadetId}/pdf`, '_blank')}>
                        {t('generalOverview.issueCertificate')}
                    </DropdownItem>
                }
            </Dropdown.Menu>
        </Dropdown>
    )
}
