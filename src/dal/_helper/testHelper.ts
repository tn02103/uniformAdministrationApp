import dayjs from "dayjs";

export const runServerAction = async <T>(func: () => Promise<T>): Promise<{ success: boolean, result: T }> => func()
    .then((result) => ({
        success: true,
        result: result,
    })).catch((error) => ({
        success: false,
        result: error,
    }));

export const compareDates = (stringDate: string, date: Date) => {
    return dayjs(stringDate).isSame(date, "day");
}
