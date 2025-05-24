import { ExceptionType } from "@/errors/CustomException";

export type SAErrorResponseType = {
    error: {
        exceptionType: ExceptionType,
        data?: unknown;
    }
}