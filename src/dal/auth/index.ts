"use server";

import { add, removeUnverified, verify } from "./2fa/addAuthApp";
import { Login } from "./login";
import { logout } from "./logout";
import { refreshToken } from "./refresh";

export const userLogin = Login;
export const refreshAccessToken = refreshToken;
export const userLogout = logout;

export const addTwoFactorApp = add;
export const verifyTwoFactorAuthApp = verify;
export const removeUnverifiedTwoFactorApp = removeUnverified;
