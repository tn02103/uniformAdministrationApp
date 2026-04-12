import { getOwnProfileData } from "@/dal/auth/index";
import { ProfileContent } from "./Content";

export default async function ProfilePage() {
    const profileData = await getOwnProfileData();
    return <ProfileContent fallbackData={profileData} />;
}
