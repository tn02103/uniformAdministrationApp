import { Cadet } from "../types/globalCadetTypes";
import CustomException, { ExceptionType } from "./CustomException";

export default class SaveDataException extends CustomException {
    constructor(msg: string) {
        super(msg, ExceptionType.SaveDataException);
    }
}

export type UniformIssuedExceptionData = {
    uniform: {
        id: string;
        number: number;
        typename: string;
    }
    owner: Cadet
}

export class UniformIssuedException extends CustomException {
    data: UniformIssuedExceptionData;
    constructor(uniformId: string, uniformNumber: number, typename: string, owner: Cadet) {
        super("Uniform already issued", ExceptionType.UniformIssuedException);
        this.data = {
            uniform: {
                id: uniformId,
                number: uniformNumber,
                typename: typename,
            },
            owner: owner,
        }
    }
}

export class UniformInactiveException extends CustomException {
    constructor() {
        super("Uniform is Inactive", ExceptionType.InactiveException);
    }
}
