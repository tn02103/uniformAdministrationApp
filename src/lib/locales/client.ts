"use client";

import { createI18nClient } from "next-international/client";

export const { useI18n, useScopedI18n, I18nProviderClient, useCurrentLocale } = createI18nClient({
    de: () => import(`./../../../public/locales/de`),
    en: () => import(`./../../../public/locales/en`),
});
