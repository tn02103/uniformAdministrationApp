import { UseFormSetError } from "react-hook-form";

export function SAFormHandler<ActionType extends (...args: any) => Promise<any>>(
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
