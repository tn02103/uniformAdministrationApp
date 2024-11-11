import german from '@/../public/locales/de';

jest.mock('@/lib/locales/client', () => {

    // function to get nested Value from object
    function getNestedValue(obj: Record<string, any>, key: string): any {
        const keys = key.split('.');
        let value = obj;
        for (const k of keys) {
            value = value[k];
            if (value === undefined) break;
        }
        return value;
    }
    // function to get Translation
    function getTranslation(key: string, values: any) {
        let text = getNestedValue(german, key);
        if (!text) return key;
        if (typeof text !== "string") return key;

        if (values) {
            for (const [key, value] of Object.entries(values)) {
                text = text.replaceAll(`{${key}}`, value);
            }
        }
        return text;
    }

    return ({
        useScopedI18n: (scope: string) => {
            return function (key: string, values?: any) {
                return getTranslation(`${scope}.${key}`, values);
            }
        },
        useI18n: () => {
            return getTranslation;
        }
    })
});
