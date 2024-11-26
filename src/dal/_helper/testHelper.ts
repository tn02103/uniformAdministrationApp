import dayjs from "@/lib/dayjs";


export const runServerActionTest = async <T>(func: () => Promise<T>): Promise<{ success: true, result: T } | { success: false, result: any }> => func()
    .then((result) => {
        if ((result as any)?.error) {
            return {
                success: false,
                result: result
            }
        } else {
            return {
                success: true,
                result: result,
            }
        }
    }).catch((error) => ({
        success: false,
        result: error,
    }));

export const compareDates = (stringDate: string, date: Date) => {
    return dayjs(stringDate).isSame(date, "day");
}

export const isToday = (date: string|Date) => {
    return dayjs.utc().isSame(date, "day");
}
