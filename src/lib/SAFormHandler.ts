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
    setError: UseFormSetError<FormType>| null,
    successCallback: (data: T) => void,
    unhandledErrorCallback?: ((error: unknown) => void) | string
) {
    return serverActionPromise.then((result) => {
        // as long as result is not an error object, we can assume it is a success
        if (!result || typeof result !== "object" || !result.hasOwnProperty("error")) {
            successCallback(result as T);
            return;
        }

        const saError = result as SAError;
        // if the error object has a formElement property, we can assume it is a form error
        if (setError && (saError.error).hasOwnProperty("formElement")) {
            const SAFormError = result as SAFormError;
            const formElement = SAFormError.error.formElement as Path<FormType>;
            const message = SAFormError.error.message as string;

            setError(formElement, { message: message });
            return;
        }

        // if the error object does not have a formElement property, we can assume it is an unhandled error
        if (unhandledErrorCallback) {
            if (typeof unhandledErrorCallback === "string") {
                toast.error(unhandledErrorCallback);
            } else {
                unhandledErrorCallback(result);
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