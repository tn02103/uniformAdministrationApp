import { getOwnProfileData } from "@/dal/auth/index";
import { ProfileContent } from "./Content";
import { notFound } from "next/navigation";

export default async function ProfilePage() {
    const profileData = await getOwnProfileData();
    if (profileData === null) notFound();
    return <ProfileContent fallbackData={profileData} />;
}
