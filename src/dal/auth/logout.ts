import { getIronSession } from "@/lib/ironSession";
import { cookies } from "next/headers";
import { getDeviceAccountFromCookies } from "./helper";
import { AuthConfig } from "./config";
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
                data: { status: "revoked" },
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
                        data: { status: "revoked" },
                    });
                }
            }
        }
    } catch (error) {
        console.error("Error logging out:", error);
    }
};
