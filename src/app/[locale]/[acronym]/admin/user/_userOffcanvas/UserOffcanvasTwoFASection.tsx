"use client"

import { adminDisableUserTwoFA, adminRemoveTwoFactorApp } from "@/dal/auth";
import { useModal } from "@/components/modals/modalProvider";
import { useI18n } from "@/lib/locales/client";
import { useUserTwoFactorApps } from "@/dataFetcher/user";
import { User } from "@/types/userTypes";
import { KeyedMutator } from "swr";
import { Button, Badge, ListGroup, Placeholder, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";

type Props = {
    user: User;
    mutateUser: KeyedMutator<User[]>;
}

/**
 * Displays 2FA management section inside the user offcanvas (view mode only).
 *
 * Shows 2FA enabled/disabled state, default method, registered TOTP apps with
 * remove buttons, and a force-disable button. Inline — no separate modal.
 *
 * @param user - The user whose 2FA is being managed.
 * @param mutateUser - SWR mutate for the user list (used after force-disable to reflect state change).
 */
export const UserOffcanvasTwoFASection = ({ user, mutateUser }: Props) => {
    const t = useI18n();
    const modal = useModal();
    const { apps, mutate: mutateApps } = useUserTwoFactorApps(user.id);

    const handleRemoveApp = (appId: string) => {
        modal.simpleYesNoModal({
            header: t('admin.user.twoFA.removeApp'),
            message: t('admin.user.twoFA.removeAppConfirmMessage'),
            primaryOption: t('admin.user.twoFA.removeApp'),
            primaryFunction: async () => {
                try {
                    await adminRemoveTwoFactorApp({ userId: user.id, appId });
                    mutateApps();
                    toast.success(t('admin.user.twoFA.success.appRemoved'));
                } catch {
                    toast.error(t('admin.user.twoFA.error.appRemoved'));
                }
            },
        });
    };

    const handleForceDisable = () => {
        modal.simpleYesNoModal({
            header: t('admin.user.twoFA.forceDisableConfirmHeader'),
            message: t('admin.user.twoFA.forceDisableConfirmMessage', { user: user.name }),
            primaryOption: t('admin.user.twoFA.forceDisable'),
            primaryFunction: async () => {
                try {
                    await adminDisableUserTwoFA({ userId: user.id });
                    mutateUser();
                    toast.success(t('admin.user.twoFA.success.disabled'));
                } catch {
                    toast.error(t('admin.user.twoFA.error.disabled'));
                }
            },
        });
    };

    return (
        <>
            <h3 className="text-center mt-3">{t('admin.user.twoFA.sectionTitle')}</h3>
            <hr className="my-0" />
            <div className="mt-3">
                <div className="mb-2 d-flex align-items-center gap-2">
                    {user.twoFAEnabled
                        ? <Badge bg="success">{t('admin.user.twoFA.statusEnabled')}</Badge>
                        : <Badge bg="secondary">{t('admin.user.twoFA.statusDisabled')}</Badge>
                    }
                </div>
                {user.twoFAEnabled && user.default2FAMethod && (
                    <div className="mb-2 small text-muted">
                        <strong>{t('admin.user.twoFA.defaultMethod')}:</strong>{' '}
                        {user.default2FAMethod === 'email' ? t('profile.twoFactor.defaultMethod.email') : user.default2FAMethod}
                    </div>
                )}

                <div className="mb-2">
                    <strong>{t('admin.user.twoFA.appsTitle')}</strong>
                </div>

                {apps === undefined ? (
                    <Placeholder as="div" animation="glow">
                        <Placeholder xs={12} className="mb-1" style={{ height: '2rem' }} />
                        <Placeholder xs={12} className="mb-1" style={{ height: '2rem' }} />
                    </Placeholder>
                ) : apps.length === 0 ? (
                    <p className="text-muted fst-italic small">{t('admin.user.twoFA.noApps')}</p>
                ) : (
                    <ListGroup className="mb-3">
                        {apps.map((app) => (
                            <ListGroup.Item
                                key={app.id}
                                className="d-flex justify-content-between align-items-center"
                            >
                                <span>
                                    <span className="fw-semibold">{app.appName}</span>
                                    {' '}
                                    <Badge bg={app.verifiedAt ? 'success' : 'warning'} text={app.verifiedAt ? undefined : 'dark'}>
                                        {app.verifiedAt
                                            ? t('admin.user.twoFA.appVerified')
                                            : t('admin.user.twoFA.appUnverified')
                                        }
                                    </Badge>
                                </span>
                                <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => handleRemoveApp(app.id)}
                                >
                                    {t('admin.user.twoFA.removeApp')}
                                </Button>
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                )}

                {user.twoFAEnabled && (
                    <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={handleForceDisable}
                    >
                        {t('admin.user.twoFA.forceDisable')}
                    </Button>
                )}
            </div>
        </>
    );
};
