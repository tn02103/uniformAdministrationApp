import { getUserList } from "@/dal/user";
import { getI18n, getScopedI18n } from "@/lib/locales/config";
import { Col, Row, Table } from "react-bootstrap";
import { OpenNewUserButton, OpenUserButton } from "./UserTableButtons";
import { UserOC } from "./UserOC";
import { Metadata } from "next";

export const dynamic = 'auto';
export async function generateMetadata(): Promise<Metadata> {
    const t = await getScopedI18n('pageTitles');
    return {
        title: t('admin.user'),
    }
}

type PageProps = {
    searchParams: Promise<{ open?: string }>;
}
export default async function UserAdminPage(props: PageProps) {
    const t = await getI18n();
    const tPage = await getScopedI18n('admin.user')
    const users = await getUserList();
    const searchParams = await props.searchParams;

    return (
        <div className="container-lg content-center bg-light rounded p-0 pt-2 position-relative">
            <h1 className="text-center">{t('admin.user.header.page')}</h1>
            <Row className="justify-content-center m-0">
                <Col xs={12} xl={10} className="p-0 p-md-4">
                    <Table striped className="border rounded border-3">
                        <thead className="topoffset-nav sticky-top bg-white m-1">
                            <tr className="border-bottom border-2 border-dark">
                                <th>{tPage('header.username')}</th>
                                <th>{tPage('header.name')}</th>
                                <th className="d-none d-md-table-cell">{tPage('header.role')}</th>
                                <th className="d-none d-sm-table-cell">{tPage('header.status')}</th>
                                <th className="float-end border-0">
                                    <OpenNewUserButton />
                                </th>
                            </tr>
                        </thead>
                        <tbody className="border-1 ">
                            {users.map(user => (
                                <tr key={user.id}>
                                    <td>{user.email}</td>
                                    <td>{user.name}</td>
                                    <td>{t(`common.user.authRole.${user.role as 1 | 2 | 3 | 4}`)}</td>
                                    <td>{t(`common.user.active.${user.active ? "true" : "false"}`)}</td>
                                    <td>
                                        <OpenUserButton userId={user.id} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Col>
            </Row>
            {searchParams.open &&
                <UserOC user={users.find(u => u.id === searchParams.open) ?? null} />
            }
        </div>
    )
}
