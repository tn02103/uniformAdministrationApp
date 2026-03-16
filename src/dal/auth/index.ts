"use server";

import { add, removeUnverified, verify } from "./2fa/addAuthApp";
import { Login } from "./login";
import { logout } from "./logout";
import { executePasswordReset as execPwReset } from "./passwordReset/executeReset";
import { requestPasswordReset as rqPwReset } from "./passwordReset/requestReset";
import { validatePasswordResetToken as validatePwResetToken } from "./passwordReset/validateResetToken";

export const userLogin = Login;
export const userLogout = logout;

export const addTwoFactorApp = add;
export const verifyTwoFactorAuthApp = verify;
export const removeUnverifiedTwoFactorApp = removeUnverified;

export const requestPasswordReset = rqPwReset;
export const executePasswordReset = execPwReset;
export const validatePasswordResetToken = validatePwResetToken;