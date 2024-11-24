import { z } from "zod";

export const descriptionSchema = z.string().regex(/^[\w \-_\xC0-\xFF]+$/, "string.descriptionPattern");