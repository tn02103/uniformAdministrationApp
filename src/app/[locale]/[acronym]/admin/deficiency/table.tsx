"use client";

import { TooltipActionButton } from "@/components/TooltipIconButton";
import { useScopedI18n } from "@/lib/locales/client";
import { AdminDeficiencyType } from "@/types/deficiencyTypes";
import { faCircle } from "@fortawesome/free-regular-svg-icons";
import { faInfo } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { Table } from "react-bootstrap";
import DefTypeAdminTableRow from "./tableRow";

export default function DefTypeAdminTable({
    typeList
}: {
    typeList: AdminDeficiencyType[]
}) {
    const t = useScopedI18n('admin.deficiency');

    const [newVisible, setNewVisible] = useState(false);

    return (
        <Table striped className="border rounded border-3" style={{ minWidth: 700 }}>
            <thead className="sticky-top bg-white m-1">
                <tr className="border-bottom border-2 border-dark">
                    <th>{t('header.name')}</th>
                    <th>
                        {t('header.dependend')}
                        <span className="d-none d-lg-inline-block fa-layers fa-fw ms-2" data-toggle={"tooltip"} title={t('info.dependend')} >
                            <FontAwesomeIcon icon={faCircle} />
                            <FontAwesomeIcon icon={faInfo} transform={"shrink-6 "} />
                        </span>
                    </th>
                    <th>{t('header.relation')}
                        <span className="d-none d-lg-inline-block fa-layers fa-fw ms-2" data-toggle={"tooltip"} title={t('info.relation')} >
                            <FontAwesomeIcon icon={faCircle} />
                            <FontAwesomeIcon icon={faInfo} transform={"shrink-6 "} />
                        </span>
                    </th>
                    <th className="d-nonexs d-sm-table-cell">
                        {t('header.active')}
                    </th>
                    <th className="d-nonexs d-sm-table-cell">
                        {t('header.resolved')}
                    </th>
                    <th className="text-end d-nonexs d-md-table-cell d">
                        <TooltipActionButton
                            variantKey="create"
                            disabled={newVisible}
                            onClick={() => setNewVisible(true)} />
                    </th>
                </tr>
            </thead>
            <tbody className="border-1">
                {newVisible &&
                    <DefTypeAdminTableRow type={null} hideNew={() => setNewVisible(false)} />
                }
                {typeList?.map((type) =>
                    <DefTypeAdminTableRow type={type} key={type.id} hideNew={() => setNewVisible(false)} />
                )}
            </tbody>
        </Table>
    )
}

