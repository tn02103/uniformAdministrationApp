"use client";

import { AuthRole } from "@/lib/AuthRoles";
import { useI18n } from "@/lib/locales/client";
import { CadetStatus } from "@/prisma/browser";
import { ResignationConfig } from "@/types/resignationProcessTypes";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Dropdown } from "react-bootstrap";
import { toast } from "react-toastify";
import MemberResignationModal from "./_memberResignation/MemberResignationModal";

/**
 * Action dropdown for cadet detail page operations.
 *
 * @param returnConfigLoadFailed - Indicates that return-process configuration could not be loaded, so return actions are fail-closed.
 */
export default function CadetDropDown({
    resignationConfig, resignationConfigLoadFailed, cadetStatus, userRole,
}: {
    resignationConfig: ResignationConfig;
    resignationConfigLoadFailed: boolean;
    cadetStatus: CadetStatus;
    userRole: AuthRole;
}) {
    const t = useI18n();
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);

    const { cadetId }: { cadetId: string } = useParams();

    function handleReturnUniform() {
        if (resignationConfigLoadFailed) {
            toast.error(t('cadetDetailPage.memberExit.directReturn.error'));
            return;
        }

        if (resignationConfig) {
            setIsReturnModalOpen(true);
        } else {
            // Should not be reachable: config loaded successfully but was null
            toast.error(t('cadetDetailPage.memberExit.directReturn.error'));
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
                        <Dropdown.Item onClick={handleReturnUniform} data-testid={"btn_cadet_menu_memberExit"}>
                            {t('cadetDetailPage.memberExit.dropdownLabel')}
                        </Dropdown.Item>
                    )}
                </Dropdown.Menu>
            </Dropdown>
            {isReturnModalOpen && resignationConfig && (
                <MemberResignationModal
                    cadetId={cadetId}
                    resignationProcessEnabled={resignationConfig.resignationProcessEnabled}
                    templates={resignationConfig.templates}
                    onClose={() => setIsReturnModalOpen(false)}
                />
            )}
        </>
    );
}
