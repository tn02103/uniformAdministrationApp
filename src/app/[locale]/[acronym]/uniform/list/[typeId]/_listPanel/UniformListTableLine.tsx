import { TooltipActionButton } from "@/components/Buttons/TooltipIconButton";
import HighlightedText from "@/components/HighlightedText";
import { TooltipIcon } from "@/components/TooltipIcon";
import { UniformOffcanvas } from "@/components/UniformOffcanvas/UniformOffcanvas";
import { useGlobalData } from "@/components/globalDataProvider";
import { AuthRole } from "@/lib/AuthRoles";
import { useI18n } from "@/lib/locales/client";
import { UniformType, UniformWithOwner } from "@/types/globalUniformTypes";
import { faBoxOpen, faRegistered } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { useState } from "react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";

export type UniformListTableLineProps = {
    uniform: UniformWithOwner;
    uniformType: UniformType;
    searchString: string;
    loadData: () => void;
}

export function UniformListTableLine({ uniform, uniformType, searchString, loadData }: UniformListTableLineProps) {
    const t = useI18n();
    const { userRole } = useGlobalData();
    const [isOffcanvasOpen, setOffcanvasOpen] = useState(false);
    const textColor = uniform.active ? "" : "text-secondary";

    return (
        <tr data-testid={`div_uitem_${uniform.id}`} className="align-middle">
            <td data-testid="div_number" className={`col-3 col-sm-1 ${textColor}`}>
                <HighlightedText text={String(uniform.number)} highlight={String(searchString)} />
                {!uniform.active && <TooltipIcon icon={faRegistered} tooltipText={t('common.uniform.state.reserve')} className="text-secondary my-auto ms-1" />}
            </td>
            {uniformType.usingGenerations &&
                <td data-testid="div_generation" className={`d-none d-sm-table-cell col-sm-4 col-md-2 text-truncate ${textColor}`}>
                    {uniform.generation ? uniform.generation.name : "K.A."}
                </td>
            }
            {uniformType.usingSizes &&
                <td data-testid="div_size" className={`d-none d-sm-table-cell col-sm-2 col-md-1 ${textColor}`}>
                    {uniform.size ? uniform.size.name : "K.A."}
                </td>
            }
            <td className={`col-7 col-sm-4 col-md-3 ${textColor}`}>
                {(uniform.issuedEntries && uniform.issuedEntries.length > 0) &&
                    <OpenCadetLink
                        id={uniform.issuedEntries[0].cadet.id}
                        lastname={uniform.issuedEntries[0].cadet.lastname}
                        firstname={uniform.issuedEntries[0].cadet.firstname}
                        testId="lnk_owner"
                        tooltip={t('common.actions.open')} />
                }
                {uniform.storageUnit &&
                    <span>
                        <TooltipIcon
                            icon={faBoxOpen}
                            className="me-1"
                            tooltipText={`${t('common.storageUnit')}: ${uniform.storageUnit.description}`}
                        />
                        {uniform.storageUnit.name}
                    </span>
                }
            </td>
            <td data-testid="div_comment" className={`d-none d-md-table-cell col-3 ${textColor}`}>
                {uniform.comment}
            </td>
            <td className={`col-2 col-lg-1 col-xl-2 col-xxl-1`}>
                <TooltipActionButton
                    variantKey="open"
                    buttonClass={(userRole < AuthRole.inspector) ? "d-md-none" : ""}
                    onClick={() => setOffcanvasOpen(true)}
                />
            </td>
            {isOffcanvasOpen &&
                <UniformOffcanvas
                    uniform={uniform}
                    onClose={() => setOffcanvasOpen(false)}
                    onSave={loadData}
                    uniformType={uniformType}
                />
            }
        </tr>
    )
}

type OpenCadetLinkProps = {
    id: string;
    lastname: string;
    firstname: string;
    testId: string;
    tooltip: string
}
const OpenCadetLink = (props: OpenCadetLinkProps) => {
    const tooltip = (
        <Tooltip>
            {props.tooltip}
        </Tooltip>
    )

    return (
        <OverlayTrigger
            overlay={tooltip}
            delay={{ show: 1000, hide: 0 }}>
            <Link
                className="text-decoration-underline"
                href={"/app/cadet/" + props.id}
                prefetch={false}
                data-testid={props.testId}
            >
                {props.lastname} {props.firstname}
            </Link>
        </OverlayTrigger>
    )
}
