export default class CustomException extends Error {
    exceptionType: ExceptionType;
    data?: unknown;
    constructor(msg: string, excpetionType: ExceptionType) {
        super(msg);
        this.exceptionType = excpetionType;
    }
}

export enum ExceptionType {
    LoadDataException,
    SaveDataException,
    NullValueException,
    UniformIssuedException,
    UnauthorizedException,
    UnauthenticatedException,
    InactiveException,
    InUseException,
}

export class UnauthorizedException extends CustomException {
    constructor(msg: string) {
        super(msg, ExceptionType.UnauthorizedException);
    }
}

export class UnauthenticatedException extends CustomException {
    constructor() {
        super('User not logged in', ExceptionType.UnauthenticatedException);
    }
}
