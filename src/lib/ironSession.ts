import { AuthConfig } from "@/dal/auth/helper";
import { AuthRole } from "./AuthRoles";
import { IronSession as UntypedIronSession, IronSessionData, SessionOptions, getIronSession as getSession } from "iron-session";
import { cookies } from "next/headers";

const sessionOptions: SessionOptions = {
    password: process.env.IRON_SESSION_KEY as string,
    cookieName: process.env.IRON_SESSION_COOKIE_NAME as string,
    ttl: AuthConfig.accessTokenAgeMinutes * 60,
    cookieOptions: {
        secure: process.env.STAGE !== "DEV",
        httpOnly: true,
        sameSite: "strict"
    }
}

declare module "iron-session" {
    interface IronSessionData {
        user?: IronSessionUser
    }
}
export type IronSessionUser = {
    id: string;
    name: string;
    username: string;
    role: AuthRole;
    acronym: string;
    organisationId: string;
}

export type IronSession = UntypedIronSession<IronSessionData>

export const getIronSession = async () => getSession<IronSessionData>(await cookies(), sessionOptions);
