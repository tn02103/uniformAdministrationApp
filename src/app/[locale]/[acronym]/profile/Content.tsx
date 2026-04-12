"use client";

import type { OwnProfileData } from "@/dataFetcher/profile";
import { useOwnProfile } from "@/dataFetcher/profile";
import { AccountInfoSection } from "./_sections/AccountInfoSection";
import { TwoFactorSection } from "./_sections/TwoFactorSection";
import { DevicesSection } from "./_sections/DevicesSection";

type ProfileContentProps = {
    fallbackData: OwnProfileData | null;
};

/**
 * Client-side shell for the profile page. Hydrates SWR from server-prefetched
 * data and renders the three profile sections.
 *
 * @param fallbackData - Server-side prefetched profile data for initial render.
 */
export const ProfileContent = ({ fallbackData }: ProfileContentProps) => {
    const { profile, mutate } = useOwnProfile(fallbackData);

    if (!profile) return null;

    return (
        <div className="container-sm py-4" style={{maxWidth: "720px"}}>
            <div className="row justify-content-center">
                <div className="col-12">
                    <AccountInfoSection profile={profile} />
                    <TwoFactorSection profile={profile} mutate={mutate} />
                    <DevicesSection devices={profile.devices} />
                </div>
            </div>
        </div>
    );
};