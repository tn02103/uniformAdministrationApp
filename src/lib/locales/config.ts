import { createI18nServer } from 'next-international/server';

export const locales = ["en", "de"];

export const { getI18n, getScopedI18n, getStaticParams } = createI18nServer({
    de: () => import(`./../../../public/locales/de`),
    en: () => import(`./../../../public/locales/en`),
});
