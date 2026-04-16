import { adminGetUserTwoFactorApps, } from "@/dal/auth";
import { getUserList } from "@/dal/user";
import { User } from "@/types/userTypes";
import useSWR from "swr";

export function useUserList(fallbackData?: User[]) {
    const { data, mutate } = useSWR(
        'user.list',
        getUserList,
        { fallbackData }
    );
    return { userList: data, mutate };
}

/**
 * Loads the list of TOTP apps registered for a user.
 *
 * @param userId - The user's ID, or `null` to suspend the fetch.
 * @returns `{ apps, mutate }` — the list of TOTP apps and the SWR mutate function.
 */
export function useUserTwoFactorApps(userId: string | null) {
    const { data, mutate } = useSWR(
        userId ? ["user", userId, "twoFactorApps"] : null,
        () => adminGetUserTwoFactorApps({ userId: userId! }),
    );
    return { apps: data, mutate };
}
