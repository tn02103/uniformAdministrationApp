import { ExceptionType } from "@/errors/CustomException";

export type SAErrorResponseType = {
    error: {
        exceptionType: ExceptionType,
        data?: unknown;
    }
}

export * from "./cadet";
export * from "./assosiation";
