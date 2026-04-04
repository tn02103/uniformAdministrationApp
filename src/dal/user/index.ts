"use server";

import { getUserList as _getUserList } from "./get";
import { createUser as _createUser } from "./create";
import { updateUser as _updateUser, changeUserPassword as _changeUserPassword } from "./update";
import { deleteUser as _deleteUser } from "./delete";

export const getUserList = _getUserList;
export const createUser = _createUser;
export const updateUser = _updateUser;
export const changeUserPassword = _changeUserPassword;
export const deleteUser = _deleteUser;
