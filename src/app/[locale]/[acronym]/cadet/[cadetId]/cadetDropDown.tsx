"use client";
import { useModal } from "@/components/modals/modalProvider";
import { AuthRole } from "@/lib/AuthRoles";
import { useI18n } from "@/lib/locales/client";
import { AnonymizationMode, CadetStatus, ReturnChecklistTemplate, ReturnProcessTemplate } from "@/prisma/browser";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Dropdown } from "react-bootstrap";
import { toast } from "react-toastify";
import CadetReturnUniformModal from "./_returnUniform/CadetReturnUniformModal";
import { returnCadetDirectly } from "@/dal/cadet";

type ReturnConfig = {
    returnProcessEnabled: boolean;
    anonymizationMode: AnonymizationMode;
    templates: (ReturnProcessTemplate & { checklistItems: ReturnChecklistTemplate[] })[];
} | null;

/**
 * Action dropdown for cadet detail page operations.
 *
 * @param returnConfigLoadFailed - Indicates that return-process configuration could not be loaded, so return actions are fail-closed.
 */
export default function CadetDropDown({
    firstname, lastname, returnConfig, returnConfigLoadFailed, cadetStatus, userRole,
}: {
    firstname: string;
    lastname: string;
    returnConfig: ReturnConfig;
    returnConfigLoadFailed: boolean;
    cadetStatus: CadetStatus;
    userRole: AuthRole;
}) {
    const t = useI18n();
    const router = useRouter();
    const modal = useModal();
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);

    const { cadetId }: { cadetId: string } = useParams();

    function handleReturnUniform() {
        if (returnConfigLoadFailed) {
            toast.error(t('cadetDetailPage.vereinsaustritt.directReturn.error'));
            return;
        }

        if (returnConfig) {
            setIsReturnModalOpen(true);
        } else {
            modal?.simpleWarningModal({
                header: t('cadetDetailPage.vereinsaustritt.directReturn.header'),
                message: t('cadetDetailPage.vereinsaustritt.directReturn.message', { firstname, lastname }),
                primaryOption: t('cadetDetailPage.vereinsaustritt.directReturn.confirm'),
                primaryFunction: () => returnCadetDirectly({ cadetId })
                    .then(() => {
                        router.refresh();
                    })
                    .catch(() => {
                        toast.error(t('cadetDetailPage.vereinsaustritt.directReturn.error'));
                    }),
            });
        }
    }
    if (cadetStatus !== CadetStatus.ACTIVE) {
        return null;
    }

    return (
        <>
            <Dropdown drop="start">
                <Dropdown.Toggle variant="outline-primary" className="border-0" id={"Cadetdropdown"} data-testid={"btn_cadet_menu"}>
                    <FontAwesomeIcon icon={faBars} />
                </Dropdown.Toggle>
                <Dropdown.Menu>
                    {cadetStatus === CadetStatus.ACTIVE && userRole >= AuthRole.inspector && (
                        <Dropdown.Item onClick={handleReturnUniform} data-testid={"btn_cadet_menu_return"}>
                            {t('cadetDetailPage.vereinsaustritt.dropdownLabel')}
                        </Dropdown.Item>
                    )}
                </Dropdown.Menu>
            </Dropdown>
            {isReturnModalOpen && returnConfig && (
                <CadetReturnUniformModal
                    cadetId={cadetId}
                    returnProcessEnabled={returnConfig.returnProcessEnabled}
                    templates={returnConfig.templates}
                    onClose={() => setIsReturnModalOpen(false)}
                />
            )}
        </>
    );
}
