// Stub for @/lib/locales/config used in DAL unit tests.
// Returns a fixed "de" locale so server-only / next-international
// are never imported in the test environment.

export const locales = ["en", "de"] as const;
export const getCurrentLocale = async () => "de" as const;
export const getScopedI18n = async (_scope: string) => (key: string) => key;
export const getI18n = async () => (key: string) => key;
export const getStaticParams = async () => [];
