"use client";

import { useI18n } from "@/lib/locales/client";
import { User } from "@/types/userTypes";
import { useParams, useRouter } from "next/navigation";
import { Offcanvas } from "react-bootstrap";
import { UserOCDetailForm } from "./UserOCDetailForm";
import dayjs from "@/lib/dayjs";

type UserDetailOffcanvasProps = {
    user: User | null;
}
export const UserOC = ({ user }: UserDetailOffcanvasProps) => {
    const t = useI18n();
    const router = useRouter();
    const params = useParams();


    const handleCloseOffcanvas = () => {
        router.replace(`/${params.locale}/app/admin/user`);
    }
    return (
        <Offcanvas show placement='end' onHide={handleCloseOffcanvas} style={{ width: '575px' }}>
            <Offcanvas.Header closeButton>
                <h3>
                    {user?.name ?? t('user.offcanvas.header.new')}
                </h3>
            </Offcanvas.Header>
            <Offcanvas.Body>
                <UserOCDetailForm user={user} onClose={handleCloseOffcanvas} />
                {user &&
                    <div>
                        <h4 className="mt-4">Geräte</h4>
                        <hr />
                        {user.devices.map(device => (
                            <div key={device.id} className="mb-3">
                                <strong>{device.name}</strong> - {device.description} <br />
                                <small>
                                    Erstellt: {
                                        dayjs(device.createdAt).format("DD.MM.YYYY HH:mm:ss")
                                    } | Letzte Anmeldung: {
                                        device.lastUsedAt ? dayjs(device.lastUsedAt).format("DD.MM.YYYY HH:mm:ss") : "Nie"
                                    }
                                </small>
                            </div>
                        ))}
                    </div>
                }
            </Offcanvas.Body>
        </Offcanvas>
    )
}