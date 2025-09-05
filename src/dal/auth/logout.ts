import { getIronSession } from "@/lib/ironSession";
import { cookies } from "next/headers";
import { AuthConfig, getDeviceAccountFromCookies } from "./helper";
import { prisma } from "@/lib/db";


export const logout = async () => {
    try {
        const session = await getIronSession();
        const user = session.user;
        await session.destroy();

        const cookieList = await cookies();

        const refreshToken = cookieList.get(AuthConfig.refreshTokenCookie);
        if (refreshToken) {
            await prisma.refreshToken.updateMany({
                where: {
                    token: refreshToken.value,
                },
                data: { revoked: true },
            });
            // Clear Refreshtoken cookie
            cookieList.delete(AuthConfig.refreshTokenCookie);
        }

        if (user) {
            const { accountCookie } = getDeviceAccountFromCookies({ cookieList });

            if (accountCookie?.lastUsed) {
                const deviceId = accountCookie.lastUsed.deviceId;
                if (deviceId) {
                    await prisma.refreshToken.updateMany({
                        where: {
                            deviceId: deviceId,
                        },
                        data: { revoked: true },
                    });
                }
            }
        }
    } catch (error) {
        console.error("Error logging out:", error);
    }
};
