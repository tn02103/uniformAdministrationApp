import { prisma } from "@/lib/db";
import { getIronSession } from "@/lib/ironSession"
import { ProfileContent } from "./Content";



export default async function Page() {
    const { user } = await getIronSession();
    if (!user) throw new Error('Not authenticated');
    const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: { organisation: true, twoFactorApps: true }
    });
    if (!dbUser) throw new Error('User not found');

    return (
        <ProfileContent user={dbUser} />
    );
}
