import { ZodSchema, ZodError } from "zod";
import { customErrorMap } from "./customErrorMap";

/**
 * Transform a ZodError using the custom error map.
 * Since Zod v4 removed global error maps, we transform errors after parsing.
 */
export function transformZodErrors(error: ZodError): ZodError {
  const issues = error.issues.map(issue => {
    const errorMapResult = customErrorMap(issue as unknown as Record<string, unknown>, { defaultError: issue.message || 'Invalid input' });
    return {
      ...issue,
      message: (errorMapResult && typeof errorMapResult === 'object' && 'message' in errorMapResult)
        ? errorMapResult.message
        : issue.message,
    };
  });

  const transformedError = new ZodError(issues);
  return transformedError;
}

/**
 * Parse with custom error map applied.
 * In Zod v4, error maps are applied by transforming the error after parsing.
 */
export function parseWithCustomErrorMap<T>(
  schema: ZodSchema<T>,
  data: unknown
): T {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    throw transformZodErrors(result.error);
  }
  
  return result.data;
}

/**
 * Safe parse with custom error map applied.
 * Returns the parsed data or the error.
 */
export function safeParseWithCustomErrorMap<T>(
  schema: ZodSchema<T>,
  data: unknown
) {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    return { success: false, error: transformZodErrors(result.error) } as const;
  }
  
  return result;
}

