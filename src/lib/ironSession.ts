import { AuthRole } from "./AuthRoles";
import { IronSessionData, SessionOptions, getIronSession as getSession } from "iron-session";
import { cookies } from "next/headers";

const sessionOptions: SessionOptions = {
    password: process.env.IRON_SESSION_KEY as string,
    cookieName: process.env.IRON_SESSION_COOKIE_NAME as string,
    cookieOptions: {
        secure: process.env.STAGE !== "DEV",
        maxAge: (3600 * 6),
        sameSite: "Strict"
    }
}

declare module "iron-session" {
    interface IronSessionData {
        user?: IronSessionUser
    }
}
export type IronSessionUser = {
    name: string;
    username: string;
    assosiation: string;
    acronym: string;
    role: AuthRole;
}


export const getIronSession = () => getSession<IronSessionData>(cookies(), sessionOptions);
