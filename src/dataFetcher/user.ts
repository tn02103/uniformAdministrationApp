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
