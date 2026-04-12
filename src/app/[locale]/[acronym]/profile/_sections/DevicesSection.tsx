"use client";

import { useScopedI18n } from "@/lib/locales/client";
import type { OwnProfileData } from "@/dataFetcher/profile";
import { TooltipActionButton } from "@/components/Buttons/TooltipIconButton";
import { LabelIconButton } from "@/components/Buttons/LabelIconButton";

type Device = OwnProfileData["devices"][number];

type Props = {
    devices: Device[];
};

/**
 * Displays the list of trusted devices associated with the user's account.
 *
 * Edit, delete, and "log out from all devices" actions are present as
 * placeholders pending future implementation.
 *
 * @param devices - Array of trusted device records to display.
 */
export const DevicesSection = ({ devices }: Props) => {
    const t = useScopedI18n("profile.devices");

    return (
        <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
                <h2 className="h5 mb-0">{t("title")}</h2>
                <button
                    type="button"
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => {}}
                >
                    {t("logoutAll")}
                </button>
            </div>
            <div className="card-body">
                {devices.length === 0 ? (
                    <p className="text-muted mb-0">{t("noDevices")}</p>
                ) : (
                    <ul className="list-group list-group-flush">
                        {devices.map((device) => (
                            <li key={device.id} className="list-group-item">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <span className="fw-semibold">{device.name}</span>
                                        {!device.valid && (
                                            <span className="badge bg-secondary ms-2">{t("inactive")}</span>
                                        )}
                                        <div className="text-muted small">
                                            <span>{t("addedOn")}: {new Date(device.createdAt).toLocaleDateString()}</span>
                                            {device.lastUsedAt && (
                                                <span className="ms-3">{t("lastUsed")}: {new Date(device.lastUsedAt).toLocaleDateString()}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-center gap-1">
                                        <TooltipActionButton
                                            variantKey="edit"
                                            onClick={() => {}}
                                        />
                                        <LabelIconButton
                                            variantKey="delete"
                                            size="sm"
                                            onClick={() => {}}
                                        />
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};
