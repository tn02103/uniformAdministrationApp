import { UseFormSetError } from "react-hook-form";
import { toast } from "react-toastify";

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

export async function SAFormHandler(
    serverActionPromise: Promise<any>,
    setError: UseFormSetError<any>,
    successCallback: (data: any) => void,
    unhandledErrorCallback?: ((error: any) => void) | string
) {
    return serverActionPromise.then((result) => {
        if (!result || !result.error) {
            successCallback(result);
            return;
        }
        if (result.error.formElement) {
            setError(result.error.formElement, { message: result.error.message });
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