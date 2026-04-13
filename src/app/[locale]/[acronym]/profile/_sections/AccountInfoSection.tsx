"use client";

import { useState } from "react";
import type { OwnProfileData } from "@/dataFetcher/profile";
import { useI18n, useScopedI18n } from "@/lib/locales/client";
import { TooltipActionButton } from "@/components/Buttons/TooltipIconButton";
import { ChangePasswordModal } from "../ChangePasswordModal";

type Props = {
    profile: OwnProfileData;
};

/**
 * Displays the user's account details (name, username, email, role, organisation)
 * and a button to open the change-password modal.
 *
 * Edit buttons for name, username, and email are present as placeholders
 * pending future implementation.
 *
 * @param profile - The current user's profile data.
 */
export const AccountInfoSection = ({ profile }: Props) => {
    const t = useScopedI18n("profile.accountInfo");
    const tCommon = useI18n();
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    const roleKey = String(profile.role) as "1" | "2" | "3" | "4";
    const roleLabel = tCommon(`common.user.authRole.${roleKey}`);

    return (
        <>
            <div className="card mb-4" data-testid="section-accountInfo">
                <div className="card-header">
                    <h2 className="h5 mb-0">{t("title")}</h2>
                </div>
                <ul className="list-group list-group-flush">
                    <li className="list-group-item d-flex justify-content-between align-items-center">
                        <span className="fw-semibold">{t("name")}</span>
                        <div className="d-flex align-items-center gap-2">
                            <span>{profile.name}</span>
                            <TooltipActionButton variantKey="edit" onClick={() => {}} />
                        </div>
                    </li>
                    <li className="list-group-item d-flex justify-content-between align-items-center">
                        <span className="fw-semibold">{t("username")}</span>
                        <div className="d-flex align-items-center gap-2">
                            <span>{profile.username}</span>
                            <TooltipActionButton variantKey="edit" onClick={() => {}} />
                        </div>
                    </li>
                    <li className="list-group-item d-flex justify-content-between align-items-center">
                        <span className="fw-semibold">{t("email")}</span>
                        <div className="d-flex align-items-center gap-2">
                            <span>{profile.email ?? "—"}</span>
                            <TooltipActionButton variantKey="edit" onClick={() => {}} />
                        </div>
                    </li>
                    <li className="list-group-item d-flex justify-content-between align-items-center">
                        <span className="fw-semibold">{t("role")}</span>
                        <span>{roleLabel}</span>
                    </li>
                    <li className="list-group-item d-flex justify-content-between align-items-center">
                        <span className="fw-semibold">{t("organisation")}</span>
                        <span>{profile.organisation?.name ?? "—"}</span>
                    </li>
                    <li className="list-group-item d-flex justify-content-between align-items-center">
                        <span className="fw-semibold">{t("password.title")}</span>
                        <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => setShowPasswordModal(true)}
                        >
                            {t("password.changeButton")}
                        </button>
                    </li>
                </ul>
            </div>
            {showPasswordModal && (
                <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
            )}
        </>
    );
};

