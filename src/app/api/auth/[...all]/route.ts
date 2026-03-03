import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

/**
 * Better-auth catch-all API route.
 * Handles all /api/auth/* requests (sign-in, sign-out, session, etc.).
 */
export const { GET, POST } = toNextJsHandler(auth);
