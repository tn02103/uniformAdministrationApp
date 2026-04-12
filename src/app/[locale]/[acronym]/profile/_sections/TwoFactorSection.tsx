"use client";

import { useState } from "react";
import { useScopedI18n } from "@/lib/locales/client";
import { AuthRole } from "@/lib/AuthRoles";
import { removeVerifiedTwoFactorApp, setDefault2FAMethod, toggleUserTwoFA } from "@/dal/auth/index";
import { SelectField } from "@/components/fields/SelectField";
import { AddTwoFactorAppModal } from "../AddTwoFactorAppModal";
import { LabelIconButton } from "@/components/Buttons/LabelIconButton";
import { toast } from "react-toastify";
import type { OwnProfileData } from "@/dataFetcher/profile";
import type { KeyedMutator } from "swr";
import { useModal } from "@/components/modals/modalProvider";

type Props = {
    profile: OwnProfileData;
    mutate: KeyedMutator<OwnProfileData | null>;
};

/**
 * Manages two-factor authentication settings for the current user.
 *
 * Features: enable/disable 2FA toggle (with org-rule enforcement), list and
 * delete verified TOTP apps, add new TOTP apps, and set the default 2FA method.
 * Destructive actions (disable 2FA, remove app) require confirmation via a
 * warning modal.
 *
 * @param profile - The current user's profile data.
 * @param mutate - SWR mutate function to refresh profile data after mutations.
 */
export const TwoFactorSection = ({ profile, mutate }: Props) => {
    const t = useScopedI18n("profile.twoFactor");
    const tActions = useScopedI18n("common.actions")
    const modal = useModal();
    const [toggleLoading, setToggleLoading] = useState(false);
    const [removingAppId, setRemovingAppId] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);

    const twoFactorAuthRule = profile.organisation?.organisationConfiguration?.twoFactorAuthRule;
    const showToggle =
        twoFactorAuthRule === "optional" ||
        (twoFactorAuthRule === "administrators" && profile.role < AuthRole.admin);

    const handleToggle2FA = async () => {
        setToggleLoading(true);
        try {
            await toggleUserTwoFA({ enabled: !profile.twoFAEnabled });
            await mutate();
        } catch {
            toast.error(t("errors.toggleFailed"));
        } finally {
            setToggleLoading(false);
        }
    };

    const handleRemoveApp = async (appId: string) => {
        setRemovingAppId(appId);
        try {
            await removeVerifiedTwoFactorApp({ appId });
            await mutate();
        } catch {
            toast.error(t("errors.removeFailed"));
        } finally {
            setRemovingAppId(null);
        }
    };

    const handleDefaultMethodChange = async (method: string) => {
        try {
            await setDefault2FAMethod({ method });
            await mutate();
        } catch {
            toast.error(t("errors.defaultMethodFailed"));
        }
    };

    const handleAddModalClose = async () => {
        setShowAddModal(false);
        await mutate();
    };

    return (
        <div className="card mb-4">
            <div className="card-header">
                <h2 className="h5 mb-0">{t("title")}</h2>
            </div>
            <div className="card-body">
                {showToggle && (
                    <div className="mb-3 d-flex align-items-center gap-3">
                        <button
                            type="button"
                            className={`btn btn-sm ${profile.twoFAEnabled ? "btn-outline-danger" : "btn-outline-success"}`}
                            disabled={toggleLoading}
                            onClick={() => {
                                if (profile.twoFAEnabled) {
                                    modal.simpleWarningModal({
                                        header: t("confirmDisable.header"),
                                        message: t("confirmDisable.message"),
                                        primaryFunction: handleToggle2FA,
                                    });
                                } else {
                                    handleToggle2FA();
                                }
                            }}
                        >
                            {toggleLoading && (
                                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" />
                            )}
                            {profile.twoFAEnabled ? t("disableToggle") : t("enableToggle")}
                        </button>
                    </div>
                )}

                <div className="mb-3">
                    <h3 className="h6 fw-bold">{t("apps.title")}</h3>
                    {profile.twoFactorApps.length === 0 ? (
                        <p className="text-muted mb-2">{t("apps.noApps")}</p>
                    ) : (
                        <ul className="list-group mb-2">
                            {profile.twoFactorApps.map((app) => (
                                <li key={app.id} className="list-group-item d-flex justify-content-between align-items-center">
                                    <div>
                                        <span className="fw-semibold">{app.appName}</span>
                                        {app.verifiedAt && (
                                            <small className="text-muted ms-2">
                                                {new Date(app.verifiedAt).toLocaleDateString()}
                                            </small>
                                        )}
                                    </div>
                                    <LabelIconButton
                                        variantKey="delete"
                                        size="sm"
                                        disabled={removingAppId === app.id}
                                        onClick={() => modal.simpleWarningModal({
                                            header: t("confirmRemoveApp.header"),
                                            message: t("confirmRemoveApp.message"),
                                            primaryFunction: () => handleRemoveApp(app.id),
                                            primaryOption: tActions("delete"),
                                        })}
                                    />
                                </li>
                            ))}
                        </ul>
                    )}
                    <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => setShowAddModal(true)}
                    >
                        {t("apps.addNew")}
                    </button>
                </div>

                <div className="mb-1">
                    <SelectField
                        name="defaultMethod"
                        label={t("defaultMethod.title")}
                        disabled={!profile.twoFAEnabled}
                        formName="twoFactorDefaultMethod"
                        value={profile.default2FAMethod ?? "email"}
                        onChange={(value) => handleDefaultMethodChange(String(value))}
                        options={[
                            { value: "email", label: t("defaultMethod.email") },
                            ...profile.twoFactorApps.map((app) => ({ value: app.id, label: app.appName })),
                        ]}
                    />
                </div>
            </div>

            {showAddModal && (
                <AddTwoFactorAppModal onClose={handleAddModalClose} />
            )}
        </div>
    );
};
