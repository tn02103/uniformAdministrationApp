"use server";

import { add, removeUnverified, verify } from "./2fa/addAuthApp";
import { removeVerifiedTwoFactorApp as removeVerified2FAApp } from "./2fa/delete";
import { setDefault2FAMethod as setDefault2FA, toggleUserTwoFA as toggleTwoFA } from "./2fa/update";
import { Login } from "./login";
import { logout } from "./logout";
import { changePassword } from "./password/changePassword";
import { getOwnProfileData as getProfileData } from "./profile/get";
import { executePasswordReset as execPwReset } from "./passwordReset/executeReset";
import { requestPasswordReset as rqPwReset } from "./passwordReset/requestReset";
import { validatePasswordResetToken as validatePwResetToken } from "./passwordReset/validateResetToken";

export const userLogin = Login;
export const userLogout = logout;

export const addTwoFactorApp = add;
export const verifyTwoFactorAuthApp = verify;
export const removeUnverifiedTwoFactorApp = removeUnverified;
export const removeVerifiedTwoFactorApp = removeVerified2FAApp;
export const setDefault2FAMethod = setDefault2FA;
export const toggleUserTwoFA = toggleTwoFA;
export const userChangePassword = changePassword;

export const getOwnProfileData = getProfileData;

export const requestPasswordReset = rqPwReset;
export const executePasswordReset = execPwReset;
export const validatePasswordResetToken = validatePwResetToken;
