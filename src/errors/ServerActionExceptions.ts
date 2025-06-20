import { Entity } from "@/lib/EntityEnum";
import { ExceptionType } from "./CustomException";

export type SAErrorResponse = {
    error: {
        exceptionType: ExceptionType;
        data: unknown;
    }
}

export type SAInUseError = SAErrorResponse & {
    error: {
        exceptionType: ExceptionType.InUseException,
        data: {
            entity: Entity,
            id: string,
            name: string,
        }
    }
}
