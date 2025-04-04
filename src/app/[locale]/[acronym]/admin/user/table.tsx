"use client"

import TooltipIconButton from "@/components/Buttons/TooltipIconButton"
import { useI18n, useScopedI18n } from "@/lib/locales/client"
import { User } from "@/types/userTypes"
import { faPlus } from "@fortawesome/free-solid-svg-icons"
import { useState } from "react"
import { Table } from "react-bootstrap"
import UserAdminTableRow from "./tableLine"

export default function UserAdminTable({
    userList
}: {
    userList: User[]
}) {
    const t = useI18n();
    const tPage = useScopedI18n('admin.user');
    const [newUserActive, setNewUserActive] = useState(false);

    return (
        <Table striped className="border rounded border-3">
            <thead className="topoffset-nav sticky-top bg-white m-1">
                <tr className="border-bottom border-2 border-dark">
                    <th>{tPage('header.username')}</th>
                    <th>{tPage('header.name')}</th>
                    <th className="d-none d-md-table-cell">{tPage('header.role')}</th>
                    <th className="d-none d-sm-table-cell">{tPage('header.status')}</th>
                    <th className="float-end border-0">
                        <TooltipIconButton
                            icon={faPlus}
                            buttonSize="sm"
                            iconClass="fs-6"
                            variant="outline-success"
                            disabled={newUserActive}
                            tooltipText={t('common.actions.create')}
                            onClick={() => setNewUserActive(true)}
                            testId="btn_create" />
                    </th>
                </tr>
            </thead>
            <tbody className="border-1 ">
                {newUserActive &&
                    <UserAdminTableRow
                        user={undefined}
                        userList={userList}
                        onCancel={() => setNewUserActive(false)}
                    />
                }
                {userList?.map(user =>
                    <UserAdminTableRow
                        key={user.id}
                        user={user}
                        userList={userList} />
                )}
            </tbody>
        </Table>
    )
}
