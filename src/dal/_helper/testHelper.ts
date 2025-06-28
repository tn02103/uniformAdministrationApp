/* eslint-disable @typescript-eslint/no-explicit-any */
import dayjs from "@/lib/dayjs";


export const runServerActionTest = async <T>(functionPromise: Promise<T>): Promise<{ success: true, result: T } | { success: false, result: any }> => functionPromise
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

export type SAReturnType<T> = Promise<T | SAErrorType>

export type SAErrorType = {
    error: {
        message: string,
        formElement: string,
    }
}
export const compareDates = (stringDate: string, date: Date) => {
    return dayjs(stringDate).isSame(date, "day");
}

export const isToday = (date: string | Date) => {
    return dayjs().isSame(date, "day");
}

export function cleanData(dataObject: any, attributesToRemove: string[]) {
    attributesToRemove.forEach(attribute => {
        const keys = attribute.split('.');
        removeAttribute(dataObject, keys);
    });
    return dataObject;
}

function removeAttribute(obj: any, keys: string[]) {
    if (keys.length === 0) return;
    if (obj === null || obj === undefined) return;

    const key = keys[0];
    if (keys.length === 1) {
        if (Array.isArray(obj)) {
            obj.forEach(item => delete item[key]);
        } else {
            delete obj[key];
        }
    } else {
        if (Array.isArray(obj)) {
            obj.forEach(item => removeAttribute(item[key], keys.slice(1)));
        } else if (obj[key]) {
            removeAttribute(obj[key], keys.slice(1));
        }
    }
}

export function cleanDataV2(dataObject: any): any {
    if (Array.isArray(dataObject)) {
        return dataObject.map(item => cleanDataV2(item));
    } else if (typeof dataObject === 'object' && dataObject !== null) {
        const cleanedObject: any = {};
        for (const key in dataObject) {
            if (dataObject.hasOwnProperty(key)) {
                const value = dataObject[key];
                if (typeof value === 'string' && isUUID(value)) {
                    cleanedObject[key] = removeFirstTwoDigits(value);
                } else {
                    cleanedObject[key] = cleanDataV2(value);
                }
            }
        }
        return cleanedObject;
    } else if (typeof dataObject === "string" && isUUID(dataObject)) {
        return removeFirstTwoDigits(dataObject);
    }
    return dataObject;
}

const uuidRegex = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/;
function isUUID(value: string): boolean {
    return uuidRegex.test(value);
}

function removeFirstTwoDigits(uuid: string): string {
    return uuid.replace(/^([0-9a-fA-F]{2})/, '');
}

