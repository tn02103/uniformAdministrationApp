import { z, ZodString } from "zod";

export const descriptionSchema = (z: ZodString) => z.regex(/^[\w \-_\xC0-\xFF]+$/, "string.descriptionPattern");
export const nameSchema = z.string().regex(/^[\w \xC0-\xFF]+$/, "string.noSpecialChars");

// ERROR MESSAGE KEYS
export const ZOD_ERROR = {
    STRING: {
        REQUIRED: "string.required",
        EMAIL: "string.emailValidation",
        MIN_LENGTH: (min: number) => `string.minLength;value:${min}`,
        MAX_LENGTH: (max: number) => `string.maxLength;value:${max}`,
    }
}
