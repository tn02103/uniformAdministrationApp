"use client"

import { TooltipActionButton } from "@/components/Buttons/TooltipIconButton";
import { useUserList } from "@/dataFetcher/user";
import { useI18n } from "@/lib/locales/client";
import { User } from "@/types/userTypes";
import { useState } from "react";
import { Table } from "react-bootstrap";
import { UserOffcanvas } from "../_userOffcanvas/UserOffcanvas";

type Props = {
    initialUserList: User[];
    currentUserId?: string;
}

/**
 * Displays the admin user list as a responsive Bootstrap table and manages the
 * `UserOffcanvas` panel for viewing, creating, and editing users.
 *
 * Data loading:
 * - Accepts `initialUserList` as server-side prefetched data passed to `useUserList`
 *   as `fallbackData`, so the table renders immediately without a loading flash.
 * - Calls `mutate()` from `useUserList` after any create, update, or delete to keep
 *   the list in sync.
 *
 * Columns rendered (with responsive visibility):
 * - Name (always visible)
 * - Username (always visible)
 * - Email (hidden below `md`)
 * - Role (hidden below `lg`, translated via i18n key `common.user.authRole.{1|2|3|4}`)
 * - Active status (hidden below `sm`, translated via `common.user.active.{true|false}`)
 * - Open button per row
 *
 * Interaction model:
 * - Clicking a row or its "Open" button selects that user and opens the offcanvas in view mode.
 * - The "Create" button in the header opens the offcanvas in create mode (`selectedUserId = 'new'`,
 *   `user = null`) and sets `editable = true`.
 * - While `editable` is `true`, row clicks and the create button are disabled (cursor changes to
 *   `not-allowed`, `aria-disabled` set to `true`) to prevent accidental navigation mid-edit.
 * - Closing or cancelling the offcanvas resets both `selectedUserId` and `editable`.
 *
 * @param initialUserList - Users prefetched on the server, used as SWR fallback data.
 */
export const UserTable = ({ initialUserList, currentUserId = "" }: Props) => {
    const t = useI18n();
    const { userList, mutate } = useUserList(initialUserList);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [editable, setEditable] = useState(false);

    const selectedUser = selectedUserId === 'new' ? null : userList?.find(u => u.id === selectedUserId) || null;
    const shouldShowOffcanvas = selectedUserId !== null;

    const getRoleLabel = (role: number) => {
        return t(`common.user.authRole.${role as 1 | 2 | 3 | 4}`);
    };

    const getActiveStatusLabel = (active: boolean) => {
        return t(`common.user.active.${active ? "true" : "false"}`);
    };

    return (
        <>
            <Table striped aria-label={t('admin.user.header.page')}>
                <thead>
                    <tr>
                        <th>{t('admin.user.label.name')}</th>
                        <th>{t('admin.user.label.username')}</th>
                        <th className="d-none d-md-table-cell">{t('admin.user.label.email')}</th>
                        <th className="d-none d-lg-table-cell">{t('admin.user.label.role')}</th>
                        <th className="d-none d-sm-table-cell">{t('admin.user.label.activeStatus')}</th>
                        <th>
                            <TooltipActionButton
                                variantKey="create"
                                disabled={editable}
                                onClick={() => {
                                    setSelectedUserId('new');
                                    setEditable(true);
                                }}
                            />
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {userList?.map(user => (
                        <tr
                            key={user.id}
                            onClick={() => editable || setSelectedUserId(user.id)}
                            aria-disabled={editable }
                            style={{ cursor: editable ? 'not-allowed' : 'pointer' }}
                            aria-label={`user: ${user.username}`}
                        >
                            <td>{user.name}</td>
                            <td>{user.username}</td>
                            <td className="d-none d-md-table-cell">{user.email}</td>
                            <td className="d-none d-lg-table-cell">{getRoleLabel(user.role)}</td>
                            <td className="d-none d-sm-table-cell">{getActiveStatusLabel(user.active)}</td>
                            <td>
                                <TooltipActionButton
                                    variantKey="open"
                                    disabled={editable}
                                    onClick={() => {
                                        setSelectedUserId(user.id);
                                    }}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            {shouldShowOffcanvas && (
                <UserOffcanvas
                    user={selectedUser}
                    editable={editable}
                    setEditable={setEditable}
                    setSelectedUserId={setSelectedUserId}
                    mutate={mutate}
                    currentUserId={currentUserId}
                />
            )}
        </>
    );
};
