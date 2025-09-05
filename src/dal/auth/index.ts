"use server";

import { Login } from "./login";
import { logout } from "./logout";
import { refreshToken } from "./refresh";

export const userLogin = Login;
export const refreshAccessToken = refreshToken;
export const userLogout = logout;