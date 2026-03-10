import { getIronSession } from "@/lib/ironSession";
import { cookies } from "next/headers";
import { AuthConfig } from "./config";
import { prisma } from "@/lib/db";


export const logout = async () => {
    try {
        const session = await getIronSession();
        const deviceId = session.deviceId;
        await session.destroy();

        const cookieList = await cookies();
        cookieList.delete({ name: AuthConfig.refreshTokenCookie, path: '/api/auth/refresh' });

        if (deviceId) {
            await prisma.refreshToken.updateMany({
                where: {
                    deviceId,
                    status: "active",
                },
                data: { status: "revoked" },
            });
        }
    } catch (error) {
        console.error("Error logging out:", error);
    }
};
