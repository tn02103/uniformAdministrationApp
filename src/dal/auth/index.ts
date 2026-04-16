"use server";

import { add, removeUnverified, verify } from "./mfa/addAuthApp";
import { removeMfaApp as _removeMfaApp } from "./mfa/delete";
import { setDefaultMfaMethod as _setDefaultMfaMethod, toggleUserMfa as _toggleUserMfa } from "./mfa/update";
import { adminGetUserTwoFactorApps as _adminGetUserTwoFactorApps } from "./mfa/adminGetApps";
import { adminRemoveTwoFactorApp as _adminRemoveTwoFactorApp } from "./mfa/adminReset2FA";
import { adminDisableUserTwoFA as _adminDisableUserTwoFA } from "./mfa/adminDisable2FA";
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
export const removeMfaApp = _removeMfaApp;
export const setDefaultMfaMethod = _setDefaultMfaMethod;
export const toggleUserMfa = _toggleUserMfa;
export const userChangePassword = changePassword;

export const adminGetUserTwoFactorApps = _adminGetUserTwoFactorApps;
export const adminRemoveTwoFactorApp = _adminRemoveTwoFactorApp;
export const adminDisableUserTwoFA = _adminDisableUserTwoFA;

export const getOwnProfileData = getProfileData;

export const requestPasswordReset = rqPwReset;
export const executePasswordReset = execPwReset;
export const validatePasswordResetToken = validatePwResetToken;

