
import { ZodIssueCode } from "zod";

// Define our own error map function type since we're not using the global ZodErrorMap
export const customErrorMap = (issue: Record<string, unknown>, _ctx: Record<string, unknown>) => {
    // Map v4 error codes to our custom messages
    let message: string;

    switch (issue.code) {
        case ZodIssueCode.invalid_type:
            if (issue.received === "undefined" || issue.received === "null") {
                message = "string.required";
            } else if (issue.expected === "date") {
                message = "date.invalid";
            } else {
                message = `Expected ${issue.expected}, received ${issue.received}`;
            }
            break;

        case ZodIssueCode.too_small:
            if (issue.type === "string") {
                if (issue.minimum === 1) {
                    message = "string.required";
                } else if (issue.inclusive) {
                    message = `string.minLength;value:${issue.minimum}`;
                } else {
                    message = `String must contain more than ${issue.minimum} character(s)`;
                }
            } else if (issue.type === "array") {
                message = `Array must contain at least ${issue.minimum} element(s)`;
            } else if (issue.type === "number") {
                message = `Number must be greater than or equal to ${issue.minimum}`;
            } else {
                message = "Invalid input";
            }
            break;

        case ZodIssueCode.too_big:
            if (issue.type === "string") {
                if (issue.inclusive) {
                    message = `string.maxLength;value:${issue.maximum}`;
                } else {
                    message = `String must contain less than ${issue.maximum} character(s)`;
                }
            } else if (issue.type === "array") {
                message = `Array must contain at most ${issue.maximum} element(s)`;
            } else if (issue.type === "number") {
                message = `Number must be less than or equal to ${issue.maximum}`;
            } else {
                message = "Invalid input";
            }
            break;

        case ZodIssueCode.invalid_format:
            if (issue.expected === "uuid") {
                message = "Invalid UUID format";
            } else if (issue.expected === "email") {
                message = "Invalid email format";
            } else if (issue.expected === "date") {
                message = "date.invalid";
            } else {
                message = `Invalid ${issue.expected} format`;
            }
            break;

        case ZodIssueCode.invalid_value:
            message = "Invalid enum value";
            break;

        case ZodIssueCode.invalid_key:
            message = "Invalid key";
            break;

        case ZodIssueCode.invalid_element:
            message = "Invalid element";
            break;

        case ZodIssueCode.invalid_union:
            message = "Invalid input";
            break;

        case ZodIssueCode.unrecognized_keys:
            message = `Unrecognized key(s) in object: ${(issue.keys as string[]).join(", ")}`;
            break;

        case ZodIssueCode.not_multiple_of:
            message = `Number must be a multiple of ${(issue as Record<string, unknown>).multipleOf}`;
            break;

        case ZodIssueCode.custom:
            message = (issue as Record<string, unknown>).message as string || "Invalid input";
            break;

        default:
            message = (_ctx.defaultError as string) || "Invalid input";
    }

    return { message };
};
