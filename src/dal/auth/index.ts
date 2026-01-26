"use server";

import { add, removeUnverified, verify } from "./2fa/addAuthApp";
import { Login } from "./login";
import { logout } from "./logout";

export const userLogin = Login;
export const userLogout = logout;

export const addTwoFactorApp = add;
export const verifyTwoFactorAuthApp = verify;
export const removeUnverifiedTwoFactorApp = removeUnverified;
