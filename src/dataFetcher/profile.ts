import { getOwnProfileData } from "@/dal/auth/index";
import useSWR from "swr";

export type OwnProfileData = NonNullable<Awaited<ReturnType<typeof getOwnProfileData>>>;

/**
 * SWR hook that fetches the current user's profile data.
 *
 * @param fallbackData - Optional server-side prefetched data to hydrate the cache.
 * @returns `{ profile, mutate }` — profile data (or `undefined` while loading) and a mutate function.
 */
export function useOwnProfile(fallbackData?: OwnProfileData | null) {
    const { data, mutate } = useSWR(
        "auth.profile",
        getOwnProfileData,
        { fallbackData: fallbackData ?? undefined }
    );
    return { profile: data, mutate };
}
