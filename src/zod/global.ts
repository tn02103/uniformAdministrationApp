import { z, ZodString } from "zod";

export const descriptionSchema = (z: ZodString) => z.regex(/^[\w \-_\xC0-\xFF]+$/, "string.descriptionPattern");
export const nameSchema = z.string().regex(/^[\w \xC0-\xFF]+$/, "string.noSpecialChars");

