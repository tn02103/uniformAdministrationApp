import '@testing-library/jest-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

jest.mock('@/lib/locales/client', () => {
    return {
        useScopedI18n: jest.fn((scope: string) => {
            return function (key: string, values?: any) {
                return `${scope}.${key}`;
            };
        }),
        useI18n: jest.fn().mockImplementation(() => jest.fn((key) => key)),
        useCurrentLocale: jest.fn(() => ({
            locale: 'de',
            setLocale: jest.fn(),
        })),
    };
});
jest.mock("@/components/errorMessage", () => {
    return function ErrorMessage({ error, ariaLabel, testId, ...divProps }: { error: string, testId: string, ariaLabel: string }) {
        return <div className="text-danger fs-7" role="alert" aria-label={ariaLabel} data-testid={testId} {...divProps}>{error}</div>;
    };
});
jest.mock("@/components/modals/modalProvider", () => {
    const dangerModal = jest.fn();
    return {
        useModal: jest.fn(() => ({
            dangerConfirmationModal: dangerModal,
        })),
    };
});

Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(), // deprecated
        removeListener: jest.fn(), // deprecated
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
});