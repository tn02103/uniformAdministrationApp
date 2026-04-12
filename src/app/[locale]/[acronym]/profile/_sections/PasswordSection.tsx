"use client";

import { ChangePasswordModal } from "../ChangePasswordModal";
import { useScopedI18n } from "@/lib/locales/client";
import { useState } from "react";

export const PasswordSection = () => {
    const t = useScopedI18n("profile.password");
    const [showModal, setShowModal] = useState(false);

    return (
        <div className="card mb-4">
            <div className="card-header">
                <h2 className="h5 mb-0">{t("title")}</h2>
            </div>
            <div className="card-body">
                <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowModal(true)}
                >
                    {t("changeButton")}
                </button>
            </div>
            {showModal && (
                <ChangePasswordModal onClose={() => setShowModal(false)} />
            )}
        </div>
    );
};
