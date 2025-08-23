"use client"

import { useGlobalData } from "@/components/globalDataProvider";
import { useInspectedCadetIdList, useInspectionState } from "@/dataFetcher/inspection";
import { AuthRole } from "@/lib/AuthRoles";
import { useI18n } from "@/lib/locales/client";
import { PersonnelListCadet } from "@/types/globalCadetTypes";
import { faClipboardCheck, faClipboardQuestion, faSearch, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { format } from "date-fns";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button, FormCheck, FormControl, InputGroup, OverlayTrigger, Tooltip } from "react-bootstrap";
import { useForm } from "react-hook-form";

const GeneralOverviewTable = ({
    data,
}: {
    data: PersonnelListCadet[];
}) => {
    const { register, setValue, watch } = useForm();
    const t = useI18n();

    const router = useRouter();
    const pathname = usePathname();
    const searchParam = useSearchParams();

    const filter = watch("search")?.replaceAll(" ", "").toLowerCase();

    const { inspectionState } = useInspectionState();
    const { userRole } = useGlobalData();
    const { inspectedIdList } = useInspectedCadetIdList(userRole, inspectionState?.active);

    function changeSortOrder(sortOrder: string) {
        const params = new URLSearchParams(searchParam);
        if (searchParam.has("orderBy") && searchParam.has("asc")) {
            if (searchParam.get("orderBy") === sortOrder) {
                const asc = (searchParam.get('asc') === "false");
                params.set('asc', asc ? "true" : "false");
            } else {
                params.set('asc', 'true');
                params.set('orderBy', sortOrder);
            }
        } else {
            params.set('asc', 'false');
            params.set('orderBy', sortOrder);
        }
        router.push(`${pathname}?${params.toString()}`);
    }

    const changeFilter = (filter: "deregistered" | "inspected") => {
        const params = new URLSearchParams(searchParam);
        if (filter === "deregistered") {
            if (params.has('deregistered')) {
                params.delete('deregistered');
            } else {
                params.set('deregistered', 'true');
            }
        } else {
            if (params.has('inspected')) {
                params.delete('inspected');
            } else {
                params.set('inspected', 'true');
            }
        }
        router.push(`${pathname}?${params.toString()}`);
    }

    const filterCadet = (cadet: PersonnelListCadet, searchParam: string) => (
        !searchParam
        || searchParam.length === 0
        || cadet.firstname.concat(cadet.lastname).toLowerCase().replaceAll(" ", "").includes(searchParam)
        || cadet.lastname.concat(cadet.firstname).toLowerCase().replaceAll(" ", "").includes(searchParam))

    return (
        <>
            <div className="row">
                <div className="col-auto d-md-inline my-0 w-auto order-last order-md-first">
                    <InputGroup className="mt-2 p-0">
                        <InputGroup.Text className="bg-primary-subtle">
                            <FontAwesomeIcon icon={faSearch} className="" />
                        </InputGroup.Text>
                        <FormControl
                            inputMode="search"
                            size="sm"
                            {...register("search")}
                            onKeyDown={(event) => { if (event.key == "Enter") { event.currentTarget.blur() } }} />
                        <button
                            data-testid="btn_clearSearch"
                            className="button bg-primary-subtle border border-1 border-seccondary-subtle rounded-end"
                            onClick={() => setValue("search", "")}
                        >
                            <FontAwesomeIcon icon={faXmark} />
                        </button>
                    </InputGroup>
                </div>
                {inspectionState?.active &&
                    <FormCheck
                        type="switch"
                        size={12}
                        label="Inkl abgemeldete Personen"
                        className="ms-3 my-2 col-auto d-md-inline "
                        onChange={() => changeFilter('deregistered')}
                        checked={searchParam.has('deregistered')}
                    />
                }
                {inspectionState?.active &&
                    <FormCheck
                        type="switch"
                        label="Inkl. kontrolierte Personen"
                        className="ms-3 my-2 col-auto d-md-inline "
                        onChange={() => changeFilter('inspected')}
                        checked={searchParam.has('inspected')}
                    />
                }
            </div>
            <div className="border border-2 rounded px-0">
                <table className="table table-fixed border border-1" data-testid="div_table_cadetList">
                    <thead data-testid="tbl_header" className="bg-white sticky-top topoffset-nav p-0 pt-2">
                        <tr className="rounded-top">
                            {inspectionState?.active &&
                                <th className=""></th>
                            }
                            <th className="sticky-column bg-white p-0 ps-2">
                                <Button variant="outline-secondary"
                                    data-testid="btn_lastname"
                                    className="border-0 text-dark fw-bold align-text-bottom"
                                    onClick={() => changeSortOrder("lastname")}
                                >
                                    {t('common.cadet.lastname')}
                                </Button>
                            </th>
                            <th className="sticky-column-second bg-white p-0 ps-2">
                                <Button variant="outline-secondary"
                                    data-testid="btn_firstname"
                                    className="border-0 text-dark fw-bold align-text-bottom"
                                    onClick={() => changeSortOrder("firstname")}
                                >
                                    {t('common.cadet.firstname')}
                                </Button>
                            </th>
                            {(userRole >= AuthRole.inspector) &&
                                <>
                                    <th data-testid="div_lastInspection" className="align-middle text-nowrap p-0 ps-2 d-none d-md-table-cell">
                                        {t('common.cadet.lastInspection')}
                                    </th>
                                    <th data-testid="div_uniformComplete" className="align-middle text-nowrap p-0 ps-2 d-none d-md-table-cell">
                                        {t('common.cadet.uniformComplete.true')}
                                    </th>
                                    <th data-testid="div_activeDeficiencies" className="align-middle text-nowrap p-0 ps-2 d-none d-sm-table-cell">
                                        {t('common.cadet.activeDeficiencies')}
                                    </th>
                                </>
                            }
                        </tr>
                    </thead>
                    <tbody>
                        {data?.filter(c => filterCadet(c, filter)).map((cadet) => (
                            <tr key={cadet.id} data-testid={`div_cadet_${cadet.id}`}>
                                {inspectionState?.active &&
                                    <td data-testid="div_inspection" className={inspectedIdList?.includes(cadet.id) ? "text-success" : "text-body-tertiary"}>
                                        <FontAwesomeIcon size="lg" icon={inspectedIdList?.includes(cadet.id) ? faClipboardCheck : faClipboardQuestion} />
                                    </td>
                                }
                                <td data-testid={`lnk_lastname`}><CadetLink label={cadet.lastname} id={cadet.id} /></td>
                                <td data-testid={`lnk_firstname`}><CadetLink label={cadet.firstname} id={cadet.id} /></td>
                                {(userRole >= AuthRole.inspector) &&
                                    <>
                                        <td data-testid={`div_lastInspection`} className="d-none d-md-table-cell">
                                            {cadet.lastInspection ? format(new Date(cadet.lastInspection), "dd.MM.yyyy") : "-"}
                                        </td>
                                        <td data-testid={`div_uniformComplete`} className="d-none d-md-table-cell">
                                            {(cadet.uniformComplete === null) ? "-" : cadet.uniformComplete ? t('common.yes') : t('common.no')}
                                        </td>
                                        <td data-testid={`div_activeDeficiencyCount`} className="d-none d-sm-table-cell">
                                            {cadet.activeDeficiencyCount}
                                        </td>
                                    </>
                                }
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}

const CadetLink = ({ label, id }: { label: string, id: string }) => {
    const t = useI18n();
    const NameButtonOverlay = (
        <Tooltip>
            {t('generalOverview.openCadet')}
        </Tooltip>
    )

    return (
        <OverlayTrigger
            overlay={NameButtonOverlay}
            delay={{ show: 1000, hide: 100 }}>
            <Link href={`/app/cadet/${id}`} className="link-body-emphasis link-underline-opacity-25 text-decoration-underline">
                {label}
            </Link>
        </OverlayTrigger>
    )
}

export default GeneralOverviewTable;
