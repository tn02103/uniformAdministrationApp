import HighlightedText from "@/components/HighlightedText";
import { useGlobalData } from "@/components/globalDataProvider";
import { useModal } from "@/components/modals/modalProvider";
import { AuthRole } from "@/lib/AuthRoles";
import { useI18n } from "@/lib/locales/client";
import { UniformType, UniformWithOwner } from "@/types/globalUniformTypes";
import { faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { Button, OverlayTrigger, Tooltip } from "react-bootstrap";

export default function TableLine({
    uniform,
    uniformType,
    searchString,
    loadData,
}: {
    uniform: UniformWithOwner;
    uniformType: UniformType;
    searchString: string;
    loadData: () => void;
}) {
    const t = useI18n();
    const { userRole } = useGlobalData();
    const modal = useModal();

    const handleOpenDetialModal = () => {
        modal?.uniformItemDetailModal(uniform.id, uniformType, uniform.issuedEntries?.[0]?.cadet.id, loadData)
    }

    return (
        <tr data-testid={`div_uitem_${uniform.id}`}>
            <td data-testid="div_number" className="col-3 col-sm-1 ">
                <HighlightedText text={String(uniform.number)} highlight={String(searchString)} />
                {uniform.isReserve &&
                    <>
                        <br />
                        <span className="badge rounded-pill text-bg-secondary">
                            {t('common.uniform.active.false')}
                        </span>
                    </>
                }
            </td>
            {uniformType.usingGenerations &&
                <td data-testid="div_generation" className="d-none d-sm-table-cell col-sm-4 col-md-2 text-truncate">
                    {uniform.generation ? uniform.generation.name : "K.A."}
                </td>
            }
            {uniformType.usingSizes &&
                <td data-testid="div_size" className="d-none d-sm-table-cell col-sm-2 col-md-1">
                    {uniform.size ? uniform.size.name : "K.A."}
                </td>
            }
            <td className=" col-7 col-sm-4 col-md-3 ">
                {(uniform.issuedEntries && uniform.issuedEntries.length > 0) &&
                    <OpenCadetLink
                        id={uniform.issuedEntries[0].cadet.id}
                        lastname={uniform.issuedEntries[0].cadet.lastname}
                        firstname={uniform.issuedEntries[0].cadet.firstname}
                        testId="lnk_owner"
                        t={t} />
                }
            </td>
            <td data-testid="div_comment" className={`d-none d-md-table-cell col-3 `}>
                {uniform.comment}
            </td>
            <td className={`col-2 col-lg-1 col-xl-2 col-xxl-1`}>
                <Button
                    variant="outline-seccondary"
                    className={(userRole < AuthRole.inspector) ? "d-md-none" : ""}
                    data-testid="btn_open"
                    onClick={handleOpenDetialModal}
                >
                    <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
                </Button>
            </td>
        </tr>
    )
}

type OpenCadetLinkProps = {
    id: string;
    lastname: string;
    firstname: string;
    testId: string;
    t: any
}
const OpenCadetLink = (props: OpenCadetLinkProps) => {
    const tooltip = (
        <Tooltip>
            {props.t('tooltip.cadet.open')}
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
