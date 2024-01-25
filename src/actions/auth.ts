"use server";
import { getIronSession } from "@/lib/ironSession"

export const logout = async () => {
    const session = await getIronSession();
    session.destroy();
}