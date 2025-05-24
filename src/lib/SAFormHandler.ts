import { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { toast } from "react-toastify";


/* eslint-disable @typescript-eslint/no-explicit-any */
export function asyncSAFormHandler<ActionType extends (...args: any) => Promise<any>>(
    serverActionPromise: ReturnType<ActionType>,
    setError: UseFormSetError<any>
): Promise<{
    success: true,
    data: Awaited<ReturnType<ActionType>>,
} | {
    success: false,
    data?: Awaited<ReturnType<ActionType>>,
}> {
    type dataType = Awaited<ReturnType<ActionType>>;
    return serverActionPromise.then((result: dataType) => {
        if (!result || !result.error) {
            return {
                success: true,
                data: result
            }
        }

        if (result.error.formElement) {
            setError(result.error.formElement, { message: result.error.message });
            return { success: false }
        }
        return {
            success: false,
            data: result,
        }
    })
};
/* eslint-enable @typescript-eslint/no-explicit-any */

type SAFormError = {
    error: {
        formElement: string;
        message: string;
    }
}
type SAError = {
    error: object;
}

export async function SAFormHandler<T, FormType extends FieldValues>(
    serverActionPromise: Promise<T | SAFormError | SAError>,
    setError: UseFormSetError<FormType>,
    successCallback: (data: T) => void,
    unhandledErrorCallback?: ((error: unknown) => void) | string
) {
    return serverActionPromise.then((result) => {
        if (!result || typeof result === "object" && result.hasOwnProperty("error")) {
            successCallback(result as T);
            return;
        }
        if (((result as SAError).error).hasOwnProperty("formElement")) {
            const formElement = (result as SAFormError).error.formElement as Path<FormType>;
            const message = (result as SAFormError).error.formElement as string;
            setError(formElement, { message: message });
        } else {
            if (unhandledErrorCallback) {
                if (typeof unhandledErrorCallback === "string") {
                    toast.error(unhandledErrorCallback);
                } else {
                    unhandledErrorCallback(result);
                }
            }
        }
    }).catch((error) => {
        if (unhandledErrorCallback) {
            if (typeof unhandledErrorCallback === "string") {
                toast.error(unhandledErrorCallback);
            } else {
                unhandledErrorCallback(error);
            }
        }
    });
}