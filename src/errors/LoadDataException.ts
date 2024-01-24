import CustomException, { ExceptionType } from "./CustomException";

export default class LoadDataException extends CustomException {
    constructor(msg: string) {
        super(msg, ExceptionType.LoadDataException);
    }
}

export class NullValueException extends CustomException {
    data: {
        element?: "cadet" | "uniform" | "material" | "deficiencyType" | "other";
        id?: string;
        number?: number;
        type?: string;
    }
    constructor(msg: string, element?: "cadet" | "uniform" | "material" | "deficiencyType" | "other", data?: { id?: string, number?: number, type?: string }) {
        super(msg, ExceptionType.NullValueException);
        this.data = {
            element: element,
            id: data?.id,
            number: data?.number,
            type: data?.type,
        }
    }
}
